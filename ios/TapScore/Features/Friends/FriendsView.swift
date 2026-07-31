import SwiftUI

/// The native mirror of `src/friends/friends.component.ts`.
///
/// The web screen is the product contract: search registered players by name
/// or `@username`, add with one tap, keep the user's list below, and explain
/// Suggested order with the shared-round subtitle.
struct FriendsView: View {
    @Environment(AppEnvironment.self) private var environment

    @State private var store: FriendsStore?
    /// Drives the live dot on a friend who is on the course right now. Its own
    /// store, shared in kind (not in instance) with the landing's "Out now"
    /// strip: a friend list that shows who is playing is the same question
    /// asked from a different screen.
    @State private var activity: FriendsActivityStore?
    @AppStorage("tapscore.friends.sort.v1") private var storedSort = FriendSortMode.suggested.rawValue

    var body: some View {
        List {
            heading
                .listRowInsets(
                    EdgeInsets(
                        top: TapSpacing.xl,
                        leading: TapSpacing.lg,
                        bottom: TapSpacing.xl,
                        trailing: TapSpacing.lg
                    )
                )
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)

            if let store {
                searchSection(store)
                    .listRowInsets(
                        EdgeInsets(
                            top: 0,
                            leading: TapSpacing.lg,
                            bottom: TapSpacing.xl,
                            trailing: TapSpacing.lg
                        )
                    )
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                friendsSection(store)
            } else {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding(.top, TapSpacing.xl)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .background(TapColors.bg)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        // This screen can be the DEBUG launch root before auth bootstrap has
        // resolved. Keep the bar present while its initially-empty account
        // toolbar item turns into the avatar.
        .toolbar(.visible, for: .navigationBar)
        .toolbarBackground(TapColors.bg, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .refreshable {
            if let store { await store.load(force: true) }
            if let activity { await activity.load(force: true) }
        }
        .task {
            guard store == nil else { return }
            let created = FriendsStore(api: environment.api)
            store = created
            let feed = FriendsActivityStore(api: environment.api)
            activity = feed
            await created.load()
            await feed.load()
        }
        .accessibilityIdentifier("friends-screen")
    }

    private var heading: some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            Text("Friends")
                .font(TapFont.display(size: 32, weight: .semibold))
                .tracking(32 * -0.02)
                .foregroundStyle(TapColors.text)
            Text("Players you often tee up with — one tap adds them to a round.")
                .font(TapFont.ui(size: 14.4))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    @ViewBuilder
    private func searchSection(_ store: FriendsStore) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            TextField(
                "",
                text: Binding(
                    get: { store.query },
                    set: { store.setQuery($0) }
                ),
                prompt: tapFieldPrompt("Search players by name or @username")
            )
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .submitLabel(.search)
            .tapField(minHeight: 52)
            .accessibilityIdentifier("friends-search")

            if !store.query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
               !FriendListModel.isSearchable(store.query) {
                hint("Type at least 2 characters.")
            } else if store.searching {
                HStack(spacing: TapSpacing.sm) {
                    ProgressView().controlSize(.small)
                    hint("Searching…")
                }
            }

            if let error = store.searchError {
                errorText(error)
            }

            VStack(spacing: TapSpacing.sm) {
                ForEach(store.results, id: \.id) { player in
                    searchRow(player, store: store)
                }
            }
            .padding(.top, store.results.isEmpty ? 0 : TapSpacing.xs)

            let trimmed = store.query.trimmingCharacters(in: .whitespacesAndNewlines)
            if FriendListModel.isSearchable(trimmed),
               !store.searching,
               store.searchError == nil,
               store.resultsFor == trimmed,
               store.results.isEmpty {
                hint("No players match that search.")
                    .padding(.vertical, TapSpacing.sm)
            }
        }
    }

