import XCTest
@testable import TapScore

/// The degrade policy, pinned against the web rule in `src/round/live-result.ts`
/// (`MAX_CONSECUTIVE_ERRORS = 3`, terminal `readyState === CLOSED` gives up at
/// once, a successful open resets the count).
///
/// Two clients that disagree about when a round stops streaming is exactly the
/// kind of drift the shared-spec rule in `ios/AGENTS.md` exists to prevent, so
/// these numbers are asserted, not assumed.
final class SSEClientTests: XCTestCase {
    private static let url = URL(string: "http://localhost:3030/api/friendly-rounds/events?token=t")!

    private func makeClient(
        _ transport: FakeSSETransport,
        maxFailures: Int = 3,
        isFinalFrame: @escaping SSEClient.FinalFramePredicate = { _ in false }
    ) -> SSEClient {
        SSEClient(
            request: URLRequest(url: Self.url),
            transport: transport,
            configuration: .init(
                maxConsecutiveFailures: maxFailures,
                initialBackoff: .milliseconds(1),
                maxBackoff: .milliseconds(1)
            ),
            sleeper: instantSleeper,
            isFinalFrame: isFinalFrame
        )
    }

    private func drain(_ client: SSEClient) async -> [SSEClient.Event] {
        var events: [SSEClient.Event] = []
        for await event in await client.start() { events.append(event) }
        return events
    }

    // MARK: - Happy path

    func testEmitsOpenThenFramesFromTheStream() async {
        let transport = FakeSSETransport([
            .stream([
                "id: evt-1\n",
                "data: {\"latestEventId\":\"evt-1\",\"status\":\"active\"}\n\n",
                ": keep-alive\n\n",
            ]),
        ])
        let client = makeClient(transport, maxFailures: 1)

        let events = await drain(client)

        XCTAssertEqual(events.first, .open)
        XCTAssertEqual(
            events.filter { if case .frame = $0 { return true } else { return false } }.count,
            1,
            "The keep-alive comment must not surface as a frame."
        )
        XCTAssertEqual(events.last, .degraded, "One allowed failure, and the stream ended.")
        let lastEventId = await client.lastEventId
        XCTAssertEqual(lastEventId, "evt-1")
    }

    // MARK: - Reconnect

    func testReconnectSendsLastEventIDFromTheNewestFrame() async {
        let transport = FakeSSETransport([
            .stream(["id: evt-7\ndata: {\"latestEventId\":\"evt-7\",\"status\":\"active\"}\n\n"]),
            .stream([]),
            .failure,
        ])
        let client = makeClient(transport)

        _ = await drain(client)

        let first = await transport.header("Last-Event-ID", at: 0)
        let second = await transport.header("Last-Event-ID", at: 1)
        XCTAssertNil(first, "A cold connect carries no cursor header — `since` rides in the URL.")
        XCTAssertEqual(second, "evt-7", "The reconnect must resume from the last id seen.")
    }

    // MARK: - Degrade policy

    func testThreeConsecutiveFailuresDegrade() async {
        let transport = FakeSSETransport([.failure, .failure, .failure])
        let client = makeClient(transport)

        let events = await drain(client)

        let attempts = await transport.requestCount()
        XCTAssertEqual(events, [.degraded])
        XCTAssertEqual(attempts, 3, "Exactly three strikes — no fourth try.")
    }

    func testTwoFailuresDoNotDegrade() async {
        // The stream stays alive after two strikes; the third attempt opens.
        let transport = FakeSSETransport([.failure, .failure, .openStream])
        let client = makeClient(transport)

        let stream = await client.start()
        var iterator = stream.makeAsyncIterator()
        let first = await iterator.next()

        XCTAssertEqual(first, .open, "Two failures must not give up.")
        await client.stop()
    }

    func testSuccessfulOpenResetsTheFailureCount() async {
        // fail, fail, open+end (resets, then the end counts 1), fail, fail → 3.
        let transport = FakeSSETransport([.failure, .failure, .stream([]), .failure, .failure])
        let client = makeClient(transport)

        let events = await drain(client)

        let attempts = await transport.requestCount()
        XCTAssertEqual(events, [.open, .degraded])
        XCTAssertEqual(
            attempts,
            5,
            "Without the reset this would have degraded on the third attempt."
        )
    }

