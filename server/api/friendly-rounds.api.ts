import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { NotFoundError, requireAuth, requireUser } from '@basics/core/server/auth';
import type { FriendlyRoundService } from '../services/friendly-round.service';
import type { RoundJoinService } from '../services/round-join.service';
import type { RoundLeaveService } from '../services/round-leave.service';
import type { RoundEditService } from '../services/round-edit.service';
import type { GuestClaimService } from '../services/guest-claim.service';
import { RoundSetupDraft } from '../domain/round-setup/draft';
import { EventType } from './score-events.api';

// --- Input schemas ---

const CreateInput = Type.Object({ draft: RoundSetupDraft });
const ByTokenInput = Type.Object({ token: Type.String() });

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

// Edit-after-create (Phase 3.5): the wizard re-submits the FULL replacement
// draft. `clientEventId` is the idempotency key (optional — a retry-less
// client may omit it). Identity is session-resolved, never body-supplied.
const EditSetupInput = Type.Object({
    token: Type.String(),
    draft: RoundSetupDraft,
    clientEventId: Type.Optional(Type.String({ minLength: 1 })),
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
async function byTokenOr404(
    svc: FriendlyRoundService,
    token: string,
    viewerPlayerId: string | null,
) {
    const found = await svc.findByToken(token, viewerPlayerId);
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

async function leaveOr404(leaves: RoundLeaveService, token: string, playerId: string) {
    const res = await leaves.leaveByToken({ token, playerId });
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

async function removeOr404(svc: FriendlyRoundService, token: string) {
    const res = await svc.removeByToken(token);
    if (!res.ok) throw new NotFoundError('friendly round not found');
    return { ok: true };
}

async function finishOr404(svc: FriendlyRoundService, token: string) {
    // `now` is stamped HERE (production server clock), not inside the service —
    // the service takes it as a param so scripts/tests stay deterministic.
    const res = await svc.finishByToken(token, new Date().toISOString());
    if (res === null) throw new NotFoundError('friendly round not found');
    return res;
}

async function reopenOr404(svc: FriendlyRoundService, token: string) {
    const res = await svc.reopenByToken(token);
    if (res === null) throw new NotFoundError('friendly round not found');
    return res;
}

async function setupOr404(edits: RoundEditService, token: string) {
    const res = await edits.setupByToken(token);
    if (res === null) throw new NotFoundError('friendly round not found');
    return res;
}

async function editOr404(
    edits: RoundEditService,
    input: Static<typeof EditSetupInput>,
    recordedByPlayerId: string | null,
) {
    const res = await edits.editByToken({ ...input, recordedByPlayerId });
    if (res === null) throw new NotFoundError('friendly round not found');
    return res;
}

export function createFriendlyRoundsApi(
    svc: FriendlyRoundService,
    claims: GuestClaimService,
    joins: RoundJoinService,
    edits: RoundEditService,
    leaves: RoundLeaveService,
) {
    return {
        create:    { method: 'POST' as const, path: '/friendly-rounds',           fn: (input: Static<typeof CreateInput>, c: Context) => svc.create(input.draft, optionalUserId(c)), schema: CreateInput },
        // The OPTIONAL session feeds only `startList.viewer` (Phase 5.5 policy
        // affordances); the read itself stays token-scoped + identity-free.
        byToken:   { method: 'GET'  as const, path: '/friendly-rounds/by-token',   fn: (input: Static<typeof ByTokenInput>, c: Context) => byTokenOr404(svc, input.token, optionalUserId(c)), schema: ByTokenInput },
        balls:     { method: 'GET'  as const, path: '/friendly-rounds/balls',      fn: (input: Static<typeof ByTokenInput>)  => ballsOr404(svc, input.token),           schema: ByTokenInput },
        scorecard: { method: 'GET'  as const, path: '/friendly-rounds/scorecard',  fn: (input: Static<typeof ByTokenInput>)  => scorecardOr404(svc, input.token),       schema: ByTokenInput },
        result:    { method: 'GET'  as const, path: '/friendly-rounds/result',     fn: (input: Static<typeof ResultInput>)   => resultOr404(svc, input.token, input.cursor), schema: ResultInput },
        score:     { method: 'POST' as const, path: '/friendly-rounds/score',      fn: (input: Static<typeof ScoreInput>, c: Context) => scoreOr404(svc, input, optionalUserId(c)),   schema: ScoreInput },
        // Edit-after-create (Phase 3.5). NO auth, like the rest of the token
        // front door: the share token is the credential. The read returns the
        // stored draft + editability (locks derive from `status`/`hasScores`);
        // the write replaces the whole draft and recompiles through the
        // composed-correction path. An optional session attributes the edit.
        setup:     { method: 'GET'  as const, path: '/friendly-rounds/setup',      fn: (input: Static<typeof ByTokenInput>)  => setupOr404(edits, input.token),         schema: ByTokenInput },
        editSetup: { method: 'POST' as const, path: '/friendly-rounds/setup',      fn: (input: Static<typeof EditSetupInput>, c: Context) => editOr404(edits, input, optionalUserId(c)), schema: EditSetupInput },
        // Delete-round (token-scoped). Path param, not body — the framework's
        // mount() reads DELETE input from `c.req.param()` only (same
        // convention as `DELETE /friends/:friendId`). NO auth: the share
        // token is the credential, and anyone holding it already controls
        // every score in the round — deletion is not a new privilege in the
        // no-login model. Creator-gating is deferred to the auth/roles phase;
        // the trust boundary is documented on FriendlyRoundService.
        remove:    { method: 'DELETE' as const, path: '/friendly-rounds/:token', fn: (input: Static<typeof ByTokenInput>) => removeOr404(svc, input.token), schema: ByTokenInput },
        // Finish / reopen (token-scoped, NO auth — same credential + trust
        // boundary as scoring/delete). Finish is PURELY ORGANIZATIONAL: it only
        // moves the round into the landing's "Recently finished" section and
        // seals nothing (a complete friendly round stays editable + scorable).
        // Reopen undoes a mistaken finish (complete → active). The server stamps
        // `completed_at`; the client never supplies it.
        finish:    { method: 'POST' as const, path: '/friendly-rounds/finish', fn: (input: Static<typeof ByTokenInput>) => finishOr404(svc, input.token), schema: ByTokenInput },
        reopen:    { method: 'POST' as const, path: '/friendly-rounds/reopen', fn: (input: Static<typeof ByTokenInput>) => reopenOr404(svc, input.token), schema: ByTokenInput },
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
        // Auth REQUIRED — the FIRST identity-gated, self-scoped mutation. The
        // caller removes THEMSELVES (their producer + own ball + their score
        // events) from the round; identity is the session's, never the body's.
        // Ordinary refusals (not in the round, shared team ball, degenerate
        // slot) are structured `{ ok: false, diagnostics }`, never a 500.
        leave: {
            method: 'POST' as const,
            path: '/friendly-rounds/leave',
            fn: (input: Static<typeof ByTokenInput>, c: Context) =>
                leaveOr404(leaves, input.token, requireUser(c).id),
            schema: ByTokenInput,
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
