import ScreenModels
import SwiftUI

/// Centred stats behind a hairline, at the foot of a card: the value over its label, a hairline between columns.
/// The hairline above runs the row's whole width, so on a card the row is set out to the card's edges.
/// Design: APEX README, Programs ("Weeks · Days a week as centred stats behind a hairline"). The gaps and the
/// label's size are the Library demo's (design/export/app/library.dc.html).
struct StatRow: View {
    let stats: [Stat]

    private enum Metric {
        static let hairline: CGFloat = 1
        static let hairlineToStats: CGFloat = 12
        static let valueToLabel: CGFloat = 2
    }

    var body: some View {
        VStack(spacing: Metric.hairlineToStats) {
            Tokens.Color.border.frame(height: Metric.hairline)
            HStack(spacing: 0) {
                ForEach(stats, id: \.label) { stat in
                    VStack(spacing: Metric.valueToLabel) {
                        Text(stat.value)
                            .font(Tokens.Typography.recordValue)
                            .foregroundStyle(Tokens.Color.text)
                        Text(stat.label)
                            .font(Tokens.Typography.metricLabel)
                            .foregroundStyle(Tokens.Color.textMuted)
                    }
                    .frame(maxWidth: .infinity)
                    .overlay(alignment: .leading) {
                        if stat != stats.first {
                            Tokens.Color.border.frame(width: Metric.hairline)
                        }
                    }
                }
            }
        }
    }
}
