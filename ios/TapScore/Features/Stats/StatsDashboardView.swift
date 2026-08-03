import SwiftUI

/// The player's own statistics, over a window they choose.
///
/// Presented as a SHEET rather than pushed. `ProfileView` is drawn in two
/// places — as a root shell section inside the `NavigationStack`, and inside a
/// plain `.sheet` from `AccountSheetView` — and a `NavigationLink` would be
/// inert in the second. A sheet works from both, and it is already the app's
/// idiom for a screen hung off the profile (`AdminHomeView`).
///
/// Reading order is the order a shot is played and then the order a round is
/// judged: what to practise, which way the trends point, then the modules from
/// tee to green, then the rounds themselves. Nothing on this screen computes
/// anything — every figure comes off `StatsDashboardStore.model`.
struct StatsDashboardView: View {
    @Environment(AppEnvironment.self) private var environment
    @Environment(\.dismiss) private var dismiss

    /// Built in `.task`, like every other store in the app: it needs the
    /// environment's API actor and must survive re-renders.
    @State private var store: StatsDashboardStore?
    @State private var expanded: Set<StatsPanelID> = []
    @State private var filterOpen = false
    /// The "How this works" popover behind the practice-priorities card.
    @State private var prioritiesInfoOpen = false
    /// Which module card's "How this works" sheet is up. ONE binding for the
    /// whole list, not one per panel: at most one sheet can be open.
    @State private var openInfo: StatsPanelID?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: TapSpacing.lg) {
                    if let store {
                        switch store.phase {
                        case .loading:
                            loading
                        case .notAuthorized:
                            message(StatsCopy.notAuthorized)
                        case let .failed(problem):
                            message(problem)
                        case .ready:
                            content(store)
                        }
                    } else {
                        loading
                    }
                }
                .padding(TapSpacing.lg)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(TapColors.bg)
            .navigationTitle("Statistics")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(TapColors.bg, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .accessibilityIdentifier("stats-dashboard")
        .task {
            guard store == nil else { return }
            let created = StatsDashboardStore(
                api: environment.api,
                handicapIndex: SgBaselinePreference.handicapIndex(environment.authState))
            store = created
            await created.load()
        }
        // The store has no session of its own, and the profile can resolve after
        // this screen is already drawn — a handicap that arrives late must still
        // move an `auto` baseline onto the right tier.
        .onChange(of: SgBaselinePreference.handicapIndex(environment.authState)) { _, next in
            store?.setHandicapIndex(next)
        }
        .sheet(isPresented: $filterOpen) {
            if let store {
                StatsFilterSheet(
                    filter: store.filter,
                    courses: store.courseOptions,
                    rounds: store.loadedRounds,
                    onApply: { next in
                        Task { await store.apply(filter: next) }
                    },
                    onClear: {
                        Task { await store.clearFilter() }
                    })
            }
        }
    }

    // MARK: - Shell states

    private var loading: some View {
        Text(StatsCopy.loading)
            .font(TapFont.ui(size: 14.4))
            .foregroundStyle(TapColors.textMuted)
            .accessibilityIdentifier("stats-loading")
    }

    private func message(_ text: String) -> some View {
        Text(text)
            .font(TapFont.ui(size: 14.4))
            .foregroundStyle(TapColors.textMuted)
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityIdentifier("stats-message")
    }

    // MARK: - Content

    @ViewBuilder
    private func content(_ store: StatsDashboardStore) -> some View {
        windowPicker(store)
        baselinePicker(store)
        if let problem = store.extendProblem {
            // The rows already fetched are still true; this says the window may
            // be short, and does not pretend the screen is broken.
            Text(StatsCopy.extendProblemPrefix + problem)
                .font(TapFont.ui(size: 12.8))
                .foregroundStyle(TapColors.danger)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("stats-extend-problem")
        }

        let model = store.model
        if model.isEmpty {
            message(store.windowIsOverFiltered ? StatsCopy.windowEmpty : StatsCopy.noStats)
        } else {
            results(model)
            priorities(model, baseline: store.baseline)
            trends(model)
            StatsPanelsView(
                model: model, expanded: $expanded, baseline: store.baseline,
                openInfo: $openInfo
            )
            .sheet(item: $openInfo) { id in
                StatsPanelInfoSheet(
                    title: id.title, cards: StatsPanelInfo.cards(id, model, store.baseline))
            }
            roundList(model, history: store.loadedRounds)
        }
    }

    // MARK: - Window picker

    /// Six windows, so a DROPDOWN and not chips.
    ///
    /// The app's standing rule (`ios/AGENTS.md`): chips are for three or four
    /// short options that all fit on one line. Six — three of which are the
    /// nearly identical "Last 5 / 10 / 20" — would scroll horizontally, which
    /// hides options behind a gesture and makes the three count windows compete
    /// for a glance they do not deserve. The collapsed field also has room to
    /// state the sample ("10 rounds"), which is the number that qualifies
    /// everything below it.
    @ViewBuilder
    private func windowPicker(_ store: StatsDashboardStore) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            TapDropdown(
                label: "Window",
                placeholder: "Choose a window",
                title: "Window",
                selection: store.preset,
                groups: [
                    TapDropdownGroup(
                        id: "recent",
                        header: "Recent form",
                        rows: [.last5, .last10, .last20].map(Self.row)),
                    TapDropdownGroup(
                        id: "wide", header: "Everything", rows: [.thisYear, .all].map(Self.row)),
                    TapDropdownGroup(id: "custom", header: nil, rows: [Self.row(.custom)]),
                ],
                selectedRow: TapDropdownRow(
                    value: store.preset,
                    title: store.preset.title,
                    marker: Self.sampleMarker(store))
            ) { next in
                Task {
                    await store.select(next)
                    if next == .custom { filterOpen = true }
                }
            }
            .accessibilityIdentifier("stats-window-picker")

            HStack(spacing: TapSpacing.md) {
                if store.preset == .custom {
                    Button("Edit filter") { filterOpen = true }
                        .buttonStyle(.tap(.secondary))
                        .accessibilityIdentifier("stats-edit-filter")
                }
                if store.isExtending {
                    Text(StatsCopy.extending)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                }
                Spacer(minLength: 0)
            }
        }
    }

    // MARK: - Baseline picker

    /// Which reference the strokes-gained rows are measured against.
    ///
    /// Five options — "Match my handicap" plus the four tiers — so a DROPDOWN,
    /// by the same standing rule the window picker cites (`ios/AGENTS.md`, chips
    /// are for three or four short options). Each row explains itself in words:
    /// the tiers say what they are expected to shoot, and the auto row says which
    /// tier THIS reader's handicap lands on.
    ///
    /// Deliberately NOT part of the filter sheet. Applying a filter switches the
    /// window to `.custom`; choosing a reference says nothing about which rounds
    /// are in the window, and must never move it.
    @ViewBuilder
    private func baselinePicker(_ store: StatsDashboardStore) -> some View {
        let baseline = store.baseline
        TapDropdown(
            label: SgBaselineCopy.pickerLabel,
            placeholder: SgBaselineCopy.autoTitle,
            title: SgBaselineCopy.pickerTitle,
            selection: store.baselineChoice,
            groups: [
                TapDropdownGroup(
                    id: "baseline",
                    header: nil,
                    rows: SgBaselineChoice.allCases.map {
                        Self.baselineRow($0, handicapIndex: baseline.handicapIndex)
                    })
            ],
            selectedRow: TapDropdownRow(
                value: store.baselineChoice,
                title: SgBaselineCopy.rowTitle(store.baselineChoice),
                // On `auto` the field repeats the tier it resolved to — the
                // answer to "compared to what", which the option's own name does
                // not give.
                marker: SgBaselineCopy.fieldMarker(baseline))
        ) { next in
            store.selectBaseline(next)
        }
        .accessibilityIdentifier("stats-baseline-picker")
    }

    private static func baselineRow(
        _ choice: SgBaselineChoice, handicapIndex: Double?
    ) -> TapDropdownRow<SgBaselineChoice> {
        TapDropdownRow(
            value: choice,
            title: SgBaselineCopy.rowTitle(choice),
            subtitle: SgBaselineCopy.rowSubtitle(choice, handicapIndex: handicapIndex))
    }

    private static func row(_ preset: StatsWindowPreset) -> TapDropdownRow<StatsWindowPreset> {
        TapDropdownRow(value: preset, title: preset.title, subtitle: preset.subtitle)
    }

    /// "10 rounds", or "10 of 87 recorded" when the window is a slice of a
    /// bigger history. The denominator is the point: a percentage under a window
    /// nobody can size is a number without a sample.
    private static func sampleMarker(_ store: StatsDashboardStore) -> String {
        let shown = store.windowRounds.count
        guard let total = store.roundsWithStats, total > shown else {
            return shown == 1 ? "1 round" : "\(shown) rounds"
        }
        return "\(shown) of \(total) rounds"
    }

    // MARK: - Results

    /// What the window actually shot, as tiles.
    ///
    /// A SECTION, not a module panel: it is gated on nothing but the window
    /// having rounds in it, and it leads the screen because "how am I scoring"
    /// is the question a player brings to the page before "what should I
    /// practise".
    ///
    /// The hero is an AVERAGE vs par, normalised per eighteen holes so a nine
    /// and a part round are comparable to a full one; the best tiles are ONE
    /// REAL ROUND each, which is why they take the scorecard voice (`vsPar`, so
    /// level par reads "E") while the hero takes the signed-average one. The
    /// absolute strokes survive only as the annotation under a best tile.
    static func resultsTiles(_ results: ResultsSummary?) -> [ResultsTile] {
        guard let r = results else { return [] }
        var tiles: [ResultsTile] = []
        if let value = r.avgVsParPer18.value {
            tiles.append(
                ResultsTile(
                    id: "avgVsPar",
                    // "per 18" is gone from the LABEL: the normalisation is a
                    // detail of how the figure is computed, and the common window
                    // — every round an eighteen — normalises to itself. Where it
                    // does something, the qualifier says so in words.
                    label: "Average vs par",
                    value: StatsFormat.signedNumber(value, decimals: 1),
                    qualifier: avgVsParQualifier(r),
                    hero: true))
        }
        for length in r.lengths {
            guard let best = length.best else { continue }
            let label: String
            switch length.holeCount {
            case 18: label = "Best 18"
            case 9: label = "Best 9"
            default: label = "Best \(StatsFormat.count(length.holeCount)) holes"
            }
            tiles.append(
                ResultsTile(
                    id: "best-\(StatsFormat.count(length.holeCount))",
                    label: label,
                    value: StatsFormat.vsPar(best.vsPar),
                    // Exactly the strokes, one short line. The old ", from N
                    // complete rounds" clause said how many rounds the minimum
                    // was taken over — a sample the section subtitle already
                    // carries, and long enough to wrap a two-up tile into rags.
                    qualifier: "\(StatsFormat.count(best.strokes)) strokes",
                    hero: false))
        }
        return tiles
    }

    /// The line under the hero number, or nil.
    ///
    /// Two different jobs, one line. It says how many holes the average rests on
    /// whenever that diverges from what the window's rounds could have carried —
    /// a part-scored window. And it says "scaled to 18" whenever the window holds
    /// ANY length other than eighteen, because that is the only case where the
    /// per-18 normalisation moves the number away from what was actually shot.
    /// An all-18 window (the common one) normalises to itself, so it must not
    /// mention scaling at all.
    static func avgVsParQualifier(_ r: ResultsSummary) -> String? {
        let scaled = r.lengths.contains { $0.holeCount != 18 }
        guard scaled || r.holesScored != r.holesExpected else { return nil }
        let head = "over \(StatsFormat.quantity(r.holesScored, .holes))"
        return scaled ? "\(head), scaled to 18" : head
    }

    /// The five score-type buckets, ALWAYS all five once anything was scored.
    ///
    /// A zero bucket is information ("no eagles"), and dropping it would make
    /// the block change height between windows.
    static func resultsHistogram(_ results: ResultsSummary?) -> [ResultsHistogramRow] {
        guard let r = results, r.holesScored > 0 else { return [] }
        return ScoreType.allCases.map { type in
            let count = r.scoreTypeCounts[type] ?? 0
            let share = StatMeasuresMath.rate(count, r.holesScored)
            // The reading is the SHARE and nothing else — the raw count beside
            // it was answering a question the bar already answers. The bar
            // always draws (owner ruling, 2026-08-02): a row that is a share of
            // a whole is drawn at its share whatever the window's size.
            // `holesScored > 0` above rules out the absent case, so the
            // placeholder never fires here — it is stated anyway, because the
            // value column has ONE vocabulary and it is not the count's.
            return ResultsHistogramRow(
                id: type,
                title: StatsFormat.title(type),
                share: share.value,
                value: StatsFormat.rate(share) ?? StatsCopy.noValue)
        }
    }

    @ViewBuilder
    private func results(_ model: StatsDashboardModel) -> some View {
        if let summary = model.results {
            let tiles = Self.resultsTiles(summary)
            let histogram = Self.resultsHistogram(summary)
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                SectionHeader(title: StatsCopy.resultsHeading)
                // The subtitle labels the SECTION, so it sits under the heading
                // rather than inside the card — and it carries the round count,
                // which is why no "Rounds" row exists inside.
                Text(StatsFormat.resultsSubtitle(summary))
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                // A window whose rounds carry no score at all has nothing to put
                // in a card, and an empty card is worse than none.
                if !tiles.isEmpty || !histogram.isEmpty {
                    TapCard {
                        VStack(alignment: .leading, spacing: TapSpacing.md) {
                            ForEach(tiles.filter(\.hero)) { tile in
                                Self.heroTile(tile)
                            }
                            let rest = tiles.filter { !$0.hero }
                            if !rest.isEmpty {
                                HStack(alignment: .top, spacing: TapSpacing.lg) {
                                    ForEach(rest) { tile in
                                        Self.bestTile(tile)
                                    }
                                    Spacer(minLength: 0)
                                }
                            }
                            if !histogram.isEmpty {
                                StatsSubhead(text: StatsCopy.scoreTypesHead)
                                StatsScoreTypeRows(items: histogram)
                            }
                        }
                        .padding(TapSpacing.md)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
            .accessibilityIdentifier("stats-results")
        }
    }

    /// The number IS the answer, so it gets the size and the whole row.
    private static func heroTile(_ tile: ResultsTile) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(tile.value)
                .font(TapFont.ui(size: 34, weight: .bold))
                .foregroundStyle(TapColors.text)
            Text(tile.label)
                .font(TapFont.ui(size: 13.6))
                .foregroundStyle(TapColors.textMuted)
            if let qualifier = tile.qualifier {
                Text(qualifier)
                    .font(TapFont.ui(size: 12.0))
                    .foregroundStyle(TapColors.textMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }

    private static func bestTile(_ tile: ResultsTile) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(tile.value)
                .font(TapFont.ui(size: 20, weight: .bold))
                .foregroundStyle(TapColors.text)
            // Both lines are short by construction ("Best 18", "79 strokes"), so
            // neither may wrap: two tiles side by side, one of them ragged over
            // two lines, is what the owner rejected.
            Text(tile.label)
                .font(TapFont.ui(size: 13.6))
                .foregroundStyle(TapColors.textMuted)
                .lineLimit(1)
            if let qualifier = tile.qualifier {
                Text(qualifier)
                    .font(TapFont.ui(size: 12.0))
                    .foregroundStyle(TapColors.textMuted)
                    .lineLimit(1)
            }
        }
        .accessibilityElement(children: .combine)
    }

    // MARK: - Practice priorities

    /// The waterfall, ranked worst first — the one panel that answers "what
    /// should I work on".
    private func priorities(
        _ model: StatsDashboardModel, baseline: SgBaselineContext
    ) -> some View {
        let magnitude =
            model.priorities.compactMap { $0.per18.map(abs) }.max() ?? 0
        return VStack(alignment: .leading, spacing: TapSpacing.sm) {
            HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                SectionHeader(title: "Practice priorities")
                // Words, never a glyph (`docs/design-guidelines.md` §4).
                Button(StatsCopy.prioritiesInfo) { prioritiesInfoOpen = true }
                    .buttonStyle(.tap(.ghost))
                    .font(TapFont.ui(size: 12.8))
                    .accessibilityIdentifier("stats-priorities-info")
            }
            TapCard {
                VStack(alignment: .leading, spacing: TapSpacing.md) {
                    Text(StatsCopy.prioritiesHint)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                    ForEach(model.priorities) { priority in
                        priorityRow(priority, magnitude: magnitude)
                    }
                }
                .padding(TapSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .accessibilityIdentifier("stats-priorities")
        .sheet(isPresented: $prioritiesInfoOpen) {
            StrokesGainedInfoSheet(
                waterfall: model.waterfall,
                // The rows the card above is showing, so card 5 totals what the
                // reader can actually see and add up.
                rowsPer18: model.priorities.map(\.per18),
                windowRounds: model.roundCount,
                baseline: baseline,
                penaltySource: PenaltySourceCounts(model.totals))
        }
    }

    private func priorityRow(_ priority: StatsPriority, magnitude: Double) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                Text(StatsFormat.title(priority.component))
                    .font(TapFont.ui(size: 14.4, weight: .bold))
                    .foregroundStyle(TapColors.text)
                Spacer(minLength: 0)
                if let per18 = priority.per18 {
                    Text(StatsFormat.strokesPer18(per18))
                        .font(TapFont.ui(size: 14.4, weight: .bold))
                        .foregroundStyle(StatsChartColor.forStrokesLost(per18))
                } else {
                    // Words, not a zero bar. "Not enough data" and "exactly
                    // average" are different sentences and must not share a
                    // rendering.
                    Text(StatsCopy.notEnoughData)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                }
            }
            if let per18 = priority.per18 {
                StatsSignedBar(value: per18, magnitude: magnitude)
            }
            // The only line under a priority row is its COVERAGE — how many
            // rounds the average was taken over, or why there is no average at
            // all. The per-component explainer sentences are gone (owner ruling,
            // 2026-08-02): the section intro above the card explains the
            // waterfall once, and the component name says the rest.
            Text(StatsCopy.priorityCoverage(priority))
                .font(TapFont.ui(size: 12.8))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
    }

    // MARK: - Trends

    @ViewBuilder
    private func trends(_ model: StatsDashboardModel) -> some View {
        if !model.trends.isEmpty {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                SectionHeader(title: "Trends")
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: TapSpacing.md) {
                        ForEach(model.trends) { trend in
                            trendCard(trend)
                        }
                    }
                    .padding(.horizontal, 1)
                }
            }
            .accessibilityIdentifier("stats-trends")
        }
    }

    private func trendCard(_ trend: StatsTrend) -> some View {
        TapCard {
            VStack(alignment: .leading, spacing: TapSpacing.xs) {
                Text(trend.title)
                    .font(TapFont.ui(size: 11.2, weight: .bold))
                    .tracking(11.2 * 0.06)
                    .foregroundStyle(TapColors.textMuted)
                    .textCase(.uppercase)
                Text(StatsCopy.trendHeadline(trend))
                    .font(TapFont.ui(size: 17.6, weight: .bold))
                    .foregroundStyle(TapColors.text)
                StatsSparkline(points: trend.points, kind: trend.kind)
                    .frame(width: 96)
                Text(StatsCopy.trendSample(trend))
                    .font(TapFont.ui(size: 11.2))
                    .foregroundStyle(TapColors.textMuted)
            }
            .padding(TapSpacing.md)
        }
        .accessibilityElement(children: .combine)
    }

    // MARK: - Round list

    /// - Parameter history: every row the store has fetched — NOT just the
    ///   window's. The drill-down's baseline is the rounds before the one tapped,
    ///   which a narrow window (say "Last 5") does not contain but the store's
    ///   full history often does.
    private func roundList(_ model: StatsDashboardModel, history: [PlayerRoundStats]) -> some View {
        let magnitude =
            model.rounds
            .flatMap { row in
                StrokesLostComponent.allCases.compactMap { row.waterfall[$0].map(abs) }
            }
            .max() ?? 0
        return VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: "Rounds", count: "\(model.rounds.count)")
            ForEach(model.rounds) { row in
                roundRow(row, magnitude: magnitude, history: history)
            }
        }
        .accessibilityIdentifier("stats-rounds")
    }

    /// The per-round drill-down (§4.2) hangs off this row.
    ///
    /// The link carries `row.id` plus the history already in memory. It is NOT a
    /// rendered model — the pushed screen still does its own hole read and still
    /// builds its own figures, so nothing here can go stale behind it. What the
    /// rows spare is the second walk back through `myStats` for pages this store
    /// has already paid for, the same shortcut `RoundStoryCard` takes with
    /// `preloaded:`.
    private func roundRow(
        _ row: StatsRoundRow, magnitude: Double, history: [PlayerRoundStats]
    ) -> some View {
        NavigationLink {
            RoundStatsView(roundId: row.id, preloadedHistory: history)
        } label: {
            roundRowLabel(row, magnitude: magnitude)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("stats-round-row")
    }

    private func roundRowLabel(_ row: StatsRoundRow, magnitude: Double) -> some View {
        TapCard {
            HStack(alignment: .center, spacing: TapSpacing.md) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(StatsCopy.roundLabel(row))
                        .font(TapFont.ui(size: 14.4, weight: .bold))
                        .foregroundStyle(TapColors.text)
                        .lineLimit(1)
                    Text(StatsCopy.roundSubtitle(row))
                        .font(TapFont.ui(size: 12.0))
                        .foregroundStyle(TapColors.textMuted)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
                StatsWaterfallStrip(waterfall: row.waterfall, magnitude: magnitude)
                    .frame(width: 64)
                VStack(alignment: .trailing, spacing: 2) {
                    Text(row.strokes.map { StatsFormat.count($0) } ?? "—")
                        .font(TapFont.ui(size: 16.8, weight: .bold))
                        .foregroundStyle(TapColors.text)
                    if let vsPar = row.vsPar {
                        Text(StatsFormat.vsPar(vsPar))
                            .font(TapFont.ui(size: 12.0, weight: .bold))
                            .foregroundStyle(
                                vsPar < 0
                                    ? TapColors.underPar
                                    : (vsPar > 0 ? TapColors.overPar : TapColors.textMuted))
                    }
                }
                .frame(width: 52, alignment: .trailing)
            }
            .padding(TapSpacing.md)
        }
        .accessibilityElement(children: .combine)
    }
}

