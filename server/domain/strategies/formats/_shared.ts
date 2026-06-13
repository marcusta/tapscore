// Phase 2.6b/2 — shared helpers for format strategies.
//
// Kept small. Only helpers reused across ≥2 formats live here; format-
// specific arithmetic (match-play summary formatting, umbrella category
// sums, kopenhamnare 6-point distribution) stays inside each strategy
// so reading a strategy top-to-bottom tells the whole story.

import type { FormatAllowanceConfig } from '../../round-definition';
import { playingHandicap, strokesReceivedForStrokeIndex } from '../../handicap';
import type { DerivedSlotBall, DeriveSlotBallsInput } from '../format-strategy';
import type {
    HoleIdentity,
    PerProducerCh,
    PlayHoleSnapshot,
    RoundContext,
    RoundCourseHoleSnapshot,
    ScoreEvent,
    SlotBall,
    StrategyEvent,
} from '../types';

/**
 * Build the stable play-hole identity + display metadata for one occurrence
 * as scored by one ball. Strategies spread this into every per-hole result
 * row so generic renderers can distinguish repeated visits (`3 (1st)` /
 * `3 (2nd)`) and order columns by canonical ordinal. `holeNumber` is kept
 * equal to `courseHoleNumber` for back-compat with hole-number assertions.
 */
export function holeIdentity(
    roundContext: RoundContext,
    ballId: string,
    ph: PlayHoleSnapshot,
): HoleIdentity & { holeNumber: number } {
    return {
        holeNumber: ph.courseHoleNumber,
        playHoleId: ph.playHoleId,
        courseHoleNumber: ph.courseHoleNumber,
        canonicalOrdinal: ph.ordinal,
        playedOrdinal: roundContext.playedOrdinalFor(ballId, ph.playHoleId),
        occurrenceLabel: roundContext.occurrenceLabel(ph.playHoleId),
    };
}

/**
 * Default `deriveSlotBalls` for formats taking a flat allowance. Applies
 * `ball_CH × pct / 100` via the shared `playingHandicap` helper — same
 * rounding as legacy. Formats with non-flat allowance replace this.
 */
export function deriveFlat({ balls, allowanceConfig }: DeriveSlotBallsInput): DerivedSlotBall[] {
    if (allowanceConfig.type !== 'flat') {
        throw new Error(`deriveFlat: expected allowanceConfig.type='flat' (got ${allowanceConfig.type})`);
    }
    const pct = (allowanceConfig as Extract<FormatAllowanceConfig, { type: 'flat' }>).pct;
    return balls.map((b) => ({
        ballId: b.ballId,
        playingHandicapSnapshot: playingHandicap(b.courseHandicapSnapshot, pct),
    }));
}

/**
 * WHS stroke distribution per occurrence, for one ball on one slot. Resolves
 * effective SI per occurrence via `effectiveStrokeIndexForPlayHole` and runs
 * the central allocator over the frozen allocation cycle (NOT the itinerary
 * length). The first producer of the ball is the SI reference (alt-shot /
 * foursomes apply the tee rating once at derivation; SI resolution here
 * follows the same "first producer" convention for shared-ball formats).
 */
export function strokesGivenMapForBall(
    ball: SlotBall,
    roundContext: RoundContext,
): Map<string, number> {
    if (ball.producers.length === 0) {
        throw new Error(`strokesGivenMapForBall: ball ${ball.ballId} has no producers`);
    }
    return strokesGivenMapForProducer(
        ball.producers[0].producerDefId,
        ball.playingHandicapSnapshot,
        roundContext,
    );
}

/**
 * Strokes-given per occurrence for a specific producer (team-ball per-producer
 * PH contexts). Keyed by `playHoleId` so repeated holes get independent
 * allocations from their own frozen stroke index.
 */
export function strokesGivenMapForProducer(
    producerDefId: string,
    playingHandicapValue: number,
    roundContext: RoundContext,
): Map<string, number> {
    const out = new Map<string, number>();
    for (const occ of roundContext.playHoles) {
        const si = roundContext.effectiveStrokeIndexForPlayHole(producerDefId, occ.playHoleId);
        out.set(
            occ.playHoleId,
            strokesReceivedForStrokeIndex(playingHandicapValue, si, roundContext.allocationCycleSize),
        );
    }
    return out;
}

