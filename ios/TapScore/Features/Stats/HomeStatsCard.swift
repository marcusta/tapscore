import Foundation
import Observation
import SwiftUI

/// The home screen's statistics card: three numbers, one instruction, and a way
/// in — spec items 18–25 of `docs/proposals/home-redesign-ios.md`.
///
/// It is a GLANCE, not a dashboard. Everything the card knows comes from one
/// page of `GET /players/me/stats` reduced by the same pure functions the
/// dashboard uses (`StatsWindow.apply` → `StatsDashboardModel.build`), so the
/// two surfaces cannot disagree about what a fairway percentage is. There is no
/// paging loop here and there must not be one: `StatsDashboardStore` exists to
/// walk a career, and the home screen is the last place that should spend forty
/// requests before it can draw.
///
/// The card also never explains itself. A failed fetch, a dead session, an empty
/// window or a window whose three tiles all lack a denominator all mean the same
/// thing on this screen — no card. A home screen that says "couldn't load your
/// statistics" makes a network blip look like something the player must act on,
/// which is the same rule the "Out now" strip follows.

// MARK: - The pure fold

/// One tile: a reading and what it measures. The value is already formatted by
/// `StatsFormat` — the view does no arithmetic and no rounding, so the display
/// policy (percentage / fraction / absent) is applied in exactly one place.
struct HomeStatsTile: Identifiable, Equatable, Sendable {
    var id: String
    var value: String
    var label: String
    /// The thin-sample disclosure, when the display policy demands one — the
    /// average tiles' equivalent of a rate degrading to "2 of 3". Nil on a
    /// sample the policy trusts.
    var note: String? = nil
}

/// Everything the card draws, or **nil when there is nothing worth drawing**.
///
/// Nil is the card's whole error vocabulary, which is why `build` returns an
/// optional rather than an "empty" model: an empty model is a thing a view can
/// render by accident.
struct HomeStatsCardModel: Equatable, Sendable {
    /// The muted half of the title row — the persisted window, in words.
    var windowLabel: String
    /// Up to three tiles, in reading order: the scorecard, then tee to green.
    var tiles: [HomeStatsTile]
    /// The strokes-lost leader as a sentence, or nil when no component has data.
    var priorityLine: String?

    /// Reduce one page of rows to the card.
    ///
    /// - Parameter preset: the window the player last chose on the dashboard.
    ///   A persisted `.custom` is deliberately NOT honoured here — the custom
    ///   FILTER is a within-session refinement that `StatsWindowPreference`
    ///   never stores, so `.custom` on a cold launch is the empty filter, which
    ///   admits everything while the title row would claim "Custom". The card
    ///   falls back to the default window and says so truthfully instead.
    /// - Parameter hasMore: the server had history beyond this page. Only
    ///   changes the LABEL, and only for a window that is not count-bounded:
    ///   "This year" over the newest twenty rounds is a claim the card cannot
    ///   back, so it says which twenty.
    static func build(
        rows: [PlayerRoundStats],
        preset: StatsWindowPreset,
        hasMore: Bool,
        now: Date,
        calendar: Calendar = .current
    ) -> HomeStatsCardModel? {
        let window = effective(preset)
        let rounds = StatsWindow.apply(
            preset: window, filter: StatsRoundFilter(), to: rows, now: now, calendar: calendar)
        guard !rounds.isEmpty else { return nil }

        let model = StatsDashboardModel.build(rows: rounds)
        let tiles = tiles(model)
        // Rule 21: three empty tiles is a card with nothing in it, and rule 19
        // says that is the same as no card. The priority line alone does not
        // earn one — a sentence with no numbers over it reads as a verdict.
        guard !tiles.isEmpty else { return nil }

        // "Truncated" is `needsMoreHistory`'s question, not `hasMore`'s: a
        // page that already reaches past January 1st has proven "This year"
        // complete however much older history the server still holds.
        let truncated = StatsWindow.needsMoreHistory(
            preset: window, filter: StatsRoundFilter(), loaded: rows,
            hasMore: hasMore, now: now, calendar: calendar)

        return HomeStatsCardModel(
            windowLabel: label(window, roundCount: rounds.count, truncated: truncated),
            tiles: tiles,
            priorityLine: priorityLine(model))
    }

