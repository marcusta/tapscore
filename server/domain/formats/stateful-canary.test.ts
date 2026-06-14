// Phase 2.6d — GATE: the stateful format-action seam, end-to-end.
//
// Proves a brand-new STATEFUL format (rotating role + per-hole partner + an
// ordered in-hole call) persists actions through the ONE generic endpoint,
// replays them deterministically into score(), is corrected by SUPERSESSION,
// and produces a structured result — all with ZERO infrastructure edits
// (no new persistence column/table/switch, no leaderboard format-id branch).

import { test, expect } from 'bun:test';
import { createTestDb } from '../../testing/db';
import { registerBuiltInBallCreationStrategies } from '../strategies/ball-creation';
import { registerBuiltInFormats } from '../formats';
import { registerStatefulCanary, STATEFUL_CANARY_FORMAT_ID } from './_stateful_canary.testkit';
import type { RoundDefinition } from '../round-definition';

async function setup() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    registerStatefulCanary();

    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Canary GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Wolf Den',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const players = [];
    for (const u of ['p1', 'p2', 'p3']) {
        players.push(await ctx.playerService.register({ username: u, password: 'password123', displayName: u }));
    }

    const definition: RoundDefinition = {
        courseId: course.id,
        playedAt: '2026-06-11',
        roundType: 'full_18',
        producers: players.map((p, i) => ({
            id: `P${i + 1}`,
            playerRef: { kind: 'player' as const, id: p.id },
            handicapIndex: 10,
            gender: 'M' as const,
            teeId: tee.id,
        })),
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: STATEFUL_CANARY_FORMAT_ID, allowanceConfig: { type: 'flat', pct: 100 } }],
    };
    const round = await ctx.roundService.create({ definition });
    return { ctx, round };
}

function ballOf(balls: { id: string; players: { producerDefId: string }[] }[], producerDefId: string): string {
    const b = balls.find((x) => x.players.some((p) => p.producerDefId === producerDefId));
    if (!b) throw new Error(`no ball for ${producerDefId}`);
    return b.id;
}

function pointsFor(result: Awaited<ReturnType<typeof run>>['result'], ballId: string): number | null {
    const ranked = result.slots[0].leaderboard.find((s) => s.kind === 'ranked' && s.metricId === 'points');
    if (!ranked || ranked.kind !== 'ranked') throw new Error('no points ranked section');
    const entry = ranked.entries.find((e) => e.ballIds.includes(ballId));
    return entry ? entry.total : null;
}

async function run() {
    const { ctx, round } = await setup();
    const balls = await ctx.roundService.ballsForRound(round.id);
    const b = {
        P1: ballOf(balls, 'P1'),
        P2: ballOf(balls, 'P2'),
        P3: ballOf(balls, 'P3'),
    };
    const ph = round.playHoles; // canonical order
    const h1 = ph[0].id;
    const h2 = ph[1].id;

    // --- Scores: hole 1 (par4, 2×par=8): P1=4 P2=5 P3=3; hole 2: all 4. ---
    const grosses: Record<string, [number, number]> = { P1: [4, 4], P2: [5, 4], P3: [3, 4] };
    let n = 0;
    for (const [pid, [g1, g2]] of Object.entries(grosses)) {
        for (const [hole, g] of [[h1, g1], [h2, g2]] as const) {
            await ctx.scoreEventService.append({
                roundId: round.id,
                ballId: b[pid as keyof typeof b],
                playHoleId: hole,
                strokes: g,
                eventType: 'score_entered',
                clientEventId: `sc-${n++}`,
            });
        }
    }

    const action = (input: Parameters<typeof ctx.formatActionService.append>[0]) =>
        ctx.formatActionService.append(input);

    // --- Hole 1: captain P1, partner P2 → SUPERSEDED to P3, call low. ---
    const cap1 = await action({
        roundId: round.id, slotDefId: 'slot-0', playHoleId: h1, sequence: 0,
        actionType: 'set_captain', payload: { producerDefId: 'P1' }, clientEventId: 'a1',
    });
    const partnerWrong = await action({
        roundId: round.id, slotDefId: 'slot-0', playHoleId: h1, sequence: 1,
        actionType: 'choose_partner', payload: { producerDefId: 'P2' }, clientEventId: 'a2',
    });
    expect(cap1.ok && partnerWrong.ok).toBe(true);
    if (!partnerWrong.ok) throw new Error('partner append failed');
    // Correction by supersession — partner is actually P3.
    const partnerFixed = await action({
        roundId: round.id, slotDefId: 'slot-0', playHoleId: h1, sequence: 1,
        actionType: 'choose_partner', payload: { producerDefId: 'P3' },
        supersedesActionId: partnerWrong.id, clientEventId: 'a3',
    });
    await action({
        roundId: round.id, slotDefId: 'slot-0', playHoleId: h1, sequence: 2,
        actionType: 'call_it', payload: { call: 'low' }, clientEventId: 'a4',
    });
    expect(partnerFixed.ok).toBe(true);

    // --- Hole 2: captain P2, partner P3, ordered call low THEN high (high binds). ---
    await action({
        roundId: round.id, slotDefId: 'slot-0', playHoleId: h2, sequence: 0,
        actionType: 'set_captain', payload: { producerDefId: 'P2' }, clientEventId: 'b1',
    });
    await action({
        roundId: round.id, slotDefId: 'slot-0', playHoleId: h2, sequence: 1,
        actionType: 'choose_partner', payload: { producerDefId: 'P3' }, clientEventId: 'b2',
    });
    await action({
        roundId: round.id, slotDefId: 'slot-0', playHoleId: h2, sequence: 2,
        actionType: 'call_it', payload: { call: 'low' }, clientEventId: 'b3',
    });
    await action({
        roundId: round.id, slotDefId: 'slot-0', playHoleId: h2, sequence: 3,
        actionType: 'call_it', payload: { call: 'high' }, clientEventId: 'b4',
    });

    const result = await ctx.leaderboardService.resultForRound(round.id);
    return { ctx, round, b, result };
}

