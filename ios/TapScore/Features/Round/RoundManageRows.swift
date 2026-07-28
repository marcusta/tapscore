import Foundation

/// Which rows the round-manage sheet offers, given what the round screen knows.
///
/// The same idiom as `AccountSheetRows`: the visibility RULES are the part worth
/// testing, and a SwiftUI body is not where a rule can be asserted. Rows are
/// **absent, not disabled** — a greyed-out "Remove me from this round" on a
/// round you are not in answers a question nobody asked.
///
/// The web client is the behaviour reference (`src/round/leave.ts`,
/// `round-manage` cards):
///
/// - **Edit** needs a POSITIVE answer from the `setup` probe. A probe that
///   failed, never ran, or came back `editable:false` all read the same way —
///   no row — because the client cannot tell a round it may edit from one it may
///   not, and offering the wrong one is worse than offering neither.
/// - **Leave** needs a signed-in viewer who is actually a producer on some ball.
///   There is deliberately **no status gate**: leaving mid-round is supported,
///   and the server deletes only the leaver's own scores.
/// - **Finish** and **Delete** are unconditional once the round has loaded. Both
///   endpoints are token-trust with no owner or status gate, so a client-side
///   gate here would be theatre that disagrees with the server.
struct RoundManageRows: Equatable {
    /// The editability probe returned `editable: true`.
    var showsEdit: Bool
    /// Signed in, and the viewer is a producer on at least one ball.
    var showsLeave: Bool
    /// Round loaded (always true once loaded).
    var showsFinish: Bool
    /// Round loaded (always true once loaded).
    var showsDelete: Bool
    /// `"Reopen round"` iff the round is complete, else `"Finish round"`.
    var finishLabel: String

    /// - Parameters:
    ///   - status: the loaded round's status, or nil while nothing is loaded.
    ///     Nil is what makes every row absent — the sheet cannot act on a round
    ///     it does not have.
    ///   - editability: the `GET /friendly-rounds/setup` probe result, or nil
    ///     when it failed or has not answered. Both mean "no edit row".
    ///   - viewerPlayerId: the signed-in player's id, or nil when anonymous.
    ///   - balls: the loaded balls payload, whose producers carry `playerId`.
    init(
        status: AdminRoundSummaryStatus?,
        editability: FriendlyRoundsSetupOutput? = nil,
        viewerPlayerId: String? = nil,
        balls: [RoundBall] = []
    ) {
        guard let status else {
            self.showsEdit = false
            self.showsLeave = false
            self.showsFinish = false
            self.showsDelete = false
            self.finishLabel = "Finish round"
            return
        }
        if case .editable = editability {
            self.showsEdit = true
        } else {
            self.showsEdit = false
        }
        self.showsLeave = Self.isProducer(viewerPlayerId, in: balls)
        self.showsFinish = true
        self.showsDelete = true
        self.finishLabel = status == .complete ? "Reopen round" : "Finish round"
    }

    /// The web's `canShowLeaveCard` test: the viewer's player id appears as a
    /// producer id on some ball. A guest producer (`guestPlayerId`) is somebody
    /// else's entry even when the names match, so only `playerId` counts.
    private static func isProducer(_ playerId: String?, in balls: [RoundBall]) -> Bool {
        guard let playerId else { return false }
        return balls.contains { ball in
            ball.players.contains { $0.playerId == playerId }
        }
    }

    /// The viewer id the leave rule wants, read off the app's auth state.
    /// Anonymous, unknown and unreachable are all "no signed-in player".
    static func viewerPlayerId(_ authState: AuthState) -> String? {
        if case let .signedIn(player) = authState { return player.id }
        return nil
    }
}
