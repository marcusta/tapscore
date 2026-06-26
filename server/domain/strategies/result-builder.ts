// Phase 2.6b-final / Slice 2b — pure StrategyResult → SlotResultView builder.
//
// This is the single place a plugin's scoring output becomes generic,
// serializable render sections. It is DATA-DRIVEN, never format-id-driven:
//   - pair results present  → unified pair cards + a match-summary section;
//   - team groupings + a `team:<label>` aggregate → team cards;
//   - otherwise             → one individual card per ball.
// The strategy already owns every scoring rule; this builder only reshapes
// its output (gross / net / points / status / notes) into rows + ranked +
// match sections. The only arithmetic here is presentation arithmetic shared
// across all formats: per-hole strokes-given recovered as `gross − net`, and
// normalised running totals (cumulative points minus the trailing subject),
// both gated by data, not by a format identity.

import type { FormatMetric } from '../formats/plugin';
import type {
    BallResult,
    PairBallResult,
    SlotBall,
    SlotTeamGrouping,
    StrategyResult,
} from './types';
import type {
    GridCell,
    GridRow,
    HoleRef,
    LeaderboardSection,
    MatchLine,
    RankedEntry,
    ScoreGridSection,
    SlotResultView,
} from './result-sections';

const TEAM_PREFIX = 'team:';

/**
 * One scorecard column = one itinerary occurrence, ordered by canonical
 * ordinal. Carries the display label + par + SI so the builder never re-reads
 * a physical-hole array. Built by the leaderboard service from `RoundContext`.
 */
export interface ResultColumn {
    playHoleId: string;
    courseHoleNumber: number;
    canonicalOrdinal: number;
    occurrenceLabel: string;
    par: number;
    baseStrokeIndex: number;
}

export interface BuildSlotInput {
    slotIndex: number;
    slotDefId: string;
    formatId: string;
    formatLabel: string;
    scoringMode: string;
    teamShape: string;
    allowanceLabel: string;
    metrics: FormatMetric[];
    runningNormalized: boolean;
    result: StrategyResult;
    slotBalls: SlotBall[];
    slotTeamGroupings: SlotTeamGrouping[];
    /** Played itinerary occurrences, in canonical ordinal order — the grid columns. */
    columns: ResultColumn[];
    /**
     * Per-ball effective SI (ballId → playHoleId → SI), for single-producer
     * cards on mixed-tee rounds so the displayed SI matches each ball's own-tee
     * stroke allocation. Omit for team/pair cards and single-tee rounds.
     */
    effectiveSi?: Map<string, Map<string, number>>;
}

function holeRef(c: ResultColumn): HoleRef {
    return {
        holeNumber: c.courseHoleNumber,
        playHoleId: c.playHoleId,
        courseHoleNumber: c.courseHoleNumber,
        canonicalOrdinal: c.canonicalOrdinal,
        occurrenceLabel: c.occurrenceLabel,
    };
}

// --- cell display helpers (all formatting lives here, not in the renderer) ---

