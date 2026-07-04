// ADR-0003 recursive teams gate — side formats consume multi-ball (side) teams
// via subjects, replacing the old per-format slot.teamGrouping authoring.
//
// A side format (better-ball) scores a set of SIDES; each side is a multi-ball
// team whose members each yield a ball. The builder derives slot.teamGrouping
// from the side subjects; the compiler buckets balls into sides by producer set;
// the format's best-of scoring is unchanged.
//
// CR=par, slope 113 → CH = index; scratch players → net == gross.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { buildRoundDefinition } from '../domain/round-setup/builder';
import type { RoundSetupDraft } from '../domain/round-setup/draft';

async function setup(playerCount: number) {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Sides GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Sides Links',
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
    for (let i = 0; i < playerCount; i++) {
        players.push(
            await ctx.playerService.register({ username: `s-${i}`, password: 'password123', displayName: `P${i + 1}` }),
        );
    }
    return { ...ctx, courseId: course.id, teeId: tee.id, players };
}

function producers(teeId: string, players: { id: string }[]): RoundSetupDraft['producers'] {
    return players.map((p, i) => ({
        producerDefId: `p${i + 1}`,
        playerRef: { kind: 'player' as const, id: p.id },
        handicapIndex: 0, // scratch
        gender: 'M' as const,
        teeId,
    }));
}

// Two sides of two players each (own balls).
function twoSidesDraft(ctx: Awaited<ReturnType<typeof setup>>, formatId: string): RoundSetupDraft {
    return {
        courseId: ctx.courseId,
        playedAt: '2026-06-26',
        producers: producers(ctx.teeId, ctx.players),
        teams: [
            {
                id: 'A',
                label: 'Side A',
                kind: 'multi_ball',
                members: [{ producerDefId: 'p1', allowancePct: 100 }, { producerDefId: 'p2', allowancePct: 100 }],
            },
            {
                id: 'B',
                label: 'Side B',
                kind: 'multi_ball',
                members: [{ producerDefId: 'p3', allowancePct: 100 }, { producerDefId: 'p4', allowancePct: 100 }],
            },
        ],
        formats: [{ formatId, subjects: [{ kind: 'team', teamId: 'A' }, { kind: 'team', teamId: 'B' }] }],
    };
}

test('better-ball over two side subjects: 4 own balls, slot.teamGrouping derived from sides', async () => {
    const ctx = await setup(4);
    const result = await ctx.roundService.createFromDraft(twoSidesDraft(ctx, 'stableford_better_ball'));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));

    const balls = await ctx.roundService.ballsForRound(result.round.id);
    expect(balls).toHaveLength(4); // four own balls (no merged team balls)
    for (const b of balls) expect(b.players).toHaveLength(1);

    const def = (await ctx.roundService.latestDefinition(result.round.id))!.definition;
    const slot = def.slots.find((s) => s.formatId === 'stableford_better_ball')!;
    expect(slot.teamGrouping?.teams).toHaveLength(2);
    expect(slot.teamGrouping!.teams.map((t) => t.producerDefIds.sort())).toEqual([
        ['p1', 'p2'],
        ['p3', 'p4'],
    ]);
});

test('better-ball best-of-side scoring matches a hand oracle', async () => {
    const ctx = await setup(4);
    const created = await ctx.roundService.createFromDraft(twoSidesDraft(ctx, 'stableford_better_ball'));
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error(JSON.stringify(created.diagnostics));

    const balls = await ctx.roundService.ballsForRound(created.round.id);
    const ballOf = (name: string) => balls.find((b) => b.players[0]!.displayName === name)!;
    const occ = created.round.playHoles.map((p) => p.id);

    // Par 4, scratch. Hole 1: P1 par(2) P2 birdie(3) P3 bogey(1) P4 par(2).
    //                Hole 2: P1 bogey(1) P2 bogey(1) P3 birdie(3) P4 par(2).
    // Best-of-side: A = max(2,3)+max(1,1) = 4; B = max(1,2)+max(3,2) = 5.
    const scores: [string, number, number][] = [
        ['P1', 4, 5],
        ['P2', 3, 5],
        ['P3', 5, 3],
        ['P4', 4, 4],
    ];
    let ev = 0;
    for (const [name, h1, h2] of scores) {
        const ballId = ballOf(name).id;
        await ctx.scoreEventService.append({ roundId: created.round.id, ballId, playHoleId: occ[0]!, strokes: h1, eventType: 'score_entered', clientEventId: `e${ev++}` });
        await ctx.scoreEventService.append({ roundId: created.round.id, ballId, playHoleId: occ[1]!, strokes: h2, eventType: 'score_entered', clientEventId: `e${ev++}` });
    }

    const rr = await ctx.leaderboardService.resultForRound(created.round.id);
    const slot = rr.slots.find((s) => s.formatId === 'stableford_better_ball')!;
    const ranked = slot.leaderboard.find((s) => s.kind === 'ranked')!;
    expect(ranked.entries).toHaveLength(2); // two sides
    expect(ranked.entries.map((e) => e.total ?? 0).sort((a, b) => a - b)).toEqual([4, 5]);
    expect(ranked.entries[0]!.total).toBe(5); // Side B wins (points: high)
});

