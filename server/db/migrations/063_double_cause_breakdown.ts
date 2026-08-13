import { type Kysely, sql } from 'kysely';

import { createPlayerStatsViews } from './043_player_stats_views';
import { createFineGrainedPuttingViews } from './044_fine_grained_first_putt';
import { createPlayerStatsV3Views } from './046_player_stats_context_views';

/**
 * Where your doubles come from — a cause per double-bogey-or-worse hole
 * (owner question 2026-08-13, docs/proposals/double-cause-breakdown.md).
 *
 * A per-hole `dbl_cause` column in the 043 `hole` CTE assigns ONE cause to
 * every double+ hole with a priority CASE ordered by specificity of evidence:
 *
 *   penalty | failed_recovery | multi_chip | three_putt | trouble_tee |
 *   full_swing | unattributed
 *
 * and eleven measure columns in the base view aggregate it:
 *
 *   dbl_{penalty,failed_recovery,multi_chip,three_putt,trouble_tee,
 *        full_swing,unattributed}
 *                                 the seven cause counts, which PARTITION
 *                                 `double_bogey_plus` — every double+ hole in
 *                                 exactly one bucket, so shares add to 100%
 *   dbl_penalty_{tee,approach,short,unknown}
 *                                 the geography split of the penalty bucket,
 *                                 partitioning `dbl_penalty` by
 *                                 `penalty_source` with the NULL leg named
 *
 * Everything is derived from columns the projection already has — no new
 * capture key, no table change, no row rewritten.
 *
 * VIEWS ONLY. Drop the three-layer view stack top-down (totals before rounds in
 * each layer — the reasoning is spelled out in 052) and re-create it from the
 * exported builders; the new columns live in `createPlayerStatsViews` (043) and
 * reach the v2/v3 layers through their `SELECT base.*`.
 *
 * No `down` — the house style (001-062) is forward-only.
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
