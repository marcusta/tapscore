import SwiftUI

/// A round's lifecycle state, as the landing list shows it.
///
/// Source: `.round-row__status` in `src/landing/landing.component.ts`, whose
/// copy comes from `STATUS_TEXT` in the same file. The three-way split is
/// two-way visually on purpose: only a LIVE round earns the accent; not-started
/// and finished share the quiet sunken treatment, because neither is where the
/// player's attention should go.
enum RoundStatusTone: String, CaseIterable, Sendable {
    case notStarted
    case active
    case complete

    /// Web: `STATUS_TEXT` in `landing.component.ts`.
    var title: String {
        switch self {
        case .notStarted: "Not started"
        case .active: "Live"
        case .complete: "Finished"
        }
    }

    /// Web: `.s-active` / `.s-complete` / `.s-not_started`.
    var background: Color {
        self == .active ? TapColors.accentSoft : TapColors.surfaceSunken
    }

    var foreground: Color {
        self == .active ? TapColors.accent : TapColors.textMuted
    }
}

/// The uppercase pill shape shared by every status marker in the app.
///
/// Source: the metrics repeated verbatim by `.round-row__status`
/// (`landing.component.ts`) and `.round-view__status`
/// (`round.component.ts`) — 0.7rem/700, uppercase, 0.08em tracking, pill
/// radius, `2px 10px` padding. One shape, so a status never renders at two
/// different sizes on two screens.
struct TapPillLabel: View {
    let text: String
    let background: Color
    let foreground: Color

    var body: some View {
        Text(text.uppercased())
            .font(TapFont.ui(size: 11.2, weight: .bold))
            .tracking(11.2 * 0.08)
            .lineLimit(1)
            .foregroundStyle(foreground)
            .padding(.vertical, 2)
            .padding(.horizontal, 10)
            .background(Capsule().fill(background))
    }
}

/// The landing list's per-round status chip.
struct StatusChip: View {
    let status: RoundStatusTone

    var body: some View {
        TapPillLabel(
            text: status.title,
            background: status.background,
            foreground: status.foreground
        )
    }
}
