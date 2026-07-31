import Foundation

/// The signed-in app's root-level destinations.
///
/// Home and Friends are the two dock items. Profile is reached from the
/// account menu and intentionally leaves both dock items inactive, matching
/// the web shell.
enum ShellSection: Hashable, Sendable {
    case home
    case friends
    case profile
}

/// A push target on the root stack.
enum ShellDestination: Hashable, Sendable {
    /// The paste-a-link screen.
    case join
    /// The round screen. `token` is the share token — the round's write
    /// credential, so it is never logged or put in an analytics event.
    case round(token: String)
    /// The read-only spectate screen for a friend's round.
    ///
    /// Addressed by round ID, never by token — the whole point of the spectate
    /// path is that the viewer is authorized by their SESSION (participation,
    /// round visibility, a mutual friend edge) and never holds the round's
    /// write credential. A `.spectate` route can therefore never be turned
    /// into a `.round` one.
    ///
    /// `friendName` is who the viewer thinks they are watching, carried from
    /// the surface they tapped so the header can state the relationship
    /// ("Watching · Anna's round at Linköping"). It is presentation only: the
    /// spectate payload lists a round's balls, not which of its players is a
    /// friend of the caller, and the screen degrades to "Watching this round"
    /// without it rather than guessing.
    case spectate(roundId: String, friendName: String?)
}

/// The navigation stack as a **value**, with the routing rules as pure
/// mutations on it.
///
/// The rules are small but they are the ones the N4 cold-tap gate depends on
/// (a share link must reach score entry from any state, in any auth state), and
/// a SwiftUI `View` body is not a place they can be tested. So the decisions
/// live here — `RootView` owns one of these in `@State`, binds the stack
/// straight into `NavigationStack(path:)` and does nothing else with it.
struct ShellNavigation: Equatable, Sendable {
    /// The pushed destinations, root-first. Settable because `NavigationStack`
    /// binds it directly (a back-swipe pops it); prefer the mutators below for
    /// anything the app itself initiates.
    var stack: [ShellDestination] = []

    init(stack: [ShellDestination] = []) {
        self.stack = stack
    }

    /// The destination currently on screen, or nil at the landing.
    var top: ShellDestination? { stack.last }

    /// The round currently on screen, if any.
    var openRoundToken: String? {
        if case let .round(token)? = top { return token }
        return nil
    }

    /// Pushes the round screen for `token`.
    ///
    /// - Returns: true when the stack changed. Re-opening the round already on
    ///   top is a no-op — otherwise a second tap on the same universal link (or
    ///   a foreground redelivery of the same URL) would stack two identical
    ///   round screens and the back button would appear broken.
    @discardableResult
    mutating func openRound(token: String) -> Bool {
        guard openRoundToken != token else { return false }
        stack.append(.round(token: token))
        return true
    }

    /// Pushes the spectate screen for `roundId`, unless it is already on top.
    @discardableResult
    mutating func openSpectate(roundId: String, friendName: String? = nil) -> Bool {
        if case let .spectate(openId, _)? = top, openId == roundId { return false }
        stack.append(.spectate(roundId: roundId, friendName: friendName))
        return true
    }

    /// Pushes the join screen, unless it is already on top.
    @discardableResult
    mutating func openJoin() -> Bool {
        guard top != .join else { return false }
        stack.append(.join)
        return true
    }

    /// Returns to the landing.
    mutating func popToRoot() {
        stack.removeAll()
    }

    /// Applies an inbound deep-link route.
    ///
    /// - `.round` pushes from **any** state — signed in, signed out, mid-join,
    ///   or already inside another round. Share-link scoring never waits on
    ///   auth, so nothing here consults `AuthState`.
    /// - `.roundList` pops back to the landing (the bare-domain link, and the
    ///   round link that lost its token).
    ///
    /// - Returns: the token when a round screen was newly pushed, so the caller
    ///   can record the sighting in `DeviceRoundsStore`. Nil when the route
    ///   pushed nothing new.
    @discardableResult
    mutating func apply(_ route: DeepLinkRoute) -> String? {
        switch route {
        case let .round(token):
            return openRound(token: token) ? token : nil
        case .roundList:
            popToRoot()
            return nil
        }
    }
}
