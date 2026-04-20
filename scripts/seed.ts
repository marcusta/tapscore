// Named-seed dispatcher. Usage:
//
//   bun scripts/seed.ts <name> [<name> ...]
//
// Seeds live in `scripts/seeds/<name>.ts` and export `apply(scenario)`.
// Each seed runs against the same scenario / DB connection so they can
// reference each other (e.g. `friendly-round` depends on `linkopings`).
//
// List of built-ins:
//   linkopings       — Linköpings Golfklubb + 5 tees (real data)
//   friendly-round   — 4-participant stroke-play × individual round on
//                      Linköping, partial scoring, one DNP + one pickup
//
// Assumes the dev server has booted at least once (to apply migrations +
// create data/app.sqlite + the default dev fixture).

import * as path from 'node:path';
import * as fs from 'node:fs';
import { startScenario, type Scenario } from './scenario';

const requested = process.argv.slice(2);
if (requested.length === 0) {
    const seedsDir = path.join(import.meta.dir, 'seeds');
    const available = fs.existsSync(seedsDir)
        ? fs
              .readdirSync(seedsDir)
              .filter((f) => f.endsWith('.ts'))
              .map((f) => f.replace(/\.ts$/, ''))
        : [];
    console.error('usage: bun scripts/seed.ts <name> [<name> ...]');
    console.error(`available: ${available.join(', ')}`);
    process.exit(1);
}

const s: Scenario = await startScenario();

try {
    for (const name of requested) {
        const file = path.join(import.meta.dir, 'seeds', `${name}.ts`);
        if (!fs.existsSync(file)) {
            console.error(`seed "${name}" not found at ${file}`);
            process.exit(1);
        }
        const mod = await import(file);
        if (typeof mod.apply !== 'function') {
            console.error(`seed "${name}" does not export apply(scenario)`);
            process.exit(1);
        }
        await mod.apply(s);
    }
} finally {
    await s.close();
}
