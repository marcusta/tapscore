import Foundation

/// Words and numerals for the stats dashboard.
///
/// The display policy lives here in ONE place, and since the owner ruling of
/// 2026-08-02 it has exactly two cases:
///
/// - `d > 0` → a percentage, always. "50%" off two attempts is what the reader
///   asked for; the sample is still spelled out, in the collapsed card's
///   headline and in the card's info sheet.
/// - `d == 0` → absent. The caller substitutes `StatsCopy.noValue` (`—`) in a
///   fixed value column, or `StatsCopy.notRecorded` in a figure row.
///
/// The old middle band — `0 < d < 5` reading as the raw fraction "2 of 3" — is
/// RETIRED. It was built to stop a reader over-reading a small sample, and it
/// cost more than it bought: a fraction cannot be read at a glance, cannot be
/// drawn as a bar, and made a new player's screen look broken on exactly the
/// data every new player has.
///
/// `StatMeasuresMath.rateDisplay` survives, but no formatter may call it — see
/// its own doc comment. It answers an admission question, not a rendering one.
enum StatsFormat {
    // MARK: Rates

    /// The headline reading for a rate, or nil when there is no sample at all.
    ///
    /// nil is a real answer here and callers must handle it — that is how a
    /// module with no data ends up absent rather than zeroed.
    static func rate(_ r: Rate) -> String? {
        guard r.d > 0, let value = r.value else { return nil }
        return "\(Int((value * 100).rounded()))%"
    }

    /// "14 of 24". Available for ANY sample now — the caller decides whether it
    /// has the room. Headlines and info sheets do; a row value column does not.
    static func sample(_ r: Rate) -> String? {
        guard r.d > 0 else { return nil }
        return "\(count(r.n)) of \(count(r.d))"
    }

    /// Headline plus sample, for places with one line to spend.
    static func rateWithSample(_ r: Rate) -> String? {
        guard let head = rate(r) else { return nil }
        guard let sample = sample(r) else { return head }
        return "\(head) (\(sample))"
    }

    /// A rate rendered as a plain average rather than a percentage — putts per
    /// hole, strokes vs par, penalties per round. The value is a quantity, not
    /// a share, so it never grows a `%`.
    ///
    /// This is the BARE value. "1.85" reads the same over one hole and over
    /// forty, so use `averageWithSample` on any surface a reader takes a number
    /// off; `average` is for callers that print the sample themselves
    /// (`troubleTax`, whose own denominator is not one).
    ///
    /// - Parameter signed: prepend `+` for positive values. What "over par"
    ///   needs and "putts per hole" does not.
    static func average(_ r: Rate, decimals: Int = 2, signed: Bool = false) -> String? {
        guard r.d > 0, let value = r.value else { return nil }
        return signed
            ? signedNumber(value, decimals: decimals) : number(value, decimals: decimals)
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

        /// "1 penalty hole", "5 penalty holes" — the subject of the
        /// penalty-source card. Its sample is usually a handful, so the singular
        /// is the COMMON case here, not the edge one.
        static let labelledPenaltyHoles = SampleUnit.regular("penalty hole")

        /// The legs of a GROUP sample. Each carries its own noun, unlike the tax
        /// units above, because `groupSample` drops the empty legs and so any
        /// one of them can end up first in the sentence.
        static let fairwayHoles = SampleUnit(
            "hole from the fairway", "holes from the fairway")
        static let inPlayHoles = SampleUnit("hole in play", "holes in play")
        static let troubleHoles = SampleUnit("hole from trouble", "holes from trouble")
        static let par3 = SampleUnit.regular("par 3")
        static let par4 = SampleUnit.regular("par 4")
        static let par5 = SampleUnit.regular("par 5")
    }

    /// The sample behind an average — "over 24 greens". No thin mark: there is
    /// no thin any more.
    ///
    /// nil at `d == 0`, matching `average` — the caller omits the row.
    static func averageSample(_ r: Rate, unit: SampleUnit) -> String? {
        guard r.d > 0 else { return nil }
        return "over \(quantity(r.d, unit))"
    }

