// Phase 2.6d static verification — ONE self-contained page.
//
// 2.6d adds typed corrections (setup / allowance / ruling), the stateful
// format-action seam, the soft-delete read path, and the player dashboard. This
// page inlines the ACTUAL rendered output (the same render pipeline `bun run
// render:formats` uses) for each new fixture, plus an inline AUDIT block per
// round (correction / ruling / format-action event tables + the
// round_definitions version chain) so every change is checkable by eye.
//
// Self-contained: in-page anchors only, no sibling-file links. Regenerate with
//   bun scripts/render-slice-2.6d-verify.ts
//
// Required checks (green-bordered): (1) the route/SI correction audit, (2) the
// stateful action replay/supersession, (3) one deleted-player historical
// scorecard. Everything else is inlined as an optional regression spot-check.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import { ROUND_CSS } from './render/css';
import { collectRoundContext, renderRoundHtml } from './render-lib';
import { rebuild2_6dDb, RENDER_DIR_2_6D } from './fixtures-2.6d';
import { DASHBOARD_USERNAME } from './seeds/player-dashboard-listing';
import type { Round } from '../server/services/round.service';

function esc(s: unknown): string {
    return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
}

function bodyOf(html: string): string {
    const m = /<body>([\s\S]*)<\/body>/.exec(html);
    return m ? m[1] : html;
}

type Tier = 'required' | 'regression';

interface Target {
    anchor: string;
    /** Unique `playedAt` date of the seed's round. */
    date: string;
    heading: string;
    tier: Tier;
    callout: string;
    /** Which audit tables to render under the scorecard. */
    audit: { setup?: boolean; allowance?: boolean; ruling?: boolean; actions?: boolean; versions?: boolean };
}

