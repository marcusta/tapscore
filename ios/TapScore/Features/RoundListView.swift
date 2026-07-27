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
/// a paper page, not a grouped `List`. Wordmark header, one full-width primary
/// call to action, then serif section headers over `card()` rows. The system
/// `List` chrome was placeholder — it painted the app in iOS grey on a client
/// whose whole identity is the scorecard palette, and every colour here now
/// comes from `ThemeTokens`.
///
/// One honest divergence from the web: the CTA is **Join a round**, not
/// "+ Create round". iOS has no create flow yet, so the slot keeps the web's
/// prominence and spends it on the action this client actually has. Labelling
/// it "Create" and pushing the paste-a-link screen would be a lie in the one
/// place the user is most likely to tap.
struct RoundListView: View {
    @Environment(AppEnvironment.self) private var environment

    /// This device's recent-rounds list. Injected by `RootView` so the store
    /// that *records* an open is the same one that reads it back.
    let deviceRounds: DeviceRoundsStore

    /// Pushes the paste-a-link screen.
    let onJoin: () -> Void

    /// Asks the shell to open a round. The shell records the sighting; this
    /// screen never writes to the device list except on an explicit delete.
    let onOpen: (RoundOpenRequest) -> Void

    @State private var rows: [LandingRow] = []
    @State private var loadFailure: String?

    /// The row whose trash was tapped, parked while the confirmation is up.
    ///
    /// The web ALWAYS confirms before a row leaves the landing (`askDelete` in
    /// `src/landing/landing.component.ts`), and one shared dialog serves every
    /// row there — same shape here. A single tap must not be able to remove a
    /// round: the trash sits a few points from the row's own tap target.
    @State private var pendingRemoval: LandingRow?

