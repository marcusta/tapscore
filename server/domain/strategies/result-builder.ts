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
    RoundCourseHoleSnapshot,
    SlotBall,
    SlotTeamGrouping,
    StrategyResult,
} from './types';
import type {
    GridCell,
    GridRow,
    LeaderboardSection,
    MatchLine,
    RankedEntry,
    ScoreGridSection,
    SlotResultView,
} from './result-sections';

const TEAM_PREFIX = 'team:';

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
    /** Played holes, ordered — the grid columns. */
    courseHoles: RoundCourseHoleSnapshot[];
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
    return given !== null && given > 0 ? `+${given}` : '';
}

function cell(holeNumber: number, value: number | null, display: string, title?: string): GridCell {
    return title === undefined ? { holeNumber, value, display } : { holeNumber, value, display, title };
}

// --- shared rows -----------------------------------------------------------

function parSiRows(holes: RoundCourseHoleSnapshot[]): GridRow[] {
    return [
        {
            label: 'Par',
            kind: 'par',
            aggregate: 'sum',
            cells: holes.map((h) => cell(h.holeNumber, h.par, String(h.par))),
        },
        {
            label: 'SI',
            kind: 'si',
            aggregate: 'none',
            cells: holes.map((h) => cell(h.holeNumber, h.baseStrokeIndex, String(h.baseStrokeIndex))),
        },
    ];
}

/** Given / Gross / Net rows for one ball, ordered by the played holes. */
function ballScoreRows(
    holes: RoundCourseHoleSnapshot[],
    r: BallResult,
    opts: { subjectBallId?: string; given?: boolean; net?: boolean } = {},
): GridRow[] {
    const byHole = new Map(r.holes.map((h) => [h.holeNumber, h]));
    const rows: GridRow[] = [];
    const sub = opts.subjectBallId;
    if (opts.given !== false) {
        rows.push({
            label: 'Given',
            ...(sub ? { subjectBallId: sub } : {}),
            kind: 'given',
            aggregate: 'none',
            cells: holes.map((h) => {
                const hr = byHole.get(h.holeNumber);
                const given = hr && hr.gross !== null && hr.net !== null ? hr.gross - hr.net : null;
                return cell(h.holeNumber, given, givenText(given));
            }),
        });
    }
    rows.push({
        label: 'Gross',
        ...(sub ? { subjectBallId: sub } : {}),
        kind: 'gross',
        aggregate: 'sum',
        cells: holes.map((h) => {
            const g = byHole.get(h.holeNumber)?.gross ?? null;
            return cell(h.holeNumber, g, grossText(g));
        }),
    });
    if (opts.net !== false) {
        rows.push({
            label: 'Net',
            ...(sub ? { subjectBallId: sub } : {}),
            kind: 'net',
            aggregate: 'sum',
            cells: holes.map((h) => {
                const n = byHole.get(h.holeNumber)?.net ?? null;
                return cell(h.holeNumber, n, netText(n));
            }),
        });
    }
    return rows;
}

function pointsRow(
    holes: RoundCourseHoleSnapshot[],
    r: BallResult,
    label = 'Points',
    emphasis = false,
): GridRow {
    const byHole = new Map(r.holes.map((h) => [h.holeNumber, h]));
    return {
        label,
        kind: 'points',
        aggregate: 'sum',
        emphasis,
        cells: holes.map((h) => {
            const hr = byHole.get(h.holeNumber);
            const p = hr?.points ?? null;
            return cell(h.holeNumber, p, p === null ? '—' : String(p), hr?.note);
        }),
    };
}

function hasPoints(r: BallResult): boolean {
    return r.holes.some((h) => h.points !== null);
}

function footnotesFor(r: BallResult): string[] {
    return r.holes
        .filter((h) => h.note && h.points !== null && h.points !== 0)
        .map((h) => `h${h.holeNumber}: ${h.note}`);
}

// --- normalised running (köpenhamnare / umbrella) --------------------------

