import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { createCompiledRound } from '../testing/compiler-rounds';

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
    const alice = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice',
    });
    const { round, ballByProducerIndex, playHoleByCourseHole } = await createCompiledRound(ctx, {
        courseId: course.id,
        teeId: tee.id,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: alice.id, handicapIndex: 9 }],
    });
    return {
        ...ctx,
        roundId: round.id,
        ballId: ballByProducerIndex[0]!,
        aliceId: alice.id,
        playHoleByCourseHole,
    };
}

test('append inserts event and bumps rounds.latest_event_id', async () => {
    const { scoreEventService, roundService, roundId, ballId, aliceId, playHoleByCourseHole } = await setup();
    const res = await scoreEventService.append({
        roundId,
        ballId,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        recordedByPlayerId: aliceId,
        clientEventId: 'c1',
    });
    expect(res.inserted).toBe(true);
    expect(res.event.strokes).toBe(4);
    expect(res.event.ballId).toBe(ballId);
    const round = await roundService.getById(roundId);
    expect(round!.latestEventId).toBe(res.event.id);
});

test('replaying the same clientEventId is deduped, returns original row', async () => {
    const { scoreEventService, roundId, ballId, playHoleByCourseHole } = await setup();
    const first = await scoreEventService.append({
        roundId,
        ballId,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
    });
    const second = await scoreEventService.append({
        roundId,
        ballId,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 99, // different payload; server ignores, returns original
        eventType: 'score_entered',
        clientEventId: 'c1',
    });
    expect(second.inserted).toBe(false);
    expect(second.event.id).toBe(first.event.id);
    expect(second.event.strokes).toBe(4);
});

test('listByRound returns events in recorded_at order', async () => {
    const { scoreEventService, roundId, ballId, playHoleByCourseHole } = await setup();
    await scoreEventService.append({
        roundId,
        ballId,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
        recordedAt: '2026-05-01T10:00:00.000Z',
    });
    await scoreEventService.append({
        roundId,
        ballId,
        playHoleId: playHoleByCourseHole.get(2)!,
        strokes: 3,
        eventType: 'score_entered',
        clientEventId: 'c2',
        recordedAt: '2026-05-01T10:05:00.000Z',
    });
    const list = await scoreEventService.listByRound(roundId);
    expect(list.map((e) => e.playHoleId)).toEqual([
        playHoleByCourseHole.get(1)!,
        playHoleByCourseHole.get(2)!,
    ]);
});

test('clientEventId uniqueness is scoped per round', async () => {
    const ctx = await setup();
    const { scoreEventService, roundId, ballId, playHoleByCourseHole } = ctx;
    // Another round with its own participant, same clientEventId → should work.
    const club2 = await ctx.clubService.create({ name: 'Other GK' });
    const course2 = await ctx.courseService.create({ clubId: club2.id, name: 'Other', holeCount: 18 });
    const tee2 = await ctx.teeService.create({
        courseId: course2.id,
        name: 'White',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const carol = await ctx.playerService.register({ username: 'carol', password: 'password123', displayName: 'Carol' });
    const { round: round2, ballByProducerIndex: ballsR2, playHoleByCourseHole: playHoleByCourseHole2 } = await createCompiledRound(ctx, {
        courseId: course2.id,
        teeId: tee2.id,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'player', id: carol.id, handicapIndex: 9 }],
    });

    const a = await scoreEventService.append({ roundId, ballId, playHoleId: playHoleByCourseHole.get(1)!, strokes: 4, eventType: 'score_entered', clientEventId: 'shared' });
    const b = await scoreEventService.append({ roundId: round2.id, ballId: ballsR2[0]!, playHoleId: playHoleByCourseHole2.get(1)!, strokes: 5, eventType: 'score_entered', clientEventId: 'shared' });
    expect(a.inserted).toBe(true);
    expect(b.inserted).toBe(true);
    expect(a.event.id).not.toBe(b.event.id);
});

test('round delete cascades events', async () => {
    const { scoreEventService, roundService, roundId, ballId, playHoleByCourseHole } = await setup();
    await scoreEventService.append({ roundId, ballId, playHoleId: playHoleByCourseHole.get(1)!, strokes: 4, eventType: 'score_entered', clientEventId: 'c1' });
    await roundService.remove(roundId);
    const list = await scoreEventService.listByRound(roundId);
    expect(list).toHaveLength(0);
});

test('append with sourcePlayerId persists and round-trips', async () => {
    const { scoreEventService, roundId, ballId, aliceId, playHoleByCourseHole } = await setup();
    const res = await scoreEventService.append({
        roundId,
        ballId,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
        sourcePlayerId: aliceId,
    });
    expect(res.event.sourcePlayerId).toBe(aliceId);
    expect(res.event.sourceGuestPlayerId).toBeNull();
    const list = await scoreEventService.listByRound(roundId);
    expect(list[0].sourcePlayerId).toBe(aliceId);
    expect(list[0].sourceGuestPlayerId).toBeNull();
});

