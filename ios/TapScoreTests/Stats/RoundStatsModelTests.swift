import Foundation
import XCTest

@testable import TapScore

/// One round's reduction: the hole strip's cells, the baseline window, and the
/// gate in front of the round-end story.
///
/// All pure. The three things defended here are the ones that would be wrong
/// silently:
///
///  - a cell that DEFAULTS an unrecorded dimension (a missing putt answer
///    rendering as "0 putts" is a lie the reader cannot tell from a real zero);
///  - a baseline window that contains the round it is the baseline FOR;
///  - a story that appears for a phone that only kept someone else's card.
final class RoundStatsModelTests: XCTestCase {

    // MARK: - Fixtures

    private func measures(_ mutate: (inout StatMeasures) -> Void = { _ in }) -> StatMeasures {
        var m = StatMeasuresMath.zero
        mutate(&m)
        return m
    }

    private func round(
        _ id: String, date: String, name: String? = nil,
        _ measures: StatMeasures = StatMeasuresMath.zero
    ) -> PlayerRoundStats {
        PlayerRoundStats(
            roundId: id, date: date, courseName: "Linköpings GK", courseId: "c1",
            roundType: .full18, venueType: .outdoor, name: name, holeCount: 18,
            measures: measures)
    }

    /// A round with enough recorded to give the waterfall all five terms: an
    /// eighteen of par 4s, every tee shot in the fairway, one green missed and
    /// chipped to inside 2 m. The whole card is in the attribution cohort, so
    /// the per-18 floor is cleared and the round takes part in comparisons.
    private func fullRound(strokes: Double, putts: Double, penalties: Double = 0) -> StatMeasures {
        measures {
            $0.holesScored = 18
            $0.strokesTotal = strokes
            $0.parTotal = 72
            $0.puttsRecorded = 18
            $0.puttsTotal = putts
            $0.firstPutt2To4mResolved = 18
            $0.puttsTotal2To4mResolved = putts
            $0.penaltiesRecorded = 18
            $0.penaltiesTotal = penalties
            $0.scrambleAttemptsStandard = 1
            $0.scrambleFirstPuttStandard = 1
            $0.scrambleInside2mStandard = 1
            $0.attHolesPar45Gir = 17
            $0.attHolesPar45Miss = 1
            $0.attStrokes = strokes
            $0.attPutts = putts
            $0.attPenalties = penalties
            $0.attFairwayPar4 = 18
            $0.attGirFirstPutt2To4m = 17
            $0.attMissStandard = 1
            $0.attChipInside2mStandard = 1
            $0.attSgStrokesEffectiveStandard = 1
        }
    }

    private func holeStats(
        _ playHoleId: String,
        playerId: String = "p-1",
        tee: TeeResult? = nil,
        gir: Bool? = nil,
        firstPutt: FirstPutt? = nil,
        putts: Double? = nil,
        shortGame: ShortGameDifficulty? = nil,
        penalties: Double? = nil,
        recoveryOk: Bool? = nil
    ) -> PlayerHoleStats {
        PlayerHoleStats(
            roundId: "r-1", playHoleId: playHoleId, playerId: playerId, teeResult: tee, gir: gir,
            firstPutt: firstPutt, putts: putts, shortGameDifficulty: shortGame,
            penalties: penalties, recoveryOk: recoveryOk)
    }

    private func hole(
        _ playHoleId: String,
        ordinal: Double,
        holeNumber: Double? = nil,
        par: Double = 4,
        lengthM: Double? = nil,
        score: Double? = nil,
        stats: PlayerHoleStats? = nil
    ) -> PlayerRoundHoleStats {
        PlayerRoundHoleStats(
            playHoleId: playHoleId, ordinal: ordinal, courseHoleNumber: holeNumber ?? ordinal,
            par: par, lengthM: lengthM, score: score, stats: stats ?? holeStats(playHoleId))
    }

    // MARK: - 1. Cell derivation

