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
/// The friend's live presence, when they are on the course right now.
/// Extracted from the friends-activity feed — the ONE presence authority
/// (activity recency, not a status column) — never derived from the profile's
/// round list, whose `active` status means only "friendly rounds never lock".
struct FriendProfilePresence: Equatable {
    let roundId: String
    let holesPlayed: Int
    let scoreToPar: Int?
}

@MainActor
@Observable
final class FriendProfileStore {
    let playerId: String

    private(set) var profile: FriendProfileView?
    /// Non-nil while the friend is out on the course. Best-effort decoration:
    /// a failed feed read leaves it nil and the profile intact.
    private(set) var presence: FriendProfilePresence?
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
        async let liveLine = loadPresence()
        do {
            profile = try await api.send(
                FriendProfileEndpoints.profile,
                FriendProfileProfileInput(playerId: playerId)
            )
            loaded = true
            unavailable = nil
            presence = await liveLine
        } catch {
            if error is CancellationError { return }
            if let refusal = FriendProfileModel.unavailability(for: error) {
                // Access is gone. Drop what was on screen — keeping a profile
                // the server just refused would show data the viewer may no
                // longer see.
                unavailable = refusal
                profile = nil
                presence = nil
                loaded = false
            } else if case APIError.unauthorized = error {
                loadError = "Your session expired — sign in again."
            } else {
                loadError = "Couldn't load this profile."
            }
        }
    }

    /// The friends-activity feed, reduced to this one friend. Any failure —
    /// including a refusal — yields nil rather than an error: the live line is
    /// decoration on the profile, and the profile read is the gate.
    private func loadPresence() async -> FriendProfilePresence? {
        guard let activity = try? await api.send(DashboardEndpoints.friendsActivity) else {
            return nil
        }
        for entry in activity.live {
            if let friend = entry.friends.first(where: { $0.playerId == playerId }) {
                return FriendProfilePresence(
                    roundId: entry.roundId,
                    holesPlayed: Int(friend.holesPlayed),
                    scoreToPar: friend.scoreToPar.map(Int.init)
                )
            }
        }
        return nil
    }
}
