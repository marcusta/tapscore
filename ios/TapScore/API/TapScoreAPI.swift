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
    private let encoder: JSONEncoder
    private let tokenProvider: TokenProvider

    init(
        configuration: APIConfiguration,
        session: URLSession = .shared,
        tokenProvider: @escaping TokenProvider = { nil }
    ) {
        self.configuration = configuration
        self.session = session
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
        self.tokenProvider = tokenProvider
    }

    // MARK: - Implemented probe

    /// `GET /api/players/me` — the signed-in profile probe. Returns the full
    /// `Player`, or throws `.unauthorized` when the bearer is absent/stale.
    ///
    /// NOT `/auth/me`: that is the framework's credential probe and answers
    /// with `AuthUser` — id and username only, no `displayName` — so decoding
    /// `Player` from it fails against a real server (found live: native
    /// password sign-in died on `keyNotFound(displayName)`). `/players/me`
    /// is the app-level route that answers with the profile the whole
    /// `AuthState.signedIn` layer carries. Its output is `Player?` — null
    /// means the session resolves to a player that no longer exists, which
    /// for the client is indistinguishable from being signed out.
    ///
    /// `bearer` overrides the Keychain-backed provider for this one call. It
    /// exists for the password door (N5): the profile is fetched with the
    /// freshly issued token BEFORE that token is written to the Keychain,
    /// which keeps the ordering the whole auth layer relies on: the bearer
    /// is stored, and only then does `authState` flip.
    func me(bearer: String? = nil) async throws -> Player {
        let data = try await requestData(path: "players/me", bearer: bearer)
        do {
            guard let player = try decoder.decode(Player?.self, from: data) else {
                throw APIError.unauthorized
            }
            return player
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.decoding("\(Player.self): \(error)")
        }
    }

    /// Best-effort revoke of a token the Keychain refused to store.
    ///
    /// The server has already issued a live session at this point, and the
    /// device is about to forget the only copy of its token — nothing will ever
    /// be able to revoke it, so it would sit valid until it expires. This kills
    /// it immediately, carrying the token explicitly because `tokenProvider`
    /// reads the Keychain and the Keychain is exactly what failed.
    ///
    /// Deliberately swallows every outcome: the sign-in is failing regardless,
    /// and a revoke that cannot be reached must not replace the real error.
    func revokeOrphanedToken(_ token: String) async {
        let endpoint = AuthNativeEndpoints.revoke
        let path = endpoint.path.hasPrefix("/") ? String(endpoint.path.dropFirst()) : endpoint.path
        _ = try? await requestData(
            path: path,
            method: endpoint.method.rawValue,
            body: Data("{}".utf8),
            bearer: token
        )
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
    ///
    /// `bearer` overrides the `tokenProvider` for this one request. It exists
    /// for exactly one caller: revoking a token that was issued but never made
    /// it into the Keychain, where the provider has nothing to hand back. Do
    /// not use it to route ordinary calls around the Keychain.
    ///
    /// `contentType` exists for the profile-photo routes, whose request body is
    /// an image rather than JSON (`PlayerAvatarAPI.swift`). It is a parameter
    /// of the transport rather than a second transport for the same reason rule
    /// 1 below gives: bearer injection and the 401 mapping must not have a
    /// second implementation to drift from.
    func requestData(
        path: String,
        method: String = "GET",
        query: [String: String?] = [:],
        body: Data? = nil,
        bearer: String? = nil,
        contentType: String = "application/json"
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
            urlRequest.setValue(contentType, forHTTPHeaderField: "Content-Type")
        }
        // Bearer injection. Read fresh every request — see the type doc.
        if let token = bearer ?? tokenProvider() {
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

    /// Sends a generated `APIEndpoint` descriptor and decodes its `Output`.
    ///
    /// This is TRANSPORT, not an endpoint method — the generator emits
    /// descriptors (method + path template + path-param names), and this is the
    /// one place that turns a descriptor into a request. Call sites read
    /// `try await api.send(AuthNativeEndpoints.appleSignIn, input)`, so adding
    /// an endpoint stays a generator change and never a change here.
    ///
    /// Path parameters are taken from `pathValues` first, then from the input's
    /// own encoded fields (the TS client does the same), and any field consumed
    /// that way is removed from the query/body — a `:id` must not also be sent
    /// as a duplicate field.
    func send<Input: Encodable & Sendable, Output: Decodable & Sendable>(
        _ endpoint: APIEndpoint<Input, Output>,
        _ input: Input,
        pathValues: [String: String] = [:]
    ) async throws -> Output {
        let encoded = try encodeInput(input, endpoint: endpoint)

        var path = endpoint.path
        var fields = endpoint.pathParams.isEmpty && endpoint.method != .get
            ? [:]
            : try Self.fields(from: encoded, endpoint: endpoint)

        for name in endpoint.pathParams {
            guard let raw = pathValues[name] ?? fields[name].flatMap(Self.pathString) else {
                throw APIError.network("Missing path parameter :\(name) for \(endpoint.path)")
            }
            fields.removeValue(forKey: name)
            let escaped = raw.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? raw
            path = path.replacingOccurrences(of: ":\(name)", with: escaped)
        }

        // The descriptor's path is absolute (`/auth/apple`); `requestData`
        // joins relative paths onto the base so the `/tapscore` prod prefix
        // survives, hence the leading slash comes off here.
        let relativePath = path.hasPrefix("/") ? String(path.dropFirst()) : path

        let data: Data
        if endpoint.method == .get {
            // A GET body would be dropped; the remaining fields are the query.
            let query = fields.compactMapValues(Self.pathString)
            data = try await requestData(
                path: relativePath,
                method: endpoint.method.rawValue,
                query: query.mapValues { Optional($0) }
            )
        } else if endpoint.pathParams.isEmpty {
            // Nothing was consumed, so the encoder's own bytes go out verbatim
            // — no JSON round-trip that could alter number formatting or drop
            // a key the generated `encode(to:)` deliberately emitted.
            data = try await requestData(
                path: relativePath,
                method: endpoint.method.rawValue,
                body: encoded
            )
        } else {
            data = try await requestData(
                path: relativePath,
                method: endpoint.method.rawValue,
                body: try JSONSerialization.data(withJSONObject: fields)
            )
        }

        do {
            return try decoder.decode(Output.self, from: data)
        } catch {
            throw APIError.decoding("\(Output.self): \(error)")
        }
    }

    /// Convenience for the descriptors whose `Input` is `EmptyInput`.
    func send<Output: Decodable & Sendable>(
        _ endpoint: APIEndpoint<EmptyInput, Output>
    ) async throws -> Output {
        try await send(endpoint, EmptyInput())
    }

    private func encodeInput<Input: Encodable & Sendable, Output: Decodable & Sendable>(
        _ input: Input,
        endpoint: APIEndpoint<Input, Output>
    ) throws -> Data {
        if input is EmptyInput { return Data("{}".utf8) }
        do {
            return try encoder.encode(input)
        } catch {
            throw APIError.decoding("encoding \(Input.self) for \(endpoint.path): \(error)")
        }
    }

    private static func fields<Input, Output>(
        from encoded: Data,
        endpoint: APIEndpoint<Input, Output>
    ) throws -> [String: Any] {
        guard let object = try? JSONSerialization.jsonObject(with: encoded) as? [String: Any] else {
            throw APIError.decoding("\(endpoint.path): input did not encode to a JSON object")
        }
        return object
    }

    /// Renders a JSON scalar for a path segment or query value. Objects and
    /// arrays have no defensible spelling in either position, so they are nil
    /// and surface as a missing-parameter error rather than as `"[object]"`.
    ///
    /// The bool test is a `CFBoolean` IDENTITY check, not `as? Bool`. Every
    /// scalar `JSONSerialization` produces is an `NSNumber`, and `NSNumber`
    /// bridges to `Bool` by VALUE — so `case let bool as Bool` matches the
    /// numbers `1` and `0` and would stringify a `:hole` of 1 as `"true"`.
    /// Only `kCFBooleanTrue`/`kCFBooleanFalse` carry the boolean type id, so
    /// this distinguishes a JSON `true` from a JSON `1`, which nothing about
    /// Swift's bridging does on its own.
    private static func pathString(_ value: Any) -> String? {
        if let string = value as? String { return string }
        if let number = value as? NSNumber {
            if CFGetTypeID(number) == CFBooleanGetTypeID() {
                return number.boolValue ? "true" : "false"
            }
            return number.stringValue
        }
        // Non-bridged `Bool` (a Swift value that never went through
        // JSONSerialization) still has to spell itself correctly.
        if let bool = value as? Bool { return bool ? "true" : "false" }
        return nil
    }
}
