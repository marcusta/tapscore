import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { ForbiddenError, NotFoundError, requireAuth, requireUser } from '@basics/core/server/auth';
import {
    MAX_PAGE_LIMIT,
    type FriendProfileResult,
    type FriendProfileService,
} from '../services/friend-profile.service';

// --- Input schemas ---

const ProfileInput = Type.Object({
    playerId: Type.String({ minLength: 1 }),
});

const RoundsInput = Type.Object({
    playerId: Type.String({ minLength: 1 }),
    /** Opaque marker from a previous page's `nextCursor`; omit for the first. */
    cursor: Type.Optional(Type.String({ minLength: 1 })),
    /** The service's own ceiling, so the bound is written once — see
     *  `MAX_PAGE_LIMIT`. Over HTTP an over-large page size is a 400 here. */
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: MAX_PAGE_LIMIT })),
});

// --- API descriptor ---

/**
 * A friend's profile — their card, their rounds, their courses
 * (docs/proposals/friends-activity.md deferred this as the "friend detail
 * page"; the visibility rule it implements is documented on
 * server/services/friend-profile.service.ts).
 *
 * **Mounted under `/friends/:playerId/*` on purpose.** There is deliberately no
 * `GET /players/:id/rounds`: AGENTS.md ("Cross-player reads") makes a
 * cross-player read a design decision rather than a routing detail, and a
 * general player-rounds endpoint would be a DIFFERENT and unbounded decision —
 * any player, any caller. The path says what the authorization is: this is a
 * friends surface, gated on the derived mutual edge.
 *
 * The VIEWER is always `requireUser(c).id` and never a parameter — the same
 * session scoping `/dashboard/friends-activity` uses, and for the same reason:
 * a viewer param invites reading the feature through someone else's eyes. The
 * SUBJECT is the path param, and the service refuses it unless the edge is
 * mutual.
 *
 * 404 vs 403 is meaningful, as on `/spectate/*`: an unknown or soft-deleted
 * player is a 404, a player who has not added the caller back is a 403. A
 * client can then tell a stale link from a friendship that was withdrawn.
 *
 * Read-only, and no share token in any response — the token is a WRITE
 * credential (see `SpectateView` in server/services/spectate.service.ts).
 */
export function createFriendProfileApi(svc: FriendProfileService) {
    const mw = [requireAuth()];

    // Every refusal reason is handled by NAME and the leftover is assigned to
    // `never`. Typing the argument as the service's own union is not by itself
    // enough — a trailing `throw new ForbiddenError(...)` swallows a third
    // reason just as happily as a widened `reason: string` would, and 403 is
    // the wrong answer to most things a future reason could mean. The `never`
    // assignment is what turns adding one into a compile error at this line.
    function unwrap<T>(res: FriendProfileResult<T>): T {
        if (res.ok) return res.value;
        if (res.reason === 'not_found') throw new NotFoundError('player not found');
        if (res.reason === 'forbidden')
            throw new ForbiddenError('this profile is not visible to you');
        const unhandled: never = res.reason;
        throw new Error(`friend-profile: unhandled refusal reason ${String(unhandled)}`);
    }

    return {
        profile: {
            method: 'GET' as const,
            path: '/friends/:playerId/profile',
            fn: async (input: Static<typeof ProfileInput>, c: Context) =>
                unwrap(
                    await svc.profileFor(
                        requireUser(c).id,
                        input.playerId,
                        new Date().toISOString(),
                    ),
                ),
            schema: ProfileInput,
            middleware: mw,
        },
        rounds: {
            method: 'GET' as const,
            path: '/friends/:playerId/rounds',
            fn: async (input: Static<typeof RoundsInput>, c: Context) =>
                unwrap(
                    await svc.roundsFor(requireUser(c).id, input.playerId, {
                        cursor: input.cursor,
                        limit: input.limit,
                    }),
                ),
            schema: RoundsInput,
            middleware: mw,
        },
        courses: {
            method: 'GET' as const,
            path: '/friends/:playerId/courses',
            fn: async (input: Static<typeof ProfileInput>, c: Context) =>
                unwrap(await svc.coursesFor(requireUser(c).id, input.playerId)),
            schema: ProfileInput,
            middleware: mw,
        },
    };
}
