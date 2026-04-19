import type { Kysely, Selectable } from 'kysely';
import type { Database, HandicapHistoryTable } from '../db/schema';

// --- Output types ---

export type HandicapSource = 'manual' | 'calculated' | 'import';

export interface HandicapEntry {
    id: string;
    playerId: string;
    handicapIndex: number;
    source: HandicapSource;
    effectiveDate: string;
    enteredByPlayerId: string | null;
    createdAt: string;
}

export interface RecordHandicapInput {
    playerId: string;
    handicapIndex: number;
    source: HandicapSource;
    effectiveDate: string;
    enteredByPlayerId?: string | null;
}

// --- Row mapping ---

type HandicapRow = Selectable<HandicapHistoryTable>;

function toEntry(row: HandicapRow): HandicapEntry {
    return {
        id: row.id,
        playerId: row.player_id,
        handicapIndex: row.handicap_index,
        source: row.source,
        effectiveDate: row.effective_date,
        enteredByPlayerId: row.entered_by_player_id,
        createdAt: row.created_at,
    };
}

export class HandicapService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private entries() {
        return this.db.selectFrom('handicap_history').selectAll();
    }

    private byPlayer(playerId: string) {
        return this.entries().where('player_id', '=', playerId);
    }

    // --- Queries (write) ---

    private insertEntry(
        values: {
            id: string;
            player_id: string;
            handicap_index: number;
            source: HandicapSource;
            effective_date: string;
            entered_by_player_id: string | null;
        },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('handicap_history').values(values);
    }

    // --- Methods ---

    async record(input: RecordHandicapInput): Promise<HandicapEntry> {
        const id = crypto.randomUUID();
        await this.insertEntry({
            id,
            player_id: input.playerId,
            handicap_index: input.handicapIndex,
            source: input.source,
            effective_date: input.effectiveDate,
            entered_by_player_id: input.enteredByPlayerId ?? null,
        }).execute();

        const row = await this.entries().where('id', '=', id).executeTakeFirstOrThrow();
        return toEntry(row);
    }

    async historyFor(playerId: string): Promise<HandicapEntry[]> {
        const rows = await this.byPlayer(playerId)
            .orderBy('effective_date', 'desc')
            .orderBy('created_at', 'desc')
            .execute();
        return rows.map(toEntry);
    }

    async latestFor(playerId: string): Promise<HandicapEntry | null> {
        const row = await this.byPlayer(playerId)
            .orderBy('effective_date', 'desc')
            .orderBy('created_at', 'desc')
            .executeTakeFirst();
        if (!row) return null;
        return toEntry(row);
    }
}
