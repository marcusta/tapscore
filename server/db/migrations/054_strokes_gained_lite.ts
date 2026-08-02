import { type Kysely, sql } from 'kysely';

import { createPlayerStatsViews } from './043_player_stats_views';
import { createFineGrainedPuttingViews } from './044_fine_grained_first_putt';
import { createPlayerStatsV3Views } from './046_player_stats_context_views';

/**
 * strokes-gained-lite v1 — the attribution cohort in the stats views
 * (docs/proposals/strokes-gained-lite.md §4).
 *
 * One new capture column and 29 new aggregate columns, all of them restricted
 * to one common set of holes.
 *
 * 1. `player_hole_stats.short_game_strokes`. Always NULL today — nothing
 *    writes it, and the read service does not know it exists. It ships now so
 *    the wave-4 short-game stroke counter is a CAPTURE change rather than a
 *    second view rebuild: `043` already reads it through `COALESCE(…, 1)`, so
 *    the day an event starts writing it, approach subtracts the same effective
 *    C that short game charges and the decomposition keeps telescoping. SQLite
 *    permits a column-level CHECK on `ADD COLUMN` when the default is NULL.
 *
 * 2. THE ATTRIBUTION COHORT. The five terms of the decomposition (tee,
 *    approach, short game, putting, penalties) sum EXACTLY to
 *    `Σ (score − E_HOLE[par])` — but only if all five are computed over the
 *    same holes. Mixing cohorts turns the leftover into the difference between
 *    overlapping samples rather than a coverage measure, which is why the
 *    proposal admits no residual row at all. So `043`'s `hole` CTE grows one
 *    `attributable` boolean and every `att_*` column filters on it.
 *
 * 3. WHY NEW COLUMNS AND NOT A DERIVATION. The approach term needs sums
 *    (strokes, putts, penalties) over the cohort, and the wave-3 SG-prep
 *    columns cannot reconstruct them: they are over ALL tee-recorded holes, and
 *    they are CUMULATIVE (`in_play_hits_par4` includes the fairways), so
 *    `Σ E_AFTER_TEE` is not expressible from them. The six new tee cells are
 *    STRICT and partition the par-4/5 cohort. The cumulative columns stay
 *    exactly as they are — a rate wants a maximal denominator, only the
 *    summable decomposition wants the common cohort, and the two live side by
 *    side (proposal §5).
 *
 * Every new column is a COUNT or a SUM, so `v_player_stat_totals` stays a plain
 * SUM of the round view and a client-side window equals a server-side one. The
 * arithmetic that turns these counts into strokes lives in the client twins,
 * against the frozen `SG_TABLES_V1`; the server ships counts, the client ships
 * rates, unchanged.
 *
 * Mechanism is migration 052/053's exactly: `createPlayerStatsViews` is the
 * single definition of the base view, this migration only re-runs it, and the
 * layers above are dropped top-down and re-created from their own exported
 * builders. The overlays are `SELECT base.* …`, so the new columns reach v2 and
 * v3 through the star and 044/046/047 are untouched.
 *
 * ORDER MATTERS HERE in a way it did not in 052/053: the rebuilt base view
 * references `phs.short_game_strokes`, so the ALTER comes first. On a FRESH
 * database the view created back at migration 043 already names a column that
 * does not exist yet — harmless, because SQLite resolves a view's columns when
 * it is queried and not when it is created, and nothing selects from these
 * views between 043 and here.
 *
 * No `down` — the house style (001-053) is forward-only.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE player_hole_stats
        ADD COLUMN short_game_strokes INTEGER
            CHECK (short_game_strokes IS NULL OR short_game_strokes BETWEEN 1 AND 5)
    `.execute(db);

    // Totals before rounds at every layer, and top layer first — the same
    // top-down order migration 052 argues for.
    await sql`DROP VIEW IF EXISTS v_player_stat_totals_v3`.execute(db);
    await sql`DROP VIEW IF EXISTS v_player_round_stats_v3`.execute(db);
    await sql`DROP VIEW IF EXISTS v_player_stat_totals_v2`.execute(db);
    await sql`DROP VIEW IF EXISTS v_player_round_stats_v2`.execute(db);
    await sql`DROP VIEW IF EXISTS v_player_stat_totals`.execute(db);
    await sql`DROP VIEW IF EXISTS v_player_round_stats`.execute(db);

    await createPlayerStatsViews(db);
    await createFineGrainedPuttingViews(db);
    await createPlayerStatsV3Views(db);
}
