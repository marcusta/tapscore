import Foundation
import Observation

/// The round screen's whole state machine — the native image of
/// `src/round/round.service.ts` plus the live-feed wiring `round.component.ts`
/// keeps in its effect, with score entry's mechanics (`score-entry.component.ts`)
/// on top.
///
/// Everything that decides anything lives here, and the SwiftUI views are thin:
/// the domain answers come from the two ported pure modules
/// (`Domain/AdvancePolicy.swift`, `Domain/ResultLayout.swift`) and this type only
/// executes them. Nothing below re-derives a scoring rule, a layout fact or a
/// format's behaviour.
///
/// Three contracts are load-bearing and are pinned by `TapScoreTests/Round`:
///
///  1. **Seq guards.** `loadSeq` / `resultSeq` — a response that lost its race
///     (a slower earlier request, a switched token) is dropped, never rendered.
///  2. **Persist before attempt.** Every score write goes into
///     `PendingScoreQueue` BEFORE the POST and is acked out of it afterwards, so
///     a dead-zone entry survives a kill. The optimistic cell is patched
///     synchronously, the instant the key is pressed.
///  3. **The advance policy's CALLER CONTRACT** (all six numbered obligations at
///     the top of `Domain/AdvancePolicy.swift`) is executed in `execute(_:)`.
@MainActor
@Observable
final class RoundStore {
    // MARK: - Cell overlay

    /// Per-cell write state, keyed by `"\(ballId)|\(playHoleId)"` — the Swift
    /// image of `CellState` in `round.service.ts`.
    struct CellState: Sendable, Equatable {
        enum Status: Sendable, Equatable { case saving, saved, error }

        /// The optimistic strokes for this cell (overrides the loaded scorecard).
        var strokes: Double?
        /// Optimistic per-hole metadata sent on this event. `.absent` means this
        /// write carried none — fall through to the loaded scorecard.
        var metadata: TriState<[String: JSONValue]>
        var status: Status
        /// Stable across retries so a re-send dedupes server-side. Nil for the
        /// instant between the optimistic patch and the queue handing an id back.
        var clientEventId: String?
        /// Monotonic per-cell write id. A late ack or failure only touches the
        /// cell when the epoch still matches, so a newer edit is never clobbered.
        var epoch: Int
    }

    static func cellKey(_ ballId: String, _ playHoleId: String) -> String {
        "\(ballId)|\(playHoleId)"
    }

    /// A hole jump the advance policy scheduled and that has not fired yet.
    /// Exposed so the timer contract is inspectable without a wall clock.
    struct PendingHoleJump: Sendable, Equatable {
        /// The hole the keypad must STILL be on when the timer fires.
        var fromHoleId: String
        /// Target index in the played order, frozen at decision time and
        /// re-clamped against the live order at fire time.
        var toHoleIndex: Int
    }

    /// What the live layer is doing, for the header chip.
    enum LiveState: Sendable, Equatable { case idle, connecting, live, degraded, finished }

    // MARK: - Dependencies

    let token: String
    private let api: TapScoreAPI
    private let feed: any LiveResultFeeding
    private let queue: PendingScoreQueue
    /// The stats capture queue — a separate file from `queue` because the two
    /// carry different intents on different endpoints, and a stats failure must
    /// never hold a score hostage (or the reverse).
    private let statQueue: PendingStatEventsQueue
    private let cursors: ResultCursorStore
    private let scenePhase: ScenePhaseCoordinator?
    /// This device's recent-rounds list — the SHARED instance off
    /// `AppEnvironment`, never a private one. The shell records the token the
    /// moment it pushes this screen; this store is what fills the row in once
    /// the round has actually resolved. Optional so a test can leave it out.
    private let deviceRounds: DeviceRoundsStore?
    /// Injected so the 700 ms advance pause and the 20 s fallback poll are
    /// deterministic in tests. Production is `Task.sleep(for:)`.
    private let sleeper: SSEClient.Sleeper
    private let now: @Sendable () -> Date

    // MARK: - Loaded round

    private(set) var loading = false
    private(set) var error: String?
    private(set) var friendlyRound: FriendlyRound?
    private(set) var round: Round?
    /// True when this token's round rides the competition wrapper. Read by the
    /// manage sheet to withhold settings that are INERT on such a round — the
    /// friends-feed toggle writes a column both discovery paths ignore for a
    /// competition round, so offering it there would be a switch whose "on"
    /// copy is false. Defaults to false, which is what an unloaded round is.
    private(set) var isCompetitionRound = false
    private(set) var startList: StartListView?
    private(set) var balls: [RoundBall] = []
    private(set) var scorecards: [Scorecard] = []
    private(set) var formats: [FormatDescriptor] = []
    private(set) var cells: [String: CellState] = [:]
    /// The `GET /friendly-rounds/setup` probe, re-run on every `load()`. Nil
    /// means it failed, 401'd, or has not answered yet — all of which the manage
    /// sheet reads as "not editable" (see `RoundManageRows`).
    private(set) var editability: FriendlyRoundsSetupOutput?

    // MARK: - Manage actions

    /// The manage action currently in flight, if any. The sheet disables its
    /// rows on this, so a double tap cannot fire two finishes.
    enum ManageAction: Sendable, Equatable { case finish, delete, leave }

    private(set) var manageAction: ManageAction?
    /// The manage sheet's inline error line. Transient view-model state: cleared
    /// at the start of the next attempt, never persisted.
    private(set) var manageError: String?
    /// The round was deleted server-side by this device — a terminal state the
    /// store cannot come back from. Nothing in production reads it: the sheet
    /// leaves the screen on `deleteRound()`'s return value, not on this. It is
    /// here so the tests (and any future view) can observe that the delete
    /// landed, rather than inferring it from the requests that followed.
    private(set) var deleted = false

    // MARK: - Leaderboard

    private(set) var result: RoundResult?
    private(set) var resultLoading = false
    private(set) var resultError: String?
    private(set) var liveState: LiveState = .idle
    /// In-memory cursor — authoritative for requests; `ResultCursorStore` is its
    /// durable shadow (read for the SSE `since`, never fed into a cold load).
    private(set) var resultCursor: String?

    // MARK: - On-course position

    /// Written through `setTab(_:)` only. A `didSet` observer would be the
    /// obvious way to hang the gate off this, but `@Observable` rewrites stored
    /// properties into computed ones and the observer never fires — a silent
    /// failure that leaves the live feed permanently off.
    private(set) var tab: RoundTab = .score
    private(set) var groupIndex = 0
    private(set) var holeIndex = 0
    private(set) var currentBallIndex = 0
    /// Selection is by the slot's stable `slotDefId`, NEVER a positional index —
    /// `round.formatSlots` and `result.slots` are not guaranteed to line up.
    var selectedSlot: String?

    /// Which attached scorecards are open on the leaderboard, keyed by SUBJECT
    /// (see `ScorecardExpansion`). It lives here, not on `LeaderboardView`,
    /// because the round screen destroys that view when the user tabs away to
    /// score entry — view state would not survive the trip back.
    var expandedScorecards = ScorecardExpansion()

    // MARK: - Keypad

    private(set) var keypadOpen = false
    private(set) var statsOpen = false
    /// True when every scoreable ball on this hole was already scored when the
    /// keypad arrived — correction mode for the whole visit.
    private(set) var holeCompleteOnEntry = false
    private(set) var toast: String?
    private(set) var pendingJump: PendingHoleJump?
    /// Per-hole metadata toggles for the open ball+hole, committed with strokes.
    private(set) var pendingMeta: [String: Bool] = [:]
    private var lastMetaKey: String?

    // MARK: - Player stats capture

    /// Which modules each of the round's registered players tracks, from
    /// `GET /friendly-rounds/stats-configs`. A player absent from this map is
    /// never prompted — absence IS the rule, so guests, unclaimed seats and
    /// players who never enabled stats need no special case anywhere.
    private(set) var statModules: [String: StatModules] = [:]
    /// The projected per-hole rows, for prefilling a revisited hole.
    private(set) var statRows: [PlayerHoleStats] = []
    /// This device's own answers, keyed `"playHoleId|playerId|key"`, with a nil
    /// VALUE meaning an explicit clear. It shadows `statRows` until a load
    /// re-reads them, so a hole answered a second ago prefills correctly even
    /// though the projection has not been refetched.
    private var statLocal: [String: String?] = [:]
    /// For each shadowed key, the load generation at which its write was settled
    /// with the server. A shadow outlives its ack by exactly one load — see
    /// `dropConfirmedStatLocals`.
    private var statConfirmedAt: [String: Int] = [:]
    /// The open step, or nil when the ball under the cursor is not promptable.
    private(set) var statStep: StatStep?
    private var statCell: StatCell?
    private var statFlushing = false

    /// One capture subject: a hole and the single registered player whose ball
    /// it is. Shared-stroke balls have no subject and therefore no step.
    struct StatCell: Sendable, Equatable {
        var playerId: String
        var playHoleId: String
    }

    // MARK: - Machinery

    private var loadSeq = 0
    private var resultSeq = 0
    /// Monotonic ticket taken by EVERY scorecard writer — `load()` and
    /// `refreshScorecard()` alike — at the moment it ISSUES its request, and
    /// compared against `appliedScorecardTicket` when it is about to write.
    ///
    /// A per-caller seq cannot express this. `refreshScorecard` used to guard on
    /// its own seq plus a read of `loadSeq`, which left one window open: a
    /// `load()` already in flight when the refresh started keeps `loadSeq`
    /// unchanged, so if that older load's scorecard response landed AFTER the
    /// refresh's, it overwrote fresher data with staler. One counter shared by
    /// both writers closes it — the later-issued request wins, whoever issued it.
    private var scorecardTicket = 0
    private var appliedScorecardTicket = 0
    /// The `loadResult` call that currently owns `resultLoading`, if any.
    private var loadingResultSeq: Int?
    private var writeEpoch = 0
    private var flushing = false
    private var sceneActive = true
    /// Latched when the stream gives up: while it holds, the gate runs the 20 s
    /// poll instead of retrying the stream on every unrelated state change.
    private var degraded = false
    private var feedRunning = false
    private var feedSuspended = false
    /// Bumped by every gate decision. A close is asynchronous (it awaits the
    /// feed actor), so a later decision can overtake it — the generation is what
    /// lets the stale close notice it was superseded and do nothing.
    private var gateGeneration = 0
    private var feedTask: Task<Void, Never>?
    private var pollTask: Task<Void, Never>?
    private var toastTask: Task<Void, Never>?
    /// Whether the scene hooks are currently installed. `stop()` removes them,
    /// so a screen that disappears and comes back has to put them back — see
    /// `resumeIfNeeded()`.
    private var hooksRegistered = false
    /// The format catalog is fetched at most once per store, off the load
    /// critical path. Latched only on success, so a 401 (or any other miss) is
    /// retried by the next load instead of being cached as "no formats".
    private var formatsLoaded = false
    /// Internal (not private) so the timer contract can be awaited in tests.
    var jumpTask: Task<Void, Never>?

