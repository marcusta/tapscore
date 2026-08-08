import Foundation

/// The dashboard's view model: `(window rows) -> everything the screen draws`.
///
/// One pure function, `StatsDashboardModel.build`, with no store, no network and
/// no SwiftUI in sight. Every number on the screen comes from
/// `StatMeasuresMath`; this file decides only WHAT is asked and WHETHER a panel
/// appears, never how a rate is computed. A view that does arithmetic is a bug —
/// the math module is the single place the display policy and the nil rules
/// live, and duplicating a division into a view is how the two drift.
///
/// The module-gating rule from the proposal (§1) is the reason this is a build
/// step at all: a module with no data must be ABSENT, not zeroed. `nil` panels
/// here mean "you never recorded this", which is a different sentence from "you
/// recorded it and it was 0%".

// MARK: - Identity

/// The dashboard's panels. Not `StatsModule` (the profile's CONFIG toggles):
/// that enum answers "what will we ask you on the course" and includes
/// `penalties` and `recovery`, which surface here as lines inside the tee panel
/// rather than as panels of their own. Scoring has no toggle at all — a
/// scorecard is always there.
/// `Identifiable` so `.sheet(item:)` can carry one — the card info sheets (§D.6)
/// present off the panel id itself rather than a parallel bool per panel.
enum StatsPanelID: String, CaseIterable, Sendable, Identifiable {
    var id: String { rawValue }

    case tee
    case approach
    case putting
    case shortGame
    case scoring

    var title: String {
        switch self {
        case .tee: return "Off the tee"
        case .approach: return "Approach"
        case .putting: return "Putting"
        case .shortGame: return "Short game"
        case .scoring: return "Scoring"
        }
    }
}

// MARK: - Practice priorities

/// One component of the fixed-baseline waterfall, per 18 attributed holes.
///
/// `per18` is nil when NO round in the window produced the component — which
/// now includes every round under `minAttributedForDelta`, since a short round
/// contributes no cross-round figure. That is the "not enough data" row —
/// printed as a sentence, never as a bar at zero, because a zero-length bar in a
/// ranked list reads as "this part of your game is exactly average", which is a
/// claim the data does not make.
struct StatsPriority: Equatable, Sendable, Identifiable {
    var component: StrokesLostComponent
    /// Mean strokes lost per 18 attributed holes. Positive = lost, negative =
    /// gained.
    var per18: Double?
    /// How many rounds in the window contributed a value.
    var roundsCovered: Int
    /// How many rounds are in the window at all.
    var roundsInWindow: Int

    var id: String { component.rawValue }
    var hasData: Bool { per18 != nil }
}

// MARK: - Trends

/// What a sparkline is plotting. Fixes the y-axis semantics, which differ:
/// a percentage goes up when you improve, strokes-lost goes DOWN.
enum StatsTrendKind: String, Equatable, Sendable {
    /// 0...1, higher is better.
    case percentage
    /// Strokes, lower is better.
    case strokesLost
}

/// One module headline plotted across the window, oldest to newest.
struct StatsTrend: Equatable, Sendable, Identifiable {
    var id: String
    var title: String
    var kind: StatsTrendKind
    /// Oldest first — a trend line reads left-to-right in time, the opposite of
    /// every list on this screen.
    var points: [Double]

    /// The proposal's floor: two dots are not a trend, they are a line segment
    /// between two rounds, and drawing it invites reading noise as direction.
    static let minPoints = 3
}

// MARK: - Panels

