import XCTest
@testable import TapScore

/// Location-aware behaviour of the create flow: a position fix orders the
/// club groups by distance and seeds the nearest course — and only while the
/// flow has no course yet. `applyPosition` is the store's seam; CoreLocation
/// never appears in these tests.
final class CreateCourseLocationTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
        routeCatalog()
        // The default catalog, with coordinates: club-1's two courses around
        // Linköping, club-2's one in Söderköping.
        RoundStubURLProtocol.route("/setup/courses", """
        [\(CreateStubs.course("course-1", club: "club-1", name: "Hjulsbro",
                              latitude: 58.39, longitude: 15.68)),
         \(CreateStubs.course("course-2", club: "club-1", name: "Vreta Kloster",
                              latitude: 58.49, longitude: 15.51)),
         \(CreateStubs.course("course-3", club: "club-2", name: "Söderköping",
                              latitude: 58.48, longitude: 16.32))]
        """)
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    private let nearSoderkoping = GeoPoint(latitude: 58.47, longitude: 16.30)

    // MARK: - Preselect

    @MainActor
    func testFixAfterLoadSeedsTheNearestCourse() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        XCTAssertNil(store.courseId, "no fix, no seed — the picker waits")

        await store.applyPosition(nearSoderkoping)
        XCTAssertEqual(store.courseId, "course-3")
        // Seeded through `selectCourse`, so the tees came with it.
        XCTAssertEqual(
            RoundStubURLProtocol.requests(for: "/setup/tees/by-course").count, 1)
        XCTAssertTrue(store.courseStepComplete)
    }

    @MainActor
    func testFixBeforeLoadSeedsOnceTheCatalogLands() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.applyPosition(nearSoderkoping)
        XCTAssertNil(store.courseId, "nothing to seed from yet")

        await store.load()
        XCTAssertEqual(store.courseId, "course-3")
    }

    @MainActor
    func testFixNeverMovesACourseTheUserPicked() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.selectCourse("course-1")

        await store.applyPosition(nearSoderkoping)
        XCTAssertEqual(store.courseId, "course-1")
    }

    // MARK: - Ordering

    @MainActor
    func testGroupsKeepServerOrderWithoutAFixAndSortByDistanceWithOne() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        XCTAssertEqual(store.courseGroups().map(\.clubId), ["club-1", "club-2"])
        XCTAssertNil(store.courseGroups().first?.distanceKm)

        await store.applyPosition(nearSoderkoping)
        let groups = store.courseGroups()
        XCTAssertEqual(groups.map(\.clubId), ["club-2", "club-1"])
        // The group distance is its nearest course's, worded onto the header.
        XCTAssertLessThan(groups[0].distanceKm ?? .infinity, 5)
        // Within club-1 the server's course order survives the re-sort.
        XCTAssertEqual(groups[1].courses.map(\.id), ["course-1", "course-2"])
    }

    @MainActor
    func testClubsWithoutCoordinatesGoLastInServerOrder() async {
        RoundStubURLProtocol.route("/setup/courses", """
        [\(CreateStubs.course("course-1", club: "club-1", name: "Hjulsbro")),
         \(CreateStubs.course("course-3", club: "club-2", name: "Söderköping",
                              latitude: 58.48, longitude: 16.32))]
        """)
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.applyPosition(nearSoderkoping)

        let groups = store.courseGroups()
        XCTAssertEqual(groups.map(\.clubId), ["club-2", "club-1"])
        XCTAssertNil(groups[1].distanceKm)
    }

    @MainActor
    func testFilteringKeepsTheGroupDistance() async {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        await store.applyPosition(nearSoderkoping)

        store.courseSearch = "söder"
        let groups = store.filteredCourseGroups()
        XCTAssertEqual(groups.map(\.clubId), ["club-2"])
        XCTAssertNotNil(groups[0].distanceKm)
    }
}
