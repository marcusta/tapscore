import XCTest
@testable import TapScore

/// Pins `TapScoreAPI`'s transport — the three things every generated endpoint
/// will inherit and that nothing else tests:
///
/// 1. **URL joining keeps the `/tapscore` prefix.** Production is not at the
///    domain root. `URL(string:relativeTo:)` or a leading-slash path would
///    silently drop the prefix and every call would 404 against the web app.
/// 2. **401 maps to `.unauthorized`,** not to a generic `.server(401, …)` —
///    `AppEnvironment.bootstrap()` keys token-wiping off exactly that case.
/// 3. **The bearer header is injected from the Keychain on every request.**
///    The token is read through a closure rather than cached, so this proves
///    the wiring end to end rather than a stored copy.
///
/// Everything runs against a `URLProtocol` stub: no network, no server.
final class TapScoreAPITransportTests: XCTestCase {
    /// A well-formed `GET /players/me` body for the generated `Player` model.
    private static let playerJSON = Data(
        #"{"id":"p1","username":"marcus","displayName":"Marcus Andersson"}"#.utf8
    )

    private var session: URLSession!

    override func setUp() {
        super.setUp()
        StubURLProtocol.reset(status: 200, body: Self.playerJSON)
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        session = URLSession(configuration: configuration)
    }

    override func tearDown() {
        session.invalidateAndCancel()
        session = nil
        StubURLProtocol.reset(status: 200, body: Data())
        super.tearDown()
    }

    // MARK: - 1. URL joining

    func testProductionMeHitsTheTapscorePrefixedPath() async throws {
        let api = TapScoreAPI(configuration: .production, session: session)

        let player = try await api.me()

        XCTAssertEqual(player.id, "p1")
        XCTAssertEqual(player.username, "marcus")
        XCTAssertEqual(
            StubURLProtocol.requests.map(\.url?.absoluteString),
            ["https://app.swedenindoorgolf.se/tapscore/api/players/me"],
            "The /tapscore deployment prefix must survive the base+path join."
        )
        XCTAssertEqual(StubURLProtocol.requests.first?.method, "GET")
        XCTAssertEqual(
            StubURLProtocol.requests.first?.cachePolicy,
            .reloadIgnoringLocalCacheData,
            "Live API state must never be satisfied from a stale local HTTP response."
        )
    }

    func testDevConfigurationJoinsWithoutAPrefix() async throws {
        let api = TapScoreAPI(configuration: .dev, session: session)

        _ = try await api.me()

        XCTAssertEqual(
            StubURLProtocol.requests.first?.url?.absoluteString,
            "http://localhost:3030/api/players/me"
        )
    }

    // MARK: - 2. Status mapping

