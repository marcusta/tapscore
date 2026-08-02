import Foundation
import XCTest

@testable import TapScore

/// The client half of the stats story: the server's per-round COUNTS in, windows,
/// rates and the strokes-lost waterfall out. The case-for-case twin of
/// `tests/round/stat-measures.test.ts` — the two suites are the shared
/// specification of the same pure module, so a change to one belongs in both.
///
/// The fixture below is deliberately not invented here: it is the exact row
/// `server/services/player-stats-aggregates.test.ts` asserts for its worked
/// example, so server counts → client rates → waterfall are one continuous,
/// verified story. Change the fixture only when that server test changes.
final class StatMeasuresMathTests: XCTestCase {

    private func measures(_ mutate: (inout StatMeasures) -> Void = { _ in }) -> StatMeasures {
        var m = StatMeasuresMath.zero
        mutate(&m)
        return m
    }

    /// The worked example, six holes, pars 4/4/3/5/4/4:
    ///
    ///  H1 par 4, 4 strokes — fairway, GIR, first putt 2-4m, 2 putts, 0 penalties
    ///  H2 par 4, 6 strokes — trouble, recovery OK, missed green, STANDARD chip to
    ///                        inside 2m, 1 putt, 1 penalty        → double bogey
    ///  H3 par 3, 2 strokes — no tee question, missed green, HARD chip, 0 putts
    ///                        (holed it), no first-putt bucket    → bounce-back
    ///  H4 par 5, 6 strokes — in play, GIR, first putt over 8m, 3 putts
    ///  H5 par 4, 3 strokes — fairway, GIR, first putt inside 2m, 1 putt → birdie
    ///  H6 par 4, 4 strokes — SCORED, nothing recorded at all
    private lazy var workedExample: StatMeasures = measures { m in
        m.teeRecorded = 4
        m.fairwayHits = 2
        // Cumulative: the two fairways are also "in play".
        m.inPlayHits = 3
        m.troubleCount = 1
        m.girRecorded = 5
        m.girHits = 3
        m.firstPuttRecorded = 4
        m.firstPuttInside1m = 2
        m.firstPutt2To4m = 1
        m.firstPuttOver8m = 1
        m.firstPuttInside1mResolved = 2
        m.firstPutt2To4mResolved = 1
        m.firstPuttOver8mResolved = 1
        m.onePuttInside1m = 2
        m.puttsRecorded = 5
        m.puttsTotal = 7
        m.threePutts = 1
        m.threePuttsFromOver8m = 1
        m.scrambleAttemptsStandard = 1
        m.scrambleSuccessesStandard = 1
        m.scrambleAttemptsHard = 1
        m.scrambleSuccessesHard = 1
        // H3 was holed from off the green: no bucket, so no chip-close sample —
        // it is counted as a holed chip instead.
        m.scrambleFirstPuttStandard = 1
        m.scrambleInside2mStandard = 1
        m.scrambleHoledHard = 1
        m.penaltiesRecorded = 2
        m.penaltiesTotal = 1
        m.recoveryAttempts = 1
        m.recoverySuccesses = 1
        m.holesScored = 6
        m.strokesTotal = 25
        m.parTotal = 24
        m.holesScoredPar3 = 1
        m.strokesPar3 = 2
        m.holesScoredPar4 = 4
        m.strokesPar4 = 17
        m.holesScoredPar5 = 1
        m.strokesPar5 = 6
        // The score-type histogram: H3 and H5 are birdies, H1 and H6 pars, H4 a
        // bogey, H2 a double. 0 + 2 + 2 + 1 + 1 = 6 = holesScored.
        m.holesBirdie = 2
        m.holesPar = 2
        m.holesBogey = 1
        m.doubleBogeyPlus = 1
        m.girHolesScored = 3
        m.birdiesOnGir = 1
        m.bounceBackOpportunities = 1
        m.bounceBackSuccesses = 1
        m.holesScoredFairway = 2
        m.strokesVsParFairway = -1
        m.holesScoredInPlay = 1
        m.strokesVsParInPlay = 1
        m.holesScoredTrouble = 1
        m.strokesVsParTrouble = 2
        m.girRecordedFairway = 2
        m.girHitsFairway = 2
        m.girRecordedInPlay = 1
        m.girHitsInPlay = 1
        m.girRecordedTrouble = 1
        m.girHitsTrouble = 0
        m.girFirstPuttRecorded = 3
        m.girFirstPuttInside1m = 1
        m.girFirstPutt2To4m = 1
        m.girFirstPuttOver8m = 1
        m.puttsRecordedGir = 3
        m.puttsTotalGir = 6
        m.puttsTotalInside1mResolved = 2
        m.puttsTotal2To4mResolved = 2
        m.puttsTotalOver8mResolved = 3
        // Cost of a missed green. Hit = H1 (E), H4 (+1), H5 (−1) → 0 over 3.
        // Miss = H2 (+2), H3 (−1) → +1 over 2.
        m.strokesVsParGirHit = 0
        m.holesScoredGirMiss = 2
        m.strokesVsParGirMiss = 1
        // GIR by par: H3 is the par 3 (missed), H1/H2/H5 the par 4s (2 hit),
        // H4 the par 5 (hit). 1 + 3 + 1 = 5 = girRecorded.
        m.girRecordedPar3 = 1
        m.girHitsPar3 = 0
        m.girRecordedPar4 = 3
        m.girHitsPar4 = 2
        m.girRecordedPar5 = 1
        m.girHitsPar5 = 1
        // The putt-count partition: H3 holed it (0), H2 and H5 one-putted,
        // H1 two-putted, H4 three-putted. 1 + 2 + 1 + threePutts(1) = 5.
        m.holesZeroPutt = 1
        m.holesOnePutt = 2
        m.holesTwoPutt = 1
        // Putts by par: H3 alone on the par 3 with none; H1+H2+H5 = 2+1+1 on
        // the par 4s; H4's 3 on the par 5. 1+3+1 = 5, 0+4+3 = 7 = puttsTotal.
        m.puttsRecordedPar3 = 1
        m.puttsTotalPar3 = 0
        m.puttsRecordedPar4 = 3
        m.puttsTotalPar4 = 4
        m.puttsRecordedPar5 = 1
        m.puttsTotalPar5 = 3
        // Penalty geography: H1 answered 0, H2 answered 1. Both scored, so both
        // sides of the tax have exactly one hole — H2 at +2, H1 at level.
        m.holesWithPenalty = 1
        m.holesScoredPenalty = 1
        m.strokesVsParPenalty = 2
        m.holesScoredPenaltyFree = 1
        m.strokesVsParPenaltyFree = 0
        // SG-prep. Par-4 tee shots: H1 fairway, H2 trouble, H5 fairway — so
        // in_play is 2 (cumulative, the two fairways). H4 is the lone par 5.
        m.teeRecordedPar4 = 3
        m.fairwayHitsPar4 = 2
        m.inPlayHitsPar4 = 2
        m.troubleCountPar4 = 1
        m.teeRecordedPar5 = 1
        m.fairwayHitsPar5 = 0
        m.inPlayHitsPar5 = 1
        m.troubleCountPar5 = 0
    }

    /// A full eighteen with every short-game term populated.
    ///
    /// `workedExample` reaches only two of the six terms of the per-difficulty
    /// short-game formula — its hard chips are a single hole-out — so it cannot
    /// tell a v1 flat baseline from a v2 split one. This row exercises all six,
    /// both new rates and a complete scorecard, and is the twin of `CHIP_MIX`
    /// in `tests/round/stat-measures.test.ts` field for field.
    ///
    /// Coherent by construction: the resolved holes sum to `puttsRecorded`, the
    /// resolved putts to `puttsTotal`, each `scrambleInside2m*` sits inside its
    /// `scrambleFirstPutt*`, and putting coverage is a full 18 of 18.
    private lazy var chipMix: StatMeasures = measures { m in
        m.firstPuttRecorded = 18
        m.firstPuttInside1m = 5
        m.firstPutt1To2m = 3
        m.firstPutt2To4m = 4
        m.firstPutt4To8m = 3
        m.firstPuttOver8m = 3
        m.firstPuttInside1mResolved = 5
        m.firstPutt1To2mResolved = 3
        m.firstPutt2To4mResolved = 4
        m.firstPutt4To8mResolved = 3
        m.firstPuttOver8mResolved = 3
        m.puttsRecorded = 18
        m.puttsTotal = 32
        m.puttsTotalInside1mResolved = 5
        m.puttsTotal1To2mResolved = 4
        m.puttsTotal2To4mResolved = 7
        m.puttsTotal4To8mResolved = 7
        m.puttsTotalOver8mResolved = 9
        m.puttsRecordedGir = 8
        m.puttsTotalGir = 13
        m.scrambleAttemptsStandard = 6
        m.scrambleSuccessesStandard = 3
        m.scrambleAttemptsHard = 4
        m.scrambleSuccessesHard = 4
        m.scrambleFirstPuttStandard = 4
        m.scrambleInside2mStandard = 3
        m.scrambleFirstPuttHard = 3
        m.scrambleInside2mHard = 1
        m.scrambleHoledStandard = 2
        m.scrambleHoledHard = 1
        m.penaltiesRecorded = 18
        m.penaltiesTotal = 3
        m.holesScored = 18
        m.strokesTotal = 84
        m.parTotal = 72
        // 0 + 1 + 4 + 13 + 0 = 18 holes, and −1 + 0 + 13 = +12 vs par.
        m.holesBirdie = 1
        m.holesPar = 4
        m.holesBogey = 13
    }

