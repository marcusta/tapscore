// Phase 2.6b-final / Slice 2b — serializable result sections.
//
// A format plugin's scoring output (`StrategyResult`) is turned, by that
// format's `renderResult` presenter, into an ordered list of SERIALIZABLE sections that fully
// describe what to render. Static HTML (and, in 2.6e, the mobile client) are
// generic consumers: they lay out sections without knowing which format
// produced them. ALL format arithmetic and golf idiom originate server-side —
// the renderer never reimplements a scoring rule and never branches on a
// format id.
//
// `JSON.parse(JSON.stringify(section))` must round-trip identically: no
// functions, no class instances. Balls are referenced by id; the consumer
// resolves display names from its own ball metadata. Synthetic `team:<label>`
// ids never cross this boundary — the builder resolves a team to its member
// ball ids, so every `ballIds` array holds real ball ids.
//
// Hole-addressed rows carry only `holeNumber` today. Slice 3c adds stable
// `playHoleId` + physical-hole/ordinal display metadata alongside it; the
// shape is intentionally a struct (`HoleRef`) rather than a bare number so
// that extension is additive.

import type { CellMarker, ScoreGridComponentId, Tone } from './result-vocabulary';

/**
 * One scorecard column — a single itinerary occurrence. `playHoleId` is the
 * stable identity (cells align to columns by it); `occurrenceLabel` is the
 * rendered header (`"3"`, `"3 (1st)"`); `canonicalOrdinal` drives section
 * (OUT/IN/TOT) grouping. `holeNumber` == `courseHoleNumber` for back-compat.
 */
export interface HoleRef {
    holeNumber: number;
    playHoleId: string;
    courseHoleNumber: number;
    canonicalOrdinal: number;
    occurrenceLabel: string;
}

/** How the renderer aggregates a row across OUT / IN / TOT column groups. */
export type GridAggregate = 'sum' | 'last' | 'none';

export interface GridCell {
    /** Column identity — aligns the cell to its `HoleRef` column. */
    playHoleId: string;
    /** Physical hole number (display convenience / fallback). */
    holeNumber: number;
    /** Numeric value used for `sum`/`last` aggregation; null = nothing to add. */
    value: number | null;
    /** Overrides the default cell text (e.g. `+2` for given, `P` for pickup, `AS`). */
    display?: string;
    /** Hover annotation (e.g. stableford netPar arithmetic, umbrella categories). */
    title?: string;
    /** Optional colour intent for the cell (closed presentation vocabulary). */
    tone?: Tone;
    /**
     * Match formats: this cell's ball DECIDED the hole — the renderer draws the
     * marker's shape (ring / double_ring / diamond) around the score. The golf
     * meaning rides in the marker `label`, never a token name. The row's `team`
     * still drives the colour tint.
     */
    marker?: CellMarker;
    /** Per-cell team tint (e.g. the standing row coloured by who's currently up). */
    team?: 'a' | 'b';
}

/**
 * A named ordinal range used for scorecard totals (OUT/IN/TOT etc.), derived
 * from the round's frozen route sections — never hardcoded physical holes
 * 1–9 / 10–18. `from`/`to` are canonical itinerary ordinals (1-based).
 */
export interface RouteSectionRef {
    id: string;
    label: string;
    fromCanonicalOrdinal: number;
    toCanonicalOrdinal: number;
}

export interface GridRow {
    label: string;
    /**
     * When set, the consumer prefixes `label` with this ball's resolved name
     * (e.g. `Alice` + `Gross`). Lets a multi-member pair/team card label each
     * member's rows with live names while keeping the section name-agnostic.
     */
    subjectBallId?: string;
    /**
     * Presentation hint only — the renderer styles a row by this kind but
     * never branches on a FORMAT. Every format reuses the same handful of
     * row kinds.
     */
    kind: 'par' | 'si' | 'given' | 'gross' | 'net' | 'points' | 'running' | 'status' | 'category' | 'free';
    cells: GridCell[];
    aggregate: GridAggregate;
    /** Bold the row (team points, status). */
    emphasis?: boolean;
    /** Match formats: which side this row belongs to, for a team colour tint. */
    team?: 'a' | 'b';
}

