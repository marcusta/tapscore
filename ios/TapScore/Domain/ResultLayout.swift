// Platform-neutral result LAYOUT fold — the native (N4) renderer's contract.
//
// Swift port of `src/round/result-layout.ts`. ONE place turns the server's
// result contract (`SlotResultView` sections) into a layout tree: which columns
// exist, how they group into the round's frozen route sections, what text sits
// in each cell, which cells carry a decoration, what each subtotal / TOT / pace
// value reads. Renderers are thin adapters that walk this tree and emit their
// own markup:
//
//   src/round/result-render.ts          → the web (HTML string) renderer
//   scripts/render/sections/result.ts   → the static verification oracle
//   this file + a SwiftUI view          → the native renderer
//
// The tree is LAYOUT, never pixels: no class names, no markup, no fonts. It is
// plain JSON — EVERY type in the tree is `Codable`, including the
// `LeaderboardSectionLayout` union (discriminated on `kind`, exactly as in TS),
// and a round-trip through JSON is pinned by the tests — so it stays the same
// shape the other two clients consume. Optional fields encode an explicit
// `null` rather than dropping the key, because the TS tree always emits the
// key; a Swift dump must diff clean against a web one. All strings are RAW —
// escaping is the emitting adapter's job.
//
// Nothing here reimplements a scoring rule and nothing branches on a format id:
// every value, note, total and idiom string already came from the server.
//
// ---------------------------------------------------------------------------
// IMPEDANCE with the TypeScript source (read before diffing the two files)
// ---------------------------------------------------------------------------
//  1. INPUT TYPES ARE THE GENERATED WIRE TYPES. TS declares a structural
//     mirror (`ViewScoreGridSection`, `ViewGridRow`, …) because `src/` may not
//     import `server/`; Swift has no such split, so the fold consumes
//     `ScoreGridSection` / `RouteSectionRef` / `RankedSection` /
//     `MatchSummarySection` from `API/Generated/FriendlyRoundsTypes.swift`
//     directly. Same fields, same names.
//  2. NUMBERS ARE `Double`. The generator maps TS `number` to `Double`, so
//     every arithmetic and display path goes through `jsNumberString` /
//     `toFixed1` below, which reproduce JS `String(n)` and `n.toFixed(1)`.
//     Emitting Swift's default `Double` description would print `72.0`.
//  3. `position` / `holesPlayed` are narrowed to `Int` in the LAYOUT (they are
//     counts and every renderer wants them as such). The contract emits
//     integers, but `Double` can carry values `Int(_:)` TRAPS on (non-finite,
//     or beyond `Int`'s range), and a wire value is untrusted input — so the
//     narrowing goes through the total `countInt` below, never `Int(_:)`.
//  4. `marker` is a discriminated union in Swift (`GridCellMarker`) where TS
//     had one open struct. The `template` / `tone` / `label` accessors in the
//     extension below flatten it back to what the fold reads. A custom marker
//     reports `template == "custom"`; its `customId` is deliberately NOT part
//     of the layout, exactly as in TS.
//  5. `hasMoreUnscored`-style `Array.sort` stability: JS `Array#sort` is
//     stable, Swift's `sort` is not, so both sorts here carry an explicit
//     original-index tiebreak.
//  6. `Map(...)` from an array of pairs keeps the LAST duplicate in JS;
//     `Dictionary(_:uniquingKeysWith:)` reproduces that.

// --- number formatting (JS parity) ------------------------------------------

/// JS `String(n)` for the values this fold prints: integral doubles lose the
/// `.0` Swift would otherwise emit. Non-integral values fall back to Swift's
/// shortest round-trip description, which agrees with JS for every value the
/// contract can carry.
func jsNumberString(_ v: Double) -> String {
    if v.isFinite, v == v.rounded(), v.magnitude < 1e15 {
        return String(Int64(v))
    }
    return String(v)
}

/// JS `n.toFixed(1)`, without Foundation's `String(format:)`.
func toFixed1(_ v: Double) -> String {
    let scaled = (v * 10).rounded()
    let negative = scaled < 0
    let units = Int64(scaled.magnitude)
    return "\(negative ? "-" : "")\(units / 10).\(units % 10)"
}

