import XCTest
@testable import TapScore

/// Pins the landing fold: the merge of the two data sources into one row list,
/// and the Ongoing / Recently-finished partition.
///
/// This is the Swift image of `src/landing/my-rounds.ts` + `rows.ts` +
/// `partition.ts`, and it is where the two clients would start disagreeing
/// about which rounds a player has if nobody checked.
final class LandingRowTests: XCTestCase {
    // MARK: - Fixtures

    private func round(
        id: String,
        date: String,
        status: AdminRoundSummaryStatus = .active,
        course: String? = "Linköpings GK",
        completedAt: String? = nil
    ) -> Round {
        Round(
            id: id,
            courseId: "c1",
            date: date,
            roundType: .full18,
            venueType: .outdoor,
            startListMode: .structured,
            selfOrganize: true,
            status: status,
            visibility: .friends,
            courseNameSnapshot: course,
            completedAt: completedAt,
            formatSlots: [],
            playHoles: [],
            routeSi: RoundRouteSi(mode: .official, allocationCycleSize: 18),
            routeHandicapPolicy: RoundRoutePolicy(type: .officialRoute, postingEligible: true),
            routeSections: [],
            playingGroups: []
        )
    }

    private func friendly(token: String, roundId: String) -> FriendlyRound {
        FriendlyRound(id: "f-\(token)", roundId: roundId, shareToken: token, createdAt: "2026-07-01T00:00:00Z")
    }

    private func device(
        _ token: String,
        course: String = "",
        name: String? = nil,
        status: DeviceRoundStatus = .active,
        seenAt: String,
        completedAt: String? = nil
    ) -> DeviceRound {
        DeviceRound(
            token: token,
            courseName: course,
            name: name,
            status: status,
            completedAt: completedAt,
            lastSeenAt: seenAt
        )
    }

    // MARK: - What a row is called

    /// The row's hierarchy: the round's own name is the headline and the
    /// course drops to a sub-title. Without a name the course IS the headline
    /// — and then it must not also be printed underneath itself.
    func testANamedRowLeadsWithItsNameAndDemotesTheCourse() {
        let named = LandingRow.fromDevice([
            device("a", course: "Linköpings Golfklubb 1-18", name: "Tisdagsbollen", seenAt: "2026-07-30T10:00:00Z")
        ])[0]
        XCTAssertEqual(named.label, "Tisdagsbollen")
        XCTAssertEqual(named.courseSubtitle, "Linköpings Golfklubb 1-18")

        let unnamed = LandingRow.fromDevice([
            device("b", course: "North", seenAt: "2026-07-30T10:00:00Z")
        ])[0]
        XCTAssertEqual(unnamed.label, "North")
        XCTAssertNil(unnamed.courseSubtitle, "the headline already says it")

        // A blank name is no name, and a row that knows neither still says
        // something rather than rendering an empty headline.
        let blank = LandingRow.fromDevice([
            device("c", course: "North", name: "   ", seenAt: "2026-07-30T10:00:00Z")
        ])[0]
        XCTAssertEqual(blank.label, "North")
        XCTAssertEqual(
            LandingRow.fromDevice([device("d", seenAt: "2026-07-30T10:00:00Z")])[0].label,
            "Round")
    }

    // MARK: - Merge

    func testARoundBothCreatedAndPlayedAppearsOnceWithBothRoles() {
        let r = round(id: "r1", date: "2026-07-20")
        let mine = DashboardMyRoundsOutput(
            produced: [DashboardRoundEntry(round: r, ballIds: [], slots: [], shareToken: "t1")],
            created: [DashboardMyRoundsOutputCreatedItem(friendlyRound: friendly(token: "t1", roundId: "r1"), round: r)]
        )

        let rows = LandingRow.merge(device: [], mine: mine)

        XCTAssertEqual(rows.count, 1, "Deduped by round id, not shown twice.")
        XCTAssertEqual(rows[0].roleLabel, "Played · Created")
        XCTAssertEqual(rows[0].token, "t1")
        XCTAssertEqual(rows[0].courseName, "Linköpings GK")
    }

