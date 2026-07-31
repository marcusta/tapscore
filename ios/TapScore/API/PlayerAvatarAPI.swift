import Foundation

/// The three profile-photo calls, by hand.
///
/// `bun run generate:swift` does not emit these, and cannot: the routes are
/// raw Hono rather than `mount()` descriptors (`server/api/player-avatar.ts`)
/// because their bodies are images, and the generator only knows how to model a
/// JSON request and a JSON response. Same reason the SSE streams are absent
/// from `Generated/` and hand-driven by `SSEClient`.
///
/// This still goes through `requestData`, so bearer injection, the base-URL
/// join that keeps the `/tapscore` production prefix, and the 401 →
/// `.unauthorized` mapping stay in exactly one place — the seam's first rule.
extension TapScoreAPI {
    /// What `PUT /players/me/avatar` answers with.
    struct AvatarUpload: Decodable, Sendable {
        let avatarVersion: String
        let contentType: String
        let byteSize: Int
    }

    /// The image bytes for a player, or nil when they have no photo.
    ///
    /// A missing photo is not an error — it is the majority state, and it is
    /// how the caller decides to draw initials. Only a 404 becomes nil;
    /// everything else (offline, 401, 500) still throws, because "we could not
    /// tell" and "there is nothing to show" must not render the same way twice
    /// in a row and then differently on a refresh.
    ///
    /// `version` is passed as `?v=` so the response comes back marked immutable
    /// for a year — that is what lets `URLSession`'s shared cache keep a face
    /// across launches without ever risking a stale one, since a replaced photo
    /// has a different version and therefore a different URL.
    func avatarBytes(playerId: String, version: String) async throws -> Data? {
        do {
            return try await requestData(
                path: "players/\(playerId)/avatar",
                query: ["v": version]
            )
        } catch APIError.server(404, _) {
            return nil
        }
    }

    /// Replace the signed-in player's photo. `data` IS the body.
    ///
    /// The server sniffs the real format from the magic bytes and ignores this
    /// header, so `contentType` is a courtesy to proxies and logs rather than
    /// something the stored row depends on.
    func uploadAvatar(_ data: Data, contentType: String = "image/jpeg") async throws -> AvatarUpload {
        let body = try await requestData(
            path: "players/me/avatar",
            method: "PUT",
            body: data,
            contentType: contentType
        )
        do {
            return try JSONDecoder().decode(AvatarUpload.self, from: body)
        } catch {
            throw APIError.decoding("\(AvatarUpload.self): \(error)")
        }
    }

    /// Remove it. Idempotent server-side, so calling it twice is fine.
    func deleteAvatar() async throws {
        _ = try await requestData(path: "players/me/avatar", method: "DELETE")
    }
}
