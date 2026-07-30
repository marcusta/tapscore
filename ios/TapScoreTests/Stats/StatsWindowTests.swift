import Foundation
import XCTest

@testable import TapScore

/// The window: which fetched rows a preset or a filter covers, when more history
/// is still needed, and what survives a relaunch.
///
/// Every function under test is pure, so there is no stub and no store here —
/// rows in, rows out. That separation is the point of `StatsWindow`: the paging
/// decision that drives real network traffic is a total function of
/// (preset, filter, loaded rows, hasMore, now), and it is tested as one.
final class StatsWindowTests: XCTestCase {

    // MARK: - Fixtures

    private func row(
        _ id: String,
        date: String,
        courseId: String = "course-1",
        courseName: String? = "Linköpings GK",
        venue: RoundVenueType = .outdoor,
        type: RoundRoundType = .full18,
        name: String? = nil,
        holes: Double = 18,
        measures: StatMeasures = StatMeasuresMath.zero
    ) -> PlayerRoundStats {
        PlayerRoundStats(
            roundId: id, date: date, courseName: courseName, courseId: courseId,
            roundType: type, venueType: venue, name: name, holeCount: holes,
            measures: measures)
    }

    /// `count` rounds, one a day, newest `2026-07-30` and walking backwards.
    private func history(_ count: Int, from year: Int = 2026, month: Int = 7, startDay: Int = 30)
        -> [PlayerRoundStats]
    {
        (0..<count).map { index in
            let day = startDay - index
            return row(
                "r-\(index)",
                date: String(format: "%04d-%02d-%02d", year, month, max(1, day)))
        }
    }

    private func date(_ isoDay: String) -> Date {
        StatsFormat.date(fromISODay: isoDay)!
    }

    // MARK: - 1. Ordering

    func testRowsSortNewestFirstWithADeterministicTieBreak() {
        let rows = [
            row("a", date: "2026-07-01"),
            row("c", date: "2026-07-10"),
            row("b", date: "2026-07-10"),
        ]

        XCTAssertEqual(StatsWindow.sorted(rows).map(\.roundId), ["c", "b", "a"])
        // Same set, different arrival order — same answer. Two rounds on one day
        // must not depend on which page they came in on.
        XCTAssertEqual(StatsWindow.sorted(rows.reversed()).map(\.roundId), ["c", "b", "a"])
    }

    // MARK: - 2. Count presets

    func testLastNTakesTheNewestNRounds() {
        let rows = history(12)

        let last5 = StatsWindow.apply(
            preset: .last5, filter: StatsRoundFilter(), to: rows, now: date("2026-07-30"))

        XCTAssertEqual(last5.count, 5)
        XCTAssertEqual(last5.first?.date, "2026-07-30")
        XCTAssertEqual(last5.last?.date, "2026-07-26")
    }

    func testLastNOverAShortHistoryReturnsWhatThereIs() {
        let rows = history(3)

        let last20 = StatsWindow.apply(
            preset: .last20, filter: StatsRoundFilter(), to: rows, now: date("2026-07-30"))

        XCTAssertEqual(last20.count, 3)
    }

    /// A preset never wears a filter. Ranking "Last 10" over a filtered subset
    /// would leave the picker naming a window that is not what is on screen.
    func testACountPresetIgnoresTheCustomFilter() {
        let rows = history(6)
        let filter = StatsRoundFilter(excludedRoundIDs: ["r-0", "r-1"])

        let windowed = StatsWindow.apply(
            preset: .last5, filter: filter, to: rows, now: date("2026-07-30"))

        XCTAssertEqual(windowed.map(\.roundId), ["r-0", "r-1", "r-2", "r-3", "r-4"])
    }

    // MARK: - 3. This year

    func testThisYearKeepsOnlyTheCurrentCalendarYear() {
        let rows = [
            row("a", date: "2026-01-01"),
            row("b", date: "2025-12-31"),
            row("c", date: "2026-07-30"),
        ]

        let windowed = StatsWindow.apply(
            preset: .thisYear, filter: StatsRoundFilter(), to: rows, now: date("2026-07-30"))

        XCTAssertEqual(windowed.map(\.roundId), ["c", "a"])
    }

    /// The year in `yearPrefix` is the wire's, not the device's.
    ///
    /// A phone set to the Buddhist calendar answers 2569 for this year through
    /// `Calendar.current`, and "2569-" matches no `yyyy-MM-dd` the server has
    /// ever written: the window would come back empty AND `needsMoreHistory`
    /// could never be satisfied, so every load would page to the cap for nothing.
    func testThisYearIsGregorianWhateverCalendarTheDeviceUses() {
        let rows = [row("a", date: "2026-07-30"), row("b", date: "2025-12-31")]

        for identifier: Calendar.Identifier in [.buddhist, .japanese, .hebrew, .islamic] {
            var calendar = Calendar(identifier: identifier)
            calendar.timeZone = TimeZone(secondsFromGMT: 0)!

            XCTAssertEqual(
                StatsWindow.yearPrefix(date("2026-07-30"), calendar: calendar), "2026-",
                "\(identifier) must still produce the wire's Gregorian year")
            XCTAssertEqual(
                StatsWindow.apply(
                    preset: .thisYear, filter: StatsRoundFilter(), to: rows,
                    now: date("2026-07-30"), calendar: calendar
                ).map(\.roundId),
                ["a"])
            // And the paging proof still lands, rather than never being satisfied.
            XCTAssertFalse(
                StatsWindow.needsMoreHistory(
                    preset: .thisYear, filter: StatsRoundFilter(), loaded: rows,
                    hasMore: true, now: date("2026-07-30"), calendar: calendar))
        }
    }

