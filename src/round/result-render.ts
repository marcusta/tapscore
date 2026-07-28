// Generic mobile result renderer (2.6e M5) — the no-login leaderboard's
// section layer, and a THIN ADAPTER over the shared layout fold (N3).
//
// `result-layout.ts` decides layout: route-section column grouping, subtotals,
// the TOT column, cell decorations, pace values, ranked/match folds. This file
// only turns that tree into HTML — class names, tag structure, escaping. The
// static oracle (`scripts/render/sections/result.ts`) and, from N4, the native
// renderer walk the SAME tree, so a layout rule is changed in one place.
//
// Nothing here reimplements a scoring rule and nothing branches on a format id.
//
// Output is an HTML string (consumed via innerHTML). An unrecognised section
// kind renders a visible structured diagnostic rather than vanishing, so a
// missing adapter is never silently hidden (PHASES M5 requirement).

import type {
    MatchSummarySection,
    RankedSection,
    RouteSectionRef,
    ScoreGridSection,
    SlotResultView,
} from '../api/friendly-rounds.gen';
import {
    layoutMatchSummary,
    layoutRanked,
    layoutScoreGrid,
    scoreGridComponentId,
} from './result-layout';
import { entryKey, type BoardPlan } from './board-expansion';
import { markerClass } from './marker-tokens';
import type {
    CellLayout,
    GridRowLayout,
    RankedEntryLayout,
    ResultRenderMode,
    ScoreGridLayout,
} from './result-layout';

export type { ResultRenderMode } from './result-layout';
export type NameOf = (ballId: string) => string;
/** Ball id → "Group N" label, or `null` on a single-group round (Phase 3.5). */
export type GroupOf = (ballId: string) => string | null;
export interface ResultRenderOptions {
    mode?: ResultRenderMode;
}

/**
 * Gamebook-style expansion context for the ONE ranked board cards were
 * classified against (`plan.rankedSection`). Absent ⇒ every board renders
 * exactly as it always has: no buttons, no panels, byte-identical rows.
 */
export interface BoardExpansion {
    plan: BoardPlan;
    /** The round's frozen route sections — needed to lay out an inline card. */
    routeSections: RouteSectionRef[];
    /** Is this entry's row currently expanded? Keyed by the slot-scoped signature `entryKey` builds. */
    isOpen: (key: string) => boolean;
    mode?: ResultRenderMode;
}

const noGroup: GroupOf = () => null;

