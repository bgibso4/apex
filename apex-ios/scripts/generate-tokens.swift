// Reads design/tokens.json and writes Packages/ApexKit/Sources/Screens/DesignSystem/Generated/Tokens.swift.
// The whole source is read and checked before anything is written: a token the generator does not understand
// stops it with the output untouched. The output is deterministic. Run it with `make generate`:
//   swift scripts/generate-tokens.swift [INPUT [OUTPUT]]

import Foundation

let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
let paths = CommandLine.arguments.dropFirst().map { URL(fileURLWithPath: $0) }
let input = paths.first ?? root.appending(path: "design/tokens.json")
let output =
    paths.dropFirst().first
    ?? root.appending(path: "Packages/ApexKit/Sources/Screens/DesignSystem/Generated/Tokens.swift")

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data("error: \(message)\n".utf8))
    exit(1)
}

// MARK: Reading

/// A JSON object with a fixed set of keys. Any other key is an error, never dropped.
func record(_ value: Any?, _ what: String, keys: Set<String>) -> [String: Any] {
    guard let result = value as? [String: Any] else { fail("\(what) must be an object") }
    if let unknown = result.keys.sorted().first(where: { !keys.contains($0) }) {
        fail("\(what) has an unknown key: \(unknown)")
    }
    return result
}

/// A JSON object keyed by token name, in name order.
func tokens(_ value: Any?, _ what: String) -> [(name: String, value: Any)] {
    guard let result = value as? [String: Any] else { fail("\(what) must be an object") }
    return result.sorted { $0.key < $1.key }.map { (name: $0.key, value: $0.value) }
}

/// A JSON number as Swift source: 34, 9.5, -0.5.
func number(_ value: Any?, _ what: String) -> String {
    guard let number = value as? Double else { fail("\(what) must be a number") }
    return number == number.rounded() ? String(Int(number)) : String(number)
}

func camelCased(_ name: String) -> String {
    let parts = name.split(separator: "-").map(String.init)
    return (parts.first ?? "") + parts.dropFirst().map(\.capitalized).joined()
}

// MARK: One declaration per token

/// Broken after the parenthesis, as swift-format would: the longer names do not fit on one line.
func color(_ name: String, _ value: Any) -> String {
    guard let hex = value as? String,
        hex.range(of: "^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$", options: .regularExpression) != nil
    else { fail("color \(name) must be #RRGGBB or #RRGGBBAA: \(value)") }
    let digits = Array(hex.dropFirst().uppercased())
    func channel(_ index: Int) -> String { "0x\(String(digits[index * 2..<index * 2 + 2])) / 255" }
    let opacity = digits.count == 8 ? channel(3) : "1"
    return """
        \(camelCased(name)) = SwiftUI.Color(
                    .sRGB, red: \(channel(0)), green: \(channel(1)), blue: \(channel(2)), opacity: \(opacity))
        """
}

let weights = [400: "regular", 500: "medium", 600: "semibold", 700: "bold", 800: "heavy"]

/// Fixed sizes (no Dynamic Type) and tabular numerals, always.
func typography(_ name: String, _ value: Any) -> [String] {
    let what = "type \(name)"
    let style = record(value, what, keys: ["size", "weight", "tracking"])
    guard let weight = (style["weight"] as? Int).flatMap({ weights[$0] }) else {
        fail("\(what) weight must be one of \(weights.keys.sorted())")
    }
    let size = number(style["size"], "\(what) size")
    let font = "\(camelCased(name)) = Font.system(size: \(size), weight: .\(weight)).monospacedDigit()"
    guard let tracking = style["tracking"] else { return [font] }
    return [font, "\(camelCased(name))Tracking: CGFloat = \(number(tracking, "\(what) tracking"))"]
}

func animation(_ name: String, _ value: Any) -> String {
    let what = "motion.animation \(name)"
    func fields(_ own: String...) -> [String: Any] { record(value, what, keys: Set(["curve", "duration"] + own)) }
    func duration(_ fields: [String: Any]) -> String { number(fields["duration"], "\(what) duration") }
    let curve = (value as? [String: Any])?["curve"] as? String
    switch curve {
    case "easeOut":
        return "\(camelCased(name)) = Animation.easeOut(duration: \(duration(fields())))"
    case "spring":
        let fields = fields("bounce")
        let bounce = number(fields["bounce"], "\(what) bounce")
        return "\(camelCased(name)) = Animation.spring(duration: \(duration(fields)), bounce: \(bounce))"
    case "bezier":
        let fields = fields("control")
        guard let control = fields["control"] as? [Any], control.count == 4 else {
            fail("\(what) control must be four numbers")
        }
        let points = control.map { number($0, "\(what) control") }.joined(separator: ", ")
        return "\(camelCased(name)) = Animation.timingCurve(\(points), duration: \(duration(fields)))"
    default:
        fail("\(what) has an unknown curve: \(curve ?? "none")")
    }
}

func numbers(_ value: Any?, _ what: String, type: String) -> [String] {
    tokens(value, what).map { "\(camelCased($0.name)): \(type) = \(number($0.value, "\(what) \($0.name)"))" }
}

// MARK: Writing

/// `enum name { static let … }` at `depth` levels of indentation, with `nested` enums after the declarations.
func enumeration(_ name: String, depth: Int, _ declarations: [String], nested: [String] = []) -> String {
    let pad = String(repeating: "    ", count: depth)
    let lines = declarations.map { "\(pad)    static let \($0)" }
    return (["\(pad)enum \(name) {"] + lines + nested.flatMap { ["", $0] } + ["\(pad)}"]).joined(separator: "\n")
}

guard let data = FileManager.default.contents(atPath: input.path),
    let json = try? JSONSerialization.jsonObject(with: data)  // Not JSON and unreadable fail the same way, below.
else { fail("\(input.path) is not readable JSON") }

let source = record(json, "tokens.json", keys: ["color", "type", "spacing", "radius", "size", "motion"])
let motion = record(source["motion"], "motion", keys: ["animation", "duration", "distance"])
let sections = [
    enumeration("Color", depth: 1, tokens(source["color"], "color").map(color)),
    enumeration("Typography", depth: 1, tokens(source["type"], "type").flatMap(typography)),
    enumeration("Spacing", depth: 1, numbers(source["spacing"], "spacing", type: "CGFloat")),
    enumeration("Radius", depth: 1, numbers(source["radius"], "radius", type: "CGFloat")),
    enumeration("Size", depth: 1, numbers(source["size"], "size", type: "CGFloat")),
    enumeration(
        "Motion",
        depth: 1,
        tokens(motion["animation"], "motion.animation").map(animation),
        nested: [
            enumeration("Duration", depth: 2, numbers(motion["duration"], "motion.duration", type: "TimeInterval")),
            enumeration("Distance", depth: 2, numbers(motion["distance"], "motion.distance", type: "CGFloat")),
        ]),
]

let text = """
    // GENERATED · run make generate. Source: design/tokens.json. Do not edit.

    import SwiftUI

    enum Tokens {
    \(sections.joined(separator: "\n\n"))
    }

    """

do {
    try FileManager.default.createDirectory(at: output.deletingLastPathComponent(), withIntermediateDirectories: true)
    try text.write(to: output, atomically: true, encoding: .utf8)
} catch {
    fail("cannot write \(output.path): \(error.localizedDescription)")
}
