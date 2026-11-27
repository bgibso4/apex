import SwiftUI

/// Home's card when no program is active: what ended, one line, and the two ways on.
/// Design: home-decisions turns 13d and 20b. The gaps are the demo's `Ended` card (design/export/app/home.dc.html).
struct NoProgramCard: View {
    /// The program that last ended and its day. Nil when no program has ever ended.
    let eyebrow: String?

    private enum Gap {
        static let eyebrowToTitle: CGFloat = 6
        static let titleToLine: CGFloat = 4
        static let lineToPrimary: CGFloat = 16
        static let primaryToSecondary: CGFloat = 6
        /// The secondary's tap row reaches this far into the card's bottom padding.
        static let secondaryIntoPadding: CGFloat = 8
    }

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 0) {
                if let eyebrow {
                    Eyebrow(text: eyebrow)
                        .padding(.bottom, Gap.eyebrowToTitle)
                }
                Text("No Active Program")
                    .font(Tokens.Typography.cardTitle)
                    .tracking(Tokens.Typography.cardTitleTracking)
                    .foregroundStyle(Tokens.Color.text)
                Text("Pick one to get started on your goal.")
                    .font(Tokens.Typography.value)
                    .foregroundStyle(Tokens.Color.textSecondary)
                    .padding(.top, Gap.titleToLine)
                Button("Choose a program") {
                    // Opens Programs: wired when the Programs screen exists.
                }
                .buttonStyle(.primary)
                .padding(.top, Gap.lineToPrimary)
                Button("Log a workout without a program") {
                    // Not designed yet (the demo says "to design"): wired when it is.
                }
                .buttonStyle(.secondary)
                .padding(.top, Gap.primaryToSecondary)
                .padding(.bottom, -Gap.secondaryIntoPadding)
            }
        }
    }
}