/** Minimal HTML escape (mirrors scripts/render/util.ts `esc`). */
export function esc(value: unknown): string {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function cellClass(row: GridRowLayout): string {
    if (row.kind === 'si') return 'lb-c-si';
    if (row.kind === 'given') return 'lb-c-given';
    if (row.kind === 'status') return 'lb-c-status';
    if (row.kind === 'category') return 'lb-c-cat';
    return '';
}
function rowClass(row: GridRowLayout): string {
    const classes = [row.kind === 'category' ? 'lb-r-cat' : `lb-r-${row.kind}`];
    if (row.kind === 'si' || row.kind === 'given') classes.push('lb-r-dim');
    if (row.team) classes.push(`lb-team-${row.team}`);
    return classes.join(' ');
}

/**
 * One grid cell. A score marker draws a shape (ring / double_ring / square …)
 * around the score. A per-cell team (standing row, deciding ball) fills the cell
 * in team colour: on an UNDECORATED score it's the round pill; on a decorated
 * one the marker's own shape gets the team fill (white number/outline) — never
 * a shape nested in a pill. The marker's `label` carries the golf meaning
 * ("Birdie (-1)") — surfaced as tooltip + aria. The fold picked WHICH of these
 * applies; this only names the CSS.
 */
function cellHtml(cell: CellLayout, row: GridRowLayout, emph: (s: string) => string): string {
    const title = cell.title !== null ? ` title="${esc(cell.title)}"` : '';
    const text = emph(esc(cell.text));
    const d = cell.decoration;
    let inner: string;
    if (d.kind === 'marker') {
        const tone = d.tone ? ` lb-mark-tone--${d.tone}` : '';
        const fill = d.teamFill ? ` lb-mark-fill--${d.teamFill}` : '';
        const attrs = d.label !== null ? ` title="${esc(d.label)}" aria-label="${esc(d.label)}"` : '';
        inner = `<span class="lb-mark ${markerClass(d.template)}${tone}${fill}"${attrs}>${text}</span>`;
    } else if (d.kind === 'pill') {
        inner = `<span class="lb-pill lb-pill--${d.team}">${text}</span>`;
    } else {
        inner = text;
    }
    return `<td class="${cellClass(row)}"${title}>${inner}</td>`;
}

function renderScoreGridBase(layout: ScoreGridLayout, opts: { mode: ResultRenderMode; cardModifier?: string }): string {
    // Each hole-group (front 9 / back 9) renders as its OWN stacked table block so
    // an 18-hole card never scrolls sideways — the traditional mobile scorecard.
    // (The fold's TOT column has no place in a stacked card; each block carries
    // its own group subtotal.)
    const renderBlock = (groupIndex: number): string => {
        const group = layout.columnGroups[groupIndex]!;
        const header = `<tr><th class="lb-rowlabel">Hole</th>${group.columns
            .map((c) => `<th>${esc(c.label)}</th>`)
            .join('')}<th class="lb-sum">${esc(group.label)}</th></tr>`;

        const body = layout.rows
            .map((row) => {
                const emph = (str: string): string => (row.emphasis ? `<strong>${str}</strong>` : str);
                const rowGroup = row.groups[groupIndex]!;
                const cellsHtml = rowGroup.cells.map((cell) => cellHtml(cell, row, emph)).join('');
                const sub = `<td class="lb-sum">${emph(rowGroup.subtotal)}</td>`;
                const label =
                    row.subjectName !== null
                        ? esc(row.subjectName) + (row.labelText ? ' ' + esc(row.labelText) : '')
                        : esc(row.labelText);
                return `<tr class="${rowClass(row)}"><th class="lb-rowlabel">${label}</th>${cellsHtml}${sub}</tr>`;
            })
            .join('');

        return `<div class="lb-card__scroll"><table class="lb-grid"><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
    };
    const blocks = layout.columnGroups.map((_g, i) => renderBlock(i)).join('');

    const title = layout.title.groups
        .map((g) => g.map((name) => esc(name)).join(layout.title.nameJoiner))
        .filter(Boolean)
        .join(layout.title.joiner);
    const subtitle = layout.subtitleFacts.length
        ? `<div class="lb-card__sub">${layout.subtitleFacts.map(esc).join(' · ')}</div>`
        : '';
    // Per-hole arithmetic (how each hole's points were earned) — a labelled,
    // full-width block so it's visible on touch (where cell hover tooltips aren't).
    const footnotes = opts.mode === 'verification' && layout.footnotes.length
        ? `<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${layout.footnotes
              .map((n) => `<span class="lb-card__note">${esc(n)}</span>`)
              .join('')}</div>`
        : '';
    const caption = opts.mode === 'verification' && layout.caption ? `<p class="lb-card__caption">${esc(layout.caption)}</p>` : '';
    const totals = layout.totals.length
        ? `<ul class="lb-card__totals">${layout.totals
              .map((tt) => `<li>${esc(tt.label)} = <strong>${tt.value}</strong></li>`)
              .join('')}</ul>`
        : '';

    // Match cards drop the title (the structured panel above + the team-tinted row
    // labels already identify who's who) — render the head only when there's a title.
    const head = title ? `<header class="lb-card__head"><h4>${title}</h4>${subtitle}</header>` : subtitle;

    const cardClass = opts.cardModifier ? `lb-card ${opts.cardModifier}` : 'lb-card';
    return `<article class="${cardClass}">
  ${head}
  ${blocks}
  ${footnotes}${caption}${totals}
</article>`;
}

function renderScoreGrid(
    section: ScoreGridSection,
    routeSections: RouteSectionRef[],
    nameOf: NameOf,
    opts: { mode: ResultRenderMode },
): string {
    return renderScoreGridBase(layoutScoreGrid(section, routeSections, nameOf, opts), opts);
}

function renderCompactMatchGrid(
    section: ScoreGridSection,
    routeSections: RouteSectionRef[],
    nameOf: NameOf,
    opts: { mode: ResultRenderMode },
): string {
    return renderScoreGridBase(layoutScoreGrid(section, routeSections, nameOf, opts), {
        ...opts,
        cardModifier: 'lb-card--compact-match',
    });
}

function renderCategoryMatrixGrid(
    section: ScoreGridSection,
    routeSections: RouteSectionRef[],
    nameOf: NameOf,
    opts: { mode: ResultRenderMode },
): string {
    return renderScoreGridBase(layoutScoreGrid(section, routeSections, nameOf, opts), {
        ...opts,
        cardModifier: 'lb-card--category-matrix',
    });
}

/**
 * A ranked entry's live-board pace delta — the metric relative to its
 * playing-to-pace baseline over that entry's own thru-N, which is WHY the
 * server ordered the board this way (a team ahead of pace ranks above one
 * behind it even on fewer holes).
 *
 * It gets its OWN column rather than trailing the total: run together in one
 * cell, "33 −3" reads as a single mangled number ("33-3"). Two columns with
 * their own headers is how every golf board (and Golf GameBook) does it. The
 * value and its sign convention come from the fold.
 */
function paceCell(entry: RankedEntryLayout): string {
    if (entry.pace === null) return '<td class="lb-rank__pace"></td>';
    return `<td class="lb-rank__pace lb-rank__pace--${entry.pace.tone}">${esc(entry.pace.text)}</td>`;
}

/**
 * A stable, id-safe DOM id for one row's panel (`aria-controls` needs one).
 * Derived from the entry signature so it survives a live refetch — never from
 * the row index, which reorders.
 */
function panelId(key: string): string {
    return `lb-panel-${key.replace(/[^a-zA-Z0-9_-]+/g, '-')}`;
}

function renderRanked(
    section: RankedSection,
    nameOf: NameOf,
    groupOf: GroupOf = noGroup,
    expansion: BoardExpansion | null = null,
): string {
    const layout = layoutRanked(section, nameOf, groupOf);
    // The pace column exists only for metrics whose descriptor declares a pace
    // baseline — a non-pace board (gross strokes, say) keeps its old 4 columns.
    const hasPace = layout.hasPace;
    const columnCount = hasPace ? 5 : 4;
    const rows = layout.entries
        .map((e, index) => {
            const groupTag = e.group ? ` <span class="lb-rank__group">${esc(e.group)}</span>` : '';
            const tail = `
  <td class="lb-rank__total">${e.total}</td>${hasPace ? `\n  ${paceCell(e)}` : ''}
  <td class="lb-rank__thru">${e.holesPlayed}</td>
</tr>`;
            // No expansion context (the oracle, the tests' default path, any
            // board that isn't the one cards were classified against): render
            // byte-for-byte what this file always emitted.
            const entry = section.entries[index];
            const card =
                expansion && entry
                    ? expansion.plan.attached.get(entryKey(expansion.plan.slotDefId, entry.ballIds))
                    : undefined;
            if (!expansion || !entry || !card) {
                return `<tr class="${e.lead ? 'lb-rank__lead' : ''}">
  <td class="lb-rank__pos">${e.position}</td>
  <td class="lb-rank__who"><span class="lb-rank__whobox"><span class="lb-rank__name">${esc(e.name)}</span>${groupTag}</span></td>${tail}`;
            }

            // Expandable row: the whole row is tappable (delegated click), and
            // the button inside the name cell carries the semantics keyboard and
            // screen-reader users need (aria-expanded / aria-controls).
            const key = entryKey(expansion.plan.slotDefId, entry.ballIds);
            const open = expansion.isOpen(key);
            const id = panelId(key);
            const cardHtml = renderScoreGridSection(card, expansion.routeSections, nameOf, {
                mode: expansion.mode ?? 'product',
            });
            const rowClasses = ['lb-rank__row--expandable'];
            if (e.lead) rowClasses.push('lb-rank__lead');
            if (open) rowClasses.push('lb-rank__row--open');
            return `<tr class="${rowClasses.join(' ')}" data-expand-key="${esc(key)}">
  <td class="lb-rank__pos">${e.position}</td>
  <td class="lb-rank__who"><button type="button" class="lb-rank__toggle" aria-expanded="${open}" aria-controls="${esc(id)}"><span class="lb-rank__whobox"><span class="lb-rank__name">${esc(e.name)}</span>${groupTag}</span><span class="lb-rank__chev" aria-hidden="true"></span></button></td>${tail}
<tr class="lb-rank__panel${open ? ' lb-rank__panel--open' : ''}" data-panel-key="${esc(key)}">
  <td class="lb-rank__panelcell" colspan="${columnCount}"><div class="lb-rank__panelwrap" id="${esc(id)}"><div class="lb-rank__panelbox">${cardHtml}</div></div></td>
</tr>`;
        })
        .join('');
    const paceCol = hasPace ? '\n      <col class="lb-rank__col-pace">' : '';
    const paceHead = hasPace ? '<th class="lb-rank__pace">Pace</th>' : '';
    return `<div class="lb-section">
  <h4 class="lb-section__title">${esc(layout.metricLabel)}</h4>
  <table class="lb-rank">
    <colgroup>
      <col class="lb-rank__col-pos">
      <col class="lb-rank__col-who">
      <col class="lb-rank__col-total">${paceCol}
      <col class="lb-rank__col-thru">
    </colgroup>
    <thead><tr><th class="lb-rank__pos">#</th><th class="lb-rank__who">Player</th><th class="lb-rank__total">Total</th>${paceHead}<th class="lb-rank__thru">Thru</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

function renderMatchSummary(section: MatchSummarySection, nameOf: NameOf): string {
    const layout = layoutMatchSummary(section, nameOf);
    const panels = layout.matches
        .map((m) => {
            const aLead = m.leader === 'a' ? ' lb-mp__team--lead' : '';
            const bLead = m.leader === 'b' ? ' lb-mp__team--lead' : '';
            return `<div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a${aLead}">${esc(m.sideAName)}</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">${esc(m.standing)}</span><span class="lb-mp__status">${esc(m.status)}</span></div>
    <div class="lb-mp__team lb-mp__team--b${bLead}">${esc(m.sideBName)}</div>
  </div>`;
        })
        .join('');
    return `<div class="lb-section">
  <h4 class="lb-section__title">${esc(layout.title)}</h4>${panels}
</div>`;
}

// --- registry dispatch (Phase 1) -------------------------------------------
//
// Section rendering is polymorphic by section KIND (leaderboard) and by score-grid
// COMPONENT ID (cards), never by format id. A registry miss renders a visible
// diagnostic instead of silently dropping content — a missing adapter must never
// hide results (PHASES M5 / contract fallback requirement).

/** A leaderboard section is one of the canonical leaderboard-area kinds. */
type LeaderboardSection = SlotResultView['leaderboard'][number];

/** Renders one leaderboard section kind. Every renderer shares this shape. */
type SectionRenderer<S extends LeaderboardSection> = (
    section: S,
    nameOf: NameOf,
    groupOf: GroupOf,
    expansion: BoardExpansion | null,
) => string;

/**
 * Registry of leaderboard-section renderers, keyed by `section.kind`. Defined as
 * a mapped type so each entry is checked against its exact section type, and so
 * adding a new leaderboard kind to the contract forces a matching renderer here.
 * `match_summary` ignores `groupOf` — a match panel already names both sides
 * explicitly, so a group tag would be redundant.
 */
const sectionRegistry: {
    [K in LeaderboardSection['kind']]: SectionRenderer<Extract<LeaderboardSection, { kind: K }>>;
} = {
    ranked: renderRanked,
    match_summary: (section, nameOf) => renderMatchSummary(section, nameOf),
};

/** Renders one score grid. Every grid component shares this shape. */
type ScoreGridRenderer = (
    section: ScoreGridSection,
    routeSections: RouteSectionRef[],
    nameOf: NameOf,
    opts: { mode: ResultRenderMode },
) => string;

/**
 * Registry of score-grid component renderers, keyed by `score_grid.componentId`.
 * Richer grid components are registered here (never via a format-id branch).
 */
type ScoreGridComponentId = NonNullable<ScoreGridSection['componentId']>;
const scoreGridRegistry: Record<ScoreGridComponentId, ScoreGridRenderer> = {
    'default-score-grid': renderScoreGrid,
    'compact-match-grid': renderCompactMatchGrid,
    'category-matrix-grid': renderCategoryMatrixGrid,
};

function diagnostic(kind: string): string {
    return `<div class="lb-diag">Unrenderable result section <code>${esc(kind)}</code> — no generic view yet. Results are not hidden.</div>`;
}

function gridDiagnostic(componentId: string): string {
    return `<div class="lb-diag">Unsupported score-grid component <code>${esc(componentId)}</code> — no generic view yet. Results are not hidden.</div>`;
}

/** Dispatch one leaderboard section through {@link sectionRegistry}. */
function renderLeaderboardSection(
    section: LeaderboardSection,
    nameOf: NameOf,
    groupOf: GroupOf,
    expansion: BoardExpansion | null = null,
): string {
    // Contained dispatcher cast: the registry is typed per-kind on definition;
    // the lookup widens to "any leaderboard renderer, or none" so an unknown
    // runtime kind falls through to a visible diagnostic instead of throwing.
    const render = (
        sectionRegistry as Record<string, SectionRenderer<LeaderboardSection> | undefined>
    )[section.kind];
    return render ? render(section, nameOf, groupOf, expansion) : diagnostic(section.kind);
}

/** Dispatch one score grid through {@link scoreGridRegistry}. */
function renderScoreGridSection(
    section: ScoreGridSection,
    routeSections: RouteSectionRef[],
    nameOf: NameOf,
    opts: { mode: ResultRenderMode },
): string {
    const componentId = scoreGridComponentId(section);
    const render: ScoreGridRenderer | undefined = (
        scoreGridRegistry as Record<string, ScoreGridRenderer | undefined>
    )[componentId];
    return render ? render(section, routeSections, nameOf, opts) : gridDiagnostic(componentId);
}

/**
 * Leaderboard-area sections for one slot (ranked metrics + match summaries).
 * `groupOf` (Phase 3.5) is optional — a single-group round (the common case)
 * passes nothing and every entry renders exactly as before.
 */
export function renderSlotLeaderboard(
    slot: SlotResultView,
    nameOf: NameOf,
    groupOf: GroupOf = noGroup,
    expansion: BoardExpansion | null = null,
): string {
    if (slot.leaderboard.length === 0 && slot.cards.length === 0) {
        return `<div class="lb-empty">No scores entered yet for ${esc(slot.formatLabel)}.</div>`;
    }
    const sections = slot.leaderboard
        .map((sec) =>
            // Only the board the cards were classified against gets expandable
            // rows — identity, not "the first ranked kind I happen to see".
            renderLeaderboardSection(
                sec,
                nameOf,
                groupOf,
                expansion && sec === expansion.plan.rankedSection ? expansion : null,
            ),
        )
        .join('');
    return sections || `<div class="lb-empty">No leaderboard metric for ${esc(slot.formatLabel)}.</div>`;
}

/** Scorecard-area cards for one slot (the format-aware "full scorecard"). */
export function renderSlotCards(
    slot: SlotResultView,
    routeSections: RouteSectionRef[],
    nameOf: NameOf,
    options: ResultRenderOptions = {},
): string {
    return renderCards(slot.cards, routeSections, nameOf, options);
}

/**
 * The card list for an explicit set of cards — the Gamebook board passes only
 * the STANDALONE ones (`planBoard(slot).standalone`), because the attached cards
 * have already been rendered inside their ranked rows. Same bytes per card as
 * {@link renderSlotCards}.
 */
export function renderCards(
    cards: readonly ScoreGridSection[],
    routeSections: RouteSectionRef[],
    nameOf: NameOf,
    options: ResultRenderOptions = {},
): string {
    if (cards.length === 0) return '';
    const mode = options.mode ?? 'product';
    return cards.map((c) => renderScoreGridSection(c, routeSections, nameOf, { mode })).join('\n');
}
