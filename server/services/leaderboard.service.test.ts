import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import type { FormatSlot } from './round.service';

const slot: FormatSlot = {
    slotIndex: 0,
    scoringMode: 'stroke_play',
    teamShape: 'individual',
    allowancePct: 100,
    scopeConfig: null,
};

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
    const { roundService, participantService, scoreEventService, leaderboardService, courseId, teeId } = await setup18();
    const round = await roundService.create({
        courseId,
        date: '2026-05-01',
        roundType: 'front_9',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [slot],
    });
    const p = await participantService.create({
        roundId: round.id,
        snapshot: { teeId, gender: 'M', handicapIndex: 9, allowancePct: 100 },
    });
    // PH 9 over 9 holes: baseline = 1, extras = 0 → +1 stroke on every hole.
    for (let h = 1; h <= 9; h++) {
        await scoreEventService.append({
            roundId: round.id,
            participantId: p.id,
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
    expect(lb.participantResults[0].holes.map((h) => h.holeNumber)).toEqual(
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
});

test('back_9 round uses holes 10..18 only', async () => {
    const { roundService, participantService, scoreEventService, leaderboardService, courseId } = await setup18();
    const round = await roundService.create({
        courseId,
        date: '2026-05-01',
        roundType: 'back_9',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [slot],
    });
    const p = await participantService.create({ roundId: round.id });
    for (let h = 10; h <= 18; h++) {
        await scoreEventService.append({
            roundId: round.id,
            participantId: p.id,
            hole: h,
            strokes: 4,
            eventType: 'score_entered',
            clientEventId: `h${h}`,
        });
    }

    const lb = await leaderboardService.forRound(round.id);
    const gross = lb.byScoringType.find((b) => b.scoringType === 'gross')!;
    expect(gross.entries[0].total).toBe(36); // 9 × par 4
    expect(lb.participantResults[0].holes.map((h) => h.holeNumber)).toEqual(
        [10, 11, 12, 13, 14, 15, 16, 17, 18],
    );
});

test('full_18 round still covers all 18 holes', async () => {
    const { roundService, participantService, scoreEventService, leaderboardService, courseId } = await setup18();
    const round = await roundService.create({
        courseId,
        date: '2026-05-01',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        formatSlots: [slot],
    });
    const p = await participantService.create({ roundId: round.id });
    for (let h = 1; h <= 18; h++) {
        await scoreEventService.append({
            roundId: round.id,
            participantId: p.id,
            hole: h,
            strokes: 4,
            eventType: 'score_entered',
            clientEventId: `h${h}`,
        });
    }
    const lb = await leaderboardService.forRound(round.id);
    expect(lb.participantResults[0].holes).toHaveLength(18);
});
