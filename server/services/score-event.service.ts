import { sql, type Kysely, type Transaction } from 'kysely';
import type { Database, ScoreEventType } from '../db/schema';
import type { RoundService } from './round.service';
import { toIsoUtc } from '../domain/time';

// --- Output types ---

export interface ScoreEvent {
    id: string;
    roundId: string;
    participantId: string;
    hole: number;
    strokes: number | null;
    eventType: ScoreEventType;
    recordedByPlayerId: string | null;
    recordedAt: string;
    clientEventId: string;
    /**
     * When the event belongs to a per-player slot within a team participant
     * (better-ball 2.5e, Taliban 2.5g, Umbrella 2.5h), identifies the
     * specific player. Individual / foursomes leave both null.
     * Invariant (enforced in `append`): either both null, or exactly one
     * non-null. Never both.
     */
    sourcePlayerId: string | null;
    sourceGuestPlayerId: string | null;
    /**
     * Supplemental per-event JSON metadata (migration 014 — Umbrella
     * prerequisite). Stored as TEXT, parsed at this boundary. `null` when
     * the event has no attached metadata. Umbrella uses `metadata.gir`
     * (boolean) per per-player event. Future formats attach any additional
     * hole-level signal here without a schema change.
     */
    metadata: Record<string, unknown> | null;
}

export interface AppendScoreEventInput {
    roundId: string;
    participantId: string;
    hole: number;
    strokes: number | null;
    eventType: ScoreEventType;
    recordedByPlayerId?: string | null;
    clientEventId: string;
    /** Optional server timestamp override — used by tests that replay events out of order. */
    recordedAt?: string;
    /**
     * Per-player source within a team participant. Either both null
     * (individual / foursomes), or exactly one non-null (better-ball,
     * Taliban, Umbrella). Both populated → validation error.
     */
    sourcePlayerId?: string | null;
    sourceGuestPlayerId?: string | null;
    /**
     * Optional per-event metadata (migration 014). Serialised to a JSON
     * string on write. Default `null` (unset / cleared). Umbrella's seed
     * populates `{gir: boolean}` per per-player event.
     */
    metadata?: Record<string, unknown> | null;
}

export interface AppendResult {
    event: ScoreEvent;
    /** True if the event was freshly inserted; false if the `clientEventId` was already seen (dedup hit). */
    inserted: boolean;
}

// --- Row mapping ---
//
// Migration 020 flipped `score_events` from `participant_id` to `ball_id`.
// Public API still speaks in `participantId` — translation happens here:
//
//   write  : `resolveBallId()` joins ball_players → participant_players to
//            find the ball that owns `(participantId, source*)`, inserted
//            before the event row.
//   read   : every SELECT projects a virtual `participant_id` column via a
//            correlated subquery (`selectWithParticipant()`). Row mapper
//            reads it back out transparently.
//
// A single ball can belong to multiple participant_players (foursomes),
// but all those rows share the same participant_id by construction — so
// the reverse projection is well-defined under source-null, and becomes
// exact under source-present (match on player_id / guest_player_id).

interface ScoreEventRowWithParticipant {
    id: string;
    round_id: string;
    ball_id: string;
    participant_id: string;
    hole: number;
    strokes: number | null;
    event_type: ScoreEventType;
    recorded_by_player_id: string | null;
    recorded_at: string;
    client_event_id: string;
    source_player_id: string | null;
    source_guest_player_id: string | null;
    metadata: string | null;
}

function toEvent(row: ScoreEventRowWithParticipant): ScoreEvent {
    return {
        id: row.id,
        roundId: row.round_id,
        participantId: row.participant_id,
        hole: row.hole,
        strokes: row.strokes,
        eventType: row.event_type,
        recordedByPlayerId: row.recorded_by_player_id,
        recordedAt: toIsoUtc(row.recorded_at),
        clientEventId: row.client_event_id,
        sourcePlayerId: row.source_player_id,
        sourceGuestPlayerId: row.source_guest_player_id,
        metadata: parseMetadata(row.metadata),
    };
}

