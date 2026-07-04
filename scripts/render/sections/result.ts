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
    HoleRef,
    MatchSummarySection,
    RankedSection,
    RouteSectionRef,
    ScoreGridSection,
} from '../../../server/domain/strategies/result-sections';
import type { Tone } from '../../../server/domain/strategies/result-vocabulary';
import type { RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import { esc } from '../util';

/** A column group (route section) holding the ordered HoleRef columns it owns. */
interface ColumnGroup {
    label: string;
    holes: HoleRef[];
    /** Stable column identities in this group — drives cell filtering. */
    playHoleIds: Set<string>;
}

/**
 * Group scorecard columns (ordered HoleRefs) by the round's frozen route
 * sections: a column belongs to the section whose
 * `[fromCanonicalOrdinal, toCanonicalOrdinal]` contains its
 * `canonicalOrdinal`. Columns are ordered by `canonicalOrdinal`. If there
 * are no route sections, fall back to a single TOT group over all columns.
 */
function groupColumns(holes: HoleRef[], routeSections: RouteSectionRef[]): ColumnGroup[] {
    const ordered = [...holes].sort((a, b) => a.canonicalOrdinal - b.canonicalOrdinal);
    if (routeSections.length === 0) {
        return [
            {
                label: 'TOT',
                holes: ordered,
                playHoleIds: new Set(ordered.map((h) => h.playHoleId)),
            },
        ];
    }
    const sections = [...routeSections].sort(
        (a, b) => a.fromCanonicalOrdinal - b.fromCanonicalOrdinal,
    );
    const groups: ColumnGroup[] = [];
    for (const section of sections) {
        const members = ordered.filter(
            (h) =>
                h.canonicalOrdinal >= section.fromCanonicalOrdinal &&
                h.canonicalOrdinal <= section.toCanonicalOrdinal,
        );
        if (members.length === 0) continue;
        groups.push({
            label: section.label,
            holes: members,
            playHoleIds: new Set(members.map((h) => h.playHoleId)),
        });
    }
    return groups;
}

function rowClass(row: GridRow): string {
    if (row.kind === 'si' || row.kind === 'given') return 'dim';
    return '';
}
function cellClass(row: GridRow): string {
    if (row.kind === 'si') return 'si';
    if (row.kind === 'given') return 'given';
    if (row.kind === 'status') return 'status';
    if (row.kind === 'category') return 'category';
    return '';
}

function markerToneClass(tone: Tone | undefined): string {
    return tone === 'success' || tone === 'warning' || tone === 'danger' ? ` mark-tone--${tone}` : '';
}

function groupSubtotal(row: GridRow, playHoleIds: Set<string>): string {
    const cells = row.cells.filter((c) => playHoleIds.has(c.playHoleId));
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

function totColumn(row: GridRow, groups: ColumnGroup[]): string {
    if (row.aggregate === 'sum') {
        const all = row.cells.map((c) => c.value).filter((v): v is number => v !== null);
        return all.length === 0 ? '—' : String(all.reduce((a, b) => a + b, 0));
    }
    if (row.aggregate === 'last') {
        const last = groups[groups.length - 1]!;
        return groupSubtotal(row, last.playHoleIds);
    }
    return '—';
}

function renderScoreGrid(
    section: ScoreGridSection,
    routeSections: RouteSectionRef[],
    nameOf: (id: string) => string,
    opts: { cardModifier?: string } = {},
): string {
    const groups = groupColumns(section.holes, routeSections);
    const includeTot = groups.length > 1;

    const headerCells = groups
        .map(
            (g) =>
                g.holes.map((h) => `<th>${esc(h.occurrenceLabel)}</th>`).join('') +
                `<th class="sum">${esc(g.label)}</th>`,
        )
        .join('');
    const holeHeader = `
<tr>
  <th class="rowlabel">Hole</th>
  ${headerCells}
  ${includeTot ? '<th class="sum">TOT</th>' : ''}
</tr>`;

    const byPlayHole = (row: GridRow) => new Map(row.cells.map((c) => [c.playHoleId, c]));

    const renderRow = (row: GridRow): string => {
        const cells = byPlayHole(row);
        const emph = (s: string): string => (row.emphasis ? `<strong>${s}</strong>` : s);
        const groupCells = groups
            .map((g) => {
                const body = g.holes
                    .map((h) => {
                        const c = cells.get(h.playHoleId);
                        const title = c?.title ? ` title="${esc(c.title)}"` : '';
                        const text = emph(esc(c?.display ?? ''));
                        const marker = c?.marker;
                        const markerAttrs = marker?.label
                            ? ` title="${esc(marker.label)}" aria-label="${esc(marker.label)}"`
                            : '';
                        const inner = marker
                            ? `<span class="mark mark--${esc(marker.template)}${markerToneClass(marker.tone)}"${markerAttrs}>${text}</span>`
                            : text;
                        return `<td class="${cellClass(row)}"${title}>${inner}</td>`;
                    })
                    .join('');
                return body + `<td class="sum">${emph(groupSubtotal(row, g.playHoleIds))}</td>`;
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

    const cardClass = opts.cardModifier ? `scorecard-card ${opts.cardModifier}` : 'scorecard-card';
    return `
<article class="${cardClass}">
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

type ScoreGridComponentId = NonNullable<ScoreGridSection['componentId']>;
type ScoreGridRenderer = (
    section: ScoreGridSection,
    routeSections: RouteSectionRef[],
    nameOf: (id: string) => string,
) => string;

const scoreGridRegistry: Record<ScoreGridComponentId, ScoreGridRenderer> = {
    'default-score-grid': renderScoreGrid,
    'compact-match-grid': (section, routeSections, nameOf) =>
        renderScoreGrid(section, routeSections, nameOf, { cardModifier: 'scorecard-card--compact-match' }),
    'category-matrix-grid': (section, routeSections, nameOf) =>
        renderScoreGrid(section, routeSections, nameOf, { cardModifier: 'scorecard-card--category-matrix' }),
};

function scoreGridComponentId(section: ScoreGridSection): ScoreGridComponentId {
    return section.componentId ?? 'default-score-grid';
}

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

/** Compact live-board pace chip — the metric relative to its playing-to-pace
 * baseline over the entry's own thru-N, so the server's ordering explains
 * itself. `E` at pace, signed otherwise (real minus sign). Absent when the
 * metric declares no pace. */
function paceChip(paceDelta: number | undefined): string {
    if (paceDelta === undefined) return '';
    const text = paceDelta === 0 ? 'E' : paceDelta > 0 ? `+${paceDelta}` : `−${Math.abs(paceDelta)}`;
    return ` <span class="lb-pace">${esc(text)}</span>`;
}

function renderRanked(section: RankedSection, nameOf: (id: string) => string): string {
    const rows = section.entries
        .map(
            (e) => `
<tr>
  <td class="num">${e.position}</td>
  <td>${esc(e.ballIds.map(nameOf).join(' & '))}</td>
  <td class="num">${e.total ?? '—'}${paceChip(e.paceDelta)}</td>
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
    const rows = section.matches
        .map((m) => {
            const a = esc(m.sideA.ballIds.map(nameOf).join(' & '));
            const b = esc(m.sideB.ballIds.map(nameOf).join(' & '));
            const standing = m.magnitude === 0 ? 'AS' : `${m.magnitude} UP`;
            const status = m.finished ? 'Final' : `thru ${m.thru}`;
            const lead = m.leader === 'a' ? a : m.leader === 'b' ? b : `${a} / ${b}`;
            return `<tr><td>${lead} — ${esc(standing)} (${esc(status)})</td></tr>`;
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
            const cards = slot.cards
                .map((c) => renderScoreGridSection(c, roundResult.routeSections, ballNameById))
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
