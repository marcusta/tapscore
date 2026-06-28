// Format-owned presenter for the match-like formats (match_play_individual,
// match_play_better_ball, taliban_better_ball). All three share ONE compact
// match view, so they share ONE presenter constructor — the format side owns
// the card shape and odd-ball handling, not the central builder.
//
// View decisions that live here (NOT in shared helpers):
//   - cards are built by iterating `pairResults`, so a ball in no pair (the
//     stranded odd-one-out) gets no card at all;
//   - each pair → a titleless compact card: Par, one team-tinted net row per
//     ball per side, then a single cumulative Standing row;
//   - the leaderboard is a single match-summary section (empty when no pairs).
// The pure row/panel building blocks (parRow, matchNetRow, cell, matchPanel,
// matchSummarySection) stay decision-free in result-presenter-helpers.

import type { BallResult, PairBallResult } from '../types';
import type { GridRow, ScoreGridSection } from '../result-sections';
import type { FormatResultInput, FormatResultPresenter } from '../result-presenter';
import {
    cell,
    holeRef,
    matchNetRow,
    matchSummarySection,
    parRow,
} from '../result-presenter-helpers';

function buildPairCard(
    input: FormatResultInput,
    pair: PairBallResult,
    byBall: Map<string, BallResult>,
): ScoreGridSection {
    const cols = input.columns;
    const pairById = new Map<string, PairBallResult['holes'][number]>();
    for (const ph of pair.holes) if (ph.playHoleId !== undefined) pairById.set(ph.playHoleId, ph);

    // Compact match card: Par, then every player's net (team-tinted, with the
    // deciding-ball shape per hole), then ONE running standing row. The verbose
    // per-side points/run/status rows are gone — the shapes + standing carry it.
    const rows: GridRow[] = [parRow(cols)];

    const sideNetRows = (side: { ballIds: string[] }, team: 'a' | 'b'): void => {
        for (const ballId of side.ballIds) {
            const r = byBall.get(ballId);
            if (r) rows.push(matchNetRow(cols, r, team));
        }
    };
    sideNetRows(pair.sideA, 'a');
    sideNetRows(pair.sideB, 'b');

    // Cumulative match standing per hole ("1UP" / "AS" / taliban "+2").
    let running = 0;
    const matchById = new Map<string, number>();
    for (const c of cols) {
        const ph = pairById.get(c.playHoleId);
        if (ph?.pointsDelta !== null && ph?.pointsDelta !== undefined) running += ph.pointsDelta;
        matchById.set(c.playHoleId, running);
    }
    rows.push({
        label: 'Standing',
        kind: 'status',
        aggregate: 'none',
        emphasis: true,
        // Show the standing ONLY on played holes; always the positive magnitude
        // (or AS), with colour — not the sign — telling who's up.
        cells: cols.map((c) => {
            const ph = pairById.get(c.playHoleId);
            if (!ph || ph.status === null) return cell(c, null, '');
            const lead = matchById.get(c.playHoleId) ?? 0;
            const gc = cell(c, null, lead === 0 ? 'AS' : String(Math.abs(lead)));
            return lead > 0 ? { ...gc, team: 'a' as const } : lead < 0 ? { ...gc, team: 'b' as const } : gc;
        }),
    });

    return {
        kind: 'score_grid',
        ...(input.scoreGridComponentId ? { componentId: input.scoreGridComponentId } : {}),
        // No title — the structured match panel + the team-tinted row labels
        // already identify the two sides (avoids repeating the player names).
        title: { groups: [], joiner: '' },
        subjectBallIds: [...pair.sideA.ballIds, ...pair.sideB.ballIds],
        holes: cols.map(holeRef),
        subtitleFacts: [`${input.formatLabel} · ${input.allowanceLabel}`],
        rows,
        footnotes: [],
        totals: [],
    };
}

/**
 * Build the shared match presenter. No config today — all three match-like
 * formats render identically — but kept as a constructor so the family can
 * diverge format-side without reaching back into a central builder.
 */
export function matchPlayPresenter(): FormatResultPresenter {
    return (input) => {
        const byBall = new Map(input.result.ballResults.map((r) => [r.ballId, r] as const));
        const pairs = input.result.pairResults ?? [];
        return {
            slotIndex: input.slotIndex,
            slotDefId: input.slotDefId,
            formatId: input.formatId,
            formatLabel: input.formatLabel,
            scoringMode: input.scoringMode,
            teamShape: input.teamShape,
            allowanceLabel: input.allowanceLabel,
            cards: pairs.map((pair) => buildPairCard(input, pair, byBall)),
            leaderboard: pairs.length > 0 ? [matchSummarySection(pairs)] : [],
        };
    };
}
