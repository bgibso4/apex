/// A number or word with its label under it, as the centred stats on a card show it.
public nonisolated struct Stat: Equatable, Sendable {
    public let value: String
    public let label: String

    public init(value: String, label: String) {
        self.value = value
        self.label = label
    }
}
