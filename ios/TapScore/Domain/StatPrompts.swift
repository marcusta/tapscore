import Foundation

/// Player-stats capture, as pure value types (proposal `docs/proposals/player-stats.md` §1–2).
///
/// The rules live here so they can be tested without a store, a network, or a
/// view: which prompts a hole asks, how an answer changes that set, and what
/// leaves the device when the step closes. `StatsView` renders `prompts` and
/// forwards taps; it decides nothing.

// MARK: - Vocabulary

/// One choice on a segmented row. `value` is the wire value the server's closed
/// vocabulary accepts; `label` is what the golfer reads.
struct StatOption: Equatable, Sendable, Identifiable {
    var value: String
    var label: String
    var id: String { value }

    init(_ value: String, _ label: String) {
        self.value = value
        self.label = label
    }
}

/// How a prompt is answered. Deliberately tiny — three shapes cover every key.
enum StatControl: Equatable, Sendable {
    /// Mutually exclusive options. Tapping the selected one deselects it.
    case segments([StatOption])
    /// A counter. `max == nil` means unbounded upward; the top value renders
    /// as "n+" so `putts` can mean "3 or more".
    case stepper(min: Int, max: Int?)
    /// A refinement of another key's answer: the option set depends on the
    /// PARENT key's current value. This shape lives only in the catalogue —
    /// `StatStep.prompts` resolves it to plain `segments` with the options the
    /// parent's answer selects, so views still render a chip row and decide
    /// nothing. A parent value with no entry means the refinement is unaskable
    /// (and `visibility` reads it `contradicted`).
    case refine(parent: StatEventKey, optionsByParent: [String: [StatOption]])
}

/// One row of the capture card.
///
/// An EMPTY `label` is part of the contract, not a missing string: it marks a
/// prompt that refines the row above it rather than asking its own question, so
/// a renderer draws no heading and places the row tight under its parent. A
/// non-visual surface (VoiceOver, the explainer sheet) must supply a name of its
/// own — see `StatCaptureCopy.name`.
struct StatPrompt: Equatable, Sendable, Identifiable {
    var key: StatEventKey
    var label: String
    var control: StatControl
    var id: String { key.rawValue }
}

/// What the open step did to a key. Absent from the draft = untouched, which is
/// NOT the same as answered-false: an untouched key emits no event at all.
enum StatAnswer: Equatable, Sendable {
    case set(String)
    /// The golfer removed an answer that the server already holds. Emits
    /// `value: null`, which the server reads as "clear this key".
    case cleared
}

/// One item of the batch that leaves the device when the step closes.
struct StatBatchItem: Equatable, Sendable {
    var key: StatEventKey
    /// `nil` is an explicit clear, not an omission.
    var value: String?
}

// MARK: - The prompt catalogue

/// The static half of the prompt set: which module owns a key, what it looks
/// like, and any hole predicate it carries. Everything answer-dependent lives
/// in `StatStep`.
enum StatVocabulary {
    /// Shot order, so the step reads the way the hole was played.
    ///
    /// A direction prompt sits IMMEDIATELY after its parent. Note that
    /// `teeMissDir` comes before `recoveryOk`: side is a property of the tee
    /// shot, the recovery is the next shot.
    static let order: [StatEventKey] = [
        .teeResult, .teeMissDir, .recoveryOk, .gir, .greenMissDir, .shortGameDifficulty,
        .shortGameStrokes, .firstPutt, .firstPuttM, .putts, .penalties, .penaltySource,
    ]

    /// Par 3 has no tee shot worth grading — the same shape the format layer
    /// uses for its own inputs, evaluated by the same rule.
    static let teeApplies = MetadataApplies(minPar: 4)

