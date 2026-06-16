import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { createCompiledRound } from '../testing/compiler-rounds';
import type {
    RankedSection,
    RoundResult,
    ScoreGridSection,
} from '../domain/strategies/result-sections';

// --- Section helpers (the service now returns canonical RoundResult) --------

/** The ranked leaderboard section for `metricId` within a given slot. */
function ranked(rr: RoundResult, slotIndex: number, metricId: string): RankedSection {
    const slot = rr.slots.find((s) => s.slotIndex === slotIndex);
    if (!slot) throw new Error(`no slot ${slotIndex} in result`);
    const sec = slot.leaderboard.find(
        (l): l is RankedSection => l.kind === 'ranked' && l.metricId === metricId,
    );
    if (!sec) throw new Error(`no ranked '${metricId}' section in slot ${slotIndex}`);
    return sec;
}

/** All ranked sections for `metricId` across every slot, in slot order. */
function rankedAcrossSlots(rr: RoundResult, metricId: string): (RankedSection & { slotIndex: number })[] {
    return rr.slots
        .flatMap((s) =>
            s.leaderboard
                .filter((l): l is RankedSection => l.kind === 'ranked' && l.metricId === metricId)
                .map((l) => ({ ...l, slotIndex: s.slotIndex })),
        );
}

/** The metric ids of every ranked section in a slot, sorted. */
function rankedMetrics(rr: RoundResult, slotIndex: number): string[] {
    const slot = rr.slots.find((s) => s.slotIndex === slotIndex);
    return (slot?.leaderboard ?? [])
        .filter((l): l is RankedSection => l.kind === 'ranked')
        .map((l) => l.metricId)
        .sort();
}

/** Played hole numbers for a slot's first card (= the trimmed grid columns). */
function cardHoleNumbers(rr: RoundResult, slotIndex: number): number[] {
    const slot = rr.slots.find((s) => s.slotIndex === slotIndex);
    const card = slot?.cards[0];
    if (!card) throw new Error(`no card in slot ${slotIndex}`);
    return card.holes.map((h) => h.holeNumber);
}

/** The card whose subjects include `ballId`. */
function cardFor(rr: RoundResult, slotIndex: number, ballId: string): ScoreGridSection {
    const slot = rr.slots.find((s) => s.slotIndex === slotIndex);
    const card = slot?.cards.find((c) => c.subjectBallIds.includes(ballId));
    if (!card) throw new Error(`no card for ball ${ballId} in slot ${slotIndex}`);
    return card;
}

/**
 * Shared setup: an 18-hole par-4 course at HGC with a single tee rated so
 * `courseHandicap(index=9)` = 9 (slope 113, CR 72, par 72 → slope/113 = 1,
 * CR−par = 0, so CH = index = 9). Means a producer with handicapIndex 9
 * gets playing_handicap 9 exactly.
 */
async function setup18() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'HGC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'North',
        holeCount: 18,
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'White',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    return { ...ctx, courseId: course.id, teeId: tee.id };
}

test('front_9 round distributes PH across the 9 played holes only', async () => {
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const alice = await ctx.playerService.register({ username: 'front9-p1', password: 'password123', displayName: 'Front9 P1' });
    const { round, ballByProducerIndex, playHoleByCourseHole } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        roundType: 'front_9',
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: alice.id, handicapIndex: 9 }],
    });
    const ball = ballByProducerIndex[0]!;
    // PH 9 over 9 holes: baseline = 1, extras = 0 → +1 stroke on every hole.
    for (let h = 1; h <= 9; h++) {
        await scoreEventService.append({
            roundId: round.id,
            ballId: ball,
            playHoleId: playHoleByCourseHole.get(h)!,
            strokes: 5, // bogey
            eventType: 'score_entered',
            clientEventId: `h${h}`,
        });
    }

    const rr = await leaderboardService.resultForRound(round.id);
    expect(ranked(rr, 0, 'gross').entries[0]!.total).toBe(45); // 9 × bogey 5
    expect(ranked(rr, 0, 'net').entries[0]!.total).toBe(36);   // minus 9 strokes given
    expect(cardHoleNumbers(rr, 0)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('back_9 round uses holes 10..18 only', async () => {
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const pl = await ctx.playerService.register({ username: 'back9-p1', password: 'password123', displayName: 'Back9 P1' });
    const { round, ballByProducerIndex, playHoleByCourseHole } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        roundType: 'back_9',
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: pl.id, handicapIndex: 9 }],
    });
    const ball = ballByProducerIndex[0]!;
    for (let h = 10; h <= 18; h++) {
        await scoreEventService.append({
            roundId: round.id,
            ballId: ball,
            playHoleId: playHoleByCourseHole.get(h)!,
            strokes: 4,
            eventType: 'score_entered',
            clientEventId: `h${h}`,
        });
    }

    const rr = await leaderboardService.resultForRound(round.id);
    expect(ranked(rr, 0, 'gross').entries[0]!.total).toBe(36); // 9 × par 4
    expect(cardHoleNumbers(rr, 0)).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18]);
});

