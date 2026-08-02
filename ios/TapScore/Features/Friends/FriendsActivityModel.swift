import Foundation

/// One "Out now" chip: a friend's round, reduced to the two facts the home
/// screen is allowed to know about it.
///
/// The reduction IS the design (docs/proposals/friends-activity.md, "Surfaces"):
/// holes played and score to par, nothing finer. A friend's individual bad hole
/// must never be legible from the landing — the full scorecard is one tap
/// behind, on a screen they chose to open.
struct OutNowChip: Identifiable, Equatable, Sendable {
    /// The round, which is also what the tap opens (spectate is id-addressed;
    /// the viewer never holds this round's share token).
    let roundId: String
    /// The friend the chip is about — the alphabetically first of the caller's
    /// friends in that round, matching the server's own ordering.
    let displayName: String
    /// Who to draw. The id and the photo version travel together because that
    /// pair IS the avatar's cache key; a chip carrying only a name could show
    /// letters and never a face.
    let playerId: String
    let avatarVersion: String?
    /// "Anna + 2" when several of the caller's friends share the round.
    let title: String
    /// "Thru 7 · +3".
    let progress: String
    /// WHERE, deliberately — the course, not `entry.name`.
    ///
    /// The chip's subject is the PERSON ("Anna, live, Thru 7 · +3"); the second
    /// fact a glance wants about a friend is where they are, and a course name
    /// is the same shared landmark for everyone reading it. A round's own name
    /// is the organizer's private label for the occasion ("Tisdagsgolfen",
    /// "Revansch") — meaningful on the round's own screen, where it heads the
    /// spectate view, and noise on somebody else's home screen. The fallback
    /// applies one tap in, not here.
    let courseName: String?

    var id: String { roundId }

    /// What VoiceOver reads instead of three stacked fragments.
    var accessibilityLabel: String {
        let place = (courseName?.isEmpty == false) ? " at \(courseName!)" : ""
        return "\(title)\(place), live, \(progress). Watch."
    }
}

/// One quiet row under "From your friends": who, where, which formats, and
/// when. The round id is the spectate target; no write credential crosses the
/// friends surface.
struct RecentFriendRow: Identifiable, Equatable, Sendable {
    let roundId: String
    let friendLabel: String
    /// The lead friend is the row's visual subject, so their id/version travel
    /// with the label and let the standard avatar resolve its photo.
    let playerId: String
    let avatarVersion: String?
    let displayName: String
    let title: String
    let date: String
    let formatIds: [String]

    var id: String { roundId }

    var displayDate: String? {
        guard let parsed = LandingRow.parse(date) else { return date }
        return parsed.formatted(.dateTime.day().month(.abbreviated).year())
    }

    func accessibilityLabel(formats: String?) -> String {
        var parts = [friendLabel, title]
        if let displayDate { parts.append(displayDate) }
        if let formats { parts.append(formats) }
        return parts.joined(separator: ", ") + ". Watch."
    }
}

/// Pure presentation rules for the friends-activity feed — the home strip's
/// chips, the strip's one-line context, and the set of friends the Friends tab
/// should show a live dot on.
///
/// Outside SwiftUI for the usual reason: these are the parts a reviewer argues
/// about (what a chip is allowed to reveal, what "2 friends on the course"
/// counts), and a view body is not somewhere a rule can be asserted.
enum FriendsActivityModel {
    /// The line above the chips. Nil when there is nothing live — the strip
    /// renders only when non-empty and never occupies home-screen space to say
    /// nothing is happening.
    static func contextLine(_ live: [FriendsActivityEntry]) -> String? {
        let count = friendIds(live).count
        switch count {
        case 0: return nil
        case 1: return "1 friend on the course"
        default: return "\(count) friends on the course"
        }
    }

    /// Every distinct friend appearing in the live list. A friend playing two
    /// rounds at once is one person, and a round with three of your friends in
    /// it is three.
    static func friendIds(_ live: [FriendsActivityEntry]) -> Set<String> {
        Set(live.flatMap { $0.friends.map(\.playerId) })
    }

    static func chips(_ live: [FriendsActivityEntry]) -> [OutNowChip] {
        live.compactMap { entry in
            // The server sorts a round's friends by display name; the leading
            // one is the chip's subject and the rest are a count. An entry with
            // no friends at all cannot be attributed to anybody, so it is not
            // rendered rather than rendered anonymously.
            guard let lead = entry.friends.first else { return nil }
            let others = entry.friends.count - 1
            return OutNowChip(
                roundId: entry.roundId,
                displayName: lead.displayName,
                playerId: lead.playerId,
                avatarVersion: lead.avatarVersion,
                title: others > 0 ? "\(lead.displayName) + \(others)" : lead.displayName,
                progress: progress(lead),
                courseName: entry.courseName
            )
        }
    }

    /// The feed's retrospective half. Friendless entries are omitted because
    /// the landing must always be able to say whose round it is.
    static func recentRows(_ recent: [FriendsActivityEntry]) -> [RecentFriendRow] {
        recent.compactMap { entry in
            guard let lead = entry.friends.first else { return nil }
            let others = entry.friends.count - 1
            let label = others > 0 ? "\(lead.displayName) + \(others)" : lead.displayName
            let course = entry.courseName?.trimmingCharacters(in: .whitespacesAndNewlines)
            return RecentFriendRow(
                roundId: entry.roundId,
                friendLabel: label,
                playerId: lead.playerId,
                avatarVersion: lead.avatarVersion,
                displayName: lead.displayName,
                title: course?.isEmpty == false ? course! : "A round",
                date: entry.date,
                formatIds: entry.formatIds ?? []
            )
        }
    }

    /// "Thru 7 · +3" — and only that.
    ///
    /// A friend with no scored hole of their own is in a round that is live
    /// because SOMEBODY scored; saying "Thru 0 · E" about them would be a
    /// scoreline they have not played. They read as teeing off instead.
    static func progress(_ friend: FriendsActivityFriend) -> String {
        let holes = Int(friend.holesPlayed)
        guard holes > 0 else { return "Teeing off" }
        guard let toPar = friend.scoreToPar else { return "Thru \(holes)" }
        return "Thru \(holes) · \(scoreToPar(Int(toPar)))"
    }

    /// Golf's own sign convention: level par is `E`, everything else is signed.
    static func scoreToPar(_ value: Int) -> String {
        if value == 0 { return "E" }
        return value > 0 ? "+\(value)" : "\(value)"
    }
}