    // MARK: - Init

    init(
        token: String,
        api: TapScoreAPI,
        feed: any LiveResultFeeding,
        queue: PendingScoreQueue,
        statQueue: PendingStatEventsQueue,
        cursors: ResultCursorStore,
        scenePhase: ScenePhaseCoordinator? = nil,
        deviceRounds: DeviceRoundsStore? = nil,
        sleeper: @escaping SSEClient.Sleeper = { try await Task.sleep(for: $0) },
        now: @escaping @Sendable () -> Date = { Date() }
    ) {
        self.token = token
        self.api = api
        self.feed = feed
        self.queue = queue
        self.statQueue = statQueue
        self.cursors = cursors
        self.scenePhase = scenePhase
        self.deviceRounds = deviceRounds
        self.sleeper = sleeper
        self.now = now
    }

    /// Production wiring off the shared environment.
    convenience init(token: String, environment: AppEnvironment) {
        self.init(
            token: token,
            api: environment.api,
            feed: LiveResultFeed(configuration: environment.configuration),
            queue: PendingScoreQueue(),
            statQueue: PendingStatEventsQueue(),
            cursors: ResultCursorStore(),
            scenePhase: environment.scenePhase,
            deviceRounds: environment.deviceRounds
        )
    }

    // MARK: - Lifecycle

    /// Registers the scene hooks and performs the first load. Call once, from
    /// the view's `.task`.
    func start() async {
        registerSceneHooks()
        await load()
    }

    /// Re-arm a store the view is showing again after a `stop()`.
    ///
    /// `.task` fires on every appearance, but it only *creates* a store when
    /// there is none — and `stop()` (from `onDisappear`) has by then pulled the
    /// scene hooks and closed the live gate. Without this, a screen that was
    /// navigated away from and returned to keeps its loaded round but is
    /// permanently deaf: no foreground refetch, no stream, forever.
    ///
    /// Deliberately NOT a reload. The round in memory is still the round, and
    /// re-fetching it on every back-swipe would flash the whole screen; the
    /// gate re-run is what reopens the stream (on either tab, since the
    /// 2026-07-28 widening), and the foreground hook covers staleness from here
    /// on. A caller that does want fresh data has `refresh()`.
    ///
    /// Idempotent: calling it on a store that never stopped does nothing.
    func resumeIfNeeded() {
        guard !hooksRegistered else { return }
        registerSceneHooks()
        updateLiveGate()
    }

    private func registerSceneHooks() {
        guard !hooksRegistered else { return }
        hooksRegistered = true
        scenePhase?.register(
            key: "round:\(token)",
            onForeground: { [weak self] in self?.handleForeground() },
            onBackground: { [weak self] in self?.handleBackground() }
        )
    }

    /// Tears everything down: no orphaned stream, timer or scene hook survives
    /// leaving the screen.
    func stop() async {
        // Leaving the screen is an exit path like any other: the draft only
        // exists in this store, which is about to go away.
        flushStats()
        hooksRegistered = false
        scenePhase?.unregister(key: "round:\(token)")
        cancelJump()
        toastTask?.cancel()
        toastTask = nil
        await closeLive(fully: true)
    }

    // MARK: - Load

    /// `loadByToken` — round, then balls + scorecards, then a queue flush.
    /// Balls/scorecard failures are non-fatal (the round still renders).
    func load() async {
        let seq = loadSeq + 1
        loadSeq = seq
        loading = true
        error = nil
        defer { if seq == loadSeq { loading = false } }

        // The score-entry surface reads each format's declared metadata inputs
        // (umbrella GIR/fairway) from the catalog. It is a static catalog, so
        // it is fetched CONCURRENTLY with the round — never serially ahead of
        // the balls/scorecard fan-out, which is what used to put a whole extra
        // round-trip on the critical path — and at most once per store.
        //
        // Non-fatal by design (`try?`): the catalog 401s for an anonymous
        // viewer on some deployments, and a round that renders without its
        // optional stats toggles beats a round that does not render.
        let wantsFormats = !formatsLoaded
        async let formatsResult: [FormatDescriptor]? =
            wantsFormats ? (try? await api.send(FormatsEndpoints.list)) : nil

        do {
            let data = try await api.send(
                FriendlyRoundsEndpoints.byToken,
                FriendlyRoundsByTokenInput(token: token)
            )
            guard seq == loadSeq else { return }
            friendlyRound = data.friendlyRound
            round = data.round
            startList = data.startList
            isCompetitionRound = data.isCompetitionRound
            // Remember this round on THIS device, now that there is something
            // worth remembering. The shell already recorded the bare token when
            // it pushed the screen; this is the enrichment pass — course name
            // and status — mirroring `recordDeviceRound` in the web
            // `round.service.ts` load path.
            recordDeviceRound()
        } catch {
            guard seq == loadSeq else { return }
            self.error = Self.message(error)
            return
        }

        if let loadedFormats = await formatsResult {
            formats = loadedFormats
            formatsLoaded = true
        }

        async let ballsResult = try? api.send(
            FriendlyRoundsEndpoints.balls, FriendlyRoundsByTokenInput(token: token))
        // The ticket is taken HERE, with the request — `load()` is a scorecard
        // writer like any other and orders against `refreshScorecard` by issue
        // time, not by being the more important caller.
        let cardsTicket = nextScorecardTicket()
        async let cardsResult = try? api.send(
            FriendlyRoundsEndpoints.scorecard, FriendlyRoundsByTokenInput(token: token))
        // The manage sheet's editability probe, in the same non-fatal fan-out:
        // `try?` because a round that renders without an Edit row beats a round
        // that does not render. Re-run on every load rather than once per mount
        // (the web asks once), so a round that becomes uneditable — someone
        // finished it from another phone — stops offering the row on the next
        // refresh instead of at the next launch.
        async let editabilityResult = try? api.send(
            FriendlyRoundsEndpoints.setup, FriendlyRoundsByTokenInput(token: token))
        // Player-stats capture, in the same non-fatal fan-out: which of the
        // round's players track which modules, and what has already been
        // captured. Both `try?` — a deployment without the stats endpoints, or
        // an anonymous 401, must degrade to "no stats prompts", never to a
        // round that will not render.
        async let statConfigsResult = try? api.send(
            PlayerStatsEndpoints.configsByToken, FriendlyRoundsByTokenInput(token: token))
        async let statRowsResult = try? api.send(
            PlayerStatsEndpoints.byToken, FriendlyRoundsByTokenInput(token: token))
        let (loadedBalls, loadedCards, loadedEditability, loadedConfigs, loadedStats) = await (
            ballsResult, cardsResult, editabilityResult, statConfigsResult, statRowsResult
        )
        guard seq == loadSeq else { return }
        editability = loadedEditability
        // Commit whatever the open step has accumulated BEFORE the stats state
        // it was built from is replaced. A foreground refresh lands exactly when
        // the network is flaky, and the in-memory draft is the only copy of
        // those answers until this call puts them on disk.
        flushStats()
        // Keep-previous on failure, never wipe-to-empty. `try?` collapses "the
        // round tracks nothing" and "the fetch failed" into the same value
        // unless the optional is inspected: an empty map would make every
        // player unpromptable, which tears the open step down mid-hole on a
        // degraded refresh.
        if let loadedConfigs {
            statModules = Dictionary(
                loadedConfigs.map { ($0.playerId, $0.modules) },
                uniquingKeysWith: { _, last in last })
        }
        if let loadedStats {
            statRows = loadedStats
            // Server truth has landed for anything already acked before this
            // load was issued, so this device's shadow copy steps aside — the
            // point at which a correction made on another phone becomes visible.
            dropConfirmedStatLocals(loadedAtSeq: seq)
        }
        // Order matters, exactly as on the web: clear the optimistic overlay and
        // seat the scorecards BEFORE the balls that drive rendering.
        cells = [:]
        applyScorecards(loadedCards ?? [], ticket: cardsTicket)
        balls = loadedBalls ?? []
        clampPosition()

        // Replay writes a previous launch never got acked (dead-zone kill).
        // Each reuses its stored clientEventId, so an event that actually landed
        // dedupes server-side instead of double-counting.
        await flushPending()
        // Same kill-recovery pass for captured stats, and then a re-read of the
        // open step's durable half against what just landed. Reseeding does NOT
        // touch an in-progress draft — a foreground refresh under an open stats
        // step must not swallow answers the golfer is mid-way through.
        await flushPendingStats()
        refreshStatStep()
        updateLiveGate()

        // The result is fetched on EVERY tab now, not just the leaderboard:
        // the score rows' standing figure joins the selected format's result
        // entries by ballId, so the score tab needs the payload too. Live
        // score events keep it fresh afterwards (`handle(_:)` → `pollResult`).
        if result == nil { await loadResult() }
    }

    /// The full refetch: round + balls + SCORECARDS (all of `load()`) and then
    /// the result. Used on foreground and on a remote finish.
    ///
    /// The scorecard half is not incidental — it is the score view's data, and
    /// it is why foregrounding freshens BOTH tabs rather than just the board.
    /// The web client mirrors this contract on `visibilitychange`.
    func refresh() async {
        await load()
        await pollResult()
    }

