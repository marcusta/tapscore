import XCTest
@testable import TapScore

/// The Players step's two pure machines — the friends picker's ORDER and the
/// handicap pad's STRING — plus the roster rules that decide what the step
/// opens on.
///
/// Both are here rather than under the view because both are invisible to a
/// screenshot: a picker in the wrong order still looks like a picker, and
/// `+2,4` committing as `+2.4` instead of `-2.4` still looks like a number.
final class CreateFriendsPickerTests: XCTestCase {
    // MARK: - Order (spec §5.2 B5.7)

    /// Played-with first, by frecency; never-played sink to the bottom and are
    /// alphabetical among themselves. The regulars have to be the first rows or
    /// the picker is slower than typing the name.
    func testPlayedFriendsSortByFrecencyAndNeverPlayedSinkAlphabetically() {
        let picker = FriendsPicker(friends: [
            friend("z", "Zara", frecency: 0),
            friend("a", "Adam", frecency: 0),
            friend("b", "Bert", frecency: 3, lastPlayedAt: "2026-01-01T10:00:00Z"),
            friend("c", "Cleo", frecency: 9, lastPlayedAt: "2025-06-01T10:00:00Z"),
        ])
        XCTAssertEqual(picker.available.map(\.id), ["c", "b", "a", "z"])
    }

    /// Equal frecency breaks on WHO YOU PLAYED WITH MOST RECENTLY, not on the
    /// alphabet — the tie is common (two rounds each) and the alphabet is a
    /// coin flip in disguise.
    func testEqualFrecencyBreaksOnLastPlayed() {
        let picker = FriendsPicker(friends: [
            friend("old", "Adam", frecency: 4, lastPlayedAt: "2025-01-01T10:00:00Z"),
            friend("new", "Zara", frecency: 4, lastPlayedAt: "2026-05-01T10:00:00Z"),
        ])
        XCTAssertEqual(picker.available.map(\.id), ["new", "old"])
    }

    /// `lastPlayedAt` is written both with and without fractional seconds. A
    /// parser that only accepts one spelling silently reads the other as
    /// "never" and reorders the list — the failure mode that costs a user their
    /// top row with no error anywhere.
    func testBothTimestampSpellingsParse() {
        let picker = FriendsPicker(friends: [
            friend("plain", "Adam", frecency: 4, lastPlayedAt: "2025-01-01T10:00:00Z"),
            friend("frac", "Zara", frecency: 4, lastPlayedAt: "2026-05-01T10:00:00.123Z"),
        ])
        XCTAssertEqual(picker.available.map(\.id), ["frac", "plain"])
    }

    /// A friend with history but no timestamp must not leapfrog one you played
    /// yesterday.
    func testMissingTimestampSortsAsTheFarPast() {
        let picker = FriendsPicker(friends: [
            friend("none", "Adam", frecency: 4, lastPlayedAt: nil),
            friend("dated", "Zara", frecency: 4, lastPlayedAt: "2020-01-01T10:00:00Z"),
        ])
        XCTAssertEqual(picker.available.map(\.id), ["dated", "none"])
    }

    /// Swedish collation, case- and diacritic-insensitive, against a FIXED
    /// locale — the same list must come out in the same order on every phone.
    func testNeverPlayedNamesCollateSwedishly() {
        let picker = FriendsPicker(friends: [
            friend("o", "Östen", frecency: 0),
            friend("b", "björn", frecency: 0),
            friend("a", "Åke", frecency: 0),
        ])
        XCTAssertEqual(picker.available.map(\.id), ["b", "a", "o"])
    }

    // MARK: - Selection (B5.11)

    /// Somebody already on the roster is not offered at all. "Add" that does
    /// nothing is worse than an absent row: the user taps it twice and then
    /// wonders which of the two took.
    func testFriendsAlreadyPlayingAreNotOffered() {
        let picker = FriendsPicker(
            friends: [friend("a", "Adam", frecency: 1), friend("b", "Bert", frecency: 2)],
            excludedPlayerIds: ["b"])
        XCTAssertEqual(picker.available.map(\.id), ["a"])
    }

    // MARK: - Search (B5.8, an iOS invention — D10)

    func testSearchMatchesNameOrUsernameAndIgnoresALeadingAt() {
        let friends = [
            friend("b", "Björn Larsson", username: "bjornl", frecency: 2),
            friend("a", "Adam", username: "adam", frecency: 1),
        ]
        XCTAssertEqual(FriendsPicker(friends: friends, query: "bjorn").results.map(\.id), ["b"])
        XCTAssertEqual(FriendsPicker(friends: friends, query: "@bjornl").results.map(\.id), ["b"])
        XCTAssertEqual(FriendsPicker(friends: friends, query: "LARS").results.map(\.id), ["b"])
    }

    /// A search never RE-RANKS: the survivors keep the frecency order they had.
    func testSearchPreservesOrder() {
        let picker = FriendsPicker(
            friends: [
                friend("low", "Anna Alpha", frecency: 1),
                friend("high", "Anna Beta", frecency: 8),
            ],
            query: "anna")
        XCTAssertEqual(picker.results.map(\.id), ["high", "low"])
    }

