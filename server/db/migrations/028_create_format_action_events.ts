import { sql, type Kysely } from 'kysely';

/**
 * Phase 2.6d — stateful format-action seam (REWRITE_DOMAIN_SPEC.md §17).
 *
 * `format_action_events` is the GENERIC envelope for in-round, stateful format
 * decisions (Wolf role rotation, scramble drive selection, Bingo-Bango-Bongo
 * order, …). Persistence owns ONLY the envelope — there are no per-format
 * columns, tables, or switch statements. A registered FormatPlugin declares and
 * validates its own action types; the append path checks the slot's format owns
 * the type and the payload passes that plugin's schema.
 *
 * Append-only + auditable: rows are never updated or deleted in place. A later
 * action may explicitly SUPERSEDE an earlier one (`supersedes_action_id`)
 * according to the plugin's declared replay rules.
 *
 * Keyed by the stable `slot_def_id` (survives recompiles) + optional
 * `play_hole_id` (content-addressed occurrence id) + a `sequence` ordinal that
 * orders actions within one played-hole occurrence. FK discipline matches the
 * correction tables: only `round_id` (CASCADE) + `recorded_by_player_id`
 * (SET NULL) are real FKs; the domain refs are stable ids stored as TEXT.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('format_action_events')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        /** Stable slot def-id — which slot's format owns this action. */
        .addColumn('slot_def_id', 'text', (col) => col.notNull())
        /** Content-addressed play-hole occurrence id; null for round-level actions. */
        .addColumn('play_hole_id', 'text')
        /** Order within one (slot, play-hole) occurrence. */
        .addColumn('sequence', 'integer', (col) => col.notNull().defaultTo(0))
        /** Plugin-declared action type (e.g. 'choose_partner', 'set_role'). */
        .addColumn('action_type', 'text', (col) => col.notNull())
        /** Plugin action schema version. */
        .addColumn('schema_version', 'integer', (col) => col.notNull().defaultTo(1))
        /** Optional subject refs (stable): a ball or producer the action concerns. */
        .addColumn('subject_ball_id', 'text')
        .addColumn('subject_producer_def_id', 'text')
        /** JSON payload — validated by the owning plugin, opaque to persistence. */
        .addColumn('payload', 'text', (col) => col.notNull())
        /** Append-only supersession: this action replaces a prior one. */
        .addColumn('supersedes_action_id', 'text')
        .addColumn('recorded_by_player_id', 'text', (col) =>
            col.references('players.id').onDelete('set null'),
        )
        .addColumn('recorded_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        /** Idempotency key — unique per round. */
        .addColumn('client_event_id', 'text', (col) => col.notNull())
        .addUniqueConstraint('format_action_events_client_event_unique', [
            'round_id',
            'client_event_id',
        ])
        .execute();

    await db.schema
        .createIndex('format_action_events_round_slot_index')
        .on('format_action_events')
        .columns(['round_id', 'slot_def_id'])
        .execute();
}
