import SwiftUI

// withAnimation { } and .animation(.smooth, value: x) in a comment
struct Fixture: View {
    @State private var x = false

    var body: some View {
        Button("x") { withAnimation(Tokens.Motion.smooth) { x.toggle() } }
            .animation(Tokens.Motion.quick, value: x)
    }
}
