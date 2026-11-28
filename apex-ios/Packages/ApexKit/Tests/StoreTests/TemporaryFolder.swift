import Foundation

/// A folder of the test's own that does not exist yet, and a database file's place inside it.
struct TemporaryFolder {
    let url = FileManager.default.temporaryDirectory.appending(path: "apex-store-tests-\(UUID().uuidString)")

    var database: URL { url.appending(path: "nested/apex.sqlite") }

    func remove() {
        // try? because a test that failed before it made the folder has nothing to remove.
        try? FileManager.default.removeItem(at: url)
    }
}
