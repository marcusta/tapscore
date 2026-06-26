// ADR-0003 refinements gate — the fine-grained team substrate.
//
// A round-level team is a GENERIC team_ball: 2–10 members, free per-member
// allowance % (no baked-in conventions), and a `composition` that is a pure
// display label. Any scoring format (stroke / stableford / match) scores the
// resulting team ball via its subjects. The bundled composite formats
// (scramble / greensomes / foursomes) are gone — the catalog proves it.
//
// CR=par, slope 113 → CH = handicap index, so every team CH is a hand oracle.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { formatCatalog, clearFormats } from '../domain/formats/plugin';
import type { RoundSetupDraft } from '../domain/round-setup/draft';

async function setup(playerCount: number) {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'FG GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'FG Links',
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
            await ctx.playerService.register({
                username: `fg-${i}`,
                password: 'password123',
                displayName: `P${i + 1}`,
            }),
        );
    }
    return { ...ctx, courseId: course.id, teeId: tee.id, players };
}

function producers(teeId: string, players: { id: string }[], indices: number[]): RoundSetupDraft['producers'] {
    return players.map((p, i) => ({
        producerDefId: `p${i + 1}`,
        playerRef: { kind: 'player' as const, id: p.id },
        handicapIndex: indices[i]!,
        gender: 'M' as const,
        teeId,
    }));
}

test('a 10-player team compiles to ONE team ball with the per-member allowance CH', async () => {
    const ctx = await setup(10);
    // Five CH-10 + five CH-20 players, each at 10% → round(0.1·(5·10 + 5·20)) = 15.
    const indices = [10, 10, 10, 10, 10, 20, 20, 20, 20, 20];
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-25',
        producers: producers(ctx.teeId, ctx.players, indices),
        teams: [
            {
                id: 'T',
                label: 'Dream Team',
                formation: 'scramble',
                members: ctx.players.map((_, i) => ({ producerDefId: `p${i + 1}`, allowancePct: 10 })),
            },
        ],
        formats: [{ formatId: 'stableford_individual', subjects: [{ kind: 'team', teamId: 'T' }] }],
    };

    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));

    const balls = await ctx.roundService.ballsForRound(result.round.id);
    expect(balls).toHaveLength(1);
    expect(balls[0]!.players).toHaveLength(10);
    expect(balls[0]!.courseHandicap).toBe(15);
    // Composition label folds into the team ball's display label (ADR-0003 delta 2).
    expect(balls[0]!.label).toBe('Dream Team · Scramble');
});

test('free per-member allowances flow, and stroke + stableford + match all score the team balls', async () => {
    const ctx = await setup(6);
    // Team A {p1,p2,p3} CH [10,20,30] @ free [40,30,30] → round(4+6+9) = 19.
    // Team B {p4,p5,p6} CH [10,10,10] @ free [50,30,20] → round(5+3+2) = 10.
    const indices = [10, 20, 30, 10, 10, 10];
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-25',
        producers: producers(ctx.teeId, ctx.players, indices),
        teams: [
            {
                id: 'A',
                label: 'A',
                members: [
                    { producerDefId: 'p1', allowancePct: 40 },
                    { producerDefId: 'p2', allowancePct: 30 },
                    { producerDefId: 'p3', allowancePct: 30 },
                ],
            },
            {
                id: 'B',
                label: 'B',
                members: [
                    { producerDefId: 'p4', allowancePct: 50 },
                    { producerDefId: 'p5', allowancePct: 30 },
                    { producerDefId: 'p6', allowancePct: 20 },
                ],
            },
        ],
        formats: [
            { formatId: 'stroke_play_individual', subjects: [{ kind: 'team', teamId: 'A' }, { kind: 'team', teamId: 'B' }] },
            { formatId: 'stableford_individual', subjects: [{ kind: 'team', teamId: 'A' }, { kind: 'team', teamId: 'B' }] },
            { formatId: 'match_play_individual', subjects: [{ kind: 'team', teamId: 'A' }, { kind: 'team', teamId: 'B' }] },
        ],
    };

    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));

    const balls = await ctx.roundService.ballsForRound(result.round.id);
    expect(balls).toHaveLength(2);
    const teamA = balls.find((b) => b.label === 'A')!;
    const teamB = balls.find((b) => b.label === 'B')!;
    expect(teamA.courseHandicap).toBe(19);
    expect(teamB.courseHandicap).toBe(10);

    // No own balls created — exactly the two team_ball strategies, reused across
    // all three scoring slots (match needs the 2 balls; stroke/stableford rank them).
    const def = (await ctx.roundService.latestDefinition(result.round.id))!.definition;
    expect(def.ballStrategies).toHaveLength(2);
    expect(def.ballStrategies.every((s) => s.strategyId === 'team_ball')).toBe(true);
    expect(def.slots.map((s) => s.formatId).sort()).toEqual([
        'match_play_individual',
        'stableford_individual',
        'stroke_play_individual',
    ]);
});

test('the format catalog no longer offers the bundled composite formats', () => {
    // Clear first — other suites register canary formats into the global registry.
    clearFormats();
    registerBuiltInFormats();
    const ids = formatCatalog().map((d) => d.id);
    expect(ids).toHaveLength(9);
    for (const gone of ['scramble', 'greensomes', 'stroke_play_foursomes']) {
        expect(ids).not.toContain(gone);
    }
    expect(ids).toContain('stableford_individual');
});
