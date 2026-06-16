// Phase 2.6d-final E1 — plugin-owned setup + config validation.
//
// The draft path (RoundSetupDraft → buildRoundDefinition → compile) must emit
// each team format's ACTUAL ball-creation plan, not a generic alt_shot_pair/avg:
//   - Greensomes → greensomes_pair / weighted 60/40
//   - Scramble   → scramble_team / by_rank, %s by team size (2 vs 4)
// and real validateConfig must surface invalid format config as a COMPILE
// diagnostic, never a scoring-time throw.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import { buildRoundDefinition } from '../domain/round-setup/builder';
import type { RoundSetupDraft } from '../domain/round-setup/draft';

async function setup() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Draft GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Drafter',
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
    for (const u of ['ann', 'bo', 'cal', 'dan']) {
        players.push(await ctx.playerService.register({ username: u, password: 'password123', displayName: u }));
    }
    return { ...ctx, courseId: course.id, teeId: tee.id, players };
}

// CR=par, slope 113 → CH = index. So indices 8/12/18/24 → CH 8/12/18/24.
function producers(teeId: string, players: { id: string }[], indices: number[]): RoundSetupDraft['producers'] {
    return players.slice(0, indices.length).map((p, i) => ({
        producerDefId: `p${i + 1}`,
        playerRef: { kind: 'player' as const, id: p.id },
        handicapIndex: indices[i]!,
        gender: 'M' as const,
        teeId,
    }));
}

test('greensomes draft emits greensomes_pair/weighted, not alt_shot/avg (E1)', async () => {
    const ctx = await setup();
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-01',
        producers: producers(ctx.teeId, ctx.players, [8, 18]),
        formats: [{ formatId: 'greensomes', teams: [{ label: 'A', producerDefIds: ['p1', 'p2'] }] }],
    };

    const built = buildRoundDefinition(draft);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.definition.ballStrategies).toHaveLength(1);
    expect(built.definition.ballStrategies[0]!.strategyId).toBe('greensomes_pair');
    expect(built.definition.ballStrategies[0]!.derivationConfig).toEqual({
        type: 'weighted',
        lowPct: 60,
        highPct: 40,
    });

    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const balls = await ctx.roundService.ballsForRound(result.round.id);
    expect(balls).toHaveLength(1);
    // weighted 60/40 of (8,18) = 12. avg would be 13 — proves the right plan.
    expect(balls[0]!.courseHandicap).toBe(12);

    // Successful scoring through the real engine.
    const occ = result.round.playHoles.map((p) => p.id);
    for (let i = 0; i < occ.length; i++) {
        await ctx.scoreEventService.append({
            roundId: result.round.id, ballId: balls[0]!.id, playHoleId: occ[i]!,
            strokes: 4, eventType: 'score_entered', clientEventId: `g${i}`,
        });
    }
    const rr = await ctx.leaderboardService.resultForRound(result.round.id);
    const gross = rr.slots[0]!.leaderboard.find((l) => l.kind === 'ranked' && l.metricId === 'gross');
    expect(gross && gross.kind === 'ranked' ? gross.entries[0]!.total : null).toBe(occ.length * 4);
});

test('4-player scramble draft emits scramble_team/by_rank [25,20,15,10] (E1)', async () => {
    const ctx = await setup();
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-01',
        producers: producers(ctx.teeId, ctx.players, [8, 12, 18, 24]),
        formats: [{ formatId: 'scramble', teams: [{ label: 'A', producerDefIds: ['p1', 'p2', 'p3', 'p4'] }] }],
    };
    const built = buildRoundDefinition(draft);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.definition.ballStrategies[0]!.strategyId).toBe('scramble_team');
    expect(built.definition.ballStrategies[0]!.derivationConfig).toEqual({
        type: 'by_rank',
        chPcts: [25, 20, 15, 10],
    });

    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const balls = await ctx.roundService.ballsForRound(result.round.id);
    expect(balls).toHaveLength(1);
    // by_rank: .25*8 + .20*12 + .15*18 + .10*24 = 9.5 → round 10.
    expect(balls[0]!.courseHandicap).toBe(10);
});

test('2-player scramble draft uses [35,15] by team size (E1)', async () => {
    const ctx = await setup();
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-01',
        producers: producers(ctx.teeId, ctx.players, [8, 18]),
        formats: [{ formatId: 'scramble', teams: [{ label: 'A', producerDefIds: ['p1', 'p2'] }] }],
    };
    const built = buildRoundDefinition(draft);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.definition.ballStrategies[0]!.derivationConfig).toEqual({
        type: 'by_rank',
        chPcts: [35, 15],
    });
    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const balls = await ctx.roundService.ballsForRound(result.round.id);
    // by_rank: .35*8 + .15*18 = 5.5 → round 6.
    expect(balls[0]!.courseHandicap).toBe(6);
});

test('invalid format config is a COMPILE diagnostic, not a score-time throw (E1)', async () => {
    const ctx = await setup();
    const kop: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-01',
        producers: producers(ctx.teeId, ctx.players, [8, 12, 18]),
        formats: [{ formatId: 'kopenhamnare_individual', formatConfig: { handicapMode: 'bogus' } }],
    };
    const kopResult = await ctx.roundService.createFromDraft(kop);
    expect(kopResult.ok).toBe(false);
    if (kopResult.ok) return;
    expect(kopResult.diagnostics.some((d) => d.code === 'kopenhamnare_handicap_mode_invalid')).toBe(true);

    const umb: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-01',
        producers: producers(ctx.teeId, ctx.players, [8, 12, 18]),
        formats: [{ formatId: 'umbrella_individual', formatConfig: { birdieRule: 'sideways' } }],
    };
    const umbResult = await ctx.roundService.createFromDraft(umb);
    expect(umbResult.ok).toBe(false);
    if (umbResult.ok) return;
    expect(umbResult.diagnostics.some((d) => d.code === 'umbrella_birdie_rule_invalid')).toBe(true);
});

test('CONTRACT: config accepted by compile() is consumable by score() (E1)', async () => {
    const ctx = await setup();
    // Valid Köpenhamnare config compiles AND scores with no config-shape throw.
    const draft: RoundSetupDraft = {
        courseId: ctx.courseId,
        playedAt: '2026-06-01',
        producers: producers(ctx.teeId, ctx.players, [8, 12, 18]),
        formats: [{ formatId: 'kopenhamnare_individual', formatConfig: { handicapMode: 'delta_from_min' } }],
    };
    const result = await ctx.roundService.createFromDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const balls = await ctx.roundService.ballsForRound(result.round.id);
    const occ = result.round.playHoles.map((p) => p.id);
    for (const b of balls) {
        for (let i = 0; i < occ.length; i++) {
            await ctx.scoreEventService.append({
                roundId: result.round.id, ballId: b.id, playHoleId: occ[i]!,
                strokes: 4, eventType: 'score_entered', clientEventId: `${b.id}-${i}`,
            });
        }
    }
    // Must not throw on a config the compiler accepted.
    const rr = await ctx.leaderboardService.resultForRound(result.round.id);
    expect(rr.slots).toHaveLength(1);
});