    /// A nine-holer: a real round, and a first-class one — nothing in v2 gates
    /// on eighteen.
    private lazy var nineHole: StatMeasures = measures { m in
        m.holesScored = 9
        m.strokesTotal = 44
        m.parTotal = 36
        // 0 + 0 + 1 + 8 + 0 = 9 holes, and +8 vs par.
        m.holesPar = 1
        m.holesBogey = 8
    }

    /// The window's best card.
    private lazy var lowRound: StatMeasures = measures { m in
        m.holesScored = 18
        m.strokesTotal = 79
        m.parTotal = 72
        // 1 + 2 + 4 + 11 + 0 = 18 holes, and −2 − 2 + 0 + 11 = +7 vs par.
        m.holesEagleOrBetter = 1
        m.holesBirdie = 2
        m.holesPar = 4
        m.holesBogey = 11
    }

    /// Five rounds covering every branch of `resultsSummary`: a part round on an
    /// 18-hole card, two complete eighteens, a nine, and a stats-only round with
    /// no score at all.
    private lazy var resultsRows: [ResultsRow] = [
        ResultsRow(holeCount: 18, measures: workedExample),
        ResultsRow(holeCount: 18, measures: chipMix),
        ResultsRow(holeCount: 9, measures: nineHole),
        ResultsRow(holeCount: 18, measures: StatMeasuresMath.zero),
        ResultsRow(holeCount: 18, measures: lowRound),
    ]

    private func assertRate(
        _ r: Rate,
        _ value: Double?,
        _ n: Double,
        _ d: Double,
        accuracy: Double = 1e-9,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        if let value {
            guard let actual = r.value else {
                return XCTFail("expected \(value), got nil", file: file, line: line)
            }
            XCTAssertEqual(actual, value, accuracy: accuracy, file: file, line: line)
        } else {
            XCTAssertNil(r.value, file: file, line: line)
        }
        XCTAssertEqual(r.n, n, file: file, line: line)
        XCTAssertEqual(r.d, d, file: file, line: line)
    }

    private func assertClose(
        _ actual: Double?,
        _ expected: Double,
        accuracy: Double = 1e-9,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        guard let actual else {
            return XCTFail("expected \(expected), got nil", file: file, line: line)
        }
        XCTAssertEqual(actual, expected, accuracy: accuracy, file: file, line: line)
    }

    // MARK: - Guarded rates

    func testARateCarriesItsSampleAndAZeroDenominatorIsNilRatherThanZero() {
        XCTAssertEqual(StatMeasuresMath.rate(3, 4), Rate(value: 0.75, n: 3, d: 4))
        // Not 0, and not NaN: nothing was recorded, so there is nothing to render.
        XCTAssertEqual(StatMeasuresMath.rate(0, 0), Rate(value: nil, n: 0, d: 0))
        XCTAssertEqual(StatMeasuresMath.rate(0, 4).value, 0)
        // Averages and signed differences share the shape; [0,1] is not a rule.
        XCTAssertEqual(StatMeasuresMath.rate(-1, 2).value, -0.5)
    }

    func testDisplayPolicyPercentageAboveTheFloorRawFractionBelowItAbsentAtZero() {
        XCTAssertEqual(StatMeasuresMath.minRateDenominator, 5)
        XCTAssertEqual(StatMeasuresMath.rateDisplay(StatMeasuresMath.rate(0, 0)), .absent)
        // One fairway from one hole is not "100% fairways".
        XCTAssertEqual(StatMeasuresMath.rateDisplay(StatMeasuresMath.rate(1, 1)), .fraction)
        XCTAssertEqual(StatMeasuresMath.rateDisplay(StatMeasuresMath.rate(4, 4)), .fraction)
        XCTAssertEqual(StatMeasuresMath.rateDisplay(StatMeasuresMath.rate(3, 5)), .percentage)
        // The floor is per-panel overridable.
        XCTAssertEqual(
            StatMeasuresMath.rateDisplay(StatMeasuresMath.rate(4, 4), minDen: 3), .percentage)
        XCTAssertEqual(
            StatMeasuresMath.rateDisplay(StatMeasuresMath.rate(3, 5), minDen: 10), .fraction)
        XCTAssertEqual(
            StatMeasuresMath.rateDisplay(StatMeasuresMath.rate(0, 0), minDen: 1), .absent)
    }

    // MARK: - Window summation

    func testAnEmptyWindowIsAllZeroesAndOneRoundSumsToItself() {
        XCTAssertEqual(StatMeasuresMath.sum([]), StatMeasuresMath.zero)
        XCTAssertEqual(StatMeasuresMath.sum([workedExample]), workedExample)
    }

    /// Every field at a DISTINCT value — its 1-based position in the
    /// declaration. Written out rather than generated so it is the same fixture
    /// as the TypeScript twin's.
    ///
    /// The point of the distinct values: `workedExample` is full of zeroes and
    /// repeated small counts, so `a.girHits + b.girHitsFairway` — a cross-wired
    /// pair in `add` — would sum to the right number by luck. No two fields here
    /// share a value, so a cross-wired pair cannot.
    private lazy var sweep: StatMeasures = measures { m in
        m.teeRecorded = 1
        m.fairwayHits = 2
        m.inPlayHits = 3
        m.troubleCount = 4
        m.girRecorded = 5
        m.girHits = 6
        m.firstPuttRecorded = 7
        m.firstPuttInside1m = 8
        m.firstPutt1To2m = 9
        m.firstPutt2To4m = 10
        m.firstPutt4To8m = 11
        m.firstPuttOver8m = 12
        m.firstPuttInside1mResolved = 13
        m.firstPutt1To2mResolved = 14
        m.firstPutt2To4mResolved = 15
        m.firstPutt4To8mResolved = 16
        m.firstPuttOver8mResolved = 17
        m.onePuttInside1m = 18
        m.onePutt1To2m = 19
        m.onePutt2To4m = 20
        m.onePutt4To8m = 21
        m.onePuttOver8m = 22
        m.puttsRecorded = 23
        m.puttsTotal = 24
        m.threePutts = 25
        m.threePuttsFromOver8m = 26
        m.scrambleAttemptsStandard = 27
        m.scrambleSuccessesStandard = 28
        m.scrambleAttemptsHard = 29
        m.scrambleSuccessesHard = 30
        m.scrambleFirstPuttStandard = 31
        m.scrambleInside2mStandard = 32
        m.scrambleFirstPuttHard = 33
        m.scrambleInside2mHard = 34
        m.scrambleHoledStandard = 35
        m.scrambleHoledHard = 36
        m.penaltiesRecorded = 37
        m.penaltiesTotal = 38
        m.recoveryAttempts = 39
        m.recoverySuccesses = 40
        m.holesScored = 41
        m.strokesTotal = 42
        m.parTotal = 43
        m.holesScoredPar3 = 44
        m.strokesPar3 = 45
        m.holesScoredPar4 = 46
        m.strokesPar4 = 47
        m.holesScoredPar5 = 48
        m.strokesPar5 = 49
        m.holesEagleOrBetter = 50
        m.holesBirdie = 51
        m.holesPar = 52
        m.holesBogey = 53
        m.doubleBogeyPlus = 54
        m.girHolesScored = 55
        m.birdiesOnGir = 56
        m.bounceBackOpportunities = 57
        m.bounceBackSuccesses = 58
        m.holesScoredFairway = 59
        m.strokesVsParFairway = 60
        m.holesScoredInPlay = 61
        m.strokesVsParInPlay = 62
        m.holesScoredTrouble = 63
        m.strokesVsParTrouble = 64
        m.girRecordedFairway = 65
        m.girHitsFairway = 66
        m.girRecordedInPlay = 67
        m.girHitsInPlay = 68
        m.girRecordedTrouble = 69
        m.girHitsTrouble = 70
        m.girFirstPuttRecorded = 71
        m.girFirstPuttInside1m = 72
        m.girFirstPutt1To2m = 73
        m.girFirstPutt2To4m = 74
        m.girFirstPutt4To8m = 75
        m.girFirstPuttOver8m = 76
        m.puttsRecordedGir = 77
        m.puttsTotalGir = 78
        m.puttsTotalInside1mResolved = 79
        m.puttsTotal1To2mResolved = 80
        m.puttsTotal2To4mResolved = 81
        m.puttsTotal4To8mResolved = 82
        m.puttsTotalOver8mResolved = 83
        m.strokesVsParGirHit = 84
        m.holesScoredGirMiss = 85
        m.strokesVsParGirMiss = 86
        m.girRecordedPar3 = 87
        m.girHitsPar3 = 88
        m.girRecordedPar4 = 89
        m.girHitsPar4 = 90
        m.girRecordedPar5 = 91
        m.girHitsPar5 = 92
        m.holesZeroPutt = 93
        m.holesOnePutt = 94
        m.holesTwoPutt = 95
        m.puttsRecordedPar3 = 96
        m.puttsTotalPar3 = 97
        m.puttsRecordedPar4 = 98
        m.puttsTotalPar4 = 99
        m.puttsRecordedPar5 = 100
        m.puttsTotalPar5 = 101
        m.holesWithPenalty = 102
        m.holesScoredPenalty = 103
        m.strokesVsParPenalty = 104
        m.holesScoredPenaltyFree = 105
        m.strokesVsParPenaltyFree = 106
        m.teeRecordedPar4 = 107
        m.fairwayHitsPar4 = 108
        m.inPlayHitsPar4 = 109
        m.troubleCountPar4 = 110
        m.teeRecordedPar5 = 111
        m.fairwayHitsPar5 = 112
        m.inPlayHitsPar5 = 113
        m.troubleCountPar5 = 114
    }