/// TOTAL `Double` → `Int` narrowing for the wire's count-like numbers
/// (`position`, `holesPlayed`). `Int(someDouble)` traps on NaN, on infinity and
/// on anything outside `Int`'s range, and these values arrive from the network:
/// a malformed payload must render a wrong number, never crash the board.
/// Rounds to nearest (so a stray `2.7` reads as `3`, not `2`), clamps anything
/// outside `Int`'s range — infinities included — to `Int.min`/`Int.max`, and
/// maps NaN (which has no order, so nothing to clamp toward) to `0`.
func countInt(_ v: Double) -> Int {
    guard !v.isNaN else { return 0 }
    let rounded = v.rounded()
    if let exact = Int(exactly: rounded) { return exact }
    return rounded > 0 ? Int.max : Int.min
}

// --- explicit-null encoding --------------------------------------------------

/// The TS tree emits every optional key with a `null` value; Swift's synthesized
/// `Encodable` OMITS the key instead. Every optional in this file encodes
/// through this helper so a Swift JSON dump diffs clean against the web tree.
/// (Decoding stays synthesized — `decodeIfPresent` already accepts both forms.)
extension KeyedEncodingContainer {
    mutating func encodeExplicitNil<T: Encodable>(_ value: T?, forKey key: K) throws {
        if let value {
            try encode(value, forKey: key)
        } else {
            try encodeNil(forKey: key)
        }
    }
}

// --- contract input adapters -------------------------------------------------

extension GridCellMarker {
    /// The marker's template id as the fold reads it. A custom marker's
    /// discriminant IS `"custom"`; `customId` is not layout.
    var template: String {
        switch self {
        case .other(let m): return m.template.rawValue
        case .custom: return "custom"
        }
    }

    var markerTone: GridCellTone? {
        switch self {
        case .other(let m): return m.tone
        case .custom(let m): return m.tone
        }
    }

    var markerLabel: String? {
        switch self {
        case .other(let m): return m.label
        case .custom(let m): return m.label
        }
    }
}

/// Ball id → display name. Supplied by the adapter (it owns ball metadata).
///
/// `@Sendable` so a resolver can be held in a `Sendable` value type; the fold
/// never stores or escapes it, and calls it only on the caller's thread.
typealias NameOf = @Sendable (String) -> String
/// Ball id → "Group N" label, or `nil` on a single-group round (Phase 3.5).
typealias GroupOf = @Sendable (String) -> String?

/// `product` hides the internal/verification facts (slot index, HCP/PH) a live
/// board has no use for; `verification` keeps everything the server sent.
enum ResultRenderMode: String, Codable, Sendable, Equatable {
    case product
    case verification
}

// --- layout tree -------------------------------------------------------------

/// One scorecard column, already resolved to its header text.
struct ColumnLayout: Codable, Sendable, Equatable {
    var label: String
}

/// A column group = one frozen route section (OUT / IN / …), or the single `TOT`
/// fallback when the round declares none. An adapter may stack one table per
/// group (web: never scroll an 18-hole card sideways) or lay them side by side
/// in one table (oracle) — the grouping itself is decided here, once.
struct ColumnGroupLayout: Codable, Sendable, Equatable {
    var label: String
    var columns: [ColumnLayout]
}

/// The toned intents an adapter styles; every other contract tone collapses to
/// `nil`.
enum MarkerTone: String, Codable, Sendable, Equatable {
    case success
    case warning
    case danger
}

/// What decorates a cell's value. The visual meaning rides in `label`.
enum CellDecorationLayout: Codable, Sendable, Equatable {
    case plain
    /// Per-cell team tint on an undecorated value (the round pill).
    case pill(team: GridRowTeam)
    /// A score marker draws a shape around the value. With a team, the shape
    /// itself takes the team fill — never a shape nested in a pill.
    case marker(template: String, tone: MarkerTone?, label: String?, teamFill: GridRowTeam?)

    // JSON shape is the TS one: a `kind` discriminant beside flat fields.
    private enum CodingKeys: String, CodingKey {
        case kind, team, template, tone, label, teamFill
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        switch try c.decode(String.self, forKey: .kind) {
        case "plain":
            self = .plain
        case "pill":
            self = .pill(team: try c.decode(GridRowTeam.self, forKey: .team))
        case "marker":
            self = .marker(
                template: try c.decode(String.self, forKey: .template),
                tone: try c.decodeIfPresent(MarkerTone.self, forKey: .tone),
                label: try c.decodeIfPresent(String.self, forKey: .label),
                teamFill: try c.decodeIfPresent(GridRowTeam.self, forKey: .teamFill)
            )
        case let other:
            throw DecodingError.dataCorrupted(.init(
                codingPath: decoder.codingPath,
                debugDescription: "unknown decoration kind: \(other)"))
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .plain:
            try c.encode("plain", forKey: .kind)
        case .pill(let team):
            try c.encode("pill", forKey: .kind)
            try c.encode(team, forKey: .team)
        case .marker(let template, let tone, let label, let teamFill):
            try c.encode("marker", forKey: .kind)
            try c.encode(template, forKey: .template)
            try c.encodeExplicitNil(tone, forKey: .tone)
            try c.encodeExplicitNil(label, forKey: .label)
            try c.encodeExplicitNil(teamFill, forKey: .teamFill)
        }
    }
}

