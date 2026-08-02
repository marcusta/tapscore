import Foundation
import Observation

/// The stats dashboard's state: fetched pages in, a rendered model out.
///
/// The division of labour is the point. This store owns exactly two mutable
/// facts — the rows it has fetched, and the window the player picked — and every
/// number on the screen is a PURE function of the pair
/// (`StatsDashboardModel.build` over `StatsWindow.apply`). Changing the window
/// never touches the network unless the new window reaches further back than the
/// rows in hand; changing the rows never needs the view to recompute anything.
///
/// That is why `GET /players/me/stats` takes no filters and why it must not grow
/// any: the server's job is to hand over count rows newest-first, and every
/// question the dashboard asks is answered by summing a subset of them here.
@MainActor
@Observable
final class StatsDashboardStore {
    /// Where the first load got to. Same vocabulary as `ProfileStore` /
    /// `AdminStore`: `notAuthorized` is a state, not a message, because every
    /// read here is session-scoped and a dead bearer is not something the user
    /// can retry into working.
    enum Phase: Equatable {
        case loading
        case ready
        case notAuthorized
        case failed(String)
    }

    /// Matches `AdminStore.pageSize`. Fifty count rows is a few kilobytes and
    /// covers the default window in one request; a player with four seasons of
    /// history who asks for "All" pays a handful of round trips, which is the
    /// right trade against a page size that would make the common case slow.
    static let pageSize = 50

    /// A hard stop on transparent paging, so a server that keeps handing back
    /// cursors cannot spin this into an unbounded fetch loop on a phone. At 50 a
    /// page it admits 2000 rounds — beyond any real history, and if a player
    /// ever passes it the window still renders, just over the rounds in hand.
    ///
    /// It is a BUDGET FOR THE STORE'S LIFETIME, not a per-call allowance. A
    /// per-call counter caps one `extendIfNeeded` at 40 pages and then hands the
    /// next window switch a fresh 40: a server whose cursor never ends turns
    /// every tap of the preset picker into another 40 requests, forever. Spent
    /// pages stay spent until `load()` starts over.
    static let maxPages = 40

    private(set) var phase: Phase = .loading

    /// Every row fetched so far, newest first. The superset every window is a
    /// selection from.
    private(set) var loadedRounds: [PlayerRoundStats] = []

    /// The server's total, from the FIRST page. `totals`/`roundsWithStats` are
    /// null on cursored pages by design, so this is captured once and never
    /// overwritten — it is what tells the view "showing 10 of 87".
    private(set) var roundsWithStats: Int?

    /// The chosen window. Written only through `persist(_:)`, never directly —
    /// a `didSet` observer is what this wants and is exactly what `@Observable`
    /// cannot host on a tracked stored property, so the discipline is the
    /// setter's instead.
    private(set) var preset: StatsWindowPreset
    private(set) var filter = StatsRoundFilter()

    /// Which reference the strokes-gained rows are measured against. Written only
    /// through `persist(baseline:)`, for the same reason `preset` is — and
    /// deliberately NOT routed through `apply(filter:)`: applying a filter moves
    /// the window to `.custom`, and choosing a baseline is not a statement about
    /// which rounds are in the window.
    private(set) var baselineChoice: SgBaselineChoice

    /// The signed-in player's handicap index, handed in by the view (the store
    /// has no session of its own). nil while signed out or before the profile
    /// resolves, which `auto` reads as the middle tier.
    private(set) var handicapIndex: Double?

    /// True while more history is being pulled in behind an already-drawn
    /// screen — a footer note, never a blank screen.
    private(set) var isExtending = false

    /// A paging failure. Kept out of `phase` for the same reason `AdminStore`
    /// keeps `loadMoreProblem` out of it: the rows already fetched are still
    /// true, and blanking a drawn dashboard because page four timed out throws
    /// away a correct answer to a smaller question.
    private(set) var extendProblem: String?

    /// The server has more history than has been fetched.
    private(set) var hasMore = false

    private let api: TapScoreAPI
    private let defaults: UserDefaults
    private let now: @Sendable () -> Date
    private let calendar: Calendar

    /// Ids already held, so an overlapping page cannot double-count a round into
    /// the sums. A duplicated row is not a cosmetic list bug here — it would
    /// inflate every denominator on the screen.
    private var heldRoundIDs: Set<String> = []

