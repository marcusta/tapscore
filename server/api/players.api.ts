import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { PlayerService } from '../services/player.service';

// --- API descriptor ---

export function createPlayersApi(svc: PlayerService) {
    const mw = [requireAuth()];
    return {
        me: {
            method: 'GET' as const,
            path: '/players/me',
            fn: (c: Context) => svc.getById(requireUser(c).id),
            middleware: mw,
        },
    };
}
