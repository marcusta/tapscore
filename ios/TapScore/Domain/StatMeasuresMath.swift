/// Client-side stats math over the server's per-round count rows
/// (proposal `docs/proposals/player-stats-presentation.md` §5.4).
///
/// The split this file implements: **counts on the server, rates on the client**.
/// `GET /players/me/stats` returns one `StatMeasures` row per round and never a
/// rate; every window (last 5/10/20, custom filter) is a client-side SUM of those
/// rows followed by client-side rate math. That is why `PlayerStatsSummary.totals`
/// and `roundsWithStats` are allowed to be nil on a cursored page — a client that
/// can add up the rows it already holds never needs them.
///
/// The line-for-line twin of `src/round/stat-measures.ts`; the two test suites
/// (`StatMeasuresMathTests` / `tests/round/stat-measures.test.ts`) are one
/// specification, so a change to one belongs in both. Pure: no store, no
/// network, no view, not even Foundation.
///
/// Three invariants run through the whole file, and every doc comment is written
/// against them:
///
///  1. **nil is "not recorded", never "no".** A rate carries its own
///     numerator/denominator, and a zero denominator yields `value == nil` —
///     never 0, never NaN, never a division. The UI decides how to render "no
///     sample"; this file decides only that there is none.
///  2. **Coherent denominators (resolved-only).** Every putting ratio pairs a v2
///     numerator with the matching `*Resolved` / fine-bucket denominator. Mixing
///     a v2 numerator over the coarse `firstPuttRecorded` is what makes a ratio
///     exceed 1 on pre-044 data, so it is never done here.
///  3. **nil propagates, it never defaults.** A term with no sample is nil, not
///     zero; nothing is silently charged to a neighbouring term to keep a sum
///     balanced.
///  4. **One cohort, no residual.** The five strokes-lost terms are all measured
///     over the same attribution cohort — the holes that carry a score, a green
///     answer, a coherent putt count and (on par 4/5) a tee answer. They
///     telescope exactly to `Σ(score − E_HOLE[par])` over that cohort, so there
///     is no leftover term to blame the driver with, and every term is nil iff
///     the cohort is empty.

// MARK: - Guarded rates

/// A ratio that carries its own sample. `value` is `n / d`, or `nil` when
/// `d == 0` — the "not recorded" case, which is NOT zero and must never be
/// rendered as 0%.
///
/// `value` is not necessarily in [0, 1]: the same shape carries averages (avg
/// strokes vs par, putts per hole) and signed differences. What it always means
/// is "this number was computed from `n` over a sample of `d`".
struct Rate: Equatable, Sendable {
    var value: Double?
    var n: Double
    var d: Double
}

/// How a rate may honestly be shown (proposal principle 2):
///
/// - `percentage` — the sample is big enough for a percentage.
/// - `fraction` — there IS a sample, but showing "100%" off it would lie. Render
///   the raw fraction ("2 of 3").
/// - `absent` — nothing was recorded. Render the panel's empty state, not a zero.
enum RateDisplay: String, Equatable, Sendable {
    case percentage
    case fraction
    case absent
}

// MARK: - Shapes shared by the split metrics

/// The three tee results, which PARTITION the graded tee shots.
struct ByTee<T: Equatable & Sendable>: Equatable, Sendable {
    var fairway: T
    var inPlay: T
    var trouble: T
}

/// The short-game difficulty split, plus the three legs added together.
struct ByDifficulty<T: Equatable & Sendable>: Equatable, Sendable {
    var standard: T
    var hard: T
    var bunker: T
    var overall: T
}

/// The scoring split by par group.
struct ByParGroup<T: Equatable & Sendable>: Equatable, Sendable {
    var par3: T
    var par4: T
    var par5: T
}

/// Two vs-par averages and the difference between them. `delta` is the
/// trouble-tax construction: its `d` is a CROSS-PRODUCT GUARD, not a sample —
/// never feed it to `rateDisplay` as one. Print both sides instead.
struct VsParSplit: Equatable, Sendable {
    var hit: Rate
    var miss: Rate
    var delta: Rate
}

/// The two vs-par sides of the penalty tax.
struct PenaltySplit: Equatable, Sendable {
    var penalty: Rate
    var clean: Rate
}

// MARK: - Putting buckets

/// The five v2 first-putt buckets, in distance order. The three legacy coarse
/// values (`inside_2m`, `2_to_6m`, `over_6m`) are deliberately absent: the
/// server's v2 columns do not project them, so no ratio here can see them.
enum PuttBucket: String, CaseIterable, Sendable {
    case inside1m = "inside_1m"
    case oneTo2m = "1_to_2m"
    case twoTo4m = "2_to_4m"
    case fourTo8m = "4_to_8m"
    case over8m = "over_8m"
}

/// The four putt-count buckets. They partition `puttsRecorded`.
enum PuttCountBucket: String, CaseIterable, Sendable {
    case zero
    case one
    case two
    case threePlus
}

/// Expected putts per first-putt bucket. A value type rather than a dictionary
/// so a table is total by construction — every bucket has a number.
struct ExpectedPuttsTable: Equatable, Sendable {
    var inside1m: Double
    var oneTo2m: Double
    var twoTo4m: Double
    var fourTo8m: Double
    var over8m: Double

    subscript(bucket: PuttBucket) -> Double {
        switch bucket {
        case .inside1m: return inside1m
        case .oneTo2m: return oneTo2m
        case .twoTo4m: return twoTo4m
        case .fourTo8m: return fourTo8m
        case .over8m: return over8m
        }
    }
}

/// What a chip is observed to have left — the whole resolution the measure set
/// has for short-game proximity.
struct ChipOutcomeExpectedPutts: Equatable, Sendable {
    var inside2m: Double
    var outside2m: Double
}

/// A chip baseline per difficulty — what an AVERAGE short-game shot leaves.
struct ChipExpectedPutts: Equatable, Sendable {
    var standard: Double
    var hard: Double
    var bunker: Double
}

/// Rows behind each cell of an `SgTables`. Mirrors its shape field for field.
struct SgTableRowCounts: Equatable, Sendable {
    var eHole: [Int: Int]
    var eAfterTee: [Int: [TeeResult: Int]]
}

/// One expected-score baseline: what a hole is worth from the tee, and what it
/// is worth once the tee shot has finished somewhere.
struct SgTables: Equatable, Sendable {
    var version: String
    var calibratedAt: String?
    /// Expected strokes from the tee, by par.
    var eHole: [Int: Double]
    /// Expected strokes to hole out from where the tee shot finished.
    var eAfterTee: [Int: [TeeResult: Double]]
    /// Rows behind each cell.
    var rowCounts: SgTableRowCounts
}

/// Tapscore reference baseline v1 — the expected-score tables the five
/// attribution terms are measured against.
///
/// PROVISIONAL_PENDING_OWNER_CALIBRATION. The values below are anchored on
/// published amateur scoring means, NOT on this app's data. `calibratedAt` is
/// nil precisely because nobody has calibrated it yet: a date here would claim
/// a freeze that has not happened.
///
/// TODO(owner, v1 freeze): run `bun run sg:calibrate` on the production box
/// (the machine holding `data/app.sqlite`), paste its emitted block over this
/// one, set `calibratedAt` to the run date and drop the PROVISIONAL marker.
/// Nothing else in the codebase changes — the fixture oracle tests the MATH, so
/// a table swap moves displayed magnitudes and breaks no test.
///
/// Do NOT blend the two sources. Proposal §6: published tables are a
/// sanity-check, never mixed in.
enum SgTablesV1 {
    static let version = "v1-provisional"
    static let calibratedAt: String? = nil

    /// Expected strokes from the tee, by par.
    static let eHole: [Int: Double] = [3: 3.60, 4: 4.70, 5: 5.50]

    /// Expected strokes to hole out from where the tee shot finished.
    static let eAfterTee: [Int: [TeeResult: Double]] = [
        4: [.fairway: 3.45, .inPlay: 3.80, .trouble: 4.35],
        5: [.fairway: 4.25, .inPlay: 4.60, .trouble: 5.15],
    ]

    /// Rows behind each cell. All zero: no cell was fitted from play.
    static let rowCounts = SgTableRowCounts(
        eHole: [3: 0, 4: 0, 5: 0],
        eAfterTee: [
            4: [.fairway: 0, .inPlay: 0, .trouble: 0],
            5: [.fairway: 0, .inPlay: 0, .trouble: 0],
        ])

    /// The same tables as one value, for passing to `strokesLostV3`.
    static let tables = SgTables(
        version: version, calibratedAt: calibratedAt, eHole: eHole, eAfterTee: eAfterTee,
        rowCounts: rowCounts)
}

// MARK: - The strokes-lost waterfall

/// The five attribution terms, in canonical order. Declaration order IS
/// `allCases` order, and `allCases` order is what rankings, strips and every
/// iteration read — including the strict `>` / `<` tie-breaks in `insightLines`,
/// where an exact tie resolves to the EARLIER component here. Both clients
/// iterate this list, so a reorder is a cross-platform behaviour change.
enum StrokesLostComponent: String, CaseIterable, Sendable {
    case tee
    case approach
    case shortGame
    case putting
    case penalties
}

/// The sample a waterfall was computed over.
struct StrokesLostCoverage: Equatable, Sendable {
    /// Holes in the attribution cohort — the common hole set every term is
    /// measured over.
    var attributed: Double
    /// Holes with a canonicalised score, cohort or not. The denominator the
    /// info popover quotes.
    var holesScored: Double

    init(attributed: Double = 0, holesScored: Double = 0) {
        self.attributed = attributed
        self.holesScored = holesScored
    }
}

/// One round's score vs the reference baseline over the attribution cohort,
/// split into five terms. Positive = strokes LOST; negative = gained.
///
/// **All five or none.** Every field is nil iff `coverage.attributed == 0`, and
/// non-nil otherwise. There is no partial state: the cohort is one common hole
/// set by construction, so a term cannot be "not measured" while its siblings
/// are. There is no residual — the five terms telescope to `total` exactly.
struct StrokesLost: Equatable, Sendable {
    var tee: Double?
    var approach: Double?
    var shortGame: Double?
    var putting: Double?
    var penalties: Double?
    /// `Σ(score − E_HOLE[par])` over the cohort. Equals the sum of the five.
    var total: Double?
    var coverage: StrokesLostCoverage

    init(
        tee: Double? = nil,
        approach: Double? = nil,
        shortGame: Double? = nil,
        putting: Double? = nil,
        penalties: Double? = nil,
        total: Double? = nil,
        coverage: StrokesLostCoverage = StrokesLostCoverage()
    ) {
        self.tee = tee
        self.approach = approach
        self.shortGame = shortGame
        self.putting = putting
        self.penalties = penalties
        self.total = total
        self.coverage = coverage
    }

