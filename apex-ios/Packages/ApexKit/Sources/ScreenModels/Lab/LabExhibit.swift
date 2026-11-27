#if DEBUG
    /// What the device lab holds: one exhibit per kind of thing only a phone can judge. A new device check adds a
    /// case here and its screen in `Screens/Lab`.
    public nonisolated enum LabExhibit: String, CaseIterable, Sendable {
        case motion

        public var title: String {
            switch self {
            case .motion: "Motion"
            }
        }

        /// One line on what the exhibit tries.
        public var summary: String {
            switch self {
            case .motion: "The snappy spring's bounce · issue 93"
            }
        }

        /// The launch state that opens the lab at this exhibit: `make run STATE=lab.motion`.
        public var stateName: String { "lab.\(rawValue)" }

        public init?(stateName: String) {
            guard let exhibit = Self.allCases.first(where: { $0.stateName == stateName }) else { return nil }
            self = exhibit
        }
    }
#endif
