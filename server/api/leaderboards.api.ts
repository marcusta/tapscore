import { Type, type Static } from '@sinclair/typebox';
import { requireAuth } from '@basics/core/server/auth';
import type { LeaderboardService } from '../services/leaderboard.service';

// --- Input schemas ---

const ByRoundInput = Type.Object({ roundId: Type.String() });

// --- API descriptor ---
//
// Slice 2c retired the legacy `Leaderboard` shape. `forRound` now returns the
// canonical `RoundResult` (per-slot serializable result sections) straight
// from `resultForRound`. The mobile results view is rebuilt against these
// sections in 2.6e (M4); until then it consumes the shape as-is.

export function createLeaderboardsApi(svc: LeaderboardService) {
    const mw = [requireAuth()];
    return {
        forRound: { method: 'GET' as const, path: '/leaderboards/for-round', fn: (input: Static<typeof ByRoundInput>) => svc.resultForRound(input.roundId), schema: ByRoundInput, middleware: mw },
    };
}
