import SwiftUI

/// "Add from friends" (spec §5.5, B5.6–B5.11).
///
/// The list is ordered by frecency, not alphabetically: the three people you
/// actually play with have to be the first three rows, or the picker is slower
/// than typing a name and nobody uses it twice. `FriendsPicker` owns that rule;
/// this file draws it, adds the search field the web has not got (§12.4), and
/// stays open across picks — a fourball is three taps, not three round trips
/// through a sheet.
struct FriendsPickerSheet: View {
    @Bindable var store: CreateStore

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            content
                .background(TapColors.bg)
                .navigationTitle("From friends")
                .navigationBarTitleDisplayMode(.inline)
                .toolbarBackground(TapColors.bg, for: .navigationBar)
                .toolbarBackground(.visible, for: .navigationBar)
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") { dismiss() }
                            .font(TapFont.ui(size: 16, weight: .bold))
                            .foregroundStyle(TapColors.primary)
                    }
                }
        }
        .task { await store.loadFriends() }
    }

    @ViewBuilder
    private var content: some View {
        let picker = store.friendsPicker
        VStack(spacing: 0) {
            TextField(
                "",
                text: $store.friendSearch,
                prompt: tapFieldPrompt("Search name or @username"))
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .tapField()
                .padding(.horizontal, TapSpacing.lg)
                .padding(.vertical, TapSpacing.md)

            ScrollView {
                VStack(spacing: TapSpacing.sm) {
                    if store.loadingFriends {
                        ProgressView().frame(maxWidth: .infinity).padding(.top, TapSpacing.xl)
                    }
                    if let error = store.friendsError {
                        Text(error)
                            .font(TapFont.ui(size: 13.6))
                            .foregroundStyle(TapColors.danger)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    if !store.loadingFriends, picker.friends.isEmpty, store.friendsError == nil {
                        empty("No friends yet — add someone from a round you've played together.")
                    } else if picker.isEmptyHanded {
                        empty("Nobody matches “\(store.friendSearch)”.")
                    } else if picker.results.isEmpty, !picker.friends.isEmpty {
                        // Every friend is already on the roster: a different
                        // fact, and a different (reassuring) sentence.
                        empty("Everyone you play with is already in this round.")
                    }
                    ForEach(picker.results, id: \.id) { friend in
                        row(friend)
                    }
                }
                .padding(.horizontal, TapSpacing.lg)
                .padding(.bottom, TapSpacing.xxl)
            }
        }
    }

    private func empty(_ message: String) -> some View {
        Text(message)
            .font(TapFont.ui(size: 13.6))
            .foregroundStyle(TapColors.textMuted)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, TapSpacing.md)
    }

    /// B5.9: display name, `@username`, and the index to one decimal (or "–").
    private func row(_ friend: FriendProfile) -> some View {
        Button {
            store.addFriend(friend)
        } label: {
            TapCard {
                HStack(spacing: TapSpacing.md) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(friend.displayName)
                            .font(TapFont.ui(size: 15.2, weight: .bold))
                            .foregroundStyle(TapColors.text)
                        Text("@\(friend.username)")
                            .font(TapFont.ui(size: 12.8))
                            .foregroundStyle(TapColors.textMuted)
                    }
                    Spacer(minLength: 0)
                    Text(FriendsPicker.handicapText(friend))
                        .font(TapFont.ui(size: 15.2, weight: .bold))
                        .foregroundStyle(TapColors.accent)
                        .monospacedDigit()
                    Image(systemName: "plus.circle.fill")
                        .foregroundStyle(TapColors.primary)
                }
                .padding(TapSpacing.md)
                .contentShape(Rectangle())
            }
        }
        .buttonStyle(.plain)
        .disabled(!store.canAddPlayer)
        .opacity(store.canAddPlayer ? 1 : 0.5)
        .accessibilityLabel("Add \(friend.displayName)")
    }
}
