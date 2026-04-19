import type { Kysely, Selectable } from 'kysely';
import type { Database, GuestPlayersTable } from '../db/schema';

// --- Output types ---

export interface GuestPlayer {
    id: string;
    displayName: string;
    gender: 'M' | 'F';
    handicapIndex: number | null;
}

export interface CreateGuestPlayerInput {
    displayName: string;
    gender: 'M' | 'F';
    handicapIndex?: number | null;
}

// --- Row mapping ---

type GuestPlayerRow = Selectable<GuestPlayersTable>;

function toGuestPlayer(row: GuestPlayerRow): GuestPlayer {
    return {
        id: row.id,
        displayName: row.display_name,
        gender: row.gender,
        handicapIndex: row.handicap_index,
    };
}

export class GuestPlayerService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private guestPlayers() {
        return this.db.selectFrom('guest_players').selectAll();
    }

    private byId(id: string) {
        return this.guestPlayers().where('id', '=', id);
    }

    // --- Queries (write) ---

    private insertGuestPlayer(
        values: {
            id: string;
            display_name: string;
            gender: 'M' | 'F';
            handicap_index: number | null;
        },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('guest_players').values(values);
    }

    // --- Methods ---

    async create(input: CreateGuestPlayerInput): Promise<GuestPlayer> {
        const id = crypto.randomUUID();
        const values = {
            id,
            display_name: input.displayName,
            gender: input.gender,
            handicap_index: input.handicapIndex ?? null,
        };
        await this.insertGuestPlayer(values).execute();
        return {
            id,
            displayName: values.display_name,
            gender: values.gender,
            handicapIndex: values.handicap_index,
        };
    }

    async list(): Promise<GuestPlayer[]> {
        const rows = await this.guestPlayers().orderBy('display_name').execute();
        return rows.map(toGuestPlayer);
    }

    async findById(id: string): Promise<GuestPlayer | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        return toGuestPlayer(row);
    }
}
