import Core
import Training

/// A program as its card in Programs shows it. Design: APEX README, "Lists, search, filters" › Programs.
public nonisolated struct ProgramCard: Equatable, Identifiable, Sendable {
    public struct Block: Equatable, Sendable {
        public let name: String
        public let bars: [WeekBar]
    }

    public let id: Program.ID
    /// Goal and level: "Strength · Intermediate".
    public let eyebrow: String
    public let name: String
    public let line: String
    /// "Week 3 of 11", on the active program while one of its weeks is running.
    public let tag: String?
    public let blocks: [Block]
    public let stats: [Stat]

    /// The card of `program`. With `run`, a run of it, the card shows how far that run is on `today`.
    init(_ program: Program, run: ProgramRun? = nil, today: Day) {
        let week = run?.week(on: today, of: program)
        id = program.id
        eyebrow = "\(program.goal) · \(program.level)"
        name = program.name
        line = program.line
        tag = week.map { "Week \($0) of \(program.weekCount)" }
        stats = [
            Stat(value: String(program.weekCount), label: "Weeks"),
            Stat(value: String(program.daysAWeek), label: "Days a week"),
        ]

        // Outside the run's weeks nothing is current: before its first day no week is done, after its last all are.
        let weeksDone = run.map { run in week.map { $0 - 1 } ?? (today < run.startedOn ? 0 : program.weekCount) }
        var number = 0
        blocks = program.blocks.map { block in
            Block(
                name: block.name,
                bars: block.weeks.map { blockWeek in
                    number += 1
                    return WeekBar(
                        isDeload: blockWeek.isDeload, fill: Self.fill(ofWeek: number, done: weeksDone, current: week))
                }
            )
        }
    }

    private static func fill(ofWeek number: Int, done: Int?, current: Int?) -> WeekBar.Fill {
        guard let done else { return .plain }
        if number == current { return .current }
        return number <= done ? .done : .upcoming
    }
}
