// Result render contract — presentation-only vocabulary (Phase 0).
//
// This module is the SINGLE source of truth for the closed visual vocabulary a
// format plugin may emit into result sections. It exists so the result contract
// can describe *how a cell/row should look* without leaking format-specific
// scoring idiom (e.g. `mark: "win5"`) into the shared types.
//
// Hard rules (see docs/proposals/result-render-contract-plan.md):
//   1. PRESENTATION-DOMAIN ONLY. Allowed: abstract visual forms (`ring`,
//      `diamond`, `badge`), tones, emphasis. BANNED: golf words (`birdie`,
//      `bogey`, `albatross`, `win5`). Golf meaning rides as a *choice of token +
//      a human `label` string*, never as an enum/token name.
//   2. CLOSED unions for the known vocabulary. The only escape is explicit and
//      greppable: `marker.custom(id, …)` for a one-off visual. No `| string`
//      widening of a closed field (an invisible escape you can't grep is a leak,
//      not a valve).
//   3. SMART CONSTRUCTORS are the intended API. Formats build markers/cells via
//      the `marker` / `cell` helpers below, not hand-written literals — so
//      autocomplete is the menu and invalid combos don't compile.
//   4. The vocabulary grows CENTRALLY and RARELY — only for a genuinely new
//      *visual form* no existing shape expresses. Each new template is one edit
//      here, guarded by the exhaustive `assertNever` switch.
//
// Phase 0 status: this vocabulary is defined and unit-tested but NOT yet wired
// into the live `result-sections.ts` / `result-builder.ts` output. Nothing emits
// it; no pixels move. Wiring happens in later phases.

// --- closed presentation unions -------------------------------------------

/**
 * Abstract colour intent for a cell, row, or marker. The consumer maps each
 * tone to its own palette (mobile / print / dark) — the server never sends a
 * hex colour.
 *
 * Use when:
 * - `neutral` — default; no special meaning (omit `tone` entirely for this).
 * - `side_a` / `side_b` — the two sides of a head-to-head (match, taliban).
 *   Which side is "home" is the consumer's choice; the server only says which
 *   of the two an element belongs to.
 * - `success` — a positive/decided outcome worth highlighting (a won hole).
 * - `warning` — a caution-level state (e.g. provisional / unconfirmed).
 * - `danger` — a negative/penalty state (e.g. a blow-up hole, a DQ).
 */
export type Tone = 'neutral' | 'side_a' | 'side_b' | 'success' | 'warning' | 'danger';

/**
 * The visual FORM of a cell marker — the shape drawn on/around a score. This is
 * a closed set of abstract forms; golf meaning is carried by the marker's
 * `label`, never by adding a new form per golf concept.
 *
 * Use when:
 * - `ring` — a single outline around a score: a single-unit decided result
 *   (e.g. a hole won by one).
 * - `double_ring` — a doubled outline: a two-unit decided result (a hole worth
 *   +2). Reach for this only when "more emphatic than a ring" is the intent.
 * - `diamond` — a distinct standout shape: a rare/high-magnitude decided result
 *   (e.g. a hole worth +5). The strongest of the "decided result" forms.
 * - `dot` — a small filled marker: a lightweight per-hole flag (e.g. a category
 *   was won here) where a full ring would be too heavy.
 * - `badge` — a small pill carrying short text (`label`/`value`): a labelled
 *   status that needs a word or number, not just a shape.
 * - `box_badge` — a sharp-corner badge carrying short text/number: an angular
 *   labelled state, useful when the visual must not read as a round marker.
 * - `square` — a single square outline: a one-step negative score relation.
 * - `double_square` — a doubled square outline: a stronger negative relation.
 *
 * For a one-off visual that none of these express, do NOT widen this union —
 * use `marker.custom(id, …)`, which is explicit and greppable.
 */
export type MarkerTemplate =
    | 'ring'
    | 'double_ring'
    | 'diamond'
    | 'dot'
    | 'badge'
    | 'box_badge'
    | 'square'
    | 'double_square';

/** Every known marker template, in declaration order — drives exhaustiveness. */
export const MARKER_TEMPLATES: readonly MarkerTemplate[] = [
    'ring',
    'double_ring',
    'diamond',
    'dot',
    'badge',
    'box_badge',
    'square',
    'double_square',
];

/**
 * The presentation ROLE of a grid row. The consumer styles a row by its kind
 * but NEVER branches on a format id. This is the abstract render role, not the
 * golf metric: a "stableford points" row and a "match points" row are both
 * `points`.
 *
 * Use when:
 * - `par` — the course par reference row.
 * - `si` — the stroke-index reference row.
 * - `score` — a per-hole score row (gross, net, or any single score series).
 *   Whether it's gross/net/given is a label/tone choice, not a new kind.
 * - `points` — a per-hole points row (stableford, match, category points).
 * - `status` — a running standing / state row (`AS`, `2 UP`, a lead).
 * - `category` — a per-category marker row (umbrella-style matrices).
 * - `free` — anything that is none of the above; the catch-all.
 */
