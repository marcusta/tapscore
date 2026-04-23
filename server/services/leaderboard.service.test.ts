import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { createCompiledRound } from '../testing/compiler-rounds';

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
    const { round, ballByProducerIndex } = await createCompiledRound(ctx, {
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
            hole: h,
            strokes: 5, // bogey
            eventType: 'score_entered',
            clientEventId: `h${h}`,
        });
    }

    const lb = await leaderboardService.forRound(round.id);
    const gross = lb.byScoringType.find((b) => b.scoringType === 'gross')!;
    const net = lb.byScoringType.find((b) => b.scoringType === 'net')!;
    expect(gross.entries[0].total).toBe(45); // 9 × bogey 5
    expect(net.entries[0].total).toBe(36);   // minus 9 strokes given
    expect(lb.ballResults[0].holes.map((h) => h.holeNumber)).toEqual(
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
});

test('back_9 round uses holes 10..18 only', async () => {
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const pl = await ctx.playerService.register({ username: 'back9-p1', password: 'password123', displayName: 'Back9 P1' });
    const { round, ballByProducerIndex } = await createCompiledRound(ctx, {
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
            hole: h,
            strokes: 4,
            eventType: 'score_entered',
            clientEventId: `h${h}`,
        });
    }

    const lb = await leaderboardService.forRound(round.id);
    const gross = lb.byScoringType.find((b) => b.scoringType === 'gross')!;
    expect(gross.entries[0].total).toBe(36); // 9 × par 4
    expect(lb.ballResults[0].holes.map((h) => h.holeNumber)).toEqual(
        [10, 11, 12, 13, 14, 15, 16, 17, 18],
    );
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
    const { round: frontRound, ballByProducerIndex: frontBalls } = await createCompiledRound(ctx, {
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
            hole: h,
            strokes: 5,
            eventType: 'score_entered',
            clientEventId: `f${h}`,
        });
    }
    const frontLb = await ctx.leaderboardService.forRound(frontRound.id);
    const frontGross = frontLb.byScoringType.find((b) => b.scoringType === 'gross')!;
    const frontNet = frontLb.byScoringType.find((b) => b.scoringType === 'net')!;
    // 9 bogeys, no strokes given on any of these holes → net = gross.
    expect(frontGross.entries[0].total).toBe(45);
    expect(frontNet.entries[0].total).toBe(45);

    const plBack = await ctx.playerService.register({ username: 'si-back', password: 'password123', displayName: 'SI Back' });
    const { round: backRound, ballByProducerIndex: backBalls } = await createCompiledRound(ctx, {
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
            hole: h,
            strokes: 5,
            eventType: 'score_entered',
            clientEventId: `b${h}`,
        });
    }
    const backLb = await ctx.leaderboardService.forRound(backRound.id);
    const backGross = backLb.byScoringType.find((b) => b.scoringType === 'gross')!;
    const backNet = backLb.byScoringType.find((b) => b.scoringType === 'net')!;
    // 9 bogeys, every hole gets +1 → net = gross − 9 = 36.
    expect(backGross.entries[0].total).toBe(45);
    expect(backNet.entries[0].total).toBe(36);
});

test('full_18 round still covers all 18 holes', async () => {
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const pl = await ctx.playerService.register({ username: 'full18-p1', password: 'password123', displayName: 'Full18 P1' });
    const { round, ballByProducerIndex } = await createCompiledRound(ctx, {
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
            hole: h,
            strokes: 4,
            eventType: 'score_entered',
            clientEventId: `h${h}`,
        });
    }
    const lb = await leaderboardService.forRound(round.id);
    expect(lb.ballResults[0].holes).toHaveLength(18);
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
    const { round, ballByProducerIndex } = await createCompiledRound(ctx, {
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
        hole: 5,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'alice-h5',
    });
    await scoreEventService.append({
        roundId: round.id,
        ballId: bobBall,
        hole: 5,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'bob-h5',
    });

    const lb = await leaderboardService.forRound(round.id);
    // Team result's representative ballId is the first own-ball in the team —
    // the "Alice & Bob" team's first producer is alice, so the team result
    // keys off alice's ball id.
    const teamResult = lb.ballResults.find((r) => r.ballId === aliceBall)!;
    expect(teamResult.holes.find((h) => h.holeNumber === 5)!.points).toBe(3);
    expect(teamResult.totals.find((t) => t.scoringType === 'points')!.value).toBe(3);
});

// --- Multi-slot scope routing (Phase 2.5i) ---

test('single-slot round with no scope defaults every participant to slot 0 (back-compat)', async () => {
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const pl1 = await ctx.playerService.register({ username: 'ss-p1', password: 'password123', displayName: 'SS P1' });
    const pl2 = await ctx.playerService.register({ username: 'ss-p2', password: 'password123', displayName: 'SS P2' });
    const { round, ballByProducerIndex } = await createCompiledRound(ctx, {
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
            roundId: round.id, ballId: ball1, hole: h, strokes: 4,
            eventType: 'score_entered', clientEventId: `p1-h${h}`,
        });
        await scoreEventService.append({
            roundId: round.id, ballId: ball2, hole: h, strokes: 5,
            eventType: 'score_entered', clientEventId: `p2-h${h}`,
        });
    }

    const lb = await leaderboardService.forRound(round.id);
    // Both producers land in slot 0; one bucket per scoring type at slotIndex 0.
    expect(lb.byScoringType).toHaveLength(2); // gross + net
    for (const b of lb.byScoringType) {
        expect(b.slotIndex).toBe(0);
        expect(b.entries.map((e) => e.ballId).sort()).toEqual([ball1, ball2].sort());
    }
});

