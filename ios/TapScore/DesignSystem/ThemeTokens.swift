// GENERATED — DO NOT EDIT.
//
// Source of truth: ../../../src/theme.ts (the web client's "Clubhouse
// scorecard" theme). Regenerate with `bun run generate:theme` from the repo
// root, and commit the result alongside the theme change that caused it.
// Generator: scripts/generate-theme-swift.ts
//
// Every colour is DYNAMIC: it resolves through the trait collection, so the app
// follows the system appearance the same way `[data-theme]` follows
// `prefers-color-scheme` on the web. Token names mirror the web's, with the
// original `--kebab-case` name in each doc comment so drift is greppable.
//
// Tokens with no native meaning are intentionally absent:
// --font-display, --font-ui, --ease-standard, --btn-primary-shadow, --btn-secondary-shadow, --btn-ghost-shadow, --btn-danger-shadow.

import SwiftUI
import UIKit

/// The web theme's token tables, as SwiftUI values.
enum ThemeTokens {
    /// A CSS `box-shadow` expressed for `View.shadow(color:radius:x:y:)`.
    ///
    /// CSS blur is roughly twice SwiftUI's Gaussian radius, so `radius` is the
    /// CSS blur halved; `x` / `y` carry over unchanged.
    struct Shadow: Equatable, Sendable {
        let color: Color
        let radius: CGFloat
        let x: CGFloat
        let y: CGFloat
    }

    /// Colour tokens.
    enum Colors {
        /// Web token: `--primary`
        static let primary = dynamicColor(
            light: 0x2c5e3f, lightAlpha: 1,
            dark: 0x5d9b75, darkAlpha: 1
        )

        /// Web token: `--primary-text`
        static let primaryText = dynamicColor(
            light: 0xf7f4ea, lightAlpha: 1,
            dark: 0x0f1a13, darkAlpha: 1
        )

        /// Web token: `--btn-bg`
        static let btnBg = dynamicColor(
            light: 0xfbf9f1, lightAlpha: 1,
            dark: 0x24392b, darkAlpha: 1
        )

        /// Web token: `--btn-hover`
        static let btnHover = dynamicColor(
            light: 0xefeada, lightAlpha: 1,
            dark: 0x2e4836, darkAlpha: 1
        )

        /// Web token: `--input-bg`
        static let inputBg = dynamicColor(
            light: 0xffffff, lightAlpha: 1,
            dark: 0x101b14, darkAlpha: 1
        )

        /// Web token: `--topbar-bg`
        static let topbarBg = dynamicColor(
            light: 0x1e3526, lightAlpha: 1,
            dark: 0x0f1a13, darkAlpha: 1
        )

        /// Web token: `--topbar-logo`
        static let topbarLogo = dynamicColor(
            light: 0x6b7a6e, lightAlpha: 1,
            dark: 0x8da093, darkAlpha: 1
        )

        /// Web token: `--active-bg`
        static let activeBg = dynamicColor(
            light: 0x1e3526, lightAlpha: 1,
            dark: 0x5d9b75, darkAlpha: 1
        )

        /// Web token: `--active-text`
        static let activeText = dynamicColor(
            light: 0xf7f4ea, lightAlpha: 1,
            dark: 0x0f1a13, darkAlpha: 1
        )

        /// Web token: `--hover-bg`
        static let hoverBg = dynamicColor(
            light: 0xece7d7, lightAlpha: 1,
            dark: 0x273c2e, darkAlpha: 1
        )

        /// Web token: `--error`
        static let error = dynamicColor(
            light: 0xa0463c, lightAlpha: 1,
            dark: 0xd48a82, darkAlpha: 1
        )

        /// Web token: `--field-bg`
        static let fieldBg = dynamicColor(
            light: 0xffffff, lightAlpha: 1,
            dark: 0x101b14, darkAlpha: 1
        )

