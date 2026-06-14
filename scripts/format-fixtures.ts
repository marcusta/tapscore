import * as fs from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import { runMigrations } from '@basics/core/server/migrate';
import { sql } from 'kysely';
import type { Database } from '../server/db/schema';
import { seedDev } from '../server/db/seeds/dev';
import { createServices } from '../server/services/index';
import type { Round } from '../server/services/round.service';
import { MANUAL_FORMAT_SEEDS, applyNamedSeeds } from './seed-lib';

export const MANUAL_FORMAT_DB_PATH = path.join(process.cwd(), 'tmp', 'manual-format-fixtures.sqlite');
export const MANUAL_FORMAT_RENDER_DIR = path.join(process.cwd(), 'tmp', 'formats');

const EXPECTED_FIXTURE_SIGNATURES = [
    'full_18|stroke_play:individual:100',
    'front_9|stroke_play:individual:100',
    'full_18|stableford:individual:100',
    'full_18|stroke_play:foursomes:50',
    'full_18|stableford:better_ball:100',
    'full_18|match_play:individual:100',
    'full_18|match_play:better_ball:100',
    'full_18|taliban:better_ball:100',
    'full_18|kopenhamnare:individual:100',
    'full_18|umbrella:four_ball:100',
    'front_9|umbrella:individual:100',
    'full_18|stableford:individual:95+stroke_play:foursomes:50',
    // --- Phase 2.6c additions ---
    'full_18|stroke_play:greensome:100',
    'full_18|stroke_play:scramble:100',
    'full_18|stroke_play:scramble:90',
    'full_18|stableford:better_ball:85',
    'full_18|stableford:individual:95+umbrella:individual:100+taliban:better_ball:90+stroke_play:individual:100+stroke_play:foursomes:100+kopenhamnare:individual:100+stableford:better_ball:85',
    'full_18|stroke_play:foursomes:100+stroke_play:individual:100',
] as const;

function removeDbFiles(dbPath: string): void {
    for (const candidate of [dbPath, `${dbPath}-shm`, `${dbPath}-wal`]) {
        if (fs.existsSync(candidate)) fs.rmSync(candidate, { force: true });
    }
}

function roundSignature(round: Round): string {
    const slots = round.formatSlots
        .map((slot) => `${slot.scoringMode}:${slot.teamShape}:${slot.allowancePct}`)
        .join('+');
    return `${round.roundType}|${slots}`;
}

async function checkpointDb(dbPath: string): Promise<void> {
    const db = createDb<Database>(dbPath);
    try {
        await sql`PRAGMA wal_checkpoint(FULL)`.execute(db);
    } finally {
        await db.destroy();
    }
}

export async function rebuildManualFormatDb(
    dbPath = MANUAL_FORMAT_DB_PATH,
): Promise<{ dbPath: string; roundCount: number }> {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    removeDbFiles(dbPath);

    const db = createDb<Database>(dbPath);
    try {
        await runMigrations(db, path.join(import.meta.dir, '../server/db/migrations'));
        const services = createServices(db);
        await seedDev(services);
    } finally {
        await db.destroy();
    }

    await applyNamedSeeds(MANUAL_FORMAT_SEEDS, { dbPath });
    await checkpointDb(dbPath);
    const { roundCount } = await verifyManualFormatDb(dbPath);
    return { dbPath, roundCount };
}

export async function verifyManualFormatDb(
    dbPath = MANUAL_FORMAT_DB_PATH,
): Promise<{ roundCount: number; signatures: string[] }> {
    if (!fs.existsSync(dbPath)) {
        throw new Error(`manual format fixture DB not found at ${dbPath} — run bun run seed:formats first`);
    }

    const db = createDb<Database>(dbPath);
    try {
        const services = createServices(db);
        const rounds = await services.roundService.list();
        const signatures = rounds.map(roundSignature);
        const missing = EXPECTED_FIXTURE_SIGNATURES.filter((sig) => !signatures.includes(sig));
        if (missing.length > 0) {
            throw new Error(
                `manual format fixtures missing expected rounds: ${missing.join(', ')}`,
            );
        }
        return { roundCount: rounds.length, signatures };
    } finally {
        await db.destroy();
    }
}