/** ballId → (holeNumber → normalised running) over the point-bearing results. */
function normalizedRunning(
    holes: RoundCourseHoleSnapshot[],
    results: BallResult[],
): Map<string, Map<number, number>> {
    const out = new Map<string, Map<number, number>>();
    const raw = new Map<string, number>();
    const byHole = new Map<string, Map<number, BallResult['holes'][number]>>();
    for (const r of results) {
        raw.set(r.ballId, 0);
        out.set(r.ballId, new Map());
        byHole.set(r.ballId, new Map(r.holes.map((h) => [h.holeNumber, h])));
    }
    for (const ch of holes) {
        for (const r of results) {
            const hr = byHole.get(r.ballId)!.get(ch.holeNumber);
            if (hr?.points !== null && hr?.points !== undefined) {
                raw.set(r.ballId, (raw.get(r.ballId) ?? 0) + hr.points);
            }
        }
        const min = Math.min(...results.map((r) => raw.get(r.ballId) ?? 0));
        for (const r of results) {
            out.get(r.ballId)!.set(ch.holeNumber, (raw.get(r.ballId) ?? 0) - min);
        }
    }
    return out;
}

function runningRow(holes: RoundCourseHoleSnapshot[], running: Map<number, number>): GridRow {
    return {
        label: 'Running',
        kind: 'running',
        aggregate: 'last',
        cells: holes.map((h) => {
            const v = running.get(h.holeNumber) ?? null;
            return cell(h.holeNumber, v, num(v));
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
    const holes = input.courseHoles;
    const style = pair.summaryStyle ?? 'versus';
    const pairByHole = new Map(pair.holes.map((ph) => [ph.holeNumber, ph]));

    const sidePoints = (perspective: 'A' | 'B', holeNumber: number): number | null => {
        const ph = pairByHole.get(holeNumber);
        if (!ph || ph.status === null) return null;
        if (style === 'standalone') return perspective === 'A' ? ph.fromA : ph.fromB;
        if (ph.status === 'halved') return 0;
        if (perspective === 'A') return ph.status === 'won' ? 1 : 0;
        return ph.status === 'lost' ? 1 : 0;
    };

    // normalised per-side running (lower side reads 0).
    const sideRunning = (perspective: 'A' | 'B'): Map<number, number> => {
        let rawA = 0;
        let rawB = 0;
        const m = new Map<number, number>();
        for (const ch of holes) {
            const pA = sidePoints('A', ch.holeNumber);
            const pB = sidePoints('B', ch.holeNumber);
            if (pA !== null) rawA += pA;
            if (pB !== null) rawB += pB;
            const min = Math.min(rawA, rawB);
            m.set(ch.holeNumber, (perspective === 'A' ? rawA : rawB) - min);
        }
        return m;
    };

    const rows: GridRow[] = [...parSiRows(holes)];

    const sideBlock = (side: { teamLabel?: string; ballIds: string[] }, perspective: 'A' | 'B') => {
        for (const ballId of side.ballIds) {
            const r = byBall.get(ballId);
            if (!r) continue;
            rows.push(...ballScoreRows(holes, r, { subjectBallId: ballId }));
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
            cells: holes.map((h) => {
                const v = sidePoints(perspective, h.holeNumber);
                return cell(h.holeNumber, v, num(v));
            }),
        });
        const running = sideRunning(perspective);
        const run = sideRow('run');
        rows.push({
            ...run,
            kind: 'running',
            aggregate: 'last',
            cells: holes.map((h) => {
                const v = running.get(h.holeNumber) ?? null;
                return cell(h.holeNumber, v, num(v));
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
        cells: holes.map((h) => {
            const ph = pairByHole.get(h.holeNumber);
            return cell(h.holeNumber, null, ph?.note ?? '—');
        }),
    });

    // Cumulative match line (idiom-specific).
    let running = 0;
    const matchByHole = new Map<number, number>();
    for (const ch of holes) {
        const ph = pairByHole.get(ch.holeNumber);
        if (ph?.pointsDelta !== null && ph?.pointsDelta !== undefined) running += ph.pointsDelta;
        matchByHole.set(ch.holeNumber, running);
    }
    rows.push({
        label: 'Match',
        kind: 'status',
        aggregate: 'none',
        emphasis: true,
        cells: holes.map((h) =>
            cell(h.holeNumber, null, formatMatchRunning(matchByHole.get(h.holeNumber) ?? 0, style)),
        ),
    });

    return {
        kind: 'score_grid',
        title: { groups: [pair.sideA.ballIds, pair.sideB.ballIds], joiner: ' vs. ' },
        subjectBallIds: [...pair.sideA.ballIds, ...pair.sideB.ballIds],
        holes: holes.map((h) => ({ holeNumber: h.holeNumber })),
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
    running: Map<number, number> | undefined,
): ScoreGridSection {
    const holes = input.courseHoles;
    const rows: GridRow[] = [...parSiRows(holes)];

    for (const ballId of grouping.ballIds) {
        const r = byBall.get(ballId);
        if (!r) continue; // some team formats (better-ball stableford) emit only the aggregate
        rows.push(...ballScoreRows(holes, r, { subjectBallId: ballId, given: false }));
    }

    // Team combined gross (LT for umbrella / best-ball gross for better-ball).
    if (teamResult.holes.some((h) => h.gross !== null)) {
        const byHole = new Map(teamResult.holes.map((h) => [h.holeNumber, h]));
        rows.push({
            label: 'Team gross',
            kind: 'gross',
            aggregate: 'sum',
            cells: holes.map((h) => {
                const g = byHole.get(h.holeNumber)?.gross ?? null;
                return cell(h.holeNumber, g, g === null ? '—' : String(g));
            }),
        });
    }
    if (teamResult.holes.some((h) => h.net !== null)) {
        const byHole = new Map(teamResult.holes.map((h) => [h.holeNumber, h]));
        rows.push({
            label: 'Team net',
            kind: 'net',
            aggregate: 'sum',
            cells: holes.map((h) => {
                const n = byHole.get(h.holeNumber)?.net ?? null;
                return cell(h.holeNumber, n, netText(n));
            }),
        });
    }
    rows.push(pointsRow(holes, teamResult, 'Team points', true));
    if (running) rows.push(runningRow(holes, running));

    return {
        kind: 'score_grid',
        title: { groups: [grouping.ballIds], joiner: ' & ' },
        subjectBallIds: grouping.ballIds,
        holes: holes.map((h) => ({ holeNumber: h.holeNumber })),
        subtitleFacts: [
            `slot #${input.slotIndex} · ${input.formatLabel} · ${input.allowanceLabel}`,
            `holes played ${teamResult.holesPlayed}`,
        ],
        rows,
        footnotes: footnotesFor(teamResult),
        totals: teamResult.totals.map((t) => ({ label: t.scoringType, value: t.value })),
    };
}

// --- individual card -------------------------------------------------------

function buildIndividualCard(
    input: BuildSlotInput,
    r: BallResult,
    running: Map<number, number> | undefined,
): ScoreGridSection {
    const holes = input.courseHoles;
    const chBall = input.slotBalls.find((b) => b.ballId === r.ballId);
    const rows: GridRow[] = [...parSiRows(holes), ...ballScoreRows(holes, r)];
    if (hasPoints(r)) rows.push(pointsRow(holes, r));
    if (running) rows.push(runningRow(holes, running));

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
        holes: holes.map((h) => ({ holeNumber: h.holeNumber })),
        subtitleFacts: facts,
        rows,
        footnotes: footnotesFor(r),
        totals: r.totals.map((t) => ({ label: t.scoringType, value: t.value })),
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

function buildLeaderboard(input: BuildSlotInput, labelToBallIds: Map<string, string[]>): LeaderboardSection[] {
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
                total: t.value,
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
    let runningByBall: Map<string, Map<number, number>> | null = null;
    if (input.runningNormalized) {
        const pointBearing = input.result.ballResults.filter(hasPoints);
        if (pointBearing.length > 0) runningByBall = normalizedRunning(input.courseHoles, pointBearing);
    }

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
        cards.push(buildIndividualCard(input, r, runningByBall?.get(r.ballId)));
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
        leaderboard: buildLeaderboard(input, labelToBallIds),
    };
}
