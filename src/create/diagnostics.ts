// Phase 3 — humanize compiler/planner refusals for the create flow.
//
// The setup UI shows diagnostics in three places: the offending player row
// (`producers[i]`), the offending format card (`formats[i]`), and a general
// error card for everything else. The compiler, however, tags SLOT-scoped
// refusals with `slots[slot-N]…` paths (team size, ball count, missing team
// grouping) — and `slot-N` maps one-for-one to the draft's `formats[N]` (the
// builder stamps `slot.id = slot-${i}` off the draft format index; verified in
// server/domain/round-setup/builder.ts). So this module:
//   (a) re-buckets `slots[slot-N]` diagnostics onto format card N, and
//   (b) HUMANIZES the common structured codes into a plain sentence using the
//       format's display label; unknown codes fall back to the raw `message`.
//
// It is PURE — no signals, no DOM. `humanizeDiagnostic` takes a label resolver
// (the catalog's locale-aware `labelOf`) so it stays testable in isolation.

import type { CompilerDiagnostic } from '../api/friendly-rounds.gen';

/** `slots[slot-3].teamGrouping` → 3; anything else → null. */
export function slotIndexFromPath(path: string | undefined): number | null {
    if (!path) return null;
    const m = /^slots\[slot-(\d+)\]/.exec(path);
    return m ? Number(m[1]) : null;
}

/** `formats[2].teams` → 2; anything else → null. */
export function formatIndexFromPath(path: string | undefined): number | null {
    if (!path) return null;
    const m = /^formats\[(\d+)\]/.exec(path);
    return m ? Number(m[1]) : null;
}

/**
 * The format-card index a diagnostic belongs to, folding slot-scoped paths onto
 * their originating format card. Returns null when the diagnostic is not
 * attributable to a specific format card (a general error).
 */
export function formatCardIndexOf(d: CompilerDiagnostic): number | null {
    return formatIndexFromPath(d.path) ?? slotIndexFromPath(d.path);
}

/** Diagnostics attributable to format card `index`, both `formats[i]` and `slots[slot-i]`. */
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
                return `${fmt} needs its players grouped into teams — tick the teams it scores.`;
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
