import SwiftUI

/// What a module card's "How this works" sheet says, for THIS reader.
///
/// The owner's polish-pass ruling (2026-08-02) took every explainer sentence off
/// the rows: a card is label + bar + value, and the prose that used to sit under
/// a figure moved in here. Nothing was rewritten in the move — each body opens
/// with the SAME `StatsCopy` sentence the row carried, because that prose has
/// already passed the owner's ear, and this pass is not the place to invent a
/// second voice for it.
///
/// What is new is the last sentence of every body: the reader's own denominator.
/// A card that could have been written before the data loaded is a card written
/// wrong — that is the whole reason the explainers left the rows, where they
/// were static text, for a sheet where they are about the player.
///
/// Twin of `src/stats/panel-info-cards.ts`.

/// One card of a panel's sheet: a short title and one paragraph. The same
/// anatomy as `StrokesGainedInfoSheet`'s cards, and it renders through the same
/// layout — a reader who has opened the priorities sheet has already met this
/// shape.
struct StatsInfoCard: Identifiable, Equatable, Sendable {
    var id: String
    var title: String
    var body: String
}

enum StatsPanelInfo {
    /// "Measured over 24 greens." — omitted entirely at a zero denominator.
    /// Never "Measured over 0 holes.": a sample sentence about no sample is
    /// worse than no sentence.
    static func measuredOver(_ d: Double, _ unit: StatsFormat.SampleUnit) -> String? {
        d > 0 ? "Measured over \(StatsFormat.quantity(d, unit))." : nil
    }

    /// "Measured over 9 holes with a penalty vs 45 without." — for a tax's two
    /// sides, off the existing `*Sample` helpers.
    static func measured(_ sample: String?) -> String? {
        sample.map { "Measured \($0)." }
    }