/**
 * Parse a `metadata` TEXT value from the DB. Null stays null. A string is
 * JSON.parse'd and must yield an object; anything else (array, scalar,
 * malformed JSON) throws with a clear message. This is the read boundary
 * for the untyped JSON blob — keep errors loud so a corrupt row is spotted
 * at first read rather than propagated as an odd rendering.
 */
function parseMetadata(raw: string | null): Record<string, unknown> | null {
    if (raw === null) return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (err) {
        throw new Error(
            `score-event metadata: malformed JSON in DB — ${(err as Error).message} (raw: ${raw.slice(0, 80)})`,
        );
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(
            `score-event metadata: expected JSON object, got ${parsed === null ? 'null' : Array.isArray(parsed) ? 'array' : typeof parsed}`,
        );
    }
    return parsed as Record<string, unknown>;
}

type DbOrTrx = Kysely<Database> | Transaction<Database>;

export class ScoreEventService {
    constructor(
        private db: Kysely<Database>,
        private roundService: RoundService,
    ) {}

    // --- Queries (read) ---
    //
    // Every read must project the virtual `participant_id` column so the
    // row mapper keeps its pre-020 shape. Factored into one helper so the
    // correlated subquery lives in exactly one place.

    private selectWithParticipant(db: DbOrTrx = this.db) {
        return db
            .selectFrom('score_events as se')
            .select((eb) => [
                'se.id',
                'se.round_id',
                'se.ball_id',
                'se.hole',
                'se.strokes',
                'se.event_type',
                'se.recorded_by_player_id',
                'se.recorded_at',
                'se.client_event_id',
                'se.source_player_id',
                'se.source_guest_player_id',
                'se.metadata',
                sql<string>`(
                    SELECT DISTINCT pp.participant_id
                    FROM ball_players bp
                    JOIN participant_players pp ON pp.id = bp.producer_def_id
                    WHERE bp.ball_id = se.ball_id
                      AND (
                          (se.source_player_id IS NULL AND se.source_guest_player_id IS NULL)
                          OR (se.source_player_id IS NOT NULL AND bp.player_id = se.source_player_id)
                          OR (se.source_guest_player_id IS NOT NULL AND bp.guest_player_id = se.source_guest_player_id)
                      )
                    LIMIT 1
                )`.as('participant_id'),
            ]);
    }

    private byId(id: string) {
        return this.selectWithParticipant().where('se.id', '=', id);
    }

    private byRound(roundId: string) {
        return this.selectWithParticipant().where('se.round_id', '=', roundId);
    }

    private byRoundClientKey(roundId: string, clientEventId: string) {
        return this.selectWithParticipant()
            .where('se.round_id', '=', roundId)
            .where('se.client_event_id', '=', clientEventId);
    }

    // --- Methods ---

