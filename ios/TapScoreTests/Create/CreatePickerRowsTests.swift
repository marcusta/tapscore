import XCTest
@testable import TapScore

/// The three dropdowns on the create flow, as data.
///
/// What is under test is what the user READS: that the course list keeps the
/// server's grouping and order, that a rotating start hole discloses the
/// handicap consequence (B3.7) before it is chosen, and that an unrated tee is
/// annotated in words rather than marked with a glyph.
final class CreatePickerRowsTests: XCTestCase {
    // MARK: - Courses

    func testCourseGroupsKeepClubHeadersAndServerOrder() {
        let groups = CreatePickerRows.courses([
            CreateStore.CourseGroup(
                clubId: "club-2", clubName: "Halmstad GK",
                courses: [course("north", club: "club-2", name: "North")]),
            CreateStore.CourseGroup(
                clubId: "club-1", clubName: "Linköpings Golfklubb",
                courses: [
                    course("lkpg", club: "club-1", name: "Linköping"),
                    course("lkpg118", club: "club-1", name: "Linköpings Golfklubb 1-18"),
                ]),
        ])

        XCTAssertEqual(groups.map(\.header), ["Halmstad GK", "Linköpings Golfklubb"])
        XCTAssertEqual(groups.map(\.id), ["club-2", "club-1"])
        XCTAssertEqual(
            groups[1].rows.map(\.title),
            ["Linköping", "Linköpings Golfklubb 1-18"])
        XCTAssertEqual(groups[1].rows.map(\.value), ["lkpg", "lkpg118"])
        // A club is a HEADER — it never appears as a selectable row, so no row
        // value is a club id.
        XCTAssertFalse(TapDropdownModel.rows(in: groups).contains { $0.value.hasPrefix("club-") })
    }

    // MARK: - Start hole

    /// One row per permitted hole — no chip wall, and the route's own holes,
    /// never a hardcoded 1…18 (B3.2).
    func testStartHoleRowsCoverExactlyTheRoutesHoles() {
        let groups = CreatePickerRows.startHoles(Array(10...18))
        XCTAssertEqual(groups.count, 1)
        XCTAssertNil(groups[0].header)
        XCTAssertEqual(groups[0].rows.map(\.value), Array(10...18))
        XCTAssertEqual(groups[0].rows.first?.title, "Hole 10")
    }

    /// B3.7: the disclosure is an ANNOTATION on the rows that cause it, and the
    /// route's first hole — 1 on Full 18, 10 on Back 9 — carries none.
    func testOnlyRotatingStartHolesCarryTheHandicapDisclosure() {
        let full = CreatePickerRows.startHoles(Array(1...18))[0].rows
        XCTAssertNil(full[0].annotation)
        XCTAssertEqual(full[9].annotation?.text, "Won't count for handicap")
        XCTAssertEqual(full[9].annotation?.tone, .muted)

        let back = CreatePickerRows.startHoles(Array(10...18))[0].rows
        XCTAssertNil(back[0].annotation, "hole 10 IS the head of back 9")
        XCTAssertNotNil(back[4].annotation)
    }

    func testNoHolesYieldsNoGroups() {
        XCTAssertTrue(CreatePickerRows.startHoles([]).isEmpty)
    }

    // MARK: - Tees

    /// The list arrives §4.3-sorted and is drawn AS GIVEN — one block, not a
    /// rated block and an unrated one, which would re-order the picker behind
    /// the sort's back (B4.1).
    func testTeeRowsPreserveTheCanonOrderTheyWereHanded() {
        let sorted = TeeOrder.sorted([
            tee("bla", "Blå"), tee("gul", "Gul"), tee("orange", "Orange", genders: [.f]),
            tee("rod", "Röd"), tee("vit", "Vit", genders: [.m]),
        ])
        let rows = CreatePickerRows.tees(sorted, for: .m)[0].rows
        XCTAssertEqual(rows.map(\.title), ["Vit", "Gul", "Blå", "Röd", "Orange"])
    }

    /// The rejected `⚠` is gone: the warning is a sentence with a tone, the
    /// title is just the tee's name, and the row stays selectable (B4.13).
    func testAnUnratedTeeIsAnnotatedInWordsAndStaysSelectable() {
        let tees = [tee("vit", "Vit", genders: [.m]), tee("orange", "Orange", genders: [.f])]

        let menRows = CreatePickerRows.tees(tees, for: .m)[0].rows
        XCTAssertNil(menRows[0].annotation)
        XCTAssertEqual(menRows[1].title, "Orange")
        XCTAssertEqual(menRows[1].annotation?.text, "No men's rating")
        XCTAssertEqual(menRows[1].annotation?.tone, .danger)

        let womenRows = CreatePickerRows.tees(tees, for: .f)[0].rows
        XCTAssertEqual(womenRows[0].annotation?.text, "No women's rating")
        XCTAssertNil(womenRows[1].annotation)

        // Every tee is offered to both genders — an unselectable list is a dead
        // end on a course with no ratings for one of them.
        XCTAssertEqual(menRows.count, tees.count)
        XCTAssertEqual(womenRows.count, tees.count)
    }

    func testNoTeeTitleCarriesAWarningGlyph() {
        let rows = CreatePickerRows.tees([tee("vit", "Vit", genders: [.m])], for: .f)[0].rows
        XCTAssertEqual(rows.map(\.title), ["Vit"])
        XCTAssertFalse(rows[0].title.contains("⚠"))
    }

    // MARK: - Formats (the custom slot's picker)

    /// B0.2/B0.4: the custom slot's format choice is the WHOLE catalog — nine
    /// long labels — so it is dropdown rows like every other long choice, and
    /// every descriptor is offered, including the ones with no card (which is
    /// the reason the custom slot exists at all).
    @MainActor
    func testFormatRowsOfferTheWholeCatalogWithItsShapeLine() async {
        routeCatalog()
        defer { RoundStubURLProtocol.reset() }
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()

        let groups = CreatePickerRows.formats(store.catalog.descriptors, catalog: store.catalog)
        XCTAssertEqual(groups.count, 1)
        XCTAssertNil(groups[0].header)
        XCTAssertEqual(
            groups[0].rows.map(\.value), store.catalog.descriptors.map(\.id),
            "every descriptor, in the catalog's own order — the cardless ones included")
        XCTAssertGreaterThan(groups[0].rows.count, store.catalog.presets().count)

        // The row says what the game is contested between, so the choice does
        // not have to be made and then inspected.
        let individual = groups[0].rows.first { $0.value == "stableford_individual" }
        XCTAssertEqual(individual?.title, store.catalog.label("stableford_individual"))
        XCTAssertEqual(individual?.marker, "Everyone plays their own ball")
        // The shape is a MARKER, not a warning: nothing here is qualified.
        XCTAssertNil(individual?.annotation)
    }

    // MARK: - Helpers

    private func course(_ id: String, club: String, name: String) -> SetupCourse {
        SetupCourse(clubName: "Club", id: id, clubId: club, name: name, holeCount: 18, holes: [])
    }

    private func tee(
        _ id: String,
        _ name: String,
        genders: [PlayerGender] = [.m, .f]
    ) -> Tee {
        Tee(
            id: id,
            courseId: "c1",
            name: name,
            colour: nil,
            holeLengths: [],
            ratings: genders.map {
                TeeRating(gender: $0, courseRating: 72, slope: 113, par: 72, totalLengthM: 5800)
            })
    }
}