const TARGETS: Target[] = [
    {
        anchor: 'route-correction',
        date: '2026-06-05',
        heading: 'route-correction-round — occurrence SI + group-start corrections (REQUIRED)',
        tier: 'required',
        callout: `
      <p><strong>Required check #1 — route-shaped setup corrections, append-only + audited.</strong>
        A custom 10-hole itinerary plays holes 1–9 then REVISITS hole 1 as a 10th occurrence
        (<code>3 (1st)</code> / <code>3 (2nd)</code>-style labels in the grid). Two corrections landed:</p>
      <ul>
        <li><b>play_hole</b> — the revisit's stroke index was entered as <code>10</code>; corrected to <code>12</code>.
            The occurrence keeps its STABLE play-hole identity, so the score events already entered against it stay valid
            (see the unchanged Events log); only the stroke allocation changes.</li>
        <li><b>playing_group</b> — the group's start moved from the 1st to the 2nd occurrence.</li>
      </ul>
      <p>Both produce new <code>round_definitions</code> versions (see the version chain + audit below).
        Final stableford: <b>Oda 28, Per 23</b> (Oda CH 14, Per CH 8).</p>`,
        audit: { setup: true, versions: true },
    },
    {
        anchor: 'stateful-canary',
        date: '2026-06-07',
        heading: 'stateful-canary-round — format-action persist → replay → supersede (REQUIRED)',
        tier: 'required',
        callout: `
      <p><strong>Required check #2 — the stateful format-action seam, no infrastructure edits.</strong>
        A test-only <code>stateful_canary</code> format declares its own action types; the ONE generic
        <code>format_action_events</code> endpoint persisted 8 actions (see the action history below).</p>
      <ul>
        <li><b>Hole 1</b> — captain Kim, partner first chosen as Lo, then <b>SUPERSEDED to Mai</b>, call <code>low</code>.
            Side Kim 4 + Mai 3 = 7 ≤ 8 → correct → <b>Kim +1, Mai +1</b>. (Without the supersession the side would be
            Kim 4 + Lo 5 = 9 &gt; 8 → wrong — so the +1 only appears because replay honours the supersede.)</li>
        <li><b>Hole 2</b> — captain Lo, partner Mai, ordered call <code>low</code> then <code>high</code>; the LAST call
            (by sequence) binds → side 4 + 4 = 8 ≤ 8 but called high → wrong → 0.</li>
      </ul>
      <p>Resulting points (high wins): <b>Kim 1, Mai 1, Lo 0</b>.</p>`,
        audit: { actions: true },
    },
    {
        anchor: 'soft-deleted',
        date: '2026-06-06',
        heading: 'soft-deleted-player-round — historical scorecard by snapshot (REQUIRED)',
        tier: 'required',
        callout: `
      <p><strong>Required check #3 — a soft-deleted producer still renders by played-as name.</strong>
        Ivy soft-deleted her account AFTER this round. The scorecard below renders her from
        <code>ball_players.display_name_snapshot</code> — it reads <b>“Ivy”</b>, never “Deleted player”. She drops out
        of dashboards/active lists (see the dashboard section: only Nia's rounds appear), while Jon is unaffected.</p>
      <p>Stableford: <b>Ivy 52</b> (CH 16), <b>Jon 29</b> (CH 11).</p>`,
        audit: {},
    },
    {
        anchor: 'setup-correction',
        date: '2026-06-01',
        heading: 'setup-correction-round — producer tee correction recompiles CH',
        tier: 'regression',
        callout: `
      <p>Regression: Ada was checked in on <b>Gul</b> (CH 20 = round(18×120/113 + 1)) then corrected to <b>Röd</b>
        (CH 21 = round(18×124/113 + 1)). The setup correction mutates the definition input and recompiles a new version;
        the scorecard below shows the POST-correction CH 21 / PH 21, and the audit shows the old→new tee with reason.
        Ben (CH 9) is untouched. Final stableford <b>Ada 45, Ben 39</b>.</p>`,
        audit: { setup: true, versions: true },
    },
    {
        anchor: 'allowance-override',
        date: '2026-06-02',
        heading: 'allowance-override-round — slot allowance 95% → 90%',
        tier: 'regression',
        callout: `
      <p>Regression: the slot allowance changed from 95% to 90% after entry. Ball CH is untouched; only the per-slot PH
        re-derives — <b>Cleo CH 16 → PH 14</b> (round(16×0.9)), <b>Dan CH 8 → PH 7</b>. The audit shows the override + the
        new <code>round_definitions</code> version with <code>source_kind='allowance_override'</code>. Stableford
        <b>Cleo 43, Dan 32</b>.</p>`,
        audit: { allowance: true, versions: true },
    },
    {
        anchor: 'override-then-correction',
        date: '2026-06-03',
        heading: 'allowance-override-then-setup-correction-round — override preserved through recompile',
        tier: 'regression',
        callout: `
      <p>Regression — single-source reconciliation: a 90% allowance override landed FIRST, then a tee correction moved Eve
        Gul→Röd (a full recompile). The final PH reflects <b>both</b>: Eve's corrected CH 23 (off Röd) AND the 90%
        allowance → <b>PH 21</b> (round(23×0.9)). The override survived because it lives in the definition chain, not a
        separate overlay. Stableford <b>Eve 45, Finn 39</b> (Finn CH 10 → PH 9).</p>`,
        audit: { setup: true, allowance: true, versions: true },
    },
    {
        anchor: 'ruling-applied',
        date: '2026-06-04',
        heading: 'ruling-applied-round — +2 penalty strokes at the scoring layer',
        tier: 'regression',
        callout: `
      <p>Regression: a <code>ruling_event</code> adds +2 penalty strokes to Gus's TOTAL after play. NO re-derivation — the
        per-hole grid keeps the <b>raw</b> strokes (18×5 = 90), and the leaderboard total carries the penalty:
        <b>Gus Gross 92</b> (90 + 2), <b>Net 80</b>. Hal is untouched (Gross 72, Net 66). The audit shows the ruling kind,
        value and reason.</p>`,
        audit: { ruling: true },
    },
];

// --- Audit rendering (inline; reads the new 2.6d event tables) ---------------

type Svc = ReturnType<typeof createServices>;

