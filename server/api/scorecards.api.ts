import { Type, type Static } from '@sinclair/typebox';
import { requireAuth } from '@basics/core/server/auth';
import type { ScorecardService } from '../services/scorecard.service';

// --- Input schemas ---

const ByBallInput = Type.Object({ ballId: Type.String() });
const ByRoundInput = Type.Object({ roundId: Type.String() });

// --- API descriptor ---

export function createScorecardsApi(svc: ScorecardService) {
    const mw = [requireAuth()];
    return {
        forBall:  { method: 'GET' as const, path: '/scorecards/for-ball',  fn: (input: Static<typeof ByBallInput>)  => svc.forBall(input.ballId),   schema: ByBallInput,  middleware: mw },
        forRound: { method: 'GET' as const, path: '/scorecards/for-round', fn: (input: Static<typeof ByRoundInput>) => svc.forRound(input.roundId), schema: ByRoundInput, middleware: mw },
    };
}
