import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { DashboardService } from '../services/dashboard.service';
import type { FriendlyRoundService } from '../services/friendly-round.service';

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
    };
}
