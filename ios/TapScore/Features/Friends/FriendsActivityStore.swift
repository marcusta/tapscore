import Foundation
import Observation

/// Session-scoped state for `GET /dashboard/friends-activity` — the feed behind
/// the home "Out now" strip and the Friends tab's live dots.
///
/// Deliberately its own store rather than a field on an existing one: two
/// unrelated screens read it, and neither should have to own the other's
/// loading state. It is cheap to hold — one array of rounds — and the failure
/// mode is silence, not an error banner (see `loadFailed`).
@MainActor
@Observable
final class FriendsActivityStore {
    private(set) var live: [FriendsActivityEntry] = []
    private(set) var recent: [FriendsActivityEntry] = []
    private(set) var formatDescriptors: [FormatDescriptor] = []
    private(set) var loaded = false
    private(set) var loading = false
    /// Recorded for tests and diagnostics, NOT rendered. A friends feed that
    /// fails to load is a strip that does not appear — the same as a quiet
    /// afternoon. An error row on the landing would make every network blip
    /// look like something the player must act on.
    private(set) var loadFailed = false

    private let api: TapScoreAPI

    init(api: TapScoreAPI) {
        self.api = api
    }

    var chips: [OutNowChip] { FriendsActivityModel.chips(live) }
    var recentRows: [RecentFriendRow] { FriendsActivityModel.recentRows(recent) }
    var contextLine: String? { FriendsActivityModel.contextLine(live) }
    /// Friend ids to mark live in the Friends tab.
    var liveFriendIds: Set<String> { FriendsActivityModel.friendIds(live) }

    func formatText(for ids: [String]) -> String? {
        let text = LandingFormatLabels.forIds(ids, descriptors: formatDescriptors)
            .joined(separator: " · ")
        return text.isEmpty ? nil : text
    }

    func load(force: Bool = false) async {
        guard force || (!loaded && !loading) else { return }
        loading = true
        defer { loading = false }
        async let formatsResult: [FormatDescriptor]? = try? await api.send(SetupEndpoints.formats)
        do {
            let activity = try await api.send(DashboardEndpoints.friendsActivity)
            live = activity.live
            recent = activity.recent
            formatDescriptors = await formatsResult ?? []
            loaded = true
            loadFailed = false
        } catch {
            // Keep whatever is on screen. A failed refresh should not blank a
            // strip that was accurate 30 seconds ago.
            loadFailed = true
        }
    }
}
