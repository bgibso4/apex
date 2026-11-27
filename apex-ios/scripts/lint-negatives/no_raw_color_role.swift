import SwiftUI

struct Fixture: View {
    @State private var x = false

    var body: some View {
        ApexButton(kind: .primary, secondary: .secondary)
    }
}
