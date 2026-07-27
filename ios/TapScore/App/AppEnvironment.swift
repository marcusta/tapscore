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

/// The one way linking Apple can fail that is not an HTTP status.
///
/// `POST /auth/apple` has no `requireAuth`, and the middleware treats an
/// expired or invalid bearer exactly like no bearer at all — so a stale session
/// plus "Connect Apple" does not 401. It takes the CREATE branch and mints a
/// brand-new player, which is precisely the fork this feature exists to
/// prevent. `created:true` on the link path therefore means the link FAILED,
/// and this is what that failure is called.
enum AppleLinkError: Error, Equatable, Sendable {
    /// The server did not recognise the session we sent, so it created a player
    /// instead of linking. The freshly issued token is revoked and never
    /// adopted; the user has to sign in again first.
    case sessionNotRecognised
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

    /// This device's recent-rounds list — **one shared instance**, deliberately.
    ///
    /// Two writers need it and they are on opposite sides of the shell/feature
    /// boundary: the shell records a sighting the moment it pushes the round
    /// screen (`RootView.open(round:)`), and `RoundStore` enriches that row once
    /// `byToken` has resolved the course name and status, and again whenever the
    /// status moves under it. `DeviceRoundsStore` is a thin façade over
    /// `UserDefaults`, so two instances would not *corrupt* anything — they
    /// would read the same key — but the instance is the natural place for a
    /// cache or an in-memory list to grow later, and two of those silently
    /// disagree. Owning it here keeps that impossible and keeps the injection
    /// point for tests in one place.
    let deviceRounds: DeviceRoundsStore

    // MARK: Observable state

    private(set) var authState: AuthState = .unknown

    /// Route captured from a cold-start deep link before any screen was ready
    /// to consume it, plus warm-launch links. The root view observes this.
    private(set) var pendingRoute: DeepLinkRoute?

    /// Raised when `/auth/apple` reports it CREATED a player rather than
    /// recognising one — the fork guard (N5).
    ///
    /// The failure it exists for is silent and expensive: a human who already
    /// has a web account taps Sign in with Apple, the server has never seen
    /// that Apple `sub`, and they end up on a brand-new, empty player row while
    /// their rounds and friends sit on the old one. Nothing about the resulting
    /// screen looks wrong. So the one moment the client can tell — `created` on
    /// the response — is the moment it says so.
    ///
    /// Advisory, never a gate: the notice renders beside the app, not in front
    /// of it, and scoring continues regardless.
    private(set) var showsNewAccountNotice = false

    /// Set when THIS session knows Apple is attached to the player it is signed
    /// in as — either because it just linked it, or because it signed IN with
    /// it — so the "Connect Sign in with Apple" affordance can stop offering
    /// what has already happened.
    ///
    /// Deliberately NOT persisted and deliberately not treated as knowledge:
    /// the client cannot see which credentials a player row holds — `/auth/me`
    /// returns a `Player`, which carries none — so this is a record of what
    /// this run of the app just did, nothing more. It resets on launch and on
    /// sign-out, and the server remains the only truth. Faking persistence
    /// here would mean hiding the affordance from someone whose link never
    /// actually landed.
    private(set) var appleLinkedThisSession = false

    // MARK: Init

    /// Designated initializer. Everything is injectable so tests can build an
    /// environment without touching the real Keychain service or network.
    init(
        configuration: APIConfiguration = .resolved(),
        keychain: Keychain = Keychain(),
        session: URLSession = .shared,
        deviceRounds: DeviceRoundsStore = DeviceRoundsStore()
    ) {
        self.configuration = configuration
        self.keychain = keychain
        self.scenePhase = ScenePhaseCoordinator()
        self.deviceRounds = deviceRounds

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
        let user = try await adoptSession(user: result.user, token: result.token)
        // The fork guard. `created` is the server's own answer to "was this
        // Apple id new to us?", and it is the only signal that distinguishes a
        // genuine first-time user from a returning web user who just forked
        // themselves a second account.
        if result.created { showsNewAccountNotice = true }
        // Whatever the branch, this session just proved Apple is attached to
        // the row we are now signed in as — offering "Connect Sign in with
        // Apple" to someone who arrived THROUGH it would be nonsense.
        appleLinkedThisSession = true
        return user
    }