    /// "Nobody matches what you typed" and "you have no friends yet" are
    /// different facts with different fixes, so the picker distinguishes them.
    func testEmptyHandedOnlyMeansTheQueryMatchedNothing() {
        XCTAssertFalse(FriendsPicker(friends: []).isEmptyHanded)
        XCTAssertTrue(FriendsPicker(friends: [friend("a", "Adam")], query: "zzz").isEmptyHanded)
    }

    /// B5.9: a friend with no index shows an en dash. Not "0.0" — no index is
    /// unknown, not scratch, and seeding a row from 0.0 hands a beginner no
    /// shots.
    func testHandicapTextRendersPlusHandicapsAndUnknowns() {
        XCTAssertEqual(FriendsPicker.handicapText(friend("a", "A", handicapIndex: 18.4)), "18.4")
        XCTAssertEqual(FriendsPicker.handicapText(friend("b", "B", handicapIndex: -2.4)), "+2.4")
        XCTAssertEqual(FriendsPicker.handicapText(friend("c", "C", handicapIndex: nil)), "–")
    }

    // MARK: - Helpers

    private func friend(
        _ id: String,
        _ name: String,
        username: String? = nil,
        frecency: Double = 0,
        lastPlayedAt: String? = nil,
        handicapIndex: Double? = 12
    ) -> FriendProfile {
        FriendProfile(
            sharedRoundCount: frecency,
            lastPlayedAt: lastPlayedAt,
            frecency: frecency,
            isMutual: true,
            id: id,
            username: username ?? id,
            displayName: name,
            gender: .m,
            handicapIndex: handicapIndex,
            homeClubName: nil)
    }
}

/// Spec §5.7.1's fourteen vectors, against the pad the buttons actually call.
///
/// The one that matters most is K8/K9: `+2,4` is a PLUS handicap and means
/// **-2.4**. Getting that backwards gives a scratch-or-better player four extra
/// shots and nothing on screen says so.
final class HandicapPadTests: XCTestCase {
    /// The Swedish pad, because the comma spelling is the one the web ships and
    /// the one the vectors are written in.
    private func pad(_ keys: String, separator: Character = ",") -> HandicapPad {
        var pad = HandicapPad(draft: "", separator: separator)
        for key in keys where key != " " {
            switch key {
            case "+": pad.press(.plus)
            case ",", ".": pad.press(.separator)
            case "<": pad.press(.delete)
            default: pad.press(.digit(key))
            }
        }
        return pad
    }

    func testK1TwoDigits() {
        XCTAssertEqual(pad("12").draft, "12")
        XCTAssertEqual(pad("12").committedValue, 12)
    }

    /// K2 — at most two integer digits, and the third is IGNORED rather than
    /// shifting the value. A "keep the last two" rule would turn a typo into a
    /// different, plausible handicap.
    func testK2ThirdIntegerDigitIsIgnored() {
        XCTAssertEqual(pad("123").draft, "12")
    }

    func testK3OneDecimal() {
        XCTAssertEqual(pad("18,4").draft, "18,4")
        XCTAssertEqual(pad("18,4").committedValue, 18.4)
    }

    func testK4SecondDecimalDigitIsIgnored() {
        XCTAssertEqual(pad("18,45").draft, "18,4")
    }

    /// K5 — a separator with nothing before it gets a zero to sit on, so the
    /// value always reads as a number.
    func testK5LeadingSeparatorInsertsZero() {
        XCTAssertEqual(pad(",").draft, "0,")
        XCTAssertEqual(pad(",").committedValue, 0)
    }

    func testK6LeadingSeparatorThenDigit() {
        XCTAssertEqual(pad(",4").draft, "0,4")
        XCTAssertEqual(pad(",4").committedValue, 0.4)
    }

    func testK7SecondSeparatorIsIgnored() {
        XCTAssertEqual(pad(",4,").draft, "0,4")
    }

    /// K8 — the whole reason this pad exists.
    func testK8PlusPrefixMeansBetterThanScratch() {
        XCTAssertEqual(pad("+2,4").draft, "+2,4")
        XCTAssertEqual(pad("+2,4").committedValue, -2.4)
    }

    /// K9 — `+` is a toggle on the VALUE, not a leading keystroke: it can be
    /// pressed after the digits and means the same thing.
    func testK9PlusAppliedAfterTheDigits() {
        XCTAssertEqual(pad("2,4+").draft, "+2,4")
        XCTAssertEqual(pad("2,4+").committedValue, -2.4)
    }

    func testK10PlusTogglesOff() {
        XCTAssertEqual(pad("+2,4+").draft, "2,4")
        XCTAssertEqual(pad("+2,4+").committedValue, 2.4)
    }

    /// K11 — a lone `+` is not a number, and Done must not commit it as one.
    func testK11LoneP1usCannotBeCommitted() {
        XCTAssertFalse(pad("+").canCommit)
    }