test('multi-slot round routes each producer to the slot whose selector lists them', async () => {
    const ctx = await setup18();
    const { scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const plA = await ctx.playerService.register({ username: 'ms-a', password: 'password123', displayName: 'MS A' });
    const plB = await ctx.playerService.register({ username: 'ms-b', password: 'password123', displayName: 'MS B' });
    const plC = await ctx.playerService.register({ username: 'ms-c', password: 'password123', displayName: 'MS C' });
    const { round, ballByProducerIndex } = await createCompiledRound(ctx, {
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
        await scoreEventService.append({ roundId: round.id, ballId: ballA, hole: h, strokes: 4, eventType: 'score_entered', clientEventId: `a-h${h}` });
        await scoreEventService.append({ roundId: round.id, ballId: ballB, hole: h, strokes: 5, eventType: 'score_entered', clientEventId: `b-h${h}` });
        await scoreEventService.append({ roundId: round.id, ballId: ballC, hole: h, strokes: 4, eventType: 'score_entered', clientEventId: `c-h${h}` });
    }

    const lb = await leaderboardService.forRound(round.id);

    // Slot 0 is stroke-play → emits gross + net; slot 1 is stableford → emits points.
    const slot0Buckets = lb.byScoringType.filter((b) => b.slotIndex === 0);
    const slot1Buckets = lb.byScoringType.filter((b) => b.slotIndex === 1);
    expect(slot0Buckets.map((b) => b.scoringType).sort()).toEqual(['gross', 'net']);
    expect(slot1Buckets.map((b) => b.scoringType)).toEqual(['points']);

    // Cross-slot leakage check: slot 0's buckets only contain ballA & ballB;
    // slot 1's points bucket only contains ballC.
    for (const b of slot0Buckets) {
        expect(b.entries.map((e) => e.ballId).sort()).toEqual([ballA, ballB].sort());
    }
    for (const b of slot1Buckets) {
        expect(b.entries.map((e) => e.ballId)).toEqual([ballC]);
    }

    // Ball results carry the slotIndex the strategy ran under.
    const resultA = lb.ballResults.find((r) => r.ballId === ballA)!;
    const resultC = lb.ballResults.find((r) => r.ballId === ballC)!;
    expect(resultA.slotIndex).toBe(0);
    expect(resultC.slotIndex).toBe(1);
});

test('ball not assigned to any slot (slot_balls missing) throws', async () => {
    // Compiler-drift check: the compiler always stamps slot_balls for every
    // ball it emits; we manually delete one row to simulate drift and verify
    // the leaderboard surfaces it instead of silently dropping the ball.
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
    await db.deleteFrom('slot_balls').where('ball_id', '=', orphanBall).execute();

    expect(leaderboardService.forRound(round.id)).rejects.toThrow(
        new RegExp(`ball ${orphanBall} in round .* is not assigned to any slot`),
    );
});

test('slots row with unparseable slot_def_id throws', async () => {
    // Drift check: a `slots` row whose `slot_def_id` doesn't match the
    // `slot-<N>` pattern. Surface rather than silently partition to slot 0.
    const ctx = await setup18();
    const { db, leaderboardService, courseId, teeId } = ctx;
    const pl = await ctx.playerService.register({ username: 'parse-p', password: 'password123', displayName: 'Parse P' });
    const { round } = await createCompiledRound(ctx, {
        courseId,
        teeId,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: pl.id, handicapIndex: 9 }],
    });
    // Corrupt the slot_def_id.
    await db.updateTable('slots').set({ slot_def_id: 'nonsense' }).where('round_id', '=', round.id).execute();

    expect(leaderboardService.forRound(round.id)).rejects.toThrow(
        /cannot parse slot_def_id 'nonsense'/,
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
    const { round, ballByProducerIndex } = await createCompiledRound(ctx, {
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
        await scoreEventService.append({ roundId: round.id, ballId: ballA, hole: h, strokes: 4, eventType: 'score_entered', clientEventId: `a-h${h}` });
        await scoreEventService.append({ roundId: round.id, ballId: ballB, hole: h, strokes: 5, eventType: 'score_entered', clientEventId: `b-h${h}` });
    }

    const lb = await leaderboardService.forRound(round.id);
    const pointsBuckets = lb.byScoringType.filter((b) => b.scoringType === 'points');
    // TWO separate points buckets, one per slot — 2.5h's collision is resolved.
    expect(pointsBuckets).toHaveLength(2);
    expect(pointsBuckets.map((b) => b.slotIndex).sort()).toEqual([0, 1]);
    expect(pointsBuckets[0]!.entries.map((e) => e.ballId)).toEqual([ballA]);
    expect(pointsBuckets[1]!.entries.map((e) => e.ballId)).toEqual([ballB]);
});