    func testEveryMeasureColumnIsAdditiveIncludingTheOnesNoRateReads() throws {
        // Key-by-key rather than spot checks: a column missing from `add` would
        // read as its first round's value forever, and only a full sweep sees
        // it. The Codable encoding is the sweep — it names every column exactly
        // once. (The TypeScript twin does the same sweep over `Object.keys`.)
        let encoder = JSONEncoder()
        let decoder = JSONDecoder()
        let singleFields = try decoder.decode(
            [String: Double].self, from: encoder.encode(sweep))
        let doubledFields = try decoder.decode(
            [String: Double].self, from: encoder.encode(StatMeasuresMath.sum([sweep, sweep])))
        // The count is asserted (and mirrored in the TypeScript twin) so that a
        // field added to the server's measure set and forgotten in the fixture
        // is caught, rather than sweeping a smaller set and passing.
        XCTAssertEqual(singleFields.count, 114)
        XCTAssertEqual(Set(singleFields.values).count, 114)
        for (key, single) in singleFields {
            XCTAssertEqual(doubledFields[key], single * 2, "column \(key) is not additive")
        }

        // …and the worked example, whose values a reader can check against the
        // server test, sums the same way.
        let exampleFields = try decoder.decode(
            [String: Double].self, from: encoder.encode(workedExample))
        let doubledExample = try decoder.decode(
            [String: Double].self,
            from: encoder.encode(StatMeasuresMath.sum([workedExample, workedExample])))
        XCTAssertEqual(exampleFields.count, 114)
        for (key, single) in exampleFields {
            XCTAssertEqual(doubledExample[key], single * 2, "column \(key) is not additive")
        }
    }

    func testRatesOverAWindowAreTheWindowSumNotAnAverageOfRates() {
        let window = StatMeasuresMath.sum([workedExample, workedExample])
        // Doubling every count leaves every ratio where it was, but doubles the
        // sample — which is what promotes fairway% out of fraction display.
        assertClose(StatMeasuresMath.girRate(window).value, 0.6, accuracy: 1e-12)
        XCTAssertEqual(
            StatMeasuresMath.rateDisplay(StatMeasuresMath.fairwayRate(workedExample)), .fraction)
        XCTAssertEqual(
            StatMeasuresMath.rateDisplay(StatMeasuresMath.fairwayRate(window)), .percentage)
        // Per-round figures need the caller's row count; the sum cannot know it.
        XCTAssertEqual(StatMeasuresMath.penaltiesPerRound(window, roundCount: 2).value, 1)
        XCTAssertEqual(StatMeasuresMath.doubleBogeyPlusPerRound(window, roundCount: 2).value, 1)
    }

    // MARK: - Derived metrics over the worked example

    func testOffTheTeeRatesReadTheWorkedExampleByHand() {
        // 2 fairways of 4 graded tee shots; in-play is cumulative (2 + 1), trouble 1.
        assertRate(StatMeasuresMath.fairwayRate(workedExample), 0.5, 2, 4)
        XCTAssertEqual(StatMeasuresMath.inPlayRate(workedExample).value, 0.75)
        XCTAssertEqual(StatMeasuresMath.troubleRate(workedExample).value, 0.25)
        XCTAssertEqual(StatMeasuresMath.recoveryRate(workedExample).value, 1)
        XCTAssertEqual(StatMeasuresMath.penaltiesPerRound(workedExample, roundCount: 1).value, 1)
    }

    func testTroubleTaxIsTheDifferenceOfTwoGuardedAverages() {
        let byTee = StatMeasuresMath.strokesVsParByTee(workedExample)
        // Two fairway holes at -1 total; one trouble hole at +2.
        XCTAssertEqual(byTee.fairway.value, -0.5)
        XCTAssertEqual(byTee.trouble.value, 2)
        XCTAssertEqual(byTee.inPlay.value, 1)
        // 2 - (-0.5) = 2.5 strokes per hole. `d` is the cross-product guard.
        XCTAssertEqual(StatMeasuresMath.troubleTaxPerHole(workedExample).value, 2.5)
        XCTAssertEqual(StatMeasuresMath.troubleTaxPerHole(workedExample).d, 2)
        // Either side missing means no comparison — not a zero tax.
        let fairwayOnly = measures { m in
            m.holesScoredFairway = 2
            m.strokesVsParFairway = -1
        }
        XCTAssertNil(StatMeasuresMath.troubleTaxPerHole(fairwayOnly).value)
    }

    func testGIRByTeeUsesTheStrictTeeColumnsUnlikeCumulativeInPlay() {
        assertRate(StatMeasuresMath.girRate(workedExample), 0.6, 3, 5, accuracy: 1e-12)
        let byTee = StatMeasuresMath.girRateByTee(workedExample)
        XCTAssertEqual(byTee.fairway.value, 1)
        // Strict: the single in-play tee shot, NOT the three cumulative ones.
        XCTAssertEqual(byTee.inPlay, Rate(value: 1, n: 1, d: 1))
        XCTAssertEqual(byTee.trouble.value, 0)
        // The par 3 has a GIR answer and no tee question, so the cross-tab
        // denominators sum to 4 while girRecorded is 5.
        XCTAssertEqual(byTee.fairway.d + byTee.inPlay.d + byTee.trouble.d, 4)
        XCTAssertEqual(StatMeasuresMath.girRate(workedExample).d, 5)
    }

    func testApproachProximityAndBirdieConversion() {
        assertRate(StatMeasuresMath.girFirstPuttMix(workedExample, .twoTo4m), 1.0 / 3.0, 1, 3)
        // A share of a real sample: no green was left at 1-2m, which IS zero —
        // the shared denominator is what makes the five buckets a distribution.
        assertRate(StatMeasuresMath.girFirstPuttMix(workedExample, .oneTo2m), 0, 0, 3)
        XCTAssertNil(StatMeasuresMath.girFirstPuttMix(StatMeasuresMath.zero, .oneTo2m).value)
        // 1 birdie over the 3 greens hit that were also SCORED.
        assertRate(StatMeasuresMath.birdieConversion(workedExample), 1.0 / 3.0, 1, 3)
    }

    func testPuttingRatesPairEveryNumeratorWithItsResolvedDenominator() {
        // Both inside-1m putts were holed; the 2-4m and the >8m were not.
        assertRate(StatMeasuresMath.onePuttRate(workedExample, .inside1m), 1, 2, 2)
        XCTAssertEqual(StatMeasuresMath.onePuttRate(workedExample, .twoTo4m).value, 0)
        // No sample in this bucket: nil, never 0%.
        assertRate(StatMeasuresMath.onePuttRate(workedExample, .oneTo2m), nil, 0, 0)
        assertRate(StatMeasuresMath.puttsPerFirstPutt(workedExample, .over8m), 3, 3, 1)
        // Three-putts sit over the coherent putt count (5 holes), never over the
        // first-putt denominator (4) — that mismatch is what makes ratios exceed 1.
        assertRate(StatMeasuresMath.threePuttRate(workedExample), 0.2, 1, 5)
        assertRate(StatMeasuresMath.threePuttsFromOver8mRate(workedExample), 1, 1, 1)
        // 6 putts over the 3 greens hit, not 7 over 5 holes.
        assertRate(StatMeasuresMath.puttsPerGirHole(workedExample), 2, 6, 3)
    }

    func testThePuttingRatiosStayInsideZeroToOneWhereACoarseDenominatorWouldNot() {
        // The legacy-bucket asymmetry, staged: a v2 numerator over the COARSE
        // `firstPuttRecorded` reads 2/1 = 200%. The resolved pair reads 1.
        let skewed = measures { m in
            m.firstPuttRecorded = 1
            m.firstPuttInside1m = 2
            m.firstPuttInside1mResolved = 2
            m.onePuttInside1m = 2
            m.puttsRecorded = 2
            m.puttsTotalInside1mResolved = 2
        }
        XCTAssertEqual(StatMeasuresMath.onePuttRate(skewed, .inside1m).value, 1)
        XCTAssertEqual(skewed.onePuttInside1m / skewed.firstPuttRecorded, 2)
    }

    func testScramblingSplitsByDifficultyAndChipProximityKeepsItsOwnDenominator() {
        let scramble = StatMeasuresMath.scrambleRate(workedExample)
        XCTAssertEqual(scramble.standard.value, 1)
        XCTAssertEqual(scramble.hard.value, 1)
        XCTAssertEqual(scramble.overall, Rate(value: 1, n: 2, d: 2))

        let chips = StatMeasuresMath.chipInside2mRate(workedExample)
        // The standard chip finished inside 2m. The hard one was HOLED, so it has
        // no first-putt bucket and is outside this ratio — not a miss.
        XCTAssertEqual(chips.standard, Rate(value: 1, n: 1, d: 1))
        XCTAssertEqual(chips.hard, Rate(value: nil, n: 0, d: 0))
        XCTAssertEqual(chips.overall, Rate(value: 1, n: 1, d: 1))
        XCTAssertEqual(scramble.overall.d, 2)
        XCTAssertEqual(chips.overall.d, 1)
    }