test('9-hole allocation follows full-18 SI distribution (strokes land only where they fall)', async () => {
    // Course with scrambled SIs: front 9 carries SIs 10..18, back 9 carries SIs 1..9.
    // A PH=9 player has extras=9 → SI 1..9 all get +1. On front_9 that yields
    // ZERO strokes (front 9's SIs are 10..18). On back_9 it yields nine strokes.
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'HGC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Weird',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            par: 4,
            // holes 1..9 → SIs 10..18; holes 10..18 → SIs 1..9
            strokeIndex: i < 9 ? i + 10 : i - 8,
        })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'White',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });

    const plFront = await ctx.playerService.register({ username: 'si-front', password: 'password123', displayName: 'SI Front' });
    const { round: frontRound, ballByProducerIndex: frontBalls, playHoleByCourseHole: frontPlayHoles } = await createCompiledRound(ctx, {
        courseId: course.id,
        teeId: tee.id,
        roundType: 'front_9',
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: plFront.id, handicapIndex: 9 }],
    });
    const frontBall = frontBalls[0]!;
    for (let h = 1; h <= 9; h++) {
        await ctx.scoreEventService.append({
            roundId: frontRound.id,
            ballId: frontBall,
            playHoleId: frontPlayHoles.get(h)!,
            strokes: 5,
            eventType: 'score_entered',
            clientEventId: `f${h}`,
        });
    }
    const frontRr = await ctx.leaderboardService.resultForRound(frontRound.id);
    // 9 bogeys, no strokes given on any of these holes → net = gross.
    expect(ranked(frontRr, 0, 'gross').entries[0]!.total).toBe(45);
    expect(ranked(frontRr, 0, 'net').entries[0]!.total).toBe(45);

    const plBack = await ctx.playerService.register({ username: 'si-back', password: 'password123', displayName: 'SI Back' });
    const { round: backRound, ballByProducerIndex: backBalls, playHoleByCourseHole: backPlayHoles } = await createCompiledRound(ctx, {
        courseId: course.id,
        teeId: tee.id,
        roundType: 'back_9',
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: plBack.id, handicapIndex: 9 }],
    });
    const backBall = backBalls[0]!;
    for (let h = 10; h <= 18; h++) {
        await ctx.scoreEventService.append({
            roundId: backRound.id,
            ballId: backBall,
            playHoleId: backPlayHoles.get(h)!,
            strokes: 5,
            eventType: 'score_entered',
            clientEventId: `b${h}`,
        });
    }
    const backRr = await ctx.leaderboardService.resultForRound(backRound.id);
    // 9 bogeys, every hole gets +1 → net = gross − 9 = 36.
    expect(ranked(backRr, 0, 'gross').entries[0]!.total).toBe(45);
    expect(ranked(backRr, 0, 'net').entries[0]!.total).toBe(36);
});

