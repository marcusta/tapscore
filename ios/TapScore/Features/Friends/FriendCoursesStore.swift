import Foundation
import Observation

/// State for a friend's courses list — `GET /friends/:playerId/courses`.
///
/// One read, no cursor: the server caps the list and reports truncation with
/// `hasMore` (a browsing aid, not an archive — see `FriendProfileService`).
/// When `hasMore` is true the view says the list is truncated in one quiet
/// line; the profile card's `coursesTotal` is deliberately never used as this
/// list's arithmetic, because private and link rounds count there and their
/// courses may be absent here.
@MainActor
@Observable
final class FriendCoursesStore {
    let playerId: String

    private(set) var courses: [FriendProfileCourseEntry] = []
    private(set) var hasMore = false
    private(set) var loaded = false
    private(set) var loading = false
    private(set) var loadError: String?
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
            let page = try await api.send(
                FriendProfileEndpoints.courses,
                FriendProfileProfileInput(playerId: playerId)
            )
            courses = page.courses
            hasMore = page.hasMore
            loaded = true
            unavailable = nil
        } catch {
            if error is CancellationError { return }
            if let refusal = FriendProfileModel.unavailability(for: error) {
                unavailable = refusal
                courses = []
                loaded = false
            } else if case APIError.unauthorized = error {
                loadError = "Your session expired — sign in again."
            } else {
                loadError = "Couldn't load these courses."
            }
        }
    }
}
