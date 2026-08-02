import SwiftUI

/// The §3 module panels, flattened to a list of BLOCKS the view renders.
///
/// Every display decision lives in `blocks(_:_:)`, not in the view: which rows a
/// panel shows, in what order, what a nil reads as, and whether a bar is drawn
/// at all. The view's job is one template per block kind. That split is what
/// makes the §E.3 walk assertable — a test reads the same list the screen does,
/// so the catalogue and the drawing cannot drift.
///
/// Nothing here computes a rate: everything arrives as a `Rate` from the model
/// and leaves as a formatted `String?` or a share in `0…1`.
///
/// Rows carry NO explainer prose (owner ruling, 2026-08-02). Every sentence that
/// used to sit under a figure now lives in the card's "How this works" sheet
/// (`StatsPanelInfo`), joined to the reader's own denominator instead of
/// standing as static text under every row.
///
/// Twin of `src/stats/stats-panel-blocks.ts` — same catalogue, same order, same
/// wording, same ids.

// MARK: - Blocks

/// One row (or one picture) inside an open panel.
///
/// There is deliberately no `note` case: the owner ruling took row-level
/// explanations off the cards entirely, and a kind that cannot be emitted is
/// better than a kind that can.
enum StatsBlock: Identifiable {
    /// A small uppercase heading inside a panel.
    case subhead(id: String, text: String)
    /// The tee card's proportional bar and its key.
    case split(id: String, segments: [StatsSplitBar.Segment], legend: [StatsLegendItem])
    /// The tee-shot fan: the picture, and the same reading as words.
    case fan(id: String, segments: [StatsFanGeometry.Segment], text: String)
    /// The green-miss compass: picture, in-picture labels, and the words.
    case compass(
        id: String, sectors: [StatsCompassGeometry.Sector],
        labels: [StatsCompassGeometry.Direction: String], text: String)
    /// Title, bar, value. `share` is nil only at a zero denominator, and then
    /// `value` is nil too and the column carries the placeholder.
    case bar(id: String, title: String, share: Double?, value: String?)
    /// One rung of the putting ladder: bar against a baseline tick, the make
    /// reading, and what the distance cost against the selected cohort.
    case rung(
        id: String, title: String, made: Double?, baseline: Double, value: String?, cost: String)
    /// Right-aligned column headers over the fixed value columns below them.
    case columns(id: String, cells: [String])
    /// Title and value. A nil value prints "Not recorded" — a figure row has the
    /// width for words, which a rate row's 56 pt column does not.
    case figure(id: String, title: String, value: String?)

    var id: String {
        switch self {
        case .subhead(let id, _), .split(let id, _, _), .fan(let id, _, _),
            .compass(let id, _, _, _), .bar(let id, _, _, _), .rung(let id, _, _, _, _, _),
            .columns(let id, _), .figure(let id, _, _):
            return id
        }
    }

    /// The block's kind as a word — what the §E.3 walk asserts alongside `id`.
    var kind: String {
        switch self {
        case .subhead: return "subhead"
        case .split: return "split"
        case .fan: return "fan"
        case .compass: return "compass"
        case .bar: return "bar"
        case .rung: return "rung"
        case .columns: return "columns"
        case .figure: return "figure"
        }
    }

    /// `"bar:girPar3"` — one string per block, so the walk is a list of them.
    var walk: String { "\(kind):\(id)" }

    /// The value column's text, for a row that has one.
    var value: String? {
        switch self {
        case .bar(_, _, _, let value), .rung(_, _, _, _, let value, _), .figure(_, _, let value):
            return value
        default: return nil
        }
    }

    /// The bar's length, for a row that draws one.
    var share: Double? {
        switch self {
        case .bar(_, _, let share, _), .rung(_, _, let share, _, _, _): return share
        default: return nil
        }
    }

    /// The ladder's cost column.
    var cost: String? {
        if case .rung(_, _, _, _, _, let cost) = self { return cost }
        return nil
    }

    var title: String? {
        switch self {
        case .bar(_, let title, _, _), .rung(_, let title, _, _, _, _),
            .figure(_, let title, _):
            return title
        case .subhead(_, let text): return text
        default: return nil
        }
    }
}

// MARK: - Primitives

/// A small uppercase heading inside a panel.
struct StatsSubhead: View {
    var text: String

    var body: some View {
        Text(text)
            .font(TapFont.ui(size: 11.2, weight: .bold))
            .tracking(11.2 * 0.06)
            .foregroundStyle(TapColors.textMuted)
            .textCase(.uppercase)
    }
}

/// One label / value row. A nil value is the display policy's absent case and
/// prints "Not recorded".
///
/// No `hint` any more: the panels emit blocks, and the per-round hole sheet —
/// this type's only remaining caller — never carried an explanation line.
struct StatsFigure: Identifiable, Equatable, Sendable {
    var title: String
    var value: String?