/// Every user-facing sentence the dashboard speaks, lifted out of the view so
/// each is one assertable string — the same discipline as `ProfileCopy`.
enum StatsCopy {
    static let loading = "Adding up your rounds…"
    static let notAuthorized =
        "This session can no longer read your statistics. Sign in again."
    static let noStats =
        "No rounds with statistics yet. Turn statistics on in your profile and they start filling in as you score."
    static let windowEmpty =
        "No rounds match this window. Widen the filter, or clear it to go back to your last 10 rounds."
    static let extending = "Loading more history…"
    static let extendProblemPrefix =
        "Showing the rounds loaded so far — fetching older ones failed: "
    static let notEnoughData = "Not enough data"
    static let notRecorded = "Not recorded"

    /// The zero-denominator PLACEHOLDER in a fixed value column — a bar row, a
    /// ladder rung, a histogram row, a split-bar legend, the ladder's cost cell.
    /// U+2014, one character, no spaces.
    ///
    /// Never a label, and never what VoiceOver reads: a composed reading
    /// substitutes `notRecorded`, which stays the words for a figure row, where
    /// there is a full-width line to spend on them.
    static let noValue = "\u{2014}"

    static let resultsHeading = "Results"
    static let scoreTypesHead = "Holes by score"

    static let prioritiesHint =
        "Where your shots go, worst first. Positive costs you shots."
    /// The popover trigger. WORDS, not a glyph (`docs/design-guidelines.md` §4).
    static let prioritiesInfo = "How this works"

