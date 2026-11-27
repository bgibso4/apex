import SwiftUI

/// A card's primary action, filled blue: the thing to do now. One per card at most.
/// Design: APEX README, Actions. The pressed fill is the demos' (`style-active` on every blue button).
struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Tokens.Typography.button)
            .foregroundStyle(Tokens.Color.onAccent)
            .frame(maxWidth: .infinity, minHeight: Tokens.Size.buttonPrimary)
            .background(
                configuration.isPressed ? Tokens.Color.accentPressed : Tokens.Color.accent,
                in: RoundedRectangle(cornerRadius: Tokens.Radius.card)
            )
            .animation(Tokens.Motion.quick, value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == PrimaryButtonStyle {
    static var primary: Self { Self() }
}