    func testProducedOnlyAndCreatedOnlyGetTheirOwnRoles() {
        let played = round(id: "r1", date: "2026-07-20")
        let made = round(id: "r2", date: "2026-07-21")
        let mine = DashboardMyRoundsOutput(
            produced: [DashboardRoundEntry(round: played, ballIds: [], slots: [], shareToken: "t1")],
            created: [DashboardMyRoundsOutputCreatedItem(friendlyRound: friendly(token: "t2", roundId: "r2"), round: made)]
        )

        let rows = LandingRow.merge(device: [], mine: mine)

        XCTAssertEqual(rows.map(\.id), ["r2", "r1"], "Newest round date first.")
        XCTAssertEqual(rows.map(\.roleLabel), ["Created", "Played"])
    }

    func testAProducedRoundWithoutAFriendlyWrapperHasNoToken() {
        let mine = DashboardMyRoundsOutput(
            produced: [DashboardRoundEntry(round: round(id: "r1", date: "2026-07-20"), ballIds: [], slots: [], shareToken: nil)],
            created: []
        )

        XCTAssertNil(LandingRow.merge(device: [], mine: mine)[0].token)
    }

    func testADeviceRoundTheServerDoesNotKnowAboutIsKept() {
        // Opened from a share link, neither created nor played in. It is still
        // on this device's landing — that is the anonymous product.
        let mine = DashboardMyRoundsOutput(
            produced: [DashboardRoundEntry(round: round(id: "r1", date: "2026-07-20"), ballIds: [], slots: [], shareToken: "t1")],
            created: []
        )

        let rows = LandingRow.merge(
            device: [device("t9", course: "Vreta Kloster", seenAt: "2026-07-22T10:00:00Z")],
            mine: mine
        )

        XCTAssertEqual(rows.map(\.token), ["t1", "t9"])
        XCTAssertEqual(rows[1].courseName, "Vreta Kloster")
    }

    func testATokenInBothSourcesIsRenderedOnceFromTheServerRow() {
        let mine = DashboardMyRoundsOutput(
            produced: [
                DashboardRoundEntry(
                    round: round(id: "r1", date: "2026-07-20", status: .complete, course: "Linköpings GK"),
                    ballIds: [],
                    slots: [],
                    shareToken: "t1"
                )
            ],
            created: []
        )

        // The device row is stale (still says active, no course name).
        let rows = LandingRow.merge(device: [device("t1", seenAt: "2026-07-19T10:00:00Z")], mine: mine)

        XCTAssertEqual(rows.count, 1)
        XCTAssertEqual(rows[0].status, .complete, "The server is authoritative on status.")
        XCTAssertEqual(rows[0].courseName, "Linköpings GK")
        XCTAssertTrue(rows[0].deviceLocal, "…but it is still removable from this device.")
    }

    func testTheMergeOrderIsStableAcrossCalls() {
        // Same round date on both: dictionary iteration order must not leak
        // into the rendered order.
        let mine = DashboardMyRoundsOutput(
            produced: [
                DashboardRoundEntry(round: round(id: "r2", date: "2026-07-20"), ballIds: [], slots: [], shareToken: "t2"),
                DashboardRoundEntry(round: round(id: "r1", date: "2026-07-20"), ballIds: [], slots: [], shareToken: "t1"),
            ],
            created: []
        )

        for _ in 0..<20 {
            XCTAssertEqual(LandingRow.merge(device: [], mine: mine).map(\.id), ["r1", "r2"])
        }
    }

    // MARK: - Re-reading the device list (the pop-back path)

    /// The rows a signed-in viewer is looking at when they tap into a round.
    private func signedInRows(deviceToken: String? = nil) -> [LandingRow] {
        let mine = DashboardMyRoundsOutput(
            produced: [DashboardRoundEntry(round: round(id: "r1", date: "2026-07-20"), ballIds: [], slots: [], shareToken: "t1")],
            created: [DashboardMyRoundsOutputCreatedItem(friendlyRound: friendly(token: "t2", roundId: "r2"), round: round(id: "r2", date: "2026-07-21"))]
        )
        let entries = deviceToken.map { token in [device(token, seenAt: "2026-07-22T10:00:00Z")] } ?? []
        return LandingRow.merge(device: entries, mine: mine)
    }