    /// One paragraph from its sentences, dropping the ones that had nothing to
    /// say.
    static func body(_ parts: String?...) -> String {
        parts.compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " ")
    }

    private static func card(_ id: String, _ title: String, _ text: String) -> StatsInfoCard {
        StatsInfoCard(id: id, title: title, body: text)
    }

    /// The sheet's cards for one module card, in reading order.
    ///
    /// Empty for a panel the window has no data for — the view then omits the
    /// trigger altogether, because a sheet with nothing in it must not be
    /// reachable.
    ///
    /// `baseline` is REQUIRED, with no default: the putting sheet names the
    /// reader's own reference tier, and a default is how a call site that forgot
    /// to thread the selected cohort compiles clean and then tells the reader
    /// they are being measured against a tier they never picked.
    static func cards(
        _ id: StatsPanelID, _ model: StatsDashboardModel, _ baseline: SgBaselineContext
    ) -> [StatsInfoCard] {
        switch id {
        case .tee:
            guard let p = model.tee else { return [] }
            return [
                card(
                    "teeFan", "Where your tee shots finish",
                    body(StatsCopy.teeFan, measuredOver(p.fan.recorded, .holes))),
                card(
                    "vsParByTee", "What each tee shot cost",
                    body(
                        StatsCopy.vsParByTee, StatsCopy.troubleTax,
                        measured(StatsFormat.troubleTaxSample(p.vsParByTee)))),
                card(
                    "recovery", "Recovery",
                    body(StatsCopy.recovery, measuredOver(p.recovery.d, .holes))),
                card(
                    "penalties", "Penalties",
                    body(
                        StatsCopy.penalties, measuredOver(p.penaltiesRecordedHoles, .holes),
                        measured(StatsFormat.penaltyTaxSample(p.vsParByPenalty)))),
            ]
        case .approach:
            guard let p = model.approach else { return [] }
            return [
                card(
                    "greenMiss", "Where you miss the green",
                    body(StatsCopy.greenMiss, measuredOver(p.greenMissRecorded, .holes))),
                card(
                    "proximity", "Proximity with GIR",
                    // Every bucket of the mix shares one denominator by
                    // construction, so the shortest bucket's `d` IS the sample.
                    body(
                        StatsCopy.proximityProxy,
                        measuredOver(p.girFirstPuttMix[.inside1m]?.d ?? 0, .greens))),
                card(
                    "birdieConversion", "Birdie conversion",
                    body(StatsCopy.birdieConversion, measuredOver(p.birdieConversion.d, .greens))),
                card(
                    "hardChipShare", "Hard misses",
                    body(StatsCopy.hardChipShare, measuredOver(p.hardChipShare.d, .holes))),
                card(
                    "missedGreenTax", "Cost of a missed green",
                    body(
                        StatsCopy.missedGreenTax,
                        measured(StatsFormat.missedGreenTaxSample(p.costOfMissedGreen)))),
            ]
        case .putting:
            guard let p = model.putting else { return [] }
            return [
                card(
                    "firstPuttSpread", "First putt, all holes",
                    body(
                        StatsCopy.firstPuttSpread,
                        measuredOver(p.firstPuttSpread[.inside1m]?.d ?? 0, .holes))),
                card(
                    "ladder", "Holed on the first putt",
                    // The cohort sentence, in the same pointer phrasing the
                    // priorities sheet uses: both the tick and the cost follow
                    // the selector, so the sheet has to say which tier is on.
                    body(
                        StatsCopy.ladderBaseline, StatsCopy.ladderCost,
                        "Measured against the \(baseline.cohort.title) reference — change it "
                            + "under \u{201C}\(SgBaselineCopy.pickerLabel)\u{201D} in Filters.")),
                card(
                    "threePutt", "Three or more putts",
                    body(
                        StatsCopy.threePutt, StatsCopy.longThreePutt,
                        measuredOver(p.threePutt.d, .holes))),
                card(
                    "puttsPerGir", "Putts per green hit",
                    body(StatsCopy.puttsPerGir, measuredOver(p.puttsPerGirHole.d, .greens))),
                card(
                    "puttsAfterMissedGreen", "Putts after a missed green",
                    body(
                        StatsCopy.puttsAfterMissedGreen,
                        measuredOver(p.puttsAfterMissedGreen.d, .holes))),
            ]
        case .shortGame:
            guard let p = model.shortGame else { return [] }
            let attempts = p.scramble.standard.d + p.scramble.hard.d + p.scramble.bunker.d
            return [
                card(
                    "scrambling", "Scrambling",
                    body(
                        StatsCopy.sandSave, StatsCopy.multiChip, StatsCopy.multiChipBunker,
                        StatsCopy.extraShortGameStrokes, measuredOver(attempts, .holes))),
                card(
                    "chipInside2m", "Chipped to inside 2 m",
                    body(
                        StatsCopy.conversionInside2m,
                        measuredOver(p.conversionInside2m.d, .holes))),
                // Counts, not rates: there is no denominator to report, so the
                // card is the sentence alone.
                card("chipIns", "Chip-ins", StatsCopy.chipIns),
            ]
        case .scoring:
            guard let p = model.scoring else { return [] }
            return [
                card(
                    "doubles", "Doubles or worse",
                    body(
                        StatsCopy.doubleBogeyPlus,
                        measuredOver(p.doubleBogeyPlusPerRound.d, .rounds))),
                card(
                    "bounceBack", "Bounce-back",
                    body(StatsCopy.bounceBack, measuredOver(p.bounceBack.d, .holes))),
            ]
        }
    }
}

/// The sheet itself. Same anatomy as `StrokesGainedInfoSheet`: Fraunces title +
/// "Done" ghost, `TapCard` bodies, scrolling on `TapColors.bg`.
struct StatsPanelInfoSheet: View {
    var title: String
    var cards: [StatsInfoCard]

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TapSpacing.md) {
                ForEach(cards) { card in
                    infoCard(card)
                }
            }
            .padding(TapSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(TapColors.bg)
        .safeAreaInset(edge: .top, spacing: 0) { header }
        .accessibilityIdentifier("stats-panel-info-sheet")
    }

    private var header: some View {
        HStack {
            Text(title)
                .font(TapFont.display(size: 20, weight: .bold))
                .foregroundStyle(TapColors.text)
            Spacer(minLength: 0)
            Button("Done") { dismiss() }
                .buttonStyle(.tap(.ghost))
                .accessibilityIdentifier("stats-panel-info-done")
        }
        .padding(.horizontal, TapSpacing.lg)
        .padding(.vertical, TapSpacing.md)
        .background(TapColors.bg)
    }

    private func infoCard(_ card: StatsInfoCard) -> some View {
        TapCard {
            VStack(alignment: .leading, spacing: 4) {
                Text(card.title)
                    .font(TapFont.ui(size: 12, weight: .semibold))
                    .foregroundStyle(TapColors.textMuted)
                    .textCase(.uppercase)
                Text(card.body)
                    .font(TapFont.ui(size: 14.4))
                    .foregroundStyle(TapColors.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(TapSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
