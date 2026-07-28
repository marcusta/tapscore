import SwiftUI
import XCTest
@testable import TapScore

// The scorecard card's PRESENTATION contract, against the web adapter
// (`src/round/result-render.ts`) — the canonical composition for a
// client-facing renderer. Three things are pinned here, all of which the native
// card got wrong before:
//
//   1. one stacked table block PER COLUMN GROUP, each with its own subtotal
//      column and no whole-card TOT (the adapter ignores `hasTotalColumn`);
//   2. every marker template resolving to its own `MARKER_TOKENS` visual, with
//      the team-fill cascade producing concentric rings rather than a disc;
//   3. the verification-only chrome (per-hole footnotes, caption) never
//      reaching the product card.
//
// These assert VALUES — block structure and shape parameters — not pixels.

// MARK: - fixtures

private func cell(_ text: String, _ decoration: CellDecorationLayout = .plain) -> CellLayout {
    CellLayout(text: text, title: nil, decoration: decoration)
}

private func group(_ label: String, _ labels: [String]) -> ColumnGroupLayout {
    ColumnGroupLayout(label: label, columns: labels.map { ColumnLayout(label: $0) })
}

private func rowGroup(_ texts: [String], subtotal: String) -> RowGroupLayout {
    RowGroupLayout(cells: texts.map { cell($0) }, subtotal: subtotal)
}

/// An 18-hole card: two column groups (Out / In) and rows parallel to them.
private func eighteenHoleLayout(
    footnotes: [String] = [],
    caption: String? = nil,
    totals: [CardTotalLayout] = []
) -> ScoreGridLayout {
    let out = (1...9).map(String.init)
    let inn = (10...18).map(String.init)
    return ScoreGridLayout(
        componentId: "default-score-grid",
        title: TitleLayout(groups: [["Ada"]], joiner: " vs. ", nameJoiner: " & "),
        subtitleFacts: ["HCP 12"],
        footnotes: footnotes,
        caption: caption,
        totals: totals,
        columnGroups: [group("Out", out), group("In", inn)],
        // The fold says a TOT column is meaningful; the web adapter — and so
        // this renderer — ignores it anyway.
        hasTotalColumn: true,
        rows: [
            GridRowLayout(
                kind: "par", emphasis: false, team: nil, subjectName: nil, labelText: "Par",
                groups: [rowGroup(out.map { _ in "4" }, subtotal: "36"),
                         rowGroup(inn.map { _ in "4" }, subtotal: "36")],
                total: "72"
            ),
            GridRowLayout(
                kind: "gross", emphasis: true, team: nil, subjectName: "Ada", labelText: "Gross",
                groups: [rowGroup(out.map { _ in "5" }, subtotal: "45"),
                         rowGroup(inn.map { _ in "5" }, subtotal: "45")],
                total: "90"
            ),
        ]
    )
}

// MARK: - stacked blocks

final class ScoreGridBlockTests: XCTestCase {
    /// One block per column group, in layout order — which is the round's play
    /// order, frozen by the fold from the route sections.
    func testOneBlockPerColumnGroupInLayoutOrder() {
        let blocks = scoreGridBlocks(eighteenHoleLayout())

        XCTAssertEqual(blocks.count, 2, "an 18-hole card stacks two 9-hole blocks")
        XCTAssertEqual(blocks.map(\.label), ["Out", "In"])
        XCTAssertEqual(blocks[0].columnLabels, (1...9).map(String.init))
        XCTAssertEqual(blocks[1].columnLabels, (10...18).map(String.init))
    }

    /// Every row appears in every block, carrying only THAT group's cells and
    /// THAT group's subtotal.
    func testEachBlockCarriesEveryRowWithItsOwnSubtotal() {
        let blocks = scoreGridBlocks(eighteenHoleLayout())

        for block in blocks {
            XCTAssertEqual(block.rows.map(\.kind), ["par", "gross"])
            for row in block.rows {
                XCTAssertEqual(row.cells.count, 9, "a block holds only its own group's cells")
            }
        }
        XCTAssertEqual(blocks[0].rows.map(\.subtotal), ["36", "45"])
        XCTAssertEqual(blocks[1].rows.map(\.subtotal), ["36", "45"])
    }

