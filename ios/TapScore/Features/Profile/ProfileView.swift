import PhotosUI
import SwiftUI

/// The signed-in player's profile — the native mirror of
/// `src/profile/profile.component.ts`.
///
/// A sheet with the same anatomy as `AccountSheetView` and `RoundManageSheet`,
/// and reached from the same place: it is a settings surface, not a
/// destination a link can address, and it has no back-stack meaning.
///
/// The display name, gender, home club and handicap index are editable. The
/// username stays a read-only login and public handle.
///
/// Two of the three save on tap and one does not, and the asymmetry is the
/// point: gender and home club are a choice from a closed list, where a
/// separate Save step is a second tap on a question already answered. The
/// handicap index is TYPED, and typed values commit on Done — through
/// `HandicapPadSheet`, never a system keyboard, because "+2,4" is not
/// something an iOS keyboard can produce (no "+", and a Swedish layout emits a
/// comma the wire will not take).
struct ProfileView: View {
    @Environment(AppEnvironment.self) private var environment
    @Environment(\.dismiss) private var dismiss

    /// False when Profile is a root shell destination. The navigation bar then
    /// carries the account avatar and the Home/Friends dock is the way out,
    /// exactly like the web route. The sheet fallback keeps its own Done bar.
    var showsHeader = true

