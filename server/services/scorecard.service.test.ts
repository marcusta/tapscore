import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { pickForSource } from './scorecard.service';

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

// --- per-player source rows (phase 2.5d) ---

async function setupWithTeam() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Halmstad GK' });
    const course = await ctx.courseService.create({ clubId: club.id, name: 'North', holeCount: 18 });
    const round = await ctx.roundService.create({
        courseId: course.id,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            { slotIndex: 0, scoringMode: 'stableford', teamShape: 'better_ball', allowancePct: 90, scopeConfig: null },
        ],
    });
    const alice = await ctx.playerService.register({ username: 'alice', password: 'password123', displayName: 'Alice' });
    const bob = await ctx.playerService.register({ username: 'bob', password: 'password123', displayName: 'Bob' });
    const team = await ctx.participantService.create({
        roundId: round.id,
        teamLabel: 'A&B',
        players: [{ playerId: alice.id }, { playerId: bob.id }],
    });
    return { ...ctx, roundId: round.id, teamId: team.id, aliceId: alice.id, bobId: bob.id };
}

test('two events at same (participant, hole) with different sourcePlayerId persist as separate rows', async () => {
    const { scoreEventService, scorecardService, roundId, teamId, aliceId, bobId } = await setupWithTeam();
    await scoreEventService.append({
        roundId, participantId: teamId, hole: 1, strokes: 4,
        eventType: 'score_entered', clientEventId: 'a1', sourcePlayerId: aliceId,
        recordedAt: '2026-05-01T10:00:00.000Z',
    });
    await scoreEventService.append({
        roundId, participantId: teamId, hole: 1, strokes: 5,
        eventType: 'score_entered', clientEventId: 'b1', sourcePlayerId: bobId,
        recordedAt: '2026-05-01T10:01:00.000Z',
    });
    const sc = await scorecardService.forParticipant(teamId);
    expect(sc.holes).toHaveLength(2);
    const aliceHole = sc.holes.find((h) => h.sourcePlayerId === aliceId)!;
    const bobHole = sc.holes.find((h) => h.sourcePlayerId === bobId)!;
    expect(aliceHole.strokes).toBe(4);
    expect(bobHole.strokes).toBe(5);
});

test('two events at same (participant, hole) with same sourcePlayerId — later overwrites (idempotent replay)', async () => {
    const { scoreEventService, scorecardService, roundId, teamId, aliceId } = await setupWithTeam();
    await scoreEventService.append({
        roundId, participantId: teamId, hole: 1, strokes: 4,
        eventType: 'score_entered', clientEventId: 'a1', sourcePlayerId: aliceId,
        recordedAt: '2026-05-01T10:00:00.000Z',
    });
    await scoreEventService.append({
        roundId, participantId: teamId, hole: 1, strokes: 6,
        eventType: 'score_entered', clientEventId: 'a2', sourcePlayerId: aliceId,
        recordedAt: '2026-05-01T10:05:00.000Z',
    });
    const sc = await scorecardService.forParticipant(teamId);
    expect(sc.holes).toHaveLength(1);
    expect(sc.holes[0].strokes).toBe(6);
    expect(sc.holes[0].sourcePlayerId).toBe(aliceId);
});

test('null source row coexists separately from per-player rows on same hole', async () => {
    const { scoreEventService, scorecardService, roundId, teamId, aliceId } = await setupWithTeam();
    await scoreEventService.append({
        roundId, participantId: teamId, hole: 1, strokes: 4,
        eventType: 'score_entered', clientEventId: 'a1', sourcePlayerId: aliceId,
        recordedAt: '2026-05-01T10:00:00.000Z',
    });
    await scoreEventService.append({
        roundId, participantId: teamId, hole: 1, strokes: 7,
        eventType: 'score_entered', clientEventId: 'team1',
        recordedAt: '2026-05-01T10:01:00.000Z',
    });
    // Later null-source event at the same hole overwrites only the null bucket.
    await scoreEventService.append({
        roundId, participantId: teamId, hole: 1, strokes: 8,
        eventType: 'score_entered', clientEventId: 'team2',
        recordedAt: '2026-05-01T10:02:00.000Z',
    });
    const sc = await scorecardService.forParticipant(teamId);
    expect(sc.holes).toHaveLength(2);
    const nullHole = sc.holes.find((h) => h.sourcePlayerId === null && h.sourceGuestPlayerId === null)!;
    const aliceHole = sc.holes.find((h) => h.sourcePlayerId === aliceId)!;
    expect(nullHole.strokes).toBe(8);
    expect(aliceHole.strokes).toBe(4);
});

test('pickForSource returns the matching hole, null otherwise', async () => {
    const { scoreEventService, scorecardService, roundId, teamId, aliceId, bobId } = await setupWithTeam();
    await scoreEventService.append({
        roundId, participantId: teamId, hole: 1, strokes: 4,
        eventType: 'score_entered', clientEventId: 'a1', sourcePlayerId: aliceId,
    });
    await scoreEventService.append({
        roundId, participantId: teamId, hole: 1, strokes: 5,
        eventType: 'score_entered', clientEventId: 'b1', sourcePlayerId: bobId,
    });
    const sc = await scorecardService.forParticipant(teamId);
    expect(pickForSource(sc.holes, aliceId, null)?.strokes).toBe(4);
    expect(pickForSource(sc.holes, bobId, null)?.strokes).toBe(5);
    expect(pickForSource(sc.holes, 'nonexistent', null)).toBeNull();
    expect(pickForSource(sc.holes, null, null)).toBeNull();
});
