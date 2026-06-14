import { sql, type Kysely, type Selectable } from 'kysely';
import type { Database, PlayersTable } from '../db/schema';
import type { AuthUser } from '@basics/core/server/auth';

// --- Output types ---

export interface Player {
    id: string;
    username: string;
    displayName: string;
    nickname: string | null;
    avatarUrl: string | null;
    homeClubId: string | null;
    handicapIndex: number | null;
    /** Soft-delete tombstone (§17). Null = active. */
    deletedAt: string | null;
}

export interface RegisterInput {
    username: string;
    password: string;
    displayName: string;
    nickname?: string | null;
    avatarUrl?: string | null;
    homeClubId?: string | null;
    handicapIndex?: number | null;
}

// --- Row mapping ---

type PlayerRow = Selectable<PlayersTable>;

function toPlayer(row: PlayerRow): Player {
    return {
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        nickname: row.nickname,
        avatarUrl: row.avatar_url,
        homeClubId: row.home_club_id,
        handicapIndex: row.handicap_index,
        deletedAt: row.deleted_at,
    };
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
        values: {
            id: string;
            username: string;
            password_hash: string;
            display_name: string;
            nickname: string | null;
            avatar_url: string | null;
            home_club_id: string | null;
            handicap_index: number | null;
        },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('players').values(values);
    }

    // --- Methods ---

    async register(input: RegisterInput): Promise<Player> {
        const id = crypto.randomUUID();
        const passwordHash = await Bun.password.hash(input.password);

        const values = {
            id,
            username: input.username,
            password_hash: passwordHash,
            display_name: input.displayName,
            nickname: input.nickname ?? null,
            avatar_url: input.avatarUrl ?? null,
            home_club_id: input.homeClubId ?? null,
            handicap_index: input.handicapIndex ?? null,
        };

        await this.insertPlayer(values).execute();

        return {
            id,
            username: input.username,
            displayName: input.displayName,
            nickname: values.nickname,
            avatarUrl: values.avatar_url,
            homeClubId: values.home_club_id,
            handicapIndex: values.handicap_index,
            deletedAt: null,
        };
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

    async getById(id: string): Promise<Player | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        return toPlayer(row);
    }

    async list(): Promise<Player[]> {
        const rows = await this.players().execute();
        return rows.map(toPlayer);
    }

    /** Active players only (soft-delete tombstones excluded). */
    async listActive(): Promise<Player[]> {
        const rows = await this.players().where('deleted_at', 'is', null).execute();
        return rows.map(toPlayer);
    }

    /** True when the player exists AND is not soft/hard-deleted. Drives live
     *  navigation links — a deleted player renders by snapshot, with no link. */
    async isActive(id: string): Promise<boolean> {
        const row = await this.byId(id).select(['deleted_at']).executeTakeFirst();
        return !!row && row.deleted_at === null;
    }

    /**
     * Soft-delete: stamp `deleted_at`, preserving the row + all PII. The player
     * drops out of dashboards/active lists; historical scorecards keep rendering
     * by `ball_players.display_name_snapshot`. Idempotent — re-deleting keeps
     * the original timestamp.
     */
    async softDelete(id: string): Promise<void> {
        await this.db
            .updateTable('players')
            .set({ deleted_at: sql`(datetime('now'))` })
            .where('id', '=', id)
            .where('deleted_at', 'is', null)
            .execute();
    }

    /**
     * Hard-delete (GDPR): null every PII field, keep an `id` + `deleted_at`
     * tombstone so FK integrity (ball_players.player_id RESTRICT) survives.
     * `username` is NOT NULL UNIQUE, so it becomes an opaque `deleted:<id>`
     * sentinel rather than null; login is disabled. Snapshots on
     * `ball_players` are untouched — the round still renders the played-as name.
     */
    async hardDelete(id: string): Promise<void> {
        const now = new Date().toISOString();
        await this.db
            .updateTable('players')
            .set({
                username: `deleted:${id}`,
                password_hash: '',
                display_name: 'Deleted player',
                nickname: null,
                avatar_url: null,
                home_club_id: null,
                handicap_index: null,
                deleted_at: sql`COALESCE(deleted_at, ${now})`,
            })
            .where('id', '=', id)
            .execute();
    }
}