    // MARK: - Result

    /// Cursor-LESS on purpose: an explicit tab-open or refresh always wants the
    /// full result, never an `unchanged: true` short-circuit against a stale
    /// cursor that would leave the board blank.
    func loadResult() async {
        let seq = resultSeq + 1
        resultSeq = seq
        resultLoading = true
        resultError = nil
        // Reset in a `defer`, like `load()` — but guarded on ownership of the
        // FLAG, not on `resultSeq`.
        //
        // The two are not the same guard here, and that is the whole bug.
        // `resultSeq` is shared with `pollResult`, which deliberately never
        // touches `resultLoading`; so a live frame or a fallback tick landing
        // mid-load takes the seq, this call hits its `guard` and returns — and
        // with an inline (or seq-guarded) reset, nothing ever clears the flag
        // again. The leaderboard then shows a spinner forever on the one path
        // where a poll overtakes the first open. Whoever SET the flag clears it,
        // unless a newer `loadResult` has since taken it over.
        loadingResultSeq = seq
        defer {
            if loadingResultSeq == seq {
                loadingResultSeq = nil
                resultLoading = false
            }
        }
        do {
            let output = try await api.send(
                FriendlyRoundsEndpoints.result,
                FriendlyRoundsResultInput(token: token, cursor: nil)
            )
            guard seq == resultSeq else { return }
            apply(output)
        } catch {
            guard seq == resultSeq else { return }
            resultError = Self.message(error)
        }
    }

    /// The cursored refetch: what a live frame and the 20 s fallback both call.
    /// Silent on failure (a transient miss must not surface as a page error) and
    /// deliberately does NOT touch `resultLoading` — a background refetch must
    /// not flash a loading state over an already-rendered board.
    func pollResult() async {
        let seq = resultSeq + 1
        resultSeq = seq
        do {
            let output = try await api.send(
                FriendlyRoundsEndpoints.result,
                FriendlyRoundsResultInput(token: token, cursor: resultCursor)
            )
            guard seq == resultSeq else { return }
            apply(output)
        } catch {
            return
        }
    }

    /// Refetch just the scorecards — the data the SCORE view draws.
    ///
    /// Phase 3.5 only ever refreshed the RESULT on a live event, because the
    /// gate only opened on the leaderboard. Since the 2026-07-28 widening the
    /// stream is up on both tabs, and the score view — which shows the whole
    /// group's scores, one row per ball — needs its own refetch or it stays
    /// exactly as stale as it was on the course.
    ///
    /// Refetched on EVERY live event rather than only while `tab == .score`, on
    /// purpose: switching tabs is instant and triggers no load of its own, so a
    /// tab-gated version would show a stale grid the moment a leaderboard
    /// watcher tabs back — the same "needs a manual refresh" bug in a new place.
    /// The endpoint is one small array and the event already costs a cursored
    /// result fetch, so the second call is cheap.
    ///
    /// It does NOT touch `cells`: the optimistic overlay belongs to this device's
    /// in-flight writes, and clearing it here would blink a pending score away.
    func refreshScorecard() async {
        let ticket = nextScorecardTicket()
        guard
            let cards = try? await api.send(
                FriendlyRoundsEndpoints.scorecard, FriendlyRoundsByTokenInput(token: token))
        else { return }
        applyScorecards(cards, ticket: ticket)
    }

    /// Claim the next scorecard write ticket. Taken when the request goes OUT,
    /// which is what makes the ordering meaningful: request order is the only
    /// thing we know about relative freshness.
    private func nextScorecardTicket() -> Int {
        scorecardTicket += 1
        return scorecardTicket
    }

    /// Seat a scorecard response, unless a later-issued request already wrote.
    private func applyScorecards(_ cards: [Scorecard], ticket: Int) {
        guard ticket > appliedScorecardTicket else { return }
        appliedScorecardTicket = ticket
        scorecards = cards
    }

    private func apply(_ output: FriendlyRoundsResultOutput) {
        switch output {
        case .unchanged(let v):
            setResultCursor(v.cursor)
        case .notUnchanged(let v):
            setResultCursor(v.cursor)
            result = v.result
        }
    }

    /// In-memory stays authoritative for requests; the store is its durable
    /// shadow. A nil cursor (no events yet) leaves the persisted entry alone
    /// rather than erasing a usable one, and an unchanged cursor writes nothing
    /// — the poll must not hit storage on every tick.
    private func setResultCursor(_ cursor: String?) {
        let changed = cursor != nil && cursor != resultCursor
        resultCursor = cursor
        if changed, let cursor { cursors.remember(token: token, cursor: cursor) }
    }

    /// The SSE `since` value: the DURABLE cursor, which survives a kill.
    var persistedCursor: String? { cursors.cursor(for: token) }

    // MARK: - Live gate

    private var gateInput: PollGateInput {
        PollGateInput(sceneActive: sceneActive, status: round?.status)
    }

    /// Switch tabs. Opening the leaderboard loads the board if it is empty —
    /// this is the only writer of `tab`.
    ///
    /// It deliberately does NOT re-run the live gate any more: since the
    /// 2026-07-28 widening the tab is not one of the gate's inputs, so a switch
    /// cannot change its answer. The stream is already open on both tabs.
    func setTab(_ next: RoundTab) {
        guard next != tab else { return }
        tab = next
        if tab == .leaderboard, result == nil { Task { await loadResult() } }
    }

    /// The header's format chips SELECT the presentation context — which
    /// format's handicap (and, on the leaderboard, which board) the screen
    /// shows. They no longer navigate: on the score tab the selection changes
    /// the handicap line and stroke hints in place, and the leaderboard keeps
    /// its own tab. Selecting while the leaderboard is up still loads the
    /// board if it has not been fetched.
    func selectSlot(_ slotDefId: String) {
        guard round?.formatSlots.contains(where: { $0.slotDefId == slotDefId }) == true else { return }
        selectedSlot = slotDefId
        if tab == .leaderboard, result == nil { Task { await loadResult() } }
    }

    /// The single place the stream/poll decision is made — re-run on every load,
    /// scene change and status change, exactly like the web effect. (Tab
    /// switches no longer re-run it; the tab is not an input.)
    func updateLiveGate() {
        gateGeneration += 1
        let generation = gateGeneration
        if shouldPoll(gateInput) {
            openLive()
        } else {
            // A gate closed by BACKGROUNDING suspends (the feed reconnects from
            // its cursor on return); any other close is a real teardown.
            //
            // The generation guard matters: a close is asynchronous, so a
            // decision taken while one is parked in `feed.stop()` can reopen the
            // feed first — a background/foreground bounce, or a load landing on
            // a completed round just before another gate run. Without the guard
            // the stale close tears down the feed that just replaced it, leaving
            // a store that thinks it is streaming and a feed that stopped.
            let fully = sceneActive
            Task {
                guard self.gateGeneration == generation else { return }
                await self.closeLive(fully: fully, generation: generation)
            }
        }
    }

    private func openLive() {
        if degraded {
            startPollTimer()
            return
        }
        if feedSuspended {
            feedSuspended = false
            liveState = .connecting
            Task { await self.feed.resume() }
            return
        }
        guard !feedRunning else { return }
        feedRunning = true
        liveState = .connecting
        let since = persistedCursor
        feedTask = Task { [weak self, feed, token] in
            let stream = await feed.start(token: token, since: since)
            for await update in stream {
                guard let self else { return }
                await self.handle(update)
            }
        }
    }

    /// - Parameter generation: the gate decision this close belongs to, when it
    ///   came from one. `await feed.stop()` / `suspend()` are suspension points,
    ///   and a *newer* gate decision can reopen the feed and set `.connecting`
    ///   while this one is parked in them — at which point writing `.idle` on
    ///   the way out would leave the chip saying nothing over a feed that is
    ///   very much connecting. So the state write is re-checked against the
    ///   generation it was decided under; a superseded close still performs its
    ///   teardown (the feed it was told to stop must still stop) but keeps its
    ///   hands off the label. `nil` means "unconditional" — `stop()` and the
    ///   remote-finish path are not gate decisions and always own the state.
    private func closeLive(fully: Bool, generation: Int? = nil) async {
        stopPollTimer()
        func stillCurrent() -> Bool { generation == nil || generation == gateGeneration }
        if fully {
            degraded = false
            feedSuspended = false
            let task = feedTask
            feedTask = nil
            if feedRunning {
                feedRunning = false
                await feed.stop()
            }
            task?.cancel()
            if stillCurrent(), liveState != .finished { liveState = .idle }
        } else if feedRunning, !feedSuspended {
            feedSuspended = true
            await feed.suspend()
            if stillCurrent() { liveState = .idle }
        }
    }

    /// One live frame. The payload's `latestEventId` is NOT trusted as the
    /// request cursor — the refetch goes through `pollResult`, which keeps its
    /// own seq guard and cursor bookkeeping, so a frame and a fallback poll can
    /// never race into an out-of-order render.
    private func handle(_ update: LiveResultFeed.Update) async {
        switch update {
        case .event(let event):
            liveState = .live
            applyRemoteStatus(event.status)
            // BOTH halves: the leaderboard's cursored result AND the score
            // view's scorecards. A doorbell that only freshened the board is
            // what left the on-course screen stale (see `refreshScorecard`).
            await pollResult()
            await refreshScorecard()
        case .degraded:
            // `feedRunning` stays true: the feed OBJECT is still alive and still
            // owes us a `stop()`. Clearing it here would make `closeLive` skip
            // the teardown and leak the connection past the screen.
            degraded = true
            liveState = .degraded
            if shouldPoll(gateInput) { startPollTimer() }
        case .finished:
            // The round is over on the server. Refetch both halves so the board
            // and the badge agree, then let the (now closed) gate stop us.
            liveState = .finished
            await refresh()
            await closeLive(fully: true)
            liveState = .finished
        }
    }

