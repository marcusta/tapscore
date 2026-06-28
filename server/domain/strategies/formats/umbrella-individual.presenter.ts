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
    num,
    rankedSections,
    runningRow,
} from '../result-presenter-helpers';

export const umbrellaIndividualPresenter: FormatResultPresenter = (input) => {
    const cols = input.columns;
    const pointBearing = input.result.ballResults.filter(hasPoints);
    const runningByBall = normalizedRunning(cols, pointBearing);
    const offsets = input.runningNormalized ? normalizationOffsets(input.metrics, input.result.ballResults) : null;

    const cards: ScoreGridSection[] = input.result.ballResults.map((r) => {
        const chBall = input.slotBalls.find((b) => b.ballId === r.ballId);
        const subtitleFacts = [`slot #${input.slotIndex} · ${input.formatLabel} · ${input.allowanceLabel}`];
        if (chBall) {
            subtitleFacts.push(`CH ${num(chBall.courseHandicapSnapshot)}`);
            subtitleFacts.push(`PH ${num(chBall.playingHandicapSnapshot)}`);
        }
        subtitleFacts.push(`holes played ${r.holesPlayed}`);

        const running = runningByBall.get(r.ballId);

        return {
            kind: 'score_grid',
            componentId: input.scoreGridComponentId ?? 'category-matrix-grid',
            title: { groups: [[r.ballId]], joiner: ' & ' },
            subjectBallIds: [r.ballId],
            holes: cols.map(holeRef),
            subtitleFacts,
            rows: [
                ...categoryRows(cols, r),
                categoryPointsRow(cols, r),
                ...(running ? [runningRow(cols, running)] : []),
            ],
            footnotes: [],
            caption: NORMALIZED_CAPTION,
            totals: r.totals.map((t) => ({
                label: t.scoringType,
                value: normalizeTotal(t.value, t.scoringType, offsets),
            })),
        };
    });

    return {
        slotIndex: input.slotIndex,
        slotDefId: input.slotDefId,
        formatId: input.formatId,
        formatLabel: input.formatLabel,
        scoringMode: input.scoringMode,
        teamShape: input.teamShape,
        allowanceLabel: input.allowanceLabel,
        cards,
        leaderboard: rankedSections(input.metrics, input.result.ballResults, { offsets }),
    };
};
