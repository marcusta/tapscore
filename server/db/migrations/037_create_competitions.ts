import { sql, type Kysely } from 'kysely';

/**
 * Phase 4 Slice 1 — the Competition wrapper + its roster/rounds/results tables.
 *
 * Four additive tables per REWRITE_DOMAIN_SPEC.md §4/§5/§9/§12 and PHASES.md
 * "Phase 4 — Competition + CompetitionRound". Slice 1 creates the schema and
 * the lifecycle/CRUD/roster service; round materialisation (Slice 2),
 * aggregation (Slice 3), cut + finalize (Slice 4) fill the reserved columns
 * later. The columns those slices need are carried NOW so no later migration
 * has to widen these tables.
 *
 *   competitions            the aggregator + lifecycle + finalization state
 *   competition_rounds      1:1 extension of `rounds`, structural mirror of
 *                           `friendly_rounds` (Slice 2 populates it)
 *   competition_participants explicit roster (player XOR guest), audit-snapshotted
 *   competition_results     immutable finalization snapshot (Slice 4 writes it)
 *
 * FK-target rule (AGENTS.md): SQLite runs `PRAGMA foreign_keys = ON`, so an FK
 * validates its parent table's existence on every write. `point_template_id`
 * (Phase 5) and the Tour/Series FKs (Phases 6/7) therefore land as plain
 * nullable TEXT here and become real FKs via add-column migrations once their
 * parent tables exist — exactly as the ledger spec marks them (`?`). Same
 * discipline as `round_definitions.source_event_id` (migration 018).
 *
 * Booleans are stored as INTEGER 0/1 (SQLite has no boolean), matching
 * `rounds.self_organize`. JSON columns are TEXT (no native JSON), parsed at the
 * service boundary — matching `round_definitions.definition_json` et al.
 */
