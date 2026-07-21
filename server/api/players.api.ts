import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import {
    issueSessionCookie,
    requireAuth,
    requireUser,
    type SessionStore,
} from '@basics/core/server/auth';
import type { PlayerService } from '../services/player.service';
import type { HandicapService } from '../services/handicap.service';
import type { FriendService } from '../services/friend.service';

// --- Input schemas ---

const Gender = Type.Union([Type.Literal('M'), Type.Literal('F')]);

const RegisterInput = Type.Object({
    username: Type.String({ minLength: 1 }),
    password: Type.String({ minLength: 8 }),
    displayName: Type.String({ minLength: 1 }),
    handicapIndex: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
    gender: Type.Optional(Type.Union([Gender, Type.Null()])),
    homeClubId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const UpdateHandicapInput = Type.Object({
    handicapIndex: Type.Number(),
    /** `YYYY-MM-DD`; defaults to today on the server. */
    effectiveDate: Type.Optional(Type.String()),
});

const UpdateProfileInput = Type.Object({
    gender: Type.Optional(Type.Union([Gender, Type.Null()])),
    homeClubId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

// `q` is optional: a missing/empty query is a legal "no results yet" state
// (the client fires this on every keystroke), answered with `[]` by the
// service's <2-chars fast path — not a 400 validation error.
const SearchInput = Type.Object({
    q: Type.Optional(Type.String()),
});

// --- API descriptor ---

/**
 * `sessions` + `cookieName` mirror the framework's `createAuthApi` wiring:
 * registration issues a session cookie exactly like login does, so a fresh
 * account is logged in from its first response. `register` is the only
 * endpoint here without `requireAuth()` — account creation is the front door.
 *
 * The handicap endpoints operate on the CALLER (`requireUser(c).id`), never a
 * body-supplied player id — manual index maintenance is self-service only
 * (Phase 3 scope decision: no WHS/federation posting; `handicap_history`
 * records every manual edit append-only via `HandicapService.record`).
 *
 * `updateProfile` is POST, not PATCH — matches `updateHandicap`'s existing
 * partial-update convention; no PATCH endpoint exists anywhere in
 * server/api/*.api.ts, so introducing one would be a one-off, not a followed
 * pattern.
 *
 * `search` needs to know the caller's friend set to stamp `isFriend` on
 * results, so it takes `friends: FriendService` alongside `svc`/`handicaps`
 * — composed at the API layer rather than PlayerService reaching into a
 * sibling service (same "composition root wires services together" pattern
 * as `buildRoundServiceDeps` in services/index.ts).
 */
export function createPlayersApi(
    svc: PlayerService,
    handicaps: HandicapService,
    friends: FriendService,
    sessions: SessionStore,
    cookieName = 'session',
) {
    const mw = [requireAuth()];
    return {
        me: {
            method: 'GET' as const,
            path: '/players/me',
            fn: (c: Context) => svc.getById(requireUser(c).id),
            middleware: mw,
        },
        register: {
            method: 'POST' as const,
            path: '/players/register',
            fn: async (input: Static<typeof RegisterInput>, c: Context) => {
                const player = await svc.selfRegister(input);
                await issueSessionCookie(c, sessions, player.id, { cookieName });
                return player;
            },
            schema: RegisterInput,
        },
        updateHandicap: {
            method: 'POST' as const,
            path: '/players/me/handicap',
            fn: (input: Static<typeof UpdateHandicapInput>, c: Context) =>
                svc.updateHandicapIndex(
                    requireUser(c).id,
                    input.handicapIndex,
                    input.effectiveDate,
                ),
            schema: UpdateHandicapInput,
            middleware: mw,
        },
        myHandicapHistory: {
            method: 'GET' as const,
            path: '/players/me/handicap-history',
            fn: (c: Context) => handicaps.historyFor(requireUser(c).id),
            middleware: mw,
        },
        updateProfile: {
            method: 'POST' as const,
            path: '/players/me/profile',
            fn: (input: Static<typeof UpdateProfileInput>, c: Context) =>
                svc.updateProfile(requireUser(c).id, input),
            schema: UpdateProfileInput,
            middleware: mw,
        },
        search: {
            method: 'GET' as const,
            path: '/players/search',
            fn: async (input: Static<typeof SearchInput>, c: Context) => {
                const callerId = requireUser(c).id;
                const friendIds = await friends.friendIdsFor(callerId);
                return svc.search(callerId, input.q ?? '', friendIds);
            },
            schema: SearchInput,
            middleware: mw,
        },
    };
}
