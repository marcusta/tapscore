// Phase 2 gate — end-to-end integration.
//
// Creates a round, 4 participants (2 logged-in players + 2 guests via
// participant_players), pushes score events via the service, verifies:
//
//   - Leaderboard updates as events arrive
//   - client_event_id is idempotent (retry → no duplicate)
//   - Replay determinism: inserting events out of order converges to the
//     same scorecard state as inserting them chronologically.

import { test, expect } from 'bun:test';
import { createTestDb } from './testing/db';
import { seedBallsFromParticipants } from './testing/balls';

async function fullSetup() {
    const ctx = await createTestDb();

    const club = await ctx.clubService.create({ name: 'Halmstad GK' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'North',
        holeCount: 18,
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        colour: '#ffd400',
        holeLengths: [],
        ratings: [
            { gender: 'M', courseRating: 71.2, slope: 132, par: 72, totalLengthM: 6200 },
            { gender: 'F', courseRating: 73.0, slope: 135, par: 72, totalLengthM: 5400 },
        ],
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
    const bob = await ctx.playerService.register({
        username: 'bob',
        password: 'password123',
        displayName: 'Bob',
    });
    await ctx.handicapService.record({
        playerId: alice.id,
        handicapIndex: 10.0,
        source: 'manual',
        effectiveDate: '2026-04-01',
    });
    await ctx.handicapService.record({
        playerId: bob.id,
        handicapIndex: 18.0,
        source: 'manual',
        effectiveDate: '2026-04-01',
    });

    const guestCarol = await ctx.guestPlayerService.create({
        displayName: 'Carol Guest',
        gender: 'F',
        handicapIndex: 24.0,
    });
    const guestDan = await ctx.guestPlayerService.create({
        displayName: 'Dan Guest',
        gender: 'M',
        handicapIndex: 5.0,
    });

    const pAlice = await ctx.participantService.create({
        roundId: round.id,
        snapshot: { teeId: tee.id, gender: 'M', fromPlayerId: alice.id, allowancePct: 100 },
        players: [{ playerId: alice.id }],
    });
    const pBob = await ctx.participantService.create({
        roundId: round.id,
        snapshot: { teeId: tee.id, gender: 'M', fromPlayerId: bob.id, allowancePct: 100 },
        players: [{ playerId: bob.id }],
    });
    const pCarol = await ctx.participantService.create({
        roundId: round.id,
        snapshot: { teeId: tee.id, gender: 'F', handicapIndex: 24.0, allowancePct: 100 },
        players: [{ guestPlayerId: guestCarol.id }],
    });
    const pDan = await ctx.participantService.create({
        roundId: round.id,
        snapshot: { teeId: tee.id, gender: 'M', handicapIndex: 5.0, allowancePct: 100 },
        players: [{ guestPlayerId: guestDan.id }],
    });

    await seedBallsFromParticipants(ctx.db, round.id);

    return {
        ...ctx,
        roundId: round.id,
        aliceId: alice.id,
        bobId: bob.id,
        pAlice: pAlice.id,
        pBob: pBob.id,
        pCarol: pCarol.id,
        pDan: pDan.id,
    };
}

test('full round flow: 4 participants, events, leaderboard, idempotency, replay', async () => {
    const ctx = await fullSetup();
    const {
        scoreEventService,
        scorecardService,
        leaderboardService,
        roundService,
        pAlice,
        pBob,
        pCarol,
        pDan,
        aliceId,
        roundId,
    } = ctx;

    // Snapshots populated.
    const roundBefore = await roundService.getById(roundId);
    expect(roundBefore!.latestEventId).toBeNull();

    // First event — Alice makes 4 on hole 1.
    const e1 = await scoreEventService.append({
        roundId,
        participantId: pAlice,
        hole: 1,
        strokes: 4,
        eventType: 'score_entered',
        recordedByPlayerId: aliceId,
        clientEventId: 'alice-h1-v1',
        recordedAt: '2026-05-01T09:00:00.000Z',
    });
    expect(e1.inserted).toBe(true);
    // recordedAt must be ISO-parseable regardless of whether it came from the
    // DB default (`YYYY-MM-DD HH:MM:SS`) or an explicit pass-through.
    expect(Number.isNaN(Date.parse(e1.event.recordedAt))).toBe(false);

    // Idempotent retry — same clientEventId, returns original.
    const e1Retry = await scoreEventService.append({
        roundId,
        participantId: pAlice,
        hole: 1,
        strokes: 99,
        eventType: 'score_entered',
        clientEventId: 'alice-h1-v1',
    });
    expect(e1Retry.inserted).toBe(false);
    expect(e1Retry.event.id).toBe(e1.event.id);

    // Round cursor moved.
    const roundAfter = await roundService.getById(roundId);
    expect(roundAfter!.latestEventId).toBe(e1.event.id);

    // More events for every participant.
    await scoreEventService.append({ roundId, participantId: pAlice, hole: 2, strokes: 5, eventType: 'score_entered', clientEventId: 'alice-h2', recordedAt: '2026-05-01T09:05:00.000Z' });
    await scoreEventService.append({ roundId, participantId: pBob,   hole: 1, strokes: 5, eventType: 'score_entered', clientEventId: 'bob-h1',   recordedAt: '2026-05-01T09:01:00.000Z' });
    await scoreEventService.append({ roundId, participantId: pBob,   hole: 2, strokes: 6, eventType: 'score_entered', clientEventId: 'bob-h2',   recordedAt: '2026-05-01T09:06:00.000Z' });
    await scoreEventService.append({ roundId, participantId: pCarol, hole: 1, strokes: 6, eventType: 'score_entered', clientEventId: 'carol-h1', recordedAt: '2026-05-01T09:02:00.000Z' });
    await scoreEventService.append({ roundId, participantId: pDan,   hole: 1, strokes: 4, eventType: 'score_entered', clientEventId: 'dan-h1',   recordedAt: '2026-05-01T09:03:00.000Z' });

    // Scorecards reflect events.
    const aliceCard = await scorecardService.forBall(`ball-${pAlice}`);
    expect(aliceCard.holes).toHaveLength(2);
    expect(aliceCard.holes.map((h) => h.strokes)).toEqual([4, 5]);

    // Leaderboard updates — gross ranking respects strokes so far.
    const lb = await leaderboardService.forRound(roundId);
    const gross = lb.byScoringType.find((b) => b.scoringType === 'gross')!;
    expect(gross.entries).toHaveLength(4);
    const firstEntry = gross.entries[0];
    // Dan has only 1 stroke total (4), tied with Alice and Bob having 2 holes played.
    // Among played totals: Dan=4, Alice=9, Bob=11, Carol=6.
    // So order: Dan (4), Carol (6), Alice (9), Bob (11).
    expect(firstEntry.ballId).toBe(`ball-${pDan}`);
    expect(firstEntry.total).toBe(4);
    expect(gross.entries.map((e) => e.ballId)).toEqual([
        `ball-${pDan}`,
        `ball-${pCarol}`,
        `ball-${pAlice}`,
        `ball-${pBob}`,
    ]);
});

test('replay determinism: events inserted out of order converge to same state', async () => {
    const ctx = await fullSetup();
    const { scoreEventService, scorecardService, pAlice, roundId } = ctx;

    // Chronological events for Alice, hole 1:
    //   t=00:00  entered 4
    //   t=00:01  entered 6  (correction)
    //   t=00:02  entered 5  (correction again)
    //
    // Insert them OUT of order: last one first, then first, then middle.
    await scoreEventService.append({
        roundId,
        participantId: pAlice,
        hole: 1,
        strokes: 5,
        eventType: 'score_entered',
        clientEventId: 'ooo-c',
        recordedAt: '2026-05-01T09:00:02.000Z',
    });
    await scoreEventService.append({
        roundId,
        participantId: pAlice,
        hole: 1,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'ooo-a',
        recordedAt: '2026-05-01T09:00:00.000Z',
    });
    await scoreEventService.append({
        roundId,
        participantId: pAlice,
        hole: 1,
        strokes: 6,
        eventType: 'score_entered',
        clientEventId: 'ooo-b',
        recordedAt: '2026-05-01T09:00:01.000Z',
    });

    // Scorecard should reflect the LATEST (by recorded_at) event: strokes=5.
    const card = await scorecardService.forBall(`ball-${pAlice}`);
    expect(card.holes).toHaveLength(1);
    expect(card.holes[0].strokes).toBe(5);
});

test('score_cleared wipes strokes and clears the leaderboard contribution', async () => {
    const ctx = await fullSetup();
    const { scoreEventService, scorecardService, leaderboardService, pAlice, roundId } = ctx;

    await scoreEventService.append({
        roundId,
        participantId: pAlice,
        hole: 1,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'a1',
        recordedAt: '2026-05-01T09:00:00.000Z',
    });
    let card = await scorecardService.forBall(`ball-${pAlice}`);
    expect(card.holes[0].strokes).toBe(4);

    await scoreEventService.append({
        roundId,
        participantId: pAlice,
        hole: 1,
        strokes: null,
        eventType: 'score_cleared',
        clientEventId: 'a2',
        recordedAt: '2026-05-01T09:00:05.000Z',
    });
    card = await scorecardService.forBall(`ball-${pAlice}`);
    expect(card.holes[0].strokes).toBeNull();

    // Leaderboard: everyone has null totals now → all sort last, no winner.
    const lb = await leaderboardService.forRound(roundId);
    const gross = lb.byScoringType.find((b) => b.scoringType === 'gross')!;
    expect(gross.entries.every((e) => e.total === null)).toBe(true);
});