    func testACellCarriesOnlyTheDimensionsThatWereRecorded() {
        let cell = RoundStatsHoleCell.from(
            hole(
                "h-1", ordinal: 1, holeNumber: 7, par: 4, lengthM: 320, score: 5,
                stats: holeStats("h-1", tee: .trouble, putts: 2)))

        XCTAssertEqual(cell.tee, .trouble)
        XCTAssertEqual(cell.putts, 2)
        // Everything the player did not answer stays nil — not false, not zero.
        XCTAssertNil(cell.gir)
        XCTAssertNil(cell.firstPutt)
        XCTAssertNil(cell.shortGame)
        XCTAssertNil(cell.penalties)
        XCTAssertNil(cell.recoveryOk)
        XCTAssertTrue(cell.hasAnyStat)
        XCTAssertEqual(cell.holeNumber, 7)
        XCTAssertEqual(cell.lengthM, 320)
    }

    func testAHoleWithNoAnswersHasNoStatsButStillHasAScore() {
        let cell = RoundStatsHoleCell.from(hole("h-2", ordinal: 2, par: 3, score: 3))

        XCTAssertFalse(cell.hasAnyStat)
        XCTAssertEqual(cell.strokes, 3)
        XCTAssertEqual(cell.vsPar, 0)
        // Level par has no marker anywhere in this app, and the strip is not
        // where that changes.
        XCTAssertNil(cell.marker)
    }

    func testTheMarkerIsTheAppsOwnScoreVsParDecision() {
        let birdie = RoundStatsHoleCell.from(hole("h-3", ordinal: 3, par: 5, score: 4))
        let double = RoundStatsHoleCell.from(hole("h-4", ordinal: 4, par: 4, score: 6))

        XCTAssertEqual(birdie.marker, ScoreMarkerForm.forScore(strokes: 4, par: 5))
        XCTAssertEqual(birdie.vsPar, -1)
        XCTAssertEqual(double.marker, ScoreMarkerForm.forScore(strokes: 6, par: 4))
        XCTAssertEqual(double.vsPar, 2)
    }

    /// Strokes `0` is the app's pick-up. It must never reach the strip as the
    /// digit zero, which would read as a hole in none.
    func testAPickedUpHoleCarriesNoStrokeCount() {
        let cell = RoundStatsHoleCell.from(hole("h-5", ordinal: 5, par: 4, score: 0))

        XCTAssertTrue(cell.isPickedUp)
        XCTAssertNil(cell.strokes)
        XCTAssertNil(cell.vsPar)
        XCTAssertNil(cell.marker)
    }

    func testAnUnscoredHoleIsNeitherScoredNorPickedUp() {
        let cell = RoundStatsHoleCell.from(hole("h-6", ordinal: 6, par: 4, score: nil))

        XCTAssertFalse(cell.isPickedUp)
        XCTAssertNil(cell.strokes)
    }

    /// A recorded zero and an unrecorded penalty are different facts, and only
    /// the third case draws a flag.
    func testThePenaltyFlagSeparatesRecordedZeroFromUnrecorded() {
        let unrecorded = RoundStatsHoleCell.from(hole("a", ordinal: 1, score: 4))
        let none = RoundStatsHoleCell.from(
            hole("b", ordinal: 2, score: 4, stats: holeStats("b", penalties: 0)))
        let one = RoundStatsHoleCell.from(
            hole("c", ordinal: 3, score: 6, stats: holeStats("c", penalties: 1)))

        XCTAssertNil(unrecorded.penalties)
        XCTAssertFalse(unrecorded.hasPenalty)
        XCTAssertEqual(none.penalties, 0)
        XCTAssertFalse(none.hasPenalty)
        XCTAssertTrue(one.hasPenalty)
    }

    func testTheStripKeepsCanonicalOrdinalOrder() {
        let model = RoundStatsModel.build(
            round: round("r-1", date: "2026-07-30"),
            holes: [hole("c", ordinal: 3), hole("a", ordinal: 1), hole("b", ordinal: 2)],
            history: [])

        XCTAssertEqual(model.cells.map(\.id), ["a", "b", "c"])
        XCTAssertTrue(model.hasHoleStrip)
    }

    // MARK: - 2. Hole wording

    func testTheHoleDetailListsOnlyRecordedDimensions() {
        let cell = RoundStatsHoleCell.from(
            hole(
                "h", ordinal: 1, par: 4, score: 5,
                stats: holeStats("h", tee: .inPlay, gir: false, putts: 2)))

        let titles = RoundStatsCopy.holeLines(cell).map(\.title)

        XCTAssertEqual(titles, ["Score", "Tee shot", "Green in regulation", "Putts"])
        XCTAssertFalse(titles.contains("Penalties"))
        XCTAssertFalse(titles.contains("Short game"))
    }

