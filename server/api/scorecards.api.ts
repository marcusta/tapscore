import { Type, type Static } from '@sinclair/typebox';
import { requireAuth } from '@basics/core/server/auth';
import type { ScorecardService } from '../services/scorecard.service';

// --- Input schemas ---

const ByParticipantInput = Type.Object({ participantId: Type.String() });
const ByRoundInput = Type.Object({ roundId: Type.String() });

// --- API descriptor ---

export function createScorecardsApi(svc: ScorecardService) {
    const mw = [requireAuth()];
    return {
        forParticipant: { method: 'GET' as const, path: '/scorecards/for-participant', fn: (input: Static<typeof ByParticipantInput>) => svc.forParticipant(input.participantId), schema: ByParticipantInput, middleware: mw },
        forRound:       { method: 'GET' as const, path: '/scorecards/for-round',       fn: (input: Static<typeof ByRoundInput>)       => svc.forRound(input.roundId),             schema: ByRoundInput,       middleware: mw },
    };
}
