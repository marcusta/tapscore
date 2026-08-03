import Foundation
import XCTest

@testable import TapScore

/// The display policy's wording, and the calendar-day helpers under it.
///
/// Two things are being pinned here. First, that an AVERAGE cannot escape the
/// bargain a percentage is held to: "1.85" reads the same over one green and
/// over forty, so every average on the screen arrives with its denominator.
/// Second, that a day the reader PICKED and a day the app COMMITS are the same
/// day in every time zone — the wire format is UTC-pinned and a `DatePicker` is
/// not, which is a one-day error for half the planet.
final class StatsFormatTests: XCTestCase {

    // MARK: - Fixtures

    private func rate(_ value: Double?, _ n: Double, _ d: Double) -> Rate {
        Rate(value: value, n: n, d: d)
    }

    /// Zones chosen to cover the failure modes: behind and ahead of UTC, a
    /// non-hour offset, southern-hemisphere DST, and one whose DST transition is
    /// at midnight (Santiago), where "local midnight" is a time that does not
    /// exist on one day of the year.
    private static let zones = [
        "UTC", "America/Los_Angeles", "Europe/Stockholm", "Asia/Kathmandu",
        "Pacific/Auckland", "America/Santiago",
    ]

    private func zone(_ identifier: String) -> TimeZone {
        guard let zone = TimeZone(identifier: identifier) else {
            XCTFail("unknown zone \(identifier)")
            return TimeZone(secondsFromGMT: 0)!
        }
        return zone
    }

    // MARK: - 1. The average policy

    func testAnAverageWithNoSampleIsAbsent() {
        XCTAssertNil(StatsFormat.average(rate(nil, 0, 0)))
        XCTAssertNil(StatsFormat.averageWithSample(rate(nil, 0, 0), unit: .greens))
        XCTAssertNil(StatsFormat.averageSample(rate(nil, 0, 0), unit: .greens))
    }

    /// The owner ruling of 2026-08-02 retired the thin mark: a small sample says
    /// its size and nothing more. The reader is told "over 3 greens" and draws
    /// their own conclusion.
    func testASmallSampleIsSaidPlainlyAndNeverMarked() {
        let small = StatsFormat.averageWithSample(rate(1.6667, 5, 3), unit: .greens)

        XCTAssertEqual(small, "1.67 (over 3 greens)")
        XCTAssertFalse(small!.contains("thin"))
    }

    /// The admission floor still exists in the MATH — it decides what the server
    /// will express at all — but no rendered string mentions it any more.
    func testTheAdmissionFloorNeverReachesARenderedString() {
        XCTAssertEqual(StatMeasuresMath.minRateDenominator, 5)

        let below = StatsFormat.averageWithSample(rate(2, 8, 4), unit: .greens)
        let at = StatsFormat.averageWithSample(rate(2, 10, 5), unit: .greens)

        XCTAssertEqual(below, "2.00 (over 4 greens)")
        XCTAssertEqual(at, "2.00 (over 5 greens)")
    }

    func testASampleOfOneIsSingular() {
        XCTAssertEqual(
            StatsFormat.averageWithSample(rate(3, 3, 1), unit: .rounds),
            "3.00 (over 1 round)")
        XCTAssertEqual(
            StatsFormat.averageWithSample(rate(3, 30, 10), unit: .rounds),
            "3.00 (over 10 rounds)")
    }

    func testASignedAverageKeepsItsSignAndItsSample() {
        XCTAssertEqual(
            StatsFormat.averageWithSample(rate(0.35, 4.2, 12), signed: true, unit: .holes),
            "+0.35 (over 12 holes)")
        XCTAssertEqual(
            StatsFormat.averageWithSample(rate(-0.35, -4.2, 12), signed: true, unit: .holes),
            "\u{2212}0.35 (over 12 holes)")
    }

    /// The panel headlines put the measure between the number and its sample.
    func testALabelSitsBetweenTheValueAndTheSample() {
        XCTAssertEqual(
            StatsFormat.averageWithSample(
                rate(1.85, 44.4, 24), unit: .greens, label: "putts per green hit"),
            "1.85 putts per green hit (over 24 greens)")
    }

    // MARK: - 2. The trouble tax's two samples

