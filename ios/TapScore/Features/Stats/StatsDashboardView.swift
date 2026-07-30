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
            let created = StatsDashboardStore(api: environment.api)
            store = created
            await created.load()
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
            priorities(model)
            trends(model)
            ForEach(model.presentPanels, id: \.rawValue) { id in
                panel(id, model)
            }
            roundList(model)
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

    // MARK: - Practice priorities

    /// The waterfall, ranked worst first — the one panel that answers "what
    /// should I work on".
    private func priorities(_ model: StatsDashboardModel) -> some View {
        let magnitude =
            model.priorities.compactMap { $0.perRound.map(abs) }.max() ?? 0
        return VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: "Practice priorities")
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
    }

    private func priorityRow(_ priority: StatsPriority, magnitude: Double) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                Text(StatsFormat.title(priority.component))
                    .font(TapFont.ui(size: 14.4, weight: .bold))
                    .foregroundStyle(TapColors.text)
                Spacer(minLength: 0)
                if let perRound = priority.perRound {
                    Text(StatsFormat.strokesPerRound(perRound))
                        .font(TapFont.ui(size: 14.4, weight: .bold))
                        .foregroundStyle(StatsChartColor.forStrokesLost(perRound))
                } else {
                    // Words, not a zero bar. "Not enough data" and "exactly
                    // average" are different sentences and must not share a
                    // rendering.
                    Text(StatsCopy.notEnoughData)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                }
            }
            if let perRound = priority.perRound {
                StatsSignedBar(value: perRound, magnitude: magnitude)
            }
            Text(
                priority.hasData
                    ? StatsFormat.subtitle(priority.component)
                    : StatsCopy.coverage(priority)
            )
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

    // MARK: - Module panels

    @ViewBuilder
    private func panel(_ id: StatsPanelID, _ model: StatsDashboardModel) -> some View {
        let isOpen = expanded.contains(id)
        VStack(alignment: .leading, spacing: 0) {
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
                    .accessibilityIdentifier("stats-panel-\(id.rawValue)")

                    if isOpen {
                        detail(id, model)
                    }
                }
                .padding(TapSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    /// The one figure the collapsed card carries. nil when the module's own
    /// headline rate has no sample — the card still appears (the module WAS
    /// recorded), it just has nothing to say until it is opened.
    private static func headline(_ id: StatsPanelID, _ model: StatsDashboardModel) -> String? {
        switch id {
        case .tee:
            return model.tee.flatMap { StatsFormat.rateWithSample($0.fairway) }
                .map { "Fairways \($0)" }
        case .approach:
            return model.approach.flatMap { StatsFormat.rateWithSample($0.gir) }
                .map { "Greens in regulation \($0)" }
        case .putting:
            return model.putting.flatMap { StatsFormat.average($0.puttsPerGirHole) }
                .map { "\($0) putts per green hit" }
        case .shortGame:
            return model.shortGame.flatMap { StatsFormat.rateWithSample($0.scramble.overall) }
                .map { "Scrambling \($0)" }
        case .scoring:
            return model.scoring.flatMap {
                StatsFormat.average($0.doubleBogeyPlusPerRound)
            }.map { "\($0) doubles or worse per round" }
        }
    }

    @ViewBuilder
    private func detail(_ id: StatsPanelID, _ model: StatsDashboardModel) -> some View {
        switch id {
        case .tee:
            if let panel = model.tee { teeDetail(panel) }
        case .approach:
            if let panel = model.approach { approachDetail(panel) }
        case .putting:
            if let panel = model.putting { puttingDetail(panel) }
        case .shortGame:
            if let panel = model.shortGame { shortGameDetail(panel) }
        case .scoring:
            if let panel = model.scoring { scoringDetail(panel) }
        }
    }

    // MARK: Tee

    private func teeDetail(_ panel: StatsTeePanel) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.md) {
            StatsSplitBar(segments: [
                .init(id: "fairway", share: panel.fairway.value ?? 0, color: TapColors.primary),
                .init(id: "inPlay", share: panel.inPlayOnly.value ?? 0, color: TapColors.accent),
                .init(id: "trouble", share: panel.trouble.value ?? 0, color: TapColors.danger),
            ])
            legend([
                ("Fairway", TapColors.primary, StatsFormat.rate(panel.fairway)),
                ("In play", TapColors.accent, StatsFormat.rate(panel.inPlayOnly)),
                ("Trouble", TapColors.danger, StatsFormat.rate(panel.trouble)),
            ])
            figures([
                ("Trouble tax", StatsFormat.average(panel.troubleTax, signed: true),
                    StatsCopy.troubleTax),
                ("Recovery", StatsFormat.rateWithSample(panel.recovery), StatsCopy.recovery),
                ("Penalties", StatsFormat.average(panel.penaltiesPerRound), StatsCopy.penalties),
            ])
        }
    }

    // MARK: Approach

    private func approachDetail(_ panel: StatsApproachPanel) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.md) {
            subhead("Greens hit, by where the tee shot finished")
            miniBars([
                ("From the fairway", panel.girByTee.fairway),
                ("From in play", panel.girByTee.inPlay),
                ("From trouble", panel.girByTee.trouble),
            ])
            subhead("First putt on greens hit")
            Text(StatsCopy.proximityProxy)
                .font(TapFont.ui(size: 12.0))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
            miniBars(
                PuttBucket.allCases.map {
                    (StatsFormat.title($0), panel.girFirstPuttMix[$0] ?? Rate(value: nil, n: 0, d: 0))
                })
            figures([
                ("Birdie conversion", StatsFormat.rateWithSample(panel.birdieConversion),
                    StatsCopy.birdieConversion)
            ])
        }
    }

    // MARK: Putting

    private func puttingDetail(_ panel: StatsPuttingPanel) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.md) {
            subhead("Holed on the first putt")
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
            figures([
                ("Three-putts", StatsFormat.rateWithSample(panel.threePutt), StatsCopy.threePutt),
                ("Three-putts from over 8 m",
                    StatsFormat.rateWithSample(panel.threePuttsFromOver8m), StatsCopy.longThreePutt),
                ("Putts per green hit", StatsFormat.average(panel.puttsPerGirHole),
                    StatsCopy.puttsPerGir),
            ])
        }
    }

    // MARK: Short game

    private func shortGameDetail(_ panel: StatsShortGamePanel) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.md) {
            subhead("Scrambling")
            miniBars([
                ("Standard", panel.scramble.standard),
                ("Hard", panel.scramble.hard),
            ])
            subhead("Chipped to inside 2 m")
            miniBars([
                ("Standard", panel.chipInside2m.standard),
                ("Hard", panel.chipInside2m.hard),
            ])
            figures([
                ("Holed from inside 2 m", StatsFormat.rateWithSample(panel.conversionInside2m),
                    StatsCopy.conversionInside2m),
                ("Chip-ins", StatsFormat.count(panel.chipIns), StatsCopy.chipIns),
            ])
        }
    }

    // MARK: Scoring

    private func scoringDetail(_ panel: StatsScoringPanel) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.md) {
            subhead("Average vs par")
            figures([
                ("Par 3", StatsFormat.average(panel.avgVsParByParGroup.par3, signed: true), nil),
                ("Par 4", StatsFormat.average(panel.avgVsParByParGroup.par4, signed: true), nil),
                ("Par 5", StatsFormat.average(panel.avgVsParByParGroup.par5, signed: true), nil),
                ("Doubles or worse", StatsFormat.average(panel.doubleBogeyPlusPerRound),
                    StatsCopy.doubleBogeyPlus),
                ("Bounce-back", StatsFormat.rateWithSample(panel.bounceBack), StatsCopy.bounceBack),
            ])
        }
    }

    // MARK: Detail primitives

    private func subhead(_ text: String) -> some View {
        Text(text)
            .font(TapFont.ui(size: 11.2, weight: .bold))
            .tracking(11.2 * 0.06)
            .foregroundStyle(TapColors.textMuted)
            .textCase(.uppercase)
    }

    private func legend(_ items: [(String, Color, String?)]) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            ForEach(items, id: \.0) { title, color, value in
                HStack(spacing: TapSpacing.sm) {
                    Circle().fill(color).frame(width: 8, height: 8)
                    Text(title)
                        .font(TapFont.ui(size: 13.6))
                        .foregroundStyle(TapColors.text)
                    Spacer(minLength: 0)
                    Text(value ?? StatsCopy.notRecorded)
                        .font(TapFont.ui(size: 13.6, weight: .bold))
                        .foregroundStyle(value == nil ? TapColors.textMuted : TapColors.text)
                }
            }
        }
    }

    /// Label / value / explanation rows. A `nil` value prints
    /// "Not recorded" rather than a zero — the display policy's absent case.
    private func figures(_ items: [(String, String?, String?)]) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            ForEach(items, id: \.0) { title, value, hint in
                VStack(alignment: .leading, spacing: 1) {
                    HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                        Text(title)
                            .font(TapFont.ui(size: 13.6))
                            .foregroundStyle(TapColors.text)
                        Spacer(minLength: 0)
                        Text(value ?? StatsCopy.notRecorded)
                            .font(TapFont.ui(size: 13.6, weight: .bold))
                            .foregroundStyle(value == nil ? TapColors.textMuted : TapColors.text)
                    }
                    if let hint {
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

    private func miniBars(_ items: [(String, Rate)]) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            ForEach(items, id: \.0) { title, rate in
                HStack(spacing: TapSpacing.sm) {
                    Text(title)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.text)
                        .frame(width: 116, alignment: .leading)
                    // A bar is only drawn for a sample the display policy is
                    // willing to express as a percentage. Below that the reading
                    // is a fraction and a bar would give three attempts the same
                    // visual weight as thirty.
                    StatsMiniBar(share: StatsFormat.isThin(rate) ? nil : rate.value)
                    Text(StatsFormat.rate(rate) ?? StatsCopy.notRecorded)
                        .font(TapFont.ui(size: 12.8, weight: .bold))
                        .foregroundStyle(
                            StatsFormat.rate(rate) == nil ? TapColors.textMuted : TapColors.text
                        )
                        .frame(width: 68, alignment: .trailing)
                }
                .accessibilityElement(children: .combine)
            }
        }
    }

    // MARK: - Round list

    private func roundList(_ model: StatsDashboardModel) -> some View {
        let magnitude =
            model.rounds
            .flatMap { row in
                StrokesLostComponent.allCases.compactMap { row.waterfall[$0].map(abs) }
            }
            .max() ?? 0
        return VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: "Rounds", count: "\(model.rounds.count)")
            ForEach(model.rounds) { row in
                roundRow(row, magnitude: magnitude)
            }
        }
        .accessibilityIdentifier("stats-rounds")
    }

    // NAVIGATION SEAM: the per-round drill-down (proposal §4.4) attaches here —
    // wrap this row in a Button/NavigationLink carrying `row.id`, which is all
    // `PlayerStatsEndpoints.myRoundStats` needs. Left inert on purpose: a row
    // that looks tappable and pushes nothing is worse than one that does not.
    private func roundRow(_ row: StatsRoundRow, magnitude: Double) -> some View {
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
        .accessibilityIdentifier("stats-round-row")
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

    static let prioritiesHint =
        "Strokes lost per round against a fixed baseline, worst first. Positive costs you shots."
    static let troubleTax =
        "Extra strokes per hole when the tee shot finds trouble, against your own fairway holes."
    static let recovery = "Holes where the shot after trouble got you back in play."
    static let penalties = "Penalty strokes per round."
    static let proximityProxy =
        "How far the first putt was on greens you hit — a stand-in for approach proximity, which the app does not measure directly."
    static let birdieConversion = "Greens hit that became a birdie or better."
    static let ladderBaseline =
        "The tick is the make rate the expected-putts table implies. For 4–8 m and over 8 m it sits at zero: the table expects two putts from there, so any make is ahead of it."
    static let threePutt = "Holes with three putts or more."
    static let longThreePutt = "Three-putts that started from over 8 m."
    static let puttsPerGir = "Putts taken on holes where you hit the green."
    static let conversionInside2m =
        "First putts from inside 2 m that went in — across every hole, not only chipped ones. The app records no chip-and-hole cross-tab."
    static let chipIns = "Short-game shots that went in without a putt."
    static let doubleBogeyPlus = "Holes at double bogey or worse, per round."
    static let bounceBack = "Holes after a bogey or worse that came back at par or better."

    /// Why a priority row has no number, in the reader's terms.
    static func coverage(_ priority: StatsPriority) -> String {
        priority.roundsInWindow == 1
            ? "This round has no data for it."
            : "None of these \(priority.roundsInWindow) rounds has data for it."
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
