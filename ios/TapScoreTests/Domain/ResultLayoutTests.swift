import Foundation
import XCTest
@testable import TapScore

// N3 — the ONE platform-neutral layout fold, ported to Swift for N4. A
// line-for-line port of `tests/round/result-layout.test.ts`, kept DIFFABLE side
// by side with it: same order, same section banners, same test wording in the
// `///` above each method. Every derived layout decision the web renderer, the
// static oracle and this native client share lives in the fold: route-section
// column grouping, subtotals, the TOT column, cell decorations, pace values.
// These tests pin the TREE, not anyone's markup.
//
// Inputs are the GENERATED contract types (`API/Generated/FriendlyRoundsTypes`),
// which is the Swift half of what the TS suite proves by importing
// `src/api/friendly-rounds.gen`: the wire types satisfy the fold's inputs
// directly, with no hand-written DTO in between.

private let nameOf: NameOf = { id in "name:\(id)" }

/// TS: `const hole = (n: number): HoleRef => ({ … })`
private func hole(_ n: Int) -> HoleRef {
    HoleRef(
        holeNumber: Double(n),
        playHoleId: "ph-\(n)",
        courseHoleNumber: Double(n),
        canonicalOrdinal: Double(n),
        occurrenceLabel: String(n)
    )
}

/// TS: `function grid(rows, holes, overrides = {})`. The TS spread becomes
/// explicit optional overrides.
private func grid(
    _ rows: [GridRow],
    _ holes: [HoleRef],
    componentId: FormatDescriptorResultDisplayScoreGridComponentId? = nil,
    title: ScoreGridSectionTitle? = nil,
    subtitleFacts: [String]? = nil,
    footnotes: [String]? = nil,
    caption: String? = nil,
    totals: [ScoreGridSectionTotalsItem]? = nil
) -> ScoreGridSection {
    ScoreGridSection(
        componentId: componentId,
        title: title ?? ScoreGridSectionTitle(groups: [["a"]], joiner: " vs. "),
        subjectBallIds: ["a"],
        holes: holes,
        subtitleFacts: subtitleFacts ?? [],
        rows: rows,
        footnotes: footnotes ?? [],
        caption: caption,
        totals: totals ?? []
    )
}

/// TS: `function sumRow(holes, value, overrides = {})`
private func sumRow(
    _ holes: [HoleRef],
    _ value: Double?,
    label: String = "Gross",
    subjectBallId: String? = "a"
) -> GridRow {
    GridRow(
        label: label,
        subjectBallId: subjectBallId,
        kind: .gross,
        cells: holes.map {
            GridCell(
                playHoleId: $0.playHoleId,
                holeNumber: $0.holeNumber,
                value: value,
                display: value == nil ? "" : jsNumberString(value!)
            )
        },
        aggregate: .sum
    )
}

private let OUT_IN: [RouteSectionRef] = [
    RouteSectionRef(id: "s-out", label: "OUT", fromCanonicalOrdinal: 1, toCanonicalOrdinal: 9),
    RouteSectionRef(id: "s-in", label: "IN", fromCanonicalOrdinal: 10, toCanonicalOrdinal: 18),
]

final class ResultLayoutTests: XCTestCase {

    // --- column grouping ----------------------------------------------------

    /// route sections become column groups in canonical order, with a whole-card total
    func test_routeSectionsBecomeColumnGroupsInCanonicalOrder() {
        let holes = (1...18).map { hole($0) }
        let layout = layoutScoreGrid(grid([sumRow(holes, 4)], holes), OUT_IN, nameOf)

        XCTAssertEqual(layout.columnGroups.map(\.label), ["OUT", "IN"])
        XCTAssertEqual(
            layout.columnGroups[0].columns.map(\.label),
            ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
        )
        XCTAssertTrue(layout.hasTotalColumn)
        let row = layout.rows[0]
        XCTAssertEqual(row.groups.map(\.subtotal), ["36", "36"])
        XCTAssertEqual(row.total, "72")
    }