    /// The whole-card total never appears — no TOT column, no TOT block. The
    /// fold still carries `total` / `hasTotalColumn` for the verification
    /// oracle, which lays the groups out side by side in one table.
    func testWholeCardTotalIsNotRendered() {
        let layout = eighteenHoleLayout()
        XCTAssertTrue(layout.hasTotalColumn, "the fold offers a TOT column…")

        let blocks = scoreGridBlocks(layout)
        XCTAssertFalse(blocks.contains { $0.label == "TOT" }, "…and this adapter ignores it")
        for block in blocks {
            for row in block.rows {
                XCTAssertNotEqual(row.subtotal, "90", "a block's subtotal is its group's, not the card's")
                XCTAssertEqual(row.cells.count, block.columnLabels.count, "cells stay parallel to columns")
            }
        }
    }

    /// The single-group case (a 9-hole round) is one block — the stacking rule
    /// is not "always two".
    func testSingleGroupCardIsOneBlock() {
        var layout = eighteenHoleLayout()
        layout.columnGroups = [layout.columnGroups[0]]
        layout.rows = layout.rows.map { row in
            var row = row
            row.groups = [row.groups[0]]
            return row
        }
        layout.hasTotalColumn = false

        let blocks = scoreGridBlocks(layout)
        XCTAssertEqual(blocks.count, 1)
        XCTAssertEqual(blocks[0].rows.count, 2)
    }

    /// Row labels use the fold's canonical composition (name + label, no
    /// trailing space when the label is empty) — not the oracle's legacy join.
    func testRowLabelUsesTheCanonicalComposition() {
        let blocks = scoreGridBlocks(eighteenHoleLayout())
        XCTAssertEqual(blocks[0].rows.map(\.label), ["Par", "Ada Gross"])
    }

    /// A row that is short a column group is dropped from that block rather
    /// than trapping (the web indexes with `!`; a malformed card must not take
    /// down the scorecard tab).
    func testRowMissingAGroupIsDroppedFromThatBlock() {
        var layout = eighteenHoleLayout()
        layout.rows[1].groups = [layout.rows[1].groups[0]]

        let blocks = scoreGridBlocks(layout)
        XCTAssertEqual(blocks[0].rows.count, 2)
        XCTAssertEqual(blocks[1].rows.map(\.kind), ["par"])
    }
}

// MARK: - card composition (no verification chrome)

final class ScoreGridCardCompositionTests: XCTestCase {
    private let footnote = "h10: 4 pts (netPar 6 − 4 = +2)"
    private let caption = "Running totals are relative to the leader."

    /// The per-hole arithmetic footnotes and the explanatory caption are
    /// verification-mode chrome on the web. They ride in the fold in every mode
    /// (shared tree) and must never reach the app's card.
    func testFootnotesAndCaptionAreNeverComposed() {
        let layout = eighteenHoleLayout(footnotes: [footnote, "h11: 2 pts"], caption: caption)
        XCTAssertFalse(layout.footnotes.isEmpty, "the fold still carries them…")
        XCTAssertNotNil(layout.caption)

        let card = ScoreGridCardComposition(layout)
        for text in card.chromeText {
            XCTAssertFalse(text.contains("netPar"), "footnote text leaked into the card: \(text)")
            XCTAssertNotEqual(text, footnote)
            XCTAssertNotEqual(text, caption)
        }
        XCTAssertFalse(card.chromeText.contains { $0.contains("Running totals are relative") })
    }

    /// What the card DOES compose: title, subtitle, blocks, totals.
    func testCardComposesTitleSubtitleAndTotals() {
        let layout = eighteenHoleLayout(
            footnotes: [footnote],
            caption: caption,
            totals: [CardTotalLayout(label: "Points", value: "31")]
        )
        let card = ScoreGridCardComposition(layout)

        XCTAssertEqual(card.title, "Ada")
        XCTAssertEqual(card.subtitle, "HCP 12")
        XCTAssertEqual(card.blocks.count, 2)
        XCTAssertEqual(card.totals, [CardTotalLayout(label: "Points", value: "31")])
        XCTAssertEqual(card.chromeText, ["Ada", "HCP 12", "Points", "31"])
    }

    /// A match card sends an empty title group; it composes no title (the web
    /// renders no `<header>` at all).
    func testEmptyTitleComposesNoHeaderText() {
        var layout = eighteenHoleLayout()
        layout.title = TitleLayout(groups: [], joiner: "", nameJoiner: " & ")
        layout.subtitleFacts = []

        let card = ScoreGridCardComposition(layout)
        XCTAssertEqual(card.title, "")
        XCTAssertNil(card.subtitle)
        XCTAssertEqual(card.chromeText, [])
    }
}

// MARK: - marker visuals

