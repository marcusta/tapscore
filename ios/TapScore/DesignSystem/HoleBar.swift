import SwiftUI

/// The gold hole bar — the top half of the round screen's pinned bottom dock.
///
/// Source: `.round-hole` in `src/round/round.component.ts`. `--hole-bar`
/// (#e6a23f light / #c08a35 dark) fill with `--hole-bar-text` ink, three
/// centred stat columns in the web's order — **Par, Hole, SI** — and a 40pt
/// round nav affordance at each end tinted with a flat 10% black wash (20% while
/// pressed), which is why they read the same on either appearance's gold.
///
/// The values are Fraunces 700 with tabular figures: the number must not shift
/// sideways as the hole advances from 9 to 10.
struct HoleBar: View {
    /// The hole's printed label. A STRING, not an `Int`, because a route may
    /// play one physical hole twice and the round screen labels the second
    /// visit "7 (2nd)" (`RoundStore.occurrenceLabel`). The `Int` initialiser
    /// below keeps the simple call sites reading as numbers.
    let holeLabel: String
    let par: Int?
    /// Stroke index. Nil renders "–" rather than collapsing the column, so the
    /// three stats keep their positions on a course with no SI data.
    let strokeIndex: Int?
    var canGoPrevious: Bool = true
    var canGoNext: Bool = true
    var onPrevious: () -> Void = {}
    var onNext: () -> Void = {}

    init(
        holeLabel: String,
        par: Int?,
        strokeIndex: Int?,
        canGoPrevious: Bool = true,
        canGoNext: Bool = true,
        onPrevious: @escaping () -> Void = {},
        onNext: @escaping () -> Void = {}
    ) {
        self.holeLabel = holeLabel
        self.par = par
        self.strokeIndex = strokeIndex
        self.canGoPrevious = canGoPrevious
        self.canGoNext = canGoNext
        self.onPrevious = onPrevious
        self.onNext = onNext
    }

    init(
        hole: Int,
        par: Int?,
        strokeIndex: Int?,
        canGoPrevious: Bool = true,
        canGoNext: Bool = true,
        onPrevious: @escaping () -> Void = {},
        onNext: @escaping () -> Void = {}
    ) {
        self.init(
            holeLabel: String(hole),
            par: par,
            strokeIndex: strokeIndex,
            canGoPrevious: canGoPrevious,
            canGoNext: canGoNext,
            onPrevious: onPrevious,
            onNext: onNext
        )
    }

    var body: some View {
        HStack(spacing: TapSpacing.md) {
            navButton(
                systemName: "chevron.left",
                label: "Previous hole",
                enabled: canGoPrevious,
                action: onPrevious
            )
            Spacer(minLength: 0)
            HStack(spacing: TapSpacing.xxl) {
                stat("Par", par.map(String.init) ?? "–")
                stat("Hole", holeLabel)
                stat("SI", strokeIndex.map(String.init) ?? "–")
            }
            Spacer(minLength: 0)
            navButton(
                systemName: "chevron.right",
                label: "Next hole",
                enabled: canGoNext,
                action: onNext
            )
        }
        .padding(.vertical, TapSpacing.sm)
        .padding(.horizontal, TapSpacing.lg)
        .background(TapColors.holeBar)
        .foregroundStyle(TapColors.holeBarText)
    }

    private func stat(_ label: String, _ value: String) -> some View {
        VStack(spacing: 0) {
            Text(label.uppercased())
                // 0.62rem / 700 / 0.06em, at 80% — a caption under a number.
                .font(TapFont.ui(size: 9.9, weight: .bold))
                .tracking(9.9 * 0.06)
                .opacity(0.8)
            Text(value)
                .font(TapFont.display(size: 22.4, weight: .bold, tabular: true))
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(label) \(value)")
    }

    private func navButton(
        systemName: String,
        label: String,
        enabled: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 22, weight: .semibold))
                .frame(width: 40, height: 40)
                .contentShape(Circle())
        }
        .buttonStyle(HoleBarNavStyle())
        .disabled(!enabled)
        // Web: `&:disabled { opacity: 0.35 }` — the control stays in place so
        // the bar's geometry never jumps at the first or last hole.
        .opacity(enabled ? 1 : 0.35)
        .accessibilityLabel(label)
    }
}

/// Web: `.round-hole__nav` — `rgba(0, 0, 0, 0.1)`, `0.2` while pressed.
private struct HoleBarNavStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(
                Circle().fill(Color.black.opacity(configuration.isPressed ? 0.2 : 0.1))
            )
    }
}