    /// no route sections ⇒ ONE TOT group over every column and no separate total column
    func test_noRouteSectionsMeansOneTotGroup() {
        let holes = [hole(1), hole(2), hole(3)]
        let layout = layoutScoreGrid(grid([sumRow(holes, 4)], holes), [], nameOf)

        XCTAssertEqual(layout.columnGroups.map(\.label), ["TOT"])
        XCTAssertFalse(layout.hasTotalColumn)
        XCTAssertEqual(layout.rows[0].groups[0].subtotal, "12")
    }

    /// columns sort by canonicalOrdinal; a column in no section is dropped, an empty section makes no group
    func test_columnsSortByCanonicalOrdinalAndUnsectionedColumnsDrop() {
        let holes = [hole(3), hole(1), hole(2)]
        let sections = [
            RouteSectionRef(id: "s2", label: "GHOST", fromCanonicalOrdinal: 10, toCanonicalOrdinal: 12),
            RouteSectionRef(id: "s1", label: "LOOP", fromCanonicalOrdinal: 1, toCanonicalOrdinal: 2),
        ]
        let layout = layoutScoreGrid(grid([sumRow(holes, 5)], holes), sections, nameOf)

        XCTAssertEqual(layout.columnGroups.map(\.label), ["LOOP"])
        XCTAssertEqual(layout.columnGroups[0].columns.map(\.label), ["1", "2"])
        // The group subtotal counts only its own columns…
        XCTAssertEqual(layout.rows[0].groups[0].subtotal, "10")
        // …while the card total is every cell the row carries, sectioned or not.
        XCTAssertEqual(layout.rows[0].total, "15")
    }

    /// repeated occurrences of one physical hole stay distinct columns keyed by playHoleId
    func test_repeatedOccurrencesStayDistinctColumns() {
        let holes = [
            HoleRef(holeNumber: 7, playHoleId: "ph-7-1", courseHoleNumber: 7, canonicalOrdinal: 1, occurrenceLabel: "7 (1st)"),
            HoleRef(holeNumber: 7, playHoleId: "ph-7-2", courseHoleNumber: 7, canonicalOrdinal: 2, occurrenceLabel: "7 (2nd)"),
        ]
        let row = GridRow(
            label: "Gross",
            kind: .gross,
            cells: [
                GridCell(playHoleId: "ph-7-1", holeNumber: 7, value: 3, display: "3"),
                GridCell(playHoleId: "ph-7-2", holeNumber: 7, value: 5, display: "5"),
            ],
            aggregate: .sum
        )
        let layout = layoutScoreGrid(grid([row], holes), [], nameOf)

        XCTAssertEqual(layout.columnGroups[0].columns.map(\.label), ["7 (1st)", "7 (2nd)"])
        XCTAssertEqual(layout.rows[0].groups[0].cells.map(\.text), ["3", "5"])
        XCTAssertEqual(layout.rows[0].groups[0].subtotal, "8")
    }

    // --- aggregates ---------------------------------------------------------

    /// aggregate=last takes the latest non-null value (one decimal), and carries it into the total
    func test_aggregateLastTakesLatestNonNullValue() {
        let holes = [hole(1), hole(2), hole(10)]
        let running = GridRow(
            label: "Running",
            kind: .running,
            cells: [
                GridCell(playHoleId: "ph-1", holeNumber: 1, value: 1, display: "1"),
                GridCell(playHoleId: "ph-2", holeNumber: 2, value: 2.5, display: "2.5"),
                GridCell(playHoleId: "ph-10", holeNumber: 10, value: nil, display: ""),
            ],
            aggregate: .last
        )
        let layout = layoutScoreGrid(grid([running], holes), OUT_IN, nameOf)

        XCTAssertEqual(layout.rows[0].groups.map(\.subtotal), ["2.5", "—"])
        // A running row's card total is the LAST group's standing, never a sum.
        XCTAssertEqual(layout.rows[0].total, "—")
    }

    /// an all-null sum and an aggregate=none row both read as a dash
    func test_allNullSumAndAggregateNoneReadAsDash() {
        let holes = [hole(1), hole(2)]
        let none = GridRow(label: "Note", kind: .free, cells: [], aggregate: GridRowAggregate.none)
        let layout = layoutScoreGrid(grid([sumRow(holes, nil), none], holes), [], nameOf)

        XCTAssertEqual(layout.rows[0].groups[0].subtotal, "—")
        XCTAssertEqual(layout.rows[1].groups[0].subtotal, "—")
        XCTAssertEqual(layout.rows[1].total, "—")
    }

