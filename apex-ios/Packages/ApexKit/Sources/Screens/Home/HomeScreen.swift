import ScreenModels
import SwiftUI
import TestSupport

/// The Home tab. Design: home-decisions (the Locked table; turn 37c for the header).
struct HomeScreen: View {
    @Bindable var model: HomeModel
    let programs: ProgramsModel

    var body: some View {
        NavigationStack(path: $model.path) {
            ScrollView {
                VStack(alignment: .leading, spacing: Tokens.Spacing.cardGap) {
                    Wordmark()
                        #if DEBUG
                            .opensLab()
                        #endif
                    NoProgramCard(eyebrow: model.noProgramEyebrow, chooseProgram: model.chooseProgram)
                }
                .padding(.horizontal, Tokens.Spacing.screenPadding)
            }
            .background { ScreenField() }
            .navigationDestination(for: HomeDestination.self) { destination in
                switch destination {
                case .programs: ProgramsScreen(model: programs)
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Settings", systemImage: "gearshape") {
                        // Opens Settings: wired when Settings is designed.
                    }
                    .tint(Tokens.Color.text)
                }
            }
        }
    }
}

#Preview("home.noProgram") {
    RootScreen(model: DesignedState.homeNoProgram.appModel())
}
