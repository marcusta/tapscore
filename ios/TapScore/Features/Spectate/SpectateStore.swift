import Foundation
import Observation

/// State for watching someone else's round.
///
/// **The read-only guarantee is structural, not a flag.** This store is
/// constructed from a round ID, holds no share token, and calls exactly two
/// endpoints — `GET /spectate/rounds/:roundId` and `GET /rounds/balls` — both
/// of which are reads authorized by the caller's SESSION. There is no code path
/// from here to a score write, a manage action or a token, so "read-only" is
/// not something a view has to remember to enforce (see
/// docs/proposals/friends-activity.md).
///
/// It is a deliberately thin sibling of `RoundStore` rather than a mode of it.
/// `RoundStore` is ~2000 lines of things a spectator must not have: a pending
/// score queue, a stat queue, manage actions, an offline write path. Adding a
/// `isSpectator` flag to that would make every one of those a place where the
/// guarantee could be lost.
///
/// What it DOES share with `RoundStore` is the live plumbing — `shouldPoll`,
/// `LiveResultFeed`, the degrade-to-20s-poll policy and the scene hooks — so a
/// watched round behaves exactly like a played one when the network wobbles or
/// the app is backgrounded.
@MainActor
@Observable
final class SpectateStore {
    let roundId: String

    private(set) var round: Round?
    private(set) var result: RoundResult?
    private(set) var balls: [RoundBall] = []
    private(set) var status: RoundStatus?
    private(set) var loading = false
    private(set) var loadError: String?
    /// Set when the server says this round is not (or no longer) watchable —
    /// it went private, the friendship ended, or the id is wrong. Rendered as
    /// its own state rather than as an error, because none of those is a
    /// failure the viewer can retry their way out of.
    private(set) var unavailable = false

    /// Which format slot's board is shown. Mirrors `RoundStore.selectedSlot`.
    var selectedSlot: String?
    /// Which attached scorecards are expanded. Same value type as the played
    /// round's board, so the rows behave identically.
    var expandedScorecards = ScorecardExpansion()

    private let api: TapScoreAPI
    private let feed: any LiveResultFeeding
    private let scenePhase: ScenePhaseCoordinator?

    private var feedTask: Task<Void, Never>?
    private var pollTask: Task<Void, Never>?
    private var feedRunning = false
    private var feedSuspended = false
    private var degraded = false
    private var hooksRegistered = false
    private var sceneActive = true
    /// Guards out-of-order refetches, the way `RoundStore` guards its polls.
    private var loadSeq = 0

    init(
        roundId: String,
        api: TapScoreAPI,
        feed: any LiveResultFeeding,
        scenePhase: ScenePhaseCoordinator? = nil
    ) {
        self.roundId = roundId
        self.api = api
        self.feed = feed
        self.scenePhase = scenePhase
    }

    /// Production wiring. The feed is pointed at the SPECTATE endpoint, whose
    /// key is the round id — there is no token to give it.
    convenience init(roundId: String, environment: AppEnvironment) {
        self.init(
            roundId: roundId,
            api: environment.api,
            feed: LiveResultFeed(
                configuration: environment.configuration,
                endpoint: .spectateRoundId,
                // Cursors live in their OWN defaults suite. The shared store is
                // a 50-entry LRU keyed by share token; writing round ids into
                // it would evict the cursors of rounds this device actually
                // plays, which is the half that cannot be refetched cheaply.
                cursors: ResultCursorStore(
                    defaults: UserDefaults(suiteName: "tapscore.spectate") ?? .standard
                )
            ),
            scenePhase: environment.scenePhase
        )
    }

    // MARK: - Lifecycle

    func start() async {
        registerSceneHooks()
        await load()
    }

    func resumeIfNeeded() {
        guard !hooksRegistered else { return }
        registerSceneHooks()
        updateLiveGate()
    }

    func stop() async {
        if hooksRegistered {
            scenePhase?.unregister(key: "spectate:\(roundId)")
            hooksRegistered = false
        }
        await closeLive(fully: true)
    }

    private func registerSceneHooks() {
        guard !hooksRegistered else { return }
        hooksRegistered = true
        scenePhase?.register(
            key: "spectate:\(roundId)",
            onForeground: { [weak self] in
                guard let self else { return }
                sceneActive = true
                updateLiveGate()
                Task { await self.load() }
            },
            onBackground: { [weak self] in
                guard let self else { return }
                sceneActive = false
                updateLiveGate()
            }
        )
    }

    // MARK: - Loading

    func load() async {
        loadSeq += 1
        let seq = loadSeq
        loading = round == nil
        defer { if seq == loadSeq { loading = false } }
        do {
            let view = try await api.send(
                SpectateEndpoints.round,
                LeaderboardsForRoundInput(roundId: roundId)
            )
            guard seq == loadSeq else { return }
            round = view.round
            result = view.result
            status = view.status
            unavailable = false
            loadError = nil
            // The ROSTER is not per-score data. It changes about once a round
            // — somebody is added — while this method runs on every SSE frame,
            // so refetching it here would cost one extra round-trip per score
            // (a 4-ball 18-hole round watched by three friends: ~216 of them)
            // to re-read the same four names. Fetched once, and again only when
            // the board mentions a ball we have no name for — the shape a
            // roster change actually takes on this screen.
            if balls.isEmpty {
                await loadBalls()
            } else {
                await loadBallsIfRosterLooksStale()
            }
            updateLiveGate()
        } catch {
            guard seq == loadSeq else { return }
            switch error {
            case APIError.server(403, _), APIError.server(404, _):
                // Access is gone or was never there. Stop everything: a
                // reconnect loop against a stream that will keep refusing us is
                // the one thing a watcher screen must not do.
                unavailable = true
                loadError = nil
                await closeLive(fully: true)
            case APIError.unauthorized:
                loadError = "Your session expired — sign in again."
            default:
                loadError = "Couldn't load this round."
            }
        }
    }

