// Puts a designed state's recorded picture and its mock side by side, scaled to the same height (`make compare`).
// Usage, from apex-ios/: swift scripts/compare-snapshot.swift <state>
// Writes build/compare/<state>.png (the app's picture on the left, the mock on the right) and prints the path.
// The two are compared by eye, never matched: the simulator is 402 points wide and the mocks 390.
import AppKit
import Foundation

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data("error: \(message)\n".utf8))
    exit(1)
}

guard CommandLine.arguments.count == 2 else { fail("usage: compare-snapshot.swift <state>") }
let state = CommandLine.arguments[1]
let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)

/// The one recorded picture of the state. swift-snapshot-testing names a reference `<test>.<name>.png`, with every
/// run of characters in the name that are not letters, digits or underscores written as a hyphen.
func recordedPicture() -> URL {
    let name = state.replacingOccurrences(of: "\\W+", with: "-", options: .regularExpression)
    let suffix = ".\(name).png"
    let folder = root.appending(path: "SnapshotTests/__Snapshots__")
    let files = FileManager.default.enumerator(at: folder, includingPropertiesForKeys: nil)?.compactMap { $0 as? URL }
    let matches = (files ?? []).filter { $0.lastPathComponent.hasSuffix(suffix) }
    guard matches.count == 1 else {
        fail(
            matches.isEmpty
                ? "\(state) has no recorded picture under SnapshotTests/__Snapshots__: run make snapshots-record"
                : "\(state) has \(matches.count) recorded pictures: \(matches.map(\.path).sorted())")
    }
    return matches[0]
}

func load(_ url: URL, orFail message: String) -> CGImage {
    guard let image = NSImage(contentsOf: url)?.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        fail(message)
    }
    return image
}

let picture = load(recordedPicture(), orFail: "the recorded picture of \(state) is not a readable image")
let mock = load(
    root.appending(path: "design/mocks/\(state).png"),
    orFail: "\(state) has no mock at design/mocks/\(state).png: add it to design/states.json and run make mocks")

let height = max(picture.height, mock.height)
let gap = 24
func scaledWidth(_ image: CGImage) -> Int { image.width * height / image.height }
let width = scaledWidth(picture) + gap + scaledWidth(mock)

guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
    let context = CGContext(
        data: nil,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )
else { fail("cannot create a drawing context") }
context.setFillColor(CGColor(gray: 0.5, alpha: 1))
context.fill(CGRect(x: 0, y: 0, width: width, height: height))
context.interpolationQuality = .high
context.draw(picture, in: CGRect(x: 0, y: 0, width: scaledWidth(picture), height: height))
context.draw(mock, in: CGRect(x: scaledWidth(picture) + gap, y: 0, width: scaledWidth(mock), height: height))

let output = root.appending(path: "build/compare/\(state).png")
guard let result = context.makeImage(),
    let png = NSBitmapImageRep(cgImage: result).representation(using: .png, properties: [:])
else { fail("cannot encode the comparison") }
do {
    try FileManager.default.createDirectory(at: output.deletingLastPathComponent(), withIntermediateDirectories: true)
    try png.write(to: output)
} catch {
    fail("cannot write \(output.path): \(error.localizedDescription)")
}
FileHandle.standardOutput.write(Data((output.path + "\n").utf8))
