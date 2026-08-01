import Foundation

/// The one line at the top of the spectate screen, and the rules for writing it.
///
/// The spec asks for the relationship stated plainly — "Watching · Anna's round
/// at Linköping" — and that sentence has three failure modes worth pinning in a
/// pure function rather than in a `Text` interpolation:
///
/// - **Unknown friend.** The tapped surface supplies the name; a route restored
///   without one must not invent a possessive ("'s round"). It says "this
///   round" instead.
/// - **Unknown course.** A friendly round can be played anywhere, including
///   nowhere the app knows the name of. The " at …" clause disappears rather
///   than reading "at ".
/// - **Possessives.** A Swedish roster is full of names ending in s (Anders,
///   Hans, Lars). "Lars's round" is wrong here; "Lars' round" is the form the
///   rest of the app's Swedish-facing copy uses.
///
/// The word "Watching" is doing real work and is not decoration: it is the only
/// thing on screen that explains why a round with somebody else's scores has no
/// way to enter one.
enum SpectateHeaderModel {
    /// **A named round is called by its name.** `rounds.name` is what the
    /// organizer typed, and the app leads with it everywhere else a round is
    /// titled (the landing row, the round header) — "Anna's Tisdagsgolfen"
    /// rather than "Anna's round at Linköping". Only an unnamed round falls
    /// back to the generic noun plus the course, which is the server field's
    /// own documented contract ("null ⇒ client falls back to courseName").
    /// The course is not lost when a name wins: it moves to the subtitle.
    static func title(friendName: String?, roundName: String?, courseName: String?) -> String {
        if let named = trimmed(roundName) {
            // No possessive to hang it on: "this Tisdagsgolfen" is not English,
            // and the name alone is already the most specific thing available.
            guard let subject = friendName.flatMap(possessive) else {
                return "Watching · \(named)"
            }
            return "Watching · \(subject) \(named)"
        }
        let subject = friendName.flatMap(possessive) ?? "this"
        let place = trimmed(courseName).map { " at \($0)" } ?? ""
        return "Watching · \(subject) round\(place)"
    }

    /// The subtitle, when there is something true to say beyond the title.
    ///
    /// The course leads it exactly when the title used the round's NAME and
    /// therefore dropped the " at …" clause — so the place is stated once,
    /// never twice and never not at all. That rule lives here rather than in
    /// the view because it is the other half of `title`'s decision.
    static func subtitle(
        roundName: String?,
        courseName: String?,
        status: RoundStatus?,
        holeCount: Int?
    ) -> String? {
        let place = trimmed(roundName) == nil ? nil : trimmed(courseName)
        let holes = holeCount.map { "\($0) holes" }
        let parts: [String?]
        switch status {
        case .complete:
            parts = [place, holes, "Finished"]
        case .notStarted:
            parts = [place, holes, "Not started"]
        case .active, .none:
            parts = [place, holes]
        }
        let joined = parts.compactMap { $0 }.joined(separator: " · ")
        return joined.isEmpty ? nil : joined
    }

    /// The line under the board explaining what this screen is NOT.
    ///
    /// Entry affordances are absent here, not disabled — a greyed-out score
    /// button is a promise that the right tap would work. One sentence at the
    /// bottom is the honest version of the same information.
    static let readOnlyNote = "You're watching this round. Only its players can enter scores."

    private static func possessive(_ name: String) -> String? {
        guard let name = trimmed(name) else { return nil }
        return name.lowercased().hasSuffix("s") ? "\(name)'" : "\(name)'s"
    }

    private static func trimmed(_ value: String?) -> String? {
        guard let value = value?.trimmingCharacters(in: .whitespacesAndNewlines),
              !value.isEmpty
        else { return nil }
        return value
    }
}
