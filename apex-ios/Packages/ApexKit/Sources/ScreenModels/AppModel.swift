import Observation

/// The app's state: the selected tab and one model per screen.
@Observable public final class AppModel {
    public var selectedTab: AppTab
    public let home: HomeModel

    public init(selectedTab: AppTab = .home, home: HomeModel) {
        self.selectedTab = selectedTab
        self.home = home
    }
}
