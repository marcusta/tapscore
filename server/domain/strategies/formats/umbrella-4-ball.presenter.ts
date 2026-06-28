import type { ScoreGridSection } from '../result-sections';
import type { FormatResultPresenter } from '../result-presenter';
import {
    categoryPointsRow,
    categoryRows,
    hasPoints,
    holeRef,
    NORMALIZED_CAPTION,
    normalizeTotal,
    normalizationOffsets,
    normalizedRunning,
    rankedSections,
    runningRow,
} from '../result-presenter-helpers';

const TEAM_PREFIX = 'team:';

export const umbrella4BallPresenter: FormatResultPresenter = (input) => {
    const cols = input.columns;
    const teamResults = input.result.ballResults.filter((r) => r.ballId.startsWith(TEAM_PREFIX));
    const pointBearing = input.result.ballResults.filter(hasPoints);
    const runningByBall = normalizedRunning(cols, pointBearing);
    const offsets = input.runningNormalized ? normalizationOffsets(input.metrics, input.result.ballResults) : null;
    const labelToBallIds = new Map(input.slotTeamGroupings.map((g) => [g.teamLabel, g.ballIds] as const));

    const cards: ScoreGridSection[] = [];
    for (const grouping of input.slotTeamGroupings) {
        const teamResult = teamResults.find((r) => r.ballId === `${TEAM_PREFIX}${grouping.teamLabel}`);
        if (!teamResult) continue;

        const running = runningByBall.get(teamResult.ballId);

        cards.push({
            kind: 'score_grid',
            componentId: input.scoreGridComponentId ?? 'category-matrix-grid',
            title: { groups: [grouping.ballIds], joiner: ' & ' },
            subjectBallIds: grouping.ballIds,
            holes: cols.map(holeRef),
            subtitleFacts: [
                `slot #${input.slotIndex} · ${input.formatLabel} · ${input.allowanceLabel}`,
                `holes played ${teamResult.holesPlayed}`,
            ],
            rows: [
                ...categoryRows(cols, teamResult),
                categoryPointsRow(cols, teamResult, 'Team points'),
                ...(running ? [runningRow(cols, running)] : []),
            ],
            footnotes: [],
            caption: NORMALIZED_CAPTION,
            totals: teamResult.totals.map((t) => ({
                label: t.scoringType,
                value: normalizeTotal(t.value, t.scoringType, offsets),
            })),
        });
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
