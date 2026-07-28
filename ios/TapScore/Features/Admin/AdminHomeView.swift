import SwiftUI

/// The operator screen — the native mirror of `src/admin/admin.component.ts`.
///
/// Same shape as the web: a row of counters, then two tabs over one fetch —
/// every round in the database (newest first, tap to open it through its share
/// token) and the player roster with activity and roles.
///
/// **Read-only — a DEFERRAL, recorded as one.** The web screen also grants and
/// revokes `super_admin` from the player rows (`admin.component.ts`'s
/// `toggleAdmin`, over `adminGrantRole` / `adminRevokeRole`); this one does not.
/// Nothing is missing to build it: both endpoints exist on the server and both
/// are already emitted into `API/Generated/AdminEndpoints.swift`, so the gap is
/// a decision, not a blocked dependency.
///
/// The decision: role administration is a two-tap, irreversible-in-practice
/// action whose real home is the CLI (`bun run grant:role`), and a phone screen
/// reached from an account inset is the worst place to put it — no confirmation
/// context, no audit trail the operator can see, and a fat-fingered revoke of
/// one's own grant locks the operator out of the very screen that would undo it.
/// The observability half is what the operator actually needs in the field, so
/// that is what shipped.
///
/// Reviewed and accepted as read-only for now (N4). If write parity is wanted
/// later it belongs behind an explicit confirmation with the target username
/// echoed back, and it must refuse to revoke the CALLER's own grant — the web
/// screen's `toggleAdmin` does not, which is a bug worth not porting.
///
/// **The gate is the server's.** `AdminAuthz` refuses every `/admin/*` read
/// without the unscoped grant, per request — so a grant revoked while this
/// screen is open turns the next load into `Phase.notAuthorized`, and the
/// screen says so plainly instead of pretending the database is empty.
struct AdminHomeView: View {
    @Environment(AppEnvironment.self) private var environment
    @Environment(\.dismiss) private var dismiss

    /// Built in `.task` rather than in a field initialiser: the store needs the
    /// environment's API actor, and it must not be rebuilt on every re-render.
    @State private var store: AdminStore?
    @State private var tab: Tab = .rounds
    @State private var path: [RoundRoute] = []

    enum Tab: String, CaseIterable {
        case rounds
        case players

        var title: String {
            switch self {
            case .rounds: "Rounds"
            case .players: "Players"
            }
        }
    }

