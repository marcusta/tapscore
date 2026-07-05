import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { FriendService } from '../services/friend.service';

// --- Input schemas ---

const AddFriendInput = Type.Object({
    friendId: Type.String({ minLength: 1 }),
});

const RemoveFriendInput = Type.Object({
    friendId: Type.String({ minLength: 1 }),
});

// --- API descriptor ---

/**
 * All endpoints operate on the CALLER (`requireUser(c).id`) as the
 * `player_id` side of `friendships` — a caller can only manage their own
 * one-directional contact list, never another player's, so `requireAuth()`
 * is applied to every endpoint here (unlike players.api.ts, there is no
 * "front door" unauthenticated endpoint).
 *
 * Removal is `DELETE /friends/:friendId` (path param), NOT a DELETE-with-
 * body. The framework's `mount()` (vendor/basics-core/server/mount.ts) reads
 * DELETE input from `c.req.param()` only — it never parses a DELETE body —
 * and every existing DELETE endpoint in this codebase (clubs, courses,
 * tees, rounds, course-route-templates) already uses `/resource/:id`. A
 * path param is both idiomatic here and simpler than `POST /friends/remove`.
 */
export function createFriendsApi(svc: FriendService) {
    const mw = [requireAuth()];
    return {
        list: {
            method: 'GET' as const,
            path: '/friends',
            fn: (c: Context) => svc.listFor(requireUser(c).id, new Date().toISOString()),
            middleware: mw,
        },
        add: {
            method: 'POST' as const,
            path: '/friends',
            fn: (input: Static<typeof AddFriendInput>, c: Context) =>
                svc.add(requireUser(c).id, input.friendId),
            schema: AddFriendInput,
            middleware: mw,
        },
        remove: {
            method: 'DELETE' as const,
            path: '/friends/:friendId',
            fn: (input: Static<typeof RemoveFriendInput>, c: Context) =>
                svc.remove(requireUser(c).id, input.friendId),
            schema: RemoveFriendInput,
            middleware: mw,
        },
    };
}