final class MarkerVisualTests: XCTestCase {
    /// The eight `MARKER_TOKENS` entries, each resolving to its own visual.
    /// Filled forms carry their token's fill and a white number; `dot` is the
    /// bare base shape; `badge` is an auto-width outline pill.
    func testEveryTemplateResolvesToItsTokenVisual() {
        let cases: [(String, MarkerVisual.Shape, String?, Bool)] = [
            // template, shape, fill, autoWidth
            ("ring", .round, "#d63b2f", false),
            ("double_ring", .round, "#e0862c", false),
            ("diamond", .round, "#e0b41f", false),
            ("square", .boxy, "#5b9bd5", false),
            ("double_square", .boxy, "#1f4e79", false),
            ("box_badge", .boxy, "#1f4e79", false),
            ("dot", .round, nil, false),
            ("badge", .round, nil, true),
        ]
        for (template, shape, fill, autoWidth) in cases {
            let visual = MarkerVisual.resolve(template: template, tone: nil, teamFill: nil)
            XCTAssertEqual(visual.shape, shape, template)
            XCTAssertEqual(visual.fillHex, fill, template)
            XCTAssertEqual(visual.autoWidth, autoWidth, template)
            if fill != nil {
                XCTAssertEqual(visual.inkHex, "#ffffff", "\(template) prints a white number")
                XCTAssertTrue(visual.rings.isEmpty, "\(template) is a plain fill, no border")
            }
        }
    }

    /// `dot` is bare — no fill, no border, inherits the cell's ink. It must not
    /// borrow the badge's outline (which is what made every flag look alike).
    func testDotIsTheBareBaseShape() {
        let dot = MarkerVisual.resolve(template: "dot", tone: .success, teamFill: nil)
        XCTAssertTrue(dot.isBare)
        XCTAssertNil(dot.inkHex, "bare forms inherit currentColor")
        XCTAssertNotEqual(dot, MarkerVisual.resolve(template: "badge", tone: .success, teamFill: nil))
    }

    /// `badge` is the only toned form on the web (`MARKER_TOKENS.badge.tones`),
    /// and the tone colours both its text and its 2px outline.
    func testBadgeIsTheOnlyTonedForm() {
        let danger = MarkerVisual.resolve(template: "badge", tone: .danger, teamFill: nil)
        XCTAssertEqual(danger.inkHex, "#9b332a")
        XCTAssertEqual(danger.rings, [MarkerVisual.Ring(hex: "#9b332a", width: 2, inset: 0)])
        XCTAssertTrue(danger.autoWidth, "a badge grows with its text")

        XCTAssertEqual(
            MarkerVisual.resolve(template: "badge", tone: .success, teamFill: nil).inkHex, "#267348")
        XCTAssertEqual(
            MarkerVisual.resolve(template: "badge", tone: .warning, teamFill: nil).inkHex, "#946200")

        // A tone on a filled form changes nothing — no `.lb-mark-tone--*` rule
        // is emitted for a form without `tones`.
        XCTAssertEqual(
            MarkerVisual.resolve(template: "ring", tone: .danger, teamFill: nil),
            MarkerVisual.resolve(template: "ring", tone: nil, teamFill: nil)
        )
    }

    /// The deciding ball's marker: team fill, a WHITE ring inside the box and a
    /// team-colour halo outside it — the pronounced concentric ring, not a
    /// solid disc that reads as the plain standing pill.
    func testTeamFilledMarkerIsAConcentricRing() {
        for (team, hex) in [(GridRowTeam.a, "#c2452f"), (GridRowTeam.b, "#2c6cae")] {
            let visual = MarkerVisual.resolve(template: "ring", tone: nil, teamFill: team)
            XCTAssertEqual(visual.fillHex, hex)
            XCTAssertEqual(visual.inkHex, "#ffffff")
            XCTAssertEqual(visual.rings, [MarkerVisual.Ring(hex: "#ffffff", width: 2, inset: 0)])
            XCTAssertEqual(visual.haloHex, hex)
            XCTAssertEqual(visual.haloWidth, 2.5)
            XCTAssertFalse(visual.isBare)
        }
    }

    /// Web: `.lb-mark--double_ring.lb-mark-fill--a { border-width: 3px;
    /// border-style: double }` — two concentric white rings, so a team-filled
    /// double ring stays apart from a team-filled ring.
    func testTeamFilledDoubleRingDrawsTwoWhiteRings() {
        let single = MarkerVisual.resolve(template: "ring", tone: nil, teamFill: .a)
        let double = MarkerVisual.resolve(template: "double_ring", tone: nil, teamFill: .a)

        XCTAssertEqual(double.rings, [
            MarkerVisual.Ring(hex: "#ffffff", width: 1, inset: 0),
            MarkerVisual.Ring(hex: "#ffffff", width: 1, inset: 2),
        ])
        XCTAssertNotEqual(double.rings, single.rings)
    }

