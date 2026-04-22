import { type Kysely, sql } from 'kysely';

/**
 * Phase 2.6a fix — restore tee-deletion semantics on snapshot rows.
 *
 * Reviewer flagged that migration 016 created `round_tee_holes.tee_id`
 * with `ON DELETE RESTRICT`, which diverges from
 * `participants.tee_id_snapshot` (`ON DELETE SET NULL`). After 016's
 * backfill, deleting a tee that ever appeared in a round would fail
 * even though the snapshot rows already carry the frozen length/SI
 * data needed for replay — a regression.
 *
 * Fix: SQLite table rebuild.
 *   - `tee_id` becomes nullable with `ON DELETE SET NULL`.
 *   - New `tee_name_snapshot` (NOT NULL) carries frozen tee identity so
 *     rows stay self-sufficient for rendering after the FK nulls out.
 *
 * PK `(round_id, tee_id, hole_number)` is preserved. SQLite permits NULL
 * in PRIMARY KEY columns (documented quirk, pre-3.0.0 compat). Post-
 * delete rows with `tee_id IS NULL` coexist — the `tee_name_snapshot`
 * keeps them distinguishable in render.
 *
 * Existing rows (from 016's backfill) migrate by joining `tees.name`.
 * At migration time every `tee_id` in `round_tee_holes` still points at
 * a live tee (backfill sourced it from `participants.tee_id_snapshot`
 * which itself survives tee deletion via SET NULL — so historical rows
 * whose tee was already deleted would not have been written in 016's
 * backfill, and are therefore not a concern here).
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('round_tee_holes_new')
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('tee_id', 'text', (col) =>
            col.references('tees.id').onDelete('set null'),
        )
        .addColumn('tee_name_snapshot', 'text', (col) => col.notNull())
        .addColumn('hole_number', 'integer', (col) => col.notNull())
        .addColumn('length_m', 'integer', (col) => col.notNull())
        .addColumn('stroke_index_override', 'integer')
        .addPrimaryKeyConstraint('round_tee_holes_pk', [
            'round_id',
            'tee_id',
            'hole_number',
        ])
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

    await sql`
        INSERT INTO round_tee_holes_new
            (round_id, tee_id, tee_name_snapshot, hole_number, length_m, stroke_index_override)
        SELECT rth.round_id, rth.tee_id, t.name, rth.hole_number, rth.length_m, rth.stroke_index_override
        FROM round_tee_holes rth
        JOIN tees t ON t.id = rth.tee_id
    `.execute(db);

    await db.schema.dropTable('round_tee_holes').execute();
    await sql`ALTER TABLE round_tee_holes_new RENAME TO round_tee_holes`.execute(db);

    await db.schema
        .createIndex('round_tee_holes_tee_id_index')
        .on('round_tee_holes')
        .column('tee_id')
        .execute();
}
