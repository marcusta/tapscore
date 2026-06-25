import type { Kysely } from 'kysely';
import { createDb } from './db';
import { runMigrations } from './migrate';

export async function createTestDb<DB>(migrationFolder: string): Promise<Kysely<DB>> {
    const db = createDb<DB>(':memory:');
    await runMigrations(db, migrationFolder);
    return db;
}
