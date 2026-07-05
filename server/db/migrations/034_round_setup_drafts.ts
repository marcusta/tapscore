import { sql, type Kysely } from 'kysely';

/**
 * Phase 3.5 — persisted, versioned `RoundSetupDraft` (edit-after-create).
 *
 * The round-setup wizard authors a `RoundSetupDraft`; until now only the
 * COMPILED definition was stored, so nothing was editable in the wizard's own
 * vocabulary after creation. This table stores the draft per round, versioned.
 *
 * Why its OWN table rather than a `draft_json` column on `round_definitions`:
 * the two chains are deliberately NOT 1:1. Definition versions are minted by
 * every correction kind (per-field setup corrections, allowance overrides,
 * self-join) — most of which have no corresponding draft change and must not
 * be forced to carry (or NULL out) a draft column. Conversely the draft is a
 * wizard-level document owned by the setup-edit path, not by the compiler:
 * threading it through `persistCompiledRound` (shared by every recompile
 * path) would leak the wizard's vocabulary into the compiler boundary. A
 * sibling `(round_id, version)` chain mirrors the `round_definitions`
 * convention while keeping the layers apart.
 *
 * Chain discipline: latest = MAX(version) per round (no
 * `superseded_by_version` pointer — the draft chain is only ever read at its
 * head; the definition chain needs the pointer because `latestDefinition`
 * predates it and reads by `superseded_by_version IS NULL`).
 *
 * `source_event_id` points at the `setup_correction_events` row whose
 * recompile this draft version accompanied (`setup_edit` / `self_join`);
 * NULL only for `initial` (created with the round, no correction). Plain
 * TEXT, no FK — same polymorphic-audit-reference discipline as
 * `round_definitions.source_event_id` (migration 018/027).
 *
 * No backfill: rounds created before this migration (or via the direct
 * `RoundDefinition` admin path) simply have no rows here and are reported
 * not-editable by the setup read endpoint.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('round_setup_drafts')
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('version', 'integer', (col) => col.notNull())
        /** Serialized `RoundSetupDraft` (route-template already resolved + frozen). */
        .addColumn('draft_json', 'text', (col) => col.notNull())
        .addColumn('source_kind', 'text', (col) => col.notNull())
        .addColumn('source_event_id', 'text')
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addPrimaryKeyConstraint('round_setup_drafts_pk', ['round_id', 'version'])
        .addCheckConstraint('round_setup_drafts_version_check', sql`version >= 1`)
        .addCheckConstraint(
            'round_setup_drafts_source_kind_check',
            sql`source_kind IN ('initial', 'setup_edit', 'self_join')`,
        )
        .addCheckConstraint(
            'round_setup_drafts_initial_no_event_check',
            sql`(source_kind = 'initial') = (source_event_id IS NULL)`,
        )
        .execute();
}
