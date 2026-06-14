// Phase 2.6c static verification — ONE self-contained page.
//
// 2.6c adds new ball-creation strategies (greensomes weighted, scramble by-rank,
// modified alt-shot) + new formats (greensomes, scramble) and proves the
// multi-slot / multi-ball model end-to-end with a kitchen-sink round. This page
// inlines the ACTUAL rendered output (the same `bun run render:formats`
// produces) for the riskiest new fixtures, each preceded by a green
// expected-value callout so every number is checkable by eye.
//
// Self-contained: in-page anchors only, no sibling-file links. Regenerate with
//   bun scripts/render-slice-2.6c-verify.ts
//
// Required checks (green-bordered): (1) the kitchen-sink shared event log +
// per-slot PH split, (2) one non-flat team-ball derivation (greensomes
// weighted), (3) the mixed-tee CH arithmetic. The scramble + 85% better-ball
// fixtures are optional regression spot-checks (still fully inlined).

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import { registerBuiltInBallCreationStrategies } from '../server/domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../server/domain/formats';
import { ROUND_CSS } from './render/css';
import {
    MANUAL_FORMAT_DB_PATH,
    MANUAL_FORMAT_RENDER_DIR,
    rebuildManualFormatDb,
} from './format-fixtures';
import { collectRoundContext, renderRoundHtml } from './render-lib';
import type { Round } from '../server/services/round.service';

function esc(s: string): string {
    return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
}

function signature(round: Round): string {
    const slots = round.formatSlots.map((s) => `${s.scoringMode}:${s.teamShape}:${s.allowancePct}`).join('+');
    return `${round.roundType}|${slots}`;
}

function bodyOf(html: string): string {
    const m = /<body>([\s\S]*)<\/body>/.exec(html);
    return m ? m[1] : html;
}

type Tier = 'required' | 'regression';

interface Target {
    anchor: string;
    signature: string;
    heading: string;
    tier: Tier;
    callout: string;
}

