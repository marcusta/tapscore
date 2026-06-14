import * as fs from 'node:fs';
import * as path from 'node:path';
import { startScenario, type Scenario } from './scenario';

const seedsDir = path.join(import.meta.dir, 'seeds');

export const MANUAL_FORMAT_SEEDS = [
    'linkopings',
    'friendly-round',
    'nine-hole-round',
    'stableford-round',
    'foursomes-round',
    'better-ball-round',
    'match-play-round',
    'match-play-better-ball-round',
    'taliban-round',
    'kopenhamnare-round',
    'umbrella-round',
    'umbrella-individual-round',
    'multi-slot-series-round',
    'multi-format-3p-round',
    'greensomes-weighted-round',
    'scramble-4-by-rank-round',
    'scramble-2-by-rank-round',
    'fourball-85-round',
    'split-allowance-better-ball-round',
    'multi-format-extreme-round',
    'mixed-tee-round',
] as const;

export function availableSeedNames(): string[] {
    return fs.existsSync(seedsDir)
        ? fs
              .readdirSync(seedsDir)
              .filter((f) => f.endsWith('.ts'))
              .map((f) => f.replace(/\.ts$/, ''))
              .sort()
        : [];
}

async function applySeedModule(name: string, s: Scenario): Promise<void> {
    const file = path.join(seedsDir, `${name}.ts`);
    if (!fs.existsSync(file)) {
        throw new Error(`seed "${name}" not found at ${file}`);
    }
    const mod = await import(file);
    if (typeof mod.apply !== 'function') {
        throw new Error(`seed "${name}" does not export apply(scenario)`);
    }
    await mod.apply(s);
}

export async function applyNamedSeeds(
    names: readonly string[],
    options: { dbPath?: string } = {},
): Promise<void> {
    const s = await startScenario(options.dbPath);
    try {
        for (const name of names) {
            await applySeedModule(name, s);
        }
    } finally {
        await s.close();
    }
}