    static func label(for key: StatEventKey) -> String {
        switch key {
        case .teeResult: return "Tee shot"
        case .teeMissDir: return "Which side"
        case .recoveryOk: return "Recovery"
        case .gir: return "Green in regulation"
        case .greenMissDir: return "Approach"
        case .shortGameDifficulty: return "Short game"
        case .shortGameStrokes: return "Shots to the green"
        case .firstPutt: return "First putt"
        // The refinement row renders directly under the selected bucket; a
        // leading label would just repeat "First putt".
        case .firstPuttM: return ""
        case .putts: return "Putts"
        case .penalties: return "Penalties"
        case .penaltySource: return "Penalty on"
        }
    }

    static func control(for key: StatEventKey) -> StatControl {
        switch key {
        case .teeResult:
            return .segments([
                StatOption("fairway", "Fairway"),
                StatOption("in_play", "In play"),
                StatOption("trouble", "Trouble"),
            ])
        case .teeMissDir:
            return .segments([StatOption("left", "Left"), StatOption("right", "Right")])
        case .gir:
            return .segments([StatOption("0", "Miss"), StatOption("1", "Hit")])
        // `hit_late` is the fifth answer: the first green attempt DID hit the
        // green, just after regulation — so there was no chip, and the
        // short-game prompts are contradicted by it.
        case .greenMissDir:
            return .segments([
                StatOption("long", "Long"),
                StatOption("short", "Short"),
                StatOption("left", "Left"),
                StatOption("right", "Right"),
                StatOption("hit_late", "On green"),
            ])
        case .firstPutt:
            return .segments([
                StatOption("inside_1m", "< 1m"),
                StatOption("1_to_2m", "1–2m"),
                StatOption("2_to_4m", "2–4m"),
                StatOption("4_to_8m", "4–8m"),
                StatOption("over_8m", "> 8m"),
            ])
        // Exact metres, an optional refinement of the bucket. Closed
        // vocabulary, one option set per FINE bucket — the legacy coarse
        // values have no entry, so a legacy prefill reads `contradicted` and
        // never shows the row. Values are the exact TEXT the server stores
        // ('0.3' … '20'); '20' renders "20+".
        case .firstPuttM:
            return .refine(parent: .firstPutt, optionsByParent: [
                "inside_1m": [
                    StatOption("0.3", "0.3m"),
                    StatOption("0.5", "0.5m"),
                    StatOption("0.8", "0.8m"),
                ],
                "1_to_2m": [
                    StatOption("1", "1m"),
                    StatOption("1.5", "1.5m"),
                    StatOption("2", "2m"),
                ],
                "2_to_4m": [
                    StatOption("2.5", "2.5m"),
                    StatOption("3", "3m"),
                    StatOption("3.5", "3.5m"),
                    StatOption("4", "4m"),
                ],
                "4_to_8m": [
                    StatOption("5", "5m"),
                    StatOption("6", "6m"),
                    StatOption("7", "7m"),
                    StatOption("8", "8m"),
                ],
                "over_8m": [
                    StatOption("10", "10m"),
                    StatOption("12", "12m"),
                    StatOption("14", "14m"),
                    StatOption("16", "16m"),
                    StatOption("20", "20+"),
                ],
            ])
        case .shortGameDifficulty:
            return .segments([
                StatOption("standard", "Standard"),
                StatOption("hard", "Hard"),
                StatOption("bunker", "Bunker"),
            ])
        case .shortGameStrokes:
            return .stepper(min: 1, max: 5)
        case .recoveryOk:
            return .segments([StatOption("0", "No"), StatOption("1", "Yes")])
        case .putts:
            return .stepper(min: 0, max: 3)
        case .penalties:
            return .stepper(min: 0, max: nil)
        case .penaltySource:
            return .segments([
                StatOption("tee", "Tee shot"),
                StatOption("approach", "Approach"),
                // "Greenside", not "Around the green" — the long form overflowed the
                // three-chip row on the web plate; both clients say the same word.
                StatOption("short_or_green", "Greenside"),
            ])
        }
    }

    /// Display text for a stepper value: the top of a bounded range is open-ended.
    static func stepperText(_ value: Int, max: Int?) -> String {
        if let max, value >= max { return "\(value)+" }
        return "\(value)"
    }

