// Guard for the helper's alt-shot PAIR path (`pairBalls: true`).
//
// This path rotted once: it emitted `strategyId: 'alt_shot_pair'` and
// `formatId: 'stroke_play_foursomes'` long after ADR-0003 deleted both, and
// nothing exercised it. Post-ADR-0003 a pair is a `team_ball` composition
// (50/50 per-producer CH == the old alt-shot average) scored by a
// `scoresAnyBall` format. This test drives the path end-to-end through the
// real compiler + scoring so a stale id fails loudly instead of lurking.

import { test, expect } from 'bun:test';
import { createTestDb } from './db';
import { createCompiledRound } from './compiler-rounds';

// Tee rated so CH(index) == index (slope 113, CR 72, par 72).
async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'HGC' });
    const course = await ctx.courseService.create({ clubId: club.id, name: 'North', holeCount: 18 });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'White',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    return { ctx, courseId: course.id, teeId: tee.id };
}

test('pairBalls slot compiles alt-shot pair balls (team_ball 50/50) and scores them', async () => {
    const { ctx, courseId, teeId } = await setup();

    const indices = [5, 11, 9, 17];
    const teams = ['A', 'A', 'B', 'B'];
    const players = [];
    for (let i = 0; i < 4; i++) {
        const p = await ctx.playerService.register({
            username: `pair-p${i}`,
            password: 'password123',
            displayName: `P${i}`,
        });
        players.push({
            kind: 'player' as const,
            id: p.id,
            handicapIndex: indices[i]!,
            team: teams[i]!,
        });
    }

    const { round, ballByProducerIndex, ballByTeamLabel, playHoleByCourseHole } =
        await createCompiledRound(ctx, {
            courseId,
            teeId,
            slots: [{ formatId: 'stroke_play_individual', pairBalls: true, allowancePct: 100 }],
            players,
        });

    // Two pair balls, each shared by its two members.
    const distinctBalls = [...new Set(ballByProducerIndex)];
    expect(distinctBalls).toHaveLength(2);
    expect(ballByProducerIndex[0]).toBe(ballByProducerIndex[1]!);
    expect(ballByProducerIndex[2]).toBe(ballByProducerIndex[3]!);
    expect(ballByTeamLabel.get('A')).toEqual([ballByProducerIndex[0]!]);
    expect(ballByTeamLabel.get('B')).toEqual([ballByProducerIndex[2]!]);

    // Pair CH = round(avg of member CHs); with this tee CH == handicap index.
    const ballRows = await ctx.db
        .selectFrom('balls')
        .where('round_id', '=', round.id)
        .select(['id', 'course_handicap_snapshot'])
        .execute();
    expect(ballRows).toHaveLength(2);
    const chByBall = new Map(ballRows.map((b) => [b.id, b.course_handicap_snapshot]));
    expect(chByBall.get(ballByProducerIndex[0]!)).toBe(8); // (5+11)/2
    expect(chByBall.get(ballByProducerIndex[2]!)).toBe(13); // (9+17)/2

    // Score both pair balls and confirm the slot ranks them.
    for (const ballId of distinctBalls) {
        for (let h = 1; h <= 3; h++) {
            await ctx.scoreEventService.append({
                roundId: round.id,
                ballId,
                playHoleId: playHoleByCourseHole.get(h)!,
                strokes: 4 + (h % 2),
                eventType: 'score_entered',
                clientEventId: `${ballId}-h${h}`,
            });
        }
    }
    const rr = await ctx.leaderboardService.resultForRound(round.id);
    const ranked = rr.slots.flatMap((sl) => sl.leaderboard.filter((l) => l.kind === 'ranked'));
    const gross = ranked.find((r) => r.metricId === 'gross');
    expect(gross).toBeDefined();
    expect(gross!.entries).toHaveLength(2);
});

test('pairBalls rejects a team label without exactly 2 members', async () => {
    const { ctx, courseId, teeId } = await setup();
    const p = await ctx.playerService.register({
        username: 'pair-solo',
        password: 'password123',
        displayName: 'Solo',
    });
    await expect(
        createCompiledRound(ctx, {
            courseId,
            teeId,
            slots: [{ formatId: 'stroke_play_individual', pairBalls: true }],
            players: [{ kind: 'player', id: p.id, handicapIndex: 10, team: 'A' }],
        }),
    ).rejects.toThrow(/exactly 2 producers/);
});