    /// The window the card actually applies. See `build`'s note on `.custom`.
    static func effective(_ preset: StatsWindowPreset) -> StatsWindowPreset {
        preset == .custom ? StatsWindowPreference.fallback : preset
    }

    static func label(_ preset: StatsWindowPreset, roundCount: Int, truncated: Bool) -> String {
        guard preset.roundLimit == nil, truncated else { return preset.title }
        return "\(preset.title) — newest \(roundCount)"
    }

    /// The three data-conditioned readings, each omitted when its denominator is
    /// zero. `StatsFormat.rate` and `.average` already answer nil for that case,
    /// so the gate is the format call rather than a second copy of the rule.
    static func tiles(_ model: StatsDashboardModel) -> [HomeStatsTile] {
        var tiles: [HomeStatsTile] = []
        let vsPar = vsParPerHole(model.totals)
        if let value = StatsFormat.average(vsPar, signed: true) {
            // `average` alone escapes the display policy (its own doc says so);
            // the tile prints no fraction to degrade into, so under the floor
            // it carries the sample as a note — the dashboard's honesty in the
            // tile's shape.
            let note: String? =
                switch StatMeasuresMath.rateDisplay(vsPar) {
                case .fraction: StatsFormat.averageSample(vsPar, unit: .holes)
                case .absent, .percentage: nil
                }
            tiles.append(
                HomeStatsTile(id: "vsPar", value: value, label: "Vs par per hole", note: note))
        }
        if let tee = model.tee, let value = StatsFormat.rate(tee.fairway) {
            tiles.append(HomeStatsTile(id: "fairways", value: value, label: "Fairways hit"))
        }
        if let approach = model.approach, let value = StatsFormat.rate(approach.gir) {
            tiles.append(HomeStatsTile(id: "gir", value: value, label: "Greens in regulation"))
        }
        return tiles
    }

    /// Strokes vs par PER HOLE over the window.
    ///
    /// Per hole rather than per round because a window mixes eighteens with
    /// nines, and a per-round average over that mix is a number about round
    /// lengths as much as about scoring. The subtraction is the summed
    /// scorecard's own (`strokesTotal − parTotal`, the waterfall's `total`), so
    /// it carries no nominal-par approximation.
    static func vsParPerHole(_ m: StatMeasures) -> Rate {
        StatMeasuresMath.rate(m.strokesTotal - m.parTotal, m.holesScored)
    }

    /// The worst component, in words. `model.priorities` is already ranked worst
    /// first with the no-data components sunk to the bottom, so the leader is the
    /// first row that `hasData`.
    ///
    /// It must also actually COST something. `penalties` is the one term that is
    /// never nil — a round with no penalties records 0.0, not "unknown" — so a
    /// window with nothing else measured always has a leader, and the card would
    /// say "Costing you most: Penalties" to a player who took none. The card
    /// prints no number beside the name, so a non-positive leader has nothing to
    /// say and says nothing.
    static func priorityLine(_ model: StatsDashboardModel) -> String? {
        guard let leader = model.priorities.first(where: \.hasData),
            let cost = leader.perRound, cost > 0
        else { return nil }
        return "Costing you most: \(StatsFormat.title(leader.component))"
    }
}

// MARK: - The store

/// One page of `GET /players/me/stats`, and nothing else.
///
/// Shaped like `FriendsActivityStore` — a small session-scoped store whose
/// failure mode is silence — rather than like `StatsDashboardStore`, whose
/// cursor walking, page budget and window switching all exist to serve a screen
/// the player asked for. Reusing that machinery here would put a forty-request
/// worst case behind a card nobody opened.
@MainActor
@Observable
final class HomeStatsStore {
    /// Twenty rows covers every count-based window the card can be asked for
    /// (the widest is `.last20`) in a single request.
    static let pageSize = 20

    /// The rendered card, or nil for every reason the card has: not signed in,
    /// the fetch failed, the session is dead, the window is empty, or no tile
    /// had a denominator.
    private(set) var card: HomeStatsCardModel?

    private let api: TapScoreAPI
    private let defaults: UserDefaults
    private let calendar: Calendar
    private let now: @Sendable () -> Date