struct CellLayout: Codable, Sendable, Equatable {
    /// Cell text; `""` when the row has no cell for this column.
    var text: String
    var title: String?
    var decoration: CellDecorationLayout

    private enum CodingKeys: String, CodingKey {
        case text, title, decoration
    }

    init(text: String, title: String?, decoration: CellDecorationLayout) {
        self.text = text
        self.title = title
        self.decoration = decoration
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(text, forKey: .text)
        try c.encodeExplicitNil(title, forKey: .title)
        try c.encode(decoration, forKey: .decoration)
    }
}

/// One row's cells inside one column group, plus that group's subtotal.
struct RowGroupLayout: Codable, Sendable, Equatable {
    var cells: [CellLayout]
    var subtotal: String
}

struct GridRowLayout: Codable, Sendable, Equatable {
    /// Contract row kind (`par` / `si` / `gross` / …) — a styling hint only.
    var kind: String
    var emphasis: Bool
    var team: GridRowTeam?
    /// Resolved subject name, or nil when the row labels itself.
    ///
    /// `subjectName` and `labelText` stay SEPARATE parts so an adapter can style
    /// them apart (bold name, dim qualifier). The canonical composition for a
    /// NEW renderer — this one included — is the web one:
    /// `name + (label.isEmpty ? "" : " " + label)`. A row with a subject but no
    /// label text must not gain a trailing space. The oracle's always-a-space
    /// join is LEGACY DRIFT kept only because its bytes are pinned by the
    /// verification baseline; do not copy it. `composedLabel` below IS the
    /// canonical composition — use it rather than re-deriving one.
    var subjectName: String?
    var labelText: String
    /// Parallel to `ScoreGridLayout.columnGroups`.
    var groups: [RowGroupLayout]
    /// Whole-card total (the TOT column) — rendered by adapters that show one.
    var total: String

    /// The canonical web composition of the two label parts, for adapters that
    /// draw one string. Not encoded — it is derived, not layout state.
    var composedLabel: String {
        guard let subjectName else { return labelText }
        return labelText.isEmpty ? subjectName : "\(subjectName) \(labelText)"
    }

    private enum CodingKeys: String, CodingKey {
        case kind, emphasis, team, subjectName, labelText, groups, total
    }

    init(
        kind: String,
        emphasis: Bool,
        team: GridRowTeam?,
        subjectName: String?,
        labelText: String,
        groups: [RowGroupLayout],
        total: String
    ) {
        self.kind = kind
        self.emphasis = emphasis
        self.team = team
        self.subjectName = subjectName
        self.labelText = labelText
        self.groups = groups
        self.total = total
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(emphasis, forKey: .emphasis)
        try c.encodeExplicitNil(team, forKey: .team)
        try c.encodeExplicitNil(subjectName, forKey: .subjectName)
        try c.encode(labelText, forKey: .labelText)
        try c.encode(groups, forKey: .groups)
        try c.encode(total, forKey: .total)
    }
}

/// Resolved names per title group; the adapter escapes each name, joins the
/// names WITHIN a group with `nameJoiner`, and joins the groups with `joiner`.
/// Both separators are DATA so no adapter hardcodes a literal — `joiner` comes
/// from the contract (the format's own idiom, `" vs. "`), `nameJoiner` is this
/// fold's house separator for teammates.
struct TitleLayout: Codable, Sendable, Equatable {
    var groups: [[String]]
    var joiner: String
    var nameJoiner: String
}

struct CardTotalLayout: Codable, Sendable, Equatable {
    var label: String
    /// Already the display string (`—` for a missing total).
    var value: String
}

struct ScoreGridLayout: Codable, Sendable, Equatable {
    var componentId: String
    /// The card's subject balls, carried through UNRESOLVED (ids, not names) —
    /// names are already in `title`. An adapter needs the ids to ask
    /// `attachmentFor` where this card belongs on a Gamebook-style board.
    var subjectBallIds: [String]
    var title: TitleLayout
    var subtitleFacts: [String]
    /// `footnotes` and `caption` are carried in EVERY mode. Unlike
    /// `subtitleFacts` (whose product filtering is a layout rule, so it lives
    /// here), gating these two on verification mode is deliberately adapter-side
    /// page chrome: whether a board has room for a per-hole arithmetic block or
    /// a caption is a decision about the page, not about the card's layout.
    var footnotes: [String]
    var caption: String?
    var totals: [CardTotalLayout]
    var columnGroups: [ColumnGroupLayout]
    /// A TOT column is meaningful only when more than one group exists.
    var hasTotalColumn: Bool
    var rows: [GridRowLayout]