    // --- cells --------------------------------------------------------------

    /// a column with no cell for the row lays out as empty and undecorated
    func test_columnWithNoCellIsEmptyAndUndecorated() {
        let holes = [hole(1), hole(2)]
        let row = GridRow(
            label: "Gross",
            kind: .gross,
            cells: [GridCell(playHoleId: "ph-1", holeNumber: 1, value: 4, display: "4")],
            aggregate: .sum
        )
        let cells = layoutScoreGrid(grid([row], holes), [], nameOf).rows[0].groups[0].cells

        XCTAssertEqual(cells[1], CellLayout(text: "", title: nil, decoration: .plain))
    }

    /// a team without a marker is a pill; with a marker the marker takes the team fill
    func test_teamWithoutMarkerIsPillAndMarkerTakesTeamFill() {
        let holes = [hole(1), hole(2)]
        let row = GridRow(
            label: "Net",
            kind: .net,
            cells: [
                GridCell(playHoleId: "ph-1", holeNumber: 1, value: 4, display: "4", team: .a),
                GridCell(
                    playHoleId: "ph-2",
                    holeNumber: 2,
                    value: 3,
                    display: "3",
                    marker: .other(GridCellMarkerOther(tone: .success, label: "Birdie (-1)", template: .ring)),
                    team: .b
                ),
            ],
            aggregate: .sum
        )
        let cells = layoutScoreGrid(grid([row], holes), [], nameOf).rows[0].groups[0].cells

        XCTAssertEqual(cells[0].decoration, .pill(team: .a))
        XCTAssertEqual(
            cells[1].decoration,
            .marker(template: "ring", tone: .success, label: "Birdie (-1)", teamFill: .b)
        )
    }

    /// only styled marker tones survive; an empty marker label or cell title collapses to null
    func test_onlyStyledMarkerTonesSurviveAndEmptyStringsCollapse() {
        let holes = [hole(1), hole(2)]
        let row = GridRow(
            label: "Gross",
            kind: .gross,
            cells: [
                GridCell(
                    playHoleId: "ph-1",
                    holeNumber: 1,
                    value: 5,
                    display: "5",
                    title: "",
                    marker: .other(GridCellMarkerOther(tone: .sideA, label: "", template: .square))
                ),
                GridCell(
                    playHoleId: "ph-2",
                    holeNumber: 2,
                    value: 6,
                    display: "6",
                    marker: .other(GridCellMarkerOther(template: .boxBadge))
                ),
            ],
            aggregate: .sum
        )
        let cells = layoutScoreGrid(grid([row], holes), [], nameOf).rows[0].groups[0].cells

        XCTAssertNil(cells[0].title)
        XCTAssertEqual(
            cells[0].decoration,
            .marker(template: "square", tone: nil, label: nil, teamFill: nil)
        )
        XCTAssertEqual(
            cells[1].decoration,
            .marker(template: "box_badge", tone: nil, label: nil, teamFill: nil)
        )
    }

    /// Swift-only: the custom-marker arm of the generated union reports the
    /// `custom` discriminant and drops `customId`, which is not layout.
    func test_customMarkerReportsTheCustomTemplate() {
        let holes = [hole(1)]
        let row = GridRow(
            label: "Gross",
            kind: .gross,
            cells: [
                GridCell(
                    playHoleId: "ph-1",
                    holeNumber: 1,
                    value: 4,
                    display: "4",
                    marker: .custom(GridCellMarkerCustom(tone: .danger, label: "Wipe", customId: "wipe"))
                ),
            ],
            aggregate: .sum
        )
        let cells = layoutScoreGrid(grid([row], holes), [], nameOf).rows[0].groups[0].cells

        XCTAssertEqual(
            cells[0].decoration,
            .marker(template: "custom", tone: .danger, label: "Wipe", teamFill: nil)
        )
    }

    // --- card chrome --------------------------------------------------------

