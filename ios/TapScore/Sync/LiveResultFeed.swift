import Foundation

/// The policy layer over `SSEClient`: turns SSE frames into typed live-result
/// events, owns the cursor, and owns the scene-phase contract.
///
/// This is the half of `src/round/live-result.ts` that is *not* framing — the
/// part that decides what a payload means and what the caller should do when
/// the stream gives up. It deliberately knows nothing about SwiftUI: it exposes
/// a surface, and the round screen wires it (N4 wiring is not this file's job).
///
/// **Wire contract** (`server/api/friendly-rounds-events.ts`): single-line JSON
/// `{"latestEventId": string|null, "status": "not_started"|"active"|"complete"}`
/// with the SSE `id:` field set to the cursor, `: keep-alive` comments in
/// between, and a stream that ENDS after emitting on a completed round. There
/// are no deltas — the client refetches through the ordinary cursored result
/// path; a frame is a doorbell, not a payload.
///
/// **Degrade contract**: after three consecutive connection failures — or
/// immediately on a non-2xx / wrong-content-type response, e.g. the 404 an
/// unknown token gets — the feed emits `.degraded`, sets `state` to `.degraded`
/// and finishes its stream. The caller falls back to polling every
/// `fallbackPollInterval` seconds. Restarting is an explicit `start()`.
///
/// **Liveness**: a connection that delivers no bytes at all — not even the
/// server's 25s `: keep-alive` — for `SSEClient.Configuration.idleTimeout` is
/// presumed dead (the silent wifi→cellular handoff) and reconnected from the
/// cursor. That counts as one ordinary connection failure, so three of them in
/// a row still degrade.
///
/// **Completion contract**: the server ENDS the stream on a completed round.
/// A clean end after a frame carrying `status: "complete"` is the round being
/// over — the feed emits `.finished`, sets `state` to `.finished` and stops;
/// it must not reconnect, because every reopen would succeed, reset the
/// backoff and end again (a tight loop, never a degrade). A clean end WITHOUT
/// that status is a proxy hiccup and keeps the ordinary reconnect path.
///
/// **Malformed frames are ignored** and do not count towards degrading: a frame
/// we cannot read is a bug or a proxy mangling the stream, not a connectivity
/// problem, and conflating the two would degrade a perfectly live round.

/// The round lifecycle as it rides on every frame.
///
/// It is on *every* message, not just the last, because the stream ends on a
/// completed round and a reconnecting client would otherwise loop forever on a
/// round that is already over. Its own type rather than a generated one: this
/// is the SSE wire vocabulary, and it must not move when an unrelated endpoint's
/// status enum is regenerated.
enum LiveRoundStatus: String, Codable, Sendable, Equatable {
    case notStarted = "not_started"
    case active
    case complete
}

/// One decoded frame.
struct LiveResultEvent: Codable, Sendable, Equatable {
    /// The round's `latest_event_id`, or nil before any event exists.
    let latestEventId: String?
    let status: LiveRoundStatus
}