    /// Mirror a remote status transition onto the loaded round so the gate can
    /// close itself when another device finishes the round.
    private func applyRemoteStatus(_ status: LiveRoundStatus) {
        guard let r = round else { return }
        let mapped: AdminRoundSummaryStatus
        switch status {
        case .notStarted: mapped = .notStarted
        case .active: mapped = .active
        case .complete: mapped = .complete
        }
        guard mapped != r.status else { return }
        // This device's clock, not the server's — the same fabrication the web
        // client makes, and overwritten by the next full load. The fabricated
        // timestamp does not just sit in memory: `applyStatus` records it, which
        // is what lets the landing order "Recently finished" after another
        // device finished this round. Same trade the web client documents.
        applyStatus(
            mapped,
            completedAt: mapped == .complete ? ISO8601DateFormatter().string(from: now()) : nil
        )
    }

    /// Patch the loaded round's lifecycle in place, then run the two things a
    /// status change always owes: the device-history row (so the landing moves
    /// the round between Ongoing and Recently finished) and the live gate (so a
    /// completed round stops streaming and a reopened one starts again).
    ///
    /// One funnel for both the remote transition and this device's own
    /// finish/reopen, so the two cannot drift into doing different bookkeeping
    /// for the same fact.
    private func applyStatus(_ status: AdminRoundSummaryStatus, completedAt: String?) {
        guard var r = round else { return }
        r.status = status
        r.completedAt = completedAt
        round = r
        recordDeviceRound()
        updateLiveGate()
    }

    // MARK: - Manage actions

    /// Finish the round, or reopen it when it is already complete.
    ///
    /// Both directions are organizational only — `complete` seals nothing, the
    /// round stays scorable, and a re-finish preserves the original
    /// `completedAt` server-side. The response is applied in place: there is
    /// nothing to refetch, because status and `completedAt` are the only two
    /// facts that changed.
    func finishOrReopen() async {
        guard let current = round?.status, manageAction == nil else { return }
        manageAction = .finish
        manageError = nil
        defer { manageAction = nil }
        do {
            if current == .complete {
                let output = try await api.send(
                    FriendlyRoundsEndpoints.reopen, FriendlyRoundsByTokenInput(token: token))
                applyStatus(output.status, completedAt: nil)
            } else {
                let output = try await api.send(
                    FriendlyRoundsEndpoints.finish, FriendlyRoundsByTokenInput(token: token))
                applyStatus(output.status, completedAt: output.completedAt)
            }
        } catch {
            // The web swallows this silently; saying so is a deliberate
            // improvement. Nothing local changed, so the row's label still
            // describes what the next tap would do.
            manageError = "Could not update the round. Try again."
        }
    }

    /// Delete the round and everything in it, for everyone.
    ///
    /// Token trust: no owner gate and no status gate, exactly as on the web. On
    /// success this device forgets the round entirely — the recent-rounds row,
    /// the durable SSE cursor, and the live machinery this screen was running.
    ///
    /// - Returns: true when the round is gone and the screen should navigate
    ///   home. A false answer leaves every local fact untouched.
    @discardableResult
    func deleteRound() async -> Bool {
        guard manageAction == nil else { return false }
        manageAction = .delete
        manageError = nil
        defer { manageAction = nil }
        do {
            _ = try await api.send(
                FriendlyRoundsEndpoints.remove,
                FriendlyRoundsByTokenInput(token: token),
                pathValues: ["token": token]
            )
        } catch {
            // A 404 lands here too, and reads the same: the local state is not
            // touched on any failure, so a retry costs one tap.
            manageError = "Could not delete the round. Try again."
            return false
        }
        deviceRounds?.remove(token: token)
        cursors.forget(token: token)
        await stop()
        deleted = true
        return true
    }

    /// Remove the signed-in viewer from the round.
    ///
    /// Needs a bearer (the transport injects it); `playerId` is resolved
    /// server-side, so there is nothing to pass but the token. Refusals arrive
    /// as HTTP-200 diagnostics — last player, shared ball, a partner whose
    /// scores would be orphaned — and those messages are the server's to word.
    func leaveRound() async {
        guard manageAction == nil else { return }
        manageAction = .leave
        manageError = nil
        defer { manageAction = nil }
        do {
            let output = try await api.send(
                FriendlyRoundsEndpoints.leave, FriendlyRoundsByTokenInput(token: token))
            switch output {
            case .ok:
                // A full reload, not a patch: the viewer leaves balls,
                // scorecards, the leaderboard and possibly a playing group all
                // at once, and the server is the only thing that knows the
                // shape that leaves behind.
                await load()
            case .notOk(let refusal):
                manageError = refusal.diagnostics.map(\.message).joined(separator: " · ")
            }
        } catch {
            // Includes a 401: the session died, and the honest thing to say is
            // that it did not work. Re-auth is deliberately not built here.
            manageError = "Could not remove you right now. Try again."
        }
    }

    /// Clear the sheet's inline error. Called from the presenter's `onDismiss`
    /// (`RoundView`), so every way OUT of the sheet — Done, swipe, a delete that
    /// dismissed it — leaves the same clean slate for the next presentation.
    func clearManageError() {
        manageError = nil
    }

    // MARK: - Device history

    /// Upsert this round into the device-recent list from whatever is loaded.
    ///
    /// Called on load, on a remote status flip, when this device finishes or
    /// reopens the round, and when the first accepted score promotes
    /// `not_started → active` — the same moments the web service calls
    /// `recordDeviceRound`.
    ///
    /// `recordOpen` treats nil as "unknown, keep what you had", so this can
    /// only ever enrich the shell's token-only row, never blank it.
    private func recordDeviceRound() {
        guard let deviceRounds, let r = round else { return }
        deviceRounds.recordOpen(
            token: token,
            courseName: r.courseNameSnapshot,
            name: r.name,
            status: Self.deviceStatus(r.status),
            completedAt: r.completedAt,
            date: r.date,
            now: now()
        )
    }

    /// The wire spellings are identical (`not_started`), but the two enums are
    /// separate types on purpose — one is generated from the server contract,
    /// the other is a storage format — so the mapping is written out rather
    /// than round-tripped through `rawValue`.
    private static func deviceStatus(_ status: AdminRoundSummaryStatus) -> DeviceRoundStatus {
        switch status {
        case .notStarted: .notStarted
        case .active: .active
        case .complete: .complete
        }
    }

    /// The degraded fallback: the 20 s poll that stands in for the stream.
    ///
    /// It refetches BOTH halves — the cursored result AND the scorecards —
    /// exactly like a live frame does, because this is the one situation where
    /// nothing else will: the stream has given up, and the case it gives up in
    /// is bad reception on a course, which is precisely when the score view
    /// must not silently stop showing what the group is shooting.
    ///
    /// COST: 2 requests / 20 s per open round screen (~6/min), and only while
    /// degraded. The result answers `{ unchanged: true }` on a quiet round and
    /// the scorecard is one small array, so this is bytes rather than work.
    private func startPollTimer() {
        guard pollTask == nil else { return }
        pollTask = Task { [weak self, sleeper] in
            while !Task.isCancelled {
                do {
                    try await sleeper(.seconds(LiveResultFeed.fallbackPollInterval))
                } catch {
                    return
                }
                if Task.isCancelled { return }
                guard let self else { return }
                await self.pollResult()
                await self.refreshScorecard()
            }
        }
    }

    private func stopPollTimer() {
        pollTask?.cancel()
        pollTask = nil
    }

    // MARK: - Scene phase

    private func handleForeground() {
        sceneActive = true
        Task {
            // Refetch FIRST: the reconnect only guarantees events after the
            // cursor, so anything that happened while suspended reaches the
            // screen through this, not through the stream. `refresh()` covers
            // round status, scorecards AND result — every tab, not just the one
            // the gate would have reopened.
            await self.refresh()
            await self.flushPending()
            self.updateLiveGate()
        }
    }

    private func handleBackground() {
        sceneActive = false
        // Backgrounding is the likeliest moment for the process to be killed,
        // and an open stats draft lives only in memory until it is flushed. The
        // call is idempotent and costs nothing when there is nothing to send.
        flushStats()
        updateLiveGate()
    }

    /// Test/host seam for the scene transitions, so the gate can be exercised
    /// without a SwiftUI scene.
    func setSceneActive(_ active: Bool) {
        if active { handleForeground() } else { handleBackground() }
    }

    // MARK: - Derived round facts

    var groups: [RoundPlayingGroup] { round?.playingGroups ?? [] }

    var group: RoundPlayingGroup? {
        groups.indices.contains(groupIndex) ? groups[groupIndex] : groups.first
    }

    var playedOrder: [RoundGroupPlayedHole] { group?.playedOrder ?? [] }

    var currentPlayedHole: RoundGroupPlayedHole? {
        playedOrder.indices.contains(holeIndex) ? playedOrder[holeIndex] : nil
    }

    func playHole(id: String) -> RoundPlayHole? {
        round?.playHoles.first { $0.id == id }
    }

    var currentPlayHole: RoundPlayHole? {
        currentPlayedHole.flatMap { playHole(id: $0.playHoleId) }
    }

    func par(of playHoleId: String?) -> Int {
        guard let playHoleId, let hole = playHole(id: playHoleId) else { return 4 }
        return countInt(hole.par)
    }

    /// "7", or "7 (1st)" when a physical hole is played more than once.
    func occurrenceLabel(_ playHoleId: String) -> String {
        guard let r = round, let ph = playHole(id: playHoleId) else { return "" }
        let same = r.playHoles
            .filter { $0.courseHoleNumber == ph.courseHoleNumber }
            .sorted { $0.ordinal < $1.ordinal }
        let number = jsNumberString(ph.courseHoleNumber)
        if same.count == 1 { return number }
        guard let idx = same.firstIndex(where: { $0.id == playHoleId }) else { return number }
        let words = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"]
        return "\(number) (\(idx < words.count ? words[idx] : "\(idx + 1)th"))"
    }

    /// The balls of the current playing group, in the group's declared order.
    var ballsInGroup: [RoundBall] {
        guard let group else { return [] }
        let byId = Dictionary(balls.map { ($0.id, $0) }, uniquingKeysWith: { _, last in last })
        return group.ballIds.compactMap { byId[$0] }
    }

