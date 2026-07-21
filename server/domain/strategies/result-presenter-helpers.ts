import type { BallResult, PairBallResult } from './types';
import type { FormatMetric, MetricPace } from '../formats/plugin';
import type {
    GridCell,
    GridRow,
    HoleRef,
    MatchPanel,
    MatchSummarySection,
    RankedEntry,
    RankedSection,
} from './result-sections';

/**
 * One scorecard column = one itinerary occurrence, ordered by canonical
 * ordinal. Carries the display label + par + SI so presenters never re-read
 * a physical-hole array.
 */
export interface ResultColumn {
    playHoleId: string;
    courseHoleNumber: number;
    canonicalOrdinal: number;
    occurrenceLabel: string;
    par: number;
    baseStrokeIndex: number;
}

export function holeRef(c: ResultColumn): HoleRef {
    return {
        holeNumber: c.courseHoleNumber,
        playHoleId: c.playHoleId,
        courseHoleNumber: c.courseHoleNumber,
        canonicalOrdinal: c.canonicalOrdinal,
        occurrenceLabel: c.occurrenceLabel,
    };
}

// --- cell display helpers (all formatting lives here, not in the renderer) ---

export function num(v: number | null | undefined): string {
    if (v === null || v === undefined) return '—';
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export function grossText(g: number | null): string {
    if (g === null) return '–';
    if (g === 0) return 'P';
    return String(g);
}

export function netText(n: number | null): string {
    return n === null ? '–' : String(n);
}

export function givenText(given: number | null): string {
    if (given === null || given === 0) return '';
    // Plus handicaps give strokes back (negative); show the sign either way.
    return given > 0 ? `+${given}` : String(given);
}

export function cell(col: ResultColumn, value: number | null, display: string, title?: string): GridCell {
    const base: GridCell = { playHoleId: col.playHoleId, holeNumber: col.courseHoleNumber, value, display };
    return title === undefined ? base : { ...base, title };
}

/** Per-ball result row keyed by stable occurrence id (repeated holes distinct). */
export function byPlayHole(r: BallResult): Map<string, BallResult['holes'][number]> {
    const m = new Map<string, BallResult['holes'][number]>();
    for (const h of r.holes) {
        if (h.playHoleId !== undefined) m.set(h.playHoleId, h);
    }
    return m;
}

// --- shared rows -----------------------------------------------------------

export function parRow(cols: ResultColumn[]): GridRow {
    return {
        label: 'Par',
        kind: 'par',
        aggregate: 'sum',
        cells: cols.map((c) => cell(c, c.par, String(c.par))),
    };
}

/**
 * SI row. `siByPlayHole` supplies the per-tee effective SI for a single-ball
 * card (mixed-tee rounds): each ball's card shows the SI its own tee allocates
 * against, matching the strokes-given/net rows. Falls back to the occurrence
 * base SI when no per-ball map is given (team/pair cards, or single-tee rounds
 * where per-tee SI == base — so existing output is unchanged).
 */
export function siRow(cols: ResultColumn[], siByPlayHole?: Map<string, number>): GridRow {
    return {
        label: 'SI',
        kind: 'si',
        aggregate: 'none',
        cells: cols.map((c) => {
            const si = siByPlayHole?.get(c.playHoleId) ?? c.baseStrokeIndex;
            return cell(c, si, String(si));
        }),
    };
}

export function parSiRows(cols: ResultColumn[]): GridRow[] {
    return [parRow(cols), siRow(cols)];
}

/** Given / Gross / Net rows for one ball, ordered by the played occurrences. */
export function ballScoreRows(
    cols: ResultColumn[],
    r: BallResult,
    opts: { subjectBallId?: string; given?: boolean; net?: boolean } = {},
): GridRow[] {
    const byId = byPlayHole(r);
    const rows: GridRow[] = [];
    const sub = opts.subjectBallId;
    if (opts.given !== false) {
        rows.push({
            label: 'Given',
            ...(sub ? { subjectBallId: sub } : {}),
            kind: 'given',
            aggregate: 'none',
            cells: cols.map((c) => {
                const hr = byId.get(c.playHoleId);
                const given = hr && hr.gross !== null && hr.net !== null ? hr.gross - hr.net : null;
                return cell(c, given, givenText(given));
            }),
        });
    }
    rows.push({
        label: 'Gross',
        ...(sub ? { subjectBallId: sub } : {}),
        kind: 'gross',
        aggregate: 'sum',
        cells: cols.map((c) => {
            const hr = byId.get(c.playHoleId);
            const g = hr?.gross ?? null;
            const gc = cell(c, g, grossText(g));
            return hr?.marker ? { ...gc, marker: hr.marker } : gc;
        }),
    });
    if (opts.net !== false) {
        rows.push({
            label: 'Net',
            ...(sub ? { subjectBallId: sub } : {}),
            kind: 'net',
            aggregate: 'sum',
            cells: cols.map((c) => {
                const n = byId.get(c.playHoleId)?.net ?? null;
                return cell(c, n, netText(n));
            }),
        });
    }
    return rows;
}

export function pointsRow(
    cols: ResultColumn[],
    r: BallResult,
    label = 'Points',
    emphasis = false,
    subjectBallId?: string,
): GridRow {
    const byId = byPlayHole(r);
    return {
        label,
        ...(subjectBallId ? { subjectBallId } : {}),
        kind: 'points',
        aggregate: 'sum',
        emphasis,
        cells: cols.map((c) => {
            const hr = byId.get(c.playHoleId);
            const p = hr?.points ?? null;
            return cell(c, p, p === null ? '—' : String(p), hr?.note);
        }),
    };
}

/** Category-points rows: one thin marker row per category, a ●
 * where that ball/team won it. The full set comes from `categoryDefs` so an
 * un-won category still gets a (blank) row. */
export function categoryRows(cols: ResultColumn[], r: BallResult): GridRow[] {
    const byId = byPlayHole(r);
    return (r.categoryDefs ?? []).map((label) => ({
        label,
        kind: 'category' as const,
        aggregate: 'sum' as const,
        cells: cols.map((c) => {
            const won = byId.get(c.playHoleId)?.categories?.includes(label) ?? false;
            return cell(c, won ? 1 : null, won ? '●' : '');
        }),
    }));
}

/** Points row for a category format — appends ☂ on a sweep hole. */
export function categoryPointsRow(cols: ResultColumn[], r: BallResult, label = 'Points'): GridRow {
    const byId = byPlayHole(r);
    return {
        label,
        kind: 'points',
        aggregate: 'sum',
        emphasis: true,
        cells: cols.map((c) => {
            const hr = byId.get(c.playHoleId);
            const p = hr?.points ?? null;
            const disp = p === null ? '—' : hr?.sweep ? `${p}☂` : String(p);
            return cell(c, p, disp, hr?.note);
        }),
    };
}

export function hasPoints(r: BallResult): boolean {
    return r.holes.some((h) => h.points !== null);
}

export function footnotesFor(r: BallResult): string[] {
    return r.holes
        .filter((h) => h.note && h.points !== null && h.points !== 0)
        .map((h) => `h${h.occurrenceLabel ?? h.holeNumber}: ${h.note}`);
}

// --- normalised running ----------------------------------------------------

/** Explains the normalised running totals so the per-hole points (raw) and the
 * running/total (leader-relative) don't read as a contradiction. */
export const NORMALIZED_CAPTION =
    'Running totals are relative to the leader (the trailing team shows 0); per-hole points below are the raw points scored.';

/**
 * Per-metric normalisation offset for formats that present relative-to-last
 * totals. Callers own the display decision and should only call this for
 * formats whose totals are intentionally normalized.
 */
export function normalizationOffsets(
    metrics: FormatMetric[],
    ballResults: BallResult[],
): Map<string, number> | null {
    const offsets = new Map<string, number>();
    for (const metric of metrics) {
        const totals = ballResults
            .map((r) => r.totals.find((t) => t.scoringType === metric.id)?.value)
            .filter((v): v is number => v !== null && v !== undefined);
        if (totals.length > 0) offsets.set(metric.id, Math.min(...totals));
    }
    return offsets.size > 0 ? offsets : null;
}

/** ballId → (playHoleId → normalised running) over the point-bearing results. */
export function normalizedRunning(
    cols: ResultColumn[],
    results: BallResult[],
): Map<string, Map<string, number>> {
    const out = new Map<string, Map<string, number>>();
    const raw = new Map<string, number>();
    const byId = new Map<string, Map<string, BallResult['holes'][number]>>();
    for (const r of results) {
        raw.set(r.ballId, 0);
        out.set(r.ballId, new Map());
        byId.set(r.ballId, byPlayHole(r));
    }
    for (const c of cols) {
        for (const r of results) {
            const hr = byId.get(r.ballId)!.get(c.playHoleId);
            if (hr?.points !== null && hr?.points !== undefined) {
                raw.set(r.ballId, (raw.get(r.ballId) ?? 0) + hr.points);
            }
        }
        const min = Math.min(...results.map((r) => raw.get(r.ballId) ?? 0));
        for (const r of results) {
            out.get(r.ballId)!.set(c.playHoleId, (raw.get(r.ballId) ?? 0) - min);
        }
    }
    return out;
}

/** Subtract the metric's normalisation offset from a total (null stays null). */
export function normalizeTotal(
    value: number | null,
    scoringType: string,
    offsets: Map<string, number> | null,
): number | null {
    if (value === null || !offsets || !offsets.has(scoringType)) return value;
    return value - offsets.get(scoringType)!;
}

export function runningRow(cols: ResultColumn[], running: Map<string, number>): GridRow {
    return {
        label: 'Running',
        kind: 'running',
        aggregate: 'last',
        cells: cols.map((c) => {
            const v = running.get(c.playHoleId) ?? null;
            return cell(c, v, num(v));
        }),
    };
}

// --- match rows ------------------------------------------------------------

/** One player's net row on the compact match card: just the net per hole, team-
 * tinted, with the deciding-hole marker (ring / double_ring / diamond) where
 * this ball won it. The marker is presentation vocabulary built by the format. */
export function matchNetRow(cols: ResultColumn[], r: BallResult, team: 'a' | 'b'): GridRow {
    const byId = byPlayHole(r);
    return {
        label: '',
        subjectBallId: r.ballId,
        kind: 'net',
        aggregate: 'sum',
        team,
        cells: cols.map((c) => {
            const hr = byId.get(c.playHoleId);
            const n = hr?.net ?? null;
            const gc = cell(c, n, n === null ? '–' : String(n));
            return hr?.marker ? { ...gc, marker: hr.marker } : gc;
        }),
    };
}

/**
 * One head-to-head pair → a `MatchPanel`. Decision-free: it accumulates the
 * A-perspective lead and holes-played over decided holes and reports who's up,
 * by how much, and whether the match is finished. The presenter decides whether
 * a pair becomes a panel at all.
 */
export function matchPanel(pair: PairBallResult): MatchPanel {
    let lead = 0;
    let thru = 0;
    for (const ph of pair.holes) {
        if (ph.status === null) continue;
        thru++;
        if (ph.pointsDelta !== null && ph.pointsDelta !== undefined) lead += ph.pointsDelta;
    }
    return {
        sideA: { ballIds: pair.sideA.ballIds },
        sideB: { ballIds: pair.sideB.ballIds },
        leader: lead > 0 ? 'a' : lead < 0 ? 'b' : null,
        magnitude: Math.abs(lead),
        finished: pair.result !== 'in_progress',
        thru,
    };
}

/** Shell that wraps a list of pairs into the match-results leaderboard section. */
export function matchSummarySection(pairs: PairBallResult[]): MatchSummarySection {
    return { kind: 'match_summary', title: 'Match results', matches: pairs.map(matchPanel) };
}

/**
 * Direction-aware compare of one entry's `key` field (`total` or `paceDelta`).
 * Null keys sort last regardless of direction. A `low` metric ranks the
 * smallest key first; `high` ranks the largest first.
 */
function compareByKey(
    a: RankedEntry,
    b: RankedEntry,
    key: 'total' | 'paceDelta',
    direction: 'high' | 'low',
): number {
    const av = a[key] ?? null;
    const bv = b[key] ?? null;
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    return direction === 'low' ? av - bv : bv - av;
}

/**
 * Sort ranked entries and stamp 1-based positions (ties share a position).
 *
 * When ANY entry carries `paceDelta` (the metric declared a live-board pace),
 * the section sorts by `paceDelta` — metric relative to the playing-to-pace
 * baseline over each entry's own thru-N — with `total` as the tiebreak, so a
 * team ahead of pace ranks above a team behind it even on fewer holes. When no
 * entry carries `paceDelta`, it sorts by absolute `total` exactly as before.
 * With equal thru across all entries the pace target is a uniform shift, so the
 * pace order is provably identical to the absolute-total order.
 *
 * Positions are assigned on the SORTED key: consecutive entries whose ranking
 * key ties share a position (paceDelta ties when pace is active, total ties
 * otherwise).
 */
export function rankEntries(entries: RankedEntry[], direction: 'high' | 'low'): RankedEntry[] {
    const usePace = entries.some((e) => e.paceDelta !== undefined);
    const key = usePace ? 'paceDelta' : 'total';
    const sorted = [...entries].sort((a, b) => {
        const primary = compareByKey(a, b, key, direction);
        if (primary !== 0 || !usePace) return primary;
        // Pace tiebreak: fall back to absolute total (same direction).
        return compareByKey(a, b, 'total', direction);
    });
    let last: number | null | undefined;
    let position = 0;
    return sorted.map((e, i) => {
        const rankKey = usePace ? (e.paceDelta ?? null) : e.total;
        if (rankKey !== last) {
            position = i + 1;
            last = rankKey;
        }
        return { ...e, position };
    });
}

/**
 * The pace target (expected metric) for an entry that has counted `thru` holes
 * and, for the `'par'` pace, a `parSoFar` sum over those scored holes.
 *   - `{ perHole: n }` → `n × thru`.
 *   - `'par'`          → `parSoFar`.
 */
function paceTarget(pace: MetricPace, thru: number, parSoFar: number): number {
    return pace === 'par' ? parSoFar : pace.perHole * thru;
}

/** Sum of par over the holes a ball result scored (non-null gross). Requires
 * the play-hole columns so a repeated physical hole's occurrences are summed
 * distinctly (keyed by `playHoleId`). Used only for the `'par'` pace. */
function parSoFarFor(r: BallResult, parByPlayHole: Map<string, number>): number {
    let sum = 0;
    for (const h of r.holes) {
        if (h.gross === null) continue;
        if (h.playHoleId !== undefined) sum += parByPlayHole.get(h.playHoleId) ?? 0;
    }
    return sum;
}

export function rankedSections(
    metrics: FormatMetric[],
    ballResults: BallResult[],
    opts: {
        offsets?: Map<string, number> | null;
        ballIdsFor?: (resultBallId: string) => string[];
        /**
         * Play-hole columns (par per occurrence). Required for a `pace: 'par'`
         * metric so par-so-far can be summed over each entry's scored holes;
         * unused for `{ perHole }` pace and for non-pace metrics.
         */
        columns?: ResultColumn[];
    } = {},
): RankedSection[] {
    const out: RankedSection[] = [];
    const offsets = opts.offsets ?? null;
    const ballIdsFor = opts.ballIdsFor ?? ((resultBallId: string) => [resultBallId]);
    const parByPlayHole = new Map((opts.columns ?? []).map((c) => [c.playHoleId, c.par] as const));

    for (const metric of metrics) {
        const entries: RankedEntry[] = [];
        for (const r of ballResults) {
            const t = r.totals.find((x) => x.scoringType === metric.id);
            if (!t) continue;
            const total = normalizeTotal(t.value, metric.id, offsets);
            const entry: RankedEntry = {
                ballIds: ballIdsFor(r.ballId),
                total,
                holesPlayed: r.holesPlayed,
                position: 0,
            };
            // Pace delta: metric relative to the playing-to-pace baseline over
            // this entry's own thru-N. Only when the metric declares a pace and
            // the entry has a total to compare.
            if (metric.pace !== undefined && total !== null) {
                const parSoFar = metric.pace === 'par' ? parSoFarFor(r, parByPlayHole) : 0;
                entry.paceDelta = total - paceTarget(metric.pace, r.holesPlayed, parSoFar);
            }
            entries.push(entry);
        }
        if (entries.length === 0) continue;
        out.push({
            kind: 'ranked',
            metricId: metric.id,
            metricLabel: metric.label,
            direction: metric.direction,
            entries: rankEntries(entries, metric.direction),
        });
    }

    return out;
}
