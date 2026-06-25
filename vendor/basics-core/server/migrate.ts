import { Migrator, FileMigrationProvider, type Kysely } from 'kysely';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';

export async function runMigrations(db: Kysely<any>, migrationFolder: string): Promise<void> {
    const migrator = new Migrator({
        db,
        provider: new FileMigrationProvider({ fs, path, migrationFolder }),
    });

    const { error } = await migrator.migrateToLatest();

    if (error) {
        throw error;
    }
}
