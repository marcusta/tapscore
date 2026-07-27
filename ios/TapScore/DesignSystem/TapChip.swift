import SwiftUI

/// A pill in a horizontally scrolling selector.
///
/// Source: `.round-view__fmt` (the format chips) and `.round-view__grp` (the
/// playing-group chips) in `src/round/round.component.ts`. Same anatomy in
/// both: pill radius, 1px `--border`, `--btn-bg` fill, `--text` label at
/// 0.85rem/700, `s('sm') s('lg')` padding. The two differ only in what the
/// SELECTED state fills with, which is what `Tone` names.
struct TapChip: View {
    enum Tone {
        /// Format chips — selected fills `--primary` (fairway green).
        case primary
        /// Playing-group chips — selected fills `--accent` (brass), so a group
        /// switch never reads as a format switch.
        case accent
    }

    let title: String
    var isSelected: Bool = false
    var tone: Tone = .primary
    var action: () -> Void = {}

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(TapFont.ui(size: 13.6, weight: .bold))
                .lineLimit(1)
                .foregroundStyle(isSelected ? TapColors.primaryText : TapColors.text)
                .padding(.vertical, TapSpacing.sm)
                .padding(.horizontal, TapSpacing.lg)
                .background(
                    Capsule().fill(isSelected ? selectedFill : TapColors.btnBg)
                )
                .overlay(
                    Capsule().strokeBorder(isSelected ? selectedFill : TapColors.border, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? [.isSelected] : [])
    }

    private var selectedFill: Color {
        switch tone {
        case .primary: TapColors.primary
        case .accent: TapColors.accent
        }
    }
}
