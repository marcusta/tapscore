import Foundation

/// One round's stats, reduced: `(summary row, hole rows, history) -> a screen`.
///
/// Pure — no store, no network, no SwiftUI. The same division of labour as
/// `StatsDashboardModel`, and for the same reason: the display policy and the
/// nil rules live in `StatMeasuresMath`, and a view that does arithmetic is a
/// second implementation of them.
///
/// Two contracts this file exists to keep:
///
/// - **Unrecorded is absent, never defaulted.** A hole with no putt answer has
///   `putts == nil`, which is a different fact from `putts == 0`, and the cell
///   draws nothing rather than a zero.
/// - **The baseline window is PRIOR rounds only.** `StatMeasuresMath`'s window
///   contract says the caller filters; `priorRounds(of:in:limit:)` is that
///   filter, and it excludes the round under evaluation by construction rather
///   than by remembering to.

// MARK: - Hole strip

/// One cell of the hole strip, and the source of that hole's expanded stat line.
///
/// Every stat dimension is optional and stays optional. `strokes` is the SCORED
/// stroke count: a picked-up hole (the app writes strokes `0`) carries
/// `isPickedUp` and no number, exactly as `ScoreCircle` renders it elsewhere.
struct RoundStatsHoleCell: Equatable, Sendable, Identifiable {
    var id: String
    /// Position in the round's canonical order — NOT shotgun-rotated, matching
    /// how every scorecard in the app renders.
    var ordinal: Int
    var holeNumber: Int
    var par: Int
    var lengthM: Int?
    /// nil when the hole was not scored, or was picked up.
    var strokes: Int?
    var isPickedUp: Bool
    /// nil whenever `strokes` is.
    var vsPar: Int?
    /// The app's own score-vs-par decoration, classified LOCALLY by
    /// `ScoreMarkerForm.forScore`.
    ///
    /// Not the same call the scorecard makes: the card and the leaderboard
    /// resolve marker TEMPLATES the server sends, through `MarkerVisual.resolve`.
    /// The two agree because both sides read the shared `MARKER_TOKENS` table
    /// (`src/round/marker-tokens.ts`), which is what fixes "two under par" to one
    /// form everywhere — not because this strip goes through the card's path.
    var marker: ScoreMarkerForm?

    var tee: TeeResult?
    var gir: Bool?
    var putts: Int?
    var firstPutt: FirstPutt?
    var shortGame: ShortGameDifficulty?
    var penalties: Int?
    var recoveryOk: Bool?

    /// A penalty flag is drawn for a RECORDED penalty above zero. A recorded
    /// zero is a hole the player answered "none" on, which the flag must not
    /// claim, and an unrecorded one is not a claim at all.
    var hasPenalty: Bool { (penalties ?? 0) > 0 }

    /// True when any dimension was recorded. A cell with none still renders —
    /// it has a score and a par — it just carries no glyphs.
    var hasAnyStat: Bool {
        tee != nil || gir != nil || putts != nil || firstPutt != nil || shortGame != nil
            || penalties != nil || recoveryOk != nil
    }

    /// Derive one cell from the server's per-hole row.
    static func from(_ row: PlayerRoundHoleStats) -> RoundStatsHoleCell {
        let par = Self.int(row.par) ?? 0
        let raw = Self.int(row.score)
        // Strokes `0` is the app's PICK-UP, never the digit zero — see
        // `ScoreCircle.State`.
        let isPickedUp = raw == 0
        let strokes = isPickedUp ? nil : raw
        let stats = row.stats
        return RoundStatsHoleCell(
            id: row.playHoleId,
            ordinal: Self.int(row.ordinal) ?? 0,
            holeNumber: Self.int(row.courseHoleNumber) ?? 0,
            par: par,
            lengthM: Self.int(row.lengthM),
            strokes: strokes,
            isPickedUp: isPickedUp,
            vsPar: strokes.map { $0 - par },
            marker: ScoreMarkerForm.forScore(strokes: strokes, par: par),
            tee: stats.teeResult,
            gir: stats.gir,
            putts: Self.int(stats.putts),
            firstPutt: stats.firstPutt,
            shortGame: stats.shortGameDifficulty,
            penalties: Self.int(stats.penalties),
            recoveryOk: stats.recoveryOk)
    }

    private static func int(_ value: Double?) -> Int? {
        value.map { Int($0.rounded()) }
    }
}

// MARK: - The model

struct RoundStatsModel: Equatable, Sendable {
    /// How many prior rounds the personal baseline is taken over, when that
    /// many exist. Matches the dashboard's default window, which is what the
    /// story card's "vs your last 10" is quoting.
    static let defaultWindow = 10

    var roundId: String
    var date: String
    var courseName: String?
    var name: String?
    var holeCount: Int
    /// nil for a stats-only round (answers recorded, no scorecard).
    var strokes: Double?
    var vsPar: Double?

    /// Ordinal order, as the server sent it and as scorecards render it.
    var cells: [RoundStatsHoleCell]

    /// This one round put through the dashboard's own reduction, so the §3
    /// panels are the same components over the same gating — at n-of-18 sample
    /// sizes the rates simply degrade to fractions.
    var panels: StatsDashboardModel

