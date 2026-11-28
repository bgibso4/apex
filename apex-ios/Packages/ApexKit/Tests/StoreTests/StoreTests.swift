import Core
import GRDB
import Store
import Testing
import Training

struct StoreTests {
    @Test func aNewStoreHasNoRun() throws {
        #expect(try Store(.inMemory).currentRun() == nil)
    }

    @Test func aStartedRunIsTheCurrentOne() throws {
        let store = try Store(.inMemory)

        try store.startRun(of: "functional-athlete-pillars", on: try day("2026-08-03"))

        let run = ProgramRun(programID: "functional-athlete-pillars", startedOn: try day("2026-08-03"))
        #expect(try store.currentRun() == run)
    }

    @Test func theNewestRunIsTheCurrentOne() throws {
        let store = try Store(.inMemory)

        try store.startRun(of: "functional-athlete", on: try day("2026-02-23"))
        try store.startRun(of: "pillars-hypertrophy", on: try day("2026-11-08"))

        #expect(try store.currentRun()?.programID == "pillars-hypertrophy")
    }

    @Test func aRunSurvivesClosingTheFile() throws {
        let folder = TemporaryFolder()
        defer { folder.remove() }

        try Store(.file(folder.database)).startRun(of: "pillars-hypertrophy", on: try day("2026-11-08"))

        let run = ProgramRun(programID: "pillars-hypertrophy", startedOn: try day("2026-11-08"))
        #expect(try Store(.file(folder.database)).currentRun() == run)
    }

    /// The table's check is on the shape. A day with that shape that no calendar has gets past it.
    @Test func aDayThatIsNotADayIsReported() throws {
        let folder = TemporaryFolder()
        defer { folder.remove() }
        _ = try Store(.file(folder.database))
        try DatabaseQueue(path: folder.database.path).write { database in
            try database.execute(
                sql: "INSERT INTO program_run (program_id, started_on) VALUES ('pillars', '2026-13-45')")
        }
        let store = try Store(.file(folder.database))

        #expect(throws: StoreError.notADay("2026-13-45")) { try store.currentRun() }
    }

    private func day(_ iso: String) throws -> Day {
        try #require(Day(iso: iso))
    }
}
