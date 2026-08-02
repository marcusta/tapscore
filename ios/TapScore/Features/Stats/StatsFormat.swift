import Foundation

/// Words and numerals for the stats dashboard.
///
/// The display policy from the proposal (§1) lives here in ONE place:
///
/// - `d >= 5` → a percentage. Enough sample to say "58%" out loud.
/// - `0 < d < 5` → the raw fraction, "2 of 3". A percentage over three
///   attempts is a number pretending to be a measurement; the fraction says
///   the same thing and cannot be over-read.
/// - `d == 0` → absent. Not "0%", not "—" in a slot that looks like a value:
///   the caller is expected to omit the row.
///
/// Denominators are always printed beside the value, which is the whole reason
/// the app can afford to show a rate over five attempts at all. Averages are
/// held to the same bargain by `averageWithSample` — see the note there.
enum StatsFormat {
    // MARK: Rates

    /// The headline reading for a rate, or nil when there is no sample.
    ///
    /// nil is a real answer here and callers must handle it — that is how a
    /// module with no data ends up absent rather than zeroed.
    static func rate(_ r: Rate) -> String? {
        switch StatMeasuresMath.rateDisplay(r) {
        case .absent:
            return nil
        case .fraction:
            return "\(count(r.n)) of \(count(r.d))"
        case .percentage:
            guard let value = r.value else { return nil }
            return "\(Int((value * 100).rounded()))%"
        }
    }

    /// The sample behind a rate, for the line under the headline. nil when the
    /// headline already IS the fraction — printing "2 of 3" twice is noise.
    static func sample(_ r: Rate) -> String? {
        guard StatMeasuresMath.rateDisplay(r) == .percentage else { return nil }
        return "\(count(r.n)) of \(count(r.d))"
    }

    /// Headline plus sample, for places with one line to spend.
    static func rateWithSample(_ r: Rate) -> String? {
        guard let head = rate(r) else { return nil }
        guard let sample = sample(r) else { return head }
        return "\(head) (\(sample))"
    }

    /// A rate rendered as a plain average rather than a percentage — putts per
    /// hole, strokes vs par, penalties per round. Same denominator floor, but
    /// the value is a quantity, not a share, so it never grows a `%`.
    ///
    /// This is the BARE value, and on its own it escapes the display policy: a
    /// percentage always arrives with its sample (either printed beside it or
    /// spelled out as the fraction it degraded into), while "1.85" reads the
    /// same over one hole and over forty. Use `averageWithSample` on any surface
    /// a reader takes a number off; `average` is for callers that print the
    /// sample themselves (`troubleTax`, whose own denominator is not one).
    ///
    /// - Parameter signed: prepend `+` for positive values. What "over par"
    ///   needs and "putts per hole" does not.
    static func average(_ r: Rate, decimals: Int = 2, signed: Bool = false) -> String? {
        switch StatMeasuresMath.rateDisplay(r) {
        case .absent:
            return nil
        case .fraction, .percentage:
            guard let value = r.value else { return nil }
            return signed
                ? signedNumber(value, decimals: decimals) : number(value, decimals: decimals)
        }
    }

    /// The noun a sample is counted in, in both numbers.
    ///
    /// Spelled out rather than derived: "greens hit" and "holes from trouble"
    /// do not pluralise at the end, and a wrong plural in a figure row is the
    /// kind of thing that reads as a bug in the number beside it.
    struct SampleUnit: Equatable, Sendable {
        var one: String
        var many: String

        init(_ one: String, _ many: String) {
            self.one = one
            self.many = many
        }

        /// A regular noun, whose plural is just an `s`.
        static func regular(_ one: String) -> SampleUnit { SampleUnit(one, one + "s") }

        /// The three denominators every average on this screen is over. Kept
        /// short on purpose — the sample sits inside the value column beside the
        /// number, the same slot `rateWithSample` fills with "(14 of 24)".
        static let rounds = SampleUnit.regular("round")
        static let holes = SampleUnit.regular("hole")
        static let greens = SampleUnit.regular("green")

        /// The four sides of a TAX — a difference of two averages, whose sample
        /// is both denominators. Each says which set of holes it counted, so
        /// "over 34 … vs 26 …" reads without a legend.
        static let greensMissed = SampleUnit(
            "hole with the green missed", "holes with the green missed")
        static let greensHit = SampleUnit("green hit", "greens hit")
        static let penaltyHoles = SampleUnit("hole with a penalty", "holes with a penalty")
        static let penaltyFree = SampleUnit("without", "without")
    }

