// Phase 2.6c — greensomes (team-ball, 2..2).
//
// One shared ball per pair, scored as stroke play at the ball level (gross +
// net), identical per-hole arithmetic to stroke-play individual / foursomes.
// What makes it "greensomes" lives entirely in ball creation: the team ball's
// CH is the weighted combination of the pair's two course handicaps
// (`greensomes_pair`). The slot applies the flat allowance to that ball CH.
//
// `ballRequirement` declares 2..2 + `ballMode: 'team'` so the compiler rejects
// own-ball input and auto-selects the pair balls.

import { strokePlayIndividual } from './stroke-play-individual';
import type { FormatStrategy } from '../format-strategy';
import { deriveAllowance } from './_shared';

export const GREENSOMES_ID = 'greensomes';

export const greensomes: FormatStrategy = {
    id: GREENSOMES_ID,

    ballRequirement() {
        return { producerCount: { min: 2, max: 2 }, ballMode: 'team', requiresSlotTeamGrouping: false };
    },

    deriveSlotBalls: deriveAllowance,

    score(input) {
        return strokePlayIndividual.score(input);
    },
};
