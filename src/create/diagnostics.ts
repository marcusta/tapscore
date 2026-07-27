// Phase 3 — humanize compiler/planner refusals for the create flow.
//
// The setup UI shows diagnostics in three places: the offending player row
// (`producers[i]`), the offending format card (`formats[i]`), and a general
// error card for everything else. Refusals reach the card by STRUCTURED index,
// never by parsing `path`: the setup builder stamps `formatIndex` (the draft's
// `formats[]` position) and the compiler stamps `slotIndex` (the definition's
// `slots[]` position). The builder emits one slot per draft format in draft
// order — a format that produces no slot aborts the build before the compiler
// runs — so the two indices name the same card. So this module:
//   (a) re-buckets slot-scoped diagnostics onto format card N, and
//   (b) HUMANIZES the common structured codes into a plain sentence using the
//       format's display label; unknown codes fall back to the raw `message`.
//
// It is PURE — no signals, no DOM. `humanizeDiagnostic` takes a label resolver
// (the catalog's locale-aware `labelOf`) so it stays testable in isolation.
//
// CONTRACT (see game-rules.md "Setup refusals must be actionable"): every
// diagnostic code the wizard can trigger needs a case in the switch below,
// built from the diagnostic's STRUCTURED fields — the compiler must send them
// (see CompilerDiagnostic in server/domain/compiler/types.ts). The raw-message
// fallback at the bottom is a safety net for codes this client predates, not a
// presentation path. Messages say what to DO, in the setup UI's own vocabulary
// ("One combined ball", "Separate balls (a side)", "Scores") — never engine
// jargon (slot, ball mode, producer).

import type { CompilerDiagnostic } from '../api/friendly-rounds.gen';

/**
 * The format-card index a diagnostic belongs to, folding slot-scoped refusals
 * onto their originating format card. Returns null when the diagnostic is not
 * attributable to a specific format card (a general error).
 *
 * Reads the diagnostic's structured coordinates only — `path` is display text
 * (`slots[slot-3].teamGrouping`), and reverse-engineering a server-internal
 * def-id out of it is not this client's business.
 */
export function formatCardIndexOf(d: CompilerDiagnostic): number | null {
    return d.formatIndex ?? d.slotIndex ?? null;
}

/** Diagnostics attributable to format card `index`, both builder- and compiler-scoped. */
export function diagnosticsForFormatCard(
    all: CompilerDiagnostic[],
    index: number,
): CompilerDiagnostic[] {
    return all.filter((d) => formatCardIndexOf(d) === index);
}

/** Diagnostics not attributable to a player row, a format card, a playing group,
 * the roster (edit-mode `producers`), or the route (edit-mode `route`). */
export function generalDiagnostics(all: CompilerDiagnostic[]): CompilerDiagnostic[] {
    return all.filter(
        (d) =>
            !d.path?.startsWith('producers') &&
            !d.path?.startsWith('playingGroups') &&
            d.path !== 'route' &&
            formatCardIndexOf(d) === null,
    );
}

/** A player-count noun that reads naturally ("1 player" / "3 players"). */
function players(n: number): string {
    return `${n} ${n === 1 ? 'player' : 'players'}`;
}

/**
 * Turn one diagnostic into a human sentence. `label` resolves a format id to its
 * display name (e.g. "Better-ball Stableford"); when the id is unknown or the
 * diagnostic carries no `formatId`, we fall back to the raw compiler `message`
 * so nothing is ever swallowed. Codes we don't recognise also fall back to
 * `message` — the caller renders that inside the same styled inline-error slot.
 */
export function humanizeDiagnostic(
    d: CompilerDiagnostic,
    label: (formatId: string) => string | null,
): string {
    const fmt = d.formatId ? label(d.formatId) ?? d.formatId : null;
    const team = d.teamLabel;

    switch (d.code) {
        case 'team_size_above_max':
            if (fmt && team && d.actual !== undefined && d.allowedMax !== undefined) {
                return `${team} has ${players(d.actual)} — ${fmt} allows at most ${d.allowedMax} per team.`;
            }
            break;
        case 'team_size_below_min':
            if (fmt && team && d.actual !== undefined && d.allowedMin !== undefined) {
                return `${team} has ${players(d.actual)} — ${fmt} needs at least ${d.allowedMin} per team.`;
            }
            break;
        case 'empty_team_grouping':
            if (fmt && team) {
                return `${team} has no players — add at least one, or remove the team.`;
            }
            break;
        case 'team_count_above_max':
            if (fmt && d.actual !== undefined && d.allowedMax !== undefined) {
                return `${d.actual} teams — ${fmt} allows at most ${d.allowedMax}.`;
            }
            break;
        case 'team_count_below_min':
            if (fmt && d.actual !== undefined && d.allowedMin !== undefined) {
                return `${d.actual} teams — ${fmt} needs at least ${d.allowedMin}.`;
            }
            break;
        case 'slot_ball_count_above_max':
            if (fmt && d.actual !== undefined && d.allowedMax !== undefined) {
                return `${players(d.actual)} in ${fmt} — it scores at most ${d.allowedMax}.`;
            }
            break;
        case 'slot_ball_count_below_min':
            if (fmt && d.actual !== undefined && d.allowedMin !== undefined) {
                return `${players(d.actual)} in ${fmt} — it needs at least ${d.allowedMin}.`;
            }
            break;
        case 'slot_ball_count_not_multiple':
            if (fmt && d.actual !== undefined) {
                return `${fmt} pairs its balls, so it needs an even number — ${players(d.actual)} won't pair up.`;
            }
            break;
        case 'missing_team_grouping':
            if (fmt) {
                return `${fmt} compares teams — under Teams, group the players into “Separate balls (a side)” teams, then tick them under “Scores”.`;
            }
            break;
        // The format's own/team ball contract was violated: `actual` is the
        // offending ball's producer count (>1 ⇒ a combined team ball fed to an
        // own-ball format; 1 ⇒ a lone player fed to a team-ball format).
        case 'ball_mode_violation':
            if (fmt && d.actual !== undefined) {
                return d.actual > 1
                    ? `${fmt} is played with everyone on their own ball — a “One combined ball” team can’t play it. Use a “Separate balls (a side)” team instead.`
                    : `${fmt} is played on one shared team ball — under Teams, group the players into a “One combined ball” team, then tick that team instead of the individual players.`;
            }
            break;
        case 'producer_count_violation':
            if (fmt && d.actual !== undefined && d.allowedMin !== undefined && d.allowedMax !== undefined) {
                if (d.allowedMax === 1 && d.actual > 1) {
                    return `${fmt} is played with everyone on their own ball — a “One combined ball” team can’t play it. Use a “Separate balls (a side)” team instead.`;
                }
                const bound =
                    d.allowedMin === d.allowedMax
                        ? `exactly ${players(d.allowedMin)}`
                        : `${d.allowedMin}–${d.allowedMax} players`;
                return `A ball in ${fmt} has ${players(d.actual)} — it needs ${bound} per ball.`;
            }
            break;
        // --- Edit-mode locks (Phase 3.5) ---
        case 'producer_has_scores':
            // The server names the scored player(s) in its message; keep it.
            return d.message;
        case 'scored_ball_orphaned':
            return d.message;
        case 'edit_locked_course_route':
            return 'Scores have already been recorded — the course and route are locked for this round.';
        case 'round_complete':
            return 'This round is complete — its setup can no longer be edited.';
        case 'not_editable':
            return 'This round can no longer be edited.';
    }
    // Unknown code, or a known code missing its structured fields: keep the raw
    // compiler message. Never drop a refusal on the floor.
    return d.message;
}
