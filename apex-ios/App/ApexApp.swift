import Core
import Foundation
import OSLog
import ScreenModels
import Screens
import Store
import SwiftUI
import TestSupport
import Training
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
    /// state under that name. A designed state never opens the database on disk.
    private static func model(stateName: String?) -> AppModel {
        guard let stateName else { return realApp() }
        #if DEBUG
            if let exhibit = LabExhibit(stateName: stateName) {
                let app = realApp()
                app.lab.open(at: exhibit)
                return app
            }
            let labStates = ". Lab states: \(LabExhibit.allCases.map(\.stateName).joined(separator: ", "))"
        #else
            let labStates = ""
        #endif
        guard let state = DesignedState(rawValue: stateName) else {
            stop(DesignedState.unknownMessage(for: stateName) + labStates)
        }
        return state.appModel()
    }

    /// The app on its own database: `apex.sqlite` in Application Support, which the phone's backup includes.
    /// A database that cannot be opened stops the app: it is the source of truth, and there is nothing to run on.
    private static func realApp() -> AppModel {
        let store: Store
        do {
            store = try Store(.file(URL.applicationSupportDirectory.appending(path: "apex.sqlite")))
        } catch {
            stop("The database could not be opened: \(error)")
        }
        return AppModel(
            home: HomeModel(lastEnded: nil, calendar: .current),
            programs: ProgramsModel(programs: Program.builtIn, currentRun: store.currentRun) {
                Day(.now, in: .current)
            }
        )
    }

    private static func stop(_ message: String) -> Never {
        Logger(subsystem: "com.cadre.apex", category: "App").fault("\(message, privacy: .public)")
        fatalError(message)
    }
}
