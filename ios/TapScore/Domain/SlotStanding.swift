import Foundation

/// A ball's standing under one format slot, for the score row's loud figure —
/// the Swift image of `slotStandingFor` in the web `round.service.ts`. Three
/// shapes:
///
///   - `pace`  — the primary ranked metric's pace delta, sign-normalised to
///     golf convention (negative = under/ahead). Stroke play: gross vs par.
///     Stableford: points vs 2-per-hole.
///   - `total` — a paceless ranked metric (köpenhamnare/umbrella points,
///     which are field-relative): the plain total.
///   - `match` — match formats have no ranked section; the ball's side of its
///     panel reads `2 UP` / `2 DN` / `AS`.
///
/// `nil` = nothing to say (ball not in the slot, nothing scored yet) — the
/// caller falls back to the local gross-to-par.
enum SlotStanding: Equatable, Sendable {
    case pace(Int)
    case total(Double)
    /// `up` is nil when all square.
    case match(text: String, up: Bool?)
}

/// The join, kept pure for tests. The first section that covers the ball wins:
/// `leaderboard` is ordered with the primary metric first (the same convention
/// the boards rely on).
func slotStanding(forBallId ballId: String, in view: SlotResultView) -> SlotStanding? {
    // ADR-0004 aggregated sides publish a VIRTUAL subject id; the
    // subjectLabels bridge maps it back to member balls.
    func covers(_ ids: [String]) -> Bool {
        if ids.contains(ballId) { return true }
        guard let labels = view.subjectLabels else { return false }
        return ids.contains { id in
            labels.contains { $0.ballId == id && $0.memberBallIds.contains(ballId) }
        }
    }

    for section in view.leaderboard {
        switch section {
        case .ranked(let ranked):
            guard let entry = ranked.entries.first(where: { covers($0.ballIds) }) else { continue }
            guard let total = entry.total else { return nil } // nothing scored yet
            if let paceDelta = entry.paceDelta {
                let delta = ranked.direction == .high ? -paceDelta : paceDelta
                return .pace(Int(delta))
            }
            return .total(total)
        case .matchSummary(let summary):
            guard
                let panel = summary.matches.first(where: {
                    covers($0.sideA.ballIds) || covers($0.sideB.ballIds)
                })
            else { continue }
            if panel.thru == 0, !panel.finished { return nil } // nothing decided yet
            let own: GridRowTeam = covers(panel.sideA.ballIds) ? .a : .b
            guard let leader = panel.leader, panel.magnitude != 0 else {
                return .match(text: "AS", up: nil)
            }
            let up = leader == own
            let magnitude = jsNumberString(panel.magnitude)
            // Closed-out match: the row reads the final scoreline ("4&3")
            // on both sides — colour still says who won.
            if panel.finished, let remaining = panel.closeOutRemaining {
                return .match(text: "\(magnitude)&\(jsNumberString(remaining))", up: up)
            }
            return .match(text: "\(magnitude) \(up ? "UP" : "DN")", up: up)
        }
    }
    return nil
}
