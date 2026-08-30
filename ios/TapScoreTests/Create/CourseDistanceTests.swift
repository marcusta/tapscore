import XCTest
@testable import TapScore

/// Pure distance logic for the course picker — haversine, nearest course, and
/// the worded labels. Mirrors `tests/create/course-distance.test.ts` on the
/// web so the two pickers keep agreeing on what "930 m" means.
final class CourseDistanceTests: XCTestCase {
    private let stockholm = GeoPoint(latitude: 59.3293, longitude: 18.0686)

    private func course(
        _ id: String,
        latitude: Double?,
        longitude: Double?
    ) -> SetupCourse {
        SetupCourse(
            id: id, clubId: "club", name: id, holeCount: 18,
            latitude: latitude, longitude: longitude, holes: [], clubName: "Club")
    }

    func testHaversineStockholmToGoteborg() {
        let km = CourseDistance.haversineKm(
            stockholm, GeoPoint(latitude: 57.7089, longitude: 11.9746))
        XCTAssertGreaterThan(km, 390)
        XCTAssertLessThan(km, 405)
    }

    func testCourseKmIsNilWithoutCoordinates() {
        XCTAssertNil(CourseDistance.courseKm(
            course("x", latitude: nil, longitude: nil), from: stockholm))
    }

    func testNearestPicksTheClosestPositionedCourse() {
        let far = course("far", latitude: 57.7089, longitude: 11.9746)
        let near = course("near", latitude: 59.33, longitude: 18.07)
        let unpositioned = course("none", latitude: nil, longitude: nil)
        XCTAssertEqual(
            CourseDistance.nearest([far, near, unpositioned], from: stockholm)?.id,
            "near")
        XCTAssertNil(CourseDistance.nearest([unpositioned], from: stockholm))
    }

    func testLabelWording() {
        XCTAssertEqual(CourseDistance.label(km: 0.54), "540 m")
        XCTAssertEqual(CourseDistance.label(km: 0.049), "50 m")
        XCTAssertEqual(CourseDistance.label(km: 2.34), "2.3 km")
        XCTAssertEqual(CourseDistance.label(km: 9.96), "10.0 km")
        XCTAssertEqual(CourseDistance.label(km: 23.4), "23 km")
    }
}
