// Pure landing partition (no DOM, no fetch — unit-testable). Splits a list of
// rounds into "Ongoing" (not_started / active) and "Recently finished"
// (complete within a trailing window) for the logged-in landing. The same
// split serves the logged-out device-recent list, which carries the same
// status + completedAt fields on each entry.
//
// `now` is injected (passed from the component) so the window is deterministic
// and testable — no `Date.now()` in this module.

/** The minimum a row needs to be partitioned: its round's lifecycle status and
 *  (for finished rounds) when it finished. Both the logged-in `MyRoundEntry`
 *  and the logged-out device-recent entry satisfy this via `round`. */
export interface PartitionableRound {
    status: 'not_started' | 'active' | 'complete';
    /** ISO time the round finished; null/absent when not finished. A complete
     *  round with no completedAt is still treated as finished (fallback). */
    completedAt?: string | null;
    /** Sort key for ongoing rounds — most-recently-active first. Optional; a
     *  missing value sorts last. */
    lastActivityAt?: string | null;
}

export interface Partitioned<T> {
    ongoing: T[];
    finished: T[];
}

/** Default "recently finished" window: rounds finished within 14 days show on
 *  the landing; older ones live only in History. */
export const RECENT_FINISHED_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

function pick<T>(item: T, get: (t: T) => PartitionableRound): PartitionableRound {
    return get(item);
}

/**
 * Partition rounds into ongoing vs recently-finished.
 *
 * - Ongoing: status `not_started` or `active`. Sorted by `lastActivityAt` desc
 *   (most-recently-active first); entries without one sort last, tie-broken by
 *   a stable secondary that the caller pre-orders (input order is preserved for
 *   equal keys since the sort is stable).
 * - Recently finished: status `complete` AND finished within `windowDays` of
 *   `now`. A complete round missing `completedAt` is treated as finished and
 *   ALWAYS included (we can't window it, but it's clearly done). Sorted by
 *   `completedAt` desc (missing → sorts last).
 * - A complete round finished BEFORE the window is dropped from both sections
 *   (it only appears in History).
 */
export function partitionRounds<T>(
    items: readonly T[],
    now: number,
    get: (item: T) => PartitionableRound,
    windowDays: number = RECENT_FINISHED_DAYS,
): Partitioned<T> {
    const cutoff = now - windowDays * DAY_MS;
    const ongoing: T[] = [];
    const finished: T[] = [];

    for (const item of items) {
        const r = pick(item, get);
        if (r.status === 'complete') {
            const at = r.completedAt ? Date.parse(r.completedAt) : NaN;
            // Unwindowable (missing/unparseable) → still finished; otherwise
            // include only when finished on/after the cutoff.
            if (Number.isNaN(at) || at >= cutoff) finished.push(item);
        } else {
            ongoing.push(item);
        }
    }

    ongoing.sort((a, b) => timeDesc(pick(a, get).lastActivityAt, pick(b, get).lastActivityAt));
    finished.sort((a, b) => timeDesc(pick(a, get).completedAt, pick(b, get).completedAt));
    return { ongoing, finished };
}

/** Descending by parsed ISO time; a missing/unparseable value sorts last.
 *  Equal values (incl. both-missing) return 0 — never `-Infinity - -Infinity`
 *  (NaN), which would corrupt the sort. */
function timeDesc(a: string | null | undefined, b: string | null | undefined): number {
    const ta = a ? Date.parse(a) : NaN;
    const tb = b ? Date.parse(b) : NaN;
    const va = Number.isNaN(ta) ? Number.NEGATIVE_INFINITY : ta;
    const vb = Number.isNaN(tb) ? Number.NEGATIVE_INFINITY : tb;
    if (va === vb) return 0;
    return vb - va;
}