test('full_18 round still covers all 18 holes', async () => {
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const pl = await ctx.playerService.register({ username: 'full18-p1', password: 'password123', displayName: 'Full18 P1' });
    const { round, ballByProducerIndex, playHoleByCourseHole } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: pl.id, handicapIndex: 9 }],
    });
    const ball = ballByProducerIndex[0]!;
    for (let h = 1; h <= 18; h++) {
        await scoreEventService.append({
            roundId: round.id,
            ballId: ball,
            playHoleId: playHoleByCourseHole.get(h)!,
            strokes: 4,
            eventType: 'score_entered',
            clientEventId: `h${h}`,
        });
    }
    const rr = await leaderboardService.resultForRound(round.id);
    expect(cardHoleNumbers(rr, 0)).toHaveLength(18);
});

test("better-ball leaderboard uses each linked player's own frozen PH", async () => {
    // Own-ball topology: alice + bob each have their own ball; the slot
    // groups them into team 'Alice & Bob'. On hole 5 (SI 5):
    //   - alice (HI 0 → CH 0 → PH 0) scores 4: par, 2 stableford points.
    //   - bob (HI 14 → CH 14 → PH 14) scores 4: gets 1 stroke (SI 5),
    //     net 3, 3 stableford points.
    //   - team (better-ball = max points) = 3.
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const alice = await ctx.playerService.register({
        username: 'alice-bb',
        password: 'password123',
        displayName: 'Alice BB',
    });
    const bob = await ctx.playerService.register({
        username: 'bob',
        password: 'password123',
        displayName: 'Bob',
    });
    // Better-ball needs a second team to satisfy the format's team grouping
    // requirement. Throwaway opposing pair that we don't score.
    const carol = await ctx.playerService.register({
        username: 'carol-bb',
        password: 'password123',
        displayName: 'Carol BB',
    });
    const dan = await ctx.playerService.register({
        username: 'dan-bb',
        password: 'password123',
        displayName: 'Dan BB',
    });
    const { round, ballByProducerIndex, playHoleByCourseHole } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: 'stableford_better_ball', allowancePct: 100 }],
        players: [
            { kind: 'player', id: alice.id, handicapIndex: 0, team: 'Alice & Bob' },
            { kind: 'player', id: bob.id, handicapIndex: 14, team: 'Alice & Bob' },
            { kind: 'player', id: carol.id, handicapIndex: 9, team: 'Carol & Dan' },
            { kind: 'player', id: dan.id, handicapIndex: 9, team: 'Carol & Dan' },
        ],
    });
    const aliceBall = ballByProducerIndex[0]!;
    const bobBall = ballByProducerIndex[1]!;
    await scoreEventService.append({
        roundId: round.id,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(5)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'alice-h5',
    });
    await scoreEventService.append({
        roundId: round.id,
        ballId: bobBall,
        playHoleId: playHoleByCourseHole.get(5)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'bob-h5',
    });

    const rr = await leaderboardService.resultForRound(round.id);
    // The team's ranked points entry resolves to its member ball ids (no
    // synthetic `team:` id leaks into the sections), and the team card's
    // per-hole "Team points" row shows the better-ball pick on hole 5.
    const pts = ranked(rr, 0, 'points');
    const teamEntry = pts.entries.find((e) => e.ballIds.includes(aliceBall))!;
    expect(teamEntry.total).toBe(3);
    const card = cardFor(rr, 0, aliceBall);
    const teamPointsRow = card.rows.find((r) => r.label === 'Team points')!;
    expect(teamPointsRow.cells.find((c) => c.holeNumber === 5)!.value).toBe(3);
    expect(card.totals.find((t) => t.label === 'points')!.value).toBe(3);
});

// --- Multi-slot scope routing (Phase 2.5i) ---

