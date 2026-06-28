// Format-owned presenter for stableford_better_ball — the only remaining
// team-card (better-ball) format. Umbrella 4-ball took the category-matrix
// branch (Phase D) and the match better-ball formats took compact pairs
// (Phase E), so this is bespoke for ONE format: no speculative team-grid
// factory, just the moved buildTeamCard composition.
//
// View decisions that live here (NOT in shared helpers):
//   - one card per team grouping: Par/SI, then per point-bearing member the
//     Given/Gross rows + that member's own Points row (so the reader sees WHICH
//     ball fed the team's best-ball per hole), then Team gross / Team net rows
//     (only when the aggregate carries them), the emphasised Team points row,
//     and a Running row only under the Phase D normalized guard;
//   - team title/subjects are the grouping ballIds; subtitle has slot + holes
//     played (no CH/PH for team cards);
//   - componentId omitted unless the descriptor declares one (this format does
//     not — the card carries no componentId);
//   - the ranked leaderboard resolves `team:LABEL` back to member ballIds.

import type { BallResult, SlotTeamGrouping } from '../types';
import type { GridRow, ScoreGridSection } from '../result-sections';
import type { FormatResultInput, FormatResultPresenter } from '../result-presenter';
import {
    ballScoreRows,
    byPlayHole,
    cell,
    footnotesFor,
    hasPoints,
    holeRef,
    NORMALIZED_CAPTION,
    netText,
    normalizeTotal,
    normalizationOffsets,
    normalizedRunning,
    parSiRows,
    pointsRow,
    rankedSections,
    runningRow,
} from '../result-presenter-helpers';

const TEAM_PREFIX = 'team:';

function buildTeamCard(
    input: FormatResultInput,
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
            // Points-bearing per-ball result: show each producer's strokes
            // received + gross + their individual points so the reader sees
            // WHICH ball fed the team's best-ball per hole.
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

export const stablefordBetterBallPresenter: FormatResultPresenter = (input) => {
    const cols = input.columns;
    const byBall = new Map(input.result.ballResults.map((r) => [r.ballId, r] as const));
    const teamResults = input.result.ballResults.filter((r) => r.ballId.startsWith(TEAM_PREFIX));
    const labelToBallIds = new Map(input.slotTeamGroupings.map((g) => [g.teamLabel, g.ballIds] as const));

    // Normalized running over the point-bearing balls, gated by descriptor.
    let runningByBall: Map<string, Map<string, number>> | null = null;
    if (input.runningNormalized) {
        const pointBearing = input.result.ballResults.filter(hasPoints);
        if (pointBearing.length > 0) runningByBall = normalizedRunning(cols, pointBearing);
    }
    const offsets = input.runningNormalized ? normalizationOffsets(input.metrics, input.result.ballResults) : null;

    const teamByLabel = new Map(teamResults.map((r) => [r.ballId.slice(TEAM_PREFIX.length), r] as const));
    const cards: ScoreGridSection[] = [];
    for (const grouping of input.slotTeamGroupings) {
        const teamResult = teamByLabel.get(grouping.teamLabel);
        if (!teamResult) continue;
        cards.push(
            buildTeamCard(input, grouping, teamResult, byBall, runningByBall?.get(teamResult.ballId), offsets),
        );
    }

    const ballIdsFor = (resultBallId: string): string[] => {
        if (!resultBallId.startsWith(TEAM_PREFIX)) return [resultBallId];
        return labelToBallIds.get(resultBallId.slice(TEAM_PREFIX.length)) ?? [resultBallId];
    };

    return {
        slotIndex: input.slotIndex,
        slotDefId: input.slotDefId,
        formatId: input.formatId,
        formatLabel: input.formatLabel,
        scoringMode: input.scoringMode,
        teamShape: input.teamShape,
        allowanceLabel: input.allowanceLabel,
        cards,
        leaderboard: rankedSections(input.metrics, input.result.ballResults, { offsets, ballIdsFor }),
    };
};