    var id: String { title }

    init(_ title: String, _ value: String?) {
        self.title = title
        self.value = value
    }
}

struct StatsFigureRows: View {
    var items: [StatsFigure]

    var body: some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            ForEach(items) { item in
                HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                    Text(item.title)
                        .font(TapFont.ui(size: 13.6))
                        .foregroundStyle(TapColors.text)
                    Spacer(minLength: 0)
                    Text(item.value ?? StatsCopy.notRecorded)
                        .font(TapFont.ui(size: 13.6, weight: .bold))
                        .foregroundStyle(
                            item.value == nil ? TapColors.textMuted : TapColors.text)
                }
                .accessibilityElement(children: .combine)
            }
        }
    }
}

/// One figure of the Results card: the NUMBER first, its label under it, and at
/// most one small muted qualifier line.
///
/// The qualifier is nil unless this figure's denominator diverges from the
/// section's round count — the divergence IS the signal, which is why the card
/// carries no "thin sample" wording anywhere. There are no explanation
/// sentences here at all: labels, not sentences.
struct ResultsTile: Identifiable, Equatable, Sendable {
    /// `avgVsPar`, or `best-<holeCount>`.
    var id: String
    var label: String
    var value: String
    var qualifier: String?
    /// True for exactly one tile: the view enlarges it and gives it the row.
    var hero: Bool
}

/// One bucket of the score-type histogram.
struct ResultsHistogramRow: Identifiable, Equatable, Sendable {
    var id: ScoreType
    var title: String
    /// Bar length in [0,1]; nil only when there is no denominator at all.
    var share: Double?
    var value: String
}

/// The score-type histogram: a label, a neutral proportional bar, a share.
///
/// Same geometry as every other rate row on the screen (`StatsBarMetrics`) —
/// the 84 pt track this used to carry was the width drift the polish pass
/// removed.
struct StatsScoreTypeRows: View {
    var items: [ResultsHistogramRow]

    var body: some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            ForEach(items) { item in
                HStack(spacing: StatsBarMetrics.gap) {
                    Text(item.title)
                        .font(TapFont.ui(size: 13.6))
                        .foregroundStyle(TapColors.text)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    // No new colour: these are shares of a whole, not
                    // judgements, and the label already says which end is good.
                    StatsMiniBar(share: item.share)
                        .frame(width: StatsBarMetrics.track)
                    Text(item.value)
                        .font(TapFont.ui(size: 13.6))
                        .monospacedDigit()
                        .foregroundStyle(TapColors.text)
                        .frame(width: StatsBarMetrics.value, alignment: .trailing)
                }
                .accessibilityElement(children: .combine)
            }
        }
    }
}

/// A colour swatch, a name and a reading — the key under a split bar.
struct StatsLegendItem: Identifiable {
    var title: String
    var color: Color
    var value: String?

    var id: String { title }

    init(_ title: String, _ color: Color, _ value: String?) {
        self.title = title
        self.color = color
        self.value = value
    }
}

struct StatsLegendRows: View {
    var items: [StatsLegendItem]

    var body: some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            ForEach(items) { item in
                HStack(spacing: TapSpacing.sm) {
                    Circle().fill(item.color).frame(width: 8, height: 8)
                    Text(item.title)
                        .font(TapFont.ui(size: 13.6))
                        .foregroundStyle(TapColors.text)
                    Spacer(minLength: 0)
                    Text(item.value ?? StatsCopy.notRecorded)
                        .font(TapFont.ui(size: 13.6, weight: .bold))
                        .foregroundStyle(item.value == nil ? TapColors.textMuted : TapColors.text)
                }
            }
        }
    }
}

// MARK: - Panels

/// Every present module panel, collapsed to a headline until tapped.
///
/// The model may cover a window (the dashboard) or a single round (§4.2) — the
/// panels do not care, because `StatsDashboardModel.build` has already applied
/// the same gating to both. At n-of-18 sample sizes the rates simply come back
/// as percentages off small denominators, which is the display policy working,
/// not a special case.
struct StatsPanelsView: View {
    var model: StatsDashboardModel
    @Binding var expanded: Set<StatsPanelID>
    /// Accessibility-identifier prefix, so the dashboard's panels and the
    /// per-round view's panels are addressable apart in a UI test.
    var idPrefix: String = "stats"
    /// Which cohort the ladder — and the putting sheet's cohort sentence — read.
    var baseline: SgBaselineContext = .fallback
    /// The open card's info sheet. One binding for the whole list, not one per
    /// panel: at most one sheet can be up.
    @Binding var openInfo: StatsPanelID?

