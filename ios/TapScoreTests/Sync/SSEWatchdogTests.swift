import XCTest

@testable import TapScore

/// The liveness watchdog (owner field report, 2026-07-28).
///
/// The bug it exists for is invisible to every other test in this file's
/// neighbourhood: on a wifi→cellular handoff the TCP connection dies, the
/// transport reports nothing at all, and the client sits on a socket that will
/// never produce another byte. Nothing here can be asserted by "waiting for an
/// error" — there is no error. Silence IS the signal, so these tests drive the
/// watchdog's own clock by hand and assert what the client does with it.
///
/// The web sibling's window is 75s against this client's 60s, and that
/// asymmetry is deliberate — see the note at the top of `SSEClient.swift`.
final class SSEWatchdogTests: XCTestCase {
    private static let url = URL(string: "http://localhost:3030/api/friendly-rounds/events?token=t")!

    /// A `Sleeper` that hands out its waiters one at a time.
    ///
    /// `TestClock.fire()` releases everything pending, which cannot express the
    /// question these tests ask: "does a heartbeat make the OLD window
    /// harmless?" That needs the stale waiter released while the fresh one is
    /// left alone.
    private final class IdleClock: @unchecked Sendable {
        private let lock = NSLock()
        private var waiters: [CheckedContinuation<Void, any Error>] = []
        private var requested: [Duration] = []

        var sleeper: SSEClient.Sleeper {
            { [self] duration in
                try await withCheckedThrowingContinuation { continuation in
                    lock.lock()
                    requested.append(duration)
                    waiters.append(continuation)
                    lock.unlock()
                }
            }
        }

        /// How many liveness windows have been armed so far. One per (re)connect
        /// plus one per chunk received.
        var armCount: Int {
            lock.lock()
            defer { lock.unlock() }
            return requested.count
        }

        var durations: [Duration] {
            lock.lock()
            defer { lock.unlock() }
            return requested
        }

        var pendingCount: Int {
            lock.lock()
            defer { lock.unlock() }
            return waiters.count
        }

        /// Elapse the OLDEST outstanding window only. Superseded windows are
        /// still outstanding here — the client cancels their task but nothing
        /// removes the continuation — which is exactly what makes them worth
        /// firing on purpose.
        func fireOldest() {
            lock.lock()
            let waiter = waiters.isEmpty ? nil : waiters.removeFirst()
            lock.unlock()
            waiter?.resume()
        }

        /// Elapse every outstanding window, oldest first: the live one trips,
        /// the superseded ones must not.
        func fireAll() {
            lock.lock()
            let pending = waiters
            waiters = []
            lock.unlock()
            for waiter in pending { waiter.resume() }
        }
    }

    private func makeClient(
        _ transport: FakeSSETransport,
        idle: IdleClock,
        maxFailures: Int = 3,
        idleTimeout: Duration = .seconds(60)
    ) -> SSEClient {
        SSEClient(
            request: URLRequest(url: Self.url),
            transport: transport,
            configuration: .init(
                maxConsecutiveFailures: maxFailures,
                initialBackoff: .milliseconds(1),
                maxBackoff: .milliseconds(1),
                idleTimeout: idleTimeout
            ),
            sleeper: instantSleeper,
            idleSleeper: idle.sleeper
        )
    }

