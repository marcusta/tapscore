import Foundation

/// Handicap-index TEXT handling — the seam between what a user types and the
/// number the domain stores. The Swift image of `src/create/hcp-input.ts`, and
/// for the same two reasons:
///
///   - Golf writes a better-than-scratch index with a leading "+" ("+2.4");
///     the domain stores it as a NEGATIVE number (`PH < 0` is the
///     plus-handicap branch server-side). A plain numeric parse would read
///     "+2.4" as 2.4 and quietly hand a scratch player four extra shots, so
///     the "+" is mapped to a negation BEFORE parsing.
///   - Swedish (and most European) keyboards produce a decimal COMMA ("18,4"),
///     so both "," and "." are accepted.
enum HandicapInput {
    /// Parse user-entered text to the stored numeric index, or nil when the
    /// text is empty or not a number. "18,4" → 18.4 · "+2.4"/"+2,4" → -2.4 ·
    /// "-2.4" (already-stored notation) → -2.4.
    ///
    /// STRICTER THAN THE WEB, DELIBERATELY. `src/create/hcp-input.ts` finishes
    /// on `parseFloat`, which reads a leading number and ignores whatever
    /// follows: "18.4kg" is 18.4 there, and "12 or so" is 12. Swift's
    /// `Double.init` demands the WHOLE string, so both are nil here — and nil
    /// is what `CreateStore.blocker` turns into "…handicap isn't a number",
    /// which stops the submit. That is the better failure: a handicap is a
    /// number that decides how many shots someone gets, and silently keeping
    /// the digits off the front of something the user did not mean as a number
    /// hands them a scorecard computed from a value nobody agreed to. The
    /// divergence is one-directional — every input the web accepts as a clean
    /// number this accepts identically — so the two clients only disagree about
    /// text that was already a mistake.
    static func parse(_ raw: String) -> Double? {
        let text = raw
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: ",", with: ".")
        if text.isEmpty { return nil }
        let plus = text.hasPrefix("+")
        guard let n = Double(plus ? String(text.dropFirst()) : text), n.isFinite else { return nil }
        return plus ? -n : n
    }

    /// Format a stored index back into golf notation: -2.4 → "+2.4",
    /// 18.4 → "18.4". The decimal separator stays "." — the field accepts
    /// both, and locale formatting would round-trip badly through `parse`.
    static func format(_ value: Double) -> String {
        let magnitude = value < 0 ? -value : value
        let text = magnitude == magnitude.rounded()
            ? String(Int(magnitude))
            : String(magnitude)
        return value < 0 ? "+\(text)" : text
    }
}