    private enum CodingKeys: String, CodingKey {
        case componentId, subjectBallIds, title, subtitleFacts, footnotes, caption, totals
        case columnGroups, hasTotalColumn, rows
    }

    init(
        componentId: String,
        subjectBallIds: [String],
        title: TitleLayout,
        subtitleFacts: [String],
        footnotes: [String],
        caption: String?,
        totals: [CardTotalLayout],
        columnGroups: [ColumnGroupLayout],
        hasTotalColumn: Bool,
        rows: [GridRowLayout]
    ) {
        self.componentId = componentId
        self.subjectBallIds = subjectBallIds
        self.title = title
        self.subtitleFacts = subtitleFacts
        self.footnotes = footnotes
        self.caption = caption
        self.totals = totals
        self.columnGroups = columnGroups
        self.hasTotalColumn = hasTotalColumn
        self.rows = rows
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(componentId, forKey: .componentId)
        try c.encode(subjectBallIds, forKey: .subjectBallIds)
        try c.encode(title, forKey: .title)
        try c.encode(subtitleFacts, forKey: .subtitleFacts)
        try c.encode(footnotes, forKey: .footnotes)
        try c.encodeExplicitNil(caption, forKey: .caption)
        try c.encode(totals, forKey: .totals)
        try c.encode(columnGroups, forKey: .columnGroups)
        try c.encode(hasTotalColumn, forKey: .hasTotalColumn)
        try c.encode(rows, forKey: .rows)
    }
}

enum PaceTone: String, Codable, Sendable, Equatable {
    case even, over, under
}

struct PaceLayout: Codable, Sendable, Equatable {
    var text: String
    var tone: PaceTone
}

struct RankedEntryLayout: Codable, Sendable, Equatable {
    var position: Int
    /// `position == 1` — the board's leader row.
    var lead: Bool
    var name: String
    var group: String?
    var total: String
    var holesPlayed: Int
    var pace: PaceLayout?

    private enum CodingKeys: String, CodingKey {
        case position, lead, name, group, total, holesPlayed, pace
    }

    init(
        position: Int,
        lead: Bool,
        name: String,
        group: String?,
        total: String,
        holesPlayed: Int,
        pace: PaceLayout?
    ) {
        self.position = position
        self.lead = lead
        self.name = name
        self.group = group
        self.total = total
        self.holesPlayed = holesPlayed
        self.pace = pace
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(position, forKey: .position)
        try c.encode(lead, forKey: .lead)
        try c.encode(name, forKey: .name)
        try c.encodeExplicitNil(group, forKey: .group)
        try c.encode(total, forKey: .total)
        try c.encode(holesPlayed, forKey: .holesPlayed)
        try c.encodeExplicitNil(pace, forKey: .pace)
    }
}

struct RankedLayout: Codable, Sendable, Equatable {
    let kind: String = "ranked"
    var metricLabel: String
    /// True when ANY entry has a pace — the whole board grows the column.
    var hasPace: Bool
    var entries: [RankedEntryLayout]

    private enum CodingKeys: String, CodingKey {
        case kind, metricLabel, hasPace, entries
    }

    init(metricLabel: String, hasPace: Bool, entries: [RankedEntryLayout]) {
        self.metricLabel = metricLabel
        self.hasPace = hasPace
        self.entries = entries
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.metricLabel = try c.decode(String.self, forKey: .metricLabel)
        self.hasPace = try c.decode(Bool.self, forKey: .hasPace)
        self.entries = try c.decode([RankedEntryLayout].self, forKey: .entries)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(metricLabel, forKey: .metricLabel)
        try c.encode(hasPace, forKey: .hasPace)
        try c.encode(entries, forKey: .entries)
    }
}

struct MatchPanelLayout: Codable, Sendable, Equatable {
    var sideAName: String
    var sideBName: String
    var leader: GridRowTeam?
    /// `AS` or `N UP`.
    var standing: String
    /// `Final` or `thru N`.
    var status: String

    private enum CodingKeys: String, CodingKey {
        case sideAName, sideBName, leader, standing, status
    }

