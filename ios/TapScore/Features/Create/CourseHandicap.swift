import Foundation

/// The WHS course-handicap arithmetic, shown back to the user while they type.
///
/// Swift image of `src/create/handicap.ts`, which is itself a mirror of the
/// server's `server/domain/handicap.ts`. The SERVER is the authority — the
/// values that get persisted always come from there when the round compiles.
/// This copy exists for one reason the spec makes explicit (§4.6 B4.9): the
/// create flow shows the derivation, not just the answer, so a player who
/// expected 14 and got 6 can see which of index, slope, rating or par is the
/// surprise instead of filing a bug about "wrong handicap".
///
///     raw = index × (slope / 113) + (courseRating − par)
///     CH  = round(raw)
enum CourseHandicap {
    struct Derivation: Sendable, Equatable {
        var raw: Double
        var value: Int
        var rating: TeeRating
    }

    static func raw(index: Double, rating: TeeRating) -> Double {
        index * (rating.slope / 113) + (rating.courseRating - rating.par)
    }

    /// HALF-UP, not half-away-from-zero. JavaScript's `Math.round` rounds
    /// −6.5 to −6; Swift's `.rounded()` rounds it to −7. Plus handicaps are
    /// negative, so the difference is not hypothetical — it is exactly the
    /// population this rule is about, and a one-shot disagreement between the
    /// two clients on the same player is the kind of thing that gets noticed
    /// on the ninth green.
    static func round(_ raw: Double) -> Int {
        Int((raw + 0.5).rounded(.down))
    }

    /// The derivation for a player, or nil when any input is missing — no
    /// index, no tee, or a tee with no rating row for that gender (B4.11, which
    /// the caller renders as its own sentence rather than as a blank).
    static func derive(index: Double?, tee: Tee?, gender: PlayerGender) -> Derivation? {
        guard let index, let tee,
              let rating = tee.ratings.first(where: { $0.gender == gender })
        else { return nil }
        let raw = raw(index: index, rating: rating)
        return Derivation(raw: raw, value: round(raw), rating: rating)
    }

    /// B4.9's exact line:
    /// `Course handicap -6  ·  +2,4 × 124/113 + (68.4 − 72) = -6.2`.
    ///
    /// `indexText` is the user's OWN spelling, verbatim — echoing back "+2,4"
    /// rather than "-2.4" is what makes the line legible to the person who
    /// typed it.
    static func line(_ d: Derivation, indexText: String) -> String {
        "Course handicap \(d.value)  ·  \(indexText) × \(number(d.rating.slope))/113"
            + " + (\(number(d.rating.courseRating)) − \(number(d.rating.par)))"
            + " = \(String(format: "%.1f", d.raw))"
    }

    /// Whole numbers without a trailing ".0" — the web prints these straight
    /// from JS numbers, where 124 is "124" and 68.4 is "68.4".
    private static func number(_ value: Double) -> String {
        value == value.rounded() && abs(value) < 1e15
            ? String(Int(value))
            : String(value)
    }
}