test('GATE: stateful actions persist, replay, supersede, and score with no infra edits', async () => {
    const { b, result } = await run();
    // Hole 1: side after supersession = P1(4)+P3(3)=7 ≤ 8, called low → correct.
    //         P1 & P3 each +1; P2 not on side.
    // Hole 2: side P2(4)+P3(4)=8 ≤ 8 (low), but the ORDERED last call was high
    //         → incorrect, 0 points.
    expect(pointsFor(result, b.P1)).toBe(1);
    expect(pointsFor(result, b.P3)).toBe(1);
    expect(pointsFor(result, b.P2)).toBe(0);
});

test('without the supersession, P1 would have lost hole 1 (proves replay honours supersede)', async () => {
    // Sanity: P1+P2 = 4+5 = 9 > 8, so a "low" call on the ORIGINAL partner
    // would have been wrong. The asserted P1=1 above can only come from the
    // superseding P3 choice — the seam genuinely replays the correction.
    const { b, result } = await run();
    expect(pointsFor(result, b.P1)).toBe(1);
});

test('append rejects an action the format does not own (structured diagnostic)', async () => {
    const { ctx, round } = await setup();
    const res = await ctx.formatActionService.append({
        roundId: round.id,
        slotDefId: 'slot-0',
        playHoleId: round.playHoles[0].id,
        actionType: 'not_a_real_action',
        payload: {},
        clientEventId: 'x1',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.diagnostics[0].code).toBe('action_type_not_supported');
});

test('append rejects an invalid payload via the plugin validator', async () => {
    const { ctx, round } = await setup();
    const res = await ctx.formatActionService.append({
        roundId: round.id,
        slotDefId: 'slot-0',
        playHoleId: round.playHoles[0].id,
        actionType: 'call_it',
        payload: { call: 'sideways' },
        clientEventId: 'x2',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.diagnostics[0].code).toBe('invalid_call');
});

test('a stateless built-in format rejects all actions', async () => {
    const { ctx } = await setup();
    // Build a plain stableford round and try to attach an action.
    const club = await ctx.clubService.create({ name: 'Plain GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Plain',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Y',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const ann = await ctx.playerService.register({ username: 'solo', password: 'password123', displayName: 'Solo' });
    const round = await ctx.roundService.create({
        definition: {
            courseId: course.id,
            playedAt: '2026-06-12',
            producers: [{ id: 'P1', playerRef: { kind: 'player', id: ann.id }, handicapIndex: 10, gender: 'M', teeId: tee.id }],
            ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
            slots: [{ id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 100 } }],
        },
    });
    const res = await ctx.formatActionService.append({
        roundId: round.id,
        slotDefId: 'slot-0',
        playHoleId: round.playHoles[0].id,
        actionType: 'set_captain',
        payload: { producerDefId: 'P1' },
        clientEventId: 'x3',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.diagnostics[0].code).toBe('action_type_not_supported');
});
