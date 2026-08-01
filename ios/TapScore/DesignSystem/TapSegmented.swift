import SwiftUI

/// A bounded choice of two or three SHORT options, laid out as one control.
///
/// Source: `.fslot__seg` in `src/create/create.component.ts`. The selection
/// reads from ELEVATION — a raised pill on a sunken track — never from a
/// saturated fill: a solid `--primary` slab is reserved for primary actions,
/// and a knob that records a preference must not look like a Save button
/// (`docs/design-guidelines.md` §2).
///
/// The track sizes to its CONTENT, so a short pair sits inline beside its
/// label rather than stretching edge to edge. Anything with long option text,
/// four-plus options, or an unbounded list is not this control — see §1 of the
/// same doc.
struct TapSegmented<Value: Hashable>: View {
    struct Option {
        let value: Value
        let title: String

        init(value: Value, title: String) {
            self.value = value
            self.title = title
        }
    }

    let options: [Option]
    let selected: Value
    var onSelect: (Value) -> Void = { _ in }

    var body: some View {
        HStack(spacing: 2) {
            ForEach(options, id: \.value) { option in
                let isSelected = option.value == selected
                Button(action: { onSelect(option.value) }) {
                    Text(option.title)
                        .font(TapFont.ui(size: 13.6, weight: isSelected ? .bold : .medium))
                        .lineLimit(1)
                        .foregroundStyle(isSelected ? TapColors.text : TapColors.textMuted)
                        .padding(.vertical, TapSpacing.xs)
                        .padding(.horizontal, TapSpacing.md)
                        .background(
                            Capsule().fill(isSelected ? TapColors.surface : .clear)
                        )
                        .overlay(
                            Capsule().strokeBorder(
                                isSelected ? TapColors.border : .clear, lineWidth: 1)
                        )
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(isSelected ? [.isSelected] : [])
            }
        }
        .padding(3)
        .background(
            Capsule().fill(TapColors.surfaceSunken)
        )
        .overlay(
            Capsule().strokeBorder(TapColors.border, lineWidth: 1)
        )
    }
}
