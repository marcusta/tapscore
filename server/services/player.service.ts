import type { Kysely, Selectable } from 'kysely';
import type { Database, PlayersTable } from '../db/schema';
import type { AuthUser } from '@basics/core/server/auth';

// --- Output types ---

export interface Player {
    id: string;
    username: string;
}

// --- Row mapping ---

type PlayerRow = Selectable<PlayersTable>;

function toPlayer(row: PlayerRow): Player {
    return { id: row.id, username: row.username };
}

export class PlayerService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private players() {
        return this.db.selectFrom('players').selectAll();
    }

    private byId(id: string) {
        return this.players().where('id', '=', id);
    }

    private byUsername(username: string) {
        return this.players().where('username', '=', username);
    }

    // --- Queries (write) ---

    private insertPlayer(
        values: { id: string; username: string; password_hash: string },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('players').values(values);
    }

    // --- Methods ---

    async register(username: string, password: string): Promise<Player> {
        const id = crypto.randomUUID();
        const passwordHash = await Bun.password.hash(password);

        await this.insertPlayer({ id, username, password_hash: passwordHash }).execute();

        return { id, username };
    }

    async verify(username: string, password: string): Promise<AuthUser | null> {
        const row = await this.byUsername(username).executeTakeFirst();
        if (!row) return null;

        const valid = await Bun.password.verify(password, row.password_hash);
        if (!valid) return null;

        return { id: row.id, username: row.username };
    }

    async findById(id: string): Promise<AuthUser | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        return { id: row.id, username: row.username };
    }

    async list(): Promise<Player[]> {
        const rows = await this.players().execute();
        return rows.map(toPlayer);
    }
}
