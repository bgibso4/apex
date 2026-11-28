import ScreenModels
import SwiftUI

/// A program as a picture: a bar per week, grouped by block, each block's name under its bars. A block is as wide
/// as its share of the weeks, and never narrower than its name. Design: APEX README, Programs and Program overview
/// ("a bar per week grouped by block (done grey, this week blue, deload weeks half height)"). The measurements and
/// the three greys are the Library demo's (design/export/app/library.dc.html).
struct BlockBars: View {
    let blocks: [ProgramCard.Block]

    private enum Metric {
        static let blockGap: CGFloat = 10
        static let barGap: CGFloat = 3
        static let barHeight: CGFloat = 8
        static let deloadHeight: CGFloat = 4
        static let barRadius: CGFloat = 2
        static let barsToName: CGFloat = 6
    }

    var body: some View {
        ProportionalRow(spacing: Metric.blockGap) {
            ForEach(Array(blocks.enumerated()), id: \.offset) { _, block in
                VStack(alignment: .leading, spacing: Metric.barsToName) {
                    HStack(spacing: Metric.barGap) {
                        ForEach(Array(block.bars.enumerated()), id: \.offset) { _, bar in
                            RoundedRectangle(cornerRadius: Metric.barRadius)
                                .fill(color(of: bar.fill))
                                .frame(height: bar.isDeload ? Metric.deloadHeight : Metric.barHeight)
                        }
                    }
                    // No width of their own: the block's name alone says how narrow the block may get.
                    .frame(idealWidth: 0, maxWidth: .infinity, minHeight: Metric.barHeight)
                    Eyebrow(text: block.name)
                        .lineLimit(1)
                }
                .layoutWeight(Double(block.bars.count))
            }
        }
    }

    private func color(of fill: WeekBar.Fill) -> Color {
        switch fill {
        case .done: Tokens.Color.barDone
        case .current: Tokens.Color.accent
        case .upcoming: Tokens.Color.barUpcoming
        case .plain: Tokens.Color.barPlain
        }
    }
}
