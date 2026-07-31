import SwiftUI

/// A friend's full round list — newest first, lazily paged.
///
/// The next page is fetched as the list nears its end, keyed off the opaque
/// `nextCursor` and stopped by `hasMore` alone. There is deliberately no
/// count in the header and no terminal "that's all N" row: the profile card's
/// `roundsTotal` counts private and link rounds this list will never show,
/// so any sentence equating the two would be a lie.
struct FriendRoundsListView: View {
    @Environment(AppEnvironment.self) private var environment

    let playerId: String
    let displayName: String
    let onOpenRound: (String) -> Void

    @State private var store: FriendRoundsStore?

    var body: some View {
        List {
            heading
                .listRowInsets(
                    EdgeInsets(
                        top: TapSpacing.xl,
                        leading: TapSpacing.lg,
                        bottom: TapSpacing.lg,
                        trailing: TapSpacing.lg
                    )
                )
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)

            if let store {
                rows(store)
            } else {
                spinnerRow
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .background(TapColors.bg)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(TapColors.bg, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .refreshable {
            if let store { await store.load(force: true) }
        }
        .task {
            guard store == nil else { return }
            let created = FriendRoundsStore(playerId: playerId, api: environment.api)
            store = created
            await created.load()
        }
        .accessibilityIdentifier("friend-rounds-screen")
    }

    private var heading: some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            Text("Rounds")
                .font(TapFont.display(size: 27.2, weight: .semibold))
                .foregroundStyle(TapColors.text)
            Text("Rounds \(displayName) has shared with friends.")
                .font(TapFont.ui(size: 14.4))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    @ViewBuilder
    private func rows(_ store: FriendRoundsStore) -> some View {
        if let refusal = store.unavailable {
            RoundEmptyState(
                title: refusal.title,
                systemImage: refusal.systemImage,
                message: refusal.message
            )
            .plainRow()
        } else if let error = store.loadError, store.rounds.isEmpty {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                errorText(error)
                Button("Try again") { Task { await store.load(force: true) } }
                    .buttonStyle(.tap(.secondary))
            }
            .listRowInsets(
                EdgeInsets(top: 0, leading: TapSpacing.lg, bottom: 0, trailing: TapSpacing.lg)
            )
            .plainRow()
        } else if store.loading, !store.loaded {
            spinnerRow
        } else if store.loaded, store.rounds.isEmpty {
            hint("No rounds are shared with you.")
                .listRowInsets(
                    EdgeInsets(top: 0, leading: TapSpacing.lg, bottom: 0, trailing: TapSpacing.lg)
                )
                .plainRow()
        } else {
            ForEach(store.rounds, id: \.roundId) { entry in
                TapCard {
                    Button {
                        onOpenRound(entry.roundId)
                    } label: {
                        FriendRoundRow(entry: entry)
                    }
                    .buttonStyle(.plain)
                    .accessibilityHint("Opens this round read-only")
                }
                .listRowInsets(
                    EdgeInsets(
                        top: 0,
                        leading: TapSpacing.lg,
                        bottom: TapSpacing.sm,
                        trailing: TapSpacing.lg
                    )
                )
                .plainRow()
                .onAppear {
                    Task { await store.loadMoreIfNeeded(current: entry) }
                }
            }

            if store.loadingMore {
                spinnerRow
            } else if let error = store.loadError, !store.rounds.isEmpty {
                // A failed PAGE keeps the rows already shown; the retry only
                // asks for the missing tail.
                VStack(alignment: .leading, spacing: TapSpacing.sm) {
                    errorText(error)
                    Button("Try again") { Task { await store.loadMore() } }
                        .buttonStyle(.tap(.secondary))
                }
                .listRowInsets(
                    EdgeInsets(top: 0, leading: TapSpacing.lg, bottom: 0, trailing: TapSpacing.lg)
                )
                .plainRow()
            }
        }
    }

    private var spinnerRow: some View {
        ProgressView()
            .frame(maxWidth: .infinity)
            .padding(.vertical, TapSpacing.lg)
            .listRowInsets(EdgeInsets())
            .plainRow()
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

extension View {
    /// The clear, separator-free list row every plain-list screen here uses.
    func plainRow() -> some View {
        self
            .listRowBackground(Color.clear)
            .listRowSeparator(.hidden)
    }
}
