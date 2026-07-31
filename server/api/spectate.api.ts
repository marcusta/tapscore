import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { ForbiddenError, NotFoundError, requireAuth, requireUser } from '@basics/core/server/auth';
import type { SpectateService } from '../services/spectate.service';

// --- Input schemas ---

const SpectateRoundInput = Type.Object({ roundId: Type.String({ minLength: 1 }) });

// --- API descriptor ---

/**
 * Watching a friend's round (docs/proposals/friends-activity.md).
 *
 * Addressed by ROUND ID and authorized by session + visibility — the deliberate
 * contrast with `/friendly-rounds/*`, which is addressed by share token and
 * carries write powers with it. A spectator holds no credential for this round
 * and never receives one (see `SpectateView` in
 * server/services/spectate.service.ts), so there is no path from "I can watch
 * this" to "I can score this".
 *
 * One endpoint, one verb. The read-only live view is the whole feature; there
 * is no spectator mutation to gate, because a non-participant editing a round
 * is not a permission this app has.
 *
 * 404 vs 403 is meaningful here: an unknown round id is a 404, a round the
 * caller may not see is a 403. It leaks the existence of a round to a signed-in
 * caller who already knows its id, which is the same thing today's open
 * id-addressed reads leak (see the proposal's Known gaps) — and collapsing them
 * would leave a client unable to tell a stale link from a withdrawn friendship.
 */
export function createSpectateApi(svc: SpectateService) {
    const mw = [requireAuth()];
    return {
        round: {
            method: 'GET' as const,
            path: '/spectate/rounds/:roundId',
            fn: async (input: Static<typeof SpectateRoundInput>, c: Context) => {
                const res = await svc.viewFor(input.roundId, requireUser(c).id);
                if (res.ok) return res.value;
                if (res.reason === 'not_found') throw new NotFoundError('round not found');
                throw new ForbiddenError('this round is not visible to you');
            },
            schema: SpectateRoundInput,
            middleware: mw,
        },
    };
}
