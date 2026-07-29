import Foundation

/// The profile screen's string rules — pure, so the three that are easy to get
/// wrong are assertable without a view.
enum ProfileFormat {
    /// The big number at the top of the handicap card.
    ///
    /// Three cases, and each one is a decision:
    ///
    /// - **nil is an EN DASH (U+2013), not "0.0" and not blank.** No index is a
    ///   real state — a player who has never entered one — and a zero would be a
    ///   claim of scratch.
    /// - **A negative index is a PLUS handicap** and reads "+2.4". Golf's
    ///   notation; the domain stores it negative (`PH < 0` is the plus branch
    ///   server-side), so this is where the sign flips back.
    /// - Everything else is one decimal, always: "18" is not how an index is
    ///   written.
    static func index(_ value: Double?) -> String {
        guard let value else { return "\u{2013}" }
        if value < 0 { return "+" + oneDecimal(-value) }
        return oneDecimal(value)
    }

    /// A history row's index. `HandicapInput.format` — so the chain reads
    /// "+2.4" like everything else in the app.
    ///
    /// APPROVED DEVIATION from the web, which renders history through
    /// `toFixed(1)` and therefore shows a plus handicap as "-2.4" in the chain
    /// while showing "+2.4" in the card above it. Two spellings of one number,
    /// one screen apart, is a bug; iOS says "+2.4" in both places.
    static func historyIndex(_ value: Double) -> String {
        HandicapInput.format(value)
    }

    /// The source pill's text: the raw wire value, uppercased ("MANUAL"). Raw
    /// on purpose — the chain is an audit trail, and a friendlier word would
    /// hide which mechanism wrote the row.
    static func source(_ source: HandicapEntrySource) -> String {
        source.rawValue.uppercased()
    }

    /// What the keypad opens holding: the current index in the notation the pad
    /// itself produces, or empty when there is none.
    static func padText(_ value: Double?) -> String {
        guard let value else { return "" }
        return HandicapInput.format(value)
    }

    private static func oneDecimal(_ value: Double) -> String {
        String(format: "%.1f", value)
    }
}
