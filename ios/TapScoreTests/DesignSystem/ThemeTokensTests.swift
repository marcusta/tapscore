import SwiftUI
import UIKit
import XCTest
@testable import TapScore

/// Spot checks on the generated palette.
///
/// `ThemeTokens.swift` is machine-written from `src/theme.ts`, so these are not
/// tests of hand-typed constants — they are a tripwire on the GENERATOR. If a
/// refactor of `scripts/generate-theme-swift.ts` starts dropping the alpha
/// channel, mixing up the two appearances, or failing to follow a
/// `var(--token)` chain, the load-bearing colours below stop matching the web
/// and this file says so.
///
/// The expected values are copied from `src/theme.ts` by hand ON PURPOSE. A
/// test that derived them the same way the generator does would agree with any
/// bug the generator has.
final class ThemeTokensTests: XCTestCase {
    // MARK: - The identity colours

    func testLightPaletteMatchesTheWebTheme() {
        assertColor(TapColors.bg, .light, "#f2eee2")
        assertColor(TapColors.surface, .light, "#fbf9f1")
        assertColor(TapColors.surfaceSunken, .light, "#e9e4d4")
        assertColor(TapColors.text, .light, "#1e3526")
        assertColor(TapColors.textMuted, .light, "#6b7a6e")
        assertColor(TapColors.border, .light, "#d8d2bf")
        assertColor(TapColors.primary, .light, "#2c5e3f")
        assertColor(TapColors.accent, .light, "#b08d3e")
        assertColor(TapColors.holeBar, .light, "#e6a23f")
        assertColor(TapColors.holeBarText, .light, "#3a2a0d")
        assertColor(TapColors.underPar, .light, "#a0463c")
        assertColor(TapColors.overPar, .light, "#345b8a")
    }

    func testDarkPaletteMatchesTheWebTheme() {
        assertColor(TapColors.bg, .dark, "#15231a")
        assertColor(TapColors.surface, .dark, "#1d2f22")
        assertColor(TapColors.surfaceSunken, .dark, "#101b14")
        assertColor(TapColors.text, .dark, "#e6e1d2")
        assertColor(TapColors.primary, .dark, "#5d9b75")
        assertColor(TapColors.accent, .dark, "#cfa84f")
        assertColor(TapColors.holeBar, .dark, "#c08a35")
        assertColor(TapColors.underPar, .dark, "#d48a82")
        assertColor(TapColors.overPar, .dark, "#8db2e0")
    }

    /// Every colour must actually be dynamic. A generator that emitted the
    /// light value for both appearances would pass the light test above and
    /// leave the app unreadable at night.
    func testColorsFollowTheAppearance() {
        XCTAssertNotEqual(resolve(TapColors.bg, .light), resolve(TapColors.bg, .dark))
        XCTAssertNotEqual(resolve(TapColors.text, .light), resolve(TapColors.text, .dark))
        XCTAssertNotEqual(resolve(TapColors.holeBar, .light), resolve(TapColors.holeBar, .dark))
    }

    // MARK: - Derived tokens

    /// `--btn-primary-bg` is `var(--primary)`; the generator follows that chain
    /// per appearance. Both sides are asserted because a chain resolved against
    /// the wrong map is the exact bug this catches.
    func testControlTokensFollowTheirVarChain() {
        for style in [UIUserInterfaceStyle.light, .dark] {
            XCTAssertEqual(resolve(TapColors.btnPrimaryBg, style), resolve(TapColors.primary, style))
            XCTAssertEqual(resolve(TapColors.btnPrimaryFg, style), resolve(TapColors.primaryText, style))
            XCTAssertEqual(resolve(TapColors.btnSecondaryBg, style), resolve(TapColors.btnBg, style))
            XCTAssertEqual(resolve(TapColors.fieldBg, style), resolve(TapColors.inputBg, style))
        }
    }

