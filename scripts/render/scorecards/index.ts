// Scorecards section — one card per ball, except pair-level formats
// (match-play individual, match-play better-ball, Taliban better-ball)
// which render ONE unified card per pair of balls.

import type { RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import { renderBetterBallScorecard } from './better-ball';
import { renderPairScorecard } from './match-play';
import { renderScorecard } from './stroke-play';
import { renderTalibanScorecard } from './taliban';
import { renderUmbrellaIndividualScorecard } from './umbrella-individual';
import { renderUmbrellaScorecard } from './umbrella-4-ball';

export function renderScorecards(
    ctx: RoundRenderContext,
    state: RoundRenderState,
): string {
    const { leaderboard, balls } = ctx;
    const {
        isBallBetterBall,
        isBallTaliban,
        isBallUmbrellaFourBall,
        isBallUmbrellaIndividual,
        isTalibanSlot,
        playedCourseHoles,
        resultByBall,
        formatSlotByIndex,
    } = state;

    const ballById = new Map(balls.map((b) => [b.id, b]));
    // Pair-level formats render ONE unified scorecard per pair of balls;
    // we track which balls have been folded in to avoid double-rendering
    // them as individual cards below.
    const foldedIntoPair = new Set<string>();
    const cards: string[] = [];
    for (const pr of leaderboard.pairResults) {
        const [idA, idB] = pr.balls;
        const ballA = ballById.get(idA);
        const ballB = ballById.get(idB);
        const resA = resultByBall.get(idA);
        const resB = resultByBall.get(idB);
        if (!ballA || !ballB || !resA || !resB) continue;
        const slot = formatSlotByIndex.get(pr.slotIndex);
        let kind:
            | 'match_play_individual'
            | 'match_play_better_ball'
            | 'taliban_better_ball'
            | null = null;
        if (isTalibanSlot(slot)) kind = 'taliban_better_ball';
        else if (slot?.scoringMode === 'match_play' && slot?.teamShape === 'individual')
            kind = 'match_play_individual';
        else if (slot?.scoringMode === 'match_play' && slot?.teamShape === 'better_ball')
            kind = 'match_play_better_ball';
        if (!kind) continue;
        cards.push(renderPairScorecard(ctx, state, pr, kind, ballA, ballB, resA, resB, playedCourseHoles));
        foldedIntoPair.add(idA);
        foldedIntoPair.add(idB);
    }
    for (const b of balls) {
        if (foldedIntoPair.has(b.id)) continue;
        const r = resultByBall.get(b.id);
        if (!r) continue;
        if (isBallBetterBall(b)) cards.push(renderBetterBallScorecard(ctx, state, r, b, playedCourseHoles));
        else if (isBallTaliban(b)) cards.push(renderTalibanScorecard(ctx, state, r, b, playedCourseHoles));
        else if (isBallUmbrellaFourBall(b)) cards.push(renderUmbrellaScorecard(ctx, state, r, b, playedCourseHoles));
        else if (isBallUmbrellaIndividual(b)) cards.push(renderUmbrellaIndividualScorecard(ctx, state, r, b, playedCourseHoles));
        else cards.push(renderScorecard(ctx, state, r, b, playedCourseHoles));
    }
    return `
<section>
  <h2>Scorecards</h2>
  ${cards.join('\n')}
</section>`;
}
