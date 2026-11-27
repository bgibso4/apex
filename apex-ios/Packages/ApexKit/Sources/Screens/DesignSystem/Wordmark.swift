import CoreText
import OSLog
import SwiftUI
import UIKit

/// The APEX wordmark: the logo mark, which stands for the A, then "PEX" in Exo 2 ExtraBold.
/// Design: APEX README, Type and Screen header. The proportions and the row's height are the Home demo's
/// (`markGap`, `markLs` and `rowH` in design/export/app/home.dc.html).
struct Wordmark: View {
    private static let size = Tokens.Size.wordmark
    /// The gap after the mark and the letters' tracking, as shares of the size.
    private static let gapShare = 0.14
    private static let trackingShare = 0.045
    private static let rowHeight: CGFloat = 52

    /// Exo 2 comes with the module, not the system, so it is registered the first time the wordmark is drawn.
    /// The file is a variable font: ExtraBold is one of its named weights.
    private static let font: Font = {
        let file = Bundle.module.url(forResource: "Exo2-ExtraBold", withExtension: "ttf")
        if file.map({ CTFontManagerRegisterFontsForURL($0 as CFURL, .process, nil) }) != true {
            Logger(subsystem: "com.cadre.apex", category: "Screens").error("The wordmark's font did not register")
        }
        return Font.custom("Exo2-Regular_ExtraBold", fixedSize: size)
    }()

    /// SwiftUI's `Image(_:bundle:)` reads only asset catalogs. The mark is a loose file, so UIKit loads it.
    private static let mark = UIImage(named: "logo-mark", in: .module, with: nil).map(Image.init(uiImage:))

    var body: some View {
        HStack(spacing: (Self.size * Self.gapShare).rounded()) {
            Self.mark?
                .resizable()
                .scaledToFit()
                .frame(height: Self.size)
            Text(verbatim: "PEX")
                .font(Self.font)
                .tracking(Self.size * Self.trackingShare)
                .foregroundStyle(Tokens.Color.text)
        }
        .frame(height: Self.rowHeight)
    }
}