    @ViewBuilder
    private func friendsSection(_ store: FriendsStore) -> some View {
        Section {
            if store.loading, !store.loaded {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, TapSpacing.lg)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
            } else if let error = store.loadError {
                VStack(alignment: .leading, spacing: TapSpacing.sm) {
                    errorText(error)
                    Button("Try again") { Task { await store.load(force: true) } }
                        .buttonStyle(.tap(.secondary))
                }
                .listRowInsets(
                    EdgeInsets(
                        top: 0,
                        leading: TapSpacing.lg,
                        bottom: TapSpacing.sm,
                        trailing: TapSpacing.lg
                    )
                )
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
            } else if store.loaded, store.friends.isEmpty {
                hint("No friends yet — search above to add the people you play with.")
                    .padding(.vertical, TapSpacing.sm)
                    .listRowInsets(
                        EdgeInsets(
                            top: 0,
                            leading: TapSpacing.lg,
                            bottom: TapSpacing.sm,
                            trailing: TapSpacing.lg
                        )
                    )
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
            } else {
                ForEach(
                    FriendListModel.sorted(store.friends, mode: sortMode),
                    id: \.id
                ) { friend in
                    friendRow(friend, store: store)
                        .listRowInsets(
                            EdgeInsets(
                                top: 0,
                                leading: TapSpacing.lg,
                                bottom: TapSpacing.sm,
                                trailing: TapSpacing.lg
                            )
                        )
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                }
            }

            if let error = store.mutationError {
                errorText(error)
                    .listRowInsets(
                        EdgeInsets(
                            top: 0,
                            leading: TapSpacing.lg,
                            bottom: TapSpacing.sm,
                            trailing: TapSpacing.lg
                        )
                    )
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
            }
        } header: {
            HStack(spacing: TapSpacing.md) {
                Text("My friends")
                    .font(TapFont.display(size: 19.2, weight: .semibold))
                    .foregroundStyle(TapColors.text)
                Spacer(minLength: 0)
                if !store.friends.isEmpty { sortToggle }
            }
            .padding(.top, TapSpacing.xs)
            .padding(.bottom, TapSpacing.xs)
        }
        .textCase(nil)
    }

    private var sortMode: FriendSortMode {
        FriendSortMode(rawValue: storedSort) ?? .suggested
    }

    private var sortToggle: some View {
        HStack(spacing: 0) {
            sortButton("Suggested", mode: .suggested)
            sortButton("A–Z", mode: .alphabetical)
        }
        .background(Capsule().fill(Color.clear))
        .clipShape(Capsule())
        .overlay(Capsule().strokeBorder(TapColors.border, lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Sort friends")
    }

    private func sortButton(_ title: String, mode: FriendSortMode) -> some View {
        Button {
            storedSort = mode.rawValue
        } label: {
            Text(title)
                .font(TapFont.ui(size: 12.5, weight: .bold))
                .foregroundStyle(sortMode == mode ? TapColors.primaryText : TapColors.textMuted)
                .padding(.vertical, 7)
                .padding(.horizontal, TapSpacing.md)
                .background(sortMode == mode ? TapColors.primary : Color.clear)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(sortMode == mode ? .isSelected : [])
    }

    private func searchRow(_ player: PlayerSearchResult, store: FriendsStore) -> some View {
        TapCard {
            HStack(spacing: TapSpacing.md) {
                TapAvatar(
                    playerId: player.id,
                    avatarVersion: player.avatarVersion,
                    displayName: player.displayName,
                    username: player.username
                )
                VStack(alignment: .leading, spacing: 1) {
                    Text(player.displayName)
                        .font(TapFont.ui(size: 16, weight: .semibold))
                        .foregroundStyle(TapColors.text)
                        .lineLimit(1)
                    Text(searchDetail(player))
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
                handicap(player.handicapIndex)
                if player.isFriend {
                    Text("✓ Friend")
                        .font(TapFont.ui(size: 12.8, weight: .bold))
                        .foregroundStyle(TapColors.accent)
                } else {
                    Button("Add") { Task { await store.add(player) } }
                        .buttonStyle(.tap(.primary))
                        .disabled(store.mutationInFlight)
                }
            }
            .padding(.vertical, TapSpacing.md)
            .padding(.horizontal, TapSpacing.lg)
        }
        .accessibilityIdentifier("friends-search-result")
    }

    private func friendRow(_ friend: FriendProfile, store: FriendsStore) -> some View {
        let isLive = activity?.liveFriendIds.contains(friend.id) ?? false
        return TapCard {
            HStack(spacing: TapSpacing.md) {
                TapAvatar(
                    playerId: friend.id,
                    avatarVersion: friend.avatarVersion,
                    displayName: friend.displayName,
                    username: friend.username
                )
                VStack(alignment: .leading, spacing: 1) {
                    HStack(spacing: TapSpacing.sm) {
                        Text(friend.displayName)
                            .font(TapFont.ui(size: 16, weight: .semibold))
                            .foregroundStyle(TapColors.text)
                            .lineLimit(1)
                            // The dot itself is decorative; the fact it carries
                            // has to reach VoiceOver as words.
                            .accessibilityLabel(
                                isLive ? "\(friend.displayName), playing now" : friend.displayName
                            )
                        if isLive { LiveDot(diameter: 7) }
                    }
                    Text(FriendListModel.subtitle(friend, now: Date()))
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                        .lineLimit(1)
                    // One-way connections only. Muted, wordy, and in the same
                    // tone as the line above it — a colour or an icon here
                    // would turn an ordinary state into a fault report.
                    if let note = FriendListModel.connectionNote(friend) {
                        Text(note)
                            .font(TapFont.ui(size: 12))
                            .foregroundStyle(TapColors.textMuted)
                            .lineLimit(1)
                    }
                }
                Spacer(minLength: 0)
                handicap(friend.handicapIndex)
            }
            .padding(.vertical, TapSpacing.md)
            .padding(.leading, TapSpacing.lg)
            .padding(.trailing, TapSpacing.sm)
        }
        // SwiftUI's native trailing swipe action keeps removal discoverable
        // without reserving permanent space in every friend card.
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            Button(role: .destructive) {
                Task { await store.remove(friend.id) }
            } label: {
                Label("Remove", systemImage: "trash")
            }
            .disabled(store.mutationInFlight)
            .tint(TapColors.danger)
        }
        .accessibilityHint("Swipe left to reveal the remove action")
        .accessibilityIdentifier("friend-row")
    }

    private func handicap(_ value: Double?) -> some View {
        Text(FriendListModel.handicap(value))
            .font(TapFont.ui(size: 13.6, weight: .bold))
            .foregroundStyle(TapColors.accent)
            .padding(.vertical, 2)
            .padding(.horizontal, 10)
            .background(Capsule().fill(TapColors.accentSoft))
    }

    private func searchDetail(_ player: PlayerSearchResult) -> String {
        if let club = player.homeClubName, !club.isEmpty {
            return "@\(player.username) · \(club)"
        }
        return "@\(player.username)"
    }

    private func hint(_ text: String) -> some View {
        Text(text)
            .font(TapFont.ui(size: 13.2))
            .foregroundStyle(TapColors.textMuted)
            .fixedSize(horizontal: false, vertical: true)
    }

    private func errorText(_ text: String) -> some View {
        Text(text)
            .font(TapFont.ui(size: 13.6))
            .foregroundStyle(TapColors.danger)
            .fixedSize(horizontal: false, vertical: true)
    }
}
