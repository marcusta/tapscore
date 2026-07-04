import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { NotFoundError, requireAuth, requireUser } from '@basics/core/server/auth';
import type { FriendlyRoundService } from '../services/friendly-round.service';
import type { RoundJoinService } from '../services/round-join.service';
import type { GuestClaimService } from '../services/guest-claim.service';
import { RoundSetupDraft } from '../domain/round-setup/draft';
import { EventType } from './score-events.api';

// --- Input schemas ---

const CreateInput = Type.Object({ draft: RoundSetupDraft });
const ByTokenInput = Type.Object({ token: Type.String() });
const ByRoundInput = Type.Object({ roundId: Type.String() });

// Result read with the OPTIONAL Phase 3.5 polling cursor. Omitted cursor =
// the pre-cursor client — it always gets the full result envelope.
const ResultInput = Type.Object({
    token: Type.String(),
    cursor: Type.Optional(Type.String()),
});

// Self-join (Phase 3.5): identity, display name, handicap index and gender all
// come from the CALLER's profile (session), never the body — the tee and the
// (optional) target playing group are the joiner's choice.
//
// `groupChoice`:
//   - absent → first group with space, else a fresh group (default);
//   - `'new'` → force a fresh group even when one has space;
//   - a group's RUNTIME id (RoundPlayingGroup.id) → that group, if it has space
//     (`group_full` / `unknown_group` diagnostic otherwise).
const JoinInput = Type.Object({
    token: Type.String(),
    teeId: Type.String(),
    groupChoice: Type.Optional(Type.String()),
});

const ClaimGuestInput = Type.Object({
    token: Type.String(),
    guestPlayerId: Type.String(),
});

// Trust-based score write (2.6e M4): same shape as the score-events API minus
// `roundId` (resolved from the token) and `recordedByPlayerId` (no identities).
const ScoreInput = Type.Object({
    token: Type.String(),
    ballId: Type.String(),
    playHoleId: Type.String(),
    strokes: Type.Union([Type.Number(), Type.Null()]),
    eventType: EventType,
    clientEventId: Type.String(),
    sourcePlayerId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    sourceGuestPlayerId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    metadata: Type.Optional(Type.Union([Type.Record(Type.String(), Type.Unknown()), Type.Null()])),
});

// --- API descriptor ---
//
// NO `requireAuth()` on the token paths: the FriendlyRound front door is the
// whole point of 2.6e — anyone creates a round, reads it, and writes scores
// with only the share token. The share token is the only credential; the
// trust boundary is documented on FriendlyRoundService.
//
// OPTIONAL session (Phase 3): the global `createAuth` middleware (wired once
// in main.ts/bootstrapAuth) validates the session cookie on EVERY request and
// sets `c.var.user` when valid — `requireAuth()` only gates on it. So a
// no-auth route reads the identity opportunistically via `optionalUserId(c)`:
// present → create/score are attributed; absent → they proceed unattributed.
// Identity always comes from the session, never from the request body.
//
// `claimGuest` is the one gated endpoint here: claiming rewires rows to a
// player_id, which only exists for a logged-in caller.

function optionalUserId(c: Context): string | null {
    return c.get('user')?.id ?? null;
}

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

async function ballsOr404(svc: FriendlyRoundService, token: string) {
    const found = await svc.ballsByToken(token);
    if (found === null) throw new NotFoundError('friendly round not found');
    return found;
}

async function scorecardOr404(svc: FriendlyRoundService, token: string) {
    const found = await svc.scorecardByToken(token);
    if (found === null) throw new NotFoundError('friendly round not found');
    return found;
}

async function resultOr404(svc: FriendlyRoundService, token: string, cursor?: string) {
    const found = await svc.resultWithCursorByToken(token, cursor);
    if (found === null) throw new NotFoundError('friendly round not found');
    return found;
}

async function joinOr404(
    joins: RoundJoinService,
    input: Static<typeof JoinInput>,
    playerId: string,
) {
    const res = await joins.joinByToken({ ...input, playerId });
    if (res === null) throw new NotFoundError('friendly round not found');
    return res;
}

async function scoreOr404(
    svc: FriendlyRoundService,
    input: Static<typeof ScoreInput>,
    recordedByPlayerId: string | null,
) {
    const res = await svc.appendScoreByToken(input, recordedByPlayerId);
    if (res === null) throw new NotFoundError('friendly round not found');
    return res;
}

export function createFriendlyRoundsApi(
    svc: FriendlyRoundService,
    claims: GuestClaimService,
    joins: RoundJoinService,
) {
    return {
        list:      { method: 'GET'  as const, path: '/friendly-rounds',           fn: ()                                    => svc.list() },
        create:    { method: 'POST' as const, path: '/friendly-rounds',           fn: (input: Static<typeof CreateInput>, c: Context) => svc.create(input.draft, optionalUserId(c)), schema: CreateInput },
        byToken:   { method: 'GET'  as const, path: '/friendly-rounds/by-token',   fn: (input: Static<typeof ByTokenInput>)  => byTokenOr404(svc, input.token),         schema: ByTokenInput },
        get:       { method: 'GET'  as const, path: '/friendly-rounds/get',        fn: (input: Static<typeof ByRoundInput>)  => byRoundOr404(svc, input.roundId),       schema: ByRoundInput },
        balls:     { method: 'GET'  as const, path: '/friendly-rounds/balls',      fn: (input: Static<typeof ByTokenInput>)  => ballsOr404(svc, input.token),           schema: ByTokenInput },
        scorecard: { method: 'GET'  as const, path: '/friendly-rounds/scorecard',  fn: (input: Static<typeof ByTokenInput>)  => scorecardOr404(svc, input.token),       schema: ByTokenInput },
        result:    { method: 'GET'  as const, path: '/friendly-rounds/result',     fn: (input: Static<typeof ResultInput>)   => resultOr404(svc, input.token, input.cursor), schema: ResultInput },
        score:     { method: 'POST' as const, path: '/friendly-rounds/score',      fn: (input: Static<typeof ScoreInput>, c: Context) => scoreOr404(svc, input, optionalUserId(c)),   schema: ScoreInput },
        // Auth REQUIRED: the caller's profile IS the join payload (identity,
        // name, index, gender). 409s (already started / already in) surface via
        // ConflictError; profile/tee/slot refusals are structured diagnostics.
        join: {
            method: 'POST' as const,
            path: '/friendly-rounds/join',
            fn: (input: Static<typeof JoinInput>, c: Context) =>
                joinOr404(joins, input, requireUser(c).id),
            schema: JoinInput,
            middleware: [requireAuth()],
        },
        claimGuest: {
            method: 'POST' as const,
            path: '/friendly-rounds/claim-guest',
            fn: (input: Static<typeof ClaimGuestInput>, c: Context) =>
                claims.claimGuest({ ...input, playerId: requireUser(c).id }),
            schema: ClaimGuestInput,
            middleware: [requireAuth()],
        },
    };
}
