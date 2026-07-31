import Foundation
import XCTest
@testable import TapScore

final class FriendListModelTests: XCTestCase {
    private func friend(
        _ id: String,
        name: String,
        count: Double = 0,
        last: String? = nil,
        frecency: Double = 0,
        isMutual: Bool = true
    ) -> FriendProfile {
        FriendProfile(
            sharedRoundCount: count,
            lastPlayedAt: last,
            frecency: frecency,
            isMutual: isMutual,
            id: id,
            username: id,
            displayName: name
        )
    }

    func testOnlyOneWayConnectionsAreAnnotated() {
        // A working friendship says nothing at all — the absence of copy IS
        // the design; annotating every row would make "friend" look conditional.
        XCTAssertNil(FriendListModel.connectionNote(friend("a", name: "Anna")))
        XCTAssertEqual(
            FriendListModel.connectionNote(friend("b", name: "Bert", isMutual: false)),
            "hasn't added you back"
        )
    }

    func testSearchRequiresTwoTrimmedCharacters() {
        XCTAssertFalse(FriendListModel.isSearchable(""))
        XCTAssertFalse(FriendListModel.isSearchable(" j "))
        XCTAssertTrue(FriendListModel.isSearchable(" jo "))
    }

    func testSuggestedAndAlphabeticalAreDifferentExplicitOrders() {
        let never = friend("anna", name: "Anna")
        let regular = friend(
            "zoe",
            name: "Zoë",
            count: 4,
            last: "2026-07-28T12:00:00.000Z",
            frecency: 9
        )

        XCTAssertEqual(
            FriendListModel.sorted([never, regular], mode: .suggested).map(\.id),
            ["zoe", "anna"]
        )
        XCTAssertEqual(
            FriendListModel.sorted([never, regular], mode: .alphabetical).map(\.id),
            ["anna", "zoe"]
        )
    }

    func testSubtitleExplainsTheSuggestedSignal() throws {
        let now = try XCTUnwrap(
            ISO8601DateFormatter().date(from: "2026-07-29T12:00:00Z")
        )
        XCTAssertEqual(
            FriendListModel.subtitle(
                friend(
                    "j",
                    name: "Johana",
                    count: 2,
                    last: "2026-07-28T12:00:00Z",
                    frecency: 1
                ),
                now: now
            ),
            "played 2×, yesterday"
        )
        XCTAssertEqual(
            FriendListModel.subtitle(friend("n", name: "Never"), now: now),
            "never played"
        )
    }

    func testInitialsAndMissingHandicapMatchTheRows() {
        XCTAssertEqual(FriendListModel.initials(" Johan  Lindström "), "JL")
        XCTAssertEqual(FriendListModel.handicap(4.14), "4.1")
        XCTAssertEqual(FriendListModel.handicap(nil), "–")
    }
}