    /// Built in `.task`, not in a field initialiser — the store needs the
    /// environment's API actor, and it must survive re-renders.
    @State private var store: ProfileStore?
    @State private var padOpen = false
    /// A sheet, not a `NavigationLink`: this view is drawn both inside the
    /// shell's `NavigationStack` and inside a plain `.sheet` from
    /// `AccountSheetView`, and a link would be inert in the second.
    @State private var dashboardOpen = false
    @State private var nameDraft = ""
    @State private var editingName = false
    @FocusState private var nameFocused: Bool
    /// Held only between the tap and the load; cleared as soon as the bytes are
    /// in hand, so re-picking the same photo counts as a change again.
    @State private var photoItem: PhotosPickerItem?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TapSpacing.lg) {
                if let store {
                    switch store.phase {
                    case .loading:
                        loading
                    case .notAuthorized:
                        message(ProfileCopy.notAuthorized)
                    case let .failed(problem):
                        message(problem)
                    case .ready:
                        body(of: store)
                    }
                } else {
                    loading
                }
            }
            .padding(TapSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(TapColors.bg)
        .safeAreaInset(edge: .top, spacing: 0) {
            if showsHeader { header }
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.visible, for: .navigationBar)
        .toolbarBackground(TapColors.bg, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .accessibilityIdentifier("profile-sheet")
        .task {
            guard store == nil else { return }
            let created = ProfileStore(
                api: environment.api,
                // The write-back that keeps the account button, "Add me" and
                // every other reader of `authState` on the same `Player` this
                // screen just changed. NOT an auth change — see
                // `AppEnvironment.apply(profile:)`.
                onProfileUpdated: { [environment] player in
                    environment.apply(profile: player)
                }
            )
            store = created
            await created.load()
        }
        .sheet(isPresented: $padOpen) {
            if let store {
                HandicapPadSheet(
                    playerName: "Handicap index",
                    // No tee and no round here: the pad's course-handicap line
                    // has nothing to compute from on a profile screen, so the
                    // card's own hint stands in for it.
                    tee: nil,
                    gender: store.player?.gender ?? .m,
                    initialText: ProfileFormat.padText(store.player?.handicapIndex),
                    infoText: ProfileCopy.handicapHint,
                    // The profile cannot clear an index — the endpoint takes a
                    // number and the chain is append-only — so an empty draft
                    // must not offer an enabled Done that would no-op.
                    allowsEmptyCommit: false,
                    onCommit: { text in
                        Task { await store.saveHandicap(text: text) }
                    }
                )
            }
        }
        .sheet(isPresented: $dashboardOpen) {
            StatsDashboardView()
        }
    }

    // MARK: - Chrome

    private var header: some View {
        HStack {
            Text("Profile")
                .font(TapFont.display(size: 20, weight: .bold))
                .foregroundStyle(TapColors.text)
            Spacer(minLength: 0)
            Button("Done") { dismiss() }
                .buttonStyle(.tap(.ghost))
                .accessibilityIdentifier("profile-done")
        }
        .padding(.horizontal, TapSpacing.lg)
        .padding(.vertical, TapSpacing.md)
        .background(TapColors.surface)
        .overlay(alignment: .bottom) {
            Rectangle().fill(TapColors.border).frame(height: 1)
        }
    }

    private var loading: some View {
        ProgressView()
            .frame(maxWidth: .infinity)
            .padding(.top, TapSpacing.xl)
            .accessibilityIdentifier("profile-loading")
    }

    private func message(_ text: String) -> some View {
        Text(text)
            .font(TapFont.ui(size: 13.6))
            .foregroundStyle(TapColors.textMuted)
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityIdentifier("profile-message")
    }

    // MARK: - Body

    @ViewBuilder
    private func body(of store: ProfileStore) -> some View {
        identity(store)
        genderCard(store)
        clubCard(store)
        handicapCard(store)
        if let refreshError = store.refreshError {
            // The save landed but the reload after it did not — the chain below
            // is one entry behind the number above. Worded so nobody retries a
            // save that already succeeded.
            Text(refreshError)
                .font(TapFont.ui(size: 13.6))
                .foregroundStyle(TapColors.danger)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("profile-refresh-error")
        }
        historySection(store)
        statsSection(store)
    }

    private func identity(_ store: ProfileStore) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.md) {
            HStack(spacing: TapSpacing.lg) {
                TapAvatar(
                    playerId: store.player?.id ?? "",
                    avatarVersion: store.player?.avatarVersion,
                    displayName: store.player?.displayName ?? "",
                    username: store.player?.username ?? "",
                    size: 72,
                    fontSize: 24,
                    background: TapColors.accentSoft,
                    foreground: TapColors.accentStrong
                )
                VStack(alignment: .leading, spacing: 2) {
                    if editingName {
                        VStack(alignment: .leading, spacing: TapSpacing.sm) {
                            TextField("Display name", text: $nameDraft)
                                .textInputAutocapitalization(.words)
                                .submitLabel(.done)
                                .tapField(minHeight: 44)
                                .focused($nameFocused)
                                .onSubmit { Task { await saveDisplayName(store) } }
                            HStack(spacing: TapSpacing.sm) {
                                Button("Cancel") {
                                    editingName = false
                                    nameFocused = false
                                    store.clearDisplayNameError()
                                }
                                .buttonStyle(.tap(.secondary))
                                .disabled(store.isSaving)
                                Spacer(minLength: 0)
                                Button(store.isSaving ? "Saving…" : "Save") {
                                    Task { await saveDisplayName(store) }
                                }
                                .buttonStyle(.tap(.primary))
                                .disabled(store.isSaving || nameDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                            }
                            if let problem = store.displayNameError {
                                Text(problem)
                                    .font(TapFont.ui(size: 13.6))
                                    .foregroundStyle(TapColors.danger)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    } else {
                        HStack(alignment: .firstTextBaseline, spacing: 2) {
                            Text(store.player?.displayName ?? "…")
                                .font(TapFont.display(size: 28, weight: .semibold))
                                .foregroundStyle(TapColors.text)
                                .lineLimit(2)
                            Button {
                                nameDraft = store.player?.displayName ?? ""
                                store.clearDisplayNameError()
                                editingName = true
                                nameFocused = true
                            } label: {
                                Image(systemName: "pencil")
                                    .font(TapFont.ui(size: 16, weight: .bold))
                                    .foregroundStyle(TapColors.textMuted)
                                    .offset(y: -1)
                            }
                            .buttonStyle(.plain)
                            .disabled(store.isSaving)
                            .accessibilityLabel("Edit display name")
                        }
                    }
                    if let username = store.player?.username {
                        Text(verbatim: "@\(username)")
                            .font(TapFont.ui(size: 13.6))
                            .foregroundStyle(TapColors.textMuted)
                            .lineLimit(1)
                            .truncationMode(.middle)
                    }
                }
            }
            photoControls(store)
            if let problem = store.photoError {
                Text(problem)
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(TapColors.danger)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("profile-photo-error")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityIdentifier("profile-identity")
    }

    private func saveDisplayName(_ store: ProfileStore) async {
        await store.saveDisplayName(nameDraft)
        if store.displayNameError == nil {
            editingName = false
            nameFocused = false
        }
    }

    /// Pick a photo, and — only when there is one — remove it.
    ///
    /// The picker is `PhotosPicker`, which means the app never asks for photo
    /// library access: the system picker runs out of process and hands back the
    /// one item the user chose. A permission prompt for a feature this small
    /// would be a poor trade, and there is nothing here that needs the library.
    @ViewBuilder
    private func photoControls(_ store: ProfileStore) -> some View {
        HStack(spacing: TapSpacing.sm) {
            PhotosPicker(
                selection: $photoItem,
                matching: .images,
                photoLibrary: .shared()
            ) {
                Text(store.player?.avatarVersion == nil ? "Add photo" : "Change photo")
            }
            .buttonStyle(.tap(.secondary))
            .disabled(store.isSaving)
            .opacity(store.isSaving ? 0.5 : 1)
            .accessibilityIdentifier("profile-photo-pick")

            if store.player?.avatarVersion != nil {
                Button("Remove") {
                    Task {
                        await store.removePhoto()
                        // The old face is still in the process-wide cache under
                        // its old key, and a screen that is already on screen
                        // is holding it.
                        environment.avatars.clear()
                    }
                }
                .buttonStyle(.tap(.ghost))
                .disabled(store.isSaving)
                .opacity(store.isSaving ? 0.5 : 1)
                .accessibilityIdentifier("profile-photo-remove")
            }
            Spacer(minLength: 0)
        }
        // Loading the picked item is the picker's job and uploading is the
        // store's; this is the seam. `nil` is what the picker leaves behind
        // after it is dismissed with nothing chosen.
        .onChange(of: photoItem) { _, item in
            guard let item else { return }
            Task {
                let data = try? await item.loadTransferable(type: Data.self)
                // Cleared either way, so picking the SAME photo again after a
                // failure still registers as a change.
                photoItem = nil
                guard let data else {
                    store.reportPhotoUnreadable()
                    return
                }
                await store.savePhoto(data)
                environment.avatars.clear()
            }
        }
    }

    // MARK: - Gender

    private func genderCard(_ store: ProfileStore) -> some View {
        card(label: "Gender", hint: ProfileCopy.genderHint, error: store.genderError) {
            HStack(spacing: TapSpacing.sm) {
                genderChip(store, title: "M", value: .m, identifier: "profile-gender-m")
                genderChip(store, title: "F", value: .f, identifier: "profile-gender-f")
                genderChip(store, title: "Not set", value: nil, identifier: "profile-gender-none")
                Spacer(minLength: 0)
            }
        }
        .accessibilityIdentifier("profile-gender-card")
    }

    private func genderChip(
        _ store: ProfileStore,
        title: String,
        value: PlayerGender?,
        identifier: String
    ) -> some View {
        TapChip(
            title: title,
            isSelected: store.player?.gender == value,
            action: { Task { await store.saveGender(value) } }
        )
        .disabled(store.isSaving)
        // `TapChip` is a `.plain` button style, and SwiftUI applies no automatic
        // dimming to a custom style (see the note in TapButton.swift) — without
        // this, a save in flight is pixel-identical to idle and taps just
        // vanish. The web dims its disabled controls the same way.
        .opacity(store.isSaving ? 0.5 : 1)
        .accessibilityIdentifier(identifier)
    }

    // MARK: - Home club

    /// A dropdown, not chips: the club list is as long as the database, and the
    /// standing rule (`ios/AGENTS.md`, "Chips vs dropdowns") caps chips at three
    /// or four permanently-visible options.
    ///
    /// `""` is the cleared value, the same sentinel the web's `SelectComponent`
    /// uses — a `String?` selection would make "no club" indistinguishable from
    /// "no row matched".
    private func clubCard(_ store: ProfileStore) -> some View {
        card(label: "Home club", hint: ProfileCopy.clubHint, error: store.clubError) {
            TapDropdown(
                placeholder: "No home club",
                title: "Home club",
                selection: store.player?.homeClubId ?? "",
                groups: [
                    TapDropdownGroup(rows:
                        [TapDropdownRow(value: "", title: "No home club")]
                            + store.sortedClubs.map {
                                TapDropdownRow(value: $0.id, title: $0.name, subtitle: $0.location)
                            }
                    )
                ],
                onSelect: { id in
                    let picked = id.isEmpty ? nil : id
                    // Re-picking the current club is not a change — the web
                    // guards this exact case, and matching it keeps the two
                    // clients agreeing about when a request leaves.
                    guard picked != store.player?.homeClubId else { return }
                    Task { await store.saveHomeClub(picked) }
                }
            )
            .disabled(store.isSaving)
            // Same reason as the gender chips: TapDropdown's trigger is a
            // `.plain` button that never dims on `.disabled` by itself.
            .opacity(store.isSaving ? 0.5 : 1)
            .accessibilityIdentifier("profile-home-club")
        }
        .accessibilityIdentifier("profile-club-card")
    }

    // MARK: - Handicap index

    private func handicapCard(_ store: ProfileStore) -> some View {
        card(label: "Handicap index", hint: ProfileCopy.handicapHint, error: store.handicapError) {
            HStack(alignment: .firstTextBaseline, spacing: TapSpacing.md) {
                Text(ProfileFormat.index(store.player?.handicapIndex))
                    .font(TapFont.display(size: 32, weight: .bold))
                    .foregroundStyle(TapColors.text)
                    .monospacedDigit()
                    .accessibilityIdentifier("profile-handicap-value")
                Spacer(minLength: 0)
                // B5.15's rule, carried over: the index is never text-editable.
                Button("Edit") { padOpen = true }
                    .buttonStyle(.tap(.secondary))
                    .disabled(store.isSaving)
                    .accessibilityIdentifier("profile-handicap-edit")
            }
        }
        .accessibilityIdentifier("profile-handicap-card")
    }

    // MARK: - History

    private func historySection(_ store: ProfileStore) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: "Handicap history")
            if store.history.isEmpty {
                Text(ProfileCopy.historyEmpty)
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("profile-history-empty")
            } else {
                ForEach(store.history, id: \.id) { entry in
                    historyRow(entry)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityIdentifier("profile-history")
    }

    private func historyRow(_ entry: HandicapEntry) -> some View {
        TapCard {
            HStack(alignment: .firstTextBaseline, spacing: TapSpacing.md) {
                Text(ProfileFormat.historyIndex(entry.handicapIndex))
                    .font(TapFont.ui(size: 16.8, weight: .bold))
                    .foregroundStyle(TapColors.text)
                    .monospacedDigit()
                    .frame(minWidth: 52, alignment: .leading)
                Text(ProfileFormat.source(entry.source))
                    .font(TapFont.ui(size: 11.2, weight: .bold))
                    .tracking(11.2 * 0.08)
                    .foregroundStyle(TapColors.accent)
                    .padding(.vertical, 2)
                    .padding(.horizontal, 10)
                    .background(Capsule().fill(TapColors.accentSoft))
                Spacer(minLength: 0)
                // The raw `YYYY-MM-DD` the server stores, unreformatted: an
                // effective date is a record, and a locale-formatted copy of it
                // would stop matching the row the server can show you.
                Text(verbatim: entry.effectiveDate)
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(TapColors.textMuted)
                    .monospacedDigit()
            }
            .padding(TapSpacing.md)
        }
        .accessibilityIdentifier("profile-history-row")
    }

    // MARK: - Statistics

    /// The stats configuration (spec §3): a master switch and the six modules
    /// it governs.
    ///
    /// Every tap is a save — the endpoint is whole-config, so each toggle PUTs
    /// the complete snapshot, exactly like the gender chips POST on tap. There
    /// is no Save button to add: a switch that needs confirming is a switch
    /// that answered its own question twice.
    ///
    /// The module rows are INDENTED under the master, because they are not six
    /// more profile facts — they are the contents of the one above them, and
    /// they are dead while it is off.
    private func statsSection(_ store: ProfileStore) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: "Statistics")
            dashboardEntry(store)
            TapCard {
                VStack(alignment: .leading, spacing: TapSpacing.md) {
                    statsRow(
                        store,
                        title: "Track statistics",
                        hint: ProfileCopy.statsHint,
                        annotation: nil,
                        isOn: store.statsConfig.enabled,
                        isLocked: false,
                        identifier: "profile-stats-master",
                        change: { on in store.statsConfig.settingEnabled(on) })
                    Rectangle()
                        .fill(TapColors.border)
                        .frame(height: 1)
                    VStack(alignment: .leading, spacing: TapSpacing.md) {
                        ForEach(StatsModule.allCases, id: \.self) { module in
                            statsRow(
                                store,
                                title: module.title,
                                hint: module.hint,
                                annotation: store.statsConfig.annotation(module),
                                isOn: store.statsConfig.isOn(module),
                                isLocked: store.statsConfig.isLocked(module),
                                identifier: "profile-stats-\(module.rawValue)",
                                change: { on in store.statsConfig.setting(module, to: on) })
                        }
                    }
                    .padding(.leading, TapSpacing.md)
                    if let statsError = store.statsError {
                        Text(statsError)
                            .font(TapFont.ui(size: 13.6))
                            .foregroundStyle(TapColors.danger)
                            .fixedSize(horizontal: false, vertical: true)
                            .accessibilityIdentifier("profile-stats-error")
                    }
                }
                .padding(TapSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .accessibilityIdentifier("profile-stats")
    }

    /// The way in to the dashboard, above the switches that feed it.
    ///
    /// It sits INSIDE the Statistics section rather than beside it: the
    /// configuration and the numbers it produces are one subject, and a second
    /// top-level section called something else would split it. The toggles stay
    /// exactly where they were, underneath.
    ///
    /// A player with nothing recorded gets a sentence instead of a dead button —
    /// a dashboard of five absent modules teaches nothing, and the sentence says
    /// what to do about it. `roundsWithStats` is nil both when the probe failed
    /// and when there is genuinely nothing, and both deserve the same quiet
    /// outcome.
    @ViewBuilder
    private func dashboardEntry(_ store: ProfileStore) -> some View {
        if store.hasStatsToShow {
            TapCard {
                Button {
                    dashboardOpen = true
                } label: {
                    HStack(alignment: .center, spacing: TapSpacing.md) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Your statistics")
                                .font(TapFont.ui(size: 16, weight: .semibold))
                                .foregroundStyle(TapColors.text)
                            Text(ProfileCopy.dashboardHint(store.roundsWithStats ?? 0))
                                .font(TapFont.ui(size: 12.8))
                                .foregroundStyle(TapColors.textMuted)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        Spacer(minLength: 0)
                        Image(systemName: "chevron.right")
                            .font(TapFont.ui(size: 12.8, weight: .bold))
                            .foregroundStyle(TapColors.accent)
                    }
                    .padding(TapSpacing.md)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
            .accessibilityIdentifier("profile-stats-dashboard")
        } else {
            Text(ProfileCopy.dashboardEmpty)
                .font(TapFont.ui(size: 12.8))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("profile-stats-dashboard-empty")
        }
    }

    /// One switch row. `change` returns the WHOLE next configuration rather
    /// than a boolean, so the dependency cascade (turning putting off takes
    /// short game with it) is decided in `StatsConfigForm` and never here.
    ///
    /// No manual `.opacity` for the disabled state, unlike the chips and the
    /// dropdown above: `Toggle` is a system control and dims itself and its
    /// label on `.disabled`. The custom `.plain` button styles are the ones
    /// that need the hand-rolled dimming.
    private func statsRow(
        _ store: ProfileStore,
        title: String,
        hint: String,
        annotation: String?,
        isOn: Bool,
        isLocked: Bool,
        identifier: String,
        change: @escaping (Bool) -> StatsConfigForm
    ) -> some View {
        Toggle(
            isOn: Binding(
                get: { isOn },
                set: { on in Task { await store.saveStats(change(on)) } })
        ) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: TapSpacing.sm) {
                    Text(title)
                        .font(TapFont.ui(size: 16, weight: .semibold))
                        .foregroundStyle(TapColors.text)
                    // The unmet dependency, in words — "Needs Putting". The
                    // row is disabled either way; this is the half that says
                    // which switch to move to get it back.
                    if let annotation {
                        Text(annotation)
                            .font(TapFont.ui(size: 12.8))
                            .foregroundStyle(TapColors.textMuted)
                    }
                }
                Text(hint)
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .tint(TapColors.accentStrong)
        .disabled(isLocked || store.isSaving)
        .accessibilityIdentifier(identifier)
    }

    // MARK: - Card shell

    /// Label, control, hint, and the inline failure — the web's `.profile__card`
    /// in the order it stacks them.
    private func card(
        label: String,
        hint: String,
        error: String?,
        @ViewBuilder control: () -> some View
    ) -> some View {
        TapCard {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                Text(label)
                    .font(TapFont.ui(size: 11.2, weight: .bold))
                    .tracking(11.2 * 0.06)
                    .foregroundStyle(TapColors.textMuted)
                    .textCase(.uppercase)
                control()
                Text(hint)
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                if let error {
                    Text(error)
                        .font(TapFont.ui(size: 13.6))
                        .foregroundStyle(TapColors.danger)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(TapSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

/// Every user-facing sentence the profile speaks, lifted out of the view so
/// each is one assertable string. The three hints are the web's, verbatim —
/// they are the only place the app explains WHY it is asking for any of this.
enum ProfileCopy {
    /// Straight quotes around "Add me", because that is character for character
    /// what the web template says (`profile.component.ts` line 33) — the
    /// validation copy is the one that uses typographic quotes, not this.
    static let genderHint =
        "Used for tee ratings — set once and it locks in \"Add me\" during round setup."
    static let clubHint =
        "Shown next to your name when someone searches for you — how they tell you from the other John Smith."
    static let handicapHint =
        "Maintained by you — each save is recorded below with its effective date."
    /// The master switch's hint. It says the two things a player cannot infer
    /// from a switch: that answering happens DURING a round, and that turning
    /// it off keeps the module picks (spec §3 — the master exists so "off" is
    /// not "start over").
    static let statsHint =
        "Adds a few taps per hole while you score — turn it off any time, your picks are kept."
    static let historyEmpty =
        "No entries yet — save an index to start the chain."
    /// Shown in place of the dashboard link when nothing has been recorded, and
    /// also when the probe for it failed — a row nobody can use is worse than a
    /// sentence saying why there is none.
    static let dashboardEmpty =
        "Your dashboard appears here once you have played a round with statistics on."

    /// The dashboard link's sub-line. The sample size is the qualifier on every
    /// number behind the link, so it leads.
    static func dashboardHint(_ rounds: Int) -> String {
        rounds == 1
            ? "1 round recorded — practice priorities, trends and every module."
            : "\(rounds) rounds recorded — practice priorities, trends and every module."
    }
    static let notAuthorized =
        "This session can no longer read your profile. Sign in again."
}