    /// The option set a `refine` control offers for one parent value, or `nil`
    /// when that parent value has no refinement (unanswered, or a legacy
    /// value). Exposed for `StatStep` and the tests; views never call it — they
    /// get the resolved `segments` control from `prompts`.
    static func refineOptions(for key: StatEventKey, parentValue: String?) -> [StatOption]? {
        guard case .refine(_, let optionsByParent) = control(for: key), let parentValue else {
            return nil
        }
        return optionsByParent[parentValue]
    }
}

/// The `appliesWhen` predicate, evaluated. Extracted from `RoundStore` so the
/// pure model and the store share ONE reading of the shape: every present field
/// must hold (AND), and an absent predicate always applies.
enum MetadataAppliesRule {
    static func evaluate(_ applies: MetadataApplies?, par: Double, hole: Double) -> Bool {
        guard let applies else { return true }
        if let minPar = applies.minPar, par < minPar { return false }
        if let maxPar = applies.maxPar, par > maxPar { return false }
        if let pars = applies.pars, !pars.contains(par) { return false }
        if let holes = applies.holes, !holes.contains(hole) { return false }
        return true
    }
}

// MARK: - The step

/// One (player, hole) capture step: the modules that player tracks, what the
/// server already holds, and what this visit has touched.
struct StatStep: Equatable, Sendable {
    private(set) var modules: StatModules
    private(set) var par: Double
    private(set) var holeNumber: Double
    /// Server rows plus this device's unsynced writes — the values the step
    /// opens with. A key mapped here is "already answered". `private(set)` so
    /// every write runs `prune()`: changing the durable half can hide a prompt,
    /// and a hidden prompt must not keep an answer.
    private(set) var persisted: [StatEventKey: String]
    /// This visit's changes. Empty means the step has nothing to send.
    private(set) var draft: [StatEventKey: StatAnswer] = [:]
    /// The score this hole was entered with, supplied by the host — `StatStep`
    /// has no access to the scorecard. `nil` = not known yet, which is a state
    /// the derivation refuses to guess from.
    private(set) var strokes: Int?
    /// Set the moment the golfer touches `gir` in this visit. Never cleared by
    /// `refresh()` or `prune()`; cleared only by constructing a new step, which
    /// is a new (player, hole) visit.
    private(set) var girLocked = false

    init(
        modules: StatModules,
        par: Double,
        holeNumber: Double,
        persisted: [StatEventKey: String] = [:],
        draft: [StatEventKey: StatAnswer] = [:],
        strokes: Int? = nil
    ) {
        self.modules = modules
        self.par = par
        self.holeNumber = holeNumber
        self.persisted = persisted
        self.draft = draft
        self.strokes = strokes
        prune()
    }

    /// Re-reads the durable half (a load landed, or a config changed) WITHOUT
    /// touching the draft: a refresh under an open step must not throw away
    /// answers the golfer has already tapped but not yet committed.
    mutating func refresh(modules: StatModules, persisted: [StatEventKey: String]) {
        self.modules = modules
        self.persisted = persisted
        prune()
    }

    /// The hole's stroke count landed (or changed). Deliberately NOT part of
    /// `refresh` — the score arrives on its own schedule, one keypad tap before
    /// the step is even shown.
    mutating func setScore(_ strokes: Int?) {
        self.strokes = strokes
    }

    // MARK: Visible prompts

    var prompts: [StatPrompt] {
        StatVocabulary.order.compactMap { key in
            guard isVisible(key) else { return nil }
            return StatPrompt(
                key: key,
                label: StatVocabulary.label(for: key),
                control: resolvedControl(key))
        }
    }

    /// The control a renderer gets: a `refine` entry is resolved to plain
    /// `segments` carrying the option set the parent's current answer selects,
    /// so the view draws an ordinary chip row and decides nothing. Only called
    /// for visible keys, where the option set is guaranteed to exist.
    private func resolvedControl(_ key: StatEventKey) -> StatControl {
        let control = StatVocabulary.control(for: key)
        guard case .refine(let parent, _) = control else { return control }
        return .segments(
            StatVocabulary.refineOptions(for: key, parentValue: value(of: parent)) ?? [])
    }

