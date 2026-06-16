// Phase 2.6d-final E2b — score_events have ONE persisted total order that does
// not depend on wall-clock `recorded_at`. The scorecard trigger (materialized
// view), the replay path (leaderboard), and the latest-score reducer must all
// agree on which edit wins, including out-of-order client clocks and ties.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { createCompiledRound } from '../testing/compiler-rounds';
import type { RankedSection, RoundResult } from '../domain/strategies/result-sections';

function gross(rr: RoundResult): number | null {
    const slot = rr.slots.find((s) => s.slotIndex === 0)!;
    const sec = slot.leaderboard.find(
        (l): l is RankedSection => l.kind === 'ranked' && l.metricId === 'gross',
    )!;
    return sec.entries[0]!.total;
}

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
    return { ...ctx, courseId: course.id, teeId: tee.id };
}

// The LAST appended edit is the truth — regardless of a client clock that runs
// backwards. Under the old `recorded_at`-based ordering the replay path picked
// the edit with the later timestamp (the FIRST append), so the leaderboard
// disagreed with append order. seq fixes it.
test('latest edit wins by append order, not by recorded_at (E2b)', async () => {
    const ctx = await setup();
    const player = await ctx.playerService.register({ username: 'seq-p1', password: 'password123', displayName: 'Seq P1' });
    const { round, ballByProducerIndex, playHoleByCourseHole } = await createCompiledRound(ctx, {
        courseId: ctx.courseId,
        teeId: ctx.teeId,
        roundType: 'front_9',
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: player.id, handicapIndex: 0 }],
    });
    const ball = ballByProducerIndex[0]!;
    const hole1 = playHoleByCourseHole.get(1)!;

    // Par every other hole so the only contested hole is #1.
    for (let h = 2; h <= 9; h++) {
        await ctx.scoreEventService.append({
            roundId: round.id, ballId: ball, playHoleId: playHoleByCourseHole.get(h)!,
            strokes: 4, eventType: 'score_entered', clientEventId: `h${h}`,
        });
    }

    // Edit 1 (appended FIRST): strokes 8, recorded LATER on the wall clock.
    await ctx.scoreEventService.append({
        roundId: round.id, ballId: ball, playHoleId: hole1,
        strokes: 8, eventType: 'score_entered', clientEventId: 'h1-a',
        recordedAt: '2026-01-01T00:00:09Z',
    });
    // Edit 2 (appended SECOND = the truth): strokes 4, recorded EARLIER.
    await ctx.scoreEventService.append({
        roundId: round.id, ballId: ball, playHoleId: hole1,
        strokes: 4, eventType: 'score_entered', clientEventId: 'h1-b',
        recordedAt: '2026-01-01T00:00:01Z',
    });

    // Truth = last appended edit = 4 → gross 9 × par 4 = 36. Bug → 8 wins → 40.
    const rr1 = await ctx.leaderboardService.resultForRound(round.id);
    expect(gross(rr1)).toBe(36);

    // Materialized scorecard agrees with the leaderboard.
    const sc = await ctx.scorecardService.forBall(ball);
    const h1 = sc.holes.find((h) => h.playHoleId === hole1)!;
    expect(h1.strokes).toBe(4);

    // Stable across repeated reads.
    const rr2 = await ctx.leaderboardService.resultForRound(round.id);
    expect(gross(rr2)).toBe(36);
});
