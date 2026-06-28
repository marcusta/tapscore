// Format-owned presenter for the remaining default-grid individual formats
// (stroke_play_individual, kopenhamnare_individual). Both render ONE
// non-compact individual card per ball plus a ranked leaderboard; they differ
// only in data the presenter already reads from `input` (metrics, normalized
// running, whether each ball bears points, effective SI). So this presenter is
// ZERO-CONFIG — one stateless instance serves both formats.
//
// View decisions that live here (NOT in shared helpers):
//   - one individual card per non-team ball: Par, SI, Given/Gross/Net, then a
//     Points row ONLY when the ball bears points, then a Running row ONLY when
//     the ball has normalized running data (the Phase D guard);
//   - componentId is omitted unless the descriptor declares one (these formats
//     do not, so the card carries no componentId — NOT 'default-score-grid');
//   - subtitle: slot/label/allowance, CH/PH when the slot ball exists, holes
//     played; the normalized caption only when the format runs normalized;
//   - totals + leaderboard normalized to the trailing subject only when the
//     format runs normalized (offsets), otherwise absolute.
// The pure row/card building blocks stay decision-free in
// result-presenter-helpers.

import type { BallResult } from '../types';
import type { GridRow, ScoreGridSection } from '../result-sections';
import type { FormatResultInput, FormatResultPresenter } from '../result-presenter';
import {
    ballScoreRows,
    footnotesFor,
    hasPoints,
    holeRef,
    NORMALIZED_CAPTION,
    normalizeTotal,
    normalizationOffsets,
    normalizedRunning,
    num,
    parRow,
    pointsRow,
    rankedSections,
    runningRow,
    siRow,
} from '../result-presenter-helpers';

function buildIndividualCard(
    input: FormatResultInput,
    r: BallResult,
    running: Map<string, number> | undefined,
    offsets: Map<string, number> | null,
): ScoreGridSection {
    const cols = input.columns;
    const chBall = input.slotBalls.find((b) => b.ballId === r.ballId);
    const rows: GridRow[] = [parRow(cols), siRow(cols, input.effectiveSi?.get(r.ballId)), ...ballScoreRows(cols, r)];
    if (hasPoints(r)) rows.push(pointsRow(cols, r));
    if (running) rows.push(runningRow(cols, running));

    const subtitleFacts = [`slot #${input.slotIndex} · ${input.formatLabel} · ${input.allowanceLabel}`];
    if (chBall) {
        subtitleFacts.push(`CH ${num(chBall.courseHandicapSnapshot)}`);
        subtitleFacts.push(`PH ${num(chBall.playingHandicapSnapshot)}`);
    }
    subtitleFacts.push(`holes played ${r.holesPlayed}`);

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
        totals: r.totals.map((t) => ({
            label: t.scoringType,
            value: normalizeTotal(t.value, t.scoringType, offsets),
        })),
    };
}

/**
 * Generic individual-grid presenter. Zero-config: every decision is derived
 * from `input`, so one shared instance serves stroke play and Split sixes.
 */
export function defaultGridPresenter(): FormatResultPresenter {
    return (input) => {
        const cols = input.columns;

        // Normalized running over the point-bearing balls, gated by descriptor.
        let runningByBall: Map<string, Map<string, number>> | null = null;
        if (input.runningNormalized) {
            const pointBearing = input.result.ballResults.filter(hasPoints);
            if (pointBearing.length > 0) runningByBall = normalizedRunning(cols, pointBearing);
        }
        // Same gate on the totals: ranked + card totals read relative to the
        // trailing subject so the displayed total matches the running row's last
        // cell. Null for absolute-total formats.
        const offsets = input.runningNormalized ? normalizationOffsets(input.metrics, input.result.ballResults) : null;

        const cards = input.result.ballResults.map((r) =>
            buildIndividualCard(input, r, runningByBall?.get(r.ballId), offsets),
        );

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
}
