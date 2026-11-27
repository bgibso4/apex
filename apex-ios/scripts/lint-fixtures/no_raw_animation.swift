import SwiftUI

struct Fixture: View {
    @State private var x = false

    var body: some View {
        Text("x").animation(.easeOut(duration: 0.2), value: x)
    }
}
