import { Database as BunDatabase } from 'bun:sqlite';
import { Kysely } from 'kysely';
import { BunSqliteDialect } from 'kysely-bun-sqlite';

export function createDb<DB>(path: string, options?: { autoVacuum?: 'incremental' }): Kysely<DB> {
    const sqlite = new BunDatabase(path);
    if (path !== ':memory:') {
        sqlite.run('PRAGMA journal_mode = WAL');
    }
    if (options?.autoVacuum === 'incremental') {
        const current = sqlite.query('PRAGMA auto_vacuum').get() as { auto_vacuum: number };
        if (current.auto_vacuum !== 2) {
            sqlite.run('PRAGMA auto_vacuum = 2');
            sqlite.run('VACUUM');
        }
    }
    sqlite.run('PRAGMA foreign_keys = ON');

    return new Kysely<DB>({
        dialect: new BunSqliteDialect({ database: sqlite }),
    });
}
