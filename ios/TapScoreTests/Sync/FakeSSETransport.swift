import Foundation
@testable import TapScore

/// Scripted `SSETransport` for the sync tests: no sockets, no server, and the
/// connection outcomes chosen per attempt so reconnect and degrade policy are
/// exercised deterministically.
actor FakeSSETransport: SSETransport {
    /// What the next `open` does.
    enum Script: Sendable {
        /// The request never produced a response (offline, DNS, timeout).
        case failure
        /// A response with a status and content type, no body. Used for the
        /// terminal cases: 404 (unknown token) and a wrong content type.
        case response(status: Int, contentType: String?)
        /// A 200 `text/event-stream` that yields these chunks and then ends.
        case stream([String])
        /// A 200 `text/event-stream` that stays open. The test pushes into it
        /// through `push(_:)` and closes it with `endOpenStream()`.
        case openStream
    }

    private var scripts: [Script]
    private var openContinuations: [AsyncThrowingStream<Data, any Error>.Continuation] = []
    /// Every request the client made, in order — the `Last-Event-ID` evidence.
    private(set) var requests: [URLRequest] = []

    init(_ scripts: [Script]) {
        self.scripts = scripts
    }

    func open(_ request: URLRequest) async throws -> SSEResponse {
        requests.append(request)
        // Running out of script means "still broken": the client keeps failing
        // until its own policy stops it, which is what the tests assert on.
        let script = scripts.isEmpty ? .failure : scripts.removeFirst()

        switch script {
        case .failure:
            throw URLError(.notConnectedToInternet)
        case let .response(status, contentType):
            return SSEResponse(
                statusCode: status,
                contentType: contentType,
                chunks: AsyncThrowingStream { $0.finish() }
            )
        case let .stream(chunks):
            return SSEResponse(
                statusCode: 200,
                contentType: "text/event-stream",
                chunks: AsyncThrowingStream { continuation in
                    for chunk in chunks { continuation.yield(Data(chunk.utf8)) }
                    continuation.finish()
                }
            )
        case .openStream:
            let (stream, continuation) = AsyncThrowingStream<Data, any Error>.makeStream()
            openContinuations.append(continuation)
            return SSEResponse(
                statusCode: 200,
                contentType: "text/event-stream",
                chunks: stream
            )
        }
    }

    /// Pushes a chunk into the most recent open stream.
    func push(_ chunk: String) {
        openContinuations.last?.yield(Data(chunk.utf8))
    }

    func endOpenStream() {
        openContinuations.last?.finish()
    }

    func requestCount() -> Int { requests.count }

    func header(_ name: String, at index: Int) -> String? {
        guard requests.indices.contains(index) else { return nil }
        return requests[index].value(forHTTPHeaderField: name)
    }

    func url(at index: Int) -> URL? {
        guard requests.indices.contains(index) else { return nil }
        return requests[index].url
    }
}

/// Backoff must cost the tests nothing; the policy under test is the strike
/// counting, not the sleeping.
let instantSleeper: SSEClient.Sleeper = { _ in }