    /// title groups resolve to live names; row subjects and label text stay separate parts
    func test_titleGroupsResolveAndRowPartsStaySeparate() {
        let holes = [hole(1)]
        let row = sumRow(holes, 4, label: "Gross", subjectBallId: "a")
        let anonymous = sumRow(holes, 4, label: "Par", subjectBallId: nil)
        let layout = layoutScoreGrid(
            grid(
                [row, anonymous],
                holes,
                title: ScoreGridSectionTitle(groups: [["a", "b"], ["c"]], joiner: " vs. ")
            ),
            [],
            nameOf
        )

        // Both separators ride as DATA: the contract's group joiner, plus the
        // fold's own intra-group name joiner (no adapter hardcodes ' & ').
        XCTAssertEqual(
            layout.title,
            TitleLayout(
                groups: [["name:a", "name:b"], ["name:c"]],
                joiner: " vs. ",
                nameJoiner: " & "
            )
        )
        XCTAssertEqual(layout.rows[0].subjectName, "name:a")
        XCTAssertEqual(layout.rows[0].labelText, "Gross")
        XCTAssertNil(layout.rows[1].subjectName)
    }

    /// Swift-only: the CANONICAL (web) composition of the two label parts — a
    /// subject with no label text must not gain a trailing space. The oracle's
    /// always-a-space join is legacy drift; a new renderer follows this.
    func test_composedLabelIsTheCanonicalWebComposition() {
        let holes = [hole(1)]
        let named = sumRow(holes, 4, label: "Gross", subjectBallId: "a")
        let bare = sumRow(holes, 4, label: "", subjectBallId: "a")
        let anonymous = sumRow(holes, 4, label: "Par", subjectBallId: nil)
        let layout = layoutScoreGrid(grid([named, bare, anonymous], holes), [], nameOf)

        XCTAssertEqual(layout.rows[0].composedLabel, "name:a Gross")
        XCTAssertEqual(layout.rows[1].composedLabel, "name:a")
        XCTAssertEqual(layout.rows[2].composedLabel, "Par")
    }

    /// product mode hides slot/CH/PH facts; verification mode keeps every fact
    func test_productModeHidesSlotAndHandicapFacts() {
        let facts = ["slot #0 Stableford", "CH 12.3", "PH -1", "Stableford", "100%"]
        let section = grid([], [], subtitleFacts: facts)

        XCTAssertEqual(layoutScoreGrid(section, [], nameOf).subtitleFacts, ["Stableford", "100%"])
        XCTAssertEqual(
            layoutScoreGrid(section, [], nameOf, mode: .product).subtitleFacts,
            ["Stableford", "100%"]
        )
        XCTAssertEqual(layoutScoreGrid(section, [], nameOf, mode: .verification).subtitleFacts, facts)
    }

    /// Swift-only: the hand-rolled `^CH -?\d` / `^PH -?\d` matcher is exactly
    /// the TS regex — a prefix alone, or a non-digit after it, is NOT a hit.
    func test_handicapFactMatcherMatchesTheRegexExactly() {
        let facts = ["CH", "CH ", "CH -", "CH x", "CHIP 3", "PH -0", "CH 0", "PHASE 2"]
        let kept = layoutScoreGrid(grid([], [], subtitleFacts: facts), [], nameOf).subtitleFacts

        XCTAssertEqual(kept, ["CH", "CH ", "CH -", "CH x", "CHIP 3", "PHASE 2"])
    }

    /// card totals become display strings (a missing total is a dash) and a missing caption is null
    func test_cardTotalsBecomeDisplayStrings() {
        let layout = layoutScoreGrid(
            grid(
                [],
                [],
                totals: [
                    ScoreGridSectionTotalsItem(label: "Points", value: 0),
                    ScoreGridSectionTotalsItem(label: "Net", value: nil),
                ]
            ),
            [],
            nameOf
        )

        XCTAssertEqual(
            layout.totals,
            [
                CardTotalLayout(label: "Points", value: "0"),
                CardTotalLayout(label: "Net", value: "—"),
            ]
        )
        XCTAssertNil(layout.caption)
    }

