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
    const p1 = await ctx.participantService.create({ roundId: round.id });
    const p2 = await ctx.participantService.create({ roundId: round.id });
    return { ...ctx, roundId: round.id, p1Id: p1.id, p2Id: p2.id };
}

test('trigger creates scorecard row on event insert', async () => {
    const { scoreEventService, scorecardService, roundId, p1Id } = await setup();
    await scoreEventService.append({
        roundId,
        participantId: p1Id,
        hole: 1,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
    });
    const sc = await scorecardService.forParticipant(p1Id);
    expect(sc.holes).toHaveLength(1);
    expect(sc.holes[0]).toMatchObject({ holeNumber: 1, strokes: 4 });
});

test('later event for same hole overwrites scorecard row', async () => {
    const { scoreEventService, scorecardService, roundId, p1Id } = await setup();
    await scoreEventService.append({
        roundId,
        participantId: p1Id,
        hole: 1,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
        recordedAt: '2026-05-01T10:00:00.000Z',
    });
    await scoreEventService.append({
        roundId,
        participantId: p1Id,
        hole: 1,
        strokes: 5,
        eventType: 'score_entered',
        clientEventId: 'c2',
        recordedAt: '2026-05-01T10:05:00.000Z',
    });
    const sc = await scorecardService.forParticipant(p1Id);
    expect(sc.holes).toHaveLength(1);
    expect(sc.holes[0].strokes).toBe(5);
});

test('score_cleared wipes strokes but keeps row', async () => {
    const { scoreEventService, scorecardService, roundId, p1Id } = await setup();
    await scoreEventService.append({
        roundId,
        participantId: p1Id,
        hole: 1,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'c1',
        recordedAt: '2026-05-01T10:00:00.000Z',
    });
    await scoreEventService.append({
        roundId,
        participantId: p1Id,
        hole: 1,
        strokes: null,
        eventType: 'score_cleared',
        clientEventId: 'c2',
        recordedAt: '2026-05-01T10:05:00.000Z',
    });
    const sc = await scorecardService.forParticipant(p1Id);
    expect(sc.holes).toHaveLength(1);
    expect(sc.holes[0].strokes).toBeNull();
});

test('out-of-order insert converges on latest recorded_at', async () => {
    const { scoreEventService, scorecardService, roundId, p1Id } = await setup();
    // Insert the LATER event first.
    await scoreEventService.append({
        roundId,
        participantId: p1Id,
        hole: 1,
        strokes: 5,
        eventType: 'score_entered',
        clientEventId: 'late',
        recordedAt: '2026-05-01T10:05:00.000Z',
    });
    // Then the EARLIER event. Trigger must NOT overwrite.
    await scoreEventService.append({
        roundId,
        participantId: p1Id,
        hole: 1,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'early',
        recordedAt: '2026-05-01T10:00:00.000Z',
    });
    const sc = await scorecardService.forParticipant(p1Id);
    expect(sc.holes[0].strokes).toBe(5); // latest (by recorded_at) wins
});

test('null strokes (DNP) and zero strokes (pickup) are both preserved', async () => {
    const { scoreEventService, scorecardService, roundId, p1Id } = await setup();
    await scoreEventService.append({
        roundId,
        participantId: p1Id,
        hole: 1,
        strokes: 0,
        eventType: 'score_entered',
        clientEventId: 'c1',
    });
    await scoreEventService.append({
        roundId,
        participantId: p1Id,
        hole: 2,
        strokes: null,
        eventType: 'score_entered',
        clientEventId: 'c2',
    });
    const sc = await scorecardService.forParticipant(p1Id);
    const hole1 = sc.holes.find((h) => h.holeNumber === 1)!;
    const hole2 = sc.holes.find((h) => h.holeNumber === 2)!;
    expect(hole1.strokes).toBe(0);
    expect(hole2.strokes).toBeNull();
});

test('forRound groups by participant', async () => {
    const { scoreEventService, scorecardService, roundId, p1Id, p2Id } = await setup();
    await scoreEventService.append({ roundId, participantId: p1Id, hole: 1, strokes: 4, eventType: 'score_entered', clientEventId: 'a' });
    await scoreEventService.append({ roundId, participantId: p2Id, hole: 1, strokes: 5, eventType: 'score_entered', clientEventId: 'b' });
    await scoreEventService.append({ roundId, participantId: p1Id, hole: 2, strokes: 3, eventType: 'score_entered', clientEventId: 'c' });
    const list = await scorecardService.forRound(roundId);
    expect(list).toHaveLength(2);
    const p1Card = list.find((s) => s.participantId === p1Id)!;
    expect(p1Card.holes).toHaveLength(2);
});
