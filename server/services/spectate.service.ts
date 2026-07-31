import type { Kysely } from 'kysely';

import type { Database, RoundStatus } from '../db/schema';
import type { RoundResult } from '../domain/strategies/result-sections';
import type { FriendsActivityService } from './friends-activity.service';
import type { LeaderboardService } from './leaderboard.service';
import type { Round, RoundService } from './round.service';

// --- Output types ---

/**
 * What a spectator gets: the round and its canonical `RoundResult` — exactly
 * what the token path serves — and NOTHING addressed to a participant.
 *
 * THE authoritative statement for this feature, referred to from the feed, the
 * spectate API, the SSE route and both test files rather than restated there:
 * the share token is the round's WRITE CREDENTIAL (AGENTS.md says as much
 * about `/api/admin/rounds`), so handing one to a spectator would promote them
 * to a participant with no one having added them — the one thing the "you are
 * added, you do not join" rule exists to prevent. Here it is absent by
 * construction rather than by filtering: this shape is assembled from `rounds`
 * and the leaderboard, and `friendly_rounds` is never read in this service.
 *
 * `cursor` is `rounds.latest_event_id`, the same opaque marker the token-scoped
 * result read publishes, so a spectator's SSE stream and refetch loop work the
 * way a participant's does.
 */
export interface SpectateView {
    round: Round;
    result: RoundResult;
    cursor: string | null;
    status: RoundStatus;
}

/** Round identity + cursor + lifecycle for the spectate SSE stream — the
 *  session-scoped twin of `FriendlyRoundService.liveStateByToken`. */
export interface SpectateLiveState {
    roundId: string;
    latestEventId: string | null;
    status: RoundStatus;
}

/**
 * Discriminated rather than thrown, so the API layer maps refusal to 403 and
 * absence to 404 without an error crossing the service boundary (the shape
 * `FriendlyRoundService.removeByToken` already uses).
 */
export type SpectateResult<T> =
    | { ok: true; value: T }
    | { ok: false; reason: 'not_found' | 'forbidden' };

/**
 * The read-only live view of someone else's round (friends-activity v1,
 * docs/proposals/friends-activity.md).
 *
 * STRICTLY read. There is no mutating counterpart anywhere in this service, and
 * that is the design, not an omission: a player who is not in a round can never
 * edit it, and the affordance is absent rather than disabled. Membership only
 * ever arrives by someone already in the round adding you.
 *
 * Authorization is `FriendsActivityService.canView` — session + visibility, not
 * the share token. Every method re-asks it, including the stream's per-emit
 * refresh, so a round flipped to `private` mid-view stops answering at once.
 */
export class SpectateService {
    constructor(
        private db: Kysely<Database>,
        private visibility: FriendsActivityService,
        private rounds: RoundService,
        private leaderboards: LeaderboardService,
    ) {}

    // --- Queries (read) ---

    /** Round identity + cursor + lifecycle — the stream's whole payload, and
     *  all this service may read off `rounds`. */
    private liveRow(roundId: string) {
        return this.db
            .selectFrom('rounds')
            .select(['id', 'latest_event_id', 'status'])
            .where('id', '=', roundId);
    }

    // --- Methods ---

    private async gate(
        roundId: string,
        viewerPlayerId: string,
    ): Promise<{ ok: false; reason: 'not_found' | 'forbidden' } | null> {
        const allowed = await this.visibility.canView(roundId, viewerPlayerId);
        if (allowed === null) return { ok: false, reason: 'not_found' };
        if (!allowed) return { ok: false, reason: 'forbidden' };
        return null;
    }

    async viewFor(
        roundId: string,
        viewerPlayerId: string,
    ): Promise<SpectateResult<SpectateView>> {
        const refused = await this.gate(roundId, viewerPlayerId);
        if (refused) return refused;

        const round = await this.rounds.getById(roundId);
        // The gate already proved the row exists; a null here means it was
        // deleted between the two reads, which is a 404 like any other.
        if (!round) return { ok: false, reason: 'not_found' };

        const result = await this.leaderboards.resultForRound(roundId);
        return {
            ok: true,
            value: {
                round,
                result,
                cursor: round.latestEventId,
                status: round.status,
            },
        };
    }

    async liveStateFor(
        roundId: string,
        viewerPlayerId: string,
    ): Promise<SpectateResult<SpectateLiveState>> {
        const refused = await this.gate(roundId, viewerPlayerId);
        if (refused) return refused;

        const row = await this.liveRow(roundId).executeTakeFirst();
        if (!row) return { ok: false, reason: 'not_found' };
        return {
            ok: true,
            value: {
                roundId: row.id,
                latestEventId: row.latest_event_id,
                status: row.status,
            },
        };
    }
}
