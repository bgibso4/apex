import Foundation
import ScreenModels
import TestSupport
import Testing

struct DesignedStateTests {
    /// `apex-ios/`, five folders up from this file.
    private static let iosRoot = (1...5).reduce(URL(filePath: #filePath)) { url, _ in url.deletingLastPathComponent() }

    @Test func everyDesignedStateHasAReferenceImage() {
        let withoutImage = DesignedState.allCases.map(\.rawValue).filter { name in
            !FileManager.default.fileExists(atPath: Self.iosRoot.appending(path: "design/mocks/\(name).png").path)
        }

        #expect(withoutImage == [], "add each to design/states.json and run make mocks")
    }

    @Test func aStatesScreenIsTheNameBeforeTheDot() {
        #expect(DesignedState.homeNoProgram.screen == "home")
    }

    @Test func homeNoProgramIsTheMocksEndedState() {
        let model = DesignedState.homeNoProgram.appModel()

        #expect(model.selectedTab == .home)
        #expect(model.home.noProgramEyebrow == "Pillars ended Aug 20")
    }
}