test('append with sourceGuestPlayerId persists and round-trips', async () => {
    // Use a fresh context where a guest is the sole producer.
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Halmstad GK' });
    const course = await ctx.courseService.create({ clubId: club.id, name: 'North', holeCount: 18 });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'White',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const guest = await ctx.guestPlayerService.create({ displayName: 'Guest', gender: 'M', handicapIndex: 12 });
    const { round, ballByProducerIndex, playHoleByCourseHole } = await createCompiledRound(ctx, {
        courseId: course.id,
        teeId: tee.id,
        slots: [{ formatId: 'stroke_play_individual' }],
        players: [{ kind: 'guest', id: guest.id, handicapIndex: 12 }],
    });
    const { scoreEventService } = ctx;
    const roundId = round.id;
    const ballId = ballByProducerIndex[0]!;
    const res = await scoreEventService.append({
        roundId,
        ballId,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 5,
        eventType: 'score_entered',
        clientEventId: 'c1',
        sourceGuestPlayerId: guest.id,
    });
    expect(res.event.sourcePlayerId).toBeNull();
    expect(res.event.sourceGuestPlayerId).toBe(guest.id);
});

test('append with both source ids throws', async () => {
    const { scoreEventService, guestPlayerService, roundId, ballId, aliceId, playHoleByCourseHole } = await setup();
    const guest = await guestPlayerService.create({ displayName: 'Guest', gender: 'M', handicapIndex: 12 });
    await expect(
        scoreEventService.append({
            roundId,
            ballId,
            playHoleId: playHoleByCourseHole.get(1)!,
            strokes: 4,
            eventType: 'score_entered',
            clientEventId: 'c1',
            sourcePlayerId: aliceId,
            sourceGuestPlayerId: guest.id,
        }),
    ).rejects.toThrow(/sourcePlayerId or sourceGuestPlayerId/);
});

test('append with both source ids null persists (individual / foursomes path)', async () => {
    const { scoreEventService, roundId, ballId, playHoleByCourseHole } = await setup();
    const res = await scoreEventService.append({
        roundId,
        ballId,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
    });
    expect(res.inserted).toBe(true);
    expect(res.event.sourcePlayerId).toBeNull();
    expect(res.event.sourceGuestPlayerId).toBeNull();
});

// --- metadata (phase 2.5h / migration 014) ---

test('append with metadata populated — persisted + round-trip JSON parse', async () => {
    const { scoreEventService, roundId, ballId, playHoleByCourseHole } = await setup();
    const res = await scoreEventService.append({
        roundId,
        ballId,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
        metadata: { gir: true, putts: 2 },
    });
    expect(res.event.metadata).toEqual({ gir: true, putts: 2 });
    const list = await scoreEventService.listByRound(roundId);
    expect(list[0].metadata).toEqual({ gir: true, putts: 2 });
    const got = await scoreEventService.getById(res.event.id);
    expect(got?.metadata).toEqual({ gir: true, putts: 2 });
});

test('append with metadata null — works and round-trips as null', async () => {
    const { scoreEventService, roundId, ballId, playHoleByCourseHole } = await setup();
    const res = await scoreEventService.append({
        roundId,
        ballId,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
        metadata: null,
    });
    expect(res.event.metadata).toBeNull();
});

test('append with metadata unset — defaults to null', async () => {
    const { scoreEventService, roundId, ballId, playHoleByCourseHole } = await setup();
    const res = await scoreEventService.append({
        roundId,
        ballId,
        playHoleId: playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
    });
    expect(res.event.metadata).toBeNull();
});

test('malformed metadata in DB throws a clear error on read', async () => {
    const ctx = await setup();
    await ctx.scoreEventService.append({
        roundId: ctx.roundId,
        ballId: ctx.ballId,
        playHoleId: ctx.playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
    });
    // Corrupt the stored metadata directly — simulate a bad write or a
    // legacy row that didn't observe the parse contract. The test context
    // exposes the raw Kysely instance via `db`.
    await ctx.db
        .updateTable('score_events')
        .set({ metadata: 'not-json' })
        .where('round_id', '=', ctx.roundId)
        .execute();
    await expect(ctx.scoreEventService.listByRound(ctx.roundId)).rejects.toThrow(
        /malformed JSON/,
    );
});

test('non-object JSON metadata throws a clear error on read', async () => {
    const ctx = await setup();
    await ctx.scoreEventService.append({
        roundId: ctx.roundId,
        ballId: ctx.ballId,
        playHoleId: ctx.playHoleByCourseHole.get(1)!,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
    });
    // JSON-valid but not an object (array) — should still throw.
    await ctx.db
        .updateTable('score_events')
        .set({ metadata: '[1,2,3]' })
        .where('round_id', '=', ctx.roundId)
        .execute();
    await expect(ctx.scoreEventService.listByRound(ctx.roundId)).rejects.toThrow(
        /expected JSON object/,
    );
});
