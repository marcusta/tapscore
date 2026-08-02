import SwiftUI

/// The landing screen — "your rounds", from two sources that are deliberately
/// rendered as one list.
///
/// - **Signed out**: no identity means no server dashboard, so the rounds this
///   *device* has opened (`DeviceRoundsStore`) stand in. That is the whole
///   anonymous front door, and it is not a degraded mode.
/// - **Signed in**: `GET /dashboard/my-rounds` (produced + created), merged and
///   deduped exactly like `src/landing/my-rounds.ts` does, then unioned with
///   the device list so a round opened here before signing in does not vanish
///   on sign-in.
///
/// The partition (Ongoing / Recently finished, 14-day window) is the Swift
/// image of `src/landing/partition.ts`, and it is a pure function of rows plus
/// a `now` — so it is tested rather than eyeballed.
///
/// **Presentation is the web's `.landing`** (`src/landing/landing.component.ts`):
/// a paper page, not a grouped `List`. Wordmark header, then serif section
/// headers over `card()` rows. The system `List` chrome was placeholder — it
/// painted the app in iOS grey on a client whose whole identity is the
/// scorecard palette, and every colour here now comes from `ThemeTokens`.
///
/// **The calls to action are gone from the page.** Starting a round is the
/// shell's Play pill (`PlayPill`, in the dock), reachable from every root
/// section rather than from this screen only, and the join door moved onto the
/// create screen where someone holding a code will look for it. A screen with
/// two stacked buttons at the top pushed the rounds — the thing people came to
/// read — below the fold.
struct RoundListView: View {
    @Environment(AppEnvironment.self) private var environment

    /// This device's recent-rounds list. Injected by `RootView` so the store
    /// that *records* an open is the same one that reads it back.
    let deviceRounds: DeviceRoundsStore

    /// Rows, failure copy and the server count — owned by a loader rather than
    /// by `@State` on the view, because the one thing this screen gets wrong is
    /// WHEN it loads, and "when" is not something a view body can be tested on.
    /// See `LandingLoader`.
    ///
    /// Injected by `RootView` rather than constructed here: the create flow
    /// hangs off the shell's Play pill now and needs these rows to de-dupe the
    /// name it pre-fills. The load-keying below is unchanged — this screen is
    /// still the only thing that decides when the loader runs.
    let loader: LandingLoader

    /// Asks the shell to open a round. The shell records the sighting; this
    /// screen never writes to the device list except on an explicit delete.
    let onOpen: (RoundOpenRequest) -> Void

    /// Asks the shell to open the read-only spectate screen for a round id.
    ///
    /// Deliberately separate from `onOpen`: that path carries a share token —
    /// the round's WRITE credential — and records the round as one this device
    /// plays. Watching a friend is neither. Defaulted so the parameter is
    /// additive for every other call site.
    var onSpectate: (String, String?) -> Void = { _, _ in }

    /// Asks the shell to switch to the Profile section — the identity strip's
    /// only job, and the same destination the account sheet's profile entry
    /// reaches. Defaulted so the screen stays constructible in isolation.
    var onOpenProfile: () -> Void = {}

    /// Asks the shell to push `AllRoundsView`. The recently-finished card shows
    /// three rows and this is the door to the rest; the screen itself owns no
    /// navigation.
    var onSeeAllRounds: () -> Void = {}

    /// The friends-activity feed behind the "Out now" strip. Owned here rather
    /// than by the shell because this is the only screen that renders it, and a
    /// failed load is a strip that silently does not appear.
    @State private var activity: FriendsActivityStore?

    /// One page of the player's stats, behind the statistics card. Owned here
    /// for the same reason the activity feed is: this is the only screen that
    /// renders it, and a failed load is a card that silently does not appear.
    @State private var stats: HomeStatsStore?

    /// True while the full stats dashboard is up. A SHEET rather than a push
    /// because `StatsDashboardView` carries its own `NavigationStack` and a
    /// "Done" button — it is presented exactly this way from `ProfileView`, and
    /// spec item 23 asks for the same destination, not a second presentation of
    /// it.
    @State private var dashboardOpen = false

    /// The row whose swipe-revealed Delete action was invoked, parked while
    /// the confirmation is up.
    ///
    /// The web ALWAYS confirms before a row leaves the landing (`askDelete` in
    /// `src/landing/landing.component.ts`), and one shared dialog serves every
    /// row there — same shape here. A single tap must not be able to remove a
    /// round: a swipe-revealed destructive action is deliberately confirmed.
    @State private var pendingRemoval: LandingRow?