    func testAHoleWithNothingRecordedAndNoScoreHasNothingToSay() {
        let cell = RoundStatsHoleCell.from(hole("h", ordinal: 1, score: nil))

        XCTAssertTrue(RoundStatsCopy.holeLines(cell).isEmpty)
    }

    /// VoiceOver gets the score from its own sentence and the stats from the
    /// lines after it — but only when there IS a score line to skip.
    ///
    /// A hole with answers and no scorecard entry starts its lines with a STAT,
    /// and dropping the first line unconditionally ate it: the reader heard "no
    /// score" and then never heard about the tee shot.
    func testAnUnscoredHoleKeepsItsFirstStatInTheSpokenCell() {
        let cell = RoundStatsHoleCell.from(
            hole(
                "h", ordinal: 1, par: 4, score: nil,
                stats: holeStats("h", tee: .trouble, gir: false, putts: 2)))

        XCTAssertNil(RoundStatsCopy.scoreLine(cell))
        XCTAssertEqual(
            RoundStatsCopy.holeLines(cell).map(\.title),
            ["Tee shot", "Green in regulation", "Putts"])

        let spoken = RoundStatsCopy.cellAccessibility(cell)

        XCTAssertTrue(spoken.contains("no score"), spoken)
        XCTAssertTrue(spoken.contains("Tee shot Trouble"), spoken)
        XCTAssertTrue(spoken.contains("Green in regulation Missed"), spoken)
        XCTAssertTrue(spoken.contains("Putts 2 putts"), spoken)
    }

    /// The other side of the same rule: a scored hole must not say the score
    /// twice.
    func testAScoredHoleSpeaksItsScoreOnce() {
        let cell = RoundStatsHoleCell.from(
            hole("h", ordinal: 1, par: 4, score: 3, stats: holeStats("h", tee: .fairway)))

        XCTAssertNotNil(RoundStatsCopy.scoreLine(cell))

        let spoken = RoundStatsCopy.cellAccessibility(cell)

        XCTAssertFalse(spoken.contains("Score"), spoken)
        XCTAssertTrue(spoken.contains("3 strokes"), spoken)
        XCTAssertTrue(spoken.contains("Tee shot Fairway"), spoken)
    }

    /// A picked-up hole emits a score line too, so it is dropped like one.
    func testAPickedUpHoleDoesNotLoseItsFirstStatEither() {
        let cell = RoundStatsHoleCell.from(
            hole("h", ordinal: 1, par: 4, score: 0, stats: holeStats("h", tee: .trouble, putts: 3)))

        XCTAssertEqual(RoundStatsCopy.scoreLine(cell)?.value, "Picked up")

        let spoken = RoundStatsCopy.cellAccessibility(cell)

        XCTAssertTrue(spoken.contains("picked up"), spoken)
        XCTAssertTrue(spoken.contains("Tee shot Trouble"), spoken)
        XCTAssertTrue(spoken.contains("Putts 3 putts"), spoken)
    }

    func testEveryFirstPuttBucketIsWordedIncludingTheLegacyThree() {
        // The pre-split buckets still sit in old rounds; they must read as the
        // coarse bands they are rather than borrow a new bucket's name.
        let legacy: [FirstPutt] = [.inside2m, .v2To6m, .over6m]
        for bucket in legacy {
            XCTAssertFalse(RoundStatsCopy.title(bucket).isEmpty)
        }
        XCTAssertEqual(RoundStatsCopy.title(.inside2m), "Inside 2 m")
        XCTAssertNotEqual(RoundStatsCopy.title(.v2To6m), RoundStatsCopy.title(.v2To4m))
    }

    // MARK: - 3. The baseline window

    func testThePriorWindowExcludesTheRoundItself() {
        let target = round("r-3", date: "2026-07-28")
        let history = [
            round("r-1", date: "2026-07-30"),
            round("r-2", date: "2026-07-29"),
            target,
            round("r-4", date: "2026-07-27"),
            round("r-5", date: "2026-07-26"),
        ]

        let window = RoundStatsModel.priorRounds(of: target, in: history, limit: 10)

        XCTAssertEqual(window.map(\.roundId), ["r-4", "r-5"])
        XCTAssertFalse(window.contains { $0.roundId == target.roundId })
    }

