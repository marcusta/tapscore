import Foundation
import Observation

/// Session-scoped state for the native mirror of `src/friends/friends.service.ts`.
///
/// Search is debounced and sequence-safe through task cancellation. Add/remove
/// patch both lists locally after the server accepts the mutation, matching the
/// web screen without an unnecessary reload.
@MainActor
@Observable
final class FriendsStore {
    private(set) var friends: [FriendProfile] = []
    private(set) var loaded = false
    private(set) var loading = false
    private(set) var loadError: String?

    private(set) var query = ""
    private(set) var results: [PlayerSearchResult] = []
    private(set) var resultsFor = ""
    private(set) var searching = false
    private(set) var searchError: String?

    private(set) var mutationInFlight = false
    private(set) var mutationError: String?

    private let api: TapScoreAPI
    private let searchDelayNanoseconds: UInt64
    private var searchTask: Task<Void, Never>?

    init(api: TapScoreAPI, searchDelayNanoseconds: UInt64 = 300_000_000) {
        self.api = api
        self.searchDelayNanoseconds = searchDelayNanoseconds
    }

    func load(force: Bool = false) async {
        guard force || (!loaded && !loading) else { return }
        loading = true
        loadError = nil
        defer { loading = false }
        do {
            friends = try await api.send(FriendsEndpoints.list)
            loaded = true
        } catch {
            loadError = Self.message(for: error, fallback: "Couldn't load your friends.")
        }
    }

    func setQuery(_ raw: String) {
        query = raw
        searchError = nil
        searchTask?.cancel()

        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard FriendListModel.isSearchable(trimmed) else {
            searching = false
            results = []
            resultsFor = trimmed
            return
        }

        searching = true
        searchTask = Task { [weak self] in
            guard let self else { return }
            do {
                try await Task.sleep(nanoseconds: searchDelayNanoseconds)
                try Task.checkCancellation()
                let found = try await api.send(
                    PlayersEndpoints.search,
                    PlayersSearchInput(q: trimmed)
                )
                try Task.checkCancellation()
                // The task is cancelled on every edit. This final equality
                // guard also protects against transports that finish despite
                // cancellation.
                guard query.trimmingCharacters(in: .whitespacesAndNewlines) == trimmed else {
                    return
                }
                results = found
                resultsFor = trimmed
                searching = false
            } catch is CancellationError {
                // A newer query owns the visible progress state.
            } catch {
                guard !Task.isCancelled else { return }
                results = []
                resultsFor = trimmed
                searching = false
                searchError = Self.message(for: error, fallback: "Search failed. Try again.")
            }
        }
    }

    func add(_ player: PlayerSearchResult) async {
        guard !player.isFriend, !mutationInFlight else { return }
        mutationInFlight = true
        mutationError = nil
        defer { mutationInFlight = false }
        do {
            _ = try await api.send(
                FriendsEndpoints.add,
                FriendsAddInput(friendId: player.id)
            )
            let added = FriendProfile(
                sharedRoundCount: 0,
                lastPlayedAt: nil,
                frecency: 0,
                id: player.id,
                username: player.username,
                displayName: player.displayName,
                gender: player.gender,
                handicapIndex: player.handicapIndex,
                homeClubName: player.homeClubName
            )
            friends.removeAll { $0.id == player.id }
            friends.append(added)
            results = results.map {
                guard $0.id == player.id else { return $0 }
                var copy = $0
                copy.isFriend = true
                return copy
            }
        } catch {
            mutationError = Self.message(for: error, fallback: "Couldn't add that friend.")
        }
    }

    func remove(_ id: String) async {
        guard !mutationInFlight else { return }
        mutationInFlight = true
        mutationError = nil
        defer { mutationInFlight = false }
        do {
            _ = try await api.send(
                FriendsEndpoints.remove,
                FriendsAddInput(friendId: id)
            )
            friends.removeAll { $0.id == id }
            results = results.map {
                guard $0.id == id else { return $0 }
                var copy = $0
                copy.isFriend = false
                return copy
            }
        } catch {
            mutationError = Self.message(for: error, fallback: "Couldn't remove that friend.")
        }
    }

    private static func message(for error: any Error, fallback: String) -> String {
        switch error {
        case APIError.unauthorized:
            return "Your session expired — sign in again."
        case APIError.server(_, let message?):
            return message
        case APIError.network:
            return fallback
        case APIError.decoding:
            return fallback
        default:
            return fallback
        }
    }
}
