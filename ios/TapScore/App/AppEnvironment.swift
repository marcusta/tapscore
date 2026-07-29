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

/// What this session managed to learn about the credential rows behind the
/// signed-in player — and, just as load-bearing, when it learned nothing.
///
/// The two cases are NOT "has apple" / "does not have apple". They are "the
/// server answered" and "we do not know", and the difference decides whether an
/// offer is allowed to exist at all. Before `GET /auth/credentials` the client
/// could not see a player's credentials, so "Connect Sign in with Apple" was
/// offered to everyone and muted with a preference. With an answer available,
/// an offer shown on a hunch is worse than no offer: connecting Apple to a row
/// that already holds it is at best a no-op the user was told to perform, and
/// the interesting failures around it (409 `apple_subject_taken`) look like
/// bugs. So the probe fails CLOSED — every error, every 401, every decode
/// mismatch lands on `.unknown`, and `.unknown` offers nothing.
enum CredentialProbe: Equatable, Sendable {
    /// Not asked yet, or the ask failed. Never a claim about the player.
    case unknown
    /// The providers the server says this player holds (`"apple"`,
    /// `"password"`, …), verbatim from the wire.
    case known(Set<String>)

    /// Whether the player holds `provider`, or nil when we do not know.
    /// Tri-state on purpose: an `if !holds("apple")` written against a Bool
    /// would turn every failed probe into a false offer.
    func holds(_ provider: String) -> Bool? {
        switch self {
        case .unknown: nil
        case let .known(providers): providers.contains(provider)
        }
    }

    /// True only when the probe SUCCEEDED and `apple` was absent.
    var offersAppleLink: Bool { holds("apple") == false }
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
    /// the client cannot see which credentials a player row holds — `/players/me`
    /// returns a `Player`, which carries none — so this is a record of what
    /// this run of the app just did, nothing more. It resets on launch and on
    /// sign-out, and the server remains the only truth. Faking persistence
    /// here would mean hiding the affordance from someone whose link never
    /// actually landed.
    private(set) var appleLinkedThisSession = false

    /// Whether the signed-in player holds the `super_admin` grant, as far as
    /// THIS session was able to find out.
    ///
    /// It gates one thing: whether the Server settings row exists at all. That
    /// is a **footgun-hider, not a security boundary** — any debug build
    /// accepts `-apiBaseURL` from the launch arguments, and the row would only
    /// ever change where this device points itself. `AdminAuthz` on the server
    /// is the real gate for everything privileged. So the failure direction is
    /// chosen accordingly: unknown means false, and false means the row is
    /// simply absent.
    private(set) var isSuperAdmin = false

    /// One probe per session. `/me/roles` answers a question that cannot change
    /// while the app is open (a grant issued mid-round is not a case worth a
    /// polling loop), and re-asking after a failure is how a 403 becomes a
    /// retry storm — every appearance of the account inset firing another
    /// request that will fail exactly the same way.
    private var didProbeRoles = false

    /// What `GET /auth/credentials` said this player's credential rows are.
    ///
    /// The counterpart to `appleLinkedThisSession`, and the reason that flag's
    /// doc comment no longer describes the whole story: the client CAN now ask
    /// which providers a player holds. What it still cannot do is assume. This
    /// starts `.unknown`, becomes `.known(…)` only on a successful answer, and
    /// goes back to `.unknown` on sign-out.
    ///
    /// `appleLinkedThisSession` stays on top of it as an immediate-suppression
    /// overlay: a link that lands mid-session makes the cached probe stale
    /// instantly, and re-fetching to learn what we just did ourselves would be
    /// a request whose answer we already have.
    private(set) var credentials: CredentialProbe = .unknown

    /// One SUCCESSFUL probe per session — and the "successful" is the whole
    /// point, which is where this differs from `didProbeRoles`.
    ///
    /// A role probe that fails means "not an admin", which is the same answer a
    /// successful one usually gives; latching a failure there costs nothing. A
    /// credential probe that fails means "we do not know", and `.unknown` HIDES
    /// the connect offer. Latching before the request therefore turned one
    /// unlucky moment — the sheet opened on a dead network, the token racing a
    /// refresh — into a whole session with no way to connect Apple, silently
    /// and with nothing on screen to suggest a retry.
    ///
    /// So the latch is set only once `credentials` actually became `.known`.
    /// A failure leaves it clear, and the next call re-arms.
    private var didProbeCredentials = false

    /// At most one credential probe in flight. The re-arming above is what
    /// makes this necessary: two overlapping `.task`s (the button's and the
    /// sheet's) would otherwise both see a clear latch and both fire.
    private var isProbingCredentials = false

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

    /// Resolves the initial auth state with the `/players/me` probe.
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
            identityToken: identityToken,
            fullName: fullName.map { .value($0) } ?? .absent,
            nonce: rawNonce
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
            identityToken: identityToken,
            // No `fullName`: this player is already named, and the server
            // ignores the field outside the create branch anyway.
            fullName: .absent,
            nonce: rawNonce
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