/**
 * One scorecard-style card: a hole-indexed grid plus subtitle facts, per-hole
 * arithmetic footnotes, and ranked totals. Covers every existing scorecard
 * (individual, pair, team-aggregate, category matrix) — the row list differs,
 * the layout machinery does not.
 */
export interface ScoreGridSection {
    kind: 'score_grid';
    /**
     * Registered score-grid renderer. Missing means `default-score-grid`; the
     * server sets this at authoring time through the format/plugin descriptor.
     */
    componentId?: ScoreGridComponentId;
    /**
     * Card heading. Each group's ball names are joined by ` & `; the groups
     * are then joined by `joiner` (`' & '` for one side, `' vs. '` for a
     * pair). The consumer resolves ball ids → live names.
     */
    title: { groups: string[][]; joiner: string };
    /** Real ball ids this card represents — consumer resolves + joins names. */
    subjectBallIds: string[];
    /** Ordered played hole numbers = the grid's columns. */
    holes: HoleRef[];
    /** Pre-built subtitle strings (slot/format/allowance/CH/PH/holes-played/mode). */
    subtitleFacts: string[];
    rows: GridRow[];
    /** Per-hole arithmetic surfaced under the table (topology, categories, multipliers). */
    footnotes: string[];
    /**
     * Optional one-line caption explaining a non-obvious scoring convention —
     * e.g. that totals are normalised relative to the leader. Rendered as a small
     * note under the card head.
     */
    caption?: string;
    /** Card-level totals (`label = value`). */
    totals: { label: string; value: number | null }[];
}

export interface RankedEntry {
    /** Real ball ids (a team resolves to its members); consumer joins names. */
    ballIds: string[];
    total: number | null;
    holesPlayed: number;
    /** 1-based; ties share a position. */
    position: number;
}

/** A ranked scalar metric (stableford points, gross, net, köpenhamnare). */
export interface RankedSection {
    kind: 'ranked';
    metricId: string;
    metricLabel: string;
    entries: RankedEntry[];
}

/** One head-to-head match as a structured panel: two sides, who's up + by how
 * much, and whether it's finished. The consumer resolves ballIds → names. */
export interface MatchPanel {
    sideA: { ballIds: string[] };
    sideB: { ballIds: string[] };
    /** Which side is up — 'a', 'b', or null when all square. */
    leader: 'a' | 'b' | null;
    /** Holes/points the leader is up by (0 when all square). */
    magnitude: number;
    /** Match decided (closed out / 18 done) → show "Final"; else "thru N". */
    finished: boolean;
    thru: number;
}

/** Pair/team-vs-team results (match-play, taliban) as structured panels. */
export interface MatchSummarySection {
    kind: 'match_summary';
    title: string;
    matches: MatchPanel[];
}

export type LeaderboardSection = RankedSection | MatchSummarySection;
export type ResultSection = ScoreGridSection | LeaderboardSection;

/** One scored slot, fully described for a generic consumer. */
export interface SlotResultView {
    slotIndex: number;
    slotDefId: string;
    formatId: string;
    /** Registered descriptor label — never reconstructed from a switch. */
    formatLabel: string;
    scoringMode: string;
    teamShape: string;
    allowanceLabel: string;
    /** Scorecard-area cards. */
    cards: ScoreGridSection[];
    /** Leaderboard-area sections (ranked metrics + match summaries). */
    leaderboard: LeaderboardSection[];
}

export interface RoundResult {
    slots: SlotResultView[];
    /**
     * Route sections (OUT/IN/TOT segmentation) by canonical ordinal — the
     * renderer groups scorecard columns by these instead of hardcoded
     * physical holes 1–9 / 10–18.
     */
    routeSections: RouteSectionRef[];
    /** WHS posting eligibility for the round's frozen route handicap policy. */
    posting: { eligible: boolean; reason: string | null };
}
