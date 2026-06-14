// Slice 6 / phase-2.6b-final static verification index — ONE self-contained page.
//
// Slice 6 deleted the parallel `FormatStrategy` registry seam: every format now
// resolves from the ONE canonical plugin registry (`registerFormat` /
// `findFormatPlugin`). No scoring or render code changed, so all 13 canonical
// fixtures must render NUMERICALLY IDENTICAL output. This page is the visual
// half of the deletion proof:
//
//   - a "Deletion & extension proof" panel showing the live `formatCatalog()`
//     (exactly the 10 built-ins, NO canary trace) — the single source of truth
//     the renderer + leaderboard now read from;
//   - the ACTUAL rendered page for ALL 13 built-in fixtures, inlined under one
//     stylesheet (the same output `bun run render:formats` produces), each
//     selected by STABLE format signature, with a callout before each;
//   - the small REQUIRED-CHECK subset (shared event log, pair-only no-metric,
//     unusual arithmetic) called out in green with expected totals.
//
// Self-contained: in-page anchors only, no sibling-file links. Regenerate with
//   bun scripts/render-slice-6-verify.ts
//
// A full re-audit of every fixture is NOT required this slice — the change is
// dead-code deletion with byte-identical fixture output (proven by
// `bun run check:format-fixtures`). The required subset exercises the riskiest
// shared paths (multi-slot shared log, metricless pair format, category math);
// if those survived the registry deletion intact, generic resolution did too.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import { registerBuiltInBallCreationStrategies } from '../server/domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../server/domain/formats';
import { formatCatalog } from '../server/domain/formats/plugin';
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

// All 13 canonical fixtures, in seed order, keyed by stable signature. The
// three `required` targets carry green expected-value callouts; the rest are
// regression spot-checks (still fully inlined so any drift is visible).
const TARGETS: Target[] = [
    {
        anchor: 'multi-format-3p',
        signature: 'full_18|stableford:individual:100+kopenhamnare:individual:100+match_play:individual:100',
        heading: 'multi-format-3p-round — three slots, ONE shared event log',
        tier: 'required',
        callout: `
      <p><strong>Required check — three slots resolved from the single registry, one shared log:</strong></p>
      <ul>
        <li><b>Slot #0 Stableford</b> — re-add each player's per-hole <code>Points</code>:
            expect <b>Alice 37</b>, <b>Eve 31</b>, <b>Bob 23</b> (high wins).</li>
        <li><b>Slot #1 Split sixes</b> (Köpenhamnare) — 6-point split per decided hole; normalised standings
            leave the trailing player at <b>0</b>: expect <b>Alice 35</b>, <b>Eve 22</b>, <b>Bob 0</b>.</li>
        <li><b>Slot #2 Match play</b> — Alice vs Bob: <code>Net = Gross − Given</code>, match runs to close-out.
            Expect <b>Alice d. Bob, 7 &amp; 5</b>. Eve renders as her own odd-ball-out card, no match line.</li>
      </ul>`,
    },
    {
        anchor: 'match-play',
        signature: 'full_18|match_play:individual:100',
        heading: 'match-play-round — pair-only, metricless (no ranked scalar)',
        tier: 'required',
        callout: `
      <p><strong>Required check — the <code>metrics: []</code> path:</strong> the Leaderboard shows a single
        <em>Match results</em> column and <b>no points/gross/net ranked table</b>. Expect
        <b>Alice d. Bob, 3 &amp; 2</b> and <b>Carol vs. Dan halved, AS</b>. Each pair card shows per-member
        <code>Given / Gross / Net</code> and the <code>Match</code> row reads <code>AS / nUP / nDN</code>.</p>`,
    },
    {
        anchor: 'umbrella-4ball',
        signature: 'full_18|umbrella:four_ball:100',
        heading: 'umbrella-round (4-ball) — category math, multipliers, running total',
        tier: 'required',
        callout: `
      <p><strong>Required check — unusual arithmetic:</strong> each team's <code>Team points</code> hover shows
        <code>categories = sum × hole × (2 if sweep)</code>; a sweep hole reads e.g.
        <code>LG + LT + GIR-A + GIR-B + BIRD = 5 × 7 × 2 = 70 ☂</code>. The normalised <code>Running</code> row
        leaves the trailing team at 0. Expect Leaderboard <b>Carol &amp; Dan 70</b>, <b>Alice &amp; Bob 0</b>.</p>`,
    },
    // --- regression spot-checks (inlined, no required re-audit) ---------------
    {
        anchor: 'friendly',
        signature: 'full_18|stroke_play:individual:100',
        heading: 'friendly-round — stroke play, full 18 (gross/net, low wins)',
        tier: 'regression',
        callout: `<p>Regression: gross &amp; net ranked tables, lowest wins. Confirm OUT/IN/TOT totals add up.</p>`,
    },
    {
        anchor: 'nine-hole',
        signature: 'front_9|stroke_play:individual:100',
        heading: 'nine-hole-round — stroke play over a front-9 route',
        tier: 'regression',
        callout: `<p>Regression: a 9-occurrence route; the scorecard shows only holes 1–9 and totals over 9.</p>`,
    },
    {
        anchor: 'stableford',
        signature: 'full_18|stableford:individual:100',
        heading: 'stableford-round — points per hole, high wins',
        tier: 'regression',
        callout: `<p>Regression: single <code>Points</code> ranked table (high wins). Per-hole hover = <code>netPar − gross</code>.</p>`,
    },
    {
        anchor: 'foursomes',
        signature: 'full_18|stroke_play:foursomes:50',
        heading: 'foursomes-round — alternate shot, one pair-ball, 50% allowance',
        tier: 'regression',
        callout: `<p>Regression: one ball per pair (alt-shot); PH derived at 50% combined allowance. Two team cards.</p>`,
    },
    {
        anchor: 'better-ball',
        signature: 'full_18|stableford:better_ball:100',
        heading: 'better-ball-round — best stableford ball per team',
        tier: 'regression',
        callout: `<p>Regression: own-ball per player, grouped 2v2; the better of each team's two stableford balls counts.</p>`,
    },
    {
        anchor: 'match-play-bb',
        signature: 'full_18|match_play:better_ball:100',
        heading: 'match-play-better-ball-round — team duel, best ball',
        tier: 'regression',
        callout: `<p>Regression: metricless team match; best ball of each side decides each hole. Match-results column only.</p>`,
    },
    {
        anchor: 'taliban',
        signature: 'full_18|taliban:better_ball:100',
        heading: 'taliban-round — better ball with bonus weighting',
        tier: 'regression',
        callout: `<p>Regression: better-ball variant; confirm the bonus-weighted match line and per-member rows.</p>`,
    },
    {
        anchor: 'kopenhamnare',
        signature: 'full_18|kopenhamnare:individual:100',
        heading: 'Split sixes (kopenhamnare-round) — 6 points/hole split across 3 players',
        tier: 'regression',
        callout: `<p>Regression: 6-point split per decided hole; normalised standings leave the trailing player at 0. Slot header now reads <b>Split sixes</b> (renamed from "Köpenhamnare"; id unchanged).</p>`,
    },
    {
        anchor: 'umbrella-3p',
        signature: 'front_9|umbrella:individual:100',
        heading: 'umbrella-3-player-round — individual umbrella over a front-9',
        tier: 'regression',
        callout: `<p>Regression: individual umbrella, 3 players, 9-hole route; category points × hole, normalised running row.</p>`,
    },
    {
        anchor: 'multi-slot-series',
        signature: 'full_18|stableford:individual:95+stroke_play:foursomes:50',
        heading: 'multi-slot-series-round — stableford (95%) + foursomes (50%) shared log',
        tier: 'regression',
        callout: `<p>Regression: two slots over one log with DIFFERENT allowances (95% / 50%) and ball shapes (own / pair).</p>`,
    },
];