async function renderAudit(svc: Svc, round: Round, audit: Target['audit']): Promise<string> {
    const parts: string[] = [];

    if (audit.versions) {
        const defs = await svc.db
            .selectFrom('round_definitions')
            .where('round_id', '=', round.id)
            .select(['version', 'source_kind', 'source_event_id', 'superseded_by_version'])
            .orderBy('version')
            .execute();
        parts.push(
            `<p><b>round_definitions version chain:</b> ` +
                defs
                    .map(
                        (d) =>
                            `v${d.version} <code>${esc(d.source_kind)}</code>` +
                            (d.superseded_by_version ? ` → superseded by v${d.superseded_by_version}` : ' <b>(current)</b>'),
                    )
                    .join(' · ') +
                `</p>`,
        );
    }

    if (audit.setup) {
        const rows = await svc.db
            .selectFrom('setup_correction_events')
            .where('round_id', '=', round.id)
            .select(['target', 'target_ref', 'old_value', 'new_value', 'reason', 'result_version'])
            .orderBy('recorded_at')
            .execute();
        if (rows.length) {
            parts.push(
                auditTable('Setup corrections (append-only)', ['target', 'target_ref', 'old → new', 'reason', '→ version'],
                    rows.map((r) => [
                        esc(r.target),
                        `<code>${esc(r.target_ref)}</code>`,
                        `<code>${esc(r.old_value ?? '∅')}</code> → <code>${esc(r.new_value)}</code>`,
                        esc(r.reason),
                        `v${esc(r.result_version)}`,
                    ])),
            );
        }
    }

    if (audit.allowance) {
        const rows = await svc.db
            .selectFrom('allowance_override_events')
            .where('round_id', '=', round.id)
            .select(['slot_def_id', 'old_config', 'new_config', 'reason', 'result_version'])
            .orderBy('recorded_at')
            .execute();
        if (rows.length) {
            parts.push(
                auditTable('Allowance overrides (append-only)', ['slot', 'old → new', 'reason', '→ version'],
                    rows.map((r) => [
                        `<code>${esc(r.slot_def_id)}</code>`,
                        `<code>${esc(r.old_config)}</code> → <code>${esc(r.new_config)}</code>`,
                        esc(r.reason),
                        `v${esc(r.result_version)}`,
                    ])),
            );
        }
    }

    if (audit.ruling) {
        const rows = await svc.db
            .selectFrom('ruling_events')
            .where('round_id', '=', round.id)
            .select(['target', 'target_id', 'ruling_kind', 'value', 'reason'])
            .orderBy('recorded_at')
            .execute();
        if (rows.length) {
            parts.push(
                auditTable('Rulings (scoring-layer adjustment, no re-derivation)', ['kind', 'target', 'value', 'reason'],
                    rows.map((r) => [
                        `<code>${esc(r.ruling_kind)}</code>`,
                        `${esc(r.target)} <code>${esc(r.target_id.slice(0, 12))}…</code>`,
                        `<code>${esc(r.value)}</code>`,
                        esc(r.reason),
                    ])),
            );
        }
    }

    if (audit.actions) {
        const rows = await svc.db
            .selectFrom('format_action_events')
            .where('round_id', '=', round.id)
            .select(['play_hole_id', 'sequence', 'action_type', 'payload', 'supersedes_action_id', 'id'])
            .orderBy('recorded_at')
            .execute();
        const supersededIds = new Set(rows.map((r) => r.supersedes_action_id).filter(Boolean) as string[]);
        // Map play_hole_id → occurrence label for readability.
        const phLabel = new Map(round.playHoles.map((p, i) => [p.id, `occ ${i + 1} (hole ${p.courseHoleNumber})`]));
        if (rows.length) {
            parts.push(
                auditTable('Format-action history (append-only; replay drops superseded rows)',
                    ['occurrence', 'seq', 'action', 'payload', 'status'],
                    rows.map((r) => [
                        esc(r.play_hole_id ? (phLabel.get(r.play_hole_id) ?? r.play_hole_id.slice(0, 8)) : '—'),
                        esc(r.sequence),
                        `<code>${esc(r.action_type)}</code>`,
                        `<code>${esc(r.payload)}</code>`,
                        r.supersedes_action_id
                            ? '<b>supersedes a prior choice</b>'
                            : supersededIds.has(r.id)
                              ? '<span class="muted">superseded ✕ (dropped on replay)</span>'
                              : 'live',
                    ])),
            );
        }
    }

    if (parts.length === 0) return '';
    return `<div class="audit"><h3>Append-only audit</h3>${parts.join('\n')}</div>`;
}

