import { Type, type Static } from '@sinclair/typebox';
import { NotFoundError } from '@basics/core/server/auth';
import type { FriendlyRoundService } from '../services/friendly-round.service';
import { RoundSetupDraft } from '../domain/round-setup/draft';

// --- Input schemas ---

const CreateInput = Type.Object({ draft: RoundSetupDraft });
const ByTokenInput = Type.Object({ token: Type.String() });
const ByRoundInput = Type.Object({ roundId: Type.String() });

// --- API descriptor ---
//
// NO `requireAuth()`: the FriendlyRound front door is the whole point of 2.6e —
// anyone creates a round, reads it, and (via the existing score-events API)
// writes scores with only the share token. The share token is the only
// credential; the trust boundary is documented on FriendlyRoundService.

// The framework collapses a null return into `{ ok: true }` over HTTP
// (mount.ts), so a miss must throw `NotFoundError` (→ 404) to be distinguishable
// from a hit. A 404 on a share link means "bad/expired link" to the client.
async function byTokenOr404(svc: FriendlyRoundService, token: string) {
    const found = await svc.findByToken(token);
    if (!found) throw new NotFoundError('friendly round not found');
    return found;
}

async function byRoundOr404(svc: FriendlyRoundService, roundId: string) {
    const found = await svc.findByRoundId(roundId);
    if (!found) throw new NotFoundError('friendly round not found');
    return found;
}

export function createFriendlyRoundsApi(svc: FriendlyRoundService) {
    return {
        create:  { method: 'POST' as const, path: '/friendly-rounds',          fn: (input: Static<typeof CreateInput>)   => svc.create(input.draft),               schema: CreateInput },
        byToken: { method: 'GET'  as const, path: '/friendly-rounds/by-token',  fn: (input: Static<typeof ByTokenInput>)  => byTokenOr404(svc, input.token),        schema: ByTokenInput },
        get:     { method: 'GET'  as const, path: '/friendly-rounds/get',       fn: (input: Static<typeof ByRoundInput>)  => byRoundOr404(svc, input.roundId),      schema: ByRoundInput },
    };
}