struct StatsTeePanel: Equatable, Sendable {
    var fairway: Rate
    /// In play but NOT on the fairway — the split bar's middle segment.
    /// `StatMeasuresMath.inPlayRate` is cumulative (a fairway hit is in play),
    /// so it cannot be a segment as-is without double-counting.
    var inPlayOnly: Rate
    var trouble: Rate
    /// Strokes over par per hole conceded from trouble, vs the round's own
    /// scoring from the fairway.
    var troubleTax: Rate
    /// The two samples `troubleTax` is a DIFFERENCE of.
    ///
    /// Carried because `troubleTaxPerHole`'s own denominator is a cross-product
    /// guard (trouble holes × fairway holes), not a sample size — printing it
    /// would tell a player who has 9 trouble holes and 11 fairway holes that the
    /// figure rests on 99 of them. The view prints these two instead, which is
    /// what the math module's doc asks for.
    var vsParByTee: ByTee<Rate>
    var recovery: Rate
    var penaltiesPerRound: Rate
    /// Holes carrying a penalty answer. `penaltiesPerRound` divides by the round
    /// count, so it prints "0.00 per round" for a player who never recorded one
    /// — a zero where the truth is "not recorded". This is the coverage the view
    /// gates that figure on, and the sample it prints beside it.
    var penaltiesRecordedHoles: Double
    /// How often a scored hole carried a penalty, over ALL scored holes — the
    /// same cohort `penaltyTax` splits, where an unanswered penalty question is
    /// a clean hole.
    var penaltyHoleShare: Rate
    /// Extra strokes per hole conceded on the holes that took a penalty.
    var penaltyTax: Rate
    /// The two samples `penaltyTax` is a DIFFERENCE of — see `troubleTax`.
    var vsParByPenalty: PenaltySplit
    /// Which side the drive finished on, and how expensive each side was.
    /// `recorded == 0` means nobody answered the side question, and the fan
    /// block is ABSENT rather than empty.
    var teeMiss: StatMeasuresMath.TeeMissDispersion
    var teeMissRecorded: Double
    /// The fan's five counts, already subtracted here — the chart module does
    /// no arithmetic on measures.
    var fan: TeeFanCounts

    /// `leftInPlay = teeMissLeft − teeTroubleLeft`, and right likewise. All
    /// five share `recorded` (`teeRecorded`) as their denominator, so the
    /// columns are comparable heights rather than three separate scales.
    struct TeeFanCounts: Equatable, Sendable {
        var leftInPlay: Double
        var leftTrouble: Double
        var fairway: Double
        var rightInPlay: Double
        var rightTrouble: Double
        var recorded: Double
    }
}

struct StatsApproachPanel: Equatable, Sendable {
    var gir: Rate
    var girByTee: ByTee<Rate>
    /// Where the first putt was on greens hit — the proximity proxy. Shares of
    /// `girFirstPuttRecorded`, so they sum to 1 across buckets.
    var girFirstPuttMix: [PuttBucket: Rate]
    var birdieConversion: Rate
    /// How often a missed green left a HARD chip. A property of the approach
    /// MISS, which is why it sits here rather than on the short-game card.
    var hardChipShare: Rate
    /// Greens hit split by par — the only place a par-3 approach appears, since
    /// the tee question `girByTee` splits on is never asked there.
    var girByPar: ByParGroup<Rate>
    /// vs-par with the green hit, with it missed, and the difference.
    var costOfMissedGreen: VsParSplit
    /// Where the approach finished when the green was missed. The four shares
    /// partition `greenMissRecorded`; a zero `recorded` means the compass block
    /// is ABSENT, not "Not recorded".
    var greenMiss: StatMeasuresMath.GreenMissDispersion
    var greenMissRecorded: Double
}

struct StatsPuttingPanel: Equatable, Sendable {
    /// One rung of the make-% ladder.
    struct Rung: Equatable, Sendable, Identifiable {
        var bucket: PuttBucket
        var made: Rate
        /// The make % the SELECTED COHORT's expected-putts table implies for
        /// this distance.
        ///
        /// Presentation-only, and a rough inversion: a bucket that expects `E`
        /// putts holes out in one `2 − E` of the time IF every miss leaves a
        /// tap-in. It floors at 0 for the long buckets, where the honest reading
        /// is "the reference expects you to two-putt", not "you should hole none
        /// of these". The tick follows the "Compared to" selector, exactly like
        /// `cost` below — one selector, one table, both numbers.
        var baseline: Double
        /// Strokes this bucket cost against the selected cohort, over the whole
        /// window. POSITIVE = LOST, the waterfall's sign. Nil when the bucket
        /// has no resolved hole — there is nothing to compare.
        ///
        /// A cumulative TOTAL over the window, not a per-round or per-hole rate
        /// — the same unit as a waterfall term before it is divided by rounds.
        /// The info sheet says so.
        var cost: Double?
        var id: String { bucket.rawValue }
    }

