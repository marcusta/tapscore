import Foundation

/// One module row in the profile's Statistics section.
///
/// The order of the cases IS the order of the rows, and it is the capture
/// order of `StatVocabulary.order` with `approach` lifted next to `tee` — the
/// list reads shot by shot (tee → green → putts → the two conditional ones),
/// which is how a player thinks about what they want to track.
enum StatsModule: String, CaseIterable, Sendable {
    case tee
    case approach
    case putting
    case shortGame
    case penalties
    case recovery

    /// The row label. Plain golf words, no wire spelling — `approach` is the
    /// column name, "Greens in regulation" is the thing being counted.
    var title: String {
        switch self {
        case .tee: return "Tee shots"
        case .approach: return "Greens in regulation"
        case .putting: return "Putting"
        case .shortGame: return "Short game"
        case .penalties: return "Penalties"
        case .recovery: return "Recovery"
        }
    }

    /// One clause about what the module asks for, in the tone of the profile's
    /// other hints: what it costs you on the hole, not what it derives later.
    var hint: String {
        switch self {
        case .tee: return "Fairway, in play or trouble — asked on par 4s and 5s."
        case .approach: return "Did the ball hit the green in regulation."
        case .putting: return "How long the first putt was, and how many you took."
        case .shortGame: return "Standard or hard, asked only when you missed the green."
        case .penalties: return "How many penalty strokes the hole cost you."
        case .recovery: return "Whether the recovery shot got you back in play."
        }
    }

    /// The module this one cannot be read without — spec §1.3 and §1.5, the
    /// same two rules `PlayerStatsService.putConfig` refuses on.
    ///
    /// Short game needs putting because the short-game OUTCOME is the following
    /// first-putt bucket; recovery needs tee because its trigger is a trouble
    /// tee shot. Neither is a UI preference: a PUT that violates one is a 409.
    var requires: StatsModule? {
        switch self {
        case .shortGame: return .putting
        case .recovery: return .tee
        default: return nil
        }
    }

    /// The muted word annotation on a row whose prerequisite is off — "Needs
    /// Putting", "Needs Tee shots". Words, never an emoji (`ios/AGENTS.md`,
    /// "Chips vs dropdowns"): the annotation has to say WHICH module is
    /// missing, and a warning triangle cannot.
    var unmetRequirement: String? {
        requires.map { "Needs \($0.title)" }
    }
}

/// The Statistics section's pure decisions: which rows are legal, what a tap
/// means, and what goes on the wire.
///
/// Everything the section does that could be wrong is in here rather than in
/// the view, because the two rules worth testing — the dependency cascade and
/// "master off preserves modules" — are decisions about a value, not about
/// pixels.
///
/// The invariant this type exists to hold: **it never builds a combination the
/// server refuses.** `putConfig` 409s on `shortGame && !putting` and on
/// `recovery && !tee`, so turning a prerequisite OFF turns its dependent off in
/// the SAME snapshot. The alternative — send it and let the 409 revert the
/// toggle — would make a legal tap look like a failure.
struct StatsConfigForm: Equatable, Sendable {
    /// The master switch. `false` is a real, stored state: the server keeps
    /// every module boolean, so turning stats back on restores the selection
    /// rather than starting from nothing.
    var enabled: Bool
    var tee: Bool
    var approach: Bool
    var putting: Bool
    var shortGame: Bool
    var penalties: Bool
    var recovery: Bool

    /// A player who has never configured anything. The server answers the same
    /// shape for an absent row (`absentConfig`), so this is what the section
    /// draws before the first PUT and after a wholesale clear.
    static let allOff = StatsConfigForm(
        enabled: false,
        tee: false,
        approach: false,
        putting: false,
        shortGame: false,
        penalties: false,
        recovery: false)

    init(
        enabled: Bool,
        tee: Bool,
        approach: Bool,
        putting: Bool,
        shortGame: Bool,
        penalties: Bool,
        recovery: Bool
    ) {
        self.enabled = enabled
        self.tee = tee
        self.approach = approach
        self.putting = putting
        self.shortGame = shortGame
        self.penalties = penalties
        self.recovery = recovery
    }

    init(_ config: PlayerStatsConfig) {
        self.init(
            enabled: config.enabled,
            tee: config.tee,
            approach: config.approach,
            putting: config.putting,
            shortGame: config.shortGame,
            penalties: config.penalties,
            recovery: config.recovery)
    }

    // MARK: - Reading

    func isOn(_ module: StatsModule) -> Bool {
        switch module {
        case .tee: return tee
        case .approach: return approach
        case .putting: return putting
        case .shortGame: return shortGame
        case .penalties: return penalties
        case .recovery: return recovery
        }
    }

    /// A row the player cannot act on: either the master switch is off, or the
    /// module's prerequisite is.
    ///
    /// Note what this does NOT do: it never reads `false` for a locked module.
    /// A locked row keeps showing its stored value, because the value is still
    /// what the server holds — only the tap is unavailable.
    func isLocked(_ module: StatsModule) -> Bool {
        guard enabled else { return true }
        guard let required = module.requires else { return false }
        return !isOn(required)
    }

    /// The annotation the row shows, or `nil` when the row is actionable. Only
    /// an unmet dependency is worth wording — "the master switch is off" is
    /// already said by the master switch.
    func annotation(_ module: StatsModule) -> String? {
        guard enabled, let required = module.requires, !isOn(required) else { return nil }
        return module.unmetRequirement
    }

    // MARK: - Writing

    /// The result of one toggle tap, dependencies repaired.
    ///
    /// Repaired in ONE direction only: turning a prerequisite off drags its
    /// dependent down with it (the server would refuse the pair), but turning a
    /// prerequisite ON never turns a dependent on — nobody asked for that
    /// module, and silently enabling prompts is exactly what the server's
    /// "refuse, never repair" rule is protecting against.
    func setting(_ module: StatsModule, to on: Bool) -> StatsConfigForm {
        var next = self
        switch module {
        case .tee: next.tee = on
        case .approach: next.approach = on
        case .putting: next.putting = on
        case .shortGame: next.shortGame = on
        case .penalties: next.penalties = on
        case .recovery: next.recovery = on
        }
        return next.repairingDependencies()
    }

    /// The master switch. Module booleans are untouched on purpose — that is
    /// the whole reason the master exists (spec §3: "Master toggle satisfies
    /// 'completely turn off' without losing the module selection").
    func settingEnabled(_ on: Bool) -> StatsConfigForm {
        var next = self
        next.enabled = on
        return next
    }

    private func repairingDependencies() -> StatsConfigForm {
        var next = self
        if !next.putting { next.shortGame = false }
        if !next.tee { next.recovery = false }
        return next
    }

    /// What goes on the wire. The endpoint is whole-config — there is no
    /// per-module PATCH — so every tap sends the complete snapshot.
    var input: PlayerStatsPutMyConfigInput {
        PlayerStatsPutMyConfigInput(
            enabled: enabled,
            tee: tee,
            approach: approach,
            putting: putting,
            shortGame: shortGame,
            penalties: penalties,
            recovery: recovery)
    }
}
