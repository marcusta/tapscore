import SwiftUI

/// The round screen — the app's core surface, and the one screen a player
/// actually uses on the course.
///
/// **Boundary contract**: constructed as `RoundView(token:)` and nothing else.
/// The shell navigates here; everything the screen needs beyond the token comes
/// from `AppEnvironment` in the SwiftUI environment, so the two streams meet at
/// a single one-argument initialiser.
///
/// All decisions live in `RoundStore`. This file is layout: it owns no state
/// machine, no timer, no fetch. The store is created lazily in `.task` because
/// the environment is not readable from `init`.
struct RoundView: View {
    @Environment(AppEnvironment.self) private var environment
    @Environment(\.dismiss) private var dismiss

    let token: String

    @State private var store: RoundStore?

    init(token: String) {
        self.token = token
    }

    var body: some View {
        ZStack {
            TapColors.bg.ignoresSafeArea()
            if let store {
                RoundScreen(store: store, shareURL: shareURL, onBack: { dismiss() })
            } else {
                ProgressView().controlSize(.large).tint(TapColors.primary)
            }
        }
        // The web round screen carries its own "← Home" affordance and no
        // system chrome, so the native bar must not draw a second, differently
        // styled one over the serif header. It is EMPTIED, not hidden:
        // `.toolbar(.hidden, for: .navigationBar)` also takes the interactive
        // pop gesture with it, and swiping back from the round screen is the
        // gesture an iPhone user reaches for first.
        .navigationBarBackButtonHidden(true)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.hidden, for: .navigationBar)
        .task {
            // `.task` runs on every appearance, and `onDisappear` below has by
            // then torn the store's scene hooks and live gate down. So a store
            // that already exists is RE-ARMED rather than skipped — otherwise
            // navigating away and back leaves a screen that renders fine and
            // never updates again.
            if let store {
                store.resumeIfNeeded()
                return
            }
            let created = RoundStore(token: token, environment: environment)
            store = created
            // Verification seam only (DEBUG): land on the leaderboard without a
            // tap, so a headless screenshot can reach the tab `simctl` cannot
            // press. It routes through `setTab`, the same call the tab bar
            // makes — it widens *how* the tab is chosen, never what it does.
            if let tab = LaunchTab.tab() { created.setTab(tab) }
            await created.start()
        }
        .onDisappear {
            guard let store else { return }
            // Detached: `onDisappear` runs while the view is going away, and the
            // teardown must complete even though this view's own tasks are being
            // cancelled — otherwise the SSE stream outlives the screen.
            Task.detached { await store.stop() }
        }
    }

    /// The link the share card offers. Built from the resolved web origin (not
    /// the API base) so a build OVERRIDDEN to the dev server (`-apiBaseURL
    /// http://localhost:3030/api`) hands out a `localhost:3030` link and a
    /// production build the `/tapscore` sub-path one.
    private var shareURL: String {
        var url = environment.configuration.webOrigin
        url.append(path: "round")
        var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        components?.queryItems = [URLQueryItem(name: "token", value: token)]
        return components?.url?.absoluteString ?? ""
    }
}

/// The two-tab body, once the store exists.
///
/// Anatomy is the web's `.round-view` (`src/round/round.component.ts`): the
/// header is INSIDE the scrolling region (`.round-view__main` scrolls the back
/// link, the title, the meta line and the format chips along with the panel),
/// and the only pinned thing is the dock — gold hole bar over dark tab bar.
/// Nothing here decides anything: every value is read off the store, and every
/// colour and face comes from the design system.
private struct RoundScreen: View {
    @Bindable var store: RoundStore
    let shareURL: String
    let onBack: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            panel
            dock
        }
        .background(TapColors.bg)
        .overlay(alignment: .top) { toast }
    }

    private var header: RoundHeaderView {
        RoundHeaderView(store: store, onBack: onBack)
    }

    // MARK: - Panel

    /// Each tab owns its own scroll view and puts `header` at the top of it —
    /// that is what makes the header scroll away on BOTH tabs instead of
    /// stealing a fixed band of a phone screen.
    @ViewBuilder
    private var panel: some View {
        switch store.tab {
        case .score:
            ScoreEntryView(store: store, shareURL: shareURL, header: header)
        case .leaderboard:
            LeaderboardView(store: store, header: header)
        }
    }

    // MARK: - Dock

    /// Web: `.round-view__dock` — hole bar over tab bar, elevated, pinned.
    private var dock: some View {
        VStack(spacing: 0) {
            if store.tab == .score, !store.playedOrder.isEmpty {
                HoleBar(
                    holeLabel: store.currentPlayedHole.map { store.occurrenceLabel($0.playHoleId) } ?? "–",
                    par: store.currentPlayedHole.map { store.par(of: $0.playHoleId) },
                    strokeIndex: store.currentPlayHole.map { countInt($0.baseStrokeIndex) },
                    canGoPrevious: store.canPrevHole,
                    canGoNext: store.canNextHole,
                    onPrevious: { store.prevHole() },
                    onNext: { store.nextHole() }
                )
            }
            BottomTabBar(
                tabs: [
                    .init(RoundTab.score, title: RoundTab.score.title, systemImage: "pencil.line"),
                    .init(RoundTab.leaderboard, title: RoundTab.leaderboard.title, systemImage: "trophy"),
                ],
                selection: tabBinding
            )
        }
        .tapShadow(TapShadows.shadowElevated)
        // Web: `padding-bottom: env(safe-area-inset-bottom)` on `.round-tabs` —
        // the dark bar runs under the home indicator, the labels do not.
        .background(TapColors.topbarBg.ignoresSafeArea(edges: .bottom))
    }

    private var tabBinding: Binding<RoundTab> {
        Binding(get: { store.tab }, set: { store.setTab($0) })
    }

    // MARK: - Toast

    /// Web: `.se-toast` — a centred primary-filled serif flash.
    @ViewBuilder
    private var toast: some View {
        if let toast = store.toast {
            Text(toast)
                .font(TapFont.display(size: 16.8, weight: .bold))
                .foregroundStyle(TapColors.primaryText)
                .padding(.vertical, TapSpacing.md)
                .padding(.horizontal, TapSpacing.xl)
                .background(
                    RoundedRectangle(cornerRadius: TapRadius.radius, style: .continuous)
                        .fill(TapColors.primary)
                )
                .tapShadow(TapShadows.shadowElevated)
                .padding(.top, TapSpacing.sm)
                .transition(.move(edge: .top).combined(with: .opacity))
                .accessibilityAddTraits(.isStaticText)
        }
    }
}