    var isEmpty: Bool { prompts.isEmpty }

    /// Why a prompt is (not) on the card. The two off-card reasons are NOT
    /// interchangeable, and conflating them is what turns a config change into
    /// data loss:
    ///
    /// - `.unreadable` — this player does not track the module, or the hole is
    ///   the wrong shape for it (a par 3 has no tee-shot question). Nothing is
    ///   being said about the value; a stored one stays stored.
    /// - `.contradicted` — the prompt IS trackable and its precondition was
    ///   answered the other way (GIR flipped to hit, so there was no short-game
    ///   shot). That is a statement about the hole, so a stored value is now
    ///   wrong and gets cleared.
    private enum Visibility {
        case visible
        case unreadable
        case contradicted
    }

    private func visibility(_ key: StatEventKey) -> Visibility {
        switch key {
        case .teeResult:
            let applies = MetadataAppliesRule.evaluate(
                StatVocabulary.teeApplies, par: par, hole: holeNumber)
            return modules.tee && applies ? .visible : .unreadable
        case .teeMissDir:
            // Side is only a fact once the drive is known to have left the
            // fairway — and only when the tee prompt is on the card to say so.
            guard modules.tee, visibility(.teeResult) == .visible else { return .unreadable }
            let result = value(of: .teeResult)
            return result == "in_play" || result == "trouble" ? .visible : .contradicted
        case .recoveryOk:
            // Only meaningful after a tee shot that got into trouble — and only
            // when the tee prompt itself is on the card to have answered it.
            guard modules.recovery, visibility(.teeResult) == .visible else { return .unreadable }
            return value(of: .teeResult) == "trouble" ? .visible : .contradicted
        case .gir:
            return modules.approach ? .visible : .unreadable
        case .greenMissDir:
            guard modules.approach, visibility(.gir) == .visible else { return .unreadable }
            return value(of: .gir) == "0" ? .visible : .contradicted
        case .shortGameDifficulty:
            // Answered, not merely untouched: an untouched GIR says nothing
            // about whether there was a short-game shot. A hit green keeps the
            // prompts too (a par-5 chip on for GIR is a real chip) —
            // `shortGameDisclosure` tells the view to fold them away by
            // default there. `hit_late` is the one answer that RULES OUT a
            // chip: the green attempt finished on the green.
            guard modules.shortGame, visibility(.gir) == .visible else { return .unreadable }
            if value(of: .greenMissDir) == "hit_late" { return .contradicted }
            return value(of: .gir) != nil ? .visible : .contradicted
        case .shortGameStrokes:
            // The SAME gate as `shortGameDifficulty`: the counter is asked
            // whenever there was a short-game shot, not only once a difficulty
            // has been picked.
            guard modules.shortGame, visibility(.gir) == .visible else { return .unreadable }
            if value(of: .greenMissDir) == "hit_late" { return .contradicted }
            return value(of: .gir) != nil ? .visible : .contradicted
        case .firstPutt, .putts:
            return modules.putting ? .visible : .unreadable
        case .firstPuttM:
            // Refines `first_putt`, so it inherits that row's readability;
            // without a FINE bucket selected (unanswered, or a legacy coarse
            // value) there is nothing to refine.
            guard modules.putting, visibility(.firstPutt) == .visible else { return .unreadable }
            return StatVocabulary.refineOptions(for: key, parentValue: value(of: .firstPutt)) != nil
                ? .visible : .contradicted
        case .penalties:
            return modules.penalties ? .visible : .unreadable
        case .penaltySource:
            guard modules.penalties, visibility(.penalties) == .visible else { return .unreadable }
            return (intValue(of: .penalties) ?? 0) >= 1 ? .visible : .contradicted
        }
    }

    private func isVisible(_ key: StatEventKey) -> Bool { visibility(key) == .visible }

