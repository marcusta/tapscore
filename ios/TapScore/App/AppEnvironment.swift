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

    /// Drops the bearer token and returns to the anonymous (share-link) state.
    ///
    /// TODO(N4): also call `POST /api/auth/revoke` so the server-side token
    /// dies with it — the route exists; the generated client call does not yet.
    func signOut() {
        keychain.clear()
        authState = .anonymous
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
