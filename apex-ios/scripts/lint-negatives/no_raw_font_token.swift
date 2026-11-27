import SwiftUI

// .font(.title2) and Font.system(size: 14) in a comment
struct Fixture: View {
    var font: Font = Tokens.Typography.cardName

    var body: some View {
        Text("x").font(Tokens.Typography.cardName)
    }
}