    /// The same holds when the caller hands over a history the round is NOT in —
    /// the round is sorted in, so newer rounds never leak into its baseline.
    func testTheWindowNeverTakesRoundsNewerThanTheOne() {
        let target = round("r-3", date: "2026-07-28")
        let history = [
            round("r-1", date: "2026-07-30"), round("r-4", date: "2026-07-27"),
        ]

        XCTAssertEqual(
            RoundStatsModel.priorRounds(of: target, in: history, limit: 10).map(\.roundId), ["r-4"])
    }

    func testTheWindowIsCappedAtTheRequestedSize() {
        let target = round("r-0", date: "2026-07-30")
        let history = (1...20).map { round("r-\($0)", date: String(format: "2026-07-%02d", 30 - $0)) }

        XCTAssertEqual(RoundStatsModel.priorRounds(of: target, in: history, limit: 3).count, 3)
    }

    func testAFirstRoundHasNoPersonalBaselineRatherThanAZeroedOne() {
        let model = RoundStatsModel.build(
            round: round("r-1", date: "2026-07-30", fullRound(strokes: 84, putts: 34)),
            holes: [], history: [])

        XCTAssertNil(model.deltas)
        XCTAssertEqual(model.windowCount, 0)
        // The fixed-baseline waterfall still exists — that is what the story
        // falls back to.
        XCTAssertNotNil(model.waterfall.putting)
        XCTAssertFalse(model.hasHoleStrip)
    }

    func testTheDeltasComeFromThePriorRoundsOnly() {
        let target = round("r-1", date: "2026-07-30", fullRound(strokes: 80, putts: 28))
        let history = [
            target,
            round("r-2", date: "2026-07-29", fullRound(strokes: 88, putts: 36)),
            round("r-3", date: "2026-07-28", fullRound(strokes: 88, putts: 36)),
        ]

        let model = RoundStatsModel.build(round: target, holes: [], history: history)

        XCTAssertEqual(model.windowCount, 2)
        // A better putting round than both priors reads as a NEGATIVE delta —
        // fewer strokes lost than usual.
        guard let putting = model.deltas?.putting else { return XCTFail("expected a putting delta") }
        XCTAssertLessThan(putting, 0)
    }

    func testThePanelsAreThisRoundAlone() {
        let target = round("r-1", date: "2026-07-30", fullRound(strokes: 80, putts: 28))
        let model = RoundStatsModel.build(
            round: target, holes: [],
            history: [target, round("r-2", date: "2026-07-29", fullRound(strokes: 95, putts: 40))])

        XCTAssertEqual(model.panels.roundCount, 1)
        XCTAssertEqual(model.panels.rounds.map(\.id), ["r-1"])
    }

    func testTheTitlePrefersTheRoundNameThenTheCourse() {
        let named = RoundStatsModel.build(
            round: round("r-1", date: "2026-07-30", name: "Thursday swindle"), holes: [],
            history: [])
        let unnamed = RoundStatsModel.build(
            round: round("r-2", date: "2026-07-30"), holes: [], history: [])

        XCTAssertEqual(named.title, "Thursday swindle")
        XCTAssertEqual(unnamed.title, "Linköpings GK")
    }

    // MARK: - 4. Story eligibility

    private func eligibility(
        signedIn: String? = "p-1",
        configured: Set<String> = ["p-1"],
        rows: [PlayerHoleStats]? = nil,
        unscored: Int? = 0
    ) -> RoundStoryEligibility {
        RoundStoryEligibility.evaluate(
            signedInPlayerId: signedIn, statConfigPlayerIds: configured,
            statRows: rows ?? [holeStats("h-1", putts: 2)], holesUnscored: unscored)
    }

    func testAFinishedRoundWithYourOwnStatsIsEligible() {
        let result = eligibility()

        XCTAssertTrue(result.isEligible)
        XCTAssertEqual(result.playerId, "p-1")
    }

    /// The round flow works logged out; the story cannot, and must not try.
    func testALoggedOutReaderGetsNoStory() {
        XCTAssertEqual(eligibility(signedIn: nil).reason, .notSignedIn)
        XCTAssertEqual(eligibility(signedIn: "").reason, .notSignedIn)
        XCTAssertNil(eligibility(signedIn: nil).playerId)
    }

