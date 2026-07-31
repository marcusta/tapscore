import XCTest
@testable import TapScore

/// Shared JSON fixtures for the friend-profile suites, shaped exactly like the
/// server's payloads so a contract drift shows up as a decode failure here.
enum FriendProfileFixtures {
    static let subjectId = "p2"

    static func round(
        _ id: String,
        name: String? = nil,
        courseName: String? = "Linköpings GK",
        date: String = "2026-07-20",
        status: String = "complete",
        holeCount: Int = 18,
        holesPlayed: Int = 18,
        scoreToPar: Int? = 3
    ) -> String {
        let nameJSON = name.map { "\"\($0)\"" } ?? "null"
        let courseJSON = courseName.map { "\"\($0)\"" } ?? "null"
        let toParJSON = scoreToPar.map { "\($0)" } ?? "null"
        return """
        {"roundId":"\(id)","name":\(nameJSON),"courseName":\(courseJSON),
         "date":"\(date)","status":"\(status)","holeCount":\(holeCount),
         "holesPlayed":\(holesPlayed),"scoreToPar":\(toParJSON)}
        """
    }

    /// Aggregates deliberately LARGER than the visible list — the documented
    /// private/link asymmetry, so a test never "fixes" them into agreement.
    static func profile(recentRounds: [String]) -> String {
        """
        {"player":{"id":"\(subjectId)","username":"anna","displayName":"Anna",
          "handicapIndex":12.4,"homeClubName":"Linköpings GK","avatarVersion":null},
         "roundsTotal":12,"roundsThisYear":4,"coursesTotal":5,
         "recentRounds":[\(recentRounds.joined(separator: ","))]}
        """
    }

    static func roundPage(rounds: [String], nextCursor: String?, hasMore: Bool) -> String {
        let cursorJSON = nextCursor.map { "\"\($0)\"" } ?? "null"
        return """
        {"rounds":[\(rounds.joined(separator: ","))],
         "nextCursor":\(cursorJSON),"hasMore":\(hasMore)}
        """
    }

    static func coursePage(courses: [String], hasMore: Bool) -> String {
        "{\"courses\":[\(courses.joined(separator: ","))],\"hasMore\":\(hasMore)}"
    }

    static func course(
        _ id: String,
        courseName: String? = "Linköpings GK",
        roundsPlayed: Int = 3,
        lastPlayedAt: String = "2026-07-20"
    ) -> String {
        let nameJSON = courseName.map { "\"\($0)\"" } ?? "null"
        return """
        {"courseId":"\(id)","courseName":\(nameJSON),
         "roundsPlayed":\(roundsPlayed),"lastPlayedAt":"\(lastPlayedAt)"}
        """
    }
}