    /// The strokes to display: the optimistic overlay wins, else the loaded card.
    func strokes(ballId: String, playHoleId: String) -> Double? {
        if let cell = cells[Self.cellKey(ballId, playHoleId)] { return cell.strokes }
        return scorecards.first { $0.ballId == ballId }?
            .holes.first { $0.playHoleId == playHoleId }?.strokes
    }

    func writeStatus(ballId: String, playHoleId: String) -> CellState.Status? {
        cells[Self.cellKey(ballId, playHoleId)]?.status
    }

    func displayName(of ball: RoundBall) -> String {
        let joined = ball.players.map(\.displayName).joined(separator: " & ")
        if !joined.isEmpty { return joined }
        return ball.label ?? "Ball"
    }

    /// Ball id → display name, with the result's virtual subject labels folded
    /// in (ADR-0004: an aggregated side's subject id names no persisted ball).
    func name(ofBallId id: String) -> String {
        if let ball = balls.first(where: { $0.id == id }) { return displayName(of: ball) }
        for slot in result?.slots ?? [] {
            for label in slot.subjectLabels ?? [] where label.ballId == id { return label.label }
        }
        return id
    }

    /// Phase 5.5 — the ball covers an UNCLAIMED placeholder seat. Server-derived
    /// machine flag; never inferred from a name string.
    func isPending(ballId: String) -> Bool {
        balls.first { $0.id == ballId }?.pending == true
    }

    /// Ball id → "Group N", or nil on a single-group round (nothing to say).
    func groupLabel(ofBallId id: String) -> String? {
        let gs = groups
        guard gs.count >= 2 else { return nil }
        for (i, g) in gs.enumerated() where g.ballIds.contains(id) { return "Group \(i + 1)" }
        return nil
    }

    /// The selected `slotDefId`, resolved against the round's actual slots: an
    /// explicit selection wins if it still names a real slot; otherwise the
    /// first declared slot. Nil for a round with no format slots.
    var selectedSlotDefId: String? {
        let slots = round?.formatSlots ?? []
        guard !slots.isEmpty else { return nil }
        if let wanted = selectedSlot, slots.contains(where: { $0.slotDefId == wanted }) {
            return wanted
        }
        return slots.first?.slotDefId
    }

    /// The slot assignment this ball presents under the SELECTED format chip,
    /// falling back to the ball's first slot. The one lookup shared by the
    /// handicap line, the keypad and the stroke hint — three surfaces
    /// disagreeing about which number a ball plays off is the kind of bug
    /// nobody reports.
    func presentedSlot(of ball: RoundBall) -> RoundBallSlot? {
        ball.slots.first { $0.slotDefId == selectedSlotDefId } ?? ball.slots.first
    }

    /// What the ball actually plays off under the selected format: the
    /// server's effective PH (allowance AND any match-play normalisation
    /// applied), falling back to the slot PH for payloads that pre-date the
    /// derivation.
    func effectivePlayingHandicap(of ball: RoundBall) -> Double? {
        guard let slot = presentedSlot(of: ball) else { return nil }
        return slot.handicapDerivation?.effectivePh ?? slot.playingHandicap
    }

    /// The ball's standing under the SELECTED format, joined from the result
    /// payload by ballId — the score row's loud figure. Nil = nothing to say
    /// (result not loaded, ball not in the slot, nothing scored yet); the row
    /// falls back to its local gross-to-par.
    func standing(of ball: RoundBall) -> SlotStanding? {
        guard let view = result?.slots.first(where: { $0.slotDefId == selectedSlotDefId })
        else { return nil }
        return slotStanding(forBallId: ball.id, in: view)
    }

    /// The selected slot's catalog label ("Taliban", "Poängbogey"), with the
    /// same metadata fallback the header chips use.
    func selectedFormatLabel() -> String? {
        guard let slot = round?.formatSlots.first(where: { $0.slotDefId == selectedSlotDefId })
        else { return nil }
        if let descriptor = formats.first(where: { $0.id == slot.formatId }) {
            return descriptor.label
        }
        return "\(slot.scoringMode.rawValue) · \(slot.teamShape.rawValue)"
    }

    // MARK: - Handicap hint (Gamebook-style)

    /// The hint printed inside an UNSCORED circle: how handicap will modify the
    /// gross on this hole. `"-1"` = one stroke received, `"+1"` = a
    /// plus-handicap giveback, `"0"` = plays off scratch here. `nil` — the plain
    /// "–" placeholder — when no hint applies.
    ///
    /// Web: `hintText` in `score-entry.component.ts`. The sign flip is part of
    /// the port and not a typo: strokes RECEIVED read as a minus, because that
    /// is what they do to the gross.
    func hintText(ballId: String, playHoleId: String) -> String? {
        guard let strokes = strokesHint(ballId: ballId, playHoleId: playHoleId) else { return nil }
        if strokes == 0 { return "0" }
        return strokes > 0 ? "-\(strokes)" : "+\(-strokes)"
    }

    /// Strokes this ball's playing handicap gives it on one occurrence, under
    /// the SELECTED format slot (falling back to the ball's first slot).
    /// Positive = strokes received; negative = a plus-handicap giveback. `nil`
    /// when no hint applies: a pending seat, a slot with no playing handicap, or
    /// an unknown hole.
    ///
    /// Web: `strokesHintFor` in `round.service.ts`. **DISPLAY ONLY** — it
    /// mirrors the server's allocation (first-producer tee resolves the
    /// effective SI; the payload's per-tee `strokeIndex` is already
    /// override → base), and the server's net stays authoritative. The PH fed
    /// in is the server's per-slot EFFECTIVE PH, so format-level tweaks
    /// (match-play normalisation off the low ball) are included — the old
    /// "deliberately not reproduced" mismatch is retired.
    func strokesHint(ballId: String, playHoleId: String) -> Int? {
        guard let round else { return nil }
        guard let ball = balls.first(where: { $0.id == ballId }), !ball.pending else { return nil }
        guard let playingHandicap = effectivePlayingHandicap(of: ball) else { return nil }
        guard let hole = playHole(id: playHoleId) else { return nil }
        // First-producer convention, as on the server: a team ball's SI
        // reference is its first producer's tee.
        let teeName = ball.players.first?.teeName
        let strokeIndex =
            hole.tees.first { $0.teeName == teeName }?.strokeIndex ?? hole.baseStrokeIndex
        return Self.strokesReceived(
            playingHandicap: playingHandicap,
            strokeIndex: strokeIndex,
            allocationCycleSize: round.routeSi.allocationCycleSize
        )
    }

    /// The WHS allocator, mirrored from `strokesReceivedForStrokeIndex` in
    /// `src/create/handicap.ts` (itself a mirror of `server/domain/handicap.ts`).
    /// Kept branch-for-branch, including the plus-handicap arm's "give strokes
    /// back from the EASIEST holes" (`si > cycle - remainder`) and its
    /// `0 → 0` normalisation, so the three copies can be diffed by eye.
    nonisolated static func strokesReceived(
        playingHandicap: Double,
        strokeIndex: Double,
        allocationCycleSize cycle: Double
    ) -> Int {
        guard cycle > 0 else { return 0 }
        if playingHandicap >= 0 {
            let full = (playingHandicap / cycle).rounded(.down)
            let remainder = playingHandicap - full * cycle  // 0..<cycle
            return countInt(full) + (strokeIndex >= 1 && strokeIndex <= remainder ? 1 : 0)
        }
        let magnitude = -playingHandicap
        let full = (magnitude / cycle).rounded(.down)
        let remainder = magnitude - full * cycle  // 0..<cycle
        let givenBack = countInt(full) + (strokeIndex > cycle - remainder ? 1 : 0)
        return givenBack == 0 ? 0 : -givenBack
    }

    // MARK: - Metadata inputs (umbrella GIR/fairway)

    /// The boolean metadata inputs declared across the round's formats, deduped
    /// by key — one toggle even if two formats consume GIR.
    var metadataInputs: [MetadataInput] {
        let byId = Dictionary(formats.map { ($0.id, $0) }, uniquingKeysWith: { _, last in last })
        var seen = Set<String>()
        var out: [MetadataInput] = []
        for slot in round?.formatSlots ?? [] {
            for input in byId[slot.formatId]?.requirements.scoreEntry?.metadata ?? [] {
                guard input.kind == .boolean, !seen.contains(input.key) else { continue }
                seen.insert(input.key)
                out.append(input)
            }
        }
        return out
    }

    /// Those inputs that apply on the current hole. Absent predicate ⇒ applies
    /// everywhere; every present clause must hold (AND). The FORMAT declares
    /// this; the client only evaluates it — no par/hole rule is hardcoded.
    var metadataInputsForCurrentHole: [MetadataInput] {
        guard let hole = currentPlayHole else { return [] }
        return metadataInputs.filter {
            Self.metadataApplies($0.appliesWhen, par: hole.par, hole: hole.courseHoleNumber)
        }
    }

    /// The predicate itself lives in `Domain/StatPrompts.swift` so the pure
    /// prompt model evaluates the SAME rule (the par-3 tee gate is one of these
    /// shapes) instead of a second, drifting copy.
    static func metadataApplies(_ a: MetadataApplies?, par: Double, hole: Double) -> Bool {
        MetadataAppliesRule.evaluate(a, par: par, hole: hole)
    }

    func metadataValue(ballId: String, playHoleId: String, key: String) -> Bool {
        if let cell = cells[Self.cellKey(ballId, playHoleId)], case .value(let m) = cell.metadata {
            return m[key] == .bool(true)
        }
        let stored = scorecards.first { $0.ballId == ballId }?
            .holes.first { $0.playHoleId == playHoleId }?.metadata
        if case .value(let m) = stored { return m[key] == .bool(true) }
        return false
    }

