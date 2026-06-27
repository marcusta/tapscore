// Result render contract — vNext section descriptors (Phase 0).
//
// These are the presentation-clean successors to the section types in
// `result-sections.ts`, defined BESIDE the current ones — added, not wired.
// They build on the closed vocabulary in `result-vocabulary.ts` (tones,
// markers, row/cell templates) instead of carrying format-shaped hints like
// `mark: "win5"`.
//
// IMPORTANT — why this is a SEPARATE module, not new fields on the current
// types: `RoundResult` and `ScoreGridSection` from `result-sections.ts` are
// reachable from the friendly-rounds API descriptor, so the codegen mirrors
// them into `src/api/*.gen.ts`. Adding/altering fields there would change the
// generated clients. Phase 0's invariant is "no generated API diff", so the
// vNext shapes live here, unreferenced by any API descriptor, until a later
// phase migrates output onto them.
//
// `JSON.parse(JSON.stringify(section))` must still round-trip identically once
// these are emitted: no functions, no class instances. Balls are referenced by
// id; the consumer resolves display names.

import type { GridAggregate, HoleRef } from './result-sections';
import type {
    CellTemplate,
    RowKind,
    ScoreGridComponentId,
    Tone,
    VGridCell,
} from './result-vocabulary';

/**
 * How a row labels itself. A plain string, a single ball's resolved name (with
 * optional suffix, e.g. `Alice` + ` Gross`), or several balls joined. The
 * consumer resolves ball ids → live names; the section stays name-agnostic.
 */
export type LabelSpec =
    | { text: string }
    | { ballId: string; suffix?: string }
    | { ballIds: string[]; joiner: string; suffix?: string };

/**
 * Card heading. Each group's ball names are joined by ` & `; the groups are
 * then joined by `joiner` (`' & '` for one side, `' vs. '` for a pair). The
 * consumer resolves ball ids → live names. Mirrors the current title shape so
 * the migration is a field swap, not a heading redesign.
 */
export interface TitleSpec {
    groups: string[][];
    joiner: string;
}

/**
 * vNext grid row. Carries presentation hints (`kind`, `cellTemplate`, `tone`,
 * `emphasis`) from the closed vocabulary so the consumer styles a row without
 * inferring intent from a format id. `cells` are vNext cells (`tone`/`marker`).
 */
export interface VGridRow {
    /** Stable row id (cells align to columns; rows align to this). */
    id: string;
    label: LabelSpec;
    kind: RowKind;
    aggregate: GridAggregate;
    /** Optional row-level colour intent. */
    tone?: Tone;
    /** Optional cell renderer selector; defaults are inferred from `kind`. */
    cellTemplate?: CellTemplate;
    /** Bold the row (team points, status). */
    emphasis?: boolean;
    cells: VGridCell[];
}

/**
 * vNext score-grid section. Identical machinery to the current
 * `ScoreGridSection`, but rows/cells use the presentation vocabulary and the
 * section may select a registered grid component via `componentId`.
 *
 * `componentId` is optional; missing means `default-score-grid`. It is closed to
 * {@link ScoreGridComponentId} — no `| string` widening (Layer 1). Arbitrary
 * non-grid `kind: "component"` sections are Layer 2 and are intentionally NOT
 * defined here.
 *
 * The audit surface (`subtitleFacts`, `footnotes`, `caption`) is preserved from
 * the current section: per the plan, audit data stays in `RoundResult` and the
 * renderer chooses how much to show (product vs verification mode). It is NOT
 * dropped in the migration; it carries over verbatim so a vNext renderer can
 * still surface the full audit trail.
 *
 * There is deliberately NO `props?: Record<string, unknown>` escape — an
 * untyped payload is exactly the Layer-1 leak the plan resolved. When the first
 * non-default grid component lands (Phase 3), its props are introduced as a
 * typed, `componentId`-keyed contract (or a generic section), not before.
 */
export interface VScoreGridSection {
    kind: 'score_grid';
    /** Registered grid renderer; omit for `default-score-grid`. */
    componentId?: ScoreGridComponentId;
    title: TitleSpec;
    /** Real ball ids this card represents — consumer resolves + joins names. */
    subjectBallIds: string[];
    /** Ordered played hole occurrences = the grid's columns. */
    holes: HoleRef[];
    rows: VGridRow[];
    /**
     * Pre-built subtitle facts (slot/format/allowance/CH/PH/holes-played/mode).
     * Audit chrome — a verification-mode renderer shows these; a product-mode
     * renderer may suppress them. Kept in the contract so the data survives.
     */
    subtitleFacts: string[];
    /**
     * Per-hole arithmetic surfaced under the table (topology, categories,
     * multipliers). Audit chrome — preserved for verification-mode rendering.
     */
    footnotes: string[];
    /**
     * Optional one-line caption explaining a non-obvious scoring convention
     * (e.g. totals normalised relative to the leader).
     */
    caption?: string;
    /** Card-level totals (`label = value`). */
    totals: { label: string; value: number | null }[];
}
