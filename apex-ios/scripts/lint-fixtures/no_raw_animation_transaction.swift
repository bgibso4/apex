import SwiftUI

struct Fixture: View {
    @State private var x = false

    var body: some View {
        Text("x").transaction { $0.animation = .easeOut(duration: 0.2) }
    }
}
