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

    @Test func everyScreenHasAPictureTestClass() {
        let screens = Set(DesignedState.allCases.map(\.screen)).sorted()
        let withoutClass = screens.filter { screen in
            let file = "SnapshotTests/\(screen.prefix(1).uppercased() + screen.dropFirst())PictureTests.swift"
            return !FileManager.default.fileExists(atPath: Self.iosRoot.appending(path: file).path)
        }

        #expect(
            withoutClass == [], "add SnapshotTests/<Screen>PictureTests.swift for each, and its rows in test-map.txt")
    }

    @Test func aStatesScreenIsTheNameBeforeTheDot() {
        #expect(DesignedState.homeNoProgram.screen == "home")
    }

    @Test func homeNoProgramIsTheMocksEndedState() {
        let model = DesignedState.homeNoProgram.appModel()

        #expect(model.selectedTab == .home)
        #expect(model.home.noProgramEyebrow == "Pillars ended Aug 20")
    }

    @Test func programsActiveIsTheMocksLibrary() {
        let model = DesignedState.programsActive.appModel()

        #expect(DesignedState.programsActive.screen == "programs")
        #expect(model.selectedTab == .home)
        #expect(model.home.path == [.programs])
        #expect(model.programs.sections.map(\.label) == ["Active", "All programs"])
        #expect(model.programs.sections.first?.cards.map(\.name) == ["Pillars"])
        #expect(model.programs.sections.first?.cards.first?.tag == "Week 3 of 11")
        #expect(model.programs.sections.last?.cards.count == 5)
    }

    @Test func anUnknownNameIsAnsweredWithEveryKnownOne() {
        let message = DesignedState.unknownMessage(for: "home.nope")

        #expect(message.contains("home.nope"))
        #expect(DesignedState.allCases.allSatisfy { message.contains($0.rawValue) })
    }
}
