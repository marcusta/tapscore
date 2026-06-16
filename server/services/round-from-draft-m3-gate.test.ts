// Phase 2.6e M3 gate — catalog-driven formats through the no-login path.
//
// Proves the exact drafts the M3 client builds (individual, own-ball team,
// team-ball, multi-slot, greensomes, 2-/4-player scramble) compile through the
// real no-login front door (FriendlyRoundService.create → createFromDraft),
// that the PERSISTED definition uses the server-PLANNED ball-creation strategy
// (own_ball_per_player, alt_shot_pair/avg, greensomes_pair/weighted,
// scramble_team/by_rank) — never a generic mis-derivation — and that the ball
// course-handicap arithmetic matches the approved engine fixtures. Reopening
// by share token surfaces the same slots.
//
// The client only ever submits { formatId, teams?, producerDefIds?,
// allowanceConfig?, formatConfig? } — every strategy id below is chosen by the
// server's `planSetup`, which is exactly what this gate locks down. The static
// format fixtures remain the canonical correctness oracle for the engine.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundSetupDraft, DraftFormatSelection } from '../domain/round-setup/draft';

// CR = par, slope 113 → CH = handicap index. Clean arithmetic for the gate.
async function setup() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'M3 GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'M3 Links',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    return { ...ctx, courseId: course.id, teeId: tee.id };
}

async function guest(ctx: Awaited<ReturnType<typeof setup>>, name: string, index: number) {
    return ctx.guestPlayerService.create({ displayName: name, gender: 'M', handicapIndex: index });
}

/** Build the no-login draft the M3 client submits. Roster + chosen formats. */
async function draftFor(
    ctx: Awaited<ReturnType<typeof setup>>,
    roster: { name: string; index: number }[],
    formats: DraftFormatSelection[],
): Promise<RoundSetupDraft> {
    const producers = [];
    for (let i = 0; i < roster.length; i++) {
        const g = await guest(ctx, roster[i]!.name, roster[i]!.index);
        producers.push({
            producerDefId: `p${i + 1}`,
            playerRef: { kind: 'guest' as const, id: g.id },
            handicapIndex: roster[i]!.index,
            gender: 'M' as const,
            teeId: ctx.teeId,
        });
    }
    return { courseId: ctx.courseId, playedAt: '2026-06-16', roundType: 'full_18', producers, formats };
}

