import XCTest
@testable import TapScore

/// `TapDropdown` draws; `TapDropdownModel` decides. These are the decisions —
/// which row a selection resolves to, what the collapsed field says when it
/// resolves to nothing, when a filtered list is empty-handed rather than
/// merely unloaded, and which group headers survive.
final class TapDropdownTests: XCTestCase {
    private func groups() -> [TapDropdownGroup<String>] {
        [
            TapDropdownGroup(id: "halmstad", header: "Halmstad GK", rows: [
                TapDropdownRow(value: "north", title: "North"),
            ]),
            TapDropdownGroup(id: "linkoping", header: "Linköpings Golfklubb", rows: [
                TapDropdownRow(value: "lkpg", title: "Linköping"),
                TapDropdownRow(
                    value: "lkpg118",
                    title: "Linköpings Golfklubb 1-18",
                    annotation: TapDropdownAnnotation("No men's rating", tone: .danger)),
            ]),
        ]
    }

    // MARK: - Selection

    func testRowResolvesTheSelectedValue() {
        let row = TapDropdownModel.row(for: "lkpg", in: groups())
        XCTAssertEqual(row?.title, "Linköping")
    }

    func testNilSelectionResolvesToNoRow() {
        XCTAssertNil(TapDropdownModel.row(for: nil, in: groups()))
    }

    /// A stale id — the course changed under a tee selection, say — must read
    /// as UNSELECTED, not as a blank field.
    func testUnknownSelectionFallsBackToThePlaceholder() {
        XCTAssertEqual(
            TapDropdownModel.valueText(for: "gone", in: groups(), placeholder: "Choose course"),
            "Choose course")
        XCTAssertEqual(
            TapDropdownModel.valueText(for: nil, in: groups(), placeholder: "Choose course"),
            "Choose course")
        XCTAssertEqual(
            TapDropdownModel.valueText(for: "north", in: groups(), placeholder: "Choose course"),
            "North")
    }

    // MARK: - Grouping

    func testFlattenKeepsGroupOrder() {
        XCTAssertEqual(
            TapDropdownModel.rows(in: groups()).map(\.title),
            ["North", "Linköping", "Linköpings Golfklubb 1-18"])
    }

    func testHeadersAreUppercasedAndOnlyDrawnWhenTheyHaveRowsAndAName() {
        XCTAssertEqual(TapDropdownModel.headerText(groups()[0]), "HALMSTAD GK")
        XCTAssertNil(TapDropdownModel.headerText(
            TapDropdownGroup<String>(header: "Empty club", rows: [])))
        XCTAssertNil(TapDropdownModel.headerText(
            TapDropdownGroup(rows: [TapDropdownRow(value: "x", title: "X")])))
    }

    func testUngroupedListGetsAStableIdAndNoHeader() {
        let group = TapDropdownGroup(rows: [TapDropdownRow(value: 1, title: "Hole 1")])
        XCTAssertNil(group.header)
        XCTAssertEqual(group.id, "__ungrouped")
    }

    // MARK: - Empty state

    func testEmptyHandedOnlyWhenSomethingWasTyped() {
        let none: [TapDropdownGroup<String>] = []
        XCTAssertTrue(TapDropdownModel.isEmptyHanded(groups: none, query: "zzz"))
        // Not yet loaded is not "no matches".
        XCTAssertFalse(TapDropdownModel.isEmptyHanded(groups: none, query: ""))
        XCTAssertFalse(TapDropdownModel.isEmptyHanded(groups: none, query: "   "))
        XCTAssertFalse(TapDropdownModel.isEmptyHanded(groups: groups(), query: "lin"))
    }

    // MARK: - The collapsed field's spoken value

    /// Everything the collapsed field DRAWS is also what it SAYS. The words
    /// were chosen over an emoji (B0.3) so a qualification could be spoken —
    /// announcing only the title would hand the warning to the sighted user and
    /// withhold it from the one it was written for.
    func testAccessibilityValueFoldsInTheSubtitleMarkerAndAnnotation() {
        let row = TapDropdownRow(
            value: "rod",
            title: "Röd",
            subtitle: "LINKÖPINGS GK",
            marker: "Default",
            annotation: TapDropdownAnnotation("No women's rating", tone: .danger))
        XCTAssertEqual(
            TapDropdownModel.accessibilityValue(for: row, placeholder: "Pick a tee"),
            "Röd, LINKÖPINGS GK, Default, No women's rating")
    }

    func testAccessibilityValueOmitsTheAbsentAndEmptyParts() {
        XCTAssertEqual(
            TapDropdownModel.accessibilityValue(
                for: TapDropdownRow(value: "vit", title: "Vit"),
                placeholder: "Pick a tee"),
            "Vit")
        XCTAssertEqual(
            TapDropdownModel.accessibilityValue(
                for: TapDropdownRow(value: "vit", title: "Vit", subtitle: "  "),
                placeholder: "Pick a tee"),
            "Vit",
            "a blank subtitle must not become a trailing comma VoiceOver pauses on")
    }

    /// Nothing chosen reads as the placeholder — the same thing the field draws.
    func testAccessibilityValueFallsBackToThePlaceholder() {
        XCTAssertEqual(
            TapDropdownModel.accessibilityValue(
                for: TapDropdownRow<String>?.none, placeholder: "Choose course"),
            "Choose course")
    }

    /// The annotation survives even when it is the only qualifier — this is the
    /// case the whole rule exists for.
    func testAnAnnotatedRowSpeaksItsWarning() {
        let row = TapDropdownModel.row(for: "lkpg118", in: groups())
        XCTAssertEqual(
            TapDropdownModel.accessibilityValue(for: row, placeholder: ""),
            "Linköpings Golfklubb 1-18, No men's rating")
    }

    // MARK: - Annotations

    /// The warning is WORDS in a tone, never a glyph welded to the title — the
    /// rejected `⚠` suffix had no accessible name and no token colour.
    func testAnnotationCarriesTextAndToneAndLeavesTheTitleAlone() {
        let row = TapDropdownModel.row(for: "lkpg118", in: groups())
        XCTAssertEqual(row?.title, "Linköpings Golfklubb 1-18")
        XCTAssertEqual(row?.annotation?.text, "No men's rating")
        XCTAssertEqual(row?.annotation?.tone, .danger)
        XCTAssertEqual(TapDropdownAnnotation("Won't count for handicap").tone, .muted)
        for row in TapDropdownModel.rows(in: groups()) {
            XCTAssertFalse(
                row.title.unicodeScalars.contains { $0.properties.isEmoji && $0.value > 0x1000 },
                "\(row.title) carries an emoji")
        }
    }
}