    /// Signs in with the username and password the player already uses on the
    /// web (`POST /auth/native/login`), and adopts the bearer session it
    /// returns.
    ///
    /// THIS IS THE OTHER HALF OF THE FORK GUARD, not a second front door for
    /// its own sake. Sign in with Apple alone can only ever say "I have never
    /// seen this Apple id" and create a player; it cannot know that the human
    /// behind it already has a web account. The password door is what lets that
    /// human arrive AS themself — after which `linkApple` attaches Apple to the
    /// row they already are, and every later launch is one tap again.
    ///
    /// Failures are `APIError`s and stay that way: `.unauthorized` for bad
    /// credentials, `.server(429, …)` when the login limiter trips. The
    /// user-facing wording lives in `SignInCopy`, so the two doors cannot drift
    /// apart in tone.
    @discardableResult
    func signInWithPassword(username: String, password: String) async throws -> Player {
        let result = try await api.send(
            AuthNativeEndpoints.nativeLogin,
            AuthNativeNativeLoginInput(username: username, password: password)
        )
        // The login answers with the framework's `AuthUser` — id and username,
        // a CREDENTIAL answer — but `.signedIn` carries a `Player`, and a
        // display name invented from the username would be a lie shown on
        // every screen. So the profile is fetched with the new token, and
        // fetched BEFORE it is stored, which keeps the Keychain write the last
        // thing that can fail.
        let player: Player
        do {
            player = try await api.me(bearer: result.token)
        } catch {
            // Same reasoning as a failed Keychain write: a session was just
            // issued and this device is about to forget it. Best effort, and
            // it must not mask the error that got us here.
            await api.revokeOrphanedToken(result.token)
            throw error
        }
        return try await adoptSession(user: player, token: result.token)
    }

    /// Attaches an Apple credential to the player this device is ALREADY
    /// signed in as (`POST /auth/apple` **with** the bearer token).
    ///
    /// Same endpoint as sign-in, different branch: the server reads the session
    /// opportunistically and links rather than creating. It cannot switch
    /// accounts — an Apple `sub` owned by someone else is a 409
    /// (`apple_subject_taken`), never a silent hop to the other player.
    ///
    /// The response carries a freshly issued bearer, which we adopt: it is the
    /// token this device should be using from here on, and dropping it on the
    /// floor would leave an unrevokable session behind. The bearer it replaces
    /// is revoked once the new one is safely stored — the old session is still
    /// live otherwise, and this device is the last thing holding its token.
    ///
    /// **`created:true` here means the link FAILED.** The endpoint has no
    /// `requireAuth`, and the middleware cannot tell an expired bearer from no
    /// bearer, so a stale session does not 401 — it falls into the create
    /// branch and mints a second player. Adopting that would be the app itself
    /// performing the fork it exists to warn about, while the UI celebrates a
    /// link. So the new token is revoked, nothing is adopted, the existing
    /// (probably dead) session state is left to the normal 401 handling, and
    /// `AppleLinkError.sessionNotRecognised` is thrown.
    func linkApple(identityToken: String, rawNonce: String?) async throws {
        let input = AuthNativeAppleSignInInput(
            // No `fullName`: this player is already named, and the server
            // ignores the field outside the create branch anyway.
            fullName: .absent,
            nonce: rawNonce,
            identityToken: identityToken
        )
        // Read BEFORE the exchange: `adoptSession` overwrites the Keychain slot,
        // and after that the only copy of the outgoing token is gone.
        let previousToken = keychain.loadToken()

        let result = try await api.send(AuthNativeEndpoints.appleSignIn, input)

        guard !result.created else {
            // Best effort, and it must not mask the failure: the player row is
            // already created server-side (nothing here can undo that), but the
            // session it came with is ours to not leave lying around.
            await api.revokeOrphanedToken(result.token)
            throw AppleLinkError.sessionNotRecognised
        }

        try await adoptSession(user: result.user, token: result.token)
        appleLinkedThisSession = true

        // Only now, with the replacement safely stored. Best effort: a failure
        // here costs a session that expires on its own, and the link succeeded.
        if let previousToken, previousToken != result.token {
            await api.revokeOrphanedToken(previousToken)
        }
    }

    /// Dismisses the fork notice. One-time by construction — nothing sets the
    /// flag again until another `created:true` response arrives.
    func dismissNewAccountNotice() { showsNewAccountNotice = false }

    /// Stores a freshly issued bearer and flips the session state — the single
    /// tail shared by every door (Apple, password, link).
    ///
    /// Order matters and is asserted by the tests: the token is written to the
    /// Keychain BEFORE `authState` flips, so any view that reacts to
    /// `.signedIn` and immediately makes a request finds a bearer to send.
    ///
    /// A token we cannot store is a sign-in that would evaporate on the next
    /// launch (and on the next request, since the bearer is read from the
    /// Keychain every time), so it fails here rather than pretending.
    ///
    /// The server has already issued a live session, though, and we are about
    /// to drop the only copy of its token — leaving a session nobody can ever
    /// revoke, valid until it expires. So revoke it here, while the value is
    /// still in hand. Best effort by design: its outcome cannot change this
    /// failure, and must not mask it.
    ///
    /// This is why it is one function and not three copies: the revoke is easy
    /// to forget, and a door that forgets it leaks a live session per failure.
    @discardableResult
    private func adoptSession(user: Player, token: String) async throws -> Player {
        guard keychain.saveToken(token) else {
            await api.revokeOrphanedToken(token)
            throw APIError.network("Could not store the session token in the Keychain.")
        }
        authState = .signedIn(user)
        return user
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
            // Both flags describe the session that is ending: the notice was
            // about the account just left, and the link flag is a record of
            // what this session did, not a fact about any player row.
            showsNewAccountNotice = false
            appleLinkedThisSession = false
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
