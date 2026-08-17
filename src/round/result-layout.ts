// Platform-neutral result LAYOUT fold (N3).
//
// ONE place turns the server's result contract (`SlotResultView` sections) into
// a layout tree: which columns exist, how they group into the round's frozen
// route sections, what text sits in each cell, which cells carry a decoration,
// what each subtotal / TOT / pace value reads. Renderers are thin adapters that
// walk this tree and emit their own markup:
//
//   src/round/result-render.ts          → the web (HTML string) renderer
//   scripts/render/sections/result.ts   → the static verification oracle
//   (N4)                                → the native renderer
//
// The tree is LAYOUT, never pixels: no class names, no HTML, no fonts. It is
// plain JSON (`JSON.parse(JSON.stringify(tree))` round-trips) so a non-JS
// client can consume exactly this shape. All strings are RAW — escaping is the
// emitting adapter's job, because where an adapter escapes decides its bytes.
//
// Nothing here reimplements a scoring rule and nothing branches on a format id:
// every value, note, total and idiom string already came from the server.
//
// Lives under `src/` because `src/` must not import `server/`, while `scripts/`
// (type-checked by tsconfig.server.json, which includes `scripts`) may import
// `src/`. The input interfaces below are therefore a STRUCTURAL mirror of the
// contract — they must stay assignable from BOTH
// `server/domain/strategies/result-sections.ts` (oracle side) and
// `src/api/friendly-rounds.gen.ts` (client side), so they intentionally declare
// only the fields the fold reads, at their widest useful type.

// --- contract input (structural mirror; see header) --------------------------

export interface ViewHoleRef {
    playHoleId: string;
    canonicalOrdinal: number;
    occurrenceLabel: string;
}

export interface ViewRouteSectionRef {
    label: string;
    fromCanonicalOrdinal: number;
    toCanonicalOrdinal: number;
}

export interface ViewGridCell {
    playHoleId: string;
    value: number | null;
    display?: string;
    title?: string;
    marker?: { template: string; tone?: string; label?: string };
    team?: 'a' | 'b';
}

export interface ViewGridRow {
    label: string;
    subjectBallId?: string;
    kind: string;
    cells: readonly ViewGridCell[];
    aggregate: 'sum' | 'last' | 'none';
    emphasis?: boolean;
    team?: 'a' | 'b';
}

export interface ViewScoreGridSection {
    componentId?: string;
    title: { groups: string[][]; joiner: string };
    /**
     * The card's subject balls — its ATTACHMENT key. Required in both sources
     * (`ScoreGridSection` and the generated client type), so it is required
     * here too.
     */
    subjectBallIds: readonly string[];
    holes: readonly ViewHoleRef[];
    subtitleFacts: readonly string[];
    rows: readonly ViewGridRow[];
    footnotes: readonly string[];
    caption?: string;
    totals: readonly { label: string; value: number | null }[];
}

export interface ViewRankedEntry {
    ballIds: readonly string[];
    total: number | null;
    holesPlayed: number;
    paceDelta?: number;
    position: number;
}

export interface ViewRankedSection {
    metricLabel: string;
    direction?: 'high' | 'low';
    entries: readonly ViewRankedEntry[];
}

export interface ViewMatchPanel {
    sideA: { ballIds: readonly string[] };
    sideB: { ballIds: readonly string[] };
    leader: 'a' | 'b' | null;
    magnitude: number;
    finished: boolean;
    thru: number;
    closeOutRemaining?: number | null;
}

export interface ViewMatchSummarySection {
    title: string;
    matches: readonly ViewMatchPanel[];
}

/** Ball id → display name. Supplied by the adapter (it owns ball metadata). */
export type NameOf = (ballId: string) => string;
/** Ball id → "Group N" label, or `null` on a single-group round (Phase 3.5). */
export type GroupOf = (ballId: string) => string | null;

/**
 * `product` hides the internal/verification facts (slot index, CH/PH) a live
 * board has no use for; `verification` keeps everything the server sent.
 */
export type ResultRenderMode = 'product' | 'verification';

// --- layout tree -------------------------------------------------------------

/** One scorecard column, already resolved to its header text. */
export interface ColumnLayout {
    label: string;
}

