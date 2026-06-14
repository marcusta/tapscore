// Phase 2.6d-bis static verification — ONE self-contained page.
//
// 2.6d-bis adds the non-flat `split` allowance variant: per-CH-band
// percentages applied across a single slot's balls, so low-CH and high-CH
// producers take DIFFERENT cuts off the same shared own-balls. This page
// inlines the ACTUAL rendered output for the split-allowance better-ball
// fixture, preceded by (a) a focused per-ball PH derivation table read
// straight from the persisted `slot_balls` rows and (b) a green expected-value
// callout — so every number is checkable by eye.
//
// Self-contained: in-page content only, no sibling-file links. Regenerate with
//   bun scripts/render-slice-2.6d-bis-verify.ts

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import { registerBuiltInBallCreationStrategies } from '../server/domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../server/domain/formats';
import {
    formatAllowanceLabel,
    type FormatAllowanceConfig,
} from '../server/domain/round-definition';
import { ROUND_CSS } from './render/css';
import {
    MANUAL_FORMAT_DB_PATH,
    MANUAL_FORMAT_RENDER_DIR,
    rebuildManualFormatDb,
    roundSignature,
} from './format-fixtures';
import { collectRoundContext, renderRoundHtml } from './render-lib';

const SPLIT_SIGNATURE = 'full_18|stableford:better_ball:split[9:100,*:75]';

function esc(s: string): string {
    return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
}

function bodyOf(html: string): string {
    const m = /<body>([\s\S]*)<\/body>/.exec(html);
    return m ? m[1] : html;
}

/** First band whose upToCh is the catch-all (null) or ≥ CH, with a readable label. */
function matchBand(
    config: Extract<FormatAllowanceConfig, { type: 'split' }>,
    ch: number,
): { label: string; pct: number } {
    let prev: number | null = null;
    for (const b of config.bands) {
        if (b.upToCh === null || ch <= b.upToCh) {
            const label = b.upToCh === null ? `CH > ${prev}` : `CH ≤ ${b.upToCh}`;
            return { label, pct: b.pct };
        }
        prev = b.upToCh;
    }
    return { label: '—', pct: 100 };
}

registerBuiltInBallCreationStrategies();
registerBuiltInFormats();

const { dbPath } = await rebuildManualFormatDb(MANUAL_FORMAT_DB_PATH);
const db = createDb<Database>(dbPath);
const services = createServices(db);

