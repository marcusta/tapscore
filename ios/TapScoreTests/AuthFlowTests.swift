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
    /// A `POST /auth/apple` success body for a RECOGNISED Apple id: the
    /// generated `Player`, a token, and `created:false`.
    private static let signInJSON = Data(
        #"{"user":{"id":"p9","username":"marcus","displayName":"Marcus Andersson"},"token":"bearer-abc","created":false}"#.utf8
    )

    /// The same, but the server had never seen this Apple id — the fork case.
    private static let createdJSON = Data(
        #"{"user":{"id":"p10","username":"newbie","displayName":"Newbie"},"token":"bearer-new","created":true}"#.utf8
    )

    /// A `POST /auth/native/login` success body. The framework answers with
    /// `AuthUser` — id and username only, no profile.
    private static let passwordLoginJSON = Data(
        #"{"user":{"id":"p9","username":"marcus"},"token":"bearer-pw"}"#.utf8
    )

    /// What `GET /players/me` answers: the full `Player` the login could not give.
    private static let meJSON = Data(
        #"{"id":"p9","username":"marcus","displayName":"Marcus Andersson"}"#.utf8
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
        XCTAssertEqual(AppleCredential.joinedName(full), "Åsa Öberg")

        var givenOnly = PersonNameComponents()
        givenOnly.givenName = "Bo"
        XCTAssertEqual(AppleCredential.joinedName(givenOnly), "Bo")

        // Apple sends the name once and only once; when it sends nothing, the
        // field must be ABSENT, not "", or a new player gets named "".
        XCTAssertNil(AppleCredential.joinedName(nil))
        XCTAssertNil(AppleCredential.joinedName(PersonNameComponents()))
        var blank = PersonNameComponents()
        blank.givenName = "  "
        XCTAssertNil(AppleCredential.joinedName(blank))
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

    // MARK: - 4. The password door (link-first identity joining, N5)

    @MainActor
    func testPasswordLoginStoresTheBearerAndSignsIn() async throws {
        StubURLProtocol.reset(status: 200, body: Self.passwordLoginJSON)
        StubURLProtocol.stub(path: "/players/me", status: 200, body: Self.meJSON)
        let environment = makeEnvironment()
        await environment.bootstrap()
        XCTAssertEqual(environment.authState, .anonymous)

        let player = try await environment.signInWithPassword(
            username: "marcus",
            password: "hunter2"
        )

        let request = try XCTUnwrap(StubURLProtocol.requests.first)
        XCTAssertEqual(request.method, "POST")
        XCTAssertEqual(
            request.url?.absoluteString,
            "http://localhost:3030/api/auth/native/login",
            "NOT /auth/login — the framework's cookie login owns that path and is mounted first."
        )
        let body = try XCTUnwrap(request.json)
        XCTAssertEqual(body["username"] as? String, "marcus")
        XCTAssertEqual(body["password"] as? String, "hunter2")

        // The profile read that turns a credential answer into a Player, and
        // it carries the NEW token — the Keychain has not been written yet.
        let profile = try XCTUnwrap(StubURLProtocol.requests.last)
        XCTAssertEqual(profile.url?.absoluteString, "http://localhost:3030/api/players/me")
        XCTAssertEqual(profile.headers["Authorization"], "Bearer bearer-pw")

        XCTAssertEqual(player.displayName, "Marcus Andersson", "Never invented from the username.")
        XCTAssertEqual(player.username, "marcus")
        XCTAssertEqual(environment.authState, .signedIn(player))
        XCTAssertEqual(
            keychain.loadToken(),
            "bearer-pw",
            "The password door lands in exactly the same session state as the Apple one."
        )
        XCTAssertFalse(
            environment.showsNewAccountNotice,
            "Signing in as an existing player is the opposite of forking one."
        )
    }

    @MainActor
    func testPasswordLogin401ReadsAsWrongCredentials() async {
        StubURLProtocol.reset(status: 401, body: Data(#"{"error":"invalid_credentials"}"#.utf8))
        let environment = makeEnvironment()

        do {
            try await environment.signInWithPassword(username: "marcus", password: "nope")
            XCTFail("A 401 must throw.")
        } catch {
            XCTAssertEqual(error as? APIError, .unauthorized)
            // The default `.unauthorized` copy is "Your session has expired" —
            // nonsense at a login form, where there was no session.
            XCTAssertEqual(SignInCopy.password(error), "Wrong username or password.")
        }
        XCTAssertNil(keychain.loadToken(), "A rejected login must leave no credential behind.")
        XCTAssertEqual(environment.authState, .unknown, "A failed login changes no state.")
    }

    @MainActor
    func testPasswordLogin429TellsTheUserToWait() async {
        StubURLProtocol.reset(status: 429, body: Data(#"{"error":"rate_limited"}"#.utf8))
        let environment = makeEnvironment()

        do {
            try await environment.signInWithPassword(username: "marcus", password: "hunter2")
            XCTFail("A 429 must throw.")
        } catch {
            XCTAssertEqual(error as? APIError, .server(code: 429, message: "rate_limited"))
            // The generic server copy would render "rate_limited (HTTP 429)",
            // which never mentions the one thing that helps: waiting.
            XCTAssertEqual(SignInCopy.password(error), "Too many attempts — wait a minute.")
        }
        XCTAssertNil(keychain.loadToken())
    }

    @MainActor
    func testPasswordLoginRevokesWhenTheProfileReadFails() async {
        // The window between "a session exists" and "this device knows who it
        // is". Nothing is stored yet, so walking away would leave a live
        // session with no copy of its token anywhere.
        StubURLProtocol.reset(status: 200, body: Self.passwordLoginJSON)
        StubURLProtocol.stub(path: "/players/me", status: 500, body: Data())
        let environment = makeEnvironment()

        do {
            try await environment.signInWithPassword(username: "marcus", password: "hunter2")
            XCTFail("A profile read we cannot complete is a failed sign-in.")
        } catch {
            XCTAssertEqual(error as? APIError, .server(code: 500, message: nil))
        }

        assertOrphanRevoke(of: "bearer-pw")
        XCTAssertNil(keychain.loadToken(), "Nothing was stored, so nothing is left behind.")
    }

    // MARK: - 5. The fork guard

    @MainActor
    func testCreatedTrueRaisesTheOneTimeNewAccountNotice() async throws {
        StubURLProtocol.reset(status: 200, body: Self.createdJSON)
        let environment = makeEnvironment()

        try await environment.signIn(identityToken: "t", rawNonce: "raw", fullName: "Newbie")

        XCTAssertTrue(
            environment.showsNewAccountNotice,
            "created:true is the only signal that a returning web user just forked themselves."
        )
        // It must not block anything: the session is fully live alongside it.
        XCTAssertEqual(keychain.loadToken(), "bearer-new")
        XCTAssertEqual(environment.authState, .signedIn(
            Player(id: "p10", username: "newbie", displayName: "Newbie")
        ))

        environment.dismissNewAccountNotice()
        XCTAssertFalse(environment.showsNewAccountNotice, "One time, then gone.")
    }

    @MainActor
    func testRecognisedAppleIdRaisesNoNotice() async throws {
        let environment = makeEnvironment() // signInJSON: created:false

        try await environment.signIn(identityToken: "t", rawNonce: "raw", fullName: nil)

        XCTAssertFalse(environment.showsNewAccountNotice)
    }

    /// Someone who just signed in THROUGH Apple must not then be offered
    /// "Connect Sign in with Apple" — the offer would be asking them to do the
    /// thing they just did.
    @MainActor
    func testSigningInWithAppleCountsAsLinkedForThisSession() async throws {
        let environment = makeEnvironment()

        try await environment.signIn(identityToken: "t", rawNonce: "raw", fullName: nil)

        XCTAssertTrue(environment.appleLinkedThisSession)
    }

    @MainActor
    func testPasswordLoginLeavesTheConnectOfferStanding() async throws {
        StubURLProtocol.reset(status: 200, body: Self.passwordLoginJSON)
        StubURLProtocol.stub(path: "/players/me", status: 200, body: Self.meJSON)
        let environment = makeEnvironment()

        try await environment.signInWithPassword(username: "marcus", password: "hunter2")

        XCTAssertFalse(
            environment.appleLinkedThisSession,
            "The password door says nothing about whether Apple is attached — that offer must stay."
        )
    }

    /// One limiter guards all three doors, so one sentence answers for all
    /// three. Three private copies would drift, and no single door's test would
    /// see it.
    func testEveryDoorSpeaksTheSame429() {
        let limited = APIError.server(code: 429, message: "rate_limited")

        XCTAssertEqual(SignInCopy.password(limited), "Too many attempts — wait a minute.")
        XCTAssertEqual(SignInCopy.appleSignIn(limited), SignInCopy.password(limited))
        XCTAssertEqual(SignInCopy.appleLink(limited), SignInCopy.password(limited))
        XCTAssertNil(SignInCopy.shared(APIError.unauthorized), "Door-specific, by design.")
    }

    // MARK: - 6. Linking Apple to the player we already are

    @MainActor
    func testLinkApplePostsWithTheBearerAndAdoptsTheNewToken() async throws {
        XCTAssertTrue(keychain.saveToken("bearer-pw"))
        let environment = makeEnvironment()
        StubURLProtocol.reset(status: 200, body: Self.signInJSON)

        try await environment.linkApple(identityToken: "apple.token", rawNonce: "raw-nonce")

        // `.first`, not `.last`: the link is followed by the revoke of the
        // bearer it replaced (see the test below).
        let request = try XCTUnwrap(StubURLProtocol.requests.first)
        XCTAssertEqual(request.url?.absoluteString, "http://localhost:3030/api/auth/apple")
        XCTAssertEqual(
            request.headers["Authorization"],
            "Bearer bearer-pw",
            "The bearer IS the difference between the create branch and the link branch."
        )
        let body = try XCTUnwrap(request.json)
        XCTAssertEqual(body["nonce"] as? String, "raw-nonce")
        XCTAssertNil(
            body["fullName"],
            "This player is already named; the server ignores the field outside the create branch."
        )

        XCTAssertEqual(
            keychain.loadToken(),
            "bearer-abc",
            "The link response issues a fresh bearer — dropping it would strand a live session."
        )
        XCTAssertTrue(environment.appleLinkedThisSession)
    }

    /// The old bearer is a LIVE session and this device holds the only copy of
    /// it. Overwriting the Keychain slot without revoking leaves a session
    /// nothing can ever kill — the same leak `adoptSession` exists to prevent,
    /// one step further along.
    @MainActor
    func testLinkAppleRevokesTheBearerItReplaced() async throws {
        XCTAssertTrue(keychain.saveToken("bearer-pw"))
        let environment = makeEnvironment()
        StubURLProtocol.reset(status: 200, body: Self.signInJSON)

        try await environment.linkApple(identityToken: "apple.token", rawNonce: "raw")

        XCTAssertEqual(StubURLProtocol.requests.count, 2, "The link, then the revoke.")
        let revoke = try XCTUnwrap(StubURLProtocol.requests.last)
        XCTAssertEqual(revoke.url?.absoluteString, "http://localhost:3030/api/auth/revoke")
        XCTAssertEqual(
            revoke.headers["Authorization"],
            "Bearer bearer-pw",
            "The OLD token is revoked by value — and only after the new one is stored."
        )
        XCTAssertEqual(
            keychain.loadToken(),
            "bearer-abc",
            "The replacement must survive the revoke of what it replaced."
        )
        XCTAssertTrue(environment.appleLinkedThisSession)
    }

    /// THE FORK ON THE LINK PATH. `/auth/apple` has no `requireAuth` and the
    /// middleware cannot tell an expired bearer from an absent one, so a stale
    /// session does not 401 — it takes the CREATE branch and mints a second
    /// player. Adopting that token would sign the device into the brand-new
    /// empty row while the inset says "connected": the app performing, in one
    /// tap, the exact fork this whole feature exists to warn about.
    @MainActor
    func testLinkAppleTreatsCreatedTrueAsAFailedLinkAndAdoptsNothing() async {
        XCTAssertTrue(keychain.saveToken("stale-token"))
        let environment = makeEnvironment()
        StubURLProtocol.reset(status: 200, body: Self.createdJSON)

        do {
            try await environment.linkApple(identityToken: "apple.token", rawNonce: "raw")
            XCTFail("created:true on the link path is a FAILED link, not a success.")
        } catch {
            XCTAssertEqual(error as? AppleLinkError, .sessionNotRecognised)
            XCTAssertEqual(
                SignInCopy.appleLink(error),
                "Your session had expired — sign in again, then connect Apple.",
                "Honest: it names the cause and the one action that fixes it."
            )
        }

        XCTAssertEqual(
            keychain.loadToken(),
            "stale-token",
            "No swap: the new token belongs to a different player row."
        )
        XCTAssertFalse(
            environment.appleLinkedThisSession,
            "Nothing was linked, so nothing may render as connected."
        )
        // The existing (probably dead) session is left exactly as it was — the
        // next 401 from any normal call is what resolves it.
        XCTAssertEqual(environment.authState, .unknown)
        assertOrphanRevoke(of: "bearer-new")
    }

    @MainActor
    func testLink409SaysTheAppleIdBelongsToAnotherAccount() async {
        XCTAssertTrue(keychain.saveToken("bearer-pw"))
        let environment = makeEnvironment()
        StubURLProtocol.reset(status: 409, body: Data(#"{"error":"apple_subject_taken"}"#.utf8))

        do {
            try await environment.linkApple(identityToken: "apple.token", rawNonce: "raw")
            XCTFail("A 409 must throw.")
        } catch {
            XCTAssertEqual(
                SignInCopy.appleLink(error),
                "That Apple ID is already connected to another account."
            )
        }
        XCTAssertFalse(
            environment.appleLinkedThisSession,
            "A refused link must never render as connected."
        )
        XCTAssertEqual(keychain.loadToken(), "bearer-pw", "The existing session is untouched.")
    }

    @MainActor
    func testSignOutClearsTheSessionLocalLinkAndNoticeFlags() async throws {
        StubURLProtocol.reset(status: 200, body: Self.createdJSON)
        let environment = makeEnvironment()
        try await environment.signIn(identityToken: "t", rawNonce: "raw", fullName: nil)
        XCTAssertTrue(environment.showsNewAccountNotice)

        StubURLProtocol.reset(status: 200, body: Data(#"{"ok":true,"userId":"p10"}"#.utf8))
        await environment.signOut()

        XCTAssertFalse(environment.showsNewAccountNotice, "The notice was about the account we left.")
        XCTAssertFalse(environment.appleLinkedThisSession)
    }

    // MARK: - 6b. The credentials probe (already-linked suppression)

    /// A signed-in session, built the way the account button meets one: a token
    /// in the Keychain, `bootstrap()` resolving it, and `/auth/credentials`
    /// armed with `body`/`status`.
    @MainActor
    private func signedInEnvironment(
        credentialsStatus: Int,
        credentialsBody: Data
    ) async -> AppEnvironment {
        StubURLProtocol.reset(status: 200, body: Self.meJSON)
        StubURLProtocol.stub(
            path: "/auth/credentials", status: credentialsStatus, body: credentialsBody)
        // `/me/roles` answers too, because `probeAccountIfNeeded()` asks both —
        // an unstubbed roles call would fall through to the `/players/me` body
        // and muddy the request counts below.
        StubURLProtocol.stub(path: "/me/roles", status: 200, body: Data("[]".utf8))
        XCTAssertTrue(keychain.saveToken("bearer-abc"))
        let environment = makeEnvironment()
        await environment.bootstrap()
        return environment
    }

    @MainActor
    func testCredentialsProbeReadsTheProvidersTheServerReports() async {
        let environment = await signedInEnvironment(
            credentialsStatus: 200,
            credentialsBody: Data(#"{"providers":["password"]}"#.utf8)
        )

        await environment.probeAccountIfNeeded()

        XCTAssertEqual(environment.credentials, .known(["password"]))
        XCTAssertTrue(
            AccountSheetRows(
                isSuperAdmin: false,
                credentials: environment.credentials,
                appleLinkedThisSession: environment.appleLinkedThisSession
            ).showsConnectApple
        )
        XCTAssertEqual(
            StubURLProtocol.requests.last?.url?.absoluteString,
            "http://localhost:3030/api/auth/credentials",
            "Through the generated descriptor and the one transport."
        )
    }

    @MainActor
    func testAnAppleCredentialSuppressesTheConnectOffer() async {
        let environment = await signedInEnvironment(
            credentialsStatus: 200,
            credentialsBody: Data(#"{"providers":["password","apple"]}"#.utf8)
        )

        await environment.probeAccountIfNeeded()

        XCTAssertEqual(environment.credentials, .known(["password", "apple"]))
        XCTAssertFalse(
            AccountSheetRows(isSuperAdmin: false, credentials: environment.credentials)
                .showsConnectApple
        )
    }

    /// **Every failure is `.unknown`, and `.unknown` offers nothing.** A 401, a
    /// dead server, a body this build cannot decode (a provider added
    /// server-side after this app shipped) — all of them mean the app does not
    /// know, and an offer it cannot back up is worse than no offer.
    @MainActor
    func testEveryCredentialsProbeFailureLandsOnUnknownAndOffersNothing() async {
        for (status, body) in [
            (401, Data(#"{"error":"bearer_token_required"}"#.utf8)),
            (500, Data(#"{"error":"boom"}"#.utf8)),
            (200, Data(#"{"providers":["carrier-pigeon"]}"#.utf8)),
            (200, Data(#"{"not":"the shape"}"#.utf8)),
        ] {
            let environment = await signedInEnvironment(
                credentialsStatus: status, credentialsBody: body)

            await environment.probeAccountIfNeeded()

            XCTAssertEqual(
                environment.credentials, .unknown,
                "A \(status) must not become a claim about the player."
            )
            XCTAssertFalse(
                AccountSheetRows(isSuperAdmin: false, credentials: environment.credentials)
                    .showsConnectApple
            )
        }
    }

    /// One SUCCESSFUL probe per session — and a failed one is retried.
    ///
    /// This used to assert the opposite, and the opposite was the bug: the latch
    /// was set before the request, so a single 403 (or a moment offline) meant
    /// `.unknown` for the rest of the session, which renders exactly like
    /// "already linked" — no offer, no error, nothing to retry. The retry has a
    /// ceiling instead of a latch: `probeAccountIfNeeded()` is called by the
    /// account button and by each presentation of the account sheet, so a
    /// failure costs one request the next time the user goes looking for the
    /// offer, which is exactly when a stale `.unknown` is worth clearing.
    @MainActor
    func testAFailedCredentialsProbeIsRetriedAndASuccessfulOneIsNot() async {
        let environment = await signedInEnvironment(
            credentialsStatus: 403,
            credentialsBody: Data(#"{"error":"forbidden"}"#.utf8)
        )

        await environment.probeAccountIfNeeded()
        await environment.probeAccountIfNeeded()
        await environment.probeAccountIfNeeded()

        XCTAssertEqual(credentialsProbeCount(), 3, "Each failure re-arms the ask.")
        XCTAssertEqual(environment.credentials, .unknown)

        // The server comes back. `reset` re-arms the stub table AND clears the
        // request log, so the counts below start from zero again.
        StubURLProtocol.reset(status: 200, body: Self.meJSON)
        StubURLProtocol.stub(
            path: "/auth/credentials",
            status: 200,
            body: Data(#"{"providers":["password"]}"#.utf8)
        )
        StubURLProtocol.stub(path: "/me/roles", status: 200, body: Data("[]".utf8))

        // The next presentation gets the real answer...
        await environment.probeAccountIfNeeded()
        XCTAssertEqual(environment.credentials, .known(["password"]))
        XCTAssertEqual(credentialsProbeCount(), 1)

        // ...and THAT is what stops the asking.
        await environment.probeAccountIfNeeded()
        await environment.probeAccountIfNeeded()
        XCTAssertEqual(
            credentialsProbeCount(),
            1,
            "A known answer is fetched once, however many times a view appears."
        )
    }

    private func credentialsProbeCount() -> Int {
        StubURLProtocol.requests.filter { $0.url?.path.hasSuffix("/auth/credentials") == true }.count
    }

    /// Anonymous never asks: the endpoint is scoped to the bearer's own player,
    /// and a request guaranteed to 401 is not worth making.
    @MainActor
    func testAnAnonymousSessionNeverProbesCredentials() async {
        StubURLProtocol.reset(status: 200, body: Data(#"{"providers":[]}"#.utf8))
        let environment = makeEnvironment()
        await environment.bootstrap()

        await environment.probeAccountIfNeeded()

        XCTAssertEqual(environment.credentials, .unknown)
        XCTAssertTrue(StubURLProtocol.requests.isEmpty, "No token, no probe.")
    }

    /// The cached answer described the player who just left. Clearing the
    /// "already asked" flag with it is what lets the next sign-in — possibly a
    /// different human on the same device — be answered on its own merits.
    @MainActor
    func testSignOutForgetsTheCredentialsAndRearmsTheProbe() async {
        let environment = await signedInEnvironment(
            credentialsStatus: 200,
            credentialsBody: Data(#"{"providers":["apple"]}"#.utf8)
        )
        await environment.probeAccountIfNeeded()
        XCTAssertEqual(environment.credentials, .known(["apple"]))

        StubURLProtocol.stub(
            path: "/auth/revoke", status: 200, body: Data(#"{"ok":true,"userId":"p9"}"#.utf8))
        await environment.signOut()

        XCTAssertEqual(environment.credentials, .unknown)

        // Re-armed: a fresh session asks again rather than inheriting.
        XCTAssertTrue(keychain.saveToken("bearer-next"))
        await environment.bootstrap()
        let before = StubURLProtocol.requests.count
        await environment.probeAccountIfNeeded()
        XCTAssertEqual(
            StubURLProtocol.requests.filter { $0.url?.path.hasSuffix("/auth/credentials") == true }
                .count,
            2,
            "The next session gets its own answer."
        )
        XCTAssertGreaterThan(StubURLProtocol.requests.count, before)
    }

    // MARK: - 7. The shared tail: a Keychain that refuses the write

    /// Both doors run through `adoptSession`, and the branch that matters is the
    /// one no simulator produces on its own: the Keychain refusing the write.
    /// The server has already issued a live session at that point, and this
    /// device is about to forget the only copy of its token — so it must revoke
    /// it on the way out or leave a session nothing can ever kill.
    @MainActor
    func testAppleSignInRevokesTheTokenItCouldNotStore() async {
        let broken = Keychain.failingWrites(
            service: "com.marcusandersson.tapscore.tests.\(UUID().uuidString)"
        )
        let environment = AppEnvironment(configuration: .dev, keychain: broken, session: session)

        do {
            try await environment.signIn(identityToken: "t", rawNonce: "raw", fullName: nil)
            XCTFail("A token that cannot be stored is a failed sign-in.")
        } catch {
            XCTAssertEqual(
                error as? APIError,
                .network("Could not store the session token in the Keychain.")
            )
        }

        assertOrphanRevoke(of: "bearer-abc")
        XCTAssertNotEqual(
            environment.authState,
            .signedIn(Player(id: "p9", username: "marcus", displayName: "Marcus Andersson")),
            "A session whose token was dropped must not look signed in."
        )
    }

    @MainActor
    func testPasswordLoginRevokesTheTokenItCouldNotStore() async {
        StubURLProtocol.reset(status: 200, body: Self.passwordLoginJSON)
        StubURLProtocol.stub(path: "/players/me", status: 200, body: Self.meJSON)
        let broken = Keychain.failingWrites(
            service: "com.marcusandersson.tapscore.tests.\(UUID().uuidString)"
        )
        let environment = AppEnvironment(configuration: .dev, keychain: broken, session: session)

        do {
            try await environment.signInWithPassword(username: "marcus", password: "hunter2")
            XCTFail("A token that cannot be stored is a failed sign-in.")
        } catch {
            XCTAssertEqual(
                error as? APIError,
                .network("Could not store the session token in the Keychain.")
            )
        }

        // The SAME tail as the Apple door — that is the point of it being one
        // function: a second copy is a second place to forget the revoke.
        assertOrphanRevoke(of: "bearer-pw")
    }

    private func assertOrphanRevoke(
        of token: String,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        guard let revoke = StubURLProtocol.requests.last else {
            return XCTFail("No revoke was attempted.", file: file, line: line)
        }
        XCTAssertEqual(
            revoke.url?.absoluteString,
            "http://localhost:3030/api/auth/revoke",
            file: file,
            line: line
        )
        XCTAssertEqual(
            revoke.headers["Authorization"],
            "Bearer \(token)",
            "The orphan is revoked by VALUE — the Keychain is exactly what failed.",
            file: file,
            line: line
        )
    }
}
