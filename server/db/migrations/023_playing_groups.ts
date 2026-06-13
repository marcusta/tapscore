import { type Kysely, sql } from 'kysely';

/**
 * Phase 2.6b-final / Slice 3b — playing groups.
 *
 * `playing_groups` is the canonical replacement for `tee_times`
 * (REWRITE_DOMAIN_SPEC.md §17). Every scored ball belongs to exactly one
 * group, which fixes its played-order context: the group's effective order
 * is the itinerary rotated to its `start_play_hole_id`. The old 1-or-10
 * `start_hole` constraint is gone — any itinerary occurrence is a valid
 * normal or shotgun start.
 *
 *   playing_groups        start time / capacity / bay + start occurrence
 *   playing_group_balls    ball ↔ group membership (a ball lives in one group)
 *
 * `start_play_hole_id` uses a COMPOSITE same-round FK
 * `(round_id, start_play_hole_id) → round_play_holes(round_id, id)` so a group
 * physically cannot start at an occurrence from another round. The legacy
 * `tee_times` table + migration 011 survive as a deprecated backfill source
 * only; the physical drop is deferred to the later legacy-schema slice.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('playing_groups')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('start_time', 'text', (col) => col.notNull())
        .addColumn('start_play_hole_id', 'text', (col) => col.notNull())
        .addColumn('capacity', 'integer', (col) => col.notNull())
        .addColumn('hitting_bay', 'text')
        .addForeignKeyConstraint(
            'playing_groups_start_play_hole_fk',
            ['round_id', 'start_play_hole_id'],
            'round_play_holes',
            ['round_id', 'id'],
        )
        .addCheckConstraint('playing_groups_capacity_check', sql`capacity > 0`)
        .execute();

    await db.schema
        .createIndex('playing_groups_round_id_index')
        .on('playing_groups')
        .column('round_id')
        .execute();

    await db.schema
        .createTable('playing_group_balls')
        .addColumn('playing_group_id', 'text', (col) =>
            col.notNull().references('playing_groups.id').onDelete('cascade'),
        )
        .addColumn('ball_id', 'text', (col) =>
            col.notNull().references('balls.id').onDelete('cascade'),
        )
        .addPrimaryKeyConstraint('playing_group_balls_pk', ['playing_group_id', 'ball_id'])
        // A ball belongs to exactly one group across the whole round.
        .addUniqueConstraint('playing_group_balls_ball_unique', ['ball_id'])
        .execute();

    await db.schema
        .createIndex('playing_group_balls_ball_id_index')
        .on('playing_group_balls')
        .column('ball_id')
        .execute();
}
