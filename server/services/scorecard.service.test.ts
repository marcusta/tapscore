import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { createCompiledRound } from '../testing/compiler-rounds';
import { pickForSource } from './scorecard.service';

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Halmstad GK' });
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
    const alice = await ctx.playerService.register({ username: 'alice', password: 'password123', displayName: 'Alice' });
    const bob = await ctx.playerService.register({ username: 'bob', password: 'password123', displayName: 'Bob' });
    const { round, ballByProducerIndex, playHoleByCourseHole } = await createCompiledRound(ctx, {
        courseId: course.id,
        teeId: tee.id,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [
            { kind: 'player', id: alice.id, handicapIndex: 9 },
            { kind: 'player', id: bob.id, handicapIndex: 9 },
        ],
    });
    return {
        ...ctx,
        roundId: round.id,
        aliceBall: ballByProducerIndex[0]!,
        bobBall: ballByProducerIndex[1]!,
        playHoleByCourseHole,
    };
}

test('trigger creates scorecard row on event insert', async () => {
    const { scoreEventService, scorecardService, roundId, aliceBall, playHoleByCourseHole } = await setup();
    await scoreEventService.append({
        roundId,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
    });
    const sc = await scorecardService.forBall(aliceBall);
    expect(sc.holes).toHaveLength(1);
    expect(sc.holes[0]).toMatchObject({ holeNumber: 1, strokes: 4 });
});

test('later event for same hole overwrites scorecard row', async () => {
    const { scoreEventService, scorecardService, roundId, aliceBall, playHoleByCourseHole } = await setup();
    await scoreEventService.append({
        roundId,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
        recordedAt: '2026-05-01T10:00:00.000Z',
    });
    await scoreEventService.append({
        roundId,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 5,
        eventType: 'score_entered',
        clientEventId: 'c2',
        recordedAt: '2026-05-01T10:05:00.000Z',
    });
    const sc = await scorecardService.forBall(aliceBall);
    expect(sc.holes).toHaveLength(1);
    expect(sc.holes[0].strokes).toBe(5);
});

test('score_cleared wipes strokes but keeps row', async () => {
    const { scoreEventService, scorecardService, roundId, aliceBall, playHoleByCourseHole } = await setup();
    await scoreEventService.append({
        roundId,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
        recordedAt: '2026-05-01T10:00:00.000Z',
    });
    await scoreEventService.append({
        roundId,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: null,
        eventType: 'score_cleared',
        clientEventId: 'c2',
        recordedAt: '2026-05-01T10:05:00.000Z',
    });
    const sc = await scorecardService.forBall(aliceBall);
    expect(sc.holes).toHaveLength(1);
    expect(sc.holes[0].strokes).toBeNull();
});

test('out-of-order insert converges on latest recorded_at', async () => {
    const { scoreEventService, scorecardService, roundId, aliceBall, playHoleByCourseHole } = await setup();
    // Insert the LATER event first.
    await scoreEventService.append({
        roundId,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 5,
        eventType: 'score_entered',
        clientEventId: 'late',
        recordedAt: '2026-05-01T10:05:00.000Z',
    });
    // Then the EARLIER event. Trigger must NOT overwrite.
    await scoreEventService.append({
        roundId,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'early',
        recordedAt: '2026-05-01T10:00:00.000Z',
    });
    const sc = await scorecardService.forBall(aliceBall);
    expect(sc.holes[0].strokes).toBe(5); // latest (by recorded_at) wins
});

test('null strokes (DNP) and zero strokes (pickup) are both preserved', async () => {
    const { scoreEventService, scorecardService, roundId, aliceBall, playHoleByCourseHole } = await setup();
    await scoreEventService.append({
        roundId,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 0,
        eventType: 'score_entered',
        clientEventId: 'c1',
    });
    await scoreEventService.append({
        roundId,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(2)!,
        strokes: null,
        eventType: 'score_entered',
        clientEventId: 'c2',
    });
    const sc = await scorecardService.forBall(aliceBall);
    const hole1 = sc.holes.find((h) => h.holeNumber === 1)!;
    const hole2 = sc.holes.find((h) => h.holeNumber === 2)!;
    expect(hole1.strokes).toBe(0);
    expect(hole2.strokes).toBeNull();
});

test('forRound groups by ball', async () => {
    const { scoreEventService, scorecardService, roundId, aliceBall, bobBall, playHoleByCourseHole } = await setup();
    await scoreEventService.append({ roundId, ballId: aliceBall, playHoleId: playHoleByCourseHole.get(1)!, strokes: 4, eventType: 'score_entered', clientEventId: 'a' });
    await scoreEventService.append({ roundId, ballId: bobBall, playHoleId: playHoleByCourseHole.get(1)!, strokes: 5, eventType: 'score_entered', clientEventId: 'b' });
    await scoreEventService.append({ roundId, ballId: aliceBall, playHoleId: playHoleByCourseHole.get(2)!, strokes: 3, eventType: 'score_entered', clientEventId: 'c' });
    const list = await scorecardService.forRound(roundId);
    expect(list).toHaveLength(2);
    const aliceCard = list.find((s) => s.ballId === aliceBall)!;
    expect(aliceCard.holes).toHaveLength(2);
});

