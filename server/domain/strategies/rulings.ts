// Phase 2.6d — competitive rulings as a scoring-layer adjustment (§17).
//
// A `ruling_event` (DQ, penalty strokes, hole adjudication, WD) is read at the
// scoring layer and applied as an adjustment to the format's structured result.
// It does NOT re-derive anything — ball CH, PH, and the event log are
// untouched. The adjustment is GENERIC (no format-id dispatch): it operates on
// the `StrategyResult` every plugin already produces, so it works for any
// registered format.
//
// Targeting (matches migration 027's encoding):
//   ball_total        target_id = `${ballId}`
//   ball_hole         target_id = `${ballId}:${playHoleId}`
//   slot_ball_result  target_id = `${slotDefId}:${ballId}` (slot-scoped)
//
// Effects:
//   penalty_strokes { strokes: n }  → adds n to the ball's stroke totals
//                                     (gross / net / to_par) and, for a
//                                     ball_hole target, to that hole too.
//   dq | wd                         → nulls the ball's totals and flags it.

import type { BallHoleResult, BallResult, RulingEvent, StrategyEvent, StrategyResult } from './types';

/** Stroke-denominated metric ids a penalty adds to. Points metrics are not
 *  touched — a raw stroke penalty has no defined points mapping. */
const STROKE_METRICS = new Set(['gross', 'net', 'to_par']);

/** One ruling applied to one ball — surfaced for audit-grade rendering. */
export interface AppliedRuling {
    ballId: string;
    rulingKind: RulingEvent['rulingKind'];
    /** Set for penalty_strokes. */
    strokes?: number;
    /** Set for ball_hole penalties. */
    playHoleId?: string;
    reason: string;
}

export function rulingEventsOf(events: StrategyEvent[]): RulingEvent[] {
    return events.filter((e): e is RulingEvent => e.kind === 'ruling');
}

interface ParsedRuling {
    ev: RulingEvent;
    ballId: string;
    playHoleId?: string;
}

/** Resolve a ruling's target to the ball (and optional hole) it adjusts within
 *  the given slot. Returns null when the target is for another slot/ball. */
function resolveTarget(ev: RulingEvent, slotDefId: string): ParsedRuling | null {
    switch (ev.target) {
        case 'ball_total':
            return { ev, ballId: ev.targetId };
        case 'ball_hole': {
            const idx = ev.targetId.indexOf(':');
            if (idx < 0) return { ev, ballId: ev.targetId };
            return { ev, ballId: ev.targetId.slice(0, idx), playHoleId: ev.targetId.slice(idx + 1) };
        }
        case 'slot_ball_result': {
            const idx = ev.targetId.indexOf(':');
            if (idx < 0) return null;
            if (ev.targetId.slice(0, idx) !== slotDefId) return null;
            return { ev, ballId: ev.targetId.slice(idx + 1) };
        }
        default:
            return null;
    }
}

function penaltyStrokes(ev: RulingEvent): number {
    if (ev.rulingKind !== 'penalty_strokes') return 0;
    const v = ev.value as { strokes?: unknown } | null;
    const n = v && typeof v.strokes === 'number' ? v.strokes : 0;
    return Number.isFinite(n) ? n : 0;
}

function bump(value: number | null, delta: number): number | null {
    return value === null ? null : value + delta;
}

/**
 * Apply the round's rulings to one slot's result. Pure — returns a new
 * `StrategyResult` plus the list of rulings actually applied (for rendering an
 * audit row). `slotDefId` scopes `slot_ball_result` rulings.
 */
export function applyRulingsToSlot(
    result: StrategyResult,
    rulings: RulingEvent[],
    slotDefId: string,
): { result: StrategyResult; applied: AppliedRuling[] } {
    if (rulings.length === 0) return { result, applied: [] };

    // Group resolved rulings by ball.
    const byBall = new Map<string, ParsedRuling[]>();
    for (const ev of rulings) {
        const parsed = resolveTarget(ev, slotDefId);
        if (!parsed) continue;
        byBall.set(parsed.ballId, [...(byBall.get(parsed.ballId) ?? []), parsed]);
    }
    if (byBall.size === 0) return { result, applied: [] };

    const applied: AppliedRuling[] = [];
    const ballResults: BallResult[] = result.ballResults.map((br) => {
        const list = byBall.get(br.ballId);
        if (!list || list.length === 0) return br;

        const disqualified = list.some((p) => p.ev.rulingKind === 'dq' || p.ev.rulingKind === 'wd');
        const totalPenalty = list.reduce((sum, p) => sum + penaltyStrokes(p.ev), 0);
        const perHolePenalty = new Map<string, number>();
        for (const p of list) {
            const n = penaltyStrokes(p.ev);
            applied.push({
                ballId: br.ballId,
                rulingKind: p.ev.rulingKind,
                ...(n ? { strokes: n } : {}),
                ...(p.playHoleId ? { playHoleId: p.playHoleId } : {}),
                reason: p.ev.reason,
            });
            if (n && p.playHoleId) {
                perHolePenalty.set(p.playHoleId, (perHolePenalty.get(p.playHoleId) ?? 0) + n);
            }
        }

        if (disqualified) {
            return {
                ...br,
                holes: br.holes.map((h) => ({ ...h })),
                totals: br.totals.map((t) => ({ scoringType: t.scoringType, value: null })),
            };
        }

        const holes: BallHoleResult[] = br.holes.map((h) => {
            const hp = h.playHoleId ? perHolePenalty.get(h.playHoleId) : undefined;
            if (!hp) return h;
            return { ...h, gross: bump(h.gross, hp), net: bump(h.net, hp) };
        });
        const totals = br.totals.map((t) =>
            STROKE_METRICS.has(t.scoringType) && totalPenalty
                ? { scoringType: t.scoringType, value: bump(t.value, totalPenalty) }
                : t,
        );
        return { ...br, holes, totals };
    });

    return { result: { ...result, ballResults }, applied };
}
