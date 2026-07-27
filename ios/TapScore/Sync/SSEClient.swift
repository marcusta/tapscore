import Foundation

// The transport half of the live-result feed (PHASES.md N4, mirroring
// `src/round/live-result.ts`).
//
// The web client gets `EventSource` for free: framing, reconnect, backoff and
// `Last-Event-ID` replay are all in the browser, and `live-result.ts` only owns
// the one decision the browser does not make — *when to stop retrying*. iOS has
// no `EventSource`, so everything the browser did lives here, and the degrade
// policy is kept byte-for-byte identical to the web rule so the two clients
// cannot disagree about when a round falls back to polling:
//
//   * `MAX_CONSECUTIVE_FAILURES` (3) failures with no successful open between
//     them ⇒ degrade.
//   * A successful open resets the counter (retries are working).
//   * A non-2xx status or a `Content-Type` that is not `text/event-stream` is
//     TERMINAL — degrade immediately. This mirrors the HTML spec rule the web
//     module keys off (`readyState === CLOSED`): the browser fires `error`
//     exactly once for those and never retries, so waiting for three strikes
//     would mean waiting forever, with neither a stream nor a fallback poll.
//   * A clean end AFTER a frame the caller marked final (`isFinalFrame`) is
//     terminal in the other direction: `.finished`, no reconnect, no poll. The
//     server ends the stream on a completed round, so without this gate every
//     reopen would succeed, reset the backoff, and end again — an unbounded
//     tight reconnect loop against a round that is already over. A clean end
//     WITHOUT that marker is still just a hiccup and still reconnects.
//   * A frame whose payload we cannot read is IGNORED and does not count. The
//     degrade counter is about connectivity alone. (Payload validation itself
//     is `LiveResultFeed`'s job — this layer stops at the SSE framing.)
//
// Everything is injectable: the transport (so tests never touch the network)
// and the sleeper (so backoff costs a test nothing).

// MARK: - Frames

/// One dispatched SSE event: the `data:` payload plus the `id:` that was in
/// force when it was dispatched.
///
/// `event:` and `retry:` are parsed and discarded — the tapscore stream uses
/// neither (`server/api/friendly-rounds-events.ts` emits default-type events
/// only), and inventing behaviour for fields the server never sends is how a
/// parser grows bugs nobody can reproduce.
struct SSEFrame: Sendable, Equatable {
    /// The last `id:` seen at dispatch time, or nil if the stream has not sent
    /// one yet. This is the value that goes back out as `Last-Event-ID`.
    let id: String?
    /// The concatenated `data:` lines, newline-joined, with no trailing newline.
    let data: String
}

/// Incremental, allocation-cheap SSE framing.
///
/// A value type fed arbitrary `Data` chunks: a caller may hand it one byte, one
/// line, three frames, or a chunk that splits a UTF-8 field name down the
/// middle, and the frame boundaries come out the same. That is not
/// hypothetical — `URLSession.bytes` hands over whatever the socket produced,
/// and a proxy is free to re-chunk mid-line.
///
/// Line terminators: LF, CRLF and a lone CR all end a line, per the SSE spec.
/// A trailing CR is only consumed once its LF arrives (or the stream ends), so
/// a chunk boundary between CR and LF cannot fabricate a blank line — a blank
/// line is what dispatches a frame, so getting this wrong splits one event
/// into two.
struct SSEFrameParser: Sendable {
    /// Bytes received but not yet terminated by a newline.
    private var pending: [UInt8] = []
    /// True when the previous chunk ended on a CR whose LF may still arrive.
    private var awaitingLineFeed = false
    private var dataLines: [String] = []
    private var eventId: String?

    /// The last `id:` field seen, across frames. The SSE spec keeps this in a
    /// buffer that survives dispatch, so an id-only frame still moves the
    /// reconnect cursor.
    private(set) var lastEventId: String?

    init() {}

    /// Feeds one chunk in and returns every frame it completed. Empty is the
    /// common answer — most chunks are half a line.
    mutating func consume(_ chunk: Data) -> [SSEFrame] {
        var frames: [SSEFrame] = []
        for byte in chunk {
            if awaitingLineFeed {
                awaitingLineFeed = false
                // The LF of a CRLF pair: the line already ended on the CR.
                if byte == 0x0A { continue }
            }
            switch byte {
            case 0x0A:
                if let frame = endLine() { frames.append(frame) }
            case 0x0D:
                awaitingLineFeed = true
                if let frame = endLine() { frames.append(frame) }
            default:
                pending.append(byte)
            }
        }
        return frames
    }

