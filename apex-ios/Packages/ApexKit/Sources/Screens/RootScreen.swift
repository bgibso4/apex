import SwiftUI

/// The app's root: an empty screen until the tab bar replaces its body.
public struct RootScreen: View {
    public init() {}

    public var body: some View {
        Tokens.Color.fieldBase.ignoresSafeArea()
    }
}
