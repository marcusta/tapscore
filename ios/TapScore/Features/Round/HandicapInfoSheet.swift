import SwiftUI

/// The ⓘ behind a score row's handicap line: how this ball's number was
/// derived, one card per step, under the format the header chips have
/// selected.
///
/// The server sends the chain as structured numbers
/// (`RoundBallSlot.handicapDerivation` — a closed step vocabulary, same
/// philosophy as the result sections); every sentence here is client prose so
/// the tone and the WHS explanation can change without a server release.
/// Sentence first, arithmetic as small print: most players do not know the
/// WHS formula and must not need it to follow the story.
///
/// Same sheet anatomy as `RoundManageSheet`: Fraunces title + "Done" ghost,
/// scrolling body on `TapColors.bg`.
struct HandicapInfoSheet: View {
    let ballName: String
    /// Catalog label of the selected format ("Taliban") — the popup explains
    /// the number *under that format*, so it has to say which one.
    let formatLabel: String?
    let derivation: HandicapDerivation

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TapSpacing.md) {
                if let formatLabel {
                    Text(formatLabel)
                        .font(TapFont.ui(size: 12.8, weight: .semibold))
                        .foregroundStyle(TapColors.textMuted)
                        .textCase(.uppercase)
                }

                ForEach(Array(cards.enumerated()), id: \.offset) { _, card in
                    stepCard(card)
                }

                // The destination of the whole chain, said plainly.
                HStack(spacing: TapSpacing.sm) {
                    Text("Plays off")
                        .font(TapFont.ui(size: 14.4, weight: .semibold))
                        .foregroundStyle(TapColors.text)
                    Text(jsNumberString(derivation.effectivePh))
                        .font(TapFont.display(size: 21.6, weight: .bold, tabular: true))
                        .foregroundStyle(TapColors.accent)
                }
                .padding(.top, TapSpacing.xs)
            }
            .padding(TapSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(TapColors.bg)
        .safeAreaInset(edge: .top, spacing: 0) { header }
        .accessibilityIdentifier("handicap-info-sheet")
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text(ballName)
                .font(TapFont.display(size: 20, weight: .bold))
                .foregroundStyle(TapColors.text)
                .lineLimit(1)
            Spacer(minLength: 0)
            Button("Done") { dismiss() }
                .buttonStyle(.tap(.ghost))
                .accessibilityIdentifier("handicap-info-done")
        }
        .padding(.horizontal, TapSpacing.lg)
        .padding(.vertical, TapSpacing.md)
        .background(TapColors.bg)
    }

    // MARK: - Cards

    /// One rendered step: what happened, in words; the arithmetic underneath.
    private struct Card {
        let title: String
        let sentence: String
        /// The formula with the player's numbers substituted — small print.
        var arithmetic: String?
        /// The step's output, shown as the card's trailing number.
        let result: Double
    }

    private func stepCard(_ card: Card) -> some View {
        TapCard {
            HStack(alignment: .top, spacing: TapSpacing.md) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(card.title)
                        .font(TapFont.ui(size: 12, weight: .semibold))
                        .foregroundStyle(TapColors.textMuted)
                        .textCase(.uppercase)
                    Text(card.sentence)
                        .font(TapFont.ui(size: 14.4))
                        .foregroundStyle(TapColors.text)
                        .fixedSize(horizontal: false, vertical: true)
                    if let arithmetic = card.arithmetic {
                        Text(arithmetic)
                            .font(TapFont.ui(size: 12))
                            .foregroundStyle(TapColors.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer(minLength: 0)
                Text(jsNumberString(card.result))
                    .font(TapFont.display(size: 18, weight: .bold, tabular: true))
                    .foregroundStyle(TapColors.text)
            }
            .padding(TapSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var cards: [Card] {
        derivation.steps.compactMap { step in
            switch step {
            case .courseHandicap(let s):
                return courseHandicapCard(s)
            case .teamCombination(let s):
                return teamCombinationCard(s)
            case .allowance(let s):
                return allowanceCard(s)
            case .matchDelta(let s):
                return matchDeltaCard(s)
            }
        }
    }

    private func courseHandicapCard(_ s: HandicapDerivationStepsItemCourseHandicap) -> Card {
        // The full WHS story needs every formula input; a legacy snapshot
        // without them still gets an honest, shorter card.
        if let hi = s.handicapIndex, let slope = s.slope, let rating = s.courseRating,
           let par = s.par {
            return Card(
                title: "Course handicap · \(s.producerLabel)",
                sentence:
                    "Exact handicap \(jsNumberString(hi)), adjusted for the difficulty of these tees.",
                arithmetic:
                    "\(jsNumberString(hi)) × \(jsNumberString(slope)) ÷ 113 + (\(jsNumberString(rating)) − \(jsNumberString(par))), rounded — the World Handicap System formula.",
                result: s.result
            )
        }
        return Card(
            title: "Course handicap · \(s.producerLabel)",
            sentence: "The handicap \(s.producerLabel) plays this course off.",
            arithmetic: nil,
            result: s.result
        )
    }

    private func teamCombinationCard(_ s: HandicapDerivationStepsItemTeamCombination) -> Card {
        let parts = s.parts
            .map { "\(jsNumberString($0.pct))% of \($0.producerLabel)'s \(jsNumberString($0.ch))" }
            .joined(separator: " + ")
        return Card(
            title: "Team handicap",
            sentence: "The team plays off a share of each member's handicap.",
            arithmetic: "\(parts), rounded.",
            result: s.result
        )
    }

    private func allowanceCard(_ s: HandicapDerivationStepsItemAllowance) -> Card? {
        // Full allowance changes nothing — a card saying "× 100%" is noise.
        guard s.pct != 100 else { return nil }
        return Card(
            title: "Allowance",
            sentence: formatLabel.map { "\($0) is played at \(jsNumberString(s.pct))% handicap." }
                ?? "This format is played at \(jsNumberString(s.pct))% handicap.",
            arithmetic: nil,
            result: s.result
        )
    }

    private func matchDeltaCard(_ s: HandicapDerivationStepsItemMatchDelta) -> Card {
        if s.ownPh == s.lowestPh {
            return Card(
                title: "Match difference",
                sentence:
                    "Lowest handicap in the match — plays off scratch, and the others get the difference.",
                arithmetic: nil,
                result: s.result
            )
        }
        return Card(
            title: "Match difference",
            sentence:
                "In match formats only the difference matters: the lowest ball plays off 0, this ball gets the rest.",
            arithmetic: "\(jsNumberString(s.ownPh)) − \(jsNumberString(s.lowestPh)) = \(jsNumberString(s.result)).",
            result: s.result
        )
    }
}
