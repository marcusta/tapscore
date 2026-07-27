import Foundation

/// Which half of the round screen is on show. Mirrors the web `Tab` union in
/// `src/round/poll-gate.ts`.
enum RoundTab: String, CaseIterable, Identifiable, Sendable {
    case score
    case leaderboard

    var id: Self { self }

    var title: String {
        switch self {
        case .score: "Score"
        case .leaderboard: "Leaderboard"
        }
    }
}

/// The live-gate predicate — the Swift image of `shouldPoll` in
/// `src/round/poll-gate.ts`, pure so the "should anything be streaming right
/// now" decision is unit-testable without a timer, a scene, or a view.
///
/// Score entry is optimistic-local and never polls; only the leaderboard tab
/// benefits from picking up another device's scores while this one sits idle.
/// `not_started` still polls — a self-join or another device's first score can
/// flip status/leaderboard contents before this client has entered anything.
///
/// The web input is `pageVisible` (`!document.hidden`); the native input is the
/// `ScenePhaseCoordinator`'s active phase. Same meaning: is this screen in
/// front of a user right now.
struct PollGateInput: Sendable, Equatable {
    var tab: RoundTab
    var sceneActive: Bool
    var status: AdminRoundSummaryStatus?
}

func shouldPoll(_ input: PollGateInput) -> Bool {
    if input.tab != .leaderboard { return false }
    if !input.sceneActive { return false }
    if input.status == .complete { return false }
    return true
}
