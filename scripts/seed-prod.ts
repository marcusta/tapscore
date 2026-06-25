// Production reference-data seed — idempotent, DB_PATH-aware.
//
// Seeds ONLY real course data (Linköpings Golfklubb — par 71, real pars +
// stroke indexes + 5 rated tees) into the DB at DB_PATH. No players, no
// rounds: this is a no-login on-course app, and scorecards are produced by
// actually playing rounds in the UI. Safe to re-run — every step is
// find-or-create, so a second run is a no-op.
//
// Run on the server, as the service user, against the prod DB:
//   cd /srv/tapscore
//   sudo -u tapscore env DB_PATH=data/app.sqlite /usr/local/bin/bun run seed:prod
import { applyNamedSeeds } from './seed-lib';

const dbPath = process.env.DB_PATH || './data/app.sqlite';

console.log(`Seeding production reference data into ${dbPath}...`);

try {
    await applyNamedSeeds(['linkopings'], { dbPath });
    console.log('✅ Production seed complete — Linköpings Golfklubb + 5 tees');
    process.exit(0);
} catch (e) {
    console.error('❌ Production seed failed:', e);
    process.exit(1);
}
