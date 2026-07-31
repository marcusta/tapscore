import Foundation
import Observation

/// State for a friend's full round list — `GET /friends/:playerId/rounds`,
/// newest first, keyset-paginated.
///
/// The cursor is opaque: the store passes `nextCursor` back verbatim and never
/// constructs or inspects one (the service resolves it against its own rows;
/// an unrecognised value simply yields the first page). `hasMore` is the only
/// stop condition — the list's length is NEVER compared against the profile
/// card's `roundsTotal`, because the two disagree by design (private and link
/// rounds count there and are absent here).
@MainActor
@Observable
final class FriendRoundsStore {
    let playerId: String

    private(set) var rounds: [FriendProfileRoundEntry] = []
    private(set) var nextCursor: String?
    private(set) var hasMore = false
    private(set) var loaded = false
    private(set) var loading = false
    private(set) var loadingMore = false
    private(set) var loadError: String?
    private(set) var unavailable: FriendProfileUnavailability?

    private let api: TapScoreAPI
    /// How close to the end a row may appear before the next page is fetched.
    private let prefetchDistance = 3
    /// Bumped by every `load`, so a page fetch that was in flight when the user
    /// refreshed can tell its list is gone: stitching a pre-refresh page onto a
    /// fresh page one would resurrect stale rows AND rewind the cursor to the
    /// old keyset.
    private var generation = 0

    init(playerId: String, api: TapScoreAPI) {
        self.playerId = playerId
        self.api = api
    }

    /// The first page. `force` restarts from the top — a refresh must not
    /// append page one onto an old list.
    func load(force: Bool = false) async {
        guard force || (!loaded && !loading) else { return }
        generation += 1
        loading = true
        loadError = nil
        defer { loading = false }
        do {
            let page = try await api.send(
                FriendProfileEndpoints.rounds,
                FriendProfileRoundsInput(playerId: playerId)
            )
            rounds = page.rounds
            nextCursor = page.nextCursor
            hasMore = page.hasMore
            loaded = true
            unavailable = nil
        } catch {
            handle(error)
        }
    }

    /// Called as rows appear; fetches the next page when `entry` is within the
    /// last few rows. The trigger lives here rather than in the view so the
    /// guard set (has more, cursor present, nothing in flight) is testable.
    func loadMoreIfNeeded(current entry: FriendProfileRoundEntry) async {
        guard let index = rounds.firstIndex(where: { $0.roundId == entry.roundId }),
              index >= rounds.count - prefetchDistance
        else { return }
        await loadMore()
    }

    func loadMore() async {
        guard loaded, hasMore, let cursor = nextCursor, !loadingMore, !loading else { return }
        loadingMore = true
        // A retried page that succeeds must also clear the failure it is
        // retrying, or the error row lingers under a complete list.
        loadError = nil
        let startedFor = generation
        defer { loadingMore = false }
        do {
            let page = try await api.send(
                FriendProfileEndpoints.rounds,
                FriendProfileRoundsInput(playerId: playerId, cursor: cursor)
            )
            guard startedFor == generation else { return }
            rounds = FriendProfileModel.merge(rounds, page.rounds)
            nextCursor = page.nextCursor
            hasMore = page.hasMore
        } catch {
            guard startedFor == generation else { return }
            // A failed page keeps what is on screen; a refusal removes it, the
            // same as the first page — access is gone for the whole list, not
            // for the rows not yet fetched.
            handle(error)
        }
    }

    private func handle(_ error: any Error) {
        if error is CancellationError { return }
        if let refusal = FriendProfileModel.unavailability(for: error) {
            unavailable = refusal
            rounds = []
            nextCursor = nil
            hasMore = false
            loaded = false
        } else if case APIError.unauthorized = error {
            loadError = "Your session expired — sign in again."
        } else {
            loadError = "Couldn't load these rounds."
        }
    }
}