export type RowKind = 'par' | 'si' | 'score' | 'points' | 'status' | 'category' | 'free';

/**
 * How a row's cells are TEMPLATED for rendering — picks the cell renderer
 * without the consumer inferring it from row kind or format.
 *
 * Use when:
 * - `plain` — bare text/number, no decoration.
 * - `score` — a score value with standard score styling.
 * - `marked_score` — a score that may carry a `CellMarker` (decided-hole shapes).
 * - `status_pill` — a tinted pill (the running-standing row).
 * - `category_marker` — a thin per-category marker cell (dot/blank).
 */
export type CellTemplate = 'plain' | 'score' | 'marked_score' | 'status_pill' | 'category_marker';

/**
 * Id of a REGISTERED client score-grid renderer. This is the Layer-1 escape
 * hatch: a format with an unusual per-hole layout selects a different grid
 * component here instead of forcing its shape into the default scorecard.
 *
 * Closed by design — new grid components are added centrally (Phase 3+), never
 * via `| string` widening. A missing/`undefined` `componentId` means
 * `default-score-grid`.
 *
 * Use when:
 * - `default-score-grid` — the normal scorecard table (rows + OUT/IN/TOT
 *   totals). The default; emit nothing to get it.
 * - `compact-match-grid` — a match-card style grid: side-tinted player rows,
 *   deciding-score markers, and a compact standing row.
 * - `category-matrix-grid` — a dense category matrix: one row per category plus
 *   points/running rows, intended for category-accomplishment formats.
 */
export type ScoreGridComponentId =
    | 'default-score-grid'
    | 'compact-match-grid'
    | 'category-matrix-grid';

// --- marker descriptor -----------------------------------------------------

/** Fields shared by every marker, known-template or custom. */
interface MarkerBase {
    /** Optional colour intent for the marker itself (independent of cell tone). */
    tone?: Tone;
    /**
     * Human-readable explanation of what the marker means — THIS is where golf
     * idiom lives (`"Down-team eagle, +5"`). Shown as a tooltip/aria-label by
     * the consumer. Never encode meaning in the template name; put it here.
     */
    label?: string;
    /** Optional short text rendered inside the marker (mainly for `badge`). */
    value?: string;
}

/**
 * A cell marker drawn on/around a score. Discriminated by `template`: either one
 * of the closed {@link MarkerTemplate} forms, or the explicit `'custom'` escape
 * carrying a greppable `customId`.
 */
export type CellMarker =
    | (MarkerBase & { template: MarkerTemplate })
    | (MarkerBase & {
          /** The named visual escape — a one-off form not in {@link MarkerTemplate}. */
          template: 'custom';
          /**
           * Stable id of the one-off visual the consumer should draw. Explicit and
           * greppable on purpose: a custom marker is always findable, unlike a
           * `| string` widening of the closed template field.
           */
          customId: string;
      });

// --- vNext cell descriptor -------------------------------------------------
//
// A presentation-clean cell, defined here beside the vocabulary it uses. This
// is the vNext shape (`tone` + `marker` instead of `mark: "win5"`); it is NOT
// the current `GridCell` in result-sections.ts and is not wired into output yet.

/** Cell-construction inputs shared by the `cell.*` helpers. */
export interface CellInput {
    /** Column identity — aligns the cell to its `HoleRef` column. */
    playHoleId: string;
    /** Numeric value used for sum/last aggregation; null = nothing to add. */
    value: number | null;
    /** Rendered cell text (e.g. `"3"`, `"+2"`, `"AS"`). */
    display: string;
    /** Optional colour intent for the cell. */
    tone?: Tone;
    /** Optional hover annotation (arithmetic, category list). */
    title?: string;
    /** Optional decided-hole marker (use `marker.*` to build it). */
    marker?: CellMarker;
}

/**
 * vNext presentation-clean grid cell. Built via the `cell.*` smart constructors.
 * Distinct from the current `result-sections.ts` `GridCell` — the two coexist
 * during the migration; this one carries `tone`/`marker`, not `mark`.
 */
export interface VGridCell {
    playHoleId: string;
    value: number | null;
    display: string;
    tone?: Tone;
    title?: string;
    marker?: CellMarker;
}

// --- smart constructors: markers -------------------------------------------

function makeMarker(template: MarkerTemplate, opts: MarkerBase = {}): CellMarker {
    const m: CellMarker = { template };
    if (opts.tone !== undefined) m.tone = opts.tone;
    if (opts.label !== undefined) m.label = opts.label;
    if (opts.value !== undefined) m.value = opts.value;
    return m;
}

/**
 * Smart constructors for cell markers — the intended way formats produce
 * markers. Prefer these over hand-written literals: autocomplete lists the
 * available forms, and `marker.custom` is the only escape (explicit, greppable).
 */