    /// `troubleTaxPerHole` divides by a CROSS-PRODUCT, so its own `d` is a guard
    /// and not a sample: nine trouble holes against eleven fairway ones would
    /// otherwise be printed as "over 99 holes".
    func testTheTroubleTaxReportsBothDenominatorsAndNeverItsOwn() {
        let byTee = ByTee(
            fairway: rate(0.4, 4.4, 11), inPlay: rate(0.6, 3, 5), trouble: rate(1.2, 10.8, 9))

        XCTAssertEqual(
            StatsFormat.troubleTaxSample(byTee),
            "over 9 holes from trouble vs 11 from the fairway")
    }

    func testTheTroubleTaxSaysBothSidesWhateverTheirSize() {
        func sample(trouble: Double, fairway: Double) -> String? {
            StatsFormat.troubleTaxSample(
                ByTee(
                    fairway: rate(0.4, 0.4 * fairway, fairway), inPlay: rate(nil, 0, 0),
                    trouble: rate(1.2, 1.2 * trouble, trouble)))
        }

        XCTAssertEqual(
            sample(trouble: 4, fairway: 20),
            "over 4 holes from trouble vs 20 from the fairway")
        XCTAssertEqual(
            sample(trouble: 20, fairway: 2),
            "over 20 holes from trouble vs 2 from the fairway")
        XCTAssertEqual(
            sample(trouble: 6, fairway: 12),
            "over 6 holes from trouble vs 12 from the fairway")
        // One side with nothing in it is no reading at all.
        XCTAssertNil(sample(trouble: 0, fairway: 12))
        XCTAssertNil(sample(trouble: 6, fairway: 0))
    }

    // MARK: - 2b. The wave-3 taxes' two samples

    /// Same bargain as the trouble tax, generalised: a difference of two
    /// averages prints BOTH denominators and never its own cross-product.
    func testTheMissedGreenTaxReportsBothDenominators() {
        let cost = VsParSplit(
            hit: rate(0.0769, 2, 26), miss: rate(0.9118, 31, 34), delta: rate(0.8348, 738, 884))

        XCTAssertEqual(
            StatsFormat.missedGreenTaxSample(cost),
            "over 34 holes with the green missed vs 26 greens hit")
        // The guard is never spoken, whatever its size.
        XCTAssertFalse(StatsFormat.missedGreenTaxSample(cost)!.contains("884"))
    }

    func testThePenaltyTaxReportsBothDenominators() {
        let split = PenaltySplit(penalty: rate(1.5556, 14, 9), clean: rate(0.0889, 4, 45))

        XCTAssertEqual(
            StatsFormat.penaltyTaxSample(split),
            "over 9 holes with a penalty vs 45 without")
    }

    /// Each side singularises on its own, and a small side is simply a small
    /// number — no mark, on either surface.
    func testAWave3TaxIsSingularPerSideAndNeverMarked() {
        func penalty(_ withPenalty: Double, _ without: Double) -> String? {
            StatsFormat.penaltyTaxSample(
                PenaltySplit(
                    penalty: rate(1, withPenalty, withPenalty),
                    clean: rate(1, without, without)))
        }

        XCTAssertEqual(penalty(1, 45), "over 1 hole with a penalty vs 45 without")
        XCTAssertEqual(penalty(9, 3), "over 9 holes with a penalty vs 3 without")
        XCTAssertEqual(penalty(5, 5), "over 5 holes with a penalty vs 5 without")
        XCTAssertNil(penalty(0, 45))
        XCTAssertNil(penalty(9, 0))

        XCTAssertEqual(
            StatsFormat.missedGreenTaxSample(
                VsParSplit(hit: rate(0, 0, 1), miss: rate(0, 0, 1), delta: rate(0, 0, 1))),
            "over 1 hole with the green missed vs 1 green hit")
    }

    // MARK: - 2c. The two-case rate policy, and the ladder's cost column

    /// A single attempt is a percentage like any other — the retired middle band
    /// used to print "1 of 1" here, which the owner ruled out everywhere.
    func testARateIsAPercentageAtAnyDenominatorAndAbsentAtNone() {
        XCTAssertEqual(StatsFormat.rate(rate(1, 1, 1)), "100%")
        XCTAssertEqual(StatsFormat.rate(rate(2.0 / 3.0, 2, 3)), "67%")
        XCTAssertEqual(StatsFormat.rate(rate(0.5, 10, 20)), "50%")
        XCTAssertNil(StatsFormat.rate(rate(nil, 0, 0)))
        // The fraction survives, but only where there is room to print it: a
        // collapsed headline and an info sheet, never a value column.
        XCTAssertEqual(StatsFormat.sample(rate(2.0 / 3.0, 2, 3)), "2 of 3")
        XCTAssertEqual(StatsFormat.rateWithSample(rate(2.0 / 3.0, 2, 3)), "67% (2 of 3)")
        XCTAssertNil(StatsFormat.sample(rate(nil, 0, 0)))
    }