    /// What a thin sample is called, in words. The app's standing rule: an
    /// annotation is a word, never a glyph.
    static let thinSample = "thin sample"

    /// The sample behind an average — "over 24 greens", and the same with the
    /// thin note under the policy's floor.
    ///
    /// The floor is exactly `rateWithSample`'s; only the MARK differs, because
    /// an average has no fraction to degrade into. A rate under five attempts
    /// says it by reading "2 of 3"; an average has to say it outright.
    ///
    /// nil at `d == 0`, matching `average` — the caller omits the row.
    static func averageSample(_ r: Rate, unit: SampleUnit) -> String? {
        switch StatMeasuresMath.rateDisplay(r) {
        case .absent:
            return nil
        case .fraction:
            return "over \(quantity(r.d, unit)) — \(thinSample)"
        case .percentage:
            return "over \(quantity(r.d, unit))"
        }
    }

    /// An average with its denominator beside it — the form every figure row on
    /// this screen uses.
    ///
    /// - Parameter label: what the number MEASURES, placed between the value and
    ///   the sample ("1.85 putts per green hit (over 24 greens)"). Panel
    ///   headlines carry it; a figure row already has the label in its title.
    static func averageWithSample(
        _ r: Rate, decimals: Int = 2, signed: Bool = false, unit: SampleUnit,
        label: String? = nil
    ) -> String? {
        guard let value = average(r, decimals: decimals, signed: signed) else { return nil }
        let head = label.map { "\(value) \($0)" } ?? value
        guard let sample = averageSample(r, unit: unit) else { return head }
        return "\(head) (\(sample))"
    }

    /// The trouble tax's sample is its two SIDES, never its own `d`.
    ///
    /// `StatMeasuresMath.troubleTaxPerHole` puts a difference of two averages
    /// over the CROSS-PRODUCT of their hole counts, and says in its own doc
    /// comment that the result must not be fed to `rateDisplay` as a sample:
    /// nine trouble holes against eleven fairway ones would print "over 99
    /// holes", and four against two would clear the floor of five while resting
    /// on four holes. The honest reading is both denominators, and either of
    /// them being thin is what makes the difference unreliable.
    static func troubleTaxSample(_ vsParByTee: ByTee<Rate>) -> String? {
        let trouble = vsParByTee.trouble.d
        let fairway = vsParByTee.fairway.d
        guard trouble > 0, fairway > 0 else { return nil }
        let reading =
            "over \(quantity(trouble, SampleUnit("hole from trouble", "holes from trouble")))"
            + " vs \(quantity(fairway, SampleUnit("from the fairway", "from the fairway")))"
        let isThin =
            trouble < StatMeasuresMath.minRateDenominator
            || fairway < StatMeasuresMath.minRateDenominator
        return isThin ? "\(reading) — \(thinSample)" : reading
    }

    /// The sample behind a DIFFERENCE of two averages: both denominators, never
    /// the cross-product guard the figure itself carries.
    ///
    /// Thin if EITHER side is under the display policy's floor — the difference
    /// is only as reliable as its smaller side.
    static func taxSample(
        _ a: Rate, _ aUnit: SampleUnit, _ b: Rate, _ bUnit: SampleUnit
    ) -> String? {
        guard a.d > 0, b.d > 0 else { return nil }
        let reading = "over \(quantity(a.d, aUnit)) vs \(quantity(b.d, bUnit))"
        let thin =
            a.d < StatMeasuresMath.minRateDenominator
            || b.d < StatMeasuresMath.minRateDenominator
        return thin ? "\(reading) — \(thinSample)" : reading
    }

    /// "over 34 holes with the green missed vs 26 greens hit".
    static func missedGreenTaxSample(_ cost: VsParSplit) -> String? {
        taxSample(cost.miss, .greensMissed, cost.hit, .greensHit)
    }

    /// "over 9 holes with a penalty vs 45 without".
    static func penaltyTaxSample(_ split: PenaltySplit) -> String? {
        taxSample(split.penalty, .penaltyHoles, split.clean, .penaltyFree)
    }

    /// True when a rate is thin enough that the reading is a fraction — the
    /// cue for a view to skip a bar it would otherwise draw at a misleading
    /// length.
    static func isThin(_ r: Rate) -> Bool {
        StatMeasuresMath.rateDisplay(r) == .fraction
    }

    // MARK: Numbers

