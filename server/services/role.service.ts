import type { Kysely, Selectable } from 'kysely';
import type { Database, RoleGrantsTable } from '../db/schema';

// --- Output types ---

export interface RoleGrant {
    id: string;
    playerId: string;
    role:
        | 'super_admin'
        | 'series_admin'
        | 'tour_admin'
        | 'competition_admin'
        | 'friendly_round_owner';
    scopeType: string | null;
    scopeId: string | null;
    grantedAt: string;
}

export interface GrantInput {
    playerId: string;
    role: RoleGrant['role'];
    scopeType?: string | null;
    scopeId?: string | null;
}

export interface RevokeInput {
    playerId: string;
    role: RoleGrant['role'];
    scopeType?: string | null;
    scopeId?: string | null;
}

// --- Row mapping ---

type RoleRow = Selectable<RoleGrantsTable>;

function toGrant(row: RoleRow): RoleGrant {
    return {
        id: row.id,
        playerId: row.player_id,
        role: row.role,
        scopeType: row.scope_type,
        scopeId: row.scope_id,
        grantedAt: row.granted_at,
    };
}

export class RoleService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private grants() {
        return this.db.selectFrom('role_grants').selectAll();
    }

    private byPlayer(playerId: string) {
        return this.grants().where('player_id', '=', playerId);
    }

    private exact(
        playerId: string,
        role: RoleGrant['role'],
        scopeType: string | null,
        scopeId: string | null,
    ) {
        let q = this.byPlayer(playerId).where('role', '=', role);
        q = scopeType === null ? q.where('scope_type', 'is', null) : q.where('scope_type', '=', scopeType);
        q = scopeId === null ? q.where('scope_id', 'is', null) : q.where('scope_id', '=', scopeId);
        return q;
    }

    // --- Queries (write) ---

    private insertGrant(
        values: {
            id: string;
            player_id: string;
            role: RoleGrant['role'];
            scope_type: string | null;
            scope_id: string | null;
        },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('role_grants').values(values);
    }

    private deleteExact(
        playerId: string,
        role: RoleGrant['role'],
        scopeType: string | null,
        scopeId: string | null,
        trx: Kysely<Database> = this.db,
    ) {
        let q = trx.deleteFrom('role_grants').where('player_id', '=', playerId).where('role', '=', role);
        q = scopeType === null ? q.where('scope_type', 'is', null) : q.where('scope_type', '=', scopeType);
        q = scopeId === null ? q.where('scope_id', 'is', null) : q.where('scope_id', '=', scopeId);
        return q;
    }

    // --- Methods ---

    async grant(input: GrantInput): Promise<RoleGrant> {
        const scopeType = input.scopeType ?? null;
        const scopeId = input.scopeId ?? null;

        const existing = await this.exact(input.playerId, input.role, scopeType, scopeId).executeTakeFirst();
        if (existing) return toGrant(existing);

        const id = crypto.randomUUID();
        await this.insertGrant({
            id,
            player_id: input.playerId,
            role: input.role,
            scope_type: scopeType,
            scope_id: scopeId,
        }).execute();

        const row = await this.grants().where('id', '=', id).executeTakeFirstOrThrow();
        return toGrant(row);
    }

    async revoke(input: RevokeInput): Promise<void> {
        await this.deleteExact(
            input.playerId,
            input.role,
            input.scopeType ?? null,
            input.scopeId ?? null,
        ).execute();
    }

    async listForPlayer(playerId: string): Promise<RoleGrant[]> {
        const rows = await this.byPlayer(playerId).orderBy('granted_at').execute();
        return rows.map(toGrant);
    }

    async hasRole(
        playerId: string,
        role: RoleGrant['role'],
        scopeType?: string | null,
        scopeId?: string | null,
    ): Promise<boolean> {
        const row = await this.exact(
            playerId,
            role,
            scopeType ?? null,
            scopeId ?? null,
        ).executeTakeFirst();
        return row !== undefined;
    }
}