    init(sideAName: String, sideBName: String, leader: GridRowTeam?, standing: String, status: String) {
        self.sideAName = sideAName
        self.sideBName = sideBName
        self.leader = leader
        self.standing = standing
        self.status = status
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(sideAName, forKey: .sideAName)
        try c.encode(sideBName, forKey: .sideBName)
        try c.encodeExplicitNil(leader, forKey: .leader)
        try c.encode(standing, forKey: .standing)
        try c.encode(status, forKey: .status)
    }
}

struct MatchSummaryLayout: Codable, Sendable, Equatable {
    let kind: String = "match_summary"
    var title: String
    var matches: [MatchPanelLayout]

    private enum CodingKeys: String, CodingKey {
        case kind, title, matches
    }

    init(title: String, matches: [MatchPanelLayout]) {
        self.title = title
        self.matches = matches
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        _ = try c.decode(String.self, forKey: .kind)
        self.title = try c.decode(String.self, forKey: .title)
        self.matches = try c.decode([MatchPanelLayout].self, forKey: .matches)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encode(title, forKey: .title)
        try c.encode(matches, forKey: .matches)
    }
}

/// TS `RankedLayout | MatchSummaryLayout` — a FLAT union discriminated by each
/// member's own `kind` field, not a Swift-shaped wrapper object. Encoding
/// delegates straight to the payload so the JSON is byte-identical to the TS
/// one, and decoding peeks at `kind` the way a TS consumer narrows the union.
enum LeaderboardSectionLayout: Codable, Sendable, Equatable {
    case ranked(RankedLayout)
    case matchSummary(MatchSummaryLayout)

    private enum CodingKeys: String, CodingKey {
        case kind
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        switch try c.decode(String.self, forKey: .kind) {
        case "ranked":
            self = .ranked(try RankedLayout(from: decoder))
        case "match_summary":
            self = .matchSummary(try MatchSummaryLayout(from: decoder))
        case let other:
            throw DecodingError.dataCorrupted(.init(
                codingPath: decoder.codingPath,
                debugDescription: "unknown leaderboard section kind: \(other)"))
        }
    }

    func encode(to encoder: any Encoder) throws {
        switch self {
        case .ranked(let section): try section.encode(to: encoder)
        case .matchSummary(let section): try section.encode(to: encoder)
        }
    }
}

// --- column grouping ---------------------------------------------------------

private struct ColumnGroupInternal {
    var label: String
    var holes: [HoleRef]
    /// Stable column identities in this group — drives cell filtering.
    var playHoleIds: Set<String>
}

/// Group scorecard columns by the round's frozen route sections: a column
/// belongs to the section whose `[fromCanonicalOrdinal, toCanonicalOrdinal]`
/// range contains its `canonicalOrdinal`. Columns are ordered by
/// `canonicalOrdinal`; a column inside no section is dropped, an empty section
/// renders no group. With no route sections at all, fall back to a single TOT
/// group over every column.
///
/// PORTING: both sorts carry an index tiebreak — JS `Array#sort` is stable,
/// Swift's is not, and equal ordinals must keep contract order.
private func groupColumns(
    _ holes: [HoleRef],
    _ routeSections: [RouteSectionRef]
) -> [ColumnGroupInternal] {
    let ordered = holes.enumerated()
        .sorted { a, b in
            a.element.canonicalOrdinal == b.element.canonicalOrdinal
                ? a.offset < b.offset
                : a.element.canonicalOrdinal < b.element.canonicalOrdinal
        }
        .map(\.element)

    if routeSections.isEmpty {
        return [ColumnGroupInternal(
            label: "TOT",
            holes: ordered,
            playHoleIds: Set(ordered.map(\.playHoleId))
        )]
    }

    let sections = routeSections.enumerated()
        .sorted { a, b in
            a.element.fromCanonicalOrdinal == b.element.fromCanonicalOrdinal
                ? a.offset < b.offset
                : a.element.fromCanonicalOrdinal < b.element.fromCanonicalOrdinal
        }
        .map(\.element)

    var groups: [ColumnGroupInternal] = []
    for section in sections {
        let members = ordered.filter {
            $0.canonicalOrdinal >= section.fromCanonicalOrdinal
                && $0.canonicalOrdinal <= section.toCanonicalOrdinal
        }
        if members.isEmpty { continue }
        groups.append(ColumnGroupInternal(
            label: section.label,
            holes: members,
            playHoleIds: Set(members.map(\.playHoleId))
        ))
    }
    return groups
}

