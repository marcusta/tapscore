import XCTest
@testable import TapScore

/// The admin rows say the same thing on both clients.
///
/// Every expectation below is the output of the corresponding function in
/// `src/admin/admin.component.ts` (`STATUS_LABEL`, `roundMeta`, `playerMeta`,
/// the `who` and `meta` bindings) for the same input. If the web copy changes,
/// these fail — which is the point: an operator comparing a phone to a laptop
/// during a support call should not be reading two different summaries of the
/// same round.
final class AdminRowCopyTests: XCTestCase {
    private func round(
        participants: [String] = ["Ivar", "Jonas"],
        events: Double = 42,
        lastEventAt: String? = "2026-07-24T10:02:31.000Z",
        creatorName: String? = "Marcus",
        courseName: String? = "Observer Links",
        status: AdminRoundSummaryStatus = .active
    ) -> AdminRoundSummary {
        AdminRoundSummary(
            roundId: "r-1",
            shareToken: "tok-1",
            date: "2026-06-14",
            status: status,
            courseName: courseName,
            createdAt: "2026-06-14T08:00:00.000Z",
            creatorName: creatorName,
            participants: participants,
            scoreEventCount: events,
            lastEventAt: lastEventAt
        )
    }

    private func player(
        username: String = "marcus",
        rounds: Double = 12,
        lastRoundDate: String? = "2026-07-24",
        handicap: Double? = 8.4,
        deletedAt: String? = nil,
        roles: [String] = []
    ) -> AdminPlayerSummary {
        AdminPlayerSummary(
            playerId: "p-1",
            username: username,
            displayName: "Marcus Andersson",
            handicapIndex: handicap,
            createdAt: "2026-06-01T10:00:00.000Z",
            deletedAt: deletedAt,
            roundCount: rounds,
            lastRoundDate: lastRoundDate,
            roles: roles
        )
    }

    // MARK: - Rounds

    func testStatusLabelsAreTheAdminVocabulary() {
        // Deliberately NOT the landing's "Live"/"Finished" — same difference
        // the web has between admin.component.ts and landing.component.ts.
        XCTAssertEqual(AdminRowCopy.statusLabel(.notStarted), "Not started")
        XCTAssertEqual(AdminRowCopy.statusLabel(.active), "Playing")
        XCTAssertEqual(AdminRowCopy.statusLabel(.complete), "Done")
    }

    func testRoundMetaMatchesTheWebLine() {
        XCTAssertEqual(
            AdminRowCopy.roundMeta(round()),
            "2026-06-14 · 2 players · 42 scores · last 2026-07-24 10:02"
        )
    }

    func testNeverPlayedRoundSaysSo() {
        XCTAssertEqual(
            AdminRowCopy.roundMeta(round(participants: [], events: 0, lastEventAt: nil)),
            "2026-06-14 · 0 players · 0 scores · never played"
        )
    }

    func testWhoFallsBackToAGuestCreator() {
        XCTAssertEqual(AdminRowCopy.who(round()), "by Marcus — Ivar, Jonas")
        XCTAssertEqual(
            AdminRowCopy.who(round(participants: [], creatorName: nil)),
            "by a guest"
        )
        XCTAssertEqual(
            AdminRowCopy.who(round(creatorName: nil)),
            "by a guest — Ivar, Jonas"
        )
    }

    /// JS truthiness parity: the web line is `r.creatorName ? … : 'by a guest'`,
    /// and `''` is falsy there. Swift's `String?` would happily render
    /// `Optional("")` as "by ", so the two clients would disagree about the same
    /// row — which is exactly the drift this file exists to catch.
    func testEmptyCreatorNameIsAsAbsentAsNil() {
        XCTAssertEqual(
            AdminRowCopy.who(round(participants: [], creatorName: "")),
            "by a guest"
        )
        XCTAssertEqual(
            AdminRowCopy.who(round(creatorName: "")),
            "by a guest — Ivar, Jonas"
        )
    }

    func testMissingCourseNameHasAName() {
        XCTAssertEqual(AdminRowCopy.courseTitle(round()), "Observer Links")
        XCTAssertEqual(AdminRowCopy.courseTitle(round(courseName: nil)), "Unknown course")
    }

    // MARK: - Players

    func testPlayerMetaMatchesTheWebLine() {
        XCTAssertEqual(
            AdminRowCopy.playerMeta(player()),
            "@marcus · 12 rounds · last 2026-07-24 · hcp 8.4"
        )
    }

    func testPlayerMetaDropsWhatIsUnknownAndFlagsDeletion() {
        XCTAssertEqual(
            AdminRowCopy.playerMeta(
                player(rounds: 0, lastRoundDate: nil, handicap: nil, deletedAt: "2026-06-20")
            ),
            "@marcus · 0 rounds · DELETED"
        )
    }

    func testRoleChipOnlyForTheUnscopedGrant() {
        XCTAssertEqual(AdminRowCopy.roleChip(player(roles: ["super_admin"])), "admin")
        XCTAssertNil(AdminRowCopy.roleChip(player(roles: [])))
        XCTAssertNil(AdminRowCopy.roleChip(player(roles: ["competition_admin"])))
    }

    // MARK: - Numbers

    /// The wire types every count as a JSON number, so the generated model
    /// carries `Double`. "12.0 rounds" is what happens if nobody says otherwise.
    func testCountsRenderAsIntegers() {
        XCTAssertEqual(AdminRowCopy.count(0), "0")
        XCTAssertEqual(AdminRowCopy.count(42), "42")
        XCTAssertEqual(AdminRowCopy.number(8.4), "8.4")
        XCTAssertEqual(AdminRowCopy.number(8), "8")
    }

    func testStatOrderMirrorsTheWebGrid() {
        let stats = AdminStats(
            players: 2,
            guests: 3,
            rounds: 5,
            roundsActive: 1,
            roundsComplete: 4,
            roundsLast7Days: 2,
            scoreEvents: 77
        )
        XCTAssertEqual(
            AdminHomeView.statRows(stats).map(\.label),
            ["Rounds", "Playing", "Last 7d", "Players", "Guests", "Scores"]
        )
        XCTAssertEqual(
            AdminHomeView.statRows(stats).map(\.value),
            ["5", "1", "2", "2", "3", "77"]
        )
    }
}
