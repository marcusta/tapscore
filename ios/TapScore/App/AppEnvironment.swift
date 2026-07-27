import Foundation
import Observation

/// Authentication state for the native client.
///
/// Note the asymmetry with the web client: tapscore is *no-login by design* on
/// the share-link path (a friend scores a round from a token alone), so
/// `.anonymous` is a fully functional state, not a wall. Signing in with Apple
/// buys identity across devices and a round history — it is never a
/// precondition for scoring.
enum AuthState: Equatable, Sendable {
    /// Bootstrap has not resolved yet.
    case unknown
    /// No bearer token, or the stored one was rejected. Share links still work.
    case anonymous
    /// A bearer token resolved to a player (the generated `Player` model).
    case signedIn(Player)
    /// The server could not be reached. Distinct from `.anonymous` so the UI
    /// can offer a retry instead of a sign-in button.
    case unreachable(String)
}

/// App-wide dependency container, injected via `.environment(_:)` from
/// `TapScoreApp`.
///
/// Mirrors `../golf-map/ios/GolfMap/App/AppEnvironment.swift`: a `@MainActor`
/// `@Observable` class that owns the shared singletons and the observable auth
/// state the root view switches on. Screens take dependencies from here rather
/// than constructing their own clients, so there is exactly one place that
/// knows the base URL and exactly one place that holds the token.
@MainActor
@Observable
final class AppEnvironment {
    // MARK: Dependencies

    let configuration: APIConfiguration
    let api: TapScoreAPI
    let keychain: Keychain
    let scenePhase: ScenePhaseCoordinator

    // MARK: Observable state

    private(set) var authState: AuthState = .unknown

    /// Route captured from a cold-start deep link before any screen was ready
    /// to consume it, plus warm-launch links. The root view observes this.
    private(set) var pendingRoute: DeepLinkRoute?

    // MARK: Init

    /// Designated initializer. Everything is injectable so tests can build an
    /// environment without touching the real Keychain service or network.
    init(
        configuration: APIConfiguration = .resolved(),
        keychain: Keychain = Keychain(),
        session: URLSession = .shared
    ) {
        self.configuration = configuration
        self.keychain = keychain
        self.scenePhase = ScenePhaseCoordinator()

        // The API actor reads the token through a closure rather than holding a
        // copy, so a logout or a token refresh takes effect on the next request
        // with no re-wiring.
        let kc = keychain
        self.api = TapScoreAPI(
            configuration: configuration,
            session: session,
            tokenProvider: { kc.loadToken() }
        )
    }

    /// Production environment.
    static func live() -> AppEnvironment { AppEnvironment() }

    // MARK: - Bootstrap

    /// Resolves the initial auth state with the `/auth/me` probe.
    ///
    /// - No stored token → `.anonymous` without a network round-trip.
    /// - 401 → the token is stale; wipe it so the next launch is fast.
    /// - Transport failure → `.unreachable`, keeping the token (the server
    ///   being down says nothing about the token's validity).
    func bootstrap() async {
        guard keychain.loadToken() != nil else {
            authState = .anonymous
            return
        }
        do {
            authState = .signedIn(try await api.me())
        } catch APIError.unauthorized {
            keychain.clear()
            authState = .anonymous
        } catch {
            authState = .unreachable(error.localizedDescription)
        }
    }

    /// Re-runs `bootstrap()` — the retry affordance on the landing screen.
    func retry() async { await bootstrap() }

    // MARK: - Sign in / out

    /// Exchanges an Apple identity token for a bearer session (N4).
    ///
    /// Order matters and is asserted by the tests: the token is written to the
    /// Keychain BEFORE `authState` flips, so any view that reacts to
    /// `.signedIn` and immediately makes a request finds a bearer to send.
    ///
    /// - Parameters:
    ///   - identityToken: `ASAuthorizationAppleIDCredential.identityToken`, as
    ///     UTF-8 text.
    ///   - rawNonce: the PRE-IMAGE of the nonce the authorization request
    ///     carried (`AppleSignInNonce.raw`). The server hashes it and requires
    ///     it to match the token's `nonce` claim, which is what makes a
    ///     captured token useless to anyone else. Nil only for a request that
    ///     used no nonce at all — a nonce-bearing token posted without it is
    ///     rejected with `apple_nonce_required`.
    ///   - fullName: forwarded from the FIRST authorization only; Apple never
    ///     sends it again. Advisory — the server applies it to a new player and
    ///     ignores it for a known Apple subject.
    @discardableResult
    func signIn(
        identityToken: String,
        rawNonce: String?,
        fullName: String? = nil
    ) async throws -> Player {
        let input = AuthNativeAppleSignInInput(
            fullName: fullName.map { .value($0) } ?? .absent,
            nonce: rawNonce,
            identityToken: identityToken
        )
        let result = try await api.send(AuthNativeEndpoints.appleSignIn, input)

        // A token we cannot store is a sign-in that would evaporate on the next
        // launch (and on the next request, since the bearer is read from the
        // Keychain every time), so it fails here rather than pretending.
        //
        // The server has already issued a live session, though, and we are
        // about to drop the only copy of its token — leaving a session nobody
        // can ever revoke, valid until it expires. So revoke it here, while the
        // value is still in hand. Best effort by design: its outcome cannot
        // change this failure, and must not mask it.
        guard keychain.saveToken(result.token) else {
            await api.revokeOrphanedToken(result.token)
            throw APIError.network("Could not store the session token in the Keychain.")
        }
        authState = .signedIn(result.user)
        return result.user
    }

    /// Ends the session: revoke server-side, then wipe locally.
    ///
    /// The wipe is UNCONDITIONAL — in a `defer`, so it happens even if the
    /// revoke call throws. A 401 from `/auth/revoke` means the token was
    /// already dead, which is precisely the state sign-out wants; treating that
    /// as a failure would strand the user in a signed-in UI holding a token
    /// nothing accepts. Same for a network failure: the local credential goes
    /// regardless, and the server-side token expires on its own.
    ///
    /// Revoke goes FIRST because it needs the bearer the Keychain still holds.
    func signOut() async {
        defer {
            keychain.clear()
            authState = .anonymous
        }
        _ = try? await api.send(AuthNativeEndpoints.revoke)
    }

    // MARK: - Deep links

    /// Records an inbound URL as a pending route. Unrecognized URLs are
    /// ignored (never surfaced as an error — a stray link is not a failure).
    func handle(url: URL) {
        guard let route = DeepLinkRouter.route(for: url) else { return }
        pendingRoute = route
    }

    /// Consumes the pending route so it is not re-applied on the next render.
    func consumePendingRoute() -> DeepLinkRoute? {
        defer { pendingRoute = nil }
        return pendingRoute
    }
}
