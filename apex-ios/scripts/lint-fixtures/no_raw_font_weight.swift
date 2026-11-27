import SwiftUI

struct Fixture: View {
    @State private var x = false

    var body: some View {
        Text("x").font(Tokens.Typography.cardName).fontWeight(.bold)
    }
}
