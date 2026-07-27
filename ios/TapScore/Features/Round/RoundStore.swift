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
    private(set) var startList: StartListView?
    private(set) var balls: [RoundBall] = []
    private(set) var scorecards: [Scorecard] = []
    private(set) var formats: [FormatDescriptor] = []
    private(set) var cells: [String: CellState] = [:]

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

    // MARK: - Machinery

    private var loadSeq = 0
    private var resultSeq = 0
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
    /// gate re-run is what reopens the stream when the leaderboard is up, and
    /// the foreground hook covers staleness from here on. A caller that does
    /// want fresh data has `refresh()`.
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
        async let cardsResult = try? api.send(
            FriendlyRoundsEndpoints.scorecard, FriendlyRoundsByTokenInput(token: token))
        let (loadedBalls, loadedCards) = await (ballsResult, cardsResult)
        guard seq == loadSeq else { return }
        // Order matters, exactly as on the web: clear the optimistic overlay and
        // seat the scorecards BEFORE the balls that drive rendering.
        cells = [:]
        scorecards = loadedCards ?? []
        balls = loadedBalls ?? []
        clampPosition()

        // Replay writes a previous launch never got acked (dead-zone kill).
        // Each reuses its stored clientEventId, so an event that actually landed
        // dedupes server-side instead of double-counting.
        await flushPending()
        updateLiveGate()
    }

    /// Round + result refetch, used on foreground and on a remote finish.
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
                FriendlyRoundsResultInput(cursor: nil, token: token)
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
                FriendlyRoundsResultInput(cursor: resultCursor, token: token)
            )
            guard seq == resultSeq else { return }
            apply(output)
        } catch {
            return
        }
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
        PollGateInput(tab: tab, sceneActive: sceneActive, status: round?.status)
    }

    /// Switch tabs. Opening the leaderboard loads the board if it is empty and
    /// re-runs the live gate — this is the only writer of `tab`.
    func setTab(_ next: RoundTab) {
        guard next != tab else { return }
        tab = next
        if tab == .leaderboard, result == nil { Task { await loadResult() } }
        updateLiveGate()
    }

    /// The single place the stream/poll decision is made — re-run on every tab
    /// switch, scene change and status change, exactly like the web effect.
    func updateLiveGate() {
        gateGeneration += 1
        let generation = gateGeneration
        if shouldPoll(gateInput) {
            openLive()
        } else {
            // A gate closed by BACKGROUNDING suspends (the feed reconnects from
            // its cursor on return); any other close is a real teardown.
            //
            // The generation guard matters: `load()` closes the gate (the score
            // tab is not live), and if the user reaches the leaderboard before
            // that hop runs, the close would otherwise tear down the feed that
            // was just opened — leaving a store that thinks it is streaming and
            // a feed that stopped.
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
            await pollResult()
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
        guard var r = round else { return }
        let mapped: AdminRoundSummaryStatus
        switch status {
        case .notStarted: mapped = .notStarted
        case .active: mapped = .active
        case .complete: mapped = .complete
        }
        guard mapped != r.status else { return }
        r.status = mapped
        // This device's clock, not the server's — the same fabrication the web
        // client makes, and overwritten by the next full load.
        r.completedAt = mapped == .complete ? ISO8601DateFormatter().string(from: now()) : nil
        round = r
        // The fabricated timestamp does not just sit in memory: recording it
        // here is what lets the landing order "Recently finished" after another
        // device finished this round, until the next full load overwrites it
        // with the server's value. Same trade the web client documents.
        recordDeviceRound()
        updateLiveGate()
    }

    // MARK: - Device history

    /// Upsert this round into the device-recent list from whatever is loaded.
    ///
    /// Called on load, on a remote status flip, and when the first accepted
    /// score promotes `not_started → active` — the three moments the web
    /// service calls `recordDeviceRound`, minus finish/reopen, which this
    /// screen does not offer yet (when it does, it calls this too).
    ///
    /// `recordOpen` treats nil as "unknown, keep what you had", so this can
    /// only ever enrich the shell's token-only row, never blank it.
    private func recordDeviceRound() {
        guard let deviceRounds, let r = round else { return }
        deviceRounds.recordOpen(
            token: token,
            courseName: r.courseNameSnapshot,
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
            // screen through this, not through the stream.
            await self.refresh()
            await self.flushPending()
            self.updateLiveGate()
        }
    }

    private func handleBackground() {
        sceneActive = false
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

    static func metadataApplies(_ a: MetadataApplies?, par: Double, hole: Double) -> Bool {
        guard let a else { return true }
        if let minPar = a.minPar, par < minPar { return false }
        if let maxPar = a.maxPar, par > maxPar { return false }
        if let pars = a.pars, !pars.contains(par) { return false }
        if let holes = a.holes, !holes.contains(hole) { return false }
        return true
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
        guard clamped != holeIndex else { return }
        holeIndex = clamped
        currentBallIndex = 0
        noteHoleEntered()
    }

    func selectGroup(index: Int) {
        guard groups.indices.contains(index) else { return }
        cancelJump()
        groupIndex = index
        holeIndex = 0
        currentBallIndex = 0
        noteHoleEntered()
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
        keypadOpen = true
    }

    func closeKeypad() {
        keypadOpen = false
        statsOpen = false
        cancelJump()
    }

    func selectBall(index: Int) {
        guard ballsInGroup.indices.contains(index) else { return }
        currentBallIndex = index
        seedMetadata()
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
            collectsStats: !metadataInputsForCurrentHole.isEmpty
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
        apply(.statsDone)
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
                    // A null blob carries nothing; send it as absent, exactly as
                    // the web post does (`metadata != null`).
                    metadata: write.metadata.value.map { .value($0) } ?? .absent,
                    token: token,
                    ballId: write.ballId,
                    playHoleId: write.playHoleId,
                    strokes: write.strokes,
                    eventType: write.eventType,
                    clientEventId: write.clientEventId
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