    subscript(component: StrokesLostComponent) -> Double? {
        switch component {
        case .tee: return tee
        case .approach: return approach
        case .shortGame: return shortGame
        case .putting: return putting
        case .penalties: return penalties
        }
    }
}

/// A round's waterfall against the player's own recent form. Positive = worse
/// than usual (more strokes lost), negative = better.
///
/// nil where the comparison cannot be made: either this round has no value for
/// the component, or no round in the window does.
struct StrokesLostDeltas: Equatable, Sendable {
    var tee: Double?
    var approach: Double?
    var shortGame: Double?
    var putting: Double?
    var penalties: Double?
    var total: Double?

    subscript(component: StrokesLostComponent) -> Double? {
        switch component {
        case .tee: return tee
        case .approach: return approach
        case .shortGame: return shortGame
        case .putting: return putting
        case .penalties: return penalties
        }
    }
}

// MARK: - Results over a window of rounds

/// The five score types, in reading order. The buckets PARTITION the scored
/// holes: a hole with a score falls in exactly one, so the five counts sum to
/// `holesScored` and the shares printed off them add up.
enum ScoreType: String, CaseIterable, Sendable {
    case eagleOrBetter
    case birdie
    case par
    case bogey
    case doubleBogeyPlus
}

/// One row of the window as `resultsSummary` needs it. `holeCount` is the
/// round's own length, which no `StatMeasures` column carries — a round can be
/// eighteen holes long and have six of them scored.
struct ResultsRow: Equatable, Sendable {
    var holeCount: Double
    var measures: StatMeasures
}

/// The best round of one length class, expressed vs par.
struct ResultsBest: Equatable, Sendable {
    /// `strokesTotal − parTotal` of that round. Negative is good.
    var vsPar: Double
    /// Its absolute total, for the small annotation beside the figure only.
    var strokes: Double
}

/// One round length present in the window — 18 and 9 are the ones that occur.
struct ResultsLengthClass: Equatable, Sendable {
    var holeCount: Double
    /// EVERY row of this length, scored or not. The subtitle's mix is over these.
    var rounds: Int
    /// Rows of this length that scored every one of their holes.
    var completeRounds: Int
    /// Best COMPLETE round of this length. nil when the class has none.
    var best: ResultsBest?
}

/// The scoring headline for a window: how much golf, and how well.
///
/// Vs par, never an absolute: courses differ in par, so a total says less than
/// an over/under, and the headline is normalised per eighteen holes so a
/// nine-holer is directly comparable to a full round. Nothing here gates on
/// eighteen — a round is never excluded for being short or for having gaps in
/// it; the maths simply works over the holes that were scored.
struct ResultsSummary: Equatable, Sendable {
    /// Every row in the window, whatever it holds. This is the number the
    /// section subtitle prints, and it must equal the length of the round list
    /// below it — including score-only and stats-only rounds.
    var rounds: Int
    /// Rows with at least one scored hole. The scoring figures' round sample.
    var scoredRounds: Int
    /// Scored holes across the window — the denominator of `avgVsParPer18`.
    var holesScored: Double
    /// What `holesScored` would be if every round in the window had scored
    /// every one of its holes: `Σ (class.rounds × class.holeCount)`. The view
    /// shows the hero's denominator line only when the two differ.
    var holesExpected: Double
    /// One entry per hole count present, LONGEST FIRST.
    var lengths: [ResultsLengthClass]
    /// Average (strokes − par) normalised to eighteen holes:
    /// `Σ (strokes − par) / Σ holesScored × 18`.
    ///
    /// `n` is `Σ (strokes − par) × 18` and `d` is `holesScored`, so the `Rate`
    /// invariant `value == n / d` holds and `d` is the honest sample — HOLES,
    /// not rounds. Absent (`d == 0`) when the window scored nothing.
    var avgVsParPer18: Rate
    /// The histogram over every scored hole in the window. Fully populated:
    /// every `ScoreType` key is present, zero where empty, so a lookup never
    /// needs a `?? 0` at the call site.
    var scoreTypeCounts: [ScoreType: Double]
}

// MARK: - Insight lines

/// The closed set of things this module will say about a round. The UI owns the
/// WORDING (and its translations); this module owns the SELECTION, so both
/// clients pick the same lines from the same numbers.
///
/// The raw values are the twin's ids verbatim — one template key set, two
/// clients. Adding a rule means adding a case here, a case to `insightLines`,
/// and a case to both test suites; the list is closed on purpose.
///
/// `CaseIterable` is load-bearing, not convenience: `RoundStoryCopy` words every
/// id in an exhaustive switch and a test walks `allCases` against it, so a rule
/// added here fails the suite until somebody writes the sentence for it.
enum InsightID: String, Equatable, Sendable, CaseIterable {
    case componentBestVsBaseline = "component_best_vs_baseline"
    case componentWorstVsBaseline = "component_worst_vs_baseline"
    case penaltiesSpike = "penalties_spike"
    case twoWayMiss = "two_way_miss"
    case scrambleStreak = "scramble_streak"
    case hardScrambleStreak = "hard_scramble_streak"
    case threePuttFree = "three_putt_free"
    case bestPuttingRound = "best_putting_round"
    case bounceBackPerfect = "bounce_back_perfect"
}

/// A template parameter: a number, or the name of a waterfall component.
enum InsightParam: Equatable, Sendable {
    case number(Double)
    case component(StrokesLostComponent)
}

struct InsightLine: Equatable, Sendable {
    var id: InsightID
    var params: [String: InsightParam]
}

// MARK: - The math

enum StatMeasuresMath {

    // MARK: Guarded rates

    /// The one place a denominator is checked. `d == 0` is the only nil case.
    static func rate(_ numerator: Double, _ denominator: Double) -> Rate {
        Rate(
            value: denominator == 0 ? nil : numerator / denominator,
            n: numerator,
            d: denominator)
    }

    /// Proposal §8 q4: the global floor, overridable per panel by the caller.
    static let minRateDenominator: Double = 5

    static func rateDisplay(_ r: Rate, minDen: Double = minRateDenominator) -> RateDisplay {
        if r.d == 0 { return .absent }
        return r.d >= minDen ? .percentage : .fraction
    }

    // MARK: Window summation

    /// Every measure at zero — the identity of `add`, and the honest shape of
    /// "no rounds in this window" (every denominator zero, so every rate is
    /// `.absent` rather than 0%).
    static let zero = StatMeasures(
        teeRecorded: 0,
        fairwayHits: 0,
        inPlayHits: 0,
        troubleCount: 0,
        teeMissRecorded: 0,
        teeMissLeft: 0,
        teeMissRight: 0,
        teeTroubleLeft: 0,
        teeTroubleRight: 0,
        girRecorded: 0,
        girHits: 0,
        greenMissRecorded: 0,
        greenMissLong: 0,
        greenMissShort: 0,
        greenMissLeft: 0,
        greenMissRight: 0,
        firstPuttRecorded: 0,
        firstPuttInside1m: 0,
        firstPutt1To2m: 0,
        firstPutt2To4m: 0,
        firstPutt4To8m: 0,
        firstPuttOver8m: 0,
        firstPuttInside1mResolved: 0,
        firstPutt1To2mResolved: 0,
        firstPutt2To4mResolved: 0,
        firstPutt4To8mResolved: 0,
        firstPuttOver8mResolved: 0,
        onePuttInside1m: 0,
        onePutt1To2m: 0,
        onePutt2To4m: 0,
        onePutt4To8m: 0,
        onePuttOver8m: 0,
        puttsRecorded: 0,
        puttsTotal: 0,
        threePutts: 0,
        threePuttsFromOver8m: 0,
        scrambleAttemptsStandard: 0,
        scrambleSuccessesStandard: 0,
        scrambleAttemptsHard: 0,
        scrambleSuccessesHard: 0,
        scrambleFirstPuttStandard: 0,
        scrambleInside2mStandard: 0,
        scrambleFirstPuttHard: 0,
        scrambleInside2mHard: 0,
        scrambleHoledStandard: 0,
        scrambleHoledHard: 0,
        scrambleAttemptsBunker: 0,
        scrambleSuccessesBunker: 0,
        scrambleFirstPuttBunker: 0,
        scrambleInside2mBunker: 0,
        scrambleHoledBunker: 0,
        shortGameStrokesRecorded: 0,
        shortGameStrokesEffective: 0,
        shortGameStrokesEffectiveStandard: 0,
        shortGameStrokesEffectiveHard: 0,
        shortGameStrokesEffectiveBunker: 0,
        holesMultiChip: 0,
        holesMultiChipBunker: 0,
        penaltiesRecorded: 0,
        penaltiesTotal: 0,
        recoveryAttempts: 0,
        recoverySuccesses: 0,
        penaltySourceRecorded: 0,
        penaltiesTee: 0,
        penaltiesApproach: 0,
        penaltiesShort: 0,
        holesScored: 0,
        strokesTotal: 0,
        parTotal: 0,
        holesScoredPar3: 0,
        strokesPar3: 0,
        holesScoredPar4: 0,
        strokesPar4: 0,
        holesScoredPar5: 0,
        strokesPar5: 0,
        holesEagleOrBetter: 0,
        holesBirdie: 0,
        holesPar: 0,
        holesBogey: 0,
        doubleBogeyPlus: 0,
        girHolesScored: 0,
        birdiesOnGir: 0,
        bounceBackOpportunities: 0,
        bounceBackSuccesses: 0,
        holesScoredFairway: 0,
        strokesVsParFairway: 0,
        holesScoredInPlay: 0,
        strokesVsParInPlay: 0,
        holesScoredTrouble: 0,
        strokesVsParTrouble: 0,
        girRecordedFairway: 0,
        girHitsFairway: 0,
        girRecordedInPlay: 0,
        girHitsInPlay: 0,
        girRecordedTrouble: 0,
        girHitsTrouble: 0,
        girFirstPuttRecorded: 0,
        girFirstPuttInside1m: 0,
        girFirstPutt1To2m: 0,
        girFirstPutt2To4m: 0,
        girFirstPutt4To8m: 0,
        girFirstPuttOver8m: 0,
        puttsRecordedGir: 0,
        puttsTotalGir: 0,
        puttsTotalInside1mResolved: 0,
        puttsTotal1To2mResolved: 0,
        puttsTotal2To4mResolved: 0,
        puttsTotal4To8mResolved: 0,
        puttsTotalOver8mResolved: 0,
        strokesVsParGirHit: 0,
        holesScoredGirMiss: 0,
        strokesVsParGirMiss: 0,
        girRecordedPar3: 0,
        girHitsPar3: 0,
        girRecordedPar4: 0,
        girHitsPar4: 0,
        girRecordedPar5: 0,
        girHitsPar5: 0,
        holesZeroPutt: 0,
        holesOnePutt: 0,
        holesTwoPutt: 0,
        puttsRecordedPar3: 0,
        puttsTotalPar3: 0,
        puttsRecordedPar4: 0,
        puttsTotalPar4: 0,
        puttsRecordedPar5: 0,
        puttsTotalPar5: 0,
        holesWithPenalty: 0,
        holesScoredPenalty: 0,
        strokesVsParPenalty: 0,
        holesScoredPenaltyFree: 0,
        strokesVsParPenaltyFree: 0,
        teeRecordedPar4: 0,
        fairwayHitsPar4: 0,
        inPlayHitsPar4: 0,
        troubleCountPar4: 0,
        teeRecordedPar5: 0,
        fairwayHitsPar5: 0,
        inPlayHitsPar5: 0,
        troubleCountPar5: 0,
        attHolesPar3Gir: 0,
        attHolesPar3Miss: 0,
        attHolesPar45Gir: 0,
        attHolesPar45Miss: 0,
        attStrokes: 0,
        attPutts: 0,
        attPenalties: 0,
        attFairwayPar4: 0,
        attInPlayPar4: 0,
        attTroublePar4: 0,
        attFairwayPar5: 0,
        attInPlayPar5: 0,
        attTroublePar5: 0,
        attGirFirstPuttInside1m: 0,
        attGirFirstPutt1To2m: 0,
        attGirFirstPutt2To4m: 0,
        attGirFirstPutt4To8m: 0,
        attGirFirstPuttOver8m: 0,
        attGirHoled: 0,
        attMissStandard: 0,
        attMissHard: 0,
        attChipInside2mStandard: 0,
        attChipOutside2mStandard: 0,
        attChipHoledStandard: 0,
        attChipInside2mHard: 0,
        attChipOutside2mHard: 0,
        attChipHoledHard: 0,
        attMissBunker: 0,
        attChipInside2mBunker: 0,
        attChipOutside2mBunker: 0,
        attChipHoledBunker: 0,
        attSgStrokesEffectiveStandard: 0,
        attSgStrokesEffectiveHard: 0,
        attSgStrokesEffectiveBunker: 0
    )