function auditTable(title: string, headers: string[], rows: string[][]): string {
    return (
        `<p class="audit-title">${esc(title)}</p>` +
        `<table class="audit-table"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>` +
        `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
    );
}

async function renderDashboard(svc: Svc): Promise<string> {
    const nia = (await svc.playerService.list()).find((p) => p.username === DASHBOARD_USERNAME);
    if (!nia) return '<p class="missing">dashboard player not found</p>';
    const entries = await svc.dashboardService.forPlayer(nia.id);
    const rows = entries
        .flatMap((e) =>
            e.slots.map(
                (sl) =>
                    `<tr><td>${esc(e.round.date)}</td><td>${esc(sl.formatLabel)}</td>` +
                    `<td>${esc(sl.teamLabel ?? '—')}</td><td>${esc(sl.playingHandicap)}</td>` +
                    `<td>${sl.position === null ? '—' : esc(sl.position)}</td>` +
                    `<td>${sl.total === null ? '—' : `${esc(sl.total)} ${esc(sl.metricLabel ?? '')}`}</td></tr>`,
            ),
        )
        .join('');
    return `
<section class="verify-block required" id="dashboard">
  <h2>0 · player-dashboard-listing — Nia's round history (own-ball + team-ball) <span class="badge req">required check</span></h2>
  <div class="callout">
    <p><strong>Player dashboard — joined via <code>ball_players.player_id</code>.</strong> Nia appears in BOTH an own-ball
      stableford and a shared alt-shot team ball; each row shows the per-slot PH and finishing position. Soft-deleted
      players (Ivy, above) never appear here.</p>
  </div>
  <table class="audit-table">
    <thead><tr><th>Date</th><th>Format</th><th>Team</th><th>PH</th><th>Pos</th><th>Result</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</section>`;
}

// --- Build the page ----------------------------------------------------------

const { dbPath } = await rebuild2_6dDb();
const db = createDb<Database>(dbPath);
const services = createServices(db);

try {
    const rounds = await services.roundService.list();
    const sections: string[] = [];
    const tocItems: string[] = [];

    // Dashboard first (anchor 0).
    sections.push(await renderDashboard(services));
    tocItems.push(`<li><a href="#dashboard">0 · player-dashboard-listing</a> <span class="badge req">required</span></li>`);

    let n = 0;
    for (const target of TARGETS) {
        n++;
        const tierBadge =
            target.tier === 'required'
                ? '<span class="badge req">required check</span>'
                : '<span class="badge reg">regression</span>';
        tocItems.push(`<li><a href="#${target.anchor}">${n} · ${esc(target.heading)}</a> ${tierBadge}</li>`);

        const round = rounds.find((r) => r.date === target.date);
        if (!round) {
            sections.push(
                `<section class="verify-block" id="${target.anchor}"><h2>${n} · ${esc(target.heading)}</h2>` +
                    `<p class="missing">FIXTURE NOT FOUND for date ${esc(target.date)}</p></section>`,
            );
            continue;
        }
        const ctx = await collectRoundContext(services, round.id, dbPath);
        const body = bodyOf(renderRoundHtml(ctx));
        const audit = await renderAudit(services, round, target.audit);
        sections.push(`
<section class="verify-block ${target.tier}" id="${target.anchor}">
  <h2>${n} · ${esc(target.heading)} ${tierBadge}</h2>
  <div class="callout">${target.callout}</div>
  ${audit}
  <div class="embedded">${body}</div>
</section>`);
    }

    const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Phase 2.6d — static verification</title>
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
.audit { background: #fbf7ef; border: 1px solid #e8d8a0; border-radius: 6px; padding: .6rem 1rem; margin-bottom: 1rem; }
.audit h3 { margin: .2rem 0 .5rem; font-size: .95rem; }
.audit-title { font-weight: 600; margin: .6rem 0 .2rem; }
.audit-table { border-collapse: collapse; width: 100%; font-size: 12px; margin-bottom: .4rem; }
.audit-table th, .audit-table td { border: 1px solid #ddd; padding: 3px 6px; text-align: left; vertical-align: top; }
.audit-table th { background: #f0ece3; }
.embedded { border-top: 1px dashed #cdd3db; padding-top: .8rem; }
.embedded h1 { font-size: 1.05rem; }
.embedded p > a[href="index.html"] { display: none; }
.missing { color: #b00; font-weight: 600; }
.muted { color: #889; }
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
<h1>Phase 2.6d · typed corrections + format actions + soft-delete + dashboard — static verification</h1>
<div class="intro">
  <p>2.6d adds three TYPED correction events (setup / allowance / ruling), the stateful format-action seam (a generic
  append-only event log replayed into scoring), the soft-delete read path, and the player dashboard. Below is the
  <strong>real rendered page</strong> for each new fixture — the same output the render pipeline produces — each with an
  inline <strong>append-only audit</strong> (correction / ruling / action tables + the <code>round_definitions</code>
  version chain) so every change is checkable by eye.</p>
  <p class="muted">Focus on the three <strong>required checks</strong> (green): the route/SI correction audit, the
  stateful action replay/supersession, and the deleted-player historical scorecard. Self-contained — no links to click.
  Regenerate with <code>bun scripts/render-slice-2.6d-verify.ts</code>.</p>
</div>
<div class="toc"><b>Contents</b><ul>${tocItems.join('')}</ul></div>
${sections.join('\n')}
</body>
</html>`;

    fs.mkdirSync(RENDER_DIR_2_6D, { recursive: true });
    const outPath = path.join(RENDER_DIR_2_6D, 'slice-2.6d-verify.html');
    fs.writeFileSync(outPath, page);
    // eslint-disable-next-line no-console
    console.log(`wrote ${outPath}`);
} finally {
    await db.destroy();
}
