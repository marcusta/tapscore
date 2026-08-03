import XCTest
@testable import TapScore

/// The catalog every create-flow suite loads against — clubs, courses, tees,
/// and the format descriptors the parity fixtures were generated from.
///
/// Shared rather than per-suite because the descriptors are the load-bearing
/// part: `WebDraftFixtures.catalogJSON` is the SAME bytes `GET /setup/formats`
/// served the web when it produced the pinned drafts, so a store test and a
/// parity test are reasoning about one catalog rather than two hand-typed ones
/// that can drift apart.
enum CreateStubs {
    static let clubs = """
    [{"id":"club-1","name":"Linköpings GK","location":null,"logoUrl":null,"courseCount":2},
     {"id":"club-2","name":"Norrköpings GK","location":null,"logoUrl":null,"courseCount":1}]
    """

    static let courses = """
    [\(course("course-1", club: "club-1", name: "Hjulsbro")),
     \(course("course-2", club: "club-1", name: "Vreta Kloster")),
     \(course("course-3", club: "club-2", name: "Söderköping"))]
    """

    /// Served in an order NO rule would produce — so "the canon order" cannot
    /// pass by echoing the server. White carries a men's rating only, which is
    /// what makes it an override a woman must be stopped from playing (B4.11).
    static let tees = """
    [\(tee("tee-r", name: "Red", colour: "red")),
     \(tee("tee-y", name: "Yellow", colour: "yellow")),
     \(tee("tee-w", name: "White", colour: "white", genders: ["M"]))]
    """

    static func course(_ id: String, club: String, name: String) -> String {
        let holes = (1...18)
            .map { "{\"holeNumber\":\($0),\"par\":4,\"strokeIndex\":\($0)}" }
            .joined(separator: ",")
        return """
        {"id":"\(id)","clubId":"\(club)","clubName":"Club","name":"\(name)",
         "holeCount":18,"holes":[\(holes)]}
        """
    }

    static func tee(
        _ id: String,
        name: String,
        colour: String?,
        genders: [String] = ["M", "F"]
    ) -> String {
        let colourJSON = colour.map { "\"\($0)\"" } ?? "null"
        let ratings = genders
            .map { """
            {"gender":"\($0)","courseRating":72,"slope":113,"par":72,"totalLengthM":5800}
            """ }
            .joined(separator: ",")
        return """
        {"id":"\(id)","courseId":"course-1","name":"\(name)","colour":\(colourJSON),
         "holeLengths":[],"ratings":[\(ratings)]}
        """
    }

    /// `GET /setup/formations`, byte-for-byte the table in
    /// `server/domain/round-setup/formation-catalog.ts` (id-sorted, as the
    /// server sorts it). Typed out rather than generated because it IS the
    /// contract these tests assert against — 35/15 and 50/50 are the values a
    /// scorecard is built from, and a fixture that derived them from the same
    /// code as the assertion would prove nothing.
    static let formations = """
    [{"id":"foursomes","labels":{"en":"Foursomes","sv":"Foursome"},
      "size":{"min":2,"max":2},"allowancesBySize":{"2":[50,50]}},
     {"id":"greensomes","labels":{"en":"Greensomes","sv":"Greensome"},
      "size":{"min":2,"max":2},"allowancesBySize":{"2":[60,40]}},
     {"id":"scramble","labels":{"en":"Scramble","sv":"Scramble"},
      "size":{"min":2,"max":8},"allowancesBySize":{
        "2":[35,15],"3":[30,20,10],"4":[25,20,15,10],"5":[25,20,15,10,5],
        "6":[25,20,15,10,5,0],"7":[25,20,15,10,5,0,0],"8":[25,20,15,10,5,0,0,0]}}]
    """

    static func guest(_ id: String) -> String {
        """
        {"id":"\(id)","displayName":"Guest","gender":"M","handicapIndex":12,
         "claimedByPlayerId":null,"claimedAt":null}
        """
    }
}

extension XCTestCase {
    /// Everything `CreateStore.load()` and the first course pick ask for.
    func routeCatalog() {
        RoundStubURLProtocol.route("/setup/clubs", CreateStubs.clubs)
        RoundStubURLProtocol.route("/setup/courses", CreateStubs.courses)
        RoundStubURLProtocol.route("/setup/formats", WebDraftFixtures.catalogJSON)
        RoundStubURLProtocol.route("/setup/formations", CreateStubs.formations)
        RoundStubURLProtocol.route("/setup/tees/by-course", CreateStubs.tees)
    }

    func guestJSON(_ id: String) -> String { CreateStubs.guest(id) }
}
