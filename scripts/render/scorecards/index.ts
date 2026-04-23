// Scorecards section — one card per participant, except pair-level
// formats (match-play individual, match-play better-ball, Taliban
// better-ball) which render ONE unified card per pair.

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
    const { leaderboard, participants } = ctx;
    const {
        isParticipantBetterBall,
        isParticipantTaliban,
        isParticipantUmbrellaFourBall,
        isParticipantUmbrellaIndividual,
        isTalibanSlot,
        playedCourseHoles,
        slotByParticipantId,
    } = state;

    const resultByParticipant = new Map(leaderboard.participantResults.map((r) => [r.participantId, r]));
    const partById = new Map(participants.map((p) => [p.id, p]));
    // Pair-level formats (match-play individual, Taliban better-ball)
    // render ONE unified scorecard per pair instead of a separate card
    // per participant — so you can compare hole-by-hole vertically.
    // We track which participants have already been folded into a pair
    // card to avoid double-rendering; orphans (odd-count match-play)
    // still fall through to the individual renderer below.
    const foldedIntoPair = new Set<string>();
    const cards: string[] = [];
    for (const pr of leaderboard.pairResults) {
        const [idA, idB] = pr.participants;
        const partA = partById.get(idA);
        const partB = partById.get(idB);
        const resA = resultByParticipant.get(idA);
        const resB = resultByParticipant.get(idB);
        if (!partA || !partB || !resA || !resB) continue;
        // Use participant A's slot to detect the format kind — both
        // participants of a pair share a slot by construction.
        const slot = slotByParticipantId.get(idA);
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
        if (!kind) continue; // pair from a future pair-level format — leave as-is
        cards.push(renderPairScorecard(ctx, state, pr, kind, partA, partB, resA, resB, playedCourseHoles));
        foldedIntoPair.add(idA);
        foldedIntoPair.add(idB);
    }
    for (const p of participants) {
        if (foldedIntoPair.has(p.id)) continue;
        const r = resultByParticipant.get(p.id);
        if (!r) continue;
        if (isParticipantBetterBall(p)) cards.push(renderBetterBallScorecard(ctx, state, r, p, playedCourseHoles));
        else if (isParticipantTaliban(p)) cards.push(renderTalibanScorecard(ctx, state, r, p, playedCourseHoles));
        else if (isParticipantUmbrellaFourBall(p)) cards.push(renderUmbrellaScorecard(ctx, state, r, p, playedCourseHoles));
        else if (isParticipantUmbrellaIndividual(p)) cards.push(renderUmbrellaIndividualScorecard(ctx, state, r, p, playedCourseHoles));
        else cards.push(renderScorecard(ctx, state, r, p, playedCourseHoles));
    }
    return `
<section>
  <h2>Scorecards</h2>
  ${cards.join('\n')}
</section>`;
}