test('a side format playing allowance threads to the slot (better-ball @ 90%)', async () => {
    const ctx = await setup(4);
    const draft = twoSidesDraft(ctx, 'stableford_better_ball');
    draft.formats[0]!.allowanceConfig = { type: 'flat', pct: 90 };
    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
    const def = (await ctx.roundService.latestDefinition(result.round.id))!.definition;
    const slot = def.slots.find((s) => s.formatId === 'stableford_better_ball')!;
    expect(slot.allowanceConfig).toEqual({ type: 'flat', pct: 90 });
});

// Two sides of THREE players each (own balls) — the user's reported scenario.
function twoSidesOfThreeDraft(
    ctx: Awaited<ReturnType<typeof setup>>,
    formatId: string,
): RoundSetupDraft {
    return {
        courseId: ctx.courseId,
        playedAt: '2026-06-26',
        producers: producers(ctx.teeId, ctx.players),
        teams: [
            {
                id: 'A',
                label: 'Team A',
                kind: 'multi_ball',
                members: [
                    { producerDefId: 'p1', allowancePct: 100 },
                    { producerDefId: 'p2', allowancePct: 100 },
                    { producerDefId: 'p3', allowancePct: 100 },
                ],
            },
            {
                id: 'B',
                label: 'Team B',
                kind: 'multi_ball',
                members: [
                    { producerDefId: 'p4', allowancePct: 100 },
                    { producerDefId: 'p5', allowancePct: 100 },
                    { producerDefId: 'p6', allowancePct: 100 },
                ],
            },
        ],
        formats: [{ formatId, subjects: [{ kind: 'team', teamId: 'A' }, { kind: 'team', teamId: 'B' }] }],
    };
}

test('GATE: 6 players, Stableford better-ball, 2 teams of 3 → builds + compiles end-to-end', async () => {
    const ctx = await setup(6);
    const result = await ctx.roundService.createFromDraft(
        twoSidesOfThreeDraft(ctx, 'stableford_better_ball'),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));

    const balls = await ctx.roundService.ballsForRound(result.round.id);
    expect(balls).toHaveLength(6); // six own balls (no merged team balls)
    for (const b of balls) expect(b.players).toHaveLength(1);

    const def = (await ctx.roundService.latestDefinition(result.round.id))!.definition;
    const slot = def.slots.find((s) => s.formatId === 'stableford_better_ball')!;
    expect(slot.teamGrouping!.teams.map((t) => t.producerDefIds.slice().sort())).toEqual([
        ['p1', 'p2', 'p3'],
        ['p4', 'p5', 'p6'],
    ]);
});

test('GATE: best-of-3 better-ball scoring over two teams of three matches a hand oracle', async () => {
    const ctx = await setup(6);
    const created = await ctx.roundService.createFromDraft(
        twoSidesOfThreeDraft(ctx, 'stableford_better_ball'),
    );
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error(JSON.stringify(created.diagnostics));

    const balls = await ctx.roundService.ballsForRound(created.round.id);
    const ballOf = (name: string) => balls.find((b) => b.players[0]!.displayName === name)!;
    const occ = created.round.playHoles.map((p) => p.id);

    // Par 4, scratch. Hole 1: A = bogey/par/birdie → best 3; B = all bogey → 1.
    //                 Hole 2: A = all par → 2; B = par/birdie/bogey → best 3.
    // Team totals: A = 3 + 2 = 5; B = 1 + 3 = 4.
    const scores: [string, number, number][] = [
        ['P1', 5, 4],
        ['P2', 4, 4],
        ['P3', 3, 4],
        ['P4', 5, 4],
        ['P5', 5, 3],
        ['P6', 5, 5],
    ];
    let ev = 0;
    for (const [name, h1, h2] of scores) {
        const ballId = ballOf(name).id;
        await ctx.scoreEventService.append({ roundId: created.round.id, ballId, playHoleId: occ[0]!, strokes: h1, eventType: 'score_entered', clientEventId: `e${ev++}` });
        await ctx.scoreEventService.append({ roundId: created.round.id, ballId, playHoleId: occ[1]!, strokes: h2, eventType: 'score_entered', clientEventId: `e${ev++}` });
    }

    const rr = await ctx.leaderboardService.resultForRound(created.round.id);
    const slot = rr.slots.find((s) => s.formatId === 'stableford_better_ball')!;
    const ranked = slot.leaderboard.find((s) => s.kind === 'ranked')!;
    expect(ranked.entries).toHaveLength(2); // two teams of three
    expect(ranked.entries.map((e) => e.total ?? 0).sort((a, b) => a - b)).toEqual([4, 5]);
    // Each team entry resolves to its three member ball ids.
    for (const e of ranked.entries) expect(e.ballIds).toHaveLength(3);
});

