import Foundation

/// The curated game cards and everything derived from a format descriptor —
/// the Swift image of `src/create/format-catalog.service.ts`.
///
/// It is a **value type over the server's descriptors**, not a registry: the
/// list of games, their names, their taglines and the shape each is contested
/// between all come from `GET /setup/formats`. There is no per-format table
/// here, exactly as on the web: a correctly-declared new format gets a working
/// card on both clients for free.
///
/// Everything below is pure, so `CreateDraftBuilder` and the tests can hold one
/// without a network or a store.
struct FormatCatalog: Sendable, Equatable {
    /// The largest team the setup UI will build (web: `MAX_TEAM_SIZE`).
    static let maxTeamSize = 10

    var descriptors: [FormatDescriptor] = []

    init(descriptors: [FormatDescriptor] = []) {
        self.descriptors = descriptors
    }

    // MARK: - Locale

    /// Which label set a descriptor is read in. The web reads
    /// `navigator.language`; the native equivalent is the preferred language.
    enum Locale: String, Sendable, Equatable {
        case en
        case sv

        static var current: Locale {
            Foundation.Locale.current.language.languageCode?.identifier == "sv" ? .sv : .en
        }
    }

    // MARK: - Lookup

    func byId(_ id: String) -> FormatDescriptor? {
        descriptors.first { $0.id == id }
    }

    /// `labels[locale] ?? labels.en ?? label` — the web's `labelOf`, including
    /// its "never throw on an unknown id" contract (nil, so the caller keeps
    /// its own fallback).
    func label(_ id: String, locale: Locale = .current) -> String? {
        byId(id).map { label($0, locale: locale) }
    }

    func label(_ descriptor: FormatDescriptor, locale: Locale = .current) -> String {
        localized(descriptor.labels, locale: locale) ?? descriptor.label
    }

    /// The card's "what is this game" line — the descriptor's own
    /// `preset.tagline`. Empty for a descriptor that declares no preset, so a
    /// caller never has to null-check for display.
    func tagline(_ descriptor: FormatDescriptor, locale: Locale = .current) -> String {
        guard let tagline = descriptor.preset?.tagline else { return "" }
        return localized(tagline, locale: locale) ?? ""
    }

    /// The curated game cards: every descriptor declaring a `preset`, ordered
    /// by `rank` (absent rank sorts last, then by label so the order is stable).
    func presets(locale: Locale = .current) -> [FormatDescriptor] {
        descriptors
            .filter { $0.preset != nil }
            .sorted { lhs, rhs in
                let lr = lhs.preset?.rank ?? .greatestFiniteMagnitude
                let rr = rhs.preset?.rank ?? .greatestFiniteMagnitude
                if lr != rr { return lr < rr }
                return label(lhs, locale: locale) < label(rhs, locale: locale)
            }
    }

    private func localized(_ labels: FormatLabels, locale: Locale) -> String? {
        switch locale {
        case .sv:
            if let sv = labels.sv, !sv.isEmpty { return sv }
            return labels.en
        case .en:
            return labels.en
        }
    }

    /// A config field's (or option's) label — `labels[locale] ?? labels.en`.
    /// These carry `labels` only, so there is no bare-label fallback.
    func configLabel(_ labels: FormatLabels, locale: Locale = .current) -> String {
        localized(labels, locale: locale) ?? ""
    }

    // MARK: - Classification

    enum Kind: Sendable, Equatable {
        /// Producers are the players; no composition decision at all.
        case individual
        /// Own-ball formats that group players into sides at the slot.
        case teamGrouping
        /// Formats whose ball IS the team.
        case teamBall
    }

    func classify(_ d: FormatDescriptor) -> Kind {
        let balls = d.requirements.balls
        if balls.ballMode == .team { return .teamBall }
        if balls.requiresSlotTeamGrouping == true { return .teamGrouping }
        return .individual
    }

    /// A side format (better-ball / taliban / umbrella-4ball) aggregates within
    /// each side and compares sides — its subjects are sides, never players.
    func isSideFormat(_ id: String) -> Bool {
        guard let d = byId(id) else { return false }
        return classify(d) == .teamGrouping
    }

    /// ADR-0004 — a BALL format may additionally score a multi-ball (side)
    /// team. Two descriptor-driven exclusions: side formats (they consume sides
    /// directly) and formats taking per-ball metadata (umbrella's GIR).
    func acceptsSideSubjects(_ d: FormatDescriptor) -> Bool {
        if classify(d) == .teamGrouping { return false }
        return (d.requirements.scoreEntry?.metadata?.count ?? 0) == 0
    }

    func acceptsSideSubjects(_ id: String) -> Bool {
        guard let d = byId(id) else { return false }
        return acceptsSideSubjects(d)
    }

