import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import { PlayerService } from './player.service';

export function createServices(db: Kysely<Database>) {
    const playerService = new PlayerService(db);
    return { db, playerService };
}
