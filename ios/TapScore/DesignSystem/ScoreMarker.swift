import SwiftUI

/// How a stroke count relates to par, and the shape that stands for it.
///
/// Two web sources, kept together here because they are two halves of one rule:
///
/// - **The thresholds** are `scoreToParMarker()` in
///   `server/domain/strategies/result-vocabulary.ts` — a hole-in-one is a
///   diamond, −3 or better a diamond, −2 a double ring, −1 a ring, +1 a square,
///   +2 a double square, +3 or worse a box badge, and level par gets **no
///   marker at all**.
/// - **The visuals** are `MARKER_TOKENS` in `src/round/marker-tokens.ts`, the
///   client-side table the leaderboard's `.lb-mark--*` CSS is emitted from.
///
/// Reproduced rather than generated: the thresholds live server-side (the
/// server sends the abstract template, not the shape) and the visual table is a
/// TypeScript record of structured objects, so neither is data the theme
/// generator can read. The two file references above are the greppable link.
enum ScoreMarkerForm: String, CaseIterable, Sendable {
    /// Web: `ring` — "a single-unit decided result". Birdie.
    case ring
    /// Web: `double_ring` — more emphatic than a ring. Eagle.
    case doubleRing
    /// Web: `diamond` — the strongest form. Hole in one / albatross.
    case diamond
    /// Web: `square` — "a one-step negative score relation". Bogey.
    case square
    /// Web: `double_square`. Double bogey.
    case doubleSquare
    /// Web: `box_badge` — an angular labelled state carrying its own value.
    /// Triple bogey or worse.
    case boxBadge

    /// Web: `MARKER_TOKENS[...].fill`. The number on top is always white.
    var fill: Color {
        switch self {
        case .ring: Color(red: 0xd6 / 255, green: 0x3b / 255, blue: 0x2f / 255)
        case .doubleRing: Color(red: 0xe0 / 255, green: 0x86 / 255, blue: 0x2c / 255)
        case .diamond: Color(red: 0xe0 / 255, green: 0xb4 / 255, blue: 0x1f / 255)
        case .square: Color(red: 0x5b / 255, green: 0x9b / 255, blue: 0xd5 / 255)
        case .doubleSquare, .boxBadge: Color(red: 0x1f / 255, green: 0x4e / 255, blue: 0x79 / 255)
        }
    }

    /// Web: `MARKER_TOKENS[...].boxy` — square corners (3px) instead of the
    /// base round pill, so a negative relation never reads as a positive one.
    var isBoxy: Bool {
        switch self {
        case .square, .doubleSquare, .boxBadge: true
        case .ring, .doubleRing, .diamond: false
        }
    }

    /// The golf sentence the web carries in each marker's `label` (tooltip and
    /// aria). Kept off the shape itself, exactly as the vocabulary does.
    var accessibilityName: String {
        switch self {
        case .ring: "Birdie"
        case .doubleRing: "Eagle"
        case .diamond: "Albatross or hole in one"
        case .square: "Bogey"
        case .doubleSquare: "Double bogey"
        case .boxBadge: "Triple bogey or worse"
        }
    }

    /// The classification itself, mirroring `scoreToParMarker()` branch for
    /// branch.
    ///
    /// - Parameter isGross: false for a NET score — a net 1 is not a hole in
    ///   one, so it classifies by its difference to par like any other value.
    ///   Matches the web's `holeInOne` flag.
    /// - Returns: nil for level par, and for a score that is not a real stroke
    ///   count (nil, zero, negative) — both mean "draw no marker".
    static func forScore(strokes: Int?, par: Int?, isGross: Bool = true) -> ScoreMarkerForm? {
        guard let strokes, let par, strokes > 0 else { return nil }
        let diff = strokes - par
        if diff == 0 { return nil }
        if strokes == 1 && isGross { return .diamond }
        if diff <= -3 { return .diamond }
        if diff == -2 { return .doubleRing }
        if diff == -1 { return .ring }
        if diff == 1 { return .square }
        if diff == 2 { return .doubleSquare }
        return .boxBadge
    }
}

/// Which way a number leans against par — the app's other, quieter par tint.
///
/// Source: `.se-row__topar.under/.over/.even` in
/// `src/round/score-entry.component.ts` and the leaderboard's
/// `.lb-rank__pace--under/--over`. Same two colours in both places, which is
/// why they are one type: a running to-par and a pace delta must never disagree
/// about which direction is good.
enum ParDirection: Sendable {
    case under
    case level
    case over

    /// Web: `--under-par` / `--over-par`; level falls back to `--text-muted`.
    var color: Color {
        switch self {
        case .under: TapColors.underPar
        case .level: TapColors.textMuted
        case .over: TapColors.overPar
        }
    }

    init(toPar: Int) {
        self = toPar < 0 ? .under : (toPar > 0 ? .over : .level)
    }

    /// The web renders a signed to-par with an explicit "E" at level.
    func formatted(toPar: Int) -> String {
        switch self {
        case .level: "E"
        case .under: "\(toPar)"
        case .over: "+\(toPar)"
        }
    }
}

/// The two match-play side tints.
///
/// Source: `.lb-mp__team--a` / `--b` and `.lb-team-a` / `-b` in
/// `src/round/leaderboard.component.ts`. They are LITERALS on the web — the
/// theme has no token for them, because a side's colour is a property of the
/// board's vocabulary rather than of the palette (it must stay the same red and
/// blue in both appearances, exactly like `ScoreMarkerForm`'s fills above).
/// Reproduced here for the same reason and with the same greppable reference.
enum TeamTint: Sendable {
    case a
    case b

    init(_ team: GridRowTeam) {
        self = team == .a ? .a : .b
    }

    /// Web: `#c2452f` / `#2c6cae`.
    var color: Color {
        switch self {
        case .a: Color(red: 0xc2 / 255, green: 0x45 / 255, blue: 0x2f / 255)
        case .b: Color(red: 0x2c / 255, green: 0x6c / 255, blue: 0xae / 255)
        }
    }

    /// Web: `.lb-pill` / `.lb-mp__team--lead` — white ink on the filled tint.
    var onColor: Color { .white }
}