// --- per-player source rows (phase 2.5d) ---
//
// In the own-ball topology, better-ball teams have TWO balls (one per
// producer). The legacy tests used a single team-ball with sourcePlayerId
// filtering — those assertions are no longer a direct fit. We exercise the
// `sourcePlayerId` column on score_events via an individual slot (any
// ball can carry a source id; the column is orthogonal to the topology).

async function setupWithTeam() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Halmstad GK' });
    const course = await ctx.courseService.create({ clubId: club.id, name: 'North', holeCount: 18 });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'White',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const alice = await ctx.playerService.register({ username: 'alice', password: 'password123', displayName: 'Alice' });
    const bob = await ctx.playerService.register({ username: 'bob', password: 'password123', displayName: 'Bob' });
    const { round, ballByProducerIndex, playHoleByCourseHole } = await createCompiledRound(ctx, {
        courseId: course.id,
        teeId: tee.id,
        slots: [
            {
                formatId: 'stableford_better_ball',
                allowancePct: 90,
            },
        ],
        players: [
            { kind: 'player', id: alice.id, handicapIndex: 9, team: 'A&B' },
            { kind: 'player', id: bob.id, handicapIndex: 9, team: 'A&B' },
            // Better-ball needs >=2 teams — add a dummy opposing pair so
            // the compiler's team grouping check passes.
            { kind: 'player', id: (await ctx.playerService.register({ username: 'carol-sc', password: 'password123', displayName: 'Carol' })).id, handicapIndex: 9, team: 'CD' },
            { kind: 'player', id: (await ctx.playerService.register({ username: 'dan-sc', password: 'password123', displayName: 'Dan' })).id, handicapIndex: 9, team: 'CD' },
        ],
    });
    return {
        ...ctx,
        roundId: round.id,
        aliceBall: ballByProducerIndex[0]!,
        bobBall: ballByProducerIndex[1]!,
        aliceId: alice.id,
        bobId: bob.id,
        playHoleByCourseHole,
    };
}

test('two events at same (ball, hole) with different sourcePlayerId persist as separate rows', async () => {
    // Ball-level: using Alice's own ball but tagging events with two source
    // ids exercises the per-source scorecard row fan-out.
    const { scoreEventService, scorecardService, roundId, aliceBall, aliceId, bobId, playHoleByCourseHole } = await setupWithTeam();
    await scoreEventService.append({
        roundId, ballId: aliceBall, playHoleId: playHoleByCourseHole.get(1)!, strokes: 4,
        eventType: 'score_entered', clientEventId: 'a1', sourcePlayerId: aliceId,
        recordedAt: '2026-05-01T10:00:00.000Z',
    });
    await scoreEventService.append({
        roundId, ballId: aliceBall, playHoleId: playHoleByCourseHole.get(1)!, strokes: 5,
        eventType: 'score_entered', clientEventId: 'b1', sourcePlayerId: bobId,
        recordedAt: '2026-05-01T10:01:00.000Z',
    });
    const sc = await scorecardService.forBall(aliceBall);
    expect(sc.holes).toHaveLength(2);
    const aliceHole = sc.holes.find((h) => h.sourcePlayerId === aliceId)!;
    const bobHole = sc.holes.find((h) => h.sourcePlayerId === bobId)!;
    expect(aliceHole.strokes).toBe(4);
    expect(bobHole.strokes).toBe(5);
});

test('two events at same (ball, hole) with same sourcePlayerId — later overwrites (idempotent replay)', async () => {
    const { scoreEventService, scorecardService, roundId, aliceBall, aliceId, playHoleByCourseHole } = await setupWithTeam();
    await scoreEventService.append({
        roundId, ballId: aliceBall, playHoleId: playHoleByCourseHole.get(1)!, strokes: 4,
        eventType: 'score_entered', clientEventId: 'a1', sourcePlayerId: aliceId,
        recordedAt: '2026-05-01T10:00:00.000Z',
    });
    await scoreEventService.append({
        roundId, ballId: aliceBall, playHoleId: playHoleByCourseHole.get(1)!, strokes: 6,
        eventType: 'score_entered', clientEventId: 'a2', sourcePlayerId: aliceId,
        recordedAt: '2026-05-01T10:05:00.000Z',
    });
    const sc = await scorecardService.forBall(aliceBall);
    expect(sc.holes).toHaveLength(1);
    expect(sc.holes[0].strokes).toBe(6);
    expect(sc.holes[0].sourcePlayerId).toBe(aliceId);
});