    /// This round against the player's own prior rounds. nil when there are no
    /// prior rounds — the first round with stats has a fixed-baseline waterfall
    /// and no personal comparison, which is a true statement rather than a
    /// zeroed one.
    var deltas: StrokesLostDeltas?
    /// How many prior rounds the deltas are over. 0 when `deltas` is nil.
    var windowCount: Int
    /// At most `insightLimit` lines, already ranked. The module chose them; the
    /// UI words them (`RoundStoryCopy`).
    var insights: [InsightLine]

    /// The fixed-baseline waterfall for this round.
    var waterfall: StrokesLost { panels.waterfall }

    /// The round's own name when it has one, else the course — the same
    /// name-over-course fallback the round list and round header apply.
    var title: String {
        let named = (name ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if !named.isEmpty { return named }
        let course = (courseName ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        return course.isEmpty ? "Round" : course
    }

    var hasHoleStrip: Bool { !cells.isEmpty }

    static func build(
        round: PlayerRoundStats,
        holes: [PlayerRoundHoleStats],
        history: [PlayerRoundStats],
        windowSize: Int = RoundStatsModel.defaultWindow,
        insightLimit: Int = 3
    ) -> RoundStatsModel {
        let panels = StatsDashboardModel.build(rows: [round])
        let waterfall = panels.waterfall
        let window = priorRounds(of: round, in: history, limit: windowSize)
        let windowLosts = window.map { StatMeasuresMath.strokesLost($0.measures) }
        let row = panels.rounds.first
        return RoundStatsModel(
            roundId: round.roundId,
            date: round.date,
            courseName: round.courseName,
            name: round.name,
            holeCount: Int(round.holeCount),
            strokes: row?.strokes,
            vsPar: row?.vsPar,
            cells: holes.sorted { $0.ordinal < $1.ordinal }.map(RoundStatsHoleCell.from),
            panels: panels,
            deltas: windowLosts.isEmpty
                ? nil
                : StatMeasuresMath.baselineDeltas(round: waterfall, window: windowLosts),
            windowCount: windowLosts.count,
            insights: StatMeasuresMath.insightLines(
                measures: round.measures, waterfall: waterfall, window: windowLosts,
                limit: insightLimit))
    }

    /// The `limit` rounds immediately BEFORE this one, newest first.
    ///
    /// Built by sorting the round in with its history and taking what follows
    /// it, so the round under evaluation cannot end up in its own baseline even
    /// if the caller hands over a history that contains it. That is
    /// `StatMeasuresMath`'s window contract, kept in one place.
    static func priorRounds(
        of round: PlayerRoundStats, in history: [PlayerRoundStats], limit: Int
    ) -> [PlayerRoundStats] {
        var rows = history.filter { $0.roundId != round.roundId }
        rows.append(round)
        let sorted = StatsWindow.sorted(rows)
        guard let index = sorted.firstIndex(where: { $0.roundId == round.roundId }) else {
            return []
        }
        return Array(sorted.dropFirst(index + 1).prefix(max(0, limit)))
    }
}

// MARK: - Story eligibility

/// Whether the round-end story (§4.1) may appear, and why not when it may not.
///
/// SELF ONLY. The story speaks in the second person about the reader's own
/// round, so a phone that scored for three friends and recorded nothing of its
/// own gets nothing — a scorer's device showing someone else's putting deltas
/// would be both a privacy leak and a lie about whose round it was.
///
/// The reasons are ordered from the outside in: no session, then no stats
/// configured, then none recorded, then a round still in play.
struct RoundStoryEligibility: Equatable, Sendable {
    enum Reason: String, Equatable, Sendable {
        case eligible
        /// The round flow works logged out; the story does not, because
        /// `myRoundStats` is session-scoped.
        case notSignedIn
        /// Signed in, but this player tracks no modules in this round — the
        /// scorer-for-others case.
        case noStatsConfigured
        /// Configured, but nothing was actually answered.
        case noStatsRecorded
        /// Not every hole on this player's card has a score yet.
        case roundUnfinished
    }

    var reason: Reason
    /// The player the story would be about. Present only when eligible.
    var playerId: String?

    var isEligible: Bool { reason == .eligible }

    static func evaluate(
        signedInPlayerId: String?,
        statConfigPlayerIds: Set<String>,
        statRows: [PlayerHoleStats],
        holesUnscored: Int?
    ) -> RoundStoryEligibility {
        guard let playerId = signedInPlayerId, !playerId.isEmpty else {
            return RoundStoryEligibility(reason: .notSignedIn)
        }
        guard statConfigPlayerIds.contains(playerId) else {
            return RoundStoryEligibility(reason: .noStatsConfigured)
        }
        let recorded = statRows.contains { $0.playerId == playerId && $0.hasAnyAnswer }
        guard recorded else {
            return RoundStoryEligibility(reason: .noStatsRecorded)
        }
        // nil = this player holds no ball in the round, which is not a finished
        // card either.
        guard holesUnscored == 0 else {
            return RoundStoryEligibility(reason: .roundUnfinished)
        }
        return RoundStoryEligibility(reason: .eligible, playerId: playerId)
    }
}

extension PlayerHoleStats {
    /// True when the row carries at least one recorded answer. An all-nil row is
    /// a projection artefact, not a hole the player told us anything about.
    var hasAnyAnswer: Bool {
        teeResult != nil || gir != nil || firstPutt != nil || putts != nil
            || shortGameDifficulty != nil || penalties != nil || recoveryOk != nil
    }
}
