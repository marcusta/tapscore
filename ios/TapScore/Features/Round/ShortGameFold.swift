import Foundation

/// The capture card's presentation state: which visits have had the short-game
/// pair unfolded, what the card draws as a result, and the words the card uses
/// for both. Presentation, not domain — `StatStep` (in `Domain/`) decides what
/// may be asked; this decides what is on screen.
///
/// It lives outside `ScoreKeypadView.swift` because `RoundStore` holds the fold:
/// a view file that the store imports state from is a layering inversion, and
/// the fold has to outlive the view (see `ShortGameFold`).

/// One capture visit: the player whose card is open, on the hole under the
/// cursor. Deliberately the SAME pair `RoundStore.StatCell` is keyed by, so the
/// visit the fold records and the step whose disclosure it read are always the
/// same thing. A ball with no single registered member has no step, and so no
/// visit — both fields are nil there.
struct VisitKey: Hashable, Sendable {
    var playerId: String?
    var playHoleId: String?
}

/// The presentation half of the short-game disclosure: which visits have had the
/// pair unfolded, and what the card therefore draws.
///
/// `StatStep.shortGameDisclosure` owns the durable half — may the pair fold at
/// all, and does it hold an answer. This owns the answer to "has this card
/// already been opened", and it REMEMBERS: a visit unfolded once stays unfolded
/// for the rest of the round, whether the golfer left for the keypad, scored
/// another ball, or came back a hole later. Anything else re-folds rows the
/// golfer deliberately opened, sometimes under their finger.
///
/// It lives on `RoundStore` rather than in `@State` for exactly that reason:
/// `keypadSheet` destroys `StatsView` on every trip back to the pad.
struct ShortGameFold: Equatable, Sendable {
    private(set) var openedVisits: Set<VisitKey> = []

    /// The two rows that fold together. They share one gate in the model, so a
    /// disclosure that showed one and hid the other would be a lie about both.
    static let foldedKeys: Set<StatEventKey> = [.shortGameDifficulty, .shortGameStrokes]

    /// One row of the capture card: a prompt, or the disclosure that REPLACES
    /// the folded pair (never sits beside it).
    enum Row: Equatable, Identifiable {
        case prompt(StatPrompt)
        case shortGameDisclosure

        var id: String {
            switch self {
            case .prompt(let prompt): return prompt.id
            case .shortGameDisclosure: return "short-game-disclosure"
            }
        }
    }

    mutating func open(_ visit: VisitKey) { openedVisits.insert(visit) }

    func isFolded(disclosure: StatStep.ShortGameDisclosure, visit: VisitKey) -> Bool {
        disclosure == .collapsed && !openedVisits.contains(visit)
    }

    /// The card, in order: the folded pair replaced by ONE disclosure row where
    /// the first of them would have been, so the row keeps their place in shot
    /// order and the count of short-game rows is one, never three.
    func visible(
        _ prompts: [StatPrompt],
        disclosure: StatStep.ShortGameDisclosure,
        visit: VisitKey
    ) -> [Row] {
        guard isFolded(disclosure: disclosure, visit: visit) else { return prompts.map(Row.prompt) }
        var replaced = false
        return prompts.compactMap { prompt in
            guard Self.foldedKeys.contains(prompt.key) else { return .prompt(prompt) }
            guard !replaced else { return nil }
            replaced = true
            return .shortGameDisclosure
        }
    }
}

/// Capture-step copy. It lives here rather than in `StatsCopy` because it
/// belongs to the card the golfer taps mid-round, not to the dashboard.
enum StatCaptureCopy {
    /// The folded short-game pair's trigger. Words, not a chevron.
    static let addShortGame = "Add short game"

    /// `first_putt_m` renders its row without a heading (it refines the bucket
    /// above it), so this is the name every NON-visual surface uses for it:
    /// VoiceOver, and the explainer sheet's card title.
    static let firstPuttExact = "First putt, exact"

    /// A prompt's written name — its own label, or the fallback for a prompt
    /// that deliberately renders without one.
    static func name(_ prompt: StatPrompt) -> String {
        guard prompt.label.isEmpty else { return prompt.label }
        // Total by construction: `first_putt_m` is the only label-less prompt,
        // and a future one still gets a name rather than an untitled row.
        return prompt.key == .firstPuttM ? firstPuttExact : prompt.key.rawValue
    }
}