function num(v: number | null | undefined): string {
    if (v === null || v === undefined) return '—';
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
function grossText(g: number | null): string {
    if (g === null) return '–';
    if (g === 0) return 'P';
    return String(g);
}
function netText(n: number | null): string {
    return n === null ? '–' : String(n);
}
function givenText(given: number | null): string {
    if (given === null || given === 0) return '';
    // Plus handicaps give strokes back (negative); show the sign either way.
    return given > 0 ? `+${given}` : String(given);
}

function cell(col: ResultColumn, value: number | null, display: string, title?: string): GridCell {
    const base: GridCell = { playHoleId: col.playHoleId, holeNumber: col.courseHoleNumber, value, display };
    return title === undefined ? base : { ...base, title };
}

/** Per-ball result row keyed by stable occurrence id (repeated holes distinct). */
function byPlayHole(r: BallResult): Map<string, BallResult['holes'][number]> {
    const m = new Map<string, BallResult['holes'][number]>();
    for (const h of r.holes) {
        if (h.playHoleId !== undefined) m.set(h.playHoleId, h);
    }
    return m;
}

// --- shared rows -----------------------------------------------------------

function parRow(cols: ResultColumn[]): GridRow {
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
function siRow(cols: ResultColumn[], siByPlayHole?: Map<string, number>): GridRow {
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

function parSiRows(cols: ResultColumn[]): GridRow[] {
    return [parRow(cols), siRow(cols)];
}

/** Given / Gross / Net rows for one ball, ordered by the played occurrences. */
function ballScoreRows(
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
            const g = byId.get(c.playHoleId)?.gross ?? null;
            return cell(c, g, grossText(g));
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

function pointsRow(
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

/** Category-points formats (umbrella): one thin marker row per category, a ●
 * where that ball/team won it. The full set comes from `categoryDefs` so an
 * un-won category still gets a (blank) row. */
function categoryRows(cols: ResultColumn[], r: BallResult): GridRow[] {
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
function categoryPointsRow(cols: ResultColumn[], r: BallResult, label = 'Points'): GridRow {
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

function hasPoints(r: BallResult): boolean {
    return r.holes.some((h) => h.points !== null);
}

function footnotesFor(r: BallResult): string[] {
    return r.holes
        .filter((h) => h.note && h.points !== null && h.points !== 0)
        .map((h) => `h${h.occurrenceLabel ?? h.holeNumber}: ${h.note}`);
}

/** Explains the normalised running totals so the per-hole points (raw) and the
 * running/total (leader-relative) don't read as a contradiction. */
const NORMALIZED_CAPTION =
    'Running totals are relative to the leader (the trailing team shows 0); per-hole points below are the raw points scored.';

// --- normalised running (köpenhamnare / umbrella) --------------------------

/** ballId → (playHoleId → normalised running) over the point-bearing results. */
function normalizedRunning(
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

/**
 * Per-metric normalisation offset for formats that present relative-to-last
 * totals (köpenhamnare, umbrella — same `runningTotals: 'normalized'` gate as
 * the running row). Subtracting `min(total)` makes the trailing player read 0
 * and every other total their lead over them. Order is preserved (a constant
 * shift), so ranking is unchanged. Returns null for absolute-total formats.
 */
function normalizationOffsets(input: BuildSlotInput): Map<string, number> | null {
    if (!input.runningNormalized) return null;
    const offsets = new Map<string, number>();
    for (const metric of input.metrics) {
        const totals = input.result.ballResults
            .map((r) => r.totals.find((t) => t.scoringType === metric.id)?.value)
            .filter((v): v is number => v !== null && v !== undefined);
        if (totals.length > 0) offsets.set(metric.id, Math.min(...totals));
    }
    return offsets.size > 0 ? offsets : null;
}

/** Subtract the metric's normalisation offset from a total (null stays null). */
function normalizeTotal(
    value: number | null,
    scoringType: string,
    offsets: Map<string, number> | null,
): number | null {
    if (value === null || !offsets || !offsets.has(scoringType)) return value;
    return value - offsets.get(scoringType)!;
}

function runningRow(cols: ResultColumn[], running: Map<string, number>): GridRow {
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

// --- pair card -------------------------------------------------------------

function formatMatchRunning(running: number, style: 'versus' | 'standalone'): string {
    if (style === 'versus') {
        if (running === 0) return 'AS';
        return running > 0 ? `${running}UP` : `${-running}DN`;
    }
    if (running === 0) return 'AS';
    return running > 0 ? `+${running}` : `−${-running}`;
}

function buildPairCard(
    input: BuildSlotInput,
    pair: PairBallResult,
    byBall: Map<string, BallResult>,
): ScoreGridSection {
    const cols = input.columns;
    const style = pair.summaryStyle ?? 'versus';
    const pairById = new Map<string, PairBallResult['holes'][number]>();
    for (const ph of pair.holes) if (ph.playHoleId !== undefined) pairById.set(ph.playHoleId, ph);

    const sidePoints = (perspective: 'A' | 'B', playHoleId: string): number | null => {
        const ph = pairById.get(playHoleId);
        if (!ph || ph.status === null) return null;
        if (style === 'standalone') return perspective === 'A' ? ph.fromA : ph.fromB;
        if (ph.status === 'halved') return 0;
        if (perspective === 'A') return ph.status === 'won' ? 1 : 0;
        return ph.status === 'lost' ? 1 : 0;
    };

    // normalised per-side running (lower side reads 0).
    const sideRunning = (perspective: 'A' | 'B'): Map<string, number> => {
        let rawA = 0;
        let rawB = 0;
        const m = new Map<string, number>();
        for (const c of cols) {
            const pA = sidePoints('A', c.playHoleId);
            const pB = sidePoints('B', c.playHoleId);
            if (pA !== null) rawA += pA;
            if (pB !== null) rawB += pB;
            const min = Math.min(rawA, rawB);
            m.set(c.playHoleId, (perspective === 'A' ? rawA : rawB) - min);
        }
        return m;
    };

    const rows: GridRow[] = [...parSiRows(cols)];

    const sideBlock = (side: { teamLabel?: string; ballIds: string[] }, perspective: 'A' | 'B') => {
        for (const ballId of side.ballIds) {
            const r = byBall.get(ballId);
            if (!r) continue;
            rows.push(...ballScoreRows(cols, r, { subjectBallId: ballId }));
        }
        const sideRow = (label: string): { label: string; subjectBallId?: string } =>
            side.ballIds.length === 1
                ? { label, subjectBallId: side.ballIds[0] }
                : { label: `${side.teamLabel ?? perspective} ${label}` };
        const pts = sideRow('pts');
        rows.push({
            ...pts,
            kind: 'points',
            aggregate: 'sum',
            emphasis: true,
            cells: cols.map((c) => cell(c, sidePoints(perspective, c.playHoleId), num(sidePoints(perspective, c.playHoleId)))),
        });
        const running = sideRunning(perspective);
        const run = sideRow('run');
        rows.push({
            ...run,
            kind: 'running',
            aggregate: 'last',
            cells: cols.map((c) => {
                const v = running.get(c.playHoleId) ?? null;
                return cell(c, v, num(v));
            }),
        });
    };

    sideBlock(pair.sideA, 'A');
    sideBlock(pair.sideB, 'B');

    // Per-hole status (this pair's perspective).
    rows.push({
        label: 'Status',
        kind: 'status',
        aggregate: 'none',
        cells: cols.map((c) => {
            const ph = pairById.get(c.playHoleId);
            return cell(c, null, ph?.note ?? '—');
        }),
    });

    // Cumulative match line (idiom-specific).
    let running = 0;
    const matchById = new Map<string, number>();
    for (const c of cols) {
        const ph = pairById.get(c.playHoleId);
        if (ph?.pointsDelta !== null && ph?.pointsDelta !== undefined) running += ph.pointsDelta;
        matchById.set(c.playHoleId, running);
    }
    rows.push({
        label: 'Match',
        kind: 'status',
        aggregate: 'none',
        emphasis: true,
        cells: cols.map((c) =>
            cell(c, null, formatMatchRunning(matchById.get(c.playHoleId) ?? 0, style)),
        ),
    });

    return {
        kind: 'score_grid',
        title: { groups: [pair.sideA.ballIds, pair.sideB.ballIds], joiner: ' vs. ' },
        subjectBallIds: [...pair.sideA.ballIds, ...pair.sideB.ballIds],
        holes: cols.map(holeRef),
        subtitleFacts: [
            `slot #${input.slotIndex} · ${input.formatLabel} · ${input.allowanceLabel}`,
            pair.summary,
        ],
        rows,
        footnotes: [],
        totals: [],
    };
}

// --- team-aggregate card ---------------------------------------------------

function buildTeamCard(
    input: BuildSlotInput,
    grouping: SlotTeamGrouping,
    teamResult: BallResult,
    byBall: Map<string, BallResult>,
    running: Map<string, number> | undefined,
    offsets: Map<string, number> | null,
): ScoreGridSection {
    const cols = input.columns;
    // Category-points formats (umbrella) get a COMPACT card: one marker row per
    // category (● where the team won it) + the team points, since only the
    // categories explain the score. Everything else keeps the stroke detail.
    const compact = (teamResult.categoryDefs?.length ?? 0) > 0;
    const rows: GridRow[] = [];
    if (compact) {
        rows.push(...categoryRows(cols, teamResult));
        rows.push(categoryPointsRow(cols, teamResult, 'Team points'));
    } else {
        rows.push(...parSiRows(cols));
        for (const ballId of grouping.ballIds) {
            const r = byBall.get(ballId);
            if (!r) continue; // some team formats emit only the aggregate, no per-ball rows
            if (hasPoints(r)) {
                // Points-bearing per-ball result (e.g. better-ball Stableford): show
                // each producer's strokes received + gross + their individual points
                // so the reader sees WHICH ball fed the team's best-ball per hole.
                rows.push(...ballScoreRows(cols, r, { subjectBallId: ballId, given: true, net: false }));
                rows.push(pointsRow(cols, r, 'Points', false, ballId));
            } else {
                rows.push(...ballScoreRows(cols, r, { subjectBallId: ballId, given: false }));
            }
        }
        // Team combined gross (LT for umbrella / best-ball gross for better-ball).
        if (teamResult.holes.some((h) => h.gross !== null)) {
            const byId = byPlayHole(teamResult);
            rows.push({
                label: 'Team gross',
                kind: 'gross',
                aggregate: 'sum',
                cells: cols.map((c) => {
                    const g = byId.get(c.playHoleId)?.gross ?? null;
                    return cell(c, g, g === null ? '—' : String(g));
                }),
            });
        }
        if (teamResult.holes.some((h) => h.net !== null)) {
            const byId = byPlayHole(teamResult);
            rows.push({
                label: 'Team net',
                kind: 'net',
                aggregate: 'sum',
                cells: cols.map((c) => {
                    const n = byId.get(c.playHoleId)?.net ?? null;
                    return cell(c, n, netText(n));
                }),
            });
        }
        rows.push(pointsRow(cols, teamResult, 'Team points', true));
    }
    if (running) rows.push(runningRow(cols, running));

    return {
        kind: 'score_grid',
        title: { groups: [grouping.ballIds], joiner: ' & ' },
        subjectBallIds: grouping.ballIds,
        holes: cols.map(holeRef),
        subtitleFacts: [
            `slot #${input.slotIndex} · ${input.formatLabel} · ${input.allowanceLabel}`,
            `holes played ${teamResult.holesPlayed}`,
        ],
        rows,
        footnotes: compact ? [] : footnotesFor(teamResult),
        ...(input.runningNormalized ? { caption: NORMALIZED_CAPTION } : {}),
        totals: teamResult.totals.map((t) => ({
            label: t.scoringType,
            value: normalizeTotal(t.value, t.scoringType, offsets),
        })),
    };
}

// --- individual card -------------------------------------------------------

function buildIndividualCard(
    input: BuildSlotInput,
    r: BallResult,
    running: Map<string, number> | undefined,
    offsets: Map<string, number> | null,
): ScoreGridSection {
    const cols = input.columns;
    const chBall = input.slotBalls.find((b) => b.ballId === r.ballId);
    // Compact category card for umbrella (category-points), stroke detail otherwise.
    const compact = (r.categoryDefs?.length ?? 0) > 0;
    const rows: GridRow[] = compact
        ? [...categoryRows(cols, r), categoryPointsRow(cols, r)]
        : [parRow(cols), siRow(cols, input.effectiveSi?.get(r.ballId)), ...ballScoreRows(cols, r)];
    if (!compact && hasPoints(r)) rows.push(pointsRow(cols, r));
    if (running) rows.push(runningRow(cols, running));

    const facts = [`slot #${input.slotIndex} · ${input.formatLabel} · ${input.allowanceLabel}`];
    if (chBall) {
        facts.push(`CH ${num(chBall.courseHandicapSnapshot)}`);
        facts.push(`PH ${num(chBall.playingHandicapSnapshot)}`);
    }
    facts.push(`holes played ${r.holesPlayed}`);

    return {
        kind: 'score_grid',
        title: { groups: [[r.ballId]], joiner: ' & ' },
        subjectBallIds: [r.ballId],
        holes: cols.map(holeRef),
        subtitleFacts: facts,
        rows,
        footnotes: compact ? [] : footnotesFor(r),
        ...(input.runningNormalized ? { caption: NORMALIZED_CAPTION } : {}),
        totals: r.totals.map((t) => ({
            label: t.scoringType,
            value: normalizeTotal(t.value, t.scoringType, offsets),
        })),
    };
}

// --- leaderboard sections --------------------------------------------------

function rankEntries(entries: RankedEntry[], direction: 'high' | 'low'): RankedEntry[] {
    const sorted = [...entries].sort((a, b) => {
        if (a.total === null && b.total === null) return 0;
        if (a.total === null) return 1;
        if (b.total === null) return -1;
        return direction === 'low' ? a.total - b.total : b.total - a.total;
    });
    let last: number | null | undefined;
    let position = 0;
    return sorted.map((e, i) => {
        if (e.total !== last) {
            position = i + 1;
            last = e.total;
        }
        return { ...e, position };
    });
}

function buildLeaderboard(
    input: BuildSlotInput,
    labelToBallIds: Map<string, string[]>,
    offsets: Map<string, number> | null,
): LeaderboardSection[] {
    const out: LeaderboardSection[] = [];

    const ballIdsFor = (resultBallId: string): string[] => {
        if (resultBallId.startsWith(TEAM_PREFIX)) {
            return labelToBallIds.get(resultBallId.slice(TEAM_PREFIX.length)) ?? [resultBallId];
        }
        return [resultBallId];
    };

    for (const metric of input.metrics) {
        const entries: RankedEntry[] = [];
        for (const r of input.result.ballResults) {
            const t = r.totals.find((x) => x.scoringType === metric.id);
            if (!t) continue;
            entries.push({
                ballIds: ballIdsFor(r.ballId),
                total: normalizeTotal(t.value, metric.id, offsets),
                holesPlayed: r.holesPlayed,
                position: 0,
            });
        }
        if (entries.length === 0) continue;
        out.push({
            kind: 'ranked',
            metricId: metric.id,
            metricLabel: metric.label,
            entries: rankEntries(entries, metric.direction),
        });
    }

    const pairs = input.result.pairResults ?? [];
    if (pairs.length > 0) {
        const lines: MatchLine[] = pairs.map((pair) => {
            const style = pair.summaryStyle ?? 'versus';
            if (style === 'standalone') {
                return { segments: [{ text: pair.summary }], result: pair.result };
            }
            const a = pair.sideA.ballIds;
            const b = pair.sideB.ballIds;
            if (pair.result === 'won' || pair.result === 'lost') {
                const [winner, loser] = pair.result === 'won' ? [a, b] : [b, a];
                return {
                    segments: [
                        { ballIds: winner },
                        { text: ' d. ' },
                        { ballIds: loser },
                        { text: `, ${pair.summary}` },
                    ],
                    result: pair.result,
                };
            }
            const tail = pair.result === 'halved' ? ` halved, ${pair.summary}` : `, ${pair.summary} (in progress)`;
            return {
                segments: [{ ballIds: a }, { text: ' vs. ' }, { ballIds: b }, { text: tail }],
                result: pair.result,
            };
        });
        out.push({ kind: 'match_summary', title: 'Match results', lines });
    }

    return out;
}

// --- entry point -----------------------------------------------------------

export function buildSlotResult(input: BuildSlotInput): SlotResultView {
    const byBall = new Map(input.result.ballResults.map((r) => [r.ballId, r] as const));
    const labelToBallIds = new Map(input.slotTeamGroupings.map((g) => [g.teamLabel, g.ballIds] as const));

    const pairs = input.result.pairResults ?? [];
    const teamResults = input.result.ballResults.filter((r) => r.ballId.startsWith(TEAM_PREFIX));

    // normalised running over the point-bearing results (gated by descriptor).
    let runningByBall: Map<string, Map<string, number>> | null = null;
    if (input.runningNormalized) {
        const pointBearing = input.result.ballResults.filter(hasPoints);
        if (pointBearing.length > 0) runningByBall = normalizedRunning(input.columns, pointBearing);
    }
    // Same gate, applied to the totals: ranked + card totals read relative to the
    // trailing player (min → 0), so the displayed total matches the running row's
    // last cell. Null for absolute-total formats — every other format unchanged.
    const offsets = normalizationOffsets(input);

    const consumed = new Set<string>();
    const cards: ScoreGridSection[] = [];

    if (pairs.length > 0) {
        for (const pair of pairs) {
            cards.push(buildPairCard(input, pair, byBall));
            for (const id of [...pair.sideA.ballIds, ...pair.sideB.ballIds]) consumed.add(id);
        }
    } else if (input.slotTeamGroupings.length > 0 && teamResults.length > 0) {
        const teamByLabel = new Map(teamResults.map((r) => [r.ballId.slice(TEAM_PREFIX.length), r] as const));
        for (const grouping of input.slotTeamGroupings) {
            const teamResult = teamByLabel.get(grouping.teamLabel);
            if (!teamResult) continue;
            cards.push(
                buildTeamCard(
                    input,
                    grouping,
                    teamResult,
                    byBall,
                    runningByBall?.get(teamResult.ballId),
                    offsets,
                ),
            );
            consumed.add(teamResult.ballId);
            for (const id of grouping.ballIds) consumed.add(id);
        }
    }

    // Anything not folded into a pair/team card → individual card.
    for (const r of input.result.ballResults) {
        if (consumed.has(r.ballId)) continue;
        if (r.ballId.startsWith(TEAM_PREFIX)) continue;
        cards.push(buildIndividualCard(input, r, runningByBall?.get(r.ballId), offsets));
    }

    return {
        slotIndex: input.slotIndex,
        slotDefId: input.slotDefId,
        formatId: input.formatId,
        formatLabel: input.formatLabel,
        scoringMode: input.scoringMode,
        teamShape: input.teamShape,
        allowanceLabel: input.allowanceLabel,
        cards,
        leaderboard: buildLeaderboard(input, labelToBallIds, offsets),
    };
}
