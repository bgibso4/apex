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

    /// The real app, or the state `-State` names: a designed state, or in a Debug build the real app with the device
    /// lab open at one exhibit. An unknown name stops the app and says which names exist: it never opens some other
    /// state under that name.
    private static func model(stateName: String?) -> AppModel {
        let app = AppModel(home: HomeModel(lastEnded: nil, calendar: .current))
        guard let stateName else { return app }
        #if DEBUG
            if let exhibit = LabExhibit(stateName: stateName) {
                app.lab.open(at: exhibit)
                return app
            }
            let labStates = ". Lab states: \(LabExhibit.allCases.map(\.stateName).joined(separator: ", "))"
        #else
            let labStates = ""
        #endif
        guard let state = DesignedState(rawValue: stateName) else {
            let message = DesignedState.unknownMessage(for: stateName) + labStates
            Logger(subsystem: "com.cadre.apex", category: "App").fault("\(message, privacy: .public)")
            fatalError(message)
        }
        return state.appModel()
    }
}
