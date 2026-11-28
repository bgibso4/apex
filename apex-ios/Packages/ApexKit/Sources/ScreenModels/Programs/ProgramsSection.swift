/// A group of cards in Programs, under its label. With no active program there is one group and no label.
public nonisolated struct ProgramsSection: Equatable, Identifiable, Sendable {
    public let label: String?
    public let cards: [ProgramCard]

    public var id: String { label ?? "" }
}
