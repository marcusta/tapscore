import XCTest
@testable import TapScore

/// Pins `JoinView`'s glue: pasted text → token (through the one parser), and
/// token → preview card (through the one transport).
///
/// The parser itself is pinned by `DeepLinkRouterTests`; what is new here is
/// that the paste door uses it *and nothing else*, and that the preview is a
/// read-only lookup — the join screen never claims a seat.
final class JoinLinkTests: XCTestCase {
    private var session: URLSession!

    override func setUp() {
        super.setUp()
        StubURLProtocol.reset(status: 200, body: Self.byTokenJSON)
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

    // MARK: - Token extraction

    func testAUniversalLinkYieldsItsToken() {
        XCTAssertEqual(
            JoinLink.token(in: "https://app.swedenindoorgolf.se/tapscore/round?token=abc123"),
            "abc123"
        )
    }

    func testSurroundingWhitespaceFromAPasteIsTolerated() {
        XCTAssertEqual(
            JoinLink.token(in: "\n  https://app.swedenindoorgolf.se/tapscore/round?token=abc123 \n"),
            "abc123"
        )
    }

    func testTheDevSchemeWorks() {
        XCTAssertEqual(JoinLink.token(in: "tapscore://round?token=abc123"), "abc123")
    }

    func testALinkWithoutATokenIsRejectedRatherThanOpeningAnEmptyRound() {
        // Resolves to `.roundList`, which is not something this screen can act
        // on — saying so beats pushing a round screen with no round.
        XCTAssertNil(JoinLink.token(in: "https://app.swedenindoorgolf.se/tapscore/round"))
        XCTAssertNil(JoinLink.token(in: "https://app.swedenindoorgolf.se/tapscore/rounds"))
    }

    func testForeignHostsAndGarbageAreRejected() {
        XCTAssertNil(JoinLink.token(in: "https://evil.example.com/round?token=abc123"))
        XCTAssertNil(JoinLink.token(in: "just some text"))
        XCTAssertNil(JoinLink.token(in: ""))
    }

    func testLocalhostIsAcceptedOnlyWhenInsecureDevHostsAre() {
        let link = "http://localhost:3030/round?token=abc123"

        XCTAssertEqual(JoinLink.token(in: link, allowsInsecureDevHosts: true), "abc123")
        XCTAssertNil(
            JoinLink.token(in: link, allowsInsecureDevHosts: false),
            "A shipping build must not follow a plaintext link."
        )
    }

    func testAPlaintextProductionLinkIsNeverAccepted() {
        XCTAssertNil(
            JoinLink.token(
                in: "http://app.swedenindoorgolf.se/tapscore/round?token=abc123",
                allowsInsecureDevHosts: true
            ),
            "The DEBUG relaxation covers loopback only — never a downgrade of the real host."
        )
    }

    // MARK: - Preview

    func testThePreviewFetchesByTokenAndFoldsTheRound() async throws {
        let api = TapScoreAPI(configuration: .dev, session: session)

        let preview = try await JoinLink.preview(token: "abc123", api: api)

        XCTAssertEqual(preview.token, "abc123")
        XCTAssertEqual(preview.courseName, "Linköpings GK")
        XCTAssertEqual(preview.date, "2026-07-27")
        XCTAssertEqual(preview.status, .active)
        XCTAssertEqual(preview.players, ["Marcus", "Anna"], "Claimed seats name the players.")

        let request = try XCTUnwrap(StubURLProtocol.requests.first)
        XCTAssertEqual(request.method, "GET", "The preview is read-only — it never joins or claims.")
        XCTAssertEqual(
            request.url?.absoluteString,
            "http://localhost:3030/api/friendly-rounds/by-token?token=abc123"
        )
        XCTAssertEqual(StubURLProtocol.requests.count, 1)
    }

    func testTheOpenRequestCarriesThePreviewMetadataToTheShell() async throws {
        let api = TapScoreAPI(configuration: .dev, session: session)

        let request = try await JoinLink.preview(token: "abc123", api: api).openRequest

        XCTAssertEqual(
            request,
            RoundOpenRequest(
                token: "abc123",
                courseName: "Linköpings GK",
                status: .active,
                completedAt: nil,
                date: "2026-07-27"
            ),
            "The device-recent row must be complete the moment the round is opened."
        )
    }

    func testSeatLabelsStandInWhenNobodyHasClaimedASeat() async throws {
        StubURLProtocol.reset(status: 200, body: Self.byTokenJSON(claimed: false))
        let api = TapScoreAPI(configuration: .dev, session: session)

        let preview = try await JoinLink.preview(token: "abc123", api: api)

        XCTAssertEqual(preview.players, ["Player 1", "Player 2"])
    }

    func testAFinishedRoundKeepsItsCompletionTime() async throws {
        StubURLProtocol.reset(status: 200, body: Self.byTokenJSON(status: "complete", completedAt: "2026-07-27T11:30:00Z"))
        let api = TapScoreAPI(configuration: .dev, session: session)

        let preview = try await JoinLink.preview(token: "abc123", api: api)

        XCTAssertEqual(preview.status, .complete)
        XCTAssertEqual(preview.completedAt, "2026-07-27T11:30:00Z")
    }

    func testAnUnknownTokenSurfacesTheServerError() async {
        StubURLProtocol.reset(status: 404, body: Data(#"{"error":"not_found"}"#.utf8))
        let api = TapScoreAPI(configuration: .dev, session: session)

        do {
            _ = try await JoinLink.preview(token: "nope", api: api)
            XCTFail("A 404 must not resolve to a preview.")
        } catch let APIError.server(code, _) {
            XCTAssertEqual(code, 404)
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    // MARK: - Fixture

    private static var byTokenJSON: Data { byTokenJSON() }

    /// A `GET /friendly-rounds/by-token` body, shaped exactly like the
    /// generated `FriendlyRoundsByTokenOutput` decodes it.
    private static func byTokenJSON(
        claimed: Bool = true,
        status: String = "active",
        completedAt: String? = nil
    ) -> Data {
        let claimedSeats = claimed
            ? """
              [
                {"seatId":"s1","seatLabel":"Seat 1","displayName":"Marcus","ballId":"b1",
                 "occupiedByViewer":false,"hasScores":false,"viewerMayRelease":false},
                {"seatId":"s2","seatLabel":"Seat 2","displayName":"Anna","ballId":"b2",
                 "occupiedByViewer":false,"hasScores":false,"viewerMayRelease":false}
              ]
              """
            : "[]"
        let completed = completedAt.map { "\"\($0)\"" } ?? "null"
        return Data(
            """
            {
              "friendlyRound": {
                "id": "f1", "roundId": "r1", "shareToken": "abc123",
                "creatorPlayerId": null, "createdAt": "2026-07-27T09:00:00Z"
              },
              "round": {
                "id": "r1", "courseId": "c1", "date": "2026-07-27",
                "roundType": "full_18", "venueType": "outdoor",
                "startListMode": "structured", "selfOrganize": true,
                "status": "\(status)", "visibility": "friends",
                "courseNameSnapshot": "Linköpings GK",
                "completedAt": \(completed),
                "formatSlots": [], "playHoles": [],
                "routeSi": {"mode": "official", "allocationCycleSize": 18},
                "routeHandicapPolicy": {"type": "official_route", "postingEligible": true},
                "routeSections": [], "playingGroups": []
              },
              "startList": {
                "policy": {"groups": "open", "seats": "claimable", "claimBy": "anyone"},
                "viewer": {
                  "join": {"allowed": true},
                  "createGroup": {"allowed": true},
                  "claimSeat": {"allowed": true},
                  "claimSeatAsGuest": {"allowed": true},
                  "maxGroupSize": 4
                },
                "seats": [
                  {"seatId":"s1","label":"Player 1","ballId":"b1"},
                  {"seatId":"s2","label":"Player 2","ballId":"b2"}
                ],
                "claimedSeats": \(claimedSeats)
              },
              "isCompetitionRound": false
            }
            """.utf8
        )
    }
}
