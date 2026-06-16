// ADR-0002 gate — score a team composition's balls with another format.
//
// A scramble composition produces two team balls; a match-play slot and a
// stableford slot both score THOSE team balls (via `ballsFrom`) instead of
// creating own-balls. Proves the whole decoupling end to end through the
// no-login front door:
//   - the builder wires the scoring slots' ballSelector to the scramble
//     strategy (no extra own-ball strategies, no duplicate balls);
//   - the compiler accepts the team balls for the `scoresAnyBall` formats;
//   - scoring runs over the team balls (match summary + stableford ranking),
//     inheriting the team handicap.
// Scratch handicaps (index 0) keep the arithmetic a clean hand oracle.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundSetupDraft } from '../domain/round-setup/draft';

async function setup() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'CS GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'CS Links',
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

// Four scratch players in two scramble teams: A = {A1,A2}, B = {B1,B2}.
async function scrambleDraft(ctx: Awaited<ReturnType<typeof setup>>): Promise<RoundSetupDraft> {
    const names = ['A1', 'A2', 'B1', 'B2'];
    const producers = [];
    for (let i = 0; i < names.length; i++) {
        const g = await ctx.guestPlayerService.create({ displayName: names[i]!, gender: 'M', handicapIndex: 0 });
        producers.push({
            producerDefId: `p${i + 1}`,
            playerRef: { kind: 'guest' as const, id: g.id },
            handicapIndex: 0,
            gender: 'M' as const,
            teeId: ctx.teeId,
        });
    }
    return {
        courseId: ctx.courseId,
        playedAt: '2026-06-17',
        roundType: 'full_18',
        producers,
        formats: [
            {
                formatId: 'scramble',
                id: 'scr',
                teams: [
                    { label: 'A', producerDefIds: ['p1', 'p2'] },
                    { label: 'B', producerDefIds: ['p3', 'p4'] },
                ],
            },
            { formatId: 'match_play_individual', ballsFrom: { ref: 'scr' } },
            { formatId: 'stableford_individual', ballsFrom: { ref: 'scr' } },
        ],
    };
}

test('builder wires the scoring slots to the scramble balls — no duplicate ball creation', async () => {
    const ctx = await setup();
    const result = await ctx.friendlyRoundService.create(await scrambleDraft(ctx));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));

    const def = (await ctx.roundService.latestDefinition(result.round.id))!.definition;
    // Exactly ONE ball-creation strategy — the scramble team (no own-ball added
    // for the match/stableford slots).
    expect(def.ballStrategies.map((s) => s.strategyId)).toEqual(['scramble_team']);
    const scrStratId = def.ballStrategies[0]!.id;

    const byFormat = new Map(def.slots.map((s) => [s.formatId, s]));
    // The scramble slot AND both scoring slots all select the scramble strategy.
    expect(byFormat.get('scramble')!.ballSelector.strategyDefIds).toEqual([scrStratId]);
    expect(byFormat.get('match_play_individual')!.ballSelector.strategyDefIds).toEqual([scrStratId]);
    expect(byFormat.get('stableford_individual')!.ballSelector.strategyDefIds).toEqual([scrStratId]);

    // Two team balls, each two producers, scratch handicap.
    const balls = await ctx.roundService.ballsForRound(result.round.id);
    expect(balls).toHaveLength(2);
    for (const b of balls) expect(b.players).toHaveLength(2);
});

test('match play + stableford score the two scramble teams head-to-head', async () => {
    const ctx = await setup();
    const created = await ctx.friendlyRoundService.create(await scrambleDraft(ctx));
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error(JSON.stringify(created.diagnostics));
    const { round, friendlyRound } = created;
    const token = friendlyRound.shareToken;

    const balls = (await ctx.friendlyRoundService.ballsByToken(token))!;
    const teamA = balls.find((b) => b.players.some((p) => p.displayName === 'A1'))!;
    const teamB = balls.find((b) => b.players.some((p) => p.displayName === 'B1'))!;
    const occ = round.playingGroups[0]!.playedOrder;

    // Par 4 holes. Team A: par then birdie. Team B: bogey then par. (Scratch, so
    // net == gross.)
    const enter = (ballId: string, playHoleId: string, strokes: number, n: string) =>
        ctx.friendlyRoundService.appendScoreByToken({
            token,
            ballId,
            playHoleId,
            strokes,
            eventType: 'score_entered',
            clientEventId: n,
        });
    await enter(teamA.id, occ[0]!.playHoleId, 4, 'a1');
    await enter(teamA.id, occ[1]!.playHoleId, 3, 'a2');
    await enter(teamB.id, occ[0]!.playHoleId, 5, 'b1');
    await enter(teamB.id, occ[1]!.playHoleId, 4, 'b2');

    const res = (await ctx.friendlyRoundService.resultByToken(token))!;

    // Stableford over the teams: A = par(2) + birdie(3) = 5; B = bogey(1) + par(2) = 3.
    const sf = res.slots.find((s) => s.formatId === 'stableford_individual')!;
    const ranked = sf.leaderboard.find((s) => s.kind === 'ranked')!;
    const totalFor = (ballId: string) => ranked.entries.find((e) => e.ballIds[0] === ballId)?.total;
    expect(totalFor(teamA.id)).toBe(5);
    expect(totalFor(teamB.id)).toBe(3);
    expect(ranked.entries[0]!.ballIds[0]).toBe(teamA.id); // A ranks first

    // Match play over the teams: A won both holes → 2 UP, still in progress.
    const mp = res.slots.find((s) => s.formatId === 'match_play_individual')!;
    const summary = mp.leaderboard.find((s) => s.kind === 'match_summary');
    expect(summary).toBeTruthy();
    const flat = JSON.stringify(summary);
    expect(flat).toContain('2 UP');
    // The line references both team balls.
    expect(flat).toContain(teamA.id);
    expect(flat).toContain(teamB.id);
});

test('a non-scoresAnyBall format cannot score a composition (structured diagnostic)', async () => {
    const ctx = await setup();
    const draft = await scrambleDraft(ctx);
    // Umbrella does not opt into scoresAnyBall.
    draft.formats = [
        draft.formats[0]!, // scramble composition
        { formatId: 'umbrella_individual', ballsFrom: { ref: 'scr' } },
    ];
    const result = await ctx.friendlyRoundService.create(draft);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected rejection');
    expect(result.diagnostics.some((d) => d.code === 'format_cannot_score_composition')).toBe(true);
});

test('an unknown ballsFrom ref is a structured diagnostic', async () => {
    const ctx = await setup();
    const draft = await scrambleDraft(ctx);
    draft.formats = [
        draft.formats[0]!,
        { formatId: 'stableford_individual', ballsFrom: { ref: 'no-such-composition' } },
    ];
    const result = await ctx.friendlyRoundService.create(draft);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected rejection');
    expect(result.diagnostics.some((d) => d.code === 'unknown_balls_from_ref')).toBe(true);
});
