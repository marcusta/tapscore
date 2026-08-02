import Foundation
import Observation

/// One round's stats: two reads in, a `RoundStatsModel` out.
///
/// The reads are deliberately asymmetric:
///
/// - `GET /players/me/rounds/:roundId/stats` is the round itself — per-hole
///   rows, in canonical ordinal order. **404 is a normal answer**: it means the
///   caller recorded nothing in that round, and every surface built on this
///   store hides itself rather than showing an error the reader cannot act on.
/// - `GET /players/me/stats` is walked, page by page, only until this round's
///   summary row is in hand AND enough rounds strictly older than it have
///   arrived to form the baseline window. That is a handful of rows in the
///   common case (the round is the newest one, and page one covers the window),
///   and it is capped so a server that keeps handing back cursors cannot spin
///   this into an unbounded fetch on a phone.
///
/// Same phase vocabulary as `StatsDashboardStore`, plus `notFound` — the case
/// that exists because a round with no stats of your own is not a failure.
@MainActor
@Observable
final class RoundStatsStore {
    enum Phase: Equatable {
        case loading
        case ready
        /// This session recorded no stats in this round.
        case notFound
        case notAuthorized
        case failed(String)
    }

    /// Matches `StatsDashboardStore.pageSize` — the same rows off the same
    /// endpoint, so there is no reason for a second size.
    static let pageSize = 50

    /// A hard stop on the walk back through history. Eight pages of fifty is
    /// four hundred rounds; a round older than that renders without its
    /// personal baseline rather than costing an unbounded number of round
    /// trips.
    static let maxPages = 8

    private(set) var phase: Phase = .loading
    private(set) var model: RoundStatsModel?

    let roundId: String
    private let api: TapScoreAPI
    private let windowSize: Int
    private let preloadedHistory: [PlayerRoundStats]

    /// The reference this round is weighed against. The round screen has no
    /// control of its own — it follows the choice made on the dashboard, resolved
    /// by the caller through `SgBaselinePreference.context(auth:)`, so the two
    /// screens cannot disagree about which table a waterfall used.
    private let baseline: SgBaselineContext

    /// - Parameter preloadedHistory: summary rows the CALLER already fetched off
    ///   the same endpoint — the dashboard has a window's worth in memory when it
    ///   pushes this screen. They seed the walk, which then makes no request at
    ///   all in the ordinary case: the round tapped is in the list that was
    ///   tapped, and the rounds under it are its baseline. Rows are treated
    ///   exactly like fetched ones (deduped, re-sorted); a stale or partial
    ///   preload just fails `isSatisfied` and the walk proceeds.
    init(
        roundId: String, api: TapScoreAPI, windowSize: Int = RoundStatsModel.defaultWindow,
        preloadedHistory: [PlayerRoundStats] = [],
        baseline: SgBaselineContext = .fallback
    ) {
        self.roundId = roundId
        self.api = api
        self.windowSize = windowSize
        self.preloadedHistory = preloadedHistory
        self.baseline = baseline
    }

    func load() async {
        phase = .loading
        let holes: [PlayerRoundHoleStats]
        do {
            holes = try await api.send(
                PlayerStatsEndpoints.myRoundStats, LeaderboardsForRoundInput(roundId: roundId))
        } catch {
            phase = Self.phase(for: error)
            return
        }

        let history: [PlayerRoundStats]
        do {
            history = try await walkHistory()
        } catch {
            phase = Self.phase(for: error)
            return
        }

        guard let round = history.first(where: { $0.roundId == roundId }) else {
            // The hole read succeeded, so the round HAS stats — but its summary
            // row is further back than the page cap allows. Nothing to draw the
            // panels or the waterfall from, and inventing a row from the hole
            // rows would be a second implementation of the server's projection.
            phase = .notFound
            return
        }
        model = RoundStatsModel.build(
            round: round, holes: holes, history: history, windowSize: windowSize,
            baseline: baseline.bundle)
        phase = .ready
    }

    /// Page `myStats` until the round's own row is held together with
    /// `windowSize` rounds strictly older than it, the history runs out, or the
    /// page cap trips.
    private func walkHistory() async throws -> [PlayerRoundStats] {
        var rows: [PlayerRoundStats] = []
        var seen: Set<String> = []
        var cursor: String?
        var pages = 0

        for row in preloadedHistory where seen.insert(row.roundId).inserted {
            rows.append(row)
        }
        // The whole point of taking a preload: a round pushed from a list that
        // already holds it and its predecessors needs no page at all.
        if Self.isSatisfied(rows: rows, roundId: roundId, windowSize: windowSize) { return rows }

        while pages < Self.maxPages {
            pages += 1
            let page = try await api.send(
                PlayerStatsEndpoints.myStats,
                PlayerStatsMyStatsInput(limit: Double(Self.pageSize), cursor: cursor))
            // Dedupe on append: an overlapping page must not put the same round
            // in the baseline twice, which would pull the mean toward it.
            for row in page.rounds where seen.insert(row.roundId).inserted {
                rows.append(row)
            }
            cursor = page.nextCursor
            if cursor == nil { break }
            if Self.isSatisfied(rows: rows, roundId: roundId, windowSize: windowSize) { break }
        }
        return rows
    }

    /// True once the target round is held and enough OLDER rounds are behind it.
    ///
    /// The test is on the sorted position, not on the raw count: rows newer than
    /// the round do nothing for its baseline, so a walk that stopped on "I have
    /// ten rows" would leave the newest round in a history with no window at
    /// all.
    static func isSatisfied(rows: [PlayerRoundStats], roundId: String, windowSize: Int) -> Bool {
        let sorted = StatsWindow.sorted(rows)
        guard let index = sorted.firstIndex(where: { $0.roundId == roundId }) else { return false }
        return sorted.count - (index + 1) >= windowSize
    }

    /// A dead session is a state, not a message — the same mapping
    /// `StatsDashboardStore` makes. 404 is neither: it is the answer "you have
    /// no stats in this round", and the caller hides the surface.
    private static func phase(for error: any Error) -> Phase {
        switch error as? APIError {
        case .unauthorized:
            return .notAuthorized
        case let .server(code, _) where code == 403:
            return .notAuthorized
        case let .server(code, _) where code == 404:
            return .notFound
        default:
            return .failed(APIErrorCopy.short(error))
        }
    }
}