    private func waitUntil(
        _ description: String,
        timeout: TimeInterval = 5,
        file: StaticString = #filePath,
        line: UInt = #line,
        _ condition: () async -> Bool
    ) async {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if await condition() { return }
            try? await Task.sleep(for: .milliseconds(2))
        }
        XCTFail("timed out waiting for \(description)", file: file, line: line)
    }

    // MARK: - The window

    /// The window is armed on connect — before a single byte. A stream that
    /// opens and then says nothing is as dead as one that goes quiet later, and
    /// it is the 60s the field report settled on, not some other number.
    func testTheWindowIsArmedOnConnectAtTheConfiguredTimeout() async {
        let transport = FakeSSETransport([.openStream])
        let idle = IdleClock()
        let client = makeClient(transport, idle: idle)

        let stream = await client.start()
        var iterator = stream.makeAsyncIterator()
        _ = await iterator.next() // .open

        await waitUntil("the liveness window to be armed") { idle.pendingCount > 0 }
        XCTAssertEqual(idle.durations.first, .seconds(60))
        await client.stop()
    }

    /// Silence tears the dead connection down and reopens it FROM THE CURSOR —
    /// the whole point: a reconnect that replayed from nothing would either miss
    /// events or re-deliver the round from scratch.
    func testSilenceReconnectsWithLastEventID() async {
        let transport = FakeSSETransport([.openStream, .openStream])
        let idle = IdleClock()
        let client = makeClient(transport, idle: idle)

        let stream = await client.start()
        var iterator = stream.makeAsyncIterator()
        _ = await iterator.next() // .open
        // Wait for the CONNECT window to register before pushing anything —
        // the same order the heartbeat test uses, and not optional. Arming is
        // an unstructured task that appends to the clock when it runs, and a
        // chunk arriving first cancels the connect window before it ever got
        // that far: `armCount` would then stop at 1 and the wait below would
        // time out at random. Sequencing the two arms removes the race.
        await waitUntil("the first window") { idle.armCount == 1 }

        await transport.push("id: evt-3\ndata: {\"latestEventId\":\"evt-3\",\"status\":\"active\"}\n\n")
        let frame = await iterator.next()
        XCTAssertEqual(frame, .frame(SSEFrame(id: "evt-3", data: "{\"latestEventId\":\"evt-3\",\"status\":\"active\"}")))

        // Now the pipe dies silently: no error, no close, just nothing. The
        // frame re-armed the window, so it is the SECOND one that has to trip.
        await waitUntil("the frame to re-arm the window") { idle.armCount == 2 }
        idle.fireAll()

        let reopened = await iterator.next()
        XCTAssertEqual(reopened, .open, "silence must be treated as a dead connection")
        let attempts = await transport.requestCount()
        XCTAssertEqual(attempts, 2)
        let header = await transport.header("Last-Event-ID", at: 1)
        XCTAssertEqual(header, "evt-3", "the reconnect must resume from the last id seen")
        await client.stop()
    }

    /// A heartbeat comment frames nothing — and still proves the pipe is alive.
    ///
    /// This is the asymmetry with the web client made concrete: `EventSource`
    /// never sees `: keep-alive`, this client does, and the whole 60s window
    /// depends on it. The stale window is elapsed here, and the client must not
    /// so much as twitch.
    func testHeartbeatCommentsResetTheWindow() async {
        let transport = FakeSSETransport([.openStream, .openStream])
        let idle = IdleClock()
        let client = makeClient(transport, idle: idle)

        let stream = await client.start()
        var iterator = stream.makeAsyncIterator()
        _ = await iterator.next() // .open
        await waitUntil("the first window") { idle.armCount == 1 }

        await transport.push(": keep-alive\n\n")
        await waitUntil("the heartbeat to re-arm the window") { idle.armCount == 2 }

        // Elapse the window the heartbeat superseded. It must be inert.
        idle.fireOldest()
        try? await Task.sleep(for: .milliseconds(20))
        let attempts = await transport.requestCount()
        XCTAssertEqual(attempts, 1, "a superseded window must not trip a reconnect")

        // And the connection is genuinely still usable.
        await transport.push("data: {\"latestEventId\":\"evt-9\",\"status\":\"active\"}\n\n")
        let frame = await iterator.next()
        XCTAssertEqual(frame, .frame(SSEFrame(id: nil, data: "{\"latestEventId\":\"evt-9\",\"status\":\"active\"}")))
        await client.stop()
    }

    // MARK: - Degrade counting

    /// A trip is a NETWORK failure: countable, not terminal. One trip plus two
    /// refused connects is three strikes, and the third one degrades.
    func testATripCountsAsOneFailureTowardsDegrading() async {
        let transport = FakeSSETransport([.openStream, .failure, .failure])
        let idle = IdleClock()
        let client = makeClient(transport, idle: idle)

        let drained = Task { () -> [SSEClient.Event] in
            var events: [SSEClient.Event] = []
            for await event in await client.start() { events.append(event) }
            return events
        }
        await waitUntil("the first window") { idle.armCount == 1 }
        idle.fireOldest()
        let events = await drained.value

        let attempts = await transport.requestCount()
        XCTAssertEqual(events, [.open, .degraded])
        XCTAssertEqual(
            attempts, 3,
            "the trip must count exactly once: one trip + two refused connects = three strikes")
    }

    /// …and it is not terminal on its own. A trip followed by a healthy
    /// reconnect resets the count, exactly like any other recovered failure.
    func testATripAloneDoesNotDegrade() async {
        let transport = FakeSSETransport([.openStream, .openStream])
        let idle = IdleClock()
        let client = makeClient(transport, idle: idle, maxFailures: 3)

        let stream = await client.start()
        var iterator = stream.makeAsyncIterator()
        _ = await iterator.next() // .open
        await waitUntil("the first window") { idle.armCount == 1 }
        idle.fireOldest()

        let reopened = await iterator.next()
        XCTAssertEqual(reopened, .open, "one silent connection is a hiccup, not a give-up")
        await client.stop()
    }

    /// `idleTimeout <= .zero` turns the watchdog off entirely — the escape hatch
    /// for anything that must not be reconnected on silence.
    func testAZeroTimeoutDisablesTheWatchdog() async {
        let transport = FakeSSETransport([.openStream])
        let idle = IdleClock()
        let client = makeClient(transport, idle: idle, idleTimeout: .zero)

        let stream = await client.start()
        var iterator = stream.makeAsyncIterator()
        _ = await iterator.next() // .open
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertEqual(idle.armCount, 0, "no window is armed at all")
        await client.stop()
    }

    // MARK: - Interaction with the completion gate

    /// A round that ended and then went silent is FINISHED, not failed: the
    /// server said its last word, and reconnecting would only reopen a stream
    /// that ends again.
    func testAFinalFrameOutranksTheWatchdog() async {
        let transport = FakeSSETransport([.openStream, .openStream])
        let idle = IdleClock()
        let client = SSEClient(
            request: URLRequest(url: Self.url),
            transport: transport,
            configuration: .init(
                maxConsecutiveFailures: 3,
                initialBackoff: .milliseconds(1),
                maxBackoff: .milliseconds(1),
                idleTimeout: .seconds(60)
            ),
            sleeper: instantSleeper,
            idleSleeper: idle.sleeper,
            isFinalFrame: { $0.data.contains("\"complete\"") }
        )

        let drained = Task { () -> [SSEClient.Event] in
            var events: [SSEClient.Event] = []
            for await event in await client.start() { events.append(event) }
            return events
        }
        await waitUntil("the first window") { idle.armCount == 1 }
        await transport.push("data: {\"latestEventId\":\"e9\",\"status\":\"complete\"}\n\n")
        await waitUntil("the frame to re-arm the window") { idle.armCount == 2 }
        idle.fireOldest() // the superseded window
        idle.fireOldest() // the live one: the server has gone quiet after the end
        let events = await drained.value

        XCTAssertEqual(events.last, .finished, "a completed round must not reconnect on silence")
        let attempts = await transport.requestCount()
        XCTAssertEqual(attempts, 1)
    }
}