    // MARK: Strokes-gained info popover
    //
    // Every sentence interpolates the reader's ACTUAL data (owner ruling,
    // 2026-08-02). There is no static explainer here on purpose: a card that
    // says the same thing to a player with 51 holes and a player with 3 is
    // telling one of them something untrue. Twin of the web's `SG_INFO_COPY`.

    static let sgInfoTitle = "How practice priorities work"
    static let sgInfoHolesCountedTitle = "Holes counted"
    static let sgInfoFiveRowsTitle = "The five rows"
    static let sgInfoBaselineTitle = "The baseline"
    static let sgInfoPer18Title = "Per 18 holes"
    static let sgInfoTotalTitle = "The total"

    /// Card 1. `perRound` swaps the window's "your holes" for "this round's".
    static func sgInfoHolesCounted(
        attributed: Double, holesScored: Double, perRound: Bool
    ) -> String {
        let holes = StatsFormat.count(holesScored)
        let whose = perRound ? "this round\u{2019}s" : "your"
        if attributed <= 0 {
            return
                "None of \(whose) \(holes) holes has the full set of answers yet, so there is nothing to show. A hole counts once it has a tee answer, a green answer and a putt answer."
        }
        if attributed >= holesScored {
            return perRound
                ? "All \(holes) of this round\u{2019}s holes could be fully attributed."
                : "All \(holes) of your holes could be fully attributed."
        }
        return
            "\(StatsFormat.count(attributed)) of \(whose) \(holes) holes could be fully attributed \u{2014} the others are missing a tee, green or putt answer, so they are left out of every row rather than guessed at."
    }

