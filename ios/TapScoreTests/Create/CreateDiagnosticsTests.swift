import XCTest
@testable import TapScore

/// Pins how a refusal reaches the user: which card it lands on, and what it
/// says once it gets there.
///
/// The contract under test (game-rules.md, "Setup refusals must be actionable")
/// has two halves. **Bucketing** is by STRUCTURED index — `formatIndex` from
/// the builder, `slotIndex` from the compiler — never by parsing `path`, which
/// is display text carrying server-internal def-ids. **Wording** is built from
/// the diagnostic's structured fields in the setup UI's own vocabulary, with
/// the raw compiler message as a never-swallow fallback.
final class CreateDiagnosticsTests: XCTestCase {
    private let label: (String) -> String? = { id in
        ["stableford_individual": "Stableford", "taliban_better_ball": "Taliban"][id]
    }

    // MARK: - Bucketing

    func testSlotIndexBucketsOntoTheSameCardAsFormatIndex() {
        let fromCompiler = diagnostic(code: "x", path: "slots[slot-0].balls", slotIndex: 0)
        let fromBuilder = diagnostic(code: "y", path: "formats[0]", formatIndex: 0)
        XCTAssertEqual(CreateDiagnostics.formatCardIndex(fromCompiler), 0)
        XCTAssertEqual(CreateDiagnostics.formatCardIndex(fromBuilder), 0)
        XCTAssertEqual(
            CreateDiagnostics.forFormatCard([fromCompiler, fromBuilder], index: 0).count, 2)
    }

    /// A `path` naming a def-id must not be mined for a card index: the def-id
    /// is the server's, and `slots[slot-3]` is not "card 3".
    func testPathIsNeverParsedForAnIndex() {
        let d = diagnostic(code: "x", path: "slots[slot-3].teamGrouping")
        XCTAssertNil(CreateDiagnostics.formatCardIndex(d))
        XCTAssertTrue(CreateDiagnostics.forFormatCard([d], index: 3).isEmpty)
        XCTAssertEqual(CreateDiagnostics.general([d]).count, 1)
    }

    func testPlayerRowBucketingIsPerRow() {
        let first = diagnostic(code: "missing_name", path: "producers[0].name")
        let second = diagnostic(code: "missing_tee", path: "producers[1].teeId")
        XCTAssertEqual(CreateDiagnostics.forPlayerRow([first, second], index: 0), [first])
        XCTAssertEqual(CreateDiagnostics.forPlayerRow([first, second], index: 1), [second])
        XCTAssertEqual(CreateDiagnostics.forPlayers([first, second]).count, 2)
    }

    /// The general bucket is what nothing else claims — and it must not claim
    /// anything a card or a row already shows, or the same refusal appears
    /// twice.
    func testGeneralBucketExcludesEverythingAlreadyPlaced() {
        let card = diagnostic(code: "a", path: "slots[slot-0]", slotIndex: 0)
        let row = diagnostic(code: "b", path: "producers[0].name")
        let group = diagnostic(code: "c", path: "playingGroups[0]")
        let route = diagnostic(code: "d", path: "route")
        let loose = diagnostic(code: "e", path: nil)
        XCTAssertEqual(
            CreateDiagnostics.general([card, row, group, route, loose]).map(\.code), ["e"])
    }

    // MARK: - Wording

    func testBallCountBoundsReadAsPlayerCounts() {
        XCTAssertEqual(
            humanize(diagnostic(
                code: "slot_ball_count_above_max",
                path: "slots[slot-0].balls",
                formatId: "stableford_individual",
                actual: 3,
                allowedMax: 2)),
            "3 players in Stableford — it scores at most 2.")
        XCTAssertEqual(
            humanize(diagnostic(
                code: "slot_ball_count_below_min",
                path: "slots[slot-0].balls",
                formatId: "stableford_individual",
                actual: 1,
                allowedMin: 2)),
            "1 player in Stableford — it needs at least 2.")
    }

    func testTeamBoundsNameTheTeam() {
        XCTAssertEqual(
            humanize(diagnostic(
                code: "team_size_above_max",
                path: "teams[0]",
                formatId: "taliban_better_ball",
                teamLabel: "Team A",
                actual: 3,
                allowedMax: 2)),
            "Team A has 3 players — Taliban allows at most 2 per team.")
        XCTAssertEqual(
            humanize(diagnostic(
                code: "team_count_below_min",
                path: "slots[slot-0].teamGrouping",
                formatId: "taliban_better_ball",
                actual: 1,
                allowedMin: 2)),
            "1 teams — Taliban needs at least 2.")
    }

