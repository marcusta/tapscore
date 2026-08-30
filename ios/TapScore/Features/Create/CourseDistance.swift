import Foundation

/// A latitude/longitude pair. The create flow's one fix, and the courses'
/// stored positions, both wear this shape.
struct GeoPoint: Sendable, Equatable {
    var latitude: Double
    var longitude: Double
}

/// Distance logic for the course picker (pure — no CoreLocation, no UI).
///
/// Mirrors the web's `src/create/course-distance.ts`: the picker stays grouped
/// by club, so ordering works on CLUBS — a club sorts by its nearest course,
/// clubs without any positioned course keep the server's order and go last,
/// and courses within a club are never reordered (a club's courses share a
/// site; ranking them by metres would only shuffle names the golfer knows by
/// heart).
enum CourseDistance {
    private static let earthRadiusKm = 6371.0

    static func haversineKm(_ a: GeoPoint, _ b: GeoPoint) -> Double {
        func rad(_ deg: Double) -> Double { deg * .pi / 180 }
        let dLat = rad(b.latitude - a.latitude)
        let dLon = rad(b.longitude - a.longitude)
        let h = pow(sin(dLat / 2), 2)
            + cos(rad(a.latitude)) * cos(rad(b.latitude)) * pow(sin(dLon / 2), 2)
        return 2 * earthRadiusKm * asin(sqrt(h))
    }

    /// A course's distance from `pos`; nil when the course has no position.
    static func courseKm(_ course: SetupCourse, from pos: GeoPoint) -> Double? {
        guard let lat = course.latitude, let lon = course.longitude else { return nil }
        return haversineKm(pos, GeoPoint(latitude: lat, longitude: lon))
    }

    /// The positioned course closest to `pos`; nil when none has a position.
    static func nearest(_ courses: [SetupCourse], from pos: GeoPoint) -> SetupCourse? {
        var best: SetupCourse?
        var bestKm = Double.infinity
        for course in courses {
            if let km = courseKm(course, from: pos), km < bestKm {
                best = course
                bestKm = km
            }
        }
        return best
    }

    /// A distance as the picker words it: metres under a kilometre, one
    /// decimal up to ten, whole kilometres beyond ("540 m", "2.3 km",
    /// "23 km") — the same wording the web picker uses.
    static func label(km: Double) -> String {
        if km < 1 { return "\(Int((km * 100).rounded()) * 10) m" }
        if km < 10 { return String(format: "%.1f km", (km * 10).rounded() / 10) }
        return "\(Int(km.rounded())) km"
    }
}
