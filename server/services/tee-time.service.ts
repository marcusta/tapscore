import type { Kysely, Selectable } from 'kysely';
import type { Database, TeeTimesTable } from '../db/schema';

// --- Output types ---

export interface TeeTime {
    id: string;
    roundId: string;
    startTime: string;
    startHole: 1 | 10;
    capacity: number;
    hittingBay: string | null;
}

export interface CreateTeeTimeInput {
    roundId: string;
    startTime: string;
    startHole: 1 | 10;
    capacity: number;
    hittingBay?: string | null;
}

export interface UpdateTeeTimeInput {
    startTime?: string;
    startHole?: 1 | 10;
    capacity?: number;
    hittingBay?: string | null;
}

// --- Row mapping ---

type TeeTimeRow = Selectable<TeeTimesTable>;

function toTeeTime(row: TeeTimeRow): TeeTime {
    if (row.start_hole !== 1 && row.start_hole !== 10) {
        throw new Error(`invalid start_hole ${row.start_hole} on tee_time ${row.id}`);
    }
    return {
        id: row.id,
        roundId: row.round_id,
        startTime: row.start_time,
        startHole: row.start_hole,
        capacity: row.capacity,
        hittingBay: row.hitting_bay,
    };
}

export class TeeTimeService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private teeTimes() {
        return this.db.selectFrom('tee_times').selectAll();
    }

    private byId(id: string) {
        return this.teeTimes().where('id', '=', id);
    }

    private byRound(roundId: string) {
        return this.teeTimes().where('round_id', '=', roundId);
    }

    // --- Queries (write) ---

    private insertTeeTime(
        values: {
            id: string;
            round_id: string;
            start_time: string;
            start_hole: number;
            capacity: number;
            hitting_bay: string | null;
        },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('tee_times').values(values);
    }

    private updateById(id: string, trx: Kysely<Database> = this.db) {
        return trx.updateTable('tee_times').where('id', '=', id);
    }

    private deleteById(id: string, trx: Kysely<Database> = this.db) {
        return trx.deleteFrom('tee_times').where('id', '=', id);
    }

    // --- Methods ---

    async create(input: CreateTeeTimeInput): Promise<TeeTime> {
        if (input.capacity <= 0) throw new Error('capacity must be > 0');
        const id = crypto.randomUUID();
        await this.insertTeeTime({
            id,
            round_id: input.roundId,
            start_time: input.startTime,
            start_hole: input.startHole,
            capacity: input.capacity,
            hitting_bay: input.hittingBay ?? null,
        }).execute();
        return {
            id,
            roundId: input.roundId,
            startTime: input.startTime,
            startHole: input.startHole,
            capacity: input.capacity,
            hittingBay: input.hittingBay ?? null,
        };
    }

    async getById(id: string): Promise<TeeTime | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        return toTeeTime(row);
    }

    async listByRound(roundId: string): Promise<TeeTime[]> {
        const rows = await this.byRound(roundId).orderBy('start_time').execute();
        return rows.map(toTeeTime);
    }

    async update(id: string, input: UpdateTeeTimeInput): Promise<TeeTime> {
        const patch: Record<string, unknown> = {};
        if (input.startTime !== undefined) patch.start_time = input.startTime;
        if (input.startHole !== undefined) patch.start_hole = input.startHole;
        if (input.capacity !== undefined) {
            if (input.capacity <= 0) throw new Error('capacity must be > 0');
            patch.capacity = input.capacity;
        }
        if (input.hittingBay !== undefined) patch.hitting_bay = input.hittingBay;
        if (Object.keys(patch).length > 0) {
            await this.updateById(id).set(patch).execute();
        }
        const row = await this.byId(id).executeTakeFirstOrThrow();
        return toTeeTime(row);
    }

    async remove(id: string): Promise<void> {
        await this.deleteById(id).execute();
    }
}
