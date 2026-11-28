import Observation

/// The app's state: the selected tab and one model per screen.
@Observable public final class AppModel {
    public var selectedTab: AppTab
    public let home: HomeModel
    public let programs: ProgramsModel
    #if DEBUG
        /// The device lab. Debug builds only.
        public let lab = LabModel()
    #endif

    public init(selectedTab: AppTab = .home, home: HomeModel, programs: ProgramsModel) {
        self.selectedTab = selectedTab
        self.home = home
        self.programs = programs
    }
}
