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
    GridCell,
    GridRow,
    HoleRef,
    MatchSummarySection,
    RankedSection,
    RouteSectionRef,
    ScoreGridSection,
    SlotResultView,
} from '../api/friendly-rounds.gen';

export type NameOf = (ballId: string) => string;
/** Ball id → "Group N" label, or `null` on a single-group round (Phase 3.5). */
export type GroupOf = (ballId: string) => string | null;
export type ResultRenderMode = 'product' | 'verification';
export interface ResultRenderOptions {
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
    if (row.kind === 'category') return 'lb-c-cat';
    return '';
}
function rowClass(row: GridRow): string {
    const classes = [row.kind === 'category' ? 'lb-r-cat' : `lb-r-${row.kind}`];
    if (row.kind === 'si' || row.kind === 'given') classes.push('lb-r-dim');
    if (row.team) classes.push(`lb-team-${row.team}`);
    return classes.join(' ');
}

/** Resolve a cell's deciding-ball marker template → the CSS modifier the
 * `.lb-mark--<template>` rules style. Reads the presentation-vocabulary
 * `marker.template` (`ring` | `double_ring` | `diamond` | …). */
function cellMarkerTemplate(c: GridCell | undefined): string | null {
    if (!c) return null;
    if (c.marker) return c.marker.template;
    return null;
}
function cellMarkerToneClass(c: GridCell | undefined): string {
    const tone = c?.marker?.tone;
    return tone === 'success' || tone === 'warning' || tone === 'danger' ? ` lb-mark-tone--${tone}` : '';
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

function productSubtitleFacts(facts: string[]): string[] {
    return facts.filter((fact) => {
        if (fact.startsWith('slot #')) return false;
        if (/^CH -?\d/.test(fact)) return false;
        if (/^PH -?\d/.test(fact)) return false;
        return true;
    });
}

function renderScoreGridBase(
    section: ScoreGridSection,
    routeSections: RouteSectionRef[],
    nameOf: NameOf,
    opts: { mode: ResultRenderMode; cardModifier?: string },
): string {
    const groups = groupColumns(section.holes, routeSections);

    // Each hole-group (front 9 / back 9) renders as its OWN stacked table block so
    // an 18-hole card never scrolls sideways — the traditional mobile scorecard.
    const renderBlock = (g: (typeof groups)[number]): string => {
        const header = `<tr><th class="lb-rowlabel">Hole</th>${g.holes
            .map((h) => `<th>${esc(h.occurrenceLabel)}</th>`)
            .join('')}<th class="lb-sum">${esc(g.label)}</th></tr>`;

        const body = section.rows
            .map((row) => {
                const cells = new Map(row.cells.map((c) => [c.playHoleId, c]));
                const emph = (str: string): string => (row.emphasis ? `<strong>${str}</strong>` : str);
                const cellsHtml = g.holes
                    .map((h) => {
                        const c = cells.get(h.playHoleId);
                        const title = c?.title ? ` title="${esc(c.title)}"` : '';
                        const text = emph(esc(c?.display ?? ''));
                        // A deciding-ball marker draws a shape (ring / double_ring /
                        // diamond) around the score; a per-cell team (the standing row)
                        // draws a filled colour pill. The marker's `label` carries the
                        // golf meaning ("Down-team eagle, +5") — surface it as the
                        // marker's tooltip + aria-label so the shape isn't opaque.
                        const markTemplate = cellMarkerTemplate(c);
                        const markTone = cellMarkerToneClass(c);
                        const markLabel = c?.marker?.label;
                        const markAttrs = markLabel
                            ? ` title="${esc(markLabel)}" aria-label="${esc(markLabel)}"`
                            : '';
                        let inner = markTemplate
                            ? `<span class="lb-mark lb-mark--${markTemplate}${markTone}"${markAttrs}>${text}</span>`
                            : text;
                        if (c?.team) inner = `<span class="lb-pill lb-pill--${c.team}">${text}</span>`;
                        return `<td class="${cellClass(row)}"${title}>${inner}</td>`;
                    })
                    .join('');
                const sub = `<td class="lb-sum">${emph(groupSubtotal(row, g.playHoleIds))}</td>`;
                const label = row.subjectBallId
                    ? esc(nameOf(row.subjectBallId)) + (row.label ? ' ' + esc(row.label) : '')
                    : esc(row.label);
                return `<tr class="${rowClass(row)}"><th class="lb-rowlabel">${label}</th>${cellsHtml}${sub}</tr>`;
            })
            .join('');

        return `<div class="lb-card__scroll"><table class="lb-grid"><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
    };
    const blocks = groups.map((g) => renderBlock(g)).join('');

    const title = section.title.groups
        .map((g) => g.map((id) => esc(nameOf(id))).join(' & '))
        .filter(Boolean)
        .join(section.title.joiner);
    const subtitleFacts = opts.mode === 'verification' ? section.subtitleFacts : productSubtitleFacts(section.subtitleFacts);
    const subtitle = subtitleFacts.length
        ? `<div class="lb-card__sub">${subtitleFacts.map(esc).join(' · ')}</div>`
        : '';
    // Per-hole arithmetic (how each hole's points were earned) — a labelled,
    // full-width block so it's visible on touch (where cell hover tooltips aren't).
    const footnotes = opts.mode === 'verification' && section.footnotes.length
        ? `<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${section.footnotes
              .map((n) => `<span class="lb-card__note">${esc(n)}</span>`)
              .join('')}</div>`
        : '';
    const caption = opts.mode === 'verification' && section.caption ? `<p class="lb-card__caption">${esc(section.caption)}</p>` : '';
    const totals = section.totals.length
        ? `<ul class="lb-card__totals">${section.totals
              .map((tt) => `<li>${esc(tt.label)} = <strong>${tt.value ?? '—'}</strong></li>`)
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
    return renderScoreGridBase(section, routeSections, nameOf, opts);
}

function renderCompactMatchGrid(
    section: ScoreGridSection,
    routeSections: RouteSectionRef[],
    nameOf: NameOf,
    opts: { mode: ResultRenderMode },
): string {
    return renderScoreGridBase(section, routeSections, nameOf, { ...opts, cardModifier: 'lb-card--compact-match' });
}

function renderCategoryMatrixGrid(
    section: ScoreGridSection,
    routeSections: RouteSectionRef[],
    nameOf: NameOf,
    opts: { mode: ResultRenderMode },
): string {
    return renderScoreGridBase(section, routeSections, nameOf, { ...opts, cardModifier: 'lb-card--category-matrix' });
}

/**
 * The entry's group label, when every ball in it (own-ball or team) shares
 * ONE group — mixed-group teams shouldn't happen (the compiler rejects
 * cross-group team balls per §3), but a defensive mismatch just omits the
 * label rather than guessing.
 */
function entryGroupLabel(ballIds: readonly string[], groupOf: GroupOf): string | null {
    const labels = new Set(ballIds.map(groupOf));
    if (labels.size !== 1) return null;
    return [...labels][0] ?? null;
}

/**
 * A ranked entry's live-board pace delta — the metric relative to its
 * playing-to-pace baseline over that entry's own thru-N, which is WHY the
 * server ordered the board this way (a team ahead of pace ranks above one
 * behind it even on fewer holes). `E` when even (0), a signed number otherwise
 * (real minus sign).
 *
 * It gets its OWN column rather than trailing the total: run together in one
 * cell, "33 −3" reads as a single mangled number ("33-3"). Two columns with
 * their own headers is how every golf board (and Golf GameBook) does it.
 *
 * ONE sign convention, golf's: `+N` always means N WORSE than playing to
 * expectation, `−N` better. The raw `paceDelta` is `total − target`, so a
 * `high` metric (stableford points: more is better) is negated for display —
 * 33 points off a 36 pace shows `+3`, matching how every board (and a
 * scorecard's to-par) reads. `low` metrics (gross strokes) already run that
 * way and display raw.
 */
function paceText(paceDelta: number): string {
    return paceDelta === 0 ? 'E' : paceDelta > 0 ? `+${paceDelta}` : `−${Math.abs(paceDelta)}`;
}

/** Raw delta → the displayed, worse-is-positive value. */
function displayPace(paceDelta: number, direction: RankedSection['direction']): number {
    return direction === 'high' ? -paceDelta : paceDelta;
}

function paceCell(paceDelta: number | undefined, direction: RankedSection['direction']): string {
    if (paceDelta === undefined) return '<td class="lb-rank__pace"></td>';
    const shown = displayPace(paceDelta, direction);
    const tone = shown === 0 ? 'even' : shown > 0 ? 'over' : 'under';
    return `<td class="lb-rank__pace lb-rank__pace--${tone}">${esc(paceText(shown))}</td>`;
}

function renderRanked(section: RankedSection, nameOf: NameOf, groupOf: GroupOf = noGroup): string {
    // The pace column exists only for metrics whose descriptor declares a pace
    // baseline — a non-pace board (gross strokes, say) keeps its old 4 columns.
    const hasPace = section.entries.some((e) => e.paceDelta !== undefined);
    const rows = section.entries
        .map((e) => {
            const group = entryGroupLabel(e.ballIds, groupOf);
            const groupTag = group ? ` <span class="lb-rank__group">${esc(group)}</span>` : '';
            return `<tr class="${e.position === 1 ? 'lb-rank__lead' : ''}">
  <td class="lb-rank__pos">${e.position}</td>
  <td class="lb-rank__who"><span class="lb-rank__whobox"><span class="lb-rank__name">${esc(e.ballIds.map(nameOf).join(' & '))}</span>${groupTag}</span></td>
  <td class="lb-rank__total">${e.total ?? '—'}</td>${hasPace ? `\n  ${paceCell(e.paceDelta, section.direction)}` : ''}
  <td class="lb-rank__thru">${e.holesPlayed}</td>
</tr>`;
        })
        .join('');
    const paceCol = hasPace ? '\n      <col class="lb-rank__col-pace">' : '';
    const paceHead = hasPace ? '<th class="lb-rank__pace">Pace</th>' : '';
    return `<div class="lb-section">
  <h4 class="lb-section__title">${esc(section.metricLabel)}</h4>
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
    const panels = section.matches
        .map((m) => {
            const aNames = esc(m.sideA.ballIds.map(nameOf).join(' & '));
            const bNames = esc(m.sideB.ballIds.map(nameOf).join(' & '));
            const standing = m.magnitude === 0 ? 'AS' : `${m.magnitude} UP`;
            const status = m.finished ? 'Final' : `thru ${m.thru}`;
            const aLead = m.leader === 'a' ? ' lb-mp__team--lead' : '';
            const bLead = m.leader === 'b' ? ' lb-mp__team--lead' : '';
            return `<div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a${aLead}">${aNames}</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">${esc(standing)}</span><span class="lb-mp__status">${esc(status)}</span></div>
    <div class="lb-mp__team lb-mp__team--b${bLead}">${bNames}</div>
  </div>`;
        })
        .join('');
    return `<div class="lb-section">
  <h4 class="lb-section__title">${esc(section.title)}</h4>${panels}
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

/** Missing means `default-score-grid`. */
function scoreGridComponentId(section: ScoreGridSection): ScoreGridComponentId {
    return section.componentId ?? 'default-score-grid';
}

function diagnostic(kind: string): string {
    return `<div class="lb-diag">Unrenderable result section <code>${esc(kind)}</code> — no generic view yet. Results are not hidden.</div>`;
}

function gridDiagnostic(componentId: string): string {
    return `<div class="lb-diag">Unsupported score-grid component <code>${esc(componentId)}</code> — no generic view yet. Results are not hidden.</div>`;
}

/** Dispatch one leaderboard section through {@link sectionRegistry}. */
function renderLeaderboardSection(section: LeaderboardSection, nameOf: NameOf, groupOf: GroupOf): string {
    // Contained dispatcher cast: the registry is typed per-kind on definition;
    // the lookup widens to "any leaderboard renderer, or none" so an unknown
    // runtime kind falls through to a visible diagnostic instead of throwing.
    const render = (
        sectionRegistry as Record<string, SectionRenderer<LeaderboardSection> | undefined>
    )[section.kind];
    return render ? render(section, nameOf, groupOf) : diagnostic(section.kind);
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
export function renderSlotLeaderboard(slot: SlotResultView, nameOf: NameOf, groupOf: GroupOf = noGroup): string {
    if (slot.leaderboard.length === 0 && slot.cards.length === 0) {
        return `<div class="lb-empty">No scores entered yet for ${esc(slot.formatLabel)}.</div>`;
    }
    const sections = slot.leaderboard.map((sec) => renderLeaderboardSection(sec, nameOf, groupOf)).join('');
    return sections || `<div class="lb-empty">No leaderboard metric for ${esc(slot.formatLabel)}.</div>`;
}

/** Scorecard-area cards for one slot (the format-aware "full scorecard"). */
export function renderSlotCards(
    slot: SlotResultView,
    routeSections: RouteSectionRef[],
    nameOf: NameOf,
    options: ResultRenderOptions = {},
): string {
    if (slot.cards.length === 0) return '';
    const mode = options.mode ?? 'product';
    return slot.cards.map((c) => renderScoreGridSection(c, routeSections, nameOf, { mode })).join('\n');
}
