// Phase 4 Slice 5 (client) — the competition aggregated board renderer.
//
// A pure `CompetitionResultView → HTML string` fold (consumed via innerHTML),
// deliberately mirroring the round leaderboard's `result-render.ts` idioms:
// tabular-nums, an accent-soft leader row, an ellipsizing name beside a small
// category tag (the round board's "group tag" pattern), and a visible
// diagnostic rather than a silent drop. It is NOT a second scoring engine —
// every value, inclusion flag, status and position is computed server-side by
// the registered `AggregationStrategy`; this renderer only lays the numbers
// out and makes the arithmetic legible on a phone.
//
// The competition board carries per-round columns the round board doesn't, so
// it emits its own `.cb-*` markup (styled in `competition-detail.component`)
// rather than the round board's `.lb-rank`; the shared vocabulary is the
// visual language (classes named for meaning, tokens, ellipsize + lead-row),
// never a forked scoring path.

import { esc } from '../round/result-render';
import type {
    CompetitionRankedEntry,
    CompetitionResultEntry,
    CompetitionResultView,
    CompetitionRoundCell,
} from '../api/competitions.gen';

/** A round column header: number + whether it is a post-cut round. */
export interface RoundColumn {
    roundNumber: number;
    postCut: boolean;
}

/**
 * The arithmetic expression for one entry, as legible HTML: the counted
 * round values joined by ` + `, any dropped rounds appended struck through
 * (best-n), then ` = <total>`. Rounds the participant never posted (missing /
 * cut) contribute nothing and are omitted from the sum so the line stays
 * clean ("74 + 70 = 144", or "72 + 70 + <s>81</s> = 142"). An entry with no
 * posted rounds renders an em dash.
 */
export function entryArithmetic(entry: CompetitionRankedEntry): string {
    const parts: string[] = [];
    for (const cell of entry.rounds) {
        if (cell.value === null) continue;
        if (cell.status === 'counted') parts.push(esc(cell.value));
        else if (cell.status === 'dropped') parts.push(`<s>${esc(cell.value)}</s>`);
        // missing / cut carry no value → already skipped above.
    }
    const total = entry.total === null ? '—' : esc(entry.total);
    if (parts.length === 0) return `<span class="cb-arith__total">${total}</span>`;
    return `${parts.join(' + ')} = <span class="cb-arith__total">${total}</span>`;
}

/** CSS modifier for a per-round cell, keyed by its server-assigned status. */
function cellClass(cell: CompetitionRoundCell): string {
    return `cb-c cb-c--${cell.status}`;
}

/** The display text for a per-round cell — struck value when dropped, em dash
 *  when the round was never posted or the participant was cut out of it. */
function cellText(cell: CompetitionRoundCell): string {
    if (cell.value === null) return '—';
    if (cell.status === 'dropped') return `<s>${esc(cell.value)}</s>`;
    return esc(cell.value);
}

/** Index of the first post-cut round (the column that gets the cut divider),
 *  or -1 when no round is post-cut. */
function firstPostCutIndex(rounds: RoundColumn[]): number {
    return rounds.findIndex((r) => r.postCut);
}

/** One board row. `pointsCell` (finalized results) is appended after the
 *  total when supplied. */
function renderRow(
    entry: CompetitionRankedEntry,
    rounds: RoundColumn[],
    cutColIndex: number,
    pointsCell: string | null,
): string {
    const cellsByRound = new Map(entry.rounds.map((c) => [c.roundNumber, c]));
    const demoted = entry.withdrawn || entry.cutAfterRound !== null;
    const rowClasses = ['cb-row'];
    if (entry.withdrawn) rowClasses.push('cb-row--withdrawn');
    else if (entry.cutAfterRound !== null) rowClasses.push('cb-row--cut');
    else if (entry.position === 1) rowClasses.push('cb-row--lead');
    if (entry.incomplete) rowClasses.push('cb-row--incomplete');

    const roundCells = rounds
        .map((r, i) => {
            const cell = cellsByRound.get(r.roundNumber);
            const cut = i === cutColIndex ? ' cb-c--divider' : '';
            if (!cell) return `<td class="cb-c cb-c--missing${cut}">—</td>`;
            return `<td class="${cellClass(cell)}${cut}">${cellText(cell)}</td>`;
        })
        .join('');

    // A cut / withdrawn entry gets a status tag next to its name so the
    // demotion is explained, not just visually muted.
    const statusTag = entry.withdrawn
        ? ' <span class="cb-tag cb-tag--out">WD</span>'
        : entry.cutAfterRound !== null
          ? ` <span class="cb-tag cb-tag--out">Cut R${entry.cutAfterRound}</span>`
          : '';
    const catTag = entry.category
        ? ` <span class="cb-tag cb-cat">${esc(entry.category)}</span>`
        : '';

    const pos = demoted ? '—' : String(entry.position);
    const points = pointsCell === null ? '' : `<td class="cb-points">${pointsCell}</td>`;

    return `<tr class="${rowClasses.join(' ')}">
  <td class="cb-pos">${pos}</td>
  <td class="cb-who">
    <div class="cb-who__line"><span class="cb-name">${esc(entry.displayName)}</span>${catTag}${statusTag}</div>
    <div class="cb-arith">${entryArithmetic(entry)}</div>
  </td>
  ${roundCells}
  <td class="cb-total">${entry.total === null ? '—' : esc(entry.total)}</td>
  ${points}
</tr>`;
}

