import XCTest

extension XCTestCase {
    /// The app, launched with `-UITest` (no animations) and then `flags`.
    @MainActor
    func launchApp(_ flags: [String] = []) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-UITest"] + flags
        app.launch()
        return app
    }
}