    /// Ball id → display name. `RoundResult.subjectLabels` only names VIRTUAL
    /// subjects (an aggregated side), so the real balls still have to be read.
    /// `GET /rounds/balls` is id-addressed and session-authed — the same shape
    /// of read as the spectate view itself, and equally token-free.
    private func loadBalls() async {
        guard let round else { return }
        guard let fetched = try? await api.send(
            RoundsEndpoints.balls,
            LeaderboardsForRoundInput(roundId: round.id)
        ) else { return }
        balls = fetched
    }

    /// The one roster-shaped change this screen can see: the board names a ball
    /// we hold no roster row for, which is what somebody being added to the
    /// round looks like from out here. Anything else — a score, a correction, a
    /// finish — moves numbers on balls we already know, and re-reading the
    /// roster for those is the per-frame refetch this exists to avoid.
    private func loadBallsIfRosterLooksStale() async {
        guard let result else { return }
        let known = Set(balls.map(\.id))
        var referenced = Set<String>()
        for slot in result.slots {
            for label in slot.subjectLabels ?? [] {
                referenced.insert(label.ballId)
                referenced.formUnion(label.memberBallIds)
            }
            for section in slot.leaderboard {
                if case .ranked(let ranked) = section {
                    for entry in ranked.entries { referenced.formUnion(entry.ballIds) }
                }
            }
        }
        // A VIRTUAL subject (an aggregated side) has an id that is not a ball
        // and never will be in `balls`; `name(ofBallId:)` resolves those off
        // `subjectLabels`, so they must not force a refetch every frame.
        let virtualIds = Set(
            result.slots.flatMap { ($0.subjectLabels ?? []).map(\.ballId) }
        )
        guard !referenced.subtracting(known).subtracting(virtualIds).isEmpty else { return }
        await loadBalls()
    }

    // MARK: - Naming (mirrors RoundStore's resolution rules)

    func name(ofBallId id: String) -> String {
        if let ball = balls.first(where: { $0.id == id }) {
            let joined = ball.players.map(\.displayName).joined(separator: " & ")
            if !joined.isEmpty { return joined }
            return ball.label ?? "Ball"
        }
        for slot in result?.slots ?? [] {
            for label in slot.subjectLabels ?? [] where label.ballId == id { return label.label }
        }
        return id
    }

    /// The spectate payload carries no group structure, and a watcher has no
    /// use for one — they are not walking with a tee time. Always nil, which
    /// the fold treats as "single group, nothing to annotate".
    func groupLabel(ofBallId _: String) -> String? { nil }

    // MARK: - Live gate

    private var gateInput: PollGateInput {
        PollGateInput(sceneActive: sceneActive, status: status)
    }

    /// Same predicate the played round uses — one definition of "should this
    /// screen be receiving updates right now".
    private func updateLiveGate() {
        guard !unavailable else { return }
        if shouldPoll(gateInput) {
            openLive()
        } else {
            let fully = sceneActive
            Task { await self.closeLive(fully: fully) }
        }
    }

    private func openLive() {
        if degraded {
            startPollTimer()
            return
        }
        if feedSuspended {
            feedSuspended = false
            Task { await self.feed.resume() }
            return
        }
        guard !feedRunning else { return }
        feedRunning = true
        feedTask = Task { [weak self, feed, roundId] in
            // The stream KEY is the round id here, not a token — see
            // `LiveResultFeed.Endpoint`.
            let stream = await feed.start(token: roundId, since: nil)
            for await update in stream {
                guard let self else { return }
                await self.handle(update)
            }
        }
    }

    private func closeLive(fully: Bool) async {
        stopPollTimer()
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
        } else if feedRunning, !feedSuspended {
            feedSuspended = true
            await feed.suspend()
        }
    }

    private func handle(_ update: LiveResultFeed.Update) async {
        switch update {
        case .event(let event):
            applyRemoteStatus(event.status)
            await load()
        case .degraded:
            degraded = true
            if shouldPoll(gateInput) { startPollTimer() }
        case .finished:
            await load()
            await closeLive(fully: true)
        }
    }

    private func applyRemoteStatus(_ remote: LiveRoundStatus) {
        switch remote {
        case .notStarted: status = .notStarted
        case .active: status = .active
        case .complete: status = .complete
        }
    }

    private func startPollTimer() {
        guard pollTask == nil else { return }
        pollTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(LiveResultFeed.fallbackPollInterval))
                guard let self, !Task.isCancelled else { return }
                await self.load()
            }
        }
    }

    private func stopPollTimer() {
        pollTask?.cancel()
        pollTask = nil
    }
}
