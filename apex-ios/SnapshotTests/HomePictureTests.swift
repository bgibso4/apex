import XCTest

/// Home's designed states, one picture each.
final class HomePictureTests: XCTestCase {
    @MainActor
    func testStates() throws {
        try SnapshotHost.assertStates(ofScreen: "home")
    }
}
