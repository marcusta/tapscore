// Shared stableford scoring primitives — reused by `stableford-individual`
// (currently a local copy; could be migrated) and `stableford-better-ball`
// (2.5e, which runs the same calculation per-player and takes the team's
// max). Taliban (2.5g) and Umbrella (2.5h) will also need "gross → net"
// and WHS-distribution-by-SI arithmetic; 2.5g / 2.5h can import these
// directly instead of re-deriving them.
//
// Keeping the extraction small: only the two primitives that are duplicated
// verbatim (stroke allocation by SI, per-hole stableford points). Anything
// more opinionated (pickup semantics, DNP policy, note formatting) stays
// inside each strategy because those choices are format-level and should
// be self-evident when reading the strategy file top-to-bottom.

import type { CourseHole } from '../format';

/**
 * WHS stroke distribution: playing handicap spread across course holes
 * by stroke index. Baseline = floor(PH / holeCount); extras = PH mod
 * holeCount, falling on holes with the lowest SI first. Negative PH
 * (positive handicap scratch+) is not handled — the caller clamps to 0.
 */
export function strokesGivenMap(
    playingHandicap: number,
    courseHoles: CourseHole[],
): Map<number, number> {
    const n = courseHoles.length;
    const baseline = n > 0 ? Math.floor(playingHandicap / n) : 0;
    const extras = n > 0 ? ((playingHandicap % n) + n) % n : 0;
    const m = new Map<number, number>();
    for (const ch of courseHoles) {
        const extra = ch.strokeIndex <= extras ? 1 : 0;
        m.set(ch.holeNumber, baseline + extra);
    }
    return m;
}

/** Per-hole stableford outcome — enough info for team formats to combine players. */
export interface StablefordHoleOutcome {
    /**
     * 'scored' — a real strokes value (net + points computed)
     * 'pickup' — 0 strokes event (0 pts this hole, total stays valid)
     * 'dnp' — null strokes event (null points, doesn't kill total)
     * 'no_event' — no event at all (null points, not counted as played)
     */
    kind: 'scored' | 'pickup' | 'dnp' | 'no_event';
    gross: number | null;
    net: number | null;
    points: number | null;
    /** Strokes given on this hole (useful for tooltips/notes). */
    strokesGiven: number;
    /** netPar = par + strokesGiven. Cached for display arithmetic. */
    netPar: number;
}

/**
 * Compute one player's stableford outcome for one hole. Pure — doesn't
 * read `holes` collections; caller resolves the strokes value and passes
 * it in. `strokes` semantics:
 *   undefined → no event ('no_event')
 *   null      → DNP ('dnp')
 *   0         → pickup ('pickup')
 *   n > 0     → scored gross strokes ('scored')
 */
export function stablefordOutcome(
    strokes: number | null | undefined,
    ch: CourseHole,
    strokesGivenForHole: number,
): StablefordHoleOutcome {
    const netPar = ch.par + strokesGivenForHole;

    if (strokes === undefined) {
        return { kind: 'no_event', gross: null, net: null, points: null, strokesGiven: strokesGivenForHole, netPar };
    }
    if (strokes === null) {
        return { kind: 'dnp', gross: null, net: null, points: null, strokesGiven: strokesGivenForHole, netPar };
    }
    if (strokes === 0) {
        return { kind: 'pickup', gross: null, net: null, points: 0, strokesGiven: strokesGivenForHole, netPar };
    }
    const net = strokes - strokesGivenForHole;
    const points = Math.max(0, 2 + (netPar - strokes));
    return { kind: 'scored', gross: strokes, net, points, strokesGiven: strokesGivenForHole, netPar };
}
