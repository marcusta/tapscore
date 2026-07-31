import XCTest
@testable import TapScore

/// The policy layer: payload decoding, cursor write-through, the degrade
/// hand-off to polling, and the scene-phase (`suspend`/`resume`) contract.
final class LiveResultFeedTests: XCTestCase {
    private var defaults: UserDefaults!
    private var suiteName: String!

    override func setUp() {
        super.setUp()
        suiteName = "tapscore.tests.feed.\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suiteName)
    }

    override func tearDown() {
        defaults.removePersistentDomain(forName: suiteName)
        defaults = nil
        suiteName = nil
        super.tearDown()
    }

    private func makeFeed(_ transport: FakeSSETransport, cursors: ResultCursorStore) -> LiveResultFeed {
        LiveResultFeed(
            configuration: .dev,
            transport: transport,
            cursors: cursors,
            clientConfiguration: .init(
                maxConsecutiveFailures: 3,
                initialBackoff: .milliseconds(1),
                maxBackoff: .milliseconds(1)
            ),
            sleeper: instantSleeper
        )
    }

    /// Polls a condition instead of sleeping a fixed amount: the connection
    /// comes up on the client's task, and a fixed sleep is either flaky or slow.
    private func waitUntil(
        _ description: String,
        timeout: TimeInterval = 5,
        _ condition: @Sendable () async -> Bool
    ) async throws {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if await condition() { return }
            try await Task.sleep(for: .milliseconds(5))
        }
        XCTFail("Timed out waiting for: \(description)")
    }

    private static func frame(id: String, status: String) -> String {
        "id: \(id)\ndata: {\"latestEventId\":\"\(id)\",\"status\":\"\(status)\"}\n\n"
    }

    // MARK: - Events

    func testDecodesFramesAndWritesTheCursorThrough() async throws {
        let transport = FakeSSETransport([.openStream])
        let cursors = ResultCursorStore(defaults: defaults)
        let feed = makeFeed(transport, cursors: cursors)

        let stream = await feed.start(token: "tok")
        var iterator = stream.makeAsyncIterator()
        try await waitUntil("the feed to report .live") { await feed.state == .live }
        await transport.push(Self.frame(id: "evt-3", status: "active"))

        let update = await iterator.next()

        XCTAssertEqual(
            update,
            .event(LiveResultEvent(latestEventId: "evt-3", status: .active))
        )
        XCTAssertEqual(
            cursors.cursor(for: "tok"),
            "evt-3",
            "The frame's id IS the result cursor; a resume after a kill needs it on disk."
        )
        await feed.stop()
    }

    func testMalformedFramesAreIgnoredAndTheFeedStaysLive() async throws {
        let transport = FakeSSETransport([.openStream])
        let feed = makeFeed(transport, cursors: ResultCursorStore(defaults: defaults))

        let stream = await feed.start(token: "tok")
        var iterator = stream.makeAsyncIterator()
        try await waitUntil("the feed to report .live") { await feed.state == .live }
        await transport.push("data: not-json-at-all\n\n")
        await transport.push("data: {\"latestEventId\":\"x\",\"status\":\"nonsense\"}\n\n")
        await transport.push(Self.frame(id: "evt-1", status: "complete"))

        let update = await iterator.next()

        XCTAssertEqual(
            update,
            .event(LiveResultEvent(latestEventId: "evt-1", status: .complete)),
            "Unreadable frames are dropped, never surfaced and never counted."
        )
        let state = await feed.state
        XCTAssertEqual(state, .live)
        await feed.stop()
    }

    func testStartUsesThePersistedCursorAsSince() async throws {
        let transport = FakeSSETransport([.openStream])
        let cursors = ResultCursorStore(defaults: defaults)
        cursors.remember(token: "tok", cursor: "evt-99")
        let feed = makeFeed(transport, cursors: cursors)

        _ = await feed.start(token: "tok")
        try await waitUntil("the first request") { await transport.requestCount() == 1 }

        let url = await transport.url(at: 0)?.absoluteString
        XCTAssertEqual(
            url,
            "http://localhost:3030/api/friendly-rounds/events?token=tok&since=evt-99"
        )
        await feed.stop()
    }

    // MARK: - Degrade

    func testDegradeSurfacesAsAnUpdateAndAsState() async throws {
        let transport = FakeSSETransport([.failure, .failure, .failure])
        let feed = makeFeed(transport, cursors: ResultCursorStore(defaults: defaults))

        let stream = await feed.start(token: "tok")
        var updates: [LiveResultFeed.Update] = []
        for await update in stream { updates.append(update) }

        XCTAssertEqual(updates, [.degraded], "The caller's cue to start the 20 s poll.")
        let state = await feed.state
        XCTAssertEqual(state, .degraded)
        XCTAssertEqual(LiveResultFeed.fallbackPollInterval, 20)
    }

    func testStopAfterDegradingStillEndsInStopped() async throws {
        let transport = FakeSSETransport([.response(status: 404, contentType: "application/json")])
        let feed = makeFeed(transport, cursors: ResultCursorStore(defaults: defaults))

        let stream = await feed.start(token: "tok")
        for await _ in stream {}

        await feed.stop()

        let state = await feed.state
        XCTAssertEqual(
            state, .stopped,
            "A stopped feed that still reports .degraded leaves the caller polling forever."
        )
    }

    // MARK: - Completion

    func testACompletedRoundFinishesTheFeedAndNeverReconnects() async throws {
        // The server emits one frame and ENDS the stream on a completed round.
        // The script has a single entry: any reconnect shows up as a second
        // request (the fake answers `.failure` once the script runs out).
        let transport = FakeSSETransport([.stream([Self.frame(id: "evt-9", status: "complete")])])
        let feed = makeFeed(transport, cursors: ResultCursorStore(defaults: defaults))

        let stream = await feed.start(token: "tok")
        var updates: [LiveResultFeed.Update] = []
        for await update in stream { updates.append(update) }

        XCTAssertEqual(
            updates,
            [.event(LiveResultEvent(latestEventId: "evt-9", status: .complete)), .finished]
        )
        let state = await feed.state
        XCTAssertEqual(state, .finished, "Not .degraded — there is nothing left to poll for.")
        let attempts = await transport.requestCount()
        XCTAssertEqual(attempts, 1, "A finished round must not reopen the stream, ever.")
    }

    func testACleanEndMidRoundStillReconnects() async throws {
        // Same clean end, but the last status was `active`: a proxy hiccup.
        let transport = FakeSSETransport([
            .stream([Self.frame(id: "evt-1", status: "active")]),
            .openStream,
        ])
        let feed = makeFeed(transport, cursors: ResultCursorStore(defaults: defaults))

        let stream = await feed.start(token: "tok")
        var iterator = stream.makeAsyncIterator()
        let first = await iterator.next()

        XCTAssertEqual(first, .event(LiveResultEvent(latestEventId: "evt-1", status: .active)))
        try await waitUntil("the reconnect") { await transport.requestCount() == 2 }
        try await waitUntil("the feed to be live again") { await feed.state == .live }
        await feed.stop()
    }

    // MARK: - Scene phase

    func testResumeReconnectsWithThePersistedCursorAndKeepsTheStream() async throws {
        let transport = FakeSSETransport([.openStream, .openStream])
        let cursors = ResultCursorStore(defaults: defaults)
        let feed = makeFeed(transport, cursors: cursors)

        let stream = await feed.start(token: "tok")
        var iterator = stream.makeAsyncIterator()
        try await waitUntil("the feed to report .live") { await feed.state == .live }
        await transport.push(Self.frame(id: "evt-4", status: "active"))
        _ = await iterator.next()

        await feed.suspend()
        let suspended = await feed.state
        XCTAssertEqual(suspended, .suspended)

        await feed.resume()
        try await waitUntil("the reconnect") { await transport.requestCount() == 2 }

        let url = await transport.url(at: 1)?.absoluteString
        XCTAssertEqual(
            url,
            "http://localhost:3030/api/friendly-rounds/events?token=tok&since=evt-4",
            "Resume must reconnect from the PERSISTED cursor, not from a cold start."
        )

        // The same stream survives the suspend/resume round trip — a screen
        // that re-subscribed on every foreground would drop frames in between.
        try await waitUntil("the feed to report .live again") { await feed.state == .live }
        await transport.push(Self.frame(id: "evt-5", status: "active"))
        let afterResume = await iterator.next()
        XCTAssertEqual(
            afterResume,
            .event(LiveResultEvent(latestEventId: "evt-5", status: .active))
        )
        await feed.stop()
    }

    func testSuspendIsANoOpOnceDegraded() async throws {
        let transport = FakeSSETransport([.response(status: 404, contentType: "application/json")])
        let feed = makeFeed(transport, cursors: ResultCursorStore(defaults: defaults))

        let stream = await feed.start(token: "tok")
        for await _ in stream {}

        await feed.suspend()
        let state = await feed.state
        XCTAssertEqual(state, .degraded, "A degraded feed has nothing to suspend.")
    }

    // MARK: - Endpoints

    /// The two streams differ in exactly one thing: the URL and the credential
    /// riding in it. A spectator is authorized by their SESSION and never holds
    /// the round's write credential, so their stream key is the round id.
    func testTheSpectateStreamIsKeyedByRoundIdNotByToken() {
        let feed = LiveResultFeed(
            configuration: .dev,
            endpoint: .spectateRoundId,
            cursors: ResultCursorStore(defaults: defaults))

        let url = feed.url(token: "round-1", since: nil)

        XCTAssertEqual(url.path.hasSuffix("/spectate/events"), true, url.absoluteString)
        XCTAssertEqual(url.query, "roundId=round-1")
        XCTAssertFalse(
            url.absoluteString.contains("token"),
            "a share token is a write credential and must never key the watcher's stream")
    }

    /// The spectate read is uncursored — the watcher refetches the whole view —
    /// so a `since` must be dropped rather than promising a resume the server
    /// does not implement. The participant stream keeps it.
    func testSinceRidesOnlyTheStreamThatCanResume() {
        let cursors = ResultCursorStore(defaults: defaults)
        let spectate = LiveResultFeed(
            configuration: .dev, endpoint: .spectateRoundId, cursors: cursors)
        let participant = LiveResultFeed(
            configuration: .dev, endpoint: .friendlyRoundToken, cursors: cursors)

        XCTAssertEqual(spectate.url(token: "round-1", since: "c1").query, "roundId=round-1")
        XCTAssertEqual(
            participant.url(token: "tok", since: "c1").query, "token=tok&since=c1")
    }

    func testStopIsIdempotentAndFinishesTheStream() async throws {
        let transport = FakeSSETransport([.openStream])
        let feed = makeFeed(transport, cursors: ResultCursorStore(defaults: defaults))

        let stream = await feed.start(token: "tok")
        var iterator = stream.makeAsyncIterator()
        try await waitUntil("the feed to report .live") { await feed.state == .live }

        await feed.stop()
        await feed.stop()

        let terminal = await iterator.next()
        XCTAssertNil(terminal)
        let state = await feed.state
        XCTAssertEqual(state, .stopped)
    }
}
