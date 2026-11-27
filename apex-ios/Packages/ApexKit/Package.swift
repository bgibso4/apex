// swift-tools-version: 6.4
import PackageDescription

// Settings shared by every module. ScreenModels and Screens add `.defaultIsolation(MainActor.self)`.
let moduleSettings: [SwiftSetting] = [
    .swiftLanguageMode(.v6),
    .enableUpcomingFeature("NonisolatedNonsendingByDefault"),
    .enableUpcomingFeature("InferIsolatedConformances"),
]
let mainActorSettings = moduleSettings + [.defaultIsolation(MainActor.self)]

let package = Package(
    name: "ApexKit",
    platforms: [.iOS(.v27), .macOS(.v27)],
    products: [
        .library(name: "Core", targets: ["Core"]),
        .library(name: "ScreenModels", targets: ["ScreenModels"]),
        .library(name: "Screens", targets: ["Screens"]),
        .library(name: "TestSupport", targets: ["TestSupport"]),
    ],
    targets: [
        .target(name: "Core", swiftSettings: moduleSettings),
        .target(name: "ScreenModels", swiftSettings: mainActorSettings),
        .target(name: "TestSupport", dependencies: ["ScreenModels"], swiftSettings: moduleSettings),
        .target(
            name: "Screens",
            dependencies: ["Core"],
            swiftSettings: mainActorSettings
        ),
        .testTarget(name: "CoreTests", dependencies: ["Core"], swiftSettings: moduleSettings),
        .testTarget(name: "ScreenModelsTests", dependencies: ["ScreenModels"], swiftSettings: mainActorSettings),
        .testTarget(
            name: "TestSupportTests",
            dependencies: ["ScreenModels", "TestSupport"],
            swiftSettings: mainActorSettings
        ),
    ]
)
