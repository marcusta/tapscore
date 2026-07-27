import SwiftUI

/// The tappable per-player score cell.
///
/// Source: `.se-row__circle` in `src/round/score-entry.component.ts` — a 48pt
/// cream `--accent-soft` circle with the stroke count in Fraunces 700 at
/// 1.25rem, `--primary` ink, tabular figures. Three states carry over verbatim:
///
/// - **empty** — `--surface-sunken` fill, `--text-muted` ink (`&.empty`).
/// - **hint** — the Gamebook-style handicap preview in an unscored circle,
///   smaller and at 80% so it reads as a preview, not a score (`&.hint`).
/// - **pending** — Phase 5.5's unclaimed seat: inert, 55% (`--pending`).
///
/// **Par tinting is opt-in, and that is deliberate.** The web's entry circle is
/// never tinted by par; the leaderboard's marker shapes are. Pass a
/// `ScoreMarkerForm` (from `ScoreMarkerForm.forScore`) to get the leaderboard's
/// filled shape — same colours, same square corners for the over-par forms —
/// and pass nil for the entry screen's plain cream circle.
struct ScoreCircle: View {
    enum State: Equatable {
        /// No score yet.
        case empty
        /// No score yet, showing the handicap preview ("−1" / "0" / "+1").
        case hint(String)
        /// A recorded stroke count.
        case score(Int)
        /// A PICK-UP — the hole was played but never holed out. It is a
        /// recorded score, so the circle is not empty, but there is no stroke
        /// count to print. (`RoundStore` stores it as `0`; the web keypad's
        /// same overload.) Kept apart from `.score(0)` so a zero can never
        /// render as the digit.
        case pickedUp
        /// An unclaimed seat — nothing to enter, nothing to tap.
        case pending
    }

    let state: State
    /// The leaderboard's par marker, or nil for the untinted entry circle.
    var marker: ScoreMarkerForm?
    var diameter: CGFloat = 48
    var action: (() -> Void)?

    var body: some View {
        Group {
            if let action, state != .pending {
                Button(action: action) { Text(text) }
                    .buttonStyle(PressStyle(circle: self))
            } else {
                face(isPressed: false)
            }
        }
        .accessibilityLabel(accessibilityLabel)
    }

    /// Web: `.se-row__circle { transition: background 0.15s; &:active {
    /// background: var(--accent); } }` — the touch equivalent of the hover the
    /// web never gets, and the only feedback the entry grid gives on tap.
    ///
    /// A `ButtonStyle` rather than a gesture because `isPressed` is what tracks
    /// a finger that slides off the circle before lifting.
    private struct PressStyle: ButtonStyle {
        let circle: ScoreCircle

        func makeBody(configuration: Configuration) -> some View {
            circle.face(isPressed: configuration.isPressed)
                .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
        }
    }

    private func face(isPressed: Bool) -> some View {
        Text(text)
            .font(TapFont.display(size: fontSize, weight: .bold, tabular: true))
            .foregroundStyle(foreground)
            .opacity(textOpacity)
            .frame(width: diameter, height: diameter)
            .background(shape.fill(isPressed ? TapColors.accent : background))
            .contentShape(shape)
            .opacity(state == .pending ? 0.55 : 1)
    }

    /// Web: the marker table's `boxy` forms get 3px corners; everything else
    /// is the 999px pill.
    private var shape: AnyShape {
        marker?.isBoxy == true
            ? AnyShape(RoundedRectangle(cornerRadius: 3, style: .continuous))
            : AnyShape(Circle())
    }

    private var text: String {
        switch state {
        case .empty, .pending: "–"
        case .pickedUp: "—"
        case let .hint(value): value
        case let .score(strokes): String(strokes)
        }
    }

    private var background: Color {
        if let marker { return marker.fill }
        switch state {
        case .score: return TapColors.accentSoft
        case .empty, .hint, .pending, .pickedUp: return TapColors.surfaceSunken
        }
    }

    private var foreground: Color {
        if marker != nil { return .white }
        switch state {
        case .score: return TapColors.primary
        case .empty, .hint, .pending, .pickedUp: return TapColors.textMuted
        }
    }

    /// Web: `&.hint { font-size: 0.95rem; opacity: 0.8; }` against the
    /// circle's own 1.25rem.
    private var fontSize: CGFloat {
        if case .hint = state { return 15.2 }
        return 20
    }

    private var textOpacity: Double {
        if case .hint = state { return 0.8 }
        return 1
    }

    private var accessibilityLabel: String {
        let base: String = switch state {
        case .empty: "No score"
        case .pending: "Open seat"
        case .pickedUp: "Picked up"
        case let .hint(value): "No score, handicap \(value)"
        case let .score(strokes): "\(strokes)"
        }
        guard let marker else { return base }
        return "\(base), \(marker.accessibilityName)"
    }
}
