import Core
import Foundation
import ScreenModels

/// The Swift side of the state catalog: every state Ben designed, by the name `design/states.json` gives it.
/// One case drives the state's picture test, its preview and `make run STATE=`.
public enum DesignedState: String, CaseIterable, Sendable {
    case homeNoProgram = "home.noProgram"

    /// The screen the state belongs to: the part of its name before the dot.
    public var screen: String { String(rawValue.prefix { $0 != "." }) }

    /// What to say when a state is asked for by a name that is not one.
    public static func unknownMessage(for name: String) -> String {
        "Unknown state \(name). Known states: \(allCases.map(\.rawValue).joined(separator: ", "))"
    }

    /// The app as the state's mock shows it.
    @MainActor public func appModel() -> AppModel {
        switch self {
        case .homeNoProgram:
            AppModel(
                home: HomeModel(lastEnded: .pillars, calendar: .gmt),
                programs: .samples(today: .mockToday)
            )
        }
    }
}

extension EndedProgram {
    /// The demo's `Ended` state: "Pillars ended Aug 20". Noon on 2026-08-20 GMT.
    fileprivate static let pillars = EndedProgram(name: "Pillars", endedOn: Date(timeIntervalSince1970: 1_787_227_200))
}

extension Day {
    /// The day the mocks are drawn on: Thursday 2026-08-20.
    fileprivate static let mockToday = Day.fixture("2026-08-20")
}

extension Calendar {
    /// Fixed, so a state's dates read the same on every machine.
    fileprivate static let gmt: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = .gmt
        return calendar
    }()
}
