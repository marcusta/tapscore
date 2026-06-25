import * as path from 'node:path';
import type { Kysely } from 'kysely';
import { createDb } from '../db';
import { runMigrations } from '../migrate';
import type { ObsDatabase } from './schema';
import { ObsService } from './obs.service';

export async function createObsTestDb(): Promise<{ obsService: ObsService; obsDb: Kysely<ObsDatabase> }> {
    const obsDb = createDb<ObsDatabase>(':memory:');
    await runMigrations(obsDb, path.join(import.meta.dir, 'migrations'));
    return { obsService: new ObsService(obsDb), obsDb };
}
