import SwiftUI

struct Fixture: View {
    @State private var x = false

    var body: some View {
        Text("x").animation(.smooth, value: x)
    }
}