export async function up(db: Kysely<any>): Promise<void> {
    // --- competitions ---------------------------------------------------------
    await db.schema
        .createTable('competitions')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('name', 'text', (col) => col.notNull())
        /** draft → setup → active → finalized (see CompetitionService machine). */
        .addColumn('lifecycle', 'text', (col) => col.notNull().defaultTo('draft'))
        /** Serialized default slots + category→tee map + start-list mode (Slice 2
         *  copies this into each round's draft). Nullable — a fresh draft has none yet. */
        .addColumn('default_config_json', 'text')
        /** Serialized `{ strategyId, config }` for the leaderboard fold (Slice 3
         *  registry). Nullable/defaulted for now per the ledger spec. */
        .addColumn('aggregation_json', 'text')
        /** Phase 5 PointTemplate FK arrives as an add-column migration; plain
         *  nullable TEXT now because `point_templates` does not exist yet. */
        .addColumn('point_template_id', 'text')
        /** Serialized cut rules (`top_n | top_percent | within_strokes`); Slice 4
         *  reads it in `applyCut`. Nullable — no cut by default. */
        .addColumn('cut_rules_json', 'text')
        /** 0/1 finalization flag; flipped by Slice 4's finalize service only. */
        .addColumn('is_results_final', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('results_finalized_at', 'text')
        /** Creator = owner. RESTRICT (not cascade/set-null): owner is NOT NULL,
         *  and players soft-delete / GDPR-tombstone rather than vanish — same
         *  identity-FK reasoning as `ball_players`. */
        .addColumn('owner_player_id', 'text', (col) =>
            col.notNull().references('players.id').onDelete('restrict'),
        )
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addCheckConstraint(
            'competitions_lifecycle_check',
            sql`lifecycle IN ('draft', 'setup', 'active', 'finalized')`,
        )
        .addCheckConstraint(
            'competitions_is_results_final_check',
            sql`is_results_final IN (0, 1)`,
        )
        // A live competition is not finalized; a final one carries its timestamp.
        // The invariant Slice 4 must maintain, encoded at the schema level.
        .addCheckConstraint(
            'competitions_finalized_consistency_check',
            sql`(is_results_final = 1) = (lifecycle = 'finalized')
                 AND (is_results_final = 0 OR results_finalized_at IS NOT NULL)`,
        )
        .execute();

    await db.schema
        .createIndex('competitions_owner_player_id_index')
        .on('competitions')
        .column('owner_player_id')
        .execute();

    // --- competition_rounds ---------------------------------------------------
    // 1:1 extension of `rounds`, structural mirror of `friendly_rounds`. Slice 2
    // populates it when materialising a round from competition defaults.
    await db.schema
        .createTable('competition_rounds')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('competition_id', 'text', (col) =>
            col.notNull().references('competitions.id').onDelete('cascade'),
        )
        // UNIQUE — a round belongs to at most one competition (mirror of
        // `friendly_rounds.round_id`). Cascade so tearing down the round frees this.
        .addColumn('round_id', 'text', (col) =>
            col.notNull().unique().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('round_number', 'integer', (col) => col.notNull())
        /** Does this round count toward the cut calculation? (Slice 4) */
        .addColumn('cut_eligible', 'integer', (col) => col.notNull().defaultTo(1))
        /** Played only by participants who made the cut? (Slice 4) */
        .addColumn('post_cut', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        // round_number is 1..N and unique within a competition.
        .addUniqueConstraint('competition_rounds_number_unique', [
            'competition_id',
            'round_number',
        ])
        .addCheckConstraint(
            'competition_rounds_number_check',
            sql`round_number >= 1`,
        )
        .addCheckConstraint('competition_rounds_cut_eligible_check', sql`cut_eligible IN (0, 1)`)
        .addCheckConstraint('competition_rounds_post_cut_check', sql`post_cut IN (0, 1)`)
        .execute();

    await db.schema
        .createIndex('competition_rounds_competition_id_index')
        .on('competition_rounds')
        .column('competition_id')
        .execute();

    // --- competition_participants ---------------------------------------------
    // Explicit roster. `player_id` XOR `guest_player_id` — same discriminator-free
    // pattern + RESTRICT identity FKs as `ball_players` (migration 018). A stable
    // `id` PK because `competition_results` keys on `participant_id`.
    await db.schema
        .createTable('competition_participants')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('competition_id', 'text', (col) =>
            col.notNull().references('competitions.id').onDelete('cascade'),
        )
        .addColumn('player_id', 'text', (col) =>
            col.references('players.id').onDelete('restrict'),
        )
        .addColumn('guest_player_id', 'text', (col) =>
            col.references('guest_players.id').onDelete('restrict'),
        )
        /** "Played as" name captured at add time — audit-grade rendering survives
         *  a later rename / soft-delete (spec §9). */
        .addColumn('display_name_snapshot', 'text', (col) => col.notNull())
        .addColumn('category', 'text')
        /** Stamped by Slice 4's `applyCut`; NULL = still in the field. */
        .addColumn('cut_after_round', 'integer')
        /** Stamped on withdrawal; NULL = active. Row kept for audit + aggregation. */
        .addColumn('withdrawn_at', 'text')
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addCheckConstraint(
            'competition_participants_xor_check',
            sql`(player_id IS NULL) <> (guest_player_id IS NULL)`,
        )
        // A given player/guest appears at most once per competition. SQLite treats
        // NULLs as distinct, so the player uniqueness never collides across guest
        // rows (and vice-versa).
        .addUniqueConstraint('competition_participants_player_unique', [
            'competition_id',
            'player_id',
        ])
        .addUniqueConstraint('competition_participants_guest_unique', [
            'competition_id',
            'guest_player_id',
        ])
        .execute();

    await db.schema
        .createIndex('competition_participants_competition_id_index')
        .on('competition_participants')
        .column('competition_id')
        .execute();

    // --- competition_results --------------------------------------------------
    // Immutable finalization snapshot, keyed (competition_id, participant_id,
    // scoring_type). Written on finalize (Slice 4), never updated in place — gross
    // and net publish independently (spec §14 item 6). Finalized audit columns per
    // §12 (who/when).
    await db.schema
        .createTable('competition_results')
        .addColumn('competition_id', 'text', (col) =>
            col.notNull().references('competitions.id').onDelete('cascade'),
        )
        .addColumn('participant_id', 'text', (col) =>
            col.notNull().references('competition_participants.id').onDelete('cascade'),
        )
        .addColumn('scoring_type', 'text', (col) => col.notNull())
        .addColumn('position', 'integer', (col) => col.notNull())
        /** REAL, not INTEGER — tie behaviours (Phase 5 `shared_average`) can split
         *  points fractionally. */
        .addColumn('points', 'real', (col) => col.notNull())
        /** Serialized aggregated totals (per-round + overall arithmetic). */
        .addColumn('totals_json', 'text', (col) => col.notNull())
        /** Serialized tiebreak detail; NULL when no tie broke this row. */
        .addColumn('tiebreak_json', 'text')
        /** §12 finalization audit — who finalized, when. `finalized_by_player_id`
         *  nulls out if that admin is later deleted; the snapshot stands. */
        .addColumn('finalized_by_player_id', 'text', (col) =>
            col.references('players.id').onDelete('set null'),
        )
        .addColumn('finalized_at', 'text', (col) => col.notNull())
        .addPrimaryKeyConstraint('competition_results_pk', [
            'competition_id',
            'participant_id',
            'scoring_type',
        ])
        .addCheckConstraint(
            'competition_results_scoring_type_check',
            sql`scoring_type IN ('gross', 'net')`,
        )
        .execute();

    await db.schema
        .createIndex('competition_results_competition_id_index')
        .on('competition_results')
        .column('competition_id')
        .execute();
}
