import Foundation

/// The dashboard's WINDOW: which of the fetched per-round rows the panels add up.
///
/// The proposal's whole architecture rests on this being client-side
/// (`docs/proposals/player-stats-presentation.md` §0): the server returns one
/// count row per round and never a rate, so every window — last 5, this year, a
/// hand-picked set of six rounds at one course — is a SELECTION over rows this
/// client already holds, followed by `StatMeasuresMath.sum` and the rate math.
/// There is no per-filter endpoint and there must never be one.
///
/// Everything in this file is pure: no store, no network, no view. It takes rows
/// and a `now` and returns rows.
enum StatsWindowPreset: String, CaseIterable, Sendable, Equatable {
    case last5
    case last10
    case last20
    case thisYear
    case all
    /// The filter sheet's window. Carries no rule of its own — the rule is the
    /// `StatsRoundFilter` beside it.
    case custom

    /// The picker's row label.
    var title: String {
        switch self {
        case .last5: return "Last 5 rounds"
        case .last10: return "Last 10 rounds"
        case .last20: return "Last 20 rounds"
        case .thisYear: return "This year"
        case .all: return "All rounds"
        case .custom: return "Custom"
        }
    }

    /// A one-line explanation for the dropdown row, in the tone of the profile's
    /// hints — what the window MEANS, not what it filters on.
    var subtitle: String? {
        switch self {
        case .last5: return "Your five most recent rounds with stats"
        case .last10: return "Enough rounds for percentages to settle"
        case .last20: return "A season's worth of form"
        case .thisYear: return "Every round dated this calendar year"
        case .all: return "Everything you have ever recorded"
        case .custom: return "Pick dates, courses and rounds by hand"
        }
    }

    /// How many of the NEWEST rounds this preset takes, or nil when the window
    /// is not count-based.
    var roundLimit: Int? {
        switch self {
        case .last5: return 5
        case .last10: return 10
        case .last20: return 20
        case .thisYear, .all, .custom: return nil
        }
    }
}

/// The custom window's criteria. Every collection is **empty-means-everything**,
/// which is what makes the default-constructed filter the identity: opening the
/// sheet and closing it again must not silently narrow the window.
///
/// Dates are the wire's `yyyy-MM-dd`, compared as strings. That ordering is
/// exactly the calendar's for a zero-padded ISO day, and it sidesteps the
/// timezone question a `Date` round-trip would introduce for a value that is a
/// calendar DAY, not an instant.
struct StatsRoundFilter: Equatable, Sendable {
    /// Inclusive lower bound, `yyyy-MM-dd`.
    var from: String?
    /// Inclusive upper bound, `yyyy-MM-dd`.
    var to: String?
    /// Empty = every course.
    var courseIDs: Set<String> = []
    /// Empty = indoor and outdoor.
    var venueTypes: Set<RoundVenueType> = []
    /// Empty = every round type.
    var roundTypes: Set<RoundRoundType> = []
    /// Rounds the player struck out by hand. This is the ONE field that is not
    /// "empty means everything" in the same sense — it always subtracts.
    var excludedRoundIDs: Set<String> = []

    init(
        from: String? = nil,
        to: String? = nil,
        courseIDs: Set<String> = [],
        venueTypes: Set<RoundVenueType> = [],
        roundTypes: Set<RoundRoundType> = [],
        excludedRoundIDs: Set<String> = []
    ) {
        self.from = from
        self.to = to
        self.courseIDs = courseIDs
        self.venueTypes = venueTypes
        self.roundTypes = roundTypes
        self.excludedRoundIDs = excludedRoundIDs
    }

    /// True when the filter constrains nothing.
    var isEmpty: Bool {
        from == nil && to == nil && courseIDs.isEmpty && venueTypes.isEmpty
            && roundTypes.isEmpty && excludedRoundIDs.isEmpty
    }

    /// Does this row survive every criterion?
    func admits(_ row: PlayerRoundStats) -> Bool {
        if let from, row.date < from { return false }
        if let to, row.date > to { return false }
        if !courseIDs.isEmpty, !courseIDs.contains(row.courseId) { return false }
        if !venueTypes.isEmpty, !venueTypes.contains(row.venueType) { return false }
        if !roundTypes.isEmpty, !roundTypes.contains(row.roundType) { return false }
        if excludedRoundIDs.contains(row.roundId) { return false }
        return true
    }
}

/// One course the fetched rows mention, for the filter sheet's course list.
struct StatsCourseOption: Equatable, Sendable, Identifiable {
    var id: String
    var name: String
    /// How many fetched rounds were played there — the sheet orders by this
    /// nowhere, but a course with one round reads differently from one with
    /// forty and the row says so.
    var roundCount: Int
}

enum StatsWindow {
    /// Newest first, deterministically.
    ///
    /// The server already answers newest-first (keyset on `date`), but pages
    /// arrive over time and a test builds rows in whatever order it likes, so
    /// the window sorts rather than trusting arrival order. `roundId`
    /// tie-breaks, because two rounds on one day are common (a morning and an
    /// afternoon nine) and "the last 5" must not depend on which page they came
    /// in on.
    static func sorted(_ rows: [PlayerRoundStats]) -> [PlayerRoundStats] {
        rows.sorted { lhs, rhs in
            lhs.date == rhs.date ? lhs.roundId > rhs.roundId : lhs.date > rhs.date
        }
    }

