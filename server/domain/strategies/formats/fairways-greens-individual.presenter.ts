// Fairways and greens result view: the umbrella-style category matrix, with an
// ABSOLUTE running row.
//
// Umbrella and köpenhamnare normalise their running totals to the leader
// because their per-hole points are field-relative — a lone player's umbrella
// total is meaningless. Fairways and greens is the opposite: every point is
// earned against par and the golfer's own ball, so 23 points means 23 points
// whether three played or one did. Normalising it would erase exactly the fact
// the game is about.

import type { BallResult } from '../types';
import type { GridRow, ScoreGridSection } from '../result-sections';
import type { FormatResultPresenter } from '../result-presenter';
import type { ResultColumn } from '../result-presenter-helpers';
import {
    byPlayHole,
    categoryPointsRow,
    categoryRows,
    footnotesFor,
    holeRef,
    num,
    parRow,
    rankedSections,
    runningRow,
} from '../result-presenter-helpers';

/** Cumulative points per column — plain sum, no leader offset. */
function absoluteRunning(cols: ResultColumn[], r: BallResult): Map<string, number> {
    const byId = byPlayHole(r);
    const out = new Map<string, number>();
    let sum = 0;
    for (const c of cols) {
        const p = byId.get(c.playHoleId)?.points;
        if (p !== null && p !== undefined) sum += p;
        out.set(c.playHoleId, sum);
    }
    return out;
}

export const fairwaysGreensIndividualPresenter: FormatResultPresenter = (input) => {
    const cols = input.columns;

    const cards: ScoreGridSection[] = input.result.ballResults.map((r) => {
        const chBall = input.slotBalls.find((b) => b.ballId === r.ballId);
        const subtitleFacts = [`slot #${input.slotIndex} · ${input.formatLabel} · ${input.allowanceLabel}`];
        if (chBall) {
            subtitleFacts.push(`HCP ${num(chBall.courseHandicapSnapshot)}`);
            subtitleFacts.push(`PH ${num(chBall.playingHandicapSnapshot)}`);
        }
        subtitleFacts.push(`holes played ${r.holesPlayed}`);

        const rows: GridRow[] = [
            parRow(cols),
            ...categoryRows(cols, r),
            categoryPointsRow(cols, r),
            runningRow(cols, absoluteRunning(cols, r)),
        ];

        return {
            kind: 'score_grid',
            componentId: input.scoreGridComponentId ?? 'category-matrix-grid',
            title: { groups: [[r.ballId]], joiner: ' & ' },
            subjectBallIds: [r.ballId],
            holes: cols.map(holeRef),
            subtitleFacts,
            rows,
            footnotes: footnotesFor(r),
            totals: r.totals.map((t) => ({ label: t.scoringType, value: t.value })),
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
