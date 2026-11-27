import Foundation

/// A program that has finished: what Home names when no program is active.
public nonisolated struct EndedProgram: Equatable, Sendable {
    let name: String
    let endedOn: Date

    public init(name: String, endedOn: Date) {
        self.name = name
        self.endedOn = endedOn
    }
}
