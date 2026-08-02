import XCTest

@testable import TapScore

/// The info popover is the ONE place either client explains the waterfall, and
/// the owner ruling is that every sentence quotes the reader's own data. These
/// assertions are on the copy itself, string for string, so a card cannot drift
/// back into a static explainer that says the same thing to a player with 51
/// attributed holes and a player with 3.
///
/// Twin of the web's `SG_INFO_COPY` suite.
final class StrokesGainedInfoSheetTests: XCTestCase {

    private func lost(attributed: Double, holesScored: Double, total: Double?) -> StrokesLost {
        StrokesLost(
            tee: 0, approach: 0, shortGame: 0, putting: 0, penalties: 0, total: total,
            coverage: StrokesLostCoverage(attributed: attributed, holesScored: holesScored))
    }

    func testTheCardsAreTheFiveTitlesInReadingOrder() {
        let cards = StrokesGainedInfoSheet.sentences(
            waterfall: lost(attributed: 18, holesScored: 18, total: -2))
        XCTAssertEqual(
            cards.map(\.title),
            [
                "Holes counted", "The five rows", "The baseline", "Per 18 holes", "The total",
            ])
    }

    /// The one sentence in the app allowed to say what method this is — the
    /// cards themselves stay in plain words.
    func testTheStrokesGainedPhraseAppearsExactlyOnceAcrossEveryCard() {
        let cards = StrokesGainedInfoSheet.sentences(
            waterfall: lost(attributed: 18, holesScored: 18, total: -2))
        let hits = cards.filter { $0.sentence.contains("strokes gained-style method") }
        XCTAssertEqual(hits.count, 1)
        XCTAssertEqual(hits.first?.title, "The five rows")
        // …and the baseline is NAMED wherever it is mentioned, never left as a
        // bare "vs expected".
        for card in cards where card.sentence.contains("baseline v1") {
            XCTAssertTrue(card.sentence.contains("Tapscore reference baseline v1"))
        }
        XCTAssertFalse(cards.contains { $0.sentence.contains("vs expected") })
    }

    // MARK: - Card 1: holes counted

    func testTheCoverageSentenceQuotesTheReadersOwnHoles() {
        XCTAssertEqual(
            StatsCopy.sgInfoHolesCounted(attributed: 41, holesScored: 54, perRound: false),
            "41 of your 54 holes could be fully attributed \u{2014} the others are missing a tee, green or putt answer, so they are left out of every row rather than guessed at."
        )
        XCTAssertEqual(
            StatsCopy.sgInfoHolesCounted(attributed: 14, holesScored: 18, perRound: true),
            "14 of this round\u{2019}s 18 holes could be fully attributed \u{2014} the others are missing a tee, green or putt answer, so they are left out of every row rather than guessed at."
        )
    }

    func testFullCoverageSaysSoRatherThanQuotingTheSameNumberTwice() {
        XCTAssertEqual(
            StatsCopy.sgInfoHolesCounted(attributed: 54, holesScored: 54, perRound: false),
            "All 54 of your holes could be fully attributed.")
        XCTAssertEqual(
            StatsCopy.sgInfoHolesCounted(attributed: 18, holesScored: 18, perRound: true),
            "All 18 of this round\u{2019}s holes could be fully attributed.")
    }

    func testNoCoverageSaysThereIsNothingToShowAndWhy() {
        XCTAssertEqual(
            StatsCopy.sgInfoHolesCounted(attributed: 0, holesScored: 12, perRound: false),
            "None of your 12 holes has the full set of answers yet, so there is nothing to show. A hole counts once it has a tee answer, a green answer and a putt answer."
        )
        XCTAssertEqual(
            StatsCopy.sgInfoHolesCounted(attributed: 0, holesScored: 9, perRound: true),
            "None of this round\u{2019}s 9 holes has the full set of answers yet, so there is nothing to show. A hole counts once it has a tee answer, a green answer and a putt answer."
        )
    }

    // MARK: - Card 3: the baseline

    /// The v1 tables are unfitted, and the copy says so instead of implying a
    /// precision the numbers do not have.
    func testAnUncalibratedBaselineAdmitsItIsProvisional() {
        let sentence = StatsCopy.sgInfoBaseline(calibratedAt: nil)
        XCTAssertEqual(
            sentence,
            "Measured against the 12 handicap reference \u{2014} no handicap on your profile yet. Change it under \u{201C}Compared to\u{201D}. Each tier is one set of expected scores per hole and per lie. The tiers are still provisional, so treat the order of the rows as the reading and the sizes as rough."
        )
        // The shipping default is the provisional one, so this is what a reader
        // actually sees today.
        XCTAssertEqual(StatsCopy.sgInfoBaseline(calibratedAt: SgTablesV1.calibratedAt), sentence)
    }

