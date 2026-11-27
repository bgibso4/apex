import SwiftUI

/// An eyebrow or section label: uppercase, tracked, muted. Design: APEX README, Type.
struct Eyebrow: View {
    let text: String

    var body: some View {
        Text(text)
            .font(Tokens.Typography.eyebrow)
            .tracking(Tokens.Typography.eyebrowTracking)
            .textCase(.uppercase)
            .foregroundStyle(Tokens.Color.textMuted)
    }
}