    /// Card 2. The ONE place either client says "a strokes gained-style method".
    static let sgInfoFiveRows =
        "Each row is what that part of your game cost you against the Tapscore reference baseline v1 \u{2014} a strokes gained-style method, worked out from the answers you tap rather than from shot distances. The five rows add up to your score against the baseline exactly; there is no leftover row."

    /// Card 3. The baseline is NAMED here, and only here — and since the tiers
    /// landed, the name is a TIER: which of the four references this reader is
    /// on, and how they got there. Live data per the ⓘ ruling.
    ///
    /// CANONICAL COPY, string for string with the web client. The calibrated
    /// branch says "everyone ON THIS REFERENCE", not "everyone" — that stopped
    /// being true the moment a scratch player and a 20-handicap read different
    /// tables.
    static func sgInfoBaseline(
        calibratedAt: String?, baseline: SgBaselineContext = .fallback
    ) -> String {
        let closing =
            calibratedAt.map {
                "This tier was frozen on \($0). Everyone on this reference is measured against the same table, so your rows can be compared with each other and with your own earlier rounds."
            }
            ?? "The tiers are still provisional, so treat the order of the rows as the reading and the sizes as rough."
        return [
            sgInfoBaselineChoice(baseline),
            "Each tier is one set of expected scores per hole and per lie.", closing,
        ].joined(separator: " ")
    }

