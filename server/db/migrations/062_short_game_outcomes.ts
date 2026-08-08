import { type Kysely, sql } from 'kysely';

import { createPlayerStatsViews } from './043_player_stats_views';
import { createFineGrainedPuttingViews } from './044_fine_grained_first_putt';
import { createPlayerStatsV3Views } from './046_player_stats_context_views';

/**
 * Short-game outcomes — what happened AFTER the chip (owner request 2026-08-08).
 *
 * 29 new measure columns in the 043 base view, per difficulty
 * (standard / hard / bunker):
 *
 *   scramble_single_chip_{d}      denominator: attempts that took ONE shot to
 *                                 reach the green (COALESCE(strokes, 1) = 1)
 *   scramble_chip_in_{d}          … and holed it (putts = 0)
 *   scramble_chip_one_putt_{d}    … and one putt — the up-and-down
 *   scramble_chip_two_putt_{d}    … and two putts — the bogey save
 *   scramble_chip_three_putt_{d}  … and three or more
 *   holes_multi_chip_{standard,hard}  completes the multi-chip family the
 *                                 bunker leg started in 055
 *   scramble_inside_2m_resolved_{d} / scramble_inside_2m_saved_{d}
 *                                 the failure decomposition: when the chip DID
 *                                 finish inside 2 m, did the putt go in?
 *   holes_scored_miss_{d} / strokes_vs_par_miss_{d}
 *                                 the cost of a miss, per difficulty — the
 *                                 split of strokes_vs_par_gir_miss
 *
 * Everything is derivable from columns the projection already has — no new
 * capture key, no table change, no row rewritten. The four outcome buckets plus
 * multi-chip PARTITION scramble_attempts_{d}, so a client can draw one bar per
 * difficulty whose segments sum to the attempts.
 *
 * VIEWS ONLY. Drop the three-layer view stack top-down (totals before rounds in
 * each layer — the reasoning is spelled out in 052) and re-create it from the
 * exported builders; the new columns live in `createPlayerStatsViews` (043) and
 * reach the v2/v3 layers through their `SELECT base.*`.
 *
 * No `down` — the house style (001-061) is forward-only.
 */
export async function up(db: Kysely<any>): Promise<void> {
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