    /// Explicit booleans for every applicable toggle, so turning one OFF
    /// persists. `.absent` for a strokes-only round (no stats step at all).
    private var metadataSnapshot: TriState<[String: JSONValue]> {
        let inputs = metadataInputsForCurrentHole
        guard !inputs.isEmpty else { return .absent }
        var out: [String: JSONValue] = [:]
        for input in inputs { out[input.key] = .bool(pendingMeta[input.key] == true) }
        return .value(out)
    }

    /// Set one toggle and persist the full snapshot. The score is already in by
    /// the time the stats screen shows, so this re-sends strokes + the snapshot.
    func setMetadata(key: String, value: Bool) {
        pendingMeta[key] = value
        guard let ball = ballUnderCursor, let hole = currentPlayedHole else { return }
        guard let strokes = strokes(ballId: ball.id, playHoleId: hole.playHoleId) else { return }
        Task {
            await self.setScore(
                ballId: ball.id,
                playHoleId: hole.playHoleId,
                strokes: strokes,
                metadata: self.metadataSnapshot
            )
        }
    }

    // MARK: - Player stats capture
    //
    // The stats step asks ONE player about ONE hole. Everything answer-dependent
    // (which prompts are on the card, what a de-selection means, what has to be
    // sent) lives in the pure `StatStep`; this half only decides who the subject
    // is, reads the durable inputs, and moves the batch onto the wire.
    //
    // Nothing posts per tap. Answers accumulate in the step and leave as one
    // batch when it closes — through "Done", through the back chevron, and
    // through a keypad dismissal, because a batch dropped on the way out is a
    // hole of capture the golfer will never notice was lost.

    /// The single registered player this ball captures for, if any. A ball
    /// qualifies only when exactly one member holds it, that member is a
    /// registered player (not a guest, not an unclaimed seat), and that player
    /// tracks stats. Shared-stroke balls have no subject — a scramble score is
    /// nobody's fairway.
    func statSubject(of ball: RoundBall) -> String? {
        guard !ball.pending, ball.players.count == 1, let member = ball.players.first else {
            return nil
        }
        guard !member.pending, let playerId = member.playerId else { return nil }
        return statModules[playerId] == nil ? nil : playerId
    }

    /// The ball a given player holds, across every group. nil when they are not
    /// seated in this round at all — a spectator, or a phone scoring for others.
    func ball(ofPlayerId playerId: String) -> RoundBall? {
        balls.first { ball in ball.players.contains { $0.playerId == playerId } }
    }

    /// Holes on that player's own card with no score yet, or nil when they hold
    /// no ball here.
    ///
    /// Zero is the DURABLE "their round is over". `AdvancePolicy`'s
    /// `.roundComplete` is a toast — a moment — and a surface that only existed
    /// during it would be gone by the time the player looked at the board.
    func holesUnscored(forPlayerId playerId: String) -> Int? {
        guard let ball = ball(ofPlayerId: playerId) else { return nil }
        guard let group = groups.first(where: { $0.ballIds.contains(ball.id) }) else { return nil }
        return group.playedOrder.filter {
            strokes(ballId: ball.id, playHoleId: $0.playHoleId) == nil
        }.count
    }

    /// Whether the round-end story (§4.1) may appear, for the signed-in player.
    ///
    /// The store deliberately holds no session — the round flow works logged
    /// out — so the caller passes the player id in from the environment.
    func storyEligibility(signedInPlayerId: String?) -> RoundStoryEligibility {
        RoundStoryEligibility.evaluate(
            signedInPlayerId: signedInPlayerId,
            statConfigPlayerIds: Set(statModules.keys),
            statRows: statRows,
            holesUnscored: signedInPlayerId.flatMap { holesUnscored(forPlayerId: $0) })
    }

    private var currentStatCell: StatCell? {
        guard let ball = ballUnderCursor, let hole = currentPlayedHole else { return nil }
        guard let playerId = statSubject(of: ball) else { return nil }
        return StatCell(playerId: playerId, playHoleId: hole.playHoleId)
    }

    /// The prompts on the card right now, in shot order.
    var statPrompts: [StatPrompt] { statStep?.prompts ?? [] }

    func statValue(_ key: StatEventKey) -> String? { statStep?.value(of: key) }

    /// A stepper's current number, floored at its minimum when unanswered — the
    /// value the row displays before anyone has touched it.
    func statStepperValue(_ key: StatEventKey, min: Int) -> Int {
        statStep?.intValue(of: key) ?? min
    }

    func statIsAnswered(_ key: StatEventKey) -> Bool { statStep?.isAnswered(key) ?? false }

    /// The FORMAT's own metadata toggles for this hole, minus any key the stats
    /// step is already asking about. One control per question: when a format
    /// wants GIR and the player tracks approach, the stats row renders it and
    /// the answer is written to BOTH channels (see `answerStat`).
    var formatMetadataInputsForStep: [MetadataInput] {
        let asked = Set(statPrompts.map(\.key.rawValue))
        return metadataInputsForCurrentHole.filter { !asked.contains($0.key) }
    }

    /// Answer (or, with `nil`, un-answer) one stats prompt. Nothing leaves the
    /// device here — see `flushStats()`.
    func answerStat(_ key: StatEventKey, value: String?) {
        guard statStep != nil else { return }
        statStep?.answer(key, value: value)
        mirrorToFormatMetadata(key)
    }

    /// Nudge a stepper prompt. Any nudge answers it, so `-1` from untouched
    /// records the floor rather than doing nothing.
    func stepStat(_ key: StatEventKey, by delta: Int) {
        guard statStep != nil else { return }
        statStep?.step(key, by: delta)
        mirrorToFormatMetadata(key)
    }

    /// The dual write: when a format declares an input under the same key, the
    /// stats answer also drives the format's per-ball metadata, with the format
    /// channel keeping its own explicit-boolean semantics. Formats that nobody
    /// tracks stats for are untouched — those balls still render the plain
    /// format toggle.
    private func mirrorToFormatMetadata(_ key: StatEventKey) {
        guard metadataInputsForCurrentHole.contains(where: { $0.key == key.rawValue }) else {
            return
        }
        setMetadata(key: key.rawValue, value: statValue(key) == "1")
    }

    /// Rebuild the step when the (player, hole) under the cursor changes,
    /// flushing whatever the previous cell had accumulated first.
    private func seedStats() {
        let cell = currentStatCell
        guard cell != statCell else {
            refreshStatStep()
            return
        }
        flushStats()
        setStatCell(cell, step: cell.flatMap(makeStatStep))
    }

    /// Re-read the durable half under the SAME cell, keeping the draft.
    private func refreshStatStep() {
        guard let cell = statCell else {
            statStep = nil
            return
        }
        guard statStep != nil, let modules = statModules[cell.playerId] else {
            setStatCell(cell, step: makeStatStep(cell))
            return
        }
        statStep?.refresh(modules: modules, persisted: persistedStats(for: cell))
    }

    /// The pair moves together: a cell with no buildable step is not a cell.
    /// Keeping a `statCell` alive with `statStep == nil` used to leave a zombie
    /// — `flushStats` and `answerStat` both bail on the nil step, so the cursor
    /// pointed at a subject nothing could be written for.
    private func setStatCell(_ cell: StatCell?, step: StatStep?) {
        statCell = step == nil ? nil : cell
        statStep = step
    }

    private func makeStatStep(_ cell: StatCell) -> StatStep? {
        guard let modules = statModules[cell.playerId], let hole = currentPlayHole else {
            return nil
        }
        return StatStep(
            modules: modules,
            par: hole.par,
            holeNumber: hole.courseHoleNumber,
            persisted: persistedStats(for: cell))
    }

    /// What is already stored for this cell: the server's projection, overridden
    /// by anything this device wrote since the last load.
    private func persistedStats(for cell: StatCell) -> [StatEventKey: String] {
        var out =
            statRows.first {
                $0.playHoleId == cell.playHoleId && $0.playerId == cell.playerId
            }.map(Self.storedValues) ?? [:]
        for key in StatVocabulary.order {
            guard let local = statLocal[Self.statLocalKey(cell, key)] else { continue }
            out[key] = local
        }
        return out
    }

    /// The projection row, read back into the flat wire vocabulary the prompts
    /// speak. Booleans are `"0"`/`"1"`, counts are decimal — the same strings
    /// `StatVocabulary` offers and the server accepts.
    static func storedValues(_ row: PlayerHoleStats) -> [StatEventKey: String] {
        var out: [StatEventKey: String] = [:]
        if let v = row.teeResult { out[.teeResult] = v.rawValue }
        if let v = row.gir { out[.gir] = v ? "1" : "0" }
        if let v = row.firstPutt { out[.firstPutt] = v.rawValue }
        if let v = row.putts { out[.putts] = String(countInt(v)) }
        if let v = row.shortGameDifficulty { out[.shortGameDifficulty] = v.rawValue }
        if let v = row.penalties { out[.penalties] = String(countInt(v)) }
        if let v = row.recoveryOk { out[.recoveryOk] = v ? "1" : "0" }
        return out
    }

    private static func statLocalKey(_ cell: StatCell, _ key: StatEventKey) -> String {
        "\(cell.playHoleId)|\(cell.playerId)|\(key.rawValue)"
    }

    /// Commit the open step: queue its answers on disk and post the round's
    /// whole outstanding batch. Idempotent — a step with nothing new does
    /// nothing, so calling it from every exit path is safe.
    @discardableResult
    func flushStats() -> Bool {
        guard let cell = statCell, var step = statStep else { return false }
        let batch = step.batch
        guard !batch.isEmpty else { return false }
        // Fold the draft in first: the step now shows what was sent and owes
        // nothing, so a second exit path cannot re-queue the same answers.
        step.commitDraft()
        statStep = step
        for item in batch { writeStatLocal(cell, item.key, item.value) }
        Task { await self.persistStats(cell: cell, batch: batch) }
        return true
    }

    /// This device's shadow value for one key. Writing one un-confirms it: the
    /// key is dirty again and must survive until ITS event is settled, not the
    /// previous one's.
    private func writeStatLocal(_ cell: StatCell, _ key: StatEventKey, _ value: String?) {
        let localKey = Self.statLocalKey(cell, key)
        statLocal.updateValue(value, forKey: localKey)
        statConfirmedAt.removeValue(forKey: localKey)
    }

