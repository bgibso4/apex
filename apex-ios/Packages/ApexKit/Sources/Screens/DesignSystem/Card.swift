import SwiftUI

/// A content card: painted light, never glass.
/// Design: APEX README, Color ("cards use the vertical gradient + lighter top edge") and Shape and spacing.
struct Card<Content: View>: View {
    @ViewBuilder let content: Content

    /// An instance constant: a generic type cannot hold a static one.
    private let borderWidth: CGFloat = 1

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: Tokens.Radius.card)
        content
            .padding(.vertical, Tokens.Spacing.cardPaddingVertical)
            .padding(.horizontal, Tokens.Spacing.cardPaddingHorizontal)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                LinearGradient(
                    colors: [Tokens.Color.cardTop, Tokens.Color.cardBase], startPoint: .top, endPoint: .bottom),
                in: shape
            )
            .overlay { shape.strokeBorder(Tokens.Color.border, lineWidth: borderWidth) }
            .overlay {
                // The lighter top edge: it fades out down the corners, where the mock's border changes colour.
                shape.strokeBorder(Tokens.Color.borderTop, lineWidth: borderWidth)
                    .mask(alignment: .top) {
                        LinearGradient(colors: [.black, .clear], startPoint: .top, endPoint: .bottom)
                            .frame(height: Tokens.Radius.card)
                    }
            }
    }
}
