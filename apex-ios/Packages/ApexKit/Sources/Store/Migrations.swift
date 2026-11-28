import GRDB

/// The schema, as the changes that made it: one migration per change, named `v1`, `v2`, … and run once each, in
/// order. A migration that has merged is never edited: a database on the phone has already run it. The schema they
/// add up to is `Tests/StoreTests/schema.sql`, which `MigrationTests` compares; `AGENTS.md`, "The store", says
/// how to add one.
package enum Migrations {
    package static let migrator: DatabaseMigrator = {
        var migrator = DatabaseMigrator()
        migrator.registerMigration("v1") { database in
            // A run of a built-in program: its id, and the day the run's first week began.
            try database.execute(
                sql: """
                    CREATE TABLE program_run (
                        id INTEGER PRIMARY KEY,
                        program_id TEXT NOT NULL CHECK (program_id <> ''),
                        started_on TEXT NOT NULL CHECK (started_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
                    ) STRICT
                    """
            )
        }
        return migrator
    }()
}