    var ladder: [Rung]
    /// Where the first putt was on EVERY hole with one recorded — the
    /// unconditioned twin of the approach card's `girFirstPuttMix`. The
    /// difference between the two distributions is the short-game proximity
    /// story told from the putting side.
    var firstPuttSpread: [PuttBucket: Rate]
    var threePutt: Rate
    var threePuttsFromOver8m: Rate
    var puttsPerGirHole: Rate
    /// The complement of `puttsPerGirHole`: putts per hole on the holes where
    /// the green was missed.
    var puttsAfterMissedGreen: Rate
    /// The four buckets, shares of `puttsRecorded`. They partition it, so the
    /// four shares add to 1.
    var puttDistribution: [PuttCountBucket: Rate]
    /// Average putts per recorded hole, by par.
    var puttsPerHoleByPar: ByParGroup<Rate>
}

struct StatsShortGamePanel: Equatable, Sendable {
    var scramble: ByDifficulty<Rate>
    /// How the attempts split across the three lies (migration 062) — context
    /// next to the scrambling bars, not a skill figure: it says what kind of
    /// trouble the approach left. The three shares partition 1.
    var mix: ByDifficulty<Rate>
    /// What each attempt turned into: chip-in / one putt / two putts / three
    /// or more / more than one chip, every share over that difficulty's
    /// attempts, so a difficulty's five rows sum to 1.
    var outcomes: ByDifficulty<StatMeasuresMath.ChipOutcomes>
    /// The putting half of a failed scramble: chips that finished inside 2 m
    /// and still saved. Beside `chipInside2m` (the chipping half) it says
    /// whether the failures are chips left long or makeable putts missed.
    var savedInside2m: ByDifficulty<Rate>
    /// What a miss of each difficulty costs against par, per scored hole — the
    /// per-difficulty split of the approach card's missed-green cost. Signed,
    /// positive = over par.
    var missCost: ByDifficulty<Rate>
    var chipInside2m: ByDifficulty<Rate>
    /// The conversion half of the chip pair: how often a putt from inside 2m
    /// goes in.
    ///
    /// NOT a scramble × inside-2m × holed cross-tab — no such column exists, and
    /// inventing one is off the table. This is the coherent v2 putting rate over
    /// the two buckets that make up "inside 2m", across ALL holes rather than
    /// only chipped ones. It answers "when you leave it that close, do you hole
    /// it" with the sample the schema actually has.
    var conversionInside2m: Rate
    /// Chips holed outright, split by lie difficulty. A count, not a rate:
    /// there is no attempt denominator that would make a "chip-in %" mean
    /// anything. Split because holing out from a hard lie is the rarer,
    /// louder event, and a single total buries it.
    var chipIns: ByDifficulty<Double>
    /// Up-and-downs from sand. Gated on `scrambleAttemptsBunker`.
    var sandSave: Rate
    var sandSaveAttempts: Double
    /// Effective short-game strokes above one per attempt. A COUNT. The
    /// multi-chip RATES live inside `outcomes` now, per difficulty — the
    /// overall pair the panel used to carry was the coarse version of the
    /// same fact.
    var extraShortGameStrokes: Double
    /// The gate for the counter figure and the outcome groups' multi-chip
    /// rows: with no counted hole the numbers are all modeled-1 and say
    /// nothing.
    var shortGameStrokesRecorded: Double
}

struct StatsScoringPanel: Equatable, Sendable {
    var avgVsParByParGroup: ByParGroup<Rate>
    var doubleBogeyPlusPerRound: Rate
    var bounceBack: Rate
}

// MARK: - Round rows

