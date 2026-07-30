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
enum StatsPanelID: String, CaseIterable, Sendable {
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

/// One component of the fixed-baseline waterfall, averaged per round.
///
/// `perRound` is nil when NO round in the window produced the component. That is
/// the "not enough data" row — printed as a sentence, never as a bar at zero,
/// because a zero-length bar in a ranked list reads as "this part of your game
/// is exactly average", which is a claim the data does not make.
struct StatsPriority: Equatable, Sendable, Identifiable {
    var component: StrokesLostComponent
    /// Mean strokes lost per round. Positive = lost, negative = gained.
    var perRound: Double?
    /// How many rounds in the window contributed a value.
    var roundsCovered: Int
    /// How many rounds are in the window at all.
    var roundsInWindow: Int

    var id: String { component.rawValue }
    var hasData: Bool { perRound != nil }
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
    var recovery: Rate
    var penaltiesPerRound: Rate
}

struct StatsApproachPanel: Equatable, Sendable {
    var gir: Rate
    var girByTee: ByTee<Rate>
    /// Where the first putt was on greens hit — the proximity proxy. Shares of
    /// `girFirstPuttRecorded`, so they sum to 1 across buckets.
    var girFirstPuttMix: [PuttBucket: Rate]
    var birdieConversion: Rate
}

struct StatsPuttingPanel: Equatable, Sendable {
    /// One rung of the make-% ladder.
    struct Rung: Equatable, Sendable, Identifiable {
        var bucket: PuttBucket
        var made: Rate
        /// The make % the EXPECTED_PUTTS table implies for this distance.
        ///
        /// Presentation-only, and a rough inversion: a bucket that expects `E`
        /// putts holes out in one `2 − E` of the time IF every miss leaves a
        /// tap-in. It floors at 0 for the long buckets (4–8m expects 2.10,
        /// >8m 2.40), where the honest reading is "the table expects you to
        /// two-putt", not "you should hole none of these". The view says so.
        var baseline: Double
        var id: String { bucket.rawValue }
    }

    var ladder: [Rung]
    var threePutt: Rate
    var threePuttsFromOver8m: Rate
    var puttsPerGirHole: Rate
}

struct StatsShortGamePanel: Equatable, Sendable {
    var scramble: ByDifficulty<Rate>
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
    /// Chips holed outright. A count, not a rate: there is no attempt
    /// denominator that would make a "chip-in %" mean anything.
    var chipIns: Double
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

    // Navigation seam: a per-round drill-down (the proposal's §4.4 round view)
    // hangs off this row. It carries `id`, which is all a
    // `PlayerStatsEndpoints.myRoundStats` fetch needs. Deliberately not
    // tappable yet — a row that pushes nothing is worse than a row that looks
    // inert.
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
    static func build(rows: [PlayerRoundStats]) -> StatsDashboardModel {
        let ordered = StatsWindow.sorted(rows)
        guard !ordered.isEmpty else { return .empty }

        let totals = StatMeasuresMath.sum(ordered.map(\.measures))
        let perRound = ordered.map { StatMeasuresMath.strokesLost($0.measures) }
        let windowWaterfall = StatMeasuresMath.strokesLost(totals)

        return StatsDashboardModel(
            rounds: zip(ordered, perRound).map { row, waterfall in
                StatsRoundRow(
                    id: row.roundId,
                    date: row.date,
                    courseName: row.courseName,
                    name: row.name,
                    holeCount: Int(row.holeCount),
                    strokes: row.measures.holesScored == 0 ? nil : row.measures.strokesTotal,
                    vsPar: waterfall.total,
                    waterfall: waterfall)
            },
            totals: totals,
            waterfall: windowWaterfall,
            priorities: priorities(perRound: perRound),
            trends: trends(rows: ordered),
            tee: teePanel(totals, roundCount: Double(ordered.count)),
            approach: approachPanel(totals),
            putting: puttingPanel(totals),
            shortGame: shortGamePanel(totals),
            scoring: scoringPanel(totals, roundCount: Double(ordered.count)))
    }