/**
 * A column group = one frozen route section (OUT / IN / …), or the single `TOT`
 * fallback when the round declares none. An adapter may stack one table per
 * group (web: never scroll an 18-hole card sideways) or lay them side by side in
 * one table (oracle) — the grouping itself is decided here, once.
 */
export interface ColumnGroupLayout {
    label: string;
    columns: ColumnLayout[];
}

/** What decorates a cell's value. The visual meaning rides in `label`. */
export type CellDecorationLayout =
    | { kind: 'plain' }
    /** Per-cell team tint on an undecorated value (the round pill). */
    | { kind: 'pill'; team: 'a' | 'b' }
    /**
     * A score marker draws a shape around the value. With a team, the shape
     * itself takes the team fill — never a shape nested in a pill.
     */
    | {
          kind: 'marker';
          template: string;
          /** Only the toned intents an adapter styles; others collapse to null. */
          tone: 'success' | 'warning' | 'danger' | null;
          label: string | null;
          teamFill: 'a' | 'b' | null;
      };

export interface CellLayout {
    /** Cell text; `''` when the row has no cell for this column. */
    text: string;
    title: string | null;
    decoration: CellDecorationLayout;
}

/** One row's cells inside one column group, plus that group's subtotal. */
export interface RowGroupLayout {
    cells: CellLayout[];
    subtotal: string;
}

export interface GridRowLayout {
    /** Contract row kind (`par` / `si` / `gross` / …) — a styling hint only. */
    kind: string;
    emphasis: boolean;
    team: 'a' | 'b' | null;
    /**
     * Resolved subject name, or null when the row labels itself.
     *
     * `subjectName` and `labelText` stay SEPARATE parts so an adapter can style
     * them apart (bold name, dim qualifier). The canonical composition for a
     * NEW renderer is the web one — `name + (label ? ' ' + label : '')`: a row
     * with a subject but no label text must not gain a trailing space. The
     * oracle's `` `${name} ${label}` `` (always a space) is LEGACY DRIFT kept
     * only because its bytes are pinned by the verification baseline; do not
     * copy it.
     */
    subjectName: string | null;
    labelText: string;
    /** Parallel to `ScoreGridLayout.columnGroups`. */
    groups: RowGroupLayout[];
    /** Whole-card total (the TOT column) — rendered by adapters that show one. */
    total: string;
}

export interface ScoreGridLayout {
    componentId: string;
    /**
     * The card's subject balls, carried through UNRESOLVED (ids, not names) —
     * names are already in `title`. An adapter needs the ids to ask
     * {@link attachmentFor} where this card belongs on a Gamebook-style board.
     */
    subjectBallIds: string[];
    /**
     * Resolved names per title group; the adapter escapes each name, joins the
     * names WITHIN a group with `nameJoiner`, and joins the groups with
     * `joiner`. Both separators are DATA so no adapter hardcodes a literal —
     * `joiner` comes from the contract (the format's own idiom, `' vs. '`),
     * `nameJoiner` is this fold's house separator for teammates.
     */
    title: { groups: string[][]; joiner: string; nameJoiner: string };
    subtitleFacts: string[];
    /**
     * `footnotes` and `caption` are carried in EVERY mode. Unlike
     * `subtitleFacts` (whose product filtering is a layout rule, so it lives
     * here), gating these two on verification mode is deliberately adapter-side
     * page chrome: whether a board has room for a per-hole arithmetic block or
     * a caption is a decision about the page, not about the card's layout.
     */
    footnotes: string[];
    caption: string | null;
    /** `value` is already the display string (`—` for a missing total). */
    totals: { label: string; value: string }[];
    columnGroups: ColumnGroupLayout[];
    /** A TOT column is meaningful only when more than one group exists. */
    hasTotalColumn: boolean;
    rows: GridRowLayout[];
}

export interface RankedEntryLayout {
    position: number;
    /** `position === 1` — the board's leader row. */
    lead: boolean;
    name: string;
    group: string | null;
    total: string;
    holesPlayed: number;
    pace: { text: string; tone: 'even' | 'over' | 'under' } | null;
}

