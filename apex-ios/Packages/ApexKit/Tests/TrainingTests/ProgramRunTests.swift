import Core
import Testing
import Training

struct ProgramRunTests {
    /// Eleven weeks from Monday 2026-08-03: the last day is Sunday 2026-10-18.
    private let program = Program(
        id: "eleven",
        name: "Eleven",
        goal: "Strength",
        level: "Intermediate",
        line: "Eleven weeks.",
        blocks: [.init("Only", weeks: 11)],
        daysAWeek: 5
    )

    @Test(arguments: [
        ("2026-08-03", 1), ("2026-08-09", 1), ("2026-08-10", 2), ("2026-08-20", 3), ("2026-10-18", 11),
    ])
    func aDayInsideTheRunHasItsWeek(iso: String, week: Int) throws {
        let found = try run().week(on: try day(iso), of: program)

        #expect(found == week)
    }

    @Test(arguments: ["2026-08-02", "2026-10-19", "2025-01-01", "2030-01-01"])
    func aDayOutsideTheRunHasNoWeek(iso: String) throws {
        let found = try run().week(on: try day(iso), of: program)

        #expect(found == nil)
    }

    private func run() throws -> ProgramRun {
        ProgramRun(programID: program.id, startedOn: try day("2026-08-03"))
    }

    private func day(_ iso: String) throws -> Day {
        try #require(Day(iso: iso))
    }
}
