// Test helper — seed minimal compiler-output rows (balls, ball_players,
// round_ball_strategies, slots, slot_balls) from existing participants +
// participant_players.
//
// The full RoundCompiler path requires course holes, tee ratings, and a
// valid RoundDefinition. Service-level tests only need the *topology*:
// each participant → one ball, each participant_player → one ball_player
// whose `producer_def_id = participant_players.id` (so the migration's
// join pattern resolves), plus one `slots` row per `round_format_slots`
// row and `slot_balls` routing each ball to its slot via scope.
//
// That's exactly what this helper stamps: one own-ball strategy per round,
// one ball per participant, one ball_player per participant_player, one
// slot per format slot (`slot_def_id = slot-${slotIndex}`), and one
// slot_balls row per (slot, ball) pairing as dictated by scope.
//
// Key invariant — `producer_def_id = participant_players.id`. Mirrors what
// backfill migration 019 did for legacy rounds.
//
// Key invariant — `slots.slot_def_id = slot-${slotIndex}`. Mirrors
// `synthesize-legacy.ts` line 183 — ball-keyed leaderboard parses this
// back out to recover the legacy slotIndex.

import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';

/**
 * For every participant in the given round, create:
 *   - one `round_ball_strategies` row (shared per round).
 *   - one `balls` row.
 *   - one `ball_players` row per participant_player, with
 *     `producer_def_id = participant_players.id`.
 *
 * For every `round_format_slots` row, create:
 *   - one `slots` row (`slot_def_id = slot-${slotIndex}`).
 *   - `slot_balls` rows routing each participant's ball under the slot
 *     whose scope lists the participant. Single-slot rounds with no scope
 *     route every ball to slot 0 (back-compat branch).
 *
 * Idempotent per round: if a strategy already exists for the round, the
 * call no-ops. Safe to call multiple times in the same test.
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

    const strategyId = `strat-${roundId}`;
    if (!existingStrategy) {
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
    }

    const participants = await db
        .selectFrom('participants')
        .select(['id', 'playing_handicap_snapshot'])
        .where('round_id', '=', roundId)
        .execute();

    // participantId → ballId, for later slot_balls fan-out.
    const ballByParticipant = new Map<string, { ballId: string; playingHandicap: number }>();

    // Track which balls already exist so later calls (e.g. after adding new
    // participants or re-scoping) don't try to re-insert.
    const existingBalls = new Set(
        (
            await db
                .selectFrom('balls')
                .select('id')
                .where('round_id', '=', roundId)
                .execute()
        ).map((r) => r.id),
    );

    for (const p of participants) {
        const ballId = `ball-${p.id}`;
        const ph = p.playing_handicap_snapshot ?? 0;
        ballByParticipant.set(p.id, { ballId, playingHandicap: ph });
        if (existingBalls.has(ballId)) continue;
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
            .select([
                'id',
                'player_id',
                'guest_player_id',
                'playing_handicap_snapshot',
            ])
            .where('participant_id', '=', p.id)
            .execute();

        for (const link of links) {
            // `course_handicap_snapshot` on ball_players is what the new
            // ball-keyed leaderboard reads as per-player PH (team formats).
            // For strokes-given math we need the effective PH here — fall
            // back to the team's PH if the link didn't snapshot one.
            const perPlayerPh = link.playing_handicap_snapshot ?? ph;
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
                    course_handicap_snapshot: perPlayerPh,
                })
                .execute();
        }
    }

    // Seed `slots` + `slot_balls` from round_format_slots. Routing mirrors
    // the legacy leaderboard's scope logic so tests exercise the same
    // mapping the new ball-keyed path will read.
    const formatSlots = await db
        .selectFrom('round_format_slots')
        .select([
            'slot_index',
            'scoring_mode',
            'team_shape',
            'allowance_pct',
            'scope_config',
        ])
        .where('round_id', '=', roundId)
        .orderBy('slot_index')
        .execute();

    const singleSlotNoScope =
        formatSlots.length === 1 &&
        (formatSlots[0]!.scope_config === null ||
            !scopeHasParticipantIds(formatSlots[0]!.scope_config));

    // Wipe + re-seed slots/slot_balls on every call so the helper can be
    // called after `roundService.update({formatSlots})` and reflect the new
    // shape (tests widen a bootstrap round to multi-slot scope after seeding).
    await db.deleteFrom('slot_balls').where('slot_id', 'in',
        db.selectFrom('slots').select('id').where('round_id', '=', roundId)).execute();
    await db.deleteFrom('slots').where('round_id', '=', roundId).execute();

    for (const fs of formatSlots) {
        const slotDefId = `slot-${fs.slot_index}`;
        const slotId = `slot-${roundId}-${fs.slot_index}`;
        await db
            .insertInto('slots')
            .values({
                id: slotId,
                round_id: roundId,
                slot_def_id: slotDefId,
                scoring_mode: fs.scoring_mode,
                team_shape: fs.team_shape,
                allowance_config: JSON.stringify({ percent: fs.allowance_pct }),
                ball_mode: 'own',
            })
            .execute();

        const scopeIds = scopeParticipantIds(fs.scope_config);

        for (const [participantId, { ballId, playingHandicap }] of ballByParticipant) {
            const matches = singleSlotNoScope || scopeIds?.includes(participantId) === true;
            if (!matches) continue;
            await db
                .insertInto('slot_balls')
                .values({
                    slot_id: slotId,
                    ball_id: ballId,
                    playing_handicap_snapshot: playingHandicap,
                })
                .execute();
        }
    }
}

function scopeHasParticipantIds(raw: string | null): boolean {
    return scopeParticipantIds(raw) !== null;
}

function scopeParticipantIds(raw: string | null): string[] | null {
    if (raw === null) return null;
    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        // New shape: {scope: {participantIds: [...]}}
        const scope = parsed?.scope as Record<string, unknown> | undefined;
        if (scope && Array.isArray(scope.participantIds)) {
            return scope.participantIds as string[];
        }
        // Legacy: {participantIds: [...]} top-level.
        if (Array.isArray((parsed as Record<string, unknown>).participantIds)) {
            return (parsed as Record<string, unknown>).participantIds as string[];
        }
    } catch {
        return null;
    }
    return null;
}