    func testScoringRatesSplitByParGroupAndCountBlowUpsPerRound() {
        let byPar = StatMeasuresMath.avgVsParByParGroup(workedExample)
        // Par 3: 2 strokes on one hole = -1. Par 4: 17 over 4 holes = +0.25.
        // Par 5: 6 on one hole = +1.
        XCTAssertEqual(byPar.par3.value, -1)
        XCTAssertEqual(byPar.par4.value, 0.25)
        XCTAssertEqual(byPar.par5.value, 1)
        XCTAssertEqual(
            StatMeasuresMath.doubleBogeyPlusPerRound(workedExample, roundCount: 1).value, 1)
        XCTAssertEqual(StatMeasuresMath.bounceBackRate(workedExample), Rate(value: 1, n: 1, d: 1))
    }

    func testAWindowWithNothingInItRendersAsAbsentEverywhereNeverAsZeroes() {
        let empty = StatMeasuresMath.zero
        var rates: [Rate] = [
            StatMeasuresMath.fairwayRate(empty),
            StatMeasuresMath.inPlayRate(empty),
            StatMeasuresMath.troubleRate(empty),
            StatMeasuresMath.recoveryRate(empty),
            StatMeasuresMath.girRate(empty),
            StatMeasuresMath.girRateByTee(empty).fairway,
            StatMeasuresMath.girRateByTee(empty).inPlay,
            StatMeasuresMath.girRateByTee(empty).trouble,
            StatMeasuresMath.birdieConversion(empty),
            StatMeasuresMath.scrambleRate(empty).overall,
            StatMeasuresMath.chipInside2mRate(empty).overall,
            StatMeasuresMath.threePuttRate(empty),
            StatMeasuresMath.threePuttsFromOver8mRate(empty),
            StatMeasuresMath.puttsPerGirHole(empty),
            StatMeasuresMath.avgVsParByParGroup(empty).par3,
            StatMeasuresMath.avgVsParByParGroup(empty).par4,
            StatMeasuresMath.avgVsParByParGroup(empty).par5,
            StatMeasuresMath.bounceBackRate(empty),
            StatMeasuresMath.troubleTaxPerHole(empty),
            StatMeasuresMath.penaltiesPerRound(empty, roundCount: 0),
            StatMeasuresMath.doubleBogeyPlusPerRound(empty, roundCount: 0),
        ]
        rates += PuttBucket.allCases.map { StatMeasuresMath.onePuttRate(empty, $0) }
        rates += PuttBucket.allCases.map { StatMeasuresMath.puttsPerFirstPutt(empty, $0) }
        rates += PuttBucket.allCases.map { StatMeasuresMath.girFirstPuttMix(empty, $0) }
        for r in rates {
            XCTAssertNil(r.value)
            XCTAssertEqual(StatMeasuresMath.rateDisplay(r), .absent)
        }
    }

    func testHardChipShareIsAPropertyOfTheApproachMiss() {
        assertRate(StatMeasuresMath.hardChipShare(workedExample), 0.5, 1, 2)
        XCTAssertEqual(
            StatMeasuresMath.rateDisplay(StatMeasuresMath.hardChipShare(workedExample)), .fraction)
        assertRate(StatMeasuresMath.hardChipShare(chipMix), 0.4, 4, 10)
        XCTAssertEqual(
            StatMeasuresMath.rateDisplay(StatMeasuresMath.hardChipShare(chipMix)), .percentage)
        // No missed green recorded at all is absent, never "0% hard".
        assertRate(StatMeasuresMath.hardChipShare(StatMeasuresMath.zero), nil, 0, 0)
    }

    func testPuttsAfterAMissedGreenIsTheComplementOfPuttsPerGirHole() {
        // 7 putts over 5 holes, less the 6 over 3 greens hit → 1 over 2.
        assertRate(StatMeasuresMath.puttsAfterMissedGreen(workedExample), 0.5, 1, 2)
        // 32 − 13 = 19 putts over 18 − 8 = 10 holes.
        assertRate(StatMeasuresMath.puttsAfterMissedGreen(chipMix), 1.9, 19, 10)
        assertRate(StatMeasuresMath.puttsAfterMissedGreen(StatMeasuresMath.zero), nil, 0, 0)
    }

    func testTheRawFirstPuttSpreadIsADistributionOverEveryRecordedHole() {
        XCTAssertEqual(StatMeasuresMath.firstPuttResolvedTotal(workedExample), 4)
        XCTAssertEqual(StatMeasuresMath.firstPuttResolvedTotal(chipMix), 18)

        assertRate(StatMeasuresMath.firstPuttMix(workedExample, .inside1m), 0.5, 2, 4)
        // A real zero over a real sample: no first putt finished at 1-2m.
        assertRate(StatMeasuresMath.firstPuttMix(workedExample, .oneTo2m), 0, 0, 4)
        assertRate(StatMeasuresMath.firstPuttMix(workedExample, .twoTo4m), 0.25, 1, 4)
        assertRate(StatMeasuresMath.firstPuttMix(workedExample, .fourTo8m), 0, 0, 4)
        assertRate(StatMeasuresMath.firstPuttMix(workedExample, .over8m), 0.25, 1, 4)

        assertRate(StatMeasuresMath.firstPuttMix(chipMix, .inside1m), 5.0 / 18.0, 5, 18)
        assertRate(StatMeasuresMath.firstPuttMix(chipMix, .oneTo2m), 3.0 / 18.0, 3, 18)
        assertRate(StatMeasuresMath.firstPuttMix(chipMix, .twoTo4m), 4.0 / 18.0, 4, 18)
        assertRate(StatMeasuresMath.firstPuttMix(chipMix, .fourTo8m), 3.0 / 18.0, 3, 18)
        assertRate(StatMeasuresMath.firstPuttMix(chipMix, .over8m), 3.0 / 18.0, 3, 18)

        // The shared denominator is what makes the five a distribution.
        for m in [workedExample, chipMix] {
            let total = PuttBucket.allCases.reduce(0.0) {
                $0 + (StatMeasuresMath.firstPuttMix(m, $1).value ?? 0)
            }
            assertClose(total, 1)
        }
        assertRate(StatMeasuresMath.firstPuttMix(StatMeasuresMath.zero, .inside1m), nil, 0, 0)
    }

    // MARK: - Results over a window of rounds

    func testResultsSummaryNormalisesVsParPerEighteenHoles() {
        let r = StatMeasuresMath.resultsSummary(resultsRows)
        // Every row is a round the player played, including the one with no card.
        XCTAssertEqual(r.rounds, 5)
        XCTAssertEqual(r.scoredRounds, 4)
        // No round is excluded for being short or partial: 6 + 18 + 9 + 0 + 18.
        XCTAssertEqual(r.holesScored, 51)
        // What it would have been had every round been scored right through.
        XCTAssertEqual(r.holesExpected, 81)

        // Longest first, and EVERY row of a length counts toward its `rounds` —
        // the part round and the cardless one are 18-hole rounds too.
        XCTAssertEqual(
            r.lengths,
            [
                ResultsLengthClass(
                    holeCount: 18, rounds: 4, completeRounds: 2,
                    best: ResultsBest(vsPar: 7, strokes: 79)),
                ResultsLengthClass(
                    holeCount: 9, rounds: 1, completeRounds: 1,
                    best: ResultsBest(vsPar: 8, strokes: 44)),
            ])

        // Σ vs par = 1 + 12 + 8 + 7 = 28, over 51 scored HOLES, × 18.
        assertRate(r.avgVsParPer18, 504.0 / 51.0, 504, 51)

        XCTAssertEqual(
            r.scoreTypeCounts,
            [.eagleOrBetter: 1, .birdie: 5, .par: 11, .bogey: 33, .doubleBogeyPlus: 1])
        // The five buckets partition the scored holes — the property every
        // percentage the card prints rests on.
        XCTAssertEqual(r.scoreTypeCounts.values.reduce(0, +), r.holesScored)
    }

    func testAnEmptyWindowHasNoScoreRatherThanAZeroOne() {
        let r = StatMeasuresMath.resultsSummary([])
        XCTAssertEqual(r.rounds, 0)
        XCTAssertEqual(r.scoredRounds, 0)
        XCTAssertEqual(r.holesScored, 0)
        XCTAssertEqual(r.holesExpected, 0)
        XCTAssertEqual(r.lengths, [])
        assertRate(r.avgVsParPer18, nil, 0, 0)
        XCTAssertEqual(
            r.scoreTypeCounts,
            [.eagleOrBetter: 0, .birdie: 0, .par: 0, .bogey: 0, .doubleBogeyPlus: 0])
    }

    // MARK: - The strokes-lost waterfall