    /// Field-by-field addition. Written out rather than iterated on purpose: the
    /// server's measure set grows (043 → 044 → 046), and an explicit
    /// initializer turns "a new column exists" into a compile error here instead
    /// of a column that silently reads zero forever.
    ///
    /// Every column in the set is a COUNT or a SUM, so plain addition is the
    /// correct fold — the server's own `player_stat_totals` view is the same
    /// SUM, which is what makes a client-side window equal to a server-side one.
    static func add(_ a: StatMeasures, _ b: StatMeasures) -> StatMeasures {
        StatMeasures(
            teeRecorded: a.teeRecorded + b.teeRecorded,
            fairwayHits: a.fairwayHits + b.fairwayHits,
            inPlayHits: a.inPlayHits + b.inPlayHits,
            troubleCount: a.troubleCount + b.troubleCount,
            teeMissRecorded: a.teeMissRecorded + b.teeMissRecorded,
            teeMissLeft: a.teeMissLeft + b.teeMissLeft,
            teeMissRight: a.teeMissRight + b.teeMissRight,
            teeTroubleLeft: a.teeTroubleLeft + b.teeTroubleLeft,
            teeTroubleRight: a.teeTroubleRight + b.teeTroubleRight,
            girRecorded: a.girRecorded + b.girRecorded,
            girHits: a.girHits + b.girHits,
            greenMissRecorded: a.greenMissRecorded + b.greenMissRecorded,
            greenMissLong: a.greenMissLong + b.greenMissLong,
            greenMissShort: a.greenMissShort + b.greenMissShort,
            greenMissLeft: a.greenMissLeft + b.greenMissLeft,
            greenMissRight: a.greenMissRight + b.greenMissRight,
            firstPuttRecorded: a.firstPuttRecorded + b.firstPuttRecorded,
            firstPuttInside1m: a.firstPuttInside1m + b.firstPuttInside1m,
            firstPutt1To2m: a.firstPutt1To2m + b.firstPutt1To2m,
            firstPutt2To4m: a.firstPutt2To4m + b.firstPutt2To4m,
            firstPutt4To8m: a.firstPutt4To8m + b.firstPutt4To8m,
            firstPuttOver8m: a.firstPuttOver8m + b.firstPuttOver8m,
            firstPuttInside1mResolved: a.firstPuttInside1mResolved + b.firstPuttInside1mResolved,
            firstPutt1To2mResolved: a.firstPutt1To2mResolved + b.firstPutt1To2mResolved,
            firstPutt2To4mResolved: a.firstPutt2To4mResolved + b.firstPutt2To4mResolved,
            firstPutt4To8mResolved: a.firstPutt4To8mResolved + b.firstPutt4To8mResolved,
            firstPuttOver8mResolved: a.firstPuttOver8mResolved + b.firstPuttOver8mResolved,
            onePuttInside1m: a.onePuttInside1m + b.onePuttInside1m,
            onePutt1To2m: a.onePutt1To2m + b.onePutt1To2m,
            onePutt2To4m: a.onePutt2To4m + b.onePutt2To4m,
            onePutt4To8m: a.onePutt4To8m + b.onePutt4To8m,
            onePuttOver8m: a.onePuttOver8m + b.onePuttOver8m,
            puttsRecorded: a.puttsRecorded + b.puttsRecorded,
            puttsTotal: a.puttsTotal + b.puttsTotal,
            threePutts: a.threePutts + b.threePutts,
            threePuttsFromOver8m: a.threePuttsFromOver8m + b.threePuttsFromOver8m,
            scrambleAttemptsStandard: a.scrambleAttemptsStandard + b.scrambleAttemptsStandard,
            scrambleSuccessesStandard: a.scrambleSuccessesStandard + b.scrambleSuccessesStandard,
            scrambleAttemptsHard: a.scrambleAttemptsHard + b.scrambleAttemptsHard,
            scrambleSuccessesHard: a.scrambleSuccessesHard + b.scrambleSuccessesHard,
            scrambleFirstPuttStandard: a.scrambleFirstPuttStandard + b.scrambleFirstPuttStandard,
            scrambleInside2mStandard: a.scrambleInside2mStandard + b.scrambleInside2mStandard,
            scrambleFirstPuttHard: a.scrambleFirstPuttHard + b.scrambleFirstPuttHard,
            scrambleInside2mHard: a.scrambleInside2mHard + b.scrambleInside2mHard,
            scrambleHoledStandard: a.scrambleHoledStandard + b.scrambleHoledStandard,
            scrambleHoledHard: a.scrambleHoledHard + b.scrambleHoledHard,
            scrambleAttemptsBunker: a.scrambleAttemptsBunker + b.scrambleAttemptsBunker,
            scrambleSuccessesBunker: a.scrambleSuccessesBunker + b.scrambleSuccessesBunker,
            scrambleFirstPuttBunker: a.scrambleFirstPuttBunker + b.scrambleFirstPuttBunker,
            scrambleInside2mBunker: a.scrambleInside2mBunker + b.scrambleInside2mBunker,
            scrambleHoledBunker: a.scrambleHoledBunker + b.scrambleHoledBunker,
            shortGameStrokesRecorded: a.shortGameStrokesRecorded + b.shortGameStrokesRecorded,
            shortGameStrokesEffective: a.shortGameStrokesEffective + b.shortGameStrokesEffective,
            shortGameStrokesEffectiveStandard: a.shortGameStrokesEffectiveStandard
                + b.shortGameStrokesEffectiveStandard,
            shortGameStrokesEffectiveHard: a.shortGameStrokesEffectiveHard
                + b.shortGameStrokesEffectiveHard,
            shortGameStrokesEffectiveBunker: a.shortGameStrokesEffectiveBunker
                + b.shortGameStrokesEffectiveBunker,
            holesMultiChip: a.holesMultiChip + b.holesMultiChip,
            holesMultiChipBunker: a.holesMultiChipBunker + b.holesMultiChipBunker,
            penaltiesRecorded: a.penaltiesRecorded + b.penaltiesRecorded,
            penaltiesTotal: a.penaltiesTotal + b.penaltiesTotal,
            recoveryAttempts: a.recoveryAttempts + b.recoveryAttempts,
            recoverySuccesses: a.recoverySuccesses + b.recoverySuccesses,
            penaltySourceRecorded: a.penaltySourceRecorded + b.penaltySourceRecorded,
            penaltiesTee: a.penaltiesTee + b.penaltiesTee,
            penaltiesApproach: a.penaltiesApproach + b.penaltiesApproach,
            penaltiesShort: a.penaltiesShort + b.penaltiesShort,
            holesScored: a.holesScored + b.holesScored,
            strokesTotal: a.strokesTotal + b.strokesTotal,
            parTotal: a.parTotal + b.parTotal,
            holesScoredPar3: a.holesScoredPar3 + b.holesScoredPar3,
            strokesPar3: a.strokesPar3 + b.strokesPar3,
            holesScoredPar4: a.holesScoredPar4 + b.holesScoredPar4,
            strokesPar4: a.strokesPar4 + b.strokesPar4,
            holesScoredPar5: a.holesScoredPar5 + b.holesScoredPar5,
            strokesPar5: a.strokesPar5 + b.strokesPar5,
            holesEagleOrBetter: a.holesEagleOrBetter + b.holesEagleOrBetter,
            holesBirdie: a.holesBirdie + b.holesBirdie,
            holesPar: a.holesPar + b.holesPar,
            holesBogey: a.holesBogey + b.holesBogey,
            doubleBogeyPlus: a.doubleBogeyPlus + b.doubleBogeyPlus,
            girHolesScored: a.girHolesScored + b.girHolesScored,
            birdiesOnGir: a.birdiesOnGir + b.birdiesOnGir,
            bounceBackOpportunities: a.bounceBackOpportunities + b.bounceBackOpportunities,
            bounceBackSuccesses: a.bounceBackSuccesses + b.bounceBackSuccesses,
            holesScoredFairway: a.holesScoredFairway + b.holesScoredFairway,
            strokesVsParFairway: a.strokesVsParFairway + b.strokesVsParFairway,
            holesScoredInPlay: a.holesScoredInPlay + b.holesScoredInPlay,
            strokesVsParInPlay: a.strokesVsParInPlay + b.strokesVsParInPlay,
            holesScoredTrouble: a.holesScoredTrouble + b.holesScoredTrouble,
            strokesVsParTrouble: a.strokesVsParTrouble + b.strokesVsParTrouble,
            girRecordedFairway: a.girRecordedFairway + b.girRecordedFairway,
            girHitsFairway: a.girHitsFairway + b.girHitsFairway,
            girRecordedInPlay: a.girRecordedInPlay + b.girRecordedInPlay,
            girHitsInPlay: a.girHitsInPlay + b.girHitsInPlay,
            girRecordedTrouble: a.girRecordedTrouble + b.girRecordedTrouble,
            girHitsTrouble: a.girHitsTrouble + b.girHitsTrouble,
            girFirstPuttRecorded: a.girFirstPuttRecorded + b.girFirstPuttRecorded,
            girFirstPuttInside1m: a.girFirstPuttInside1m + b.girFirstPuttInside1m,
            girFirstPutt1To2m: a.girFirstPutt1To2m + b.girFirstPutt1To2m,
            girFirstPutt2To4m: a.girFirstPutt2To4m + b.girFirstPutt2To4m,
            girFirstPutt4To8m: a.girFirstPutt4To8m + b.girFirstPutt4To8m,
            girFirstPuttOver8m: a.girFirstPuttOver8m + b.girFirstPuttOver8m,
            puttsRecordedGir: a.puttsRecordedGir + b.puttsRecordedGir,
            puttsTotalGir: a.puttsTotalGir + b.puttsTotalGir,
            puttsTotalInside1mResolved: a.puttsTotalInside1mResolved + b.puttsTotalInside1mResolved,
            puttsTotal1To2mResolved: a.puttsTotal1To2mResolved + b.puttsTotal1To2mResolved,
            puttsTotal2To4mResolved: a.puttsTotal2To4mResolved + b.puttsTotal2To4mResolved,
            puttsTotal4To8mResolved: a.puttsTotal4To8mResolved + b.puttsTotal4To8mResolved,
            puttsTotalOver8mResolved: a.puttsTotalOver8mResolved + b.puttsTotalOver8mResolved,
            strokesVsParGirHit: a.strokesVsParGirHit + b.strokesVsParGirHit,
            holesScoredGirMiss: a.holesScoredGirMiss + b.holesScoredGirMiss,
            strokesVsParGirMiss: a.strokesVsParGirMiss + b.strokesVsParGirMiss,
            girRecordedPar3: a.girRecordedPar3 + b.girRecordedPar3,
            girHitsPar3: a.girHitsPar3 + b.girHitsPar3,
            girRecordedPar4: a.girRecordedPar4 + b.girRecordedPar4,
            girHitsPar4: a.girHitsPar4 + b.girHitsPar4,
            girRecordedPar5: a.girRecordedPar5 + b.girRecordedPar5,
            girHitsPar5: a.girHitsPar5 + b.girHitsPar5,
            holesZeroPutt: a.holesZeroPutt + b.holesZeroPutt,
            holesOnePutt: a.holesOnePutt + b.holesOnePutt,
            holesTwoPutt: a.holesTwoPutt + b.holesTwoPutt,
            puttsRecordedPar3: a.puttsRecordedPar3 + b.puttsRecordedPar3,
            puttsTotalPar3: a.puttsTotalPar3 + b.puttsTotalPar3,
            puttsRecordedPar4: a.puttsRecordedPar4 + b.puttsRecordedPar4,
            puttsTotalPar4: a.puttsTotalPar4 + b.puttsTotalPar4,
            puttsRecordedPar5: a.puttsRecordedPar5 + b.puttsRecordedPar5,
            puttsTotalPar5: a.puttsTotalPar5 + b.puttsTotalPar5,
            holesWithPenalty: a.holesWithPenalty + b.holesWithPenalty,
            holesScoredPenalty: a.holesScoredPenalty + b.holesScoredPenalty,
            strokesVsParPenalty: a.strokesVsParPenalty + b.strokesVsParPenalty,
            holesScoredPenaltyFree: a.holesScoredPenaltyFree + b.holesScoredPenaltyFree,
            strokesVsParPenaltyFree: a.strokesVsParPenaltyFree + b.strokesVsParPenaltyFree,
            teeRecordedPar4: a.teeRecordedPar4 + b.teeRecordedPar4,
            fairwayHitsPar4: a.fairwayHitsPar4 + b.fairwayHitsPar4,
            inPlayHitsPar4: a.inPlayHitsPar4 + b.inPlayHitsPar4,
            troubleCountPar4: a.troubleCountPar4 + b.troubleCountPar4,
            teeRecordedPar5: a.teeRecordedPar5 + b.teeRecordedPar5,
            fairwayHitsPar5: a.fairwayHitsPar5 + b.fairwayHitsPar5,
            inPlayHitsPar5: a.inPlayHitsPar5 + b.inPlayHitsPar5,
            troubleCountPar5: a.troubleCountPar5 + b.troubleCountPar5,
            attHolesPar3Gir: a.attHolesPar3Gir + b.attHolesPar3Gir,
            attHolesPar3Miss: a.attHolesPar3Miss + b.attHolesPar3Miss,
            attHolesPar45Gir: a.attHolesPar45Gir + b.attHolesPar45Gir,
            attHolesPar45Miss: a.attHolesPar45Miss + b.attHolesPar45Miss,
            attStrokes: a.attStrokes + b.attStrokes,
            attPutts: a.attPutts + b.attPutts,
            attPenalties: a.attPenalties + b.attPenalties,
            attFairwayPar4: a.attFairwayPar4 + b.attFairwayPar4,
            attInPlayPar4: a.attInPlayPar4 + b.attInPlayPar4,
            attTroublePar4: a.attTroublePar4 + b.attTroublePar4,
            attFairwayPar5: a.attFairwayPar5 + b.attFairwayPar5,
            attInPlayPar5: a.attInPlayPar5 + b.attInPlayPar5,
            attTroublePar5: a.attTroublePar5 + b.attTroublePar5,
            attGirFirstPuttInside1m: a.attGirFirstPuttInside1m + b.attGirFirstPuttInside1m,
            attGirFirstPutt1To2m: a.attGirFirstPutt1To2m + b.attGirFirstPutt1To2m,
            attGirFirstPutt2To4m: a.attGirFirstPutt2To4m + b.attGirFirstPutt2To4m,
            attGirFirstPutt4To8m: a.attGirFirstPutt4To8m + b.attGirFirstPutt4To8m,
            attGirFirstPuttOver8m: a.attGirFirstPuttOver8m + b.attGirFirstPuttOver8m,
            attGirHoled: a.attGirHoled + b.attGirHoled,
            attMissStandard: a.attMissStandard + b.attMissStandard,
            attMissHard: a.attMissHard + b.attMissHard,
            attChipInside2mStandard: a.attChipInside2mStandard + b.attChipInside2mStandard,
            attChipOutside2mStandard: a.attChipOutside2mStandard + b.attChipOutside2mStandard,
            attChipHoledStandard: a.attChipHoledStandard + b.attChipHoledStandard,
            attChipInside2mHard: a.attChipInside2mHard + b.attChipInside2mHard,
            attChipOutside2mHard: a.attChipOutside2mHard + b.attChipOutside2mHard,
            attChipHoledHard: a.attChipHoledHard + b.attChipHoledHard,
            attMissBunker: a.attMissBunker + b.attMissBunker,
            attChipInside2mBunker: a.attChipInside2mBunker + b.attChipInside2mBunker,
            attChipOutside2mBunker: a.attChipOutside2mBunker + b.attChipOutside2mBunker,
            attChipHoledBunker: a.attChipHoledBunker + b.attChipHoledBunker,
            attSgStrokesEffectiveStandard: a.attSgStrokesEffectiveStandard
                + b.attSgStrokesEffectiveStandard,
            attSgStrokesEffectiveHard: a.attSgStrokesEffectiveHard + b.attSgStrokesEffectiveHard,
            attSgStrokesEffectiveBunker: a.attSgStrokesEffectiveBunker
                + b.attSgStrokesEffectiveBunker
        )
    }