    func testNonSuccessStatusDegradesImmediately() async {
        // The 404 an unknown share token gets — `friendly-rounds-events.ts`
        // refuses before the stream starts. Waiting three strikes would leave
        // the screen with neither a stream nor a poll fallback.
        let transport = FakeSSETransport([.response(status: 404, contentType: "application/json")])
        let client = makeClient(transport)

        let events = await drain(client)

        let attempts = await transport.requestCount()
        XCTAssertEqual(events, [.degraded])
        XCTAssertEqual(attempts, 1)
    }

    func testWrongContentTypeDegradesImmediately() async {
        // A captive portal or a proxy that answers 200 text/html is fatal in
        // exactly the same way a 404 is.
        let transport = FakeSSETransport([.response(status: 200, contentType: "text/html")])
        let client = makeClient(transport)

        let events = await drain(client)

        let attempts = await transport.requestCount()
        XCTAssertEqual(events, [.degraded])
        XCTAssertEqual(attempts, 1)
    }

    func testMalformedFramesDoNotCountTowardsDegrading() async {
        // Garbage on an otherwise healthy connection is a proxy problem, not a
        // connectivity problem: the connection survives it.
        let transport = FakeSSETransport([
            .stream(["data: not-json\n\n", "gibberish-with-no-colon\n", "\n"]),
            .openStream,
        ])
        let client = makeClient(transport)

        let stream = await client.start()
        var iterator = stream.makeAsyncIterator()
        var events: [SSEClient.Event] = []
        // open, the (unparsed-but-well-framed) data frame, then the reconnect's open.
        for _ in 0..<3 { if let next = await iterator.next() { events.append(next) } }

        XCTAssertEqual(events.first, .open)
        XCTAssertEqual(events.last, .open, "The client reconnected instead of degrading.")
        await client.stop()
    }

    // MARK: - Completion gate

    func testACleanEndAfterTheFinalFrameFinishesInsteadOfReconnecting() async {
        // Exactly what the server does on a completed round: one frame, then
        // the stream ends. Without the gate every reopen would succeed, reset
        // the backoff and end again — a tight loop that never even degrades.
        let transport = FakeSSETransport([
            .stream(["data: {\"latestEventId\":\"e9\",\"status\":\"complete\"}\n\n"]),
        ])
        let client = makeClient(transport, isFinalFrame: { $0.data.contains("\"complete\"") })

        let events = await drain(client)

        let attempts = await transport.requestCount()
        XCTAssertEqual(events.last, .finished, "Terminal, and NOT `.degraded`: nothing to poll for.")
        XCTAssertEqual(attempts, 1, "The round is over; the client must not reconnect even once.")
    }

    func testACleanEndWithoutTheFinalFrameStillReconnects() async {
        // A proxy dropping a mid-round stream is a hiccup, not an ending.
        let transport = FakeSSETransport([
            .stream(["data: {\"latestEventId\":\"e1\",\"status\":\"active\"}\n\n"]),
            .openStream,
        ])
        let client = makeClient(transport, isFinalFrame: { $0.data.contains("\"complete\"") })

        let stream = await client.start()
        var iterator = stream.makeAsyncIterator()
        _ = await iterator.next() // .open
        _ = await iterator.next() // .frame
        let reopened = await iterator.next()

        XCTAssertEqual(reopened, .open, "A mid-round end must keep the reconnect path.")
        await client.stop()
    }

    // MARK: - Lifecycle

    func testRestartingWaitsForThePreviousLoopBeforeReconnecting() async {
        let transport = FakeSSETransport([.openStream, .openStream])
        let client = makeClient(transport)

        let first = await client.start()
        var firstIterator = first.makeAsyncIterator()
        _ = await firstIterator.next() // .open

        // The old loop must be finished — not merely cancelled — before the new
        // one starts, or it could still reset the counters of its replacement.
        let second = await client.start()
        var secondIterator = second.makeAsyncIterator()

        let orphaned = await firstIterator.next()
        let reopened = await secondIterator.next()
        XCTAssertNil(orphaned, "The superseded stream is finished, not orphaned.")
        XCTAssertEqual(reopened, .open)
        let attempts = await transport.requestCount()
        XCTAssertEqual(attempts, 2)
        await client.stop()
    }

    func testStopFinishesTheStreamAndIsIdempotent() async {
        let transport = FakeSSETransport([.openStream])
        let client = makeClient(transport)

        let stream = await client.start()
        var iterator = stream.makeAsyncIterator()
        _ = await iterator.next() // .open

        await client.stop()
        await client.stop()

        let terminal = await iterator.next()
        XCTAssertNil(terminal, "stop() finishes the stream; no `.degraded` on a deliberate close.")
    }
}