/// A group's subtotal for one row, per the row's declared aggregate.
private func groupSubtotal(_ row: GridRow, _ playHoleIds: Set<String>) -> String {
    let cells = row.cells.filter { playHoleIds.contains($0.playHoleId) }
    switch row.aggregate {
    case .sum:
        let nums = cells.compactMap(\.value)
        return nums.isEmpty ? "—" : jsNumberString(nums.reduce(0, +))
    case .last:
        for cell in cells.reversed() {
            if let v = cell.value {
                return v == v.rounded() ? jsNumberString(v) : toFixed1(v)
            }
        }
        return "—"
    case .none:
        return "—"
    }
}

/// The whole-card total. A `sum` row adds every cell (including any outside the
/// groups); a `last` row carries the final group's running value forward.
private func totColumn(_ row: GridRow, _ groups: [ColumnGroupInternal]) -> String {
    switch row.aggregate {
    case .sum:
        let all = row.cells.compactMap(\.value)
        return all.isEmpty ? "—" : jsNumberString(all.reduce(0, +))
    case .last:
        guard let last = groups.last else { return "—" }
        return groupSubtotal(row, last.playHoleIds)
    case .none:
        return "—"
    }
}

private func decorate(_ cell: GridCell?) -> CellDecorationLayout {
    if let marker = cell?.marker {
        let tone: MarkerTone?
        switch marker.markerTone {
        case .success: tone = .success
        case .warning: tone = .warning
        case .danger: tone = .danger
        default: tone = nil
        }
        let rawLabel = marker.markerLabel
        return .marker(
            template: marker.template,
            tone: tone,
            // Empty label ⇒ no label at all: every adapter tests it for TRUTH,
            // so an empty string must not survive as a rendered attribute.
            label: (rawLabel?.isEmpty ?? true) ? nil : rawLabel,
            teamFill: cell?.team
        )
    }
    if let team = cell?.team { return .pill(team: team) }
    return .plain
}

/// Facts a live board hides: the slot index and the handicap arithmetic.
///
/// PORTING: the TS regexes `^HCP -?\d` / `^PH -?\d` are hand-matched here —
/// no Foundation, no regex engine, and the pattern is small enough to read.
/// (`HCP` is the user-facing spelling of the course handicap everywhere now;
/// the fact used to read `CH n` and the server emits `HCP n`. `PH` — the
/// playing handicap — was not renamed.)
private func productSubtitleFacts(_ facts: [String]) -> [String] {
    facts.filter { fact in
        if fact.hasPrefix("slot #") { return false }
        if isHandicapFact(fact, prefix: "HCP ") { return false }
        if isHandicapFact(fact, prefix: "PH ") { return false }
        return true
    }
}

/// `^<prefix>-?\d` — prefix, then an optional ASCII minus, then a digit.
private func isHandicapFact(_ fact: String, prefix: String) -> Bool {
    guard fact.hasPrefix(prefix) else { return false }
    var rest = fact.dropFirst(prefix.count)
    if rest.first == "-" { rest = rest.dropFirst() }
    guard let c = rest.first else { return false }
    return c.isASCII && c.isNumber
}

/// How two names read together INSIDE one title group / ranked entry (the
/// teammates of one ball). The contract's own `joiner` separates the groups.
/// Emitted as layout data rather than left to each adapter's literal.
let NAME_JOINER = " & "

/// Missing means `default-score-grid`.
func scoreGridComponentId(_ section: ScoreGridSection) -> String {
    section.componentId?.rawValue ?? "default-score-grid"
}