    /// The scorer-for-others case: this phone kept three cards and recorded
    /// nothing of its own. Nothing is the correct output — not an empty state.
    func testAScorerWithNoStatsOfTheirOwnGetsNoStory() {
        let others = [
            holeStats("h-1", playerId: "p-2", putts: 2),
            holeStats("h-2", playerId: "p-3", putts: 3),
        ]

        XCTAssertEqual(
            eligibility(configured: ["p-2", "p-3"], rows: others).reason, .noStatsConfigured)
    }

    func testConfiguredButUnansweredIsNotAStory() {
        XCTAssertEqual(eligibility(rows: []).reason, .noStatsRecorded)
        // A row that exists but carries no answer is a projection artefact.
        XCTAssertEqual(eligibility(rows: [holeStats("h-1")]).reason, .noStatsRecorded)
    }

    func testAStatRowForSomebodyElseDoesNotCountAsYours() {
        XCTAssertEqual(
            eligibility(rows: [holeStats("h-1", playerId: "p-2", putts: 2)]).reason,
            .noStatsRecorded)
    }

    func testAnUnfinishedCardIsNotAStoryYet() {
        XCTAssertEqual(eligibility(unscored: 3).reason, .roundUnfinished)
        // No ball at all in the round is not a finished card either.
        XCTAssertEqual(eligibility(unscored: nil).reason, .roundUnfinished)
    }

    // MARK: - 5. Insight wording

    /// Every id in the closed set has a sentence.
    ///
    /// This is the test the `CaseIterable` conformance exists for: add a rule to
    /// `StatMeasuresMath` and this fails until somebody words it. The switch in
    /// `RoundStoryCopy` has no `default:`, so the compiler catches it first —
    /// this catches the case that compiles but says nothing.
    func testEveryInsightIdIsWorded() {
        for id in InsightID.allCases {
            let bare = RoundStoryCopy.line(InsightLine(id: id, params: [:]))
            XCTAssertFalse(
                bare.trimmingCharacters(in: .whitespaces).isEmpty,
                "\(id.rawValue) has no wording")
            XCTAssertFalse(
                bare.contains(id.rawValue), "\(id.rawValue) leaks its id into the sentence")
        }
    }

    func testTheClosedSetIsStillEight() {
        // A guard on the set's size, so growing it is a deliberate act that
        // walks past this line and the wording test above.
        XCTAssertEqual(InsightID.allCases.count, 8)
    }

    func testTheWordedLinesCarryTheirNumbers() {
        let worse = RoundStoryCopy.line(
            InsightLine(
                id: .componentWorstVsBaseline,
                params: ["component": .component(.putting), "delta": .number(1.2)]))
        XCTAssertTrue(worse.contains("Putting"), worse)
        XCTAssertTrue(worse.contains("1.2"), worse)

        let free = RoundStoryCopy.line(
            InsightLine(
                id: .threePuttFree, params: ["putts": .number(29), "holes": .number(18)]))
        // Counts read as counts.
        XCTAssertTrue(free.contains("29"), free)
        XCTAssertFalse(free.contains("29.0"), free)
    }

    func testEveryWaterfallComponentHasAReadersName() throws {
        for component in StrokesLostComponent.allCases {
            let name = RoundStoryCopy.name(component)
            XCTAssertFalse(name.isEmpty)
            // Prose, not the identifier: never the bare case name, and never a
            // camelCase token leaking out of the enum.
            XCTAssertNotEqual(name, component.rawValue)
            XCTAssertFalse(name.contains("shortGame"))
            let first = try XCTUnwrap(name.first)
            XCTAssertTrue(first.isUppercase)
        }
    }

    // MARK: - 6. Baseline delta wording

    func testTheBaselineDeltaLineNamesTheDirectionAndTheWindow() {
        XCTAssertTrue(
            RoundStatsCopy.baselineDelta(1.4, windowCount: 10).contains("worse"))
        XCTAssertTrue(
            RoundStatsCopy.baselineDelta(-1.4, windowCount: 10).contains("better"))
        XCTAssertTrue(
            RoundStatsCopy.baselineDelta(1.4, windowCount: 10).contains("last 10"))
        // A window of one is a previous ROUND, not "your last 1 rounds".
        XCTAssertFalse(RoundStatsCopy.baselineDelta(1.4, windowCount: 1).contains("last 1 "))
    }

    func testAnUnchangedComponentDoesNotClaimAChange() {
        let line = RoundStatsCopy.baselineDelta(0.01, windowCount: 10)

        XCTAssertFalse(line.contains("worse"))
        XCTAssertFalse(line.contains("better"))
    }
}