    /// a missing componentId means the default score grid
    func test_missingComponentIdMeansDefaultScoreGrid() {
        XCTAssertEqual(scoreGridComponentId(grid([], [])), "default-score-grid")
        XCTAssertEqual(
            scoreGridComponentId(grid([], [], componentId: .compactMatchGrid)),
            "compact-match-grid"
        )
        XCTAssertEqual(layoutScoreGrid(grid([], []), [], nameOf).componentId, "default-score-grid")
    }

    // --- ranked -------------------------------------------------------------

    /// TS: `function ranked(entries, overrides = {})`
    private func ranked(
        _ entries: [RankedEntry],
        direction: CompetitionResultViewDirection? = nil
    ) -> RankedSection {
        RankedSection(
            metricId: "points",
            metricLabel: "Points",
            direction: direction,
            entries: entries
        )
    }

    /// a board without any pace declares none; one paced entry grows the column for the whole board
    func test_paceColumnExistsWhenAnyEntryHasPace() {
        let noPace = layoutRanked(
            ranked([RankedEntry(ballIds: ["a"], total: 70, holesPlayed: 18, position: 1)]),
            nameOf
        )
        XCTAssertFalse(noPace.hasPace)
        XCTAssertNil(noPace.entries[0].pace)

        let mixed = layoutRanked(
            ranked([
                RankedEntry(ballIds: ["a"], total: 33, holesPlayed: 18, paceDelta: -3, position: 1),
                RankedEntry(ballIds: ["b"], total: 30, holesPlayed: 18, position: 2),
            ]),
            nameOf
        )
        XCTAssertTrue(mixed.hasPace)
        XCTAssertNil(mixed.entries[1].pace)
    }

    /// pace reads in golf’s ONE sign convention: + is always worse than expectation
    func test_paceUsesOneSignConvention() {
        let high = layoutRanked(
            ranked(
                [
                    RankedEntry(ballIds: ["a"], total: 39, holesPlayed: 18, paceDelta: 3, position: 1),
                    RankedEntry(ballIds: ["b"], total: 36, holesPlayed: 18, paceDelta: 0, position: 2),
                    RankedEntry(ballIds: ["c"], total: 33, holesPlayed: 18, paceDelta: -3, position: 3),
                ],
                direction: .high
            ),
            nameOf
        )
        // A `high` metric (points) is negated for display: 3 points ABOVE pace is −3.
        XCTAssertEqual(
            high.entries.map(\.pace),
            [
                PaceLayout(text: "−3", tone: .under),
                PaceLayout(text: "E", tone: .even),
                PaceLayout(text: "+3", tone: .over),
            ]
        )

        let low = layoutRanked(
            ranked(
                [RankedEntry(ballIds: ["a"], total: 75, holesPlayed: 18, paceDelta: 3, position: 1)],
                direction: .low
            ),
            nameOf
        )
        // A `low` metric (strokes) already runs that way and displays raw.
        XCTAssertEqual(low.entries[0].pace, PaceLayout(text: "+3", tone: .over))
    }

    /// entries resolve joined names, a leader flag, a dashed missing total and a shared group tag
    func test_rankedEntriesResolveNamesLeadTotalAndGroup() {
        let groupOf: GroupOf = { id in id == "c" ? "Group 2" : "Group 1" }
        let layout = layoutRanked(
            ranked([
                RankedEntry(ballIds: ["a", "b"], total: nil, holesPlayed: 9, position: 1),
                RankedEntry(ballIds: ["b", "c"], total: 12, holesPlayed: 9, position: 1),
            ]),
            nameOf,
            groupOf
        )

        XCTAssertEqual(
            layout.entries[0],
            RankedEntryLayout(
                position: 1,
                lead: true,
                name: "name:a & name:b",
                group: "Group 1",
                total: "—",
                holesPlayed: 9,
                pace: nil
            )
        )
        // Balls from two groups → no tag rather than a guess.
        XCTAssertNil(layout.entries[1].group)
        // Without a group resolver (the single-group round) nothing is tagged.
        let ungrouped = layoutRanked(
            ranked([RankedEntry(ballIds: ["a"], total: 1, holesPlayed: 1, position: 2)]),
            nameOf
        ).entries[0]
        XCTAssertNil(ungrouped.group)
        XCTAssertFalse(ungrouped.lead)
    }

