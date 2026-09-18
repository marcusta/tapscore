import { sql, type Kysely } from 'kysely';

/**
 * Phase 6 Slice 1 — Series + teams (REWRITE_DOMAIN_SPEC.md §6, §19).
 *
 * Seven additive tables. Spec names throughout (`series`, `teams`,
 * `series_teams`, `team_members`) so the later Competition path is an
 * add-column (`competitions.series_id`, FK-target rule — migration 037 header),
 * never a rename.
 *
 *   series                  the wrapper: name, read link, owner
 *   teams                   persistent team identity (name + colour token)
 *   series_teams            M:N junction (spec §6: team-to-series is many-to-many)
 *   team_members            player XOR guest per team
 *   series_rounds           1:1 extension of `rounds` — structural mirror of
 *                           `friendly_rounds` / `competition_rounds`. The ONE
 *                           table spec §19 lacks: a series holds rounds
 *                           directly, so an ordinary friendly round can count
 *                           toward team points without a Competition.
 *   series_round_ball_teams ball → team for one attached round. Prefilled from
 *                           `ball_players` identity against `team_members` at
 *                           attach time, editable after (a per-round guest has
 *                           no cross-round identity). Phase 6 `slot_lineups`
 *                           will write these same rows.
 *   series_point_sources    one row per thing that yields team points: a slot
 *                           of an attached round folded through a registered
 *                           TeamPointsRule, or a round-less manual entry.
 *
 * `rule_id` is deliberately un-CHECKed — an open namespace owned by the
 * TeamPointsRule registry (same reasoning as `competition_results.scoring_type`,
 * migration 038).
 */
export async function up(db: Kysely<any>): Promise<void> {
    // --- series ---------------------------------------------------------------
    await db.schema
        .createTable('series')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('name', 'text', (col) => col.notNull())
        /** Read link. NOT a write credential — mutations are session + authz. */
        .addColumn('share_token', 'text', (col) => col.notNull().unique())
        /** RESTRICT: same identity-FK reasoning as `competitions.owner_player_id`. */
        .addColumn('owner_player_id', 'text', (col) =>
            col.notNull().references('players.id').onDelete('restrict'),
        )
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    await db.schema
        .createIndex('series_owner_player_id_index')
        .on('series')
        .column('owner_player_id')
        .execute();

    // --- teams ----------------------------------------------------------------
    await db.schema
        .createTable('teams')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('name', 'text', (col) => col.notNull())
        /** A colour TOKEN name (`red`, `blue`, …) each client maps to its own
         *  palette — never a hex literal. */
        .addColumn('colour', 'text', (col) => col.notNull())
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    // --- series_teams ---------------------------------------------------------
    await db.schema
        .createTable('series_teams')
        .addColumn('series_id', 'text', (col) =>
            col.notNull().references('series.id').onDelete('cascade'),
        )
        .addColumn('team_id', 'text', (col) =>
            col.notNull().references('teams.id').onDelete('cascade'),
        )
        .addColumn('ordinal', 'integer', (col) => col.notNull())
        .addPrimaryKeyConstraint('series_teams_pk', ['series_id', 'team_id'])
        .execute();

    // --- team_members ---------------------------------------------------------
    // Strict XOR + RESTRICT + two uniques — the `competition_participants`
    // variant (migration 037), not the `ball_players` one (no placeholder rows).
    await db.schema
        .createTable('team_members')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('team_id', 'text', (col) =>
            col.notNull().references('teams.id').onDelete('cascade'),
        )
        .addColumn('player_id', 'text', (col) =>
            col.references('players.id').onDelete('restrict'),
        )
        .addColumn('guest_player_id', 'text', (col) =>
            col.references('guest_players.id').onDelete('restrict'),
        )
        .addColumn('display_name_snapshot', 'text', (col) => col.notNull())
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addCheckConstraint(
            'team_members_identity_xor_check',
            sql`(player_id IS NULL) <> (guest_player_id IS NULL)`,
        )
        // SQLite treats NULLs as distinct, so these never collide across kinds.
        .addUniqueConstraint('team_members_player_unique', ['team_id', 'player_id'])
        .addUniqueConstraint('team_members_guest_unique', ['team_id', 'guest_player_id'])
        .execute();

    // --- series_rounds --------------------------------------------------------
    await db.schema
        .createTable('series_rounds')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('series_id', 'text', (col) =>
            col.notNull().references('series.id').onDelete('cascade'),
        )
        // UNIQUE — a round counts toward at most one series. Cascade so a real
        // round delete frees the wrapper (and its sources, below).
        .addColumn('round_id', 'text', (col) =>
            col.notNull().unique().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('ordinal', 'integer', (col) => col.notNull())
        /** Session label ("Friday AM"). */
        .addColumn('label', 'text', (col) => col.notNull())
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    await db.schema
        .createIndex('series_rounds_series_id_index')
        .on('series_rounds')
        .column('series_id')
        .execute();

    // --- series_round_ball_teams ----------------------------------------------
    await db.schema
        .createTable('series_round_ball_teams')
        .addColumn('series_round_id', 'text', (col) =>
            col.notNull().references('series_rounds.id').onDelete('cascade'),
        )
        // Plain TEXT, no FK: ball ids are recompile-stable (spec §17) but a
        // setup correction may drop a ball; a dangling row is then inert (the
        // fold joins on the live slot balls) rather than a blocked recompile.
        .addColumn('ball_id', 'text', (col) => col.notNull())
        .addColumn('team_id', 'text', (col) =>
            col.notNull().references('teams.id').onDelete('cascade'),
        )
        .addPrimaryKeyConstraint('series_round_ball_teams_pk', ['series_round_id', 'ball_id'])
        .execute();

    // --- series_point_sources -------------------------------------------------
    await db.schema
        .createTable('series_point_sources')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('series_id', 'text', (col) =>
            col.notNull().references('series.id').onDelete('cascade'),
        )
        /** NULL = a round-less entry (a side contest scored on paper). */
        .addColumn('series_round_id', 'text', (col) =>
            col.references('series_rounds.id').onDelete('cascade'),
        )
        /** Stable slot def-id inside the attached round. NULL = the source folds
         *  no slot: a hand-entered result, filed under its session or under none. */
        .addColumn('slot_def_id', 'text')
        .addColumn('rule_id', 'text', (col) => col.notNull())
        .addColumn('config_json', 'text', (col) => col.notNull())
        .addColumn('label', 'text', (col) => col.notNull())
        .addColumn('ordinal', 'integer', (col) => col.notNull())
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addCheckConstraint('series_point_sources_rule_id_check', sql`length(rule_id) > 0`)
        // A slot reference needs its round. The reverse does not hold: a
        // hand-entered result may sit under a session without folding a slot.
        .addCheckConstraint(
            'series_point_sources_slot_needs_round_check',
            sql`slot_def_id IS NULL OR series_round_id IS NOT NULL`,
        )
        .execute();

    await db.schema
        .createIndex('series_point_sources_series_id_index')
        .on('series_point_sources')
        .column('series_id')
        .execute();
}
