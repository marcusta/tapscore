import { describe, expect, test } from 'bun:test';

import { createTestDb } from '../testing/db';
import { up as backfillItinerary } from './migrations/024_itinerary_backfill';

/**
 * Migration 024 runs against an empty DB at createTestDb time (no-op). To
 * exercise the backfill we seed a purely-legacy round (frozen course holes +
 * tee holes + tee_times + a ball, but no round_play_holes) and re-invoke `up`.
 */
async function seedLegacyRound(
    db: Awaited<ReturnType<typeof createTestDb>>['db'],
    opts: { roundType: 'full_18' | 'front_9'; teeTimes: { id: string; startHole: number }[] },
) {
    const club = await db
        .insertInto('clubs')
        .values({ id: 'club-l', name: 'Legacy GK', location: null, logo_url: null })
        .returning('id')
        .executeTakeFirstOrThrow();
    await db
        .insertInto('courses')
        .values({ id: 'course-l', club_id: club.id, name: 'Legacy', hole_count: 18 })
        .execute();
    await db
        .insertInto('tees')
        .values({ id: 'tee-l', course_id: 'course-l', name: 'White', colour: null })
        .execute();
    await db
        .insertInto('rounds')
        .values({
            id: 'lr',
            course_id: 'course-l',
            date: '2026-01-01',
            round_type: opts.roundType,
            venue_type: 'outdoor',
            start_list_mode: 'structured',
            self_organize: 0,
            status: 'not_started',
        })
        .execute();
    for (let h = 1; h <= 18; h++) {
        await db
            .insertInto('round_course_holes')
            .values({ round_id: 'lr', hole_number: h, par: 4, base_stroke_index: h })
            .execute();
        await db
            .insertInto('round_tee_holes')
            .values({
                round_id: 'lr',
                tee_id: 'tee-l',
                tee_name_snapshot: 'White',
                hole_number: h,
                length_m: 300,
                stroke_index_override: null,
            })
            .execute();
    }
    await db
        .insertInto('round_ball_strategies')
        .values({
            id: 'strat-l',
            round_id: 'lr',
            strategy_id: 'own_ball_per_player',
            strategy_def_id: 'own',
            derivation_config: '{"type":"single"}',
            composition: null,
        })
        .execute();
    await db
        .insertInto('balls')
        .values({
            id: 'ball-l',
            round_id: 'lr',
            round_ball_strategy_id: 'strat-l',
            label: 'L',
            course_handicap_snapshot: 10,
            per_producer_ch: null,
        })
        .execute();
    for (const tt of opts.teeTimes) {
        await db
            .insertInto('tee_times')
            .values({
                id: tt.id,
                round_id: 'lr',
                start_time: '08:00',
                start_hole: tt.startHole,
                capacity: 4,
                hitting_bay: null,
            })
            .execute();
    }
}

describe('024 itinerary backfill', () => {
    test('full_18 → 18 occurrences + tee snapshots + single group with the ball', async () => {
        const ctx = await createTestDb();
        await seedLegacyRound(ctx.db, { roundType: 'full_18', teeTimes: [{ id: 'tt1', startHole: 1 }] });
        await backfillItinerary(ctx.db as never);

        const holes = await ctx.db
            .selectFrom('round_play_holes')
            .selectAll()
            .where('round_id', '=', 'lr')
            .orderBy('ordinal')
            .execute();
        expect(holes).toHaveLength(18);
        expect(holes.map((h) => h.ordinal)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
        expect(holes[0].course_hole_number).toBe(1);
        expect(holes[0].base_stroke_index).toBe(1);

        const teeRows = await ctx.db
            .selectFrom('round_play_tee_holes')
            .selectAll()
            .where('round_play_hole_id', '=', holes[0].id)
            .execute();
        expect(teeRows).toHaveLength(1);
        expect(teeRows[0].tee_ref).toBe('tee-l');
        expect(teeRows[0].tee_name_snapshot).toBe('White');

        const groups = await ctx.db
            .selectFrom('playing_groups')
            .selectAll()
            .where('round_id', '=', 'lr')
            .execute();
        expect(groups).toHaveLength(1);
        // Start hole 1 maps to the ordinal-1 occurrence.
        expect(groups[0].start_play_hole_id).toBe(holes[0].id);

        const members = await ctx.db
            .selectFrom('playing_group_balls')
            .selectAll()
            .where('playing_group_id', '=', groups[0].id)
            .execute();
        expect(members).toHaveLength(1);
        expect(members[0].ball_id).toBe('ball-l');
    });

    test('multiple groups → groups created, ball membership left empty', async () => {
        const ctx = await createTestDb();
        await seedLegacyRound(ctx.db, {
            roundType: 'full_18',
            teeTimes: [
                { id: 'tt1', startHole: 1 },
                { id: 'tt2', startHole: 10 },
            ],
        });
        await backfillItinerary(ctx.db as never);

        const groups = await ctx.db
            .selectFrom('playing_groups')
            .selectAll()
            .where('round_id', '=', 'lr')
            .execute();
        expect(groups).toHaveLength(2);

        const members = await ctx.db
            .selectFrom('playing_group_balls')
            .selectAll()
            .execute();
        expect(members).toHaveLength(0);
    });
});
