import SwiftUI
import UIKit

/// The web client's type pair, as SwiftUI fonts.
///
/// Source: `index.html` — Fraunces (display serif) for headings, hole numbers,
/// player names and scores; Archivo (UI sans) as the body default at weights
/// 400–800. The web loads the variable families from Google Fonts; the app
/// bundles static TTFs (`Resources/Fonts/`, registered via `UIAppFonts` in
/// `Info.plist`) because a scorecard has to render on a course with no signal.
///
/// **The weight enums are the guard rail.** Only the eight faces actually in
/// the bundle can be named, so "the app quietly fell back to San Francisco"
/// cannot happen by asking for a weight that was never shipped. `TapFontTests`
/// covers the other half — that each named face resolves at runtime.
///
/// Sizes are in points and map 1:1 from the web's `rem` at the 16px root
/// (`0.85rem` → `13.6`). `Font.custom(_:size:)` still scales with Dynamic Type
/// relative to `.body`, so the fixed numbers are a starting size, not a cap.
enum TapFont {
    /// Fraunces — the display serif. The web ships 400/600/700 of it.
    enum DisplayWeight: String {
        case regular = "Fraunces-Regular"
        case semibold = "Fraunces-SemiBold"
        case bold = "Fraunces-Bold"
    }

    /// Archivo — the UI sans. The web ships 400/500/600/700/800.
    enum UIWeight: String {
        case regular = "Archivo-Regular"
        case medium = "Archivo-Medium"
        case semibold = "Archivo-SemiBold"
        case bold = "Archivo-Bold"
        case extraBold = "Archivo-ExtraBold"
    }

    /// Every PostScript name the app expects to be registered. `TapFontTests`
    /// walks this, so adding a face without shipping its TTF fails a test
    /// rather than silently degrading to the system font.
    static let bundledFaceNames: [String] =
        DisplayWeight.allNames + UIWeight.allNames

    /// Display serif (Fraunces).
    ///
    /// `tabular` defaults to **false**: headings are prose. Numbers that sit in
    /// a column — scores, totals, the hole bar's values — pass `true`, which is
    /// where the web's `font-variant-numeric: tabular-nums` is load-bearing.
    static func display(
        size: CGFloat,
        weight: DisplayWeight = .semibold,
        tabular: Bool = false
    ) -> Font {
        font(weight.rawValue, size: size, tabular: tabular)
    }

    /// UI sans (Archivo).
    ///
    /// `tabular` defaults to **true**, mirroring `index.html`, which sets
    /// `font-variant-numeric: tabular-nums` on `body` — so on the web every
    /// number in the UI face is already tabular unless something overrides it.
    static func ui(
        size: CGFloat,
        weight: UIWeight = .regular,
        tabular: Bool = true
    ) -> Font {
        font(weight.rawValue, size: size, tabular: tabular)
    }

    /// The `UIFont` behind a face, for the places SwiftUI cannot reach
    /// (UIKit-hosted text) and for tests that assert registration.
    ///
    /// Returns nil when the face is not registered — deliberately, so a caller
    /// that cares can notice. `Font.custom` has no such signal: it substitutes
    /// silently, which is exactly the failure this app must not ship.
    static func uiFont(_ name: String, size: CGFloat) -> UIFont? {
        UIFont(name: name, size: size)
    }

    private static func font(_ name: String, size: CGFloat, tabular: Bool) -> Font {
        let base = Font.custom(name, size: size)
        // Best-effort: `monospacedDigit()` applies the font's own tabular
        // figures when it has them. It is not a promise the way a monospaced
        // family would be, which is why layouts here also reserve column
        // widths rather than trusting digit metrics alone.
        return tabular ? base.monospacedDigit() : base
    }
}

extension TapFont.DisplayWeight: CaseIterable {
    static var allNames: [String] { allCases.map(\.rawValue) }
}

extension TapFont.UIWeight: CaseIterable {
    static var allNames: [String] { allCases.map(\.rawValue) }
}
