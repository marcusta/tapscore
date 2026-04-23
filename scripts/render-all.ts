// Render every round in the DB to `tmp/round-<short>.html`, plus the
// `tmp/index.html` listing page. Safe to re-run — overwrites existing files.
//
// Usage:
//   bun scripts/render-all.ts           # all rounds + index
//   bun scripts/render-all.ts --open    # also opens the index page

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

const dbPath = process.env.DB_PATH ?? './data/app.sqlite';
if (!fs.existsSync(dbPath)) {
    console.error(`no database at ${dbPath} — boot the dev server once first`);
    process.exit(1);
}

const db = createDb<Database>(dbPath);
await runMigrations(db, path.join(import.meta.dir, '../server/db/migrations'));
const svc = createServices(db);

try {
    const tmpDir = path.join(process.cwd(), 'tmp');
    fs.mkdirSync(tmpDir, { recursive: true });

    const rounds = await svc.roundService.list();

    for (const r of rounds) {
        const ctx = await collectRoundContext(svc, r.id, dbPath);
        const html = renderRoundHtml(ctx);
        const outPath = path.join(tmpDir, `round-${short(ctx.round.id)}.html`);
        fs.writeFileSync(outPath, html);
        console.log(`wrote ${outPath} (${ctx.balls.length}b · ${ctx.events.length}e)`);
    }

    const indexRows = await collectIndexRows(svc);
    const indexPath = path.join(tmpDir, 'index.html');
    fs.writeFileSync(indexPath, renderIndexHtml(indexRows));
    console.log(`index: ${indexPath} (${indexRows.length} rounds)`);

    if (openInBrowser) openPathInBrowser(indexPath);
} finally {
    await db.destroy();
}