    /// `ball_mode_violation` reads in OPPOSITE directions depending on the
    /// offending ball's size — the same code, two different fixes.
    func testBallModeViolationReadsBothDirections() {
        XCTAssertEqual(
            humanize(diagnostic(
                code: "ball_mode_violation",
                path: "slots[slot-0]",
                formatId: "stableford_individual",
                actual: 2)),
            "Stableford is played with everyone on their own ball — a combined team ball can't play it.")
        XCTAssertEqual(
            humanize(diagnostic(
                code: "ball_mode_violation",
                path: "slots[slot-0]",
                formatId: "taliban_better_ball",
                actual: 1)),
            "Taliban is played on one shared team ball — group the players into a team instead of scoring them individually.")
    }

    /// No engine jargon leaks: a refusal never says "slot", "ball mode" or
    /// "producer" to somebody setting up a round.
    func testWordingCarriesNoEngineJargon() {
        let all = [
            diagnostic(
                code: "missing_team_grouping", path: "slots[slot-0]",
                formatId: "stableford_individual"),
            diagnostic(
                code: "producer_count_violation", path: "slots[slot-0]",
                formatId: "stableford_individual", actual: 2, allowedMin: 1, allowedMax: 1),
            diagnostic(code: "scored_hole_removed", path: "route"),
            diagnostic(code: "round_complete", path: nil),
        ]
        for d in all {
            let text = humanize(d).lowercased()
            for jargon in ["slot", "ball mode", "producer", "def-id"] {
                XCTAssertFalse(text.contains(jargon), "\(d.code) leaked \(jargon): \(text)")
            }
        }
    }

    /// A code this client predates, or a known code missing the fields its
    /// sentence needs, keeps the server's own message. Never a blank card.
    func testUnknownAndUnderspecifiedCodesFallBackToTheMessage() {
        XCTAssertEqual(
            humanize(diagnostic(code: "some_future_code", path: nil)),
            "raw compiler message")
        XCTAssertEqual(
            humanize(diagnostic(
                code: "team_size_above_max", path: nil, formatId: "stableford_individual")),
            "raw compiler message")
    }

    /// An unknown format id must not blank out the sentence — the id itself is
    /// better than nothing.
    func testUnknownFormatIdFallsBackToTheId() {
        XCTAssertEqual(
            humanize(diagnostic(
                code: "slot_ball_count_above_max",
                path: "slots[slot-0].balls",
                formatId: "mystery_format",
                actual: 3,
                allowedMax: 2)),
            "3 players in mystery_format — it scores at most 2.")
    }

    // MARK: - Helpers

    private func humanize(_ d: CompilerDiagnostic) -> String {
        CreateDiagnostics.humanize(d, label: label)
    }

    private func diagnostic(
        code: String,
        path: String?,
        formatIndex: Double? = nil,
        slotIndex: Double? = nil,
        formatId: String? = nil,
        teamLabel: String? = nil,
        actual: Double? = nil,
        allowedMin: Double? = nil,
        allowedMax: Double? = nil
    ) -> CompilerDiagnostic {
        CompilerDiagnostic(
            code: code,
            message: "raw compiler message",
            path: path,
            formatIndex: formatIndex,
            slotIndex: slotIndex,
            formatId: formatId,
            teamLabel: teamLabel,
            actual: actual,
            allowedMin: allowedMin,
            allowedMax: allowedMax)
    }
}

/// Pins `HandicapInput`, the one place a typed index becomes a number. Golf
/// writes a plus-handicap as "+2.4" meaning BELOW scratch — reading that as
/// positive 2.4 would hand a scratch player four strokes.
final class HandicapInputTests: XCTestCase {
    func testParsesTheFormsPeopleType() {
        XCTAssertEqual(HandicapInput.parse("18.4"), 18.4)
        XCTAssertEqual(HandicapInput.parse("18,4"), 18.4, "a Swedish decimal comma")
        XCTAssertEqual(HandicapInput.parse(" 12 "), 12)
        XCTAssertEqual(HandicapInput.parse("+2.4"), -2.4, "plus means below scratch")
        XCTAssertEqual(HandicapInput.parse("-2.4"), -2.4)
    }

    func testRejectsWhatIsNotANumber() {
        XCTAssertNil(HandicapInput.parse("about twelve"))
        XCTAssertNil(HandicapInput.parse(""))
    }

    func testFormatsBelowScratchWithAPlus() {
        XCTAssertEqual(HandicapInput.format(-2.4), "+2.4")
        XCTAssertEqual(HandicapInput.format(18.4), "18.4")
        XCTAssertEqual(HandicapInput.format(12), "12")
    }
}