    func testReReadingTheDeviceListKeepsServerRowsAndTheirRoles() {
        // The regression this exists for: popping back from a round used to
        // rebuild the list from the device entries alone, so a signed-in
        // viewer's dashboard rows and role labels vanished on every pop.
        let rows = signedInRows(deviceToken: "t1")

        let after = LandingRow.applyingDevice(
            [device("t1", seenAt: "2026-07-27T10:00:00Z")],
            to: rows
        )

        XCTAssertEqual(after.map(\.id), ["r2", "r1"], "Both server rows survive, in order.")
        XCTAssertEqual(after.map(\.roleLabel), ["Created", "Played"])
        XCTAssertEqual(after.first(where: { $0.id == "r1" })?.courseName, "Linköpings GK")
    }

    func testReReadingTheDeviceListTakesTheFresherLocalLifecycle() throws {
        // The device just watched this round finish; the dashboard fetch that
        // produced the row predates that.
        let rows = signedInRows(deviceToken: "t1")

        let after = LandingRow.applyingDevice(
            [device("t1", status: .complete, seenAt: "2026-07-27T10:00:00Z", completedAt: "2026-07-27T09:55:00Z")],
            to: rows
        )
        let row = try XCTUnwrap(after.first { $0.id == "r1" })

        XCTAssertEqual(row.status, .complete)
        XCTAssertEqual(row.completedAt, "2026-07-27T09:55:00Z")
        XCTAssertEqual(row.roleLabel, "Played", "…without losing what only the server knows.")
    }

    func testReReadingTheDeviceListAddsRoundsOpenedSinceTheFetch() {
        let after = LandingRow.applyingDevice(
            [device("t9", course: "Vreta Kloster", seenAt: "2026-07-27T10:00:00Z")],
            to: signedInRows()
        )

        XCTAssertEqual(after.map(\.token), ["t2", "t1", "t9"], "Appended, not substituted.")
        XCTAssertTrue(after[2].deviceLocal)
    }

    func testAServerRowSurvivesLosingItsDeviceEntryButADeviceOnlyRowDoesNot() {
        let rows = LandingRow.applyingDevice(
            [device("t1", seenAt: "2026-07-27T10:00:00Z"), device("t9", seenAt: "2026-07-27T10:00:00Z")],
            to: signedInRows(deviceToken: "t1")
        )
        XCTAssertEqual(rows.map(\.token), ["t2", "t1", "t9"])

        // Both were removed from this device (the swipe is local only).
        let after = LandingRow.applyingDevice([], to: rows)

        XCTAssertEqual(after.map(\.token), ["t2", "t1"], "t9 was only ever a device row.")
        XCTAssertFalse(after[1].deviceLocal, "…and t1 is no longer removable from here.")
    }

    func testAnUntokenedServerRowIsUntouchedByADeviceRefresh() {
        let mine = DashboardMyRoundsOutput(
            produced: [DashboardRoundEntry(round: round(id: "r1", date: "2026-07-20"), ballIds: [], slots: [], shareToken: nil)],
            created: []
        )
        let rows = LandingRow.merge(device: [], mine: mine)

        XCTAssertEqual(LandingRow.applyingDevice([], to: rows).map(\.id), ["r1"])
    }

    func testAnEmptyScreenSeedsStraightFromTheDeviceList() {
        // First appearance, before `.task` has fetched anything.
        let after = LandingRow.applyingDevice([device("t9", seenAt: "2026-07-27T10:00:00Z")], to: [])

        XCTAssertEqual(after.map(\.token), ["t9"])
    }

    // MARK: - Partition

    private let now = DeviceRoundsStore.isoFormatter.date(from: "2026-07-27T12:00:00Z")!