const TARGETS: Target[] = [
    {
        anchor: 'kitchen-sink',
        signature:
            'full_18|stableford:individual:95+umbrella:individual:100+taliban:better_ball:90+stroke_play:individual:100+stroke_play:foursomes:100+kopenhamnare:individual:100+stableford:better_ball:85',
        heading: 'multi-format-extreme-round — kitchen-sink: 6 balls, 7 slots, ONE event log',
        tier: 'required',
        callout: `
      <p><strong>Required check — one shared event log drives seven strategies with per-slot PH correctness.</strong>
        A single <code>modified_alt_shot_pair</code> strategy emits <b>6 balls in one pass</b> (see the Balls table):</p>
      <ul>
        <li><b>4 own balls</b> — Karl <code>CH 5</code>, Lars <code>CH 12</code>, Mats <code>CH 9</code>, Nora <code>CH 20</code>
            (per-producer CH straight through).</li>
        <li><b>2 alt-shot team balls</b> — Karl &amp; Lars <code>round((5+12)/2)=9</code>,
            Mats &amp; Nora <code>round((9+20)/2)=15</code>.</li>
      </ul>
      <p><strong>Same 4 own balls, different PH per slot</strong> (Balls table → per-slot PH; allowance per slot below):
        e.g. <b>Lars (CH 12)</b> reads <code>PH 11</code> @95% (stableford), <code>12</code> @100% (umbrella / stroke / split-sixes),
        <code>11</code> @90% (taliban), <code>10</code> @85% (better-ball). <b>Karl (CH 5)</b> reads <code>5,5,5,5,5,4</code>;
        <b>Nora (CH 20)</b> reads <code>19 / 18 / 20 / 20 / 17</code>. The Events table is ONE 108-row log (6 balls × 18).</p>
      <p>Expected leaderboards: <b>S#0 Stableford(95%)</b> 41 / 35 / 29 / 23 · <b>S#1 Umbrella(100%, 3 of 4)</b> 171 / 78 / 0 ·
        <b>S#2 Taliban(90%, 2v2)</b> Karl &amp; Lars +11 (13–2) · <b>S#3 Stroke(100%)</b> Gross 71/81/89/103, Net 66/72/77/83 ·
        <b>S#4 Alt-shot foursomes(100%)</b> Gross 71/86, Net 62/71 (PH 9 / 15) ·
        <b>S#5 Split sixes(100%, 3 of 4)</b> 49 / 17 / 0 · <b>S#6 Better-ball(85%, 2v2)</b> 40 / 34.</p>`,
    },
    {
        anchor: 'greensomes',
        signature: 'full_18|stroke_play:greensome:100',
        heading: 'greensomes-weighted-round — non-flat team-ball derivation (60/40)',
        tier: 'required',
        callout: `
      <p><strong>Required check — the weighted greensomes pair handicap.</strong> Both players on Gul/M:
        Gunnar <code>idx 9 → CH 8</code>, Hugo <code>idx 16 → CH 16</code>. The team ball CH weights the LOWER CH 60%
        and the HIGHER 40%:</p>
      <p style="margin-left:1rem"><code>ball CH = round(60% × 8 + 40% × 16) = round(11.2) = <b>11</b></code> · PH @100% = <b>11</b>.</p>
      <p>The Balls table shows the pair ball <code>CH 11</code>; the scorecard nets it off PH 11. Expect
        <b>Gross 85, Net 74</b> (85 − 11).</p>`,
    },
    {
        anchor: 'mixed-tee',
        signature: 'full_18|stroke_play:foursomes:100+stroke_play:individual:100',
        heading: 'mixed-tee-round — per-producer tee CHs + cross-tee team CH',
        tier: 'required',
        callout: `
      <p><strong>Required check — each producer's CH derives from their OWN tee, and the alt-shot team CH combines
        two different tees.</strong> Two men on Gul/M, two women on Röd/F (Balls table, WHS arithmetic column):</p>
      <ul>
        <li>Anders <code>idx 8 → Gul/M round(8×124/113 + (69.5−71)) = 7</code></li>
        <li>Björn <code>idx 14 → Gul/M = 14</code></li>
        <li>Carin <code>idx 18 → Röd/F round(18×121/113 + (70.9−71)) = 19</code></li>
        <li>Disa <code>idx 24 → Röd/F = 26</code></li>
      </ul>
      <p>Both foursomes pairs are mixed-tee; each team ball averages two DIFFERENT-tee CHs:
        <b>Anders &amp; Carin <code>round((7+19)/2)=13</code></b>, <b>Björn &amp; Disa <code>round((14+26)/2)=20</code></b>.
        <b>S#0 Foursomes</b>: Gross 75 / 91, Net 62 / 71 (75−13, 91−20). <b>S#1 Individual</b> surfaces the four own per-tee
        CHs (7 / 14 / 19 / 26) — Net 67 / 72 / 75 / 81.</p>`,
    },
    // --- regression spot-checks (inlined; no required re-audit) ----------------
    {
        anchor: 'scramble-4',
        signature: 'full_18|stroke_play:scramble:100',
        heading: 'scramble-4-by-rank-round — 4-player by-rank [25,20,15,10]',
        tier: 'regression',
        callout: `
      <p>Regression: ranked ascending CHs 4 / 12 / 18 / 25 →
        <code>round(25%×4 + 20%×12 + 15%×18 + 10%×25) = round(8.6) = 9</code> · PH @100% = 9.
        Expect Gross 67, Net 58.</p>`,
    },
    {
        anchor: 'scramble-2',
        signature: 'full_18|stroke_play:scramble:90',
        heading: 'scramble-2-by-rank-round — 2-player by-rank [35,15] @90%',
        tier: 'regression',
        callout: `
      <p>Regression: CHs 7 / 20 → <code>round(35%×7 + 15%×20) = round(5.45) = 5</code> · PH @90% = round(4.5) = 5.
        Expect Gross 79, Net 74. (90% allowance distinguishes this fixture's signature from the 4-player scramble.)</p>`,
    },
    {
        anchor: 'fourball-85',
        signature: 'full_18|stableford:better_ball:85',
        heading: 'fourball-85-round — better-ball Stableford at 85% allowance',
        tier: 'regression',
        callout: `
      <p>Regression: own ball per player, grouped 2v2, the better stableford ball counts. PH at 85% is visibly below CH —
        Bea <code>CH 5 → PH 4</code>, Cody <code>CH 14 → PH 12</code>, Dora <code>CH 9 → PH 8</code>,
        Egon <code>CH 18 → PH 15</code>. Expect Leaderboard Bea &amp; Cody 40, Dora &amp; Egon 34 (high wins).</p>`,

    },
];

registerBuiltInBallCreationStrategies();
registerBuiltInFormats();

const { dbPath } = await rebuildManualFormatDb(MANUAL_FORMAT_DB_PATH);
const db = createDb<Database>(dbPath);
const services = createServices(db);

