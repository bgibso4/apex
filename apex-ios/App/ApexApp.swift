import Core
import Screens
import SwiftUI
import UIKit

@main
struct ApexApp: App {
    #if DEBUG
        private static let isDebugBuild = true
    #else
        private static let isDebugBuild = false
    #endif

    init() {
        let options = LaunchOptions(arguments: CommandLine.arguments, isDebugBuild: Self.isDebugBuild)
        if options.isUITest {
            UIView.setAnimationsEnabled(false)
        }
    }

    var body: some Scene {
        WindowGroup {
            RootScreen()
                .preferredColorScheme(.dark)
        }
    }
}
