import SwiftUI

/// "How this works" behind the practice-priorities card and the per-round
/// waterfall: what the five rows are, what they are measured against, and — the
/// point of the sheet — how much of THIS reader's golf could be attributed.
///
/// Every sentence interpolates the reader's actual data (owner ruling,
/// 2026-08-02). The cards stay clean; the explanation lives here, and it is
/// specific or it is not shown. Copy is in `StatsCopy` so each line is one
/// assertable string, twin of the web's `SG_INFO_COPY`.
///
/// Same sheet anatomy as `HandicapInfoSheet`: Fraunces title + "Done" ghost,
/// `TapCard` bodies, scrolling on `TapColors.bg`.
struct StrokesGainedInfoSheet: View {
    /// The waterfall the card above is showing — a window's or one round's.
    let waterfall: StrokesLost
    /// The five row figures EXACTLY AS THE CARD ABOVE PRINTS THEM, in whatever
    /// order it prints them; nil derives them from `waterfall`. See
    /// `sentences(...)` for why card 5 sums these rather than quoting
    /// `sgTotalPer18`.
    var rowsPer18: [Double?]? = nil
    /// How many rounds the window holds. Ignored in the per-round variant.
    var windowRounds: Int = 1
    /// The per-round variant: "this round's holes", and no window wording.
    var perRound: Bool = false
    /// `SgTables.calibratedAt` of the baseline in force.
    var calibratedAt: String? = SgTablesV1.calibratedAt
    /// The labelled-penalty breakdown, or nil. The penalty BAR does not change
    /// — no stacked segments, no extra label; the breakdown lives here (§E.6).
    var penaltySource: PenaltySourceCounts? = nil

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TapSpacing.md) {
                ForEach(Array(cards.enumerated()), id: \.offset) { _, card in
                    infoCard(card)
                }
            }
            .padding(TapSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(TapColors.bg)
        .safeAreaInset(edge: .top, spacing: 0) { header }
        .accessibilityIdentifier("sg-info-sheet")
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text(StatsCopy.sgInfoTitle)
                .font(TapFont.display(size: 20, weight: .bold))
                .foregroundStyle(TapColors.text)
            Spacer(minLength: 0)
            Button("Done") { dismiss() }
                .buttonStyle(.tap(.ghost))
                .accessibilityIdentifier("sg-info-done")
        }
        .padding(.horizontal, TapSpacing.lg)
        .padding(.vertical, TapSpacing.md)
        .background(TapColors.bg)
    }

    // MARK: - Cards

    private struct Card {
        let title: String
        let sentence: String
    }

    private func infoCard(_ card: Card) -> some View {
        TapCard {
            VStack(alignment: .leading, spacing: 4) {
                Text(card.title)
                    .font(TapFont.ui(size: 12, weight: .semibold))
                    .foregroundStyle(TapColors.textMuted)
                    .textCase(.uppercase)
                Text(card.sentence)
                    .font(TapFont.ui(size: 14.4))
                    .foregroundStyle(TapColors.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(TapSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    /// The figure card 5 quotes: the sum of the rows on screen. Nil when any row
    /// is absent — the five are all-present or all-absent by construction, so a
    /// nil here means there is nothing to total, never a partial sum.
    static func rowSum(_ rows: [Double?]) -> Double? {
        if rows.isEmpty { return nil }
        var sum = 0.0
        for row in rows {
            guard let row else { return nil }
            sum += row
        }
        return sum
    }

    /// The five cards, in reading order. Pure and static so a test can assert
    /// every branch without a view host.
    ///
    /// Card 5 sums `rowsPer18` rather than quoting `sgTotalPer18` of the
    /// waterfall, because the two are not the same number: the dashboard's rows
    /// are means over rounds of each round's per-18, and the window total is a
    /// ratio of sums. Summing what is on screen is what makes "the five rows add
    /// up to …" a true sentence rather than an approximately true one. For one
    /// round the two agree by construction, so the per-round variant — which
    /// passes no rows and derives them here — is unchanged.
    static func sentences(
        waterfall: StrokesLost,
        rowsPer18: [Double?]? = nil,
        windowRounds: Int = 1,
        perRound: Bool = false,
        calibratedAt: String? = SgTablesV1.calibratedAt,
        penaltySource: PenaltySourceCounts? = nil
    ) -> [(title: String, sentence: String)] {
        var out: [(title: String, sentence: String)] = [
            (
                StatsCopy.sgInfoHolesCountedTitle,
                StatsCopy.sgInfoHolesCounted(
                    attributed: waterfall.coverage.attributed,
                    holesScored: waterfall.coverage.holesScored,
                    perRound: perRound)
            ),
            (StatsCopy.sgInfoFiveRowsTitle, StatsCopy.sgInfoFiveRows),
            (StatsCopy.sgInfoBaselineTitle, StatsCopy.sgInfoBaseline(calibratedAt: calibratedAt)),
            (
                StatsCopy.sgInfoPer18Title,
                StatsCopy.sgInfoPer18(minAttributed: StatMeasuresMath.minAttributedForDelta)
            ),
        ]
        // The total is the one card that can be absent: a round under the
        // per-18 floor has no comparable figure, and inventing one is the thing
        // this whole slice exists to stop.
        let rows =
            rowsPer18
            ?? StrokesLostComponent.allCases.map { StatMeasuresMath.sgPer18(waterfall, $0) }
        if let total = rowSum(rows) {
            out.append(
                (
                    StatsCopy.sgInfoTotalTitle,
                    StatsCopy.sgInfoTotal(
                        signedTotal: StatsFormat.signedNumber(total),
                        windowRounds: windowRounds,
                        perRound: perRound)
                ))
        }
        // Last card, and only when something was labelled. Absolute counts, not
        // percentages: the sample is usually tiny, and the display floor would
        // hide the whole card rather than degrade it.
        if let penaltySource {
            out.append(
                (
                    StatsCopy.penaltySourceInfoTitle,
                    StatsCopy.penaltySourceInfo(
                        recorded: penaltySource.recorded, tee: penaltySource.tee,
                        approach: penaltySource.approach, short: penaltySource.short)
                ))
        }
        return out
    }

    private var cards: [Card] {
        Self.sentences(
            waterfall: waterfall, rowsPer18: rowsPer18, windowRounds: windowRounds,
            perRound: perRound, calibratedAt: calibratedAt, penaltySource: penaltySource
        ).map { Card(title: $0.title, sentence: $0.sentence) }
    }
}

/// The four numbers behind the penalty-source card, and the gate in front of
/// it: the failable init IS the `penaltySourceRecorded > 0` rule, so a caller
/// cannot construct an empty breakdown to render.
struct PenaltySourceCounts: Equatable, Sendable {
    var recorded: Double
    var tee: Double
    var approach: Double
    var short: Double

    init?(_ m: StatMeasures) {
        guard m.penaltySourceRecorded > 0 else { return nil }
        recorded = m.penaltySourceRecorded
        tee = m.penaltiesTee
        approach = m.penaltiesApproach
        short = m.penaltiesShort
    }
}
