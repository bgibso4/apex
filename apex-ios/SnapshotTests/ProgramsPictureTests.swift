import XCTest

/// Programs' designed states (the Library), one picture each.
final class ProgramsPictureTests: XCTestCase {
    @MainActor
    func testStates() throws {
        try SnapshotHost.assertStates(ofScreen: "programs")
    }
}
