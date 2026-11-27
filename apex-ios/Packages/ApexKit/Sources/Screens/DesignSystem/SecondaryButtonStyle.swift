import SwiftUI

/// A text action, centred in a full-width tap row. Only directly under a primary.
/// Design: APEX README, Actions. The pressed opacity is the demos' (`style-active` on every secondary).
struct SecondaryButtonStyle: ButtonStyle {
    private static let pressedOpacity = 0.6

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Tokens.Typography.buttonSecondary)
            .foregroundStyle(Tokens.Color.textSecondary)
            .frame(maxWidth: .infinity, minHeight: Tokens.Size.tapTarget)
            .contentShape(.rect)
            .opacity(configuration.isPressed ? Self.pressedOpacity : 1)
            .animation(Tokens.Motion.quick, value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == SecondaryButtonStyle {
    static var secondary: Self { Self() }
}
