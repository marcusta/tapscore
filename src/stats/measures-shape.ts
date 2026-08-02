// The web twin of iOS's key-list decode guards.
//
// iOS decodes `StatMeasures` against an explicit key list, so a payload from a
// server with stale views (or an older schema) fails LOUDLY: "The server sent a
// shape this build does not understand". The web client's generated types
// erase at runtime, so the same payload used to sail through, feed `undefined`
// into `rate()`, and render as NaN% — observed 2026-08-02 against a dev DB
// whose views predated the current measure set.
//
// The check runs ONCE per payload, on the first row: every row of a page is
// projected by the same server view, so a column missing from one row is
// missing from all of them, and checking ~200 keys × 50 rows per page would
// buy nothing.
import type { PlayerRoundStats, StatMeasures } from '../api/player-stats.gen';
import { ZERO_MEASURES } from '../round/stat-measures';

/** Every measure key this build computes rates from — `ZERO_MEASURES` is the roster. */
export const MEASURE_KEYS = Object.freeze(
    Object.keys(ZERO_MEASURES) as (keyof StatMeasures)[],
);

/** Keys absent or non-numeric on `measures`. Empty means the shape is whole. */
export function missingMeasureKeys(measures: unknown): string[] {
    if (typeof measures !== 'object' || measures === null) return [...MEASURE_KEYS];
    const rec = measures as Record<string, unknown>;
    return MEASURE_KEYS.filter((key) => typeof rec[key] !== 'number');
}

/**
 * Null when the payload's measure rows carry every key this build needs;
 * otherwise a message fit for the existing error/extend-error surfaces. An
 * empty payload is whole by definition — "no rounds" is not a shape problem.
 */
export function statsShapeProblem(rows: readonly PlayerRoundStats[]): string | null {
    if (rows.length === 0) return null;
    const missing = missingMeasureKeys(rows[0].measures);
    if (missing.length === 0) return null;
    const shown = missing.slice(0, 3).join(', ');
    const rest = missing.length > 3 ? ` and ${missing.length - 3} more` : '';
    return `The server sent stats this app does not understand (missing ${shown}${rest}).`;
}
