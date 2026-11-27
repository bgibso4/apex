#if DEBUG
    import SwiftUI

    /// A row that follows the finger sideways and snaps back when let go: the part of a swipe that the snappy
    /// timing is for. Design: motion-decisions, the three timings ("swipe snap-back") and m3 ("drag follows finger,
    /// snaps on release").
    struct SnapBackRow<Content: View>: View {
        /// The snappy spring's bounce on trial.
        let bounce: Double
        @ViewBuilder let content: Content

        @State private var offset: CGFloat = 0

        var body: some View {
            content
                .contentShape(.rect)
                .offset(x: offset)
                .gesture(
                    DragGesture()
                        .onChanged { offset = $0.translation.width }
                        .onEnded { _ in
                            withAnimation(Tokens.Motion.snappy(bounce: bounce)) { offset = 0 }
                        }
                )
        }
    }
#endif