test('single-slot round with no scope defaults every participant to slot 0 (back-compat)', async () => {
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const pl1 = await ctx.playerService.register({ username: 'ss-p1', password: 'password123', displayName: 'SS P1' });
    const pl2 = await ctx.playerService.register({ username: 'ss-p2', password: 'password123', displayName: 'SS P2' });
    const { round, ballByProducerIndex, playHoleByCourseHole } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [
            { kind: 'player', id: pl1.id, handicapIndex: 9 },
            { kind: 'player', id: pl2.id, handicapIndex: 9 },
        ],
    });
    const ball1 = ballByProducerIndex[0]!;
    const ball2 = ballByProducerIndex[1]!;
    for (let h = 1; h <= 18; h++) {
        await scoreEventService.append({
            roundId: round.id, ballId: ball1, playHoleId: playHoleByCourseHole.get(h)!, strokes: 4,
            eventType: 'score_entered', clientEventId: `p1-h${h}`,
        });
        await scoreEventService.append({
            roundId: round.id, ballId: ball2, playHoleId: playHoleByCourseHole.get(h)!, strokes: 5,
            eventType: 'score_entered', clientEventId: `p2-h${h}`,
        });
    }

    const rr = await leaderboardService.resultForRound(round.id);
    // Both producers land in slot 0; one ranked section per scoring type there.
    expect(rr.slots).toHaveLength(1);
    expect(rankedMetrics(rr, 0)).toEqual(['gross', 'net']);
    for (const metric of ['gross', 'net']) {
        const entries = ranked(rr, 0, metric).entries;
        expect(entries.flatMap((e) => e.ballIds).sort()).toEqual([ball1, ball2].sort());
    }
});

test('multi-slot round routes each producer to the slot whose selector lists them', async () => {
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const plA = await ctx.playerService.register({ username: 'ms-a', password: 'password123', displayName: 'MS A' });
    const plB = await ctx.playerService.register({ username: 'ms-b', password: 'password123', displayName: 'MS B' });
    const plC = await ctx.playerService.register({ username: 'ms-c', password: 'password123', displayName: 'MS C' });
    const { round, ballByProducerIndex, playHoleByCourseHole } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [
            { formatId: 'stroke_play_individual', playerIndices: [1, 2] },
            { formatId: 'stableford_individual', playerIndices: [3] },
        ],
        players: [
            { kind: 'player', id: plA.id, handicapIndex: 9 },
            { kind: 'player', id: plB.id, handicapIndex: 9 },
            { kind: 'player', id: plC.id, handicapIndex: 9 },
        ],
    });
    const ballA = ballByProducerIndex[0]!;
    const ballB = ballByProducerIndex[1]!;
    const ballC = ballByProducerIndex[2]!;

    for (let h = 1; h <= 18; h++) {
        await scoreEventService.append({ roundId: round.id, ballId: ballA, playHoleId: playHoleByCourseHole.get(h)!, strokes: 4, eventType: 'score_entered', clientEventId: `a-h${h}` });
        await scoreEventService.append({ roundId: round.id, ballId: ballB, playHoleId: playHoleByCourseHole.get(h)!, strokes: 5, eventType: 'score_entered', clientEventId: `b-h${h}` });
        await scoreEventService.append({ roundId: round.id, ballId: ballC, playHoleId: playHoleByCourseHole.get(h)!, strokes: 4, eventType: 'score_entered', clientEventId: `c-h${h}` });
    }

    const rr = await leaderboardService.resultForRound(round.id);

    // Slot 0 is stroke-play → emits gross + net; slot 1 is stableford → emits points.
    expect(rankedMetrics(rr, 0)).toEqual(['gross', 'net']);
    expect(rankedMetrics(rr, 1)).toEqual(['points']);

    // Cross-slot leakage check: slot 0's sections only contain ballA & ballB;
    // slot 1's points section only contains ballC.
    for (const metric of ['gross', 'net']) {
        expect(ranked(rr, 0, metric).entries.flatMap((e) => e.ballIds).sort()).toEqual(
            [ballA, ballB].sort(),
        );
    }
    expect(ranked(rr, 1, 'points').entries.flatMap((e) => e.ballIds)).toEqual([ballC]);

    // Each ball's scorecard lives under the slot whose selector routed it.
    expect(cardFor(rr, 0, ballA).subjectBallIds).toContain(ballA);
    expect(cardFor(rr, 1, ballC).subjectBallIds).toContain(ballC);
    expect(rr.slots.find((s) => s.slotIndex === 1)!.cards.some((c) => c.subjectBallIds.includes(ballA))).toBe(false);
});