    init(
        model: StatsDashboardModel, expanded: Binding<Set<StatsPanelID>>,
        idPrefix: String = "stats", baseline: SgBaselineContext = .fallback,
        openInfo: Binding<StatsPanelID?>
    ) {
        self.model = model
        self._expanded = expanded
        self.idPrefix = idPrefix
        self.baseline = baseline
        self._openInfo = openInfo
    }

    var body: some View {
        ForEach(model.presentPanels, id: \.rawValue) { id in
            panel(id)
        }
    }

    @ViewBuilder
    private func panel(_ id: StatsPanelID) -> some View {
        let isOpen = expanded.contains(id)
        TapCard {
            VStack(alignment: .leading, spacing: TapSpacing.md) {
                // The header is a ROW of two sibling controls, not one button.
                // The explainer trigger belongs beside the title it explains —
                // buried under the rows it read as a footnote to the last block
                // rather than a way in to the whole card — and a button nested
                // inside another button's label is not a control SwiftUI (or
                // VoiceOver) can address on its own. Same shape as the web twin
                // (`src/stats/stats-panels.component.ts`, `.panel__headrow`).
                HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                    Button {
                        withAnimation(.easeInOut(duration: 0.18)) {
                            if isOpen { expanded.remove(id) } else { expanded.insert(id) }
                        }
                    } label: {
                        HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(id.title)
                                    .font(TapFont.display(size: 16.8, weight: .semibold))
                                    .foregroundStyle(TapColors.text)
                                if let headline = Self.headline(id, model) {
                                    Text(headline)
                                        .font(TapFont.ui(size: 12.8))
                                        .foregroundStyle(TapColors.textMuted)
                                }
                            }
                            Spacer(minLength: 0)
                            Text(isOpen ? "Less" : "More")
                                .font(TapFont.ui(size: 12.8, weight: .bold))
                                .foregroundStyle(TapColors.accent)
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("\(idPrefix)-panel-\(id.rawValue)")

                    if Self.showsInfoTrigger(id, model, baseline, open: isOpen) {
                        // Words, never a glyph (`docs/design-guidelines.md` §4),
                        // in the ghost tier so it never competes with the title
                        // it sits beside.
                        Button(StatsCopy.prioritiesInfo) { openInfo = id }
                            .buttonStyle(.tap(.ghost))
                            .font(TapFont.ui(size: 12.8))
                            .accessibilityLabel(Self.infoLabel(id))
                            .accessibilityIdentifier("\(idPrefix)-info-\(id.rawValue)")
                    }
                }

                if isOpen {
                    blockList(Self.blocks(id, model))
                }
            }
            .padding(TapSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    /// Whether this card's header offers the "How this works" trigger.
    ///
    /// Two conditions, both about not offering a way in to nothing. No cards, no
    /// trigger — a sheet with an empty body must not be reachable. And closed
    /// card, no trigger: a reader who has not seen the rows has nothing for the
    /// sheet to explain, and five collapsed cards each advertising an explainer
    /// is a wall of links. Twin of the web's `panel__inforow` gate.
    static func showsInfoTrigger(
        _ id: StatsPanelID, _ model: StatsDashboardModel, _ baseline: SgBaselineContext,
        open: Bool
    ) -> Bool {
        open && !StatsPanelInfo.cards(id, model, baseline).isEmpty
    }

    /// The trigger's spoken label. Five identical "How this works" buttons on
    /// one screen are indistinguishable read out one at a time, so the label
    /// names the card each one opens. Twin of the web's `aria-label`.
    static func infoLabel(_ id: StatsPanelID) -> String {
        "\(StatsCopy.prioritiesInfo): \(id.title)"
    }

    /// The one figure the collapsed card carries. nil when the module's own
    /// headline rate has no sample — the card still appears (the module WAS
    /// recorded), it just has nothing to say until it is opened.
    ///
    /// The compact `(n of d)` parenthetical stays HERE: the owner's ruling took
    /// fraction rendering off the ROWS, and a headline is the one line with the
    /// room to say how big the sample behind it is.
    static func headline(_ id: StatsPanelID, _ model: StatsDashboardModel) -> String? {
        switch id {
        case .tee:
            return model.tee.flatMap { StatsFormat.rateWithSample($0.fairway) }
                .map { "Fairways \($0)" }
        case .approach:
            return model.approach.flatMap { StatsFormat.rateWithSample($0.gir) }
                .map { "Greens in regulation \($0)" }
        case .putting:
            return model.putting.flatMap {
                StatsFormat.averageWithSample(
                    $0.puttsPerGirHole, unit: .greens, label: "putts per green hit")
            }
        case .shortGame:
            return model.shortGame.flatMap { StatsFormat.rateWithSample($0.scramble.overall) }
                .map { "Scrambling \($0)" }
        case .scoring:
            return model.scoring.flatMap {
                StatsFormat.averageWithSample(
                    $0.doubleBogeyPlusPerRound, unit: .rounds,
                    label: "doubles or worse per round")
            }
        }
    }

    // MARK: Block builders

    /// A rate row. A bar ALWAYS draws its share — there is no thin gate:
    /// `r.value` is nil only at a zero denominator, and then there is no bar to
    /// draw and the value cell carries the placeholder.
    static func bar(_ id: String, _ title: String, _ r: Rate) -> StatsBlock {
        .bar(id: id, title: title, share: r.value, value: StatsFormat.rate(r))
    }

    static func figure(_ id: String, _ title: String, _ value: String?) -> StatsBlock {
        .figure(id: id, title: title, value: value)
    }

    /// The ladder's two column headers, in order. Pinned words, and the twin
    /// asserts them: `Holed` over the make reading, `Cost` over the
    /// strokes-gained cell.
    static let ladderColumns = ["Holed", "Cost"]

    /// The open panel's contents, in reading order. Empty for an absent panel.
    static func blocks(_ id: StatsPanelID, _ model: StatsDashboardModel) -> [StatsBlock] {
        switch id {
        case .tee:
            guard let panel = model.tee else { return [] }
            return teeBlocks(panel)
        case .approach:
            guard let panel = model.approach else { return [] }
            return approachBlocks(panel)
        case .putting:
            guard let panel = model.putting else { return [] }
            return puttingBlocks(panel)
        case .shortGame:
            guard let panel = model.shortGame else { return [] }
            return shortGameBlocks(panel)
        case .scoring:
            guard let panel = model.scoring else { return [] }
            return scoringBlocks(panel)
        }
    }

    /// Every block's `kind:id`, for the §E.3 twin walk.
    static func walk(_ id: StatsPanelID, _ model: StatsDashboardModel) -> [String] {
        blocks(id, model).map(\.walk)
    }

    // MARK: Tee

    static func teeBlocks(_ panel: StatsTeePanel) -> [StatsBlock] {
        var out: [StatsBlock] = [
            // Raw shares, like every other bar on the screen: a segment always
            // draws what the rate is. The legend prints the same percentage
            // beside it, and the card's headline carries the sample.
            .split(
                id: "teeSplit",
                segments: [
                    .init(id: "fairway", share: panel.fairway.value ?? 0, color: TapColors.primary),
                    .init(id: "inPlay", share: panel.inPlayOnly.value ?? 0, color: TapColors.accent),
                    .init(id: "trouble", share: panel.trouble.value ?? 0, color: TapColors.danger),
                ],
                legend: [
                    StatsLegendItem("Fairway", TapColors.primary, StatsFormat.rate(panel.fairway)),
                    StatsLegendItem("In play", TapColors.accent, StatsFormat.rate(panel.inPlayOnly)),
                    StatsLegendItem("Trouble", TapColors.danger, StatsFormat.rate(panel.trouble)),
                ])
        ]
        // The fan sits directly under the split it decomposes. Absent, never
        // "Not recorded": a side is only asked for when the drive missed, so a
        // window of nothing but fairways has no picture to draw.
        if panel.teeMissRecorded > 0 {
            out.append(.subhead(id: "teeFanHead", text: StatsCopy.teeFanHead))
            out.append(
                .fan(
                    id: "teeFan",
                    segments: StatsFanGeometry.segments(
                        leftInPlay: panel.fan.leftInPlay, leftTrouble: panel.fan.leftTrouble,
                        fairway: panel.fan.fairway,
                        rightInPlay: panel.fan.rightInPlay, rightTrouble: panel.fan.rightTrouble,
                        recorded: panel.fan.recorded),
                    text: teeFanReading(panel)))
        }
        // The three absolutes the tax is a difference OF, read before it.
        // Omitted as a GROUP when no tee shot has a scored hole behind it;
        // inside the group a single empty row still prints "Not recorded",
        // because the three partition the tee shots.
        let byTee = panel.vsParByTee
        if byTee.fairway.d > 0 || byTee.inPlay.d > 0 || byTee.trouble.d > 0 {
            out.append(
                .subhead(
                    id: "vsParByTeeHead", text: "Average vs par, by where the tee shot finished"))
            out.append(
                figure(
                    "vsParFairway", "From the fairway",
                    StatsFormat.averageWithSample(byTee.fairway, signed: true, unit: .holes)))
            out.append(
                figure(
                    "vsParInPlay", "From in play",
                    StatsFormat.averageWithSample(byTee.inPlay, signed: true, unit: .holes)))
            out.append(
                figure(
                    "vsParTrouble", "From trouble",
                    StatsFormat.averageWithSample(byTee.trouble, signed: true, unit: .holes)))
        }
        // `StatsFormat.average`, never `averageWithSample`: the trouble tax's
        // own `d` is a cross-product guard (trouble holes × fairway holes) and
        // printing it would claim a sample of 99 holes. Its two honest
        // denominators are a sentence long, so the info sheet says them.
        out.append(
            figure("troubleTax", "Trouble tax", StatsFormat.average(panel.troubleTax, signed: true)))
        out.append(bar("recovery", "Recovery", panel.recovery))
        // Absent, not zero: `penaltiesPerRound` divides by the round count, so
        // it would print a confident "0.00 per round" for a player who never
        // answered the question.
        if panel.penaltiesRecordedHoles > 0 {
            out.append(
                figure(
                    "penalties", "Penalties",
                    StatsFormat.averageWithSample(panel.penaltiesPerRound, unit: .rounds)))
            out.append(bar("penaltyHoleShare", "Holes with a penalty", panel.penaltyHoleShare))
            out.append(
                figure(
                    "penaltyTax", "Penalty tax",
                    StatsFormat.average(panel.penaltyTax, signed: true)))
        }
        return out
    }

    /// The picture's reading, in words. The chart is `accessibilityHidden`, so
    /// this line — not the drawing — is what the block actually says. Counts,
    /// not shares: the three numbers are of different denominators (a side is
    /// only recorded on a miss) and a percentage here would invite adding them
    /// to the fairway share.
    static func teeFanReading(_ panel: StatsTeePanel) -> String {
        let left = panel.fan.leftInPlay + panel.fan.leftTrouble
        let right = panel.fan.rightInPlay + panel.fan.rightTrouble
        return "Left \(StatsFormat.count(left)) · Fairway \(StatsFormat.count(panel.fan.fairway)) "
            + "· Right \(StatsFormat.count(right))"
    }

    // MARK: Approach

    static func approachBlocks(_ panel: StatsApproachPanel) -> [StatsBlock] {
        var out: [StatsBlock] = []
        // Directly under the card's own GIR headline, and above every
        // breakdown: the compass says WHERE the misses went, which is the
        // question the breakdowns below then slice. Absent when no miss carries
        // a direction — an empty wheel would read as "you miss nowhere".
        if panel.greenMissRecorded > 0 {
            out.append(.subhead(id: "greenMissHead", text: StatsCopy.greenMissHead))
            out.append(
                .compass(
                    id: "greenMiss",
                    sectors: StatsCompassGeometry.sectors([
                        .long: panel.greenMiss.long.value ?? 0,
                        .short: panel.greenMiss.short.value ?? 0,
                        .left: panel.greenMiss.left.value ?? 0,
                        .right: panel.greenMiss.right.value ?? 0,
                    ]),
                    labels: greenMissLabels(panel),
                    text: greenMissReading(panel)))
        }
        out.append(
            .subhead(id: "girByTee", text: "Greens hit, by where the tee shot finished"))
        out.append(bar("girFairway", "From the fairway", panel.girByTee.fairway))
        out.append(bar("girInPlay", "From in play", panel.girByTee.inPlay))
        out.append(bar("girTrouble", "From trouble", panel.girByTee.trouble))
        // Ungated: a partition of `girRecorded`, which the panel is already
        // gated on. Hiding one of three parallel rows would read as "you never
        // played a par 5".
        out.append(.subhead(id: "girByParHead", text: "Greens hit, by par"))
        out.append(bar("girPar3", "Par 3", panel.girByPar.par3))
        out.append(bar("girPar4", "Par 4", panel.girByPar.par4))
        out.append(bar("girPar5", "Par 5", panel.girByPar.par5))
        // The owner's own wording, abbreviation and all: "GIR" is what the two
        // subheads above already teach, and spelling it out here would read as
        // a different measurement.
        out.append(.subhead(id: "mixHead", text: "Proximity with GIR"))
        for bucket in PuttBucket.allCases {
            out.append(
                bar(
                    "mix-\(bucket.rawValue)", StatsFormat.title(bucket),
                    panel.girFirstPuttMix[bucket] ?? Rate(value: nil, n: 0, d: 0)))
        }
        out.append(bar("birdieConversion", "Birdie conversion", panel.birdieConversion))
        // The approach panel is gated on `girRecorded`, which can be non-zero
        // over a window that recorded no short-game attempt at all.
        if panel.hardChipShare.d > 0 {
            out.append(bar("hardChipShare", "Hard misses", panel.hardChipShare))
        }
        // Gated as a GROUP on either side having a scored hole, the same shape
        // the tee card's vs-par group uses. Inside it a row with no sample of
        // its own still prints "Not recorded".
        let cost = panel.costOfMissedGreen
        if cost.hit.d > 0 || cost.miss.d > 0 {
            out.append(.subhead(id: "missedGreenHead", text: "Cost of a missed green"))
            // GREENS on the hit side, HOLES on the miss side: the denominators
            // genuinely differ and the noun says which.
            out.append(
                figure(
                    "vsParGreenHit", "Green hit",
                    StatsFormat.averageWithSample(cost.hit, signed: true, unit: .greens)))
            out.append(
                figure(
                    "vsParGreenMissed", "Green missed",
                    StatsFormat.averageWithSample(cost.miss, signed: true, unit: .holes)))
            out.append(
                figure(
                    "missedGreenTax", "Missed-green tax",
                    StatsFormat.average(cost.delta, signed: true)))
        }
        return out
    }

    /// The compass in words — the drawing is `accessibilityHidden`, so this is
    /// the block's actual reading. The four shares partition the recorded
    /// misses, so they read as percentages together or not at all.
    static func greenMissReading(_ panel: StatsApproachPanel) -> String {
        let parts: [(String, Rate)] = [
            ("Long", panel.greenMiss.long), ("Short", panel.greenMiss.short),
            ("Left", panel.greenMiss.left), ("Right", panel.greenMiss.right),
        ]
        return
            parts
            .map { "\($0.0) \(StatsFormat.rate($0.1) ?? StatsCopy.notRecorded)" }
            .joined(separator: " · ")
    }

    /// The four in-picture labels. Same `StatsFormat.rate` path as
    /// `greenMissReading` above, so the wheel and the prose beside it never
    /// disagree about a number.
    ///
    /// The block is gated on `greenMissRecorded > 0`, so no denominator here is
    /// zero and the empty fallback is unreachable — but a wedge must never paint
    /// the words "Not recorded".
    static func greenMissLabels(_ panel: StatsApproachPanel)
        -> [StatsCompassGeometry.Direction: String]
    {
        [
            .long: StatsFormat.rate(panel.greenMiss.long) ?? "",
            .short: StatsFormat.rate(panel.greenMiss.short) ?? "",
            .left: StatsFormat.rate(panel.greenMiss.left) ?? "",
            .right: StatsFormat.rate(panel.greenMiss.right) ?? "",
        ]
    }

    // MARK: Putting

    static func puttingBlocks(_ panel: StatsPuttingPanel) -> [StatsBlock] {
        var out: [StatsBlock] = []
        // The raw distribution first: it is the context the make-% ladder below
        // is read against. Every bucket shares one denominator, so one check
        // gates the group.
        if (panel.firstPuttSpread[.inside1m]?.d ?? 0) > 0 {
            out.append(.subhead(id: "firstPuttHead", text: "First putt, all holes"))
            for bucket in PuttBucket.allCases {
                out.append(
                    bar(
                        "spread-\(bucket.rawValue)", StatsFormat.title(bucket),
                        panel.firstPuttSpread[bucket] ?? Rate(value: nil, n: 0, d: 0)))
            }
        }
        out.append(.subhead(id: "ladderHead", text: "Holed on the first putt"))
        // One header row over the two fixed columns the rungs below fill.
        // Words, never a glyph: `Cost` is the same noun the home card's
        // "Costing you most" uses, and it carries the sign's meaning without a
        // legend — which the sheet spells out anyway.
        out.append(.columns(id: "ladderCols", cells: ladderColumns))
        for rung in panel.ladder {
            out.append(
                .rung(
                    id: "rung-\(rung.bucket.rawValue)", title: StatsFormat.title(rung.bucket),
                    made: rung.made.value, baseline: rung.baseline,
                    value: StatsFormat.rate(rung.made), cost: StatsFormat.cost(rung.cost)))
        }
        // One gate for the group: all four share `puttsRecorded`, so checking
        // `zero.d` IS checking it. The panel can be present on
        // `firstPuttRecorded` alone, with no putt count anywhere.
        let hasPuttCounts = (panel.puttDistribution[.zero]?.d ?? 0) > 0
        if hasPuttCounts {
            out.append(.subhead(id: "puttCountHead", text: "Holes by putts"))
            for bucket in PuttCountBucket.allCases {
                out.append(
                    bar(
                        "putts-\(bucket.rawValue)", StatsFormat.title(bucket),
                        panel.puttDistribution[bucket] ?? Rate(value: nil, n: 0, d: 0)))
            }
        }
        // No standalone "Three-putts" row: the distribution's "Three or more"
        // above is the same numerator over the same denominator, and two rows
        // for one fact is what this pass removed. The lag fact below is
        // distinct and stays.
        out.append(bar("longThreePutt", "Three-putts from over 8 m", panel.threePuttsFromOver8m))
        out.append(
            figure(
                "puttsPerGir", "Putts per green hit",
                StatsFormat.averageWithSample(panel.puttsPerGirHole, unit: .greens)))
        if panel.puttsAfterMissedGreen.d > 0 {
            out.append(
                figure(
                    "puttsAfterMissedGreen", "Putts after a missed green",
                    StatsFormat.averageWithSample(panel.puttsAfterMissedGreen, unit: .holes)))
        }
        // A partition of `puttsRecorded`, so it takes the SAME gate the "Holes
        // by putts" group above takes. Unsigned — putts are a quantity, not a
        // deviation.
        if hasPuttCounts {
            out.append(.subhead(id: "puttsByParHead", text: "Putts per hole, by par"))
            out.append(
                figure(
                    "puttsPar3", "Par 3",
                    StatsFormat.averageWithSample(panel.puttsPerHoleByPar.par3, unit: .holes)))
            out.append(
                figure(
                    "puttsPar4", "Par 4",
                    StatsFormat.averageWithSample(panel.puttsPerHoleByPar.par4, unit: .holes)))
            out.append(
                figure(
                    "puttsPar5", "Par 5",
                    StatsFormat.averageWithSample(panel.puttsPerHoleByPar.par5, unit: .holes)))
        }
        return out
    }

    /// A ladder rung read out in WORDS — never the em dash, which is a
    /// placeholder for the eye only.
    ///
    /// Composed from the RENDERED strings rather than the raw cost so there is
    /// one rounding in the row: what a reader hears is what a reader sees.
    static func rungReading(title: String, value: String?, cost: String) -> String {
        let made = value.map { "\($0) holed" } ?? StatsCopy.notRecorded
        if cost == StatsCopy.noValue { return "\(title), \(made), \(StatsCopy.notRecorded)" }
        let magnitude = String(cost.drop(while: { $0 == "+" || $0 == "\u{2212}" }))
        if cost.hasPrefix("+") { return "\(title), \(made), \(magnitude) strokes lost" }
        if cost.hasPrefix("\u{2212}") { return "\(title), \(made), \(magnitude) strokes gained" }
        return "\(title), \(made), level"
    }

    // MARK: Short game

    /// The bunker leg of a three-leg group.
    ///
    /// The panel's own gate is "some scramble attempt", which a window with no
    /// sand in it satisfies — so every bunker row carries this second gate, and
    /// all of them carry the SAME one, so the three sections agree about whether
    /// this window has any sand in it. `sandSaveAttempts` (the model's name for
    /// `scrambleAttemptsBunker`) is the shared denominator: a chip-in has
    /// `putts = 0`, which the attempt predicate counts, so no non-zero bunker
    /// figure can hide behind the gate.
    static func hasBunkerLeg(_ panel: StatsShortGamePanel) -> Bool {
        panel.sandSaveAttempts > 0
    }

    static func shortGameBlocks(_ panel: StatsShortGamePanel) -> [StatsBlock] {
        var out: [StatsBlock] = [
            .subhead(id: "scrambleHead", text: "Scrambling"),
            bar("scrambleStandard", "Standard", panel.scramble.standard),
            bar("scrambleHard", "Hard", panel.scramble.hard),
        ]
        if hasBunkerLeg(panel) {
            out.append(bar("scrambleBunker", "Bunker", panel.scramble.bunker))
            // Sand save is the bunker scramble under the name a golfer uses for
            // it. Absent with no bunker attempt: there is no such thing as a 0%
            // sand save over zero bunkers.
            out.append(bar("sandSave", "Sand save", panel.sandSave))
        }
        // The counter block, gated as a GROUP on at least one COUNTED hole:
        // with nothing counted every hole models as one stroke, so all three
        // numbers would be a confident restatement of the model rather than a
        // reading of the player.
        if panel.shortGameStrokesRecorded > 0 {
            out.append(bar("multiChipBunker", "More than one from sand", panel.multiChipFromBunker))
            out.append(
                figure(
                    "extraShortGameStrokes", "Extra short-game shots",
                    StatsFormat.count(panel.extraShortGameStrokes)))
            out.append(bar("multiChip", "More than one chip", panel.multiChip))
        }
        out.append(.subhead(id: "chipHead", text: "Chipped to inside 2 m"))
        out.append(bar("chipStandard", "Standard", panel.chipInside2m.standard))
        out.append(bar("chipHard", "Hard", panel.chipInside2m.hard))
        if hasBunkerLeg(panel) {
            out.append(bar("chipBunker", "Bunker", panel.chipInside2m.bunker))
        }
        out.append(bar("conversionInside2m", "Holed from inside 2 m", panel.conversionInside2m))
        // The legs, not the sum: the rows match the groups above them, and the
        // total is the addition of what is visible.
        out.append(.subhead(id: "chipInsHead", text: "Chip-ins"))
        out.append(figure("chipInsStandard", "Standard", StatsFormat.count(panel.chipIns.standard)))
        out.append(figure("chipInsHard", "Hard", StatsFormat.count(panel.chipIns.hard)))
        if hasBunkerLeg(panel) {
            out.append(
                figure("chipInsBunker", "Bunker", StatsFormat.count(panel.chipIns.bunker)))
        }
        return out
    }

    // MARK: Scoring

    static func scoringBlocks(_ panel: StatsScoringPanel) -> [StatsBlock] {
        func avg(_ r: Rate) -> String? {
            StatsFormat.averageWithSample(r, signed: true, unit: .holes)
        }
        return [
            .subhead(id: "vsParHead", text: "Average vs par"),
            figure("par3", "Par 3", avg(panel.avgVsParByParGroup.par3)),
            figure("par4", "Par 4", avg(panel.avgVsParByParGroup.par4)),
            figure("par5", "Par 5", avg(panel.avgVsParByParGroup.par5)),
            figure(
                "doubles", "Doubles or worse",
                StatsFormat.averageWithSample(panel.doubleBogeyPlusPerRound, unit: .rounds)),
            bar("bounceBack", "Bounce-back", panel.bounceBack),
        ]
    }

    // MARK: Rendering

    @ViewBuilder
    private func blockList(_ blocks: [StatsBlock]) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            ForEach(blocks) { block in
                blockView(block)
            }
        }
    }

