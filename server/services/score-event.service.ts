import { type Kysely } from 'kysely';
import type { Database, ScoreEventType } from '../db/schema';
import type { RoundService } from './round.service';
import { toIsoUtc } from '../domain/time';

// --- Output types ---

export interface ScoreEvent {
    id: string;
    roundId: string;
    ballId: string;
    /** Stable play-hole occurrence id (the scoring subject). */
    playHoleId: string;
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
    ballId: string;
    playHoleId: string;
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
// Since migration 020, `score_events` is keyed on `ball_id` — the service
// now speaks `ballId` natively on its public interface (phase 2.6b/3b.3.2).

interface ScoreEventRow {
    id: string;
    round_id: string;
    ball_id: string;
    play_hole_id: string;
    strokes: number | null;
    event_type: ScoreEventType;
    recorded_by_player_id: string | null;
    recorded_at: string;
    client_event_id: string;
    source_player_id: string | null;
    source_guest_player_id: string | null;
    metadata: string | null;
}

function toEvent(row: ScoreEventRow): ScoreEvent {
    return {
        id: row.id,
        roundId: row.round_id,
        ballId: row.ball_id,
        playHoleId: row.play_hole_id,
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

export class ScoreEventService {
    constructor(
        private db: Kysely<Database>,
        private roundService: RoundService,
    ) {}

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
     */
    async append(input: AppendScoreEventInput): Promise<AppendResult> {
        const sourcePlayerId = input.sourcePlayerId ?? null;
        const sourceGuestPlayerId = input.sourceGuestPlayerId ?? null;
        if (sourcePlayerId !== null && sourceGuestPlayerId !== null) {
            throw new Error(
                'score-event append: pass at most one of sourcePlayerId or sourceGuestPlayerId (both null for individual formats)',
            );
        }

        const existing = await this.db
            .selectFrom('score_events')
            .selectAll()
            .where('round_id', '=', input.roundId)
            .where('client_event_id', '=', input.clientEventId)
            .executeTakeFirst();
        if (existing) {
            return { event: toEvent(existing as ScoreEventRow), inserted: false };
        }

        const metadata = input.metadata ?? null;
        const metadataText = metadata === null ? null : JSON.stringify(metadata);

        const id = crypto.randomUUID();
        await this.db.transaction().execute(async (trx) => {
            const values: {
                id: string;
                round_id: string;
                ball_id: string;
                play_hole_id: string;
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
                ball_id: input.ballId,
                play_hole_id: input.playHoleId,
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

        const row = await this.db
            .selectFrom('score_events')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirstOrThrow();
        return { event: toEvent(row as ScoreEventRow), inserted: true };
    }

    async listByRound(roundId: string): Promise<ScoreEvent[]> {
        const rows = await this.db
            .selectFrom('score_events')
            .selectAll()
            .where('round_id', '=', roundId)
            .orderBy('recorded_at')
            .orderBy('id')
            .execute();
        return rows.map((row) => toEvent(row as ScoreEventRow));
    }

    async getById(id: string): Promise<ScoreEvent | null> {
        const row = await this.db
            .selectFrom('score_events')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();
        if (!row) return null;
        return toEvent(row as ScoreEventRow);
    }
}
