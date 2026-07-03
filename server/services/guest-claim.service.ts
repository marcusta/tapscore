import type { Kysely } from 'kysely';
import { ConflictError, NotFoundError } from '@basics/core/server/auth';
import type { Database } from '../db/schema';

// --- Output types ---

export interface ClaimGuestInput {
    /** Share token of the friendly round the guest played in. */
    token: string;
    /** The guest identity being claimed. */
    guestPlayerId: string;
    /** The authenticated claimer — SERVER-resolved from the session, never the body. */
    playerId: string;
}

export interface ClaimGuestResult {
    roundId: string;
    guestPlayerId: string;
    playerId: string;
    /** `ball_players` rows flipped from guest to player. */
    ballPlayersFlipped: number;
    /** `score_events` rows whose `source_guest_player_id` flipped to `source_player_id`. */
    scoreEventsFlipped: number;
}

/**
 * Phase 3 guest-claim (spec §17 open item 5) — the one-time identity flip
 * that turns a guest's participation into a registered player's.
 *
 * Given a share token and a guest who produced a ball in that token's round,
 * flip the guest's `ball_players` rows to the caller's `player_id` (XOR
 * preserved: `player_id` set, `guest_player_id` nulled). `display_name_snapshot`
 * stays FROZEN — the historical scorecard keeps rendering "played as", while
 * the live FK makes the round surface in the player's dashboard query.
 * `score_events` / `scorecards` `source_guest_player_id` values flip the same
 * way so per-player team scoring (better-ball, Taliban, Umbrella) attributes
 * to the account from now on. `recorded_by_player_id` on historical events is
 * NOT touched — who wrote an event is an immutable audit fact.
 *
 * The `guest_players` row is kept as a TOMBSTONE, stamped with
 * `claimed_by_player_id` + `claimed_at` (migration 032): it is never deleted,
 * a second claim is refused with a structured conflict, and the audit chain
 * from snapshot to account survives.
 *
 * Refusals:
 *  - unknown token / unknown guest → NotFoundError (404);
 *  - guest not a producer in the token's round → NotFoundError (404 — the
 *    claim is token-scoped, so a guest from another round is "not found" here);
 *  - guest already claimed → ConflictError (409);
 *  - caller already appears as a player producer in the round → ConflictError
 *    (409 — one person cannot hold two identities in the same round).
 *
 * This service is deliberately cross-aggregate (like DashboardService's read
 * path): the flip must atomically touch `ball_players`, `score_events`,
 * `scorecards`, and `guest_players`, which no single owning service spans.
 * All table references live in the Queries section per the server guide.
 */
export class GuestClaimService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private roundIdByToken(token: string) {
        return this.db
            .selectFrom('friendly_rounds')
            .select('round_id')
            .where('share_token', '=', token);
    }

    private guestById(guestPlayerId: string) {
        return this.db
            .selectFrom('guest_players')
            .selectAll()
            .where('id', '=', guestPlayerId);
    }

    /** `ball_players` rows in the round for one producer column value. */
    private ballPlayersInRound(roundId: string) {
        return this.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .where('b.round_id', '=', roundId);
    }

    private roundBallIds(roundId: string, trx: Kysely<Database> = this.db) {
        return trx.selectFrom('balls').select('id').where('round_id', '=', roundId);
    }

    private guestScoreEventIds(roundId: string, guestPlayerId: string) {
        return this.db
            .selectFrom('score_events')
            .select('id')
            .where('round_id', '=', roundId)
            .where('source_guest_player_id', '=', guestPlayerId);
    }

    // --- Queries (write) ---

    private flipBallPlayers(
        roundId: string,
        guestPlayerId: string,
        playerId: string,
        trx: Kysely<Database>,
    ) {
        return trx
            .updateTable('ball_players')
            .set({ player_id: playerId, guest_player_id: null })
            .where('guest_player_id', '=', guestPlayerId)
            .where('ball_id', 'in', this.roundBallIds(roundId, trx));
    }

    private flipScoreEvents(
        roundId: string,
        guestPlayerId: string,
        playerId: string,
        trx: Kysely<Database>,
    ) {
        return trx
            .updateTable('score_events')
            .set({ source_player_id: playerId, source_guest_player_id: null })
            .where('round_id', '=', roundId)
            .where('source_guest_player_id', '=', guestPlayerId);
    }

    /**
     * Keep the materialised view in lock-step: `scorecards.source_key` is a
     * VIRTUAL generated column over the two source ids, so flipping the ids
     * re-keys the row automatically. No collision is possible — the caller
     * was refused if they already appeared as a player producer in the round.
     */
    private flipScorecards(
        roundId: string,
        guestPlayerId: string,
        playerId: string,
        trx: Kysely<Database>,
    ) {
        return trx
            .updateTable('scorecards')
            .set({ source_player_id: playerId, source_guest_player_id: null })
            .where('source_guest_player_id', '=', guestPlayerId)
            .where('ball_id', 'in', this.roundBallIds(roundId, trx));
    }

    private stampGuestClaimed(
        guestPlayerId: string,
        playerId: string,
        trx: Kysely<Database>,
    ) {
        return trx
            .updateTable('guest_players')
            .set({
                claimed_by_player_id: playerId,
                claimed_at: new Date().toISOString(),
            })
            .where('id', '=', guestPlayerId);
    }

    // --- Methods ---

    async claimGuest(input: ClaimGuestInput): Promise<ClaimGuestResult> {
        const { token, guestPlayerId, playerId } = input;

        const roundRow = await this.roundIdByToken(token).executeTakeFirst();
        if (!roundRow) throw new NotFoundError('friendly round not found');
        const roundId = roundRow.round_id;

        const guest = await this.guestById(guestPlayerId).executeTakeFirst();
        if (!guest) throw new NotFoundError('guest player not found');
        if (guest.claimed_by_player_id !== null) {
            throw new ConflictError('guest already claimed');
        }

        // The guest must actually be a producer in THIS token's round.
        const guestRows = await this.ballPlayersInRound(roundId)
            .where('bp.guest_player_id', '=', guestPlayerId)
            .select('bp.ball_id')
            .execute();
        if (guestRows.length === 0) {
            throw new NotFoundError('guest is not a producer in this round');
        }

        // Double-identity guard: the caller may not already be a player
        // producer in the same round.
        const callerRows = await this.ballPlayersInRound(roundId)
            .where('bp.player_id', '=', playerId)
            .select('bp.ball_id')
            .execute();
        if (callerRows.length > 0) {
            throw new ConflictError('caller already appears as a player in this round');
        }

        // Count the source-id flips up front — kysely's bun-sqlite dialect
        // does not report numUpdatedRows reliably (see server guide §6).
        const eventRows = await this.guestScoreEventIds(roundId, guestPlayerId).execute();

        await this.db.transaction().execute(async (trx) => {
            await this.flipBallPlayers(roundId, guestPlayerId, playerId, trx).execute();
            await this.flipScoreEvents(roundId, guestPlayerId, playerId, trx).execute();
            await this.flipScorecards(roundId, guestPlayerId, playerId, trx).execute();
            await this.stampGuestClaimed(guestPlayerId, playerId, trx).execute();
        });

        return {
            roundId,
            guestPlayerId,
            playerId,
            ballPlayersFlipped: guestRows.length,
            scoreEventsFlipped: eventRows.length,
        };
    }
}