/// One round in the window's list.
struct StatsRoundRow: Equatable, Sendable, Identifiable {
    var id: String
    var date: String
    var courseName: String?
    var name: String?
    var holeCount: Int
    /// nil for a stats-only round (answers recorded, no scorecard).
    var strokes: Double?
    var vsPar: Double?
    var waterfall: StrokesLost

    // `id` is the round id, and it is what the per-round drill-down (§4.2)
    // travels on: `RoundStatsView(roundId:)` needs nothing else from this row.
}

// MARK: - The model

struct StatsDashboardModel: Equatable, Sendable {
    /// Rounds in the window, newest first.
    var rounds: [StatsRoundRow]
    /// `StatMeasuresMath.sum` over the window — the denominator of every rate
    /// on the screen.
    var totals: StatMeasures
    /// The summed window's own waterfall, for the "over these N rounds" total.
    var waterfall: StrokesLost
    var priorities: [StatsPriority]
    var trends: [StatsTrend]
    /// What the window actually shot. Not a panel — it sits above the practice
    /// priorities as the plain answer to "how am I scoring", and it is nil only
    /// for an empty window.
    var results: ResultsSummary?

    var tee: StatsTeePanel?
    var approach: StatsApproachPanel?
    var putting: StatsPuttingPanel?
    var shortGame: StatsShortGamePanel?
    var scoring: StatsScoringPanel?

    var roundCount: Int { rounds.count }
    var isEmpty: Bool { rounds.isEmpty }

    /// The panels that have data, in reading order — tee to green, then the
    /// scorecard.
    var presentPanels: [StatsPanelID] {
        StatsPanelID.allCases.filter { id in
            switch id {
            case .tee: return tee != nil
            case .approach: return approach != nil
            case .putting: return putting != nil
            case .shortGame: return shortGame != nil
            case .scoring: return scoring != nil
            }
        }
    }

    static let empty = StatsDashboardModel(
        rounds: [], totals: StatMeasuresMath.zero, waterfall: StrokesLost(),
        priorities: [], trends: [])

    /// Reduce a window of rounds to a screen.
    ///
    /// - Parameter rows: the window, in any order. Sorted newest-first here so a
    ///   caller cannot get the round list backwards.
    /// - Parameter baseline: the handicap-cohort bundle every strokes-gained
    ///   figure on the screen is weighed against — the per-round waterfalls, the
    ///   window waterfall, the priorities and the putting trend, all from the one
    ///   value. Defaults to the shipped v1 constants, so a caller that has not
    ///   resolved a cohort gets exactly today's numbers.
    static func build(
        rows: [PlayerRoundStats], baseline: SgBaselineBundle = SgBaselines.hcp12
    ) -> StatsDashboardModel {
        let ordered = StatsWindow.sorted(rows)
        guard !ordered.isEmpty else { return .empty }

        let totals = StatMeasuresMath.sum(ordered.map(\.measures))
        let perRound = ordered.map {
            StatMeasuresMath.strokesLostV3($0.measures, baseline: baseline)
        }
        let windowWaterfall = StatMeasuresMath.strokesLostV3(totals, baseline: baseline)

        return StatsDashboardModel(
            rounds: zip(ordered, perRound).map { row, waterfall in
                StatsRoundRow(
                    id: row.roundId,
                    date: row.date,
                    courseName: row.courseName,
                    name: row.name,
                    holeCount: Int(row.holeCount),
                    strokes: row.measures.holesScored == 0 ? nil : row.measures.strokesTotal,
                    // vs PAR, straight off the scorecard columns — NOT
                    // `waterfall.total`, which is now vs the reference baseline over
                    // the attributed cohort. Vs-par stays the language of the round
                    // list and the Results card (proposal §1).
                    vsPar: row.measures.holesScored == 0
                        ? nil
                        : row.measures.strokesTotal - row.measures.parTotal,
                    waterfall: waterfall)
            },
            totals: totals,
            waterfall: windowWaterfall,
            priorities: priorities(perRound: perRound),
            trends: trends(rows: ordered, baseline: baseline),
            results: StatMeasuresMath.resultsSummary(
                ordered.map { ResultsRow(holeCount: $0.holeCount, measures: $0.measures) }),
            tee: teePanel(totals, roundCount: Double(ordered.count)),
            approach: approachPanel(totals),
            putting: puttingPanel(totals, baseline: baseline),
            shortGame: shortGamePanel(totals),
            scoring: scoringPanel(totals, roundCount: Double(ordered.count)))
    }

