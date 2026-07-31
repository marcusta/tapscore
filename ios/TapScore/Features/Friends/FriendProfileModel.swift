import Foundation

/// The two ways a friend-profile read can be refused, each a real state rather
/// than an error: the server answers 403 when the mutual edge is gone (or was
/// never there) and 404 when the player does not exist or was deleted. Neither
/// is retryable, so neither renders as an alert — the screen shows a calm
/// full-screen message and the back button is the way out.
enum FriendProfileUnavailability: Equatable, Sendable {
    /// The friendship was withdrawn while the viewer was looking (or the link
    /// was stale). Deliberately vague copy: "Anna removed you" would report one
    /// player's action to another.
    case forbidden
    /// The player id resolves to nothing — deleted account, dead link.
    case notFound

    var title: String {
        switch self {
        case .forbidden: return "Profile not available"
        case .notFound: return "Player not found"
        }
    }

    var message: String {
        switch self {
        case .forbidden: return "This profile is no longer shared with you."
        case .notFound: return "This player doesn't exist anymore."
        }
    }

    var systemImage: String {
        switch self {
        case .forbidden: return "eye.slash"
        case .notFound: return "person.slash"
        }
    }
}

/// Pure presentation rules for the friend-profile surfaces — outside SwiftUI
/// for the same reason `FriendsActivityModel` is: these are the lines a
/// reviewer argues about (what a round row says about someone else's score,
/// when a list admits it is not the whole story), and a view body is not a
/// place a rule can be asserted.
enum FriendProfileModel {
    /// Maps a thrown transport error to a refusal state, or nil when it is an
    /// ordinary failure (network, 500) that should render as a retryable error.
    /// One implementation, shared by all three stores, so the profile card and
    /// the lists cannot disagree about what a 403 means.
    static func unavailability(for error: any Error) -> FriendProfileUnavailability? {
        switch error {
        case APIError.server(403, _): return .forbidden
        case APIError.server(404, _): return .notFound
        default: return nil
        }
    }

    /// A round row's title: the organizer's name for the occasion, falling back
    /// to where it was played. "Round" only when the payload carries neither.
    static func title(_ entry: FriendProfileRoundEntry) -> String {
        if let name = entry.name, !name.isEmpty { return name }
        if let course = entry.courseName, !course.isEmpty { return course }
        return "Round"
    }

    /// The subject's progress in words, without pretending progress that has
    /// not happened:
    ///
    /// - a `not_started` round says so and shows no scoreline;
    /// - an active round with no scored hole reads as teeing off, mirroring
    ///   `FriendsActivityModel.progress` — "Thru 0 · E" would be a scoreline
    ///   they have not played;
    /// - `scoreToPar` is null before a first scored hole, so the score half is
    ///   simply absent rather than dashed.
    static func progress(_ entry: FriendProfileRoundEntry) -> String {
        let holes = Int(entry.holesPlayed)
        switch entry.status {
        case .notStarted:
            return "Not started"
        case .active:
            guard holes > 0 else { return "Teeing off" }
            guard let toPar = entry.scoreToPar else { return "Thru \(holes)" }
            return "Thru \(holes) · \(FriendsActivityModel.scoreToPar(Int(toPar)))"
        case .complete:
            guard holes > 0 else { return "Finished" }
            let played = holes < Int(entry.holeCount) ? "Thru \(holes)" : "Finished"
            guard let toPar = entry.scoreToPar else { return played }
            return "\(played) · \(FriendsActivityModel.scoreToPar(Int(toPar)))"
        }
    }

    /// A round's calendar date the way the rest of the app writes one —
    /// "12 May 2026", matching `RoundListView.displayDate` — falling back to
    /// the raw string when it does not parse (`rounds.date` is caller-supplied
    /// and only non-emptiness is guaranteed). Parsed with a UTC-pinned day
    /// formatter because the value is a zone-free calendar date: interpreting
    /// it in the device zone would shift it by a day for some users.
    static func displayDate(_ raw: String) -> String {
        guard let parsed = dayFormatter.date(from: raw) else { return raw }
        return parsed.formatted(.dateTime.day().month(.abbreviated).year())
    }

    nonisolated(unsafe) private static let dayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: "UTC")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    /// One course row's fact line: "3 rounds · last played 12 May 2026".
    static func courseLine(_ course: FriendProfileCourseEntry) -> String {
        let rounds = Int(course.roundsPlayed)
        let played = rounds == 1 ? "1 round" : "\(rounds) rounds"
        return "\(played) · last played \(displayDate(course.lastPlayedAt))"
    }

    /// "4 courses played" for the profile's courses card.
    static func coursesSummary(_ total: Int) -> String {
        total == 1 ? "1 course played" : "\(total) courses played"
    }

    /// The header's identity line — "Hcp 9.0 · Linköpings GK" — with absent
    /// halves omitted, never dashed. Nil when both are absent, so the header
    /// can drop the line entirely.
    static func identityLine(handicapIndex: Double?, homeClubName: String?) -> String? {
        var parts: [String] = []
        if let handicap = handicapIndex {
            parts.append("Hcp \(FriendListModel.handicap(handicap))")
        }
        if let club = homeClubName, !club.isEmpty {
            parts.append(club)
        }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    /// The live line under the header — presence is the feed's call (activity
    /// recency), this only words it. Progress rides along when there is any;
    /// a live friend with no scored hole yet is teeing off, same as the strip.
    static func presenceLine(_ presence: FriendProfilePresence) -> String {
        guard presence.holesPlayed > 0 else { return "On the course now · Teeing off" }
        guard let toPar = presence.scoreToPar else {
            return "On the course now · Thru \(presence.holesPlayed)"
        }
        return "On the course now · Thru \(presence.holesPlayed) · \(FriendsActivityModel.scoreToPar(toPar))"
    }

    /// Stitches the next page onto what is already shown, dropping any round
    /// the list already carries. The keyset cursor cannot duplicate rows on a
    /// stable server, but a round created between two page reads can shift the
    /// window — a duplicate row would crash `ForEach` on its id, so the merge
    /// is defensive here rather than hopeful there.
    static func merge(
        _ existing: [FriendProfileRoundEntry],
        _ page: [FriendProfileRoundEntry]
    ) -> [FriendProfileRoundEntry] {
        let known = Set(existing.map(\.roundId))
        return existing + page.filter { !known.contains($0.roundId) }
    }
}