        /// Web token: `--field-bg-focus`
        static let fieldBgFocus = dynamicColor(
            light: 0xffffff, lightAlpha: 1,
            dark: 0x101b14, darkAlpha: 1
        )

        /// Web token: `--field-border`
        static let fieldBorder = dynamicColor(
            light: 0xd8d2bf, lightAlpha: 1,
            dark: 0x33493a, darkAlpha: 1
        )

        /// Web token: `--field-rule`
        static let fieldRule = dynamicColor(
            light: 0xd8d2bf, lightAlpha: 1,
            dark: 0x33493a, darkAlpha: 1
        )

        /// Web token: `--field-focus-border`
        static let fieldFocusBorder = dynamicColor(
            light: 0x2c5e3f, lightAlpha: 1,
            dark: 0x5d9b75, darkAlpha: 1
        )

        /// Web token: `--field-focus-ring`
        static let fieldFocusRing = dynamicColor(
            light: 0xf0e6cd, lightAlpha: 1,
            dark: 0x3a3320, darkAlpha: 1
        )

        /// Web token: `--field-invalid-border`
        static let fieldInvalidBorder = dynamicColor(
            light: 0xa0463c, lightAlpha: 1,
            dark: 0xd48a82, darkAlpha: 1
        )

        /// Web token: `--field-invalid-rule`
        static let fieldInvalidRule = dynamicColor(
            light: 0xa0463c, lightAlpha: 1,
            dark: 0xd48a82, darkAlpha: 1
        )

        /// Web token: `--field-invalid-ring`
        static let fieldInvalidRing = dynamicColor(
            light: 0xfff5f5, lightAlpha: 1,
            dark: 0x331f1f, darkAlpha: 1
        )

        /// Web token: `--btn-focus-ring`
        static let btnFocusRing = dynamicColor(
            light: 0xf0e6cd, lightAlpha: 1,
            dark: 0x3a3320, darkAlpha: 1
        )

        /// Web token: `--btn-primary-bg`
        static let btnPrimaryBg = dynamicColor(
            light: 0x2c5e3f, lightAlpha: 1,
            dark: 0x5d9b75, darkAlpha: 1
        )

        /// Web token: `--btn-primary-fg`
        static let btnPrimaryFg = dynamicColor(
            light: 0xf7f4ea, lightAlpha: 1,
            dark: 0x0f1a13, darkAlpha: 1
        )

        /// Web token: `--btn-primary-border`
        static let btnPrimaryBorder = dynamicColor(
            light: 0x2c5e3f, lightAlpha: 1,
            dark: 0x5d9b75, darkAlpha: 1
        )

        /// Web token: `--btn-primary-bg-hover`
        static let btnPrimaryBgHover = dynamicColor(
            light: 0x2c5e3f, lightAlpha: 1,
            dark: 0x5d9b75, darkAlpha: 1
        )

        /// Web token: `--btn-primary-fg-hover`
        static let btnPrimaryFgHover = dynamicColor(
            light: 0xf7f4ea, lightAlpha: 1,
            dark: 0x0f1a13, darkAlpha: 1
        )

        /// Web token: `--btn-primary-border-hover`
        static let btnPrimaryBorderHover = dynamicColor(
            light: 0x2c5e3f, lightAlpha: 1,
            dark: 0x5d9b75, darkAlpha: 1
        )

        /// Web token: `--btn-secondary-bg`
        static let btnSecondaryBg = dynamicColor(
            light: 0xfbf9f1, lightAlpha: 1,
            dark: 0x24392b, darkAlpha: 1
        )

        /// Web token: `--btn-secondary-fg`
        static let btnSecondaryFg = dynamicColor(
            light: 0x1e3526, lightAlpha: 1,
            dark: 0xe6e1d2, darkAlpha: 1
        )

        /// Web token: `--btn-secondary-border`
        static let btnSecondaryBorder = dynamicColor(
            light: 0xd8d2bf, lightAlpha: 1,
            dark: 0x33493a, darkAlpha: 1
        )

