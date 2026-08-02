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
///  3. **nil propagates, it never defaults.** A missing component of the
///     strokes-lost waterfall makes the residual nil too, rather than silently
///     charging its strokes to the long game.
///  4. **The residual is gated on coverage.** `longGame` is a residual, so every
///     hole with no putt count donates its putting to it. It is therefore nil
///     unless at least `puttingCoverageFloor` (0.8) of the scored holes carry
///     one — three recorded holes out of eighteen would otherwise be reported as
///     a long-game number that is mostly fifteen holes of unseen putting.

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

/// The short-game difficulty split, plus the two halves added together.
struct ByDifficulty<T: Equatable & Sendable>: Equatable, Sendable {
    var standard: T
    var hard: T
    var overall: T
}

/// The scoring split by par group.
struct ByParGroup<T: Equatable & Sendable>: Equatable, Sendable {
    var par3: T
    var par4: T
    var par5: T
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
}

// MARK: - The strokes-lost waterfall

/// The four attributable buckets, in the order a waterfall draws them.
enum StrokesLostComponent: String, CaseIterable, Sendable {
    case putting
    case shortGame
    case penalties
    case longGame
}

/// One round's score vs par, split into attributable buckets. Positive =
/// strokes LOST; negative = gained.
///
/// nil means "not computable from what was recorded", and it propagates: a round
/// with no putting data has a nil putting term AND a nil long game, because the
/// residual would otherwise absorb every putt the player never told us about.
/// `penalties` is a plain count, so it is never nil — an unrecorded penalty
/// reads as zero penalties, the same way it does everywhere else in the app.
///
/// `coverage` is not a term of the waterfall: it is the sample the residual was
/// judged against (invariant 4), carried so a UI can say WHY `longGame` is nil
/// without recomputing it.
struct StrokesLost: Equatable, Sendable {
    /// How much of the round has a putt count. `puttsRecorded` is the coarse
    /// per-hole count — every hole with a putt answer, bucketed or not — which
    /// is exactly the coverage question the residual cares about.
    struct Coverage: Equatable, Sendable {
        var holesScored: Double
        var puttsRecorded: Double

        init(holesScored: Double = 0, puttsRecorded: Double = 0) {
            self.holesScored = holesScored
            self.puttsRecorded = puttsRecorded
        }
    }

    var putting: Double?
    var shortGame: Double?
    var penalties: Double
    var longGame: Double?
    var total: Double?
    var coverage: Coverage

    init(
        putting: Double? = nil,
        shortGame: Double? = nil,
        penalties: Double = 0,
        longGame: Double? = nil,
        total: Double? = nil,
        coverage: Coverage = Coverage()
    ) {
        self.putting = putting
        self.shortGame = shortGame
        self.penalties = penalties
        self.longGame = longGame
        self.total = total
        self.coverage = coverage
    }

    subscript(component: StrokesLostComponent) -> Double? {
        switch component {
        case .putting: return putting
        case .shortGame: return shortGame
        case .penalties: return penalties
        case .longGame: return longGame
        }
    }
}

/// A round's waterfall against the player's own recent form. Positive = worse
/// than usual (more strokes lost), negative = better.
///
/// nil where the comparison cannot be made: either this round has no value for
/// the component, or no round in the window does.
struct StrokesLostDeltas: Equatable, Sendable {
    var putting: Double?
    var shortGame: Double?
    var penalties: Double?
    var longGame: Double?
    var total: Double?