    /// A count. Whole where it is whole, which is nearly always: these are
    /// summed integer columns that only pick up a fraction when a caller
    /// averages them.
    static func count(_ value: Double) -> String {
        value == value.rounded() ? String(Int(value.rounded())) : number(value, decimals: 1)
    }

    /// A count with its noun: "1 round", "12 rounds".
    static func quantity(_ value: Double, _ unit: SampleUnit) -> String {
        "\(count(value)) \(value == 1 ? unit.one : unit.many)"
    }

    static func number(_ value: Double, decimals: Int = 1) -> String {
        String(format: "%.\(decimals)f", value)
    }

    /// A signed quantity with a TYPOGRAPHIC minus (U+2212), not a hyphen.
    ///
    /// The whole screen is signed numbers in a tabular font; a hyphen-minus is
    /// narrower than a plus and makes a column of gains and losses jitter.
    /// `-0.0` is normalised away — a rounded-to-nothing value that prints
    /// "−0.0" reads as a small loss when it is neither.
    static func signedNumber(_ value: Double, decimals: Int = 1) -> String {
        let rounded = (value * pow(10, Double(decimals))).rounded() / pow(10, Double(decimals))
        if rounded == 0 { return number(0, decimals: decimals) }
        let magnitude = number(abs(rounded), decimals: decimals)
        return rounded > 0 ? "+\(magnitude)" : "\u{2212}\(magnitude)"
    }

    /// Strokes lost or gained, per 18 attributed holes. Positive = lost.
    ///
    /// Worded rather than coloured alone: the sign is doing semantic work
    /// (`+1.8` costs you strokes) that is the opposite of the usual reading of
    /// a plus, so the label beside it always says which way is good.
    static func strokesPer18(_ value: Double) -> String {
        "\(signedNumber(value)) per 18"
    }

    /// A score relative to par, in the app's usual scorecard voice.
    static func vsPar(_ value: Double) -> String {
        if value == 0 { return "E" }
        return signedNumber(value, decimals: value == value.rounded() ? 0 : 1)
    }

    // MARK: Results

    /// The line under the Results heading: how many rounds, and of what lengths.
    ///
    /// The round COUNT lives here rather than in a figure row inside the card,
    /// because it is the sample every figure below it is drawn from and it has
    /// to agree with the round list further down the screen — including
    /// score-only and stats-only rounds.
    ///
    /// `—` is U+2014 with a space either side; `×` is U+00D7 with a space either
    /// side. Both are shared verbatim with the web twin.
    static func resultsSubtitle(_ results: ResultsSummary?) -> String {
        guard let results, results.rounds > 0 else { return "" }
        let head = quantity(Double(results.rounds), .rounds)
        // One length: naming the mix would just repeat the count.
        if results.lengths.count == 1 {
            return "\(head) \u{2014} \(quantity(results.lengths[0].holeCount, .holes))"
        }
        let mix = results.lengths
            .map { "\(count(Double($0.rounds))) \u{00D7} \(quantity($0.holeCount, .holes))" }
            .joined(separator: ", ")
        return "\(head) \u{2014} \(mix)"
    }

    // MARK: Vocabulary

    static func title(_ component: StrokesLostComponent) -> String {
        switch component {
        case .tee: return "Tee"
        case .approach: return "Approach"
        case .shortGame: return "Short game"
        case .putting: return "Putting"
        case .penalties: return "Penalties"
        }
    }

    // A priority row carries NO explainer sentence (owner ruling, 2026-08-02):
    // the component name stands alone, and the section intro above the card is
    // the one place the waterfall is explained. The per-component sentences that
    // used to live here are deleted, not commented out — the same five strings
    // were removed from the web twin's `stats-format.ts`.

    static func title(_ bucket: PuttBucket) -> String {
        switch bucket {
        case .inside1m: return "Inside 1 m"
        case .oneTo2m: return "1–2 m"
        case .twoTo4m: return "2–4 m"
        case .fourTo8m: return "4–8 m"
        case .over8m: return "Over 8 m"
        }
    }

    /// "Holes by putts" deliberately echoes the Results card's "Holes by score":
    /// same idiom, same mini-bar rows, percent-only values.
    static func title(_ bucket: PuttCountBucket) -> String {
        switch bucket {
        case .zero: return "No putts"
        case .one: return "One putt"
        case .two: return "Two putts"
        case .threePlus: return "Three or more"
        }
    }

