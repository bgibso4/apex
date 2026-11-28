import Core
import Foundation
import GRDB
import Training

/// The app's database: SQLite, on the phone, the source of truth. The only module that knows SQL or GRDB.
/// Reads and writes are synchronous: each is a query of a row or two on one connection.
public struct Store: Sendable {
    public enum Location: Sendable {
        /// A database that lives as long as the store: for tests, previews and designed states.
        case inMemory
        case file(URL)
    }

    private let queue: DatabaseQueue

    /// Opens the database, making its folder if needed, and brings it to the newest schema.
    /// Throws `StoreError.newerSchema` for a database a newer build has migrated, and changes nothing in it.
    public init(_ location: Location) throws {
        switch location {
        case .inMemory:
            queue = try DatabaseQueue()
        case .file(let url):
            try FileManager.default.createDirectory(
                at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            queue = try DatabaseQueue(path: url.path)
        }
        guard try !queue.read(Migrations.migrator.hasBeenSuperseded) else { throw StoreError.newerSchema }
        try Migrations.migrator.migrate(queue)
    }

    /// The run the app is on: the newest one. Nil when no program has been started.
    public func currentRun() throws -> ProgramRun? {
        try queue.read { database in try ProgramRunRow.order(Column("id").desc).fetchOne(database) }?.run()
    }

    public func startRun(of programID: Program.ID, on day: Day) throws {
        try queue.write { database in
            try ProgramRunRow(ProgramRun(programID: programID, startedOn: day)).insert(database)
        }
    }
}
