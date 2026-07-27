import SwiftUI

/// The text-input skin, straight off the `--field-*` tokens.
///
/// Source: `input()` in `@basics/core/client/ui/css` — `--field-bg` fill, a
/// 1px `--field-border` stroke, `--field-radius` corners, `--field-padding-*`
/// insets. Like `TapButtonStyle` it spells NO colours of its own: change the
/// web theme, regenerate `ThemeTokens.swift`, and every native field moves
/// with it.
///
/// `minHeight` is a TAP-TARGET floor, not a style. The token padding puts a
/// single line of 13.6pt text in ~38pt, under the 44pt minimum, so the padding
/// stays token-derived and untouched and the field simply never draws shorter
/// than a finger. `contentShape` makes the whole of that rectangle hittable
/// rather than the glyph run alone.
struct TapFieldSkin: ViewModifier {
    var minHeight: CGFloat = 44

    func body(content: Content) -> some View {
        content
            .font(TapFont.ui(size: 13.6))
            .foregroundStyle(TapColors.text)
            .tint(TapColors.primary)
            .padding(.vertical, TapMetrics.fieldPaddingY)
            .padding(.horizontal, TapMetrics.fieldPaddingX)
            .frame(maxWidth: .infinity, minHeight: minHeight, alignment: .leading)
            .contentShape(Rectangle())
            .background(
                RoundedRectangle(cornerRadius: TapRadius.fieldRadius, style: .continuous)
                    .fill(TapColors.fieldBg)
            )
            .overlay(
                RoundedRectangle(cornerRadius: TapRadius.fieldRadius, style: .continuous)
                    .strokeBorder(TapColors.fieldBorder, lineWidth: TapMetrics.fieldBorderWidth)
            )
    }
}

extension View {
    /// Applies the web `input()` skin. The one way a native field is dressed —
    /// a stock SwiftUI `.textFieldStyle(.roundedBorder)` anywhere in this app
    /// is a bug, because it draws in system chrome that no theme token reaches.
    func tapField(minHeight: CGFloat = 44) -> some View {
        modifier(TapFieldSkin(minHeight: minHeight))
    }
}

/// A field's placeholder, in `--text-muted`.
///
/// `Text(verbatim:)` rather than a string literal: a `Text` built from a
/// LITERAL is parsed as Markdown, and a bare URL in Markdown becomes an
/// autolink rendered in system blue — off-palette, and (being a placeholder)
/// not tappable either. Verbatim is what keeps the token colour.
func tapFieldPrompt(_ text: String) -> Text {
    Text(verbatim: text).foregroundColor(TapColors.textMuted)
}