    func testTheExpectedPuttsTablesAreFrozenAtTheirV1Values() {
        XCTAssertEqual(
            StatMeasuresMath.expectedPuttsV1,
            ExpectedPuttsTable(
                inside1m: 1.05, oneTo2m: 1.45, twoTo4m: 1.85, fourTo8m: 2.1, over8m: 2.4))
        XCTAssertEqual(StatMeasuresMath.chipExpectedPuttsV1, 1.85)
        XCTAssertEqual(
            StatMeasuresMath.chipOutcomeExpectedPuttsV1,
            ChipOutcomeExpectedPutts(inside2m: 1.25, outside2m: 2.12))
        // Frozen by the language: `static let` over a value type, so a caller
        // cannot retune history under the player's feet. (The TypeScript twin
        // needs `Object.freeze` for the same guarantee, and asserts it.)
        XCTAssertEqual(StatMeasuresMath.expectedPuttsV1[.over8m], 2.4)
    }

    func testTheV2ChipBaselineSplitsByDifficultyAndLeavesV1Alone() {
        XCTAssertEqual(
            StatMeasuresMath.chipExpectedPuttsV2,
            ChipExpectedPutts(standard: 1.70, hard: 2.10))
        // V1 read as a per-difficulty table is the FLAT table it always was —
        // this is what makes a v1 replay reproducible.
        XCTAssertEqual(
            StatMeasuresMath.chipExpectedPuttsV1ByDifficulty,
            ChipExpectedPutts(standard: 1.85, hard: 1.85))
        // The OUTCOME table is not versioned alongside the baseline: where a
        // chip finishes is measured, not modelled, so it is shared.
        XCTAssertEqual(
            StatMeasuresMath.chipOutcomeExpectedPuttsV1,
            ChipOutcomeExpectedPutts(inside2m: 1.25, outside2m: 2.12))
    }

    func testTheWorkedExampleWaterfallIsTheHandComputedArithmetic() throws {
        let w = StatMeasuresMath.strokesLost(workedExample)

        // Putting: 7 putts taken over the resolved buckets (2 + 2 + 3) against
        // 2×1.05 + 1×1.85 + 1×2.40 = 6.35 expected → +0.65 lost.
        assertClose(w.putting, 0.65)
        // Short game, two terms, each against ITS OWN difficulty's baseline:
        //   H2's standard chip finished inside 2m → 1 × (1.25 − 1.70) = −0.45
        //   H3's hard chip was HOLED              → 1 × (1 − 3.10)    = −2.10
        // giving −2.55. The hole-out has no first-putt bucket, so before
        // migration 047 it contributed nothing here and its baseline sat in the
        // long game.
        assertClose(w.shortGame, -2.55)
        XCTAssertEqual(w.penalties, 1)
        // Total: 25 strokes over par 24 → +1.
        XCTAssertEqual(w.total, 1)
        // Long game is the residual: 1 − 0.65 − (−2.55) − 1 = +1.90.
        assertClose(w.longGame, 1.9)
        // …and the four parts add back to the total, which is the whole point.
        let putting = try XCTUnwrap(w.putting)
        let shortGame = try XCTUnwrap(w.shortGame)
        let longGame = try XCTUnwrap(w.longGame)
        assertClose(putting + shortGame + w.penalties + longGame, 1)
        // 5 of 6 scored holes carry a putt count, clearing the residual's floor.
        XCTAssertEqual(w.coverage, StrokesLost.Coverage(holesScored: 6, puttsRecorded: 5))
    }

    func testAHoledChipIsAShortGameGainNotALongGameOne() throws {
        // The same round twice over, once with the chip holed and once with it
        // simply never recorded, so the whole difference is the hole-out.
        let base = measures { m in
            m.holesScored = 9
            m.strokesTotal = 40
            m.parTotal = 36
            m.puttsRecorded = 9
            m.firstPuttInside1mResolved = 2
            m.puttsTotalInside1mResolved = 2
            m.scrambleFirstPuttStandard = 1
            m.scrambleInside2mStandard = 1
        }
        var withHoleOut = base
        withHoleOut.scrambleHoledHard = 1

        let plain = StatMeasuresMath.strokesLost(base)
        let holed = StatMeasuresMath.strokesLost(withHoleOut)
        // The HARD baseline (2.10) moves OUT of the residual and INTO the short
        // game. The total is untouched: attribution changed, the score did not.
        assertClose(try XCTUnwrap(holed.shortGame) - (try XCTUnwrap(plain.shortGame)), -2.10)
        assertClose(try XCTUnwrap(holed.longGame) - (try XCTUnwrap(plain.longGame)), 2.10)
        XCTAssertEqual(holed.total, plain.total)

        // And a holed chip is a scramble signal on its own: no bucketed first
        // putt anywhere, yet the short game is a number rather than nil. A
        // STANDARD hole-out is worth its own baseline, 1.70.
        let holeOutOnly = measures { m in m.scrambleHoledStandard = 1 }
        assertClose(StatMeasuresMath.strokesLost(holeOutOnly).shortGame, -1.70)
        // Neither signal → still nil, not 0.
        XCTAssertNil(StatMeasuresMath.strokesLost(measures()).shortGame)
    }

    func testTheResidualIsNilWhenMostOfTheRoundHasNoPuttCount() {
        // Three holes of putting recorded out of eighteen scored. `putting`
        // claims only those three, so a residual would silently blame the long
        // game for fifteen holes of putting nobody saw.
        let sparse = measures { m in
            m.holesScored = 18
            m.strokesTotal = 90
            m.parTotal = 72
            m.puttsRecorded = 3
            m.puttsTotal = 6
            m.firstPuttInside1mResolved = 3
            m.puttsTotalInside1mResolved = 6
            m.scrambleFirstPuttStandard = 1
            m.scrambleInside2mStandard = 1
        }
        let w = StatMeasuresMath.strokesLost(sparse)
        // Every measured term still stands — coverage gates the RESIDUAL only.
        assertClose(w.putting, 6 - 3 * 1.05)
        assertClose(w.shortGame, -0.45)
        XCTAssertEqual(w.total, 18)
        XCTAssertNil(w.longGame)
        XCTAssertEqual(
            w.coverage, StrokesLost.Coverage(holesScored: 18, puttsRecorded: 3))

        // Exactly at the floor (0.8 × 18 = 14.4, so 15 holes) it is reported
        // again.
        var covered = sparse
        covered.puttsRecorded = 15
        XCTAssertNotNil(StatMeasuresMath.strokesLost(covered).longGame)
        // …and one hole below it, it is not.
        var short = sparse
        short.puttsRecorded = 14
        XCTAssertNil(StatMeasuresMath.strokesLost(short).longGame)
    }

    func testAStatsOnlyRoundHasNoTotalAndNoResidualAndProducesNoNaN() throws {
        // Answers recorded, scorecard empty — a real shape: holesScored 0 means
        // strokesTotal - parTotal is 0 - 0, which is NOT a level-par round.
        let statsOnly = measures { m in
            m.firstPuttInside1mResolved = 1
            m.puttsTotalInside1mResolved = 2
            m.puttsRecorded = 1
            m.puttsTotal = 2
            m.scrambleFirstPuttStandard = 1
            m.scrambleInside2mStandard = 1
            m.penaltiesTotal = 1
        }
        let w = StatMeasuresMath.strokesLost(statsOnly)
        // The measured terms still stand: 2 putts against 1.05 expected.
        assertClose(w.putting, 0.95)
        assertClose(w.shortGame, -0.45)
        XCTAssertEqual(w.penalties, 1)
        XCTAssertNil(w.total)
        XCTAssertNil(w.longGame)
        // Not just "not NaN": the unwrap is what makes a nil fail here too, and
        // the TypeScript twin asserts the same two things separately.
        XCTAssertEqual(try XCTUnwrap(w.putting).isNaN, false)
        XCTAssertEqual(try XCTUnwrap(w.putting).isFinite, true)
        XCTAssertEqual(try XCTUnwrap(w.shortGame).isNaN, false)
        XCTAssertEqual(try XCTUnwrap(w.shortGame).isFinite, true)
    }

    func testAWaterfallComponentCanBeReadByNameTheSameWayTheDeltasCan() {
        let w = StrokesLost(putting: 1, shortGame: -2, penalties: 3, longGame: nil, total: 2)
        XCTAssertEqual(StrokesLostComponent.allCases.map { w[$0] }, [1, -2, 3, nil])
        // The subscript and the field are the same value, for every component.
        XCTAssertEqual(w[.putting], w.putting)
        XCTAssertEqual(w[.shortGame], w.shortGame)
        XCTAssertEqual(w[.penalties], w.penalties)
        XCTAssertEqual(w[.longGame], w.longGame)
    }

    func testAnUnmeasuredTermNilsTheResidualInsteadOfChargingItToTheLongGame() {
        // Scored, penalties known, no putting and no chip data at all.
        let scoreOnly = measures { m in
            m.holesScored = 18
            m.strokesTotal = 90
            m.parTotal = 72
        }
        let w = StatMeasuresMath.strokesLost(scoreOnly)
        XCTAssertNil(w.putting)
        XCTAssertNil(w.shortGame)
        XCTAssertEqual(w.penalties, 0)
        XCTAssertEqual(w.total, 18)
        // +18 vs par is NOT 18 strokes of long game.
        XCTAssertNil(w.longGame)

        // Putting present, chips absent → still no residual.
        let puttingOnly = measures { m in
            m.holesScored = 18
            m.strokesTotal = 90
            m.parTotal = 72
            m.firstPuttInside1mResolved = 1
            m.puttsTotalInside1mResolved = 1
        }
        assertClose(StatMeasuresMath.strokesLost(puttingOnly).putting, -0.05)
        XCTAssertNil(StatMeasuresMath.strokesLost(puttingOnly).shortGame)
        XCTAssertNil(StatMeasuresMath.strokesLost(puttingOnly).longGame)
    }

