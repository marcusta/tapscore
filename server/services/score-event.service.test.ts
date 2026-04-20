import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Halmstad GK' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'North',
        holeCount: 18,
    });
    const round = await ctx.roundService.create({
        courseId: course.id,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            {
                slotIndex: 0,
                scoringMode: 'stroke_play',
                teamShape: 'individual',
                allowancePct: 100,
                scopeConfig: null,
            },
        ],
    });
    const alice = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice',
    });
    const p = await ctx.participantService.create({
        roundId: round.id,
        players: [{ playerId: alice.id }],
    });
    return { ...ctx, roundId: round.id, participantId: p.id, aliceId: alice.id };
}

test('append inserts event and bumps rounds.latest_event_id', async () => {
    const { scoreEventService, roundService, roundId, participantId, aliceId } = await setup();
    const res = await scoreEventService.append({
        roundId,
        participantId,
        hole: 1,
        strokes: 4,
        eventType: 'score_entered',
        recordedByPlayerId: aliceId,
        clientEventId: 'c1',
    });
    expect(res.inserted).toBe(true);
    expect(res.event.strokes).toBe(4);
    const round = await roundService.getById(roundId);
    expect(round!.latestEventId).toBe(res.event.id);
});

test('replaying the same clientEventId is deduped, returns original row', async () => {
    const { scoreEventService, roundId, participantId } = await setup();
    const first = await scoreEventService.append({
        roundId,
        participantId,
        hole: 1,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
    });
    const second = await scoreEventService.append({
        roundId,
        participantId,
        hole: 1,
        strokes: 99, // different payload; server ignores, returns original
        eventType: 'score_entered',
        clientEventId: 'c1',
    });
    expect(second.inserted).toBe(false);
    expect(second.event.id).toBe(first.event.id);
    expect(second.event.strokes).toBe(4);
});

test('listByRound returns events in recorded_at order', async () => {
    const { scoreEventService, roundId, participantId } = await setup();
    await scoreEventService.append({
        roundId,
        participantId,
        hole: 1,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
        recordedAt: '2026-05-01T10:00:00.000Z',
    });
    await scoreEventService.append({
        roundId,
        participantId,
        hole: 2,
        strokes: 3,
        eventType: 'score_entered',
        clientEventId: 'c2',
        recordedAt: '2026-05-01T10:05:00.000Z',
    });
    const list = await scoreEventService.listByRound(roundId);
    expect(list.map((e) => e.hole)).toEqual([1, 2]);
});

test('clientEventId uniqueness is scoped per round', async () => {
    const { scoreEventService, roundService, courseService, clubService, participantService, roundId, participantId } = await setup();
    // Another round with its own participant, same clientEventId → should work.
    const club2 = await clubService.create({ name: 'Other GK' });
    const course2 = await courseService.create({ clubId: club2.id, name: 'Other', holeCount: 18 });
    const round2 = await roundService.create({
        courseId: course2.id,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            { slotIndex: 0, scoringMode: 'stroke_play', teamShape: 'individual', allowancePct: 100, scopeConfig: null },
        ],
    });
    const p2 = await participantService.create({ roundId: round2.id });

    const a = await scoreEventService.append({ roundId, participantId, hole: 1, strokes: 4, eventType: 'score_entered', clientEventId: 'shared' });
    const b = await scoreEventService.append({ roundId: round2.id, participantId: p2.id, hole: 1, strokes: 5, eventType: 'score_entered', clientEventId: 'shared' });
    expect(a.inserted).toBe(true);
    expect(b.inserted).toBe(true);
    expect(a.event.id).not.toBe(b.event.id);
});

test('round delete cascades events', async () => {
    const { scoreEventService, roundService, roundId, participantId } = await setup();
    await scoreEventService.append({ roundId, participantId, hole: 1, strokes: 4, eventType: 'score_entered', clientEventId: 'c1' });
    await roundService.remove(roundId);
    const list = await scoreEventService.listByRound(roundId);
    expect(list).toHaveLength(0);
});

test('append with sourcePlayerId persists and round-trips', async () => {
    const { scoreEventService, roundId, participantId, aliceId } = await setup();
    const res = await scoreEventService.append({
        roundId,
        participantId,
        hole: 1,
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
    const { scoreEventService, guestPlayerService, roundId, participantId } = await setup();
    const guest = await guestPlayerService.create({ displayName: 'Guest', gender: 'M', handicapIndex: 12 });
    const res = await scoreEventService.append({
        roundId,
        participantId,
        hole: 1,
        strokes: 5,
        eventType: 'score_entered',
        clientEventId: 'c1',
        sourceGuestPlayerId: guest.id,
    });
    expect(res.event.sourcePlayerId).toBeNull();
    expect(res.event.sourceGuestPlayerId).toBe(guest.id);
});

test('append with both source ids throws', async () => {
    const { scoreEventService, guestPlayerService, roundId, participantId, aliceId } = await setup();
    const guest = await guestPlayerService.create({ displayName: 'Guest', gender: 'M', handicapIndex: 12 });
    await expect(
        scoreEventService.append({
            roundId,
            participantId,
            hole: 1,
            strokes: 4,
            eventType: 'score_entered',
            clientEventId: 'c1',
            sourcePlayerId: aliceId,
            sourceGuestPlayerId: guest.id,
        }),
    ).rejects.toThrow(/sourcePlayerId or sourceGuestPlayerId/);
});

test('append with both source ids null persists (individual / foursomes path)', async () => {
    const { scoreEventService, roundId, participantId } = await setup();
    const res = await scoreEventService.append({
        roundId,
        participantId,
        hole: 1,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
    });
    expect(res.inserted).toBe(true);
    expect(res.event.sourcePlayerId).toBeNull();
    expect(res.event.sourceGuestPlayerId).toBeNull();
});