    func testNotStartedAndActiveAreOngoing() {
        let rows = LandingRow.fromDevice([
            device("a", status: .notStarted, seenAt: "2026-07-27T10:00:00Z"),
            device("b", status: .active, seenAt: "2026-07-27T11:00:00Z"),
        ])

        let partition = LandingRow.partition(rows, now: now)

        XCTAssertEqual(Set(partition.ongoing.map(\.token)), ["a", "b"])
        XCTAssertTrue(partition.finished.isEmpty)
    }

    func testOngoingSortsMostRecentlyActiveFirst() {
        let rows = LandingRow.fromDevice([
            device("old", seenAt: "2026-07-20T10:00:00Z"),
            device("new", seenAt: "2026-07-27T10:00:00Z"),
        ])

        XCTAssertEqual(LandingRow.partition(rows, now: now).ongoing.map(\.token), ["new", "old"])
    }

    func testAFinishedRoundInsideTheWindowShowsAndAnOlderOneDoesNot() {
        let rows = LandingRow.fromDevice([
            device("recent", status: .complete, seenAt: "2026-07-20T10:00:00Z", completedAt: "2026-07-20T10:00:00Z"),
            device("ancient", status: .complete, seenAt: "2026-05-01T10:00:00Z", completedAt: "2026-05-01T10:00:00Z"),
        ])

        let partition = LandingRow.partition(rows, now: now)

        XCTAssertEqual(partition.finished.map(\.token), ["recent"])
        XCTAssertTrue(partition.ongoing.isEmpty, "An old finished round drops off the landing entirely.")
    }

    func testAFinishedRoundWithNoCompletedAtIsAlwaysKept() {
        // Unwindowable, but plainly done — dropping it would hide a round the
        // user just finished on a client that never sent a completion time.
        let rows = LandingRow.fromDevice([device("x", status: .complete, seenAt: "2026-01-01T00:00:00Z")])

        XCTAssertEqual(LandingRow.partition(rows, now: now).finished.map(\.token), ["x"])
    }

    func testFinishedSortsNewestCompletionFirst() {
        let rows = LandingRow.fromDevice([
            device("older", status: .complete, seenAt: "2026-07-26T10:00:00Z", completedAt: "2026-07-21T10:00:00Z"),
            device("newer", status: .complete, seenAt: "2026-07-20T10:00:00Z", completedAt: "2026-07-25T10:00:00Z"),
        ])

        XCTAssertEqual(LandingRow.partition(rows, now: now).finished.map(\.token), ["newer", "older"])
    }

    func testTheWindowBoundaryIsInclusive() {
        let onCutoff = LandingRow.fromDevice([
            device("edge", status: .complete, seenAt: "2026-07-13T12:00:00Z", completedAt: "2026-07-13T12:00:00Z")
        ])

        XCTAssertEqual(LandingRow.partition(onCutoff, now: now).finished.map(\.token), ["edge"])
    }

    // MARK: - Time parsing

    func testBothTimestampSpellingsParse() {
        // The two sources disagree on format: device rows carry an instant,
        // server rows carry a bare round date. Both have to sort.
        XCTAssertNotNil(LandingRow.parse("2026-07-27T12:00:00Z"))
        XCTAssertNotNil(LandingRow.parse("2026-07-27T12:00:00.123Z"))
        XCTAssertNotNil(LandingRow.parse("2026-07-27"))
        XCTAssertNil(LandingRow.parse("not a date"))
        XCTAssertNil(LandingRow.parse(nil))
        XCTAssertNil(LandingRow.parse(""))
    }

    func testRowsWithNoSortKeyGoLast() {
        var rows = LandingRow.fromDevice([device("dated", seenAt: "2026-07-20T10:00:00Z")])
        rows.append(
            LandingRow(
                id: "undated",
                token: "undated",
                courseName: "",
                status: .active,
                completedAt: nil,
                lastActivityAt: nil,
                roleLabel: nil,
                date: nil,
                deviceLocal: true
            )
        )

        XCTAssertEqual(LandingRow.partition(rows, now: now).ongoing.map(\.token), ["dated", "undated"])
    }
}
