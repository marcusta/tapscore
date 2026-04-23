import { test, expect } from 'bun:test';
import { createTestDb } from '../../testing/db';
import { backfillRoundSnapshots } from './round-snapshots';

async function setup() {
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Halmstad GK' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'North',
        holeCount: 18,
    });
    const holeLengths = Array.from({ length: 18 }, (_, i) => ({
        holeNumber: i + 1,
        lengthM: 300 + i * 10,
        strokeIndexOverride: null,
    }));
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        colour: '#ffd400',
        holeLengths,
        ratings: [
            { gender: 'M', courseRating: 71.2, slope: 132, par: 72, totalLengthM: 6200 },
        ],
    });
    const round = await ctx.roundService.createLegacy({
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
    await ctx.participantService.create({
        roundId: round.id,
        snapshot: { teeId: tee.id, gender: 'M', handicapIndex: 15, allowancePct: 100 },
    });
    return { ...ctx, courseId: course.id, teeId: tee.id, roundId: round.id };
}

test('backfill populates course + tee snapshot rows for existing round', async () => {
    const { db, roundId, teeId } = await setup();
    const res = await backfillRoundSnapshots(db, { mode: 'reseed' });
    expect(res.roundsTouched).toBe(1);
    expect(res.courseHoleRows).toBe(18);
    expect(res.teeHoleRows).toBe(18);

    const round = await db
        .selectFrom('rounds')
        .select(['course_name_snapshot'])
        .where('id', '=', roundId)
        .executeTakeFirstOrThrow();
    expect(round.course_name_snapshot).toBe('North');

    const courseHoles = await db
        .selectFrom('round_course_holes')
        .selectAll()
        .where('round_id', '=', roundId)
        .execute();
    expect(courseHoles).toHaveLength(18);

    const teeHoles = await db
        .selectFrom('round_tee_holes')
        .selectAll()
        .where('round_id', '=', roundId)
        .execute();
    expect(teeHoles).toHaveLength(18);
    expect(teeHoles.every((h) => h.tee_id === teeId)).toBe(true);
    expect(teeHoles.every((h) => h.tee_name_snapshot === 'Yellow')).toBe(true);
});

test('used tee can be deleted after backfill (ON DELETE SET NULL)', async () => {
    const { db, teeService, teeId, roundId } = await setup();
    await backfillRoundSnapshots(db, { mode: 'reseed' });

    await expect(teeService.remove(teeId)).resolves.toBeUndefined();

    const teeHoles = await db
        .selectFrom('round_tee_holes')
        .selectAll()
        .where('round_id', '=', roundId)
        .execute();
    expect(teeHoles).toHaveLength(18);
    expect(teeHoles.every((h) => h.tee_id === null)).toBe(true);
    expect(teeHoles.every((h) => h.tee_name_snapshot === 'Yellow')).toBe(true);
    const lengths = teeHoles
        .sort((a, b) => a.hole_number - b.hole_number)
        .map((h) => h.length_m);
    expect(lengths).toEqual(
        Array.from({ length: 18 }, (_, i) => 300 + i * 10),
    );
});

test('skip-populated mode leaves already-snapshotted rounds untouched', async () => {
    const { db, roundId } = await setup();
    await backfillRoundSnapshots(db, { mode: 'reseed' });

    await db
        .updateTable('rounds')
        .set({ course_name_snapshot: 'Mutated' })
        .where('id', '=', roundId)
        .execute();

    const res = await backfillRoundSnapshots(db, { mode: 'skip-populated' });
    expect(res.roundsTouched).toBe(0);

    const round = await db
        .selectFrom('rounds')
        .select(['course_name_snapshot'])
        .where('id', '=', roundId)
        .executeTakeFirstOrThrow();
    expect(round.course_name_snapshot).toBe('Mutated');
});
