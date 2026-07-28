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
/// `src/round/poll-gate.ts`, pure so the "should this round view be receiving
/// updates right now" decision is unit-testable without a timer, a scene, or a
/// view. It gates BOTH the SSE stream and its fallback poll.
///
/// **AMENDS THE PHASE 3.5 DECISION (2026-07-28).** That decision opened the gate
/// only on the LEADERBOARD tab, on the theory that score entry is
/// optimistic-local and needs nothing from the server. The owner's field report
/// killed it: the score view shows the WHOLE GROUP's scores, so a playing
/// partner scoring on their own phone has to appear there — and on the course
/// that is the view a player actually sits on. The tab is therefore no longer an
/// input at all; the round view being on screen is enough. Cost is one open
/// stream per round view instead of per leaderboard visit, and the stream is
/// idle-cheap (a 25s heartbeat) while the same visibility and completion
/// conditions still shut it down.
///
/// "On screen" is structural on both clients rather than a field here: the web
/// runs this predicate from the round component's effect, and `RoundStore` runs
/// it only between `start()`/`resumeIfNeeded()` and `stop()`.
///
/// `not_started` still polls — a self-join or another device's first score can
/// flip status/leaderboard contents before this client has entered anything.
///
/// The web input is `pageVisible` (`!document.hidden`); the native input is the
/// `ScenePhaseCoordinator`'s active phase. Same meaning: is this screen in
/// front of a user right now.
struct PollGateInput: Sendable, Equatable {
    var sceneActive: Bool
    var status: AdminRoundSummaryStatus?
}

func shouldPoll(_ input: PollGateInput) -> Bool {
    if !input.sceneActive { return false }
    if input.status == .complete { return false }
    return true
}