/// The round header, rendered by whichever tab is on screen — it is the first
/// block of that tab's scroll content, not a fixed band above it.
///
/// Web: `.round-view__back`, `.round-view__head`, `.round-view__meta`,
/// `.round-view__formats`, all inside `.round-view__main`.
struct RoundHeaderView: View {
    @Bindable var store: RoundStore
    let onBack: () -> Void

    @State private var showsManageSheet = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: TapSpacing.sm) {
                Button(action: onBack) {
                    Text("← Home")
                        .font(TapFont.ui(size: 14.4, weight: .semibold))
                        .foregroundStyle(TapColors.textMuted)
                        .padding(.vertical, TapSpacing.xs)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                Spacer(minLength: 0)
                manageButton
            }
            .padding(.horizontal, TapSpacing.lg)

            HStack(alignment: .firstTextBaseline, spacing: TapSpacing.md) {
                // 1.8rem Fraunces 600, -0.02em. Multi-line is fine: a long
                // course name wraps rather than shrinking the title.
                Text(store.round?.courseNameSnapshot ?? "Round")
                    .font(TapFont.display(size: 28.8, weight: .semibold))
                    .tracking(28.8 * -0.02)
                    .foregroundStyle(TapColors.text)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
                if store.loading {
                    ProgressView().controlSize(.small).tint(TapColors.accent)
                }
                statusBadge
            }
            .padding(.top, TapSpacing.sm)
            .padding(.horizontal, TapSpacing.lg)

            metaLine
                .padding(.top, TapSpacing.xs)
                .padding(.horizontal, TapSpacing.lg)

            if let error = store.error {
                Text(error)
                    .font(TapFont.ui(size: 12.8, weight: .semibold))
                    .foregroundStyle(TapColors.error)
                    .padding(.top, TapSpacing.xs)
                    .padding(.horizontal, TapSpacing.lg)
            }

            formatChips
        }
        .padding(.bottom, TapSpacing.md)
        // `onDismiss`, not the Done button: a sheet is as easily swiped away as
        // tapped away, and an error line the user already left behind must not
        // greet the next presentation. One mechanism, every exit.
        .sheet(isPresented: $showsManageSheet, onDismiss: { store.clearManageError() }) {
            // A successful delete dismisses the sheet and then leaves the
            // screen, which is `onBack` — the same exit the "← Home" link takes,
            // so there is one way off this screen and not two.
            RoundManageSheet(store: store, onDeleted: onBack)
        }
    }

    /// The manage entry point. Present only once the round has actually loaded:
    /// every row behind it acts on a round, and a sheet that opened on nothing
    /// would offer nothing.
    @ViewBuilder
    private var manageButton: some View {
        if store.round != nil {
            Button {
                showsManageSheet = true
            } label: {
                Image(systemName: "ellipsis.circle")
                    .font(.system(size: 20, weight: .regular))
                    .foregroundStyle(TapColors.textMuted)
                    // 44pt of thumb over a 20pt glyph, the same trade the
                    // account avatar makes.
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("round-manage-button")
            .accessibilityLabel("Manage round")
        }
    }

    /// Web: two muted spans. The interpunct is the native equivalent of the
    /// flex gap — a phone header is too narrow for the space to read as one.
    @ViewBuilder
    private var metaLine: some View {
        let date = store.round?.date ?? ""
        let holes = store.round.map { "\($0.playHoles.count) holes" } ?? ""
        let parts = [date, holes].filter { !$0.isEmpty }
        if !parts.isEmpty {
            Text(parts.joined(separator: " · "))
                .font(TapFont.ui(size: 14.4))
                .foregroundStyle(TapColors.textMuted)
        }
    }

    /// Web: `.round-view__status` — one accent pill carrying the round's state.
    ///
    /// It stays honest about degrade, which the web has no equivalent for: a
    /// round that quietly fell back to a 20 s poll says "Delayed" rather than
    /// claiming to be live.
    @ViewBuilder
    private var statusBadge: some View {
        if store.round?.status == .active, store.liveState != .degraded, store.liveState != .connecting {
            LiveBadge()
        } else {
            // Same pill, same tone — the web draws every round state in accent;
            // only the copy (and the announced label) differ.
            TapPillLabel(
                text: statusText,
                background: TapColors.accentSoft,
                foreground: TapColors.accent
            )
        }
    }

    private var statusText: String {
        switch store.liveState {
        case .connecting: return "Connecting"
        case .degraded: return "Delayed"
        case .idle, .live, .finished: break
        }
        switch store.round?.status {
        case .active: return RoundStatusTone.active.title
        case .complete: return RoundStatusTone.complete.title
        default: return RoundStatusTone.notStarted.title
        }
    }

    /// Web: `.round-view__formats` — a horizontally scrolling chip row. The
    /// selection is the leaderboard's visible slot; on the score tab the chips
    /// are a plain display of what the round is playing.
    @ViewBuilder
    private var formatChips: some View {
        let slots = store.round?.formatSlots ?? []
        if !slots.isEmpty {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: TapSpacing.sm) {
                    ForEach(slots, id: \.slotDefId) { slot in
                        TapChip(
                            title: label(of: slot),
                            isSelected: store.selectedSlotDefId == slot.slotDefId,
                            tone: .primary
                        ) {
                            store.selectedSlot = slot.slotDefId
                        }
                    }
                }
                .padding(.horizontal, TapSpacing.lg)
                .padding(.bottom, TapSpacing.xs)
            }
            .padding(.top, TapSpacing.lg)
        }
    }

    /// Web: `formatLabelFromSlot` — the server catalog's label, falling back to
    /// the slot's own metadata until the catalog arrives.
    private func label(of slot: FormatSlot) -> String {
        if let descriptor = store.formats.first(where: { $0.id == slot.formatId }) {
            return descriptor.label
        }
        return "\(slot.scoringMode.rawValue) · \(slot.teamShape.rawValue)"
    }
}

