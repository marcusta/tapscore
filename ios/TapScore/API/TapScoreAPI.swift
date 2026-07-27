import Foundation

/// The tapscore server client.
///
/// **Skeleton.** The transport below (URL building, bearer injection, status →
/// `APIError` mapping, decoding) is real and finished; the *endpoint surface* is
/// not. Exactly one call is implemented — `me()` — as a smoke probe. Everything
/// else arrives from the generator (see the seam at the bottom of this file).
///
/// Design notes, mirroring `../golf-map/ios/GolfMap/API/GolfAPIClient.swift`:
///
/// - **`actor`**, not `@MainActor final class`. It owns mutable state and does
///   only network I/O; an actor keeps that safe off the main thread under Swift
///   6 strict concurrency without dragging callers onto the main actor.
/// - **Bearer, not cookie.** The web client authenticates with a session
///   cookie; the native client sends `Authorization: Bearer <token>` (framework
///   1.2.0 accepts both, cookie wins when both are present). The token is read
///   from the Keychain through `tokenProvider` on *every* request rather than
///   cached, so sign-out takes effect immediately.
/// - **No auto re-login.** golf-map can silently re-authenticate because it
///   stores a username/password. Sign in with Apple cannot be replayed
///   headlessly, so a 401 must surface as `.unauthorized` and let the UI ask.
actor TapScoreAPI {
    /// Supplies the current bearer token, or nil when the user is anonymous.
    /// Anonymous is a normal state — share-link routes are token-scoped, not
    /// session-scoped.
    typealias TokenProvider = @Sendable () -> String?

    private let configuration: APIConfiguration
    private let session: URLSession
    private let decoder: JSONDecoder
    private let tokenProvider: TokenProvider

    init(
        configuration: APIConfiguration,
        session: URLSession = .shared,
        tokenProvider: @escaping TokenProvider = { nil }
    ) {
        self.configuration = configuration
        self.session = session
        self.decoder = JSONDecoder()
        self.tokenProvider = tokenProvider
    }

    // MARK: - Implemented probe

    /// `GET /api/auth/me` — the smoke probe. Returns the signed-in player, or
    /// throws `.unauthorized` when the bearer token is absent/stale.
    ///
    /// Surfaced on the landing screen so a build can be proven against a live
    /// server without any other endpoint existing yet. `Player` is the
    /// generated model (`API/Generated/AuthNativeTypes.swift`) — the
    /// hand-written stand-in this used to decode into is gone.
    func me() async throws -> Player {
        try await request(path: "auth/me")
    }

    // MARK: - Transport

    /// Performs a request and decodes `T` from the response body.
    ///
    /// - Parameters:
    ///   - path: path relative to the API base, without a leading slash
    ///     (e.g. `"auth/me"`). Joined onto the base so the `/tapscore` prod
    ///     path prefix survives.
    ///   - method: HTTP verb.
    ///   - query: appended verbatim; nil values are skipped.
    ///   - body: pre-encoded JSON body. Sets `Content-Type` when present.
    func request<T: Decodable>(
        path: String,
        method: String = "GET",
        query: [String: String?] = [:],
        body: Data? = nil
    ) async throws -> T {
        let data = try await requestData(path: path, method: method, query: query, body: body)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decoding("\(T.self): \(error)")
        }
    }

    /// Performs a request and returns the raw body. Split out from `request`
    /// so the generated layer can decode with its own strategy (the generator
    /// emits `init(from:)` for three-state optionality) without re-implementing
    /// URL building, auth, or error mapping.
    func requestData(
        path: String,
        method: String = "GET",
        query: [String: String?] = [:],
        body: Data? = nil
    ) async throws -> Data {
        var components = URLComponents(
            url: configuration.baseURL.appendingPathComponent(path),
            resolvingAgainstBaseURL: false
        )
        let items = query.compactMap { key, value in
            value.map { URLQueryItem(name: key, value: $0) }
        }
        if !items.isEmpty { components?.queryItems = items.sorted { $0.name < $1.name } }
        guard let url = components?.url else {
            throw APIError.network("Could not build a URL for \(path)")
        }

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = method
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            urlRequest.httpBody = body
            urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        // Bearer injection. Read fresh every request — see the type doc.
        if let token = tokenProvider() {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch {
            throw APIError.network(error.localizedDescription)
        }
        guard let http = response as? HTTPURLResponse else {
            throw APIError.network("Response was not HTTP")
        }
        switch http.statusCode {
        case 200..<300:
            return data
        case 401:
            throw APIError.unauthorized
        default:
            throw APIError.server(code: http.statusCode, message: Self.errorMessage(from: data))
        }
    }

    /// Pulls `{ "error": "…" }` out of an error body, falling back to a short
    /// raw prefix so an HTML error page is still diagnosable.
    private static func errorMessage(from data: Data) -> String? {
        if let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let message = object["error"] as? String {
            return message
        }
        guard let raw = String(data: data, encoding: .utf8)?
            .trimmingCharacters(in: .whitespacesAndNewlines), !raw.isEmpty
        else { return nil }
        return String(raw.prefix(200))
    }

    // MARK: - ============ GENERATED ENDPOINT SEAM ============
    //
    // `scripts/generate-swift.ts` (`bun run generate:swift`) writes typed
    // models and endpoint definitions into `TapScore/API/Generated/`. That
    // directory is MACHINE-WRITTEN — never hand-edit it, and never create it by
    // hand; it does not exist until the generator has run, and the app builds
    // fine without it.
    //
    // The generated code plugs in HERE, as an extension in Generated/:
    //
    //     extension TapScoreAPI {
    //         func friendlyRound(id: String) async throws -> FriendlyRound {
    //             try await request(path: "friendly-rounds/get", query: ["id": id])
    //         }
    //     }
    //
    // Rules for the seam:
    //   1. `request` / `requestData` above are the ONLY transport. Generated
    //      code must not build its own URLSession, or bearer injection and the
    //      401 → `.unauthorized` mapping silently diverge.
    //   2. Hand-written endpoint methods do not belong in this file beyond
    //      `me()`. If a call is missing, add it to the generator.
    //   3. After the first generation, run `cd ios && xcodegen generate` so the
    //      new files enter the project.
}