    func testAChipLeftOutside2mChargesTheShortGameAChipLeftInsideCreditsIt() {
        let far = measures { m in
            m.scrambleFirstPuttHard = 4
            m.scrambleInside2mHard = 1
        }
        // Hard lies, against the hard baseline:
        // 1 × (1.25 − 2.10) + 3 × (2.12 − 2.10) = −0.85 + 0.06 = −0.79.
        assertClose(StatMeasuresMath.strokesLost(far).shortGame, -0.79)
        let close = measures { m in
            m.scrambleFirstPuttStandard = 4
            m.scrambleInside2mStandard = 4
        }
        // 4 × (1.25 − 1.70) = −1.80.
        assertClose(StatMeasuresMath.strokesLost(close).shortGame, -1.8)
    }

    func testTheChipMixWaterfallExercisesAllSixShortGameTerms() throws {
        let w = StatMeasuresMath.strokesLost(chipMix)

        // Putting: 5×1.05 + 3×1.45 + 4×1.85 + 3×2.10 + 3×2.40 = 30.50 expected
        // against 32 taken → +1.50.
        assertClose(w.putting, 1.5)
        // Short game, standard against 1.70:
        //   3 × (1.25 − 1.70) + 1 × (2.12 − 1.70) + 2 × (1 − 2.70) = −4.33
        // hard against 2.10:
        //   1 × (1.25 − 2.10) + 2 × (2.12 − 2.10) + 1 × (1 − 3.10) = −2.91
        assertClose(w.shortGame, -7.24)
        XCTAssertEqual(w.penalties, 3)
        XCTAssertEqual(w.total, 12)
        // Residual: 12 − 1.50 − (−7.24) − 3 = +14.74.
        assertClose(w.longGame, 14.74)
        XCTAssertEqual(w.coverage, StrokesLost.Coverage(holesScored: 18, puttsRecorded: 18))
    }

    func testTheV1TableReplaysTheOldFlatShortGameExactly() {
        let v1 = StatMeasuresMath.strokesLost(
            chipMix, chipBaseline: StatMeasuresMath.chipExpectedPuttsV1ByDifficulty)
        // Standard 3×(−0.60) + 1×(0.27) + 2×(−1.85) = −5.23; hard
        // 1×(−0.60) + 2×(0.27) + 1×(−1.85) = −1.91.
        assertClose(v1.shortGame, -7.14)
        // …which is the legacy FLAT formula over the pooled counts, term for
        // term: 4×(−0.60) + 3×(0.27) + 3×(−1.85). That equality is what makes
        // the split a re-parameterisation rather than a new measure.
        let flat =
            4 * (1.25 - 1.85) + 3 * (2.12 - 1.85) + 3 * (1 - (1 + 1.85))
        assertClose(v1.shortGame, flat)
    }

    func testTheWaterfallIsAdditiveSoAWindowSumsTheSameWayTheCountsDo() throws {
        let single = StatMeasuresMath.strokesLost(workedExample)
        let window = StatMeasuresMath.strokesLost(
            StatMeasuresMath.sum([workedExample, workedExample]))
        assertClose(window.putting, try XCTUnwrap(single.putting) * 2)
        assertClose(window.shortGame, try XCTUnwrap(single.shortGame) * 2)
        XCTAssertEqual(window.penalties, 2)
        XCTAssertEqual(window.total, 2)
        assertClose(window.longGame, try XCTUnwrap(single.longGame) * 2)
    }

    // MARK: - Personal baseline

    private func waterfall(
        putting: Double? = 0,
        shortGame: Double? = 0,
        penalties: Double = 0,
        longGame: Double? = 0,
        total: Double? = 0
    ) -> StrokesLost {
        StrokesLost(
            putting: putting, shortGame: shortGame, penalties: penalties, longGame: longGame,
            total: total)
    }

    func testTheMeanIgnoresAbsentEntriesRatherThanCountingThemAsZero() {
        XCTAssertNil(StatMeasuresMath.meanOfPresent([]))
        XCTAssertNil(StatMeasuresMath.meanOfPresent([nil, nil]))
        XCTAssertEqual(StatMeasuresMath.meanOfPresent([2, nil, 4]), 3)
    }

    func testBaselineDeltasCompareARoundWithTheRoundsThatRecordedTheSameThing() {
        let window = [
            waterfall(putting: 2, shortGame: nil, penalties: 1, longGame: 3, total: 6),
            waterfall(putting: 4, shortGame: 1, penalties: 1, longGame: 1, total: 7),
            waterfall(putting: nil, shortGame: nil, penalties: 0, longGame: nil, total: 4),
        ]
        let round = waterfall(putting: 1, shortGame: 2, penalties: 3, longGame: 0, total: 6)
        let d = StatMeasuresMath.baselineDeltas(round: round, window: window)
        // Putting baseline is (2 + 4)/2 = 3 — the third round recorded none.
        XCTAssertEqual(d.putting, -2)
        // Short game has exactly ONE window sample, and one is enough.
        XCTAssertEqual(d.shortGame, 1)
        // Penalties are a count, so every round has one: (1 + 1 + 0)/3 = 0.666…
        assertClose(d.penalties, 3 - 2.0 / 3.0)
        XCTAssertEqual(d.longGame, -2)
        assertClose(d.total, 6 - 17.0 / 3.0)
    }

    func testADeltaIsNilWhenEitherSideHasNoValueNeverZero() {
        let noSample = StatMeasuresMath.baselineDeltas(round: waterfall(putting: 1), window: [])
        for c in StrokesLostComponent.allCases { XCTAssertNil(noSample[c]) }
        // The round itself recorded no putting: nothing to compare, even though
        // the window is full of it.
        let roundBlind = StatMeasuresMath.baselineDeltas(
            round: waterfall(putting: nil),
            window: [waterfall(putting: 2), waterfall(putting: 4)])
        XCTAssertNil(roundBlind.putting)
        XCTAssertEqual(roundBlind.longGame, 0)
        // And the mirror: the window recorded none.
        let windowBlind = StatMeasuresMath.baselineDeltas(
            round: waterfall(putting: 1), window: [waterfall(putting: nil)])
        XCTAssertNil(windowBlind.putting)
    }

    // MARK: - Insight lines

    private func ids(_ lines: [InsightLine]) -> [InsightID] { lines.map(\.id) }

    private func lines(
        _ m: StatMeasures, _ w: StrokesLost, _ window: [StrokesLost], _ limit: Int
    ) -> [InsightLine] {
        StatMeasuresMath.insightLines(measures: m, waterfall: w, window: window, limit: limit)
    }

    private func number(_ p: InsightParam?) -> Double? {
        if case .number(let v)? = p { return v }
        return nil
    }

    /// A round that trips every rule at once, so the ORDER is what is under test.
    private lazy var richMeasures: StatMeasures = measures { m in
        m.penaltiesTotal = 3
        m.scrambleAttemptsStandard = 2
        m.scrambleSuccessesStandard = 2
        m.scrambleAttemptsHard = 2
        m.scrambleSuccessesHard = 1
        m.puttsRecorded = 6
        m.puttsTotal = 12
        m.threePutts = 0
        m.bounceBackOpportunities = 2
        m.bounceBackSuccesses = 2
    }

    func testTheRankingIsDeltaMagnitudeFirstThenTheFixedRuleOrder() {
        let richWaterfall = waterfall(
            putting: -2, shortGame: 0, penalties: 3, longGame: 0.5, total: 1.5)
        let richWindow = Array(
            repeating: waterfall(putting: 1, shortGame: 0, penalties: 1, longGame: 0, total: 2),
            count: 6)
        // Deltas vs the window: putting -3 (best), penalties +2 (worst), long game
        // +0.5 (under the 1.0 threshold, so no line).
        XCTAssertEqual(
            ids(lines(richMeasures, richWaterfall, richWindow, 10)),
            [
                .componentBestVsBaseline,
                .componentWorstVsBaseline,
                .penaltiesSpike,
                .scrambleStreak,
                .threePuttFree,
                .bestPuttingRound,
                .bounceBackPerfect,
            ])
        XCTAssertEqual(lines(richMeasures, richWaterfall, richWindow, 3).count, 3)
        XCTAssertEqual(
            ids(lines(richMeasures, richWaterfall, richWindow, 2)),
            [.componentBestVsBaseline, .componentWorstVsBaseline])
        XCTAssertEqual(lines(richMeasures, richWaterfall, richWindow, 0), [])
    }

    func testEqualMagnitudesBreakByRuleOrderInBothDirectionsOfTheInput() throws {
        // Four rounds: enough for a baseline, one short of the "best putting
        // round" window, so the two component rules are alone under test.
        let window = Array(repeating: waterfall(), count: 4)
        // putting -2 and long game +2: identical magnitude, opposite signs.
        let round = waterfall(putting: -2, longGame: 2, total: 0)
        let forward = ids(lines(measures(), round, window, 10))
        XCTAssertEqual(
            Array(forward.prefix(2)), [.componentBestVsBaseline, .componentWorstVsBaseline])
        // Swapping which component is which does not swap the ORDER: "best" is
        // rule 1 whatever component fills it.
        let swapped = waterfall(putting: 2, longGame: -2, total: 0)
        XCTAssertEqual(
            Array(ids(lines(measures(), swapped, window, 10)).prefix(2)),
            [.componentBestVsBaseline, .componentWorstVsBaseline])
        let best = try XCTUnwrap(lines(measures(), swapped, window, 1).first)
        XCTAssertEqual(
            best.params, ["component": .component(.longGame), "delta": .number(-2)])
    }