    subscript(component: StrokesLostComponent) -> Double? {
        switch component {
        case .putting: return putting
        case .shortGame: return shortGame
        case .penalties: return penalties
        case .longGame: return longGame
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
        girRecorded: 0,
        girHits: 0,
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
        penaltiesRecorded: 0,
        penaltiesTotal: 0,
        recoveryAttempts: 0,
        recoverySuccesses: 0,
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
        puttsTotalOver8mResolved: 0
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
            girRecorded: a.girRecorded + b.girRecorded,
            girHits: a.girHits + b.girHits,
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
            penaltiesRecorded: a.penaltiesRecorded + b.penaltiesRecorded,
            penaltiesTotal: a.penaltiesTotal + b.penaltiesTotal,
            recoveryAttempts: a.recoveryAttempts + b.recoveryAttempts,
            recoverySuccesses: a.recoverySuccesses + b.recoverySuccesses,
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
            puttsTotalOver8mResolved: a.puttsTotalOver8mResolved + b.puttsTotalOver8mResolved
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
        rate(m.scrambleAttemptsHard, m.scrambleAttemptsStandard + m.scrambleAttemptsHard)
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
            overall: rate(
                m.scrambleSuccessesStandard + m.scrambleSuccessesHard,
                m.scrambleAttemptsStandard + m.scrambleAttemptsHard))
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
            overall: rate(
                m.scrambleInside2mStandard + m.scrambleInside2mHard,
                m.scrambleFirstPuttStandard + m.scrambleFirstPuttHard))
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
    static let chipExpectedPuttsV2 = ChipExpectedPutts(standard: 1.70, hard: 2.10)

    /// v1 as a per-difficulty table — both difficulties share the single 1.85.
    /// Passing it to `strokesLost` reproduces the frozen v1 numbers exactly.
    static let chipExpectedPuttsV1ByDifficulty = ChipExpectedPutts(
        standard: chipExpectedPuttsV1, hard: chipExpectedPuttsV1)

    // MARK: The strokes-lost waterfall (proposal §2)

    /// The share of scored holes that must carry a putt count before the long
    /// game is reported at all (invariant 4). Below it, `longGame` is nil.
    ///
    /// Not a statistical threshold — an honesty one. `putting` only claims the
    /// holes whose bucket resolved, so every unrecorded hole's putting falls
    /// into the residual by construction. Three recorded holes out of eighteen
    /// would produce a "long game" that is mostly fifteen holes of invisible
    /// putting, blaming the driver for the putter. 0.8 admits the ordinary case
    /// (a few holes skipped in a hurry) and refuses the partial-entry one.
    static let puttingCoverageFloor: Double = 0.8

