// Generic result renderer — Phase 2.6b-final / Slice 2b.
//
// Lays out the serializable sections on `ctx.roundResult` with ZERO format
// knowledge: a score grid is a hole-indexed table of rows; a ranked section
// is a sorted table; a match summary is a list of idiom lines. Every value,
// note, total, and golf-idiom string was computed server-side by the format
// plugin. The renderer only resolves ball ids → live names and groups holes
// into OUT / IN / TOT columns.

import type {
    GridRow,
    MatchSummarySection,
    RankedSection,
    ScoreGridSection,
} from '../../../server/domain/strategies/result-sections';
import type { RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import { esc } from '../util';

interface HoleGroup {
    label: string;
    holeNumbers: number[];
}

/** OUT (≤9) / IN (>9) / TOT — generic hole-column grouping. */
function groupHoles(holeNumbers: number[]): HoleGroup[] {
    const front = holeNumbers.filter((h) => h <= 9);
    const back = holeNumbers.filter((h) => h > 9);
    if (front.length > 0 && back.length > 0) {
        return [
            { label: 'OUT', holeNumbers: front },
            { label: 'IN', holeNumbers: back },
        ];
    }
    return [{ label: 'TOT', holeNumbers }];
}

function rowClass(row: GridRow): string {
    if (row.kind === 'si' || row.kind === 'given') return 'dim';
    return '';
}
function cellClass(row: GridRow): string {
    if (row.kind === 'si') return 'si';
    if (row.kind === 'given') return 'given';
    if (row.kind === 'status') return 'status';
    return '';
}

function groupSubtotal(row: GridRow, holeNumbers: number[]): string {
    const cells = row.cells.filter((c) => holeNumbers.includes(c.holeNumber));
    if (row.aggregate === 'sum') {
        const nums = cells.map((c) => c.value).filter((v): v is number => v !== null);
        return nums.length === 0 ? '—' : String(nums.reduce((a, b) => a + b, 0));
    }
    if (row.aggregate === 'last') {
        for (let i = cells.length - 1; i >= 0; i--) {
            const v = cells[i]!.value;
            if (v !== null) return Number.isInteger(v) ? String(v) : v.toFixed(1);
        }
        return '—';
    }
    return '—';
}

function totColumn(row: GridRow, groups: HoleGroup[]): string {
    if (row.aggregate === 'sum') {
        const all = row.cells.map((c) => c.value).filter((v): v is number => v !== null);
        return all.length === 0 ? '—' : String(all.reduce((a, b) => a + b, 0));
    }
    if (row.aggregate === 'last') {
        const last = groups[groups.length - 1]!;
        return groupSubtotal(row, last.holeNumbers);
    }
    return '—';
}

function renderScoreGrid(
    section: ScoreGridSection,
    nameOf: (id: string) => string,
): string {
    const holeNumbers = section.holes.map((h) => h.holeNumber);
    const groups = groupHoles(holeNumbers);
    const includeTot = groups.length > 1;

    const headerCells = groups
        .map(
            (g) =>
                g.holeNumbers.map((h) => `<th>${h}</th>`).join('') +
                `<th class="sum">${g.label}</th>`,
        )
        .join('');
    const holeHeader = `
<tr>
  <th class="rowlabel">Hole</th>
  ${headerCells}
  ${includeTot ? '<th class="sum">TOT</th>' : ''}
</tr>`;

    const byHole = (row: GridRow) => new Map(row.cells.map((c) => [c.holeNumber, c]));

    const renderRow = (row: GridRow): string => {
        const cells = byHole(row);
        const emph = (s: string): string => (row.emphasis ? `<strong>${s}</strong>` : s);
        const groupCells = groups
            .map((g) => {
                const body = g.holeNumbers
                    .map((h) => {
                        const c = cells.get(h);
                        const title = c?.title ? ` title="${esc(c.title)}"` : '';
                        return `<td class="${cellClass(row)}"${title}>${emph(esc(c?.display ?? ''))}</td>`;
                    })
                    .join('');
                return body + `<td class="sum">${emph(groupSubtotal(row, g.holeNumbers))}</td>`;
            })
            .join('');
        const tot = includeTot ? `<td class="sum">${emph(totColumn(row, groups))}</td>` : '';
        const label = row.subjectBallId ? `${esc(nameOf(row.subjectBallId))} ${esc(row.label)}` : esc(row.label);
        return `
<tr class="${rowClass(row)}">
  <th class="rowlabel">${label}</th>
  ${groupCells}
  ${tot}
</tr>`;
    };

    const title = section.title.groups
        .map((g) => g.map((id) => esc(nameOf(id))).join(' & '))
        .join(section.title.joiner);

    const footnotes =
        section.footnotes.length > 0
            ? `<p class="arithmetic">${section.footnotes.map(esc).join(' · ')}</p>`
            : '';
    const totals =
        section.totals.length > 0
            ? `<ul class="totals">${section.totals
                  .map((t) => `<li>${esc(t.label)} = <strong>${t.value ?? '—'}</strong></li>`)
                  .join('')}</ul>`
            : '';

    return `
<article class="scorecard-card">
  <header>
    <h3>${title}</h3>
    <span class="muted">${section.subtitleFacts.map(esc).join(' · ')}</span>
  </header>
  <table class="scorecard">
    <thead>${holeHeader}</thead>
    <tbody>${section.rows.map(renderRow).join('')}</tbody>
  </table>
  ${footnotes}
  ${totals}
</article>`;
}

function renderRanked(section: RankedSection, nameOf: (id: string) => string): string {
    const rows = section.entries
        .map(
            (e) => `
<tr>
  <td class="num">${e.position}</td>
  <td>${esc(e.ballIds.map(nameOf).join(' & '))}</td>
  <td class="num">${e.total ?? '—'}</td>
  <td class="num muted">${e.holesPlayed}</td>
</tr>`,
        )
        .join('');
    return `
<div class="lb-col">
  <h4>${esc(section.metricLabel)}</h4>
  <table class="grid">
    <thead><tr><th>pos</th><th>ball</th><th>total</th><th>holes</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

function renderMatchSummary(section: MatchSummarySection, nameOf: (id: string) => string): string {
    const rows = section.lines
        .map((line) => {
            const text = line.segments
                .map((s) => ('text' in s ? esc(s.text) : esc(s.ballIds.map(nameOf).join(' & '))))
                .join('');
            return `<tr><td>${text}</td></tr>`;
        })
        .join('');
    return `
<div class="lb-col" style="min-width: 420px;">
  <h4>${esc(section.title)}</h4>
  <table class="grid">
    <thead><tr><th>result</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

export function renderScorecards(ctx: RoundRenderContext, state: RoundRenderState): string {
    const { roundResult } = ctx;
    const { ballNameById } = state;
    const slots = roundResult.slots
        .map((slot) => {
            const cards = slot.cards.map((c) => renderScoreGrid(c, ballNameById)).join('\n');
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
            const cols = slot.leaderboard
                .map((sec) =>
                    sec.kind === 'ranked'
                        ? renderRanked(sec, ballNameById)
                        : renderMatchSummary(sec, ballNameById),
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
