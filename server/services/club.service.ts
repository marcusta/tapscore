import type { Kysely, Selectable } from 'kysely';
import type { Database, ClubsTable } from '../db/schema';

// --- Output types ---

export interface Club {
    id: string;
    name: string;
    location: string | null;
    logoUrl: string | null;
}

export interface CreateClubInput {
    name: string;
    location?: string | null;
    logoUrl?: string | null;
}

export interface UpdateClubInput {
    name?: string;
    location?: string | null;
    logoUrl?: string | null;
}

// --- Row mapping ---

type ClubRow = Selectable<ClubsTable>;

function toClub(row: ClubRow): Club {
    return {
        id: row.id,
        name: row.name,
        location: row.location,
        logoUrl: row.logo_url,
    };
}

export class ClubService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private clubs() {
        return this.db.selectFrom('clubs').selectAll();
    }

    private byId(id: string) {
        return this.clubs().where('id', '=', id);
    }

    // --- Queries (write) ---

    private insertClub(
        values: { id: string; name: string; location: string | null; logo_url: string | null },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('clubs').values(values);
    }

    private updateById(id: string, trx: Kysely<Database> = this.db) {
        return trx.updateTable('clubs').where('id', '=', id);
    }

    private deleteById(id: string, trx: Kysely<Database> = this.db) {
        return trx.deleteFrom('clubs').where('id', '=', id);
    }

    // --- Methods ---

    async list(): Promise<Club[]> {
        const rows = await this.clubs().orderBy('name').execute();
        return rows.map(toClub);
    }

    async getById(id: string): Promise<Club | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        return toClub(row);
    }

    async create(input: CreateClubInput): Promise<Club> {
        const id = crypto.randomUUID();
        const values = {
            id,
            name: input.name,
            location: input.location ?? null,
            logo_url: input.logoUrl ?? null,
        };
        await this.insertClub(values).execute();
        return { id, name: values.name, location: values.location, logoUrl: values.logo_url };
    }

    async update(id: string, input: UpdateClubInput): Promise<Club> {
        const patch: Record<string, unknown> = {};
        if (input.name !== undefined) patch.name = input.name;
        if (input.location !== undefined) patch.location = input.location;
        if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl;

        if (Object.keys(patch).length > 0) {
            await this.updateById(id).set(patch).execute();
        }

        const row = await this.byId(id).executeTakeFirstOrThrow();
        return toClub(row);
    }

    async remove(id: string): Promise<void> {
        await this.deleteById(id).execute();
    }
}
