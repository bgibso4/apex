#if DEBUG
    /// One token value on trial in the device lab: the values to try, and the one being tried. A trial starts on the
    /// token's own value, which is always among the values offered.
    public nonisolated struct LabTrial: Equatable, Sendable {
        /// The token's own value.
        public let token: Double
        /// The values to try: ascending, no repeats, the token's among them.
        public let options: [Double]
        public var tried: Double

        public init(token: Double, candidates: [Double]) {
            self.token = token
            options = Set(candidates).union([token]).sorted()
            tried = token
        }
    }

    extension LabTrial {
        /// Issue 93: the snappy spring's bounce, on SwiftUI's scale (0 is no bounce). The first five are the issue's.
        /// The last two are there because the demo's tick pop peaks at 114% of its size (`tickPop` in
        /// design/export/Workout Session Demo.dc.html), and a spring from nothing only overshoots that far near 0.47:
        /// at 0.3 it overshoots by about 5%.
        public static func snappyBounce(token: Double) -> Self {
            Self(token: token, candidates: [0, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5])
        }
    }
#endif
