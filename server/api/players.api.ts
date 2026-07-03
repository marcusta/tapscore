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

// --- Input schemas ---

const RegisterInput = Type.Object({
    username: Type.String({ minLength: 1 }),
    password: Type.String({ minLength: 8 }),
    displayName: Type.String({ minLength: 1 }),
    handicapIndex: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
});

const UpdateHandicapInput = Type.Object({
    handicapIndex: Type.Number(),
    /** `YYYY-MM-DD`; defaults to today on the server. */
    effectiveDate: Type.Optional(Type.String()),
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
 */
export function createPlayersApi(
    svc: PlayerService,
    handicaps: HandicapService,
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
    };
}