    /// Marks the keys carried by `events` as settled with the server as of the
    /// current load generation. Settled means "the server will not tell us
    /// anything more about our write" — an ack, or a refusal that dropped it.
    private func confirmStatLocals(_ events: [PendingStatEvent]) {
        for event in events {
            let cell = StatCell(playerId: event.playerId, playHoleId: event.playHoleId)
            statConfirmedAt[Self.statLocalKey(cell, event.key)] = loadSeq
        }
    }

    /// Retires shadow values whose events were settled BEFORE this load was
    /// issued, so the projection it just delivered is authoritative for them.
    ///
    /// The seq comparison is the whole point: an ack is not enough on its own,
    /// because a load already in flight when the ack happened cannot contain
    /// the write. Only a strictly later load generation proves the server had
    /// our event when it answered — after which a correction made on another
    /// phone finally wins instead of being masked forever.
    private func dropConfirmedStatLocals(loadedAtSeq seq: Int) {
        for (localKey, confirmedSeq) in statConfirmedAt where seq > confirmedSeq {
            statLocal.removeValue(forKey: localKey)
            statConfirmedAt.removeValue(forKey: localKey)
        }
    }

    private func persistStats(cell: StatCell, batch: [StatBatchItem]) async {
        // On disk before the network, exactly as scores are.
        _ = await statQueue.enqueue(
            token: token,
            playHoleId: cell.playHoleId,
            playerId: cell.playerId,
            batch: batch,
            now: now())
        await postStats()
    }

    /// Replay stat answers a previous launch never got acked, then post.
    func flushPendingStats() async {
        for event in await statQueue.pending(for: token) {
            let cell = StatCell(playerId: event.playerId, playHoleId: event.playHoleId)
            writeStatLocal(cell, event.key, event.value)
        }
        await postStats()
    }

    /// Drains the queue for this round as batched POSTs.
    ///
    /// A batch that failed in TRANSIT stays queued — every entry keeps its
    /// `clientEventId`, so the retry dedupes server-side instead of appending a
    /// second event. A batch the server REFUSED is dropped instead: it cannot
    /// succeed however often it is replayed, and leaving it at the head of the
    /// queue would block every later stat in the round behind one poison item.
    ///
    /// DECISION (stats v1): a drop is silent. There is deliberately no
    /// user-visible failure surface for capture — the durable queue is the
    /// mitigation, and a toast about a stat nobody can act on costs more
    /// attention on the course than it is worth. Revisit when stats get a
    /// review screen of their own.
    private func postStats() async {
        guard !statFlushing else { return }
        statFlushing = true
        defer { statFlushing = false }
        // Loop rather than one pass: answers queued while a post is in flight
        // would otherwise sit until the next exit, and the guard above means
        // their own `postStats` returned immediately.
        while true {
            let pending = await statQueue.pending(for: token)
            guard !pending.isEmpty else { return }
            do {
                _ = try await api.send(
                    PlayerStatsEndpoints.appendEvents,
                    PlayerStatsAppendEventsInput(token: token, items: pending.map(\.item)))
                await statQueue.ack(pending.map(\.clientEventId))
                confirmStatLocals(pending)
            } catch {
                guard Self.isRefusal(error) else { return }
                await statQueue.ack(pending.map(\.clientEventId))
                confirmStatLocals(pending)
            }
        }
    }

    /// A refusal is a verdict on the CONTENT: the server understood the batch
    /// and said no. Transport failures (offline, DNS, timeout), 401s and
    /// 5xx-class errors are all "not now" and keep their place in the queue;
    /// 408 and 429 are 4xx by number but explicitly mean "try again".
    private static func isRefusal(_ error: Error) -> Bool {
        guard case let APIError.server(code, _) = error else { return false }
        guard (400..<500).contains(code) else { return false }
        return code != 408 && code != 429
    }

    // MARK: - Navigation

    private func clampPosition() {
        let count = playedOrder.count
        holeIndex = count == 0 ? 0 : min(max(holeIndex, 0), count - 1)
        let groupCount = groups.count
        groupIndex = groupCount == 0 ? 0 : min(max(groupIndex, 0), groupCount - 1)
        let ballCount = ballsInGroup.count
        currentBallIndex = ballCount == 0 ? 0 : min(max(currentBallIndex, 0), ballCount - 1)
    }

    /// Manual hole navigation — chevrons, the pager, anything the user drives.
    ///
    /// CALLER CONTRACT #3: it must cancel a pending jump. After the user moves
    /// and comes back, the stale-hole guard would pass again and the abandoned
    /// jump would fire from under them.
    func goToHole(index: Int) {
        let count = playedOrder.count
        guard count > 0 else { return }
        let clamped = min(max(index, 0), count - 1)
        cancelJump()
        statsOpen = false
        flushStats()
        guard clamped != holeIndex else { return }
        holeIndex = clamped
        currentBallIndex = 0
        noteHoleEntered()
        seedStats()
    }

    func selectGroup(index: Int) {
        guard groups.indices.contains(index) else { return }
        cancelJump()
        flushStats()
        groupIndex = index
        holeIndex = 0
        currentBallIndex = 0
        noteHoleEntered()
        seedStats()
    }

    var canPrevHole: Bool { holeIndex > 0 }
    var canNextHole: Bool { holeIndex < playedOrder.count - 1 }
    func prevHole() { goToHole(index: holeIndex - 1) }
    func nextHole() { goToHole(index: holeIndex + 1) }

    // MARK: - Keypad

    var ballUnderCursor: RoundBall? {
        let group = ballsInGroup
        return group.indices.contains(currentBallIndex) ? group[currentBallIndex] : nil
    }

    /// Open the keypad aimed at one ball, snapshotting correction mode.
    func openKeypad(ballId: String) {
        let group = ballsInGroup
        let idx = group.firstIndex { $0.id == ballId } ?? 0
        currentBallIndex = idx
        statsOpen = false
        noteHoleEntered()
        seedMetadata()
        seedStats()
        keypadOpen = true
    }

    func closeKeypad() {
        // A swipe-down on the sheet is an exit from the stats step like any
        // other — the batch goes out before the state is torn down.
        flushStats()
        keypadOpen = false
        statsOpen = false
        cancelJump()
    }

    func selectBall(index: Int) {
        guard ballsInGroup.indices.contains(index) else { return }
        currentBallIndex = index
        seedMetadata()
        seedStats()
    }

    /// The snapshot the policy is allowed to know, read out of live state at
    /// event time. Built here and nowhere else.
    var advanceState: AdvanceState {
        let hole = currentPlayedHole
        return AdvanceState(
            balls: ballsInGroup.map { ball in
                BallState(
                    scored: hole.map { strokes(ballId: ball.id, playHoleId: $0.playHoleId) != nil }
                        ?? false,
                    pending: ball.pending
                )
            },
            currentBallIndex: currentBallIndex,
            currentHole: hole.map {
                HoleRefState(id: $0.playHoleId, label: occurrenceLabel($0.playHoleId))
            },
            holeIndex: holeIndex,
            holeCount: playedOrder.count,
            holeCompleteOnEntry: holeCompleteOnEntry,
            // Either channel opens the step: a format that wants GIR, or a
            // player who tracks their own stats. A round with no format
            // metadata at all still gets a stats step for a player who asked
            // for one.
            collectsStats: !metadataInputsForCurrentHole.isEmpty || !statPrompts.isEmpty
        )
    }

    /// CALLER CONTRACT #6 / the entry-vs-correction snapshot: taken on EVERY
    /// arrival (open, chevrons, the post-completion jump) and held for the whole
    /// visit. Deliberately not recomputed after each entry.
    func noteHoleEntered() {
        holeCompleteOnEntry = isHoleCompleteOnEntry(advanceState)
    }

    /// True when at least one OTHER ball on this hole is unscored — the stats
    /// button's label only ("Next ›" vs "Done ›").
    var hasMoreUnscoredBalls: Bool { hasMoreUnscored(advanceState) }

    /// A keypad key: 1–9, the 10+ stepper's ✓, `0` (pick up) or `nil` (clear).
    func commit(_ value: Int?) {
        apply(.score(value: value))
    }

    /// The stats screen's "Next ›" / "Done ›".
    ///
    /// CALLER CONTRACT #1: the sheet is closed HERE, before the event is
    /// dispatched — the policy can answer `stay`/`noop`, which touches nothing,
    /// so a sheet closed in reaction to the move would never close at all.
    func statsDone() {
        statsOpen = false
        // Before the event: `.statsDone` can move the cursor, and the batch
        // belongs to the ball it was answered for.
        flushStats()
        apply(.statsDone)
    }

    /// The stats screen's back chevron (web: `.se-stats__back`, whose whole
    /// handler is `statsOpen.set(false)`).
    ///
    /// It dismisses the step and NOTHING else: no `statsDone` event, so no
    /// write, no ball hop, no hole jump, and the toggles already applied stay
    /// applied (each one persisted itself through `setMetadata`). The player is
    /// back on the keypad with the same ball under the cursor, free to re-enter
    /// the score they just typed.
    ///
    /// It DOES commit the captured stats, and that is not an exception to the
    /// above: the format toggles persisted themselves on every tap, so "nothing
    /// else happens" already meant "the answers you gave are kept". Stats batch
    /// instead of posting per tap, so keeping them takes an explicit flush —
    /// without it, backing out of the step would silently bin the hole.
    func statsBack() {
        statsOpen = false
        flushStats()
    }

    private func apply(_ entry: EntryEvent) {
        execute(advance(advanceState, entry))
    }

