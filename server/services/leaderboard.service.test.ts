import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { seedBallsFromParticipants } from '../testing/balls';
import type { FormatSlot } from './round.service';

const slot: FormatSlot = {
    slotIndex: 0,
    scoringMode: 'stroke_play',
    teamShape: 'individual',
    allowancePct: 100,
    scopeConfig: null,
};

/** seed helper stamps `ball-${participantId}` as each participant's ball id. */
const ballFor = (participantId: string): string => `ball-${participantId}`;

/**
 * Shared setup: an 18-hole par-4 course at HGC with a single tee rated so
 * `courseHandicap(index=9)` = 9 (slope 113, CR 72, par 72 → slope/113 = 1,
 * CR−par = 0, so CH = index = 9). Means a participant snapshotted with
 * index 9 gets playing_handicap 9 exactly, and the 9-hole leaderboard test
 * can reason about stroke allocation cleanly.
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
    const { db, roundService, participantService, playerService, handicapService, scoreEventService, leaderboardService, courseId, teeId } = await setup18();
    const round = await roundService.createLegacy({
        courseId,
        date: '2026-05-01',
        roundType: 'front_9',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [slot],
    });
    const pl = await playerService.register({ username: 'front9-p1', password: 'password123', displayName: 'Front9 P1' });
    await handicapService.record({ playerId: pl.id, handicapIndex: 9, source: 'manual', effectiveDate: '2026-04-01' });
    const p = await participantService.create({
        roundId: round.id,
        snapshot: { teeId, gender: 'M', handicapIndex: 9, allowancePct: 100 },
        players: [{ playerId: pl.id }],
    });
    await seedBallsFromParticipants(db, round.id);
    // PH 9 over 9 holes: baseline = 1, extras = 0 → +1 stroke on every hole.
    for (let h = 1; h <= 9; h++) {
        await scoreEventService.append({
            roundId: round.id,
            ballId: ballFor(p.id),
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
    const { db, roundService, participantService, playerService, scoreEventService, leaderboardService, courseId } = await setup18();
    const round = await roundService.createLegacy({
        courseId,
        date: '2026-05-01',
        roundType: 'back_9',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [slot],
    });
    const pl = await playerService.register({ username: 'back9-p1', password: 'password123', displayName: 'Back9 P1' });
    const p = await participantService.create({ roundId: round.id, players: [{ playerId: pl.id }] });
    await seedBallsFromParticipants(db, round.id);
    for (let h = 10; h <= 18; h++) {
        await scoreEventService.append({
            roundId: round.id,
            ballId: ballFor(p.id),
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

    const frontRound = await ctx.roundService.createLegacy({
        courseId: course.id,
        date: '2026-05-01',
        roundType: 'front_9',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [slot],
    });
    const plFront = await ctx.playerService.register({ username: 'si-front', password: 'password123', displayName: 'SI Front' });
    await ctx.handicapService.record({ playerId: plFront.id, handicapIndex: 9, source: 'manual', effectiveDate: '2026-04-01' });
    const pFront = await ctx.participantService.create({
        roundId: frontRound.id,
        snapshot: { teeId: tee.id, gender: 'M', handicapIndex: 9, allowancePct: 100 },
        players: [{ playerId: plFront.id }],
    });
    await seedBallsFromParticipants(ctx.db, frontRound.id);
    for (let h = 1; h <= 9; h++) {
        await ctx.scoreEventService.append({
            roundId: frontRound.id,
            ballId: ballFor(pFront.id),
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

    const backRound = await ctx.roundService.createLegacy({
        courseId: course.id,
        date: '2026-05-01',
        roundType: 'back_9',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [slot],
    });
    const plBack = await ctx.playerService.register({ username: 'si-back', password: 'password123', displayName: 'SI Back' });
    await ctx.handicapService.record({ playerId: plBack.id, handicapIndex: 9, source: 'manual', effectiveDate: '2026-04-01' });
    const pBack = await ctx.participantService.create({
        roundId: backRound.id,
        snapshot: { teeId: tee.id, gender: 'M', handicapIndex: 9, allowancePct: 100 },
        players: [{ playerId: plBack.id }],
    });
    await seedBallsFromParticipants(ctx.db, backRound.id);
    for (let h = 10; h <= 18; h++) {
        await ctx.scoreEventService.append({
            roundId: backRound.id,
            ballId: ballFor(pBack.id),
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
    const { db, roundService, participantService, playerService, scoreEventService, leaderboardService, courseId } = await setup18();
    const round = await roundService.createLegacy({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [slot],
    });
    const pl = await playerService.register({ username: 'full18-p1', password: 'password123', displayName: 'Full18 P1' });
    const p = await participantService.create({ roundId: round.id, players: [{ playerId: pl.id }] });
    await seedBallsFromParticipants(db, round.id);
    for (let h = 1; h <= 18; h++) {
        await scoreEventService.append({
            roundId: round.id,
            ballId: ballFor(p.id),
            hole: h,
            strokes: 4,
            eventType: 'score_entered',
            clientEventId: `h${h}`,
        });
    }
    const lb = await leaderboardService.forRound(round.id);
    expect(lb.ballResults[0].holes).toHaveLength(18);
});

// Phase 2.6b/3d.3 — this test exercises the LEGACY seed shape (one ball
// per team with 2 ball_players) via `seedBallsFromParticipants`. The
// ball-native leaderboard now requires own-ball topology (one ball per
// producer) plus `slot_ball_teams` groupings, which that helper does not
// emit. Skipped until the helper is updated or the test is rewritten
// against a compiler-driven setup.
test.skip('better-ball leaderboard uses each linked player\'s own frozen PH', async () => {
    const ctx = await setup18();
    const { roundService, participantService, handicapService, playerService, scoreEventService, leaderboardService, courseId, teeId } = ctx;
    const bob = await playerService.register({
        username: 'bob',
        password: 'password123',
        displayName: 'Bob',
    });
    const round = await roundService.createLegacy({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [
            {
                slotIndex: 0,
                scoringMode: 'stableford',
                teamShape: 'better_ball',
                allowancePct: 100,
                scopeConfig: null,
            },
        ],
    });
    const alice = await playerService.register({
        username: 'alice-bb',
        password: 'password123',
        displayName: 'Alice BB',
    });
    await handicapService.record({
        playerId: alice.id,
        handicapIndex: 0,
        source: 'manual',
        effectiveDate: '2026-04-01',
    });
    await handicapService.record({
        playerId: bob.id,
        handicapIndex: 14,
        source: 'manual',
        effectiveDate: '2026-04-01',
    });
    const team = await participantService.create({
        roundId: round.id,
        snapshot: { teeId, gender: 'M', fromPlayerId: alice.id, allowancePct: 100 },
        players: [{ playerId: alice.id }, { playerId: bob.id }],
        teamLabel: 'Alice & Bob',
    });
    await seedBallsFromParticipants(ctx.db, round.id);
    await scoreEventService.append({
        roundId: round.id,
        ballId: ballFor(team.id),
        hole: 5,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'alice-h5',
        sourcePlayerId: alice.id,
    });
    await scoreEventService.append({
        roundId: round.id,
        ballId: ballFor(team.id),
        hole: 5,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'bob-h5',
        sourcePlayerId: bob.id,
    });

    const lb = await leaderboardService.forRound(round.id);
    const result = lb.ballResults[0]!;
    expect(result.holes.find((h) => h.holeNumber === 5)!.points).toBe(3);
    expect(result.totals.find((t) => t.scoringType === 'points')!.value).toBe(3);
});

// --- Multi-slot scope routing (Phase 2.5i) ---

test('single-slot round with no scope defaults every participant to slot 0 (back-compat)', async () => {
    const { db, roundService, participantService, playerService, handicapService, scoreEventService, leaderboardService, courseId, teeId } = await setup18();
    const round = await roundService.createLegacy({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [slot], // no scopeConfig
    });
    const pl1 = await playerService.register({ username: 'ss-p1', password: 'password123', displayName: 'SS P1' });
    const pl2 = await playerService.register({ username: 'ss-p2', password: 'password123', displayName: 'SS P2' });
    await handicapService.record({ playerId: pl1.id, handicapIndex: 9, source: 'manual', effectiveDate: '2026-04-01' });
    await handicapService.record({ playerId: pl2.id, handicapIndex: 9, source: 'manual', effectiveDate: '2026-04-01' });
    const p1 = await participantService.create({
        roundId: round.id,
        snapshot: { teeId, gender: 'M', handicapIndex: 9, allowancePct: 100 },
        players: [{ playerId: pl1.id }],
    });
    const p2 = await participantService.create({
        roundId: round.id,
        snapshot: { teeId, gender: 'M', handicapIndex: 9, allowancePct: 100 },
        players: [{ playerId: pl2.id }],
    });
    await seedBallsFromParticipants(db, round.id);
    for (let h = 1; h <= 18; h++) {
        await scoreEventService.append({
            roundId: round.id, ballId: ballFor(p1.id), hole: h, strokes: 4,
            eventType: 'score_entered', clientEventId: `p1-h${h}`,
        });
        await scoreEventService.append({
            roundId: round.id, ballId: ballFor(p2.id), hole: h, strokes: 5,
            eventType: 'score_entered', clientEventId: `p2-h${h}`,
        });
    }

    const lb = await leaderboardService.forRound(round.id);
    // Both participants land in slot 0; one bucket per scoring type at slotIndex 0.
    expect(lb.byScoringType).toHaveLength(2); // gross + net
    for (const b of lb.byScoringType) {
        expect(b.slotIndex).toBe(0);
        expect(b.entries.map((e) => e.ballId).sort()).toEqual([ballFor(p1.id), ballFor(p2.id)].sort());
    }
});

test('multi-slot round routes each participant to the slot whose scope lists them', async () => {
    const { db, roundService, participantService, playerService, handicapService, scoreEventService, leaderboardService, courseId, teeId } = await setup18();

    // Bootstrap round with a single throwaway slot so we can mint participant ids,
    // then update the round with two slots whose scopes reference those ids.
    const bootstrap = await roundService.createLegacy({
        courseId, date: '2026-05-01', roundType: 'full_18',
        venueType: 'outdoor', startListMode: 'structured',
        formatSlots: [slot],
    });
    const plA = await playerService.register({ username: 'ms-a', password: 'password123', displayName: 'MS A' });
    const plB = await playerService.register({ username: 'ms-b', password: 'password123', displayName: 'MS B' });
    const plC = await playerService.register({ username: 'ms-c', password: 'password123', displayName: 'MS C' });
    await handicapService.record({ playerId: plA.id, handicapIndex: 9, source: 'manual', effectiveDate: '2026-04-01' });
    await handicapService.record({ playerId: plB.id, handicapIndex: 9, source: 'manual', effectiveDate: '2026-04-01' });
    await handicapService.record({ playerId: plC.id, handicapIndex: 9, source: 'manual', effectiveDate: '2026-04-01' });
    const pA = await participantService.create({
        roundId: bootstrap.id, snapshot: { teeId, gender: 'M', handicapIndex: 9, allowancePct: 100 },
        players: [{ playerId: plA.id }],
    });
    const pB = await participantService.create({
        roundId: bootstrap.id, snapshot: { teeId, gender: 'M', handicapIndex: 9, allowancePct: 100 },
        players: [{ playerId: plB.id }],
    });
    const pC = await participantService.create({
        roundId: bootstrap.id, snapshot: { teeId, gender: 'M', handicapIndex: 9, allowancePct: 100 },
        players: [{ playerId: plC.id }],
    });
    await seedBallsFromParticipants(db, bootstrap.id);

    // Now widen to two slots with explicit per-slot scopes.
    await roundService.update(bootstrap.id, {
        formatSlots: [
            {
                slotIndex: 0,
                scoringMode: 'stroke_play',
                teamShape: 'individual',
                allowancePct: 100,
                scopeConfig: { scope: { participantIds: [pA.id, pB.id] } },
            },
            {
                slotIndex: 1,
                scoringMode: 'stableford',
                teamShape: 'individual',
                allowancePct: 100,
                scopeConfig: { scope: { participantIds: [pC.id] } },
            },
        ],
    });
    // Re-seed slots/slot_balls to mirror the post-update format slot shape.
    await seedBallsFromParticipants(db, bootstrap.id);

    for (let h = 1; h <= 18; h++) {
        await scoreEventService.append({ roundId: bootstrap.id, ballId: ballFor(pA.id), hole: h, strokes: 4, eventType: 'score_entered', clientEventId: `a-h${h}` });
        await scoreEventService.append({ roundId: bootstrap.id, ballId: ballFor(pB.id), hole: h, strokes: 5, eventType: 'score_entered', clientEventId: `b-h${h}` });
        await scoreEventService.append({ roundId: bootstrap.id, ballId: ballFor(pC.id), hole: h, strokes: 4, eventType: 'score_entered', clientEventId: `c-h${h}` });
    }

    const lb = await leaderboardService.forRound(bootstrap.id);

    // Slot 0 is stroke-play → emits gross + net; slot 1 is stableford → emits points.
    const slot0Buckets = lb.byScoringType.filter((b) => b.slotIndex === 0);
    const slot1Buckets = lb.byScoringType.filter((b) => b.slotIndex === 1);
    expect(slot0Buckets.map((b) => b.scoringType).sort()).toEqual(['gross', 'net']);
    expect(slot1Buckets.map((b) => b.scoringType)).toEqual(['points']);

    // Cross-slot leakage check: slot 0's buckets only contain pA & pB;
    // slot 1's points bucket only contains pC.
    for (const b of slot0Buckets) {
        expect(b.entries.map((e) => e.ballId).sort()).toEqual([ballFor(pA.id), ballFor(pB.id)].sort());
    }
    for (const b of slot1Buckets) {
        expect(b.entries.map((e) => e.ballId)).toEqual([ballFor(pC.id)]);
    }

    // Ball results carry the slotIndex the strategy ran under.
    const resultA = lb.ballResults.find((r) => r.ballId === ballFor(pA.id))!;
    const resultC = lb.ballResults.find((r) => r.ballId === ballFor(pC.id))!;
    expect(resultA.slotIndex).toBe(0);
    expect(resultC.slotIndex).toBe(1);
});

test('ball not assigned to any slot (slot_balls missing) throws', async () => {
    // Compiler-drift check: seed only pA into any slot_balls row; pOrphan's
    // ball exists in `balls` but has no slot_balls row → leaderboard must
    // surface that so it isn't silently dropped from every bucket.
    const { db, roundService, participantService, leaderboardService, courseId, teeId } = await setup18();
    const bootstrap = await roundService.createLegacy({
        courseId, date: '2026-05-01', roundType: 'full_18',
        venueType: 'outdoor', startListMode: 'structured',
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
    const pA = await participantService.create({
        roundId: bootstrap.id, snapshot: { teeId, gender: 'M', handicapIndex: 9, allowancePct: 100 },
    });
    const pOrphan = await participantService.create({
        roundId: bootstrap.id, snapshot: { teeId, gender: 'M', handicapIndex: 9, allowancePct: 100 },
    });
    await seedBallsFromParticipants(db, bootstrap.id);
    // Manually delete the orphan's slot_balls row to simulate compiler drift.
    await db.deleteFrom('slot_balls').where('ball_id', '=', ballFor(pOrphan.id)).execute();
    // Keep pA in the picture so the round has SOME data.
    void pA;

    expect(leaderboardService.forRound(bootstrap.id)).rejects.toThrow(
        new RegExp(`ball ${ballFor(pOrphan.id)} in round .* is not assigned to any slot`),
    );
});

test('slots row with unparseable slot_def_id throws', async () => {
    // Drift check: a `slots` row whose `slot_def_id` doesn't match the
    // `slot-<N>` pattern written by synthesize-legacy can't be mapped back
    // to a slotIndex. Surface rather than silently partition to slot 0.
    const { db, roundService, participantService, leaderboardService, courseId, teeId } = await setup18();
    const round = await roundService.createLegacy({
        courseId, date: '2026-05-01', roundType: 'full_18',
        venueType: 'outdoor', startListMode: 'structured',
        formatSlots: [slot],
    });
    await participantService.create({
        roundId: round.id, snapshot: { teeId, gender: 'M', handicapIndex: 9, allowancePct: 100 },
    });
    await seedBallsFromParticipants(db, round.id);
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
    const { db, roundService, participantService, playerService, handicapService, scoreEventService, leaderboardService, courseId, teeId } = await setup18();
    const bootstrap = await roundService.createLegacy({
        courseId, date: '2026-05-01', roundType: 'full_18',
        venueType: 'outdoor', startListMode: 'structured',
        formatSlots: [slot],
    });
    const plA = await playerService.register({ username: 'ov-a', password: 'password123', displayName: 'OV A' });
    const plB = await playerService.register({ username: 'ov-b', password: 'password123', displayName: 'OV B' });
    await handicapService.record({ playerId: plA.id, handicapIndex: 9, source: 'manual', effectiveDate: '2026-04-01' });
    await handicapService.record({ playerId: plB.id, handicapIndex: 9, source: 'manual', effectiveDate: '2026-04-01' });
    const pA = await participantService.create({
        roundId: bootstrap.id, snapshot: { teeId, gender: 'M', handicapIndex: 9, allowancePct: 100 },
        players: [{ playerId: plA.id }],
    });
    const pB = await participantService.create({
        roundId: bootstrap.id, snapshot: { teeId, gender: 'M', handicapIndex: 9, allowancePct: 100 },
        players: [{ playerId: plB.id }],
    });
    await seedBallsFromParticipants(db, bootstrap.id);
    await roundService.update(bootstrap.id, {
        formatSlots: [
            {
                slotIndex: 0, scoringMode: 'stableford', teamShape: 'individual', allowancePct: 100,
                scopeConfig: { scope: { participantIds: [pA.id] } },
            },
            {
                slotIndex: 1, scoringMode: 'stableford', teamShape: 'individual', allowancePct: 100,
                scopeConfig: { scope: { participantIds: [pB.id] } },
            },
        ],
    });
    await seedBallsFromParticipants(db, bootstrap.id);
    for (let h = 1; h <= 18; h++) {
        await scoreEventService.append({ roundId: bootstrap.id, ballId: ballFor(pA.id), hole: h, strokes: 4, eventType: 'score_entered', clientEventId: `a-h${h}` });
        await scoreEventService.append({ roundId: bootstrap.id, ballId: ballFor(pB.id), hole: h, strokes: 5, eventType: 'score_entered', clientEventId: `b-h${h}` });
    }

    const lb = await leaderboardService.forRound(bootstrap.id);
    const pointsBuckets = lb.byScoringType.filter((b) => b.scoringType === 'points');
    // TWO separate points buckets, one per slot — 2.5h's collision is resolved.
    expect(pointsBuckets).toHaveLength(2);
    expect(pointsBuckets.map((b) => b.slotIndex).sort()).toEqual([0, 1]);
    expect(pointsBuckets[0]!.entries.map((e) => e.ballId)).toEqual([ballFor(pA.id)]);
    expect(pointsBuckets[1]!.entries.map((e) => e.ballId)).toEqual([ballFor(pB.id)]);
});
