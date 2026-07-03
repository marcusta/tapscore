import { sql, type Kysely, type Selectable } from 'kysely';
import type { Database, FriendlyRoundsTable } from '../db/schema';
import type { CompilerDiagnostic } from '../domain/compiler/types';
import type { RoundSetupDraft } from '../domain/round-setup/draft';
import type { Round, RoundBall, RoundService } from './round.service';
import type {
    AppendResult,
    AppendScoreEventInput,
    ScoreEventService,
} from './score-event.service';
import type { Scorecard, ScorecardService } from './scorecard.service';
import type { LeaderboardService } from './leaderboard.service';
import type { RoundResult } from '../domain/strategies/result-sections';

// --- Output types ---

export interface FriendlyRound {
    id: string;
    roundId: string;
    shareToken: string;
    creatorPlayerId: string | null;
    createdAt: string;
}

/**
 * Result of minting a FriendlyRound. Failure carries the same structured
 * compiler diagnostics as `createFromDraft` — invalid setup never mints a
 * round, a wrapper, or a token, and never throws a 500.
 */
export type CreateFriendlyRoundResult =
    | { ok: true; round: Round; friendlyRound: FriendlyRound }
    | { ok: false; diagnostics: CompilerDiagnostic[] };

/**
 * A trust-based score write, addressed by share token instead of round id.
 * Derived from `AppendScoreEventInput` minus `roundId` (resolved from the
 * token) and `recordedByPlayerId` (session-resolved by the server — see
 * `appendScoreByToken`; never client-supplied). Deriving rather than
 * re-listing keeps the token path in lock-step with the canonical append input.
 */
export type TokenScoreInput = Omit<
    AppendScoreEventInput,
    'roundId' | 'recordedByPlayerId'
> & { token: string };

// --- Row mapping ---

type FriendlyRoundRow = Selectable<FriendlyRoundsTable>;

function toFriendlyRound(row: FriendlyRoundRow): FriendlyRound {
    return {
        id: row.id,
        roundId: row.round_id,
        shareToken: row.share_token,
        creatorPlayerId: row.creator_player_id,
        createdAt: row.created_at,
    };
}

/**
 * FriendlyRound = a Round reachable by share token with NO login.
 *
 * Trust boundary (2.6e): the share token is the ONLY credential. Anyone who
 * holds it can read the round and write score events to it — there are no
 * identities, owners, or per-actor authorization yet. This is a deliberate,
 * documented gap for the dogfood phase; auth/identity land in a later phase.
 *
 * Creation order: the Round is compiled FIRST (course/players/formats, via the
 * proven `RoundService.createFromDraft`). The wrapper + token are minted only
 * once that round exists, so `round_id` is a real, non-null FK.
 */
export class FriendlyRoundService {
    constructor(
        private db: Kysely<Database>,
        private rounds: RoundService,
        private scoreEvents: ScoreEventService,
        private scorecards: ScorecardService,
        private leaderboards: LeaderboardService,
    ) {}

    /**
     * `creatorPlayerId` is SERVER-resolved (Phase 3): the API layer reads it
     * from the session the global auth middleware validated — it is never
     * accepted from the request body. Anonymous creation stays fully
     * functional; a session merely enriches the wrapper with its creator.
     */
    async create(
        draft: RoundSetupDraft,
        creatorPlayerId: string | null = null,
    ): Promise<CreateFriendlyRoundResult> {
        // Compile the round first. Invalid setup returns structured diagnostics
        // and mints nothing — no half-written round, wrapper, or token.
        const created = await this.rounds.createFromDraft(draft);
        if (!created.ok) return { ok: false, diagnostics: created.diagnostics };

        const friendlyRound: FriendlyRound = {
            id: crypto.randomUUID(),
            roundId: created.round.id,
            shareToken: crypto.randomUUID(),
            creatorPlayerId,
            createdAt: new Date().toISOString(),
        };
        await this.db
            .insertInto('friendly_rounds')
            .values({
                id: friendlyRound.id,
                round_id: friendlyRound.roundId,
                share_token: friendlyRound.shareToken,
                creator_player_id: creatorPlayerId,
            })
            .execute();

        return { ok: true, round: created.round, friendlyRound };
    }

    async findByToken(
        token: string,
    ): Promise<{ friendlyRound: FriendlyRound; round: Round } | null> {
        const row = await this.db
            .selectFrom('friendly_rounds')
            .selectAll()
            .where('share_token', '=', token)
            .executeTakeFirst();
        if (!row) return null;
        const round = await this.rounds.getById(row.round_id);
        if (!round) return null;
        return { friendlyRound: toFriendlyRound(row), round };
    }

