import SwiftUI
import UIKit
import XCTest
@testable import TapScore

/// Construction + pure-logic cover for the design-system primitives.
///
/// SwiftUI bodies are not asserted pixel by pixel here — the screenshot pass
/// over `-tapscoreGallery` is what reviews the pixels. What these tests protect
/// is that the gallery can be BUILT at all (a crash there kills the screenshot
/// pass silently) and that the one piece of real logic in the layer — the
/// par-relation thresholds — matches the server vocabulary it mirrors.
final class DesignSystemViewTests: XCTestCase {
    func testGalleryConstructs() {
        _ = DesignGalleryView().body
    }

    func testPrimitivesConstruct() {
        _ = TapChip(title: "Stableford", isSelected: true).body
        _ = TapCard { Text("card") }.body
        _ = LiveBadge().body
        _ = StatusChip(status: .complete).body
        _ = SectionHeader(title: "Ongoing", count: "3").body
        _ = HoleBar(hole: 1, par: 4, strokeIndex: nil).body
        _ = ScoreCircle(state: .score(4)).body
        _ = BottomTabBar(
            tabs: [.init(0, title: "Score", systemImage: "pencil.line")],
            selection: .constant(0)
        ).body
    }

    // MARK: - Disabled buttons

    /// A custom `ButtonStyle` gets NO automatic dimming from SwiftUI, so
    /// `.disabled(true)` on a `TapButtonStyle` button rendered pixel-identical
    /// to an enabled one until the style started reading `\.isEnabled`. Render
    /// both and require the pixels to differ — the assertion the token checks
    /// below cannot make, because a style that simply ignores the tokens passes
    /// those.
    @MainActor
    func testDisabledButtonRendersDifferentlyFromEnabled() {
        let enabled = render(Button("Save") {}.buttonStyle(.tapSecondary))
        let disabled = render(Button("Save") {}.buttonStyle(.tapSecondary).disabled(true))
        XCTAssertNotEqual(
            enabled, disabled,
            "a disabled TapButton must not be pixel-identical to an enabled one"
        )
    }

    /// What the web's `disabledSkin` actually changes, in both appearances.
    /// The BACKGROUND is deliberately not asserted: `--btn-disabled-bg` and
    /// `--btn-secondary-bg` are the same paper colour, which is exactly why the
    /// muted ink and the sub-1 opacity are what carry the state.
    func testDisabledSkinIsDistinctFromTheSecondaryTier() {
        for style in [UIUserInterfaceStyle.light, .dark] {
            XCTAssertNotEqual(
                resolve(TapColors.btnDisabledFg, style),
                resolve(TapColors.btnSecondaryFg, style)
            )
        }
        XCTAssertLessThan(TapMetrics.btnDisabledOpacity, 1)
    }

    // MARK: - Launch switch

    func testGalleryLaunchArgument() {
        XCTAssertTrue(LaunchGallery.enabled(arguments: ["app", "-tapscoreGallery"], environment: [:]))
        XCTAssertTrue(LaunchGallery.enabled(arguments: ["app", "-tapscoreGallery", "YES"], environment: [:]))
        XCTAssertFalse(LaunchGallery.enabled(arguments: ["app", "-tapscoreGallery", "NO"], environment: [:]))
        XCTAssertFalse(LaunchGallery.enabled(arguments: ["app"], environment: [:]))
        XCTAssertTrue(LaunchGallery.enabled(arguments: ["app"], environment: ["TAPSCORE_GALLERY": "1"]))
        XCTAssertFalse(LaunchGallery.enabled(arguments: ["app"], environment: ["TAPSCORE_GALLERY": "false"]))
    }

    // MARK: - Par relation

    /// Mirrors `scoreToParMarker()` in
    /// `server/domain/strategies/result-vocabulary.ts`, branch for branch.
    func testMarkerThresholds() {
        XCTAssertEqual(ScoreMarkerForm.forScore(strokes: 1, par: 4), .diamond, "hole in one")
        XCTAssertEqual(ScoreMarkerForm.forScore(strokes: 1, par: 5), .diamond, "albatross")
        XCTAssertEqual(ScoreMarkerForm.forScore(strokes: 2, par: 4), .doubleRing, "eagle")
        XCTAssertEqual(ScoreMarkerForm.forScore(strokes: 3, par: 4), .ring, "birdie")
        XCTAssertNil(ScoreMarkerForm.forScore(strokes: 4, par: 4), "level par draws nothing")
        XCTAssertEqual(ScoreMarkerForm.forScore(strokes: 5, par: 4), .square, "bogey")
        XCTAssertEqual(ScoreMarkerForm.forScore(strokes: 6, par: 4), .doubleSquare)
        XCTAssertEqual(ScoreMarkerForm.forScore(strokes: 7, par: 4), .boxBadge)
        XCTAssertEqual(ScoreMarkerForm.forScore(strokes: 9, par: 4), .boxBadge)
    }

    /// A NET 1 is not a hole in one — it classifies by its diff to par.
    func testNetOneIsNotAHoleInOne() {
        XCTAssertEqual(
            ScoreMarkerForm.forScore(strokes: 1, par: 3, isGross: false),
            .doubleRing,
            "net 1 on a par 3 is a two-under relation, not a diamond"
        )
    }

    func testNoMarkerWithoutARealStrokeCount() {
        XCTAssertNil(ScoreMarkerForm.forScore(strokes: nil, par: 4))
        XCTAssertNil(ScoreMarkerForm.forScore(strokes: 4, par: nil))
        XCTAssertNil(ScoreMarkerForm.forScore(strokes: 0, par: 4))
        XCTAssertNil(ScoreMarkerForm.forScore(strokes: -2, par: 4))
    }

    /// Web: `toParText` in `score-entry.component.ts` — "E", "-3", "+4".
    func testToParFormatting() {
        XCTAssertEqual(ParDirection(toPar: 0).formatted(toPar: 0), "E")
        XCTAssertEqual(ParDirection(toPar: -3).formatted(toPar: -3), "-3")
        XCTAssertEqual(ParDirection(toPar: 4).formatted(toPar: 4), "+4")
    }

    func testOnlyNegativeRelationsAreBoxy() {
        XCTAssertEqual(
            Set(ScoreMarkerForm.allCases.filter(\.isBoxy)),
            [.square, .doubleSquare, .boxBadge]
        )
    }

    // MARK: - Helpers

    private func resolve(_ color: Color, _ style: UIUserInterfaceStyle) -> UIColor {
        UIColor(color).resolvedColor(with: UITraitCollection(userInterfaceStyle: style))
    }

    /// Rasterise a view off-screen. Used only to compare two renders of the
    /// same view for difference — never to pin an exact image, so no reference
    /// PNG is checked in and nothing here breaks on a palette change.
    @MainActor
    private func render(_ view: some View) -> Data? {
        let renderer = ImageRenderer(content: view.frame(width: 200, height: 60))
        renderer.scale = 2
        let data = renderer.uiImage?.pngData()
        XCTAssertNotNil(data, "ImageRenderer produced nothing")
        return data
    }
}