    /// K12 — Done on an EMPTY pad is enabled and commits a clear. The index is
    /// optional on this flow, so "I typed one by mistake" needs an exit.
    func testK12EmptyCommitsAClear() {
        let pad = pad("")
        XCTAssertTrue(pad.canCommit)
        XCTAssertEqual(pad.committedText, "")
        XCTAssertNil(pad.committedValue)
    }

    func testK13BackspaceToEmpty() {
        XCTAssertEqual(pad("12<<").draft, "")
        XCTAssertTrue(pad("12<<").canCommit)
    }

    /// K14 is a SHEET rule, not a pad rule — cancel never calls `onCommit`, so
    /// the row keeps what it had. What the pad owes it is that the value it was
    /// opened on is untouched until Done, which is why the draft is seeded from
    /// the row rather than shared with it.
    func testK14CancelKeepsThePreviousValueBecauseTheDraftIsACopy() {
        var pad = HandicapPad(draft: "18,4", separator: ",")
        pad.press(.digit("1"))
        pad.press(.delete)
        XCTAssertEqual(pad.committedText, "18,")
    }

    /// A row seeded from a STORED index carries the dot spelling. A Swedish pad
    /// opened on it must still see that dot as the decimal point, or "18.4"
    /// would accept two more digits and commit something else entirely.
    func testAStoredDotIsRecognisedByACommaPad() {
        var pad = HandicapPad(draft: "18.4", separator: ",")
        pad.press(.digit("5"))
        XCTAssertEqual(pad.draft, "18.4")
        pad.press(.separator)
        XCTAssertEqual(pad.draft, "18.4")
    }

    /// The grid B5.16 fixes, in order: `1…9`, `+`, `0`, separator. The `+` is
    /// the only key that explains itself, because "plus" meaning BETTER than
    /// scratch is not something the glyph says.
    func testGridOrderAndTheOneCaption() {
        let pad = HandicapPad(draft: "", separator: ",")
        XCTAssertEqual(
            pad.grid.map { HandicapPad.glyph(for: $0, separator: pad.separator) },
            ["1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "0", ","])
        XCTAssertEqual(pad.grid.filter { !HandicapPad.caption(for: $0).isEmpty }, [.plus])
        XCTAssertEqual(HandicapPad.caption(for: .plus), "plus hcp")
    }

    /// The separator is the LOCALE's, not a literal — Swedish writes a comma
    /// and everything else a dot (web: `hcpSep()`).
    func testSeparatorFollowsTheLocale() {
        XCTAssertEqual(HandicapPad.localeSeparator(.sv), ",")
        XCTAssertEqual(HandicapPad.localeSeparator(.en), ".")
        XCTAssertEqual(pad(".4", separator: ".").draft, "0.4")
    }
}

/// The course-handicap line the pad and the row both show (spec §4.6).
final class CourseHandicapTests: XCTestCase {
    private let red = TeeRating(gender: .m, courseRating: 68.4, slope: 124, par: 72, totalLengthM: 5000)

    /// B4.10 — `index × (slope/113) + (courseRating − par)`, rounded. The
    /// rounding is JS's `Math.round`, which is half-UP: `-6.5` becomes `-6`,
    /// not `-7`. Swift's `.rounded()` disagrees at exactly that boundary, and
    /// plus handicaps are where negatives come from.
    func testHalfUpRoundingMatchesJavaScript() {
        XCTAssertEqual(CourseHandicap.round(-6.5), -6)
        XCTAssertEqual(CourseHandicap.round(-6.6), -7)
        XCTAssertEqual(CourseHandicap.round(6.5), 7)
        XCTAssertEqual(CourseHandicap.round(6.4), 6)
    }

    /// B4.9 — the line shows the ANSWER and the arithmetic, so a surprising
    /// number explains itself instead of looking like a bug.
    func testTheLineShowsItsDerivation() {
        let derivation = CourseHandicap.Derivation(
            raw: CourseHandicap.raw(index: -2.4, rating: red),
            value: CourseHandicap.round(CourseHandicap.raw(index: -2.4, rating: red)),
            rating: red)
        let line = CourseHandicap.line(derivation, indexText: "+2,4")
        XCTAssertTrue(line.contains("-6"), line)
        XCTAssertTrue(line.contains("+2,4"), line)
        XCTAssertTrue(line.contains("124"), line)
        XCTAssertTrue(line.contains("68.4"), line)
        XCTAssertTrue(line.contains("72"), line)
    }

    /// No rating row for that gender ⇒ no line at all. B4.11 explains the gap
    /// in the row's own words; a line built off the other gender's rating would
    /// be a confident wrong number.
    func testNoRatingForThatGenderYieldsNoLine() {
        let tee = Tee(
            id: "t", courseId: "c", name: "Red", colour: nil, holeLengths: [],
            ratings: [red])
        XCTAssertNotNil(CourseHandicap.derive(index: 12, tee: tee, gender: .m))
        XCTAssertNil(CourseHandicap.derive(index: 12, tee: tee, gender: .f))
        XCTAssertNil(CourseHandicap.derive(index: nil, tee: tee, gender: .m))
    }
}