    /// The keyset cursor for the next page, from the last page the server sent.
    private var cursor: String?

    /// Pages spent against `maxPages` since the last full `load()`. Counts the
    /// first page too — it is one request against the same phone.
    private(set) var pagesFetched = 0

    init(
        api: TapScoreAPI,
        defaults: UserDefaults = .standard,
        calendar: Calendar = .current,
        handicapIndex: Double? = nil,
        now: @escaping @Sendable () -> Date = Date.init
    ) {
        self.api = api
        self.defaults = defaults
        self.calendar = calendar
        self.now = now
        self.preset = StatsWindowPreference.load(defaults: defaults)
        self.baselineChoice = SgBaselinePreference.load(defaults: defaults)
        self.handicapIndex = handicapIndex
    }

    // MARK: - Derived state

    /// The rows the current window covers, newest first.
    var windowRounds: [PlayerRoundStats] {
        StatsWindow.apply(
            preset: preset, filter: filter, to: loadedRounds, now: now(), calendar: calendar)
    }

    /// Everything the screen draws. Recomputed on read — the window is at most a
    /// few hundred rows of integer columns, and a cached model is a cache to
    /// invalidate on every one of the four things that can change it.
    var model: StatsDashboardModel {
        StatsDashboardModel.build(rows: windowRounds, baseline: baseline.bundle)
    }

    /// The baseline in force — the choice, the handicap it was resolved with, and
    /// therefore the cohort. The screen, the ⓘ sheet and the round screen all
    /// read this rather than resolving a cohort of their own.
    var baseline: SgBaselineContext {
        SgBaselineContext(choice: baselineChoice, handicapIndex: handicapIndex)
    }

    /// The filter sheet's course list, built from fetched rows only.
    var courseOptions: [StatsCourseOption] {
        StatsWindow.courses(in: loadedRounds)
    }

    /// Rounds fetched but outside the window — what a "showing N of M" line
    /// counts against. Distinct from `roundsWithStats`, which counts rows on the
    /// server including ones never fetched.
    var loadedCount: Int { loadedRounds.count }

    /// True when the window is empty but history is not — a filter that matched
    /// nothing, which needs different copy from a player with no stats at all.
    var windowIsOverFiltered: Bool { !loadedRounds.isEmpty && windowRounds.isEmpty }

    // MARK: - Load

    /// First load: one page, then as many more as the current window needs.
    func load() async {
        phase = .loading
        extendProblem = nil
        heldRoundIDs = []
        loadedRounds = []
        roundsWithStats = nil
        hasMore = false
        // The one place the budget is refilled: a deliberate reload is the
        // player asking for the walk again.
        pagesFetched = 0
        do {
            let page = try await fetch(cursor: nil)
            // Only the first page carries the aggregate — later ones answer null
            // by design, so this is read once and never clobbered.
            roundsWithStats = page.roundsWithStats.map { Int($0) }
            adopt(page)
            phase = .ready
        } catch {
            phase = Self.phase(for: error)
            return
        }
        await extendIfNeeded()
    }

    private static func phase(for error: any Error) -> Phase {
        switch error as? APIError {
        case .unauthorized:
            return .notAuthorized
        case let .server(code, _) where code == 403:
            return .notAuthorized
        default:
            return .failed(APIErrorCopy.short(error))
        }
    }

    private func fetch(cursor: String?) async throws -> PlayerStatsSummary {
        pagesFetched += 1
        return try await api.send(
            PlayerStatsEndpoints.myStats,
            PlayerStatsMyStatsInput(limit: Double(Self.pageSize), cursor: cursor))
    }

    /// Append a page.
    ///
    /// The dedupe is on APPEND only; `hasMore` reads the server's cursor, not
    /// the appended count. A page that overlapped entirely still means the
    /// server has more to give, and deriving "more" from what survived the
    /// dedupe would end paging on exactly the page that repeated.
    private func adopt(_ page: PlayerStatsSummary) {
        for row in page.rounds where heldRoundIDs.insert(row.roundId).inserted {
            loadedRounds.append(row)
        }
        loadedRounds = StatsWindow.sorted(loadedRounds)
        hasMore = page.nextCursor != nil
        cursor = page.nextCursor
    }

