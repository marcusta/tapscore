// Deterministic manual-format render pipeline.
//
// Rebuilds a dedicated fixture DB under tmp/, seeds the canonical sample
// rounds, verifies they are all present, then renders those rounds into
// `tmp/formats/`.
//
// Usage:
//   bun scripts/render-formats.ts
//   bun scripts/render-formats.ts --open

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import {
    MANUAL_FORMAT_DB_PATH,
    MANUAL_FORMAT_RENDER_DIR,
    rebuildManualFormatDb,
} from './format-fixtures';
import {
    collectIndexRows,
    collectRoundContext,
    openPathInBrowser,
    renderIndexHtml,
    renderRoundHtml,
    short,
} from './render-lib';

const args = process.argv.slice(2);
const openInBrowser = args.includes('--open');

const { roundCount, dbPath } = await rebuildManualFormatDb(MANUAL_FORMAT_DB_PATH);

fs.rmSync(MANUAL_FORMAT_RENDER_DIR, { recursive: true, force: true });
fs.mkdirSync(MANUAL_FORMAT_RENDER_DIR, { recursive: true });

const db = createDb<Database>(dbPath);
const services = createServices(db);

try {
    const rounds = await services.roundService.list();

    for (const round of rounds) {
        const ctx = await collectRoundContext(services, round.id, dbPath);
        const html = renderRoundHtml(ctx);
        const outPath = path.join(MANUAL_FORMAT_RENDER_DIR, `round-${short(ctx.round.id)}.html`);
        fs.writeFileSync(outPath, html);
        // eslint-disable-next-line no-console
        console.log(`wrote ${outPath} (${ctx.balls.length}b · ${ctx.events.length}e)`);
    }

    const indexRows = await collectIndexRows(services);
    const indexPath = path.join(MANUAL_FORMAT_RENDER_DIR, 'index.html');
    fs.writeFileSync(indexPath, renderIndexHtml(indexRows));
    // eslint-disable-next-line no-console
    console.log(`index: ${indexPath} (${roundCount} rounds)`);

    if (openInBrowser) openPathInBrowser(indexPath);
} finally {
    await db.destroy();
}