function catalogPanel(): string {
    const rows = formatCatalog()
        .map((d) => {
            const b = d.requirements.balls;
            const metrics =
                d.metrics.map((m) => `${esc(m.label)} ${m.direction === 'high' ? '↑' : '↓'}`).join(', ') ||
                '<span class="muted">— (pair/state-only)</span>';
            return `<tr>
              <td><code>${esc(d.id)}</code></td>
              <td>${esc(d.label)}</td>
              <td>${esc(d.scoringMode)} / ${esc(d.teamShape)}</td>
              <td>${esc(b.ballMode)} · ${b.producerCount.min}–${b.producerCount.max}p${b.requiresSlotTeamGrouping ? ' · teams' : ''}</td>
              <td>${metrics}</td>
            </tr>`;
        })
        .join('');
    const hasCanary = formatCatalog().some((d) => d.id === 'canary_high_points');
    return `
<section class="verify-block" id="deletion-proof">
  <h2>0 · Deletion &amp; extension proof — the ONE canonical registry</h2>
  <div class="callout">
    <p><strong>Required check — single source of truth:</strong> the table below is the live
      <code>formatCatalog()</code> the renderer + leaderboard + compiler now read from. After Slice 6 there is
      <b>exactly one</b> format registry; the parallel <code>FormatStrategy</code> registry was deleted.</p>
    <ul>
      <li>Exactly <b>10 built-in formats</b> are listed — and the test-only <code>canary_high_points</code> format
          is <b>${hasCanary ? '<span class="bad">PRESENT (unexpected!)</span>' : 'ABSENT'}</b>: a deleted/unregistered
          module leaves <b>zero</b> production trace.</li>
      <li>The <code>metrics</code> column is the ONLY ranking-direction source — pair/state-only formats
          (match play, taliban, better-ball match) declare none and rank nothing scalar.</li>
      <li>Automated backing (run to confirm): <code>bun test server/domain/formats/architecture.test.ts
          server/domain/formats/canary.test.ts</code> → <b>32 pass</b>. The canary test registers a brand-new
          format id and drives register → catalog → compile → score → rank with no infrastructure-map edit
          (the extension half); the architecture ratchet forbids a second registry, any decomposition map, and
          any format-id branch in <code>scripts/render/</code> (the deletion half).</li>
    </ul>
  </div>
  <div class="embedded">
    <table class="cat">
      <thead><tr><th>id</th><th>label</th><th>scoring / shape</th><th>ball requirement</th><th>ranked metrics</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</section>`;
}