test('null source row coexists separately from per-player rows on same hole', async () => {
    const { scoreEventService, scorecardService, roundId, aliceBall, aliceId, playHoleByCourseHole } = await setupWithTeam();
    await scoreEventService.append({
        roundId, ballId: aliceBall, playHoleId: playHoleByCourseHole.get(1)!, strokes: 4,
        eventType: 'score_entered', clientEventId: 'a1', sourcePlayerId: aliceId,
        recordedAt: '2026-05-01T10:00:00.000Z',
    });
    await scoreEventService.append({
        roundId, ballId: aliceBall, playHoleId: playHoleByCourseHole.get(1)!, strokes: 7,
        eventType: 'score_entered', clientEventId: 'team1',
        recordedAt: '2026-05-01T10:01:00.000Z',
    });
    // Later null-source event at the same hole overwrites only the null bucket.
    await scoreEventService.append({
        roundId, ballId: aliceBall, playHoleId: playHoleByCourseHole.get(1)!, strokes: 8,
        eventType: 'score_entered', clientEventId: 'team2',
        recordedAt: '2026-05-01T10:02:00.000Z',
    });
    const sc = await scorecardService.forBall(aliceBall);
    expect(sc.holes).toHaveLength(2);
    const nullHole = sc.holes.find((h) => h.sourcePlayerId === null && h.sourceGuestPlayerId === null)!;
    const aliceHole = sc.holes.find((h) => h.sourcePlayerId === aliceId)!;
    expect(nullHole.strokes).toBe(8);
    expect(aliceHole.strokes).toBe(4);
});

test('pickForSource returns the matching hole, null otherwise', async () => {
    const { scoreEventService, scorecardService, roundId, aliceBall, aliceId, bobId, playHoleByCourseHole } = await setupWithTeam();
    await scoreEventService.append({
        roundId, ballId: aliceBall, playHoleId: playHoleByCourseHole.get(1)!, strokes: 4,
        eventType: 'score_entered', clientEventId: 'a1', sourcePlayerId: aliceId,
    });
    await scoreEventService.append({
        roundId, ballId: aliceBall, playHoleId: playHoleByCourseHole.get(1)!, strokes: 5,
        eventType: 'score_entered', clientEventId: 'b1', sourcePlayerId: bobId,
    });
    const sc = await scorecardService.forBall(aliceBall);
    expect(pickForSource(sc.holes, aliceId, null)?.strokes).toBe(4);
    expect(pickForSource(sc.holes, bobId, null)?.strokes).toBe(5);
    expect(pickForSource(sc.holes, 'nonexistent', null)).toBeNull();
    expect(pickForSource(sc.holes, null, null)).toBeNull();
});

// --- metadata (phase 2.5h / migration 014) ---

test('scorecard row surfaces metadata from latest event (null source)', async () => {
    const { scoreEventService, scorecardService, roundId, aliceBall, playHoleByCourseHole } = await setup();
    await scoreEventService.append({
        roundId,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
        metadata: { gir: true },
    });
    const sc = await scorecardService.forBall(aliceBall);
    expect(sc.holes[0].metadata).toEqual({ gir: true });
    // forRound returns the same metadata through the multi-ball path.
    const all = await scorecardService.forRound(roundId);
    const card = all.find((c) => c.ballId === aliceBall)!;
    expect(card.holes[0].metadata).toEqual({ gir: true });
});

test('scorecard row surfaces metadata from latest event (per-player source)', async () => {
    const { scoreEventService, scorecardService, roundId, aliceBall, aliceId, bobId, playHoleByCourseHole } =
        await setupWithTeam();
    await scoreEventService.append({
        roundId,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'a1',
        sourcePlayerId: aliceId,
        metadata: { gir: true },
    });
    await scoreEventService.append({
        roundId,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 5,
        eventType: 'score_entered',
        clientEventId: 'b1',
        sourcePlayerId: bobId,
        metadata: { gir: false },
    });
    const sc = await scorecardService.forBall(aliceBall);
    const aliceHole = sc.holes.find((h) => h.sourcePlayerId === aliceId)!;
    const bobHole = sc.holes.find((h) => h.sourcePlayerId === bobId)!;
    expect(aliceHole.metadata).toEqual({ gir: true });
    expect(bobHole.metadata).toEqual({ gir: false });
});

test('later event overwrites earlier metadata in the materialised view', async () => {
    const { scoreEventService, scorecardService, roundId, aliceBall, playHoleByCourseHole } = await setup();
    await scoreEventService.append({
        roundId,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'early',
        recordedAt: '2026-05-01T10:00:00.000Z',
        metadata: { gir: false },
    });
    await scoreEventService.append({
        roundId,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 5,
        eventType: 'score_entered',
        clientEventId: 'late',
        recordedAt: '2026-05-01T10:05:00.000Z',
        metadata: { gir: true, putts: 2 },
    });
    const sc = await scorecardService.forBall(aliceBall);
    expect(sc.holes).toHaveLength(1);
    expect(sc.holes[0].strokes).toBe(5);
    expect(sc.holes[0].metadata).toEqual({ gir: true, putts: 2 });
});

test('scorecard metadata defaults to null when unset', async () => {
    const { scoreEventService, scorecardService, roundId, aliceBall, playHoleByCourseHole } = await setup();
    await scoreEventService.append({
        roundId,
        ballId: aliceBall,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
    });
    const sc = await scorecardService.forBall(aliceBall);
    expect(sc.holes[0].metadata).toBeNull();
});
