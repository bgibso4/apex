#if DEBUG
    import ScreenModels
    import SwiftUI

    /// The lab's Motion exhibit. On trial: the snappy spring's bounce (issue 93), on the two moments the design
    /// gives that timing to: ticking a set, and a row let go after a drag. Everything else is the tokens' own.
    struct MotionExhibit: View {
        @State private var bounce = LabTrial.snappyBounce(token: Tokens.Motion.snappyBounce)
        @State private var ticked: Set<Int> = []

        /// The sample rows: enough to tick a few in a row, as in a workout.
        private static let sets = 1...3

        var body: some View {
            VStack(alignment: .leading, spacing: Tokens.Spacing.sectionLabelGap) {
                Eyebrow(text: "Snappy spring")
                Card {
                    VStack(spacing: 0) {
                        ForEach(Self.sets, id: \.self) { set in
                            SnapBackRow(bounce: bounce.tried) { row(for: set) }
                        }
                    }
                }
                Eyebrow(text: "Bounce")
                    .padding(.top, Tokens.Spacing.sectionGap)
                Picker("Bounce", selection: $bounce.tried) {
                    ForEach(bounce.options, id: \.self) { option in
                        Text(option.formatted()).tag(option)
                    }
                }
                .pickerStyle(.segmented)
                Text("Tick a set, or drag a row left and let go. The token is \(bounce.token.formatted()).")
                    .font(Tokens.Typography.helper)
                    .foregroundStyle(Tokens.Color.textSecondary)
            }
            .padding(.horizontal, Tokens.Spacing.screenPadding)
            .padding(.top, Tokens.Spacing.contentTop)
            .frame(maxHeight: .infinity, alignment: .top)
            .background { ScreenField() }
            .navigationTitle(LabExhibit.motion.title)
        }

        private func row(for set: Int) -> some View {
            HStack {
                Text("Set \(set)")
                    .font(Tokens.Typography.cardName)
                    .foregroundStyle(Tokens.Color.text)
                Spacer()
                SetTick(isTicked: ticked.contains(set), bounce: bounce.tried) {
                    ticked.formSymmetricDifference([set])
                }
            }
        }
    }
#endif
