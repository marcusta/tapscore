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
/// the app can afford to show a rate over five attempts at all.
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
    /// - Parameter signed: prepend `+` for positive values. What "over par"
    ///   needs and "putts per hole" does not.
    static func average(_ r: Rate, decimals: Int = 2, signed: Bool = false) -> String? {
        switch StatMeasuresMath.rateDisplay(r) {
        case .absent:
            return nil
        case .fraction, .percentage:
            guard let value = r.value else { return nil }
            return signed ? signedNumber(value, decimals: decimals) : number(value, decimals: decimals)
        }
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

    /// Strokes lost or gained, per round. Positive = lost.
    ///
    /// Worded rather than coloured alone: the sign is doing semantic work
    /// (`+1.8` costs you strokes) that is the opposite of the usual reading of
    /// a plus, so the label beside it always says which way is good.
    static func strokesPerRound(_ value: Double) -> String {
        "\(signedNumber(value))/round"
    }

    /// A score relative to par, in the app's usual scorecard voice.
    static func vsPar(_ value: Double) -> String {
        if value == 0 { return "E" }
        return signedNumber(value, decimals: value == value.rounded() ? 0 : 1)
    }

    // MARK: Vocabulary

    static func title(_ component: StrokesLostComponent) -> String {
        switch component {
        case .putting: return "Putting"
        case .shortGame: return "Short game"
        case .penalties: return "Penalties"
        // Named for what it actually contains. The waterfall's residual is
        // everything the other three terms did not claim — tee shots AND
        // approaches together — and there is no column that would split them.
        // Calling it "Tee" would name a cause the arithmetic never isolated.
        case .longGame: return "Long game"
        }
    }

    /// The sentence under a priority row, saying what the number covers.
    static func subtitle(_ component: StrokesLostComponent) -> String {
        switch component {
        case .putting: return "Putts taken vs expected from where you started"
        case .shortGame: return "Chips and pitches vs an average short-game shot"
        case .penalties: return "Strokes added by penalties"
        case .longGame: return "Tee shots and approaches — what the rest did not explain"
        }
    }

    static func title(_ bucket: PuttBucket) -> String {
        switch bucket {
        case .inside1m: return "Inside 1 m"
        case .oneTo2m: return "1–2 m"
        case .twoTo4m: return "2–4 m"
        case .fourTo8m: return "4–8 m"
        case .over8m: return "Over 8 m"
        }
    }

    static func title(_ venue: RoundVenueType) -> String {
        switch venue {
        case .indoor: return "Indoor"
        case .outdoor: return "Outdoor"
        }
    }

    static func title(_ type: RoundRoundType) -> String {
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

    /// `yyyy-MM-dd` for the filter sheet's date pickers, in the same UTC
    /// calendar the wire uses.
    static func isoDay(_ date: Date) -> String {
        dayParser.string(from: date)
    }

    /// Round-trips an `isoDay` back to a `Date` for a `DatePicker` binding.
    static func date(fromISODay isoDay: String) -> Date? {
        dayParser.date(from: isoDay)
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
