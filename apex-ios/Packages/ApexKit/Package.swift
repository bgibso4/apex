// swift-tools-version: 6.4
import PackageDescription

// Settings shared by every module. Screens adds `.defaultIsolation(MainActor.self)`.
let moduleSettings: [SwiftSetting] = [
    .swiftLanguageMode(.v6),
    .enableUpcomingFeature("NonisolatedNonsendingByDefault"),
    .enableUpcomingFeature("InferIsolatedConformances"),
]

let package = Package(
    name: "ApexKit",
    platforms: [.iOS(.v27), .macOS(.v27)],
    products: [
        .library(name: "Core", targets: ["Core"]),
        .library(name: "Screens", targets: ["Screens"]),
    ],
    targets: [
        .target(name: "Core", swiftSettings: moduleSettings),
        .target(
            name: "Screens",
            dependencies: ["Core"],
            swiftSettings: moduleSettings + [.defaultIsolation(MainActor.self)]
        ),
        .testTarget(name: "CoreTests", dependencies: ["Core"], swiftSettings: moduleSettings),
    ]
)
