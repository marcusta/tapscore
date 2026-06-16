// Phase 2.6d — typed corrections (setup / allowance / ruling).
//
// Proves the three correction kinds are distinct: a setup correction mutates a
// RoundDefinition input + recompiles all downstream outputs; an allowance
// override re-derives only slot PHs and survives a later setup correction; a
// ruling is append-only and does not recompile. Recompiles keep content-
// addressed ball ids stable, so prior score events stay valid.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundDefinition } from '../domain/round-definition';
import type { RoundBall } from './round.service';

async function setup() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();

    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Correction GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Fixer',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    // Two tees with deliberately different ratings so a tee correction visibly
    // moves CH.
    const yellow = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const red = await ctx.teeService.create({
        courseId: course.id,
        name: 'Red',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 74, slope: 150, par: 72, totalLengthM: 6500 }],
    });
    const ann = await ctx.playerService.register({
        username: 'ann',
        password: 'password123',
        displayName: 'Ann',
    });
    const bo = await ctx.playerService.register({
        username: 'bo',
        password: 'password123',
        displayName: 'Bo',
    });

    const definition: RoundDefinition = {
        courseId: course.id,
        playedAt: '2026-06-10',
        roundType: 'full_18',
        producers: [
            { id: 'P1', playerRef: { kind: 'player', id: ann.id }, handicapIndex: 18, gender: 'M', teeId: yellow.id },
            { id: 'P2', playerRef: { kind: 'player', id: bo.id }, handicapIndex: 10, gender: 'M', teeId: yellow.id },
        ],
        ballStrategies: [
            { id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } },
        ],
        slots: [
            { id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 100 } },
        ],
    };
    const round = await ctx.roundService.create({ definition });
    return { ctx, round, teeIds: { yellow: yellow.id, red: red.id } };
}

function chFor(balls: RoundBall[], producerDefId: string): RoundBall {
    const b = balls.find((x) => x.players.some((p) => p.producerDefId === producerDefId));
    if (!b) throw new Error(`no ball for producer ${producerDefId}`);
    return b;
}

test('setup_correction (producer_tee) recompiles a NEW definition version + moves CH', async () => {
    const { ctx, round, teeIds } = await setup();

    const before = await ctx.roundService.ballsForRound(round.id);
    const p1Before = chFor(before, 'P1');
    expect(p1Before.courseHandicap).toBe(18); // Yellow: 18 × 113/113 + (72−72)

    const res = await ctx.correctionService.applySetupCorrection({
        roundId: round.id,
        target: 'producer_tee',
        targetRef: { producerDefId: 'P1' },
        newValue: teeIds.red,
        reason: 'Ann was assigned the wrong tee at check-in',
        clientEventId: 'corr-1',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.version).toBe(2);

    const after = await ctx.roundService.ballsForRound(round.id);
    const p1After = chFor(after, 'P1');
    // Red: round(18 × 150/113 + (74−72)) = round(23.89 + 2) = 26
    expect(p1After.courseHandicap).toBe(26);
    // P1's ball id is content-addressed on producer def-ids → stable across the
    // recompile (same id, updated CH).
    expect(p1After.id).toBe(p1Before.id);
    // The other producer is untouched.
    expect(chFor(after, 'P2').courseHandicap).toBe(10);

    // A v2 round_definitions version exists, sourced from the correction event.
    const defs = await ctx.db
        .selectFrom('round_definitions')
        .where('round_id', '=', round.id)
        .select(['version', 'source_kind', 'source_event_id', 'superseded_by_version'])
        .orderBy('version')
        .execute();
    expect(defs.map((d) => d.version)).toEqual([1, 2]);
    expect(defs[0].superseded_by_version).toBe(2);
    expect(defs[1].source_kind).toBe('setup_correction');
    expect(defs[1].source_event_id).toBe(res.eventId);

    const evt = await ctx.db
        .selectFrom('setup_correction_events')
        .where('id', '=', res.eventId)
        .selectAll()
        .executeTakeFirstOrThrow();
    expect(JSON.parse(evt.old_value!)).toBe(teeIds.yellow);
    expect(evt.result_version).toBe(2);
});

test('setup_correction is idempotent on clientEventId', async () => {
    const { ctx, round, teeIds } = await setup();
    const a = await ctx.correctionService.applySetupCorrection({
        roundId: round.id,
        target: 'producer_tee',
        targetRef: { producerDefId: 'P1' },
        newValue: teeIds.red,
        reason: 'fix',
        clientEventId: 'dup',
    });
    const b = await ctx.correctionService.applySetupCorrection({
        roundId: round.id,
        target: 'producer_tee',
        targetRef: { producerDefId: 'P1' },
        newValue: teeIds.red,
        reason: 'fix',
        clientEventId: 'dup',
    });
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) expect(a.eventId).toBe(b.eventId);
    const versions = await ctx.db
        .selectFrom('round_definitions')
        .where('round_id', '=', round.id)
        .select('version')
        .execute();
    expect(versions).toHaveLength(2); // initial + the single correction, not two.
});

