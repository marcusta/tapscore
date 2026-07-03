import { type Kysely, sql } from 'kysely';

/**
 * Phase 2.6a — course + hole snapshot tables, soft-delete column.
 *
 * Pure snapshot plumbing. No behaviour change, no live write hooks.
 * Tee/rating/CH per producer lands on `ball_players` in 2.6b alongside
 * the balls refactor — so this migration deliberately omits
 * `rounds.tee_rating_snapshot` etc.
 *
 * History note (Phase 2.7a): this migration originally ended with a
 * legacy backfill (`backfillRoundSnapshots`) that populated the snapshot
 * tables from the pre-compiler `participants` bridge for rounds existing
 * at migration time. The bridge schema was edited out of the chain; on a
 * fresh DB the backfill was a no-op, so only the schema DDL remains.
 *
 * Column name note: existing tables use `hole_number` (see `course_holes`,
 * `tee_hole_lengths`). The spec prose in PHASES.md says `hole_no`; code
 * follows the established convention so future joins line up.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('rounds')
        .addColumn('course_name_snapshot', 'text')
        .execute();

    await db.schema
        .alterTable('players')
        .addColumn('deleted_at', 'text')
        .execute();

    await db.schema
        .createTable('round_course_holes')
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('hole_number', 'integer', (col) => col.notNull())
        .addColumn('par', 'integer', (col) => col.notNull())
        .addColumn('base_stroke_index', 'integer', (col) => col.notNull())
        .addPrimaryKeyConstraint('round_course_holes_pk', ['round_id', 'hole_number'])
        .addCheckConstraint(
            'round_course_holes_hole_number_check',
            sql`hole_number BETWEEN 1 AND 18`,
        )
        .addCheckConstraint('round_course_holes_par_check', sql`par BETWEEN 3 AND 6`)
        .addCheckConstraint(
            'round_course_holes_base_stroke_index_check',
            sql`base_stroke_index BETWEEN 1 AND 18`,
        )
        .execute();

    await db.schema
        .createTable('round_tee_holes')
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('tee_id', 'text', (col) =>
            col.notNull().references('tees.id').onDelete('restrict'),
        )
        .addColumn('hole_number', 'integer', (col) => col.notNull())
        .addColumn('length_m', 'integer', (col) => col.notNull())
        .addColumn('stroke_index_override', 'integer')
        .addPrimaryKeyConstraint('round_tee_holes_pk', ['round_id', 'tee_id', 'hole_number'])
        .addCheckConstraint(
            'round_tee_holes_hole_number_check',
            sql`hole_number BETWEEN 1 AND 18`,
        )
        .addCheckConstraint('round_tee_holes_length_check', sql`length_m > 0`)
        .addCheckConstraint(
            'round_tee_holes_stroke_index_override_check',
            sql`stroke_index_override IS NULL OR stroke_index_override BETWEEN 1 AND 18`,
        )
        .execute();

    await db.schema
        .createIndex('round_tee_holes_tee_id_index')
        .on('round_tee_holes')
        .column('tee_id')
        .execute();
}
