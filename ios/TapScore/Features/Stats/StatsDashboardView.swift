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
            StatsPanelsView(model: model, expanded: $expanded)
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
