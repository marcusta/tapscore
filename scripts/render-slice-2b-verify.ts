// Slice 2b focused visual verification — ONE self-contained page.
//
// Embeds the ACTUAL rendered round pages (every per-hole number, computed by
// the real `scripts/render` pipeline off the canonical plugin sections) so the
// arithmetic can be verified by eye — no navigation, no blank sibling links,
// nothing to take on trust. Rebuilds the canonical fixture DB, selects the
// three required-check rounds by stable format signature, and concatenates
// their rendered bodies under one stylesheet with an expected-value callout
// before each.
//
//   bun scripts/render-slice-2b-verify.ts

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import { ROUND_CSS } from './render/css';
import {
    MANUAL_FORMAT_DB_PATH,
    MANUAL_FORMAT_RENDER_DIR,
    rebuildManualFormatDb,
} from './format-fixtures';
import { collectRoundContext, renderRoundHtml } from './render-lib';
import type { Round } from '../server/services/round.service';

function signature(round: Round): string {
    const slots = round.formatSlots
        .map((s) => `${s.scoringMode}:${s.teamShape}:${s.allowancePct}`)
        .join('+');
    return `${round.roundType}|${slots}`;
}

interface Target {
    signature: string;
    heading: string;
    callout: string;
}

const TARGETS: Target[] = [
    {
        signature:
            'full_18|stableford:individual:100+kopenhamnare:individual:100+match_play:individual:100',
        heading: '1 · multi-format-3p-round — three slots, one shared event log',
        callout: `
      <p><strong>What to verify (Leaderboard section, three separate slots):</strong></p>
      <ul>
        <li><b>Slot #0 Stableford</b> — re-add each player's per-hole <code>Points</code> row:
            expect <b>Alice 37</b>, <b>Eve 31</b>, <b>Bob 23</b> (high wins). Each Points cell hover
            shows <code>netPar − gross</code>.</li>
        <li><b>Slot #1 Köpenhamnare</b> — the 6-point <code>Points</code> row per player sums to 6 each
            decided hole; topology footnotes (<code>4 of 6 (sole best)</code> …) match. Standings are
            normalised so the trailing player is <b>0</b>: expect <b>Alice 35</b>, <b>Eve 22</b>,
            <b>Bob 0</b>.</li>
        <li><b>Slot #2 Match play</b> — Alice vs Bob card: <code>Given</code> = match-play normalised
            (lower PH plays 0), <code>Net = Gross − Given</code>, <code>Match</code> row runs to a close-out.
            Expect <b>Alice d. Bob, 7 &amp; 5</b>. Eve renders as her own “odd ball out” card, no match line.</li>
      </ul>`,
    },
    {
        signature: 'full_18|match_play:individual:100',
        heading: '2 · match-play-round — pair-only, no ranked scalar metric',
        callout: `
      <p><strong>What to verify:</strong> the Leaderboard has a single <em>Match results</em> column and
        <b>no points/gross/net ranked table</b> (match play declares <code>metrics: []</code>). Expect
        <b>Alice d. Bob, 3 &amp; 2</b> and <b>Carol vs. Dan halved, AS</b>. On each pair card confirm
        per-member <code>Given / Gross / Net</code> rows and that the <code>Match</code> row reads
        <code>AS / nUP / nDN</code>.</p>`,
    },
    {
        signature: 'full_18|umbrella:four_ball:100',
        heading: '3 · umbrella-round (4-ball) — category math, multipliers, running total',
        callout: `
      <p><strong>What to verify:</strong> each team's <code>Team points</code> row hover shows
        <code>categories = sum × hole × (2 if sweep)</code>; a sweep hole reads e.g.
        <code>LG + LT + GIR-A + GIR-B + BIRD = 5 × 7 × 2 = 70 ☂</code>. The normalised <code>Running</code>
        row leaves the trailing team at 0. Expect Leaderboard totals
        <b>Carol &amp; Dan 70</b> and <b>Alice &amp; Bob 0</b>.</p>`,
    },
];

function bodyOf(html: string): string {
    const m = /<body>([\s\S]*)<\/body>/.exec(html);
    return m ? m[1] : html;
}

const { dbPath } = await rebuildManualFormatDb(MANUAL_FORMAT_DB_PATH);
const db = createDb<Database>(dbPath);
const services = createServices(db);

try {
    const rounds = await services.roundService.list();
    const sections: string[] = [];

    for (const target of TARGETS) {
        const round = rounds.find((r) => signature(r) === target.signature);
        if (!round) {
            sections.push(
                `<section class="verify-block"><h2>${target.heading}</h2><p class="missing">FIXTURE NOT FOUND for signature <code>${target.signature}</code></p></section>`,
            );
            continue;
        }
        const ctx = await collectRoundContext(services, round.id, dbPath);
        const body = bodyOf(renderRoundHtml(ctx));
        sections.push(`
<section class="verify-block">
  <h2>${target.heading}</h2>
  <div class="callout">${target.callout}</div>
  <div class="embedded">${body}</div>
</section>`);
    }

    const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Slice 2b — focused visual verification</title>
<style>
${ROUND_CSS}
body { max-width: 1100px; margin: 1.5rem auto; padding: 0 1rem; }
.verify-block { border: 2px solid #cdd3db; border-radius: 10px; margin: 2rem 0; padding: 0 1.2rem 1.2rem; }
.verify-block > h2 { background: #1f2a44; color: #fff; margin: 0 -1.2rem 1rem; padding: .7rem 1.2rem; border-radius: 8px 8px 0 0; font-size: 1.1rem; }
.callout { background: #f3f8f4; border-left: 4px solid #2a7; padding: .6rem 1rem; border-radius: 4px; margin-bottom: 1rem; }
.callout ul { margin: .3rem 0 0; padding-left: 1.2rem; }
.callout li { margin: .25rem 0; }
.embedded { border-top: 1px dashed #cdd3db; padding-top: .8rem; }
.embedded h1 { font-size: 1.05rem; }
.embedded p > a[href="index.html"] { display: none; }
.missing { color: #b00; font-weight: 600; }
.intro { background:#fff8e6; border:1px solid #e8d8a0; border-radius:8px; padding:.8rem 1rem; }
</style>
</head>
<body>
<h1>Slice 2b — focused visual verification</h1>
<div class="intro">
  <p>Below are the <strong>real rendered pages</strong> for the three required-check rounds — the same
  output <code>bun run render:formats</code> produces, generated from the canonical plugin result
  sections. Every per-hole grid, footnote and total here is computed, not narrated: re-add the rows
  yourself to confirm. The green callout before each round says exactly what to look for and the
  expected totals.</p>
  <p class="muted">Self-contained — no external links to click. Regenerate with
  <code>bun scripts/render-slice-2b-verify.ts</code>.</p>
</div>
${sections.join('\n')}
</body>
</html>`;

    fs.mkdirSync(MANUAL_FORMAT_RENDER_DIR, { recursive: true });
    const outPath = path.join(MANUAL_FORMAT_RENDER_DIR, 'slice-2b-verify.html');
    fs.writeFileSync(outPath, page);
    // eslint-disable-next-line no-console
    console.log(`wrote ${outPath}`);
} finally {
    await db.destroy();
}
