import XCTest
@testable import TapScore

/// The tee sort and the gender defaults are the two places this flow decides
/// something the WEB decides differently (spec §13 W3/W4/W5), so they are pure
/// functions with the spec's own vectors as their tests: §4.3.1's T1–T10 for the
/// order, §4.4 B4.3's three branches for the defaults.
///
/// Nothing here touches a store, a view or a network — if one of these fails,
/// the failure is in the rule, not in the plumbing.
final class TeeOrderTests: XCTestCase {
    // MARK: - §4.3.1 — the normative sort vectors

    func testSpecSortVectors() {
        let vectors: [(String, [String], [String])] = [
            ("T1", ["Blå", "Gul", "Orange", "Röd", "Vit"], ["Vit", "Gul", "Blå", "Röd", "Orange"]),
            ("T2", ["Red", "Yellow"], ["Yellow", "Red"]),
            ("T3",
             ["Svart", "Vit", "Gul", "Blå", "Röd", "Orange"],
             ["Svart", "Vit", "Gul", "Blå", "Röd", "Orange"]),
            ("T4", ["47", "53", "58"], ["58", "53", "47"]),
            ("T5", ["53", "Gul", "58", "Röd"], ["58", "53", "Gul", "Röd"]),
            ("T6", ["Gul", "Junior", "58"], ["58", "Gul", "Junior"]),
            ("T7", ["Gul herr", "Gul dam"], ["Gul herr", "Gul dam"]),
            ("T8", [], []),
            ("T9", ["Orange", "Blue", "black"], ["black", "Blue", "Orange"]),
            ("T10", ["6120 m", "5540 m", "Röd"], ["6120 m", "5540 m", "Röd"]),
        ]
        for (id, input, expected) in vectors {
            XCTAssertEqual(TeeOrder.sorted(input, name: { $0 }), expected, id)
        }
    }

    /// The sort is a FUNCTION: running it on its own output must not move
    /// anything, or the list would shuffle every time a view re-read it.
    func testTheSortIsIdempotent() {
        let input = ["53", "Gul", "58", "Röd", "Junior"]
        let once = TeeOrder.sorted(input, name: { $0 })
        XCTAssertEqual(TeeOrder.sorted(once, name: { $0 }), once)
    }

    /// A course that names its tees for the people who play them still sorts in
    /// canon when the record carries a colour (§4.3 step 1's fallback).
    func testColourIsTheFallbackWhenTheNameSaysNothing() {
        let tees = [
            tee("t1", "Damer", colour: "röd"),
            tee("t2", "Herrar", colour: "gul"),
        ]
        XCTAssertEqual(TeeOrder.sorted(tees).map(\.id), ["t2", "t1"])
    }

    /// …but the NAME wins when it classifies, so a mis-tagged colour column
    /// cannot reorder a list the user reads by name.
    func testTheNameWinsOverTheColour() {
        let tees = [
            tee("t1", "Röd", colour: "svart"),
            tee("t2", "Gul", colour: "orange"),
        ]
        XCTAssertEqual(TeeOrder.sorted(tees).map(\.id), ["t2", "t1"])
    }

    /// `58` is a length; `58 holes of fun` is a name. Two words at most, and the
    /// second must be a unit — otherwise a numeric prefix would drag a plainly
    /// named tee to the top of the list.
    func testOnlyARealLengthCountsAsNumeric() {
        XCTAssertEqual(TeeOrder.length(of: "6120 m"), 6120)
        XCTAssertEqual(TeeOrder.length(of: "5,8"), 5.8)
        XCTAssertNil(TeeOrder.length(of: "58 holes of fun"))
        XCTAssertNil(TeeOrder.length(of: "-58"))
        XCTAssertNil(TeeOrder.length(of: "0"))
        XCTAssertNil(TeeOrder.length(of: "Gul"))
    }

    // MARK: - §4.4 B4.3 — the gender defaults

    /// The canon branch: M takes the first tee at rank ≥ 2 (gul), F the first at
    /// rank ≥ 4 (röd) — NOT the alphabetically first tee the web hands both.
    func testCanonDefaultsPickYellowForMenAndRedForWomen() {
        let tees = [
            tee("svart", "Svart"), tee("vit", "Vit"), tee("gul", "Gul"),
            tee("bla", "Blå"), tee("rod", "Röd"), tee("orange", "Orange"),
        ]
        XCTAssertEqual(TeeOrder.defaultTee(in: tees, for: .m)?.id, "gul")
        XCTAssertEqual(TeeOrder.defaultTee(in: tees, for: .f)?.id, "rod")
    }

    /// A tee with no rating for the gender can never BE that gender's default —
    /// rule 1, and the whole reason these defaults exist (W5).
    func testADefaultIsOnlyEverChosenFromRatedTees() {
        let tees = [
            tee("vit", "Vit", genders: [.m]),
            tee("gul", "Gul", genders: [.m]),
            tee("rod", "Röd", genders: [.m, .f]),
            tee("orange", "Orange", genders: [.f]),
        ]
        XCTAssertEqual(TeeOrder.defaultTee(in: tees, for: .m)?.id, "gul")
        XCTAssertEqual(TeeOrder.defaultTee(in: tees, for: .f)?.id, "rod")
    }

    /// Nothing at or below the threshold: take the shortest tee the gender may
    /// play rather than nothing at all.
    func testWithNothingShortEnoughTheDefaultIsTheShortestPlayableTee() {
        let tees = [tee("svart", "Svart"), tee("vit", "Vit")]
        XCTAssertEqual(TeeOrder.defaultTee(in: tees, for: .m)?.id, "vit")
        XCTAssertEqual(TeeOrder.defaultTee(in: tees, for: .f)?.id, "vit")
    }

    /// The length-named branch: men longest, women shortest.
    func testNumericOnlySetsGiveMenTheLongestAndWomenTheShortest() {
        let tees = [tee("t47", "47"), tee("t58", "58"), tee("t53", "53")]
        XCTAssertEqual(TeeOrder.defaultTee(in: tees, for: .m)?.id, "t58")
        XCTAssertEqual(TeeOrder.defaultTee(in: tees, for: .f)?.id, "t47")
    }

    /// No rated tee at all ⇒ **unset**, which §4.7 turns into a row-scoped
    /// sentence. Guessing a tee here would be guessing a scorecard.
    func testAGenderWithNoRatedTeeHasNoDefault() {
        let tees = [tee("vit", "Vit", genders: [.m])]
        XCTAssertNil(TeeOrder.defaultTee(in: tees, for: .f))
        XCTAssertEqual(TeeOrder.defaultTee(in: tees, for: .m)?.id, "vit")
    }

    func testAnEmptyCourseHasNoDefaults() {
        XCTAssertNil(TeeOrder.defaultTee(in: [], for: .m))
        XCTAssertNil(TeeOrder.defaultTee(in: [], for: .f))
    }

    // MARK: - Helpers

    private func tee(
        _ id: String,
        _ name: String,
        colour: String? = nil,
        genders: [PlayerGender] = [.m, .f]
    ) -> Tee {
        Tee(
            id: id,
            courseId: "c1",
            name: name,
            colour: colour,
            holeLengths: [],
            ratings: genders.map {
                TeeRating(gender: $0, courseRating: 72, slope: 113, par: 72, totalLengthM: 5800)
            })
    }
}