    var body: some View {
        ScrollView {
            let partition = LandingRow.partition(rows, now: Date())

            VStack(alignment: .leading, spacing: TapSpacing.xl) {
                wordmark
                joinCallToAction

                if let loadFailure {
                    failureNotice(loadFailure)
                }

                section("Ongoing", rows: partition.ongoing)
                section("Recently finished", rows: partition.finished)

                if partition.ongoing.isEmpty && partition.finished.isEmpty {
                    emptyNotice
                }

                #if DEBUG
                debugSection
                #endif
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
        .refreshable { await load() }
        // `onAppear` rather than `task`: coming back from a round must re-read
        // the device list, and `task` would not re-run on a pop. It *merges*
        // rather than reseeds — rebuilding the list from the device entries
        // alone would wipe the server-sourced rows and their role labels for a
        // signed-in viewer every time they popped back from a round.
        .onAppear { rows = LandingRow.applyingDevice(deviceRounds.all(), to: rows) }
        .task { await load() }
        .confirmationDialog(
            "Remove this round from this device?",
            isPresented: Binding(
                get: { pendingRemoval != nil },
                set: { if !$0 { pendingRemoval = nil } }
            ),
            titleVisibility: .visible,
            presenting: pendingRemoval
        ) { row in
            Button("Remove", role: .destructive) {
                if let token = row.token { remove(token: token) }
                pendingRemoval = nil
            }
            Button("Cancel", role: .cancel) { pendingRemoval = nil }
        } message: { row in
            // Says the one thing that makes this safe to confirm — and it is
            // why the copy is "Remove", not the web's "Delete": nothing leaves
            // the server.
            Text("\(row.courseName.isEmpty ? "This round" : row.courseName) stays on the server. Its share link brings it back.")
        }
    }

    // MARK: - Rendering

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

    /// Web: `.landing__create` — the one elevated, full-width, `--primary`
    /// button on the page. See the type doc for why it says Join here.
    private var joinCallToAction: some View {
        Button(action: onJoin) {
            HStack(spacing: TapSpacing.sm) {
                Image(systemName: "link")
                    .font(.system(size: 17.6, weight: .bold))
                Text("Join a round")
            }
        }
        .buttonStyle(.tap(.primary, size: .prominent, fillsWidth: true))
    }

    @ViewBuilder
    private func section(_ title: String, rows sectionRows: [LandingRow]) -> some View {
        if !sectionRows.isEmpty {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                SectionHeader(title: title, count: String(sectionRows.count))
                // Web `.landing__list` — a `s('sm')` gapped column of cards.
                VStack(spacing: TapSpacing.sm) {
                    ForEach(sectionRows) { row in
                        RoundRow(
                            row: row,
                            onOpen: { open(row) },
                            onRemove: { pendingRemoval = row }
                        )
                    }
                }
            }
        }
    }

    /// Web: `.landing__empty`.
    private var emptyNotice: some View {
        Text("No rounds yet — open a share link to tee off.")
            .font(TapFont.ui(size: 14.4))
            .foregroundStyle(TapColors.textMuted)
            .padding(.vertical, TapSpacing.lg)
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
                status: row.status,
                completedAt: row.completedAt,
                date: row.date
            )
        )
    }

    /// The connectivity probe, kept from the scaffold: it is the one row that
    /// proves XcodeGen, ATS local networking, the base URL and the bearer
    /// header are all wired. Debug builds only — it is a diagnostic, not a
    /// feature, which is why it is drawn in the sunken tone rather than as
    /// another card on the page.
    #if DEBUG
    @ViewBuilder
    private var debugSection: some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: "Server (debug)", size: 14.4)
            TapCard(sunken: true) {
                VStack(alignment: .leading, spacing: TapSpacing.xs) {
                    HStack(spacing: TapSpacing.sm) {
                        Text("GET /players/me")
                            .foregroundStyle(TapColors.textMuted)
                        Spacer(minLength: 0)
                        switch environment.authState {
                        case .unknown:
                            ProgressView().controlSize(.small)
                        case .anonymous:
                            Text("anonymous").foregroundStyle(TapColors.text)
                        case let .signedIn(player):
                            Text(player.username).foregroundStyle(TapColors.text)
                        case let .unreachable(detail):
                            Text("unreachable")
                                .foregroundStyle(TapColors.danger)
                                .accessibilityHint(detail)
                        }
                    }
                    Text(environment.configuration.baseURL.absoluteString)
                        .foregroundStyle(TapColors.textMuted)
                }
                .font(TapFont.ui(size: 12.8))
                .padding(TapSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }
    #endif

    // MARK: - Loading

    /// Reads the device list, then folds in the server dashboard when signed
    /// in. The device half is applied first and unconditionally: a dashboard
    /// failure must degrade to the anonymous list, never to an empty screen.
    private func load() async {
        let device = deviceRounds.all()
        rows = LandingRow.fromDevice(device)

        guard case .signedIn = environment.authState else {
            loadFailure = nil
            return
        }
        do {
            let mine = try await environment.api.send(DashboardEndpoints.myRounds)
            rows = LandingRow.merge(device: device, mine: mine)
            loadFailure = nil
        } catch APIError.unauthorized {
            // The bearer went stale between bootstrap and now. The device list
            // still stands; `AppEnvironment` re-resolves on the next probe.
            loadFailure = "Your session expired — sign in again to see all your rounds."
        } catch {
            loadFailure = "Couldn't reach the server. Showing rounds opened on this device."
        }
    }

    private func remove(token: String) {
        // Local only: the round is untouched server-side, and its link brings
        // it back. Deleting somebody's round from a tap is not a thing this
        // screen does — so a row the server also reported stays, minus its
        // device-local flag, and only a device-only row disappears.
        rows = LandingRow.applyingDevice(deviceRounds.remove(token: token), to: rows)
    }
}

// MARK: - Row