    /// The opening sentence of card 3: which tier, and how this reader ended up
    /// on it. The control is named in words, so the sentence tells them where to
    /// go.
    static func sgInfoBaselineChoice(_ baseline: SgBaselineContext) -> String {
        let lead = "Measured against the \(baseline.cohort.title) reference \u{2014} "
        let pointer = "under \u{201C}\(SgBaselineCopy.pickerLabel)\u{201D}"
        guard baseline.choice == .auto else {
            return lead + "you picked this \(pointer)."
        }
        guard let handicapIndex = baseline.handicapIndex else {
            return lead + "no handicap on your profile yet. Change it \(pointer)."
        }
        return lead
            + "matched to your \(ProfileFormat.index(handicapIndex)) handicap. Change it \(pointer)."
    }

    /// Card 4.
    static func sgInfoPer18(minAttributed: Double) -> String {
        "Rows are scaled to 18 attributed holes, so a nine and an eighteen sit on the same scale. A round with fewer than \(StatsFormat.count(minAttributed)) attributed holes is left out of the comparison entirely."
    }

    /// Card 5, shown only when the total is non-nil.
    static func sgInfoTotal(signedTotal: String, windowRounds: Int, perRound: Bool) -> String {
        if perRound {
            return "The five rows add up to \(signedTotal) strokes against the baseline."
        }
        if windowRounds == 1 {
            return "Over this round the five rows add up to \(signedTotal) strokes against the baseline."
        }
        return
            "Over these \(windowRounds) rounds the five rows add up to \(signedTotal) strokes against the baseline."
    }
    static let vsParByTee =
        "What each kind of tee shot actually cost you, per hole. The trouble tax below is the difference between the last row and the first."
    static let troubleTax =
        "Extra strokes per hole when the tee shot finds trouble, against your own fairway holes."
    /// "Tax" is the app's own word, and the owner's reading of it (2026-08-03)
    /// was "what the hell is tax in golf?". The NAME stays — it is short, it is
    /// the same noun on three cards, and a longer one would not survive a value
    /// column — but every tax row now has an info-sheet card TITLED with those
    /// exact words. Hence this sentence: the penalty tax had no explanation of
    /// its own before, only a sample.
    static let penaltyTax =
        "Extra strokes per hole on the holes where you took a penalty, against your own penalty-free holes."
    static let recovery = "Holes where the shot after trouble got you back in play."
    static let penalties = "Penalty strokes per round."
    static let proximityProxy =
        "How far the first putt was on greens you hit — a stand-in for approach proximity, which the app does not measure directly."
    static let birdieConversion = "Greens hit that became a birdie or better."
    static let hardChipShare =
        "How often a missed green left a hard chip or pitch rather than a standard one."
    static let firstPuttSpread =
        "Where the first putt was on every hole you recorded one — not only the greens you hit."
    static let ladderBaseline =
        "The tick is the make rate your reference expects from that distance. For the two longest bands it sits at zero: the reference expects two putts from there, so any make is ahead of it."
    /// The sign, spelled out — the ladder's Cost column is the one place on the
    /// screen a reader meets a signed strokes figure without a legend beside it.
    static let ladderCost =
        "Cost is how many strokes this distance has cost you across the window, against the reference you picked. Plus means it cost you shots; minus means you gained them."
    /// The one sentence this pass ADDS. The missed-green tax had no row hint to
    /// move, and a card body that is a bare sample sentence says nothing.
    static let costOfMissedGreen =
        "What a hole costs you against par on average with the green hit, and with it missed."
    static let missedGreenTax =
        "The difference between what a hole costs you with the green hit and with it missed."
    static let threePutt = "Holes with three putts or more."
    static let longThreePutt = "Three-putts that started from over 8 m."
    static let puttsPerGir = "Putts taken on holes where you hit the green."
    static let puttsAfterMissedGreen = "Putts taken on holes where you missed the green."
    static let puttsByPar =
        "Putts per hole on each kind of hole — every hole you recorded putts on, green hit or not."
    static let conversionInside2m =
        "First putts from inside 2 m that went in — across every hole, not only chipped ones. The app records no chip-and-hole cross-tab."
    static let chipIns = "Short-game shots that went in without a putt."

