import XCTest
@testable import TapScore

/// `AppEnvironment.probeCredentialsIfNeeded()` — specifically **when it is
/// allowed to give up**.
///
/// The failure this suite exists for was invisible: the "already asked" flag was
/// set BEFORE the request, so the first probe of a session was also the last
/// one. A probe that failed for any reason — a moment offline, a 500, a body
/// this build could not decode — left `credentials` on `.unknown` forever, and
/// `.unknown` renders exactly like "already linked": no connect offer, no error,
/// nothing to retry. A player who genuinely needed to attach Apple simply could
/// not, until they relaunched.
///
/// So the rule under test is a pair, and both halves matter:
///
/// - a FAILED probe leaves the ask re-armed, so the next sheet tries again;
/// - a SUCCEEDED probe latches, so the answer is fetched once and not per view
///   appearance.
final class AccountProbeTests: XCTestCase {
    private var session: URLSession!
    private var keychain: Keychain!

    override func setUp() {
        super.setUp()
        StubURLProtocol.reset(status: 200, body: Data())
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        session = URLSession(configuration: configuration)
        keychain = Keychain(service: "com.marcusandersson.tapscore.tests.\(UUID().uuidString)")
    }

    override func tearDown() {
        keychain.clear()
        keychain = nil
        session.invalidateAndCancel()
        session = nil
        StubURLProtocol.reset(status: 200, body: Data())
        super.tearDown()
    }

