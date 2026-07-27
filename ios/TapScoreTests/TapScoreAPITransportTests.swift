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
    /// A well-formed `GET /auth/me` body for the generated `Player` model.
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
            ["https://app.swedenindoorgolf.se/tapscore/api/auth/me"],
            "The /tapscore deployment prefix must survive the base+path join."
        )
        XCTAssertEqual(StubURLProtocol.requests.first?.method, "GET")
    }

    func testDevConfigurationJoinsWithoutAPrefix() async throws {
        let api = TapScoreAPI(configuration: .dev, session: session)

        _ = try await api.me()

        XCTAssertEqual(
            StubURLProtocol.requests.first?.url?.absoluteString,
            "http://localhost:3030/api/auth/me"
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
}

/// Intercepts every request made through a session configured with it, records
/// what was sent, and replies with a canned status + body.
final class StubURLProtocol: URLProtocol {
    /// The parts of an outbound request these tests assert on. Value type so it
    /// crosses the concurrency boundary without dragging `URLRequest` along.
    struct Recorded: Sendable {
        let url: URL?
        let method: String?
        let headers: [String: String]
    }

    private static let lock = NSLock()
    nonisolated(unsafe) private static var status = 200
    nonisolated(unsafe) private static var body = Data()
    nonisolated(unsafe) private static var recorded: [Recorded] = []

    /// Clears the log and arms the next response. Call from `setUp` and again
    /// in any test that needs a different status.
    static func reset(status: Int, body: Data) {
        lock.lock()
        defer { lock.unlock() }
        Self.status = status
        Self.body = body
        recorded = []
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
        return (status, body)
    }

    override class func canInit(with request: URLRequest) -> Bool { true }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let (status, body) = Self.log(
            Recorded(
                url: request.url,
                method: request.httpMethod,
                headers: request.allHTTPHeaderFields ?? [:]
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