/** Ordered course holes (defensive copy, sorted by holeNumber). */
export function orderedHoles(courseHoles: RoundCourseHoleSnapshot[]): RoundCourseHoleSnapshot[] {
    return [...courseHoles].sort((a, b) => a.holeNumber - b.holeNumber);
}

/**
 * Latest score per (ballId, playHoleId). §17 replay semantics: later
 * `score_event` wins per key. Pickups (0), DNP (null) and real gross
 * (>0) all coexist — strategies distinguish at read time.
 *
 * Returns `undefined` for an occurrence with no event (not yet played);
 * `null` for an explicit DNP; `0` for a pickup; `n > 0` for gross strokes.
 */
export function latestScoresByPlayHole(
    events: StrategyEvent[],
    ballId: string,
): Map<string, number | null> {
    const byPlayHole = new Map<string, { ts: string; strokes: number | null }>();
    for (const e of events) {
        if (e.kind !== 'score') continue;
        const se = e as ScoreEvent;
        if (se.ballId !== ballId) continue;
        const current = byPlayHole.get(se.playHoleId);
        if (!current || current.ts <= se.recordedAt) {
            byPlayHole.set(se.playHoleId, { ts: se.recordedAt, strokes: se.strokes });
        }
    }
    const out = new Map<string, number | null>();
    for (const [playHoleId, v] of byPlayHole) out.set(playHoleId, v.strokes);
    return out;
}

/** Metadata value at (ballId, playHoleId, type) — latest-wins, optionally filtered by producer. */
export function latestMetadata(
    events: StrategyEvent[],
    ballId: string,
    playHoleId: string,
    type: string,
    opts: { producerPlayerId?: string | null; producerGuestPlayerId?: string | null } = {},
): unknown {
    let chosen: { ts: string; value: unknown } | null = null;
    for (const e of events) {
        if (e.kind !== 'metadata') continue;
        if (e.ballId !== ballId) continue;
        if (e.playHoleId !== playHoleId) continue;
        if (e.type !== type) continue;
        if (opts.producerPlayerId !== undefined && e.producerPlayerId !== opts.producerPlayerId) continue;
        if (opts.producerGuestPlayerId !== undefined && e.producerGuestPlayerId !== opts.producerGuestPlayerId)
            continue;
        if (!chosen || chosen.ts <= e.recordedAt) {
            chosen = { ts: e.recordedAt, value: e.value };
        }
    }
    return chosen?.value;
}

/**
 * Resolve the single producer of an own-ball (producerCount 1..1). Throws
 * if the ball was somehow built from 2+ producers — that would be a
 * compiler error (should have been caught by `ballRequirement()`).
 */
export function resolveSingleProducer(ball: SlotBall): PerProducerCh {
    if (ball.producers.length !== 1) {
        throw new Error(
            `expected own-ball (1 producer) for ball ${ball.ballId}, got ${ball.producers.length}`,
        );
    }
    return ball.producers[0];
}

/** Default registry-friendly ball-grouping walker. */
export function groupBallsByTeam(
    balls: SlotBall[],
    groupings: { teamLabel: string; ballIds: string[] }[],
): { teamLabel: string; balls: SlotBall[] }[] {
    const byId = new Map(balls.map((b) => [b.ballId, b] as const));
    return groupings.map((g) => {
        const resolved: SlotBall[] = [];
        for (const bid of g.ballIds) {
            const b = byId.get(bid);
            if (!b) throw new Error(`slotTeamGrouping '${g.teamLabel}' references unknown ballId ${bid}`);
            resolved.push(b);
        }
        return { teamLabel: g.teamLabel, balls: resolved };
    });
}

/** Match-play differential: low PH plays 0, others get delta to low. */
export function normalizeMatchPlayPHs(phs: number[]): number[] {
    if (phs.length === 0) return [];
    const min = Math.min(...phs);
    return phs.map((ph) => ph - min);
}