    // MARK: Priorities

    /// Worst first: the component costing the most strokes per round leads.
    ///
    /// Averaged PER ROUND rather than taken from the summed window so the list
    /// says "putting costs you 1.8 shots a round", which is a practice
    /// instruction, rather than "putting has cost you 21.6 shots", which is a
    /// number you have to divide before it means anything. The mean is over the
    /// rounds that HAVE the component (`meanOfPresent`), not over the window —
    /// dividing by rounds that never recorded a putt would dilute the estimate
    /// toward zero and flatten the ranking.
    static func priorities(perRound: [StrokesLost]) -> [StatsPriority] {
        let rows = StrokesLostComponent.allCases.map { component -> StatsPriority in
            let values = perRound.map { $0[component] }
            return StatsPriority(
                component: component,
                perRound: StatMeasuresMath.meanOfPresent(values),
                roundsCovered: values.compactMap { $0 }.count,
                roundsInWindow: perRound.count)
        }
        // Present components rank by cost, descending. Absent ones sink to the
        // bottom in their canonical order — they are not "best", they are
        // unknown, and sorting them among the numbers would imply otherwise.
        return rows.sorted { lhs, rhs in
            switch (lhs.perRound, rhs.perRound) {
            case let (l?, r?): return l == r ? lhs.component.rawValue < rhs.component.rawValue : l > r
            case (_?, nil): return true
            case (nil, _?): return false
            case (nil, nil): return lhs.component.rawValue < rhs.component.rawValue
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
    static func trends(rows: [PlayerRoundStats]) -> [StatsTrend] {
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

        return [
            series("fairway", "Fairways", .percentage) {
                StatMeasuresMath.fairwayRate($0).value
            },
            series("gir", "Greens", .percentage) {
                StatMeasuresMath.girRate($0).value
            },
            series("putting", "Putting", .strokesLost) {
                StatMeasuresMath.strokesLost($0).putting
            },
            series("scramble", "Scrambling", .percentage) {
                StatMeasuresMath.scrambleRate($0).overall.value
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
            recovery: StatMeasuresMath.recoveryRate(m),
            penaltiesPerRound: StatMeasuresMath.penaltiesPerRound(m, roundCount: roundCount))
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
            birdieConversion: StatMeasuresMath.birdieConversion(m))
    }

    static func puttingPanel(_ m: StatMeasures) -> StatsPuttingPanel? {
        guard m.puttsRecorded > 0 || m.firstPuttRecorded > 0 else { return nil }
        let expected = StatMeasuresMath.expectedPuttsV1
        return StatsPuttingPanel(
            ladder: PuttBucket.allCases.map { bucket in
                StatsPuttingPanel.Rung(
                    bucket: bucket,
                    made: StatMeasuresMath.onePuttRate(m, bucket),
                    baseline: max(0, 2 - expected[bucket]))
            },
            threePutt: StatMeasuresMath.threePuttRate(m),
            threePuttsFromOver8m: StatMeasuresMath.threePuttsFromOver8mRate(m),
            puttsPerGirHole: StatMeasuresMath.puttsPerGirHole(m))
    }

    static func shortGamePanel(_ m: StatMeasures) -> StatsShortGamePanel? {
        let attempts = m.scrambleAttemptsStandard + m.scrambleAttemptsHard
        guard attempts > 0 else { return nil }
        // The two buckets that together mean "inside 2m", v2-resolved on both
        // sides so numerator and denominator cover the same holes.
        let made = m.onePuttInside1m + m.onePutt1To2m
        let faced = m.firstPuttInside1mResolved + m.firstPutt1To2mResolved
        return StatsShortGamePanel(
            scramble: StatMeasuresMath.scrambleRate(m),
            chipInside2m: StatMeasuresMath.chipInside2mRate(m),
            conversionInside2m: StatMeasuresMath.rate(made, faced),
            chipIns: m.scrambleHoledStandard + m.scrambleHoledHard)
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