    /// The waterfall for ONE round (or, harmlessly, for a summed window — the
    /// terms are all additive).
    ///
    ///     putting   = Σ puttsTotal{bucket}Resolved
    ///                 − Σ firstPutt{bucket}Resolved × E[bucket]
    ///     shortGame = Σ over {standard, hard} of
    ///                   chip outcomes × (E[outcome] − chipBaseline[difficulty])
    ///                 + holed chips  × (1 − (1 + chipBaseline[difficulty]))
    ///     penalties = penaltiesTotal      (one penalty ≈ one stroke, directly)
    ///     longGame  = total − putting − shortGame − penalties
    ///     total     = strokesTotal − parTotal
    ///
    /// The holed-chip term is the same subtraction as the other two outcomes,
    /// just with the chip itself inside it. An average short-game shot costs 1
    /// stroke and leaves its difficulty's baseline in putts behind it — 2.70
    /// strokes to get down from a standard lie, 3.10 from a hard one. A chip-in
    /// costs 1 and leaves nothing, so it gains 1.70 or 2.10 strokes.
    /// Without the term a hole-out is invisible to the short game (there is no
    /// first putt to bucket) and its whole gain lands in the long-game residual,
    /// which reads as "great approach play" for a shot that MISSED the green.
    ///
    /// nil rules, all of them deliberate:
    /// - `putting` is nil when NO bucket resolved. Resolved-only is what keeps
    ///   the two halves of the subtraction over the same holes (invariant 2): a
    ///   hole with a bucket and no putt count is in neither half.
    /// - `shortGame` is nil when there is no scramble signal at all — neither a
    ///   chip with a bucketed first putt nor a holed chip.
    /// - `total` is nil when `holesScored == 0` — a stats-only round (answers
    ///   recorded, no scorecard) exists, and `0 − 0 = 0` would report it as a
    ///   level-par round that never happened.
    /// - `longGame` is the residual, so it is nil unless everything it subtracts
    ///   is non-nil AND putting coverage clears `puttingCoverageFloor`. It is
    ///   the only term nobody measures directly; letting it default would
    ///   quietly blame the driver for missing putting data.
    static func strokesLost(
        _ m: StatMeasures,
        expected: ExpectedPuttsTable = expectedPuttsV1,
        chipExpected: ChipOutcomeExpectedPutts = chipOutcomeExpectedPuttsV1,
        chipBaseline: ChipExpectedPutts = chipExpectedPuttsV2
    ) -> StrokesLost {
        var resolvedHoles: Double = 0
        var puttsTaken: Double = 0
        var puttsExpected: Double = 0
        for bucket in PuttBucket.allCases {
            let holes = firstPuttResolved(m, bucket)
            resolvedHoles += holes
            puttsTaken += puttsTotalResolved(m, bucket)
            puttsExpected += holes * expected[bucket]
        }
        let putting: Double? = resolvedHoles == 0 ? nil : puttsTaken - puttsExpected

        // One difficulty's contribution, scored against ITS OWN baseline. The
        // clamp is per difficulty for the same reason it used to be per window:
        // `scrambleInside2m*` is a subset of `scrambleFirstPutt*` by
        // construction, so this cannot go negative on coherent data — but a
        // mixed window (a v2 numerator summed over pre-044 rows) could, and a
        // negative count here would credit the short game for chips that were
        // never hit.
        func term(_ inside2m: Double, _ measured: Double, _ holed: Double, _ baseline: Double)
            -> Double
        {
            let outside2m = max(0, measured - inside2m)
            return inside2m * (chipExpected.inside2m - baseline)
                + outside2m * (chipExpected.outside2m - baseline)
                // 1 stroke taken where an average chip + its putts expects
                // 1 + baseline. Negative, i.e. a gain.
                + holed * (1 - (1 + baseline))
        }

        let chipsMeasured = m.scrambleFirstPuttStandard + m.scrambleFirstPuttHard
        let chipsHoled = m.scrambleHoledStandard + m.scrambleHoledHard
        // Standard before hard, on both clients, so the floating-point
        // accumulation is identical down to the last bit.
        let shortGame: Double? =
            chipsMeasured == 0 && chipsHoled == 0
            ? nil
            : term(
                m.scrambleInside2mStandard, m.scrambleFirstPuttStandard, m.scrambleHoledStandard,
                chipBaseline.standard)
                + term(
                    m.scrambleInside2mHard, m.scrambleFirstPuttHard, m.scrambleHoledHard,
                    chipBaseline.hard)

        let penalties = m.penaltiesTotal
        let total: Double? = m.holesScored == 0 ? nil : m.strokesTotal - m.parTotal

        // The residual absorbs the putting of every hole `putting` could not
        // claim, so it is only honest when most of the round carries a putt
        // count.
        let coverage = StrokesLost.Coverage(
            holesScored: m.holesScored, puttsRecorded: m.puttsRecorded)
        let puttingCovered = m.puttsRecorded >= puttingCoverageFloor * m.holesScored

        var longGame: Double?
        if let total, let putting, let shortGame, puttingCovered {
            longGame = total - putting - shortGame - penalties
        }

        return StrokesLost(
            putting: putting, shortGame: shortGame, penalties: penalties, longGame: longGame,
            total: total, coverage: coverage)
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
            putting: delta(round.putting, window.map(\.putting)),
            shortGame: delta(round.shortGame, window.map(\.shortGame)),
            penalties: delta(round.penalties, window.map { $0.penalties }),
            longGame: delta(round.longGame, window.map(\.longGame)),
            total: delta(round.total, window.map(\.total)))
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
        if let penaltyBaseline = meanOfPresent(window.map { $0.penalties }),
            m.penaltiesTotal >= penaltyBaseline + insightPenaltySpikeOverMean
        {
            push(
                InsightLine(
                    id: .penaltiesSpike,
                    params: [
                        "penalties": .number(m.penaltiesTotal),
                        "baseline": .number(penaltyBaseline),
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
        let attempts = m.scrambleAttemptsStandard + m.scrambleAttemptsHard
        let successes = m.scrambleSuccessesStandard + m.scrambleSuccessesHard
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
        let windowPutting = window.compactMap(\.putting)
        if let putting = waterfall.putting,
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
