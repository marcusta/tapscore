import SwiftUI

/// The round header's "LIVE" marker.
///
/// Source: `.round-view__status` in `src/round/round.component.ts` — the same
/// pill anatomy as the landing's `StatusChip` (hence the shared
/// `TapPillLabel`), but unconditionally in the accent tone, because the round
/// screen only ever draws it for a round that is actually being played.
///
/// Kept as its own type rather than a `StatusChip(.active)` call site so the
/// round screen reads as what it is. If the two ever need to diverge, the
/// divergence has somewhere to live.
struct LiveBadge: View {
    var title: String = RoundStatusTone.active.title

    var body: some View {
        TapPillLabel(
            text: title,
            background: TapColors.accentSoft,
            foreground: TapColors.accent
        )
        .accessibilityLabel("Round is live")
    }
}