        /// Web token: `--btn-secondary-bg-hover`
        static let btnSecondaryBgHover = dynamicColor(
            light: 0xefeada, lightAlpha: 1,
            dark: 0x2e4836, darkAlpha: 1
        )

        /// Web token: `--btn-secondary-fg-hover`
        static let btnSecondaryFgHover = dynamicColor(
            light: 0x1e3526, lightAlpha: 1,
            dark: 0xe6e1d2, darkAlpha: 1
        )

        /// Web token: `--btn-secondary-border-hover`
        static let btnSecondaryBorderHover = dynamicColor(
            light: 0xb3ab92, lightAlpha: 1,
            dark: 0x4d6653, darkAlpha: 1
        )

        /// Web token: `--btn-ghost-bg` —  (identical in both appearances)
        static let btnGhostBg = dynamicColor(
            light: 0x000000, lightAlpha: 0,
            dark: 0x000000, darkAlpha: 0
        )

        /// Web token: `--btn-ghost-fg`
        static let btnGhostFg = dynamicColor(
            light: 0x6b7a6e, lightAlpha: 1,
            dark: 0x8da093, darkAlpha: 1
        )

        /// Web token: `--btn-ghost-border` —  (identical in both appearances)
        static let btnGhostBorder = dynamicColor(
            light: 0x000000, lightAlpha: 0,
            dark: 0x000000, darkAlpha: 0
        )

        /// Web token: `--btn-ghost-bg-hover`
        static let btnGhostBgHover = dynamicColor(
            light: 0xece7d7, lightAlpha: 1,
            dark: 0x273c2e, darkAlpha: 1
        )

        /// Web token: `--btn-ghost-fg-hover`
        static let btnGhostFgHover = dynamicColor(
            light: 0x1e3526, lightAlpha: 1,
            dark: 0xe6e1d2, darkAlpha: 1
        )

        /// Web token: `--btn-ghost-border-hover` —  (identical in both appearances)
        static let btnGhostBorderHover = dynamicColor(
            light: 0x000000, lightAlpha: 0,
            dark: 0x000000, darkAlpha: 0
        )

        /// Web token: `--btn-danger-bg`
        static let btnDangerBg = dynamicColor(
            light: 0xa0463c, lightAlpha: 1,
            dark: 0xd48a82, darkAlpha: 1
        )

        /// Web token: `--btn-danger-fg`
        static let btnDangerFg = dynamicColor(
            light: 0xf7f4ea, lightAlpha: 1,
            dark: 0x15231a, darkAlpha: 1
        )

        /// Web token: `--btn-danger-border`
        static let btnDangerBorder = dynamicColor(
            light: 0xa0463c, lightAlpha: 1,
            dark: 0xd48a82, darkAlpha: 1
        )

        /// Web token: `--btn-danger-bg-hover`
        static let btnDangerBgHover = dynamicColor(
            light: 0x7f352d, lightAlpha: 1,
            dark: 0xe0a49d, darkAlpha: 1
        )

        /// Web token: `--btn-danger-fg-hover`
        static let btnDangerFgHover = dynamicColor(
            light: 0xf7f4ea, lightAlpha: 1,
            dark: 0x15231a, darkAlpha: 1
        )

        /// Web token: `--btn-danger-border-hover`
        static let btnDangerBorderHover = dynamicColor(
            light: 0x7f352d, lightAlpha: 1,
            dark: 0xe0a49d, darkAlpha: 1
        )

        /// Web token: `--btn-disabled-bg`
        static let btnDisabledBg = dynamicColor(
            light: 0xfbf9f1, lightAlpha: 1,
            dark: 0x24392b, darkAlpha: 1
        )

        /// Web token: `--btn-disabled-fg`
        static let btnDisabledFg = dynamicColor(
            light: 0x6b7a6e, lightAlpha: 1,
            dark: 0x8da093, darkAlpha: 1
        )