    /// Can a team of `kind` be a subject of `formatId`? Side formats take
    /// multi-ball teams only; ball formats take single-ball teams always, and
    /// sides too when the format supports side aggregation.
    func teamKindFits(
        _ formatId: String,
        kind: CompetitionsCreateRoundOutputOkDraftTeamsItemKind
    ) -> Bool {
        if isSideFormat(formatId) { return kind == .multiBall }
        return kind == .singleBall || acceptsSideSubjects(formatId)
    }

    // MARK: - Playable shape

    /// How many balls a game is contested between, and how many players may
    /// share one. `countMax == nil` ⇒ unbounded.
    struct PlayableShape: Sendable, Equatable {
        var countMin: Int
        var countMax: Int?
        var sizeMin: Int
        var sizeMax: Int
    }

    /// DERIVED from the descriptor's declared ball requirement — never from a
    /// per-format client table. See the web's `playableShape` for the full
    /// reasoning; the branch order (team ball → grouping → slot ball count →
    /// individual) is load-bearing, because a grouping format also declares a
    /// `slotBallCount` that is NOT the number of contesting balls.
    func playableShape(_ d: FormatDescriptor) -> PlayableShape {
        let balls = d.requirements.balls
        if balls.ballMode == .team {
            let count = ballCount(balls.slotBallCount)
            return PlayableShape(
                countMin: count.min,
                countMax: count.max,
                sizeMin: Int(balls.producerCount.min),
                sizeMax: Int(balls.producerCount.max))
        }
        if balls.requiresSlotTeamGrouping == true {
            let grouping = balls.slotTeamGrouping
            let teamCount = grouping?.teamCount
            return PlayableShape(
                countMin: teamCount?.min.map(Int.init) ?? 2,
                countMax: teamCount?.max.map(Int.init),
                sizeMin: grouping?.teamSize?.min.map(Int.init) ?? 2,
                sizeMax: grouping?.teamSize?.max.map(Int.init) ?? 2)
        }
        if let declared = balls.slotBallCount {
            let count = ballCount(declared)
            let multi = acceptsSideSubjects(d)
            return PlayableShape(
                countMin: count.min,
                countMax: count.max,
                sizeMin: 1,
                sizeMax: multi ? Self.maxTeamSize : 1)
        }
        return PlayableShape(countMin: 1, countMax: nil, sizeMin: 1, sizeMax: 1)
    }

    func playableShape(id: String) -> PlayableShape? {
        byId(id).map { playableShape($0) }
    }

    /// A declared `slotBallCount` as playable bounds: two balls minimum (one
    /// ball is not a contest) and an absent max stays unbounded.
    private func ballCount(_ declared: FormatBallRequirementSlotBallCount?) -> (min: Int, max: Int?) {
        (min: declared?.min.map(Int.init) ?? 2, max: declared?.max.map(Int.init))
    }

    /// An INDIVIDUAL game — every player is their own ball and there are as
    /// many balls as players. It leaves no residual decision, so its card
    /// renders no ball picker.
    func isIndividualShape(_ shape: PlayableShape) -> Bool {
        shape.sizeMax == 1 && shape.countMax == nil
    }

    func isIndividualGame(_ id: String) -> Bool {
        playableShape(id: id).map(isIndividualShape) ?? false
    }

    /// The smallest roster that can play this game at all: `countMin × sizeMin`.
    /// An individual game has no minimum of its own.
    func minPlayers(for id: String) -> Int {
        guard let shape = playableShape(id: id), !isIndividualShape(shape) else { return 0 }
        return shape.countMin * shape.sizeMin
    }

    /// The largest roster a game can seat, when it is bounded at all
    /// (`countMax × sizeMax`). Nil ⇒ unbounded — add as many players as you
    /// like. Native-only: the web lets extra players sit a game out, and this
    /// client's one-game-per-round v1 has no other game for them to play, so
    /// the roster itself carries the bound.
    func maxPlayers(for id: String) -> Int? {
        guard let shape = playableShape(id: id), let countMax = shape.countMax else { return nil }
        return countMax * shape.sizeMax
    }

    /// One line saying what the game is contested between, derived from the
    /// descriptor (web: `gameShapeText`).
    func shapeText(_ id: String) -> String {
        guard let shape = playableShape(id: id) else { return "" }
        if isIndividualShape(shape) { return "Everyone plays their own ball" }
        let balls = shape.countMax == shape.countMin
            ? "\(shape.countMin) balls"
            : "\(shape.countMin)+ balls"
        let size: String
        if shape.sizeMax == 1 {
            size = "one player each"
        } else if shape.sizeMin == shape.sizeMax {
            size = "\(shape.sizeMin) players each"
        } else if shape.sizeMin == 1 {
            size = "each a player or a team"
        } else {
            size = "\(shape.sizeMin)–\(shape.sizeMax) players each"
        }
        return "\(balls) · \(size)"
    }

    /// What is missing, phrased as what to DO about it (web: `gameNeedsText`).
    func needsText(_ id: String, rosterCount: Int) -> String {
        let min = minPlayers(for: id)
        let missing = Swift.max(0, min - rosterCount)
        return "Needs \(min) players — add \(missing) more."
    }
}