    /// Since the tiers landed the card must name WHICH of the four references
    /// this reader is on, and how they got there — the ⓘ ruling, applied to the
    /// one sentence that used to be the same for everyone.
    func testTheBaselineCardNamesTheTierAndHowTheReaderLandedOnIt() {
        // Auto, with a handicap: the tier and the number that chose it.
        XCTAssertEqual(
            StatsCopy.sgInfoBaseline(
                calibratedAt: nil,
                baseline: SgBaselineContext(choice: .auto, handicapIndex: -1.2)),
            "Measured against the Scratch reference \u{2014} matched to your +1.2 handicap. Change it under \u{201C}Compared to\u{201D}. Each tier is one set of expected scores per hole and per lie. The tiers are still provisional, so treat the order of the rows as the reading and the sizes as rough."
        )
        // Pinned by hand: the handicap is not mentioned, because it did not
        // decide anything.
        let pinned = StatsCopy.sgInfoBaseline(
            calibratedAt: nil, baseline: SgBaselineContext(choice: .hcp20, handicapIndex: 3.0))
        XCTAssertTrue(
            pinned.hasPrefix(
                "Measured against the 20+ handicap reference \u{2014} you picked this under \u{201C}Compared to\u{201D}."
            ))
        XCTAssertFalse(pinned.contains("3.0"))
    }

    /// The unqualified "everyone is measured against the same table" claim died
    /// with the single baseline; a scratch player and a 20-handicap read
    /// different tables. The sentence survives ONLY narrowed to this reference.
    func testACalibratedBaselineQuotesTheDateAndNarrowsTheSameTableClaim() {
        let sentence = StatsCopy.sgInfoBaseline(
            calibratedAt: "2026-09-01",
            baseline: SgBaselineContext(choice: .hcp5, handicapIndex: 6.0))
        XCTAssertEqual(
            sentence,
            "Measured against the 5 handicap reference \u{2014} you picked this under \u{201C}Compared to\u{201D}. Each tier is one set of expected scores per hole and per lie. This tier was frozen on 2026-09-01. Everyone on this reference is measured against the same table, so your rows can be compared with each other and with your own earlier rounds."
        )
        XCTAssertFalse(sentence.contains("Everyone is measured against the same table"))
    }

    /// The date and the tier name come from ONE value, so the sheet cannot name
    /// one reference and quote another's freeze date.
    func testTheSheetQuotesTheResolvedTiersOwnFreezeDate() throws {
        let baseline = SgBaselineContext(choice: .scratch, handicapIndex: 25)
        let cards = StrokesGainedInfoSheet.sentences(
            waterfall: lost(attributed: 18, holesScored: 18, total: -2), baseline: baseline)
        let card = try XCTUnwrap(cards.first { $0.title == "The baseline" })
        XCTAssertEqual(
            card.sentence,
            StatsCopy.sgInfoBaseline(
                calibratedAt: baseline.bundle.tables.calibratedAt, baseline: baseline))
        XCTAssertTrue(card.sentence.hasPrefix("Measured against the Scratch reference"))
    }

    // MARK: - Card 4: per 18

    func testThePer18CardQuotesTheRealFloor() {
        XCTAssertEqual(
            StatsCopy.sgInfoPer18(minAttributed: StatMeasuresMath.minAttributedForDelta),
            "Rows are scaled to 18 attributed holes, so a nine and an eighteen sit on the same scale. A round with fewer than 9 attributed holes is left out of the comparison entirely."
        )
    }

    // MARK: - Card 5: the total

    func testTheTotalCardCountsTheRoundsItIsSummarising() {
        XCTAssertEqual(
            StatsCopy.sgInfoTotal(signedTotal: "\u{2212}2.4", windowRounds: 7, perRound: false),
            "Over these 7 rounds the five rows add up to \u{2212}2.4 strokes against the baseline.")
        XCTAssertEqual(
            StatsCopy.sgInfoTotal(signedTotal: "+1.4", windowRounds: 1, perRound: false),
            "Over this round the five rows add up to +1.4 strokes against the baseline.")
        XCTAssertEqual(
            StatsCopy.sgInfoTotal(signedTotal: "+1.4", windowRounds: 1, perRound: true),
            "The five rows add up to +1.4 strokes against the baseline.")
    }

    func testTheTotalCardInterpolatesThePer18FigureNotTheRawTerm() throws {
        // 14 attributed holes losing 1.10 strokes is +1.4 per 18, and +1.4 is
        // what the card must say — the same figure the row above it shows.
        let w = StrokesLost(
            tee: 1, approach: 0, shortGame: -2.56, putting: 0.66, penalties: 2, total: 1.10,
            coverage: StrokesLostCoverage(attributed: 14, holesScored: 18))
        let cards = StrokesGainedInfoSheet.sentences(waterfall: w, windowRounds: 3)
        let total = try XCTUnwrap(cards.last)
        XCTAssertEqual(total.title, "The total")
        XCTAssertEqual(
            total.sentence,
            "Over these 3 rounds the five rows add up to +1.4 strokes against the baseline.")
    }

