import { type Kysely, sql } from 'kysely';

import { createPlayerStatsViews } from './043_player_stats_views';
import { createFineGrainedPuttingViews } from './044_fine_grained_first_putt';
import { createPlayerStatsV3Views } from './046_player_stats_context_views';

/**
 * Penalty-free means 'no penalty recorded', not 'answered 0'
 * (stats polish pass, owner ruling 2026-08-02).
 *
 * THE DEFECT. `v_player_round_stats` computed the clean side of the penalty tax
 * as `penalties = 0`. But capture asks about penalties on every hole, as a
 * stepper prefilled with 0, and a player with nothing to report simply leaves it
 * alone rather than tapping the zero they are already looking at. So `penalties`
 * is NULL on almost every clean hole, the clean side was almost always empty,
 * `penaltyTax` hit its zero-denominator guard, and the row read 'Not recorded'
 * forever.
 *
 * THE FIX. `COALESCE(penalties, 0) = 0`, which is the same modelling answer
 * SG-lite already gave in assumption 3: a missing penalty capture models as
 * zero. The penalty side (`holes_with_penalty`, `holes_scored_penalty`,
 * `strokes_vs_par_penalty`) still counts the ANSWER and is untouched, so a
 * scored hole now sits on exactly one side of the tax and there is no third
 * state. Both expressions live in `createPlayerStatsViews` (043).
 *
 * VIEWS ONLY. No table is touched and no row is rewritten — this migration
 * drops and re-creates the three-layer view stack from its own exported
 * builders, so it is replayable and a fresh DB reaches the same definitions
 * through 043/044/046 directly.
 *
 * Drop order is top-down, totals before rounds within each layer, because each
 * view reads the one below it (the reasoning is spelled out in 052).
 *
 * No `down` — the house style (001-055) is forward-only.
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
