import XCTest

/// The wiring from the app's entry point to its tabs: the real app, with no designed state.
@MainActor
final class AppJourneyTests: XCTestCase {
    override func setUp() {
        continueAfterFailure = false
    }

    func testTheAppLaunchesToHomeAndTheTabsSwitch() {
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
    }
}
