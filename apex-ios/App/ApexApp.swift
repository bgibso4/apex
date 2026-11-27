import Core
import Foundation
import OSLog
import ScreenModels
import Screens
import SwiftUI
import TestSupport
import UIKit

@main
struct ApexApp: App {
    #if DEBUG
        private static let isDebugBuild = true
    #else
        private static let isDebugBuild = false
    #endif

    private let model: AppModel

    init() {
        let options = LaunchOptions(arguments: CommandLine.arguments, isDebugBuild: Self.isDebugBuild)
        if options.isUITest {
            UIView.setAnimationsEnabled(false)
        }
        model = Self.model(stateName: options.stateName)
    }

    var body: some Scene {
        WindowGroup {
            RootScreen(model: model)
                .preferredColorScheme(.dark)
        }
    }

    /// The real app, or the designed state `-State` names. An unknown name stops the app and says which names exist:
    /// it never opens some other state under that name.
    private static func model(stateName: String?) -> AppModel {
        guard let stateName else { return AppModel(home: HomeModel(lastEnded: nil, calendar: .current)) }
        guard let state = DesignedState(rawValue: stateName) else {
            let message = DesignedState.unknownMessage(for: stateName)
            Logger(subsystem: "com.cadre.apex", category: "App").fault("\(message, privacy: .public)")
            fatalError(message)
        }
        return state.appModel()
    }
}
