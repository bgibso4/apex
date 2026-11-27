/// The app's four tabs, in tab bar order.
public nonisolated enum AppTab: String, CaseIterable, Sendable {
    case home, workout, progress, run

    public var title: String {
        switch self {
        case .home: "Home"
        case .workout: "Workout"
        case .progress: "Progress"
        case .run: "Run"
        }
    }
}