test('allowance_override re-derives slot PHs into a new version', async () => {
    const { ctx, round } = await setup();
    const before = await ctx.roundService.ballsForRound(round.id);
    const phBefore = chFor(before, 'P1').slots[0].playingHandicap;
    expect(phBefore).toBe(18); // 100% of CH 18

    const res = await ctx.correctionService.applyAllowanceOverride({
        roundId: round.id,
        slotDefId: 'slot-0',
        newConfig: { type: 'flat', pct: 90 },
        reason: 'Club switched to 90% stableford after entry',
        clientEventId: 'allow-1',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const after = await ctx.roundService.ballsForRound(round.id);
    expect(chFor(after, 'P1').slots[0].playingHandicap).toBe(16); // round(18 × 0.9)
    // Ball CH is untouched by an allowance override.
    expect(chFor(after, 'P1').courseHandicap).toBe(18);

    const ver = await ctx.db
        .selectFrom('round_definitions')
        .where('round_id', '=', round.id)
        .where('source_kind', '=', 'allowance_override')
        .select('version')
        .executeTakeFirst();
    expect(ver?.version).toBe(2);
});

test('allowance override is PRESERVED through a later setup correction', async () => {
    const { ctx, round, teeIds } = await setup();

    // 1) Override the slot to 90%.
    await ctx.correctionService.applyAllowanceOverride({
        roundId: round.id,
        slotDefId: 'slot-0',
        newConfig: { type: 'flat', pct: 90 },
        reason: '90% house rule',
        clientEventId: 'allow-1',
    });
    // 2) Later, correct P1's tee — a FULL recompile.
    const corr = await ctx.correctionService.applySetupCorrection({
        roundId: round.id,
        target: 'producer_tee',
        targetRef: { producerDefId: 'P1' },
        newValue: teeIds.red,
        reason: 'wrong tee',
        clientEventId: 'corr-1',
    });
    expect(corr.ok).toBe(true);

    const after = await ctx.roundService.ballsForRound(round.id);
    const p1 = chFor(after, 'P1');
    // Final PH reflects BOTH: the corrected CH (26, off Red) AND the earlier
    // 90% allowance — single source of truth in the definition chain.
    expect(p1.courseHandicap).toBe(26);
    expect(p1.slots[0].playingHandicap).toBe(23); // round(26 × 0.9)
});

test('ruling_event is append-only and does not recompile', async () => {
    const { ctx, round } = await setup();
    const ballId = chFor(await ctx.roundService.ballsForRound(round.id), 'P1').id;

    const r = await ctx.correctionService.applyRuling({
        roundId: round.id,
        target: 'ball_total',
        targetId: ballId,
        rulingKind: 'penalty_strokes',
        value: { strokes: 2 },
        reason: 'Signed for a wrong (lower) score on the 12th',
        clientEventId: 'rule-1',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.id).toBeTruthy();

    // No new definition version — rulings live at the scoring layer.
    const versions = await ctx.db
        .selectFrom('round_definitions')
        .where('round_id', '=', round.id)
        .select('version')
        .execute();
    expect(versions).toHaveLength(1);

    const row = await ctx.db
        .selectFrom('ruling_events')
        .where('id', '=', r.id)
        .selectAll()
        .executeTakeFirstOrThrow();
    expect(JSON.parse(row.value)).toEqual({ strokes: 2 });
    expect(row.ruling_kind).toBe('penalty_strokes');
});