        /// Web token: `--btn-disabled-border`
        static let btnDisabledBorder = dynamicColor(
            light: 0xd8d2bf, lightAlpha: 1,
            dark: 0x33493a, darkAlpha: 1
        )

        /// Web token: `--bg`
        static let bg = dynamicColor(
            light: 0xf2eee2, lightAlpha: 1,
            dark: 0x15231a, darkAlpha: 1
        )

        /// Web token: `--surface`
        static let surface = dynamicColor(
            light: 0xfbf9f1, lightAlpha: 1,
            dark: 0x1d2f22, darkAlpha: 1
        )

        /// Web token: `--surface-2`
        static let surface2 = dynamicColor(
            light: 0xe9e4d4, lightAlpha: 1,
            dark: 0x101b14, darkAlpha: 1
        )

        /// Web token: `--text`
        static let text = dynamicColor(
            light: 0x1e3526, lightAlpha: 1,
            dark: 0xe6e1d2, darkAlpha: 1
        )

        /// Web token: `--text-muted`
        static let textMuted = dynamicColor(
            light: 0x6b7a6e, lightAlpha: 1,
            dark: 0x8da093, darkAlpha: 1
        )

        /// Web token: `--border`
        static let border = dynamicColor(
            light: 0xd8d2bf, lightAlpha: 1,
            dark: 0x33493a, darkAlpha: 1
        )

        /// Web token: `--border-strong`
        static let borderStrong = dynamicColor(
            light: 0xb3ab92, lightAlpha: 1,
            dark: 0x4d6653, darkAlpha: 1
        )

        /// Web token: `--accent`
        static let accent = dynamicColor(
            light: 0xb08d3e, lightAlpha: 1,
            dark: 0xcfa84f, darkAlpha: 1
        )

        /// Web token: `--accent-strong`
        static let accentStrong = dynamicColor(
            light: 0x2c5e3f, lightAlpha: 1,
            dark: 0x5d9b75, darkAlpha: 1
        )

        /// Web token: `--accent-soft`
        static let accentSoft = dynamicColor(
            light: 0xf0e6cd, lightAlpha: 1,
            dark: 0x3a3320, darkAlpha: 1
        )

        /// Web token: `--on-accent`
        static let onAccent = dynamicColor(
            light: 0xf7f4ea, lightAlpha: 1,
            dark: 0x0f1a13, darkAlpha: 1
        )

        /// Web token: `--success`
        static let success = dynamicColor(
            light: 0x217a36, lightAlpha: 1,
            dark: 0x69db7c, darkAlpha: 1
        )

        /// Web token: `--success-soft`
        static let successSoft = dynamicColor(
            light: 0xebfbee, lightAlpha: 1,
            dark: 0x17301e, darkAlpha: 1
        )

        /// Web token: `--warning`
        static let warning = dynamicColor(
            light: 0xa85400, lightAlpha: 1,
            dark: 0xffa94d, darkAlpha: 1
        )

        /// Web token: `--warning-soft`
        static let warningSoft = dynamicColor(
            light: 0xfff4e6, lightAlpha: 1,
            dark: 0x33260f, darkAlpha: 1
        )

        /// Web token: `--danger`
        static let danger = dynamicColor(
            light: 0xa0463c, lightAlpha: 1,
            dark: 0xd48a82, darkAlpha: 1
        )

        /// Web token: `--danger-strong`
        static let dangerStrong = dynamicColor(
            light: 0x7f352d, lightAlpha: 1,
            dark: 0xe0a49d, darkAlpha: 1
        )

        /// Web token: `--danger-soft`
        static let dangerSoft = dynamicColor(
            light: 0xfff5f5, lightAlpha: 1,
            dark: 0x331f1f, darkAlpha: 1
        )

        /// Web token: `--on-danger`
        static let onDanger = dynamicColor(
            light: 0xf7f4ea, lightAlpha: 1,
            dark: 0x15231a, darkAlpha: 1
        )

