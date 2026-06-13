import { type Kysely, sql } from 'kysely';

/**
 * Phase 2.6b-final / Slice 3a — generic format identity on `slots`.
 *
 * `slots` becomes the canonical slot store. Two new generic columns:
 *   - `format_id`     — the registered format plugin id, stored verbatim.
 *                       The compiler no longer decomposes a formatId into
 *                       `(scoring_mode, team_shape)` and recovers it later;
 *                       identity lives here directly. An unknown-but-registered
 *                       format id (e.g. a canary) round-trips intact instead
 *                       of collapsing to `custom × custom`.
 *   - `format_config` — serialized `SlotDefinition.formatConfig` (the
 *                       per-slot, format-specific options blob), or null.
 *
 * No format-specific columns or tables — both are opaque to the schema.
 * `scoring_mode` / `team_shape` survive only as registry-derived query
 * metadata (the compiler now copies them from the plugin descriptor); they
 * are no longer behaviour lookup keys.
 *
 * Backfill: every `slots` row was written by the compiler, so the latest
 * `round_definitions` version for its round carries the authoritative
 * `formatId` + `formatConfig` keyed by stable `slot_def_id`. Copy them in —
 * no decomposition map involved. SQLite has no NOT NULL ADD COLUMN without a
 * default; the column is added nullable and the compiler always writes it
 * going forward.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await sql`ALTER TABLE slots ADD COLUMN format_id text`.execute(db);
    await sql`ALTER TABLE slots ADD COLUMN format_config text`.execute(db);

    const defs = await db
        .selectFrom('round_definitions')
        .where('superseded_by_version', 'is', null)
        .select(['round_id', 'definition_json'])
        .execute();

    for (const d of defs) {
        const def = JSON.parse(d.definition_json as string) as {
            slots?: { id: string; formatId: string; formatConfig?: unknown }[];
        };
        for (const slot of def.slots ?? []) {
            await db
                .updateTable('slots')
                .set({
                    format_id: slot.formatId,
                    format_config:
                        slot.formatConfig === undefined
                            ? null
                            : JSON.stringify(slot.formatConfig),
                })
                .where('round_id', '=', d.round_id)
                .where('slot_def_id', '=', slot.id)
                .execute();
        }
    }
}