    /**
     * Append an event. Idempotent on `(roundId, clientEventId)` — replaying
     * the same client event returns the original row with `inserted: false`
     * instead of duplicating. On successful insert, bumps `rounds.latest_event_id`.
     *
     * Callers may pass `recordedAt` to force a specific server timestamp (useful
     * for replay / backfill tests). Default is the DB default (`datetime('now')`).
     *
     * Source validation: `sourcePlayerId` and `sourceGuestPlayerId` together
     * identify the specific player within a team participant. For individual
     * and foursomes slots both are left null. For per-player team formats
     * (better-ball, Taliban, Umbrella) exactly one is populated. Both
     * populated is a programming error and throws. This mirrors the
     * `participant_players.player_id xor guest_player_id` shape and is
     * enforced here because SQLite cannot `ALTER TABLE ADD CHECK` cheaply
     * (see migration 013).
     *
     * Ball resolution: since migration 020, `score_events` is keyed on
     * `ball_id` — we translate the public `participantId` to a ball via
     * `resolveBallId` inside the same transaction as the insert so the
     * write is fully consistent.
     */
    async append(input: AppendScoreEventInput): Promise<AppendResult> {
        const sourcePlayerId = input.sourcePlayerId ?? null;
        const sourceGuestPlayerId = input.sourceGuestPlayerId ?? null;
        if (sourcePlayerId !== null && sourceGuestPlayerId !== null) {
            throw new Error(
                'score-event append: pass at most one of sourcePlayerId or sourceGuestPlayerId (both null for individual formats)',
            );
        }

        const existing = await this.byRoundClientKey(input.roundId, input.clientEventId)
            .executeTakeFirst();
        if (existing) {
            return { event: toEvent(existing as ScoreEventRowWithParticipant), inserted: false };
        }

        const metadata = input.metadata ?? null;
        const metadataText = metadata === null ? null : JSON.stringify(metadata);

        const id = crypto.randomUUID();
        await this.db.transaction().execute(async (trx) => {
            const ballId = await this.resolveBallId(
                trx,
                input.participantId,
                sourcePlayerId,
                sourceGuestPlayerId,
            );
            const values: {
                id: string;
                round_id: string;
                ball_id: string;
                hole: number;
                strokes: number | null;
                event_type: ScoreEventType;
                recorded_by_player_id: string | null;
                client_event_id: string;
                recorded_at?: string;
                source_player_id: string | null;
                source_guest_player_id: string | null;
                metadata: string | null;
            } = {
                id,
                round_id: input.roundId,
                ball_id: ballId,
                hole: input.hole,
                strokes: input.strokes,
                event_type: input.eventType,
                recorded_by_player_id: input.recordedByPlayerId ?? null,
                client_event_id: input.clientEventId,
                source_player_id: sourcePlayerId,
                source_guest_player_id: sourceGuestPlayerId,
                metadata: metadataText,
            };
            if (input.recordedAt !== undefined) values.recorded_at = input.recordedAt;
            await trx.insertInto('score_events').values(values).execute();
            await this.roundService.recordLatestEvent(input.roundId, id, trx);
        });

        const row = await this.byId(id).executeTakeFirstOrThrow();
        return { event: toEvent(row as ScoreEventRowWithParticipant), inserted: true };
    }

    async listByRound(roundId: string): Promise<ScoreEvent[]> {
        const rows = await this.byRound(roundId)
            .orderBy('se.recorded_at')
            .orderBy('se.id')
            .execute();
        return rows.map((row) => toEvent(row as ScoreEventRowWithParticipant));
    }

    async getById(id: string): Promise<ScoreEvent | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        return toEvent(row as ScoreEventRowWithParticipant);
    }

    /**
     * Translate a public `(participantId, sourcePlayerId,
     * sourceGuestPlayerId)` tuple to the ball_id the event should persist
     * under.
     *
     * For source-present events (per-player team formats) the ball is the
     * one whose `ball_players` row matches the specific player within a
     * participant-owned producer. For source-null events (individual /
     * foursomes) every ball_player for the participant points at the same
     * ball, so `LIMIT 1` is deterministic.
     *
     * Throws when no ball resolves — callers must have seeded compiler
     * output (via the compiler persist path, or `seedBallsFromParticipants`
     * in tests) before appending events.
     */
    private async resolveBallId(
        trx: DbOrTrx,
        participantId: string,
        sourcePlayerId: string | null,
        sourceGuestPlayerId: string | null,
    ): Promise<string> {
        const row = await sql<{ ball_id: string }>`
            SELECT DISTINCT bp.ball_id AS ball_id
            FROM ball_players bp
            JOIN participant_players pp ON pp.id = bp.producer_def_id
            WHERE pp.participant_id = ${participantId}
              AND (
                  (${sourcePlayerId} IS NULL AND ${sourceGuestPlayerId} IS NULL)
                  OR (${sourcePlayerId} IS NOT NULL AND bp.player_id = ${sourcePlayerId})
                  OR (${sourceGuestPlayerId} IS NOT NULL AND bp.guest_player_id = ${sourceGuestPlayerId})
              )
            LIMIT 1
        `.execute(trx);
        const ballId = row.rows[0]?.ball_id;
        if (!ballId) {
            throw new Error(
                `score-event append: no ball found for participant ${participantId}, ` +
                    `source player=${sourcePlayerId ?? 'null'}, ` +
                    `source guest=${sourceGuestPlayerId ?? 'null'}. ` +
                    `Balls/ball_players must be compiled (see RoundCompiler) before appending events.`,
            );
        }
        return ballId;
    }
}
