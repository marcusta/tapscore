// sig-infra deploy migration entrypoint.
//
// Reuses the SAME Kysely migrator the server runs on boot
// (createApp -> runMigrations over server/db/migrations), so the
// pre-deploy migration step is identical to what production applies
// at startup. Kysely's Migrator tracks applied migrations in the
// kysely_migration table, so re-running is idempotent.
//
// DB_PATH is set by the sig-infra tooling (deploy-tmp/db.sqlite) when
// migrating the pulled prod DB locally. Falls back to the runtime path.
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import { runMigrations } from '@basics/core/server/migrate';
import type { Database } from '../server/db/schema';

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const migrationFolder = path.join(import.meta.dir, '../server/db/migrations');

console.log(`Running migrations on ${dbPath}...`);

const db = createDb<Database>(dbPath);

try {
    await runMigrations(db, migrationFolder);
    console.log('✅ Migrations completed');
    await db.destroy();
    process.exit(0);
} catch (e) {
    console.error('❌ Migration failed:', e);
    await db.destroy();
    process.exit(1);
}