try {
    const rounds = await services.roundService.list();
    const sections: string[] = [];
    const tocItems: string[] = [];

    let n = 0;
    for (const target of TARGETS) {
        n++;
        const tierBadge =
            target.tier === 'required'
                ? '<span class="badge req">required check</span>'
                : '<span class="badge reg">regression</span>';
        tocItems.push(`<li><a href="#${target.anchor}">${n} · ${esc(target.heading)}</a> ${tierBadge}</li>`);

        const round = rounds.find((r) => signature(r) === target.signature);
        if (!round) {
            sections.push(
                `<section class="verify-block" id="${target.anchor}"><h2>${n} · ${esc(target.heading)}</h2>` +
                    `<p class="missing">FIXTURE NOT FOUND for signature <code>${esc(target.signature)}</code></p></section>`,
            );
            continue;
        }
        const ctx = await collectRoundContext(services, round.id, dbPath);
        const body = bodyOf(renderRoundHtml(ctx));
        sections.push(`
<section class="verify-block ${target.tier}" id="${target.anchor}">
  <h2>${n} · ${esc(target.heading)} ${tierBadge}</h2>
  <div class="callout">${target.callout}</div>
  <div class="embedded">${body}</div>
</section>`);
    }

    const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Phase 2.6c — static verification</title>
<style>
${ROUND_CSS}
body { max-width: 1120px; margin: 1.5rem auto; padding: 0 1rem; }
.verify-block { border: 2px solid #cdd3db; border-radius: 10px; margin: 2rem 0; padding: 0 1.2rem 1.2rem; scroll-margin-top: 1rem; }
.verify-block > h2 { background: #1f2a44; color: #fff; margin: 0 -1.2rem 1rem; padding: .7rem 1.2rem; border-radius: 8px 8px 0 0; font-size: 1.05rem; }
.verify-block.required { border-color: #2a7; }
.verify-block.required > h2 { background: #1f5d3a; }
.callout { background: #f3f8f4; border-left: 4px solid #2a7; padding: .6rem 1rem; border-radius: 4px; margin-bottom: 1rem; }
.callout ul { margin: .3rem 0 .3rem; padding-left: 1.2rem; }
.callout li { margin: .2rem 0; }
.embedded { border-top: 1px dashed #cdd3db; padding-top: .8rem; }
.embedded h1 { font-size: 1.05rem; }
.embedded p > a[href="index.html"] { display: none; }
.missing { color: #b00; font-weight: 600; }
.muted { color: #667; }
.intro { background:#fff8e6; border:1px solid #e8d8a0; border-radius:8px; padding:.8rem 1rem; }
.toc { background:#f6f8fa; border:1px solid #e1e6ea; border-radius:8px; padding:.6rem 1rem; }
.toc ul { columns: 2; margin:.3rem 0 0; padding-left: 1.2rem; font-size: 13px; }
.toc li { margin:.2rem 0; break-inside: avoid; }
.badge { font-size: 11px; padding: 1px 6px; border-radius: 10px; vertical-align: middle; }
.badge.req { background:#1f5d3a; color:#fff; }
.badge.reg { background:#e6eaef; color:#445; }
</style>
</head>
<body>
<h1>Phase 2.6c · new ball-creation &amp; format coverage + kitchen-sink — static verification</h1>
<div class="intro">
  <p>2.6c adds the <code>greensomes_pair</code> (weighted), <code>scramble_team</code> (by-rank) and
  <code>modified_alt_shot_pair</code> ball-creation strategies, the <code>greensomes</code> and <code>scramble</code>
  formats, and a kitchen-sink round that drives seven slots off one event log. Below is the <strong>real rendered
  page</strong> for the riskiest new fixtures — the same output <code>bun run render:formats</code> produces — inlined
  so every total is checkable by eye.</p>
  <p class="muted">Focus on the three <strong>required checks</strong> (green-bordered): the kitchen-sink shared log +
  per-slot PH split, the greensomes weighted derivation, and the mixed-tee CH arithmetic. The scramble + 85% fixtures
  are optional regression spot-checks. Self-contained — no links to click. Regenerate with
  <code>bun scripts/render-slice-2.6c-verify.ts</code>.</p>
</div>
<div class="toc"><b>Contents</b><ul>${tocItems.join('')}</ul></div>
${sections.join('\n')}
</body>
</html>`;

    fs.mkdirSync(MANUAL_FORMAT_RENDER_DIR, { recursive: true });
    const outPath = path.join(MANUAL_FORMAT_RENDER_DIR, 'slice-2.6c-verify.html');
    fs.writeFileSync(outPath, page);
    // eslint-disable-next-line no-console
    console.log(`wrote ${outPath}`);
} finally {
    await db.destroy();
}
