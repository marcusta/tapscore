import Foundation

/// The handicap keypad's whole state machine — no view, no store, no clock.
///
/// The native image of the web's `hcpAppendDigit` / `hcpAppendSep` /
/// `hcpTogglePlus` / `hcpCommit` (`src/create/create.component.ts`), which the
/// spec pins as §5.7 (B5.15–B5.24) with the fourteen vectors of §5.7.1.
///
/// It exists as a value type because every rule the pad has is a rule about a
/// STRING, and all of them are cheap to get subtly wrong: a handicap index
/// decides how many shots someone gets, and "+2,4" meaning **-2.4** is the kind
/// of inversion that is invisible until a scorecard is wrong. Keeping the rules
/// here means the fourteen vectors are asserted against the thing the buttons
/// actually call, not against a re-implementation of it.
///
/// Why a keypad at all, rather than a text field: the value has exactly twelve
/// meaningful glyphs and one of them (`+`) does not exist as a concept on any
/// system keyboard. B5.15 makes the field itself non-editable for that reason.
struct HandicapPad: Sendable, Equatable {
    /// What the user is typing, in DISPLAY notation — the locale's separator,
    /// a leading `+` for a plus handicap. Committed verbatim; `HandicapInput`
    /// is what turns it into a number.
    private(set) var draft: String

    /// The decimal separator this pad shows and inserts. Swedish writes `,`
    /// (web: `hcpSep()`), everything else `.`.
    let separator: Character

    init(draft: String = "", separator: Character = HandicapPad.localeSeparator()) {
        self.draft = draft
        self.separator = separator
    }

    static func localeSeparator(_ locale: FormatCatalog.Locale = .current) -> Character {
        locale == .sv ? "," : "."
    }

    /// The pad's keys, in the exact grid order B5.16 fixes: `1…9`, then `+`
    /// (captioned "plus hcp"), then `0`, then the separator. The delete key and
    /// the two actions are chrome around this grid, not part of it.
    enum Key: Sendable, Equatable {
        case digit(Character)
        case plus
        case separator
        case delete
    }

    var grid: [Key] {
        ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map { Key.digit($0) }
            + [.plus, .digit("0"), .separator]
    }

    /// The caption under a key, empty for the digits — only `+` needs to
    /// explain itself, because "plus" in golf means BETTER than scratch and
    /// nothing on the key says so.
    static func caption(for key: Key) -> String {
        key == .plus ? "plus hcp" : ""
    }

    static func glyph(for key: Key, separator: Character) -> String {
        switch key {
        case .digit(let d): String(d)
        case .plus: "+"
        case .separator: String(separator)
        case .delete: "⌫"
        }
    }

    mutating func press(_ key: Key) {
        switch key {
        case .digit(let d): appendDigit(d)
        case .plus: togglePlus()
        case .separator: appendSeparator()
        case .delete: if !draft.isEmpty { draft.removeLast() }
        }
    }

    /// B5.18 — at most two integer digits and one decimal. A key beyond those
    /// limits is IGNORED: it is not an error (there is nothing to fix) and it
    /// must not truncate what came before, which is what a "keep the last two"
    /// rule would do to someone correcting a typo.
    private mutating func appendDigit(_ digit: Character) {
        let bare = draft.replacingOccurrences(of: "+", with: "")
        if let at = bare.firstIndex(where: Self.isSeparator) {
            // Already past the point: one decimal digit is all there is room for.
            if bare.distance(from: bare.index(after: at), to: bare.endIndex) >= 1 { return }
        } else if bare.count >= 2 {
            return
        }
        draft.append(digit)
    }

    /// BOTH separators count, whichever this pad inserts. A row seeded from a
    /// stored index carries the "." spelling (`HandicapInput.format`), and a
    /// Swedish pad opened on it must still see that dot as the decimal point —
    /// otherwise "18.4" would accept two more digits. Web: `/[.,]/`.
    private static func isSeparator(_ c: Character) -> Bool { c == "." || c == "," }

    /// B5.19 — one separator only, and a separator with nothing before it gets
    /// a zero to sit on ("0,"), so the value always reads as a number.
    private mutating func appendSeparator() {
        guard !draft.contains(where: Self.isSeparator) else { return }
        if draft.replacingOccurrences(of: "+", with: "").isEmpty {
            draft.append("0")
        }
        draft.append(separator)
    }

    /// B5.20 — the plus prefix toggles, keeping the digits. A raw "-" (the
    /// stored notation) flips to the "+" spelling rather than stacking.
    private mutating func togglePlus() {
        if draft.hasPrefix("+") {
            draft.removeFirst()
        } else {
            draft = "+" + draft.replacingOccurrences(of: "-", with: "")
        }
    }

    /// B5.21/B5.22 — Done is enabled for an EMPTY value (it commits a clear)
    /// and disabled for a lone `+`, which is not a number and would otherwise
    /// commit as one.
    var canCommit: Bool {
        draft.isEmpty || HandicapInput.parse(draft) != nil
    }

    /// What `Done` writes back to the row: the draft verbatim, exactly as the
    /// web's `patchPlayer({handicapIndex: draft})` does. Empty ⇒ the row's
    /// index is cleared.
    var committedText: String { draft }

    /// The number that text means, for the pad's live course-handicap line.
    var committedValue: Double? { HandicapInput.parse(draft) }
}