    /// The window: one summed row over the per-round rows the client already holds.
    static func sum(_ rows: [StatMeasures]) -> StatMeasures {
        var out = zero
        for row in rows { out = add(out, row) }
        return out
    }

    // MARK: Putting bucket accessors

    /// Holes in this bucket whose putt count is also recorded — the ONLY legal
    /// denominator for a per-bucket putting ratio (invariant 2).
    static func firstPuttResolved(_ m: StatMeasures, _ bucket: PuttBucket) -> Double {
        switch bucket {
        case .inside1m: return m.firstPuttInside1mResolved
        case .oneTo2m: return m.firstPutt1To2mResolved
        case .twoTo4m: return m.firstPutt2To4mResolved
        case .fourTo8m: return m.firstPutt4To8mResolved
        case .over8m: return m.firstPuttOver8mResolved
        }
    }

    /// Putts taken over exactly the `firstPuttResolved` holes of this bucket.
    static func puttsTotalResolved(_ m: StatMeasures, _ bucket: PuttBucket) -> Double {
        switch bucket {
        case .inside1m: return m.puttsTotalInside1mResolved
        case .oneTo2m: return m.puttsTotal1To2mResolved
        case .twoTo4m: return m.puttsTotal2To4mResolved
        case .fourTo8m: return m.puttsTotal4To8mResolved
        case .over8m: return m.puttsTotalOver8mResolved
        }
    }

    /// One-putts in this bucket. Pairs with `firstPuttResolved`, never with a raw count.
    static func onePutts(_ m: StatMeasures, _ bucket: PuttBucket) -> Double {
        switch bucket {
        case .inside1m: return m.onePuttInside1m
        case .oneTo2m: return m.onePutt1To2m
        case .twoTo4m: return m.onePutt2To4m
        case .fourTo8m: return m.onePutt4To8m
        case .over8m: return m.onePuttOver8m
        }
    }

    /// First-putt distribution on greens HIT — the approach-proximity proxy.
    /// Asks nothing of the putt count (it is about where the approach finished,
    /// not what happened next), so it pairs with `girFirstPuttRecorded`, not
    /// with a resolved count.
    static func girFirstPutt(_ m: StatMeasures, _ bucket: PuttBucket) -> Double {
        switch bucket {
        case .inside1m: return m.girFirstPuttInside1m
        case .oneTo2m: return m.girFirstPutt1To2m
        case .twoTo4m: return m.girFirstPutt2To4m
        case .fourTo8m: return m.girFirstPutt4To8m
        case .over8m: return m.girFirstPuttOver8m
        }
    }

    // MARK: Off the tee (par 4/5 only; the tee question is never asked on a par 3)

    /// Fairways hit over tee shots graded.
    static func fairwayRate(_ m: StatMeasures) -> Rate { rate(m.fairwayHits, m.teeRecorded) }

    /// In play over tee shots graded — CUMULATIVE: a fairway is in play, so this
    /// counts `fairway` + `in_play` and is always ≥ `fairwayRate`. The strict
    /// (fairway-disjoint) reading of `in_play` exists only in the GIR cross-tab,
    /// where the columns partition the tee results.
    static func inPlayRate(_ m: StatMeasures) -> Rate { rate(m.inPlayHits, m.teeRecorded) }

