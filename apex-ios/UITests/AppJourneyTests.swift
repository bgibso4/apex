import XCTest

/// The wiring from the app's entry point to its tabs, to Programs and to the device lab: the real app on its real
/// database file, with no designed state.
@MainActor
final class AppJourneyTests: XCTestCase {
    override func setUp() {
        continueAfterFailure = false
    }

    func testTheAppLaunchesToHomeTheTabsSwitchAndTheLabOpens() {
        let app = launchApp()
        let homeCard = app.staticTexts["No Active Program"]
        XCTAssertTrue(homeCard.appears(within: 10))

        let tabs = app.tabBars.buttons
        for title in ["Workout", "Progress", "Run"] {
            tabs[title].tap()
            XCTAssertTrue(tabs[title].satisfies("isSelected == true", within: 5), "\(title) is not selected")
            XCTAssertTrue(homeCard.disappears(within: 5), "Home's card is still there under \(title)")
        }

        tabs["Home"].tap()
        XCTAssertTrue(homeCard.appears(within: 5))

        // Home's way to Programs. The app opened its database at launch (it stops if it cannot), and lists the
        // built-in programs from it with none active.
        app.buttons["Choose a program"].tap()
        let programs = app.navigationBars["Programs"]
        XCTAssertTrue(programs.appears(within: 5), "Programs did not open from Home")
        XCTAssertTrue(app.staticTexts["Pillars Hypertrophy"].exists, "The built-in programs are not listed")
        XCTAssertFalse(app.staticTexts["Active"].exists, "A program is active in an app that has started none")
        programs.buttons.firstMatch.tap()
        XCTAssertTrue(homeCard.appears(within: 5), "Back did not return to Home")

        // The device lab's way in by hand (Debug builds): press and hold the wordmark. Nothing else exercises it,
        // and it is the only way in on a phone that is away from the Mac.
        app.staticTexts["PEX"].press(forDuration: 1)
        XCTAssertTrue(app.staticTexts["Motion"].appears(within: 5), "The lab did not open from the wordmark")
    }
}
