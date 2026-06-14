// Phase 2.6c — scramble (team-ball, 2..4).
//
// One shared ball per team (of 2, 3, or 4), scored as stroke play at the ball
// level (gross + net) — same per-hole arithmetic as stroke-play individual.
// The "scramble" character lives in ball creation: the team ball's CH is the
// by-rank weighted combination of the members' course handicaps
// (`scramble_team`). The slot applies the flat allowance to that ball CH.
//
// `ballRequirement` declares 2..4 producers + `ballMode: 'team'` so own-ball
// input is rejected and the compiler auto-selects the team balls.

import { strokePlayIndividual } from './stroke-play-individual';
import type { FormatStrategy } from '../format-strategy';
import { deriveAllowance } from './_shared';

export const SCRAMBLE_ID = 'scramble';

export const scramble: FormatStrategy = {
    id: SCRAMBLE_ID,

    ballRequirement() {
        return { producerCount: { min: 2, max: 4 }, ballMode: 'team', requiresSlotTeamGrouping: false };
    },

    deriveSlotBalls: deriveAllowance,

    score(input) {
        return strokePlayIndividual.score(input);
    },
};
