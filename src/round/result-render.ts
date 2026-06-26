// Generic mobile result renderer (2.6e M5) — the no-login leaderboard's
// section layer. It mirrors the static oracle `scripts/render/sections/result.ts`
// EXACTLY in shape: a score grid is a hole-indexed table grouped into the
// round's frozen route sections (OUT/IN/TOT), a ranked section is a sorted
// table, a match summary is a list of golf-idiom lines. Every value, note,
// total, and idiom string is computed server-side by the format plugin — this
// renderer never reimplements a scoring rule and never branches on a format id.
// It only resolves ball ids → live names and groups holes into columns.
//
// Output is an HTML string (consumed via innerHTML). An unrecognised section
// kind renders a visible structured diagnostic rather than vanishing, so a
// missing adapter is never silently hidden (PHASES M5 requirement).

import type {
    GridRow,
    HoleRef,
    MatchSummarySection,
    RankedSection,
    RouteSectionRef,
    ScoreGridSection,
    SlotResultView,
} from '../api/friendly-rounds.gen';

export type NameOf = (ballId: string) => string;

/** Minimal HTML escape (mirrors scripts/render/util.ts `esc`). */
export function esc(value: unknown): string {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** A column group (route section) holding the ordered HoleRef columns it owns. */
interface ColumnGroup {
    label: string;
    holes: HoleRef[];
    playHoleIds: Set<string>;
}

/**
 * Group scorecard columns by the round's frozen route sections: a column
 * belongs to the section whose `[from, to]` canonical-ordinal range contains
 * it. Columns are ordered by `canonicalOrdinal`. With no route sections, fall
 * back to a single TOT group over all columns. (Verbatim from the oracle.)
 */
function groupColumns(holes: HoleRef[], routeSections: RouteSectionRef[]): ColumnGroup[] {
    const ordered = [...holes].sort((a, b) => a.canonicalOrdinal - b.canonicalOrdinal);
    if (routeSections.length === 0) {
        return [{ label: 'TOT', holes: ordered, playHoleIds: new Set(ordered.map((h) => h.playHoleId)) }];
    }
    const sections = [...routeSections].sort((a, b) => a.fromCanonicalOrdinal - b.fromCanonicalOrdinal);
    const groups: ColumnGroup[] = [];
    for (const section of sections) {
        const members = ordered.filter(
            (h) =>
                h.canonicalOrdinal >= section.fromCanonicalOrdinal &&
                h.canonicalOrdinal <= section.toCanonicalOrdinal,
        );
        if (members.length === 0) continue;
        groups.push({ label: section.label, holes: members, playHoleIds: new Set(members.map((h) => h.playHoleId)) });
    }
    return groups;
}

function cellClass(row: GridRow): string {
    if (row.kind === 'si') return 'lb-c-si';
    if (row.kind === 'given') return 'lb-c-given';
    if (row.kind === 'status') return 'lb-c-status';
    return '';
}
function rowClass(row: GridRow): string {
    return row.kind === 'si' || row.kind === 'given' ? 'lb-r-dim' : '';
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
    if (row.aggregate === 'last') return groupSubtotal(row, groups[groups.length - 1]!.playHoleIds);
    return '—';
}

function renderScoreGrid(section: ScoreGridSection, routeSections: RouteSectionRef[], nameOf: NameOf): string {
    const groups = groupColumns(section.holes, routeSections);
    const includeTot = groups.length > 1;

    const headerCells = groups
        .map(
            (g) =>
                g.holes.map((h) => `<th>${esc(h.occurrenceLabel)}</th>`).join('') +
                `<th class="lb-sum">${esc(g.label)}</th>`,
        )
        .join('');
    const holeHeader = `<tr><th class="lb-rowlabel">Hole</th>${headerCells}${includeTot ? '<th class="lb-sum">TOT</th>' : ''}</tr>`;

    const renderRow = (row: GridRow): string => {
        const cells = new Map(row.cells.map((c) => [c.playHoleId, c]));
        const emph = (str: string): string => (row.emphasis ? `<strong>${str}</strong>` : str);
        const groupCells = groups
            .map((g) => {
                const body = g.holes
                    .map((h) => {
                        const c = cells.get(h.playHoleId);
                        const title = c?.title ? ` title="${esc(c.title)}"` : '';
                        return `<td class="${cellClass(row)}"${title}>${emph(esc(c?.display ?? ''))}</td>`;
                    })
                    .join('');
                return body + `<td class="lb-sum">${emph(groupSubtotal(row, g.playHoleIds))}</td>`;
            })
            .join('');
        const tot = includeTot ? `<td class="lb-sum">${emph(totColumn(row, groups))}</td>` : '';
        const label = row.subjectBallId ? `${esc(nameOf(row.subjectBallId))} ${esc(row.label)}` : esc(row.label);
        return `<tr class="${rowClass(row)}"><th class="lb-rowlabel">${label}</th>${groupCells}${tot}</tr>`;
    };

    const title = section.title.groups
        .map((g) => g.map((id) => esc(nameOf(id))).join(' & '))
        .join(section.title.joiner);
    const subtitle = section.subtitleFacts.length
        ? `<div class="lb-card__sub">${section.subtitleFacts.map(esc).join(' · ')}</div>`
        : '';
    // Per-hole arithmetic (how each hole's points were earned) — a labelled,
    // full-width block so it's visible on touch (where cell hover tooltips aren't).
    const footnotes = section.footnotes.length
        ? `<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${section.footnotes
              .map((n) => `<span class="lb-card__note">${esc(n)}</span>`)
              .join('')}</div>`
        : '';
    const caption = section.caption ? `<p class="lb-card__caption">${esc(section.caption)}</p>` : '';
    const totals = section.totals.length
        ? `<ul class="lb-card__totals">${section.totals
              .map((tt) => `<li>${esc(tt.label)} = <strong>${tt.value ?? '—'}</strong></li>`)
              .join('')}</ul>`
        : '';

    return `<article class="lb-card">
  <header class="lb-card__head"><h4>${title}</h4>${subtitle}</header>
  <div class="lb-card__scroll"><table class="lb-grid">
    <thead>${holeHeader}</thead>
    <tbody>${section.rows.map(renderRow).join('')}</tbody>
  </table></div>
  ${footnotes}${caption}${totals}
</article>`;
}

function renderRanked(section: RankedSection, nameOf: NameOf): string {
    const rows = section.entries
        .map(
            (e) => `<tr class="${e.position === 1 ? 'lb-rank__lead' : ''}">
  <td class="lb-rank__pos">${e.position}</td>
  <td class="lb-rank__who">${esc(e.ballIds.map(nameOf).join(' & '))}</td>
  <td class="lb-rank__total">${e.total ?? '—'}</td>
  <td class="lb-rank__thru">${e.holesPlayed}</td>
</tr>`,
        )
        .join('');
    return `<div class="lb-section">
  <h4 class="lb-section__title">${esc(section.metricLabel)}</h4>
  <table class="lb-rank">
    <thead><tr><th>#</th><th>Player</th><th>Total</th><th>Thru</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

function renderMatchSummary(section: MatchSummarySection, nameOf: NameOf): string {
    const lines = section.lines
        .map((line) => {
            const text = line.segments
                .map((seg) => ('text' in seg ? esc(seg.text) : esc(seg.ballIds.map(nameOf).join(' & '))))
                .join('');
            return `<li class="lb-match__line lb-match__line--${line.result}">${text}</li>`;
        })
        .join('');
    return `<div class="lb-section">
  <h4 class="lb-section__title">${esc(section.title)}</h4>
  <ul class="lb-match">${lines}</ul>
</div>`;
}

function diagnostic(kind: string): string {
    return `<div class="lb-diag">Unrenderable result section <code>${esc(kind)}</code> — no generic view yet. Results are not hidden.</div>`;
}

/** Leaderboard-area sections for one slot (ranked metrics + match summaries). */
export function renderSlotLeaderboard(slot: SlotResultView, nameOf: NameOf): string {
    if (slot.leaderboard.length === 0 && slot.cards.length === 0) {
        return `<div class="lb-empty">No scores entered yet for ${esc(slot.formatLabel)}.</div>`;
    }
    const sections = slot.leaderboard
        .map((sec) =>
            sec.kind === 'ranked'
                ? renderRanked(sec, nameOf)
                : sec.kind === 'match_summary'
                  ? renderMatchSummary(sec, nameOf)
                  : diagnostic((sec as { kind: string }).kind),
        )
        .join('');
    return sections || `<div class="lb-empty">No leaderboard metric for ${esc(slot.formatLabel)}.</div>`;
}

/** Scorecard-area cards for one slot (the format-aware "full scorecard"). */
export function renderSlotCards(slot: SlotResultView, routeSections: RouteSectionRef[], nameOf: NameOf): string {
    if (slot.cards.length === 0) return '';
    return slot.cards.map((c) => renderScoreGrid(c, routeSections, nameOf)).join('\n');
}