    /// Flushes a stream that ended without a final newline. The SSE spec
    /// discards such a trailing partial line, and so do we — the only reason
    /// this exists is to drop the buffer.
    mutating func finish() {
        pending.removeAll()
        awaitingLineFeed = false
    }

    private mutating func endLine() -> SSEFrame? {
        // Invalid UTF-8 is dropped rather than substituted: a mangled line is
        // not a connection failure, and replacement characters would only turn
        // it into a payload the next layer has to reject anyway.
        let line = String(decoding: pending, as: UTF8.self)
        pending.removeAll(keepingCapacity: true)

        if line.isEmpty { return dispatch() }
        if line.hasPrefix(":") { return nil } // `: keep-alive` and friends.

        let field: Substring
        var value: Substring
        if let colon = line.firstIndex(of: ":") {
            field = line[line.startIndex..<colon]
            value = line[line.index(after: colon)...]
            // Exactly one leading space is part of the framing, not the value.
            if value.first == " " { value = value.dropFirst() }
        } else {
            // A line with no colon is a field with an empty value (spec). We
            // have no such field, so it is silently ignored — this is the
            // "malformed line" path, and it deliberately costs nothing.
            field = line[...]
            value = ""
        }

        switch field {
        case "data":
            dataLines.append(String(value))
        case "id":
            // The spec ignores an id containing NUL; nothing else is rejected.
            if !value.contains("\0") {
                eventId = String(value)
                lastEventId = String(value)
            }
        default:
            break // `event:`, `retry:`, anything unknown.
        }
        return nil
    }

    private mutating func dispatch() -> SSEFrame? {
        defer {
            dataLines.removeAll(keepingCapacity: true)
            eventId = nil
        }
        // A blank line with no data (an id-only block, or the blank line after
        // a comment) dispatches nothing — but `lastEventId` has already moved.
        guard !dataLines.isEmpty else { return nil }
        return SSEFrame(id: eventId ?? lastEventId, data: dataLines.joined(separator: "\n"))
    }
}

// MARK: - Transport seam

/// One opened SSE response: the status line, the content type, and the body as
/// chunks. Split from `URLSession` so tests drive the client without a socket.
struct SSEResponse: Sendable {
    let statusCode: Int
    let contentType: String?
    let chunks: AsyncThrowingStream<Data, any Error>

    init(statusCode: Int, contentType: String?, chunks: AsyncThrowingStream<Data, any Error>) {
        self.statusCode = statusCode
        self.contentType = contentType
        self.chunks = chunks
    }
}

/// The single call `SSEClient` makes against the network.
protocol SSETransport: Sendable {
    /// Opens the request and returns as soon as the response HEAD is in — the
    /// body arrives over `SSEResponse.chunks`. Throwing means the request never
    /// produced a response (offline, DNS, TLS, timeout): a countable failure,
    /// not a terminal one.
    func open(_ request: URLRequest) async throws -> SSEResponse
}

/// The production transport: `URLSession.bytes(for:)`.
///
/// Bytes are re-assembled into line-sized chunks before they are handed on.
/// The parser does not need that — it handles any chunking — but yielding one
/// `Data` per byte would allocate once per byte for the whole life of a round.
struct URLSessionSSETransport: SSETransport {
    private let session: URLSession

    /// Defaults to a session with an effectively unbounded request timeout: a
    /// live stream is *supposed* to sit idle between scores, and the default
    /// 60 s timeout would tear it down mid-round and burn a reconnect.
    init(session: URLSession = URLSessionSSETransport.makeSession()) {
        self.session = session
    }

    /// A day, not 0. `timeoutIntervalForRequest = 0` is NOT documented as
    /// "infinite" — Foundation is free to treat a non-positive value as
    /// "use the default", which would silently reinstate the 60 s teardown this
    /// setting exists to avoid. A large explicit value has no such ambiguity,
    /// and 24 h is far longer than any round.
    static let requestTimeout: TimeInterval = 24 * 60 * 60

    static func makeSession() -> URLSession {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = requestTimeout
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        return URLSession(configuration: configuration)
    }