    private static let passwordOnly = Data(#"{"providers":["password"]}"#.utf8)
    private static let linked = Data(#"{"providers":["password","apple"]}"#.utf8)

    /// A signed-in environment with the request log cleared, ready for the
    /// probe assertions to count from zero.
    @MainActor
    private func signedIn() async -> AppEnvironment {
        StubURLProtocol.reset(
            status: 200,
            body: Data(
                #"{"user":{"id":"p9","username":"marcus","displayName":"Marcus Andersson"},"token":"bearer-abc","created":false}"#.utf8
            )
        )
        let environment = AppEnvironment(configuration: .dev, keychain: keychain, session: session)
        _ = try? await environment.signIn(identityToken: "token", rawNonce: "nonce")
        return environment
    }

    /// Arms the next answer AND clears the log, so `requests.count` below is
    /// always "requests made since this line".
    private func arm(status: Int, body: Data) {
        StubURLProtocol.reset(status: status, body: body)
    }

    // MARK: - Failure must not be final

    /// The regression, stated end to end: one failed probe, then a good one,
    /// and the offer appears. Under the old latch the second probe never left
    /// the building and the sheet stayed silent for the whole session.
    @MainActor
    func testAFailedProbeIsRetriedAndTheOfferAppears() async {
        let environment = await signedIn()

        arm(status: 500, body: Data(#"{"error":"boom"}"#.utf8))
        await environment.probeCredentialsIfNeeded()
        XCTAssertEqual(StubURLProtocol.requests.count, 1, "The first probe was actually sent.")
        XCTAssertEqual(environment.credentials, .unknown, "A 500 is not a claim about the player.")
        XCTAssertFalse(
            AccountSheetRows(isSuperAdmin: false, credentials: environment.credentials)
                .showsConnectApple
        )

        arm(status: 200, body: Self.passwordOnly)
        await environment.probeCredentialsIfNeeded()
        XCTAssertEqual(
            StubURLProtocol.requests.count,
            1,
            "The failure re-armed the ask, so the second call reached the network."
        )
        XCTAssertEqual(environment.credentials, .known(["password"]))
        XCTAssertTrue(
            AccountSheetRows(isSuperAdmin: false, credentials: environment.credentials)
                .showsConnectApple,
            "Password-only is a positive answer: the offer is true and belongs on screen."
        )
    }

    /// Every failure direction re-arms, not just the transport ones. A body this
    /// build cannot decode is the interesting case — it is what a server that
    /// grew a third credential provider would send to a stale binary, and it
    /// must not be mistaken for a settled answer.
    @MainActor
    func testEveryFailureDirectionLeavesTheProbeReArmed() async {
        let failures: [(Int, Data)] = [
            (401, Data(#"{"error":"unauthorized"}"#.utf8)),
            (500, Data(#"{"error":"boom"}"#.utf8)),
            (200, Data(#"{"providers":["unrecognised"]}"#.utf8)),
            (200, Data(#"not json at all"#.utf8)),
        ]

        for (status, body) in failures {
            let environment = await signedIn()
            arm(status: status, body: body)
            await environment.probeCredentialsIfNeeded()
            XCTAssertEqual(environment.credentials, .unknown, "HTTP \(status) is not an answer.")

            arm(status: status, body: body)
            await environment.probeCredentialsIfNeeded()
            XCTAssertEqual(
                StubURLProtocol.requests.count,
                1,
                "HTTP \(status) must leave the ask re-armed for the next presentation."
            )
        }
    }

    // MARK: - Success is final

    /// The other half: once the server has answered, the answer is cached for
    /// the session. Nothing else can change it — a link made by this app sets
    /// `appleLinkedThisSession` on top rather than re-fetching.
    @MainActor
    func testASuccessfulProbeLatchesAndIsNotRepeated() async {
        let environment = await signedIn()

        arm(status: 200, body: Self.linked)
        await environment.probeCredentialsIfNeeded()
        XCTAssertEqual(environment.credentials, .known(["password", "apple"]))
        XCTAssertEqual(StubURLProtocol.requests.count, 1)

        arm(status: 500, body: Data(#"{"error":"boom"}"#.utf8))
        await environment.probeCredentialsIfNeeded()
        await environment.probeCredentialsIfNeeded()
        XCTAssertEqual(
            StubURLProtocol.requests.count,
            0,
            "A known answer is asked for once per session, however many times a view appears."
        )
        XCTAssertEqual(
            environment.credentials,
            .known(["password", "apple"]),
            "...and the later failures cannot un-know it."
        )
    }

    /// Concurrent callers — the account button's `.task` and the sheet's — must
    /// not both fire now that a clear latch no longer stops the second one.
    @MainActor
    func testOverlappingProbesSendOneRequest() async {
        let environment = await signedIn()
        arm(status: 200, body: Self.passwordOnly)

        async let first: Void = environment.probeCredentialsIfNeeded()
        async let second: Void = environment.probeCredentialsIfNeeded()
        async let third: Void = environment.probeCredentialsIfNeeded()
        _ = await (first, second, third)

        XCTAssertEqual(
            StubURLProtocol.requests.count,
            1,
            "One in flight at a time — re-arming on failure must not become a storm."
        )
        XCTAssertEqual(environment.credentials, .known(["password"]))
    }

    // MARK: - Who may ask at all

    @MainActor
    func testAnonymousNeverAsks() async {
        arm(status: 200, body: Self.passwordOnly)
        let environment = AppEnvironment(configuration: .dev, keychain: keychain, session: session)
        await environment.probeCredentialsIfNeeded()

        XCTAssertEqual(
            StubURLProtocol.requests.count,
            0,
            "The endpoint is about the bearer's own player; without one it is a guaranteed 401."
        )
        XCTAssertEqual(environment.credentials, .unknown)
    }

    /// Sign-out clears the answer AND the latch, so the next human on this
    /// device is answered on their own merits.
    @MainActor
    func testSignOutClearsTheAnswerAndTheLatch() async {
        let environment = await signedIn()
        arm(status: 200, body: Self.linked)
        await environment.probeCredentialsIfNeeded()
        XCTAssertEqual(environment.credentials, .known(["password", "apple"]))

        arm(status: 200, body: Data("{}".utf8))
        await environment.signOut()
        XCTAssertEqual(environment.credentials, .unknown)

        // A fresh sign-in on the same environment asks again.
        StubURLProtocol.reset(
            status: 200,
            body: Data(
                #"{"user":{"id":"p7","username":"bo","displayName":"Bo B."},"token":"bearer-xyz","created":false}"#.utf8
            )
        )
        _ = try? await environment.signIn(identityToken: "token", rawNonce: "nonce")
        arm(status: 200, body: Self.passwordOnly)
        await environment.probeCredentialsIfNeeded()

        XCTAssertEqual(StubURLProtocol.requests.count, 1)
        XCTAssertEqual(environment.credentials, .known(["password"]))
    }
}
