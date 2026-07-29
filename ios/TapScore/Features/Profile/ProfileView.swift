import SwiftUI

/// The signed-in player's profile — the native mirror of
/// `src/profile/profile.component.ts`.
///
/// A sheet with the same anatomy as `AccountSheetView` and `RoundManageSheet`,
/// and reached from the same place: it is a settings surface, not a
/// destination a link can address, and it has no back-stack meaning.
///
/// Three editable facts, and only three. The identity header is READ-ONLY
/// because the server has no endpoint that renames a player — a text field
/// there would be a control with nowhere to save to.
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

    /// Built in `.task`, not in a field initialiser — the store needs the
    /// environment's API actor, and it must survive re-renders.
    @State private var store: ProfileStore?
    @State private var padOpen = false

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
        .safeAreaInset(edge: .top, spacing: 0) { header }
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
    }

    /// Read-only, and the `@username` is the load-bearing half — two accounts
    /// belonging to the same human carry the same display name and never the
    /// same username.
    private func identity(_ store: ProfileStore) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(store.player?.displayName ?? "…")
                .font(TapFont.display(size: 28, weight: .semibold))
                .foregroundStyle(TapColors.text)
                .lineLimit(2)
            if let username = store.player?.username {
                Text(verbatim: "@\(username)")
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(TapColors.textMuted)
                    .lineLimit(1)
                    .truncationMode(.middle)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityIdentifier("profile-identity")
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
    static let historyEmpty =
        "No entries yet — save an index to start the chain."
    static let notAuthorized =
        "This session can no longer read your profile. Sign in again."
}