    /**
     * Every friendly round, newest first, each paired with its resolved round
     * for a summary view. No auth — the landing page is the no-login front door.
     * Ordered by insertion (`rowid`) rather than `created_at`, which is only
     * second-resolution and would tie for rounds minted in the same second.
     */
    async list(): Promise<Array<{ friendlyRound: FriendlyRound; round: Round }>> {
        const rows = await this.db
            .selectFrom('friendly_rounds')
            .selectAll()
            .orderBy(sql`rowid`, 'desc')
            .execute();
        const out: Array<{ friendlyRound: FriendlyRound; round: Round }> = [];
        for (const row of rows) {
            const round = await this.rounds.getById(row.round_id);
            if (round) out.push({ friendlyRound: toFriendlyRound(row), round });
        }
        return out;
    }

    /**
     * Friendly rounds created by a specific player, newest first, each with
     * its resolved round (the "my rounds — created" dashboard half; the
     * "produced" half is the §17 ball_players query in DashboardService).
     */
    async listByCreator(
        playerId: string,
    ): Promise<Array<{ friendlyRound: FriendlyRound; round: Round }>> {
        const rows = await this.db
            .selectFrom('friendly_rounds')
            .selectAll()
            .where('creator_player_id', '=', playerId)
            .orderBy(sql`rowid`, 'desc')
            .execute();
        const out: Array<{ friendlyRound: FriendlyRound; round: Round }> = [];
        for (const row of rows) {
            const round = await this.rounds.getById(row.round_id);
            if (round) out.push({ friendlyRound: toFriendlyRound(row), round });
        }
        return out;
    }

    async findByRoundId(roundId: string): Promise<FriendlyRound | null> {
        const row = await this.db
            .selectFrom('friendly_rounds')
            .selectAll()
            .where('round_id', '=', roundId)
            .executeTakeFirst();
        return row ? toFriendlyRound(row) : null;
    }

    // --- Trust-based, token-scoped scoring (2.6e M4) ---
    //
    // The share token is the only credential: it resolves to exactly one round,
    // and every read/write below is confined to that round. An unknown token
    // resolves to `null` (the API turns that into a 404). Cross-round writes are
    // impossible — `appendScoreByToken` only ever passes the token's own
    // `roundId`, and `ScoreEventService.append` rejects a ball/play-hole that
    // belongs to a different round.

    private async roundIdForToken(token: string): Promise<string | null> {
        const row = await this.db
            .selectFrom('friendly_rounds')
            .select('round_id')
            .where('share_token', '=', token)
            .executeTakeFirst();
        return row?.round_id ?? null;
    }

    /** Every ball under the token's round, with producer + slot snapshots. */
    async ballsByToken(token: string): Promise<RoundBall[] | null> {
        const roundId = await this.roundIdForToken(token);
        if (roundId === null) return null;
        return this.rounds.ballsForRound(roundId);
    }

    /** The materialised scorecard (current scores) for the token's round. */
    async scorecardByToken(token: string): Promise<Scorecard[] | null> {
        const roundId = await this.roundIdForToken(token);
        if (roundId === null) return null;
        return this.scorecards.forRound(roundId);
    }

    /**
     * The canonical, section-driven `RoundResult` for the token's round — the
     * same value `LeaderboardService.resultForRound` produces (the no-login
     * mobile leaderboard reads through this). The token only resolves which
     * round to read; it never reshapes the result.
     */
    async resultByToken(token: string): Promise<RoundResult | null> {
        const roundId = await this.roundIdForToken(token);
        if (roundId === null) return null;
        return this.leaderboards.resultForRound(roundId);
    }

    /**
     * Append a trust-based score event to the token's round. Idempotent on
     * `clientEventId`. Returns `null` for an unknown token (nothing written).
     *
     * Attribution (Phase 3): `recordedByPlayerId` is SERVER-resolved — the API
     * layer passes the session identity when one accompanied the request, and
     * `null` otherwise. It is deliberately NOT part of `TokenScoreInput`, so a
     * client can never assert someone else's identity through the body. The
     * write stays legal without login; with login the audit trail is real.
     */
    async appendScoreByToken(
        input: TokenScoreInput,
        recordedByPlayerId: string | null = null,
    ): Promise<AppendResult | null> {
        const roundId = await this.roundIdForToken(input.token);
        if (roundId === null) return null;
        const { token: _token, ...event } = input;
        return this.scoreEvents.append({ ...event, roundId, recordedByPlayerId });
    }
}
