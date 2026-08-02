import SwiftUI

/// The §3 module panels, and the four primitives they are drawn from.
///
/// Lifted out of `StatsDashboardView` when the per-round view (§4.2) needed the
/// same panels over a ONE-round model. The alternative was a second rendering of
/// the same catalog, which is how two surfaces end up disagreeing about what
/// "Not recorded" looks like — and the display policy has to live in one place or
/// it does not live anywhere.
///
/// Nothing here computes: every figure arrives as a `Rate` or a formatted
/// `String?`, and a `nil` prints `StatsCopy.notRecorded` rather than a zero.

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

/// One label / value / explanation row. A `nil` value is the display policy's
/// absent case and prints "Not recorded".
struct StatsFigure: Identifiable, Equatable, Sendable {
    var title: String
    var value: String?
    var hint: String?

    var id: String { title }

    init(_ title: String, _ value: String?, _ hint: String? = nil) {
        self.title = title
        self.value = value
        self.hint = hint
    }
}

struct StatsFigureRows: View {
    var items: [StatsFigure]

    var body: some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            ForEach(items) { item in
                VStack(alignment: .leading, spacing: 1) {
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
                    if let hint = item.hint {
                        Text(hint)
                            .font(TapFont.ui(size: 12.0))
                            .foregroundStyle(TapColors.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
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
    /// Bar length in [0,1]; nil draws NO bar (thin sample, or no scores).
    var share: Double?
    var value: String
}

/// The score-type histogram: a label, a neutral proportional bar, a share.
///
/// Deliberately NOT `StatsMiniBarRows` — that one takes a `Rate` and applies the
/// display policy itself. Here the caller has already formatted the value (and
/// decided whether the bar may be drawn), because the denominator is the
/// section's scored-hole count rather than each row's own.
struct StatsScoreTypeRows: View {
    var items: [ResultsHistogramRow]

    var body: some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            ForEach(items) { item in
                HStack(spacing: TapSpacing.sm) {
                    Text(item.title)
                        .font(TapFont.ui(size: 13.6))
                        .foregroundStyle(TapColors.text)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    // No new colour: these are shares of a whole, not
                    // judgements, and the label already says which end is good.
                    StatsMiniBar(share: item.share)
                        .frame(width: 84)
                    Text(item.value)
                        .font(TapFont.ui(size: 13.6))
                        .monospacedDigit()
                        .foregroundStyle(TapColors.text)
                        // Sized for the percentage the value now is ("100%"),
                        // not the "33 (65%)" pair it used to be.
                        .frame(width: 56, alignment: .trailing)
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

struct StatsBarItem: Identifiable {
    var title: String
    var rate: Rate

    var id: String { title }

    init(_ title: String, _ rate: Rate) {
        self.title = title
        self.rate = rate
    }
}

struct StatsMiniBarRows: View {
    var items: [StatsBarItem]

    var body: some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            ForEach(items) { item in
                HStack(spacing: TapSpacing.sm) {
                    Text(item.title)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.text)
                        .frame(width: 116, alignment: .leading)
                    // A bar is only drawn for a sample the display policy is
                    // willing to express as a percentage. Below that the reading
                    // is a fraction and a bar would give three attempts the same
                    // visual weight as thirty.
                    StatsMiniBar(share: StatsFormat.isThin(item.rate) ? nil : item.rate.value)
                    Text(StatsFormat.rate(item.rate) ?? StatsCopy.notRecorded)
                        .font(TapFont.ui(size: 12.8, weight: .bold))
                        .foregroundStyle(
                            StatsFormat.rate(item.rate) == nil
                                ? TapColors.textMuted : TapColors.text
                        )
                        .frame(width: 68, alignment: .trailing)
                }
                .accessibilityElement(children: .combine)
            }
        }
    }
}

// MARK: - Panels

/// Every present module panel, collapsed to a headline until tapped.
///
/// The model may cover a window (the dashboard) or a single round (§4.2) — the
/// panels do not care, because `StatsDashboardModel.build` has already applied
/// the same gating and the same display policy to both. At n-of-18 sample sizes
/// the rates simply come back as fractions, which is the policy working, not a
/// special case.
struct StatsPanelsView: View {
    var model: StatsDashboardModel
    @Binding var expanded: Set<StatsPanelID>
    /// Accessibility-identifier prefix, so the dashboard's panels and the
    /// per-round view's panels are addressable apart in a UI test.
    var idPrefix: String = "stats"

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

                if isOpen {
                    detail(id)
                }
            }
            .padding(TapSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    /// The one figure the collapsed card carries. nil when the module's own
    /// headline rate has no sample — the card still appears (the module WAS
    /// recorded), it just has nothing to say until it is opened.
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

    @ViewBuilder
    private func detail(_ id: StatsPanelID) -> some View {
        switch id {
        case .tee:
            if let panel = model.tee { Self.teeDetail(panel) }
        case .approach:
            if let panel = model.approach { Self.approachDetail(panel) }
        case .putting:
            if let panel = model.putting { Self.puttingDetail(panel) }
        case .shortGame:
            if let panel = model.shortGame { Self.shortGameDetail(panel) }
        case .scoring:
            if let panel = model.scoring { Self.scoringDetail(panel) }
        }
    }

    // MARK: Tee

    /// The split bar's segments — empty when the tee sample is thin.
    ///
    /// Same gate as every other bar on the screen: one recorded tee shot is a
    /// rate of 1.0, and a raw share would paint the track solid green off a
    /// single answer. All three shares sit over the same denominator
    /// (`teeRecorded`), so one thin check covers the whole bar. The legend
    /// still prints "1 of 1", which is the honest reading of that sample.
    static func teeSplitSegments(_ panel: StatsTeePanel) -> [StatsSplitBar.Segment] {
        guard !StatsFormat.isThin(panel.fairway) else { return [] }
        return [
            .init(id: "fairway", share: panel.fairway.value ?? 0, color: TapColors.primary),
            .init(id: "inPlay", share: panel.inPlayOnly.value ?? 0, color: TapColors.accent),
            .init(id: "trouble", share: panel.trouble.value ?? 0, color: TapColors.danger),
        ]
    }

    /// The three vs-par rows, or nothing.
    ///
    /// The group is omitted only when NO tee shot has a scored hole behind it —
    /// an individual row with `d == 0` stays and reads "Not recorded", because
    /// the three partition the tee shots and hiding one of a partition misreads
    /// as "you never went there".
    static func teeVsParFigures(_ panel: StatsTeePanel) -> [StatsFigure] {
        let byTee = panel.vsParByTee
        guard byTee.fairway.d > 0 || byTee.inPlay.d > 0 || byTee.trouble.d > 0 else { return [] }
        return [
            StatsFigure(
                "From the fairway",
                StatsFormat.averageWithSample(byTee.fairway, signed: true, unit: .holes)),
            StatsFigure(
                "From in play",
                StatsFormat.averageWithSample(byTee.inPlay, signed: true, unit: .holes)),
            StatsFigure(
                "From trouble",
                StatsFormat.averageWithSample(byTee.trouble, signed: true, unit: .holes)),
        ]
    }

    /// The `Measured …` line under a TAX figure, or nothing.
    ///
    /// A tax carries no explainer sentence: its one muted line says which two
    /// denominators the difference rests on, and nothing else. Written as a
    /// helper so a nil sample yields a nil hint rather than "Measured nil.".
    static func measuredLine(_ sample: String?) -> String? {
        sample.map { "Measured \($0)." }
    }

    /// The penalty family, or nothing.
    ///
    /// `penaltiesPerRound` divides by the round count, so a player who never
    /// recorded a penalty gets "0.00 per round" — a zero where the truth is
    /// "not recorded". The coverage counter is the gate, and the sentence.
    ///
    /// The share and the tax sit under the SAME gate: the whole family is
    /// absent, not zeroed, for a player who never answered the question.
    /// `penaltyTax` uses `StatsFormat.average`, never `averageWithSample` — its
    /// own `d` is a cross-product guard, exactly like the trouble tax above.
    static func penaltiesFigure(_ panel: StatsTeePanel) -> [StatsFigure] {
        guard panel.penaltiesRecordedHoles > 0 else { return [] }
        return [
            StatsFigure(
                "Penalties",
                StatsFormat.averageWithSample(panel.penaltiesPerRound, unit: .rounds),
                "\(StatsCopy.penalties) Recorded on "
                    + "\(StatsFormat.quantity(panel.penaltiesRecordedHoles, .holes))."),
            StatsFigure(
                "Holes with a penalty", StatsFormat.rateWithSample(panel.penaltyHoleShare)),
            StatsFigure(
                "Penalty tax",
                StatsFormat.average(panel.penaltyTax, signed: true),
                measuredLine(StatsFormat.penaltyTaxSample(panel.vsParByPenalty))),
        ]
    }

    static func teeDetail(_ panel: StatsTeePanel) -> some View {
        let segments = teeSplitSegments(panel)
        let vsPar = teeVsParFigures(panel)
        return VStack(alignment: .leading, spacing: TapSpacing.md) {
            if !segments.isEmpty {
                StatsSplitBar(segments: segments)
            }
            StatsLegendRows(items: [
                StatsLegendItem("Fairway", TapColors.primary, StatsFormat.rate(panel.fairway)),
                StatsLegendItem("In play", TapColors.accent, StatsFormat.rate(panel.inPlayOnly)),
                StatsLegendItem("Trouble", TapColors.danger, StatsFormat.rate(panel.trouble)),
            ])
            // The fan sits directly under the split bar's legend: same three
            // tones, one question further on — WHERE the miss went, not how
            // often. Absent, not "Not recorded", when nobody answered the side
            // question: a fan over zero misses is five empty columns.
            if panel.teeMissRecorded > 0 {
                StatsSubhead(text: StatsCopy.teeFanHead)
                StatsTeeFan(
                    segments: StatsFanGeometry.segments(
                        leftInPlay: panel.fan.leftInPlay, leftTrouble: panel.fan.leftTrouble,
                        fairway: panel.fan.fairway,
                        rightInPlay: panel.fan.rightInPlay, rightTrouble: panel.fan.rightTrouble,
                        recorded: panel.fan.recorded))
                Text(teeFanReading(panel))
                    .font(TapFont.ui(size: 12.0))
                    .foregroundStyle(TapColors.text)
                Text(StatsCopy.teeFan)
                    .font(TapFont.ui(size: 12.0))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if !vsPar.isEmpty {
                StatsSubhead(text: "Average vs par, by where the tee shot finished")
                Text(StatsCopy.vsParByTee)
                    .font(TapFont.ui(size: 12.0))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                StatsFigureRows(items: vsPar)
            }
            StatsFigureRows(
                items: [
                    troubleTaxFigure(panel),
                    StatsFigure(
                        "Recovery", StatsFormat.rateWithSample(panel.recovery), StatsCopy.recovery),
                ] + penaltiesFigure(panel))
        }
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

    /// The one figure whose sample cannot go in the value column.
    ///
    /// `troubleTax` is a DIFFERENCE of two averages, so the honest sample is two
    /// denominators and a sentence long ("over 9 holes from trouble vs 11 from
    /// the fairway"). It joins the explanation line rather than the number, and
    /// `StatsFormat.average` — not `averageWithSample` — is deliberate: the
    /// figure's own `d` is a cross-product guard and printing it would claim a
    /// sample of 99 holes.
    static func troubleTaxFigure(_ panel: StatsTeePanel) -> StatsFigure {
        let hint = StatsFormat.troubleTaxSample(panel.vsParByTee)
            .map { "\(StatsCopy.troubleTax) Measured \($0)." } ?? StatsCopy.troubleTax
        return StatsFigure(
            "Trouble tax", StatsFormat.average(panel.troubleTax, signed: true), hint)
    }

    // MARK: Approach

    /// The hard-chip share, or nothing. The approach panel is gated on
    /// `girRecorded`, which can be non-zero over a window with no recorded
    /// short-game attempt at all — so this row carries its own gate.
    static func hardChipShareFigure(_ panel: StatsApproachPanel) -> [StatsFigure] {
        guard panel.hardChipShare.d > 0 else { return [] }
        return [
            StatsFigure(
                "Hard misses", StatsFormat.rateWithSample(panel.hardChipShare),
                StatsCopy.hardChipShare)
        ]
    }

    /// Greens hit by par. UNGATED: the three rows partition `girRecorded`, and
    /// the panel is already gated on that being non-zero. A zero row reads "0%"
    /// or "0 of 2", which is true; hiding one of three parallel rows would read
    /// as "you never played a par 5".
    static func girByParItems(_ panel: StatsApproachPanel) -> [StatsBarItem] {
        [
            StatsBarItem("Par 3", panel.girByPar.par3),
            StatsBarItem("Par 4", panel.girByPar.par4),
            StatsBarItem("Par 5", panel.girByPar.par5),
        ]
    }

    /// What a missed green costs, or nothing.
    ///
    /// Gated as a GROUP on either side having a scored hole — the same shape
    /// `teeVsParFigures` uses. Inside the group each row stands even when its own
    /// `d` is 0 and reads "Not recorded". The tax itself goes through
    /// `StatsFormat.average`, because its `d` is a cross-product guard.
    static func costOfMissedGreenFigures(_ panel: StatsApproachPanel) -> [StatsFigure] {
        let cost = panel.costOfMissedGreen
        guard cost.hit.d > 0 || cost.miss.d > 0 else { return [] }
        return [
            // GREENS on the hit side, HOLES on the miss side: the denominators
            // genuinely differ and the noun says which.
            StatsFigure(
                "Green hit",
                StatsFormat.averageWithSample(cost.hit, signed: true, unit: .greens)),
            StatsFigure(
                "Green missed",
                StatsFormat.averageWithSample(cost.miss, signed: true, unit: .holes)),
            StatsFigure(
                "Missed-green tax",
                StatsFormat.average(cost.delta, signed: true),
                measuredLine(StatsFormat.missedGreenTaxSample(cost))),
        ]
    }

    /// The compass in words — the drawing is `accessibilityHidden`, so this is
    /// the block's actual reading. The four shares partition the recorded
    /// misses, so they go through the ordinary display policy together and a
    /// small window degrades all four to fractions at once.
    static func greenMissReading(_ panel: StatsApproachPanel) -> String {
        let parts: [(String, Rate)] = [
            ("Long", panel.greenMiss.long), ("Short", panel.greenMiss.short),
            ("Left", panel.greenMiss.left), ("Right", panel.greenMiss.right),
        ]
        return
            parts
            .map { "\($0.0) \(StatsFormat.rate($0.1) ?? "—")" }
            .joined(separator: " · ")
    }

    /// The four in-picture labels. Same `StatsFormat.rate` path as
    /// `greenMissReading` above, so the wheel and the prose beside it never
    /// disagree: under `MIN_RATE_DENOMINATOR` both say "2 of 3". Twin of
    /// `greenMissCompass`'s `labels` in `src/stats/stats-panel-blocks.ts`.
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

    static func approachDetail(_ panel: StatsApproachPanel) -> some View {
        let cost = costOfMissedGreenFigures(panel)
        return VStack(alignment: .leading, spacing: TapSpacing.md) {
            StatsSubhead(text: "Greens hit, by where the tee shot finished")
            StatsMiniBarRows(items: [
                StatsBarItem("From the fairway", panel.girByTee.fairway),
                StatsBarItem("From in play", panel.girByTee.inPlay),
                StatsBarItem("From trouble", panel.girByTee.trouble),
            ])
            // Under the greens-hit reading, above the by-par split: the compass
            // answers "and when you miss, which way", which is the next
            // question and not a refinement of the previous one. Absent when
            // nothing was answered — a compass over zero misses is a shape.
            if panel.greenMissRecorded > 0 {
                StatsSubhead(text: StatsCopy.greenMissHead)
                StatsGreenCompass(
                    sectors: StatsCompassGeometry.sectors([
                        .long: panel.greenMiss.long.value ?? 0,
                        .short: panel.greenMiss.short.value ?? 0,
                        .left: panel.greenMiss.left.value ?? 0,
                        .right: panel.greenMiss.right.value ?? 0,
                    ]),
                    labels: greenMissLabels(panel))
                Text(greenMissReading(panel))
                    .font(TapFont.ui(size: 12.0))
                    .foregroundStyle(TapColors.text)
                Text(StatsCopy.greenMiss)
                    .font(TapFont.ui(size: 12.0))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            StatsSubhead(text: "Greens hit, by par")
            StatsMiniBarRows(items: girByParItems(panel))
            StatsSubhead(text: "First putt on greens hit")
            Text(StatsCopy.proximityProxy)
                .font(TapFont.ui(size: 12.0))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
            StatsMiniBarRows(
                items: PuttBucket.allCases.map {
                    StatsBarItem(
                        StatsFormat.title($0),
                        panel.girFirstPuttMix[$0] ?? Rate(value: nil, n: 0, d: 0))
                })
            StatsFigureRows(
                items: [
                    StatsFigure(
                        "Birdie conversion", StatsFormat.rateWithSample(panel.birdieConversion),
                        StatsCopy.birdieConversion)
                ] + hardChipShareFigure(panel))
            // Last, so its subhead closes the un-headed birdie/hard-miss pair
            // rather than orphaning it.
            if !cost.isEmpty {
                StatsSubhead(text: "Cost of a missed green")
                StatsFigureRows(items: cost)
            }
        }
    }

    // MARK: Putting

    /// The raw first-putt distribution, or nothing. Every bucket sits over the
    /// same denominator, so one bucket having a sample means they all do.
    static func firstPuttSpreadItems(_ panel: StatsPuttingPanel) -> [StatsBarItem] {
        let items = PuttBucket.allCases.map {
            StatsBarItem(
                StatsFormat.title($0), panel.firstPuttSpread[$0] ?? Rate(value: nil, n: 0, d: 0))
        }
        return items.contains(where: { $0.rate.d > 0 }) ? items : []
    }

    /// Putts on the holes where the green was missed, or nothing.
    static func puttsAfterMissedGreenFigure(_ panel: StatsPuttingPanel) -> [StatsFigure] {
        guard panel.puttsAfterMissedGreen.d > 0 else { return [] }
        return [
            StatsFigure(
                "Putts after a missed green",
                StatsFormat.averageWithSample(panel.puttsAfterMissedGreen, unit: .holes),
                StatsCopy.puttsAfterMissedGreen)
        ]
    }

    /// The putt-count histogram, or nothing.
    ///
    /// All four rows share ONE denominator (`puttsRecorded`), so one gate covers
    /// the group — exactly how `firstPuttSpreadItems` gates on the buckets'
    /// common `d`. The gate exists because the panel can be present on
    /// `firstPuttRecorded` alone, with no putt count anywhere.
    static func puttDistributionItems(_ panel: StatsPuttingPanel) -> [StatsBarItem] {
        let items = PuttCountBucket.allCases.map { bucket in
            StatsBarItem(
                StatsFormat.title(bucket),
                panel.puttDistribution[bucket] ?? Rate(value: nil, n: 0, d: 0))
        }
        return items.contains(where: { $0.rate.d > 0 }) ? items : []
    }

    /// Putts per hole by par, or nothing.
    ///
    /// A partition of `puttsRecorded`, so it takes the SAME gate the histogram
    /// above it takes: the panel can stand on `firstPuttRecorded` alone, and a
    /// subhead over three "Not recorded" rows is dead noise. Inside the group an
    /// empty row still prints — the three partition the holes. Unsigned: putts
    /// are a quantity, not a deviation.
    static func puttsByParFigures(_ panel: StatsPuttingPanel) -> [StatsFigure] {
        guard (panel.puttDistribution[.zero]?.d ?? 0) > 0 else { return [] }
        return [
            StatsFigure(
                "Par 3",
                StatsFormat.averageWithSample(panel.puttsPerHoleByPar.par3, unit: .holes)),
            StatsFigure(
                "Par 4",
                StatsFormat.averageWithSample(panel.puttsPerHoleByPar.par4, unit: .holes)),
            StatsFigure(
                "Par 5",
                StatsFormat.averageWithSample(panel.puttsPerHoleByPar.par5, unit: .holes)),
        ]
    }

    static func puttingDetail(_ panel: StatsPuttingPanel) -> some View {
        let spread = firstPuttSpreadItems(panel)
        let distribution = puttDistributionItems(panel)
        let byPar = puttsByParFigures(panel)
        return VStack(alignment: .leading, spacing: TapSpacing.md) {
            if !spread.isEmpty {
                StatsSubhead(text: "First putt, all holes")
                Text(StatsCopy.firstPuttSpread)
                    .font(TapFont.ui(size: 12.0))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                StatsMiniBarRows(items: spread)
            }
            StatsSubhead(text: "Holed on the first putt")
            Text(StatsCopy.ladderBaseline)
                .font(TapFont.ui(size: 12.0))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
            ForEach(panel.ladder) { rung in
                VStack(alignment: .leading, spacing: TapSpacing.xs) {
                    HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                        Text(StatsFormat.title(rung.bucket))
                            .font(TapFont.ui(size: 13.6))
                            .foregroundStyle(TapColors.text)
                        Spacer(minLength: 0)
                        Text(StatsFormat.rate(rung.made) ?? StatsCopy.notRecorded)
                            .font(TapFont.ui(size: 13.6, weight: .bold))
                            .foregroundStyle(
                                StatsFormat.rate(rung.made) == nil
                                    ? TapColors.textMuted : TapColors.text)
                    }
                    StatsLadderRung(
                        made: StatsFormat.isThin(rung.made) ? nil : rung.made.value,
                        baseline: rung.baseline)
                }
                .accessibilityElement(children: .combine)
            }
            if !distribution.isEmpty {
                StatsSubhead(text: "Holes by putts")
                StatsMiniBarRows(items: distribution)
            }
            StatsFigureRows(
                items: [
                    StatsFigure(
                        "Three-putts", StatsFormat.rateWithSample(panel.threePutt),
                        StatsCopy.threePutt),
                    StatsFigure(
                        "Three-putts from over 8 m",
                        StatsFormat.rateWithSample(panel.threePuttsFromOver8m),
                        StatsCopy.longThreePutt),
                    StatsFigure(
                        "Putts per green hit",
                        StatsFormat.averageWithSample(panel.puttsPerGirHole, unit: .greens),
                        StatsCopy.puttsPerGir),
                ] + puttsAfterMissedGreenFigure(panel))
            if !byPar.isEmpty {
                StatsSubhead(text: "Putts per hole, by par")
                StatsFigureRows(items: byPar)
            }
        }
    }

    // MARK: Short game

    /// Sand save, or nothing. The short-game panel is gated on there having
    /// been SOME scramble attempt, which can be true over a window with no
    /// bunker at all — so this row carries its own gate.
    static func sandSaveFigure(_ panel: StatsShortGamePanel) -> [StatsFigure] {
        guard panel.sandSaveAttempts > 0 else { return [] }
        return [
            StatsFigure(
                "Sand save", StatsFormat.rateWithSample(panel.sandSave), StatsCopy.sandSave)
        ]
    }

    /// The three counter figures, or nothing.
    ///
    /// Gated as a GROUP on `shortGameStrokesRecorded`: without a single counted
    /// hole every stroke count is the modeled 1, so the rates are structurally
    /// 0% and the extra-strokes figure is structurally 0. That is not a reading,
    /// it is the absence of one, and it would read as "you never take two".
    static func shortGameCounterFigures(_ panel: StatsShortGamePanel) -> [StatsFigure] {
        guard panel.shortGameStrokesRecorded > 0 else { return [] }
        return [
            StatsFigure(
                "More than one from sand", StatsFormat.rateWithSample(panel.multiChipFromBunker),
                StatsCopy.multiChipBunker),
            StatsFigure(
                "Extra short-game shots", StatsFormat.count(panel.extraShortGameStrokes),
                StatsCopy.extraShortGameStrokes),
            StatsFigure(
                "More than one chip", StatsFormat.rateWithSample(panel.multiChip),
                StatsCopy.multiChip),
        ]
    }

    /// The bunker leg of a three-leg group, or nothing.
    ///
    /// The panel's own gate is "some scramble attempt", which a window with no
    /// sand in it satisfies — so every bunker row carries this second gate, and
    /// all of them carry the SAME one, so the three groups agree about whether
    /// this window has any sand in it. `sandSaveAttempts` (the model's name for
    /// `scrambleAttemptsBunker`) is the shared denominator: a chip-in has
    /// `putts = 0`, which the attempt predicate counts, so no non-zero bunker
    /// figure can hide behind the gate.
    static func hasBunkerLeg(_ panel: StatsShortGamePanel) -> Bool {
        panel.sandSaveAttempts > 0
    }

    /// The three groups' rows, as values rather than inline literals, so the
    /// twin tests can assert the bunker gate the same way the web tests assert
    /// `panelBlocks('shortGame', …)`.
    ///
    /// Standard and Hard are always present: the panel is already gated on there
    /// having been a scramble attempt, so a zero in either is a real zero, not
    /// an absence. Bunker is not — see `hasBunkerLeg`.
    static func scramblingBars(_ panel: StatsShortGamePanel) -> [StatsBarItem] {
        [
            StatsBarItem("Standard", panel.scramble.standard),
            StatsBarItem("Hard", panel.scramble.hard),
        ] + (hasBunkerLeg(panel) ? [StatsBarItem("Bunker", panel.scramble.bunker)] : [])
    }

    static func chipInside2mBars(_ panel: StatsShortGamePanel) -> [StatsBarItem] {
        [
            StatsBarItem("Standard", panel.chipInside2m.standard),
            StatsBarItem("Hard", panel.chipInside2m.hard),
        ] + (hasBunkerLeg(panel) ? [StatsBarItem("Bunker", panel.chipInside2m.bunker)] : [])
    }

    static func chipInFigures(_ panel: StatsShortGamePanel) -> [StatsFigure] {
        [
            StatsFigure("Standard", StatsFormat.count(panel.chipIns.standard)),
            StatsFigure("Hard", StatsFormat.count(panel.chipIns.hard)),
        ]
            + (hasBunkerLeg(panel)
                ? [StatsFigure("Bunker", StatsFormat.count(panel.chipIns.bunker))] : [])
    }

    static func shortGameDetail(_ panel: StatsShortGamePanel) -> some View {
        let counters = shortGameCounterFigures(panel)
        let sandSave = sandSaveFigure(panel)
        return VStack(alignment: .leading, spacing: TapSpacing.md) {
            StatsSubhead(text: "Scrambling")
            StatsMiniBarRows(items: scramblingBars(panel))
            if !(sandSave + counters).isEmpty {
                StatsFigureRows(items: sandSave + counters)
            }
            StatsSubhead(text: "Chipped to inside 2 m")
            StatsMiniBarRows(items: chipInside2mBars(panel))
            StatsFigureRows(items: [
                StatsFigure(
                    "Holed from inside 2 m",
                    StatsFormat.rateWithSample(panel.conversionInside2m),
                    StatsCopy.conversionInside2m)
            ])
            StatsSubhead(text: "Chip-ins")
            Text(StatsCopy.chipIns)
                .font(TapFont.ui(size: 12.0))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
            StatsFigureRows(items: chipInFigures(panel))
        }
    }

    // MARK: Scoring

    static func scoringDetail(_ panel: StatsScoringPanel) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.md) {
            StatsSubhead(text: "Average vs par")
            StatsFigureRows(items: [
                StatsFigure(
                    "Par 3",
                    StatsFormat.averageWithSample(
                        panel.avgVsParByParGroup.par3, signed: true, unit: .holes)),
                StatsFigure(
                    "Par 4",
                    StatsFormat.averageWithSample(
                        panel.avgVsParByParGroup.par4, signed: true, unit: .holes)),
                StatsFigure(
                    "Par 5",
                    StatsFormat.averageWithSample(
                        panel.avgVsParByParGroup.par5, signed: true, unit: .holes)),
                StatsFigure(
                    "Doubles or worse",
                    StatsFormat.averageWithSample(panel.doubleBogeyPlusPerRound, unit: .rounds),
                    StatsCopy.doubleBogeyPlus),
                StatsFigure(
                    "Bounce-back", StatsFormat.rateWithSample(panel.bounceBack),
                    StatsCopy.bounceBack),
            ])
        }
    }
}