    // --- match summary ------------------------------------------------------

    /// match panels carry the golf idiom: AS / N UP and Final / thru N
    func test_matchPanelsCarryTheGolfIdiom() {
        let section = MatchSummarySection(
            title: "Matches",
            matches: [
                MatchPanel(
                    sideA: MatchPanelSideA(ballIds: ["a"]),
                    sideB: MatchPanelSideA(ballIds: ["b"]),
                    leader: nil,
                    magnitude: 0,
                    finished: false,
                    thru: 7
                ),
                MatchPanel(
                    sideA: MatchPanelSideA(ballIds: ["a", "b"]),
                    sideB: MatchPanelSideA(ballIds: ["c"]),
                    leader: .a,
                    magnitude: 3,
                    finished: true,
                    thru: 16
                ),
            ]
        )
        let layout = layoutMatchSummary(section, nameOf)

        XCTAssertEqual(layout.title, "Matches")
        XCTAssertEqual(
            layout.matches[0],
            MatchPanelLayout(
                sideAName: "name:a",
                sideBName: "name:b",
                leader: nil,
                standing: "AS",
                status: "thru 7"
            )
        )
        XCTAssertEqual(layout.matches[1].sideAName, "name:a & name:b")
        XCTAssertEqual(layout.matches[1].standing, "3 UP")
        XCTAssertEqual(layout.matches[1].status, "Final")
    }

    // --- serializability ----------------------------------------------------