/// The round tabs' shared empty / error state.
///
/// `ContentUnavailableView` is the right *anatomy* and the wrong *face*: it
/// sets the system UI font and tints its symbol system-blue, which is the one
/// colour this app's palette does not contain. Same three parts, the app's own
/// faces — Fraunces title, Archivo body, muted ink.
struct RoundEmptyState: View {
    let title: String
    let systemImage: String
    let message: String

    var body: some View {
        VStack(spacing: TapSpacing.sm) {
            Image(systemName: systemImage)
                .font(.system(size: 34, weight: .regular))
                .foregroundStyle(TapColors.textMuted)
                .padding(.bottom, TapSpacing.xs)
            Text(title)
                .font(TapFont.display(size: 19.2, weight: .semibold))
                .foregroundStyle(TapColors.text)
            Text(message)
                .font(TapFont.ui(size: 14.4))
                .foregroundStyle(TapColors.textMuted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, TapSpacing.xxl)
        .padding(.horizontal, TapSpacing.lg)
        .accessibilityElement(children: .combine)
    }
}

/// The tab to open the round screen on, supplied at **launch**.
///
/// Same seam and the same DEBUG-only rule as `LaunchDeepLink`: `simctl` can
/// open a round headlessly but cannot press the tab bar, so a screenshot of the
/// leaderboard would otherwise need a human finger. The argument only picks
/// between the two tabs the user can already reach.
///
/// "DEBUG-only" is about the BEHAVIOUR, not the code: `parse` is compiled into
/// every configuration so the spelling stays testable, and it is `tab()` — the
/// only caller that reads the real process — that returns nil in release. A
/// release build therefore honours no launch argument, whatever is passed.
///
/// ```sh
/// xcrun simctl launch <udid> com.marcusandersson.tapscore \
///     -tapscoreDeepLink 'tapscore://round?token=…' -tapscoreTab board
/// ```
enum LaunchTab {
    static let argument = "-tapscoreTab"

    static func tab(arguments: [String] = ProcessInfo.processInfo.arguments) -> RoundTab? {
        #if DEBUG
        return parse(arguments: arguments)
        #else
        return nil
        #endif
    }

    /// Pure lookup, split out so the spelling is testable without a process.
    static func parse(arguments: [String]) -> RoundTab? {
        guard let index = arguments.firstIndex(of: argument), index + 1 < arguments.count else {
            return nil
        }
        switch arguments[index + 1].lowercased() {
        case "board", "leaderboard": return .leaderboard
        case "score": return .score
        default: return nil
        }
    }
}