        /// Web token: `--info`
        static let info = dynamicColor(
            light: 0x1864ab, lightAlpha: 1,
            dark: 0x74c0fc, darkAlpha: 1
        )

        /// Web token: `--info-soft`
        static let infoSoft = dynamicColor(
            light: 0xe7f5ff, lightAlpha: 1,
            dark: 0x17242f, darkAlpha: 1
        )

        /// Web token: `--surface-sunken`
        static let surfaceSunken = dynamicColor(
            light: 0xe9e4d4, lightAlpha: 1,
            dark: 0x101b14, darkAlpha: 1
        )

        /// Web token: `--under-par`
        static let underPar = dynamicColor(
            light: 0xa0463c, lightAlpha: 1,
            dark: 0xd48a82, darkAlpha: 1
        )

        /// Web token: `--over-par`
        static let overPar = dynamicColor(
            light: 0x345b8a, lightAlpha: 1,
            dark: 0x8db2e0, darkAlpha: 1
        )

        /// Web token: `--hole-bar`
        static let holeBar = dynamicColor(
            light: 0xe6a23f, lightAlpha: 1,
            dark: 0xc08a35, darkAlpha: 1
        )

        /// Web token: `--hole-bar-text`
        static let holeBarText = dynamicColor(
            light: 0x3a2a0d, lightAlpha: 1,
            dark: 0x160f04, darkAlpha: 1
        )
    }

    /// Corner radii.
    enum Radius {
        /// Web token: `--radius-sm`
        static let radiusSm: CGFloat = 6

        /// Web token: `--radius-md`
        static let radiusMd: CGFloat = 12

        /// Web token: `--radius-pill`
        static let radiusPill: CGFloat = 999

        /// Web token: `--radius`
        static let radius: CGFloat = 12

        /// Web token: `--field-radius`
        static let fieldRadius: CGFloat = 12

        /// Web token: `--btn-radius`
        static let btnRadius: CGFloat = 12
    }

    /// Non-radius lengths, weights and opacities.
    enum Metrics {
        /// Web token: `--space-1`
        static let space1: CGFloat = 4

        /// Web token: `--space-2`
        static let space2: CGFloat = 8

        /// Web token: `--space-3`
        static let space3: CGFloat = 12

        /// Web token: `--space-4`
        static let space4: CGFloat = 16

        /// Web token: `--space-5`
        static let space5: CGFloat = 24

        /// Web token: `--space-6`
        static let space6: CGFloat = 32

        /// Web token: `--space-7`
        static let space7: CGFloat = 48

        /// Web token: `--space-8`
        static let space8: CGFloat = 64

        /// Web token: `--done-opacity`
        static var doneOpacity: Double { dynamicScalar(light: 0.4, dark: 0.35) }

        /// Web token: `--field-border-width`
        static let fieldBorderWidth: CGFloat = 1

        /// Web token: `--field-rule-width`
        static let fieldRuleWidth: CGFloat = 0

        /// Web token: `--field-padding-y`
        static let fieldPaddingY: CGFloat = 8

        /// Web token: `--field-padding-x`
        static let fieldPaddingX: CGFloat = 10

        /// Web token: `--field-font-size`
        static let fieldFontSize: CGFloat = 14

        /// Web token: `--field-line-height`
        static let fieldLineHeight: CGFloat = 21

        /// Web token: `--field-focus-ring-width`
        static let fieldFocusRingWidth: CGFloat = 3

        /// Web token: `--btn-border-width`
        static let btnBorderWidth: CGFloat = 1

        /// Web token: `--btn-padding-y`
        static let btnPaddingY: CGFloat = 8

        /// Web token: `--btn-padding-x`
        static let btnPaddingX: CGFloat = 16

        /// Web token: `--btn-font-size`
        static let btnFontSize: CGFloat = 14

        /// Web token: `--btn-line-height`
        static let btnLineHeight: CGFloat = 20

        /// Web token: `--btn-font-weight`
        static let btnFontWeight: Double = 500

