import SwiftUI

struct Fixture: View {
    @State private var x = false

    var body: some View {
        Button("x") { withAnimation { x.toggle() } }
    }
}