/// Fold one scorecard card into its layout tree.
func layoutScoreGrid(
    _ section: ScoreGridSection,
    _ routeSections: [RouteSectionRef],
    _ nameOf: NameOf,
    mode: ResultRenderMode = .product
) -> ScoreGridLayout {
    let groups = groupColumns(section.holes, routeSections)

    let rows = section.rows.map { row -> GridRowLayout in
        // JS `new Map(pairs)` keeps the LAST duplicate; so does this.
        let byPlayHole = Dictionary(
            row.cells.map { ($0.playHoleId, $0) },
            uniquingKeysWith: { _, last in last }
        )
        return GridRowLayout(
            kind: row.kind.rawValue,
            emphasis: row.emphasis == true,
            team: row.team,
            subjectName: row.subjectBallId.map { nameOf($0) },
            labelText: row.label,
            groups: groups.map { g in
                RowGroupLayout(
                    cells: g.holes.map { h in
                        let cell = byPlayHole[h.playHoleId]
                        return CellLayout(
                            text: cell?.display ?? "",
                            // Empty title ⇒ no tooltip (adapters test for truth).
                            title: (cell?.title?.isEmpty ?? true) ? nil : cell?.title,
                            decoration: decorate(cell)
                        )
                    },
                    subtotal: groupSubtotal(row, g.playHoleIds)
                )
            },
            total: totColumn(row, groups)
        )
    }

    return ScoreGridLayout(
        componentId: scoreGridComponentId(section),
        subjectBallIds: section.subjectBallIds,
        title: TitleLayout(
            groups: section.title.groups.map { $0.map { id in nameOf(id) } },
            joiner: section.title.joiner,
            nameJoiner: NAME_JOINER
        ),
        subtitleFacts: mode == .verification
            ? section.subtitleFacts
            : productSubtitleFacts(section.subtitleFacts),
        footnotes: section.footnotes,
        caption: section.caption,
        totals: section.totals.map {
            CardTotalLayout(label: $0.label, value: $0.value.map(jsNumberString) ?? "—")
        },
        columnGroups: groups.map { g in
            ColumnGroupLayout(
                label: g.label,
                columns: g.holes.map { ColumnLayout(label: $0.occurrenceLabel) }
            )
        },
        hasTotalColumn: groups.count > 1,
        rows: rows
    )
}

// --- card attachment (Gamebook boards) ---------------------------------------

/// Where a scorecard card belongs on a Gamebook-style leaderboard: folded into
/// a ranked row (`attached`, with that row's index in `entries`) or shown on its
/// own (`standalone`).
///
/// PORTING: TS's `{ kind: 'attached'; entryIndex } | { kind: 'standalone' }`
/// union, in the same flat-`kind` JSON shape as the other unions here.
enum CardAttachment: Codable, Sendable, Equatable {
    case attached(entryIndex: Int)
    case standalone

    private enum CodingKeys: String, CodingKey {
        case kind, entryIndex
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        switch try c.decode(String.self, forKey: .kind) {
        case "attached":
            self = .attached(entryIndex: try c.decode(Int.self, forKey: .entryIndex))
        case "standalone":
            self = .standalone
        case let other:
            throw DecodingError.dataCorrupted(.init(
                codingPath: decoder.codingPath,
                debugDescription: "unknown attachment kind: \(other)"))
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .attached(let entryIndex):
            try c.encode("attached", forKey: .kind)
            try c.encode(entryIndex, forKey: .entryIndex)
        case .standalone:
            try c.encode("standalone", forKey: .kind)
        }
    }
}

/// Anything that carries a card's subject balls — the contract section or the
/// folded layout.
///
/// PORTING: TS takes a structural `{ subjectBallIds }`; Swift has no structural
/// typing, so the same "widest shape that carries an identity" is spelled as a
/// protocol with two conformances and a generic parameter.
protocol CardSubjectCarrier {
    var subjectBallIds: [String] { get }
}

/// Anything that carries a ranked entry's balls.
protocol RankedSubjectCarrier {
    var ballIds: [String] { get }
}

extension ScoreGridSection: CardSubjectCarrier {}
extension ScoreGridLayout: CardSubjectCarrier {}
extension RankedEntry: RankedSubjectCarrier {}

/// Order-insensitive set key for a subject / entry's ball ids.
private func subjectKey(_ ballIds: [String]) -> String {
    Set(ballIds).sorted().joined(separator: " ")
}

/// Classify each card against a ranked section's entries — the STRUCTURAL rule,
/// and the only rule:
///
///     a card that maps 1:1 to a ranked entry attaches to that row;
///     ANYTHING else stays standalone.
///
/// "1:1" means the card's subject ball ids are exactly the entry's `ballIds` as
/// a SET (order and repetition are not identity), AND that pairing is
/// unambiguous in both directions: exactly one entry carries that subject and
/// exactly one card claims it. A subjectless card, a card no entry matches, two
/// cards over the same subject, two entries over the same subject — all
/// standalone. Ambiguity is NEVER guessed: showing a card on its own is always
/// correct, attaching it to the wrong row is not.
///
/// Pure and total: the returned array is parallel to `cards`, one verdict each.
///
/// FUTURE SEAM (not built): when a format plugin declares an explicit
/// `presentation: "attached" | "standalone"` on a card (absent = this structural
/// rule), that declaration is honoured HERE, before the structural match runs —
/// one branch at the top of the loop, no format ids anywhere.
func attachmentFor<Card: CardSubjectCarrier, Entry: RankedSubjectCarrier>(
    _ cards: [Card],
    _ entries: [Entry]
) -> [CardAttachment] {
    // `Int?` value: `nil` marks a key claimed by more than one entry — the
    // dictionary's own "absent" is a different verdict, so the double optional
    // is deliberate (TS stores `number | null` in the same map).
    var entryIndexByKey: [String: Int?] = [:]
    for (index, entry) in entries.enumerated() {
        if entry.ballIds.isEmpty { continue }
        let key = subjectKey(entry.ballIds)
        // Second entry over the same subject ⇒ the key is ambiguous forever.
        entryIndexByKey[key] = entryIndexByKey.keys.contains(key) ? Int?.none : index
    }

    var cardCountByKey: [String: Int] = [:]
    for card in cards where !card.subjectBallIds.isEmpty {
        cardCountByKey[subjectKey(card.subjectBallIds), default: 0] += 1
    }

    return cards.map { card in
        if card.subjectBallIds.isEmpty { return .standalone }
        let key = subjectKey(card.subjectBallIds)
        if (cardCountByKey[key] ?? 0) != 1 { return .standalone }
        guard let claimed = entryIndexByKey[key], let entryIndex = claimed else { return .standalone }
        return .attached(entryIndex: entryIndex)
    }
}

