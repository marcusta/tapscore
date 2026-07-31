import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { DashboardService } from '../services/dashboard.service';
import type { FriendlyRoundService } from '../services/friendly-round.service';
import type { FriendsActivityService } from '../services/friends-activity.service';

// --- API descriptor ---

/**
 * Phase 3 "my rounds" — the logged-in dashboard. Two halves, both scoped to
 * the CALLER (session identity, never a query param):
 *
 *  - `produced`: rounds where the caller produced a ball — the §17 dashboard
 *    query over `ball_players.player_id` incl. the soft-delete guard
 *    (`DashboardService.forPlayer`). Claimed guest rounds surface here via
 *    the live FK the claim flip installs.
 *  - `created`: friendly rounds the caller minted (`creator_player_id`) —
 *    a creator is not necessarily a producer, so this is a distinct set.
 *
 * Kept as two lists (not merged) so the client can render them separately;
 * rounds where the caller both created and played appear in both.
 */
export function createDashboardApi(
    dashboards: DashboardService,
    friendlyRounds: FriendlyRoundService,
    friendsActivity: FriendsActivityService,
) {
    const mw = [requireAuth()];
    return {
        myRounds: {
            method: 'GET' as const,
            path: '/dashboard/my-rounds',
            fn: async (c: Context) => {
                const playerId = requireUser(c).id;
                return {
                    produced: await dashboards.forPlayer(playerId),
                    created: await friendlyRounds.listByCreator(playerId),
                };
            },
            middleware: mw,
        },
        /**
         * The outward-facing half of the dashboard: rounds the caller's MUTUAL
         * friends are in. Same session scoping as `my-rounds` — the caller is
         * the session, never a query param, because the answer is a different
         * set for every player and a param would invite reading someone else's
         * feed.
         *
         * `live` is presence (see `LIVE_WINDOW_MS`), `recent` is everything
         * else visible. Two lists rather than one flagged list because the home
         * strip renders only `live` and renders nothing at all when it is
         * empty. No share tokens anywhere in the payload.
         */
        friendsActivity: {
            method: 'GET' as const,
            path: '/dashboard/friends-activity',
            fn: (c: Context) =>
                friendsActivity.activityFor(requireUser(c).id, new Date().toISOString()),
            middleware: mw,
        },
    };
}