    func testTheComponentRulesNeedAFullStrokeOfMovementEachWay() {
        let window = Array(repeating: waterfall(), count: 4)
        XCTAssertEqual(ids(lines(measures(), waterfall(putting: -0.99), window, 10)), [])
        XCTAssertEqual(
            ids(lines(measures(), waterfall(putting: -1), window, 10)), [.componentBestVsBaseline])
        XCTAssertEqual(
            ids(lines(measures(), waterfall(putting: 1), window, 10)), [.componentWorstVsBaseline])
    }

    func testEachThresholdRuleHoldsItsOwnLineBackUntilItsBarIsCleared() {
        let window = Array(repeating: waterfall(), count: 4)

        // Penalties: the mean is 0, so 2 is a spike and 1 is not.
        XCTAssertEqual(
            ids(lines(measures { $0.penaltiesTotal = 1 }, waterfall(), window, 10)), [])
        XCTAssertEqual(
            ids(lines(measures { $0.penaltiesTotal = 2 }, waterfall(), window, 10)),
            [.penaltiesSpike])
        // …and with no window there is no personal mean to spike above.
        XCTAssertEqual(ids(lines(measures { $0.penaltiesTotal = 9 }, waterfall(), [], 10)), [])

        // Scrambling: 3 of 4 clears the bar; 2 of 3 is the same rate on too small
        // a sample; 2 of 4 is a big enough sample at too low a rate.
        func scramble(_ attempts: Double, _ successes: Double) -> StatMeasures {
            measures { m in
                m.scrambleAttemptsStandard = attempts
                m.scrambleSuccessesStandard = successes
            }
        }
        XCTAssertEqual(
            ids(lines(scramble(4, 3), waterfall(), window, 10)), [.scrambleStreak])
        XCTAssertEqual(ids(lines(scramble(3, 2), waterfall(), window, 10)), [])
        XCTAssertEqual(ids(lines(scramble(4, 2), waterfall(), window, 10)), [])

        // Three-putt-free: 12 recorded putts is the floor, and one three-putt ends
        // it however many putts there were.
        func putts(_ total: Double, _ threePutts: Double) -> StatMeasures {
            measures { m in
                m.puttsTotal = total
                m.puttsRecorded = 9
                m.threePutts = threePutts
            }
        }
        XCTAssertEqual(ids(lines(putts(12, 0), waterfall(), window, 10)), [.threePuttFree])
        XCTAssertEqual(ids(lines(putts(11, 0), waterfall(), window, 10)), [])
        XCTAssertEqual(ids(lines(putts(30, 1), waterfall(), window, 10)), [])

        // Bounce-back: two chances taken, not one.
        func bounce(_ opportunities: Double, _ successes: Double) -> StatMeasures {
            measures { m in
                m.bounceBackOpportunities = opportunities
                m.bounceBackSuccesses = successes
            }
        }
        XCTAssertEqual(ids(lines(bounce(2, 2), waterfall(), window, 10)), [.bounceBackPerfect])
        XCTAssertEqual(ids(lines(bounce(1, 1), waterfall(), window, 10)), [])
        XCTAssertEqual(ids(lines(bounce(3, 2), waterfall(), window, 10)), [])
    }

    func testTheHardScrambleStreakNeedsThreeHardMissesAndAllOfThemSaved() throws {
        let window = Array(repeating: waterfall(), count: 4)
        let w = StatMeasuresMath.strokesLost(chipMix)
        let fired = lines(chipMix, w, window, 10)
        // 4 hard misses, all saved. The OVERALL rate is 7 of 10 = 0.70, under
        // the 0.75 the plain streak asks for, so only the hard line fires.
        XCTAssertTrue(ids(fired).contains(.hardScrambleStreak))
        XCTAssertFalse(ids(fired).contains(.scrambleStreak))
        let line = try XCTUnwrap(fired.first { $0.id == .hardScrambleStreak })
        XCTAssertEqual(line.params, ["successes": .number(4), "attempts": .number(4)])

        // Two hard misses saved is a coincidence, not a streak; three is one.
        func hard(_ attempts: Double, _ successes: Double) -> StatMeasures {
            measures { m in
                m.scrambleAttemptsHard = attempts
                m.scrambleSuccessesHard = successes
            }
        }
        XCTAssertEqual(ids(lines(hard(2, 2), waterfall(), window, 10)), [])
        XCTAssertEqual(ids(lines(hard(3, 3), waterfall(), window, 10)), [.hardScrambleStreak])
        // Every one of them, or the sentence would be false.
        XCTAssertFalse(ids(lines(hard(4, 3), waterfall(), window, 10)).contains(.hardScrambleStreak))
        // One hard attempt is why the worked example never fires it.
        XCTAssertFalse(
            ids(lines(workedExample, StatMeasuresMath.strokesLost(workedExample), window, 10))
                .contains(.hardScrambleStreak))
    }

    func testWhenBothScrambleLinesFireTheHarderClaimLeads() {
        let window = Array(repeating: waterfall(), count: 4)
        // 7 of 7 overall clears the plain rule too, so both are pushed at
        // magnitude 0 and the tie breaks on rule order.
        let both = measures { m in
            m.scrambleAttemptsStandard = 4
            m.scrambleSuccessesStandard = 4
            m.scrambleAttemptsHard = 3
            m.scrambleSuccessesHard = 3
        }
        XCTAssertEqual(
            ids(lines(both, waterfall(), window, 10)), [.hardScrambleStreak, .scrambleStreak])
    }

    func testBestPuttingRoundNeedsAWindowWorthTheClaimAndAStrictWin() {
        let five = Array(
            repeating: waterfall(putting: 1),
            count: StatMeasuresMath.insightBestPuttingMinWindow)
        // The round's own putting delta is -2, so the component line comes with it.
        XCTAssertEqual(
            ids(lines(measures(), waterfall(putting: -1), five, 10)),
            [.componentBestVsBaseline, .bestPuttingRound])
        // Four comparable rounds is not "your last five".
        XCTAssertEqual(
            ids(lines(measures(), waterfall(putting: -1), Array(five.prefix(4)), 10)),
            [.componentBestVsBaseline])
        // Rounds with no putting data do not pad the window.
        let padded = Array(five.prefix(4)) + [waterfall(putting: nil)]
        XCTAssertEqual(
            ids(lines(measures(), waterfall(putting: -1), padded, 10)),
            [.componentBestVsBaseline])
        // A tie is not a win.
        let tied = Array(five.prefix(4)) + [waterfall(putting: -1)]
        XCTAssertEqual(
            ids(lines(measures(), waterfall(putting: -1), tied, 10)), [.componentBestVsBaseline])
        // And a round with no putting term of its own can never win.
        XCTAssertEqual(ids(lines(measures(), waterfall(putting: nil), five, 10)), [])
    }

    func testTheWindowIsThePriorRoundsTheRoundUnderEvaluationIsNotInIt() {
        // The documented contract, asserted rather than assumed: `window` is the
        // player's earlier rounds, EXCLUDING this one. Nothing filters it here.
        let prior = Array(
            repeating: waterfall(putting: 1),
            count: StatMeasuresMath.insightBestPuttingMinWindow)
        let round = waterfall(putting: -1)
        XCTAssertTrue(ids(lines(measures(), round, prior, 10)).contains(.bestPuttingRound))
        // Pass the same round INSIDE the window — a self-inclusive call — and
        // the rule can never fire, because no round is strictly better than
        // itself. That is the contract failing loudly, not a bug in the rule.
        XCTAssertFalse(
            ids(lines(measures(), round, prior + [round], 10)).contains(.bestPuttingRound))
        // The baseline moves too: the mean of six values including this round's
        // own −1 is 4/6, not the 1 the five prior rounds give.
        XCTAssertEqual(
            StatMeasuresMath.baselineDeltas(round: round, window: prior).putting, -2)
        assertClose(
            StatMeasuresMath.baselineDeltas(round: round, window: prior + [round]).putting,
            -1 - 4.0 / 6.0)
    }

    // MARK: - Wave 3 cross-tabs (spec §C)