    /// How the short-game rows present on a GIR-hit hole ("Add short game").
    /// `none` = the rows render normally (missed green) or are off the card
    /// entirely; `collapsed` = visible but folded behind the disclosure row,
    /// because a chip on a green hit in regulation is the exception;
    /// `expanded` = a value exists, so the rows render normally. The transient
    /// "tapped open this visit" flag is the view's, not the model's.
    enum ShortGameDisclosure: String, Equatable, Sendable {
        case none
        case collapsed
        case expanded
    }

    /// See `ShortGameDisclosure`. Only ever `collapsed` on a GIR-hit hole.
    var shortGameDisclosure: ShortGameDisclosure {
        guard value(of: .gir) == "1" else { return .none }
        guard visibility(.shortGameDifficulty) == .visible else { return .none }
        return value(of: .shortGameDifficulty) == nil && value(of: .shortGameStrokes) == nil
            ? .collapsed : .expanded
    }

    // MARK: Reading

    /// The answer in force: this visit's draft wins over what the server holds.
    func value(of key: StatEventKey) -> String? {
        switch draft[key] {
        case .set(let v): return v
        case .cleared: return nil
        case nil: return persisted[key]
        }
    }

    func intValue(of key: StatEventKey) -> Int? { value(of: key).flatMap(Int.init) }

    /// Whether this key carries an answer (as opposed to being untouched-and-unset).
    func isAnswered(_ key: StatEventKey) -> Bool { value(of: key) != nil }

    // MARK: Writing

    /// Sets or (with `nil`) removes an answer. Re-selecting the value the server
    /// already holds drops the draft entry entirely — a revisit that changes
    /// nothing sends nothing.
    mutating func answer(_ key: StatEventKey, value newValue: String?) {
        guard isVisible(key) else { return }
        // A refine value must belong to the option set its parent's CURRENT
        // answer selects — a metre from another bucket is not an answer here.
        if let newValue, case .refine(let parent, _) = StatVocabulary.control(for: key) {
            let options = StatVocabulary.refineOptions(for: key, parentValue: value(of: parent))
            guard let options, options.contains(where: { $0.value == newValue }) else { return }
        }
        // Rule 2 (proposal §3.4b): a manual interaction locks GIR for the life
        // of this step. Un-answering counts — "I do not want this filled in" is
        // as deliberate as tapping Hit.
        if key == .gir { girLocked = true }
        record(key, newValue)
        prune()
    }

    /// Nudges a stepper. Any nudge answers the key, so a `-1` from unanswered
    /// records the floor rather than doing nothing.
    mutating func step(_ key: StatEventKey, by delta: Int) {
        guard isVisible(key), case .stepper(let min, let max) = StatVocabulary.control(for: key)
        else { return }
        var next = (intValue(of: key) ?? min) + delta
        if next < min { next = min }
        if let max, next > max { next = max }
        if key == .gir { girLocked = true }
        record(key, String(next))
        prune()
    }

    // MARK: Derived GIR (proposal §3.4b)

    /// Five states, exhaustive. The view layer reads this; nothing here writes.
    enum DerivedGirState: String, Equatable, Sendable {
        /// The golfer touched GIR in this visit — their answer, full stop.
        case manual
        /// A stored answer the derivation agrees with, or cannot check.
        case persisted
        /// No answer, and the score can supply one: the control shows nothing
        /// selected plus the pending line, and the value materialises when the
        /// step closes.
        case pending
        /// No answer and nothing to derive from. Silent.
        case idle
        /// A stored answer the derivation contradicts. The STORED value stays
        /// authoritative and is shown selected; the line just says so.
        case disagree
    }

