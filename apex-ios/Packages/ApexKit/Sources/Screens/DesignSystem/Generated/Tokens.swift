// GENERATED · run make generate. Source: design/tokens.json. Do not edit.

import SwiftUI

enum Tokens {
    enum Color {
        static let accent = SwiftUI.Color(
            .sRGB, red: 0x65 / 255, green: 0x9B / 255, blue: 0xC8 / 255, opacity: 1)
        static let accentTint = SwiftUI.Color(
            .sRGB, red: 0x65 / 255, green: 0x9B / 255, blue: 0xC8 / 255, opacity: 0x1A / 255)
        static let border = SwiftUI.Color(
            .sRGB, red: 0x20 / 255, green: 0x23 / 255, blue: 0x2A / 255, opacity: 1)
        static let borderTop = SwiftUI.Color(
            .sRGB, red: 0x2C / 255, green: 0x30 / 255, blue: 0x39 / 255, opacity: 1)
        static let cardBase = SwiftUI.Color(
            .sRGB, red: 0x0E / 255, green: 0x10 / 255, blue: 0x13 / 255, opacity: 1)
        static let cardTop = SwiftUI.Color(
            .sRGB, red: 0x14 / 255, green: 0x16 / 255, blue: 0x1B / 255, opacity: 1)
        static let fieldBase = SwiftUI.Color(
            .sRGB, red: 0x09 / 255, green: 0x0A / 255, blue: 0x0C / 255, opacity: 1)
        static let fieldMid = SwiftUI.Color(
            .sRGB, red: 0x0C / 255, green: 0x0E / 255, blue: 0x11 / 255, opacity: 1)
        static let halo = SwiftUI.Color(
            .sRGB, red: 0x14 / 255, green: 0x1A / 255, blue: 0x22 / 255, opacity: 1)
        static let moss = SwiftUI.Color(
            .sRGB, red: 0x6C / 255, green: 0xA3 / 255, blue: 0x83 / 255, opacity: 1)
        static let mossTint = SwiftUI.Color(
            .sRGB, red: 0x6C / 255, green: 0xA3 / 255, blue: 0x83 / 255, opacity: 0x1A / 255)
        static let onAccent = SwiftUI.Color(
            .sRGB, red: 0x0B / 255, green: 0x0C / 255, blue: 0x0E / 255, opacity: 1)
        static let text = SwiftUI.Color(
            .sRGB, red: 0xED / 255, green: 0xEE / 255, blue: 0xF0 / 255, opacity: 1)
        static let textMuted = SwiftUI.Color(
            .sRGB, red: 0x7C / 255, green: 0x7E / 255, blue: 0x86 / 255, opacity: 1)
        static let textSecondary = SwiftUI.Color(
            .sRGB, red: 0x8F / 255, green: 0x90 / 255, blue: 0x98 / 255, opacity: 1)
        static let tonalFill = SwiftUI.Color(
            .sRGB, red: 0xED / 255, green: 0xEE / 255, blue: 0xF0 / 255, opacity: 0x0F / 255)
    }

    enum Typography {
        static let body = Font.system(size: 11, weight: .regular).monospacedDigit()
        static let button = Font.system(size: 15, weight: .bold).monospacedDigit()
        static let buttonSecondary = Font.system(size: 14, weight: .semibold).monospacedDigit()
        static let cardName = Font.system(size: 14, weight: .bold).monospacedDigit()
        static let eyebrow = Font.system(size: 11, weight: .bold).monospacedDigit()
        static let eyebrowTracking: CGFloat = 0.6
        static let graphBlock = Font.system(size: 9.5, weight: .regular).monospacedDigit()
        static let graphLabel = Font.system(size: 10, weight: .regular).monospacedDigit()
        static let helper = Font.system(size: 12, weight: .medium).monospacedDigit()
        static let heroNumeral = Font.system(size: 34, weight: .heavy).monospacedDigit()
        static let heroNumeralTracking: CGFloat = -0.5
        static let readout = Font.system(size: 24, weight: .heavy).monospacedDigit()
        static let readoutTracking: CGFloat = -0.3
        static let recordLarge = Font.system(size: 30, weight: .heavy).monospacedDigit()
        static let recordLargeTracking: CGFloat = -0.5
        static let recordValue = Font.system(size: 15, weight: .bold).monospacedDigit()
        static let screenTitle = Font.system(size: 17, weight: .bold).monospacedDigit()
        static let tabTitle = Font.system(size: 28, weight: .heavy).monospacedDigit()
        static let tileDay = Font.system(size: 18, weight: .bold).monospacedDigit()
        static let value = Font.system(size: 13, weight: .semibold).monospacedDigit()
    }

    enum Spacing {
        static let cardGap: CGFloat = 12
        static let cardPaddingHorizontal: CGFloat = 16
        static let cardPaddingVertical: CGFloat = 14
        static let screenPadding: CGFloat = 20
        static let sectionGap: CGFloat = 24
        static let sectionLabelGap: CGFloat = 8
    }

    enum Radius {
        static let card: CGFloat = 10
        static let nested: CGFloat = 6
        static let pill: CGFloat = 999
    }

    enum Size {
        static let buttonPrimary: CGFloat = 50
        static let buttonTonal: CGFloat = 44
        static let tapTarget: CGFloat = 44
    }

    enum Motion {
        static let contentSwap = Animation.easeOut(duration: 0.24)
        static let monthFlip = Animation.timingCurve(0.2, 0.8, 0.2, 1, duration: 0.26)
        static let quick = Animation.easeOut(duration: 0.18)
        static let smooth = Animation.spring(duration: 0.35, bounce: 0)
        static let snappy = Animation.spring(duration: 0.3, bounce: 0.15)

        enum Duration {
            static let chartBarStagger: TimeInterval = 0.04
            static let chartBars: TimeInterval = 0.5
            static let numberRoll: TimeInterval = 0.45
            static let tintFade: TimeInterval = 0.6
            static let toastHold: TimeInterval = 3
        }

        enum Distance {
            static let monthFlip: CGFloat = 28
            static let toastRise: CGFloat = 10
        }
    }
}
