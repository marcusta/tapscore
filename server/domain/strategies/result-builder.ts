// Phase 2.6b-final / Slice 2b — pure StrategyResult → SlotResultView builder.
//
// This is the default (transitional) builder for formats not yet migrated to
// their own presenter. It is DATA-DRIVEN, never format-id-driven:
//   - team groupings + a `team:<label>` aggregate → team cards;
//   - otherwise             → one individual card per ball.
// Match-like formats (pairResults) have migrated to their own presenter; this
// builder no longer knows about pairs. The strategy already owns every scoring
// rule; this builder only reshapes its output (gross / net / points / status /
// notes) into rows + ranked sections. The only arithmetic here is presentation arithmetic shared
// across all formats: per-hole strokes-given recovered as `gross − net`, and
// normalised running totals (cumulative points minus the trailing subject),
// both gated by data, not by a format identity.

import type {
    BallResult,
    SlotTeamGrouping,
} from './types';
import type {
    GridRow,
    LeaderboardSection,
    ScoreGridSection,
    SlotResultView,
} from './result-sections';
import {
    ballScoreRows,
    byPlayHole,
    cell,
    footnotesFor,
    hasPoints,
    holeRef,
    netText,
    NORMALIZED_CAPTION,
    normalizeTotal,
    normalizationOffsets,
    normalizedRunning,
    num,
    parRow,
    parSiRows,
    pointsRow,
    rankedSections,
    runningRow,
    siRow,
    type ResultColumn,
} from './result-presenter-helpers';
import type { FormatResultInput } from './result-presenter';

export type { ResultColumn } from './result-presenter-helpers';

const TEAM_PREFIX = 'team:';

export type { FormatResultInput } from './result-presenter';

/** @deprecated use FormatResultInput */
export type BuildSlotInput = FormatResultInput;

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
    const rows: GridRow[] = [];
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
    if (running) rows.push(runningRow(cols, running));

    return {
        kind: 'score_grid',
        ...(input.scoreGridComponentId ? { componentId: input.scoreGridComponentId } : {}),
        title: { groups: [grouping.ballIds], joiner: ' & ' },
        subjectBallIds: grouping.ballIds,
        holes: cols.map(holeRef),
        subtitleFacts: [
            `slot #${input.slotIndex} · ${input.formatLabel} · ${input.allowanceLabel}`,
            `holes played ${teamResult.holesPlayed}`,
        ],
        rows,
        footnotes: footnotesFor(teamResult),
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
    const rows: GridRow[] = [parRow(cols), siRow(cols, input.effectiveSi?.get(r.ballId)), ...ballScoreRows(cols, r)];
    if (hasPoints(r)) rows.push(pointsRow(cols, r));
    if (running) rows.push(runningRow(cols, running));

    const facts = [`slot #${input.slotIndex} · ${input.formatLabel} · ${input.allowanceLabel}`];
    if (chBall) {
        facts.push(`CH ${num(chBall.courseHandicapSnapshot)}`);
        facts.push(`PH ${num(chBall.playingHandicapSnapshot)}`);
    }
    facts.push(`holes played ${r.holesPlayed}`);

    return {
        kind: 'score_grid',
        ...(input.scoreGridComponentId ? { componentId: input.scoreGridComponentId } : {}),
        title: { groups: [[r.ballId]], joiner: ' & ' },
        subjectBallIds: [r.ballId],
        holes: cols.map(holeRef),
        subtitleFacts: facts,
        rows,
        footnotes: footnotesFor(r),
        ...(input.runningNormalized ? { caption: NORMALIZED_CAPTION } : {}),
        totals: r.totals.map((t) => ({
            label: t.scoringType,
            value: normalizeTotal(t.value, t.scoringType, offsets),
        })),
    };
}

// --- leaderboard sections --------------------------------------------------

function buildLeaderboard(
    input: BuildSlotInput,
    labelToBallIds: Map<string, string[]>,
    offsets: Map<string, number> | null,
): LeaderboardSection[] {
    const ballIdsFor = (resultBallId: string): string[] => {
        if (resultBallId.startsWith(TEAM_PREFIX)) {
            return labelToBallIds.get(resultBallId.slice(TEAM_PREFIX.length)) ?? [resultBallId];
        }
        return [resultBallId];
    };

    return rankedSections(input.metrics, input.result.ballResults, {
        offsets,
        ballIdsFor,
    });
}

// --- entry point -----------------------------------------------------------

export function buildSlotResult(input: BuildSlotInput): SlotResultView {
    const byBall = new Map(input.result.ballResults.map((r) => [r.ballId, r] as const));
    const labelToBallIds = new Map(input.slotTeamGroupings.map((g) => [g.teamLabel, g.ballIds] as const));

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
    const offsets = input.runningNormalized ? normalizationOffsets(input.metrics, input.result.ballResults) : null;

    const consumed = new Set<string>();
    const cards: ScoreGridSection[] = [];

    if (input.slotTeamGroupings.length > 0 && teamResults.length > 0) {
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

    // Anything not folded into a team card → individual card.
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
