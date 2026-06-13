import type { Kysely } from 'kysely';

import { hashId } from '../../domain/deterministic-id';

/**
 * Phase 2.6b-final / Slice 3b — itinerary + playing-group backfill.
 *
 * Gives every pre-existing round an explicit `round_play_holes` itinerary
 * derived from its frozen `round_course_holes` + legacy `round_type`, plus
 * per-occurrence `round_play_tee_holes` from `round_tee_holes`, and promotes
 * each `tee_times` row into a `playing_group`. Existing data carries no
 * repeated-hole ambiguity, so course holes map one-to-one to occurrences.
 *
 * Deterministic ids match the compiler exactly (deterministic-id.ts), so a
 * later recompile of a backfilled round regenerates identical rows:
 *   play_hole_def_id = `ph-{ordinal}`
 *   round_play_holes.id = hash('tapscore:round_play_hole:v1', round_id, def_id)
 *   playing group def-id = the originating tee_time id
 *   playing_groups.id = hash('tapscore:playing_group:v1', round_id, def_id)
 *
 * Playing-group ball membership: legacy data has no producer→group mapping,
 * so we can only assign it unambiguously when a round has exactly one group
 * (assign all its balls). Rounds with multiple groups are left without
 * membership and logged — the explicit producer→group assignment only exists
 * for rounds compiled from a RoundDefinition going forward.
 *
 * Historical `round_definitions.definition_json` is deliberately NOT rewritten
 * here: legacy (pre-3b) definitions are read through `normalize` on demand
 * (round.service), and a round's persisted definition is upgraded to
 * `resolved-v1` the next time it is recompiled.
 */
export async function up(db: Kysely<any>): Promise<void> {
    const rounds = await db
        .selectFrom('rounds')
        .select(['id', 'round_type'])
        .execute();

    for (const round of rounds) {
        const roundId = round.id as string;

        const courseHoles = await db
            .selectFrom('round_course_holes')
            .select(['hole_number', 'par', 'base_stroke_index'])
            .where('round_id', '=', roundId)
            .orderBy('hole_number')
            .execute();
        if (courseHoles.length === 0) {
            console.warn(`[024] round ${roundId} has no frozen course holes — skipping itinerary`);
            continue;
        }

        const itinerary = defaultItinerary(round.round_type as string, courseHoles);

        const teeHoles = await db
            .selectFrom('round_tee_holes')
            .select([
                'tee_id',
                'tee_name_snapshot',
                'hole_number',
                'length_m',
                'stroke_index_override',
            ])
            .where('round_id', '=', roundId)
            .execute();

        const occurrenceIdByCourseHole = new Map<number, string>();
        let ordinal = 0;
        for (const ch of itinerary) {
            ordinal++;
            const defId = `ph-${ordinal}`;
            const id = hashId('tapscore:round_play_hole:v1', roundId, defId);
            // First occurrence of each course hole (legacy data has no repeats).
            if (!occurrenceIdByCourseHole.has(ch.hole_number as number)) {
                occurrenceIdByCourseHole.set(ch.hole_number as number, id);
            }
            await db
                .insertInto('round_play_holes')
                .values({
                    id,
                    play_hole_def_id: defId,
                    round_id: roundId,
                    ordinal,
                    course_hole_number: ch.hole_number,
                    par: ch.par,
                    base_stroke_index: ch.base_stroke_index,
                })
                .execute();

            for (const th of teeHoles) {
                if (th.hole_number !== ch.hole_number) continue;
                await db
                    .insertInto('round_play_tee_holes')
                    .values({
                        round_play_hole_id: id,
                        tee_ref: (th.tee_id ?? th.tee_name_snapshot) as string,
                        tee_name_snapshot: th.tee_name_snapshot,
                        tee_id: th.tee_id,
                        length_m: th.length_m,
                        stroke_index_override: th.stroke_index_override,
                    })
                    .execute();
            }
        }

        // tee_times → playing_groups.
        const teeTimes = await db
            .selectFrom('tee_times')
            .select(['id', 'start_time', 'start_hole', 'capacity', 'hitting_bay'])
            .where('round_id', '=', roundId)
            .execute();

        const groupIds: string[] = [];
        for (const tt of teeTimes) {
            const groupDefId = tt.id as string;
            const groupId = hashId('tapscore:playing_group:v1', roundId, groupDefId);
            const startPlayHoleId =
                occurrenceIdByCourseHole.get(tt.start_hole as number) ??
                // Inconsistent legacy start hole (not in this route): fall back
                // to the first occurrence rather than fail the migration.
                [...occurrenceIdByCourseHole.values()][0];
            if (startPlayHoleId === undefined) continue;
            await db
                .insertInto('playing_groups')
                .values({
                    id: groupId,
                    round_id: roundId,
                    start_time: tt.start_time,
                    start_play_hole_id: startPlayHoleId,
                    capacity: tt.capacity,
                    hitting_bay: tt.hitting_bay,
                })
                .execute();
            groupIds.push(groupId);
        }

        // Ball membership: only unambiguous for a single-group round.
        if (groupIds.length === 1) {
            const balls = await db
                .selectFrom('balls')
                .select('id')
                .where('round_id', '=', roundId)
                .execute();
            for (const b of balls) {
                await db
                    .insertInto('playing_group_balls')
                    .values({ playing_group_id: groupIds[0], ball_id: b.id })
                    .execute();
            }
        } else if (groupIds.length > 1) {
            console.warn(
                `[024] round ${roundId} has ${groupIds.length} playing groups — leaving ball membership empty (no legacy producer→group mapping)`,
            );
        }
    }
}

function defaultItinerary(
    roundType: string,
    courseHoles: { hole_number: number }[],
): { hole_number: number; par: number; base_stroke_index: number }[] {
    const all = courseHoles as { hole_number: number; par: number; base_stroke_index: number }[];
    switch (roundType) {
        case 'front_9':
            return all.filter((h) => h.hole_number <= 9);
        case 'back_9':
            return all.filter((h) => h.hole_number >= 10);
        default:
            return all;
    }
}
