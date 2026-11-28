import ScreenModels
import SwiftUI

/// The app's root: the system tab bar over one screen per tab.
public struct RootScreen: View {
    @Bindable private var model: AppModel

    public init(model: AppModel) {
        self.model = model
    }

    public var body: some View {
        TabView(selection: $model.selectedTab) {
            ForEach(AppTab.allCases, id: \.self) { tab in
                Tab(tab.title, systemImage: tab.symbol, value: tab) {
                    screen(for: tab)
                }
            }
        }
        .tint(Tokens.Color.accent)
        #if DEBUG
            .labSheet(model.lab)
        #endif
    }

    @ViewBuilder private func screen(for tab: AppTab) -> some View {
        switch tab {
        case .home: HomeScreen(model: model.home, programs: model.programs)
        // Not built yet: the bare field.
        case .workout, .progress, .run: ScreenField()
        }
    }
}

extension AppTab {
    /// Design: APEX README, Liquid Glass, "Tab bar": a filled symbol over the title.
    fileprivate var symbol: String {
        switch self {
        case .home: "house.fill"
        case .workout: "dumbbell.fill"
        case .progress: "chart.line.uptrend.xyaxis"
        case .run: "figure.run"
        }
    }
}