    @ViewBuilder
    private func blockView(_ block: StatsBlock) -> some View {
        switch block {
        case .subhead(_, let text):
            StatsSubhead(text: text)
                .padding(.top, TapSpacing.sm)
        case .split(_, let segments, let legend):
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                StatsSplitBar(segments: segments)
                StatsLegendRows(items: legend)
            }
        case .fan(_, let segments, let text):
            VStack(alignment: .leading, spacing: TapSpacing.xs) {
                StatsTeeFan(segments: segments)
                Text(text)
                    .font(TapFont.ui(size: 12.0))
                    .foregroundStyle(TapColors.text)
            }
        case .compass(_, let sectors, let labels, let text):
            VStack(alignment: .leading, spacing: TapSpacing.xs) {
                StatsGreenCompass(sectors: sectors, labels: labels)
                Text(text)
                    .font(TapFont.ui(size: 12.0))
                    .foregroundStyle(TapColors.text)
            }
        case .bar(_, let title, let share, let value):
            HStack(spacing: StatsBarMetrics.gap) {
                Text(title)
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(TapColors.text)
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
                    .frame(maxWidth: .infinity, alignment: .leading)
                StatsMiniBar(share: share)
                    .frame(width: StatsBarMetrics.track)
                Text(value ?? StatsCopy.noValue)
                    .font(TapFont.ui(size: 13.6, weight: .bold))
                    .monospacedDigit()
                    .foregroundStyle(value == nil ? TapColors.textMuted : TapColors.text)
                    .frame(width: StatsBarMetrics.value, alignment: .trailing)
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("\(title), \(value ?? StatsCopy.notRecorded)")
        case .rung(_, let title, let made, let baselineTick, let value, let cost):
            HStack(spacing: StatsBarMetrics.gap) {
                Text(title)
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(TapColors.text)
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
                    .frame(maxWidth: .infinity, alignment: .leading)
                StatsLadderRung(made: made, baseline: baselineTick)
                    .frame(width: StatsBarMetrics.track)
                Text(value ?? StatsCopy.noValue)
                    .font(TapFont.ui(size: 13.6, weight: .bold))
                    .monospacedDigit()
                    .foregroundStyle(value == nil ? TapColors.textMuted : TapColors.text)
                    .frame(width: StatsBarMetrics.value, alignment: .trailing)
                Text(cost)
                    .font(TapFont.ui(size: 11.0))
                    .monospacedDigit()
                    .foregroundStyle(TapColors.textMuted)
                    .frame(width: StatsBarMetrics.cost, alignment: .trailing)
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(Self.rungReading(title: title, value: value, cost: cost))
        case .columns(_, let cells):
            HStack(spacing: StatsBarMetrics.gap) {
                Spacer(minLength: 0)
                Color.clear.frame(width: StatsBarMetrics.track, height: 1)
                ForEach(Array(cells.enumerated()), id: \.offset) { index, cell in
                    Text(cell)
                        .font(TapFont.ui(size: 10.0))
                        .textCase(.uppercase)
                        .foregroundStyle(TapColors.textMuted)
                        .frame(
                            width: index == 0 ? StatsBarMetrics.value : StatsBarMetrics.cost,
                            alignment: .trailing)
                }
            }
            .accessibilityHidden(true)
        case .figure(_, let title, let value):
            HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                Text(title)
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(TapColors.text)
                Spacer(minLength: 0)
                Text(value ?? StatsCopy.notRecorded)
                    .font(TapFont.ui(size: 13.6, weight: .bold))
                    .foregroundStyle(value == nil ? TapColors.textMuted : TapColors.text)
            }
            .accessibilityElement(children: .combine)
        }
    }
}
