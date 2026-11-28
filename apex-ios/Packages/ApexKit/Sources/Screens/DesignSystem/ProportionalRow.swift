import Core
import SwiftUI

/// A row whose children share its width by weight (`layoutWeight`), none narrower than it would be on its own.
/// The sharing is `Proportion.shares`. Nonisolated, as `Layout` asks: this module is main-actor by default.
nonisolated struct ProportionalRow: Layout {
    let spacing: CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let minimums = minimums(of: subviews)
        let width = proposal.width ?? minimums.reduce(0, +) + gaps(between: subviews)
        let heights = zip(subviews, widths(in: width, minimums: minimums, of: subviews)).map { subview, width in
            subview.sizeThatFits(ProposedViewSize(width: width, height: nil)).height
        }
        return CGSize(width: width, height: heights.max() ?? 0)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var leading = bounds.minX
        let widths = widths(in: bounds.width, minimums: minimums(of: subviews), of: subviews)
        for (subview, width) in zip(subviews, widths) {
            subview.place(
                at: CGPoint(x: leading, y: bounds.minY),
                anchor: .topLeading,
                proposal: ProposedViewSize(width: width, height: bounds.height)
            )
            leading += width + spacing
        }
    }

    /// Each child's width when nothing holds it in.
    private func minimums(of subviews: Subviews) -> [Double] {
        subviews.map { Double($0.sizeThatFits(.unspecified).width) }
    }

    private func gaps(between subviews: Subviews) -> Double {
        spacing * Double(max(subviews.count - 1, 0))
    }

    private func widths(in width: Double, minimums: [Double], of subviews: Subviews) -> [Double] {
        Proportion.shares(
            of: width - gaps(between: subviews), weights: subviews.map { $0[LayoutWeight.self] }, minimums: minimums)
    }
}

private nonisolated struct LayoutWeight: LayoutValueKey {
    static let defaultValue: Double = 1
}

extension View {
    /// The view's share of a `ProportionalRow`, against its siblings' weights.
    func layoutWeight(_ weight: Double) -> some View {
        layoutValue(key: LayoutWeight.self, value: weight)
    }
}