export interface RankedLayout {
    kind: 'ranked';
    metricLabel: string;
    /** True when ANY entry has a pace — the whole board grows the column. */
    hasPace: boolean;
    entries: RankedEntryLayout[];
}

export interface MatchPanelLayout {
    sideAName: string;
    sideBName: string;
    leader: 'a' | 'b' | null;
    /** `AS` or `N UP`. */
    standing: string;
    /** `Final` or `thru N`. */
    status: string;
}

export interface MatchSummaryLayout {
    kind: 'match_summary';
    title: string;
    matches: MatchPanelLayout[];
}

export type LeaderboardSectionLayout = RankedLayout | MatchSummaryLayout;

// --- column grouping ---------------------------------------------------------

interface ColumnGroupInternal {
    label: string;
    holes: ViewHoleRef[];
    /** Stable column identities in this group — drives cell filtering. */
    playHoleIds: Set<string>;
}

/**
 * Group scorecard columns by the round's frozen route sections: a column
 * belongs to the section whose `[fromCanonicalOrdinal, toCanonicalOrdinal]`
 * range contains its `canonicalOrdinal`. Columns are ordered by
 * `canonicalOrdinal`; a column inside no section is dropped, an empty section
 * renders no group. With no route sections at all, fall back to a single TOT
 * group over every column.
 */
