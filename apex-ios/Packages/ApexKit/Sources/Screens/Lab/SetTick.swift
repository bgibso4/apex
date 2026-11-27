#if DEBUG
    import SwiftUI

    /// A set's tick, as the Workout session draws it: a grey ring that fills moss, and a dark check that pops in.
    /// Design: APEX README, "Workout session, set ticks" (a 28 px circle in a 44 pt tap area); motion-decisions w1
    /// (the fill takes the quick timing, the check pops in with the snappy one) and w4 (unticking fades, no pop).
    /// The ring is the demo's 1.5 px. Its grey (#3A3D45) has no token yet, so the lab draws the nearest one.
    struct SetTick: View {
        let isTicked: Bool
        /// The snappy spring's bounce on trial.
        let bounce: Double
        let toggle: () -> Void

        private static let diameter: CGFloat = 28
        private static let ringWidth: CGFloat = 1.5

        var body: some View {
            Button(action: toggle) {
                ZStack {
                    Circle().strokeBorder(Tokens.Color.borderTop, lineWidth: Self.ringWidth)
                    Circle().fill(Tokens.Color.moss).opacity(isTicked ? 1 : 0)
                    if isTicked {
                        Image(systemName: "checkmark")
                            .font(Tokens.Typography.cardName)
                            .foregroundStyle(Tokens.Color.onAccent)
                            .transition(
                                .asymmetric(
                                    insertion: .scale.animation(Tokens.Motion.snappy(bounce: bounce)),
                                    removal: .opacity.animation(Tokens.Motion.quick)
                                )
                            )
                    }
                }
                .frame(width: Self.diameter, height: Self.diameter)
                .frame(width: Tokens.Size.tapTarget, height: Tokens.Size.tapTarget)
                .contentShape(.rect)
                .animation(Tokens.Motion.quick, value: isTicked)
            }
            .buttonStyle(.plain)
        }
    }
#endif
