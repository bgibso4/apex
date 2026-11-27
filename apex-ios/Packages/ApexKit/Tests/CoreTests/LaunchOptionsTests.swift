import Core
import Testing

struct LaunchOptionsTests {
    @Test func uiTestFlagIsReadInADebugBuild() {
        #expect(LaunchOptions(arguments: ["Apex", "-UITest"], isDebugBuild: true).isUITest)
    }

    @Test func aReleaseBuildIgnoresEveryFlag() {
        #expect(!LaunchOptions(arguments: ["Apex", "-UITest"], isDebugBuild: false).isUITest)
    }

    @Test func noFlagsMeansDefaults() {
        #expect(!LaunchOptions(arguments: ["Apex"], isDebugBuild: true).isUITest)
    }

    @Test func unknownFlagsAreIgnored() {
        #expect(!LaunchOptions(arguments: ["Apex", "-NSDocumentRevisionsDebugMode", "YES"], isDebugBuild: true).isUITest)
    }
}