    /// The ZONE is the device's to decide — it is what says which day "today" is.
    /// UTC midnight on New Year's Day is still last year in Los Angeles.
    func testThisYearTakesTheYearInTheCalendarsOwnZone() {
        let newYearUTC = date("2026-01-01")

        var utc = Calendar(identifier: .gregorian)
        utc.timeZone = TimeZone(secondsFromGMT: 0)!
        XCTAssertEqual(StatsWindow.yearPrefix(newYearUTC, calendar: utc), "2026-")

        var pacific = Calendar(identifier: .gregorian)
        pacific.timeZone = TimeZone(identifier: "America/Los_Angeles")!
        XCTAssertEqual(StatsWindow.yearPrefix(newYearUTC, calendar: pacific), "2025-")
    }

    // MARK: - 4. Custom filter

    func testTheEmptyFilterAdmitsEverything() {
        let rows = history(4)
        let filter = StatsRoundFilter()

        XCTAssertTrue(filter.isEmpty)
        XCTAssertEqual(
            StatsWindow.apply(
                preset: .custom, filter: filter, to: rows, now: date("2026-07-30")
            ).count,
            4)
    }

    func testDateBoundsAreInclusive() {
        let rows = history(5)  // 2026-07-26 … 2026-07-30
        let filter = StatsRoundFilter(from: "2026-07-27", to: "2026-07-29")

        let windowed = StatsWindow.apply(
            preset: .custom, filter: filter, to: rows, now: date("2026-07-30"))

        XCTAssertEqual(windowed.map(\.date), ["2026-07-29", "2026-07-28", "2026-07-27"])
    }

    func testCourseVenueAndTypeNarrowTheWindow() {
        let rows = [
            row("a", date: "2026-07-30", courseId: "c1", venue: .outdoor, type: .full18),
            row("b", date: "2026-07-29", courseId: "c2", venue: .outdoor, type: .full18),
            row("c", date: "2026-07-28", courseId: "c1", venue: .indoor, type: .full18),
            row("d", date: "2026-07-27", courseId: "c1", venue: .outdoor, type: .front9),
        ]

        func ids(_ filter: StatsRoundFilter) -> [String] {
            StatsWindow.apply(
                preset: .custom, filter: filter, to: rows, now: date("2026-07-30")
            ).map(\.roundId)
        }

        XCTAssertEqual(ids(StatsRoundFilter(courseIDs: ["c1"])), ["a", "c", "d"])
        XCTAssertEqual(ids(StatsRoundFilter(venueTypes: [.indoor])), ["c"])
        XCTAssertEqual(ids(StatsRoundFilter(roundTypes: [.front9])), ["d"])
        // Criteria intersect.
        XCTAssertEqual(
            ids(StatsRoundFilter(courseIDs: ["c1"], venueTypes: [.outdoor])), ["a", "d"])
    }

    func testTheChecklistSubtractsRoundsTheOtherCriteriaAdmitted() {
        let rows = history(4)
        let filter = StatsRoundFilter(from: "2026-07-27", excludedRoundIDs: ["r-1"])

        let windowed = StatsWindow.apply(
            preset: .custom, filter: filter, to: rows, now: date("2026-07-30"))

        XCTAssertEqual(windowed.map(\.roundId), ["r-0", "r-2", "r-3"])
    }

    // MARK: - 5. Paging decisions

    func testNothingIsFetchedWhenTheServerHasNoMore() {
        for preset in StatsWindowPreset.allCases {
            XCTAssertFalse(
                StatsWindow.needsMoreHistory(
                    preset: preset, filter: StatsRoundFilter(), loaded: history(1),
                    hasMore: false, now: date("2026-07-30")),
                "\(preset) must stop when the server offers no cursor")
        }
    }

    func testACountWindowStopsAsSoonAsItHasEnoughRows() {
        func needs(_ loaded: Int) -> Bool {
            StatsWindow.needsMoreHistory(
                preset: .last10, filter: StatsRoundFilter(), loaded: history(loaded),
                hasMore: true, now: date("2026-07-30"))
        }

        XCTAssertTrue(needs(9))
        XCTAssertFalse(needs(10))
        XCTAssertFalse(needs(11))
    }

