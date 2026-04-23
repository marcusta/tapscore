// Test helper — seed minimal compiler-output rows (balls, ball_players,
// round_ball_strategies) from existing participants + participant_players.
//
// The full RoundCompiler path requires course holes, tee ratings, and a
// valid RoundDefinition. Service-level tests only need the *topology*:
// each participant → one ball, each participant_player → one ball_player
// whose `producer_def_id = participant_players.id` (so the migration's
// join pattern resolves).
//
// That's exactly what this helper stamps: one own-ball strategy per round,
// one ball per participant, and one ball_player per participant_player —
// with the XOR invariant honoured and every NOT NULL column filled with
// placeholder values. Anything richer (real CH, real tee) is out of scope
// for the services under test and would duplicate compiler logic.
//
// Key invariant — `producer_def_id = participant_players.id`. This is what
// the backfill migration (019) did for legacy rounds: it carried
// participant_players.id forward as the producer_def_id, so both the
// forward lookup (score-event append: participant_id → ball_id) and the
// reverse projection (scorecard/event row → participant_id) work off that
// single equality.

import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';

/**
 * For every participant in the given round, create:
 *   - one `round_ball_strategies` row (shared per round).
 *   - one `balls` row.
 *   - one `ball_players` row per participant_player, with
 *     `producer_def_id = participant_players.id`.
 *
 * Safe to call after `participantService.create(...)` — the helper reads
 * the legacy participant tables and writes the compiler tables.
 *
 * Idempotent per round: if a strategy already exists for the round, the
 * call no-ops. (Lets `setupWithTeam` and `setup` coexist in the same
 * test file without extra bookkeeping.)
 */
export async function seedBallsFromParticipants(
    db: Kysely<Database>,
    roundId: string,
): Promise<void> {
    const existingStrategy = await db
        .selectFrom('round_ball_strategies')
        .select('id')
        .where('round_id', '=', roundId)
        .executeTakeFirst();
    if (existingStrategy) return;

    const strategyId = `strat-${roundId}`;
    await db
        .insertInto('round_ball_strategies')
        .values({
            id: strategyId,
            round_id: roundId,
            strategy_id: 'own_ball_per_player',
            strategy_def_id: `strat-def-${roundId}`,
            derivation_config: '{}',
            composition: null,
        })
        .execute();

    const participants = await db
        .selectFrom('participants')
        .select(['id'])
        .where('round_id', '=', roundId)
        .execute();

    for (const p of participants) {
        const ballId = `ball-${p.id}`;
        await db
            .insertInto('balls')
            .values({
                id: ballId,
                round_id: roundId,
                round_ball_strategy_id: strategyId,
                label: null,
                course_handicap_snapshot: 0,
                per_producer_ch: null,
            })
            .execute();

        const links = await db
            .selectFrom('participant_players')
            .select(['id', 'player_id', 'guest_player_id'])
            .where('participant_id', '=', p.id)
            .execute();

        for (const link of links) {
            await db
                .insertInto('ball_players')
                .values({
                    ball_id: ballId,
                    producer_def_id: link.id,
                    player_id: link.player_id,
                    guest_player_id: link.guest_player_id,
                    display_name_snapshot: 'test',
                    handicap_index_snapshot: 0,
                    category_snapshot: null,
                    gender_snapshot: null,
                    tee_id: null,
                    tee_name_snapshot: 'test',
                    course_rating_snapshot: 72,
                    slope_snapshot: 113,
                    tee_par_snapshot: 72,
                    course_handicap_snapshot: 0,
                })
                .execute();
        }
    }
}
