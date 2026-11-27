import SwiftUI

struct Fixture: View {
    @State private var x = false

    var body: some View {
        Text("x").font(x ? Tokens.Typography.cardName : .title)
    }
}