    /// The rendered-string oracle's window **W** (spec §D.4). Only the fields
    /// the new blocks read are set; every other column is zero, which is exactly
    /// what the oracle says. Field for field the web twin's fixture.
    ///
    /// Consistency built in: `girHitsPar3+4+5 = 26 = girHits`;
    /// `girRecordedPar3+4+5 = 60 = girRecorded = girHolesScored +
    /// holesScoredGirMiss`; the four putt buckets sum to 54 = `puttsRecorded`;
    /// `puttsRecordedPar*` sum to 54 and `puttsTotalPar*` to 100 = `puttsTotal`.
    static func windowW() -> StatMeasures {
        var m = StatMeasuresMath.zero
        m.girRecorded = 60
        m.girHits = 26
        m.girHolesScored = 26
        m.strokesVsParGirHit = 2
        m.holesScoredGirMiss = 34
        m.strokesVsParGirMiss = 31
        m.girRecordedPar3 = 12
        m.girHitsPar3 = 5
        m.girRecordedPar4 = 36
        m.girHitsPar4 = 14
        m.girRecordedPar5 = 12
        m.girHitsPar5 = 7
        m.puttsRecorded = 54
        m.puttsTotal = 100
        m.holesZeroPutt = 3
        m.holesOnePutt = 18
        m.holesTwoPutt = 27
        m.threePutts = 6
        m.puttsRecordedPar3 = 12
        m.puttsTotalPar3 = 21
        m.puttsRecordedPar4 = 30
        m.puttsTotalPar4 = 56
        m.puttsRecordedPar5 = 12
        m.puttsTotalPar5 = 23
        m.penaltiesRecorded = 54
        m.holesWithPenalty = 9
        m.holesScoredPenalty = 9
        m.strokesVsParPenalty = 14
        m.holesScoredPenaltyFree = 45
        m.strokesVsParPenaltyFree = 4
        return m
    }

    /// The oracle's own arithmetic, before any formatter touches it.
    func testWindowWIsTheHandComputedArithmeticOfTheCrossTabs() {
        let m = Self.windowW()

        let gir = StatMeasuresMath.girByPar(m)
        assertClose(gir.par3.value, 5.0 / 12.0)   // 0.4166666666666667
        assertClose(gir.par4.value, 14.0 / 36.0)  // 0.3888888888888889
        assertClose(gir.par5.value, 7.0 / 12.0)   // 0.5833333333333334
        // The three denominators partition the recorded greens.
        XCTAssertEqual(gir.par3.d + gir.par4.d + gir.par5.d, m.girRecorded)
        XCTAssertEqual(gir.par3.n + gir.par4.n + gir.par5.n, m.girHits)

        let cost = StatMeasuresMath.costOfMissedGreen(m)
        assertClose(cost.hit.value, 2.0 / 26.0)
        assertClose(cost.miss.value, 31.0 / 34.0)
        // (31·26 − 2·34)/(34·26) = 738/884
        assertClose(cost.delta.value, 738.0 / 884.0)
        // The delta's `d` is the CROSS-PRODUCT guard, never a sample.
        XCTAssertEqual(cost.delta.d, 34 * 26)

        let dist = StatMeasuresMath.puttDistribution(m)
        assertClose(dist[.zero]?.value, 3.0 / 54.0)
        assertClose(dist[.one]?.value, 18.0 / 54.0)
        assertClose(dist[.two]?.value, 0.5)
        assertClose(dist[.threePlus]?.value, 6.0 / 54.0)
        // A partition: the four shares add to exactly 1.
        assertClose(
            PuttCountBucket.allCases.reduce(0) { $0 + (dist[$1]?.value ?? 0) }, 1, accuracy: 1e-12)

        let putts = StatMeasuresMath.puttsPerHoleByPar(m)
        assertClose(putts.par3.value, 1.75)
        assertClose(putts.par4.value, 56.0 / 30.0)
        assertClose(putts.par5.value, 23.0 / 12.0)
        XCTAssertEqual(putts.par3.d + putts.par4.d + putts.par5.d, m.puttsRecorded)
        XCTAssertEqual(putts.par3.n + putts.par4.n + putts.par5.n, m.puttsTotal)

        assertClose(StatMeasuresMath.penaltyHoleShare(m).value, 9.0 / 54.0)
        let byPenalty = StatMeasuresMath.vsParByPenalty(m)
        assertClose(byPenalty.penalty.value, 14.0 / 9.0)
        assertClose(byPenalty.clean.value, 4.0 / 45.0)
        // (14·45 − 4·9)/(9·45) = 594/405
        assertClose(StatMeasuresMath.penaltyTax(m).value, 594.0 / 405.0)
        XCTAssertEqual(StatMeasuresMath.penaltyTax(m).d, 9 * 45)
    }

    /// The worked example, whose row the server test pins — the same six holes
    /// the fixture above documents.
    func testTheWorkedExampleCrossTabsMatchTheServerRow() {
        let cost = StatMeasuresMath.costOfMissedGreen(workedExample)
        XCTAssertEqual(cost.hit.value, 0)      // 0 over 3 greens hit and scored
        XCTAssertEqual(cost.miss.value, 0.5)   // +1 over 2
        // (1·3 − 0·2)/(2·3) = 0.5 — the miss costs half a stroke a hole here.
        XCTAssertEqual(cost.delta.value, 0.5)

        let gir = StatMeasuresMath.girByPar(workedExample)
        XCTAssertEqual(gir.par3.value, 0)          // H3, missed
        assertClose(gir.par4.value, 2.0 / 3.0)
        XCTAssertEqual(gir.par5.value, 1)

        let dist = StatMeasuresMath.puttDistribution(workedExample)
        XCTAssertEqual(dist[.zero]?.n, 1)
        XCTAssertEqual(dist[.one]?.n, 2)
        XCTAssertEqual(dist[.two]?.n, 1)
        XCTAssertEqual(dist[.threePlus]?.n, 1)
        XCTAssertEqual(dist[.zero]?.d, workedExample.puttsRecorded)

        let putts = StatMeasuresMath.puttsPerHoleByPar(workedExample)
        XCTAssertEqual(putts.par3.value, 0)
        assertClose(putts.par4.value, 4.0 / 3.0)
        XCTAssertEqual(putts.par5.value, 3)

        XCTAssertEqual(StatMeasuresMath.penaltyHoleShare(workedExample).value, 0.5)
        let byPenalty = StatMeasuresMath.vsParByPenalty(workedExample)
        XCTAssertEqual(byPenalty.penalty.value, 2)
        XCTAssertEqual(byPenalty.clean.value, 0)
        XCTAssertEqual(StatMeasuresMath.penaltyTax(workedExample).value, 2)
    }

    /// nil is "not recorded" here too, and a difference is nil as soon as
    /// EITHER of its sides is — never zero, never a one-sided reading.
    func testACrossTabWithNoSampleIsNilOnBothSidesAndInTheDifference() {
        let empty = StatMeasuresMath.zero
        let cost = StatMeasuresMath.costOfMissedGreen(empty)
        XCTAssertNil(cost.hit.value)
        XCTAssertNil(cost.miss.value)
        XCTAssertNil(cost.delta.value)

        // One side alone still leaves the difference nil.
        let missOnly = measures {
            $0.holesScoredGirMiss = 6
            $0.strokesVsParGirMiss = 9
        }
        let oneSided = StatMeasuresMath.costOfMissedGreen(missOnly)
        XCTAssertEqual(oneSided.miss.value, 1.5)
        XCTAssertNil(oneSided.hit.value)
        XCTAssertNil(oneSided.delta.value)

        let gir = StatMeasuresMath.girByPar(empty)
        XCTAssertNil(gir.par3.value)
        XCTAssertNil(gir.par4.value)
        XCTAssertNil(gir.par5.value)
        for bucket in PuttCountBucket.allCases {
            XCTAssertNil(StatMeasuresMath.puttDistribution(empty)[bucket]?.value)
        }
        XCTAssertNil(StatMeasuresMath.penaltyHoleShare(empty).value)
        XCTAssertNil(StatMeasuresMath.penaltyTax(empty).value)
    }

    /// No clamping: scoring better off a miss than off a hit is a real reading
    /// of a small sample, and it prints as a negative rather than as a zero.
    func testANegativeMissedGreenTaxIsKeptAsIs() {
        let m = measures {
            $0.girHolesScored = 4
            $0.strokesVsParGirHit = 8
            $0.holesScoredGirMiss = 4
            $0.strokesVsParGirMiss = 4
        }
        let cost = StatMeasuresMath.costOfMissedGreen(m)
        XCTAssertEqual(cost.hit.value, 2)
        XCTAssertEqual(cost.miss.value, 1)
        XCTAssertEqual(cost.delta.value, -1)
    }

    func testTheWorkedExampleEndToEndCountsInRankedLinesOut() throws {
        // The same round the server test asserts, played against five flat rounds.
        let window = Array(
            repeating: waterfall(putting: 2, shortGame: 0, penalties: 0, longGame: 1, total: 3),
            count: 5)
        let w = StatMeasuresMath.strokesLost(workedExample)
        let ranked = lines(workedExample, w, window, 3)
        // Deltas vs the flat window: short game −2.55 − 0 = −2.55 (best, and it
        // is the holed chip that puts it there); penalties 1 − 0 = +1 (worst);
        // putting 0.65 − 2 = −1.35 and long game 1.90 − 1 = +0.90 lose to them.
        // The round also putted better than all five, which is the third line.
        XCTAssertEqual(
            ids(ranked),
            [.componentBestVsBaseline, .componentWorstVsBaseline, .bestPuttingRound])
        XCTAssertEqual(ranked[0].params["component"], .component(.shortGame))
        assertClose(number(ranked[0].params["delta"]), -2.55)
        // "Worst" is a genuine regression here: +1 penalty stroke against a
        // baseline of none. (It is only ever the component furthest ABOVE the
        // baseline — which on a good round can still be a gain.)
        XCTAssertEqual(ranked[1].params["component"], .component(.penalties))
        XCTAssertEqual(number(ranked[1].params["delta"]), 1)
    }
}