    // MARK: Priorities

    /// Worst first: the component costing the most strokes per 18 leads.
    ///
    /// Averaged PER ROUND rather than taken from the summed window so the list
    /// says "putting costs you 1.8 shots per 18", which is a practice
    /// instruction, rather than "putting has cost you 21.6 shots", which is a
    /// number you have to divide before it means anything. The mean is over the
    /// rounds that HAVE the component (`meanOfPresent`), not over the window —
    /// dividing by rounds that never recorded a putt would dilute the estimate
    /// toward zero and flatten the ranking.
    ///
    /// Each round is normalized with `sgPer18` first, so a nine and an eighteen
    /// carry the same weight and a round under the floor carries none.
    static func priorities(perRound: [StrokesLost]) -> [StatsPriority] {
        let rows = StrokesLostComponent.allCases.map { component -> StatsPriority in
            let values = perRound.map { StatMeasuresMath.sgPer18($0, component) }
            return StatsPriority(
                component: component,
                per18: StatMeasuresMath.meanOfPresent(values),
                roundsCovered: values.compactMap { $0 }.count,
                roundsInWindow: perRound.count)
        }
        // Present components rank by cost, descending. Absent ones sink to the
        // bottom in their canonical order — they are not "best", they are
        // unknown, and sorting them among the numbers would imply otherwise.
        // Ties break on DECLARATION order — tee, approach, short game, putting,
        // penalties — the one canonical order both clients rank by. Alphabetical
        // on the raw value would put approach before tee and disagree with the
        // insight lines about which of two equal components is "worst".
        func order(_ component: StrokesLostComponent) -> Int {
            StrokesLostComponent.allCases.firstIndex(of: component) ?? 0
        }
        return rows.sorted { lhs, rhs in
            switch (lhs.per18, rhs.per18) {
            case let (l?, r?):
                return l == r ? order(lhs.component) < order(rhs.component) : l > r
            case (_?, nil): return true
            case (nil, _?): return false
            case (nil, nil): return order(lhs.component) < order(rhs.component)
            }
        }
    }

    // MARK: Trends

    /// The four module headlines, oldest to newest, dropping rounds that have no
    /// value for the measure.
    ///
    /// A gap is a SKIP, not a zero and not an interpolation: the line connects
    /// the rounds where you recorded the thing. A series shorter than
    /// `StatsTrend.minPoints` is omitted entirely rather than drawn short.
    ///
    /// Percentage points also follow the display policy's denominator floor: a
    /// rate the panels would refuse to print as a percentage (fewer than five
    /// recorded, e.g. a one-hole partial round) is not plotted and cannot
    /// become the tile's headline — a 1-of-1 round would otherwise front the
    /// fairway tile as "100%" with the authority of a full round.
    static func trends(
        rows: [PlayerRoundStats], baseline: SgBaselineBundle = SgBaselines.hcp12
    ) -> [StatsTrend] {
        // Oldest first — time runs left to right.
        let chrono = Array(rows.reversed())

        func series(
            _ id: String, _ title: String, _ kind: StatsTrendKind,
            _ value: (StatMeasures) -> Double?
        ) -> StatsTrend? {
            let points = chrono.compactMap { value($0.measures) }
            guard points.count >= StatsTrend.minPoints else { return nil }
            return StatsTrend(id: id, title: title, kind: kind, points: points)
        }

        // Rate → plotted value, nil unless it clears the percentage floor.
        func solid(_ r: Rate) -> Double? {
            StatMeasuresMath.rateDisplay(r) == .percentage ? r.value : nil
        }

        return [
            series("fairway", "Fairways", .percentage) {
                solid(StatMeasuresMath.fairwayRate($0))
            },
            series("gir", "Greens", .percentage) {
                solid(StatMeasuresMath.girRate($0))
            },
            series("putting", "Putting", .strokesLost) {
                StatMeasuresMath.sgPer18(
                    StatMeasuresMath.strokesLostV3($0, baseline: baseline), .putting)
            },
            series("scramble", "Scrambling", .percentage) {
                solid(StatMeasuresMath.scrambleRate($0).overall)
            },
        ].compactMap { $0 }
    }