    /// the layout tree is plain JSON — the native renderer consumes exactly this shape
    func test_layoutTreeIsPlainJSON() throws {
        let holes = [hole(1), hole(10)]
        let layout = layoutScoreGrid(
            grid(
                [sumRow(holes, 4)],
                holes,
                footnotes: ["h1: 2 × 3"],
                caption: "Normalised to the leader"
            ),
            OUT_IN,
            nameOf
        )

        XCTAssertEqual(try roundTrip(layout), layout)
        let emptyRanked = layoutRanked(ranked([]), nameOf)
        XCTAssertEqual(try roundTrip(emptyRanked), emptyRanked)
        let match = layoutMatchSummary(MatchSummarySection(title: "M", matches: []), nameOf)
        XCTAssertEqual(try roundTrip(match), match)

        // The section union itself round-trips, discriminated on `kind` exactly
        // as the TS `RankedLayout | MatchSummaryLayout` is narrowed — so the
        // whole tree, not just its two halves, is JSON.
        let sections: [LeaderboardSectionLayout] = [.ranked(emptyRanked), .matchSummary(match)]
        XCTAssertEqual(try roundTrip(sections), sections)
        // Flat union: `kind` sits beside the payload's own fields, no wrapper.
        let sectionJSON = try jsonObject(LeaderboardSectionLayout.ranked(emptyRanked))
        XCTAssertEqual(sectionJSON["kind"] as? String, "ranked")
        XCTAssertEqual(sectionJSON["metricLabel"] as? String, "Points")

        XCTAssertThrowsError(
            try JSONDecoder().decode(
                LeaderboardSectionLayout.self,
                from: Data(#"{"kind":"nope"}"#.utf8)
            )
        )
    }

    /// every optional key the TS tree emits as `null` is PRESENT in the Swift dump
    func test_optionalKeysEncodeAsExplicitNull() throws {
        let holes = [hole(1)]
        // A self-labelling row (no subject, no team) with an untitled cell, on a
        // card with no caption: every optional in the grid tree is nil at once.
        let layout = layoutScoreGrid(
            grid([sumRow(holes, nil, subjectBallId: nil)], holes),
            [],
            nameOf
        )
        let gridJSON = try jsonObject(layout)
        XCTAssertTrue(gridJSON["caption"] is NSNull)

        let row = try XCTUnwrap((gridJSON["rows"] as? [[String: Any]])?.first)
        XCTAssertTrue(row["team"] is NSNull)
        XCTAssertTrue(row["subjectName"] is NSNull)

        let cell = try XCTUnwrap(
            ((row["groups"] as? [[String: Any]])?.first?["cells"] as? [[String: Any]])?.first
        )
        XCTAssertTrue(cell["title"] is NSNull)
        // The hand-rolled decoration encoder already did this; it stays true.
        XCTAssertEqual((cell["decoration"] as? [String: Any])?["kind"] as? String, "plain")

        let entry = try XCTUnwrap(
            (try jsonObject(
                layoutRanked(
                    ranked([RankedEntry(ballIds: ["a"], total: 70, holesPlayed: 18, position: 1)]),
                    nameOf
                )
            )["entries"] as? [[String: Any]])?.first
        )
        XCTAssertTrue(entry["group"] is NSNull)
        XCTAssertTrue(entry["pace"] is NSNull)

        let panel = try XCTUnwrap(
            (try jsonObject(
                layoutMatchSummary(
                    MatchSummarySection(
                        title: "M",
                        matches: [
                            MatchPanel(
                                sideA: MatchPanelSideA(ballIds: ["a"]),
                                sideB: MatchPanelSideA(ballIds: ["b"]),
                                leader: nil,
                                magnitude: 0,
                                finished: false,
                                thru: 1
                            )
                        ]
                    ),
                    nameOf
                )
            )["matches"] as? [[String: Any]])?.first
        )
        XCTAssertTrue(panel["leader"] is NSNull)
    }

    /// Swift-only: the count narrowing is TOTAL — no wire number can trap it
    func test_countNarrowingIsTotal() {
        XCTAssertEqual(countInt(18), 18)
        XCTAssertEqual(countInt(0), 0)
        XCTAssertEqual(countInt(-2), -2)
        // Non-integral rounds to nearest rather than truncating toward zero.
        XCTAssertEqual(countInt(2.7), 3)
        XCTAssertEqual(countInt(2.4), 2)
        // Beyond `Int`'s range / non-finite: clamp and zero, never a trap.
        XCTAssertEqual(countInt(1e30), Int.max)
        XCTAssertEqual(countInt(-1e30), Int.min)
        XCTAssertEqual(countInt(.infinity), Int.max)
        XCTAssertEqual(countInt(.nan), 0)

        // …and the fold routes the two wire counts through it: a malformed
        // payload renders a wrong number, it does not crash the board.
        let layout = layoutRanked(
            ranked([
                RankedEntry(ballIds: ["a"], total: 70, holesPlayed: 2.7, position: 1.5),
                RankedEntry(ballIds: ["b"], total: 70, holesPlayed: 1e30, position: .nan),
            ]),
            nameOf
        )
        XCTAssertEqual(layout.entries[0].position, 2)
        XCTAssertEqual(layout.entries[0].holesPlayed, 3)
        XCTAssertFalse(layout.entries[0].lead)
        XCTAssertEqual(layout.entries[1].position, 0)
        XCTAssertEqual(layout.entries[1].holesPlayed, Int.max)
    }

    /// Swift-only: JS number formatting parity. The generated types carry every
    /// contract `number` as a `Double`, so an un-guarded interpolation would
    /// print `72.0` where the web prints `72`.
    func test_jsNumberFormattingParity() {
        XCTAssertEqual(jsNumberString(72), "72")
        XCTAssertEqual(jsNumberString(-3), "-3")
        XCTAssertEqual(jsNumberString(0), "0")
        XCTAssertEqual(jsNumberString(2.5), "2.5")
        XCTAssertEqual(toFixed1(2.5), "2.5")
        XCTAssertEqual(toFixed1(-2.54), "-2.5")
        XCTAssertEqual(toFixed1(3), "3.0")
    }

    /// Swift-only: JSON encoding needs a stable, non-lossy round-trip helper.
    private func roundTrip<T: Codable & Equatable>(_ value: T) throws -> T {
        let data = try JSONEncoder().encode(value)
        return try JSONDecoder().decode(T.self, from: data)
    }

    /// Swift-only: the encoded JSON as a dictionary, so a test can assert that a
    /// key is PRESENT and null (which a decode round-trip cannot distinguish
    /// from a missing key).
    private func jsonObject<T: Encodable>(_ value: T) throws -> [String: Any] {
        let data = try JSONEncoder().encode(value)
        return try XCTUnwrap(
            JSONSerialization.jsonObject(with: data) as? [String: Any]
        )
    }
}
