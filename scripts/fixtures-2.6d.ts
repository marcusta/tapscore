// Phase 2.6d — fixture DB builder for the corrections / format-action /
// dashboard / soft-delete seeds. Kept SEPARATE from the canonical manual-format
// oracle (`format-fixtures.ts`): those 19 fixtures verify pure format scoring
// and must stay numerically frozen, whereas these seeds exercise event-driven
// corrections + rulings + stateful actions + soft-delete that are not format
// scoring shapes. The stable-signature selection mechanism does not fit them
// (many share a stableford/stroke signature), so the verify page selects by the
// seed's unique `playedAt` date instead.

import * as path from 'node:path';
import * as fs from 'node:fs';
import { createDb } from '@basics/core/server/db';
import { runMigrations } from '@basics/core/server/migrate';
import type { Database } from '../server/db/schema';
import { registerBuiltInBallCreationStrategies } from '../server/domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../server/domain/formats';
import { registerStatefulCanary } from '../server/domain/formats/_stateful_canary.testkit';
import { applyNamedSeeds } from './seed-lib';

export const DB_PATH_2_6D = path.join(process.cwd(), 'tmp', 'phase-2.6d-fixtures.sqlite');
export const RENDER_DIR_2_6D = path.join(process.cwd(), 'tmp', 'formats');

/** The eight 2.6d seeds, in narrative order. */
export const SEEDS_2_6D = [
    'setup-correction-round',
    'allowance-override-round',
    'allowance-override-then-setup-correction-round',
    'ruling-applied-round',
    'route-correction-round',
    'soft-deleted-player-round',
    'stateful-canary-round',
    'player-dashboard-listing',
] as const;

export async function rebuild2_6dDb(dbPath = DB_PATH_2_6D): Promise<{ dbPath: string }> {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    registerStatefulCanary();

    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    for (const suffix of ['', '-shm', '-wal']) {
        const f = `${dbPath}${suffix}`;
        if (fs.existsSync(f)) fs.unlinkSync(f);
    }

    const db = createDb<Database>(dbPath);
    try {
        await runMigrations(db, path.join(import.meta.dir, '../server/db/migrations'));
    } finally {
        await db.destroy();
    }
    await applyNamedSeeds(SEEDS_2_6D, { dbPath });
    return { dbPath };
}