    var body: some View {
        ScrollView {
            let partition = LandingRow.partition(loader.rows, now: Date())

            // Order (home redesign, spec item 12): who you are, what you are
            // playing, who else is out, what you just played. Every section is
            // invisible when empty, so the page shortens rather than
            // explaining itself.
            VStack(alignment: .leading, spacing: TapSpacing.xl) {
                header

                if let loadFailure = loader.loadFailure {
                    failureNotice(loadFailure)
                }

                ongoingSection(partition.ongoing)
                outNow
                finishedCard(partition.finished)
                recentFriendsSection

                if partition.finished.isEmpty && !loader.rows.isEmpty
                    && partition.ongoing.count <= HomeIdentity.ongoingPreviewLimit
                {
                    // Nothing finished inside the window, but there are rounds
                    // to look back at — the web's `.landing__history` link.
                    // Gated on the LOADED rows, not the partition: a viewer
                    // whose rounds have all aged past the window still owns
                    // them, and this link is then the only door to the list.
                    // An overflowing Ongoing section already carries its own
                    // "Show all →" to the same screen, so the two never stack.
                    allRoundsLink
                }

                statsCard

                if loader.rows.isEmpty {
                    // Only a genuinely empty list may say so — rounds that
                    // aged out of the window above are still rounds, and the
                    // link above is already on screen for them.
                    emptyNotice
                }
            }
            // Web `.landing`: `padding: s('xl') s('lg') s('2xl')`.
            .padding(.horizontal, TapSpacing.lg)
            .padding(.top, TapSpacing.xl)
            .padding(.bottom, TapSpacing.xxl)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(TapColors.bg)
        // The wordmark IS the title, exactly as on the web — a large system
        // title above it would say "tapscore" twice in two different faces.
        // The bar stays (inline, blank) because `RootView`'s account button
        // lives in it.
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(TapColors.bg, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        // An explicit pull always refetches — the dedupe below is about not
        // fetching when nobody asked, never about refusing when they did.
        .refreshable { await load(force: true) }
        // `onAppear` rather than `task`: coming back from a round must re-read
        // the device list, and `task` would not re-run on a pop. It *merges*
        // rather than reseeds — rebuilding the list from the device entries
        // alone would wipe the server-sourced rows and their role labels for a
        // signed-in viewer every time they popped back from a round.
        .onAppear { loader.applyDevice(deviceRounds.all()) }
        // Keyed on the AUTH STATE, and that key is the whole bug fix.
        //
        // `bootstrap()` resolves the Keychain session asynchronously, so a
        // plain `.task` runs while `authState` is still `.unknown`: the screen
        // decides it is signed out, skips the dashboard fetch, and — because
        // nothing ever re-triggered it — the owner's rounds appeared only after
        // a pull-to-refresh. Keyed, the task re-runs the moment sign-in
        // resolves, and again after the sign-in flow and after sign-out, each
        // of those being exactly one transition and therefore exactly one
        // fetch. `LandingLoader` dedupes anything that is not a transition.
        .task(id: LandingLoader.key(environment.authState)) { await load() }
        .roundRemovalDialog(pending: $pendingRemoval) { token in remove(token: token) }
        .roundDeleteFailureAlert(loader)
        .sheet(
            isPresented: $dashboardOpen,
            onDismiss: {
                // The dashboard persists a new window preset the moment it is
                // picked; the card underneath must not keep narrating the old
                // one. One forced page re-read picks the preference up.
                Task { await loadStats(force: true) }
            }
        ) {
            StatsDashboardView()
        }
    }

    // MARK: - Rendering

    /// The page head, in its two states.
    ///
    /// Signed in, the wordmark has done its job — the app has been installed,
    /// opened and signed into, and the top of the screen is better spent
    /// saying who it thinks you are (and offering the way to change that).
    /// Signed out it is the front door and stays exactly as it was.
    @ViewBuilder
    private var header: some View {
        if case let .signedIn(player) = environment.authState {
            identityStrip(player)
        } else {
            wordmark
        }
    }

    /// Avatar, name, and — only when there is one — the handicap index.
    ///
    /// The whole strip is the button, because the target people aim at is the
    /// face, and a 44pt-tall row is a better target than a 40pt circle.
    private func identityStrip(_ player: Player) -> some View {
        Button(action: onOpenProfile) {
            HStack(spacing: TapSpacing.md) {
                TapAvatar(
                    playerId: player.id,
                    avatarVersion: player.avatarVersion,
                    displayName: player.displayName,
                    username: player.username,
                    size: 48,
                    fontSize: 17.6,
                    background: TapColors.accentSoft,
                    foreground: TapColors.accentStrong
                )
                VStack(alignment: .leading, spacing: TapSpacing.xs) {
                    Text(player.displayName)
                        .font(TapFont.display(size: 22.4, weight: .semibold))
                        .foregroundStyle(TapColors.text)
                        .lineLimit(1)
                    if let pill = HomeIdentity.handicapPill(player.handicapIndex) {
                        Text(pill)
                            .font(TapFont.ui(size: 12.8, weight: .bold))
                            .foregroundStyle(TapColors.accentStrong)
                            .padding(.vertical, 2)
                            .padding(.horizontal, 9)
                            .background(Capsule().fill(TapColors.accentSoft))
                    }
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        // An explicit label rather than `.combine`: combining ON a Button
        // synthesizes a new element and can drop the button trait, which would
        // leave VoiceOver a strip it cannot activate. The words are the same —
        // name, then the pill's own text.
        .accessibilityLabel(
            HomeIdentity.handicapPill(player.handicapIndex)
                .map { "\(player.displayName), \($0)" } ?? player.displayName
        )
        .accessibilityHint("Opens your profile")
        .accessibilityIdentifier("home-identity-strip")
    }

    /// Web: `.landing__head` — flag glyph, 2.2rem Fraunces 600 wordmark at
    /// -0.02em, muted 0.9rem tagline, all centred.
    private var wordmark: some View {
        VStack(spacing: TapSpacing.xs) {
            Text(verbatim: "⛳")
                .font(.system(size: 35.2))
            Text("tapscore")
                .font(TapFont.display(size: 35.2, weight: .semibold))
                .tracking(35.2 * -0.02)
                .foregroundStyle(TapColors.text)
            Text("Scores, settled on the green. No sign-in needed.")
                .font(TapFont.ui(size: 14.4))
                .foregroundStyle(TapColors.textMuted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
    }

    /// Friends currently on the course — see `OutNowStrip`.
    ///
    /// Nothing renders when the feed is empty, still loading, or failed. The
    /// strip is a bonus on someone else's screen, so it may only ever ADD to
    /// the landing, never explain itself there.
    @ViewBuilder
    private var outNow: some View {
        if let activity, let contextLine = activity.contextLine {
            OutNowStrip(
                contextLine: contextLine,
                chips: activity.chips,
                onOpen: { chip in onSpectate(chip.roundId, chip.displayName) }
            )
        }
    }

    /// The statistics glance — see `HomeStatsCard`.
    ///
    /// Absent whenever the store has no card, which is every failure as well as
    /// every honest "nothing to show". Same rule as the strip above it: this
    /// card may only ADD to the landing.
    @ViewBuilder
    private var statsCard: some View {
        if let card = stats?.card {
            HomeStatsCard(card: card, onOpen: { dashboardOpen = true })
        }
    }

    /// Ongoing, as ONE card like Recently finished. The header still counts
    /// them all, at most four rows render, and past four a footer carries the
    /// rest to `AllRoundsView`.
    @ViewBuilder
    private func ongoingSection(_ sectionRows: [LandingRow]) -> some View {
        if !sectionRows.isEmpty {
            TapCard {
                VStack(alignment: .leading, spacing: 0) {
                    SectionHeader(title: "Ongoing", count: String(sectionRows.count))
                        .padding(.horizontal, TapSpacing.lg)
                        .padding(.top, TapSpacing.md)
                        .padding(.bottom, TapSpacing.sm)
                    ForEach(sectionRows.prefix(HomeIdentity.ongoingPreviewLimit)) { row in
                        hairline
                        RoundRow(
                            row: row,
                            onOpen: { open(row) },
                            onRemove: { pendingRemoval = row },
                            grouped: true,
                            showProgress: true
                        )
                    }
                    if sectionRows.count > HomeIdentity.ongoingPreviewLimit {
                        hairline
                        Button(action: onSeeAllRounds) {
                            HStack(spacing: TapSpacing.xs) {
                                Text("Show all \u{2192}")
                                    .font(TapFont.ui(size: 13.6, weight: .semibold))
                                    .foregroundStyle(TapColors.accentStrong)
                                Spacer(minLength: 0)
                            }
                            .padding(.horizontal, TapSpacing.lg)
                            .frame(minHeight: 44)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Show all ongoing rounds")
                        .accessibilityIdentifier("home-show-all-ongoing")
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    /// Recently finished, as ONE card rather than a card per round.
    ///
    /// Home is about the round you are playing; the ones you have played are a
    /// glance and a door. So the rows are compact (no role label or lifecycle
    /// chip), they are capped at three, and the card ends in the footer that
    /// opens the rest. Rows still use the shared swipe-to-delete action — the
    /// destructive control is hidden until the swipe, not removed from this
    /// list. The count in the header still names how many are in the
    /// window, so "3 of 7" is legible without a sentence saying so.
    @ViewBuilder
    private func finishedCard(_ rows: [LandingRow]) -> some View {
        if !rows.isEmpty {
            TapCard {
                VStack(alignment: .leading, spacing: 0) {
                    SectionHeader(title: "Recently finished", count: String(rows.count))
                        .padding(.horizontal, TapSpacing.lg)
                        .padding(.top, TapSpacing.md)
                        .padding(.bottom, TapSpacing.sm)
                    ForEach(rows.prefix(HomeIdentity.finishedPreviewLimit)) { row in
                        hairline
                        RoundRow(
                            row: row,
                            onOpen: { open(row) },
                            onRemove: { pendingRemoval = row },
                            grouped: true
                        )
                    }
                    hairline
                    Button(action: onSeeAllRounds) {
                        HStack(spacing: TapSpacing.xs) {
                            Text("All rounds \u{2192}")
                                .font(TapFont.ui(size: 13.6, weight: .semibold))
                                .foregroundStyle(TapColors.accentStrong)
                            Spacer(minLength: 0)
                        }
                        .padding(.horizontal, TapSpacing.lg)
                        // minHeight, not height: the label scales with Dynamic
                        // Type and must grow the row, not clip against it.
                        .frame(minHeight: 44)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    // The arrow is decoration; VoiceOver gets the words alone.
                    .accessibilityLabel("All rounds")
                    .accessibilityIdentifier("home-all-rounds")
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    /// The retrospective half of the friends feed — separate from "Out now"
    /// because the live strip answers who is playing while this section answers
    /// what friends played recently. It disappears completely when the feed is
    /// empty or unavailable, just like the web landing, and groups its rows in
    /// the same panel treatment as the own-round sections.
    @ViewBuilder
    private var recentFriendsSection: some View {
        if let activity, !activity.recentRows.isEmpty {
            TapCard {
                VStack(alignment: .leading, spacing: 0) {
                    SectionHeader(title: "From your friends")
                        .padding(.horizontal, TapSpacing.lg)
                        .padding(.top, TapSpacing.md)
                        .padding(.bottom, TapSpacing.sm)
                    ForEach(activity.recentRows) { row in
                        hairline
                        RecentFriendRowView(
                            row: row,
                            formats: activity.formatText(for: row.formatIds),
                            onOpen: { onSpectate(row.roundId, row.displayName) }
                        )
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    /// The same door, standing on its own when there is no card to put it in —
    /// the web's `.landing__history` link.
    private var allRoundsLink: some View {
        Button(action: onSeeAllRounds) {
            Text("All rounds \u{2192}")
                .font(TapFont.ui(size: 13.6, weight: .semibold))
                .foregroundStyle(TapColors.accentStrong)
                .frame(minHeight: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("All rounds")
        .accessibilityIdentifier("home-all-rounds")
    }

    /// A 1px rule between rows inside a card — the card's own border continued
    /// inwards, so the rows read as one object rather than four.
    private var hairline: some View {
        Rectangle()
            .fill(TapColors.border)
            .frame(height: 1)
    }

    /// Web: `.landing__empty` — but split in two, because the two empties mean
    /// different things and conflating them is the "where are my rounds?"
    /// confusion.
    ///
    /// Signed OUT, the list is this device's, so a share link is the answer.
    /// Signed IN with a dashboard that came back empty, the account genuinely
    /// has no rounds — and the likely reason is that the rounds the owner is
    /// thinking of were played anonymously, which ties them to the device that
    /// played them, not to the account. Saying "open a share link" there would
    /// send them looking for a link that will not help.
    private var emptyNotice: some View {
        Text(emptyMessage)
            .font(TapFont.ui(size: 14.4))
            .foregroundStyle(TapColors.textMuted)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.vertical, TapSpacing.lg)
    }

    private var emptyMessage: String {
        if case .signedIn = environment.authState {
            return LandingEmptyCopy.message(signedIn: true, serverRoundCount: loader.serverRoundCount)
        }
        return LandingEmptyCopy.message(signedIn: false, serverRoundCount: loader.serverRoundCount)
    }

    private func failureNotice(_ message: String) -> some View {
        TapCard(sunken: true) {
            HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                Image(systemName: "exclamationmark.triangle")
                Text(message)
                Spacer(minLength: 0)
            }
            .font(TapFont.ui(size: 13.6))
            .foregroundStyle(TapColors.textMuted)
            .padding(TapSpacing.md)
        }
    }

    private func open(_ row: LandingRow) {
        guard let token = row.token else { return }
        onOpen(
            RoundOpenRequest(
                token: token,
                courseName: row.courseName.isEmpty ? nil : row.courseName,
                name: row.name,
                status: row.status,
                completedAt: row.completedAt,
                date: row.date
            )
        )
    }

    // MARK: - Loading

    private func load(force: Bool = false) async {
        await loader.load(
            auth: environment.authState,
            api: environment.api,
            device: deviceRounds.all(),
            force: force)
        // Concurrently — the two are independent requests whose failure mode
        // is silence, and a pull-to-refresh spinner should hold for the
        // slowest of them, not the sum.
        async let activityLoad: Void = loadActivity(force: force)
        async let statsLoad: Void = loadStats(force: force)
        _ = await (activityLoad, statsLoad)
    }

    /// The stats page behind the card. Signed-in only and keyed on the same auth
    /// state as everything else on this screen — the store's own dedupe is what
    /// keeps one appearance from becoming two requests.
    private func loadStats(force: Bool) async {
        let store = stats ?? HomeStatsStore(api: environment.api)
        if stats == nil { stats = store }
        await store.load(auth: environment.authState, force: force)
    }

    /// The friends feed. Signed-in only — it is a friends-of-this-account
    /// query, and an anonymous device has no account to have friends on. A
    /// sign-out therefore has to CLEAR it, or the previous account's friends
    /// keep glowing on the landing of a device nobody is signed into.
    private func loadActivity(force: Bool) async {
        guard case .signedIn = environment.authState else {
            activity = nil
            return
        }
        let store = activity ?? FriendsActivityStore(api: environment.api)
        if activity == nil { activity = store }
        await store.load(force: force)
    }

    private func remove(token: String) {
        Task {
            await loader.delete(
                token: token,
                api: environment.api,
                deviceRounds: deviceRounds
            )
        }
    }
}

// MARK: - The loader

/// What the landing has loaded, and — the part that has actually been wrong —
/// **when it loads again**.
///
/// The shipped bug: `AppEnvironment.bootstrap()` resolves the stored session
/// asynchronously, so the landing's `.task` ran while `authState` was still
/// `.unknown`, concluded "signed out", skipped `GET /dashboard/my-rounds`, and
/// nothing re-triggered it. The owner's own rounds showed up only if they
/// happened to pull to refresh. The fix is to key the load on the auth state
/// and let a TRANSITION drive it.
///
/// The dedupe is the other half of that fix and is why this is a class with a
/// memory rather than a free function. `.task(id:)` fires on appearance as well
/// as on change, `authState` can be re-published with the same value, and the
/// launch sequence alone walks `.unknown → .signedIn`; without a key to compare
/// against, "reload on auth change" becomes a small fetch storm on every
/// launch. So: one fetch per distinct auth key, plus whatever the user asks for
/// explicitly (`force`, i.e. pull-to-refresh).
@MainActor
@Observable
final class LandingLoader {
    private(set) var rows: [LandingRow] = []
    private(set) var loadFailure: String?

    /// Set when a confirmed delete did not reach the server. Both round lists
    /// share the loader, so they share this one message.
    var deleteFailure: String?

    /// How many rounds the DASHBOARD returned, or nil when it was never asked
    /// (signed out) or could not answer. Only a real zero from the server can
    /// justify the signed-in empty copy — an unreachable dashboard must not
    /// tell someone their account has no rounds.
    private(set) var serverRoundCount: Int?

    /// The auth key the last load ran for. Nil ⇒ nothing has loaded yet.
    private var loadedKey: String?

    /// The identity of an auth state for reload purposes.
    ///
    /// A STRING rather than the state itself, because what must re-trigger a
    /// load is a change of *who we are*, and `AuthState` carries a whole
    /// `Player` — a profile edit that leaves the same person signed in is not
    /// a reason to refetch the dashboard. `.unreachable` folds its message in,
    /// since a different failure means a different attempt happened.
    static func key(_ state: AuthState) -> String {
        switch state {
        case .unknown: "unknown"
        case .anonymous: "anonymous"
        case .signedIn(let player): "signedIn:\(player.id)"
        case .unreachable(let message): "unreachable:\(message)"
        }
    }

    /// Reads the device list, then folds in the server dashboard when signed
    /// in. The device half is applied first and unconditionally: a dashboard
    /// failure must degrade to the anonymous list, never to an empty screen.
    ///
    /// - Parameter force: bypass the dedupe (pull-to-refresh).
    func load(auth: AuthState, api: TapScoreAPI, device: [DeviceRound], force: Bool = false) async {
        let key = Self.key(auth)
        guard force || key != loadedKey else { return }
        loadedKey = key

        rows = LandingRow.fromDevice(device)

        guard case .signedIn = auth else {
            loadFailure = nil
            serverRoundCount = nil
            return
        }

        // Format labels are catalog-driven, just like the create and round
        // screens. Fetch the immutable catalog alongside the dashboard so a
        // slow catalog never adds a serial round-trip to the landing load.
        async let formatsResult: [FormatDescriptor]? = try? await api.send(SetupEndpoints.formats)
        do {
            let mine = try await api.send(DashboardEndpoints.myRounds)
            let formats = await formatsResult ?? []
            rows = LandingRow.merge(device: device, mine: mine, formatDescriptors: formats)
            serverRoundCount = mine.created.count + mine.produced.count
            loadFailure = nil
        } catch APIError.unauthorized {
            serverRoundCount = nil
            // The bearer went stale between bootstrap and now. The device list
            // still stands; `AppEnvironment` re-resolves on the next probe.
            loadFailure = "Your session expired — sign in again to see all your rounds."
        } catch {
            serverRoundCount = nil
            loadFailure = "Couldn't reach the server. Showing rounds opened on this device."
        }
    }

    /// Folds a freshly-read device list into the rows already on screen.
    func applyDevice(_ device: [DeviceRound]) {
        rows = LandingRow.applyingDevice(device, to: rows)
    }

    /// Deletes a round for everyone, the same act the web landing performs
    /// (`svc.remove` behind `askDelete`) and the same one the round's own
    /// manage sheet performs (`RoundStore.deleteRound`).
    ///
    /// This used to drop the device entry only. For a signed-out viewer that
    /// looked like a delete; for a signed-in one the row came straight back
    /// out of `merge` — server-sourced rows survive `applyingDevice` — so
    /// confirming appeared to do nothing at all. One meaning of "delete", on
    /// both clients: the round is gone from the server.
    ///
    /// Token trust, exactly as on the round screen: the share token IS the
    /// write credential, so there is no owner gate here either. Local state is
    /// touched only after the server has agreed; a failure leaves the row where
    /// it is and says so.
    func delete(
        token: String,
        api: TapScoreAPI,
        deviceRounds: DeviceRoundsStore,
        cursors: ResultCursorStore = ResultCursorStore()
    ) async {
        do {
            _ = try await api.send(
                FriendlyRoundsEndpoints.remove,
                FriendlyRoundsByTokenInput(token: token),
                pathValues: ["token": token]
            )
        } catch {
            // A 404 is not a failure — the server has no such round, which is
            // the state this delete was asking for. It is also the ONLY way out
            // for a row left behind by a different backend this device once
            // pointed at (`-apiBaseURL`): the round list is device-local and
            // not namespaced by server, so those rows 404 on open and used to
            // 404 on delete too, which made them permanent.
            guard let api = error as? APIError, case .server(404, _) = api else {
                deleteFailure = "Could not delete the round. Try again."
                return
            }
        }
        deviceRounds.remove(token: token)
        cursors.forget(token: token)
        rows.removeAll { $0.token == token }
        if serverRoundCount != nil { serverRoundCount = max(0, serverRoundCount! - 1) }
    }

    /// Dismisses the delete failure notice.
    func clearDeleteFailure() { deleteFailure = nil }
}

// MARK: - Row

/// The common hierarchy for every full round summary: what it was called,
/// where it was played, then its date/progress and formats on separate quiet
/// lines. Its callers decide the tap destination and whether a destructive
/// swipe exists; the visual shape stays one thing across Ongoing, Finished,
/// and friends' lists.
struct RoundSummaryContent: View {
    let title: String
    let subtitle: String?
    let metadata: [String]
    let formats: String?
    var leadingPadding: CGFloat = TapSpacing.lg
    var trailingPadding: CGFloat = TapSpacing.lg

    var body: some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            Text(title)
                .font(TapFont.ui(size: 16.8, weight: .bold))
                .foregroundStyle(TapColors.text)
                .multilineTextAlignment(.leading)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)

            if let subtitle, !subtitle.isEmpty {
                Text(subtitle)
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(TapColors.textMuted)
                    .multilineTextAlignment(.leading)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if !metadata.isEmpty {
                Text(metadata.joined(separator: " · "))
                    .font(TapFont.ui(size: 12))
                    .foregroundStyle(TapColors.textMuted)
                    .lineLimit(1)
            }

            if let formats, !formats.isEmpty {
                Text(formats)
                    .font(TapFont.ui(size: 12))
                    .foregroundStyle(TapColors.textMuted)
                    .lineLimit(1)
            }
        }
        .padding(.vertical, TapSpacing.md)
        .padding(.leading, leadingPadding)
        .padding(.trailing, trailingPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .contentShape(Rectangle())
    }
}

/// One round, as `.round-row` draws it. A standalone row is a card; a grouped
/// row supplies only its content so the section's outer card can own the
/// surface and separators. A row with a share token reveals its Delete action
/// with a horizontal swipe instead of reserving a permanent trash column.
/// Internal rather than fileprivate: `AllRoundsView` is the same list without
/// the window, and a second copy of this row is how the two screens would start
/// disagreeing about what a round looks like.
struct RoundRow: View {
    let row: LandingRow
    let onOpen: () -> Void
    let onRemove: () -> Void
    var grouped = false
    /// Ongoing owns this fact. Other lists are retrospective or a new-round
    /// alert, where repeating a partial score adds noise rather than guidance.
    var showProgress = false

    /// A row can be deleted when it carries a share token — the round's write
    /// credential, and the whole authorization for the delete. Gating on
    /// `deviceLocal` instead (as this did while the action was a device-list
    /// removal) would hide the action on exactly the rounds a signed-in viewer
    /// owns but has not opened on this phone. The web gates on the token too.
    private var isRemovable: Bool { row.token != nil }
    private let revealWidth: CGFloat = 88
    @State private var revealOffset: CGFloat = 0
    @State private var dragOrigin: CGFloat = 0
    @State private var horizontalDrag = false
    /// `Button` and the drag gesture deliberately coexist so a normal tap
    /// still opens the round. A horizontal drag must consume the release,
    /// otherwise Button can race the gesture's `onEnded` and close the action
    /// rail that the swipe just revealed.
    @State private var suppressTapAfterSwipe = false

    @ViewBuilder
    var body: some View {
        if isRemovable {
            ZStack(alignment: .trailing) {
                removeAction
                rowSurface
                    // A grouped row has no TapCard of its own. Its opaque
                    // surface is what keeps the action rail hidden until this
                    // particular row actually moves left.
                    .offset(x: revealOffset)
                    .simultaneousGesture(swipeGesture)
                    .accessibilityAction(named: "Delete") { onRemove() }
                    .accessibilityHint("Swipe left to reveal the delete action")
            }
            .frame(maxWidth: .infinity)
        } else {
            rowSurface
        }
    }

    @ViewBuilder
    private var rowSurface: some View {
        if grouped {
            rowContent.background(TapColors.surface)
        } else {
            TapCard { rowContent }
        }
    }

    @ViewBuilder
    private var rowContent: some View {
        Button(action: openRow) {
            RoundSummaryContent(
                title: row.label,
                subtitle: row.courseSubtitle,
                metadata: metadata,
                formats: row.formatsText,
                trailingPadding: isRemovable ? 0 : TapSpacing.lg
            )
        }
        .buttonStyle(.plain)
        // A produced round with no friendly wrapper has no token, so it
        // renders but cannot be opened.
        .disabled(row.token == nil)
    }

    private var metadata: [String] {
        var facts = [row.displayDate].compactMap { $0 }
        if showProgress, let progress = row.progressText { facts.append(progress) }
        return facts
    }

    private var removeAction: some View {
        Button {
            withAnimation(.easeOut(duration: 0.18)) { revealOffset = 0 }
            onRemove()
        } label: {
            Label("Delete", systemImage: "trash")
                .font(TapFont.ui(size: 13.6, weight: .semibold))
                .foregroundStyle(TapColors.onDanger)
                .frame(width: revealWidth)
                .frame(maxHeight: .infinity)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .background(TapColors.danger)
        .accessibilityLabel("Delete \(row.courseName.isEmpty ? "round" : row.courseName)")
    }

    private var swipeGesture: some Gesture {
        DragGesture(minimumDistance: 12)
            .onChanged { value in
                guard abs(value.translation.width) > abs(value.translation.height) else { return }
                if !horizontalDrag {
                    dragOrigin = revealOffset
                    horizontalDrag = true
                }
                suppressTapAfterSwipe = true
                revealOffset = min(
                    0,
                    max(-revealWidth, dragOrigin + value.translation.width)
                )
            }
            .onEnded { value in
                guard horizontalDrag else { return }
                let reveal = value.translation.width < -(revealWidth / 3)
                    || value.predictedEndTranslation.width < -revealWidth
                withAnimation(.easeOut(duration: 0.18)) {
                    revealOffset = reveal ? -revealWidth : 0
                }
                // SwiftUI may deliver the Button action after the drag ends.
                // Keep the release suppressed for this event turn, then reset
                // before the next real tap.
                DispatchQueue.main.async {
                    horizontalDrag = false
                    suppressTapAfterSwipe = false
                }
            }
    }

    private func openRow() {
        guard !suppressTapAfterSwipe else { return }
        if revealOffset != 0 {
            withAnimation(.easeOut(duration: 0.18)) { revealOffset = 0 }
            return
        }
        onOpen()
    }
}

/// The delete confirmation, in one place for both round lists.
///
/// The web ALWAYS confirms before a row leaves the landing (`askDelete` in
/// `src/landing/landing.component.ts`) and does it with one shared dialog. Home
/// and `AllRoundsView` are the same list at two lengths, so they say the same
/// sentence — a second copy of this copy is how one of them ends up describing
/// a different act than the one that runs.
///
/// The copy names the real consequence, and it is the web's: this deletes the
/// round and its scores for everyone, permanently. It used to promise a
/// device-local removal it also did not deliver.
private struct RoundRemovalDialog: ViewModifier {
    @Binding var pending: LandingRow?
    let onRemove: (String) -> Void

    func body(content: Content) -> some View {
        // An ALERT, not a `confirmationDialog`. On iOS 26 the confirmation
        // dialog renders as a small floating bubble that neither points at the
        // row being deleted nor reads as a modal stop — a permanent,
        // everyone-loses-it delete asked for a shrug. The alert is centred,
        // dims the list behind it, and puts Cancel next to the destructive
        // verb. The web uses its own centred confirm for the same reason.
        content.alert(
            "Delete round?",
            isPresented: Binding(
                get: { pending != nil },
                set: { if !$0 { pending = nil } }
            ),
            presenting: pending
        ) { row in
            Button("Delete", role: .destructive) {
                if let token = row.token { onRemove(token) }
                pending = nil
            }
            Button("Cancel", role: .cancel) { pending = nil }
        } message: { row in
            Text("Delete \(row.courseName.isEmpty ? "this round" : "“\(row.courseName)”")? This permanently removes it and all its scores for everyone. This can't be undone.")
        }
    }
}

extension View {
    /// Attaches the shared delete confirmation, driven by a
    /// row's swipe-revealed Delete action.
    func roundRemovalDialog(
        pending: Binding<LandingRow?>,
        onRemove: @escaping (String) -> Void
    ) -> some View {
        modifier(RoundRemovalDialog(pending: pending, onRemove: onRemove))
    }

    /// Says so when a confirmed delete did not reach the server. Silence after
    /// a destructive confirmation reads as success, and here it would be a
    /// round that is still very much alive.
    @MainActor
    func roundDeleteFailureAlert(_ loader: LandingLoader) -> some View {
        alert(
            "Couldn't delete the round",
            isPresented: Binding(
                get: { loader.deleteFailure != nil },
                set: { if !$0 { loader.clearDeleteFailure() } }
            ),
            presenting: loader.deleteFailure
        ) { _ in
            Button("OK", role: .cancel) { loader.clearDeleteFailure() }
        } message: { message in
            Text(message)
        }
    }
}

/// One retrospective friend round: who, where, which formats, and when. The
/// row opens the read-only spectate screen rather than carrying a share token.
private struct RecentFriendRowView: View {
    let row: RecentFriendRow
    let formats: String?
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            HStack(alignment: .center, spacing: TapSpacing.md) {
                TapAvatar(
                    playerId: row.playerId,
                    avatarVersion: row.avatarVersion,
                    displayName: row.displayName,
                    size: 36
                )
                RoundSummaryContent(
                    title: row.friendLabel,
                    subtitle: row.title,
                    metadata: [row.displayDate].compactMap { $0 },
                    formats: formats,
                    leadingPadding: 0,
                    trailingPadding: TapSpacing.lg
                )
            }
            .padding(.leading, TapSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(row.accessibilityLabel(formats: formats))
    }
}

/// Web: `.round-row__role` — uppercase 0.7rem/700 at 0.08em in brass, so the
/// viewer's relationship to a round reads at a glance without competing with
/// the status chip beside it.
private struct RoleLabel: View {
    let text: String

    var body: some View {
        Text(text.uppercased())
            .font(TapFont.ui(size: 11.2, weight: .bold))
            .tracking(11.2 * 0.08)
            .lineLimit(1)
            .foregroundStyle(TapColors.accent)
    }
}

/// The domain lifecycle in the design system's vocabulary.
///
/// A feature-side mapping rather than an initialiser shipped with the
/// primitive: `DesignSystem` does not know this app's storage types, and the
/// web keeps the same split (`STATUS_TEXT` lives in the component, not the
/// theme). Internal, not fileprivate — `JoinView`'s preview card draws the same
/// chip from the same status, and a second copy of this switch is exactly how
/// two screens start disagreeing about what "complete" looks like.
extension RoundStatusTone {
    init(_ status: DeviceRoundStatus) {
        switch status {
        case .notStarted: self = .notStarted
        case .active: self = .active
        case .complete: self = .complete
        }
    }
}

// MARK: - The pure landing fold

/// One row shape for both data sources, so the landing renders identically
/// whether the viewer is signed in or not. The Swift image of
/// `src/landing/rows.ts` + `partition.ts` + `my-rounds.ts`, kept free of
/// SwiftUI and of any fetch so it can be tested directly.
enum LandingFormatLabels {
    /// Labels for the full round payload. The descriptor catalog supplies the
    /// reader's language; the slot metadata keeps the row useful while an old
    /// server or a catalog failure leaves the descriptor unavailable.
    static func forSlots(_ slots: [FormatSlot], descriptors: [FormatDescriptor]) -> [String] {
        let catalog = FormatCatalog(descriptors: descriptors)
        return slots.map { slot in
            catalog.label(slot.formatId)
                ?? "\(slot.scoringMode.rawValue) · \(slot.teamShape.rawValue)"
        }
    }

    /// Labels for the compact friends payload, which carries ids rather than
    /// full slot metadata. Unknown ids remain visible instead of disappearing.
    static func forIds(_ ids: [String], descriptors: [FormatDescriptor]) -> [String] {
        let catalog = FormatCatalog(descriptors: descriptors)
        return ids.map { catalog.label($0) ?? $0 }
    }
}

struct LandingRow: Identifiable, Equatable, Sendable {
    /// Stable identity: the round id when known, else the share token.
    let id: String
    /// Share token for navigation. Nil ⇒ the row renders but cannot open (a
    /// produced round with no friendly wrapper).
    let token: String?
    let courseName: String
    /// The organizer's name for the round, when it has one. The row labels
    /// itself with this and demotes the course to the meta line; nil ⇒ the
    /// course IS the label, exactly as before names existed.
    var name: String?
    let status: DeviceRoundStatus
    let completedAt: String?
    /// Ongoing-sort key — most-recently-active first.
    let lastActivityAt: String?
    /// Furthest-scored ball for this viewer. Nil when the row is merely one
    /// they created or opened on this device, so the row never invents progress.
    var holesPlayed: Int? = nil
    /// "Played · Created" (signed-in rows only).
    let roleLabel: String?
    let date: String?
    /// True when this token is in the device list, so a swipe can remove it.
    var deviceLocal: Bool
    /// True when the row came from `dashboard/my-rounds`. A server row outlives
    /// a device-list refresh (and a local Remove); a device-only row follows
    /// the device list and vanishes with it.
    var serverSourced: Bool = false
    /// Human-readable format labels in slot order. Device-only rows do not
    /// have format data, so their list is empty.
    var formatLabels: [String] = []

    /// Default "recently finished" window, matching `RECENT_FINISHED_DAYS`.
    static let recentFinishedDays = 14

    // MARK: Building

    static func fromDevice(_ entries: [DeviceRound]) -> [LandingRow] {
        entries.map { entry in
            LandingRow(
                id: entry.token,
                token: entry.token,
                courseName: entry.courseName,
                name: entry.name,
                status: entry.status,
                completedAt: entry.completedAt,
                // Device rows carry a real last-seen timestamp — the natural
                // sort key when no server-owned activity timestamp exists.
                lastActivityAt: entry.lastSeenAt,
                holesPlayed: nil,
                roleLabel: nil,
                date: entry.date,
                deviceLocal: true
            )
        }
    }

    /// Merges `dashboard/my-rounds` with this device's list.
    ///
    /// Server rows win on content (they carry the authoritative status, course
    /// and role), device rows contribute anything the server does not know
    /// about — a round opened from a share link that the viewer neither
    /// created nor plays in still belongs on their landing.
    static func merge(
        device: [DeviceRound],
        mine: DashboardMyRoundsOutput,
        formatDescriptors: [FormatDescriptor] = []
    ) -> [LandingRow] {
        var byRoundId: [String: (
            round: Round,
            token: String?,
            played: Bool,
            created: Bool,
            holesPlayed: Int?
        )] = [:]
        for item in mine.created {
            byRoundId[item.round.id] = (item.round, item.friendlyRound.shareToken, false, true, nil)
        }
        for item in mine.produced {
            if var existing = byRoundId[item.round.id] {
                existing.played = true
                existing.holesPlayed = item.progress.map { Int($0.holesPlayed) }
                byRoundId[item.round.id] = existing
            } else {
                byRoundId[item.round.id] = (
                    item.round,
                    item.shareToken,
                    true,
                    false,
                    item.progress.map { Int($0.holesPlayed) }
                )
            }
        }

        let deviceTokens = Set(device.map(\.token))
        let serverRows = byRoundId.values
            .map { entry -> LandingRow in
                LandingRow(
                    id: entry.round.id,
                    token: entry.token,
                    courseName: entry.round.courseNameSnapshot ?? "",
                    name: entry.round.name,
                    status: DeviceRoundStatus(rawValue: entry.round.status.rawValue) ?? .notStarted,
                    completedAt: entry.round.completedAt,
                    // The server owns this timestamp, so web and iOS rank a
                    // newly created, edited, or scored round identically.
                    // Keep the date fallback for a rolling server upgrade.
                    lastActivityAt: entry.round.lastActivityAt.value ?? entry.round.date,
                    holesPlayed: entry.holesPlayed,
                    roleLabel: roleLabel(played: entry.played, created: entry.created),
                    date: entry.round.date,
                    deviceLocal: entry.token.map(deviceTokens.contains) ?? false,
                    serverSourced: true,
                    formatLabels: LandingFormatLabels.forSlots(
                        entry.round.formatSlots,
                        descriptors: formatDescriptors
                    )
                )
            }
            // Most-recently active first, tie-broken by date then id so the
            // order is stable across refreshes (dictionary iteration is not).
            .sorted { lhs, rhs in
                let byActivity = compareDescending(lhs.lastActivityAt, rhs.lastActivityAt)
                if byActivity != 0 { return byActivity < 0 }
                let byDate = compareDescending(lhs.date, rhs.date)
                return byDate == 0 ? lhs.id < rhs.id : byDate < 0
            }

        let covered = Set(serverRows.compactMap(\.token))
        let extras = fromDevice(device.filter { !covered.contains($0.token) })
        return serverRows + extras
    }

    /// Folds a freshly-read device list into rows that are already on screen.
    ///
    /// This is what a pop back from a round runs, and the reason it is a merge
    /// and not a rebuild: `fromDevice` alone knows nothing about roles, and a
    /// signed-in viewer would watch "Played · Created" (and every round the
    /// server reported that this device never opened) disappear on every pop.
    ///
    /// So: server rows survive, keeping their identity and role label; the
    /// matching device entry supplies the local lifecycle, but the server's
    /// activity timestamp remains the sort key. Otherwise merely opening a
    /// round on this phone can reshuffle server rows that have not changed.
    /// Device entries no row covers are appended; and a device-only row whose
    /// entry is gone (a Remove) goes with it.
    static func applyingDevice(_ device: [DeviceRound], to rows: [LandingRow]) -> [LandingRow] {
        var byToken: [String: DeviceRound] = [:]
        for entry in device where byToken[entry.token] == nil { byToken[entry.token] = entry }

        let kept = rows.compactMap { row -> LandingRow? in
            // A produced round with no friendly wrapper has no token, so it can
            // never be in the device list; it is server-only and untouched.
            guard let token = row.token else { return row }
            guard let entry = byToken[token] else {
                guard row.serverSourced else { return nil }
                var updated = row
                updated.deviceLocal = false
                return updated
            }
            return row.refreshed(from: entry)
        }

        let covered = Set(kept.compactMap(\.token))
        return kept + fromDevice(device.filter { !covered.contains($0.token) })
    }

    /// The row as the device last saw this round, keeping everything only the
    /// server can tell us (round id, role label, course name).
    private func refreshed(from entry: DeviceRound) -> LandingRow {
        LandingRow(
            id: id,
            token: token,
            courseName: courseName.isEmpty ? entry.courseName : courseName,
            name: name ?? entry.name,
            status: entry.status,
            completedAt: entry.completedAt,
            // A device sighting is activity only for a device-only round. For
            // a dashboard row the server already supplied the canonical time;
            // retaining it makes repeated refreshes order-identical.
            lastActivityAt: serverSourced ? lastActivityAt : entry.lastSeenAt,
            holesPlayed: holesPlayed,
            roleLabel: roleLabel,
            date: date ?? entry.date,
            deviceLocal: true,
            serverSourced: serverSourced,
            formatLabels: formatLabels
        )
    }

    static func roleLabel(played: Bool, created: Bool) -> String? {
        let parts = (played ? ["Played"] : []) + (created ? ["Created"] : [])
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    /// The only lifecycle fact worth repeating inside an Ongoing row. A zero
    /// is intentionally silent: "Thru 0" is less useful than the section's
    /// invitation to play, and a creator-only row has no player progress.
    var progressText: String? {
        guard let holesPlayed, holesPlayed > 0 else { return nil }
        return "Thru \(holesPlayed)"
    }

    // MARK: Partition

    struct Partitioned: Equatable, Sendable {
        var ongoing: [LandingRow] = []
        var finished: [LandingRow] = []
    }

    /// Splits rows into Ongoing (not started / active) and Recently finished
    /// (complete within a trailing window).
    ///
    /// A complete round with no parseable `completedAt` cannot be windowed but
    /// is plainly done, so it is always kept; a round finished before the
    /// cutoff drops off the landing entirely (it lives in history).
    ///
    /// - Parameter windowDays: nil keeps **every** finished round, which is
    ///   what `AllRoundsView` is for. The sort and the ongoing/finished split
    ///   are identical either way — the window is the only difference between
    ///   the two screens, so it is a parameter rather than a second function.
    static func partition(
        _ rows: [LandingRow],
        now: Date,
        windowDays: Int? = recentFinishedDays
    ) -> Partitioned {
        let cutoff = windowDays.map { now.addingTimeInterval(-Double($0) * 86_400) }
        var result = Partitioned()
        for row in rows {
            guard row.status == .complete else {
                result.ongoing.append(row)
                continue
            }
            guard let cutoff else {
                result.finished.append(row)
                continue
            }
            guard let at = parse(row.completedAt) else {
                result.finished.append(row)
                continue
            }
            if at >= cutoff { result.finished.append(row) }
        }
        // A timestamp tie is common when several operations land in the same
        // server tick. Use the stable row id as a final tie-break, so no input
        // source (dictionary, device store, or fetch order) can reshuffle an
        // unchanged list on the next refresh.
        result.ongoing = stableSorted(result.ongoing) {
            let byActivity = compareDescending($0.lastActivityAt, $1.lastActivityAt)
            guard byActivity == 0 else { return byActivity }
            guard $0.id != $1.id else { return 0 }
            return $0.id < $1.id ? -1 : 1
        }
        result.finished = stableSorted(result.finished) {
            let byCompletion = compareDescending($0.completedAt, $1.completedAt)
            guard byCompletion == 0 else { return byCompletion }
            guard $0.id != $1.id else { return 0 }
            return $0.id < $1.id ? -1 : 1
        }
        return result
    }

    /// Human date for the row's second line.
    var displayDate: String? {
        guard let date, let parsed = Self.parse(date) else { return date }
        return parsed.formatted(.dateTime.day().month(.abbreviated).year())
    }

    var formatsText: String? {
        let text = formatLabels.joined(separator: " · ")
        return text.isEmpty ? nil : text
    }

    /// The round's own name when it has one, else the course — the same
    /// name-over-course fallback the round header applies, so a round is
    /// called the same thing in the list and on its own screen.
    var label: String {
        let named = (name ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if !named.isEmpty { return named }
        return courseName.isEmpty ? "Round" : courseName
    }

    /// The course, as a SUB-title — present only when the headline is the
    /// round's own name. A row with no name is already headed by its course,
    /// and printing it twice is worse than not printing it at all.
    var courseSubtitle: String? {
        guard label != courseName, !courseName.isEmpty else { return nil }
        return courseName
    }

    // MARK: Time helpers

    /// Parses both timestamp spellings the two sources use: a full ISO-8601
    /// instant (`lastSeenAt`, `completedAt`) and a bare `yyyy-MM-dd` round
    /// date. Anything else is nil and sorts last.
    static func parse(_ value: String?) -> Date? {
        guard let value, !value.isEmpty else { return nil }
        if let date = DeviceRoundsStore.isoFormatter.date(from: value) { return date }
        if let date = fractionalISO.date(from: value) { return date }
        return dayFormatter.date(from: value)
    }

    nonisolated(unsafe) private static let fractionalISO: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    nonisolated(unsafe) private static let dayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: "UTC")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    /// Descending by time; a missing or unparseable value sorts last, and two
    /// equal values compare equal so a stable sort preserves input order.
    private static func compareDescending(_ lhs: String?, _ rhs: String?) -> Int {
        switch (parse(lhs), parse(rhs)) {
        case let (l?, r?):
            if l == r { return 0 }
            return l > r ? -1 : 1
        case (nil, nil): return 0
        case (_?, nil): return -1
        case (nil, _?): return 1
        }
    }

    /// `Array.sorted` is not documented as stable, and the partition's
    /// tie-breaks rely on input order. Decorate with the index to force it.
    private static func stableSorted(
        _ rows: [LandingRow],
        by compare: (LandingRow, LandingRow) -> Int
    ) -> [LandingRow] {
        rows.enumerated()
            .sorted { lhs, rhs in
                let ordering = compare(lhs.element, rhs.element)
                return ordering == 0 ? lhs.offset < rhs.offset : ordering < 0
            }
            .map(\.element)
    }
}

/// The home head's small string rules, out of the view so the one that is easy
/// to get wrong is assertable.
enum HomeIdentity {
    /// How many finished rounds the home card shows before "All rounds →" is
    /// the rest of the answer.
    static let finishedPreviewLimit = 3

    /// How many ongoing rounds the home shows before "Show all →" takes over.
    /// At or under the limit the link is absent — a door that leads to exactly
    /// what is already on screen is furniture.
    static let ongoingPreviewLimit = 4

    /// The handicap pill's text, or **nil when there is no index**.
    ///
    /// Nil is the difference between this and `ProfileFormat.index`, which owes
    /// a value to a card that always draws one and answers with an en dash. A
    /// pill reading "HCP –" states nothing and takes a line to do it, so a
    /// player who has never entered an index simply has no pill.
    ///
    /// The notation is `ProfileFormat.index`'s: the domain stores a plus
    /// handicap negative, so −2.0 reads "+2.0" here exactly as it does on the
    /// profile screen.
    static func handicapPill(_ handicapIndex: Double?) -> String? {
        guard let handicapIndex else { return nil }
        return "HCP " + ProfileFormat.index(handicapIndex)
    }
}

/// The landing's empty-state sentence, kept out of the view so the distinction
/// it draws is testable.
///
/// The two empties mean different things. Signed OUT, the list is this device's
/// and a share link is the answer. Signed IN with a dashboard that answered
/// with zero rounds, the ACCOUNT is genuinely empty — and the usual reason is
/// that the rounds the owner has in mind were played anonymously, which ties
/// them to the device that played them. Telling that user to "open a share
/// link" would send them hunting for a link that does not exist.
///
/// A nil `serverRoundCount` means the dashboard never answered (offline, or the
/// session expired), so we do not claim the account is empty.
enum LandingEmptyCopy {
    static func message(signedIn: Bool, serverRoundCount: Int?) -> String {
        guard signedIn, serverRoundCount == 0 else {
            return "No rounds yet — open a share link to tee off."
        }
        return "No rounds on this account yet — rounds you played before signing in stay on the device that played them. Create one to start."
    }
}
