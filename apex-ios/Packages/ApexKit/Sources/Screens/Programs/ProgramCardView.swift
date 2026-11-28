import ScreenModels
import SwiftUI

/// A program's card in Programs: goal and level, the name, one line, the program as bars, then its stats.
/// Design: APEX README, "Lists, search, filters" › Programs (Library turn 3, L3b). The gaps are the Library
/// demo's (design/export/app/library.dc.html).
struct ProgramCardView: View {
    let card: ProgramCard

    private enum Gap {
        static let eyebrowToTag: CGFloat = 8
        static let eyebrowToName: CGFloat = 6
        static let nameToLine: CGFloat = 4
        static let lineToBars: CGFloat = 16
        static let barsToStats: CGFloat = 14
    }

    /// The line's leading: the demo sets 12 pt text on a line 1.45 times as tall, about 3 pt more than SF's own.
    private static let lineSpacing: CGFloat = 3

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: Gap.eyebrowToTag) {
                    Eyebrow(text: card.eyebrow)
                        .lineLimit(1)
                    Spacer(minLength: 0)
                    if let tag = card.tag {
                        Tag(text: tag)
                    }
                }
                Text(card.name)
                    .font(Tokens.Typography.programName)
                    .foregroundStyle(Tokens.Color.text)
                    .padding(.top, Gap.eyebrowToName)
                Text(card.line)
                    .font(Tokens.Typography.helper)
                    .foregroundStyle(Tokens.Color.textSecondary)
                    .lineSpacing(Self.lineSpacing)
                    .padding(.top, Gap.nameToLine)
                BlockBars(blocks: card.blocks)
                    .padding(.top, Gap.lineToBars)
                StatRow(stats: card.stats)
                    .padding(.top, Gap.barsToStats)
                    .padding(.horizontal, -Tokens.Spacing.cardPaddingHorizontal)
            }
        }
    }
}