    /// What the score+putts pair says about the green, or nil when it cannot
    /// say anything.
    ///
    /// `putts = 0` on a coherent hole means the ball was holed from off the
    /// green, so `strokes − putts = strokes`, which exceeds `par − 2` on any
    /// sane hole → a miss. That is correct: a chip-in is a missed green.
    /// Derivation is BLOCKED when the putt count is incoherent (`putts = 0`
    /// with a first-putt bucket recorded), matching `putting_coherent`.
    var derivedGir: String? {
        guard visibility(.gir) == .visible else { return nil }
        guard let strokes, strokes > 0 else { return nil }
        guard let putts = intValue(of: .putts), putts >= 0 else { return nil }
        if putts == 0, isAnswered(.firstPutt) { return nil }
        return Double(strokes - putts) <= par - 2 ? "1" : "0"
    }

    var derivedGirState: DerivedGirState {
        guard visibility(.gir) == .visible else { return .idle }
        if girLocked { return .manual }
        let derived = derivedGir
        if let stored = value(of: .gir) {
            guard let derived else { return .persisted }
            return derived == stored ? .persisted : .disagree
        }
        return derived == nil ? .idle : .pending
    }

    /// Rule 1: the derivation fires at STEP COMPLETION, never at render — call
    /// this immediately before building the batch. A no-op in every state but
    /// `pending`, and it goes through the ordinary `record()` + `prune()` path
    /// so a derived miss correctly REVEALS `green_miss_dir`,
    /// `short_game_difficulty` and `short_game_strokes`, and a derived hit
    /// correctly contradicts them.
    @discardableResult
    mutating func materialiseDerivedGir() -> Bool {
        guard derivedGirState == .pending, let derived = derivedGir else { return false }
        record(.gir, derived)
        prune()
        return true
    }

    private mutating func record(_ key: StatEventKey, _ newValue: String?) {
        if let newValue {
            if persisted[key] == newValue {
                draft[key] = nil
            } else {
                draft[key] = .set(newValue)
            }
        } else {
            draft[key] = persisted[key] == nil ? nil : .cleared
        }
    }

    /// Drops answers for prompts that are no longer on the card.
    ///
    /// A `.contradicted` prompt is cleared on the server too, so a mis-tap that
    /// revealed short game does not leave a ghost row behind. An `.unreadable`
    /// one only loses its DRAFT: turning a module off, or opening the step on a
    /// par 3, makes the question unaskable, not the stored answer wrong — and a
    /// clear here would both destroy history and (for a value the server refuses
    /// to clear) poison the queue with a batch that can never succeed.
    private mutating func prune() {
        // Discarding can hide further prompts, so run to a fixed point. The
        // dependency chain is two deep, so this settles immediately.
        for _ in 0..<StatVocabulary.order.count {
            var changed = false
            for key in StatVocabulary.order {
                let before = draft[key]
                switch visibility(key) {
                case .visible:
                    // Bucket coherence for a refine key: the row is on the
                    // card, but its answer belongs to a bucket the parent no
                    // longer holds — clear it (on the server too, matching
                    // `contradicted` semantics).
                    guard case .refine(let parent, _) = StatVocabulary.control(for: key),
                        let current = value(of: key)
                    else { continue }
                    let options = StatVocabulary.refineOptions(
                        for: key, parentValue: value(of: parent))
                    if options?.contains(where: { $0.value == current }) != true {
                        record(key, nil)
                    }
                case .contradicted: record(key, nil)
                case .unreadable: draft[key] = nil
                }
                if draft[key] != before { changed = true }
            }
            if !changed { return }
        }
    }

    // MARK: Committing

    /// What the step owes the server, in prompt order so a batch is deterministic.
    var batch: [StatBatchItem] {
        StatVocabulary.order.compactMap { key in
            switch draft[key] {
            case .set(let v): return StatBatchItem(key: key, value: v)
            case .cleared: return StatBatchItem(key: key, value: nil)
            case nil: return nil
            }
        }
    }

    /// Folds the draft into `persisted` — call once the batch is queued, so the
    /// step re-opens showing what was sent and owing nothing.
    mutating func commitDraft() {
        for (key, answer) in draft {
            switch answer {
            case .set(let v): persisted[key] = v
            case .cleared: persisted[key] = nil
            }
        }
        draft = [:]
    }
}
