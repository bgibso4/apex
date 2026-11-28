// swift-tools-version: 6.4
import PackageDescription

// Settings shared by every module. ScreenModels and Screens add `.defaultIsolation(MainActor.self)`.
let moduleSettings: [SwiftSetting] = [
    .swiftLanguageMode(.v6),
    .enableUpcomingFeature("NonisolatedNonsendingByDefault"),
    .enableUpcomingFeature("InferIsolatedConformances"),
]
let mainActorSettings = moduleSettings + [.defaultIsolation(MainActor.self)]
let grdb = Target.Dependency.product(name: "GRDB", package: "GRDB.swift")

let package = Package(
    name: "ApexKit",
    platforms: [.iOS(.v27), .macOS(.v27)],
    products: [
        .library(name: "Core", targets: ["Core"]),
        .library(name: "Training", targets: ["Training"]),
        .library(name: "Store", targets: ["Store"]),
        .library(name: "ScreenModels", targets: ["ScreenModels"]),
        .library(name: "Screens", targets: ["Screens"]),
        .library(name: "TestSupport", targets: ["TestSupport"]),
    ],
    dependencies: [
        // The only module that imports it is Store.
        .package(url: "https://github.com/groue/GRDB.swift", exact: "7.12.0")
    ],
    targets: [
        .target(name: "Core", swiftSettings: moduleSettings),
        .target(name: "Training", dependencies: ["Core"], swiftSettings: moduleSettings),
        .target(name: "Store", dependencies: ["Core", "Training", grdb], swiftSettings: moduleSettings),
        .target(name: "ScreenModels", swiftSettings: mainActorSettings),
        .target(name: "TestSupport", dependencies: ["ScreenModels"], swiftSettings: moduleSettings),
        .target(
            name: "Screens",
            dependencies: ["Core", "ScreenModels", "TestSupport"],
            resources: [.process("DesignSystem/Generated/Resources")],
            swiftSettings: mainActorSettings
        ),
        .testTarget(name: "CoreTests", dependencies: ["Core"], swiftSettings: moduleSettings),
        .testTarget(name: "TrainingTests", dependencies: ["Core", "Training"], swiftSettings: moduleSettings),
        .testTarget(
            name: "StoreTests",
            dependencies: ["Core", "Training", "Store", grdb],
            // The schema the migrations must add up to: read by MigrationTests from its place in the sources.
            exclude: ["schema.sql"],
            swiftSettings: moduleSettings
        ),
        .testTarget(name: "ScreenModelsTests", dependencies: ["ScreenModels"], swiftSettings: mainActorSettings),
        .testTarget(
            name: "TestSupportTests",
            dependencies: ["ScreenModels", "TestSupport"],
            swiftSettings: mainActorSettings
        ),
    ]
)
