import type { Kysely, Selectable } from 'kysely';
import type { Database, ScoreEventsTable, ScoreEventType } from '../db/schema';
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

type ScoreEventRow = Selectable<ScoreEventsTable>;

function toEvent(row: ScoreEventRow): ScoreEvent {
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

export class ScoreEventService {
    constructor(
        private db: Kysely<Database>,
        private roundService: RoundService,
    ) {}

    // --- Queries (read) ---

    private events() {
        return this.db.selectFrom('score_events').selectAll();
    }

    private byId(id: string) {
        return this.events().where('id', '=', id);
    }

    private byRound(roundId: string) {
        return this.events().where('round_id', '=', roundId);
    }

    private byRoundClientKey(roundId: string, clientEventId: string) {
        return this.events()
            .where('round_id', '=', roundId)
            .where('client_event_id', '=', clientEventId);
    }

    // --- Queries (write) ---

    private insertEvent(
        values: {
            id: string;
            round_id: string;
            participant_id: string;
            hole: number;
            strokes: number | null;
            event_type: ScoreEventType;
            recorded_by_player_id: string | null;
            client_event_id: string;
            recorded_at?: string;
            source_player_id: string | null;
            source_guest_player_id: string | null;
            metadata: string | null;
        },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('score_events').values(values);
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
            return { event: toEvent(existing), inserted: false };
        }

        const metadata = input.metadata ?? null;
        const metadataText = metadata === null ? null : JSON.stringify(metadata);

        const id = crypto.randomUUID();
        await this.db.transaction().execute(async (trx) => {
            const values: Parameters<typeof this.insertEvent>[0] = {
                id,
                round_id: input.roundId,
                participant_id: input.participantId,
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
            await this.insertEvent(values, trx).execute();
            await this.roundService.recordLatestEvent(input.roundId, id, trx);
        });

        const row = await this.byId(id).executeTakeFirstOrThrow();
        return { event: toEvent(row), inserted: true };
    }

    async listByRound(roundId: string): Promise<ScoreEvent[]> {
        const rows = await this.byRound(roundId).orderBy('recorded_at').orderBy('id').execute();
        return rows.map(toEvent);
    }

    async getById(id: string): Promise<ScoreEvent | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        return toEvent(row);
    }
}
