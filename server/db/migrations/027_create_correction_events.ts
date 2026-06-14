import { sql, type Kysely } from 'kysely';

/**
 * Phase 2.6d — typed correction events (REWRITE_DOMAIN_SPEC.md §17).
 *
 * Corrections are TYPED, not a generic override bus. Three append-only tables,
 * each with distinct semantics:
 *
 *   setup_correction_events   pre-finalization fix on a RoundDefinition INPUT
 *                             (producer tee / handicap index / category / ball
 *                             composition / slot declaration / ball-strategy
 *                             config). The compiler mutates the stored
 *                             definition into a new `round_definitions` version
 *                             and recomputes ALL downstream outputs. Never
 *                             targets compiler-output rows.
 *   allowance_override_events slot-level allowance change post-setup, keyed by
 *                             the stable `slot_def_id`. Folds into the
 *                             definition chain (new version,
 *                             source_kind='allowance_override'); only
 *                             `deriveSlotBalls` on the affected slot re-runs.
 *   ruling_events             post-play competitive ruling (DQ, penalty
 *                             strokes, hole adjudication, WD). Read by the
 *                             scoring layer; NO re-derivation.
 *
 * FK discipline: only `round_id` (CASCADE) and `recorded_by_player_id`
 * (SET NULL) are real FKs. Every domain reference is a STABLE def-id /
 * content-addressed id (producer_def_id, slot_def_id, ball id, play_hole id)
 * stored as plain TEXT — they survive recompiles by construction, so a row FK
 * would only fight the diff-upsert/round-delete ordering for no integrity gain.
 * `round_definitions.source_event_id` already exists (migration 018) and points
 * back here by id (polymorphic across the three tables → no single FK).
 */
export async function up(db: Kysely<any>): Promise<void> {
    // --- setup_correction_events ---
    await db.schema
        .createTable('setup_correction_events')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        // producer_tee | producer_handicap_index | producer_category |
        // ball_composition | slot_declaration | ball_strategy_config
        .addColumn('target', 'text', (col) => col.notNull())
        /** JSON: stable def-id ref(s) — shape depends on `target`. */
        .addColumn('target_ref', 'text', (col) => col.notNull())
        /** JSON: old + new input values (audit; both retained). */
        .addColumn('old_value', 'text')
        .addColumn('new_value', 'text', (col) => col.notNull())
        .addColumn('reason', 'text', (col) => col.notNull())
        .addColumn('recorded_by_player_id', 'text', (col) =>
            col.references('players.id').onDelete('set null'),
        )
        .addColumn('recorded_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        /** The `round_definitions.version` this correction produced (audit). */
        .addColumn('result_version', 'integer')
        /** Idempotency key — unique per round. */
        .addColumn('client_event_id', 'text', (col) => col.notNull())
        .addUniqueConstraint('setup_correction_events_client_event_unique', [
            'round_id',
            'client_event_id',
        ])
        .execute();

    await db.schema
        .createIndex('setup_correction_events_round_id_index')
        .on('setup_correction_events')
        .column('round_id')
        .execute();

    // --- allowance_override_events ---
    await db.schema
        .createTable('allowance_override_events')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        /** Stable slot def-id (not the compiled slot row id). */
        .addColumn('slot_def_id', 'text', (col) => col.notNull())
        /** JSON: `FormatAllowanceConfig` before / after. */
        .addColumn('old_config', 'text', (col) => col.notNull())
        .addColumn('new_config', 'text', (col) => col.notNull())
        .addColumn('reason', 'text', (col) => col.notNull())
        .addColumn('recorded_by_player_id', 'text', (col) =>
            col.references('players.id').onDelete('set null'),
        )
        .addColumn('recorded_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addColumn('result_version', 'integer')
        .addColumn('client_event_id', 'text', (col) => col.notNull())
        .addUniqueConstraint('allowance_override_events_client_event_unique', [
            'round_id',
            'client_event_id',
        ])
        .execute();

    await db.schema
        .createIndex('allowance_override_events_round_id_index')
        .on('allowance_override_events')
        .column('round_id')
        .execute();

    // --- ruling_events ---
    await db.schema
        .createTable('ruling_events')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        // ball_hole | ball_total | slot_ball_result
        .addColumn('target', 'text', (col) => col.notNull())
        /**
         * Stable subject id. `ball_hole` → `${ballId}:${playHoleId}`;
         * `ball_total` → `${ballId}`; `slot_ball_result` → `${slotDefId}:${ballId}`.
         * Content-addressed → survives recompiles.
         */
        .addColumn('target_id', 'text', (col) => col.notNull())
        // dq | penalty_strokes | hole_adjudication | wd
        .addColumn('ruling_kind', 'text', (col) => col.notNull())
        /** JSON: e.g. `{ "strokes": 2 }` or `{ "disqualified": true }`. */
        .addColumn('value', 'text', (col) => col.notNull())
        .addColumn('reason', 'text', (col) => col.notNull())
        .addColumn('recorded_by_player_id', 'text', (col) =>
            col.references('players.id').onDelete('set null'),
        )
        .addColumn('recorded_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addColumn('client_event_id', 'text', (col) => col.notNull())
        .addUniqueConstraint('ruling_events_client_event_unique', [
            'round_id',
            'client_event_id',
        ])
        .execute();

    await db.schema
        .createIndex('ruling_events_round_id_index')
        .on('ruling_events')
        .column('round_id')
        .execute();
}
