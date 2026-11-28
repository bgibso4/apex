import Core
import GRDB
import Training

/// A row of `program_run`, and the one place a row becomes a `ProgramRun` and back.
struct ProgramRunRow: Codable, FetchableRecord, PersistableRecord {
    enum CodingKeys: String, CodingKey {
        case programID = "program_id"
        case startedOn = "started_on"
    }

    static let databaseTableName = "program_run"

    // The row's id is the database's to give: nothing reads it yet, so the row does not carry it.
    var programID: String
    /// A day as text, `2026-08-03`.
    var startedOn: String

    init(_ run: ProgramRun) {
        programID = run.programID
        startedOn = run.startedOn.iso
    }

    func run() throws -> ProgramRun {
        guard let day = Day(iso: startedOn) else { throw StoreError.notADay(startedOn) }
        return ProgramRun(programID: programID, startedOn: day)
    }
}