    /// Executes one policy decision. Every numbered obligation of the caller
    /// contract in `Domain/AdvancePolicy.swift` is discharged here.
    private func execute(_ decision: AdvanceDecision) {
        if let write = decision.write {
            let group = ballsInGroup
            if group.indices.contains(write.ballIndex), round?.id != nil {
                let ball = group[write.ballIndex]
                let metadata: TriState<[String: JSONValue]> =
                    write.withMetadata ? metadataSnapshot : .absent
                let strokes = write.value.map(Double.init)
                // SYNCHRONOUS overlay patch, in the same turn as the key press.
                // Wrapping the whole write in a `Task` would put even the
                // optimistic value one MainActor hop away — a hop is not a
                // network round-trip, but it is a frame in which the grid can
                // render the OLD value, and this store's own docs promise the
                // cell is patched the instant the key is pressed. Only the
                // durable half (queue + POST) is allowed to be asynchronous.
                let epoch = patchCell(
                    ballId: ball.id,
                    playHoleId: write.holeId,
                    strokes: strokes,
                    metadata: metadata
                )
                Task {
                    await self.persist(
                        ballId: ball.id,
                        playHoleId: write.holeId,
                        strokes: strokes,
                        metadata: metadata,
                        epoch: epoch
                    )
                }
            }
        }

        switch decision.move {
        case .noop, .stay:
            return
        case .moveToBall(let ballIndex):
            currentBallIndex = ballIndex
            seedMetadata()
            seedStats()
        case .openStats:
            statsOpen = true
        case .roundComplete(let toast):
            // #5 toast FIRST, synchronously; #2 close the whole keypad.
            flash(toast)
            cancelJump()
            keypadOpen = false
            statsOpen = false
        case .holeComplete(let toast, let fromHoleId, let toHoleIndex, let delayMs):
            // #5 toast FIRST, then #3 schedule at most one timer.
            flash(toast)
            scheduleJump(fromHoleId: fromHoleId, toHoleIndex: toHoleIndex, delayMs: delayMs)
        }
    }

    /// CALLER CONTRACT #3 + #4: at most one timer alive; at fire time re-check
    /// the keypad is still on `fromHoleId` (abandon otherwise) and CLAMP the
    /// frozen target against the LIVE played order — the itinerary can change
    /// during the pause.
    private func scheduleJump(fromHoleId: String, toHoleIndex: Int, delayMs: Int) {
        cancelJump()
        pendingJump = PendingHoleJump(fromHoleId: fromHoleId, toHoleIndex: toHoleIndex)
        jumpTask = Task { [weak self, sleeper] in
            try? await sleeper(.milliseconds(delayMs))
            guard !Task.isCancelled, let self else { return }
            self.fireJump()
        }
    }

    private func fireJump() {
        guard let jump = pendingJump else { return }
        pendingJump = nil
        jumpTask = nil
        // Still on the hole that completed? A manual swipe during the pause must
        // not yank the user to the wrong hole.
        guard currentPlayedHole?.playHoleId == jump.fromHoleId else { return }
        let count = playedOrder.count
        guard count > 0 else { return }
        holeIndex = min(max(jump.toHoleIndex, 0), count - 1)
        // #6 reset the cursor to ball 0 and re-snapshot — that is what stops the
        // advance chain on a hole that was already scored ahead of time.
        currentBallIndex = 0
        noteHoleEntered()
        seedMetadata()
        seedStats()
    }

    private func cancelJump() {
        jumpTask?.cancel()
        jumpTask = nil
        pendingJump = nil
    }

    private func flash(_ message: String) {
        toast = message
        toastTask?.cancel()
        toastTask = Task { [weak self, sleeper] in
            try? await sleeper(.milliseconds(1400))
            guard !Task.isCancelled, let self else { return }
            if self.toast == message { self.toast = nil }
        }
    }

    /// Reseed the toggles from stored state when the open ball/hole changes —
    /// never on a same-cell update, so live toggles survive.
    private func seedMetadata() {
        guard let ball = ballUnderCursor, let hole = currentPlayedHole else {
            lastMetaKey = nil
            return
        }
        let key = Self.cellKey(ball.id, hole.playHoleId)
        guard key != lastMetaKey else { return }
        lastMetaKey = key
        var seed: [String: Bool] = [:]
        for input in metadataInputsForCurrentHole {
            seed[input.key] = metadataValue(
                ballId: ball.id, playHoleId: hole.playHoleId, key: input.key)
        }
        pendingMeta = seed
    }

    // MARK: - Score writes

    /// Optimistically set a score, persist the attempt, then post it.
    ///
    /// The overlay is patched SYNCHRONOUSLY — the grid shows the entered value
    /// before anything touches disk or the network — and the queue entry is on
    /// disk before the POST is attempted.
    func setScore(
        ballId: String,
        playHoleId: String,
        strokes: Double?,
        metadata: TriState<[String: JSONValue]> = .absent
    ) async {
        guard round?.id != nil else { return }
        let epoch = patchCell(
            ballId: ballId, playHoleId: playHoleId, strokes: strokes, metadata: metadata)
        await persist(
            ballId: ballId,
            playHoleId: playHoleId,
            strokes: strokes,
            metadata: metadata,
            epoch: epoch
        )
    }

    /// The optimistic half: mark the cell, synchronously, and return the write
    /// epoch that the durable half must quote back. Nothing here awaits, so a
    /// caller on the MainActor sees the new value before it returns.
    @discardableResult
    private func patchCell(
        ballId: String,
        playHoleId: String,
        strokes: Double?,
        metadata: TriState<[String: JSONValue]>
    ) -> Int {
        writeEpoch += 1
        let epoch = writeEpoch
        cells[Self.cellKey(ballId, playHoleId)] = CellState(
            strokes: strokes,
            metadata: metadata,
            status: .saving,
            clientEventId: nil,
            epoch: epoch
        )
        return epoch
    }

    /// The durable half: queue on disk BEFORE the network attempt, then post.
    /// Every write into `cells` is epoch-guarded, so a slow write that was
    /// superseded while it was in flight can no longer touch the cell.
    private func persist(
        ballId: String,
        playHoleId: String,
        strokes: Double?,
        metadata: TriState<[String: JSONValue]>,
        epoch: Int
    ) async {
        guard let roundId = round?.id else { return }
        let key = Self.cellKey(ballId, playHoleId)
        let write = await queue.enqueue(
            token: token,
            roundId: roundId,
            ballId: ballId,
            playHoleId: playHoleId,
            strokes: strokes,
            eventType: strokes == nil ? .scoreCleared : .scoreEntered,
            metadata: metadata,
            now: now()
        )
        if cells[key]?.epoch == epoch { cells[key]?.clientEventId = write.clientEventId }
        await post(write, epoch: epoch)
    }

    /// Re-send this round's queued (never-acked) writes in queue order. Called
    /// after a load (kill recovery) and on foreground/reconnect. Each entry
    /// re-marks its cell as an optimistic `saving` overlay, so a flush after a
    /// relaunch resurfaces the pending value in the grid.
    func flushPending() async {
        guard !flushing else { return }
        flushing = true
        defer { flushing = false }
        for write in await queue.pending(for: token) {
            let key = Self.cellKey(write.ballId, write.playHoleId)
            writeEpoch += 1
            let epoch = writeEpoch
            cells[key] = CellState(
                strokes: write.strokes,
                metadata: write.metadata,
                status: .saving,
                clientEventId: write.clientEventId,
                epoch: epoch
            )
            await post(write, epoch: epoch)
        }
    }

    /// Retry one failed cell, reusing its `clientEventId` (idempotent).
    ///
    /// The queue entry is normally still there — that is what `.error` means.
    /// But it can legitimately be gone: an ack for this exact id landed after
    /// the cell was already marked failed, or hygiene pruned a two-week-old
    /// entry under a screen left open. The old code returned silently in that
    /// case, so the button was a permanent no-op and the cell stayed red with no
    /// way out. Re-enqueue from the cell instead, keeping the SAME
    /// `clientEventId`: a re-send of an event that actually landed dedupes
    /// server-side, which is precisely the guarantee the id exists to provide.
    func retry(ballId: String, playHoleId: String) async {
        let key = Self.cellKey(ballId, playHoleId)
        guard let cell = cells[key], let id = cell.clientEventId else { return }
        guard let roundId = round?.id else { return }
        let write: PendingScoreWrite
        if let queued = await queue.pending(for: token).first(where: { $0.clientEventId == id }) {
            write = queued
        } else {
            write = await queue.enqueue(
                token: token,
                roundId: roundId,
                ballId: ballId,
                playHoleId: playHoleId,
                strokes: cell.strokes,
                eventType: cell.strokes == nil ? .scoreCleared : .scoreEntered,
                metadata: cell.metadata,
                clientEventId: id,
                now: now()
            )
        }
        writeEpoch += 1
        let epoch = writeEpoch
        cells[key]?.status = .saving
        cells[key]?.epoch = epoch
        await post(write, epoch: epoch)
    }

    private func post(_ write: PendingScoreWrite, epoch: Int) async {
        let key = Self.cellKey(write.ballId, write.playHoleId)
        do {
            _ = try await api.send(
                FriendlyRoundsEndpoints.score,
                FriendlyRoundsScoreInput(
                    token: token,
                    ballId: write.ballId,
                    playHoleId: write.playHoleId,
                    strokes: write.strokes,
                    eventType: write.eventType,
                    clientEventId: write.clientEventId,
                    // A null blob carries nothing; send it as absent, exactly as
                    // the web post does (`metadata != null`).
                    metadata: write.metadata.value.map { .value($0) } ?? .absent
                )
            )
            // Acked — drop the persisted copy, keyed on the exact id: a newer
            // edit that coalesced this cell's entry keeps its own queued write.
            await queue.ack(write.clientEventId)
            if cells[key]?.epoch == epoch { cells[key]?.status = .saved }
            // The first accepted score promotes the round server-side; mirror
            // that locally so the badge flips without an extra refetch.
            if var r = round, r.status == .notStarted {
                r.status = .active
                round = r
                recordDeviceRound()
            }
        } catch {
            // Stays queued for a later flush (relaunch / foreground / retry).
            if cells[key]?.epoch == epoch { cells[key]?.status = .error }
        }
    }

    // MARK: - Errors

    private static func message(_ error: any Error) -> String {
        if let apiError = error as? APIError { return apiError.localizedDescription }
        return error.localizedDescription
    }
}