try {
    const rounds = await services.roundService.list();
    const round = rounds.find((r) => roundSignature(r) === SPLIT_SIGNATURE);
    if (!round) {
        throw new Error(`split fixture not found for signature ${SPLIT_SIGNATURE}`);
    }

    const slot = round.formatSlots[0]!;
    if (slot.allowanceConfig.type !== 'split') {
        throw new Error('expected a split allowanceConfig on the fixture slot');
    }
    const splitConfig = slot.allowanceConfig;

    // --- Per-ball PH derivation, read from the persisted slot_balls rows ----
    const slotRows = await db
        .selectFrom('slots')
        .where('round_id', '=', round.id)
        .select(['id', 'slot_def_id'])
        .execute();
    const slotId = slotRows.find((s) => s.slot_def_id === slot.slotDefId)!.id;
    const slotBalls = await db
        .selectFrom('slot_balls')
        .where('slot_id', '=', slotId)
        .select(['ball_id', 'playing_handicap_snapshot'])
        .execute();
    const ballPlayers = await db
        .selectFrom('ball_players')
        .where(
            'ball_id',
            'in',
            slotBalls.map((b) => b.ball_id),
        )
        .select(['ball_id', 'display_name_snapshot', 'course_handicap_snapshot'])
        .execute();

    const derivRows = slotBalls
        .map((sb) => {
            const bp = ballPlayers.find((p) => p.ball_id === sb.ball_id)!;
            const ch = bp.course_handicap_snapshot ?? 0;
            const { label, pct } = matchBand(splitConfig, ch);
            const expectedPh = Math.round((ch * pct) / 100);
            return {
                name: bp.display_name_snapshot,
                ch,
                bandLabel: label,
                pct,
                expectedPh,
                persistedPh: sb.playing_handicap_snapshot,
            };
        })
        .sort((a, b) => a.ch - b.ch);

    const derivTable = `
<table class="grid">
  <thead><tr>
    <th>producer</th><th>ball CH</th><th>band matched</th><th>allowance %</th>
    <th>PH = round(CH × %/100)</th><th>persisted slot_balls.PH</th><th>✓</th>
  </tr></thead>
  <tbody>
    ${derivRows
        .map((r) => {
            const ok = r.expectedPh === r.persistedPh;
            return `<tr>
      <td>${esc(r.name)}</td>
      <td class="num">${r.ch}</td>
      <td><code>${esc(r.bandLabel)}</code></td>
      <td class="num">${r.pct}%</td>
      <td class="num">round(${r.ch} × ${r.pct}/100) = <b>${r.expectedPh}</b></td>
      <td class="num">${r.persistedPh}</td>
      <td>${ok ? '✓' : '✗ MISMATCH'}</td>
    </tr>`;
        })
        .join('')}
  </tbody>
</table>`;

    const callout = `
  <p><strong>Required check — within ONE slot, the per-ball PH is derived from TWO different percentages.</strong>
    The slot's allowance is a non-flat <code>split</code> CH-band table — <b>${esc(formatAllowanceLabel(splitConfig))}</b> —
    instead of a single flat pct. Four own-balls share the slot; low-CH players keep 100%, high-CH players are cut to 75%:</p>
  <ul>
    <li><b>Ivar</b> CH 5 → <code>CH ≤ 9 → 100%</code> → PH <b>round(5 × 100%) = 5</b></li>
    <li><b>Klas</b> CH 9 → <code>CH ≤ 9 → 100%</code> (boundary inclusive) → PH <b>round(9 × 100%) = 9</b></li>
    <li><b>Lukas</b> CH 14 → <code>CH > 9 → 75%</code> → PH <b>round(14 × 75% = 10.5) = 11</b></li>
    <li><b>Jonas</b> CH 18 → <code>CH > 9 → 75%</code> → PH <b>round(18 × 75% = 13.5) = 14</b></li>
  </ul>
  <p>So the PH column is <b>5 / 9 / 11 / 14</b> — NOT a single flat pct (flat-75 would give 4 / 7 / 11 / 14; flat-100 would give 5 / 9 / 14 / 18).
    The derivation table below reads each <code>slot_balls.playing_handicap_snapshot</code> straight from the compiled DB and checks it against the arithmetic.</p>
  <p><strong>Each producer is now shown on the scorecard</strong> — per player: a <b>Given</b> row (strokes received, which visibly differs
    because PH differs), a <b>Gross</b> row, and a <b>Points</b> row — followed by <b>Team points = the best of the two per hole</b>.
    So you can see exactly which ball fed the team on each hole. The split matters to the result: the high-CH partner's extra
    strokes (the ones their 75% allowance still buys) win several holes outright.</p>
  <ul>
    <li><b>Ivar &amp; Jonas = 40.</b> Ivar (PH 5) solo 35, Jonas (PH 14) solo 21; best-ball pick: Ivar 11 holes, <b>Jonas 5 holes</b> (2 ties) — Jonas lifts the team above Ivar's solo 35.</li>
    <li><b>Klas &amp; Lukas = 39.</b> Klas (PH 9) solo 37, Lukas (PH 11) solo 18; best-ball pick: Klas 16 holes, <b>Lukas 2 holes</b> — Lukas's two extra strokes over Klas (PH 11 vs 9) win exactly the holes where only he receives a shot.</li>
  </ul>
  <p>Leaderboard: <b>Ivar &amp; Jonas 40</b>, <b>Klas &amp; Lukas 39</b>. The embedded scorecards + Balls table below are the real rendered output
    (<code>bun run render:formats</code>); the slot header reads <b>${esc(formatAllowanceLabel(splitConfig))}</b>.</p>`;

    const ctx = await collectRoundContext(services, round.id, dbPath);
    const body = bodyOf(renderRoundHtml(ctx));

    const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Phase 2.6d-bis — static verification</title>
<style>
${ROUND_CSS}
body { max-width: 1120px; margin: 1.5rem auto; padding: 0 1rem; }
.verify-block { border: 2px solid #2a7; border-radius: 10px; margin: 2rem 0; padding: 0 1.2rem 1.2rem; }
.verify-block > h2 { background: #1f5d3a; color: #fff; margin: 0 -1.2rem 1rem; padding: .7rem 1.2rem; border-radius: 8px 8px 0 0; font-size: 1.05rem; }
.callout { background: #f3f8f4; border-left: 4px solid #2a7; padding: .6rem 1rem; border-radius: 4px; margin-bottom: 1rem; }
.callout ul { margin: .3rem 0; padding-left: 1.2rem; }
.callout li { margin: .2rem 0; }
.deriv { margin: 1rem 0 1.4rem; }
.deriv h3 { font-size: .98rem; margin: .2rem 0 .5rem; }
.embedded { border-top: 1px dashed #cdd3db; padding-top: .8rem; }
.embedded h1 { font-size: 1.05rem; }
.embedded p > a[href="index.html"] { display: none; }
.intro { background:#fff8e6; border:1px solid #e8d8a0; border-radius:8px; padding:.8rem 1rem; }
.muted { color: #667; }
</style>
</head>
<body>
<h1>Phase 2.6d-bis · non-flat (split CH-band) allowance — static verification</h1>
<div class="intro">
  <p>2.6d-bis grows the <code>FormatAllowanceConfig</code> union with the non-flat <code>split</code> variant: per-CH-band
  percentages applied across a single slot's balls. The compiler validates the band table (ascending bounds, in-range
  percentages, a final open catch-all) as structured diagnostics; the shared <code>deriveAllowance</code> path resolves one
  PH per ball under it. Below is the <strong>real rendered page</strong> for the split-allowance better-ball fixture, with a
  focused per-ball PH derivation table — self-contained, no links to click. Regenerate with
  <code>bun scripts/render-slice-2.6d-bis-verify.ts</code>.</p>
</div>

<section class="verify-block">
  <h2>split-allowance-better-ball-round — per-ball PH split within ONE slot <span style="font-weight:400">· required check</span></h2>
  <div class="callout">${callout}</div>
  <div class="deriv">
    <h3>Per-ball allowance derivation (read from persisted <code>slot_balls</code>)</h3>
    ${derivTable}
  </div>
  <div class="embedded">${body}</div>
</section>
</body>
</html>`;

    fs.mkdirSync(MANUAL_FORMAT_RENDER_DIR, { recursive: true });
    const outPath = path.join(MANUAL_FORMAT_RENDER_DIR, 'slice-2.6d-bis-verify.html');
    fs.writeFileSync(outPath, page);
    // eslint-disable-next-line no-console
    console.log(`wrote ${outPath}`);
} finally {
    await db.destroy();
}
