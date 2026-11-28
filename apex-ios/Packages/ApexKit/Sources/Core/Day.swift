import Foundation

/// A day on the calendar, with no time and no time zone: what a schedule is written in.
/// An instant read in another time zone lands on another day; a `Day` does not move.
public struct Day: Hashable, Comparable, Sendable {
    /// The day's own midnight in GMT, where no clock change shortens or stretches a day.
    private let midnight: Date

    private static let gmt: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = .gmt
        return calendar
    }()

    private static let isoStyle = Date.ISO8601FormatStyle(timeZone: .gmt).year().month().day()

    /// The day it is at `date` for someone in `timeZone`.
    public init(_ date: Date, in timeZone: TimeZone) {
        var local = Self.gmt
        local.timeZone = timeZone
        // The local day's start, moved by the zone's offset, is that same day in GMT. Where a zone's clocks skip
        // midnight the start is not 00:00, so the result is brought back to the GMT day's own midnight.
        let start = local.startOfDay(for: date)
        midnight = Self.gmt.startOfDay(for: start.addingTimeInterval(TimeInterval(timeZone.secondsFromGMT(for: start))))
    }

    /// A day written as `2026-08-03`. Nil for anything else, and for a day no calendar has (`2026-02-30`).
    public init?(iso: String) {
        // try? because a text that does not parse is simply not a day. The comparison rejects what the parser
        // reads more loosely than it writes.
        guard let date = try? Date(iso, strategy: Self.isoStyle), date.formatted(Self.isoStyle) == iso else {
            return nil
        }
        midnight = date
    }

    public var iso: String { midnight.formatted(Self.isoStyle) }

    /// How many days after `other` this day is. Negative when it is earlier.
    public func days(since other: Self) -> Int {
        // Both are GMT midnights, so the calendar always has a whole number of days to give.
        Self.gmt.dateComponents([.day], from: other.midnight, to: midnight).day ?? 0
    }

    public static func < (earlier: Self, later: Self) -> Bool { earlier.midnight < later.midnight }
}