    static func title(_ type: ScoreType) -> String {
        switch type {
        case .eagleOrBetter: return "Eagle or better"
        case .birdie: return "Birdie"
        case .par: return "Par"
        case .bogey: return "Bogey"
        case .doubleBogeyPlus: return "Doubles or worse"
        }
    }

    static func title(_ venue: VenueType) -> String {
        switch venue {
        case .indoor: return "Indoor"
        case .outdoor: return "Outdoor"
        }
    }

    static func title(_ type: RoundType) -> String {
        switch type {
        case .full18: return "18 holes"
        case .front9: return "Front 9"
        case .back9: return "Back 9"
        case .customHoles: return "Custom holes"
        }
    }

    // MARK: Dates

    /// `2026-07-30` → the reader's own medium date.
    ///
    /// Parsed and rendered in UTC, matching `RoundHeaderView.localizedDate`: a
    /// round's date is a plain calendar DAY with no time zone in it, and
    /// parsing it locally would shift a Swedish evening round onto the previous
    /// day for any reader west of Greenwich.
    static func day(_ isoDay: String) -> String {
        guard let date = dayParser.date(from: isoDay) else { return isoDay }
        return dayPrinter.string(from: date)
    }

    /// `yyyy-MM-dd` for an instant read in UTC — the wire's own reading of a
    /// day, and the inverse of `date(fromISODay:)`.
    ///
    /// NOT for a `DatePicker`: see `isoDay(localDayOf:timeZone:)`.
    static func isoDay(_ date: Date) -> String {
        dayParser.string(from: date)
    }

    /// Parses an `isoDay` to the instant of UTC midnight on it.
    static func date(fromISODay isoDay: String) -> Date? {
        dayParser.date(from: isoDay)
    }

    /// The Gregorian calendar in a given zone.
    ///
    /// Every day this app writes is a GREGORIAN day — `yyyy-MM-dd` is the wire
    /// format — so no reading of one may go through `Calendar.current`, which on
    /// a device set to the Buddhist calendar answers 2569 for this year and
    /// matches no row the server ever wrote. The ZONE is the only thing the
    /// device's own calendar gets to decide, because that is what says which day
    /// "today" is.
    static func gregorian(in timeZone: TimeZone) -> Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        return calendar
    }

    /// The Gregorian year an instant falls in, as the reader's zone sees it.
    static func gregorianYear(of date: Date, timeZone: TimeZone = .current) -> Int {
        gregorian(in: timeZone).component(.year, from: date)
    }

    /// A `DatePicker`'s `Date` → the calendar day the reader SAW on it.
    ///
    /// A picker deals in local wall-clock time; `isoDay(_:)` above reads an
    /// instant in UTC. Those are different days on either side of midnight, so
    /// a bound committed through the UTC printer can name a day the picker never
    /// showed — and because the sheet re-seeds its picker from the committed
    /// value, the pair drifts a day on every open in a western zone. This takes
    /// the year/month/day the DEVICE displays and prints exactly that.
    static func isoDay(localDayOf date: Date, timeZone: TimeZone = .current) -> String {
        let parts = gregorian(in: timeZone).dateComponents([.year, .month, .day], from: date)
        guard let year = parts.year, let month = parts.month, let day = parts.day else {
            return isoDay(date)
        }
        return String(format: "%04d-%02d-%02d", year, month, day)
    }

    /// An `isoDay` → local midnight, for a `DatePicker` binding.
    ///
    /// The exact inverse of `isoDay(localDayOf:timeZone:)` and tested as one: a
    /// day that goes through both comes back unchanged in every zone. nil for
    /// anything that is not a real `yyyy-MM-dd` — a rolled-over component
    /// ("2026-13-40") resolves to a real instant that is not the day asked for,
    /// so the round trip itself is the validation.
    static func localDate(fromISODay iso: String, timeZone: TimeZone = .current) -> Date? {
        let parts = iso.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 3, parts[0].count == 4, parts[1].count == 2, parts[2].count == 2,
            let year = Int(parts[0]), let month = Int(parts[1]), let day = Int(parts[2])
        else { return nil }
        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = day
        guard let date = gregorian(in: timeZone).date(from: components),
            isoDay(localDayOf: date, timeZone: timeZone) == iso
        else { return nil }
        return date
    }

    /// Plain `static let`, no `nonisolated(unsafe)`: `DateFormatter` is
    /// `Sendable` under this SDK, and these are never mutated after
    /// construction. (`DeviceRoundsStore.isoFormatter` still carries the
    /// annotation from before that changed.)
    private static let dayParser: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    private static let dayPrinter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter
    }()
}