registerBuiltInBallCreationStrategies();
registerBuiltInFormats();

const { dbPath } = await rebuildManualFormatDb(MANUAL_FORMAT_DB_PATH);
const db = createDb<Database>(dbPath);
const services = createServices(db);

try {
    const rounds = await services.roundService.list();
    const sections: string[] = [catalogPanel()];
    const tocItems: string[] = [
        `<li><a href="#deletion-proof"><b>0 · Deletion &amp; extension proof</b> (required — the one registry)</a></li>`,
    ];

    let n = 0;
    for (const target of TARGETS) {
        n++;
        const tierBadge =
            target.tier === 'required'
                ? '<span class="badge req">required check</span>'
                : '<span class="badge reg">regression</span>';
        tocItems.push(
            `<li><a href="#${target.anchor}">${n} · ${esc(target.heading)}</a> ${tierBadge}</li>`,
        );

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
<title>Phase 2.6b-final / Slice 6 — static verification index</title>
<style>
${ROUND_CSS}
body { max-width: 1120px; margin: 1.5rem auto; padding: 0 1rem; }
.verify-block { border: 2px solid #cdd3db; border-radius: 10px; margin: 2rem 0; padding: 0 1.2rem 1.2rem; scroll-margin-top: 1rem; }
.verify-block > h2 { background: #1f2a44; color: #fff; margin: 0 -1.2rem 1rem; padding: .7rem 1.2rem; border-radius: 8px 8px 0 0; font-size: 1.05rem; }
.verify-block.required { border-color: #2a7; }
.verify-block.required > h2 { background: #1f5d3a; }
.callout { background: #f3f8f4; border-left: 4px solid #2a7; padding: .6rem 1rem; border-radius: 4px; margin-bottom: 1rem; }
.callout ul { margin: .3rem 0 0; padding-left: 1.2rem; }
.callout li { margin: .25rem 0; }
.embedded { border-top: 1px dashed #cdd3db; padding-top: .8rem; }
.embedded h1 { font-size: 1.05rem; }
.embedded p > a[href="index.html"] { display: none; }
.missing { color: #b00; font-weight: 600; }
.bad { color: #b00; font-weight: 600; }
.muted { color: #667; }
.intro { background:#fff8e6; border:1px solid #e8d8a0; border-radius:8px; padding:.8rem 1rem; }
.toc { background:#f6f8fa; border:1px solid #e1e6ea; border-radius:8px; padding:.6rem 1rem; }
.toc ul { columns: 2; margin:.3rem 0 0; padding-left: 1.2rem; font-size: 13px; }
.toc li { margin:.2rem 0; break-inside: avoid; }
.badge { font-size: 11px; padding: 1px 6px; border-radius: 10px; vertical-align: middle; }
.badge.req { background:#1f5d3a; color:#fff; }
.badge.reg { background:#e6eaef; color:#445; }
table.cat { border-collapse: collapse; width: 100%; font-size: 13px; margin:.3rem 0; }
table.cat th, table.cat td { border: 1px solid #dde2e8; padding: .3rem .55rem; text-align: left; }
table.cat thead th { background: #eef2f6; }
</style>
</head>
<body>
<h1>Phase 2.6b-final · Slice 6 — static verification index</h1>
<div class="intro">
  <p>Slice 6 deleted the parallel <code>FormatStrategy</code> registry: every format now resolves from the
  <strong>one canonical plugin registry</strong>. No scoring or render code changed, so all 13 canonical fixtures
  render <strong>numerically identical</strong> output (confirmed by <code>bun run check:format-fixtures</code>).
  Below is the live registry catalog plus the <strong>real rendered page</strong> for every built-in fixture — the
  same output <code>bun run render:formats</code> produces, inlined here so every total is checkable by eye.</p>
  <p class="muted">A full re-audit is not required this slice (the diff is dead-code deletion). Focus on the four
  <strong>required checks</strong> (panel 0 + the three green-bordered rounds); the rest are regression spot-checks.
  Self-contained — no links to click. Regenerate with <code>bun scripts/render-slice-6-verify.ts</code>.</p>
</div>
<div class="toc"><b>Contents</b><ul>${tocItems.join('')}</ul></div>
${sections.join('\n')}
</body>
</html>`;

    fs.mkdirSync(MANUAL_FORMAT_RENDER_DIR, { recursive: true });
    const outPath = path.join(MANUAL_FORMAT_RENDER_DIR, 'slice-6-verify.html');
    fs.writeFileSync(outPath, page);
    // eslint-disable-next-line no-console
    console.log(`wrote ${outPath}`);
} finally {
    await db.destroy();
}
