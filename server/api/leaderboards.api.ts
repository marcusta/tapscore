import { Type, type Static } from '@sinclair/typebox';
import { requireAuth } from '@basics/core/server/auth';
import type { LeaderboardService } from '../services/leaderboard.service';

// --- Input schemas ---

const ByRoundInput = Type.Object({ roundId: Type.String() });

// --- API descriptor ---

export function createLeaderboardsApi(svc: LeaderboardService) {
    const mw = [requireAuth()];
    return {
        forRound: { method: 'GET' as const, path: '/leaderboards/for-round', fn: (input: Static<typeof ByRoundInput>) => svc.forRound(input.roundId), schema: ByRoundInput, middleware: mw },
    };
}
