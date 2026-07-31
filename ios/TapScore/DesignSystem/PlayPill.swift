import SwiftUI

/// The shell dock's one raised action — "Play golf", straight into the create
/// flow.
///
/// **Words, not a symbol.** The obvious native spelling of a floating action
/// button is a circle with a `plus` in it, and it is the wrong one here: a
/// glyph has to be learned, and the whole point of this control is that a
/// first-time viewer knows what the app is for from the dock alone. So it is a
/// text pill — `TapFont.display` semibold, `--primary` fill, `--primary-text`
/// ink, pill radius, `--shadow-elevated` — and it carries no `Image` at all.
///
/// It rides the dock rather than the tab bar: anonymous play is core, so the
/// pill renders signed out too, where there is no tab bar under it (see
/// `RootView.rootBottomInset`). `height` and `overlap` are read by that layout
/// so the pill sits half over the bar's top edge without either side guessing
/// the other's metrics.
struct PlayPill: View {
    let action: () -> Void

    /// The pill's baseline height, so the dock can reserve room for the half
    /// that hangs above the tab bar. A floor, not a ceiling — at accessibility
    /// text sizes the pill grows and simply hangs a little further over the
    /// page, which beats clipping the one label the dock exists to show.
    static let height: CGFloat = 48

    /// How far the pill drops over the tab bar's top edge — half of it, which
    /// is what makes it read as floating rather than as a third tab.
    static var overlap: CGFloat { height / 2 }

    var body: some View {
        Button(action: action) {
            Text("Play golf")
                .font(TapFont.display(size: 17.6, weight: .semibold))
                .foregroundStyle(TapColors.primaryText)
                .padding(.horizontal, TapSpacing.xl)
                .padding(.vertical, TapSpacing.sm)
                .frame(minHeight: Self.height)
                .background(
                    Capsule(style: .continuous).fill(TapColors.primary)
                )
                .contentShape(Capsule(style: .continuous))
        }
        .buttonStyle(.plain)
        .tapShadow(TapShadows.shadowElevated)
        .accessibilityLabel("Play golf")
        .accessibilityIdentifier("play-pill")
    }
}
