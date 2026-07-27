import XCTest
@testable import TapScore

/// Native-track N4 auth: the nonce contract, the `/auth/apple` exchange, and
/// sign-out's revoke-then-wipe.
///
/// What is NOT here, and cannot be: the `SignInWithAppleButton` tap itself.
/// `ASAuthorizationController` needs a device with a signed-in Apple ID, so the
/// simulator can never produce a real credential. Everything on either side of
/// that boundary is covered below — nonce hashing, the request body, the
/// Keychain write, the state transition, revoke — and the tap is the one manual
/// step in the N4 gate.
final class AuthFlowTests: XCTestCase {
    /// A `POST /auth/apple` success body: the generated `Player` plus a token.
    private static let signInJSON = Data(
        #"{"user":{"id":"p9","username":"marcus","displayName":"Marcus Andersson"},"token":"bearer-abc"}"#.utf8
    )

    private var session: URLSession!
    private var keychain: Keychain!

    override func setUp() {
        super.setUp()
        StubURLProtocol.reset(status: 200, body: Self.signInJSON)
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        session = URLSession(configuration: configuration)
        // A per-test service string: the real Keychain is shared process state,
        // and a leaked token would make the next test's assertions lie.
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

    @MainActor
    private func makeEnvironment() -> AppEnvironment {
        AppEnvironment(configuration: .dev, keychain: keychain, session: session)
    }

    // MARK: - 1. The nonce contract

    /// THE CROSS-CLIENT VECTOR. The same pair is pinned in
    /// `server/services/apple-identity.test.ts`, where Bun's WebCrypto computes
    /// it. Two independent implementations agreeing on one sample is the only
    /// thing standing between us and every native sign-in 401-ing with
    /// `apple_nonce_mismatch` — a failure neither suite could see alone.
    func testNonceHashMatchesThePinnedServerVector() {
        let nonce = AppleSignInNonce(raw: "tapscore-nonce-vector-1")

        XCTAssertEqual(
            nonce.hashed,
            "18b0d0b1e8c4a4871b83352808fa1781c9f1f8c19038640719b2832996f65d1c",
            "Lowercase hex SHA-256 — the wire spelling server/services/apple-identity.ts pins."
        )
        XCTAssertEqual(nonce.raw, "tapscore-nonce-vector-1", "The pre-image must survive intact.")
        XCTAssertEqual(
            AppleSignInNonce.sha256Hex(""),
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "The standard empty-string digest, so a padding bug cannot hide behind one sample."
        )
    }

    func testRandomNonceIsFullLengthLowercaseHexAndUnpredictable() {
        let a = AppleSignInNonce.random()
        let b = AppleSignInNonce.random()

        XCTAssertEqual(a.raw.count, 64, "32 random bytes rendered as hex.")
        XCTAssertEqual(a.hashed.count, 64, "SHA-256 as hex.")
        XCTAssertNotEqual(a.raw, b.raw, "A reused nonce would defeat the binding entirely.")
        XCTAssertTrue(
            a.raw.allSatisfy { $0.isHexDigit && !$0.isUppercase },
            "Hex keeps the value escaping-free in both a URL and a JSON body."
        )
        // The round trip that matters: hashing the raw half again reproduces
        // exactly what Apple was given.
        XCTAssertEqual(AppleSignInNonce.sha256Hex(a.raw), a.hashed)
        XCTAssertNotEqual(a.raw, a.hashed, "The pre-image must never be what Apple echoes.")
    }

    func testJoinedNameKeepsNilDistinctFromEmpty() {
        var full = PersonNameComponents()
        full.givenName = "Åsa"
        full.familyName = "Öberg"
        XCTAssertEqual(SignInView.joinedName(full), "Åsa Öberg")

        var givenOnly = PersonNameComponents()
        givenOnly.givenName = "Bo"
        XCTAssertEqual(SignInView.joinedName(givenOnly), "Bo")

        // Apple sends the name once and only once; when it sends nothing, the
        // field must be ABSENT, not "", or a new player gets named "".
        XCTAssertNil(SignInView.joinedName(nil))
        XCTAssertNil(SignInView.joinedName(PersonNameComponents()))
        var blank = PersonNameComponents()
        blank.givenName = "  "
        XCTAssertNil(SignInView.joinedName(blank))
    }

    // MARK: - 2. Signed-out → signed-in

    @MainActor
    func testSignInPostsTheTokenAndRawNonceThenStoresTheBearer() async throws {
        let environment = makeEnvironment()
        await environment.bootstrap()
        XCTAssertEqual(environment.authState, .anonymous, "No stored token → anonymous.")

        let nonce = AppleSignInNonce.random()
        let player = try await environment.signIn(
            identityToken: "apple.identity.token",
            rawNonce: nonce.raw,
            fullName: "Åsa Öberg"
        )

        // The request.
        let request = try XCTUnwrap(StubURLProtocol.requests.last)
        XCTAssertEqual(request.method, "POST")
        XCTAssertEqual(request.url?.absoluteString, "http://localhost:3030/api/auth/apple")
        let body = try XCTUnwrap(request.json)
        XCTAssertEqual(body["identityToken"] as? String, "apple.identity.token")
        XCTAssertEqual(
            body["nonce"] as? String,
            nonce.raw,
            "The RAW nonce goes to our server; Apple got the hash."
        )
        XCTAssertNotEqual(
            body["nonce"] as? String,
            nonce.hashed,
            "Sending the hash here would make the server hash a hash — a guaranteed 401."
        )
        XCTAssertEqual(body["fullName"] as? String, "Åsa Öberg")

        // The result.
        XCTAssertEqual(player.username, "marcus")
        XCTAssertEqual(environment.authState, .signedIn(player))
        XCTAssertEqual(
            keychain.loadToken(),
            "bearer-abc",
            "The bearer must be in the Keychain before any view reacts to .signedIn."
        )
    }

    @MainActor
    func testSignInOmitsAbsentOptionalFieldsRatherThanSendingNull() async throws {
        let environment = makeEnvironment()

        try await environment.signIn(identityToken: "t", rawNonce: nil, fullName: nil)

        let body = try XCTUnwrap(StubURLProtocol.requests.last?.json)
        // `fullName: null` would be a THIRD state on the server (TriState), and
        // `nonce: null` fails the input schema. Absent means absent.
        XCTAssertNil(body["fullName"], "Absent, not null — the server distinguishes them.")
        XCTAssertNil(body["nonce"])
        XCTAssertEqual(body.keys.sorted(), ["identityToken"])
    }

    @MainActor
    func testARejectedSignInStoresNothingAndStaysAnonymous() async {
        StubURLProtocol.reset(status: 401, body: Data(#"{"error":"apple_nonce_mismatch"}"#.utf8))
        let environment = makeEnvironment()
        await environment.bootstrap()

        do {
            try await environment.signIn(identityToken: "t", rawNonce: "raw", fullName: nil)
            XCTFail("A 401 from /auth/apple must throw.")
        } catch {
            XCTAssertEqual(error as? APIError, .unauthorized)
        }

        XCTAssertNil(keychain.loadToken(), "A failed sign-in must leave no credential behind.")
        XCTAssertEqual(environment.authState, .anonymous)
    }

    // MARK: - 3. Sign out: revoke, then wipe unconditionally

    @MainActor
    func testSignOutRevokesWithTheBearerThenWipes() async throws {
        XCTAssertTrue(keychain.saveToken("live-token"))
        let environment = makeEnvironment()
        StubURLProtocol.reset(status: 200, body: Data(#"{"ok":true,"userId":"p9"}"#.utf8))

        await environment.signOut()

        let request = try XCTUnwrap(StubURLProtocol.requests.last)
        XCTAssertEqual(request.method, "POST")
        XCTAssertEqual(request.url?.absoluteString, "http://localhost:3030/api/auth/revoke")
        XCTAssertEqual(
            request.headers["Authorization"],
            "Bearer live-token",
            "Revoke must carry the token it is revoking — the server revokes the PRESENTED one."
        )
        XCTAssertNil(keychain.loadToken())
        XCTAssertEqual(environment.authState, .anonymous)
    }

    @MainActor
    func testSignOutWipesEvenWhenRevokeReturns401() async {
        // The already-dead-token case, and the reason the wipe is in a `defer`.
        // A 401 here means the server has ALREADY forgotten this token, which
        // is exactly the state sign-out wants; treating it as a failure would
        // strand the user signed-in with a credential nothing accepts.
        XCTAssertTrue(keychain.saveToken("stale-token"))
        let environment = makeEnvironment()
        StubURLProtocol.reset(status: 401, body: Data(#"{"error":"bearer_token_required"}"#.utf8))

        await environment.signOut()

        XCTAssertEqual(StubURLProtocol.requests.count, 1, "The revoke was still attempted.")
        XCTAssertNil(keychain.loadToken(), "A 401 is success for sign-out purposes.")
        XCTAssertEqual(environment.authState, .anonymous)
    }

    @MainActor
    func testSignOutWipesWhenTheServerIsUnreachable() async {
        XCTAssertTrue(keychain.saveToken("offline-token"))
        let environment = makeEnvironment()
        StubURLProtocol.reset(status: 500, body: Data())

        await environment.signOut()

        XCTAssertNil(
            keychain.loadToken(),
            "The local credential goes regardless; the server-side token expires on its own."
        )
        XCTAssertEqual(environment.authState, .anonymous)
    }
}