    /// Trouble off the tee over tee shots graded. Complements `inPlayRate` to 1.
    static func troubleRate(_ m: StatMeasures) -> Rate { rate(m.troubleCount, m.teeRecorded) }

    /// Escaping trouble without further damage, over the times it was asked.
    static func recoveryRate(_ m: StatMeasures) -> Rate {
        rate(m.recoverySuccesses, m.recoveryAttempts)
    }

    /// Penalties per round. The window sum has no idea how many rounds it covers
    /// — that is the caller's row count, so it is a parameter, not a measure.
    static func penaltiesPerRound(_ m: StatMeasures, roundCount: Double) -> Rate {
        rate(m.penaltiesTotal, roundCount)
    }

    /// Average strokes vs par by tee result. The three columns PARTITION the tee shots.
    static func strokesVsParByTee(_ m: StatMeasures) -> ByTee<Rate> {
        ByTee(
            fairway: rate(m.strokesVsParFairway, m.holesScoredFairway),
            inPlay: rate(m.strokesVsParInPlay, m.holesScoredInPlay),
            trouble: rate(m.strokesVsParTrouble, m.holesScoredTrouble))
    }

    /// Trouble tax: what a trouble tee shot costs against a fairway one, per
    /// hole — `avg(vs par | trouble) − avg(vs par | fairway)`.
    ///
    /// A difference of two guarded averages, put over their common denominator
    /// so the one nil rule still applies: `d` is the CROSS-PRODUCT of the two
    /// hole counts, which is zero exactly when either side has no sample, and
    /// `n / d` is exactly the difference. `d` is therefore a guard, not a
    /// display sample size — render `strokesVsParByTee` for the two samples this
    /// was built from, and do not feed this rate to `rateDisplay`.
    static func troubleTaxPerHole(_ m: StatMeasures) -> Rate {
        let numerator =
            m.strokesVsParTrouble * m.holesScoredFairway
            - m.strokesVsParFairway * m.holesScoredTrouble
        return rate(numerator, m.holesScoredTrouble * m.holesScoredFairway)
    }

    /// How often a hole that answered the penalty question carried one.
    static func penaltyHoleShare(_ m: StatMeasures) -> Rate {
        rate(m.holesWithPenalty, m.penaltiesRecorded)
    }

    /// The two vs-par sides the penalty tax is a difference of.
    static func vsParByPenalty(_ m: StatMeasures) -> PenaltySplit {
        PenaltySplit(
            penalty: rate(m.strokesVsParPenalty, m.holesScoredPenalty),
            clean: rate(m.strokesVsParPenaltyFree, m.holesScoredPenaltyFree))
    }

    /// Extra strokes per hole on the holes that took a penalty, against the
    /// player's own penalty-free holes.
    ///
    /// Same construction as `troubleTaxPerHole`: the `d` is a cross-product
    /// GUARD, not a sample — the view prints `vsParByPenalty`'s two denominators
    /// instead.
    static func penaltyTax(_ m: StatMeasures) -> Rate {
        let numerator =
            m.strokesVsParPenalty * m.holesScoredPenaltyFree
            - m.strokesVsParPenaltyFree * m.holesScoredPenalty
        return rate(numerator, m.holesScoredPenalty * m.holesScoredPenaltyFree)
    }

    // MARK: Approach

    /// Greens in regulation over greens where the question was answered.
    static func girRate(_ m: StatMeasures) -> Rate { rate(m.girHits, m.girRecorded) }

    /// GIR split by what the tee shot did — "what drive quality buys the approach".
    ///
    /// These three use the STRICT tee columns and partition the tee shots: a
    /// fairway hole is in `fairway` ONLY, unlike the cumulative `inPlayHits`.
    /// Their three denominators sum to the holes carrying BOTH answers, which is
    /// ≤ `girRecorded` (a par 3 has a GIR answer and no tee question, so it is
    /// in none of them).
    static func girRateByTee(_ m: StatMeasures) -> ByTee<Rate> {
        ByTee(
            fairway: rate(m.girHitsFairway, m.girRecordedFairway),
            inPlay: rate(m.girHitsInPlay, m.girRecordedInPlay),
            trouble: rate(m.girHitsTrouble, m.girRecordedTrouble))
    }

    /// Greens hit by par. The three denominators partition `girRecorded`.
    ///
    /// The only place a par-3 approach is visible: the GIR-by-tee cross-tab
    /// above cannot see par 3 at all, because capture never asks a tee question
    /// there.
    static func girByPar(_ m: StatMeasures) -> ByParGroup<Rate> {
        ByParGroup(
            par3: rate(m.girHitsPar3, m.girRecordedPar3),
            par4: rate(m.girHitsPar4, m.girRecordedPar4),
            par5: rate(m.girHitsPar5, m.girRecordedPar5))
    }

    /// What a missed green costs, in strokes vs par per hole.
    ///
    /// `hit` is over `girHolesScored` (greens hit AND scored), `miss` over
    /// `holesScoredGirMiss`. `delta` = miss − hit, put over the cross-product of
    /// the two hole counts so it stays a `Rate` and cannot be zeroed by an empty
    /// side. Positive = a missed green costs you strokes.
    ///
    /// nil rules: `hit.value` is nil iff `girHolesScored == 0`, `miss.value` iff
    /// `holesScoredGirMiss == 0`, `delta.value` iff EITHER is 0. No clamping — a
    /// negative delta (small samples do that) prints as a negative and is the
    /// honest reading.
    static func costOfMissedGreen(_ m: StatMeasures) -> VsParSplit {
        let numerator =
            m.strokesVsParGirMiss * m.girHolesScored
            - m.strokesVsParGirHit * m.holesScoredGirMiss
        return VsParSplit(
            hit: rate(m.strokesVsParGirHit, m.girHolesScored),
            miss: rate(m.strokesVsParGirMiss, m.holesScoredGirMiss),
            delta: rate(numerator, m.holesScoredGirMiss * m.girHolesScored))
    }

    /// Proximity proxy: share of greens hit that left a first putt in this bucket.
    static func girFirstPuttMix(_ m: StatMeasures, _ bucket: PuttBucket) -> Rate {
        rate(girFirstPutt(m, bucket), m.girFirstPuttRecorded)
    }

    /// Holes with a first putt recorded AND its putt count — the mix denominator.
    static func firstPuttResolvedTotal(_ m: StatMeasures) -> Double {
        var total: Double = 0
        for bucket in PuttBucket.allCases { total += firstPuttResolved(m, bucket) }
        return total
    }

    /// Share of ALL recorded holes whose first putt was in this bucket.
    ///
    /// The unconditioned twin of `girFirstPuttMix`: that one is the greens you
    /// HIT, this one is every hole you recorded a first putt on. Resolved on
    /// both sides (invariant 2), so the five shares sum to 1.
    static func firstPuttMix(_ m: StatMeasures, _ bucket: PuttBucket) -> Rate {
        rate(firstPuttResolved(m, bucket), firstPuttResolvedTotal(m))
    }

    /// Birdies over greens hit THAT WERE ALSO SCORED. Not over `girHits`: a green
    /// hit on a hole with no score cannot become a birdie, and counting it would
    /// push the conversion rate down for a hole nobody recorded.
    static func birdieConversion(_ m: StatMeasures) -> Rate {
        rate(m.birdiesOnGir, m.girHolesScored)
    }

    /// How often a missed green left a HARD short-game shot rather than a
    /// standard one. A property of the APPROACH miss, not of the short game: it
    /// says where the approach put you, which is why it is surfaced on the
    /// approach card.
    static func hardChipShare(_ m: StatMeasures) -> Rate {
        rate(
            m.scrambleAttemptsHard,
            m.scrambleAttemptsStandard + m.scrambleAttemptsHard + m.scrambleAttemptsBunker)
    }

    // MARK: Putting

    /// Make% from a bucket: one-putts over that bucket's RESOLVED holes.
    static func onePuttRate(_ m: StatMeasures, _ bucket: PuttBucket) -> Rate {
        rate(onePutts(m, bucket), firstPuttResolved(m, bucket))
    }

    /// Average putts taken from a bucket — the same units as `expectedPuttsV1`,
    /// so the ladder can be drawn against the baseline it is scored on.
    static func puttsPerFirstPutt(_ m: StatMeasures, _ bucket: PuttBucket) -> Rate {
        rate(puttsTotalResolved(m, bucket), firstPuttResolved(m, bucket))
    }

    /// Three-putts over holes with a coherent putt count. `puttsRecorded` is the
    /// v2 putting denominator (`putting_coherent = 1 AND putts IS NOT NULL`),
    /// and it is the one `three_putts` is counted over on the server — a hole
    /// needs no first-putt bucket to be a three-putt.
    static func threePuttRate(_ m: StatMeasures) -> Rate { rate(m.threePutts, m.puttsRecorded) }

    /// The four putt-count buckets as shares of `puttsRecorded`. They PARTITION
    /// it, so the four values sum to 1 whenever the denominator is non-zero —
    /// which is why they share one denominator rather than each carrying its own.
    static func puttDistribution(_ m: StatMeasures) -> [PuttCountBucket: Rate] {
        let d = m.puttsRecorded
        return [
            .zero: rate(m.holesZeroPutt, d),
            .one: rate(m.holesOnePutt, d),
            .two: rate(m.holesTwoPutt, d),
            .threePlus: rate(m.threePutts, d),
        ]
    }

    /// Average putts per recorded hole, by par. Not a share — an average.
    static func puttsPerHoleByPar(_ m: StatMeasures) -> ByParGroup<Rate> {
        ByParGroup(
            par3: rate(m.puttsTotalPar3, m.puttsRecordedPar3),
            par4: rate(m.puttsTotalPar4, m.puttsRecordedPar4),
            par5: rate(m.puttsTotalPar5, m.puttsRecordedPar5))
    }

    /// The lag-putting flag: three-putts from > 8m over resolved > 8m first putts.
    static func threePuttsFromOver8mRate(_ m: StatMeasures) -> Rate {
        rate(m.threePuttsFromOver8m, m.firstPuttOver8mResolved)
    }

    /// Putts per green hit. Putts per ROUND is polluted by chip-ins and missed
    /// greens; this denominator is greens hit with a putt count recorded.
    static func puttsPerGirHole(_ m: StatMeasures) -> Rate {
        rate(m.puttsTotalGir, m.puttsRecordedGir)
    }