test('ball not assigned to any slot is tolerated (unscored), not thrown', async () => {
    // A ball no slot consumes is simply UNSCORED — a player can be on the
    // roster without being in any format. The engine is permissive: it scores
    // the formats and drops the spare ball, rather than failing. (Here we delete
    // a slot_balls row to produce an unconsumed ball.)
    const ctx = await setup18();
    const { db, leaderboardService, courseId, teeId } = ctx;
    const plA = await ctx.playerService.register({ username: 'orph-a', password: 'password123', displayName: 'Orph A' });
    const plB = await ctx.playerService.register({ username: 'orph-b', password: 'password123', displayName: 'Orph B' });
    const { round, ballByProducerIndex } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [
            { kind: 'player', id: plA.id, handicapIndex: 9 },
            { kind: 'player', id: plB.id, handicapIndex: 9 },
        ],
    });
    const orphanBall = ballByProducerIndex[1]!;
    const keptBall = ballByProducerIndex[0]!;
    await db.deleteFrom('slot_balls').where('ball_id', '=', orphanBall).execute();

    // Resolves (no throw); the unconsumed ball appears nowhere in the result,
    // the still-consumed ball is scored.
    const rr = await leaderboardService.resultForRound(round.id);
    const serialized = JSON.stringify(rr);
    expect(serialized).toContain(keptBall);
    expect(serialized).not.toContain(orphanBall);
});

test('slots row with a slot_def_id absent from the definition throws (drift check)', async () => {
    // Drift check: slot_def_id is OPAQUE (E3) — any value is a valid id, so it is
    // no longer "parsed". But a `slots` row whose id is absent from the round
    // definition is still drift and must surface, not silently score.
    const ctx = await setup18();
    const { db, leaderboardService, courseId, teeId } = ctx;
    const pl = await ctx.playerService.register({ username: 'parse-p', password: 'password123', displayName: 'Parse P' });
    const { round } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: pl.id, handicapIndex: 9 }],
    });
    // Corrupt the slots row's id so it no longer matches the definition.
    await db.updateTable('slots').set({ slot_def_id: 'nonsense' }).where('round_id', '=', round.id).execute();

    expect(leaderboardService.resultForRound(round.id)).rejects.toThrow(
        /slot_def_id 'nonsense' is not present in the round definition/,
    );
});

test('multi-slot round with overlapping scoringType label across slots keeps buckets separate', async () => {
    // Two stableford slots (individual + individual) both emit `points`.
    // The legacy single-bucket-per-scoringType behaviour would have merged
    // them; 2.5i partitions per slot so each lives in its own bucket.
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const plA = await ctx.playerService.register({ username: 'ov-a', password: 'password123', displayName: 'OV A' });
    const plB = await ctx.playerService.register({ username: 'ov-b', password: 'password123', displayName: 'OV B' });
    const { round, ballByProducerIndex, playHoleByCourseHole } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [
            { formatId: 'stableford_individual', playerIndices: [1] },
            { formatId: 'stableford_individual', playerIndices: [2] },
        ],
        players: [
            { kind: 'player', id: plA.id, handicapIndex: 9 },
            { kind: 'player', id: plB.id, handicapIndex: 9 },
        ],
    });
    const ballA = ballByProducerIndex[0]!;
    const ballB = ballByProducerIndex[1]!;

    for (let h = 1; h <= 18; h++) {
        await scoreEventService.append({ roundId: round.id, ballId: ballA, playHoleId: playHoleByCourseHole.get(h)!, strokes: 4, eventType: 'score_entered', clientEventId: `a-h${h}` });
        await scoreEventService.append({ roundId: round.id, ballId: ballB, playHoleId: playHoleByCourseHole.get(h)!, strokes: 5, eventType: 'score_entered', clientEventId: `b-h${h}` });
    }

    const rr = await leaderboardService.resultForRound(round.id);
    const pointsSections = rankedAcrossSlots(rr, 'points');
    // TWO separate points sections, one per slot — 2.5h's collision is resolved.
    expect(pointsSections).toHaveLength(2);
    expect(pointsSections.map((s) => s.slotIndex).sort()).toEqual([0, 1]);
    expect(ranked(rr, 0, 'points').entries.flatMap((e) => e.ballIds)).toEqual([ballA]);
    expect(ranked(rr, 1, 'points').entries.flatMap((e) => e.ballIds)).toEqual([ballB]);
});