    /// The ladder's cost column: one decimal, always signed, `—` for a bucket
    /// with nothing to compare. `0.0` and never `E`.
    func testTheLadderCostColumnSignsItselfAndPlaceholdsAtAbsence() {
        XCTAssertEqual(StatsFormat.cost(nil), "\u{2014}")
        XCTAssertEqual(StatsFormat.cost(nil), StatsCopy.noValue)
        XCTAssertEqual(StatsFormat.cost(0), "0.0")
        XCTAssertEqual(StatsFormat.cost(0.5), "+0.5")
        XCTAssertEqual(StatsFormat.cost(-1.2), "\u{2212}1.2")
        XCTAssertFalse(StatsFormat.cost(-1.2).contains("-"))
    }

    /// The generic form is the one the two named helpers are built from.
    func testTheTaxSampleTakesItsUnitsFromTheCaller() {
        XCTAssertEqual(
            StatsFormat.taxSample(rate(1, 9, 9), .penaltyHoles, rate(1, 45, 45), .penaltyFree),
            "over 9 holes with a penalty vs 45 without")
    }

    // MARK: - 3. The wire's day

    func testTheUTCPairIsStillItsOwnInverse() {
        for iso in ["2026-01-01", "2026-07-30", "2025-12-31"] {
            let date = StatsFormat.date(fromISODay: iso)
            XCTAssertNotNil(date)
            XCTAssertEqual(date.map(StatsFormat.isoDay), iso)
        }
    }

    // MARK: - 4. The reader's day

    /// The bug the local pair exists for: a `DatePicker` seeded with UTC midnight
    /// displays the PREVIOUS day anywhere west of Greenwich, so the day committed
    /// is not the day the reader saw.
    func testAUTCMidnightShowsThePreviousDayInAWesternZone() {
        let pacific = zone("America/Los_Angeles")

        let utcSeed = StatsFormat.date(fromISODay: "2026-07-30")!
        XCTAssertEqual(StatsFormat.isoDay(localDayOf: utcSeed, timeZone: pacific), "2026-07-29")

        let localSeed = StatsFormat.localDate(fromISODay: "2026-07-30", timeZone: pacific)!
        XCTAssertEqual(StatsFormat.isoDay(localDayOf: localSeed, timeZone: pacific), "2026-07-30")
    }

    /// The other half of the same error: an evening round picked in Los Angeles
    /// is already tomorrow in UTC, and the UTC printer would commit that.
    func testAnEveningPickIsCommittedAsTheDayItWasPickedOn() {
        let pacific = zone("America/Los_Angeles")
        let evening = StatsFormat.localDate(fromISODay: "2026-07-30", timeZone: pacific)!
            .addingTimeInterval(19 * 3600)

        XCTAssertEqual(StatsFormat.isoDay(evening), "2026-07-31")
        XCTAssertEqual(StatsFormat.isoDay(localDayOf: evening, timeZone: pacific), "2026-07-30")
    }

    /// Every day of a year, in every zone: what goes into the picker comes back
    /// out unchanged. This is what stops the sheet drifting a day per open, since
    /// it re-seeds itself from the value it last committed.
    func testALocalDayRoundTripsInEveryZone() {
        for identifier in Self.zones {
            let timeZone = zone(identifier)
            for month in 1...12 {
                for day in 1...28 {
                    let iso = String(format: "2026-%02d-%02d", month, day)
                    guard
                        let date = StatsFormat.localDate(fromISODay: iso, timeZone: timeZone)
                    else {
                        XCTFail("\(iso) produced no date in \(identifier)")
                        continue
                    }
                    XCTAssertEqual(
                        StatsFormat.isoDay(localDayOf: date, timeZone: timeZone), iso,
                        "\(iso) did not survive the round trip in \(identifier)")
                }
            }
        }
    }

