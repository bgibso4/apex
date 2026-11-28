import SwiftUI

/// A small accent pill beside a label: where something stands now ("Week 3 of 11").
/// Design: APEX README, Programs (the active program "carries a 'Week 3 of 11' tag"); tints are 10% of the hue
/// (Color). The height and padding are the Library demo's (design/export/app/library.dc.html).
struct Tag: View {
    let text: String

    private enum Metric {
        static let height: CGFloat = 20
        static let sidePadding: CGFloat = 8
    }

    var body: some View {
        Text(text)
            .font(Tokens.Typography.eyebrow)
            .foregroundStyle(Tokens.Color.accent)
            .lineLimit(1)
            .padding(.horizontal, Metric.sidePadding)
            .frame(height: Metric.height)
            .background(Tokens.Color.accentTint, in: Capsule())
            .fixedSize()
    }
}
