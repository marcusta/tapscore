import Foundation
import XCTest
@testable import TapScore

/// What the home screen is allowed to say about somebody else's round.
final class FriendsActivityModelTests: XCTestCase {
    private func friend(
        _ id: String,
        _ name: String,
        holes: Double,
        toPar: Double? = nil,
        avatarVersion: String? = nil
    ) -> FriendsActivityFriend {
        FriendsActivityFriend(
            playerId: id,
            displayName: name,
            avatarVersion: avatarVersion,
            holesPlayed: holes,
            scoreToPar: toPar
        )
    }

    private func entry(
        _ roundId: String,
        course: String? = "Linköping",
        friends: [FriendsActivityFriend]
    ) -> FriendsActivityEntry {
        FriendsActivityEntry(
            roundId: roundId,
            name: nil,
            courseName: course,
            date: "2026-07-30",
            status: .active,
            holeCount: 18,
            lastActivityAt: nil,
            friends: friends
        )
    }

    func testEmptyFeedHasNoContextLineAtAll() {
        // The strip must not be able to render a "nobody is playing" state:
        // there is no copy for it, by construction.
        XCTAssertNil(FriendsActivityModel.contextLine([]))
        XCTAssertTrue(FriendsActivityModel.chips([]).isEmpty)
    }

    func testContextLineCountsPeopleNotRounds() {
        let rounds = [
            entry("r1", friends: [friend("p1", "Anna", holes: 7, toPar: 3)]),
            // Same person, a second live round: still one friend on the course.
            entry("r2", friends: [friend("p1", "Anna", holes: 2, toPar: 0)]),
            entry("r3", friends: [
                friend("p2", "Bert", holes: 9, toPar: -1),
                friend("p3", "Cilla", holes: 9, toPar: 5),
            ]),
        ]
        XCTAssertEqual(FriendsActivityModel.contextLine(rounds), "3 friends on the course")
        XCTAssertEqual(FriendsActivityModel.friendIds(rounds), ["p1", "p2", "p3"])
    }

    func testSingularContextLine() {
        let one = [entry("r1", friends: [friend("p1", "Anna", holes: 1)])]
        XCTAssertEqual(FriendsActivityModel.contextLine(one), "1 friend on the course")
    }

    func testChipCarriesHolesAndScoreToParAndNothingFiner() {
        let chips = FriendsActivityModel.chips([
            entry("r1", friends: [
                friend("p1", "Anna Lind", holes: 7, toPar: 3, avatarVersion: "abc123")
            ])
        ])
        XCTAssertEqual(chips.count, 1)
        XCTAssertEqual(chips[0].roundId, "r1")
        XCTAssertEqual(chips[0].title, "Anna Lind")
        XCTAssertEqual(chips[0].progress, "Thru 7 · +3")
        // Who the chip is about, in the form the avatar needs: the id and the
        // photo version, carried from the lead friend rather than re-derived.
        XCTAssertEqual(chips[0].playerId, "p1")
        XCTAssertEqual(chips[0].avatarVersion, "abc123")
    }

    func testSeveralFriendsInOneRoundCollapseToLeadPlusCount() {
        let chips = FriendsActivityModel.chips([
            entry("r1", friends: [
                friend("p1", "Anna", holes: 5, toPar: 0),
                friend("p2", "Bert", holes: 5, toPar: 9),
                friend("p3", "Cilla", holes: 5, toPar: 1),
            ])
        ])
        XCTAssertEqual(chips[0].title, "Anna + 2")
        // Bert's 9-over is NOT on the home screen — only the lead friend's
        // line is, and even that is only holes and total.
        XCTAssertEqual(chips[0].progress, "Thru 5 · E")
    }

    func testFriendWithNoHolesReadsAsTeeingOffRatherThanLevelPar() {
        // The round is live because somebody scored; claiming "E" for a player
        // who has not putted yet would be a scoreline they never made.
        XCTAssertEqual(
            FriendsActivityModel.progress(friend("p1", "Anna", holes: 0, toPar: 0)),
            "Teeing off"
        )
    }

    func testMissingScoreToParStillShowsProgress() {
        XCTAssertEqual(
            FriendsActivityModel.progress(friend("p1", "Anna", holes: 4, toPar: nil)),
            "Thru 4"
        )
    }

    func testScoreToParUsesGolfSigns() {
        XCTAssertEqual(FriendsActivityModel.scoreToPar(0), "E")
        XCTAssertEqual(FriendsActivityModel.scoreToPar(3), "+3")
        XCTAssertEqual(FriendsActivityModel.scoreToPar(-2), "-2")
    }

    func testRoundWithNoNamedFriendIsNotRendered() {
        // Nothing to attribute it to; an anonymous "somebody is playing" chip
        // is not a thing this strip offers.
        XCTAssertTrue(FriendsActivityModel.chips([entry("r1", friends: [])]).isEmpty)
    }
}
