// Phase 2.6b-final / Slice 2b — serializable result sections.
//
// A format plugin's scoring output (`StrategyResult`) is turned, by the pure
// `result-builder`, into an ordered list of SERIALIZABLE sections that fully
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

export interface HoleRef {
    holeNumber: number;
    // Slice 3c: playHoleId, courseHoleNumber, canonicalOrdinal, playedOrdinal,
    // occurrenceLabel — added here, not baked into row identity elsewhere.
}

/** How the renderer aggregates a row across OUT / IN / TOT column groups. */
export type GridAggregate = 'sum' | 'last' | 'none';

export interface GridCell {
    holeNumber: number;
    /** Numeric value used for `sum`/`last` aggregation; null = nothing to add. */
    value: number | null;
    /** Overrides the default cell text (e.g. `+2` for given, `P` for pickup, `AS`). */
    display?: string;
    /** Hover annotation (e.g. stableford netPar arithmetic, umbrella categories). */
    title?: string;
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

/** A line segment: literal text OR a ball reference the consumer names. */
export type LineSegment = { text: string } | { ballIds: string[] };

export interface MatchLine {
    segments: LineSegment[];
    /** won/lost/halved/in_progress — for optional styling. */
    result: 'won' | 'lost' | 'halved' | 'in_progress';
}

/** Pair/team-vs-team results expressed in golf idiom (match-play, taliban). */
export interface MatchSummarySection {
    kind: 'match_summary';
    title: string;
    lines: MatchLine[];
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
}