    /// The stop condition is a PROOF, not a guess: only a row older than January
    /// 1st shows the year is complete, because the feed runs newest-first.
    func testThisYearPagesUntilARowFromLastYearArrives() {
        let thisYearOnly = [row("a", date: "2026-01-02")]
        XCTAssertTrue(
            StatsWindow.needsMoreHistory(
                preset: .thisYear, filter: StatsRoundFilter(), loaded: thisYearOnly,
                hasMore: true, now: date("2026-07-30")))

        let reachesBack = thisYearOnly + [row("b", date: "2025-12-31")]
        XCTAssertFalse(
            StatsWindow.needsMoreHistory(
                preset: .thisYear, filter: StatsRoundFilter(), loaded: reachesBack,
                hasMore: true, now: date("2026-07-30")))
    }

    func testAllPagesToTheEnd() {
        XCTAssertTrue(
            StatsWindow.needsMoreHistory(
                preset: .all, filter: StatsRoundFilter(), loaded: history(200),
                hasMore: true, now: date("2026-07-30")))
    }

    /// Picking "Custom" from the dropdown does not, on its own, demand a career.
    ///
    /// The filter is empty until the sheet applies one, and an empty filter
    /// admits exactly what is already on screen — paging for it would drain the
    /// whole history to render the rows the player is looking at.
    func testAnEmptyCustomFilterDoesNotAskForMoreHistory() {
        XCTAssertFalse(
            StatsWindow.needsMoreHistory(
                preset: .custom, filter: StatsRoundFilter(), loaded: history(5),
                hasMore: true, now: date("2026-07-30")))

        // One criterion is enough to change the answer: the checklist and the
        // course list are only satisfiable by the whole history.
        XCTAssertTrue(
            StatsWindow.needsMoreHistory(
                preset: .custom, filter: StatsRoundFilter(excludedRoundIDs: ["r-1"]),
                loaded: history(5), hasMore: true, now: date("2026-07-30")))
    }

    func testACustomWindowStopsOnlyWhenALowerBoundIsPassed() {
        let rows = history(5)  // back to 2026-07-26

        // No lower bound: no criterion can prove completeness, so it pages on.
        XCTAssertTrue(
            StatsWindow.needsMoreHistory(
                preset: .custom, filter: StatsRoundFilter(courseIDs: ["course-1"]),
                loaded: rows, hasMore: true, now: date("2026-07-30")))

        // Bound not yet reached.
        XCTAssertTrue(
            StatsWindow.needsMoreHistory(
                preset: .custom, filter: StatsRoundFilter(from: "2026-07-20"),
                loaded: rows, hasMore: true, now: date("2026-07-30")))

        // A row older than the bound proves nothing newer is missing.
        XCTAssertFalse(
            StatsWindow.needsMoreHistory(
                preset: .custom, filter: StatsRoundFilter(from: "2026-07-28"),
                loaded: rows, hasMore: true, now: date("2026-07-30")))
    }

    // MARK: - 6. Course options

    func testCoursesAreDistinctCountedAndNameOrdered() {
        let rows = [
            row("a", date: "2026-07-30", courseId: "c2", courseName: "Vadstena GK"),
            row("b", date: "2026-07-29", courseId: "c1", courseName: "Linköpings GK"),
            row("c", date: "2026-07-28", courseId: "c1", courseName: "Linköpings GK"),
        ]

        let courses = StatsWindow.courses(in: rows)

        XCTAssertEqual(courses.map(\.name), ["Linköpings GK", "Vadstena GK"])
        XCTAssertEqual(courses.map(\.roundCount), [2, 1])
    }

    /// A row whose course was deleted carries a nil name; a sibling row's name
    /// must still win rather than being blanked by it.
    func testANilCourseNameDoesNotEraseASiblingRowsName() {
        let rows = [
            row("a", date: "2026-07-30", courseId: "c1", courseName: nil),
            row("b", date: "2026-07-29", courseId: "c1", courseName: "Linköpings GK"),
        ]

        XCTAssertEqual(StatsWindow.courses(in: rows).map(\.name), ["Linköpings GK"])
    }

    func testACourseWithNoNameAnywhereIsStillOfferedAsARow() {
        let rows = [row("a", date: "2026-07-30", courseId: "c1", courseName: nil)]

        XCTAssertEqual(StatsWindow.courses(in: rows).map(\.name), ["Unnamed course"])
    }

    // MARK: - 7. Persistence

    func testThePresetSurvivesARelaunch() {
        let defaults = UserDefaults(suiteName: "stats-window-\(UUID().uuidString)")!
        defer { defaults.removeObject(forKey: StatsWindowPreference.key) }

        XCTAssertEqual(StatsWindowPreference.load(defaults: defaults), .last10)

        for preset in StatsWindowPreset.allCases {
            StatsWindowPreference.save(preset, defaults: defaults)
            XCTAssertEqual(StatsWindowPreference.load(defaults: defaults), preset)
        }
    }

    /// A value written by a future version, or corrupted, falls back rather than
    /// crashing or leaving the screen with no window at all.
    func testAnUnknownStoredValueFallsBack() {
        let defaults = UserDefaults(suiteName: "stats-window-\(UUID().uuidString)")!
        defer { defaults.removeObject(forKey: StatsWindowPreference.key) }
        defaults.set("last-42", forKey: StatsWindowPreference.key)

        XCTAssertEqual(StatsWindowPreference.load(defaults: defaults), .last10)
    }
}