function renderTable(
    entries: CompetitionRankedEntry[],
    rounds: RoundColumn[],
    pointsOf: ((i: number) => string) | null,
): string {
    if (entries.length === 0) {
        return `<div class="cb-empty">No scores yet — the board fills in as rounds are played.</div>`;
    }
    const cutColIndex = firstPostCutIndex(rounds);
    const headCells = rounds
        .map((r, i) => {
            const cut = i === cutColIndex ? ' cb-c--divider' : '';
            return `<th class="cb-c${cut}">R${r.roundNumber}</th>`;
        })
        .join('');
    const pointsHead = pointsOf ? '<th class="cb-points">Pts</th>' : '';
    const body = entries
        .map((e, i) => renderRow(e, rounds, cutColIndex, pointsOf ? pointsOf(i) : null))
        .join('');
    return `<table class="cb">
  <thead><tr><th class="cb-pos">#</th><th class="cb-who">Player</th>${headCells}<th class="cb-total">Total</th>${pointsHead}</tr></thead>
  <tbody>${body}</tbody>
</table>`;
}

/**
 * The live aggregated board. Renders the ranked view's entries with per-round
 * columns (cut divider drawn on the first post-cut round), an arithmetic line
 * per entry, and cut / withdrawn entries demoted + muted. A `defaulted` hint
 * is shown subtly when the competition never chose an aggregation and the
 * server folded a sensible default.
 */
export function renderAggregatedBoard(
    view: CompetitionResultView,
    opts: { defaulted?: boolean } = {},
): string {
    const rounds: RoundColumn[] = view.rounds.map((r) => ({
        roundNumber: r.roundNumber,
        postCut: r.postCut,
    }));
    const opLabel =
        view.operator.kind === 'best_n'
            ? `Best ${view.operator.n} of ${rounds.length}`
            : 'Total across rounds';
    const defaultedHint = opts.defaulted
        ? `<span class="cb-head__hint">· default scoring</span>`
        : '';
    const head = `<div class="cb-head">
  <h3 class="cb-head__title">${esc(view.metricLabel)}</h3>
  <span class="cb-head__op">${esc(opLabel)}</span>${defaultedHint}
</div>`;
    return head + renderTable(view.entries, rounds, null);
}

/**
 * A finalized, immutable result set (gross or net). Same layout as the live
 * board plus a bold Points column; the round columns / cut divider come from
 * the live view's round metadata when available (the frozen result rows carry
 * the per-round breakdown but not the post-cut flags). Styled distinctly (the
 * caller wraps this in `.cb--official`) so an official snapshot never reads as
 * the live aggregate.
 */
export function renderResultsBoard(
    entries: CompetitionResultEntry[],
    roundsMeta: RoundColumn[],
): string {
    const rankedEntries = entries.map((e) => e.entry);
    // Prefer the live view's round metadata (carries post-cut flags); fall
    // back to deriving bare columns from the frozen breakdown so a finalized
    // competition still renders its columns without a live leaderboard fetch.
    const rounds =
        roundsMeta.length > 0
            ? roundsMeta
            : deriveRoundsFromEntries(rankedEntries);
    return renderTable(rankedEntries, rounds, (i) => esc(entries[i]!.points));
}

/** Round columns inferred from the entries' per-round breakdown (post-cut
 *  unknown → false) — the fallback when no live view is loaded. */
function deriveRoundsFromEntries(entries: CompetitionRankedEntry[]): RoundColumn[] {
    const numbers = new Set<number>();
    for (const e of entries) for (const c of e.rounds) numbers.add(c.roundNumber);
    return [...numbers].sort((a, b) => a - b).map((n) => ({ roundNumber: n, postCut: false }));
}