actor LiveResultFeed {
    /// What a consumer of `start()` sees. `.degraded` is terminal and always
    /// the last element.
    enum Update: Sendable, Equatable {
        case event(LiveResultEvent)
        case degraded
        /// The round is over and the server closed the stream. Terminal like
        /// `.degraded`, but the caller must NOT start the fallback poll.
        case finished
    }

    /// Caller-visible connection state, so the round screen can show a chip and
    /// decide whether its poll timer should be running.
    enum State: Sendable, Equatable {
        case idle
        case connecting
        /// A connection is up. Frames may still be minutes apart.
        case live
        /// Backgrounded via `suspend()`. Not an error — `resume()` reconnects.
        case suspended
        /// Gave up. The caller polls every `fallbackPollInterval` seconds.
        case degraded
        /// The round completed and the server closed the stream. Nothing left
        /// to stream and nothing to poll for. Only `start()` leaves this state.
        case finished
        case stopped
    }

    /// The Phase 3.5 interval the caller falls back to. Seconds.
    static let fallbackPollInterval: TimeInterval = 20

    private let configuration: APIConfiguration
    private let transport: any SSETransport
    private let cursors: ResultCursorStore
    private let clientConfiguration: SSEClient.Configuration
    private let sleeper: SSEClient.Sleeper
    /// The liveness watchdog's clock (see the note at the top of `SSEClient`).
    /// Injectable for the same reason the backoff sleeper is, and separate from
    /// it because a test that makes backoff free must not thereby declare every
    /// connection instantly silent.
    private let idleSleeper: SSEClient.Sleeper

    private var token: String?
    private var client: SSEClient?
    private var pump: Task<Void, Never>?
    private var continuation: AsyncStream<Update>.Continuation?

    private(set) var state: State = .idle

    init(
        configuration: APIConfiguration,
        transport: any SSETransport = URLSessionSSETransport(),
        cursors: ResultCursorStore = ResultCursorStore(),
        clientConfiguration: SSEClient.Configuration = SSEClient.Configuration(),
        sleeper: @escaping SSEClient.Sleeper = { try await Task.sleep(for: $0) },
        idleSleeper: @escaping SSEClient.Sleeper = { try await Task.sleep(for: $0) }
    ) {
        self.configuration = configuration
        self.transport = transport
        self.cursors = cursors
        self.clientConfiguration = clientConfiguration
        self.sleeper = sleeper
        self.idleSleeper = idleSleeper
    }

    /// Opens the feed for a share token and returns its update stream.
    ///
    /// `since` defaults to the persisted cursor for the token. Starting an
    /// already-running feed replaces it — the old stream is finished, not left
    /// dangling.
    func start(token: String, since: String? = nil) async -> AsyncStream<Update> {
        await stop()
        self.token = token
        let (stream, continuation) = AsyncStream<Update>.makeStream(bufferingPolicy: .unbounded)
        self.continuation = continuation
        connect(since: since ?? cursors.cursor(for: token))
        return stream
    }

    /// Drops the connection but keeps the feed — and its stream — alive.
    ///
    /// The background half of the `ScenePhaseCoordinator` contract: iOS
    /// suspends the socket anyway, and a server left with a dead subscriber
    /// plus a client that believes it is live is exactly how a round shows
    /// stale scores. Idempotent; a no-op once degraded or stopped.
    func suspend() async {
        guard state == .connecting || state == .live else { return }
        await tearDownClient()
        state = .suspended
    }

    /// Reconnects after `suspend()`, resuming from the **persisted** cursor.
    ///
    /// The caller must refetch the result snapshot *first*: the reconnect only
    /// guarantees events after the cursor, and 9a's server re-emits current
    /// state on connect rather than replaying history, so anything that
    /// happened while suspended reaches the screen through the refetch, not
    /// through the stream.
    func resume() {
        guard state == .suspended, let token else { return }
        connect(since: cursors.cursor(for: token))
    }

    /// Closes everything and finishes the stream. Idempotent.
    ///
    /// Always ends in `.stopped`, whatever came before — including `.degraded`
    /// and `.finished`. A stopped feed that still reports `.degraded` would
    /// leave the caller polling a feed nobody is running, forever.
    func stop() async {
        await tearDownClient()
        continuation?.finish()
        continuation = nil
        token = nil
        state = .stopped
    }

    /// The URL the feed connects to. Exposed for tests and for the poll
    /// fallback's sibling code to stay in step with the query shape.
    nonisolated func url(token: String, since: String?) -> URL {
        var components = URLComponents(
            url: configuration.baseURL.appendingPathComponent("friendly-rounds/events"),
            resolvingAgainstBaseURL: false
        )
        var items = [URLQueryItem(name: "token", value: token)]
        if let since { items.append(URLQueryItem(name: "since", value: since)) }
        components?.queryItems = items
        // The base URL is a compile-time constant plus a fixed path, so this
        // cannot fail in practice; falling back keeps the API non-optional.
        return components?.url ?? configuration.baseURL.appendingPathComponent("friendly-rounds/events")
    }

    // MARK: - Internals

    private func connect(since: String?) {
        guard let token, let continuation else { return }
        state = .connecting
        let client = SSEClient(
            request: URLRequest(url: url(token: token, since: since)),
            transport: transport,
            configuration: clientConfiguration,
            lastEventId: nil, // `since` rides in the URL; the header is for reconnects.
            sleeper: sleeper,
            idleSleeper: idleSleeper,
            // The completion gate. The server ends the stream on a completed
            // round, so a client that only knew about framing would reopen,
            // reset its backoff, get another immediate end, and spin. The
            // status rides on every frame precisely so this is decidable here.
            isFinalFrame: { frame in Self.decode(frame.data)?.status == .complete }
        )
        self.client = client
        pump = Task { [weak self] in
            let events = await client.start()
            for await event in events {
                guard let self else { return }
                await self.handle(event, from: client, continuation: continuation)
            }
        }
    }

    private func handle(
        _ event: SSEClient.Event,
        from client: SSEClient,
        continuation: AsyncStream<Update>.Continuation
    ) async {
        // A late event from a client we already replaced (suspend → resume, or
        // a restart) must not move state backwards.
        guard self.client === client else { return }

        switch event {
        case .open:
            state = .live
        case let .frame(frame):
            guard let decoded = Self.decode(frame.data) else { return }
            if let cursor = decoded.latestEventId, let token {
                // Write-through: the frame's id IS the result cursor, so a
                // resume after a kill starts from the last frame actually seen.
                cursors.remember(token: token, cursor: cursor)
            }
            continuation.yield(.event(decoded))
        case .degraded:
            state = .degraded
            continuation.yield(.degraded)
            await closeStream(continuation)
        case .finished:
            state = .finished
            continuation.yield(.finished)
            await closeStream(continuation)
        }
    }

    /// Terminal hand-off, called **from the pump task**: finishes the update
    /// stream and stops the client, but deliberately does NOT await the pump —
    /// that is the task running this very function, and awaiting it here would
    /// deadlock. The pump's own loop ends by itself: the client has already
    /// finished its event stream by the time it emits a terminal event.
    private func closeStream(_ continuation: AsyncStream<Update>.Continuation) async {
        continuation.finish()
        self.continuation = nil
        pump = nil
        let client = self.client
        self.client = nil
        await client?.stop()
    }

    /// A frame we cannot read is dropped — never counted, never surfaced.
    private static func decode(_ data: String) -> LiveResultEvent? {
        guard let bytes = data.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(LiveResultEvent.self, from: bytes)
    }

    /// Cancels the pump, **waits for it to actually be gone**, and only then
    /// stops the client.
    ///
    /// The order matters and so does the awaiting. A fire-and-forget
    /// `Task { await client.stop() }` races the pump — and, through it, the
    /// client's own `start()` — over the same actor state: a suspend/resume in
    /// quick succession could land the old client's `stop()` after the new
    /// one's `start()`, killing the connection that just replaced it.
    ///
    /// Never call this from the pump task itself; see `closeStream`.
    private func tearDownClient() async {
        let pump = self.pump
        self.pump = nil
        pump?.cancel()
        await pump?.value
        let client = self.client
        self.client = nil
        await client?.stop()
    }
}
