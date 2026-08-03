import Foundation

/// The two orders offered by the web Friends screen.
enum FriendSortMode: String, CaseIterable, Sendable {
    case suggested
    case alphabetical
}

struct FriendListSections: Equatable, Sendable {
    let friends: [FriendProfile]
    let addedByMe: [FriendProfile]
}

/// Pure presentation rules shared by the native Friends screen.
///
/// Source: `src/friends/friend-sort.ts` and `friends.component.ts`. Keeping
/// ordering, relative-time copy and initials outside SwiftUI makes the parts
/// that explain the Suggested list deterministic and testable.
enum FriendListModel {
    static let minimumSearchLength = 2

    static func isSearchable(_ raw: String) -> Bool {
        raw.trimmingCharacters(in: .whitespacesAndNewlines).count >= minimumSearchLength
    }

    /// The API returns both mutual friends and one-way contacts because both
    /// are useful to the round picker. The Friends screen keeps the two
    /// relationships visible instead of calling both of them friends.
    static func sections(
        _ friends: [FriendProfile],
        mode: FriendSortMode
    ) -> FriendListSections {
        let ordered = sorted(friends, mode: mode)
        return FriendListSections(
            friends: ordered.filter(\.isMutual),
            addedByMe: ordered.filter { !$0.isMutual }
        )
    }

    static func sorted(
        _ friends: [FriendProfile],
        mode: FriendSortMode
    ) -> [FriendProfile] {
        switch mode {
        case .suggested:
            return FriendsPicker.sorted(friends)
        case .alphabetical:
            return friends.enumerated().sorted { lhs, rhs in
                let order = compareNames(lhs.element.displayName, rhs.element.displayName)
                return order == .orderedSame
                    ? lhs.offset < rhs.offset
                    : order == .orderedAscending
            }
            .map(\.element)
        }
    }

    // Initials used to live here, with a rule of their own (the first two
    // words). They now come from `AccountAvatar.initials` — first and LAST
    // word, then the username, then a placeholder — because a friend row and
    // the account button drawing the same person differently is the same
    // person appearing as two.

    /// The web list renders the raw stored index to one decimal and an en dash
    /// for a missing value.
    static func handicap(_ value: Double?) -> String {
        value.map { String(format: "%.1f", $0) } ?? "–"
    }

    /// Home-club copy belongs on its own line under the public handle, so a
    /// long handle can never clip it out of the friends card.
    static func homeClub(_ friend: FriendProfile) -> String? {
        let club = friend.homeClubName?.trimmingCharacters(in: .whitespacesAndNewlines)
        return club?.isEmpty == false ? club : nil
    }

    static func subtitle(_ friend: FriendProfile, now: Date) -> String {
        guard friend.sharedRoundCount > 0 else { return "never played" }
        let count = Int(friend.sharedRoundCount)
        let played = "played \(count)×"
        guard let lastPlayed = date(friend.lastPlayedAt) else { return played }
        return "\(played), \(relativeTime(from: lastPlayed, to: now))"
    }

    static func relativeTime(from playedAt: Date, to now: Date) -> String {
        let days = max(
            0,
            Calendar(identifier: .gregorian)
                .dateComponents([.day], from: playedAt, to: now)
                .day ?? 0
        )
        switch days {
        case 0: return "today"
        case 1: return "yesterday"
        case 2..<7: return "\(days) days ago"
        case 7..<14: return "last week"
        case 14..<30: return "\(days / 7) weeks ago"
        case 30..<60: return "last month"
        case 60..<365: return "\(days / 30) months ago"
        default:
            let years = days / 365
            return years == 1 ? "last year" : "\(years) years ago"
        }
    }

    private static func date(_ raw: String?) -> Date? {
        guard let raw else { return nil }
        return ISO8601DateFormatter.friendsParsers.lazy.compactMap { $0.date(from: raw) }.first
    }

    private static func compareNames(_ a: String, _ b: String) -> ComparisonResult {
        a.compare(
            b,
            options: [.caseInsensitive, .diacriticInsensitive],
            range: nil,
            locale: Locale(identifier: "sv_SE")
        )
    }
}
