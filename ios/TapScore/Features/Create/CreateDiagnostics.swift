import Foundation

/// Humanize compiler/planner refusals for the create flow — the Swift image of
/// `src/create/diagnostics.ts`.
///
/// The flow shows diagnostics in three places: the offending player row
/// (`producers[i]`), the offending game card, and a general error card for
/// everything else. A refusal reaches its card by STRUCTURED index, never by
/// parsing `path`: the draft builder stamps `formatIndex` (the draft's
/// `formats[]` position) and the compiler stamps `slotIndex` (the definition's
/// `slots[]` position), and since the builder emits one slot per draft format
/// in order, the two name the same card.
///
/// CONTRACT (game-rules.md, "Setup refusals must be actionable"): every code
/// this flow can trigger has a case below, built from the diagnostic's
/// STRUCTURED fields. The raw-message fallback is a safety net for codes this
/// client predates, not a presentation path. Messages say what to DO, in the
/// setup UI's own vocabulary — never engine jargon (slot, ball mode, producer).
enum CreateDiagnostics {
    /// The game-card index a diagnostic belongs to, folding slot-scoped
    /// refusals onto their originating card. Nil ⇒ not attributable to a card.
    ///
    /// Reads structured coordinates only — `path` is display text
    /// (`slots[slot-3].teamGrouping`), and reverse-engineering a server-internal
    /// def-id out of it is not this client's business.
    static func formatCardIndex(_ d: CompilerDiagnostic) -> Int? {
        if let f = d.formatIndex { return Int(f) }
        if let s = d.slotIndex { return Int(s) }
        return nil
    }

    /// Diagnostics attributable to game card `index`, builder- and
    /// compiler-scoped alike.
    static func forFormatCard(_ all: [CompilerDiagnostic], index: Int) -> [CompilerDiagnostic] {
        all.filter { formatCardIndex($0) == index }
    }

    /// Diagnostics scoped to roster row `index` (`producers[i].…`).
    static func forPlayerRow(_ all: [CompilerDiagnostic], index: Int) -> [CompilerDiagnostic] {
        all.filter { $0.path?.hasPrefix("producers[\(index)]") == true }
    }

    /// Anything scoped to the roster at all — the player step's own bucket.
    static func forPlayers(_ all: [CompilerDiagnostic]) -> [CompilerDiagnostic] {
        all.filter { $0.path?.hasPrefix("producers") == true }
    }

    /// Diagnostics attributable to no player row, no game card, no playing
    /// group and not the route — the ones the flow shows as a general error.
    static func general(_ all: [CompilerDiagnostic]) -> [CompilerDiagnostic] {
        all.filter { d in
            d.path?.hasPrefix("producers") != true
                && d.path?.hasPrefix("playingGroups") != true
                && d.path != "route"
                && formatCardIndex(d) == nil
        }
    }

    /// A player-count noun that reads naturally ("1 player" / "3 players").
    private static func players(_ n: Double) -> String {
        let count = Int(n)
        return "\(count) \(count == 1 ? "player" : "players")"
    }

    private static func whole(_ n: Double) -> String { String(Int(n)) }

    /// Turn one diagnostic into a human sentence. `label` resolves a format id
    /// to its display name; when the id is unknown or the diagnostic carries no
    /// `formatId`, we fall back to the raw compiler `message` so nothing is
    /// ever swallowed. Unrecognised codes fall back the same way.
    static func humanize(_ d: CompilerDiagnostic, label: (String) -> String?) -> String {
        let fmt = d.formatId.flatMap { label($0) ?? $0 }
        let team = d.teamLabel

        switch d.code {
        case "team_size_above_max":
            if let fmt, let team, let actual = d.actual, let max = d.allowedMax {
                return "\(team) has \(players(actual)) — \(fmt) allows at most \(whole(max)) per team."
            }
        case "team_size_below_min":
            if let fmt, let team, let actual = d.actual, let min = d.allowedMin {
                return "\(team) has \(players(actual)) — \(fmt) needs at least \(whole(min)) per team."
            }
        case "empty_team_grouping":
            if fmt != nil, let team {
                return "\(team) has no players — add at least one, or remove the team."
            }
        case "team_count_above_max":
            if let fmt, let actual = d.actual, let max = d.allowedMax {
                return "\(whole(actual)) teams — \(fmt) allows at most \(whole(max))."
            }
        case "team_count_below_min":
            if let fmt, let actual = d.actual, let min = d.allowedMin {
                return "\(whole(actual)) teams — \(fmt) needs at least \(whole(min))."
            }
        case "slot_ball_count_above_max":
            if let fmt, let actual = d.actual, let max = d.allowedMax {
                return "\(players(actual)) in \(fmt) — it scores at most \(whole(max))."
            }
        case "slot_ball_count_below_min":
            if let fmt, let actual = d.actual, let min = d.allowedMin {
                return "\(players(actual)) in \(fmt) — it needs at least \(whole(min))."
            }
        case "slot_ball_count_not_multiple":
            if let fmt, let actual = d.actual {
                return "\(fmt) pairs its balls, so it needs an even number — \(players(actual)) won't pair up."
            }
        case "missing_team_grouping":
            if let fmt {
                return "\(fmt) compares teams — it needs the players grouped into sides before it can be scored."
            }
        // The format's own/team ball contract was violated: `actual` is the
        // offending ball's producer count (>1 ⇒ a combined team ball fed to an
        // own-ball format; 1 ⇒ a lone player fed to a team-ball format).
        case "ball_mode_violation":
            if let fmt, let actual = d.actual {
                return actual > 1
                    ? "\(fmt) is played with everyone on their own ball — a combined team ball can't play it."
                    : "\(fmt) is played on one shared team ball — group the players into a team instead of scoring them individually."
            }
        case "producer_count_violation":
            if let fmt, let actual = d.actual, let min = d.allowedMin, let max = d.allowedMax {
                if max == 1 && actual > 1 {
                    return "\(fmt) is played with everyone on their own ball — a combined team ball can't play it."
                }
                let bound = min == max
                    ? "exactly \(players(min))"
                    : "\(whole(min))–\(whole(max)) players"
                return "A ball in \(fmt) has \(players(actual)) — it needs \(bound) per ball."
            }
        // --- Edit-mode locks; reachable here only if a round is edited
        //     underneath us while this flow is submitting.
        case "producer_has_scores", "scored_ball_orphaned":
            // The server names the scored player(s) in its message; keep it.
            return d.message
        case "edit_locked_course_route":
            return "Scores have already been recorded — the course and route are locked for this round."
        case "round_complete":
            return "This round is complete — its setup can no longer be edited."
        case "not_editable":
            return "This round can no longer be edited."
        default:
            break
        }
        // Unknown code, or a known code missing its structured fields: keep the
        // raw compiler message. Never drop a refusal on the floor.
        return d.message
    }
}
