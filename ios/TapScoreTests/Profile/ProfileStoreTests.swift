import XCTest
@testable import TapScore

/// The profile screen's data layer: the triple fetch, the two `TriState` writes
/// that must not touch each other's column, the handicap post-and-refetch, and
/// the bound that keeps a typo out of the handicap chain.
///
/// Fixtures are hand-written JSON, so a server contract drift fails HERE as a
/// decode error rather than on a phone. The request log is what the wire-shape
/// assertions read: `{"gender":"M"}` with NO `homeClubId` key is a fact about
/// the bytes, and nothing short of the bytes can prove it.
final class ProfileStoreTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    // MARK: - Fixtures

    private static func player(
        gender: String? = "M",
        homeClubId: String? = "club-1",
        handicapIndex: String = "18.4"
    ) -> String {
        let genderJSON = gender.map { "\"\($0)\"" } ?? "null"
        let clubJSON = homeClubId.map { "\"\($0)\"" } ?? "null"
        return """
        {"id":"p-1","username":"marcus","displayName":"Marcus Andersson",
         "nickname":null,"avatarUrl":null,"homeClubId":\(clubJSON),
         "handicapIndex":\(handicapIndex),"gender":\(genderJSON),"deletedAt":null}
        """
    }

    private static func entry(
        id: String, index: String, source: String = "manual", date: String = "2026-07-29"
    ) -> String {
        """
        {"id":"\(id)","playerId":"p-1","handicapIndex":\(index),"source":"\(source)",
         "effectiveDate":"\(date)","enteredByPlayerId":null,
         "createdAt":"2026-07-29T09:00:00.000Z"}
        """
    }

    private static let clubsJSON = """
    [{"id":"club-2","name":"Vadstena GK","location":"Vadstena","logoUrl":null},
     {"id":"club-1","name":"Linköpings GK","location":"Linköping","logoUrl":null}]
    """

    /// The three reads the screen opens with. `/players/me/handicap-history` is
    /// routed BEFORE `/players/me`, because the stub matches on path SUFFIX and
    /// the shorter path is a suffix of neither — but the ordering keeps the
    /// intent readable.
    private func routeLoad(
        me: String = ProfileStoreTests.player(),
        history: String = "[]",
        clubs: String = ProfileStoreTests.clubsJSON
    ) {
        RoundStubURLProtocol.route("/players/me/handicap-history", history)
        RoundStubURLProtocol.route("/players/me", method: "GET", me)
        RoundStubURLProtocol.route("/clubs", clubs)
    }

    @MainActor
    private func makeStore(
        onProfileUpdated: (@MainActor (Player) -> Void)? = nil
    ) -> ProfileStore {
        ProfileStore(api: RoundStubURLProtocol.makeAPI(), onProfileUpdated: onProfileUpdated)
    }

    /// The JSON body of the last request to `path`, as a dictionary.
    private func lastBody(_ path: String) -> [String: Any]? {
        RoundStubURLProtocol.requests(for: path).last?.json
    }

    // MARK: - 1. Load

    @MainActor
    func testLoadFetchesProfileHistoryAndClubs() async {
        routeLoad(history: "[\(Self.entry(id: "h-1", index: "18.4"))]")
        let store = makeStore()

        await store.load()

        XCTAssertEqual(store.phase, .ready)
        XCTAssertEqual(store.player?.username, "marcus")
        XCTAssertEqual(store.player?.gender, .m)
        XCTAssertEqual(store.player?.homeClubId, "club-1")
        XCTAssertEqual(store.history.count, 1)
        XCTAssertEqual(store.history.first?.source, .manual)
        XCTAssertEqual(store.clubs.count, 2)
    }

    @MainActor
    func testClubsAreOfferedInNameOrder() async {
        routeLoad()
        let store = makeStore()

        await store.load()

        XCTAssertEqual(store.sortedClubs.map(\.name), ["Linköpings GK", "Vadstena GK"])
    }

    @MainActor
    func testAFailedReadIsAMessageNotAnEmptyScreen() async {
        RoundStubURLProtocol.route("/players/me/handicap-history", "[]")
        RoundStubURLProtocol.route("/players/me", method: "GET", status: 500, "{\"error\":\"boom\"}")
        RoundStubURLProtocol.route("/clubs", Self.clubsJSON)
        let store = makeStore()

        await store.load()

        guard case let .failed(message) = store.phase else {
            return XCTFail("expected .failed, got \(store.phase)")
        }
        XCTAssertTrue(message.contains("500"), message)
        XCTAssertNil(store.player)
    }

    @MainActor
    func testA401IsAStateNotAnErrorString() async {
        RoundStubURLProtocol.route("/players/me/handicap-history", "[]")
        RoundStubURLProtocol.route("/players/me", method: "GET", status: 401, "{}")
        RoundStubURLProtocol.route("/clubs", Self.clubsJSON)
        let store = makeStore()

        await store.load()

        XCTAssertEqual(store.phase, .notAuthorized)
    }

    /// `/players/me` answers `null` for a request it cannot attribute. Same
    /// meaning as a 401, so the same phase.
    @MainActor
    func testANullPlayerReadsAsNotAuthorized() async {
        routeLoad(me: "null")
        let store = makeStore()

        await store.load()

        XCTAssertEqual(store.phase, .notAuthorized)
        XCTAssertNil(store.player)
    }

    /// A 403 — revoked mid-session — is the third spelling of "this session may
    /// not read this", and it must land in the same phase as the other two, not
    /// in a generic failure message.
    @MainActor
    func testA403ReadsAsNotAuthorizedNotAsAFailure() async {
        RoundStubURLProtocol.route("/players/me/handicap-history", "[]")
        RoundStubURLProtocol.route("/players/me", method: "GET", status: 403, "{}")
        RoundStubURLProtocol.route("/clubs", Self.clubsJSON)
        let store = makeStore()

        await store.load()

        XCTAssertEqual(store.phase, .notAuthorized)
    }

    /// The class doc's claim, made load-bearing: a contract drift fails as a
    /// decode error with its own copy, not as a crash or a silent empty screen.
    /// `{"id":"p-1"}` is well-formed JSON that is not a `Player`.
    @MainActor
    func testAContractDriftFailsAsADecodeErrorWithItsOwnCopy() async {
        routeLoad(me: #"{"id":"p-1"}"#)
        let store = makeStore()

        await store.load()

        XCTAssertEqual(
            store.phase,
            .failed("The server sent a shape this build does not understand."))
    }

    // MARK: - 2. Gender — the TriState contract

    @MainActor
    func testSavingGenderSendsOnlyTheGenderKey() async {
        routeLoad()
        RoundStubURLProtocol.route("/players/me/profile", Self.player(gender: "F"))
        let store = makeStore()
        await store.load()

        await store.saveGender(.f)

        let body = lastBody("/players/me/profile")
        XCTAssertEqual(body?["gender"] as? String, "F")
        // THE ASSERTION THIS TEST EXISTS FOR: an untouched column must be
        // ABSENT, not null. A null here would wipe the home club. Fail-closed
        // form: a nil body is a failure, not a vacuous pass.
        XCTAssertFalse(body?.keys.contains("homeClubId") ?? true)
        XCTAssertEqual(store.player?.gender, .f)
        XCTAssertNil(store.genderError)
    }

    @MainActor
    func testClearingGenderSendsAnExplicitNull() async {
        routeLoad()
        RoundStubURLProtocol.route("/players/me/profile", Self.player(gender: nil))
        let store = makeStore()
        await store.load()

        await store.saveGender(nil)

        let body = lastBody("/players/me/profile")
        XCTAssertTrue(body?["gender"] is NSNull, String(describing: body))
        XCTAssertFalse(body?.keys.contains("homeClubId") ?? true)
        XCTAssertNil(store.player?.gender)
    }

    @MainActor
    func testAFailedGenderSaveSurfacesUnderItsOwnCard() async {
        routeLoad()
        RoundStubURLProtocol.route("/players/me/profile", status: 500, "{\"error\":\"nope\"}")
        let store = makeStore()
        await store.load()

        await store.saveGender(.f)

        XCTAssertNotNil(store.genderError)
        XCTAssertNil(store.clubError)
        XCTAssertNil(store.handicapError)
        // Nothing local moved, so the control still shows what the server has.
        XCTAssertEqual(store.player?.gender, .m)
    }

    // MARK: - 3. Home club — the other direction

    @MainActor
    func testSavingHomeClubSendsOnlyTheClubKey() async {
        routeLoad()
        RoundStubURLProtocol.route("/players/me/profile", Self.player(homeClubId: "club-2"))
        let store = makeStore()
        await store.load()

        await store.saveHomeClub("club-2")

        let body = lastBody("/players/me/profile")
        XCTAssertEqual(body?["homeClubId"] as? String, "club-2")
        XCTAssertFalse(body?.keys.contains("gender") ?? true)
        XCTAssertEqual(store.player?.homeClubId, "club-2")
    }

    @MainActor
    func testClearingHomeClubSendsAnExplicitNull() async {
        routeLoad()
        RoundStubURLProtocol.route("/players/me/profile", Self.player(homeClubId: nil))
        let store = makeStore()
        await store.load()

        await store.saveHomeClub(nil)

        let body = lastBody("/players/me/profile")
        XCTAssertTrue(body?["homeClubId"] is NSNull, String(describing: body))
        XCTAssertFalse(body?.keys.contains("gender") ?? true)
        XCTAssertNil(store.player?.homeClubId)
    }

    // MARK: - 4. Handicap

    @MainActor
    func testSavingAnIndexPostsItAndRefetchesTheChain() async {
        routeLoad(
            me: Self.player(handicapIndex: "18.4"),
            history: "[]"
        )
        // Second answers, handed out after the post: the server appended a row
        // and moved the index, which is exactly what a refetch must reveal.
        RoundStubURLProtocol.route(
            "/players/me", method: "GET",
            Self.player(handicapIndex: "18.4"), Self.player(handicapIndex: "12.1"))
        RoundStubURLProtocol.route(
            "/players/me/handicap-history",
            "[]", "[\(Self.entry(id: "h-2", index: "12.1"))]")
        RoundStubURLProtocol.route(
            "/players/me/handicap", Self.entry(id: "h-2", index: "12.1"))
        let store = makeStore()
        await store.load()

        await store.saveHandicap(text: "12.1")

        let body = lastBody("/players/me/handicap")
        XCTAssertEqual(body?["handicapIndex"] as? Double, 12.1)
        // No client-side effective date: the server dates the entry.
        XCTAssertFalse(body?.keys.contains("effectiveDate") ?? true)
        XCTAssertEqual(store.player?.handicapIndex, 12.1)
        XCTAssertEqual(store.history.map(\.id), ["h-2"])
        XCTAssertNil(store.handicapError)
        // Two GETs each: the load and the forced refetch.
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/players/me").filter {
            $0.method == "GET"
        }.count, 2)
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/handicap-history").count, 2)
    }

    @MainActor
    func testAPlusHandicapIsPostedNegative() async {
        routeLoad()
        RoundStubURLProtocol.route("/players/me/handicap", Self.entry(id: "h-3", index: "-2.4"))
        let store = makeStore()
        await store.load()

        await store.saveHandicap(text: "+2.4")

        XCTAssertEqual(lastBody("/players/me/handicap")?["handicapIndex"] as? Double, -2.4)
    }

    @MainActor
    func testAnIndexOutsideTheBoundsIsRefusedWithTheExactCopy() async {
        routeLoad()
        let store = makeStore()
        await store.load()

        await store.saveHandicap(text: "54.1")

        XCTAssertEqual(
            store.handicapError,
            "Enter an index between +10 and 54 (use “+” for a plus handicap).")
        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/players/me/handicap").isEmpty)
    }

    @MainActor
    func testAPlusHandicapBetterThanPlusTenIsRefused() async {
        routeLoad()
        let store = makeStore()
        await store.load()

        await store.saveHandicap(text: "+10.1")

        XCTAssertEqual(store.handicapError, ProfileStore.outOfRangeMessage)
        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/players/me/handicap").isEmpty)
    }

    @MainActor
    func testTheBoundsThemselvesAreAccepted() async {
        routeLoad()
        RoundStubURLProtocol.route("/players/me/handicap", Self.entry(id: "h-4", index: "54"))
        let store = makeStore()
        await store.load()

        await store.saveHandicap(text: "54")
        XCTAssertNil(store.handicapError)

        await store.saveHandicap(text: "+10")
        XCTAssertNil(store.handicapError)
        XCTAssertEqual(lastBody("/players/me/handicap")?["handicapIndex"] as? Double, -10)
    }

    @MainActor
    func testTextThatIsNotANumberIsRefused() async {
        routeLoad()
        let store = makeStore()
        await store.load()

        await store.saveHandicap(text: "eighteen")

        XCTAssertEqual(store.handicapError, ProfileStore.outOfRangeMessage)
        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/players/me/handicap").isEmpty)
    }

    /// The POST landed, the reload after it did not. That must NOT read as a
    /// failed save — the server already appended the history row, and a "failed"
    /// message invites a retry that appends a duplicate to an append-only chain.
    /// Instead: `handicapError` stays nil, `refreshError` explains, and the big
    /// number moves to the value the server is known to hold.
    @MainActor
    func testAFailedRefetchAfterASuccessfulPostIsNotAFailedSave() async {
        routeLoad()
        RoundStubURLProtocol.route("/players/me/handicap", Self.entry(id: "h-6", index: "12.1"))
        let box = PlayerBox()
        let store = makeStore(onProfileUpdated: { box.player = $0 })
        await store.load()
        // The refetch, not the load, meets a dead connection: re-route the
        // history read to a 500 AFTER the initial load has consumed it.
        RoundStubURLProtocol.route("/players/me/handicap-history", status: 500, "{}")

        await store.saveHandicap(text: "12.1")

        XCTAssertNil(store.handicapError)
        XCTAssertNotNil(store.refreshError)
        XCTAssertTrue(
            store.refreshError?.hasPrefix(ProfileStore.savedButStalePrefix) ?? false,
            String(describing: store.refreshError))
        // The known-saved value is shown — and handed to the session — even
        // though the chain below is stale.
        XCTAssertEqual(store.player?.handicapIndex, 12.1)
        XCTAssertEqual(box.player?.handicapIndex, 12.1)
        // Exactly one POST left: nothing about this state should re-save.
        XCTAssertEqual(
            RoundStubURLProtocol.requests(for: "/players/me/handicap")
                .filter { $0.method == "POST" }.count, 1)
    }

    /// The pad commits "" to mean cleared, and the profile cannot clear a
    /// handicap — matching the web, whose Save is disabled on an empty field.
    /// (The pad's Done is also disabled on empty via `allowsEmptyCommit: false`;
    /// this pins the store's own belt-and-braces no-op.)
    @MainActor
    func testAnEmptyCommitIsANoOpNotAnError() async {
        routeLoad()
        let store = makeStore()
        await store.load()

        await store.saveHandicap(text: "   ")

        XCTAssertNil(store.handicapError)
        XCTAssertTrue(RoundStubURLProtocol.requests(for: "/players/me/handicap").isEmpty)
    }

    // MARK: - 5. One save at a time

    @MainActor
    func testASecondSaveIsDroppedWhileOneIsInFlight() async {
        routeLoad()
        RoundStubURLProtocol.route("/players/me/profile", Self.player(gender: "F"))
        let gate = RoundStubURLProtocol.gate("/players/me/profile")
        let store = makeStore()
        await store.load()

        let first = Task { await store.saveGender(.f) }
        // Let the first save reach the (gated) request before racing it —
        // BOUNDED, because an unbounded spin here would hang the whole bundle
        // (the gate below is never signalled) instead of failing.
        for _ in 0..<5000 where !store.isSaving { await Task.yield() }
        guard store.isSaving else {
            gate.signal()
            first.cancel()
            return XCTFail("timed out waiting for the gender save to go in flight")
        }
        XCTAssertEqual(store.saving, .gender)

        await store.saveHomeClub("club-2")
        XCTAssertNil(store.clubError)

        gate.signal()
        await first.value

        XCTAssertNil(store.saving)
        XCTAssertFalse(store.isSaving)
        // One request only — the club save never left.
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/players/me/profile").count, 1)
        XCTAssertEqual(store.player?.homeClubId, "club-1")
    }

    // MARK: - 6. Write-back to the session

    @MainActor
    func testASavedProfileIsHandedBackToTheSession() async {
        routeLoad()
        RoundStubURLProtocol.route("/players/me/profile", Self.player(gender: "F"))
        let box = PlayerBox()
        let store = makeStore(onProfileUpdated: { box.player = $0 })
        await store.load()

        await store.saveGender(.f)

        XCTAssertEqual(box.player?.gender, .f)
        XCTAssertEqual(box.player?.id, "p-1")
    }

    @MainActor
    func testTheRefetchedProfileIsHandedBackAfterAHandicapSave() async {
        routeLoad()
        RoundStubURLProtocol.route(
            "/players/me", method: "GET",
            Self.player(handicapIndex: "18.4"), Self.player(handicapIndex: "12.1"))
        RoundStubURLProtocol.route("/players/me/handicap", Self.entry(id: "h-5", index: "12.1"))
        let box = PlayerBox()
        let store = makeStore(onProfileUpdated: { box.player = $0 })
        await store.load()

        await store.saveHandicap(text: "12.1")

        XCTAssertEqual(box.player?.handicapIndex, 12.1)
    }

    @MainActor
    func testAFailedSaveTellsTheSessionNothing() async {
        routeLoad()
        RoundStubURLProtocol.route("/players/me/profile", status: 500, "{}")
        let box = PlayerBox()
        let store = makeStore(onProfileUpdated: { box.player = $0 })
        await store.load()

        await store.saveGender(.f)

        XCTAssertNil(box.player)
    }

    /// `AppEnvironment.apply(profile:)` replaces the player in place and does
    /// NOT invent a session — the landing's reload key is the player id, so
    /// this must stay a same-identity re-publish and must not resurrect an
    /// anonymous state into a signed-in one.
    @MainActor
    func testTheEnvironmentAdoptsARefreshedPlayerWithoutInventingASession() async {
        let keychain = Keychain(service: "com.marcusandersson.tapscore.tests.\(UUID().uuidString)")
        defer { keychain.clear() }
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        let session = URLSession(configuration: configuration)
        defer { session.invalidateAndCancel() }

        let environment = AppEnvironment(
            configuration: .dev, keychain: keychain, session: session)

        var updated = Player(id: "p9", username: "marcus", displayName: "Marcus Andersson")
        updated.handicapIndex = 12.1
        updated.gender = .f

        // Before any sign-in: nothing to replace, and a profile save must not
        // manufacture a session.
        environment.apply(profile: updated)
        XCTAssertEqual(environment.authState, .unknown)

        StubURLProtocol.reset(
            status: 200,
            body: Data(
                #"{"user":{"id":"p9","username":"marcus","displayName":"Marcus Andersson"},"token":"bearer-abc","created":false}"#
                    .utf8))
        _ = try? await environment.signIn(identityToken: "token", rawNonce: "nonce")
        XCTAssertEqual(LandingLoader.key(environment.authState), "signedIn:p9")

        environment.apply(profile: updated)

        XCTAssertEqual(environment.authState, .signedIn(updated))
        // Same identity ⇒ the landing does not refetch.
        XCTAssertEqual(LandingLoader.key(environment.authState), "signedIn:p9")
        StubURLProtocol.reset(status: 200, body: Data())
    }
}

/// A main-actor mailbox for the write-back closure. A local `var` captured by a
/// `@MainActor` closure is not something Swift 6 will let a test mutate from
/// two isolation domains, and this keeps the whole thing on the main actor.
@MainActor
private final class PlayerBox {
    var player: Player?
}
