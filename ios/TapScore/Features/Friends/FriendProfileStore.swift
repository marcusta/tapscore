import Foundation
import Observation

/// State for one friend's profile card — `GET /friends/:playerId/profile`.
///
/// Read-only by construction, like `SpectateStore`: it holds a player id, calls
/// one session-authorized read, and there is no code path from here to any
/// write. The server refuses the caller's OWN id with a 403 by design (your own
/// history is the dashboard's job); this store never has to special-case that
/// because the only entry point is the friends list, which never contains the
/// signed-in player.
///
/// The payload's aggregates and its `recentRounds` disagree ON PURPOSE —
/// `roundsTotal`/`coursesTotal` count private and link rounds, the lists show
/// only `visibility = 'friends'` (see `FriendProfileService`'s class doc). The
/// store carries both verbatim and the views keep them apart: counts belong to
/// the profile card, lists are just lists.
@MainActor
@Observable
final class FriendProfileStore {
    let playerId: String

    private(set) var profile: FriendProfileView?
    private(set) var loaded = false
    private(set) var loading = false
    private(set) var loadError: String?
    /// Set when the server refused the read — the friendship was withdrawn
    /// mid-session, or the player is gone. A distinct state rather than an
    /// error, because no retry fixes it.
    private(set) var unavailable: FriendProfileUnavailability?

    private let api: TapScoreAPI

    init(playerId: String, api: TapScoreAPI) {
        self.playerId = playerId
        self.api = api
    }

    func load(force: Bool = false) async {
        guard force || (!loaded && !loading) else { return }
        loading = true
        loadError = nil
        defer { loading = false }
        do {
            profile = try await api.send(
                FriendProfileEndpoints.profile,
                FriendProfileProfileInput(playerId: playerId)
            )
            loaded = true
            unavailable = nil
        } catch {
            if error is CancellationError { return }
            if let refusal = FriendProfileModel.unavailability(for: error) {
                // Access is gone. Drop what was on screen — keeping a profile
                // the server just refused would show data the viewer may no
                // longer see.
                unavailable = refusal
                profile = nil
                loaded = false
            } else if case APIError.unauthorized = error {
                loadError = "Your session expired — sign in again."
            } else {
                loadError = "Couldn't load this profile."
            }
        }
    }
}
