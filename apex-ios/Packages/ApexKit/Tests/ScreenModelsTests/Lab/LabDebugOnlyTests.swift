import Foundation
import Testing

/// The lab is for Debug builds: nothing of it may compile into Release. No Release build runs in CI, so this holds
/// the line from the sources.
struct LabDebugOnlyTests {
    /// `Packages/ApexKit/Sources`, four folders up from this file and one down.
    private static let sources = (1...4)
        .reduce(URL(filePath: #filePath)) { url, _ in url.deletingLastPathComponent() }
        .appending(path: "Sources")

    @Test func everyLabFileIsDebugOnly() throws {
        for folder in ["ScreenModels/Lab", "Screens/Lab"] {
            let files = try FileManager.default
                .contentsOfDirectory(at: Self.sources.appending(path: folder), includingPropertiesForKeys: nil)
                .filter { $0.pathExtension == "swift" }
            let open = try files.filter { file in
                let lines = try String(contentsOf: file, encoding: .utf8).split(separator: "\n")
                return lines.first != "#if DEBUG" || lines.last != "#endif"
            }

            #expect(!files.isEmpty, "\(folder) holds no Swift file")
            #expect(open.map(\.lastPathComponent) == [], "wrap each whole file in #if DEBUG … #endif")
        }
    }
}