    // MARK: Capture v2 (wave 4)

    static let greenMissHead = "Where you miss the green"
    static let greenMiss =
        "Recorded misses only. Long is past the flag, short is in front of it."
    static let teeFanHead = "Where your tee shots finish"
    static let teeFan =
        "Side is recorded whenever the drive left the fairway. The darker block is trouble."
    static let scrambling = "Missed greens where you still got up and down for par or better."
    static let sandSave = "Missed greens from a bunker where you still got up and down."
    static let multiChip =
        "Missed greens that took more than one shot to reach the green. Holes where you did not count are treated as one."
    static let multiChipBunker = "Bunker holes that took more than one shot to get out."
    static let extraShortGameStrokes =
        "Short-game shots beyond one per missed green, across this window."
    static let penaltySourceInfoTitle = "Where the penalties came from"

    /// The ⓘ card's live sentence. Absolute counts, not percentages: the sample
    /// is usually tiny, and `MIN_RATE_DENOMINATOR` would otherwise hide the
    /// whole card.
    static func penaltySourceInfo(
        recorded: Double, tee: Double, approach: Double, short: Double
    ) -> String {
        "Of \(StatsFormat.quantity(recorded, .labelledPenaltyHoles)) you labelled, \(StatsFormat.count(tee)) came off the tee, \(StatsFormat.count(approach)) on the approach and \(StatsFormat.count(short)) around the green."
    }

