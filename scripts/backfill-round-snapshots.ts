// Dev-only utility for phase 2.6a hand-verification.
//
// 2.6a is migration-only: the live write path for snapshot tables lands
// in 2.6b via the RoundCompiler. That means rounds created after 2.6a
// migration runs (including everything seeded in fresh dev DBs) have no
// snapshot rows — only rounds that already existed at migration time
// get backfilled.
//
// This script invokes the backfill helper against the current DB so
// seeded rounds visibly populate the snapshot tables, mimicking the
// migration-time experience without needing an old-schema fixture. When
// 2.6b's RoundCompiler lands and live writes start happening at round
// creation, this script + the backfill helper it wraps can be deleted.
//
// Usage:
//   bun scripts/backfill-round-snapshots.ts              # skip populated
//   bun scripts/backfill-round-snapshots.ts --reseed     # wipe + re-insert

import * as path from 'node:path';
import * as fs from 'node:fs';
import { createDb } from '@basics/core/server/db';
import { runMigrations } from '@basics/core/server/migrate';
import type { Database } from '../server/db/schema';
import { backfillRoundSnapshots } from '../server/db/backfill/round-snapshots';

const args = process.argv.slice(2);
const mode = args.includes('--reseed') ? 'reseed' : 'skip-populated';

const dbPath = process.env.DB_PATH ?? './data/app.sqlite';
if (!fs.existsSync(dbPath)) {
    console.error(`no database at ${dbPath} — boot the dev server once first`);
    process.exit(1);
}

const db = createDb<Database>(dbPath);
await runMigrations(db, path.join(import.meta.dir, '../server/db/migrations'));

try {
    const result = await backfillRoundSnapshots(db, { mode });
    console.log(
        `backfill (${mode}): ${result.roundsTouched} rounds, ${result.courseHoleRows} course-hole rows, ${result.teeHoleRows} tee-hole rows`,
    );
} finally {
    await db.destroy();
}