    /// A team fill wins over the form's own fill (declared after it on the web)
    /// — including on a boxy form, which keeps its square corners.
    func testTeamFillOverridesTheFormFillButNotItsShape() {
        let square = MarkerVisual.resolve(template: "square", tone: nil, teamFill: .b)
        XCTAssertEqual(square.shape, .boxy)
        XCTAssertEqual(square.fillHex, "#2c6cae")
        XCTAssertNotEqual(square.fillHex, ScoreMarkerForm.square.fillHex)
    }

    /// `custom` — and any template this client predates — renders as the bare
    /// base shape: visible as unfinished, never silently inheriting another
    /// form's shape (`marker-tokens.ts` rule 4).
    func testUnknownTemplateRendersBare() {
        for template in ["custom", "sparkle_9000"] {
            let visual = MarkerVisual.resolve(template: template, tone: nil, teamFill: nil)
            XCTAssertTrue(visual.isBare, template)
            XCTAssertFalse(visual.autoWidth, "\(template) must not borrow the badge outline")
        }
    }

    /// The templates are distinct as their tokens are: seven distinct visuals
    /// across the eight forms, because `double_square` and `box_badge` share
    /// one emitted fill rule on the web (they are told apart by their value,
    /// not their hue). Everything else is unique.
    func testTemplatesAreDistinctExactlyWhereTheTokensAre() {
        let templates = [
            "ring", "double_ring", "diamond", "square", "double_square", "box_badge", "dot", "badge",
        ]
        let visuals = templates.map { MarkerVisual.resolve(template: $0, tone: .danger, teamFill: nil) }
        var distinct: [MarkerVisual] = []
        for visual in visuals where !distinct.contains(visual) { distinct.append(visual) }
        XCTAssertEqual(distinct.count, 7)
        XCTAssertEqual(
            MarkerVisual.resolve(template: "double_square", tone: nil, teamFill: nil),
            MarkerVisual.resolve(template: "box_badge", tone: nil, teamFill: nil),
            "the web emits one fill rule for both"
        )
    }

    /// The hex spellings the whole vocabulary is written in parse, and a
    /// malformed one degrades instead of trapping.
    func testWebHexParsing() {
        XCTAssertEqual(Color(webHex: "#ffffff"), Color(red: 1, green: 1, blue: 1))
        XCTAssertEqual(Color(webHex: "d63b2f"), Color(webHex: "#d63b2f"))
        XCTAssertEqual(Color(webHex: "#nope"), Color.clear)
    }
}

// MARK: - the headless slot picker

/// `-tapscoreSlot`, the format-chip counterpart of `-tapscoreTab`: it only
/// picks between boards the user can already reach.
final class LaunchSlotTests: XCTestCase {
    private func slot(_ index: Int, _ formatId: String) -> SlotResultView {
        SlotResultView(
            slotIndex: Double(index),
            slotDefId: "slot-\(index)",
            formatId: formatId,
            formatLabel: formatId,
            scoringMode: "net",
            teamShape: "individual",
            allowanceLabel: "",
            cards: [],
            leaderboard: []
        )
    }

    private var slots: [SlotResultView] {
        [slot(0, "stableford_individual"), slot(1, "taliban_better_ball"), slot(2, "umbrella_4_ball")]
    }

    func testMatchesByFormatIdSlotDefIdOrIndex() {
        XCTAssertEqual(
            LaunchSlot.match(in: slots, arguments: ["x", "-tapscoreSlot", "taliban_better_ball"])?.slotDefId,
            "slot-1")
        XCTAssertEqual(
            LaunchSlot.match(in: slots, arguments: ["-tapscoreSlot", "slot-2"])?.formatId,
            "umbrella_4_ball")
        XCTAssertEqual(LaunchSlot.match(in: slots, arguments: ["-tapscoreSlot", "1"])?.slotDefId, "slot-1")
    }

    func testUnknownOrMissingArgumentPicksNothing() {
        XCTAssertNil(LaunchSlot.match(in: slots, arguments: []))
        XCTAssertNil(LaunchSlot.match(in: slots, arguments: ["-tapscoreSlot"]))
        XCTAssertNil(LaunchSlot.match(in: slots, arguments: ["-tapscoreSlot", "no_such_format"]))
        XCTAssertNil(LaunchSlot.match(in: slots, arguments: ["-tapscoreSlot", "9"]))
        XCTAssertNil(LaunchSlot.match(in: [], arguments: ["-tapscoreSlot", "0"]))
    }
}
