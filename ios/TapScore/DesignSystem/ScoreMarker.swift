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

    /// Web: `MARKER_TOKENS[...].fill`, verbatim — kept as the hex STRING so a
    /// test can pin it against the token table without comparing rendered
    /// colours. `fill` below is the same value as a `Color`.
    var fillHex: String {
        switch self {
        case .ring: "#d63b2f"
        case .doubleRing: "#e0862c"
        case .diamond: "#e0b41f"
        case .square: "#5b9bd5"
        // `double_square` and `box_badge` share one fill on the web (one emitted
        // rule covers both); they are told apart by their value, not their hue.
        case .doubleSquare, .boxBadge: "#1f4e79"
        }
    }

    /// Web: `MARKER_TOKENS[...].fill`. The number on top is always white.
    var fill: Color { Color(webHex: fillHex) }

    /// The wire template string → this table's form.
    ///
    /// The spellings are `MARKER_TOKENS`' keys in `src/round/marker-tokens.ts`
    /// (snake_case, straight off the server vocabulary). `dot`, `badge` and
    /// `custom` deliberately map to nil: they are the web's OUTLINE/bare forms,
    /// which carry no fill — `MarkerVisual` tells those apart.
    init?(webTemplate: String) {
        switch webTemplate {
        case "ring": self = .ring
        case "double_ring": self = .doubleRing
        case "diamond": self = .diamond
        case "square": self = .square
        case "double_square": self = .doubleSquare
        case "box_badge": self = .boxBadge
        default: return nil
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

    /// Web: `#c2452f` / `#2c6cae`, as the hex string (see `ScoreMarkerForm.fillHex`).
    var hex: String {
        switch self {
        case .a: "#c2452f"
        case .b: "#2c6cae"
        }
    }

    /// Web: `.lb-pill` / `.lb-mp__team--lead` — white ink on the filled tint.
    var onColor: Color { .white }
}

// MARK: - Marker visuals

/// The RESOLVED visual of one leaderboard score marker — the Swift half of the
/// `.lb-mark` cascade in `src/round/leaderboard.component.ts` (whose per-form
/// rules are emitted from `MARKER_TOKENS` in `src/round/marker-tokens.ts`).
///
/// It exists as a value, separate from the view that draws it, for one reason:
/// the cascade has four inputs (base shape, per-form rule, tone tint, team fill)
/// and the interesting cases are the ones where a later rule OVERRIDES an
/// earlier one. Resolving it into a struct lets a test pin the shape parameters
/// of all eight templates without rendering a pixel.
///
/// The web's `1.7em` box at the grid's `0.8rem` type is ~22px; every length here
/// is in the same CSS px, applied as points.
struct MarkerVisual: Equatable, Sendable {
    /// Web: the base `.lb-mark` is `border-radius: 999px`; `MARKER_TOKENS.boxy`
    /// forms take the shared `border-radius: 3px` rule instead.
    enum Shape: String, Equatable, Sendable {
        case round
        case boxy
    }

    /// One concentric border, drawn INSIDE the marker box (web `box-sizing:
    /// border-box`). `inset` is the distance from the box edge to this ring's
    /// outer edge, which is how a 3px `border-style: double` becomes two rings.
    struct Ring: Equatable, Sendable {
        /// nil = `currentColor` — the cell's own ink.
        var hex: String?
        var width: CGFloat
        var inset: CGFloat
    }

    var shape: Shape = .round
    /// nil = no `background` (an outline or bare form).
    var fillHex: String?
    /// nil = `currentColor` — inherit the cell's ink rather than setting one.
    var inkHex: String?
    var rings: [Ring] = []
    /// Web: `box-shadow: 0 0 0 2.5px <team>` — a halo OUTSIDE the box, which is
    /// what turns a team-filled marker into a pronounced concentric ring
    /// instead of a plain disc.
    var haloHex: String?
    var haloWidth: CGFloat = 0
    /// Web: `width: auto; min-width: 1.8em` with `0.45em` side padding — the
    /// badge grows with its text instead of clipping it.
    var autoWidth: Bool = false

    /// No fill, no border: the web's bare base shape (`dot`, and `custom` /
    /// any template this client predates — `marker-tokens.ts` rule 4, "visible
    /// as unfinished" rather than silently borrowing another form's shape).
    var isBare: Bool { fillHex == nil && rings.isEmpty && haloHex == nil }

    /// Web: `MARKER_TOKENS.badge.tones` — the ONLY form with tone tints. A tone
    /// on any other template changes nothing, exactly as the emitted CSS does
    /// (no `.lb-mark-tone--*` rule is emitted for a form without `tones`).
    static func badgeToneHex(_ tone: MarkerTone?) -> String? {
        switch tone {
        case .success: "#267348"
        case .warning: "#946200"
        case .danger: "#9b332a"
        case nil: nil
        }
    }

    /// Resolve one marker, in the CSS's own order: base → per-form rule → tone
    /// → team fill. Later steps overwrite earlier ones, which is the cascade.
    static func resolve(template: String, tone: MarkerTone?, teamFill: GridRowTeam?) -> MarkerVisual {
        var visual = MarkerVisual()

        // Filled forms: `background: <fill>; color: #fff;` (+ the shared boxy
        // corner rule).
        if let form = ScoreMarkerForm(webTemplate: template) {
            visual.shape = form.isBoxy ? .boxy : .round
            visual.fillHex = form.fillHex
            visual.inkHex = "#ffffff"
        } else if template == "badge" {
            // `width: auto; min-width: 1.8em; padding: 0 .45em;
            //  border: 2px solid currentColor;` + the tone tint.
            visual.autoWidth = true
            visual.inkHex = badgeToneHex(tone)
            visual.rings = [Ring(hex: visual.inkHex, width: 2, inset: 0)]
        }
        // `dot`, `custom` and unknown templates fall through as the bare base
        // shape — no fill, no border, inherited colour.

        // `.lb-mark-fill--a/b`: the deciding ball's marker takes the TEAM fill,
        // a white border, and a team-colour halo. Declared after the shape
        // fills on the web, so it wins over them here too.
        if let teamFill {
            let team = TeamTint(teamFill)
            visual.fillHex = team.hex
            visual.inkHex = "#ffffff"
            visual.rings = template == "double_ring"
                // `border-width: 3px; border-style: double` — 1px line, 1px
                // gap, 1px line, so a team-filled double ring stays apart from
                // a team-filled ring.
                ? [Ring(hex: "#ffffff", width: 1, inset: 0), Ring(hex: "#ffffff", width: 1, inset: 2)]
                : [Ring(hex: "#ffffff", width: 2, inset: 0)]
            visual.haloHex = team.hex
            visual.haloWidth = 2.5
        }
        return visual
    }
}

extension Color {
    /// `#rrggbb` (the spelling every marker/team colour is written in on the
    /// web) → a Color. Malformed input falls back to clear rather than
    /// trapping: a marker with a bad colour must not crash a scorecard.
    init(webHex: String) {
        let digits = webHex.hasPrefix("#") ? String(webHex.dropFirst()) : webHex
        guard digits.count == 6, let value = UInt32(digits, radix: 16) else {
            self = .clear
            return
        }
        self.init(
            red: Double((value >> 16) & 0xff) / 255,
            green: Double((value >> 8) & 0xff) / 255,
            blue: Double(value & 0xff) / 255
        )
    }
}