    // MARK: Panel gating
    //
    // Each `…Panel` returns nil when the module was never recorded in this
    // window. The gate is always the module's own RECORDED counter, never a
    // derived numerator: a player who took ten tee shots and hit no fairways has
    // `teeRecorded == 10, fairwayHits == 0` and deserves a panel that says 0%.

    /// - Parameter roundCount: the window's round count — the honest denominator
    ///   for a "per round" figure. Derived from the row count, not from
    ///   `holesScored / 18`: a nine-hole round is one round the player played,
    ///   and rounding holes into notional eighteens would report a season of
    ///   nines as half as many rounds as it was.
    static func teePanel(_ m: StatMeasures, roundCount: Double) -> StatsTeePanel? {
        guard m.teeRecorded > 0 else { return nil }
        return StatsTeePanel(
            fairway: StatMeasuresMath.fairwayRate(m),
            inPlayOnly: StatMeasuresMath.rate(m.inPlayHits - m.fairwayHits, m.teeRecorded),
            trouble: StatMeasuresMath.troubleRate(m),
            troubleTax: StatMeasuresMath.troubleTaxPerHole(m),
            vsParByTee: StatMeasuresMath.strokesVsParByTee(m),
            recovery: StatMeasuresMath.recoveryRate(m),
            penaltiesPerRound: StatMeasuresMath.penaltiesPerRound(m, roundCount: roundCount),
            penaltiesRecordedHoles: m.penaltiesRecorded,
            penaltyHoleShare: StatMeasuresMath.penaltyHoleShare(m),
            penaltyTax: StatMeasuresMath.penaltyTax(m),
            vsParByPenalty: StatMeasuresMath.vsParByPenalty(m),
            teeMiss: StatMeasuresMath.teeMissDispersion(m),
            teeMissRecorded: m.teeMissRecorded,
            fan: StatsTeePanel.TeeFanCounts(
                leftInPlay: m.teeMissLeft - m.teeTroubleLeft,
                leftTrouble: m.teeTroubleLeft,
                fairway: m.fairwayHits,
                rightInPlay: m.teeMissRight - m.teeTroubleRight,
                rightTrouble: m.teeTroubleRight,
                recorded: m.teeRecorded))
    }

    static func approachPanel(_ m: StatMeasures) -> StatsApproachPanel? {
        guard m.girRecorded > 0 else { return nil }
        var mix: [PuttBucket: Rate] = [:]
        for bucket in PuttBucket.allCases {
            mix[bucket] = StatMeasuresMath.girFirstPuttMix(m, bucket)
        }
        return StatsApproachPanel(
            gir: StatMeasuresMath.girRate(m),
            girByTee: StatMeasuresMath.girRateByTee(m),
            girFirstPuttMix: mix,
            birdieConversion: StatMeasuresMath.birdieConversion(m),
            hardChipShare: StatMeasuresMath.hardChipShare(m),
            girByPar: StatMeasuresMath.girByPar(m),
            costOfMissedGreen: StatMeasuresMath.costOfMissedGreen(m),
            greenMiss: StatMeasuresMath.greenMissDispersion(m),
            greenMissRecorded: m.greenMissRecorded)
    }

