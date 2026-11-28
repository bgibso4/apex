import Foundation
import GRDB
import Store
import Testing

/// How the schema is held still: `schema.sql` is the schema after every migration, and a migration that has
/// merged never changes. Each migration after `v1` adds a test here that builds the schema before it
/// (`migrate(_:upTo:)`), adds rows, migrates, and checks the rows.
struct MigrationTests {
    @Test func theSchemaIsTheCommittedOne() throws {
        let queue = try DatabaseQueue()
        try Migrations.migrator.migrate(queue)

        let statements = try queue.read { database in
            try String.fetchAll(
                database,
                sql: """
                    SELECT sql FROM sqlite_master
                    WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'grdb_%'
                    ORDER BY name
                    """
            )
        }

        let committed = try String(
            contentsOf: URL(filePath: #filePath).deletingLastPathComponent().appending(path: "schema.sql"),
            encoding: .utf8
        )
        #expect(statements.map { $0 + ";\n" }.joined(separator: "\n") == committed)
    }

    @Test(arguments: ["", "Aug 3", "2026-8-3", "2026-08-03 "])
    func theTableRefusesABadDay(text: String) throws {
        let queue = try migrated()

        #expect(throws: DatabaseError.self) {
            try queue.write { database in
                try database.execute(
                    sql: "INSERT INTO program_run (program_id, started_on) VALUES ('pillars', ?)", arguments: [text])
            }
        }
    }

    @Test func theTableRefusesAnEmptyProgram() throws {
        let queue = try migrated()

        #expect(throws: DatabaseError.self) {
            try queue.write { database in
                try database.execute(sql: "INSERT INTO program_run (program_id, started_on) VALUES ('', '2026-08-03')")
            }
        }
    }

    @Test func aDatabaseFromANewerBuildIsRefusedAndLeftAlone() throws {
        let folder = TemporaryFolder()
        defer { folder.remove() }
        _ = try Store(.file(folder.database))
        var newer = Migrations.migrator
        newer.registerMigration("v999") { database in
            try database.execute(sql: "CREATE TABLE later (id INTEGER PRIMARY KEY) STRICT")
        }
        try newer.migrate(try DatabaseQueue(path: folder.database.path))

        #expect(throws: StoreError.newerSchema) { try Store(.file(folder.database)) }

        let applied = try DatabaseQueue(path: folder.database.path).read { database in
            try String.fetchAll(database, sql: "SELECT identifier FROM grdb_migrations ORDER BY identifier")
        }
        #expect(applied == ["v1", "v999"])
    }

    private func migrated() throws -> DatabaseQueue {
        let queue = try DatabaseQueue()
        try Migrations.migrator.migrate(queue)
        return queue
    }
}
