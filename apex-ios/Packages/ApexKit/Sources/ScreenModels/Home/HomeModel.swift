import Foundation
import Observation

/// Home's model.
@Observable public final class HomeModel {
    private let lastEnded: EndedProgram?
    private let calendar: Calendar

    public init(lastEnded: EndedProgram?, calendar: Calendar) {
        self.lastEnded = lastEnded
        self.calendar = calendar
    }

    /// The line above the "No Active Program" card: the program that last ended and its day, in the calendar's time
    /// zone. Nil when no program has ever ended.
    public var noProgramEyebrow: String? {
        guard let lastEnded else { return nil }
        let day = Date.FormatStyle(locale: Locale(identifier: "en_US"), calendar: calendar, timeZone: calendar.timeZone)
            .month(.abbreviated).day()
        return "\(lastEnded.name) ended \(lastEnded.endedOn.formatted(day))"
    }
}
