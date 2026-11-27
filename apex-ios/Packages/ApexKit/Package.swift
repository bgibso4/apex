// swift-tools-version: 6.4
import PackageDescription

// Settings shared by every module.
let moduleSettings: [SwiftSetting] = [
    .swiftLanguageMode(.v6),
    .enableUpcomingFeature("NonisolatedNonsendingByDefault"),
    .enableUpcomingFeature("InferIsolatedConformances"),
]

let package = Package(
    name: "ApexKit",
    platforms: [.iOS(.v27), .macOS(.v27)],
    products: [
        .library(name: "Core", targets: ["Core"])
    ],
    targets: [
        .target(name: "Core", swiftSettings: moduleSettings),
        .testTarget(name: "CoreTests", dependencies: ["Core"], swiftSettings: moduleSettings),
    ]
)
