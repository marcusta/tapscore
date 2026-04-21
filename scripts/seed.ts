// Named-seed dispatcher. Usage:
//
//   bun scripts/seed.ts <name> [<name> ...]
//   bun scripts/seed.ts list
//
// Seeds live in `scripts/seeds/<name>.ts` and export `apply(scenario)`.
// Each seed runs against the same scenario / DB connection so they can
// reference each other (e.g. `friendly-round` depends on `linkopings`).
//
// List of built-ins:
//   linkopings       — Linköpings Golfklubb + 5 tees (real data)
//   friendly-round   — 4-participant stroke-play × individual round on
//                      Linköping, partial scoring, one DNP + one pickup
//   match-play-better-ball-round — sample 2v2 plain net better-ball match
//
// Assumes the dev server has booted at least once (to apply migrations +
// create data/app.sqlite + the default dev fixture).

import { applyNamedSeeds, availableSeedNames } from './seed-lib';

function printSeedList(): void {
    const available = availableSeedNames();
    for (const name of available) console.log(name);
}

const requested = process.argv.slice(2);
if (requested.length === 0) {
    const available = availableSeedNames();
    console.error('usage: bun scripts/seed.ts <name> [<name> ...]');
    console.error('       bun scripts/seed.ts list');
    console.error(`available: ${available.join(', ')}`);
    process.exit(1);
}

if (requested.length === 1 && requested[0] === 'list') {
    printSeedList();
    process.exit(0);
}

try {
    await applyNamedSeeds(requested);
} catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exit(1);
}