    /// `transparent` must survive as a zero-alpha colour, not as black.
    func testGhostButtonBackgroundIsTransparent() {
        XCTAssertEqual(UIColor(TapColors.btnGhostBg).cgColor.alpha, 0, accuracy: 0.001)
    }

    // MARK: - Non-colour tokens

    func testRadiiMatchTheWebTheme() {
        XCTAssertEqual(TapRadius.radius, 12)
        XCTAssertEqual(TapRadius.radiusSm, 6)
        XCTAssertEqual(TapRadius.radiusPill, 999)
        // --radius-md is `var(--radius)`, so it must resolve to 12, not the
        // framework neutral's 8.
        XCTAssertEqual(TapRadius.radiusMd, 12)
    }

    /// `0 1px 2px rgba(30, 53, 38, 0.08)` — CSS blur halved for SwiftUI.
    func testShadowCarriesOffsetBlurAndAlpha() {
        XCTAssertEqual(TapShadows.shadow.x, 0)
        XCTAssertEqual(TapShadows.shadow.y, 1)
        XCTAssertEqual(TapShadows.shadow.radius, 1)
        let light = UIColor(TapShadows.shadow.color)
            .resolvedColor(with: UITraitCollection(userInterfaceStyle: .light))
        XCTAssertEqual(light.cgColor.alpha, 0.08, accuracy: 0.005)
        assertColor(TapShadows.shadow.color, .light, "#1e3526")

        XCTAssertEqual(TapShadows.shadowElevated.y, 4)
        XCTAssertEqual(TapShadows.shadowElevated.radius, 8)
        // `--shadow-1` is `var(--shadow)`; TapCard leans on that equality.
        // Compared componentwise, not with `==`: two dynamic colours built from
        // separate provider closures are never equal to each other even when
        // they resolve identically.
        XCTAssertEqual(TapShadows.shadow1.radius, TapShadows.shadow.radius)
        XCTAssertEqual(TapShadows.shadow1.x, TapShadows.shadow.x)
        XCTAssertEqual(TapShadows.shadow1.y, TapShadows.shadow.y)
        for style in [UIUserInterfaceStyle.light, .dark] {
            XCTAssertEqual(
                resolve(TapShadows.shadow1.color, style),
                resolve(TapShadows.shadow.color, style)
            )
        }
    }

    /// Non-colour tokens follow the appearance too. `--done-opacity` is 0.4
    /// light / 0.35 dark on the web; the generator used to emit the light value
    /// alone, which shipped the day number at night with nothing to say so.
    func testScalarTokensThatDifferFollowTheAppearance() {
        UITraitCollection(userInterfaceStyle: .light).performAsCurrent {
            XCTAssertEqual(TapMetrics.doneOpacity, 0.4, accuracy: 0.0001)
        }
        UITraitCollection(userInterfaceStyle: .dark).performAsCurrent {
            XCTAssertEqual(TapMetrics.doneOpacity, 0.35, accuracy: 0.0001)
        }
    }

    func testDurationsAreSeconds() {
        XCTAssertEqual(TapDurations.durFast, 0.12, accuracy: 0.0001)
        XCTAssertEqual(TapDurations.durBase, 0.2, accuracy: 0.0001)
    }

    // MARK: - Helpers

    private func resolve(_ color: Color, _ style: UIUserInterfaceStyle) -> UIColor {
        UIColor(color).resolvedColor(with: UITraitCollection(userInterfaceStyle: style))
    }

    private func assertColor(
        _ color: Color,
        _ style: UIUserInterfaceStyle,
        _ expected: String,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        XCTAssertEqual(hex(resolve(color, style)), expected.lowercased(), file: file, line: line)
    }

    private func hex(_ color: UIColor) -> String {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        color.getRed(&r, green: &g, blue: &b, alpha: &a)
        return String(format: "#%02x%02x%02x", Int(round(r * 255)), Int(round(g * 255)), Int(round(b * 255)))
    }
}