    /// A pushed round, by the token the admin payload carries. The token IS the
    /// round's front door — the same handle a share link hands a friend — so
    /// this needs no new server surface.
    struct RoundRoute: Hashable {
        let token: String
    }

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: TapSpacing.lg) {
                    switch store?.phase ?? .loading {
                    case .loading:
                        loading
                    case .notAuthorized:
                        notAuthorized
                    case let .failed(message):
                        failure(message)
                    case .ready:
                        if let store {
                            statsGrid(store)
                            tabs
                            switch tab {
                            case .rounds: roundList(store)
                            case .players: playerList(store)
                            }
                        }
                    }
                }
                .padding(TapSpacing.lg)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(TapColors.bg)
            .safeAreaInset(edge: .top, spacing: 0) { header }
            .navigationDestination(for: RoundRoute.self) { route in
                // BOUNDARY: the round feature owns that screen entirely, exactly
                // as it does from the shell. The admin list hands over a token
                // and reads nothing back.
                RoundView(token: route.token)
            }
            .accessibilityIdentifier("admin-home")
        }
        .task {
            guard store == nil else { return }
            let store = AdminStore(api: environment.api)
            self.store = store
            await store.load()
        }
    }

    // MARK: - Chrome

    private var header: some View {
        HStack {
            Text("Admin")
                .font(TapFont.display(size: 17.6, weight: .semibold))
                .foregroundStyle(TapColors.text)
            Spacer(minLength: 0)
            Button("Done") { dismiss() }
                .buttonStyle(.plain)
                .font(TapFont.ui(size: 14.4, weight: .semibold))
                .foregroundStyle(TapColors.accent)
                .accessibilityIdentifier("admin-done")
        }
        .padding(TapSpacing.lg)
        .background(TapColors.surface)
        .overlay(alignment: .bottom) {
            Rectangle().fill(TapColors.border).frame(height: 1)
        }
    }

    private var loading: some View {
        HStack {
            ProgressView().controlSize(.small).tint(TapColors.primary)
            Text("Loading…")
                .font(TapFont.ui(size: 13.6))
                .foregroundStyle(TapColors.textMuted)
        }
        .accessibilityIdentifier("admin-loading")
    }

    /// The refusal, quiet and honest. Web: `.admin__denied`, including the
    /// grant hint — the recovery is a CLI line and is not guessable.
    private var notAuthorized: some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            Text("No longer authorized")
                .font(TapFont.ui(size: 14.4, weight: .semibold))
                .foregroundStyle(TapColors.text)
            Text("This area needs a super admin role.")
                .font(TapFont.ui(size: 13.6))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
            Text(verbatim: "bun run grant:role grant <username> super_admin")
                .font(TapFont.ui(size: 12.8))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityIdentifier("admin-denied")
    }

    private func failure(_ message: String) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            Text(message)
                .font(TapFont.ui(size: 13.6))
                .foregroundStyle(TapColors.danger)
                .fixedSize(horizontal: false, vertical: true)
            Button("Try again") { Task { await store?.load() } }
                .buttonStyle(.tap(.secondary))
                .accessibilityIdentifier("admin-retry")
        }
        .accessibilityIdentifier("admin-error")
    }

    // MARK: - Stats

    /// Web: `.admin__stats` — a flat list of counters in an auto-fit grid, so a
    /// new stat needs no layout change.
    private func statsGrid(_ store: AdminStore) -> some View {
        Group {
            if let stats = store.stats {
                LazyVGrid(
                    columns: Array(
                        repeating: GridItem(.flexible(), spacing: TapSpacing.sm),
                        count: 3
                    ),
                    spacing: TapSpacing.sm
                ) {
                    ForEach(Self.statRows(stats), id: \.label) { row in
                        statCard(value: row.value, label: row.label)
                    }
                }
                .accessibilityIdentifier("admin-stats")
            }
        }
    }

    /// Web: the `statRows` computed — same order, same labels.
    static func statRows(_ stats: AdminStats) -> [(label: String, value: String)] {
        [
            ("Rounds", AdminRowCopy.count(stats.rounds)),
            ("Playing", AdminRowCopy.count(stats.roundsActive)),
            ("Last 7d", AdminRowCopy.count(stats.roundsLast7Days)),
            ("Players", AdminRowCopy.count(stats.players)),
            ("Guests", AdminRowCopy.count(stats.guests)),
            ("Scores", AdminRowCopy.count(stats.scoreEvents)),
        ]
    }

    private func statCard(value: String, label: String) -> some View {
        TapCard {
            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(TapFont.display(size: 22.4, weight: .bold))
                    .foregroundStyle(TapColors.text)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                Text(label.uppercased())
                    .font(TapFont.ui(size: 11.2, weight: .bold))
                    .tracking(11.2 * 0.06)
                    .foregroundStyle(TapColors.textMuted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, TapSpacing.sm)
            .padding(.horizontal, TapSpacing.md)
        }
    }

    // MARK: - Tabs

    private var tabs: some View {
        HStack(spacing: TapSpacing.sm) {
            ForEach(Tab.allCases, id: \.self) { candidate in
                TapChip(
                    title: candidate.title,
                    isSelected: tab == candidate,
                    action: { tab = candidate }
                )
                .accessibilityIdentifier("admin-tab-\(candidate.rawValue)")
            }
            Spacer(minLength: 0)
        }
    }

    // MARK: - Rounds

    private func roundList(_ store: AdminStore) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: "All rounds", count: String(store.rounds.count))
            ForEach(store.rounds, id: \.roundId) { round in
                if let token = round.shareToken {
                    NavigationLink(value: RoundRoute(token: token)) {
                        roundRow(round)
                    }
                    .buttonStyle(.plain)
                } else {
                    // Web: the row is `disabled` when there is no token — a
                    // round without a friendly wrapper has no front door, and
                    // inventing one here would mean inventing server surface.
                    roundRow(round)
                        .opacity(0.7)
                }
            }
            if store.canLoadMore {
                Button(store.isLoadingMore ? "Loading…" : "Load more") {
                    Task { await store.loadMoreRounds() }
                }
                .buttonStyle(.tap(.secondary, fillsWidth: true))
                .disabled(store.isLoadingMore)
                .accessibilityIdentifier("admin-load-more")
            }
            if let problem = store.loadMoreProblem {
                Text(problem)
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.danger)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .accessibilityIdentifier("admin-rounds")
    }

    private func roundRow(_ round: AdminRoundSummary) -> some View {
        TapCard {
            VStack(alignment: .leading, spacing: TapSpacing.xs) {
                HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                    Text(AdminRowCopy.courseTitle(round))
                        .font(TapFont.ui(size: 16, weight: .bold))
                        .foregroundStyle(TapColors.text)
                        .lineLimit(1)
                    Spacer(minLength: 0)
                    TapPillLabel(
                        text: AdminRowCopy.statusLabel(round.status),
                        background: round.status == .active
                            ? TapColors.accentSoft
                            : TapColors.surfaceSunken,
                        foreground: round.status == .active
                            ? TapColors.accent
                            : TapColors.textMuted
                    )
                }
                Text(AdminRowCopy.who(round))
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.textMuted)
                    .lineLimit(1)
                Text(AdminRowCopy.roundMeta(round))
                    .font(TapFont.ui(size: 12.8))
                    .monospacedDigit()
                    .foregroundStyle(TapColors.textMuted)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, TapSpacing.md)
            .padding(.horizontal, TapSpacing.lg)
        }
    }

    // MARK: - Players

    private func playerList(_ store: AdminStore) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: "All players", count: String(store.players.count))
            ForEach(store.players, id: \.playerId) { player in
                TapCard {
                    VStack(alignment: .leading, spacing: TapSpacing.xs) {
                        HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                            Text(player.displayName)
                                .font(TapFont.ui(size: 16, weight: .bold))
                                .foregroundStyle(TapColors.text)
                                .lineLimit(1)
                            Spacer(minLength: 0)
                            if let chip = AdminRowCopy.roleChip(player) {
                                TapPillLabel(
                                    text: chip,
                                    background: TapColors.accentSoft,
                                    foreground: TapColors.accent
                                )
                            }
                        }
                        Text(AdminRowCopy.playerMeta(player))
                            .font(TapFont.ui(size: 12.8))
                            .monospacedDigit()
                            .foregroundStyle(TapColors.textMuted)
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, TapSpacing.md)
                    .padding(.horizontal, TapSpacing.lg)
                }
            }
        }
        .accessibilityIdentifier("admin-players")
    }
}
