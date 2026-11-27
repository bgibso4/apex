#if DEBUG
    import Observation

    /// The device lab: a screen in Debug builds where Ben tries a few values of a token on his phone (issue 96).
    /// It is shown over the app while it is open.
    @Observable public final class LabModel {
        public var isOpen = false
        /// The exhibits opened on top of the lab's list, the last one showing.
        public var path: [LabExhibit] = []

        public init() {}

        /// Opens the lab straight at `exhibit`, as a `lab.<exhibit>` launch state asks.
        public func open(at exhibit: LabExhibit) {
            path = [exhibit]
            isOpen = true
        }
    }
#endif