    /// Putts per hole on the holes where the green was MISSED — the complement
    /// of `puttsPerGirHole`, over the same two recorded columns.
    ///
    /// Both sides are clamped at zero: on coherent data the GIR subset cannot
    /// exceed the total, but a mixed window could produce a negative difference,
    /// and a negative count here would flatter the miss holes.
    static func puttsAfterMissedGreen(_ m: StatMeasures) -> Rate {
        let putts = max(0, m.puttsTotal - m.puttsTotalGir)
        let holes = max(0, m.puttsRecorded - m.puttsRecordedGir)
        return rate(putts, holes)
    }

    // MARK: Short game

    /// Up-and-downs over attempts. An attempt is a missed green with a
    /// difficulty answer AND a putt count; holing the chip (`putts = 0`) is the
    /// best possible success, not a missing answer.
    static func scrambleRate(_ m: StatMeasures) -> ByDifficulty<Rate> {
        ByDifficulty(
            standard: rate(m.scrambleSuccessesStandard, m.scrambleAttemptsStandard),
            hard: rate(m.scrambleSuccessesHard, m.scrambleAttemptsHard),
            bunker: rate(m.scrambleSuccessesBunker, m.scrambleAttemptsBunker),
            overall: rate(
                m.scrambleSuccessesStandard + m.scrambleSuccessesHard
                    + m.scrambleSuccessesBunker,
                m.scrambleAttemptsStandard + m.scrambleAttemptsHard + m.scrambleAttemptsBunker))
    }

    /// Up-and-downs from sand. The same construction as `scrambleRate.bunker`,
    /// named on its own because "sand save" is what the golfer calls it.
    static func sandSaveRate(_ m: StatMeasures) -> Rate {
        rate(m.scrambleSuccessesBunker, m.scrambleAttemptsBunker)
    }

    /// Missed greens that took more than one shot to reach the green.
    ///
    /// The denominator is ALL eligible missed-green holes, not the answered
    /// steppers: an uncounted hole is modeled as one shot (proposal §3.4c), so
    /// this is a share of OPPORTUNITIES. Restricting it to answered holes would
    /// make the number climb the more diligently the golfer skipped the easy
    /// ones.
    static func multiChipRate(_ m: StatMeasures) -> Rate {
        rate(
            m.holesMultiChip,
            m.scrambleAttemptsStandard + m.scrambleAttemptsHard + m.scrambleAttemptsBunker)
    }

    static func multiChipFromBunkerRate(_ m: StatMeasures) -> Rate {
        rate(m.holesMultiChipBunker, m.scrambleAttemptsBunker)
    }

    /// An absolute COUNT, not a rate: effective short-game strokes above one per
    /// attempt, across the window. Zero when nothing was counted, which is why
    /// the caller gates it on `shortGameStrokesRecorded` and never on the value.
    static func extraShortGameStrokes(_ m: StatMeasures) -> Double {
        m.shortGameStrokesEffective
            - (m.scrambleAttemptsStandard + m.scrambleAttemptsHard + m.scrambleAttemptsBunker)
    }

    /// Chip proximity — the LEADING indicator behind `scrambleRate`: how often
    /// the short-game shot left a makeable putt.
    ///
    /// The denominator is `scrambleFirstPutt*` (attempts whose first-putt bucket
    /// was recorded), never `scrambleAttempts*`. A holed chip records no bucket,
    /// so it is outside this ratio entirely — counting it as a miss would charge
    /// the best outcome as a failure, and putting it in the denominator alone
    /// would be exactly the numerator/denominator mismatch invariant 2 forbids.
    static func chipInside2mRate(_ m: StatMeasures) -> ByDifficulty<Rate> {
        ByDifficulty(
            standard: rate(m.scrambleInside2mStandard, m.scrambleFirstPuttStandard),
            hard: rate(m.scrambleInside2mHard, m.scrambleFirstPuttHard),
            bunker: rate(m.scrambleInside2mBunker, m.scrambleFirstPuttBunker),
            overall: rate(
                m.scrambleInside2mStandard + m.scrambleInside2mHard + m.scrambleInside2mBunker,
                m.scrambleFirstPuttStandard + m.scrambleFirstPuttHard
                    + m.scrambleFirstPuttBunker))
    }

    // MARK: Dispersion (wave 4)

    /// Where the approach finished when the green was missed. The four shares
    /// PARTITION the recorded misses, so they sum to 1 by construction.
    struct GreenMissDispersion: Equatable, Sendable {
        var long: Rate
        var short: Rate
        var left: Rate
        var right: Rate
    }

    static func greenMissDispersion(_ m: StatMeasures) -> GreenMissDispersion {
        GreenMissDispersion(
            long: rate(m.greenMissLong, m.greenMissRecorded),
            short: rate(m.greenMissShort, m.greenMissRecorded),
            left: rate(m.greenMissLeft, m.greenMissRecorded),
            right: rate(m.greenMissRight, m.greenMissRecorded))
    }

    /// Which side the tee shot finished on, and how often that side was
    /// trouble rather than merely off the fairway. The two `trouble*` rates are
    /// CONDITIONAL — their denominator is that side's misses, not all of them —
    /// which is what makes "one side is more expensive than the other" readable.
    struct TeeMissDispersion: Equatable, Sendable {
        var left: Rate
        var right: Rate
        var troubleLeft: Rate
        var troubleRight: Rate
    }

    static func teeMissDispersion(_ m: StatMeasures) -> TeeMissDispersion {
        TeeMissDispersion(
            left: rate(m.teeMissLeft, m.teeMissRecorded),
            right: rate(m.teeMissRight, m.teeMissRecorded),
            troubleLeft: rate(m.teeTroubleLeft, m.teeMissLeft),
            troubleRight: rate(m.teeTroubleRight, m.teeMissRight))
    }

    /// Which shot the penalty strokes were labelled against. Over the LABELLED
    /// holes only — an unlabelled penalty hole is not a fourth category.
    struct PenaltySourceSplit: Equatable, Sendable {
        var tee: Rate
        var approach: Rate
        var short: Rate
    }

    static func penaltySourceSplit(_ m: StatMeasures) -> PenaltySourceSplit {
        PenaltySourceSplit(
            tee: rate(m.penaltiesTee, m.penaltySourceRecorded),
            approach: rate(m.penaltiesApproach, m.penaltySourceRecorded),
            short: rate(m.penaltiesShort, m.penaltySourceRecorded))
    }

    // MARK: Scoring (always available — needs only the scorecard)

    /// Average strokes vs par, split by par group. The groups are the server's
    /// (`par <= 3`, `par = 4`, `par >= 5`) and the par subtracted is the group's
    /// nominal 3 / 4 / 5 — the measure set carries strokes and hole counts per
    /// group but not par sums, so a par-6 hole (which the group boundary allows
    /// and no course here has) would read one stroke generous.
    static func avgVsParByParGroup(_ m: StatMeasures) -> ByParGroup<Rate> {
        ByParGroup(
            par3: rate(m.strokesPar3 - 3 * m.holesScoredPar3, m.holesScoredPar3),
            par4: rate(m.strokesPar4 - 4 * m.holesScoredPar4, m.holesScoredPar4),
            par5: rate(m.strokesPar5 - 5 * m.holesScoredPar5, m.holesScoredPar5))
    }

    /// Blow-ups per round — the fastest scoring lever for most amateurs.
    static func doubleBogeyPlusPerRound(_ m: StatMeasures, roundCount: Double) -> Rate {
        rate(m.doubleBogeyPlus, roundCount)
    }

    /// Birdie-or-better on the hole after a double bogey or worse.
    static func bounceBackRate(_ m: StatMeasures) -> Rate {
        rate(m.bounceBackSuccesses, m.bounceBackOpportunities)
    }

    // MARK: Expected putts

    /// Expected putts from each first-putt bucket, v1 — amateur-calibrated, and
    /// FROZEN. History must not shift under a player because a constant was
    /// retuned: tune by adding an `expectedPuttsV2` and moving callers
    /// deliberately, never by editing these numbers.
    static let expectedPuttsV1 = ExpectedPuttsTable(
        inside1m: 1.05, oneTo2m: 1.45, twoTo4m: 1.85, fourTo8m: 2.10, over8m: 2.40)

    /// Expected putts remaining after an AVERAGE short-game shot, v1. The
    /// baseline a chip is scored against: leave it closer than this and short
    /// game gained strokes, leave it farther and it lost them. Frozen with the
    /// table above.
    static let chipExpectedPuttsV1: Double = 1.85

    /// What a chip is observed to have left, v1 — and the whole resolution the
    /// measure set has: `scrambleInside2m*` versus the rest of
    /// `scrambleFirstPutt*`. There is no per-bucket scramble first-putt column,
    /// so the short-game term works over these two outcomes rather than the five
    /// putting buckets.
    ///
    /// Derived from `expectedPuttsV1` and frozen with it:
    /// - inside 2m  = mean(1.05, 1.45) = 1.25
    /// - outside 2m = mean(1.85, 2.10, 2.40) = 2.1166… → 2.12, at the table's
    ///   two-decimal precision.
    static let chipOutcomeExpectedPuttsV1 = ChipOutcomeExpectedPutts(
        inside2m: 1.25, outside2m: 2.12)

    /// Expected putts remaining after an average short-game shot, v2 — split by
    /// the difficulty the player recorded.
    ///
    /// v1 used one number, 1.85, for every chip. It is the right AVERAGE and the
    /// wrong baseline for either individual case: a standard chip from a clean
    /// lie is expected to leave less than a hard one from a bad one, so v1
    /// quietly rewarded every hard chip and punished every standard one. A
    /// roughly 60/40 standard/hard mix over 1.70 and 2.10 recovers v1's 1.85
    /// (0.6 × 1.70 + 0.4 × 2.10 = 1.86), so the aggregate barely moves while
    /// each chip is now scored against its own lie.
    ///
    /// The OUTCOME table above is NOT versioned alongside it: where the ball
    /// finished (inside 2 m / outside 2 m) does not depend on the lie it came
    /// from, only the baseline that outcome is scored against does.
    ///
    /// FROZEN, exactly like v1: tune by adding a V3, never by editing these.
    /// The bunker leg is PROVISIONAL and uncalibrated, exactly as the other two
    /// are: a greenside bunker is a known lie with a known technique — harder
    /// than a clean chip, marginally easier than the `hard` catch-all, which
    /// also carries short-sided, downhill and long-grass lies.
    static let chipExpectedPuttsV2 = ChipExpectedPutts(
        standard: 1.70, hard: 2.10, bunker: 1.95)

    /// v1 as a per-difficulty table — every difficulty shares the single 1.85.
    /// Passing it to `strokesLost` reproduces the frozen v1 numbers exactly.
    static let chipExpectedPuttsV1ByDifficulty = ChipExpectedPutts(
        standard: chipExpectedPuttsV1, hard: chipExpectedPuttsV1,
        bunker: chipExpectedPuttsV1)

