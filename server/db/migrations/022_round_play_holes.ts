import { type Kysely, sql } from 'kysely';

/**
 * Phase 2.6b-final / Slice 3b — explicit hole itinerary.
 *
 * The Round owns the holes that count and their canonical order
 * (REWRITE_DOMAIN_SPEC.md §3, §17). `round_play_holes` is the ordered list
 * of play-hole OCCURRENCES; holes may repeat, and each occurrence freezes
 * its own par + base stroke index (a repeated physical hole can carry a
 * different SI on its second visit). Score-like events target the occurrence
 * id, not the raw course hole number (the event-key migration is Slice 3c).
 *
 *   round_play_holes        ordered occurrence snapshots
 *   round_play_tee_holes    per-occurrence × tee effective length / SI override
 *
 * Stable-id model:
 *   - `play_hole_def_id` is the recompile-stable id assigned in the
 *     RoundDefinition (`ph-{initialOrdinal}` by default). Reordering the
 *     itinerary changes `ordinal` but never this id, so events stay valid.
 *   - `id` is the deterministic content-addressed runtime id
 *     `hash(round_id, play_hole_def_id)` (see deterministic-id.ts).
 *   - `UNIQUE(round_id, id)` is the composite-FK target migration 023's
 *     `playing_groups.start_play_hole_id` references, so a group can never
 *     start at an occurrence belonging to a different round.
 *
 * `round_play_tee_holes` uses a DURABLE tee identity so historical SI/length
 * lookups survive tee deletion: `tee_ref` (immutable original tee id, never
 * nulled, part of the PK) + `tee_name_snapshot`, alongside a nullable live
 * `tee_id` FK kept only for navigation.
 *
 * `base_stroke_index` carries only `>= 1` at the DB level — the upper bound
 * is the route's frozen allocation cycle, validated by the compiler's
 * `normalize` step (a 9-hole-twice route may legitimately use SI up to 18).
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('round_play_holes')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('play_hole_def_id', 'text', (col) => col.notNull())
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('ordinal', 'integer', (col) => col.notNull())
        .addColumn('course_hole_number', 'integer', (col) => col.notNull())
        .addColumn('par', 'integer', (col) => col.notNull())
        .addColumn('base_stroke_index', 'integer', (col) => col.notNull())
        .addUniqueConstraint('round_play_holes_def_id_unique', ['round_id', 'play_hole_def_id'])
        .addUniqueConstraint('round_play_holes_ordinal_unique', ['round_id', 'ordinal'])
        // Composite-FK target for playing_groups.start_play_hole_id.
        .addUniqueConstraint('round_play_holes_round_id_id_unique', ['round_id', 'id'])
        .addCheckConstraint('round_play_holes_ordinal_check', sql`ordinal >= 1`)
        .addCheckConstraint('round_play_holes_par_check', sql`par BETWEEN 3 AND 6`)
        .addCheckConstraint(
            'round_play_holes_base_stroke_index_check',
            sql`base_stroke_index >= 1`,
        )
        .execute();

    await db.schema
        .createIndex('round_play_holes_round_id_index')
        .on('round_play_holes')
        .column('round_id')
        .execute();

    await db.schema
        .createTable('round_play_tee_holes')
        .addColumn('round_play_hole_id', 'text', (col) =>
            col.notNull().references('round_play_holes.id').onDelete('cascade'),
        )
        // Immutable snapshot key — the original tee id, never nulled. Keeps
        // historical SI/length lookup working after the live tee is deleted.
        .addColumn('tee_ref', 'text', (col) => col.notNull())
        .addColumn('tee_name_snapshot', 'text', (col) => col.notNull())
        // Live FK for navigation only; nulls on tee deletion.
        .addColumn('tee_id', 'text', (col) => col.references('tees.id').onDelete('set null'))
        .addColumn('length_m', 'integer', (col) => col.notNull())
        .addColumn('stroke_index_override', 'integer')
        .addPrimaryKeyConstraint('round_play_tee_holes_pk', ['round_play_hole_id', 'tee_ref'])
        .addCheckConstraint('round_play_tee_holes_length_check', sql`length_m > 0`)
        .addCheckConstraint(
            'round_play_tee_holes_stroke_index_override_check',
            sql`stroke_index_override IS NULL OR stroke_index_override >= 1`,
        )
        .execute();

    await db.schema
        .createIndex('round_play_tee_holes_tee_ref_index')
        .on('round_play_tee_holes')
        .column('tee_ref')
        .execute();
}
