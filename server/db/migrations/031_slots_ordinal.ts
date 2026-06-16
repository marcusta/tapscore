import { type Kysely, sql } from 'kysely';

/**
 * Phase 2.6d-final E3 — slot ORDER comes from a persisted `ordinal`, never from
 * parsing a `slot-<N>` id. `slot_def_id` stays an opaque stable identifier, so a
 * round may use human-meaningful ids (`main-stableford`, `afternoon-match`)
 * without the result path breaking.
 *
 * `ordinal` is 0-based (matching the old parsed `slot-N` presentation index) and
 * assigned at persist time from the compiled slot order. Existing rows backfill
 * from insertion order (`rowid`), which equals the definition order that
 * produced the `slot-N` ids — so historical results are unchanged.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema.alterTable('slots').addColumn('ordinal', 'integer').execute();
    await sql`
        WITH ord AS (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY round_id ORDER BY rowid) - 1 AS o FROM slots
        )
        UPDATE slots SET ordinal = (SELECT o FROM ord WHERE ord.id = slots.id)
    `.execute(db);
    // Non-unique: a recompile that reorders slots updates ordinals one row at a
    // time (upsert loop), which would transiently collide under a unique index.
    await db.schema
        .createIndex('slots_round_ordinal_index')
        .on('slots')
        .columns(['round_id', 'ordinal'])
        .execute();
}