    // MARK: Capture step (§B.5, §D.4)

    /// The worded trigger on the capture card. One sheet, not eleven glyphs.
    static let statExplainerTrigger = "What these mean"
    static let statExplainerTitle = "What these mean"
    static let girPending = "Will be filled in from your score when you close this."
    static let girDisagreeMiss =
        "Your score says this green was missed. Tap to change it, or leave it."
    static let girDisagreeHit =
        "Your score says this green was hit. Tap to change it, or leave it."
    static let avgVsParByPar = "Your average score against par on each kind of hole."
    static let doubleBogeyPlus = "Holes at double bogey or worse, per round."
    static let bounceBack = "Holes after a bogey or worse that came back at par or better."

    /// Why a priority row has no number, in the reader's terms.
    static func coverage(_ priority: StatsPriority) -> String {
        priority.roundsInWindow == 1
            ? "This round has no data for it."
            : "None of these \(priority.roundsInWindow) rounds has data for it."
    }

    /// The one line under a priority row: the sample the average rests on, or
    /// — when there is no average — why there is not one.
    static func priorityCoverage(_ priority: StatsPriority) -> String {
        priority.hasData
            ? "over \(StatsFormat.quantity(Double(priority.roundsCovered), .rounds))"
            : coverage(priority)
    }

    /// The trend card's number: the latest point, in the measure's own units.
    static func trendHeadline(_ trend: StatsTrend) -> String {
        guard let last = trend.points.last else { return notRecorded }
        switch trend.kind {
        case .percentage:
            return "\(Int((last * 100).rounded()))%"
        case .strokesLost:
            return StatsFormat.signedNumber(last)
        }
    }

    static func trendSample(_ trend: StatsTrend) -> String {
        "\(trend.points.count) rounds"
    }

    /// The round's own name when it has one, else the course — the same
    /// name-over-course fallback the round list and round header apply.
    static func roundLabel(_ row: StatsRoundRow) -> String {
        let named = (row.name ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if !named.isEmpty { return named }
        let course = (row.courseName ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        return course.isEmpty ? "Round" : course
    }

    static func roundSubtitle(_ row: StatsRoundRow) -> String {
        var parts = [StatsFormat.day(row.date)]
        let course = (row.courseName ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if !course.isEmpty, course != roundLabel(row) { parts.append(course) }
        parts.append(row.holeCount == 1 ? "1 hole" : "\(row.holeCount) holes")
        return parts.joined(separator: " · ")
    }
}
