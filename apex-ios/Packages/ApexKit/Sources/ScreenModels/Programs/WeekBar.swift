/// One week of a program, as a bar in its block.
public nonisolated struct WeekBar: Equatable, Sendable {
    public enum Fill: Sendable {
        /// A week of the active program: behind it, the one it is in, or ahead.
        case done, current, upcoming
        /// A week of a program that is not active: no progress to show.
        case plain
    }

    /// A deload week is drawn at half height.
    public let isDeload: Bool
    public let fill: Fill
}