    /// The rows a window covers, newest first.
    ///
    /// Note the ORDER of operations for `.custom`: the filter is applied and the
    /// result is NOT truncated. A count-based preset truncates and applies no
    /// filter. The two never compose — a "last 10 at Linköping" window is
    /// expressible in the sheet (a date range plus a course plus the checklist)
    /// and deliberately not as a preset wearing a filter, which would leave the
    /// picker saying "Last 10" over a window of three.
    static func apply(
        preset: StatsWindowPreset,
        filter: StatsRoundFilter,
        to rows: [PlayerRoundStats],
        now: Date,
        calendar: Calendar = .current
    ) -> [PlayerRoundStats] {
        let ordered = sorted(rows)
        switch preset {
        case .last5, .last10, .last20:
            guard let limit = preset.roundLimit else { return ordered }
            return Array(ordered.prefix(limit))
        case .thisYear:
            let prefix = yearPrefix(now, calendar: calendar)
            return ordered.filter { $0.date.hasPrefix(prefix) }
        case .all:
            return ordered
        case .custom:
            return ordered.filter(filter.admits)
        }
    }

    /// `"2026-"` — the string every round dated this calendar year starts with.
    static func yearPrefix(_ now: Date, calendar: Calendar = .current) -> String {
        "\(calendar.component(.year, from: now))-"
    }

    /// Should the store ask the server for another page before it can honestly
    /// draw this window?
    ///
    /// The question is never "do I have enough rows" but "could an older row
    /// still belong in the window" — which is why a satisfied count-based window
    /// stops paging while `.all` never does. A window that keeps paging when the
    /// answer cannot change is a phone downloading a career to render five
    /// rounds; a window that stops too early is a percentage computed over half
    /// its sample, which is worse.
    ///
    /// - Parameter hasMore: the server handed back a `nextCursor`.
    static func needsMoreHistory(
        preset: StatsWindowPreset,
        filter: StatsRoundFilter,
        loaded: [PlayerRoundStats],
        hasMore: Bool,
        now: Date,
        calendar: Calendar = .current
    ) -> Bool {
        guard hasMore else { return false }
        switch preset {
        case .last5, .last10, .last20:
            guard let limit = preset.roundLimit else { return false }
            return loaded.count < limit
        case .thisYear:
            // Satisfied once a row OLDER than January 1st has arrived: the feed
            // is newest-first, so that row proves this year is complete.
            let firstOfYear = yearPrefix(now, calendar: calendar) + "01-01"
            return !loaded.contains { $0.date < firstOfYear }
        case .all:
            return true
        case .custom:
            // A lower bound is the only criterion that can PROVE completeness
            // from a newest-first feed: once a row older than `from` is in hand,
            // no unfetched row can be inside the range. Every other criterion
            // (course, venue, the checklist) is satisfiable only by the whole
            // history, so it pages to the end.
            guard let from = filter.from else { return true }
            return !loaded.contains { $0.date < from }
        }
    }

    /// The distinct courses in the fetched rows, name-ordered — the filter
    /// sheet's course list.
    ///
    /// Built from the ROWS rather than from `GET /courses`: a course the player
    /// has never played is not a filter, it is a dead row, and the whole point
    /// of this screen is that it needs no read the dashboard has not already
    /// done.
    static func courses(in rows: [PlayerRoundStats]) -> [StatsCourseOption] {
        var counts: [String: Int] = [:]
        var names: [String: String] = [:]
        for row in rows {
            counts[row.courseId, default: 0] += 1
            // The first non-empty name wins; a row whose course was deleted
            // carries a nil name and must not blank a name a sibling row has.
            if names[row.courseId] == nil, let name = row.courseName, !name.isEmpty {
                names[row.courseId] = name
            }
        }
        return counts.keys
            .map {
                StatsCourseOption(
                    id: $0, name: names[$0] ?? "Unnamed course", roundCount: counts[$0] ?? 0)
            }
            .sorted {
                $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending
                    || ($0.name.localizedCaseInsensitiveCompare($1.name) == .orderedSame
                        && $0.id < $1.id)
            }
    }
}

/// The one thing this screen remembers between launches: which window you were
/// looking at.
///
/// `UserDefaults`, not the Keychain and not the server: it is a view preference,
/// it grants nothing, and a device that forgets it loses a tap. The custom
/// FILTER is deliberately not persisted — it is a within-session refinement, and
/// a restored `.custom` opens on the empty filter, which admits everything and
/// is honest about it rather than silently re-applying criteria from a week ago.
enum StatsWindowPreference {
    static let key = "tapscore.stats.window.v1"

    /// Ten rounds: enough denominator for most rates to clear the display
    /// policy's floor of 5, few enough to still be "your current game".
    static let fallback: StatsWindowPreset = .last10

    static func load(defaults: UserDefaults = .standard) -> StatsWindowPreset {
        guard let raw = defaults.string(forKey: key),
            let preset = StatsWindowPreset(rawValue: raw)
        else { return fallback }
        return preset
    }

    static func save(_ preset: StatsWindowPreset, defaults: UserDefaults = .standard) {
        defaults.set(preset.rawValue, forKey: key)
    }
}
