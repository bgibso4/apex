/// A training program as it is defined: what the Library shows of it. A program is built into the app.
public struct Program: Identifiable, Equatable, Sendable {
    public struct Week: Equatable, Sendable {
        /// A deload is a week inside a block, never a block of its own.
        public let isDeload: Bool
    }

    public struct Block: Equatable, Sendable {
        public let name: String
        public let weeks: [Week]

        /// A block of `weeks` weeks. With `deloadLast`, its last week is a deload.
        public init(_ name: String, weeks: Int, deloadLast: Bool = false) {
            self.name = name
            self.weeks = (1...weeks).map { Week(isDeload: deloadLast && $0 == weeks) }
        }
    }

    /// Kept in the database with every run of the program: it never changes once a build has shipped it.
    public let id: String
    public let name: String
    /// Goal and level are open lists (Library turn 3), so they are text.
    public let goal: String
    public let level: String
    /// The one-line description.
    public let line: String
    public let blocks: [Block]
    public let daysAWeek: Int

    public var weekCount: Int { blocks.reduce(0) { $0 + $1.weeks.count } }

    public init(
        id: String, name: String, goal: String, level: String, line: String, blocks: [Block], daysAWeek: Int
    ) {
        self.id = id
        self.name = name
        self.goal = goal
        self.level = level
        self.line = line
        self.blocks = blocks
        self.daysAWeek = daysAWeek
    }
}
