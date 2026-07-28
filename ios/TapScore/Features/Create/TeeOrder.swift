import Foundation

/// The order a golfer expects to see a course's tees in, and the tee each
/// gender starts on.
///
/// The server lists tees alphabetically (`tee.service.ts` `listByCourse` ends
/// `.orderBy('name')`), so Linköping arrives as `Blå, Gul, Orange, Röd, Vit` —
/// an ordering with no meaning on a golf course. The web renders that list
/// verbatim and defaults every player, of either gender, to its first entry.
/// Both are recorded gaps (`docs/proposals/create-flow-behavior.md` §13, W3/W4);
/// this type is the fix, and it is normative: §4.3 of that spec defines the
/// sort and pins it with ten test vectors (T1–T10), §4.4 defines the gender
/// defaults.
///
/// It is deliberately **pure** — no locale read from the device, no clock, no
/// network. The one collation it does need (Swedish, base sensitivity, for
/// unclassifiable names) is pinned to a fixed `sv` locale rather than the
/// user's, so the same tee list sorts the same way on every phone.
enum TeeOrder {
    // MARK: - Classification

    /// Spec §4.3 step 1. The three kinds a tee name can be, in the order the
    /// blocks appear (step 4): length-named tee sets first, then colours in
    /// canon, then anything we could not read.
    enum Kind: Int, Sendable, Equatable {
        case numeric = 0
        case colour = 1
        case other = 2
    }

    struct Classification: Sendable, Equatable {
        var kind: Kind
        /// Canon rank, `colour` only. Lower sorts first (longest course first).
        var rank: Int?
        /// Metres/yards, `numeric` only. Higher sorts first.
        var length: Double?
    }

    /// Spec §4.3 step 2 — the Swedish canon, longest course to shortest, with
    /// the English names accepted as aliases so an English-language course
    /// still sorts like a golf course.
    static let canonRanks: [String: Int] = [
        "svart": 0, "black": 0,
        "vit": 1, "white": 1,
        "gul": 2, "yellow": 2,
        "blå": 3, "bla": 3, "blue": 3,
        "röd": 4, "rod": 4, "red": 4,
        "orange": 5,
    ]

    /// The canon rank of a whole name, or of its first word — which is what
    /// makes a compound like `Gul herr` rank with `Gul` (spec §4.3 step 2).
    static func canonRank(_ raw: String) -> Int? {
        let name = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !name.isEmpty else { return nil }
        if let rank = canonRanks[name] { return rank }
        guard let first = name.split(whereSeparator: \.isWhitespace).first else { return nil }
        return canonRanks[String(first)]
    }

    /// A positive number, optionally followed by ONE unit word: `58`, `5.8`,
    /// `6120 m`. Anything else is not a length.
    static func length(of raw: String) -> Double? {
        let name = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let parts = name.split(whereSeparator: \.isWhitespace)
        guard let first = parts.first else { return nil }
        guard parts.count <= 2 else { return nil }
        if parts.count == 2, !parts[1].allSatisfy(\.isLetter) { return nil }
        guard let value = Double(first.replacingOccurrences(of: ",", with: ".")), value > 0 else {
            return nil
        }
        return value
    }

    /// `colour` is only consulted when the NAME yields no class — a course that
    /// names its tees `Herrar`/`Damer` but tags them `yellow`/`red` still sorts
    /// in canon.
    static func classify(name: String, colour: String? = nil) -> Classification {
        if let rank = canonRank(name) { return Classification(kind: .colour, rank: rank) }
        if let length = length(of: name) { return Classification(kind: .numeric, length: length) }
        if let colour, let rank = canonRank(colour) {
            return Classification(kind: .colour, rank: rank)
        }
        return Classification(kind: .other)
    }

    // MARK: - The sort

    /// Spec §4.3 steps 3–5, over anything that can name itself. Stable: two
    /// tees with the same class and key keep their input order (vector T7).
    static func sorted<T>(
        _ items: [T],
        name: (T) -> String,
        colour: (T) -> String? = { _ in nil }
    ) -> [T] {
        items
            .enumerated()
            .sorted { lhs, rhs in
                let a = classify(name: name(lhs.element), colour: colour(lhs.element))
                let b = classify(name: name(rhs.element), colour: colour(rhs.element))
                if a.kind != b.kind { return a.kind.rawValue < b.kind.rawValue }
                switch a.kind {
                case .numeric:
                    // Longest first: the championship tees head the list.
                    let x = a.length ?? 0, y = b.length ?? 0
                    if x != y { return x > y }
                case .colour:
                    let x = a.rank ?? Int.max, y = b.rank ?? Int.max
                    if x != y { return x < y }
                case .other:
                    let order = compareNames(name(lhs.element), name(rhs.element))
                    if order != .orderedSame { return order == .orderedAscending }
                }
                return lhs.offset < rhs.offset
            }
            .map(\.element)
    }

    static func sorted(_ tees: [Tee]) -> [Tee] {
        sorted(tees, name: \.name, colour: \.colour)
    }

    /// Swedish collation at base sensitivity, against a FIXED locale — the
    /// device's locale must not change what order a tee list comes out in.
    private static func compareNames(_ a: String, _ b: String) -> ComparisonResult {
        a.compare(
            b,
            options: [.caseInsensitive, .diacriticInsensitive],
            range: nil,
            locale: Locale(identifier: "sv_SE"))
    }

    // MARK: - Gender defaults

    /// Spec §4.4 (B4.3): the tee a player of this gender starts on.
    ///
    /// Rule 1 is the load-bearing one — a tee with no rating row for the gender
    /// can never be that gender's default. That is exactly the silent failure
    /// W5 describes: the web hands an F player Linköping's M-only `Vit`, the
    /// course-handicap line renders empty, and the first anyone hears of it is
    /// a server refusal quoting a uuid.
    static func defaultTee(in tees: [Tee], for gender: PlayerGender) -> Tee? {
        let eligible = tees.filter { tee in tee.ratings.contains { $0.gender == gender } }
        guard !eligible.isEmpty else { return nil }
        let ordered = sorted(eligible)
        let classes = ordered.map { classify(name: $0.name, colour: $0.colour) }
        // A length-named set has no canon to scan: men take the longest, women
        // the shortest, which is where the sort has already put them.
        if classes.allSatisfy({ $0.kind == .numeric }) {
            return gender == .m ? ordered.first : ordered.last
        }
        // M ⇒ gul/yellow or shorter; F ⇒ röd/red or shorter.
        let threshold = gender == .m ? 2 : 4
        if let index = classes.firstIndex(where: { ($0.rank ?? -1) >= threshold }) {
            return ordered[index]
        }
        // Nothing that short exists — take the shortest tee this gender may play.
        return ordered.last
    }

    /// Whether this tee can be played by this gender at all — the rating row
    /// the course handicap is computed from (spec §4.7).
    static func hasRating(_ tee: Tee, for gender: PlayerGender) -> Bool {
        tee.ratings.contains { $0.gender == gender }
    }
}
