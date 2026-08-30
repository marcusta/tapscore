import Foundation

/// The create flow's dropdown contents, as pure functions.
///
/// Every long choice on this flow — course, start hole, tee — is a
/// `TapDropdown` (see the design rule in `ios/AGENTS.md`), and a dropdown draws
/// exactly the rows it is handed. Building those rows here rather than inline
/// in the view keeps two things true: the wording of a warning is testable
/// without a simulator, and `CreateStore` never learns what a picker row is.
///
/// The warnings are WORDS. "Orange — no men's rating" is a sentence a user can
/// read, a screen reader can speak and a translator can carry; `⚠` glued onto a
/// chip label was none of those.
enum CreatePickerRows {
    // MARK: - Courses (spec §2.2 B2.1–B2.7)

    /// Club headers with their courses beneath, in the order the store already
    /// computed — the server's order, or distance order once a position fix
    /// landed (B2.2; `CreateStore.courseGroups`). A group that knows its
    /// distance says so on the header ("Linköpings GK · 930 m"), the same
    /// wording the web picker uses.
    static func courses(_ groups: [CreateStore.CourseGroup]) -> [TapDropdownGroup<String>] {
        groups.map { group in
            TapDropdownGroup(
                id: group.clubId,
                header: group.distanceKm.map { "\(group.clubName) · \(CourseDistance.label(km: $0))" }
                    ?? group.clubName,
                rows: group.courses.map { TapDropdownRow(value: $0.id, title: $0.name) })
        }
    }

    // MARK: - Start hole (spec §3.2 B3.2/B3.3/B3.7)

    /// The route's permitted holes, one row each. Any hole that is not the
    /// route's first rotates the route, which the draft encodes as
    /// `postingEligible: false` (B3.6) — so the row says so BEFORE it is
    /// picked, rather than the user finding out from a handicap record that
    /// never moved.
    static func startHoles(_ holes: [Int]) -> [TapDropdownGroup<Int>] {
        guard let first = holes.first else { return [] }
        return [TapDropdownGroup(rows: holes.map { hole in
            TapDropdownRow(
                value: hole,
                title: "Hole \(hole)",
                annotation: hole == first
                    ? nil
                    : TapDropdownAnnotation("Won't count for handicap"))
        })]
    }

    // MARK: - Tees (spec §4.2 B4.1, §4.4 B4.2, §4.7 B4.11/B4.13)

    /// The course's tees in the §4.3 canon order — the caller passes
    /// `store.tees`, which is already sorted, and this does not reorder it. One
    /// list, not a rated block and an unrated block: a user reads a tee list as
    /// a length ordering, and hiding Yellow at the bottom because a rating row
    /// is missing is a lie about the course.
    ///
    /// An unrated tee stays SELECTABLE (B4.13) and carries a danger annotation,
    /// because on a course where nothing is rated for a gender an unselectable
    /// list is a dead end with no way out.
    static func tees(_ tees: [Tee], for gender: PlayerGender) -> [TapDropdownGroup<String>] {
        [TapDropdownGroup(rows: tees.map { tee in
            TapDropdownRow(
                value: tee.id,
                title: tee.name,
                annotation: TeeOrder.hasRating(tee, for: gender)
                    ? nil
                    : TapDropdownAnnotation(noRatingText(for: gender), tone: .danger))
        })]
    }

    // MARK: - Formats (spec §0 B0.2, §6.3 B6.10)

    /// The WHOLE catalog, one row per descriptor, for a custom slot's format
    /// picker — the formats with no card included, which is the entire point of
    /// the custom slot.
    ///
    /// A dropdown, not a `Menu`: nine entries with labels like "Everyone plays
    /// their own ball" is exactly the shape B0.2 binds, and B0.4 says the two
    /// dropdowns on this flow are the same control. The shape line rides along
    /// as the subtitle so the choice can be made without picking a format to
    /// find out what it is.
    static func formats(
        _ descriptors: [FormatDescriptor],
        catalog: FormatCatalog
    ) -> [TapDropdownGroup<String>] {
        [TapDropdownGroup(rows: descriptors.map { descriptor in
            let shape = catalog.shapeText(descriptor.id)
            return TapDropdownRow(
                value: descriptor.id,
                title: catalog.label(descriptor),
                marker: shape.isEmpty ? nil : shape)
        })]
    }

    /// "no men's rating" / "no women's rating" — the same words the row-level
    /// issue uses, so the picker and the player row do not describe one fact
    /// two ways.
    static func noRatingText(for gender: PlayerGender) -> String {
        gender == .m ? "No men's rating" : "No women's rating"
    }
}
