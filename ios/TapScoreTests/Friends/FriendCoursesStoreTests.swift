import XCTest
@testable import TapScore

final class FriendCoursesStoreTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    @MainActor
    func testLoadCarriesCoursesAndTheTruncationFlag() async {
        RoundStubURLProtocol.route(
            "/friends/p2/courses",
            FriendProfileFixtures.coursePage(
                courses: [
                    FriendProfileFixtures.course("c1"),
                    // A deleted course whose snapshot also vanished: the name
                    // is null and the row still has to render.
                    FriendProfileFixtures.course("c2", courseName: nil, roundsPlayed: 1),
                ],
                hasMore: true
            )
        )

        let store = FriendCoursesStore(playerId: "p2", api: RoundStubURLProtocol.makeAPI())
        await store.load()

        XCTAssertEqual(store.courses.map(\.courseId), ["c1", "c2"])
        XCTAssertNil(store.courses[1].courseName)
        XCTAssertTrue(store.hasMore, "truncation must survive into the store")
        XCTAssertNil(store.unavailable)
    }

    @MainActor
    func testForbiddenMapsToItsOwnState() async {
        RoundStubURLProtocol.route(
            "/friends/p2/courses", status: 403, "{\"error\":\"forbidden\"}"
        )

        let store = FriendCoursesStore(playerId: "p2", api: RoundStubURLProtocol.makeAPI())
        await store.load()

        XCTAssertEqual(store.unavailable, .forbidden)
        XCTAssertNil(store.loadError)
        XCTAssertTrue(store.courses.isEmpty)
    }
}
