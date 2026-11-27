import SwiftUI

struct Fixture: View {
    @State private var x = false

    var body: some View {
        Button("x") { withAnimation(.spring(duration: 0.3)) { x.toggle() } }
    }
}
