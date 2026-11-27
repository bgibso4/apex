import Screens
import SnapshotTesting
import SwiftUI
import TestSupport
import UIKit
import XCTest

/// The one way a picture test draws a screen.
@MainActor
enum SnapshotHost {
    /// Every pixel must be within this perceptual precision of the reference. Changing it needs Ben's OK.
    private static let perceptualPrecision: Float = 0.98

    /// The pinned simulator: an iPhone 17, portrait (see the Makefile). SnapshotTesting needs the size and safe area
    /// spelled out; without them the content would sit under the status bar.
    private static let device = ViewImageConfig(
        safeArea: UIEdgeInsets(top: 62, left: 0, bottom: 34, right: 0),
        size: CGSize(width: 402, height: 874),
        traits: UITraitCollection(displayScale: 3)
    )

    // Computed: Snapshotting is not Sendable, so it cannot be a shared static.
    /// The library's image strategy, with `CPUImageMatch` checked first (see there for why).
    static var strategy: Snapshotting<UIViewController, UIImage> {
        var strategy = Snapshotting<UIViewController, UIImage>.image(
            on: device, drawHierarchyInKeyWindow: true, perceptualPrecision: perceptualPrecision
        )
        let libraryDiff = strategy.diffing.diffV2
        strategy.diffing.diffV2 = { old, new in
            CPUImageMatch.matches(old, new, perceptualPrecision: perceptualPrecision) ? nil : libraryDiff(old, new)
        }
        return strategy
    }

    /// Draws the app in every designed state of `screen` and compares each picture with its reference, which is
    /// named for the state. Each state gets a new window in the host app's scene, so the safe areas and the glass
    /// are the real ones. A screen with no designed state fails.
    static func assertStates(ofScreen screen: String, file: StaticString = #filePath, line: UInt = #line) throws {
        let states = DesignedState.allCases.filter { $0.screen == screen }
        if states.isEmpty {
            XCTFail("No designed state belongs to the screen \"\(screen)\"", file: file, line: line)
        }
        guard let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first else {
            throw MissingWindowScene()
        }
        for state in states {
            let window = UIWindow(windowScene: scene)
            defer {
                // Torn down, so windows do not pile up across states.
                window.rootViewController = nil
                window.isHidden = true
            }
            let controller = UIHostingController(rootView: RootScreen(model: state.appModel()))
            window.rootViewController = controller
            window.makeKeyAndVisible()
            settle(window)
            assertSnapshot(
                of: controller,
                as: strategy,
                named: state.rawValue,
                file: file,
                testName: "state",
                line: line
            )
        }
    }
}

extension SnapshotHost {
    /// How far apart two reads of the window's frames are, and how long they may go on differing.
    private static let stillInterval: TimeInterval = 0.25
    private static let stillTimeout: TimeInterval = 5

    /// Runs the main run loop until two reads of every view's frame in a row match: layout and the first commits
    /// are done. Frames, not draws: filing-cabinet found that drawing the window to compare changed how the glass
    /// settled.
    private static func settle(_ window: UIWindow) {
        let deadline = Date(timeIntervalSinceNow: stillTimeout)
        var last = frames(in: window, of: window)
        while Date.now < deadline {
            RunLoop.main.run(until: Date(timeIntervalSinceNow: stillInterval))
            let next = frames(in: window, of: window)
            if next == last { return }
            last = next
        }
    }

    private static func frames(in window: UIWindow, of view: UIView) -> [CGRect] {
        [view.convert(view.bounds, to: window)] + view.subviews.flatMap { frames(in: window, of: $0) }
    }
}

/// The app-hosted test found no window scene in its host app.
struct MissingWindowScene: Error {}
