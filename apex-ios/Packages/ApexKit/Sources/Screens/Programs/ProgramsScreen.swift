import ScreenModels
import SwiftUI
import TestSupport

/// Programs (the Library): the built-in programs as cards, the active one alone under "Active".
/// Design: APEX README, "Lists, search, filters" › Programs; overview-decisions, Library turns 1 to 4.
struct ProgramsScreen: View {
    let model: ProgramsModel

    /// A label sits this far in from its cards' edge (design/export/app/library.dc.html).
    private static let labelInset: CGFloat = 2

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Spacing.sectionGap) {
                ForEach(model.sections) { section in
                    VStack(alignment: .leading, spacing: Tokens.Spacing.sectionLabelGap) {
                        if let label = section.label {
                            Eyebrow(text: label)
                                .padding(.horizontal, Self.labelInset)
                        }
                        VStack(spacing: Tokens.Spacing.cardGap) {
                            ForEach(section.cards) { card in
                                ProgramCardView(card: card)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, Tokens.Spacing.screenPadding)
            .padding(.top, Tokens.Spacing.contentTop)
        }
        .background { ScreenField() }
        .navigationTitle("Programs")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { model.refresh() }
    }
}

#Preview("programs.active") {
    RootScreen(model: DesignedState.programsActive.appModel())
}
