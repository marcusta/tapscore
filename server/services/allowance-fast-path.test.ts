// Phase 2.6d-final E4 — allowance-only correction fast path.
//
// `applyAllowanceOverride` changes ONLY one slot's allowanceConfig. It must
// re-derive just that slot's playing handicaps (plugin.deriveSlotBalls), keep
// ball creation + ball CH + every other slot untouched, and persist the narrow
// diff + a new definition version. A spy on the ball-creation strategy fails if
// the full compiler ran. The override must still survive a later setup
// correction's full recompile.

import { test, expect, spyOn } from 'bun:test';
import { createTestDb } from '../testing/db';
import { createCompiledRound } from '../testing/compiler-rounds';
import { registerBuiltInBallCreationStrategies, ownBallPerPlayer } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';

async function setup() {
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
    const p1 = await ctx.playerService.register({ username: 'fp1', password: 'password123', displayName: 'FP1' });
    const p2 = await ctx.playerService.register({ username: 'fp2', password: 'password123', displayName: 'FP2' });
    const { round } = await createCompiledRound(ctx, {
        courseId: course.id,
        teeId: tee.id,
        slots: [{ formatId: 'stableford_individual' }],
        players: [
            { kind: 'player', id: p1.id, handicapIndex: 10 },
            { kind: 'player', id: p2.id, handicapIndex: 20 },
        ],
    });
    return { ctx, round };
}

type Ball = { slots: { slotDefId: string; playingHandicap: number }[] };
function phBySlot0(balls: Ball[]): number[] {
    return balls
        .map((b) => b.slots.find((s) => s.slotDefId === 'slot-0')!.playingHandicap)
        .sort((a, b) => a - b);
}

test('allowance override re-derives PH without re-running ball creation (E4 fast path)', async () => {
    const { ctx, round } = await setup();

    const before = await ctx.roundService.ballsForRound(round.id);
    // 100% allowance: PH == CH == index (10, 20).
    expect(phBySlot0(before)).toEqual([10, 20]);
    const chBefore = before.map((b) => b.courseHandicap).sort((a, b) => a - b);
    expect(chBefore).toEqual([10, 20]);

    // Spy AFTER the initial compile so we only measure the override path.
    const createSpy = spyOn(ownBallPerPlayer, 'create');

    const res = await ctx.correctionService.applyAllowanceOverride({
        roundId: round.id,
        slotDefId: 'slot-0',
        newConfig: { type: 'flat', pct: 50 },
        reason: 'cut to 50%',
        clientEventId: 'allow-1',
    });
    expect(res.ok).toBe(true);

    // The fast path MUST NOT invoke ball creation.
    expect(createSpy).toHaveBeenCalledTimes(0);
    createSpy.mockRestore();

    const after = await ctx.roundService.ballsForRound(round.id);
    // Ball CH untouched.
    expect(after.map((b) => b.courseHandicap).sort((a, b) => a - b)).toEqual([10, 20]);
    // PH re-derived at 50%: round(10*.5)=5, round(20*.5)=10.
    expect(phBySlot0(after)).toEqual([5, 10]);

    // A new definition version recorded the override as source_kind.
    const versions = await ctx.db
        .selectFrom('round_definitions')
        .where('round_id', '=', round.id)
        .select(['version', 'source_kind'])
        .orderBy('version')
        .execute();
    expect(versions.at(-1)!.source_kind).toBe('allowance_override');
});

test('allowance override survives a later setup-correction full recompile (E4)', async () => {
    const { ctx, round } = await setup();
    await ctx.correctionService.applyAllowanceOverride({
        roundId: round.id, slotDefId: 'slot-0', newConfig: { type: 'flat', pct: 50 },
        reason: '50%', clientEventId: 'allow-1',
    });

    // A broader setup correction triggers a FULL recompile.
    const corr = await ctx.correctionService.applySetupCorrection({
        roundId: round.id,
        target: 'producer_handicap_index',
        targetRef: { producerDefId: 'p1' },
        newValue: 30,
        reason: 'index fix',
        clientEventId: 'setup-1',
    });
    expect(corr.ok).toBe(true);

    const after = await ctx.roundService.ballsForRound(round.id);
    // p1 CH now 30; the 50% allowance from the override is preserved through the
    // full recompile → PH round(30*.5)=15. p2 unchanged → CH 20, PH 10.
    const bySlot = after
        .map((b) => ({ ch: b.courseHandicap, ph: b.slots.find((s) => s.slotDefId === 'slot-0')!.playingHandicap }))
        .sort((a, b) => a.ch - b.ch);
    expect(bySlot).toEqual([
        { ch: 20, ph: 10 },
        { ch: 30, ph: 15 },
    ]);
});
