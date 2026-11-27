import SnapshotTesting
import UIKit
import XCTest

@MainActor
final class CPUImageMatchTests: XCTestCase {
    private static let precision: Float = 0.98

    func testIdenticalImagesMatch() {
        let image = Self.image(fill: 128)
        XCTAssertTrue(CPUImageMatch.matches(image, image, perceptualPrecision: Self.precision))
    }

    func testOneLevelOffOnOnePixelMatches() {
        let old = Self.image(fill: 128)
        let new = Self.image(fill: 128, oddPixel: 129)
        XCTAssertTrue(CPUImageMatch.matches(old, new, perceptualPrecision: Self.precision))
    }

    func testAVisibleChangeOnOnePixelFails() {
        // Grey 128 to 138 is a CIE76 delta E of about 4: over the threshold of 2 for precision 0.98.
        let old = Self.image(fill: 128)
        let new = Self.image(fill: 128, oddPixel: 138)
        XCTAssertFalse(CPUImageMatch.matches(old, new, perceptualPrecision: Self.precision))
    }

    func testDifferentSizesFail() {
        let old = Self.image(fill: 128, side: 4)
        let new = Self.image(fill: 128, side: 5)
        XCTAssertFalse(CPUImageMatch.matches(old, new, perceptualPrecision: Self.precision))
    }

    func testExactPrecisionRejectsAnyDifference() {
        let old = Self.image(fill: 128)
        let new = Self.image(fill: 128, oddPixel: 129)
        XCTAssertFalse(CPUImageMatch.matches(old, new, perceptualPrecision: 1))
    }

    /// The strategy checks `CPUImageMatch` first; what that rejects must still reach the library and fail.
    func testTheStrategyStillReportsAVisibleChange() {
        let diff = SnapshotHost.strategy.diffing.diffV2
        XCTAssertNotNil(diff(Self.image(fill: 255), Self.image(fill: 255, oddPixel: 0)))
    }

    /// A square grey image at scale 1 in standard range, with an optional differing pixel at (1, 1).
    private static func image(fill: CGFloat, oddPixel: CGFloat? = nil, side: Int = 4) -> UIImage {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.preferredRange = .standard
        let size = CGSize(width: side, height: side)
        return UIGraphicsImageRenderer(size: size, format: format).image { context in
            UIColor(white: fill / 255, alpha: 1).setFill()
            context.fill(CGRect(origin: .zero, size: size))
            if let oddPixel {
                UIColor(white: oddPixel / 255, alpha: 1).setFill()
                context.fill(CGRect(x: 1, y: 1, width: 1, height: 1))
            }
        }
    }
}
