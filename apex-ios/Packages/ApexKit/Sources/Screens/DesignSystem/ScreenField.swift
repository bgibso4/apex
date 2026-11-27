import SwiftUI

/// The field every screen sits on: `field-base` with the halo behind the header.
/// Design: APEX README, Color, "Light": `radial-gradient(ellipse 90% 45% at 50% -5%, halo, field-mid 55%, field-base)`.
struct ScreenField: View {
    /// The halo's radii and centre, as shares of the screen's width and height.
    private static let haloRadii = CGSize(width: 0.9, height: 0.45)
    private static let haloCenter = UnitPoint(x: 0.5, y: -0.05)
    private static let fieldMidStop = 0.55

    var body: some View {
        GeometryReader { proxy in
            EllipticalGradient(
                stops: [
                    .init(color: Tokens.Color.halo, location: 0),
                    .init(color: Tokens.Color.fieldMid, location: Self.fieldMidStop),
                    .init(color: Tokens.Color.fieldBase, location: 1),
                ]
            )
            .frame(
                width: proxy.size.width * Self.haloRadii.width * 2,
                height: proxy.size.height * Self.haloRadii.height * 2
            )
            .position(x: proxy.size.width * Self.haloCenter.x, y: proxy.size.height * Self.haloCenter.y)
        }
        .background(Tokens.Color.fieldBase)
        .ignoresSafeArea()
    }
}