export const marker = {
    /** Single outline — a single-unit decided result. See {@link MarkerTemplate}. */
    ring: (opts: MarkerBase = {}): CellMarker => makeMarker('ring', opts),
    /** Doubled outline — a two-unit decided result. */
    doubleRing: (opts: MarkerBase = {}): CellMarker => makeMarker('double_ring', opts),
    /** Standout shape — a rare/high-magnitude decided result. */
    diamond: (opts: MarkerBase = {}): CellMarker => makeMarker('diamond', opts),
    /** Small filled marker — a lightweight per-hole flag. */
    dot: (opts: MarkerBase = {}): CellMarker => makeMarker('dot', opts),
    /** Labelled pill — a status needing short text (`label`/`value`). */
    badge: (opts: MarkerBase = {}): CellMarker => makeMarker('badge', opts),
    /** Sharp-corner labelled badge — an angular status needing short text/number. */
    boxBadge: (opts: MarkerBase = {}): CellMarker => makeMarker('box_badge', opts),
    /** Single square outline — a one-step negative score relation. */
    square: (opts: MarkerBase = {}): CellMarker => makeMarker('square', opts),
    /** Doubled square outline — a stronger negative score relation. */
    doubleSquare: (opts: MarkerBase = {}): CellMarker => makeMarker('double_square', opts),
    /**
     * The named visual escape: a one-off form none of the closed templates
     * express. `id` is rendered by a registered custom visual on the consumer.
     * Use sparingly — if a custom form recurs, promote it to a real
     * {@link MarkerTemplate} centrally instead.
     */
    custom: (id: string, opts: MarkerBase = {}): CellMarker => {
        const m: CellMarker = { template: 'custom', customId: id };
        if (opts.tone !== undefined) m.tone = opts.tone;
        if (opts.label !== undefined) m.label = opts.label;
        if (opts.value !== undefined) m.value = opts.value;
        return m;
    },
} as const;

/**
 * Optional golf-aware helper that maps score-to-par into presentation markers.
 * The contract still carries only abstract marker templates; golf terms live in
 * the human-readable label. Formats opt in when they want house-consistent score
 * embellishments without inventing their own visual vocabulary.
 */
export function scoreToParMarker(input: { strokes: number | null; par: number | null }): CellMarker | undefined {
    const { strokes, par } = input;
    if (strokes === null || par === null || strokes <= 0) return undefined;
    const diff = strokes - par;
    if (diff === 0) return undefined;
    if (strokes === 1) return marker.diamond({ tone: 'success', label: 'Hole in one' });
    if (diff <= -3) return marker.diamond({ tone: 'success', label: `Albatross (${diff})` });
    if (diff === -2) return marker.doubleRing({ tone: 'success', label: 'Eagle (-2)' });
    if (diff === -1) return marker.ring({ tone: 'success', label: 'Birdie (-1)' });
    if (diff === 1) return marker.square({ tone: 'danger', label: 'Bogey (+1)' });
    if (diff === 2) return marker.doubleSquare({ tone: 'danger', label: 'Double bogey (+2)' });
    return marker.boxBadge({ tone: 'danger', label: `Triple bogey or worse (+${diff})`, value: `+${diff}` });
}

// --- smart constructors: cells ---------------------------------------------

/**
 * Smart constructors for grid cells. `cell.score` is the ergonomic default for
 * the common "a score, maybe with a marker" case.
 */
export const cell = {
    /** A score cell. Pass a `marker` (built via `marker.*`) for a decided hole. */
    score: (input: CellInput): VGridCell => {
        const c: VGridCell = {
            playHoleId: input.playHoleId,
            value: input.value,
            display: input.display,
        };
        if (input.tone !== undefined) c.tone = input.tone;
        if (input.title !== undefined) c.title = input.title;
        if (input.marker !== undefined) c.marker = input.marker;
        return c;
    },
} as const;

// --- exhaustiveness guard --------------------------------------------------

/**
 * Compile-time exhaustiveness guard. Call in the `default` branch of a `switch`
 * over a closed union so adding a new member without handling it fails to
 * compile. Throws at runtime if ever reached (it shouldn't be).
 */
export function assertNever(value: never): never {
    throw new Error(`Unhandled vocabulary member: ${JSON.stringify(value)}`);
}

/**
 * Exhaustive classification of marker templates by emphasis weight. Not routed
 * through any real renderer in Phase 0 — it exists to (a) demonstrate the
 * `assertNever` exhaustiveness pattern future leaf components must follow, and
 * (b) give the unit tests a closed-vocabulary switch to exercise. The mapping
 * stays presentation-level (no golf idiom).
 */
export function markerEmphasis(template: MarkerTemplate): 'light' | 'normal' | 'strong' {
    switch (template) {
        case 'dot':
            return 'light';
        case 'ring':
        case 'badge':
        case 'box_badge':
        case 'square':
            return 'normal';
        case 'double_ring':
        case 'diamond':
        case 'double_square':
            return 'strong';
        default:
            return assertNever(template);
    }
}