    func open(_ request: URLRequest) async throws -> SSEResponse {
        let (bytes, response) = try await session.bytes(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw SSEClientError.notHTTP
        }
        let chunks = AsyncThrowingStream<Data, any Error> { continuation in
            let task = Task {
                var buffer = Data()
                do {
                    for try await byte in bytes {
                        buffer.append(byte)
                        if byte == 0x0A {
                            continuation.yield(buffer)
                            buffer.removeAll(keepingCapacity: true)
                        }
                    }
                    if !buffer.isEmpty { continuation.yield(buffer) }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
        return SSEResponse(
            statusCode: http.statusCode,
            contentType: http.value(forHTTPHeaderField: "Content-Type"),
            chunks: chunks
        )
    }
}

enum SSEClientError: Error, Equatable, Sendable {
    case notHTTP
}

// MARK: - Client

/// Reconnecting SSE reader with the web client's degrade policy.
///
/// Owns one connection at a time and re-opens it with capped exponential
/// backoff, replaying `Last-Event-ID` from the newest `id:` it has seen, until
/// either the caller stops it or the policy gives up.
actor SSEClient {
    /// What the caller sees. `.degraded` is terminal and always the last
    /// element — the stream finishes right behind it.
    enum Event: Sendable, Equatable {
        /// A connection came up. Emitted on every (re)connect, so a caller that
        /// showed a "reconnecting" chip can clear it.
        case open
        case frame(SSEFrame)
        /// The policy gave up. Fall back to polling.
        case degraded
        /// The server said its last word and closed. Terminal, like `.degraded`,
        /// but the opposite instruction: there is nothing left to poll for.
        ///
        /// Emitted only when a stream ends cleanly *after* a frame the caller's
        /// `isFinalFrame` accepted. Without this, a completed round — where the
        /// server emits one frame and ends the stream, which is exactly what
        /// `friendly-rounds-events.ts` does — resets the backoff on every open
        /// and reconnects in a tight loop forever.
        case finished
    }

    struct Configuration: Sendable {
        /// Consecutive failures — no successful open between them — before
        /// degrading. 3, exactly as `MAX_CONSECUTIVE_ERRORS` in `live-result.ts`.
        var maxConsecutiveFailures: Int = 3
        var initialBackoff: Duration = .seconds(1)
        var maxBackoff: Duration = .seconds(30)
        var backoffMultiplier: Int = 2

        init(
            maxConsecutiveFailures: Int = 3,
            initialBackoff: Duration = .seconds(1),
            maxBackoff: Duration = .seconds(30),
            backoffMultiplier: Int = 2
        ) {
            self.maxConsecutiveFailures = maxConsecutiveFailures
            self.initialBackoff = initialBackoff
            self.maxBackoff = maxBackoff
            self.backoffMultiplier = backoffMultiplier
        }
    }

    /// Injected so tests do not pay real backoff time.
    typealias Sleeper = @Sendable (Duration) async throws -> Void

    /// "Was that the server's last word?", asked of every dispatched frame.
    ///
    /// Payload meaning is one layer up — this client stops at SSE framing — so
    /// the *decision* is injected and the *sequencing* is not: the predicate
    /// runs inline, in frame order, on the same actor that will act on it, so
    /// there is no window where a reconnect races the caller's reading of the
    /// final frame. Defaults to "never final" (plain reconnecting client).
    typealias FinalFramePredicate = @Sendable (SSEFrame) -> Bool

    private let request: URLRequest
    private let transport: any SSETransport
    private let configuration: Configuration
    private let sleeper: Sleeper
    private let isFinalFrame: FinalFramePredicate

    private var task: Task<Void, Never>?
    private var continuation: AsyncStream<Event>.Continuation?
    private var failures = 0
    private var backoff: Duration
    private var stopped = false
    /// Set when `isFinalFrame` accepted a frame on the CURRENT connection.
    /// Reset on every open: a mid-round proxy hiccup after an old "complete"
    /// must not be mistaken for the round ending again.
    private var sawFinalFrame = false

    /// The newest `id:` seen on any connection; sent as `Last-Event-ID` on the
    /// next attempt. Readable so `LiveResultFeed` can persist it.
    private(set) var lastEventId: String?

    init(
        request: URLRequest,
        transport: any SSETransport,
        configuration: Configuration = Configuration(),
        lastEventId: String? = nil,
        sleeper: @escaping Sleeper = { try await Task.sleep(for: $0) },
        isFinalFrame: @escaping FinalFramePredicate = { _ in false }
    ) {
        self.request = request
        self.transport = transport
        self.configuration = configuration
        self.lastEventId = lastEventId
        self.sleeper = sleeper
        self.isFinalFrame = isFinalFrame
        self.backoff = configuration.initialBackoff
    }

    /// Starts the connection loop and returns its event stream.
    ///
    /// One client drives one connection and one consumer. Starting an already
    /// running client tears the old connection down first and finishes the old
    /// stream, rather than silently orphaning a continuation nobody will ever
    /// see another frame on.
    ///
    /// The old loop is **awaited**, not merely cancelled: it mutates `failures`,
    /// `backoff` and `lastEventId`, so a still-unwinding previous attempt could
    /// otherwise reset the counters of the connection that just replaced it, or
    /// yield one last frame onto a stream its consumer has already dropped.
    func start() async -> AsyncStream<Event> {
        if let running = task {
            stop()
            await running.value
        }
        let (stream, continuation) = AsyncStream<Event>.makeStream(bufferingPolicy: .unbounded)
        self.continuation = continuation
        stopped = false
        failures = 0
        backoff = configuration.initialBackoff
        sawFinalFrame = false
        task = Task { [weak self] in
            await self?.run(continuation)
        }
        return stream
    }

    /// Tears the connection down and finishes the stream. Idempotent.
    func stop() {
        guard !stopped else { return }
        stopped = true
        task?.cancel()
        task = nil
        continuation?.finish()
        continuation = nil
    }

    // MARK: - The loop

    private enum Outcome {
        /// The transport threw, or the body stream failed. Countable.
        case failed
        /// The stream ended cleanly with no final frame seen. Countable — a
        /// mid-round end is a proxy hiccup, and `EventSource` treats
        /// end-of-stream as an error + reconnect, so mirroring it keeps the two
        /// clients in step.
        case ended
        /// The stream ended cleanly after a frame `isFinalFrame` accepted: the
        /// round is over. Not countable, not retried — this is the gate the web
        /// client closes on `status === 'complete'`.
        case completed
        /// Non-2xx or wrong content type. Not countable — instantly fatal.
        case terminal
    }

    private func run(_ continuation: AsyncStream<Event>.Continuation) async {
        while !Task.isCancelled && !stopped {
            let outcome = await attempt(continuation)
            if stopped || Task.isCancelled { break }

            if outcome == .terminal {
                degrade(continuation)
                return
            }
            if outcome == .completed {
                finish(continuation)
                return
            }
            failures += 1
            if failures >= configuration.maxConsecutiveFailures {
                degrade(continuation)
                return
            }
            do {
                try await sleeper(backoff)
            } catch {
                break // Cancelled while sleeping.
            }
            backoff = min(backoff * configuration.backoffMultiplier, configuration.maxBackoff)
        }
        continuation.finish()
    }

    private func degrade(_ continuation: AsyncStream<Event>.Continuation) {
        continuation.yield(.degraded)
        continuation.finish()
        self.continuation = nil
        stopped = true
    }

    /// The round is over: terminal like `degrade`, but no fallback poll.
    private func finish(_ continuation: AsyncStream<Event>.Continuation) {
        continuation.yield(.finished)
        continuation.finish()
        self.continuation = nil
        stopped = true
    }

    private func attempt(_ continuation: AsyncStream<Event>.Continuation) async -> Outcome {
        let response: SSEResponse
        do {
            response = try await transport.open(currentRequest())
        } catch {
            return .failed
        }

        guard (200..<300).contains(response.statusCode) else { return .terminal }
        guard let contentType = response.contentType,
              contentType.lowercased().hasPrefix("text/event-stream")
        else { return .terminal }

        // Open succeeded: the retries are working, so the strike count and the
        // backoff both start over.
        failures = 0
        backoff = configuration.initialBackoff
        sawFinalFrame = false
        continuation.yield(.open)

        var parser = SSEFrameParser()
        do {
            for try await chunk in response.chunks {
                if stopped || Task.isCancelled { return .ended }
                for frame in parser.consume(chunk) {
                    if let id = frame.id { lastEventId = id }
                    if isFinalFrame(frame) { sawFinalFrame = true }
                    continuation.yield(.frame(frame))
                }
            }
        } catch {
            // A stream that *breaks* after the final frame is still a failure:
            // the server closes cleanly when it is done, and a mid-flight error
            // means we may not have seen everything.
            parser.finish()
            return .failed
        }
        parser.finish()
        return sawFinalFrame ? .completed : .ended
    }

    private func currentRequest() -> URLRequest {
        var next = request
        next.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        if let lastEventId {
            next.setValue(lastEventId, forHTTPHeaderField: "Last-Event-ID")
        }
        return next
    }
}