    /// Pull pages until the current window is provably complete, the history is
    /// exhausted, or the page cap trips.
    ///
    /// "Provably complete" is `StatsWindow.needsMoreHistory`'s job and it is a
    /// stricter test than "I have enough rows": a `This year` window is only done
    /// once a row from LAST year has arrived, because until then the next page
    /// could still be January's.
    ///
    /// A failure mid-extend leaves the rows already fetched on screen and files
    /// the message under `extendProblem`. The window then renders over a short
    /// sample, which is why the view says so rather than quietly showing a
    /// "last 20" built from twelve.
    func extendIfNeeded() async {
        guard phase == .ready, !isExtending else { return }
        guard needsMore else { return }
        isExtending = true
        extendProblem = nil
        defer { isExtending = false }

        while needsMore, pagesFetched < Self.maxPages {
            do {
                adopt(try await fetch(cursor: cursor))
            } catch {
                let next = Self.phase(for: error)
                // A dead session mid-scroll is still a refusal of the whole
                // screen; anything else keeps the rows and says so underneath.
                if next == .notAuthorized {
                    phase = next
                } else {
                    extendProblem = APIErrorCopy.short(error)
                }
                return
            }
        }
    }

    private var needsMore: Bool {
        StatsWindow.needsMoreHistory(
            preset: preset, filter: filter, loaded: loadedRounds, hasMore: hasMore,
            now: now(), calendar: calendar)
    }

    // MARK: - Window selection

    /// Pick a preset. Persists immediately (via `preset`'s observer) and pulls
    /// more history if the new window reaches past what is in hand.
    ///
    /// Choosing `.custom` does NOT clear the filter — the sheet owns that value,
    /// and a picker that reset it every time it was re-selected would discard
    /// the criteria the player just set.
    func select(_ next: StatsWindowPreset) async {
        guard next != preset else { return }
        persist(next)
        await extendIfNeeded()
    }

    /// Apply the filter sheet's result. Always switches to `.custom`: a filter
    /// under a preset that says "Last 10" would be a lie in the picker.
    func apply(filter next: StatsRoundFilter) async {
        filter = next
        persist(.custom)
        await extendIfNeeded()
    }

    /// Drop the custom filter and fall back to the default window.
    func clearFilter() async {
        filter = StatsRoundFilter()
        persist(StatsWindowPreference.fallback)
        await extendIfNeeded()
    }

    /// The only writer of `preset`. Selection and persistence move together so
    /// no path can change the window on screen without changing the one the app
    /// reopens on.
    private func persist(_ next: StatsWindowPreset) {
        preset = next
        StatsWindowPreference.save(next, defaults: defaults)
    }

    // MARK: - Baseline selection

    /// Pick the reference the rows are measured against.
    ///
    /// Nothing is fetched and the WINDOW does not move: every figure is a pure
    /// function of the rows in hand and the bundle, so this is a recompute, not a
    /// reload. It must never touch `preset` — a baseline that silently switched
    /// the window to `.custom` would drop the reader's "Last 10" for a filter
    /// they never set.
    func selectBaseline(_ next: SgBaselineChoice) {
        guard next != baselineChoice else { return }
        persist(baseline: next)
    }

    /// The signed-in player's handicap, from the view that has the auth state.
    func setHandicapIndex(_ index: Double?) {
        handicapIndex = index
    }

    /// The only writer of `baselineChoice` — selection and persistence move
    /// together, exactly as they do for the window.
    private func persist(baseline next: SgBaselineChoice) {
        baselineChoice = next
        SgBaselinePreference.save(next, defaults: defaults)
    }

    /// Toggle one round in or out of the custom window's checklist.
    ///
    /// Exclusions are stored rather than inclusions so the list stays correct as
    /// new rounds arrive: a player who struck out one bad round should not have
    /// tomorrow's round silently absent because it was not on an inclusion list
    /// written today.
    func setRound(_ roundID: String, included: Bool) async {
        var next = filter
        if included {
            next.excludedRoundIDs.remove(roundID)
        } else {
            next.excludedRoundIDs.insert(roundID)
        }
        await apply(filter: next)
    }

    /// Re-pull from scratch. The window survives; the rows do not.
    func refresh() async {
        await load()
    }
}
