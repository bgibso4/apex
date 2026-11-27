#if DEBUG
    import ScreenModels
    import SwiftUI

    /// The device lab: one card per exhibit, and the way to each. Not a designed screen: it has no mock and no
    /// picture. It is built from the tokens and the design system like any other.
    struct LabScreen: View {
        @Bindable var model: LabModel

        var body: some View {
            NavigationStack(path: $model.path) {
                ScrollView {
                    VStack(spacing: Tokens.Spacing.cardGap) {
                        ForEach(LabExhibit.allCases, id: \.self) { exhibit in
                            NavigationLink(value: exhibit) { tile(for: exhibit) }
                                .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, Tokens.Spacing.screenPadding)
                    .padding(.top, Tokens.Spacing.contentTop)
                }
                .background { ScreenField() }
                .navigationTitle("Device Lab")
                .navigationBarTitleDisplayMode(.inline)
                .navigationDestination(for: LabExhibit.self) { exhibit in
                    switch exhibit {
                    case .motion: MotionExhibit()
                    }
                }
            }
        }

        private func tile(for exhibit: LabExhibit) -> some View {
            Card {
                VStack(alignment: .leading, spacing: Tokens.Spacing.sectionLabelGap) {
                    Text(exhibit.title)
                        .font(Tokens.Typography.cardName)
                        .foregroundStyle(Tokens.Color.text)
                    Text(exhibit.summary)
                        .font(Tokens.Typography.value)
                        .foregroundStyle(Tokens.Color.textSecondary)
                }
            }
        }
    }
#endif
