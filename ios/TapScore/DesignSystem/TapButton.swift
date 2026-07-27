import SwiftUI

/// The button tiers, straight off the theme's control tokens.
///
/// Source: `btn()` in `@basics/core/client/ui/css`, skinned by the
/// `--btn-<tier>-*` tokens that `bridgeLegacyControls` derives from
/// `src/theme.ts`. Because those tokens are generated into `TapColors`, this
/// style spells NO colours of its own — change the web theme, regenerate, and
/// the native buttons move with it.
///
/// The tier is structural: which job the button does, not what it looks like.
/// At most one `.primary` per screen.
struct TapButtonStyle: ButtonStyle {
    enum Tier {
        case primary
        case secondary
        case ghost
        case danger
    }

    enum Size {
        /// Web: `--btn-font-size` 14 / `--btn-padding-*` 8×16.
        case regular
        /// The landing's "Create round" call to action
        /// (`.landing__create` — 1.1rem/700, `s('lg')` padding, elevated).
        case prominent
    }

    var tier: Tier = .secondary
    var size: Size = .regular
    /// Fills the available width. The web's full-bleed buttons
    /// (`.landing__create`, `.round-view__finish`) all do this.
    var fillsWidth: Bool = false

    func makeBody(configuration: Configuration) -> some View {
        // A `ButtonStyle` body is NOT the enclosing button's view, so
        // `@Environment(\.isEnabled)` read on the style itself is always true —
        // and SwiftUI applies no automatic dimming to a custom style. The
        // disabled skin therefore has to be read inside a real view, which is
        // what this nested one is for. Without it `.disabled(true)` renders
        // pixel-identical to enabled.
        Face(style: self, configuration: configuration)
    }

    /// The rendered button. Nested so it sits in the view hierarchy and can
    /// resolve `\.isEnabled` from the environment.
    private struct Face: View {
        let style: TapButtonStyle
        let configuration: Configuration
        @Environment(\.isEnabled) private var isEnabled

        var body: some View {
            configuration.label
                .font(style.font)
                .foregroundStyle(isEnabled ? style.foreground : TapColors.btnDisabledFg)
                .frame(maxWidth: style.fillsWidth ? .infinity : nil)
                .padding(.vertical, style.verticalPadding)
                .padding(.horizontal, style.horizontalPadding)
                .background(
                    RoundedRectangle(cornerRadius: TapRadius.btnRadius, style: .continuous)
                        .fill(fill)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: TapRadius.btnRadius, style: .continuous)
                        .strokeBorder(
                            isEnabled ? style.border : TapColors.btnDisabledBorder,
                            lineWidth: TapMetrics.btnBorderWidth
                        )
                )
                // Web `disabledSkin`: `box-shadow: none`, so the elevated CTA
                // flattens when it is disabled.
                .tapShadowIfElevated(isEnabled ? style.size : .regular)
                // Web `disabledSkin`: `opacity: var(--btn-disabled-opacity)`.
                .opacity(isEnabled ? 1 : TapMetrics.btnDisabledOpacity)
                // The web transitions colour on `--dur-fast`; the press state is
                // the only one a touch UI has, so it gets that timing.
                .animation(.easeOut(duration: TapDurations.durFast), value: configuration.isPressed)
        }

        /// A disabled button has no press state — it cannot be pressed, and the
        /// web's `:disabled` skin wins over `:hover` for the same reason.
        private var fill: Color {
            guard isEnabled else { return TapColors.btnDisabledBg }
            return configuration.isPressed ? style.pressedBackground : style.background
        }
    }

    private var font: Font {
        switch size {
        case .regular: TapFont.ui(size: TapMetrics.btnFontSize, weight: .medium)
        case .prominent: TapFont.ui(size: 17.6, weight: .bold)
        }
    }

    private var verticalPadding: CGFloat {
        size == .regular ? TapMetrics.btnPaddingY : TapSpacing.lg
    }

    private var horizontalPadding: CGFloat {
        size == .regular ? TapMetrics.btnPaddingX : TapSpacing.lg
    }

    private var background: Color {
        switch tier {
        case .primary: TapColors.btnPrimaryBg
        case .secondary: TapColors.btnSecondaryBg
        case .ghost: TapColors.btnGhostBg
        case .danger: TapColors.btnDangerBg
        }
    }

    /// The web has no touch state, so the hover skin is what a press borrows —
    /// it is the token pair the theme already designed for "engaged".
    private var pressedBackground: Color {
        switch tier {
        case .primary: TapColors.btnPrimaryBgHover
        case .secondary: TapColors.btnSecondaryBgHover
        case .ghost: TapColors.btnGhostBgHover
        case .danger: TapColors.btnDangerBgHover
        }
    }

    private var foreground: Color {
        switch tier {
        case .primary: TapColors.btnPrimaryFg
        case .secondary: TapColors.btnSecondaryFg
        case .ghost: TapColors.btnGhostFg
        case .danger: TapColors.btnDangerFg
        }
    }

    private var border: Color {
        switch tier {
        case .primary: TapColors.btnPrimaryBorder
        case .secondary: TapColors.btnSecondaryBorder
        case .ghost: TapColors.btnGhostBorder
        case .danger: TapColors.btnDangerBorder
        }
    }
}

extension ButtonStyle where Self == TapButtonStyle {
    static var tapPrimary: TapButtonStyle { TapButtonStyle(tier: .primary) }
    static var tapSecondary: TapButtonStyle { TapButtonStyle(tier: .secondary) }
    static var tapGhost: TapButtonStyle { TapButtonStyle(tier: .ghost) }
    static var tapDanger: TapButtonStyle { TapButtonStyle(tier: .danger) }

    static func tap(
        _ tier: TapButtonStyle.Tier,
        size: TapButtonStyle.Size = .regular,
        fillsWidth: Bool = false
    ) -> TapButtonStyle {
        TapButtonStyle(tier: tier, size: size, fillsWidth: fillsWidth)
    }
}

private extension View {
    /// Only the prominent CTA is elevated — `.landing__create` is the one
    /// button on the web that carries `--shadow-elevated`.
    @ViewBuilder
    func tapShadowIfElevated(_ size: TapButtonStyle.Size) -> some View {
        switch size {
        case .regular: self
        case .prominent: self.tapShadow(TapShadows.shadowElevated)
        }
    }
}