test('match-play better-ball over two side subjects compiles (4 balls, 2 sides)', async () => {
    const ctx = await setup(4);
    const result = await ctx.roundService.createFromDraft(twoSidesDraft(ctx, 'match_play_better_ball'));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
    const def = (await ctx.roundService.latestDefinition(result.round.id))!.definition;
    expect(def.slots[0]!.teamGrouping?.teams).toHaveLength(2);
});

test('NESTED: two sides each of two scramble teams → better-ball over 4 team balls', async () => {
    // The motivating case: 8 players → 4 two-man scramble teams (single-ball) →
    // 2 sides of 2 scramble teams → match-play better-ball (best scramble ball
    // per side, head to head).
    const ctx = await setup(8);
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-26',
        producers: producers(ctx.teeId, ctx.players),
        teams: [
            // four single-ball scramble teams
            { id: 'SA', label: 'SA', formation: 'scramble', members: [{ producerDefId: 'p1', allowancePct: 35 }, { producerDefId: 'p2', allowancePct: 15 }] },
            { id: 'SB', label: 'SB', formation: 'scramble', members: [{ producerDefId: 'p3', allowancePct: 35 }, { producerDefId: 'p4', allowancePct: 15 }] },
            { id: 'SC', label: 'SC', formation: 'scramble', members: [{ producerDefId: 'p5', allowancePct: 35 }, { producerDefId: 'p6', allowancePct: 15 }] },
            { id: 'SD', label: 'SD', formation: 'scramble', members: [{ producerDefId: 'p7', allowancePct: 35 }, { producerDefId: 'p8', allowancePct: 15 }] },
            // two sides, each grouping two scramble teams (nested members)
            { id: 'X', label: 'Side X', kind: 'multi_ball', members: [{ teamId: 'SA' }, { teamId: 'SB' }] },
            { id: 'Y', label: 'Side Y', kind: 'multi_ball', members: [{ teamId: 'SC' }, { teamId: 'SD' }] },
        ],
        formats: [{ formatId: 'match_play_better_ball', subjects: [{ kind: 'team', teamId: 'X' }, { kind: 'team', teamId: 'Y' }] }],
    };

    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));

    const balls = await ctx.roundService.ballsForRound(result.round.id);
    expect(balls).toHaveLength(4); // four scramble team balls
    for (const b of balls) expect(b.players).toHaveLength(2);

    const def = (await ctx.roundService.latestDefinition(result.round.id))!.definition;
    const slot = def.slots.find((s) => s.formatId === 'match_play_better_ball')!;
    expect(slot.teamGrouping?.teams).toHaveLength(2);
    expect(slot.teamGrouping!.teams.map((t) => t.producerDefIds.slice().sort())).toEqual([
        ['p1', 'p2', 'p3', 'p4'],
        ['p5', 'p6', 'p7', 'p8'],
    ]);
});

test('a side format given a single-ball (merge) team is a structured diagnostic', async () => {
    const ctx = await setup(4);
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-26',
        producers: producers(ctx.teeId, ctx.players),
        teams: [
            // single_ball (default kind) — a merged composition, NOT a side.
            { id: 'M', label: 'Merge', members: [{ producerDefId: 'p1', allowancePct: 50 }, { producerDefId: 'p2', allowancePct: 50 }] },
            { id: 'N', label: 'Merge2', members: [{ producerDefId: 'p3', allowancePct: 50 }, { producerDefId: 'p4', allowancePct: 50 }] },
        ],
        formats: [{ formatId: 'stableford_better_ball', subjects: [{ kind: 'team', teamId: 'M' }, { kind: 'team', teamId: 'N' }] }],
    };
    const r = buildRoundDefinition(draft);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected rejection');
    expect(r.diagnostics.some((d) => d.code === 'side_format_requires_side_subjects')).toBe(true);
});

test('a ball format given a multi-ball (side) team is a structured diagnostic', async () => {
    const ctx = await setup(4);
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-26',
        producers: producers(ctx.teeId, ctx.players),
        teams: [
            { id: 'A', label: 'Side A', kind: 'multi_ball', members: [{ producerDefId: 'p1', allowancePct: 100 }, { producerDefId: 'p2', allowancePct: 100 }] },
        ],
        // stableford_individual ranks balls; a side team is not a ball.
        formats: [{ formatId: 'stableford_individual', subjects: [{ kind: 'team', teamId: 'A' }] }],
    };
    const r = buildRoundDefinition(draft);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected rejection');
    expect(r.diagnostics.some((d) => d.code === 'ball_format_rejects_side_subject')).toBe(true);
});