    /// Re-opening the sheet must not walk the bound backwards one day at a time.
    func testRepeatedOpensDoNotMoveTheDay() {
        let pacific = zone("America/Los_Angeles")
        var iso = "2026-03-08"

        for _ in 0..<5 {
            let seeded = StatsFormat.localDate(fromISODay: iso, timeZone: pacific)!
            iso = StatsFormat.isoDay(localDayOf: seeded, timeZone: pacific)
        }

        XCTAssertEqual(iso, "2026-03-08")
    }

    func testAnythingThatIsNotAWireDayIsRejected() {
        for bad in ["", "2026-07", "2026-7-5", "26-07-05", "2026-13-01", "2026-02-30", "today"] {
            XCTAssertNil(
                StatsFormat.localDate(fromISODay: bad),
                "\(bad) is not a wire day and must not resolve to one")
        }
    }

    // MARK: - 4b. Group samples (2026-08-03)
    //
    // The figure rows print bare values now, so a GROUP of parallel rows states
    // its denominators together, in one sentence, in the card's info sheet.
    // Together rather than one-per-row because the rows partition one sample.
    // The strings are the web twin's oracle, character for character.

    func testAGroupSampleListsEveryLegWithTheLastJoinedByAnd() {
        XCTAssertEqual(
            StatsFormat.vsParByTeeSample(
                ByTee(fairway: rate(0, 0, 26), inPlay: rate(0, 0, 8), trouble: rate(0, 0, 9))),
            "over 26 holes from the fairway, 8 holes in play and 9 holes from trouble")
        // A single leg takes no comma and no "and".
        XCTAssertEqual(StatsFormat.groupSample([(3, .rounds)]), "over 3 rounds")
    }

    func testByParReadsInTheGolfersOwnNounsPluralised() {
        XCTAssertEqual(
            StatsFormat.byParSample(
                ByParGroup(par3: rate(0, 0, 12), par4: rate(0, 0, 30), par5: rate(0, 0, 12))),
            "over 12 par 3s, 30 par 4s and 12 par 5s")
        XCTAssertEqual(
            StatsFormat.byParSample(
                ByParGroup(par3: rate(0, 0, 1), par4: rate(0, 0, 1), par5: rate(0, 0, 1))),
            "over 1 par 3, 1 par 4 and 1 par 5")
    }

    func testAnEmptyLegIsDroppedNeverPrintedAsOverZero() {
        // Every leg carries its own noun precisely because any leg can end up
        // first once the empty ones are gone.
        XCTAssertEqual(
            StatsFormat.vsParByTeeSample(
                ByTee(fairway: rate(0, 0, 0), inPlay: rate(0, 0, 0), trouble: rate(0, 0, 9))),
            "over 9 holes from trouble")
        XCTAssertEqual(
            StatsFormat.byParSample(
                ByParGroup(par3: rate(0, 0, 0), par4: rate(0, 0, 30), par5: rate(0, 0, 12))),
            "over 30 par 4s and 12 par 5s")
        XCTAssertNil(StatsFormat.groupSample([(0, .rounds)]))
        XCTAssertNil(StatsFormat.groupSample([]))
    }

    func testTheMissedGreenPairReadsAsAPartitionNotAComparison() {
        // The same two denominators `missedGreenTaxSample` says "vs" about — the
        // group card states them as the two halves of the window they are.
        XCTAssertEqual(
            StatsFormat.missedGreenSample(
                VsParSplit(hit: rate(2, 2, 26), miss: rate(31, 31, 34), delta: rate(738, 738, 884))),
            "over 26 greens hit and 34 holes with the green missed")
    }

    // MARK: - 5. The Gregorian year

    func testTheYearIsGregorianWhateverTheDeviceCalendarIs() {
        let day = StatsFormat.date(fromISODay: "2026-07-30")!
        XCTAssertEqual(StatsFormat.gregorianYear(of: day, timeZone: zone("UTC")), 2026)
        XCTAssertEqual(
            StatsFormat.gregorian(in: zone("UTC")).identifier, Calendar.Identifier.gregorian)
    }

    func testTheYearIsTakenInTheZoneAsked() {
        let newYearUTC = StatsFormat.date(fromISODay: "2026-01-01")!

        XCTAssertEqual(StatsFormat.gregorianYear(of: newYearUTC, timeZone: zone("UTC")), 2026)
        XCTAssertEqual(
            StatsFormat.gregorianYear(of: newYearUTC, timeZone: zone("America/Los_Angeles")), 2025)
    }
}
