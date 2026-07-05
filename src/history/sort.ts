// Pure newest-first ordering for the History view — all rounds, no partition,
// no window. No DOM, no clock — unit-testable.

import type { LandingRow } from '../landing/rows';

/**
 * Order rows newest-first. The recency key per row is the best timestamp it
 * carries: a finished round's `completedAt`, else its `lastActivityAt` (round
 * date for logged-in rows, last-seen for device rows). Missing/unparseable
 * keys sort last, tie-broken by `key` for a stable order. Does not mutate the
 * input.
 */
export function sortHistory(rows: readonly LandingRow[]): LandingRow[] {
    return [...rows].sort((a, b) => {
        const ra = recency(a);
        const rb = recency(b);
        // Both missing → equal recency; fall through to the key tie-break
        // (avoids the `-Infinity - -Infinity = NaN` comparator hazard).
        if (rb !== ra) return rb - ra;
        return a.key.localeCompare(b.key);
    });
}

/** Parsed recency (ms), or `Number.NEGATIVE_INFINITY` — but callers compare
 *  for equality FIRST so two missing keys never subtract into NaN. */
function recency(row: LandingRow): number {
    const raw = row.completedAt ?? row.lastActivityAt;
    const t = raw ? Date.parse(raw) : NaN;
    return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}