    // MARK: The strokes-lost waterfall (proposal §2)

    /// The waterfall for ONE round (or, harmlessly, for a summed window — every
    /// term is a linear function of counts, so a sum of rows is the row of the
    /// sum).
    ///
    /// Five terms over ONE attribution cohort — the holes that carry a score, a
    /// green answer, a coherent putt count and, on par 4/5, a tee answer. The
    /// server counts that cohort; this function only weighs it.
    ///
    ///     tee       = Σ over the 6 tee cells of
    ///                   count × (1 + E_AFTER_TEE[par][result] − E_HOLE[par])
    ///     approach  = (attStrokes − attPutts − attPenalties − teeStrokes − sumC)
    ///                 + Σ E[arrival bucket] + Σ chip entry − Σ E_REF
    ///     shortGame = (sumC − nMiss) + Σ E[chip outcome] − Σ chip baseline
    ///     putting   = attPutts − (Σ E[arrival bucket] + Σ E[chip outcome])
    ///     penalties = attPenalties
    ///     total     = attStrokes − Σ E_HOLE[par]
    ///
    /// The five telescope to `total` exactly, by construction — there is no
    /// residual and no leftover row. That is the whole point of v3: the term
    /// nobody measures directly used to be the term that absorbed every gap.
    ///
    /// nil rule, and there is only one: every field is nil iff the cohort is
    /// empty (`coverage.attributed == 0`). All five or none.
    static func strokesLostV3(
        _ m: StatMeasures,
        tables: SgTables = SgTablesV1.tables,
        expected: ExpectedPuttsTable = expectedPuttsV1,
        chipExpected: ChipOutcomeExpectedPutts = chipOutcomeExpectedPuttsV1,
        chipBaseline: ChipExpectedPutts = chipExpectedPuttsV2
    ) -> StrokesLost {
        let cohortPar3 = m.attHolesPar3Gir + m.attHolesPar3Miss
        let cohortPar4 = m.attFairwayPar4 + m.attInPlayPar4 + m.attTroublePar4
        let cohortPar5 = m.attFairwayPar5 + m.attInPlayPar5 + m.attTroublePar5
        let attributed = cohortPar3 + cohortPar4 + cohortPar5
        let coverage = StrokesLostCoverage(
            attributed: attributed, holesScored: m.holesScored)
        guard attributed > 0 else { return StrokesLost(coverage: coverage) }

        func eHole(_ par: Int) -> Double { tables.eHole[par] ?? 0 }
        func eAfterTee(_ par: Int, _ result: TeeResult) -> Double {
            tables.eAfterTee[par]?[result] ?? 0
        }

        /// One modeled tee stroke per par-4/5 hole. Par 3 has no tee cell: its
        /// tee shot IS its approach, and splitting them would invent a term.
        let teeStrokes = cohortPar4 + cohortPar5

        // The six tee cells, par 4 before par 5 and fairway/in play/trouble
        // within each, on both clients — so the floating-point accumulation is
        // identical down to the last bit.
        let teeCells: [(count: Double, par: Int, result: TeeResult)] = [
            (m.attFairwayPar4, 4, .fairway),
            (m.attInPlayPar4, 4, .inPlay),
            (m.attTroublePar4, 4, .trouble),
            (m.attFairwayPar5, 5, .fairway),
            (m.attInPlayPar5, 5, .inPlay),
            (m.attTroublePar5, 5, .trouble),
        ]

        // Every difficulty leg must reach BOTH `sumC` and `sumChipEntry`. For a
        // leg `d`, approach receives `−ΣC_d + n_d·(1 + b_d)` and short game
        // receives `(ΣC_d − n_d) + O_d − n_d·b_d`; collecting the two leaves
        // `O_d`, which putting subtracts in full. So every chip term cancels
        // regardless of the baseline constants and regardless of how many legs
        // there are — the telescope survives the third leg, and would survive a
        // fourth. What does NOT survive is a leg wired into `att_strokes` but
        // not into `sumC`.
        let sumC =
            m.attSgStrokesEffectiveStandard + m.attSgStrokesEffectiveHard
            + m.attSgStrokesEffectiveBunker
        let nMiss = m.attMissStandard + m.attMissHard + m.attMissBunker

        let sumEHole = cohortPar3 * eHole(3) + cohortPar4 * eHole(4) + cohortPar5 * eHole(5)

        var sumEAfterTee: Double = 0
        for cell in teeCells { sumEAfterTee += cell.count * eAfterTee(cell.par, cell.result) }
        /// What the cohort was expected to take from where each hole's second
        /// shot begins: after the tee on par 4/5, from the tee itself on par 3.
        let sumERef = sumEAfterTee + cohortPar3 * eHole(3)

        let sumEGirArrival =
            m.attGirFirstPuttInside1m * expected.inside1m
            + m.attGirFirstPutt1To2m * expected.oneTo2m
            + m.attGirFirstPutt2To4m * expected.twoTo4m
            + m.attGirFirstPutt4To8m * expected.fourTo8m
            + m.attGirFirstPuttOver8m * expected.over8m
        // A green hit and holed leaves nothing to putt: + attGirHoled × 0.

        let sumEChipOutcome =
            (m.attChipInside2mStandard + m.attChipInside2mHard + m.attChipInside2mBunker)
            * chipExpected.inside2m
            + (m.attChipOutside2mStandard + m.attChipOutside2mHard + m.attChipOutside2mBunker)
            * chipExpected.outside2m
        // A holed chip leaves nothing to putt either: + holed × 0.

        let sumEChipBaseline =
            m.attMissStandard * chipBaseline.standard
            + m.attMissHard * chipBaseline.hard
            + m.attMissBunker * chipBaseline.bunker
        /// What a missed green was expected to cost from the moment the approach
        /// ended: one short-game stroke plus the putts it leaves.
        let sumChipEntry =
            m.attMissStandard * (1 + chipBaseline.standard)
            + m.attMissHard * (1 + chipBaseline.hard)
            + m.attMissBunker * (1 + chipBaseline.bunker)

        var tee: Double = 0
        for cell in teeCells {
            tee += cell.count * (1 + eAfterTee(cell.par, cell.result) - eHole(cell.par))
        }

        let approach =
            (m.attStrokes - m.attPutts - m.attPenalties - teeStrokes - sumC)
            + sumEGirArrival + sumChipEntry
            - sumERef

        let shortGame = (sumC - nMiss) + sumEChipOutcome - sumEChipBaseline

        let putting = m.attPutts - (sumEGirArrival + sumEChipOutcome)

        return StrokesLost(
            tee: tee,
            approach: approach,
            shortGame: shortGame,
            putting: putting,
            penalties: m.attPenalties,
            total: m.attStrokes - sumEHole,
            coverage: coverage)
    }

    // MARK: Per-18 normalization

    /// A round under this many attributed holes takes part in no cross-round
    /// comparison — not a baseline delta, not a component insight, not a trend
    /// point. Half a round is the floor at which "per 18" stops being a scaling
    /// and starts being an extrapolation. Inclusive: exactly 9 qualifies.
    static let minAttributedForDelta: Double = 9

    /// One term scaled to 18 attributed holes, so a nine and an eighteen sit on
    /// the same axis. nil below the floor, or when the term itself is nil.
    static func sgPer18(_ sg: StrokesLost, _ component: StrokesLostComponent) -> Double? {
        guard let value = sg[component], sg.coverage.attributed >= minAttributedForDelta
        else { return nil }
        return value * 18 / sg.coverage.attributed
    }

    /// `sgPer18` for the total. Same floor, same scaling.
    static func sgTotalPer18(_ sg: StrokesLost) -> Double? {
        guard let value = sg.total, sg.coverage.attributed >= minAttributedForDelta
        else { return nil }
        return value * 18 / sg.coverage.attributed
    }

    // MARK: Results over a window of rounds

    /// The window's scoring headline.
    ///
    /// Operates on ROWS, not on a summed `StatMeasures`: completeness, length
    /// class and the best card are per-round facts that a sum destroys —
    /// eighteen nines add up to nine eighteens, and the lowest round in a window
    /// is not a column anybody can add.
    ///
    /// No round is ever excluded. A nine, a part round and a round with three
    /// picked-up balls all contribute the holes they DID score to
    /// `avgVsParPer18`; the only narrowing anywhere is `best`, which considers
    /// rounds complete for their own length, because an incomplete card is not
    /// comparable as "a round".
    static func resultsSummary(_ rows: [ResultsRow]) -> ResultsSummary {
        var scoredRounds = 0
        var holesScored: Double = 0
        var vsParTotal: Double = 0
        var counts: [ScoreType: Double] = [:]
        for type in ScoreType.allCases { counts[type] = 0 }

        // Grouped by length in FIRST-SEEN order, then sorted longest first, so
        // the sort is the only thing deciding order and a dictionary's
        // enumeration never leaks into the output.
        var lengthOrder: [Double] = []
        var groups: [Double: ResultsLengthClass] = [:]

        for row in rows {
            let m = row.measures
            holesScored += m.holesScored
            if m.holesScored > 0 {
                scoredRounds += 1
                vsParTotal += m.strokesTotal - m.parTotal
            }
            counts[.eagleOrBetter]! += m.holesEagleOrBetter
            counts[.birdie]! += m.holesBirdie
            counts[.par]! += m.holesPar
            counts[.bogey]! += m.holesBogey
            counts[.doubleBogeyPlus]! += m.doubleBogeyPlus

            if groups[row.holeCount] == nil {
                lengthOrder.append(row.holeCount)
                groups[row.holeCount] = ResultsLengthClass(
                    holeCount: row.holeCount, rounds: 0, completeRounds: 0, best: nil)
            }
            groups[row.holeCount]!.rounds += 1
            // Complete FOR ITS OWN LENGTH. A complete row is necessarily scored.
            if row.holeCount > 0, m.holesScored == row.holeCount {
                groups[row.holeCount]!.completeRounds += 1
                let vsPar = m.strokesTotal - m.parTotal
                // Strictly better wins, so on a tie the FIRST row in input order
                // keeps the tile. Callers pass rows newest-first, which makes a
                // tie report the more recent round — and both clients have to
                // break it the same way or the `strokes` annotation diverges
                // while `vsPar` agrees.
                if groups[row.holeCount]!.best == nil || vsPar < groups[row.holeCount]!.best!.vsPar {
                    groups[row.holeCount]!.best = ResultsBest(
                        vsPar: vsPar, strokes: m.strokesTotal)
                }
            }
        }

        let lengths = lengthOrder.sorted(by: >).map { groups[$0]! }
        var holesExpected: Double = 0
        for length in lengths { holesExpected += Double(length.rounds) * length.holeCount }

        return ResultsSummary(
            rounds: rows.count,
            scoredRounds: scoredRounds,
            holesScored: holesScored,
            holesExpected: holesExpected,
            lengths: lengths,
            avgVsParPer18: rate(vsParTotal * 18, holesScored),
            scoreTypeCounts: counts)
    }

