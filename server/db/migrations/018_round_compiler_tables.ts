import { type Kysely, sql } from 'kysely';

/**
 * Phase 2.6b/1 — additive schema for the RoundCompiler.
 *
 * Creates the seven tables that the compiler will populate (slice 3a) and
 * that scoring will read from (slice 3b). No drops, no FK pointers from
 * existing tables, no behaviour change. The legacy participants /
 * participant_players / round_format_slots tables stay live; new tables
 * sit alongside until cutover.
 *
 * Layout follows REWRITE_DOMAIN_SPEC.md §17:
 *   round_definitions          versioned source-of-truth document
 *   round_ball_strategies      per-round ball-creation strategy instances
 *   balls                      atomic scoring units
 *   ball_players               per-producer snapshots (tee + CH + identity)
 *   slots                      format slots (replaces round_format_slots later)
 *   slot_balls                 slot × ball with playing-handicap snapshot
 *   slot_ball_teams            own-ball team groupings (better-ball, taliban)
 *
 * Stable def-id columns (`producer_def_id`, `strategy_def_id`,
 * `slot_def_id`) carry the ids assigned in `RoundDefinition`; primary
 * `id` columns carry the deterministic-content-addressed hashes the
 * compiler computes (see server/domain/deterministic-id.ts). Both survive
 * recompile.
 *
 * `superseded_by_version` on round_definitions points within the same
 * (round_id, *) chain. No FK constraint — composite-target self-FKs are
 * awkward in SQLite and the chain integrity is enforced by the compiler.
 *
 * `source_event_id` is a forward reference to slice 4's typed correction
 * events. Stored as nullable text without an FK; the FK lands once those
 * tables exist.
 *
 * JSON columns use TEXT (SQLite has no native JSON type). Parsed at the
 * compiler boundary against Typebox schemas in
 * server/domain/round-definition.ts.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('round_definitions')
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('version', 'integer', (col) => col.notNull())
        .addColumn('definition_json', 'text', (col) => col.notNull())
        .addColumn('compiled_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addColumn('compiled_by', 'text', (col) =>
            col.references('players.id').onDelete('set null'),
        )
        .addColumn('superseded_by_version', 'integer')
        .addColumn('source_kind', 'text', (col) => col.notNull())
        .addColumn('source_event_id', 'text')
        .addPrimaryKeyConstraint('round_definitions_pk', ['round_id', 'version'])
        .addCheckConstraint(
            'round_definitions_source_kind_check',
            sql`source_kind IN ('initial', 'setup_correction', 'allowance_override')`,
        )
        .addCheckConstraint(
            'round_definitions_version_check',
            sql`version >= 1`,
        )
        .addCheckConstraint(
            'round_definitions_superseded_by_check',
            sql`superseded_by_version IS NULL OR superseded_by_version > version`,
        )
        .addCheckConstraint(
            'round_definitions_initial_no_event_check',
            sql`(source_kind = 'initial') = (source_event_id IS NULL)`,
        )
        .execute();

    await db.schema
        .createTable('round_ball_strategies')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('strategy_id', 'text', (col) => col.notNull())
        .addColumn('strategy_def_id', 'text', (col) => col.notNull())
        .addColumn('derivation_config', 'text', (col) => col.notNull())
        .addColumn('composition', 'text')
        .addUniqueConstraint('round_ball_strategies_def_id_unique', [
            'round_id',
            'strategy_def_id',
        ])
        .execute();

    await db.schema
        .createIndex('round_ball_strategies_round_id_index')
        .on('round_ball_strategies')
        .column('round_id')
        .execute();

    await db.schema
        .createTable('balls')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('round_ball_strategy_id', 'text', (col) =>
            col.notNull().references('round_ball_strategies.id').onDelete('cascade'),
        )
        .addColumn('label', 'text')
        .addColumn('course_handicap_snapshot', 'integer', (col) => col.notNull())
        .addColumn('per_producer_ch', 'text')
        .execute();

    await db.schema.createIndex('balls_round_id_index').on('balls').column('round_id').execute();

    await db.schema
        .createIndex('balls_strategy_id_index')
        .on('balls')
        .column('round_ball_strategy_id')
        .execute();

    await db.schema
        .createTable('ball_players')
        .addColumn('ball_id', 'text', (col) =>
            col.notNull().references('balls.id').onDelete('cascade'),
        )
        .addColumn('producer_def_id', 'text', (col) => col.notNull())
        // RESTRICT on both identity FKs preserves the XOR invariant.
        // Spec policy: players soft-delete (`deleted_at`) and GDPR
        // hard-delete keeps a tombstone row; guest_players rows stay.
        // Neither path should ever cascade or null these columns —
        // doing so would either break the XOR check (set null) or
        // silently destroy historical scoring rows (cascade).
        .addColumn('player_id', 'text', (col) =>
            col.references('players.id').onDelete('restrict'),
        )
        .addColumn('guest_player_id', 'text', (col) =>
            col.references('guest_players.id').onDelete('restrict'),
        )
        .addColumn('display_name_snapshot', 'text', (col) => col.notNull())
        .addColumn('handicap_index_snapshot', 'real', (col) => col.notNull())
        .addColumn('category_snapshot', 'text')
        .addColumn('gender_snapshot', 'text')
        .addColumn('tee_id', 'text', (col) =>
            col.references('tees.id').onDelete('set null'),
        )
        .addColumn('tee_name_snapshot', 'text', (col) => col.notNull())
        .addColumn('course_rating_snapshot', 'real', (col) => col.notNull())
        .addColumn('slope_snapshot', 'integer', (col) => col.notNull())
        .addColumn('tee_par_snapshot', 'integer', (col) => col.notNull())
        .addColumn('course_handicap_snapshot', 'integer', (col) => col.notNull())
        .addPrimaryKeyConstraint('ball_players_pk', ['ball_id', 'producer_def_id'])
        .addCheckConstraint(
            'ball_players_xor_check',
            sql`(player_id IS NULL) <> (guest_player_id IS NULL)`,
        )
        .addCheckConstraint(
            'ball_players_gender_check',
            sql`gender_snapshot IS NULL OR gender_snapshot IN ('M', 'F')`,
        )
        .execute();

    await db.schema
        .createIndex('ball_players_player_id_index')
        .on('ball_players')
        .column('player_id')
        .where('player_id', 'is not', null)
        .execute();

    await db.schema
        .createIndex('ball_players_guest_player_id_index')
        .on('ball_players')
        .column('guest_player_id')
        .where('guest_player_id', 'is not', null)
        .execute();

    await db.schema
        .createTable('slots')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('slot_def_id', 'text', (col) => col.notNull())
        .addColumn('scoring_mode', 'text', (col) => col.notNull())
        .addColumn('team_shape', 'text', (col) => col.notNull())
        .addColumn('allowance_config', 'text', (col) => col.notNull())
        .addColumn('ball_mode', 'text', (col) => col.notNull())
        .addUniqueConstraint('slots_def_id_unique', ['round_id', 'slot_def_id'])
        .addCheckConstraint('slots_ball_mode_check', sql`ball_mode IN ('own', 'team')`)
        .execute();

    await db.schema.createIndex('slots_round_id_index').on('slots').column('round_id').execute();

    await db.schema
        .createTable('slot_balls')
        .addColumn('slot_id', 'text', (col) =>
            col.notNull().references('slots.id').onDelete('cascade'),
        )
        .addColumn('ball_id', 'text', (col) =>
            col.notNull().references('balls.id').onDelete('cascade'),
        )
        .addColumn('playing_handicap_snapshot', 'integer', (col) => col.notNull())
        .addPrimaryKeyConstraint('slot_balls_pk', ['slot_id', 'ball_id'])
        .execute();

    await db.schema
        .createIndex('slot_balls_ball_id_index')
        .on('slot_balls')
        .column('ball_id')
        .execute();

    await db.schema
        .createTable('slot_ball_teams')
        .addColumn('slot_id', 'text', (col) =>
            col.notNull().references('slots.id').onDelete('cascade'),
        )
        .addColumn('team_label', 'text', (col) => col.notNull())
        .addColumn('ball_id', 'text', (col) =>
            col.notNull().references('balls.id').onDelete('cascade'),
        )
        .addPrimaryKeyConstraint('slot_ball_teams_pk', ['slot_id', 'team_label', 'ball_id'])
        .execute();

    await db.schema
        .createIndex('slot_ball_teams_ball_id_index')
        .on('slot_ball_teams')
        .column('ball_id')
        .execute();
}
