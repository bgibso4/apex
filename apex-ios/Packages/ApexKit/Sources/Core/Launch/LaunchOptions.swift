/// What the launch arguments ask for. Flags are parsed only in Debug builds; unknown flags are ignored.
public struct LaunchOptions: Sendable, Equatable {
    /// `-UITest`: the app runs under a UI test, with animations off.
    public private(set) var isUITest = false
    /// `-State <name>`: the designed state the app opens in.
    public private(set) var stateName: String?

    public init(arguments: [String], isDebugBuild: Bool) {
        guard isDebugBuild else { return }
        isUITest = arguments.contains("-UITest")
        if let flag = arguments.firstIndex(of: "-State"), arguments.indices.contains(flag + 1) {
            stateName = arguments[flag + 1]
        }
    }
}
