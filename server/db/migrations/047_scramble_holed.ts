import { type Kysely, sql } from 'kysely';

import { createPlayerStatsV3Views } from './046_player_stats_context_views';

/**
 * `scramble_holed_{standard,hard}` — the chip that went in.
 *
 * A holed short-game shot records the coherent lone-`putts = 0` shape: green
 * missed, difficulty answered, zero putts, and NO first-putt bucket (there was
 * no first putt to bucket). Every other short-game column keys off
 * `scramble_first_putt_*`, which by construction cannot see it, so before this
 * migration a hole-out contributed nothing to the client's short-game term and
 * its whole gain fell into the long-game residual — exactly inverting the
 * story the waterfall is supposed to tell.
 *
 * The two new columns are counts with the same denominator as the rest of the
 * scramble family, so they stay additive and the totals view stays a plain SUM.
 *
 * Mechanism: migration 046's `createPlayerStatsV3Views` grew the columns, and
 * this migration drops both v3 views and re-runs it. That is the house idiom —
 * migration 044 calls 043's exported `createPlayerStatsViews` the same way. The
 * views hold no data, so a drop is free; a ledger that already ran 046 gets the
 * extended views here, and a fresh replay creates them at 046 and creates the
 * identical definitions again at 047. Totals is dropped first because it reads
 * the round view.
 *
 * No `down` — the house style (001-046) is forward-only.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await sql`DROP VIEW IF EXISTS v_player_stat_totals_v3`.execute(db);
    await sql`DROP VIEW IF EXISTS v_player_round_stats_v3`.execute(db);

    await createPlayerStatsV3Views(db);
}
