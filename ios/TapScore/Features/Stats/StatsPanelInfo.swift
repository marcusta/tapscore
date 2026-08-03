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
/// TWO rules govern which cards exist, both from the owner's 2026-08-03 read:
///
/// 1. A CARD TITLE IS A ROW NAME, VERBATIM. Anywhere the screen uses a word of
///    its own — "Trouble tax", "Penalty tax", "Missed-green tax", "Sand save" —
///    that exact string is a HEADING here, not a clause inside a section card. A
///    reader who does not know what a tax is in golf scans headings for the word
///    they just read; a definition filed under "What each tee shot cost" is a
///    definition they will not find. Section-shaped cards survive only where the
///    row names they cover are already plain English.
/// 2. EVERY DENOMINATOR THE ROWS DROPPED LANDS HERE. Figure rows print the bare
///    value now, so this sheet is the only place the sample is stated. A group
///    of parallel rows states its legs in one sentence (`groupSample`), because
///    the rows partition one sample and how it split is the interesting part.
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

    /// The penalties figure is per ROUND, but it only exists on holes where the
    /// question was answered — so its honest sample is both numbers.
    ///
    /// Gated on the recorded holes rather than on `penaltiesPerRound.d`, which
    /// is the window's round count whatever anyone recorded: without the gate a
    /// window that never answered the penalty question would claim "over 3
    /// rounds" for a figure the card does not even show.
    private static func penaltiesSample(_ p: StatsTeePanel) -> String? {
        guard p.penaltiesRecordedHoles > 0 else { return nil }
        return StatsFormat.groupSample([
            (p.penaltiesPerRound.d, .rounds),
            (p.penaltiesRecordedHoles, .holes),
        ])
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
                // Titled with the subhead the three rows sit under, word for
                // word. The trouble tax used to be explained inside this card;
                // it now has its own, below, because "Trouble tax" is the string
                // a puzzled reader is scanning for.
                card(
                    "vsParByTee", "Average vs par, by where the tee shot finished",
                    body(
                        StatsCopy.vsParByTee,
                        measured(StatsFormat.vsParByTeeSample(p.vsParByTee)))),
                card(
                    "troubleTax", "Trouble tax",
                    body(
                        StatsCopy.troubleTax,
                        measured(StatsFormat.troubleTaxSample(p.vsParByTee)))),
                card(
                    "recovery", "Recovery",
                    body(StatsCopy.recovery, measuredOver(p.recovery.d, .holes))),
                card(
                    "penalties", "Penalties",
                    body(StatsCopy.penalties, measured(penaltiesSample(p)))),
                card(
                    "penaltyTax", "Penalty tax",
                    body(
                        StatsCopy.penaltyTax,
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
                    "costOfMissedGreen", "Cost of a missed green",
                    body(
                        StatsCopy.costOfMissedGreen,
                        measured(StatsFormat.missedGreenSample(p.costOfMissedGreen)))),
                // The tax gets the row's own name as its heading, and its own
                // two-sided sample: the group card above states the two legs as
                // a partition, this one states them as a comparison.
                card(
                    "missedGreenTax", "Missed-green tax",
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
                card(
                    "puttsByPar", "Putts per hole, by par",
                    body(
                        StatsCopy.puttsByPar,
                        measured(StatsFormat.byParSample(p.puttsPerHoleByPar)))),
            ]
        case .shortGame:
            guard let p = model.shortGame else { return [] }
            let attempts = p.scramble.standard.d + p.scramble.hard.d + p.scramble.bunker.d
            return [
                // Five rows, five cards. This used to be ONE card that opened
                // "Scrambling" and then ran four unrelated definitions together,
                // which put the meaning of "Sand save" — the app's own
                // vocabulary for the bunker scramble — three sentences deep
                // under a heading that does not contain the word.
                card(
                    "scrambling", "Scrambling",
                    body(StatsCopy.scrambling, measuredOver(attempts, .holes))),
                card(
                    "sandSave", "Sand save",
                    body(StatsCopy.sandSave, measuredOver(p.sandSave.d, .holes))),
                card(
                    "multiChipBunker", "More than one from sand",
                    body(
                        StatsCopy.multiChipBunker,
                        measuredOver(p.multiChipFromBunker.d, .holes))),
                card(
                    "extraShortGameStrokes", "Extra short-game shots",
                    body(
                        StatsCopy.extraShortGameStrokes,
                        measuredOver(p.shortGameStrokesRecorded, .holes))),
                card(
                    "multiChip", "More than one chip",
                    body(StatsCopy.multiChip, measuredOver(p.multiChip.d, .holes))),
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
                    "vsPar", "Average vs par",
                    body(
                        StatsCopy.avgVsParByPar,
                        measured(StatsFormat.byParSample(p.avgVsParByParGroup)))),
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
