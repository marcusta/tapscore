import { type Kysely, sql } from 'kysely';

import { createPlayerStatsViews } from './043_player_stats_views';
import { createFineGrainedPuttingViews } from './044_fine_grained_first_putt';
import { createPlayerStatsV3Views } from './046_player_stats_context_views';

/**
 * Scoring fidelity in the stats views — three changes, one rebuild
 * (docs/proposals/player-stats-v2.md).
 *
 * 1. PICKUPS ARE UNSCORED. `scorecards.strokes = 0` is a picked-up ball
 *    (REWRITE_DOMAIN_SPEC.md §14 item 7), and migration 043's `hole_scores`
 *    summed it as a real score — so a pickup on a par 4 read as four under par,
 *    and `0 <= par - 1` even counted it as a birdie on a green hit. Fixed once,
 *    at the `hole_scores` boundary, with `NULLIF(strokes, 0)`.
 * 2. ADMISSION WIDENED. The view's grain was "the player recorded a stat here".
 *    It is now "the player scored a hole OR recorded a stat here": a round you
 *    scored is a round you played, and its scoring measures are computable from
 *    the card alone. `stat_players` is renamed `round_players` to say so.
 * 3. THE SCORE-TYPE HISTOGRAM. Four new columns beside `double_bogey_plus`,
 *    partitioning `holes_scored` into eagle-or-better / birdie / par / bogey /
 *    double-or-worse.
 *
 * Mechanism: all three live in `createPlayerStatsViews`, the BOTTOM layer of
 * the three-view chain, so every layer above has to be dropped and re-created.
 * The overlays are pure `SELECT base.* …` / `SELECT totals.* …`, so the new v1
 * columns reach v2 and v3 through the star without a single column list moving.
 * Drop order is top layer first and totals before rounds within each layer,
 * because each view reads the one below it.
 *
 * Migration 044's overlay SQL was inline in its `up()` and is now extracted as
 * `createFineGrainedPuttingViews` — the fix 046's own doc comment prescribes —
 * so this migration re-creates it verbatim rather than forking a second
 * spelling of the same measures.
 *
 * No `down` — the house style (001-051) is forward-only. A fresh replay creates
 * identical definitions at each layer; an existing DB gets the new definitions
 * here.
 */
export async function up(db: Kysely<any>): Promise<void> {
    // Totals before rounds at every layer, and top layer first. SQLite does not
    // track view dependencies on DROP, so any order "works" — but a bottom-up
    // order leaves the dependent views standing over a dropped base until the
    // recreate catches up, which is a window this migration should not have to
    // reason about. Top-down makes the rebuild self-evidently total.
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
