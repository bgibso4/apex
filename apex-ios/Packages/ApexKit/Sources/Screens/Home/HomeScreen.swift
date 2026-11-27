import ScreenModels
import SwiftUI
import TestSupport

/// The Home tab. Design: home-decisions (the Locked table; turn 37c for the header).
struct HomeScreen: View {
    let model: HomeModel

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Tokens.Spacing.cardGap) {
                    Wordmark()
                        #if DEBUG
                            .opensLab()
                        #endif
                    NoProgramCard(eyebrow: model.noProgramEyebrow)
                }
                .padding(.horizontal, Tokens.Spacing.screenPadding)
            }
            .background { ScreenField() }
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