async function createFriendly(ctx: Awaited<ReturnType<typeof setup>>, draft: RoundSetupDraft) {
    const result = await ctx.friendlyRoundService.create(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
    return result;
}

test('individual: stableford own-ball; reopen by token shows the slot', async () => {
    const ctx = await setup();
    const draft = await draftFor(ctx, [{ name: 'Ann', index: 8 }, { name: 'Bo', index: 14 }], [
        { formatId: 'stableford_individual' },
    ]);
    const { round, friendlyRound } = await createFriendly(ctx, draft);

    const def = (await ctx.roundService.latestDefinition(round.id))!.definition;
    expect(def.ballStrategies.map((s) => s.strategyId)).toEqual(['own_ball_per_player']);
    expect(def.ballStrategies[0]!.derivationConfig).toEqual({ type: 'single' });

    const balls = await ctx.roundService.ballsForRound(round.id);
    expect(balls).toHaveLength(2); // one own-ball per player
    const ch = new Map(balls.flatMap((b) => b.players.map((p) => [p.displayName, p.courseHandicap])));
    expect(ch.get('Ann')).toBe(8);
    expect(ch.get('Bo')).toBe(14);

    // Reopen via the share token (no auth) → same slot.
    const reopened = await ctx.friendlyRoundService.findByToken(friendlyRound.shareToken);
    expect(reopened?.round.formatSlots.map((s) => s.formatId)).toEqual(['stableford_individual']);
    expect(reopened?.round.formatSlots[0]!.ballMode).toBe('own');
});

test('own-ball team: better-ball stableford persists 2v2 team grouping over own-balls', async () => {
    const ctx = await setup();
    const draft = await draftFor(
        ctx,
        [{ name: 'Ann', index: 8 }, { name: 'Bo', index: 12 }, { name: 'Cy', index: 18 }, { name: 'Di', index: 24 }],
        [
            {
                formatId: 'stableford_better_ball',
                teams: [
                    { label: 'A', producerDefIds: ['p1', 'p2'] },
                    { label: 'B', producerDefIds: ['p3', 'p4'] },
                ],
            },
        ],
    );
    const { round } = await createFriendly(ctx, draft);

    const def = (await ctx.roundService.latestDefinition(round.id))!.definition;
    // Own-ball strategy (one per player), grouped at the slot — NOT a team ball.
    expect(def.ballStrategies.map((s) => s.strategyId)).toEqual(['own_ball_per_player']);
    expect(def.slots[0]!.teamGrouping?.teams.map((t) => t.label)).toEqual(['A', 'B']);

    const balls = await ctx.roundService.ballsForRound(round.id);
    expect(balls).toHaveLength(4); // four own-balls
    const ch = new Map(balls.flatMap((b) => b.players.map((p) => [p.displayName, p.courseHandicap])));
    expect([ch.get('Ann'), ch.get('Bo'), ch.get('Cy'), ch.get('Di')]).toEqual([8, 12, 18, 24]);
});

test('team-ball: foursomes builds one alt-shot ball per pair (avg derivation)', async () => {
    const ctx = await setup();
    const draft = await draftFor(ctx, [{ name: 'Ann', index: 8 }, { name: 'Bo', index: 18 }], [
        { formatId: 'stroke_play_foursomes', teams: [{ label: 'A', producerDefIds: ['p1', 'p2'] }] },
    ]);
    const { round } = await createFriendly(ctx, draft);

    const def = (await ctx.roundService.latestDefinition(round.id))!.definition;
    expect(def.ballStrategies[0]!.strategyId).toBe('alt_shot_pair');
    expect(def.ballStrategies[0]!.derivationConfig).toEqual({ type: 'avg' });

    const balls = await ctx.roundService.ballsForRound(round.id);
    expect(balls).toHaveLength(1); // one team ball
    // avg of indices (8,18) at CR=par/slope=113 = 13.
    expect(balls[0]!.courseHandicap).toBe(13);
});

test('multi-slot: stableford + better-ball share ONE coalesced own-ball strategy', async () => {
    const ctx = await setup();
    const draft = await draftFor(
        ctx,
        [{ name: 'Ann', index: 8 }, { name: 'Bo', index: 12 }, { name: 'Cy', index: 18 }, { name: 'Di', index: 24 }],
        [
            { formatId: 'stableford_individual' },
            {
                formatId: 'stableford_better_ball',
                teams: [
                    { label: 'A', producerDefIds: ['p1', 'p2'] },
                    { label: 'B', producerDefIds: ['p3', 'p4'] },
                ],
            },
        ],
    );
    const { round } = await createFriendly(ctx, draft);

    const def = (await ctx.roundService.latestDefinition(round.id))!.definition;
    // OwnBallPerPlayer dedupes across both slots → exactly one strategy instance.
    expect(def.ballStrategies).toHaveLength(1);
    expect(def.ballStrategies[0]!.strategyId).toBe('own_ball_per_player');
    expect(def.slots.map((s) => s.formatId)).toEqual([
        'stableford_individual',
        'stableford_better_ball',
    ]);
    const balls = await ctx.roundService.ballsForRound(round.id);
    expect(balls).toHaveLength(4); // four own-balls, shared by both slots
});

test('greensomes: server plans greensomes_pair/weighted 60-40, not alt_shot/avg', async () => {
    const ctx = await setup();
    const draft = await draftFor(ctx, [{ name: 'Ann', index: 8 }, { name: 'Bo', index: 18 }], [
        { formatId: 'greensomes', teams: [{ label: 'A', producerDefIds: ['p1', 'p2'] }] },
    ]);
    const { round } = await createFriendly(ctx, draft);

    const def = (await ctx.roundService.latestDefinition(round.id))!.definition;
    expect(def.ballStrategies[0]!.strategyId).toBe('greensomes_pair');
    expect(def.ballStrategies[0]!.derivationConfig).toEqual({ type: 'weighted', lowPct: 60, highPct: 40 });

    const balls = await ctx.roundService.ballsForRound(round.id);
    // weighted 60/40 of (8,18) = 12; avg would be 13 → proves the right plan.
    expect(balls[0]!.courseHandicap).toBe(12);
});

test('2-player scramble: scramble_team/by_rank [35,15]', async () => {
    const ctx = await setup();
    const draft = await draftFor(ctx, [{ name: 'Ann', index: 8 }, { name: 'Bo', index: 18 }], [
        { formatId: 'scramble', teams: [{ label: 'A', producerDefIds: ['p1', 'p2'] }] },
    ]);
    const { round } = await createFriendly(ctx, draft);

    const def = (await ctx.roundService.latestDefinition(round.id))!.definition;
    expect(def.ballStrategies[0]!.strategyId).toBe('scramble_team');
    expect(def.ballStrategies[0]!.derivationConfig).toEqual({ type: 'by_rank', chPcts: [35, 15] });

    const balls = await ctx.roundService.ballsForRound(round.id);
    // .35*8 + .15*18 = 5.5 → round 6.
    expect(balls[0]!.courseHandicap).toBe(6);
});

test('4-player scramble: scramble_team/by_rank [25,20,15,10]', async () => {
    const ctx = await setup();
    const draft = await draftFor(
        ctx,
        [{ name: 'Ann', index: 8 }, { name: 'Bo', index: 12 }, { name: 'Cy', index: 18 }, { name: 'Di', index: 24 }],
        [{ formatId: 'scramble', teams: [{ label: 'A', producerDefIds: ['p1', 'p2', 'p3', 'p4'] }] }],
    );
    const { round } = await createFriendly(ctx, draft);

    const def = (await ctx.roundService.latestDefinition(round.id))!.definition;
    expect(def.ballStrategies[0]!.strategyId).toBe('scramble_team');
    expect(def.ballStrategies[0]!.derivationConfig).toEqual({ type: 'by_rank', chPcts: [25, 20, 15, 10] });

    const balls = await ctx.roundService.ballsForRound(round.id);
    // .25*8 + .20*12 + .15*18 + .10*24 = 9.5 → round 10.
    expect(balls[0]!.courseHandicap).toBe(10);
});

test('per-slot split allowance band config persists on the slot', async () => {
    const ctx = await setup();
    const draft = await draftFor(ctx, [{ name: 'Ann', index: 8 }, { name: 'Bo', index: 14 }], [
        {
            formatId: 'stableford_individual',
            allowanceConfig: {
                type: 'split',
                bands: [
                    { pct: 100, upToCh: 9 },
                    { pct: 75, upToCh: null },
                ],
            },
        },
    ]);
    const { round } = await createFriendly(ctx, draft);
    const slot = round.formatSlots[0]!;
    expect(slot.allowanceConfig).toEqual({
        type: 'split',
        bands: [
            { pct: 100, upToCh: 9 },
            { pct: 75, upToCh: null },
        ],
    });
});

test('invalid setup yields structured diagnostics at the offending control, never a 500', async () => {
    const ctx = await setup();
    // Scramble with no teams supplied → planner/compiler complains; no throw.
    const draft = await draftFor(ctx, [{ name: 'Ann', index: 8 }, { name: 'Bo', index: 18 }], [
        { formatId: 'scramble' },
    ]);
    const result = await ctx.friendlyRoundService.create(draft);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics.every((d) => typeof d.code === 'string')).toBe(true);
});