// --- ranked ------------------------------------------------------------------

/// The entry's group label, when every ball in it (own-ball or team) shares ONE
/// group — mixed-group teams shouldn't happen (the compiler rejects cross-group
/// team balls per §3), but a defensive mismatch omits the label rather than
/// guessing.
///
/// PORTING: TS builds a `Set` over `string | null`; Swift's `Set<String?>` is
/// the same thing (`nil` is one member), so the `size !== 1` test carries over
/// unchanged.
private func entryGroupLabel(_ ballIds: [String], _ groupOf: GroupOf) -> String? {
    let labels = Set(ballIds.map { groupOf($0) })
    if labels.count != 1 { return nil }
    return labels.first ?? nil
}

/// ONE sign convention, golf's: `+N` always means N WORSE than playing to
/// expectation, `−N` better. The raw `paceDelta` is `total − target`, so a
/// `high` metric (stableford points: more is better) is negated for display —
/// 33 points off a 36 pace shows `+3`. `low` metrics (gross strokes) already run
/// that way and display raw. `E` when even (a real minus sign, U+2212,
/// otherwise).
private func paceLayout(
    _ paceDelta: Double?,
    _ direction: ResultViewDirection?
) -> PaceLayout? {
    guard let paceDelta else { return nil }
    let shown = direction == .high ? -paceDelta : paceDelta
    if shown == 0 { return PaceLayout(text: "E", tone: .even) }
    if shown > 0 { return PaceLayout(text: "+\(jsNumberString(shown))", tone: .over) }
    return PaceLayout(text: "−\(jsNumberString(shown.magnitude))", tone: .under)
}

/// Fold one ranked metric board into its layout tree.
func layoutRanked(
    _ section: RankedSection,
    _ nameOf: NameOf,
    _ groupOf: GroupOf = { _ in nil }
) -> RankedLayout {
    RankedLayout(
        metricLabel: section.metricLabel,
        // The pace column exists only for metrics whose descriptor declares a
        // pace baseline — a non-pace board keeps its plain columns.
        hasPace: section.entries.contains { $0.paceDelta != nil },
        entries: section.entries.map { e in
            RankedEntryLayout(
                position: countInt(e.position),
                lead: e.position == 1,
                name: e.ballIds.map { nameOf($0) }.joined(separator: NAME_JOINER),
                group: entryGroupLabel(e.ballIds, groupOf),
                total: e.total.map(jsNumberString) ?? "—",
                holesPlayed: countInt(e.holesPlayed),
                pace: paceLayout(e.paceDelta, section.direction)
            )
        }
    )
}

// --- match summary -----------------------------------------------------------

/// Fold one match-summary section into its layout tree.
func layoutMatchSummary(_ section: MatchSummarySection, _ nameOf: NameOf) -> MatchSummaryLayout {
    MatchSummaryLayout(
        title: section.title,
        matches: section.matches.map { m in
            MatchPanelLayout(
                sideAName: m.sideA.ballIds.map { nameOf($0) }.joined(separator: NAME_JOINER),
                sideBName: m.sideB.ballIds.map { nameOf($0) }.joined(separator: NAME_JOINER),
                leader: m.leader,
                standing: m.magnitude == 0 ? "AS" : "\(jsNumberString(m.magnitude)) UP",
                status: m.finished ? "Final" : "thru \(jsNumberString(m.thru))"
            )
        }
    )
}
