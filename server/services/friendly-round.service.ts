import { sql, type Kysely, type Selectable } from 'kysely';
import type { Database, FriendlyRoundsTable, RoundStatus } from '../db/schema';
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
import type { StartListService, StartListView } from './start-list.service';

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

/**
 * Result of a token-scoped round deletion. Discriminated so the API layer can
 * turn an unknown token into a 404 without a thrown error crossing the
 * service boundary.
 */
export type RemoveFriendlyRoundResult =
    | { ok: true }
    | { ok: false; reason: 'not_found' };

/**
 * Cursored result read (Phase 3.5 interim polling). `cursor` rides
 * `rounds.latest_event_id` — an opaque per-round change marker advanced by
 * every result-changing append (score events, setup corrections, allowance
 * overrides, rulings, format actions; see `RoundService.bumpResultCursor`).
 * A matching cursor short-circuits to `{ unchanged: true }` WITHOUT computing
 * the result; a stale/absent cursor returns the full result plus the current
 * cursor. `cursor` is `null` until the first result-changing event.
 */
export type CursoredRoundResult =
    | { unchanged: true; cursor: string }
    | { unchanged: false; cursor: string | null; result: RoundResult };

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
        private startLists: StartListService,
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

    /**
     * The token's round for the round view. `viewerPlayerId` is the
     * SERVER-resolved optional session identity (never body-supplied); it only
     * feeds `startList.viewer` — the Phase 5.5 policy + allowed-ops payload the
     * client uses to render (or hide) the self-join card and group picker, so
     * an organized round never leaks an open join affordance. The read itself
     * stays token-scoped and identity-free.
     */
    async findByToken(
        token: string,
        viewerPlayerId: string | null = null,
    ): Promise<{ friendlyRound: FriendlyRound; round: Round; startList: StartListView } | null> {
        const row = await this.db
            .selectFrom('friendly_rounds')
            .selectAll()
            .where('share_token', '=', token)
            .executeTakeFirst();
        if (!row) return null;
        const round = await this.rounds.getById(row.round_id);
        if (!round) return null;
        const startList = await this.startLists.viewForRound(round.id, viewerPlayerId);
        return { friendlyRound: toFriendlyRound(row), round, startList };
    }

    /**
     * Every friendly round, newest first, each paired with its resolved round
     * for a summary view. No auth — the landing page is the no-login front door.
     * Ordered by insertion (`rowid`) rather than `created_at`, which is only
     * second-resolution and would tie for rounds minted in the same second.
     *
     * Competition rounds are EXCLUDED (Phase 4 Slice 2): they ride the same
     * friendly wrapper for their token front door (so the existing round
     * UI/endpoints open them unchanged), but this open list returns share
     * tokens — a competition round's token must only travel via the
     * admin-gated competition detail read, not the public landing.
     */
    async list(): Promise<Array<{ friendlyRound: FriendlyRound; round: Round }>> {
        const rows = await this.db
            .selectFrom('friendly_rounds')
            .selectAll()
            .where(({ not, exists, selectFrom }) =>
                not(
                    exists(
                        selectFrom('competition_rounds')
                            .select('competition_rounds.id')
                            .whereRef(
                                'competition_rounds.round_id',
                                '=',
                                'friendly_rounds.round_id',
                            ),
                    ),
                ),
            )
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
     * `resultByToken` wrapped in the Phase 3.5 polling envelope. When the
     * caller's `cursor` still matches `rounds.latest_event_id`, nothing has
     * changed the result since that read — return the tiny `unchanged`
     * response without touching the scoring layer. Any other case (no cursor,
     * stale cursor, or a round that has no cursor yet) computes the full
     * result. The client stores the returned `cursor` for its next poll.
     */
    async resultWithCursorByToken(
        token: string,
        cursor?: string,
    ): Promise<CursoredRoundResult | null> {
        const roundId = await this.roundIdForToken(token);
        if (roundId === null) return null;
        const row = await this.db
            .selectFrom('rounds')
            .select('latest_event_id')
            .where('id', '=', roundId)
            .executeTakeFirst();
        if (!row) return null;
        const current = row.latest_event_id;
        if (cursor !== undefined && current !== null && cursor === current) {
            return { unchanged: true, cursor: current };
        }
        const result = await this.leaderboards.resultForRound(roundId);
        return { unchanged: false, cursor: current, result };
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

    /**
     * Delete the token's round — permanently, for everyone.
     *
     * Trust boundary: SAME as scoring. In the no-login model the share token
     * is the only credential, and anyone holding it already controls every
     * score in the round (write, clear, override). Deletion therefore grants
     * no privilege the token didn't already carry; it is deliberately NOT
     * gated on the creator. Creator/role gating is deferred to the auth/roles
     * phase, together with the rest of per-actor authorization.
     *
     * Teardown is `RoundService.remove` — one transaction that clears the
     * RESTRICT-referenced event/scorecard rows explicitly and lets the
     * `ON DELETE CASCADE` graph take the rest (see that method's comment for
     * the full inventory). `guest_players` rows are intentionally LEFT in
     * place: they carry no round FK, other rounds may reference the same
     * guest via `ball_players`, and a claimed guest is wired to a real
     * player — orphaned guest rows are harmless, deleting a shared one is not.
     *
     * Unknown token → `{ ok: false, reason: 'not_found' }`; nothing deleted.
     */
    async removeByToken(token: string): Promise<RemoveFriendlyRoundResult> {
        const roundId = await this.roundIdForToken(token);
        if (roundId === null) return { ok: false, reason: 'not_found' };
        await this.rounds.remove(roundId);
        return { ok: true };
    }

    /**
     * Finish the token's round: set `status='complete'` + `completed_at=now`.
     *
     * Purely ORGANIZATIONAL — this only moves the round into the landing's
     * "Recently finished" section. It seals NOTHING: a finished friendly round
     * stays fully editable and scorable (edit/score locks belong to competition
     * rounds, a future phase). No demotion of a late score either — the round
     * stays complete until an explicit reopen.
     *
     * Trust boundary: SAME as scoring/delete — the share token is the only
     * credential and already controls every score, so finishing grants no new
     * privilege; it is deliberately NOT creator-gated.
     *
     * `now` is caller-supplied (ISO string) rather than read from the clock, so
     * scripts/tests stay deterministic and match the `friendly_rounds.created_at`
     * convention. Idempotent: finishing an already-complete round keeps the
     * original `completed_at` (a no-op success). Returns the resulting status so
     * the client can warn about e.g. finishing an empty not_started round.
     * Unknown token → `null` (the API turns it into a 404).
     */
    async finishByToken(
        token: string,
        now: string,
    ): Promise<{ status: RoundStatus; completedAt: string } | null> {
        const roundId = await this.roundIdForToken(token);
        if (roundId === null) return null;
        // Only transition a not-yet-complete round; a re-finish preserves the
        // original completed_at (the WHERE guard makes it a true no-op).
        await this.db
            .updateTable('rounds')
            .set({ status: 'complete', completed_at: now })
            .where('id', '=', roundId)
            .where('status', '!=', 'complete')
            .execute();
        const row = await this.db
            .selectFrom('rounds')
            .select(['status', 'completed_at'])
            .where('id', '=', roundId)
            .executeTakeFirst();
        // `row` is guaranteed here (the token resolved to it); complete rounds
        // always carry a completed_at (set on the transition above or a prior one).
        return { status: row!.status, completedAt: row!.completed_at ?? now };
    }

    /**
     * Reopen a finished round: `complete`→`active`, clear `completed_at`. The
     * recovery for a mistaken finish — it moves the round back to the landing's
     * "Ongoing" section. Reopening a round that isn't complete is a no-op
     * success (returns its current status). Same token trust boundary as finish.
     * Unknown token → `null` (API 404).
     */
    async reopenByToken(token: string): Promise<{ status: RoundStatus } | null> {
        const roundId = await this.roundIdForToken(token);
        if (roundId === null) return null;
        await this.db
            .updateTable('rounds')
            .set({ status: 'active', completed_at: null })
            .where('id', '=', roundId)
            .where('status', '=', 'complete')
            .execute();
        const row = await this.db
            .selectFrom('rounds')
            .select('status')
            .where('id', '=', roundId)
            .executeTakeFirst();
        return { status: row!.status };
    }
}