    /// The auth key the last load ran for — the same dedupe `LandingLoader`
    /// applies, and for the same reason: `.task(id:)` fires on appearance as
    /// well as on change, so without it the launch sequence alone fetches twice.
    private var loadedKey: String?

    init(
        api: TapScoreAPI,
        defaults: UserDefaults = .standard,
        calendar: Calendar = .current,
        now: @escaping @Sendable () -> Date = Date.init
    ) {
        self.api = api
        self.defaults = defaults
        self.calendar = calendar
        self.now = now
    }

    /// - Parameter force: bypass the dedupe (pull-to-refresh).
    func load(auth: AuthState, force: Bool = false) async {
        guard case .signedIn = auth else {
            // A sign-out must clear the card, or the previous account's numbers
            // stay on the landing of a device nobody is signed into.
            card = nil
            loadedKey = nil
            return
        }
        let key = LandingLoader.key(auth)
        guard force || key != loadedKey else { return }
        loadedKey = key

        do {
            let page = try await api.send(
                PlayerStatsEndpoints.myStats,
                PlayerStatsMyStatsInput(limit: Double(Self.pageSize), cursor: nil))
            card = HomeStatsCardModel.build(
                rows: page.rounds,
                preset: StatsWindowPreference.load(defaults: defaults),
                hasMore: page.nextCursor != nil,
                now: now(),
                calendar: calendar)
        } catch APIError.unauthorized {
            // Rule 19: a dead session's card is absent, silently — and stays
            // absent, because a dead bearer is not something a retry fixes.
            card = nil
        } catch {
            // Keep whatever is on screen — a failed REFRESH must not blank a
            // card that was accurate thirty seconds ago (the same rule
            // `FriendsActivityStore` states for its strip). Un-marking the key
            // lets the next non-forced firing retry a first load that failed.
            loadedKey = nil
        }
    }
}

// MARK: - The view

/// The card itself. Presentation only — no settings, no toggles, no window
/// picker (rule 24); those live on the dashboard and on the profile, where a
/// player who came to change something will look.
struct HomeStatsCard: View {
    let card: HomeStatsCardModel
    /// Opens the full dashboard. The WHOLE card is the button (rule 23) — there
    /// is nothing else on it to tap, so a smaller target would only be harder to
    /// hit.
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            TapCard {
                VStack(alignment: .leading, spacing: TapSpacing.md) {
                    // The window rides in the header's count slot: same face,
                    // same muted tier, one less thing to keep in sync.
                    SectionHeader(title: "Statistics", count: card.windowLabel)
                    // No trailing Spacer: every tile is fully flexible, so a
                    // Spacer would be a fourth equal column of nothing and
                    // three tiles would each get a quarter of the card.
                    HStack(alignment: .top, spacing: TapSpacing.md) {
                        ForEach(card.tiles) { tile in
                            tileView(tile)
                        }
                    }
                    if let line = card.priorityLine {
                        Text(line)
                            .font(TapFont.ui(size: 13.6))
                            .foregroundStyle(TapColors.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .padding(TapSpacing.lg)
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
            }
        }
        .buttonStyle(.plain)
        // Spelled out rather than `.combine`d: combining ON a Button can drop
        // the button trait, leaving VoiceOver a card it cannot activate.
        .accessibilityLabel(Self.accessibilityLabel(card))
        .accessibilityHint("Opens your statistics")
        .accessibilityIdentifier("home-stats-card")
    }

    private func tileView(_ tile: HomeStatsTile) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            Text(tile.value)
                .font(TapFont.display(size: 22.4, weight: .semibold))
                .foregroundStyle(TapColors.text)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(tile.label)
                .font(TapFont.ui(size: 12))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
            if let note = tile.note {
                Text(note)
                    .font(TapFont.ui(size: 10.4))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// The card read out in one sentence, in the order it is drawn.
    static func accessibilityLabel(_ card: HomeStatsCardModel) -> String {
        let readings = card.tiles.map { tile in
            tile.note.map { "\(tile.label) \(tile.value), \($0)" }
                ?? "\(tile.label) \(tile.value)"
        }
        return (["Statistics, \(card.windowLabel)"] + readings + [card.priorityLine].compactMap { $0 })
            .joined(separator: ". ")
    }
}
