// Format-owned presenter for kopenhamnare_individual (Split sixes).
//
// Forked from the generic `defaultGridPresenter` so Split sixes can own its
// scorecard view WITHOUT affecting stroke play (which keeps the shared default
// grid). The format-specific choices that live here:
//   - no "holes played N" subtitle fact;
//   - the cumulative row is labelled "Total" (not "Running") and shows a value
//     ONLY on holes that have actually been played — blank afterwards, instead
//     of carrying the leader-relative total forward across unplayed holes;
//   - no card-footer totals (the points total already reads off the ranked
//     leaderboard, so "points = N" under the card is redundant).
//
// Everything else (par/SI/gross/net/points rows, the ranked points section, the
// normalized-running maths) reuses the decision-free shared helpers.

import type { BallResult } from '../types';
import type {
    GridRow,
    ScoreGridSection,
} from '../result-sections';
import type {
    FormatResultInput,
    FormatResultPresenter,
} from '../result-presenter';
import {
    ballScoreRows,
    byPlayHole,
    cell,
    footnotesFor,
    hasPoints,
    holeRef,
    NORMALIZED_CAPTION,
    normalizationOffsets,
    normalizedRunning,
    num,
    parRow,
    pointsRow,
    rankedSections,
    type ResultColumn,
    siRow,
} from '../result-presenter-helpers';

/**
 * "Total" row: the cumulative leader-relative points, shown ONLY on holes the
 * subject has played (a hole is played when it carries a points value). Unplayed
 * holes render blank rather than carrying the last total forward.
 */
function totalRow(cols: ResultColumn[], r: BallResult, running: Map<string, number>): GridRow {
    const byHole = byPlayHole(r);
    return {
        label: 'Total',
        kind: 'running',
        aggregate: 'last',
        cells: cols.map((c) => {
            const played = byHole.get(c.playHoleId)?.points != null;
            const v = played ? running.get(c.playHoleId) ?? null : null;
            return cell(c, v, played ? num(v) : '');
        }),
    };
}

function buildCard(
    input: FormatResultInput,
    r: BallResult,
    running: Map<string, number> | undefined,
): ScoreGridSection {
    const cols = input.columns;
    const chBall = input.slotBalls.find((b) => b.ballId === r.ballId);

    const rows: GridRow[] = [parRow(cols), siRow(cols, input.effectiveSi?.get(r.ballId)), ...ballScoreRows(cols, r)];
    if (hasPoints(r)) rows.push(pointsRow(cols, r));
    if (running) rows.push(totalRow(cols, r, running));

    // No "holes played N" fact — Split sixes omits it.
    const subtitleFacts = [`slot #${input.slotIndex} · ${input.formatLabel} · ${input.allowanceLabel}`];
    if (chBall) {
        subtitleFacts.push(`CH ${num(chBall.courseHandicapSnapshot)}`);
        subtitleFacts.push(`PH ${num(chBall.playingHandicapSnapshot)}`);
    }

    return {
        kind: 'score_grid',
        ...(input.scoreGridComponentId ? { componentId: input.scoreGridComponentId } : {}),
        title: { groups: [[r.ballId]], joiner: ' & ' },
        subjectBallIds: [r.ballId],
        holes: cols.map(holeRef),
        subtitleFacts,
        rows,
        footnotes: footnotesFor(r),
        ...(input.runningNormalized ? { caption: NORMALIZED_CAPTION } : {}),
        // No card-footer totals — the points total lives on the leaderboard.
        totals: [],
    };
}

export const kopenhamnareIndividualPresenter: FormatResultPresenter = (input) => {
    const cols = input.columns;

    // Normalized running over the point-bearing balls, gated by descriptor.
    let runningByBall: Map<string, Map<string, number>> | null = null;
    if (input.runningNormalized) {
        const pointBearing = input.result.ballResults.filter(hasPoints);
        if (pointBearing.length > 0) runningByBall = normalizedRunning(cols, pointBearing);
    }
    // Leader-relative offsets for the ranked totals (min → 0).
    const offsets = input.runningNormalized ? normalizationOffsets(input.metrics, input.result.ballResults) : null;

    const cards = input.result.ballResults.map((r) => buildCard(input, r, runningByBall?.get(r.ballId)));

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
