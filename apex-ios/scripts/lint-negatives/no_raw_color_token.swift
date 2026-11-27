import SwiftUI

// Color.black and Color(red: 0, green: 0, blue: 0) in a comment
struct Fixture: View {
    var tint: Color = Tokens.Color.fieldBase
    let note = "Color.black and .foregroundStyle(.white) in a string"

    var body: some View {
        Color.clear.background(Tokens.Color.fieldBase).foregroundStyle(tint)
    }
}
