import XCTest
@testable import TapScore

/// Pins WHEN the landing loads — the half of this screen that shipped broken.
///
/// The bug the owner saw: their rounds appeared only after a pull-to-refresh.
/// `AppEnvironment.bootstrap()` resolves the stored Keychain session
/// asynchronously, so the landing's load ran while `authState` was still
/// `.unknown`, took the signed-out path, never asked
/// `GET /dashboard/my-rounds`, and nothing re-triggered it. Everything below is
/// about that transition and about it happening exactly once.
final class LandingLoaderTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
        RoundStubURLProtocol.route("/dashboard/my-rounds", Self.myRoundsJSON)
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    // MARK: - The bug

    /// THE regression: a load that ran before the session resolved must be
    /// followed by one that runs after it. One fetch, not zero — and not two.
    @MainActor
    func testSignInResolvingAfterLaunchFetchesTheDashboardExactlyOnce() async {
        let loader = LandingLoader()
        let api = RoundStubURLProtocol.makeAPI()

        // Launch: bootstrap has not answered yet.
        await loader.load(auth: .unknown, api: api, device: [])
        XCTAssertEqual(
            RoundStubURLProtocol.requests(for: "/dashboard/my-rounds").count, 0,
            "there is no identity to ask about yet")
        XCTAssertTrue(loader.rows.isEmpty)

        // Bootstrap resolves the stored session.
        await loader.load(auth: .signedIn(Self.player), api: api, device: [])
        XCTAssertEqual(
            RoundStubURLProtocol.requests(for: "/dashboard/my-rounds").count, 1,
            "the resolution of sign-in must refresh the list")
        XCTAssertEqual(loader.rows.map(\.token), ["tok-1"])
        XCTAssertEqual(loader.serverRoundCount, 1)
        XCTAssertNil(loader.loadFailure)
    }

    /// …and the fix must not become a fetch storm. `.task(id:)` fires on
    /// appearance as well as on change, and `authState` can be re-published
    /// with an unchanged value, so a repeat of the SAME auth key is not a
    /// transition and must not hit the server again.
    @MainActor
    func testRepeatingTheSameAuthStateDoesNotRefetch() async {
        let loader = LandingLoader()
        let api = RoundStubURLProtocol.makeAPI()

        for _ in 0..<5 {
            await loader.load(auth: .signedIn(Self.player), api: api, device: [])
        }
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/dashboard/my-rounds").count, 1)
    }

    /// A profile edit leaves the same person signed in. That is not a reason to
    /// refetch the dashboard, so the key is the player's identity, not the
    /// whole `Player` value.
    @MainActor
    func testTheSamePlayerWithADifferentProfileIsNotATransition() async {
        let loader = LandingLoader()
        let api = RoundStubURLProtocol.makeAPI()

        await loader.load(auth: .signedIn(Self.player), api: api, device: [])
        var renamed = Self.player
        renamed.displayName = "Marcus A."
        await loader.load(auth: .signedIn(renamed), api: api, device: [])

        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/dashboard/my-rounds").count, 1)
    }

    /// Sign-out is a transition too, and the one that MUST re-run: the server
    /// rows belong to a session that no longer exists. Nothing is fetched (no
    /// identity to fetch for) and the list falls back to this device's.
    @MainActor
    func testSignOutDropsServerRowsBackToTheDeviceList() async {
        let loader = LandingLoader()
        let api = RoundStubURLProtocol.makeAPI()

        await loader.load(auth: .signedIn(Self.player), api: api, device: [])
        XCTAssertEqual(loader.rows.count, 1)

        await loader.load(auth: .anonymous, api: api, device: [Self.device("tok-9")])
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/dashboard/my-rounds").count, 1)
        XCTAssertEqual(loader.rows.map(\.token), ["tok-9"])
        XCTAssertNil(loader.serverRoundCount, "signed out, the server was never asked")
    }

    /// Signing IN after starting anonymous is the same transition from the
    /// other side — and the device rows must survive it.
    @MainActor
    func testSigningInMergesOverTheDeviceList() async {
        let loader = LandingLoader()
        let api = RoundStubURLProtocol.makeAPI()
        let device = [Self.device("tok-9")]

        await loader.load(auth: .anonymous, api: api, device: device)
        XCTAssertEqual(loader.rows.map(\.token), ["tok-9"])

        await loader.load(auth: .signedIn(Self.player), api: api, device: device)
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/dashboard/my-rounds").count, 1)
        XCTAssertEqual(
            Set(loader.rows.compactMap(\.token)), ["tok-1", "tok-9"],
            "a round opened on this device before signing in does not vanish on sign-in")
    }

    /// Pull-to-refresh is an explicit ask. The dedupe exists to stop loads
    /// nobody requested, never to refuse one somebody did.
    @MainActor
    func testForceRefetchesEvenWithoutATransition() async {
        let loader = LandingLoader()
        let api = RoundStubURLProtocol.makeAPI()

        await loader.load(auth: .signedIn(Self.player), api: api, device: [])
        await loader.load(auth: .signedIn(Self.player), api: api, device: [], force: true)
        XCTAssertEqual(RoundStubURLProtocol.requests(for: "/dashboard/my-rounds").count, 2)
    }

    /// A failed dashboard degrades to the device list rather than to an empty
    /// screen — and must not claim the account has no rounds.
    @MainActor
    func testDashboardFailureKeepsTheDeviceRowsAndSaysSo() async {
        RoundStubURLProtocol.reset()
        RoundStubURLProtocol.route("/dashboard/my-rounds", status: 500, #"{"error":"boom"}"#)
        let loader = LandingLoader()

        await loader.load(
            auth: .signedIn(Self.player),
            api: RoundStubURLProtocol.makeAPI(),
            device: [Self.device("tok-9")])

        XCTAssertEqual(loader.rows.map(\.token), ["tok-9"])
        XCTAssertNil(loader.serverRoundCount, "an unreachable dashboard proves nothing")
        XCTAssertEqual(
            loader.loadFailure,
            "Couldn't reach the server. Showing rounds opened on this device.")
    }

    @MainActor
    func testExpiredSessionSaysSoRatherThanBlamingTheNetwork() async {
        RoundStubURLProtocol.reset()
        RoundStubURLProtocol.route("/dashboard/my-rounds", status: 401, #"{"error":"nope"}"#)
        let loader = LandingLoader()

        await loader.load(auth: .signedIn(Self.player), api: RoundStubURLProtocol.makeAPI(), device: [])
        XCTAssertEqual(
            loader.loadFailure,
            "Your session expired — sign in again to see all your rounds.")
    }

    // MARK: - Keys

    @MainActor
    func testKeyDistinguishesTheStatesThatMatter() {
        XCTAssertNotEqual(LandingLoader.key(.unknown), LandingLoader.key(.anonymous))
        XCTAssertNotEqual(LandingLoader.key(.anonymous), LandingLoader.key(.signedIn(Self.player)))
        var other = Self.player
        other.id = "p-2"
        XCTAssertNotEqual(
            LandingLoader.key(.signedIn(Self.player)), LandingLoader.key(.signedIn(other)),
            "a different person is a different list")
    }

    // MARK: - Fixtures

    private static let player = Player(id: "p-1", username: "marcus", displayName: "Marcus")

    private static func device(_ token: String) -> DeviceRound {
        DeviceRound(
            token: token,
            courseName: "Linköpings GK",
            status: .active,
            completedAt: nil,
            lastSeenAt: "2026-07-20T10:00:00Z")
    }

    private static let myRoundsJSON = """
    {"created":[{"round":{"id":"round-1","courseId":"c1","date":"2026-07-20",
       "roundType":"full_18","venueType":"outdoor","startListMode":"open_window",
       "windowStart":null,"windowEnd":null,"selfOrganize":true,"status":"active",
       "latestEventId":null,"courseNameSnapshot":"Linköpings GK","completedAt":null,
       "formatSlots":[],"playHoles":[],
       "routeSi":{"mode":"official","sourceLabel":null,"sourceVersion":null,
         "allocationCycleSize":18},
       "routeHandicapPolicy":{"type":"official_route","postingEligible":true,
         "postingIneligibleReason":null},
       "routeSections":[],"playingGroups":[]},
      "friendlyRound":{"id":"fr-1","roundId":"round-1","shareToken":"tok-1",
        "creatorPlayerId":"p-1","createdAt":"2026-07-20T09:00:00.000Z"}}],
     "produced":[]}
    """
}
