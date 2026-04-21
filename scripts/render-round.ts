// Static HTML scorecard report for a round. Reads directly from
// `data/app.sqlite` — no running server, no auth. Always regenerates
// `tmp/index.html` alongside the round page so the index stays honest.
//
// Usage:
//   bun scripts/render-round.ts                # most-recent round
//   bun scripts/render-round.ts <roundId>      # specific round
//   bun scripts/render-round.ts --open         # opens the HTML in browser

import * as path from 'node:path';
import * as fs from 'node:fs';
import { createDb } from '@basics/core/server/db';
import { runMigrations } from '@basics/core/server/migrate';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import {
    collectRoundContext,
    renderRoundHtml,
    collectIndexRows,
    renderIndexHtml,
    openPathInBrowser,
    short,
} from './render-lib';

const args = process.argv.slice(2);
const openInBrowser = args.includes('--open');
const roundIdArg = args.find((a) => !a.startsWith('--'));

const dbPath = process.env.DB_PATH ?? './data/app.sqlite';
if (!fs.existsSync(dbPath)) {
    console.error(`no database at ${dbPath} — boot the dev server once first`);
    process.exit(1);
}

const db = createDb<Database>(dbPath);
await runMigrations(db, path.join(import.meta.dir, '../server/db/migrations'));
const svc = createServices(db);

try {
    const rounds = await svc.roundService.list();
    if (rounds.length === 0) {
        console.error('no rounds found; create one first');
        process.exit(1);
    }
    const roundId = roundIdArg ?? rounds[0].id;

    const tmpDir = path.join(process.cwd(), 'tmp');
    fs.mkdirSync(tmpDir, { recursive: true });

    const ctx = await collectRoundContext(svc, roundId, dbPath);
    const html = renderRoundHtml(ctx);
    const outPath = path.join(tmpDir, `round-${short(ctx.round.id)}.html`);
    fs.writeFileSync(outPath, html);

    // Always refresh the index — single-round renders shouldn't leave stale links.
    const indexRows = await collectIndexRows(svc);
    const indexPath = path.join(tmpDir, 'index.html');
    fs.writeFileSync(indexPath, renderIndexHtml(indexRows));

    console.log(`wrote ${outPath}`);
    console.log(`  ${ctx.participants.length} participants · ${ctx.events.length} events`);
    console.log(`index: ${indexPath} (${indexRows.length} rounds)`);

    if (openInBrowser) openPathInBrowser(outPath);
} finally {
    await db.destroy();
}
