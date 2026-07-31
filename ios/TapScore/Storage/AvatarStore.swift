import SwiftUI

/// The device's profile-photo cache.
///
/// Why this exists at all: `AsyncImage` would be the obvious way to draw a
/// remote face, and it cannot be used here. The serve route is session-gated
/// and the native client authenticates with `Authorization: Bearer` — a header
/// `AsyncImage` has no way to send, because it takes a URL and not a request.
/// So the bytes come through `TapScoreAPI` like every other call, and this is
/// where they turn into something a view can draw.
///
/// `@MainActor` rather than an `actor`: the cached value is a `UIImage`, and
/// keeping it pinned to one actor is what keeps it out of Swift 6's Sendable
/// question entirely. Only `Data` ever crosses an isolation boundary. Decoding
/// happens here too, once per photo, which is cheap at the 512px the clients
/// upload.
@MainActor
final class AvatarStore {
    private let api: TapScoreAPI

    /// Keyed by `playerId@version`, so a replaced photo is a different entry
    /// and a stale face can never be served from here. `NSCache` for the
    /// eviction: a season of friends is a bounded number of faces, but nothing
    /// in the app bounds how many players a search can walk past.
    private let cache = NSCache<NSString, UIImage>()

    /// In-flight fetches, so a friends list that shows the same person twice
    /// (a row and an "Out now" chip) makes one request. `Data`, not `UIImage`
    /// — a `Task`'s result must be `Sendable`, and this is the boundary.
    private var inFlight: [String: Task<Data?, Never>] = [:]

    /// Keys that resolved to "no photo" or failed outright. Without it, every
    /// row of a photo-less list re-asks on every appearance, which for a
    /// scrolling list means asking forever.
    private var known404: Set<String> = []

    init(api: TapScoreAPI) {
        self.api = api
        cache.countLimit = 200
    }

    /// The decoded photo for a player, or nil when there is none.
    ///
    /// A nil `version` short-circuits without touching the network: that is the
    /// server saying this player has no photo, and it is the whole reason the
    /// field rides along on every player-carrying payload. Never call this with
    /// a made-up version to "check" — it is a guaranteed 404 per row.
    func image(playerId: String, version: String?) async -> UIImage? {
        guard let version, !version.isEmpty, !playerId.isEmpty else { return nil }
        let key = "\(playerId)@\(version)"
        if let hit = cache.object(forKey: key as NSString) { return hit }
        if known404.contains(key) { return nil }

        let task = inFlight[key] ?? {
            let created = Task<Data?, Never> { [api] in
                try? await api.avatarBytes(playerId: playerId, version: version)
            }
            inFlight[key] = created
            return created
        }()

        let data = await task.value
        inFlight[key] = nil

        guard let data, let image = UIImage(data: data) else {
            known404.insert(key)
            return nil
        }
        cache.setObject(image, forKey: key as NSString)
        return image
    }

    /// Empty the cache. Called after the signed-in player changes or removes
    /// their own photo, and on sign-out.
    ///
    /// Everything goes, not just that player's entry: `NSCache` cannot
    /// enumerate its keys, and a parallel index kept in sync by hand would be
    /// real machinery to save one cheap refetch per photo change per launch.
    /// The "no photo" memo goes with it — that is the entry a removal makes
    /// wrong in the other direction.
    func clear() {
        cache.removeAllObjects()
        known404.removeAll()
    }
}
