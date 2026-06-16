// Phase 2.6d-final E3 — slot_def_id is an OPAQUE stable identifier. The result
// path must resolve slot order from persisted ordering data, never by parsing a
// `slot-<N>` convention. A round authored with ids like `main-stableford` and
// `afternoon-match` must create, score, render, correct, and re-read intact.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundDefinition } from '../domain/round-definition';

async function authorOpaque() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'HGC' });
    const course = await ctx.courseService.create({ clubId: club.id, name: 'North', holeCount: 18 });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'White',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const p1 = await ctx.playerService.register({ username: 'op1', password: 'password123', displayName: 'Op1' });
    const p2 = await ctx.playerService.register({ username: 'op2', password: 'password123', displayName: 'Op2' });
    const definition: RoundDefinition = {
        courseId: course.id,
        playedAt: '2026-06-10',
        roundType: 'full_18',
        producers: [
            { id: 'P1', playerRef: { kind: 'player', id: p1.id }, handicapIndex: 9, gender: 'M', teeId: tee.id },
            { id: 'P2', playerRef: { kind: 'player', id: p2.id }, handicapIndex: 9, gender: 'M', teeId: tee.id },
        ],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        // Opaque, human-meaningful slot ids — NOT `slot-0` / `slot-1`.
        slots: [
            { id: 'main-stableford', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 100 }, ballSelector: { strategyDefIds: ['own'] } },
            { id: 'afternoon-match', formatId: 'match_play_individual', allowanceConfig: { type: 'flat', pct: 100 }, ballSelector: { strategyDefIds: ['own'] } },
        ],
    };
    const round = await ctx.roundService.create({ definition });
    return { ctx, round };
}

test('opaque slot ids create, score, render and correct without id parsing (E3)', async () => {
    const { ctx, round } = await authorOpaque();

    const balls = await ctx.roundService.ballsForRound(round.id);
    expect(balls).toHaveLength(2);
    // Slot order resolves from persisted ordinal, not by parsing the id.
    for (const b of balls) {
        const idxes = b.slots.map((s) => s.slotIndex).sort();
        expect(idxes).toEqual([0, 1]);
    }

    // Score a few holes for both balls.
    const occ = round.playHoles.slice(0, 9).map((p) => p.id);
    for (const b of balls) {
        for (let i = 0; i < occ.length; i++) {
            await ctx.scoreEventService.append({
                roundId: round.id, ballId: b.id, playHoleId: occ[i]!,
                strokes: 4, eventType: 'score_entered', clientEventId: `${b.id}-${i}`,
            });
        }
    }

    // Render results — must not throw on opaque ids, two slots in definition order.
    const rr = await ctx.leaderboardService.resultForRound(round.id);
    expect(rr.slots.map((s) => s.slotIndex)).toEqual([0, 1]);

    // Apply an allowance-override correction keyed by the OPAQUE slot id.
    const corr = await ctx.correctionService.applyAllowanceOverride({
        roundId: round.id,
        slotDefId: 'main-stableford',
        newConfig: { type: 'flat', pct: 90 },
        reason: 'test allowance change',
        clientEventId: 'corr-1',
    });
    expect(corr.ok).toBe(true);

    // Re-read after the correction — still two slots, still no id parsing.
    const rr2 = await ctx.leaderboardService.resultForRound(round.id);
    expect(rr2.slots.map((s) => s.slotIndex)).toEqual([0, 1]);
});
