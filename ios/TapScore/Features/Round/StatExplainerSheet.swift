import SwiftUI

/// "What these mean" behind the capture step: one card per prompt that is
/// CURRENTLY on the card, in shot order, title = the prompt's own label, text =
/// its explainer.
///
/// Same anatomy as `StrokesGainedInfoSheet` — Fraunces title, "Done" ghost,
/// `TapCard` bodies on `TapColors.bg`. One sheet, not eleven popovers: the
/// capture card must stay wordless, and a per-prompt glyph would put eleven of
/// them on it.
struct StatExplainerSheet: View {
    /// The visible prompts, exactly as the step ordered them.
    let prompts: [StatPrompt]

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TapSpacing.md) {
                ForEach(prompts) { prompt in
                    card(title: prompt.label, text: StatExplainers.explainer(prompt.key))
                }
            }
            .padding(TapSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(TapColors.bg)
        .safeAreaInset(edge: .top, spacing: 0) { header }
        .accessibilityIdentifier("stat-explainer-sheet")
    }

    private var header: some View {
        HStack {
            Text(StatsCopy.statExplainerTitle)
                .font(TapFont.display(size: 20, weight: .bold))
                .foregroundStyle(TapColors.text)
            Spacer(minLength: 0)
            Button("Done") { dismiss() }
                .buttonStyle(.tap(.ghost))
                .accessibilityIdentifier("stat-explainer-done")
        }
        .padding(.horizontal, TapSpacing.lg)
        .padding(.vertical, TapSpacing.md)
        .background(TapColors.bg)
    }

    private func card(title: String, text: String) -> some View {
        TapCard {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(TapFont.ui(size: 12, weight: .semibold))
                    .foregroundStyle(TapColors.textMuted)
                    .textCase(.uppercase)
                Text(text)
                    .font(TapFont.ui(size: 14.4))
                    .foregroundStyle(TapColors.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(TapSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