function groupColumns(
    holes: readonly ViewHoleRef[],
    routeSections: readonly ViewRouteSectionRef[],
): ColumnGroupInternal[] {
    const ordered = [...holes].sort((a, b) => a.canonicalOrdinal - b.canonicalOrdinal);
    if (routeSections.length === 0) {
        return [{ label: 'TOT', holes: ordered, playHoleIds: new Set(ordered.map((h) => h.playHoleId)) }];
    }
    const sections = [...routeSections].sort((a, b) => a.fromCanonicalOrdinal - b.fromCanonicalOrdinal);
    const groups: ColumnGroupInternal[] = [];
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

/** A group's subtotal for one row, per the row's declared aggregate. */
function groupSubtotal(row: ViewGridRow, playHoleIds: Set<string>): string {
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

/**
 * The whole-card total. A `sum` row adds every cell (including any outside the
 * groups); a `last` row carries the final group's running value forward.
 */
function totColumn(row: ViewGridRow, groups: ColumnGroupInternal[]): string {
    if (row.aggregate === 'sum') {
        const all = row.cells.map((c) => c.value).filter((v): v is number => v !== null);
        return all.length === 0 ? '—' : String(all.reduce((a, b) => a + b, 0));
    }
    if (row.aggregate === 'last') {
        const last = groups[groups.length - 1];
        return last ? groupSubtotal(row, last.playHoleIds) : '—';
    }
    return '—';
}

function decorate(cell: ViewGridCell | undefined): CellDecorationLayout {
    const marker = cell?.marker;
    if (marker) {
        const tone = marker.tone;
        return {
            kind: 'marker',
            template: marker.template,
            tone: tone === 'success' || tone === 'warning' || tone === 'danger' ? tone : null,
            // Empty label ⇒ no label at all: every adapter tests it for TRUTH,
            // so an empty string must not survive as a rendered attribute.
            label: marker.label ? marker.label : null,
            teamFill: cell?.team ?? null,
        };
    }
    if (cell?.team) return { kind: 'pill', team: cell.team };
    return { kind: 'plain' };
}

/** Facts a live board hides: the slot index and the handicap arithmetic. */
function productSubtitleFacts(facts: readonly string[]): string[] {
    return facts.filter((fact) => {
        if (fact.startsWith('slot #')) return false;
        if (/^HCP -?\d/.test(fact)) return false;
        if (/^PH -?\d/.test(fact)) return false;
        return true;
    });
}

/**
 * How two names read together INSIDE one title group / ranked entry (the
 * teammates of one ball). The contract's own `joiner` separates the groups.
 * Emitted as layout data rather than left to each adapter's literal.
 */
const NAME_JOINER = ' & ';

/** Missing means `default-score-grid`. */
export function scoreGridComponentId(section: ViewScoreGridSection): string {
    return section.componentId ?? 'default-score-grid';
}

/** Fold one scorecard card into its layout tree. */
export function layoutScoreGrid(
    section: ViewScoreGridSection,
    routeSections: readonly ViewRouteSectionRef[],
    nameOf: NameOf,
    opts: { mode?: ResultRenderMode } = {},
): ScoreGridLayout {
    const groups = groupColumns(section.holes, routeSections);
    const mode = opts.mode ?? 'product';

    const rows = section.rows.map((row): GridRowLayout => {
        const byPlayHole = new Map(row.cells.map((c) => [c.playHoleId, c]));
        return {
            kind: row.kind,
            emphasis: row.emphasis === true,
            team: row.team ?? null,
            subjectName: row.subjectBallId ? nameOf(row.subjectBallId) : null,
            labelText: row.label,
            groups: groups.map((g): RowGroupLayout => ({
                cells: g.holes.map((h): CellLayout => {
                    const cell = byPlayHole.get(h.playHoleId);
                    return {
                        text: cell?.display ?? '',
                        // Empty title ⇒ no tooltip (adapters test for truth).
                        title: cell?.title ? cell.title : null,
                        decoration: decorate(cell),
                    };
                }),
                subtotal: groupSubtotal(row, g.playHoleIds),
            })),
            total: totColumn(row, groups),
        };
    });

    return {
        componentId: scoreGridComponentId(section),
        subjectBallIds: [...section.subjectBallIds],
        title: {
            groups: section.title.groups.map((g) => g.map((id) => nameOf(id))),
            joiner: section.title.joiner,
            nameJoiner: NAME_JOINER,
        },
        subtitleFacts:
            mode === 'verification' ? [...section.subtitleFacts] : productSubtitleFacts(section.subtitleFacts),
        footnotes: [...section.footnotes],
        caption: section.caption ?? null,
        totals: section.totals.map((t) => ({ label: t.label, value: String(t.value ?? '—') })),
        columnGroups: groups.map((g) => ({ label: g.label, columns: g.holes.map((h) => ({ label: h.occurrenceLabel })) })),
        hasTotalColumn: groups.length > 1,
        rows,
    };
}

// --- card attachment (Gamebook boards) ---------------------------------------

/**
 * Where a scorecard card belongs on a Gamebook-style leaderboard: folded into a
 * ranked row (`attached`, with that row's index in `entries`) or shown on its
 * own (`standalone`).
 */
export type CardAttachment = { kind: 'attached'; entryIndex: number } | { kind: 'standalone' };

/** Order-insensitive set key for a subject / entry's ball ids. */
function subjectKey(ballIds: readonly string[]): string {
    return [...new Set(ballIds)].sort().join(' ');
}

/**
 * Classify each card against a ranked section's entries — the STRUCTURAL rule,
 * and the only rule:
 *
 *   a card that maps 1:1 to a ranked entry attaches to that row;
 *   ANYTHING else stays standalone.
 *
 * "1:1" means the card's subject ball ids are exactly the entry's `ballIds` as
 * a SET (order and repetition are not identity), AND that pairing is
 * unambiguous in both directions: exactly one entry carries that subject and
 * exactly one card claims it. A subjectless card, a card no entry matches, two
 * cards over the same subject, two entries over the same subject — all
 * standalone. Ambiguity is NEVER guessed: showing a card on its own is
 * always correct, attaching it to the wrong row is not.
 *
 * Pure and total: the returned array is parallel to `cards`, one verdict each.
 * The parameters are the widest shape that carries an identity, so it accepts
 * raw contract sections, folded {@link ScoreGridLayout}s, or anything else with
 * these fields.
 *
 * FUTURE SEAM (not built): when a format plugin declares an explicit
 * `presentation: 'attached' | 'standalone'` on a card (absent = this structural
 * rule), that declaration is honoured HERE, before the structural match runs —
 * one branch at the top of the loop, no format ids anywhere.
 */
export function attachmentFor(
    cards: readonly { readonly subjectBallIds: readonly string[] }[],
    entries: readonly { readonly ballIds: readonly string[] }[],
): CardAttachment[] {
    const entryIndexByKey = new Map<string, number | null>();
    entries.forEach((entry, index) => {
        if (entry.ballIds.length === 0) return;
        const key = subjectKey(entry.ballIds);
        // Second entry over the same subject ⇒ the key is ambiguous forever.
        entryIndexByKey.set(key, entryIndexByKey.has(key) ? null : index);
    });

    const cardCountByKey = new Map<string, number>();
    for (const card of cards) {
        if (card.subjectBallIds.length === 0) continue;
        const key = subjectKey(card.subjectBallIds);
        cardCountByKey.set(key, (cardCountByKey.get(key) ?? 0) + 1);
    }

    return cards.map((card): CardAttachment => {
        if (card.subjectBallIds.length === 0) return { kind: 'standalone' };
        const key = subjectKey(card.subjectBallIds);
        if ((cardCountByKey.get(key) ?? 0) !== 1) return { kind: 'standalone' };
        const entryIndex = entryIndexByKey.get(key);
        if (entryIndex === undefined || entryIndex === null) return { kind: 'standalone' };
        return { kind: 'attached', entryIndex };
    });
}

// --- ranked ------------------------------------------------------------------

/**
 * The entry's group label, when every ball in it (own-ball or team) shares ONE
 * group — mixed-group teams shouldn't happen (the compiler rejects cross-group
 * team balls per §3), but a defensive mismatch omits the label rather than
 * guessing.
 */
function entryGroupLabel(ballIds: readonly string[], groupOf: GroupOf): string | null {
    const labels = new Set(ballIds.map(groupOf));
    if (labels.size !== 1) return null;
    return [...labels][0] ?? null;
}

/**
 * ONE sign convention, golf's: `+N` always means N WORSE than playing to
 * expectation, `−N` better. The raw `paceDelta` is `total − target`, so a
 * `high` metric (stableford points: more is better) is negated for display —
 * 33 points off a 36 pace shows `+3`. `low` metrics (gross strokes) already run
 * that way and display raw. `E` when even (real minus sign otherwise).
 */
function paceLayout(
    paceDelta: number | undefined,
    direction: ViewRankedSection['direction'],
): RankedEntryLayout['pace'] {
    if (paceDelta === undefined) return null;
    const shown = direction === 'high' ? -paceDelta : paceDelta;
    return {
        text: shown === 0 ? 'E' : shown > 0 ? `+${shown}` : `−${Math.abs(shown)}`,
        tone: shown === 0 ? 'even' : shown > 0 ? 'over' : 'under',
    };
}

const noGroup: GroupOf = () => null;

/** Fold one ranked metric board into its layout tree. */
export function layoutRanked(
    section: ViewRankedSection,
    nameOf: NameOf,
    groupOf: GroupOf = noGroup,
): RankedLayout {
    return {
        kind: 'ranked',
        metricLabel: section.metricLabel,
        // The pace column exists only for metrics whose descriptor declares a
        // pace baseline — a non-pace board keeps its plain columns.
        hasPace: section.entries.some((e) => e.paceDelta !== undefined),
        entries: section.entries.map((e): RankedEntryLayout => ({
            position: e.position,
            lead: e.position === 1,
            name: e.ballIds.map(nameOf).join(NAME_JOINER),
            group: entryGroupLabel(e.ballIds, groupOf),
            total: String(e.total ?? '—'),
            holesPlayed: e.holesPlayed,
            pace: paceLayout(e.paceDelta, section.direction),
        })),
    };
}

// --- match summary -----------------------------------------------------------

/** Fold one match-summary section into its layout tree. */
export function layoutMatchSummary(section: ViewMatchSummarySection, nameOf: NameOf): MatchSummaryLayout {
    return {
        kind: 'match_summary',
        title: section.title,
        matches: section.matches.map((m): MatchPanelLayout => ({
            sideAName: m.sideA.ballIds.map(nameOf).join(NAME_JOINER),
            sideBName: m.sideB.ballIds.map(nameOf).join(NAME_JOINER),
            leader: m.leader,
            // A closed-out match reads as the golf scoreline ("3 & 2"), never
            // as a still-running lead.
            standing:
                m.magnitude === 0
                    ? 'AS'
                    : m.finished && m.closeOutRemaining != null
                      ? `${m.magnitude} & ${m.closeOutRemaining}`
                      : `${m.magnitude} UP`,
            status: m.finished ? 'Final' : `thru ${m.thru}`,
        })),
    };
}
