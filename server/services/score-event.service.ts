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
    };
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
     */
    async append(input: AppendScoreEventInput): Promise<AppendResult> {
        const existing = await this.byRoundClientKey(input.roundId, input.clientEventId)
            .executeTakeFirst();
        if (existing) {
            return { event: toEvent(existing), inserted: false };
        }

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
