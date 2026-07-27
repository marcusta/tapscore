// Generic result renderer — Phase 2.6b-final / Slice 2b, N3 adapter.
//
// Lays out the serializable sections on `ctx.roundResult` with ZERO format
// knowledge. Since N3 all the LAYOUT decisions — route-section column grouping,
// subtotals, the TOT column, cell decorations, pace values — come from the
// shared fold `src/round/result-layout.ts`, the same tree the product renderer
// (`src/round/result-render.ts`) and the native client walk. This file only
// turns that tree into the verification page's markup, which deliberately
// differs from the product one: ONE wide table per card with a TOT column,
// verification-mode subtitle facts, plain class names.
//
// Importing from `src/` is the allowed direction (`src/` must never import
// `server/`); `tsconfig.server.json` covers `scripts` and type-checks it.

import type {
    RankedSection,
    RouteSectionRef,
    ScoreGridSection,
    MatchSummarySection,
} from '../../../server/domain/strategies/result-sections';
import type { RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import { esc } from '../util';
import {
    layoutMatchSummary,
    layoutRanked,
    layoutScoreGrid,
    scoreGridComponentId,
} from '../../../src/round/result-layout';
import type { CellLayout, GridRowLayout, ScoreGridLayout } from '../../../src/round/result-layout';

function rowClass(row: GridRowLayout): string {
    if (row.kind === 'si' || row.kind === 'given') return 'dim';
    return '';
}
function cellClass(row: GridRowLayout): string {
    if (row.kind === 'si') return 'si';
    if (row.kind === 'given') return 'given';
    if (row.kind === 'status') return 'status';
    if (row.kind === 'category') return 'category';
    return '';
}

/**
 * One grid cell. A per-cell team (standing row, deciding ball): an undecorated
 * score gets the filled pill; a decorated one gets the team fill on the
 * marker's own shape — the fold made that choice, this only names the classes.
 */
function cellHtml(cell: CellLayout, row: GridRowLayout, emph: (s: string) => string): string {
    const title = cell.title !== null ? ` title="${esc(cell.title)}"` : '';
    const text = emph(esc(cell.text));
    const d = cell.decoration;
    let inner: string;
    if (d.kind === 'marker') {
        const tone = d.tone ? ` mark-tone--${d.tone}` : '';
        const fill = d.teamFill ? ` mark-fill--${d.teamFill}` : '';
        const attrs = d.label !== null ? ` title="${esc(d.label)}" aria-label="${esc(d.label)}"` : '';
        inner = `<span class="mark mark--${esc(d.template)}${tone}${fill}"${attrs}>${text}</span>`;
    } else if (d.kind === 'pill') {
        inner = `<span class="pill pill--${d.team}">${text}</span>`;
    } else {
        inner = text;
    }
    return `<td class="${cellClass(row)}"${title}>${inner}</td>`;
}

function renderGridLayout(layout: ScoreGridLayout, cardModifier?: string): string {
    const includeTot = layout.hasTotalColumn;

    const headerCells = layout.columnGroups
        .map(
            (g) =>
                g.columns.map((c) => `<th>${esc(c.label)}</th>`).join('') +
                `<th class="sum">${esc(g.label)}</th>`,
        )
        .join('');
    const holeHeader = `
<tr>
  <th class="rowlabel">Hole</th>
  ${headerCells}
  ${includeTot ? '<th class="sum">TOT</th>' : ''}
</tr>`;

    const renderRow = (row: GridRowLayout): string => {
        const emph = (s: string): string => (row.emphasis ? `<strong>${s}</strong>` : s);
        const groupCells = row.groups
            .map(
                (g) =>
                    g.cells.map((cell) => cellHtml(cell, row, emph)).join('') +
                    `<td class="sum">${emph(g.subtotal)}</td>`,
            )
            .join('');
        const tot = includeTot ? `<td class="sum">${emph(row.total)}</td>` : '';
        const label = row.subjectName !== null ? `${esc(row.subjectName)} ${esc(row.labelText)}` : esc(row.labelText);
        return `
<tr class="${rowClass(row)}">
  <th class="rowlabel">${label}</th>
  ${groupCells}
  ${tot}
</tr>`;
    };

    const title = layout.title.groups
        .map((g) => g.map((name) => esc(name)).join(layout.title.nameJoiner))
        .join(layout.title.joiner);

    const footnotes =
        layout.footnotes.length > 0
            ? `<p class="arithmetic">${layout.footnotes.map(esc).join(' · ')}</p>`
            : '';
    const totals =
        layout.totals.length > 0
            ? `<ul class="totals">${layout.totals
                  .map((t) => `<li>${esc(t.label)} = <strong>${t.value}</strong></li>`)
                  .join('')}</ul>`
            : '';

    const cardClass = cardModifier ? `scorecard-card ${cardModifier}` : 'scorecard-card';
    return `
<article class="${cardClass}">
  <header>
    <h3>${title}</h3>
    <span class="muted">${layout.subtitleFacts.map(esc).join(' · ')}</span>
  </header>
  <table class="scorecard">
    <thead>${holeHeader}</thead>
    <tbody>${layout.rows.map(renderRow).join('')}</tbody>
  </table>
  ${footnotes}
  ${totals}
</article>`;
}

/** The oracle is the verification view — it shows every fact the server sent. */
function renderScoreGrid(
    section: ScoreGridSection,
    routeSections: RouteSectionRef[],
    nameOf: (id: string) => string,
    cardModifier?: string,
): string {
    return renderGridLayout(layoutScoreGrid(section, routeSections, nameOf, { mode: 'verification' }), cardModifier);
}

type ScoreGridComponentId = NonNullable<ScoreGridSection['componentId']>;
type ScoreGridRenderer = (
    section: ScoreGridSection,
    routeSections: RouteSectionRef[],
    nameOf: (id: string) => string,
) => string;

const scoreGridRegistry: Record<ScoreGridComponentId, ScoreGridRenderer> = {
    'default-score-grid': renderScoreGrid,
    'compact-match-grid': (section, routeSections, nameOf) =>
        renderScoreGrid(section, routeSections, nameOf, 'scorecard-card--compact-match'),
    'category-matrix-grid': (section, routeSections, nameOf) =>
        renderScoreGrid(section, routeSections, nameOf, 'scorecard-card--category-matrix'),
};

function renderScoreGridSection(
    section: ScoreGridSection,
    routeSections: RouteSectionRef[],
    nameOf: (id: string) => string,
): string {
    const componentId = scoreGridComponentId(section);
    const renderer = (scoreGridRegistry as Record<string, ScoreGridRenderer | undefined>)[componentId];
    return renderer
        ? renderer(section, routeSections, nameOf)
        : `<div class="diag">Unsupported score-grid component <code>${esc(componentId)}</code> — no generic view yet. Results are not hidden.</div>`;
}

function renderRanked(section: RankedSection, nameOf: (id: string) => string): string {
    const layout = layoutRanked(section, nameOf);
    // Compact live-board pace chip — absent when the metric declares no pace;
    // its value and golf sign convention come from the fold.
    const rows = layout.entries
        .map((e) => {
            const chip = e.pace ? ` <span class="lb-pace">${esc(e.pace.text)}</span>` : '';
            return `
<tr>
  <td class="num">${e.position}</td>
  <td>${esc(e.name)}</td>
  <td class="num">${e.total}${chip}</td>
  <td class="num muted">${e.holesPlayed}</td>
</tr>`;
        })
        .join('');
    return `
<div class="lb-col">
  <h4>${esc(layout.metricLabel)}</h4>
  <table class="grid">
    <thead><tr><th>pos</th><th>ball</th><th>total</th><th>holes</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

function renderMatchSummary(section: MatchSummarySection, nameOf: (id: string) => string): string {
    const layout = layoutMatchSummary(section, nameOf);
    const rows = layout.matches
        .map((m) => {
            const a = esc(m.sideAName);
            const b = esc(m.sideBName);
            // One idiom line per match: the verification page names the leader
            // instead of drawing the product renderer's two-sided panel.
            const lead = m.leader === 'a' ? a : m.leader === 'b' ? b : `${a} / ${b}`;
            return `<tr><td>${lead} — ${esc(m.standing)} (${esc(m.status)})</td></tr>`;
        })
        .join('');
    return `
<div class="lb-col" style="min-width: 420px;">
  <h4>${esc(layout.title)}</h4>
  <table class="grid">
    <thead><tr><th>result</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

/**
 * Per-slot name resolver: an aggregated side's VIRTUAL subject id (ADR-0004)
 * names no persisted ball — the slot's `subjectLabels` carries its display
 * label (the side's team label). Prefer that; fall back to ball metadata.
 */
function slotNameOf(
    slot: { subjectLabels?: { ballId: string; label: string }[] },
    ballNameById: (id: string) => string,
): (id: string) => string {
    if (!slot.subjectLabels || slot.subjectLabels.length === 0) return ballNameById;
    const byId = new Map(slot.subjectLabels.map((s) => [s.ballId, s.label]));
    return (id) => byId.get(id) ?? ballNameById(id);
}

export function renderScorecards(ctx: RoundRenderContext, state: RoundRenderState): string {
    const { roundResult } = ctx;
    const { ballNameById } = state;
    const slots = roundResult.slots
        .map((slot) => {
            const nameOf = slotNameOf(slot, ballNameById);
            const cards = slot.cards
                .map((c) => renderScoreGridSection(c, roundResult.routeSections, nameOf))
                .join('\n');
            return `
<h3 class="slot-divider">Slot #${slot.slotIndex} · ${esc(slot.formatLabel)} <span class="muted">· ${esc(slot.allowanceLabel)}</span></h3>
${cards}`;
        })
        .join('\n');
    return `
<section>
  <h2>Scorecards</h2>
  ${slots}
</section>`;
}

export function renderLeaderboard(ctx: RoundRenderContext, state: RoundRenderState): string {
    const { roundResult } = ctx;
    const { ballNameById } = state;
    const slots = roundResult.slots
        .map((slot) => {
            const nameOf = slotNameOf(slot, ballNameById);
            const cols = slot.leaderboard
                .map((sec) =>
                    sec.kind === 'ranked'
                        ? renderRanked(sec, nameOf)
                        : renderMatchSummary(sec, nameOf),
                )
                .join('');
            const header = `Slot #${slot.slotIndex} · ${esc(slot.formatLabel)} @ ${esc(slot.allowanceLabel)}`;
            return `
<div class="lb-slot">
  <h3>${header}</h3>
  <div class="lb-row">${cols}</div>
</div>`;
        })
        .join('');
    return `
<section>
  <h2>Leaderboard</h2>
  ${slots}
</section>`;
}