        /// Web token: `--btn-focus-ring-width`
        static let btnFocusRingWidth: CGFloat = 3

        /// Web token: `--btn-disabled-opacity`
        static let btnDisabledOpacity: Double = 0.7
    }

    /// Transition durations, in seconds.
    enum Durations {
        /// Web token: `--dur-fast`
        static let durFast: Double = 0.12

        /// Web token: `--dur-base`
        static let durBase: Double = 0.2

        /// Web token: `--dur-slow`
        static let durSlow: Double = 0.32
    }

    /// Elevation.
    enum Shadows {
        /// Web token: `--shadow`
        static let shadow = Shadow(
            color: dynamicColor(light: 0x1e3526, lightAlpha: 0.08, dark: 0x000000, darkAlpha: 0.3),
            radius: 1,
            x: 0,
            y: 1
        )

        /// Web token: `--shadow-elevated`
        static let shadowElevated = Shadow(
            color: dynamicColor(light: 0x1e3526, lightAlpha: 0.14, dark: 0x000000, darkAlpha: 0.4),
            radius: 8,
            x: 0,
            y: 4
        )

        /// Web token: `--shadow-1`
        static let shadow1 = Shadow(
            color: dynamicColor(light: 0x1e3526, lightAlpha: 0.08, dark: 0x000000, darkAlpha: 0.3),
            radius: 1,
            x: 0,
            y: 1
        )

        /// Web token: `--shadow-2`
        static let shadow2 = Shadow(
            color: dynamicColor(light: 0x1e3526, lightAlpha: 0.14, dark: 0x000000, darkAlpha: 0.4),
            radius: 8,
            x: 0,
            y: 4
        )

        /// Web token: `--shadow-3`
        static let shadow3 = Shadow(
            color: dynamicColor(light: 0x1e3526, lightAlpha: 0.14, dark: 0x000000, darkAlpha: 0.4),
            radius: 8,
            x: 0,
            y: 4
        )
    }
}

/// Short spellings used throughout `DesignSystem/` and the feature screens.
typealias TapColors = ThemeTokens.Colors
typealias TapRadius = ThemeTokens.Radius
typealias TapMetrics = ThemeTokens.Metrics
typealias TapDurations = ThemeTokens.Durations
typealias TapShadows = ThemeTokens.Shadows

/// Build a colour that resolves per appearance.
///
/// `UIColor(dynamicProvider:)` rather than an asset catalog: the values are
/// generated, and a generated `.xcassets` tree is far harder to review than a
/// generated Swift file.
private func dynamicColor(
    light: UInt32,
    lightAlpha: Double = 1,
    dark: UInt32,
    darkAlpha: Double = 1
) -> Color {
    Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(rgb: dark, alpha: darkAlpha)
            : UIColor(rgb: light, alpha: lightAlpha)
    })
}

/// Resolve a NON-colour token that differs between the two appearances.
///
/// Colours get `UIColor(dynamicProvider:)`, which UIKit re-resolves whenever the
/// trait collection changes. A bare `Double` has no such hook, so the value is
/// read from `UITraitCollection.current` at the point of use — which SwiftUI
/// sets while it evaluates a view's `body`, so a token read inside a body
/// follows the appearance the same way a colour does.
///
/// Read it in a `body` (or anywhere else with a live trait environment). Read
/// from a background thread or at static-initialiser time it falls back to the
/// light value, which is the same behaviour the previous light-only constants
/// had — never worse, and correct wherever it matters.
private func dynamicScalar(light: Double, dark: Double) -> Double {
    UITraitCollection.current.userInterfaceStyle == .dark ? dark : light
}

private extension UIColor {
    convenience init(rgb: UInt32, alpha: Double) {
        self.init(
            red: CGFloat((rgb >> 16) & 0xff) / 255,
            green: CGFloat((rgb >> 8) & 0xff) / 255,
            blue: CGFloat(rgb & 0xff) / 255,
            alpha: CGFloat(alpha)
        )
    }
}