    func testUnauthorizedStatusMapsToDotUnauthorized() async {
        StubURLProtocol.reset(status: 401, body: Data(#"{"error":"nope"}"#.utf8))
        let api = TapScoreAPI(configuration: .production, session: session)

        do {
            _ = try await api.me()
            XCTFail("A 401 must throw.")
        } catch let error as APIError {
            // Not `.server(code: 401, …)`: bootstrap() wipes the token on
            // `.unauthorized` and only on that.
            XCTAssertEqual(error, .unauthorized)
        } catch {
            XCTFail("Expected APIError, got \(error)")
        }
    }

    func testOtherErrorStatusesCarryTheServerMessage() async {
        StubURLProtocol.reset(status: 500, body: Data(#"{"error":"boom"}"#.utf8))
        let api = TapScoreAPI(configuration: .production, session: session)

        do {
            _ = try await api.me()
            XCTFail("A 500 must throw.")
        } catch let error as APIError {
            XCTAssertEqual(error, .server(code: 500, message: "boom"))
        } catch {
            XCTFail("Expected APIError, got \(error)")
        }
    }

    // MARK: - 3. Bearer injection

    func testBearerHeaderIsInjectedFromTheKeychainValue() async throws {
        let keychain = Keychain(service: "com.marcusandersson.tapscore.tests.\(UUID().uuidString)")
        defer { keychain.clear() }
        XCTAssertTrue(keychain.saveToken("stored-token-123"))

        // Wired exactly like AppEnvironment does it: a closure reading the
        // Keychain per request, never a captured copy.
        let api = TapScoreAPI(
            configuration: .production,
            session: session,
            tokenProvider: { keychain.loadToken() }
        )

        _ = try await api.me()

        XCTAssertEqual(
            StubURLProtocol.requests.first?.headers["Authorization"],
            "Bearer stored-token-123"
        )

        // Sign-out must take effect on the *next* request without re-wiring.
        keychain.clear()
        _ = try await api.me()
        XCTAssertNil(
            StubURLProtocol.requests.last?.headers["Authorization"],
            "Anonymous is a normal state — no header, not an empty bearer."
        )
    }

    func testAnonymousClientSendsNoAuthorizationHeader() async throws {
        let api = TapScoreAPI(configuration: .production, session: session)

        _ = try await api.me()

        XCTAssertNil(StubURLProtocol.requests.first?.headers["Authorization"])
        XCTAssertEqual(StubURLProtocol.requests.first?.headers["Accept"], "application/json")
    }

    // MARK: - 4. Path-parameter rendering

    /// An input whose path params are NUMBERS — the case that broke. Every
    /// scalar `JSONSerialization` hands back is an `NSNumber`, and `NSNumber`
    /// bridges to `Bool` by value, so a naive `case let bool as Bool` ahead of
    /// the number case turns `hole: 1` into `/holes/true`.
    private struct HoleRef: Codable, Sendable {
        let hole: Int
        let strokes: Int
    }

    private struct Ack: Codable, Sendable {
        let id: String
    }

    func testNumericPathParametersOfOneAndZeroStayNumbers() async throws {
        StubURLProtocol.reset(status: 200, body: Data(#"{"id":"ok"}"#.utf8))
        let api = TapScoreAPI(configuration: .dev, session: session)
        let endpoint = APIEndpoint<HoleRef, Ack>(
            method: .post,
            path: "/rounds/holes/:hole",
            pathParams: ["hole"]
        )

        // 1 and 0 are exactly the two integers that bridge to `true`/`false`.
        _ = try await api.send(endpoint, HoleRef(hole: 1, strokes: 4))
        _ = try await api.send(endpoint, HoleRef(hole: 0, strokes: 3))

        XCTAssertEqual(
            StubURLProtocol.requests.map(\.url?.absoluteString),
            [
                "http://localhost:3030/api/rounds/holes/1",
                "http://localhost:3030/api/rounds/holes/0",
            ],
            "A numeric path param must render as a number, never as true/false."
        )
        // The consumed param is stripped from the body; the rest survives.
        XCTAssertEqual(StubURLProtocol.requests.first?.json?["strokes"] as? Int, 4)
        XCTAssertNil(StubURLProtocol.requests.first?.json?["hole"])
    }

    /// The other half of the same fix: a genuine JSON `true`/`false` must not
    /// regress into `1`/`0` now that numbers are matched first.
    func testBooleanPathParametersStillRenderAsTrueAndFalse() async throws {
        struct FlagRef: Codable, Sendable { let locked: Bool }
        StubURLProtocol.reset(status: 200, body: Data(#"{"id":"ok"}"#.utf8))
        let api = TapScoreAPI(configuration: .dev, session: session)
        let endpoint = APIEndpoint<FlagRef, Ack>(
            method: .post,
            path: "/rounds/locked/:locked",
            pathParams: ["locked"]
        )

        _ = try await api.send(endpoint, FlagRef(locked: true))
        _ = try await api.send(endpoint, FlagRef(locked: false))

        XCTAssertEqual(
            StubURLProtocol.requests.map(\.url?.absoluteString),
            [
                "http://localhost:3030/api/rounds/locked/true",
                "http://localhost:3030/api/rounds/locked/false",
            ]
        )
    }
}

/// Intercepts every request made through a session configured with it, records
/// what was sent, and replies with a canned status + body.
final class StubURLProtocol: URLProtocol {
    /// The parts of an outbound request these tests assert on. Value type so it
    /// crosses the concurrency boundary without dragging `URLRequest` along.
    struct Recorded: Sendable {
        let url: URL?
        let method: String?
        let cachePolicy: URLRequest.CachePolicy
        let headers: [String: String]
        /// The outbound JSON body, or nil for a body-less request. Read from
        /// `httpBodyStream` as well as `httpBody`: URLSession converts the
        /// former on the way into a URLProtocol, so reading only `httpBody`
        /// records nil for every request the transport actually sent.
        let body: Data?

        /// The body decoded as a JSON object, for assertions that care about
        /// which keys were sent rather than about byte order.
        var json: [String: Any]? {
            body.flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] }
        }
    }

    private static let lock = NSLock()
    nonisolated(unsafe) private static var status = 200
    nonisolated(unsafe) private static var body = Data()
    nonisolated(unsafe) private static var recorded: [Recorded] = []
    /// Path-suffix overrides in REGISTRATION ORDER, first match wins.
    ///
    /// An array rather than a dictionary because suffixes can overlap
    /// (`/players/me` and `/me`), and a dictionary's iteration order is
    /// unspecified — two overlapping stubs would pick a different winner per
    /// run and the test would fail on someone else's machine.
    nonisolated(unsafe) private static var overrides: [(suffix: String, status: Int, body: Data)] = []

    /// Clears the log and arms the next response. Call from `setUp` and again
    /// in any test that needs a different status.
    static func reset(status: Int, body: Data) {
        lock.lock()
        defer { lock.unlock() }
        Self.status = status
        Self.body = body
        overrides = []
        recorded = []
    }

    /// Arms a DIFFERENT answer for one path suffix, leaving the catch-all in
    /// place. Needed by any flow that makes two calls with different shapes —
    /// the password door posts `/auth/native/login` and then reads `/players/me`,
    /// and one canned body cannot be both. Cleared by `reset`, so a test that
    /// never calls it behaves exactly as before.
    ///
    /// Registration order decides: the FIRST stub whose suffix matches answers.
    static func stub(path: String, status: Int, body: Data) {
        lock.lock()
        defer { lock.unlock() }
        overrides.append((suffix: path, status: status, body: body))
    }

    /// Every request seen since the last `reset`, in order.
    static var requests: [Recorded] {
        lock.lock()
        defer { lock.unlock() }
        return recorded
    }

    private static func log(_ request: Recorded) -> (Int, Data) {
        lock.lock()
        defer { lock.unlock() }
        recorded.append(request)
        let path = request.url?.path ?? ""
        if let override = overrides.first(where: { path.hasSuffix($0.suffix) }) {
            return (override.status, override.body)
        }
        return (status, body)
    }

    /// `httpBody` is nil by the time a request reaches a URLProtocol — the
    /// loader has turned it into a stream — so drain the stream when present.
    private static func bodyData(of request: URLRequest) -> Data? {
        if let body = request.httpBody { return body }
        guard let stream = request.httpBodyStream else { return nil }
        stream.open()
        defer { stream.close() }
        var data = Data()
        let size = 4096
        var buffer = [UInt8](repeating: 0, count: size)
        while stream.hasBytesAvailable {
            let read = stream.read(&buffer, maxLength: size)
            if read <= 0 { break }
            data.append(buffer, count: read)
        }
        return data.isEmpty ? nil : data
    }

    override class func canInit(with request: URLRequest) -> Bool { true }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let (status, body) = Self.log(
            Recorded(
                url: request.url,
                method: request.httpMethod,
                cachePolicy: request.cachePolicy,
                headers: request.allHTTPHeaderFields ?? [:],
                body: Self.bodyData(of: request)
            )
        )
        let response = HTTPURLResponse(
            url: request.url ?? URL(string: "https://invalid.example")!,
            statusCode: status,
            httpVersion: "HTTP/1.1",
            headerFields: ["Content-Type": "application/json"]
        )!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: body)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}