    /// The sentence says "the five rows add up to", so the figure is the SUM OF
    /// THE ROWS ON SCREEN, not the window's ratio-of-sums total — the two differ
    /// once a window mixes rounds of different attributed counts, and only one of
    /// them makes the sentence true.
    func testTheTotalIsTheSumOfTheRowsItWasHandedNotAnyOtherTotal() throws {
        let rows: [Double?] = [0.4, -1.25, 0.15, 0.9, 0.3]
        XCTAssertEqual(try XCTUnwrap(StrokesGainedInfoSheet.rowSum(rows)), 0.5, accuracy: 1e-12)
        // The waterfall's own per-18 total is a different number entirely, and
        // the card must not reach for it.
        let cards = StrokesGainedInfoSheet.sentences(
            waterfall: lost(attributed: 40, holesScored: 54, total: -9), rowsPer18: rows,
            windowRounds: 3)
        XCTAssertEqual(
            try XCTUnwrap(cards.last).sentence,
            "Over these 3 rounds the five rows add up to +0.5 strokes against the baseline.")
    }

    func testARowSumIsAllOrNothingNeverAPartialSum() {
        XCTAssertNil(StrokesGainedInfoSheet.rowSum([]))
        XCTAssertNil(StrokesGainedInfoSheet.rowSum([1, nil, 1, 1, 1]))
        XCTAssertNil(StrokesGainedInfoSheet.rowSum([nil, nil, nil, nil, nil]))
    }

    /// A round under the floor has NO comparable total, and the card is dropped
    /// rather than filled with the raw term — inventing a comparable figure is
    /// exactly what the floor exists to stop.
    func testTheTotalCardIsAbsentBelowThePer18Floor() {
        let cards = StrokesGainedInfoSheet.sentences(
            waterfall: lost(attributed: 5, holesScored: 6, total: -2.2))
        XCTAssertEqual(cards.count, 4)
        XCTAssertFalse(cards.contains { $0.title == "The total" })
        XCTAssertEqual(
            cards[0].sentence,
            "5 of your 6 holes could be fully attributed \u{2014} the others are missing a tee, green or putt answer, so they are left out of every row rather than guessed at."
        )
    }

    func testAnEmptyCohortStillExplainsItselfAndShowsNoTotal() {
        let cards = StrokesGainedInfoSheet.sentences(
            waterfall: lost(attributed: 0, holesScored: 4, total: nil), perRound: true)
        XCTAssertEqual(cards.count, 4)
        XCTAssertTrue(cards[0].sentence.hasPrefix("None of this round\u{2019}s 4 holes"))
    }

    // MARK: Penalty source (§E.6)
    //
    // Twin of the web's `sg-info-copy` penalty-source cases. The bar itself does
    // not change; the breakdown lives here, as one appended card with live
    // numbers.

    private func penaltySource(recorded: Double, tee: Double, approach: Double, short: Double)
        -> PenaltySourceCounts?
    {
        var m = StatMeasuresMath.zero
        m.penaltySourceRecorded = recorded
        m.penaltiesTee = tee
        m.penaltiesApproach = approach
        m.penaltiesShort = short
        return PenaltySourceCounts(m)
    }

    func testThePenaltySourceCardIsAppendedLastWithAbsoluteCounts() throws {
        let cards = StrokesGainedInfoSheet.sentences(
            waterfall: lost(attributed: 18, holesScored: 18, total: -2), windowRounds: 3,
            penaltySource: penaltySource(recorded: 5, tee: 3, approach: 1, short: 1))
        let card = try XCTUnwrap(cards.last)
        XCTAssertEqual(card.title, "Where the penalties came from")
        XCTAssertEqual(
            card.sentence,
            "Of 5 penalty holes you labelled, 3 came off the tee, 1 on the approach and 1 around the green."
        )
    }

    /// Absolute counts on purpose: the labelled sample is usually a handful of
    /// holes, and the rate floor would suppress every percentage and with it the
    /// whole card. It says "hole", not "holes" — a sample of one is the COMMON
    /// case for this card, so the singular is not an edge to be tolerated.
    func testThePenaltySourceCardSurvivesASampleTooThinForAnyPercentage() throws {
        let cards = StrokesGainedInfoSheet.sentences(
            waterfall: lost(attributed: 18, holesScored: 18, total: -2), windowRounds: 3,
            penaltySource: penaltySource(recorded: 1, tee: 1, approach: 0, short: 0))
        let card = try XCTUnwrap(cards.last)
        XCTAssertEqual(
            card.sentence,
            "Of 1 penalty hole you labelled, 1 came off the tee, 0 on the approach and 0 around the green."
        )
        XCTAssertFalse(card.sentence.contains("%"))
    }

    /// The gate is the failable init, so a caller cannot construct an empty
    /// breakdown to render.
    func testThePenaltySourceCardIsDroppedNeverZeroedWhenNothingWasLabelled() {
        XCTAssertNil(penaltySource(recorded: 0, tee: 0, approach: 0, short: 0))
        let cards = StrokesGainedInfoSheet.sentences(
            waterfall: lost(attributed: 18, holesScored: 18, total: -2), windowRounds: 3)
        XCTAssertFalse(cards.contains { $0.title == "Where the penalties came from" })
    }
}