    /// - Parameter baseline: the cohort bundle the ladder is weighed against.
    ///   BOTH the make-% tick and the per-bucket cost read `baseline.expected`,
    ///   so switching the "Compared to" selector visibly moves both. Before the
    ///   cohort tiers landed the tick hardcoded `expectedPuttsV1` while the rest
    ///   of the dashboard followed the player's cohort; that is closed here.
    ///
    ///   Deliberately REQUIRED, with no default: a default is how a call site
    ///   that forgot to thread the reader's selected cohort compiles clean and
    ///   silently prices the ladder against somebody else's reference.
    static func puttingPanel(
        _ m: StatMeasures, baseline: SgBaselineBundle
    ) -> StatsPuttingPanel? {
        guard m.puttsRecorded > 0 || m.firstPuttRecorded > 0 else { return nil }
        let expected = baseline.expected
        var spread: [PuttBucket: Rate] = [:]
        for bucket in PuttBucket.allCases {
            spread[bucket] = StatMeasuresMath.firstPuttMix(m, bucket)
        }
        return StatsPuttingPanel(
            ladder: PuttBucket.allCases.map { bucket in
                let resolved = StatMeasuresMath.firstPuttResolved(m, bucket)
                return StatsPuttingPanel.Rung(
                    bucket: bucket,
                    made: StatMeasuresMath.onePuttRate(m, bucket),
                    baseline: max(0, 2 - expected[bucket]),
                    cost: resolved > 0
                        ? StatMeasuresMath.puttsTotalResolved(m, bucket)
                            - resolved * expected[bucket]
                        : nil)
            },
            firstPuttSpread: spread,
            threePutt: StatMeasuresMath.threePuttRate(m),
            threePuttsFromOver8m: StatMeasuresMath.threePuttsFromOver8mRate(m),
            puttsPerGirHole: StatMeasuresMath.puttsPerGirHole(m),
            puttsAfterMissedGreen: StatMeasuresMath.puttsAfterMissedGreen(m),
            puttDistribution: StatMeasuresMath.puttDistribution(m),
            puttsPerHoleByPar: StatMeasuresMath.puttsPerHoleByPar(m))
    }

    static func shortGamePanel(_ m: StatMeasures) -> StatsShortGamePanel? {
        let attempts =
            m.scrambleAttemptsStandard + m.scrambleAttemptsHard + m.scrambleAttemptsBunker
        guard attempts > 0 else { return nil }
        // The two buckets that together mean "inside 2m", v2-resolved on both
        // sides so numerator and denominator cover the same holes.
        let made = m.onePuttInside1m + m.onePutt1To2m
        let faced = m.firstPuttInside1mResolved + m.firstPutt1To2mResolved
        return StatsShortGamePanel(
            scramble: StatMeasuresMath.scrambleRate(m),
            mix: StatMeasuresMath.difficultyMix(m),
            outcomes: StatMeasuresMath.chipOutcomes(m),
            savedInside2m: StatMeasuresMath.savedFromInside2m(m),
            missCost: StatMeasuresMath.missCostVsPar(m),
            chipInside2m: StatMeasuresMath.chipInside2mRate(m),
            conversionInside2m: StatMeasuresMath.rate(made, faced),
            chipIns: ByDifficulty(
                standard: m.scrambleHoledStandard,
                hard: m.scrambleHoledHard,
                bunker: m.scrambleHoledBunker,
                overall: m.scrambleHoledStandard + m.scrambleHoledHard + m.scrambleHoledBunker),
            sandSave: StatMeasuresMath.sandSaveRate(m),
            sandSaveAttempts: m.scrambleAttemptsBunker,
            extraShortGameStrokes: StatMeasuresMath.extraShortGameStrokes(m),
            shortGameStrokesRecorded: m.shortGameStrokesRecorded)
    }

    static func scoringPanel(_ m: StatMeasures, roundCount: Double) -> StatsScoringPanel? {
        guard m.holesScored > 0 else { return nil }
        return StatsScoringPanel(
            avgVsParByParGroup: StatMeasuresMath.avgVsParByParGroup(m),
            doubleBogeyPlusPerRound: StatMeasuresMath.doubleBogeyPlusPerRound(
                m, roundCount: roundCount),
            bounceBack: StatMeasuresMath.bounceBackRate(m))
    }
}