/// One round, as `.round-row` draws it: a `card()` split into a tappable main
/// column and a 44pt trash column at the right edge.
///
/// The trash replaces the placeholder's swipe action, matching the web — and
/// it is offered on exactly the same rows the swipe was: device-local ones. A
/// server row this device never opened has nothing local to remove, and a
/// control that did nothing would read as a broken delete.
private struct RoundRow: View {
    let row: LandingRow
    let onOpen: () -> Void
    let onRemove: () -> Void

    private var isRemovable: Bool { row.deviceLocal && row.token != nil }

    var body: some View {
        TapCard {
            HStack(spacing: 0) {
                Button(action: onOpen) {
                    HStack(alignment: .top, spacing: TapSpacing.md) {
                        VStack(alignment: .leading, spacing: TapSpacing.xs) {
                            // Web `.round-row__course`: 1.05rem/700 in the UI
                            // face. Kept in the UI face here too — the serif
                            // marks *structure* (section headers, the
                            // wordmark), and a course name is content. Two
                            // clients disagreeing about which face a round row
                            // wears is a divergence with nothing to buy it.
                            Text(row.courseName.isEmpty ? "Round" : row.courseName)
                                .font(TapFont.ui(size: 16.8, weight: .bold))
                                .foregroundStyle(TapColors.text)
                                .multilineTextAlignment(.leading)
                                // Two lines is enough for every real course
                                // name; past that the row would push the chip
                                // column around for no gain.
                                .lineLimit(2)
                                .fixedSize(horizontal: false, vertical: true)
                            if let date = row.displayDate {
                                // Web `.round-row__bottom` — muted 0.85rem.
                                Text(date)
                                    .font(TapFont.ui(size: 13.6))
                                    .foregroundStyle(TapColors.textMuted)
                            }
                        }
                        Spacer(minLength: TapSpacing.sm)
                        VStack(alignment: .trailing, spacing: TapSpacing.xs) {
                            if let role = row.roleLabel {
                                RoleLabel(text: role)
                            }
                            StatusChip(status: RoundStatusTone(row.status))
                        }
                    }
                    .padding(.vertical, TapSpacing.md)
                    .padding(.leading, TapSpacing.lg)
                    .padding(.trailing, isRemovable ? 0 : TapSpacing.lg)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                // A produced round with no friendly wrapper has no token, so it
                // renders but cannot be opened.
                .disabled(row.token == nil)

                if isRemovable {
                    // Web `.round-row__del`: quiet muted glyph in its own 44px
                    // tap column at the card's edge, outside the row's main
                    // target so a scroll-tap cannot hit it.
                    Button(action: onRemove) {
                        Image(systemName: "trash")
                            .font(.system(size: 17, weight: .medium))
                            .foregroundStyle(TapColors.textMuted)
                            .frame(width: 44)
                            .frame(maxHeight: .infinity)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    // Names the round, because VoiceOver reads these buttons
                    // out of the list one after another and "Remove round"
                    // four times over says nothing about which.
                    .accessibilityLabel("Remove \(row.courseName.isEmpty ? "round" : row.courseName)")
                }
            }
            .frame(maxWidth: .infinity)
        }
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
struct LandingRow: Identifiable, Equatable, Sendable {
    /// Stable identity: the round id when known, else the share token.
    let id: String
    /// Share token for navigation. Nil ⇒ the row renders but cannot open (a
    /// produced round with no friendly wrapper).
    let token: String?
    let courseName: String
    let status: DeviceRoundStatus
    let completedAt: String?
    /// Ongoing-sort key — most-recently-active first.
    let lastActivityAt: String?
    /// "Played · Created" (signed-in rows only).
    let roleLabel: String?
    let date: String?
    /// True when this token is in the device list, so a swipe can remove it.
    var deviceLocal: Bool
    /// True when the row came from `dashboard/my-rounds`. A server row outlives
    /// a device-list refresh (and a local Remove); a device-only row follows
    /// the device list and vanishes with it.
    var serverSourced: Bool = false

    /// Default "recently finished" window, matching `RECENT_FINISHED_DAYS`.
    static let recentFinishedDays = 14

    // MARK: Building

    static func fromDevice(_ entries: [DeviceRound]) -> [LandingRow] {
        entries.map { entry in
            LandingRow(
                id: entry.token,
                token: entry.token,
                courseName: entry.courseName,
                status: entry.status,
                completedAt: entry.completedAt,
                // Device rows carry a real last-seen timestamp — the natural
                // sort key, and better than the round date the server rows use.
                lastActivityAt: entry.lastSeenAt,
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
    static func merge(device: [DeviceRound], mine: DashboardMyRoundsOutput) -> [LandingRow] {
        var byRoundId: [String: (round: Round, token: String?, played: Bool, created: Bool)] = [:]
        for item in mine.created {
            byRoundId[item.round.id] = (item.round, item.friendlyRound.shareToken, false, true)
        }
        for item in mine.produced {
            if var existing = byRoundId[item.round.id] {
                existing.played = true
                byRoundId[item.round.id] = existing
            } else {
                byRoundId[item.round.id] = (item.round, item.shareToken, true, false)
            }
        }

        let deviceTokens = Set(device.map(\.token))
        let serverRows = byRoundId.values
            .map { entry -> LandingRow in
                LandingRow(
                    id: entry.round.id,
                    token: entry.token,
                    courseName: entry.round.courseNameSnapshot ?? "",
                    status: DeviceRoundStatus(rawValue: entry.round.status.rawValue) ?? .notStarted,
                    completedAt: entry.round.completedAt,
                    // No per-round activity timestamp on the payload; the round
                    // DATE is the best recency proxy, same as the web client.
                    lastActivityAt: entry.round.date,
                    roleLabel: roleLabel(played: entry.played, created: entry.created),
                    date: entry.round.date,
                    deviceLocal: entry.token.map(deviceTokens.contains) ?? false,
                    serverSourced: true
                )
            }
            // Newest first, tie-broken by id so the order is stable across
            // refreshes (dictionary iteration order is not).
            .sorted { lhs, rhs in
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
    /// matching device entry — the most recent local sighting, which is exactly
    /// why we are re-reading — supplies the lifecycle and the sort key; device
    /// entries no row covers are appended; and a device-only row whose entry is
    /// gone (a Remove) goes with it.
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
            status: entry.status,
            completedAt: entry.completedAt,
            lastActivityAt: entry.lastSeenAt,
            roleLabel: roleLabel,
            date: date ?? entry.date,
            deviceLocal: true,
            serverSourced: serverSourced
        )
    }

    static func roleLabel(played: Bool, created: Bool) -> String? {
        let parts = (played ? ["Played"] : []) + (created ? ["Created"] : [])
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
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
    static func partition(
        _ rows: [LandingRow],
        now: Date,
        windowDays: Int = recentFinishedDays
    ) -> Partitioned {
        let cutoff = now.addingTimeInterval(-Double(windowDays) * 86_400)
        var result = Partitioned()
        for row in rows {
            guard row.status == .complete else {
                result.ongoing.append(row)
                continue
            }
            guard let at = parse(row.completedAt) else {
                result.finished.append(row)
                continue
            }
            if at >= cutoff { result.finished.append(row) }
        }
        // Stable sorts: equal keys keep the caller's order (server rows already
        // arrive newest-first, device rows most-recently-seen first).
        result.ongoing = stableSorted(result.ongoing) { compareDescending($0.lastActivityAt, $1.lastActivityAt) }
        result.finished = stableSorted(result.finished) { compareDescending($0.completedAt, $1.completedAt) }
        return result
    }

    /// Human date for the row's second line.
    var displayDate: String? {
        guard let date, let parsed = Self.parse(date) else { return date }
        return parsed.formatted(.dateTime.day().month(.abbreviated).year())
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