    // MARK: Personal baseline

    /// Mean over the entries that exist. nil when none do — never 0.
    static func meanOfPresent(_ values: [Double?]) -> Double? {
        var sum: Double = 0
        var n: Double = 0
        for value in values {
            guard let value else { continue }
            sum += value
            n += 1
        }
        return n == 0 ? nil : sum / n
    }

    /// A round's waterfall against the mean of a window of earlier ones.
    ///
    /// BOTH SIDES ARE NORMALIZED with `sgPer18` before subtracting: a delta is a
    /// cross-round comparison, and comparing a nine's raw terms with an
    /// eighteen's would read the round's LENGTH as a change in form. That also
    /// means a round under `minAttributedForDelta` contributes nothing and
    /// receives nothing — every field nil, never zero.
    ///
    /// The mean IGNORES nil window entries rather than treating them as zero — a
    /// window of ten rounds where three recorded no putting is a
    /// three-round-smaller putting sample, not three average-putting rounds.
    ///
    /// WINDOW CONTRACT: `window` is the player's PRIOR rounds, EXCLUDING the
    /// round under evaluation. Nothing in this module filters the round out of
    /// the window; the caller owns that. A self-inclusive window is not a
    /// supported input — it drags the baseline toward the round being measured
    /// and makes `bestPuttingRound` unreachable, since no round is strictly
    /// better than itself.
    static func baselineDeltas(round: StrokesLost, window: [StrokesLost]) -> StrokesLostDeltas {
        StrokesLostDeltas(
            tee: delta(sgPer18(round, .tee), window.map { sgPer18($0, .tee) }),
            approach: delta(sgPer18(round, .approach), window.map { sgPer18($0, .approach) }),
            shortGame: delta(sgPer18(round, .shortGame), window.map { sgPer18($0, .shortGame) }),
            putting: delta(sgPer18(round, .putting), window.map { sgPer18($0, .putting) }),
            penalties: delta(sgPer18(round, .penalties), window.map { sgPer18($0, .penalties) }),
            total: delta(sgTotalPer18(round), window.map { sgTotalPer18($0) }))
    }

    private static func delta(_ value: Double?, _ window: [Double?]) -> Double? {
        guard let value, let mean = meanOfPresent(window) else { return nil }
        return value - mean
    }

    // MARK: Insight lines (proposal §4.1 step 3)

    /// A component must move at least this many strokes to be worth a line.
    static let insightComponentDeltaStrokes: Double = 1
    /// Penalties this far above the personal mean is a spike.
    static let insightPenaltySpikeOverMean: Double = 2
    static let insightScrambleStreakRate: Double = 0.75
    static let insightScrambleStreakMinAttempts: Double = 4
    /// Below three hard misses, "all of them" is a coincidence, not a streak.
    static let insightHardScrambleStreakMinAttempts: Double = 3
    /// A two-way miss is a SHAPE claim, so it needs a sample before it means
    /// anything, and both sides have to carry a real share of the misses.
    static let insightTwoWayMissMinRecorded: Double = 10
    static let insightTwoWayMissMinSide: Double = 0.35
    /// Below this many putts, "no three-putts" is a short round, not a good one.
    static let insightThreePuttFreeMinPutts: Double = 12
    /// "Best in your last N" needs an N worth comparing against.
    static let insightBestPuttingMinWindow = 5
    static let insightBounceBackMinOpportunities: Double = 2

    /// Rank the round's candidate lines and return the top `limit`.
    ///
    /// Ordering, and it is total (no ties survive it):
    ///  1. personal-delta magnitude, descending — a component 3 strokes off your
    ///     normal outranks one 1.2 off, and both outrank every rule that carries
    ///     no delta (magnitude 0);
    ///  2. the fixed rule order below, which each rule occupies at most once.
    ///
    /// Deterministic by construction: same inputs, same list, same order, on
    /// both clients. No randomness, no clock, no free text. (The sort is written
    /// over an explicit tie-break index rather than relying on `sorted` being
    /// stable, which Swift does not promise.)
    ///
    /// WINDOW CONTRACT: `window` is the player's PRIOR rounds, EXCLUDING the
    /// round under evaluation. Nothing in this module filters the round out of
    /// the window; the caller owns that. A self-inclusive window is not a
    /// supported input — it drags the baseline toward the round being measured
    /// and makes `bestPuttingRound` unreachable, since no round is strictly
    /// better than itself.
    static func insightLines(
        measures m: StatMeasures,
        waterfall: StrokesLost,
        window: [StrokesLost],
        limit: Int
    ) -> [InsightLine] {
        let deltas = baselineDeltas(round: waterfall, window: window)
        var candidates: [(line: InsightLine, magnitude: Double, order: Int)] = []
        func push(_ line: InsightLine, _ magnitude: Double) {
            candidates.append((line, magnitude, candidates.count))
        }

        // 1 + 2. The component furthest from the player's own normal, each way.
        var best: (component: StrokesLostComponent, delta: Double)?
        var worst: (component: StrokesLostComponent, delta: Double)?
        for component in StrokesLostComponent.allCases {
            guard let d = deltas[component] else { continue }
            if best == nil || d < best!.delta { best = (component, d) }
            if worst == nil || d > worst!.delta { worst = (component, d) }
        }
        // Disjoint by sign: the same component cannot be both ≤ −1 and ≥ +1.
        if let best, best.delta <= -insightComponentDeltaStrokes {
            push(
                InsightLine(
                    id: .componentBestVsBaseline,
                    params: ["component": .component(best.component), "delta": .number(best.delta)]),
                abs(best.delta))
        }
        if let worst, worst.delta >= insightComponentDeltaStrokes {
            push(
                InsightLine(
                    id: .componentWorstVsBaseline,
                    params: [
                        "component": .component(worst.component), "delta": .number(worst.delta),
                    ]),
                abs(worst.delta))
        }

        // 3. Penalties well above the personal mean. Needs a window to have a mean.
        //
        // BOTH SIDES ARE THE WATERFALL PENALTIES TERM — the cohort figure, not
        // `m.penaltiesTotal`. The round-wide count and a window mean of
        // cohort-only terms are different units, and under partial coverage the
        // round-wide side is systematically the larger of the two, which fired
        // the line on rounds that had no spike at all.
        if let penaltyBaseline = meanOfPresent(window.map { $0.penalties }),
            let roundPenalties = waterfall.penalties,
            roundPenalties >= penaltyBaseline + insightPenaltySpikeOverMean
        {
            push(
                InsightLine(
                    id: .penaltiesSpike,
                    params: [
                        "penalties": .number(roundPenalties),
                        "baseline": .number(penaltyBaseline),
                    ]),
                0)
        }

        // 3b. Missing both ways off the tee. Magnitude 0 — this is a shape
        // observation, not a stroke count, so it ranks below anything with a
        // real delta. The comparison is INTEGER against `share × recorded`,
        // never a float share against 0.35: same style as the scramble streak,
        // and it keeps the boundary exact on both clients.
        if m.teeMissRecorded >= insightTwoWayMissMinRecorded,
            m.teeMissLeft >= insightTwoWayMissMinSide * m.teeMissRecorded,
            m.teeMissRight >= insightTwoWayMissMinSide * m.teeMissRecorded
        {
            push(
                InsightLine(
                    id: .twoWayMiss,
                    params: [
                        "left": .number(m.teeMissLeft),
                        "right": .number(m.teeMissRight),
                        "recorded": .number(m.teeMissRecorded),
                    ]),
                0)
        }

        // 4. Every hard spot saved. No rate threshold: the sentence claims "all
        // of them", so a partial rate would make the copy false. Pushed BEFORE
        // the overall streak below, which it ties with on magnitude — a round
        // with three hard saves should lead with the harder claim, and both
        // lines may fire together.
        if m.scrambleAttemptsHard >= insightHardScrambleStreakMinAttempts,
            m.scrambleSuccessesHard == m.scrambleAttemptsHard
        {
            push(
                InsightLine(
                    id: .hardScrambleStreak,
                    params: [
                        "successes": .number(m.scrambleSuccessesHard),
                        "attempts": .number(m.scrambleAttemptsHard),
                    ]),
                0)
        }

        // 5. A scrambling round, on a sample big enough to mean it.
        let attempts =
            m.scrambleAttemptsStandard + m.scrambleAttemptsHard + m.scrambleAttemptsBunker
        let successes =
            m.scrambleSuccessesStandard + m.scrambleSuccessesHard + m.scrambleSuccessesBunker
        if attempts >= insightScrambleStreakMinAttempts,
            successes >= insightScrambleStreakRate * attempts
        {
            push(
                InsightLine(
                    id: .scrambleStreak,
                    params: ["successes": .number(successes), "attempts": .number(attempts)]),
                0)
        }

        // 6. No three-putts, over enough putts for that to be an achievement.
        if m.threePutts == 0, m.puttsTotal >= insightThreePuttFreeMinPutts {
            push(
                InsightLine(
                    id: .threePuttFree,
                    params: ["putts": .number(m.puttsTotal), "holes": .number(m.puttsRecorded)]),
                0)
        }

        // 7. Best putting round in the window: strictly better than every round
        // in it that has a putting term, over a window worth the claim.
        //
        // Cross-round, so BOTH SIDES read `sgPer18` and inherit the
        // minAttributedForDelta floor (§D.4). Raw terms would have handed the
        // title to whichever round putted the fewest holes.
        let windowPutting = window.compactMap { sgPer18($0, .putting) }
        if let putting = sgPer18(waterfall, .putting),
            windowPutting.count >= insightBestPuttingMinWindow,
            windowPutting.allSatisfy({ putting < $0 })
        {
            push(
                InsightLine(
                    id: .bestPuttingRound,
                    params: [
                        "putting": .number(putting), "rounds": .number(Double(windowPutting.count)),
                    ]),
                0)
        }

        // 8. Every bounce-back chance taken.
        if m.bounceBackOpportunities >= insightBounceBackMinOpportunities,
            m.bounceBackSuccesses == m.bounceBackOpportunities
        {
            push(
                InsightLine(
                    id: .bounceBackPerfect,
                    params: [
                        "opportunities": .number(m.bounceBackOpportunities),
                        "successes": .number(m.bounceBackSuccesses),
                    ]),
                0)
        }

        let ranked = candidates.sorted { a, b in
            a.magnitude == b.magnitude ? a.order < b.order : a.magnitude > b.magnitude
        }
        return ranked.prefix(max(0, limit)).map(\.line)
    }
}