final class FriendProfileStoreTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    @MainActor
    func testLoadCarriesIdentityAggregatesAndRecentRoundsVerbatim() async {
        RoundStubURLProtocol.route(
            "/friends/p2/profile",
            FriendProfileFixtures.profile(recentRounds: [
                FriendProfileFixtures.round("r1", name: "Tisdagsgolfen"),
                // A round the subject has not started: no progress to render.
                FriendProfileFixtures.round(
                    "r2", status: "not_started", holesPlayed: 0, scoreToPar: nil
                ),
            ])
        )

        let store = FriendProfileStore(playerId: "p2", api: RoundStubURLProtocol.makeAPI())
        await store.load()

        XCTAssertNil(store.unavailable)
        XCTAssertNil(store.loadError)
        let profile = try! XCTUnwrap(store.profile)
        XCTAssertEqual(profile.player.displayName, "Anna")
        XCTAssertEqual(profile.player.homeClubName, "Linköpings GK")
        // The aggregates exceed what the list shows, ON PURPOSE — private and
        // link rounds count here and never list. The store must carry both
        // sides verbatim and let the views keep them apart.
        XCTAssertEqual(Int(profile.roundsTotal), 12)
        XCTAssertEqual(Int(profile.roundsThisYear), 4)
        XCTAssertEqual(Int(profile.coursesTotal), 5)
        XCTAssertEqual(profile.recentRounds.map(\.roundId), ["r1", "r2"])
        XCTAssertNil(profile.recentRounds[1].scoreToPar)
    }

    @MainActor
    func testPresenceComesFromTheFeedAndNamesTheRound() async {
        RoundStubURLProtocol.route(
            "/friends/p2/profile", FriendProfileFixtures.profile(recentRounds: [])
        )
        // The feed is the ONE presence authority. The subject is out now in
        // round r9; another friend's round must not be mistaken for hers.
        RoundStubURLProtocol.route(
            "/dashboard/friends-activity",
            """
            {"live":[
              {"roundId":"r8","name":null,"courseName":null,"date":"2026-07-31",
               "status":"active","holeCount":18,"lastActivityAt":null,
               "friends":[{"playerId":"other","displayName":"Björn",
                 "avatarVersion":null,"holesPlayed":12,"scoreToPar":-1}]},
              {"roundId":"r9","name":null,"courseName":null,"date":"2026-07-31",
               "status":"active","holeCount":18,"lastActivityAt":null,
               "friends":[{"playerId":"p2","displayName":"Anna",
                 "avatarVersion":null,"holesPlayed":7,"scoreToPar":3}]}
            ],"recent":[]}
            """
        )

        let store = FriendProfileStore(playerId: "p2", api: RoundStubURLProtocol.makeAPI())
        await store.load()

        XCTAssertEqual(
            store.presence,
            FriendProfilePresence(roundId: "r9", holesPlayed: 7, scoreToPar: 3)
        )
    }

    @MainActor
    func testAFailedFeedLeavesTheProfileIntactAndPresenceNil() async {
        RoundStubURLProtocol.route(
            "/friends/p2/profile", FriendProfileFixtures.profile(recentRounds: [])
        )
        RoundStubURLProtocol.route(
            "/dashboard/friends-activity", status: 500, "{\"error\":\"boom\"}"
        )

        let store = FriendProfileStore(playerId: "p2", api: RoundStubURLProtocol.makeAPI())
        await store.load()

        // Presence is decoration; the profile read is the gate.
        XCTAssertNotNil(store.profile)
        XCTAssertNil(store.presence)
        XCTAssertNil(store.loadError)
    }

    @MainActor
    func testForbiddenIsItsOwnStateNotAnError() async {
        RoundStubURLProtocol.route(
            "/friends/p2/profile", status: 403, "{\"error\":\"forbidden\"}"
        )

        let store = FriendProfileStore(playerId: "p2", api: RoundStubURLProtocol.makeAPI())
        await store.load()

        // The friendship-withdrawn state renders as a calm full screen, not
        // as a retryable error — so it must not land in `loadError`.
        XCTAssertEqual(store.unavailable, .forbidden)
        XCTAssertNil(store.loadError)
        XCTAssertNil(store.profile)
    }

    @MainActor
    func testNotFoundMapsToItsOwnState() async {
        RoundStubURLProtocol.route(
            "/friends/p2/profile", status: 404, "{\"error\":\"not_found\"}"
        )

        let store = FriendProfileStore(playerId: "p2", api: RoundStubURLProtocol.makeAPI())
        await store.load()

        XCTAssertEqual(store.unavailable, .notFound)
        XCTAssertNil(store.loadError)
    }

    @MainActor
    func testOrdinaryFailureStaysRetryable() async {
        RoundStubURLProtocol.route(
            "/friends/p2/profile", status: 500, "{\"error\":\"boom\"}"
        )

        let store = FriendProfileStore(playerId: "p2", api: RoundStubURLProtocol.makeAPI())
        await store.load()

        XCTAssertNil(store.unavailable)
        XCTAssertNotNil(store.loadError)
    }
}
