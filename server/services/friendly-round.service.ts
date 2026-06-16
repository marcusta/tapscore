import { sql, type Kysely, type Selectable } from 'kysely';
import type { Database, FriendlyRoundsTable } from '../db/schema';
import type { CompilerDiagnostic } from '../domain/compiler/types';
import type { RoundSetupDraft } from '../domain/round-setup/draft';
import type { Round, RoundService } from './round.service';

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
    ) {}

    async create(draft: RoundSetupDraft): Promise<CreateFriendlyRoundResult> {
        // Compile the round first. Invalid setup returns structured diagnostics
        // and mints nothing — no half-written round, wrapper, or token.
        const created = await this.rounds.createFromDraft(draft);
        if (!created.ok) return { ok: false, diagnostics: created.diagnostics };

        const friendlyRound: FriendlyRound = {
            id: crypto.randomUUID(),
            roundId: created.round.id,
            shareToken: crypto.randomUUID(),
            creatorPlayerId: null,
            createdAt: new Date().toISOString(),
        };
        await this.db
            .insertInto('friendly_rounds')
            .values({
                id: friendlyRound.id,
                round_id: friendlyRound.roundId,
                share_token: friendlyRound.shareToken,
                creator_player_id: null,
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

    async findByRoundId(roundId: string): Promise<FriendlyRound | null> {
        const row = await this.db
            .selectFrom('friendly_rounds')
            .selectAll()
            .where('round_id', '=', roundId)
            .executeTakeFirst();
        return row ? toFriendlyRound(row) : null;
    }
}