    /// Replaces the `Player` the current session carries, after the profile
    /// screen saved a new one.
    ///
    /// **This is not an auth change, and the distinction is load-bearing.** The
    /// same human is still signed in; only their gender / home club / handicap
    /// moved. `LandingLoader.key(_:)` identifies an auth state by the player's
    /// ID for exactly this reason (see its doc comment) — so a profile edit
    /// re-publishes `authState` without re-fetching the dashboard.
    ///
    /// A no-op unless a player is signed in: there is no state in which
    /// `.anonymous` should acquire one from a profile save, and a save can only
    /// have come from a session that had one.
    func apply(profile: Player) {
        guard case .signedIn = authState else { return }
        authState = .signedIn(profile)
    }

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
            // The grant belonged to the player who just left. Clearing the
            // "already asked" flag too is what lets the NEXT sign-in — possibly
            // a different human on the same device — be answered on its own
            // merits instead of inheriting this one's.
            isSuperAdmin = false
            didProbeRoles = false
            // Same argument for the credential answer: it described the player
            // who just left, and leaving it cached would let the next sign-in
            // inherit a stranger's providers — which, for the one thing this
            // drives, means silently withholding the connect offer from someone
            // who needs it (or offering it to someone who does not).
            credentials = .unknown
            didProbeCredentials = false
            isProbingCredentials = false
        }
        _ = try? await api.send(AuthNativeEndpoints.revoke)
    }

    // MARK: - Account probes

    /// The two once-per-session questions the account control needs answered,
    /// asked together because they are asked for the same reason and by the
    /// same view (`AccountAvatarButton.task`).
    ///
    /// Sequential rather than concurrent, deliberately: both are cheap, neither
    /// blocks anything on screen (each row appears when its answer arrives),
    /// and a task group here would buy nothing but two ways for a failure to
    /// interleave.
    func probeAccountIfNeeded() async {
        await probeRolesIfNeeded()
        await probeCredentialsIfNeeded()
    }

    /// Asks the server which credential providers the signed-in player holds,
    /// once per session (`GET /auth/credentials`).
    ///
    /// **Fails closed, and that is the whole design.** Every failure — 401, a
    /// server that is down, a body that does not decode — leaves `credentials`
    /// on `.unknown`, and `.unknown` shows no connect offer. The alternative
    /// (assume unlinked, offer anyway) is the pre-probe behaviour, and it is
    /// the one this replaces: an offer that cannot be true is worse than none.
    ///
    /// Anonymous never asks. The endpoint is about the bearer's own player, and
    /// a request guaranteed to 401 is not worth making.
    ///
    /// **Fails closed but does not STAY closed.** The latch is set after the
    /// answer, not before the request, so a failed probe leaves this re-armed
    /// and the next caller tries again. That is not a retry loop: nothing here
    /// retries itself, the in-flight flag admits one request at a time, and the
    /// only things that call it are the account button's `.task` and each
    /// presentation of the account sheet — so the ceiling is one attempt per
    /// time the user goes looking for the offer, which is exactly when a stale
    /// `.unknown` is worth spending a request to clear.
    func probeCredentialsIfNeeded() async {
        guard !didProbeCredentials, !isProbingCredentials, case .signedIn = authState else { return }
        isProbingCredentials = true
        defer { isProbingCredentials = false }
        // No `didProbeCredentials = true` here, deliberately — see above.
        guard let result = try? await api.send(AuthNativeEndpoints.credentials) else { return }
        // Flattened to raw strings on the way in. The generated element type is
        // a closed enum, so a provider this build has never heard of makes the
        // whole response fail to decode — which lands on `.unknown` and shows
        // no offer, the same direction as every other failure here. Keeping the
        // stored form a plain string set is what keeps `CredentialProbe` (and
        // the rows built from it) independent of the generator's spelling.
        credentials = .known(Set(result.providers.map(\.rawValue)))
        didProbeCredentials = true
    }

    /// Asks the server which role grants the bearer holds, once per session.
    ///
    /// Driven by the signed-in account UI (`AccountAvatarButton.task`) rather than
    /// bolted onto `bootstrap()` / `adoptSession(…)`: this is a question only
    /// the account area has any use for, and hanging it off the auth path would
    /// put a second request inside every sign-in — including the ones that are
    /// failing, where the last thing anyone needs is another call.
    ///
    /// **Every failure is silence.** 401 (session died), 403 (not an admin —
    /// the ordinary case for almost everyone), a decode mismatch, an unreachable
    /// server: all of them mean `isSuperAdmin` stays false and nothing is shown
    /// to the user. There is no error to surface, because there is no request
    /// the user made. `didProbeRoles` is set REGARDLESS, so a failure is not
    /// retried.
    ///
    /// **The predicate is `role == super_admin` AND `scopeType == nil`**, which
    /// is `src/admin/admin.service.ts`'s `isSuperAdmin` character for character
    /// (`g.role === 'super_admin' && g.scopeType === null`) and what
    /// `server/api/admin-authz.ts` enforces per request. `super_admin` is
    /// unscoped by construction, so a scoped row carrying that role should not
    /// exist — but "should not exist" is not a gate. Matching on the role alone
    /// would let a future scoped grant (or a hand-written DB row) light up an
    /// entry point the server then refuses, which is the one failure mode this
    /// screen must not have: an Admin row that leads to a 403.
    func probeRolesIfNeeded() async {
        guard !didProbeRoles, case .signedIn = authState else { return }
        didProbeRoles = true
        guard let grants = try? await api.send(AdminEndpoints.myRoles) else { return }
        isSuperAdmin = grants.contains { $0.role == .superAdmin && $0.scopeType == nil }
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
