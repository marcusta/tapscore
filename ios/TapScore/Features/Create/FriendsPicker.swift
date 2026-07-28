import Foundation

/// The "add from friends" list, as a value: who is offered, in what order, and
/// what a search narrows it to.
///
/// Pure on purpose. The ORDER is the whole point of this control — a golfer's
/// regulars have to be the first three rows or the picker is slower than typing
/// the name — and it is the one thing a screenshot cannot verify. Keeping the
/// rule here means the frecency ordering (`src/friends/friend-sort.ts`, spec
/// §5.2 / B5.7) is asserted against the thing the sheet actually renders.
///
/// The search field is an INVENTION (spec §12.4, D10): the web's picker has
/// none, and a list of forty friends with no filter is a scroll. Order inside
/// the filtered set is unchanged, so searching never re-ranks anybody.
struct FriendsPicker: Sendable, Equatable {
    /// Everything `GET /friends` returned, in whatever order it arrived.
    var friends: [FriendProfile] = []
    /// Player ids already on the roster — excluded from the list entirely
    /// (B5.11), so "add" is never a no-op the user has to interpret.
    var excludedPlayerIds: Set<String> = []
    var query: String = ""

    /// Every friend not already playing, in frecency order.
    var available: [FriendProfile] {
        Self.sorted(friends.filter { !excludedPlayerIds.contains($0.id) })
    }

    /// `available`, narrowed by the query — same order (B5.8).
    var results: [FriendProfile] {
        let needle = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !needle.isEmpty else { return available }
        return available.filter { Self.matches($0, needle) }
    }

    /// True when the user has typed something that matched nobody — an empty
    /// state, as opposed to "you have no friends yet", which is a different
    /// sentence and a different fix.
    var isEmptyHanded: Bool {
        !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && results.isEmpty
    }

    // MARK: - Rules

    /// Spec §5.2 / B5.7, the web's `sortFriends(mode: 'frecency')`:
    ///
    ///   1. anyone you have played with (frecency > 0) first, frecency DESC;
    ///   2. ties by `lastPlayedAt` DESC — the more recent partner first;
    ///   3. then display name;
    ///   4. never-played friends last, alphabetical among themselves.
    ///
    /// A missing/unparseable `lastPlayedAt` sorts as the far past, so a friend
    /// with history but no timestamp cannot leapfrog one you played yesterday.
    static func sorted(_ friends: [FriendProfile]) -> [FriendProfile] {
        friends.enumerated().sorted { lhs, rhs in
            let a = lhs.element, b = rhs.element
            let playedA = a.frecency > 0, playedB = b.frecency > 0
            if playedA != playedB { return playedA }
            if !playedA {
                let order = compareNames(a.displayName, b.displayName)
                return order == .orderedSame ? lhs.offset < rhs.offset : order == .orderedAscending
            }
            if a.frecency != b.frecency { return a.frecency > b.frecency }
            let ta = timestamp(a.lastPlayedAt), tb = timestamp(b.lastPlayedAt)
            if ta != tb { return ta > tb }
            let order = compareNames(a.displayName, b.displayName)
            return order == .orderedSame ? lhs.offset < rhs.offset : order == .orderedAscending
        }
        .map(\.element)
    }

    /// B5.8: display name OR username, case- and diacritic-insensitively — so
    /// `bjorn` finds `Björn` and `@bjornl` finds him too. A leading `@` the
    /// user typed is ignored, because the row shows one.
    static func matches(_ friend: FriendProfile, _ query: String) -> Bool {
        var needle = query
        if needle.hasPrefix("@") { needle.removeFirst() }
        guard !needle.isEmpty else { return true }
        return contains(friend.displayName, needle) || contains(friend.username, needle)
    }

    /// B5.9: the index to one decimal, or an en dash when the friend has none.
    /// Not "0.0" — a friend with no index is unknown, not scratch, and seeding
    /// a row from "0.0" would quietly hand a beginner no shots.
    static func handicapText(_ friend: FriendProfile) -> String {
        guard let index = friend.handicapIndex else { return "–" }
        return index < 0
            ? "+" + String(format: "%.1f", -index)
            : String(format: "%.1f", index)
    }

    // MARK: - Collation

    private static func timestamp(_ raw: String?) -> Double {
        guard let raw else { return -.greatestFiniteMagnitude }
        for parser in ISO8601DateFormatter.friendsParsers {
            if let date = parser.date(from: raw) { return date.timeIntervalSince1970 }
        }
        return -.greatestFiniteMagnitude
    }

    /// Swedish collation at base sensitivity, against a FIXED locale — the same
    /// friend list must come out in the same order on every phone.
    private static func compareNames(_ a: String, _ b: String) -> ComparisonResult {
        a.compare(
            b,
            options: [.caseInsensitive, .diacriticInsensitive],
            range: nil,
            locale: Locale(identifier: "sv_SE"))
    }

    private static func contains(_ haystack: String, _ needle: String) -> Bool {
        haystack.range(
            of: needle,
            options: [.caseInsensitive, .diacriticInsensitive],
            range: nil,
            locale: Locale(identifier: "sv_SE")) != nil
    }
}

extension ISO8601DateFormatter {
    /// `lastPlayedAt` may or may not carry fractional seconds depending on how
    /// the row was written; a parser that only accepts one spelling would drop
    /// half the timestamps to "never" and reorder the list.
    /// `nonisolated(unsafe)` because `ISO8601DateFormatter` is documented as
    /// thread-safe for parsing but is not `Sendable`, and these two are
    /// configured once here and never mutated again.
    nonisolated(unsafe) static let friendsParsers: [ISO8601DateFormatter] = {
        let fractional = ISO8601DateFormatter()
        fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let plain = ISO8601DateFormatter()
        plain.formatOptions = [.withInternetDateTime]
        return [fractional, plain]
    }()
}