    /// An average with its denominator beside it.
    ///
    /// ONE consumer survives the owner's 2026-08-03 ruling: the COLLAPSED PANEL
    /// HEADLINE, which is a whole card reduced to a line and has to say how much
    /// round is behind it. Figure rows inside an open panel print the bare value
    /// via `average` and state the denominator in the card's info sheet, where a
    /// group of parallel rows shares one sentence. Do not re-introduce a call
    /// from `StatsPanelViews`.
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
    /// holes". The honest reading is both denominators.
    ///
    /// These four `*Sample` helpers survive the row-prose deletion because the
    /// CARD INFO SHEETS consume them — a tax's two denominators are exactly the
    /// sentence a sheet has room for and a value column does not.
    static func troubleTaxSample(_ vsParByTee: ByTee<Rate>) -> String? {
        let trouble = vsParByTee.trouble.d
        let fairway = vsParByTee.fairway.d
        guard trouble > 0, fairway > 0 else { return nil }
        return "over \(quantity(trouble, SampleUnit("hole from trouble", "holes from trouble")))"
            + " vs \(quantity(fairway, SampleUnit("from the fairway", "from the fairway")))"
    }

    /// The sample behind a DIFFERENCE of two averages: both denominators, never
    /// the cross-product guard the figure itself carries.
    static func taxSample(
        _ a: Rate, _ aUnit: SampleUnit, _ b: Rate, _ bUnit: SampleUnit
    ) -> String? {
        guard a.d > 0, b.d > 0 else { return nil }
        return "over \(quantity(a.d, aUnit)) vs \(quantity(b.d, bUnit))"
    }

    /// "over 34 holes with the green missed vs 26 greens hit".
    static func missedGreenTaxSample(_ cost: VsParSplit) -> String? {
        taxSample(cost.miss, .greensMissed, cost.hit, .greensHit)
    }

    /// "over 9 holes with a penalty vs 45 without".
    static func penaltyTaxSample(_ split: PenaltySplit) -> String? {
        taxSample(split.penalty, .penaltyHoles, split.clean, .penaltyFree)
    }

    // MARK: Group samples

    // A group of PARALLEL figure rows — the three tee buckets, the three par
    // groups, the two sides of a missed green — states its denominators
    // together, in one sentence, in the card's info sheet. That is where they
    // went when the owner's 2026-08-03 ruling took the "(over 26 greens)" suffix
    // off the rows themselves.
    //
    // Together rather than one-per-row on purpose: the rows PARTITION a sample,
    // so the interesting fact is how the partition split, and three separate
    // sentences would bury it.

    /// "over 26 holes from the fairway, 8 holes in play and 9 holes from
    /// trouble".
    ///
    /// A leg with no sample is dropped rather than printed as a zero, and nil
    /// comes back when nothing is left — the same contract as `averageSample`,
    /// so a caller omits the sentence instead of writing "over 0 holes".
    static func groupSample(_ parts: [(d: Double, unit: SampleUnit)]) -> String? {
        var legs = parts.filter { $0.d > 0 }.map { quantity($0.d, $0.unit) }
        guard let last = legs.popLast() else { return nil }
        if legs.isEmpty { return "over \(last)" }
        return "over \(legs.joined(separator: ", ")) and \(last)"
    }

    /// The three tee buckets' scored holes, in the order the rows read.
    static func vsParByTeeSample(_ byTee: ByTee<Rate>) -> String? {
        groupSample([
            (byTee.fairway.d, .fairwayHoles),
            (byTee.inPlay.d, .inPlayHoles),
            (byTee.trouble.d, .troubleHoles),
        ])
    }

    /// "over 12 par 3s, 30 par 4s and 12 par 5s" — putting and scoring share it.
    static func byParSample(_ byPar: ByParGroup<Rate>) -> String? {
        groupSample([
            (byPar.par3.d, .par3),
            (byPar.par4.d, .par4),
            (byPar.par5.d, .par5),
        ])
    }

    /// "over 26 greens hit and 34 holes with the green missed".
    static func missedGreenSample(_ cost: VsParSplit) -> String? {
        groupSample([
            (cost.hit.d, .greensHit),
            (cost.miss.d, .greensMissed),
        ])
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

    /// A per-bucket strokes-gained figure for the putting ladder. One decimal,
    /// always signed, POSITIVE = LOST (the waterfall's sign).
    ///
    /// The em dash is the empty-COLUMN placeholder, never a label: a bucket with
    /// no resolved hole has nothing to compare, and `Not recorded` wrapping to
    /// two lines inside a 56 pt column is the drift this pass removes. An
    /// exactly-level bucket reads `0.0`, not `E` — `E` is the scorecard's word
    /// for even par, not a strokes-gained zero.
    static func cost(_ value: Double?) -> String {
        guard let value else { return StatsCopy.noValue }
        return signedNumber(value, decimals: 1)
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
