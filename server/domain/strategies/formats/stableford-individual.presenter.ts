import type { ScoreGridSection } from '../result-sections';
import type { FormatResultPresenter } from '../result-presenter';
import {
    ballScoreRows,
    footnotesFor,
    holeRef,
    num,
    parRow,
    pointsRow,
    rankedSections,
    siRow,
} from '../result-presenter-helpers';

export const stablefordIndividualPresenter: FormatResultPresenter = (input) => {
    const cols = input.columns;
    const cards: ScoreGridSection[] = input.result.ballResults.map((r) => {
        const chBall = input.slotBalls.find((b) => b.ballId === r.ballId);
        const subtitleFacts = [`slot #${input.slotIndex} · ${input.formatLabel} · ${input.allowanceLabel}`];
        if (chBall) {
            subtitleFacts.push(`CH ${num(chBall.courseHandicapSnapshot)}`);
            subtitleFacts.push(`PH ${num(chBall.playingHandicapSnapshot)}`);
        }
        subtitleFacts.push(`holes played ${r.holesPlayed}`);

        return {
            kind: 'score_grid',
            componentId: input.scoreGridComponentId ?? 'default-score-grid',
            title: { groups: [[r.ballId]], joiner: ' & ' },
            subjectBallIds: [r.ballId],
            holes: cols.map(holeRef),
            subtitleFacts,
            rows: [
                parRow(cols),
                siRow(cols, input.effectiveSi?.get(r.ballId)),
                ...ballScoreRows(cols, r),
                pointsRow(cols, r),
            ],
            footnotes: footnotesFor(r),
            totals: [],
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
        leaderboard: rankedSections(input.metrics, input.result.ballResults, { columns: cols }),
    };
};
