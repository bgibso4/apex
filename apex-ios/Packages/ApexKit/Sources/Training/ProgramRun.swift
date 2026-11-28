import Core

/// One go at a program: which program, and the day its first week began.
public struct ProgramRun: Equatable, Sendable {
    private static let daysInAWeek = 7

    public let programID: Program.ID
    public let startedOn: Day

    public init(programID: Program.ID, startedOn: Day) {
        self.programID = programID
        self.startedOn = startedOn
    }

    /// The week of `program` that `day` falls in: 1 for the run's first seven days, and so on.
    /// Nil before the run's first day and after its last week.
    public func week(on day: Day, of program: Program) -> Int? {
        let daysIn = day.days(since: startedOn)
        guard daysIn >= 0 else { return nil }
        let week = daysIn / Self.daysInAWeek + 1
        return week <= program.weekCount ? week : nil
    }
}
