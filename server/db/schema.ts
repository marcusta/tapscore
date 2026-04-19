import type { Generated } from 'kysely';

export interface Database {
    players: PlayersTable;
}

export interface PlayersTable {
    id: string;
    username: string;
    password_hash: string;
    created_at: Generated<string>;
}
