import SwiftUI

/// The app's root: an empty screen until the tab bar replaces its body.
public struct RootScreen: View {
    public init() {}

    public var body: some View {
        // The field colour comes from the generated tokens in plan 3.
        Color.black.ignoresSafeArea()
    }
}
