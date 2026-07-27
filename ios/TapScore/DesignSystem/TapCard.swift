import SwiftUI

/// The surface every list row, leaderboard card and share panel sits on.
///
/// Source: `card()` in `@basics/core/client/ui/css` — `--surface` fill, 1px
/// `--border`, `--radius-md` (12), `--shadow-1`. Used by
/// `src/landing/landing.component.ts` (`.round-row`) and
/// `src/round/leaderboard.component.ts` (`.lb-card`).
///
/// The card carries the surface and nothing else: padding belongs to the
/// content, exactly as on the web, where `.round-row__main` and `.lb-card` pad
/// themselves differently inside the same `card()` mixin.
struct TapCard<Content: View>: View {
    /// Sunken variant — `--surface-sunken` instead of `--surface`. The web's
    /// share panel (`.round-view__share`) overrides `card()`'s background this
    /// way to sit *into* the page rather than on top of it.
    var sunken: Bool = false
    @ViewBuilder var content: Content

    var body: some View {
        content
            .background(sunken ? TapColors.surfaceSunken : TapColors.surface)
            .clipShape(RoundedRectangle(cornerRadius: TapRadius.radiusMd, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: TapRadius.radiusMd, style: .continuous)
                    .strokeBorder(TapColors.border, lineWidth: 1)
            )
            .tapShadow(TapShadows.shadow1)
    }
}

extension View {
    /// Apply a generated shadow token.
    func tapShadow(_ shadow: ThemeTokens.Shadow) -> some View {
        self.shadow(color: shadow.color, radius: shadow.radius, x: shadow.x, y: shadow.y)
    }
}
