import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { AdminService } from '../services/admin.service';
import type { RoleService, RoleGrant } from '../services/role.service';
import type { AdminAuthz } from './admin-authz';

// --- Input schemas ---

const PageInput = Type.Object({
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 200 })),
    offset: Type.Optional(Type.Number({ minimum: 0 })),
});

const ROLE = Type.Union([
    Type.Literal('super_admin'),
    Type.Literal('series_admin'),
    Type.Literal('tour_admin'),
    Type.Literal('competition_admin'),
    Type.Literal('course_admin'),
    Type.Literal('friendly_round_owner'),
]);

const GrantInput = Type.Object({
    playerId: Type.String({ minLength: 1 }),
    role: ROLE,
    scopeType: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    scopeId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

// --- API descriptor ---

/**
 * The operator surface. Everything under `/admin/*` requires a session AND the
 * unscoped `super_admin` grant — unlike the rest of the app, where reads are
 * open and writes are token- or owner-scoped. These are the only routes that
 * read across players.
 *
 * Read-only by design (PHASES.md "authorization phase", first slice): an
 * operator can SEE any round and every player's activity, and can administer
 * role grants — nothing else. There is no admin write path into rounds or
 * scores; corrections keep going through the existing per-round machinery.
 *
 * NOTE on `shareToken`: the round list returns each round's token because the
 * token IS the client's navigation handle. The token is also the round's write
 * credential under the trust-based model, so handing it to an operator hands
 * them the same power any participant has. That is inherent to the front door,
 * not something this surface adds — but it is why the grant is deliberately
 * hard to obtain (CLI only, see `scripts/grant-role.ts`).
 *
 * `myRoles` is the exception: session-only, caller-scoped, so the client can
 * decide whether to render the admin entry point at all.
 */
export function createAdminApi(
    admin: AdminService,
    roles: RoleService,
    authz: AdminAuthz,
) {
    const mw = [requireAuth()];

    /** Session identity, after asserting the caller is a super admin. */
    const gate = async (c: Context): Promise<string> => {
        const playerId = requireUser(c).id;
        await authz.assertSuperAdmin(playerId);
        return playerId;
    };

    return {
        myRoles: {
            method: 'GET' as const,
            path: '/me/roles',
            fn: async (c: Context): Promise<RoleGrant[]> =>
                roles.listForPlayer(requireUser(c).id),
            middleware: mw,
        },
        adminStats: {
            method: 'GET' as const,
            path: '/admin/stats',
            fn: async (c: Context) => {
                await gate(c);
                return admin.stats();
            },
            middleware: mw,
        },
        adminRounds: {
            method: 'GET' as const,
            path: '/admin/rounds',
            fn: async (input: Static<typeof PageInput>, c: Context) => {
                await gate(c);
                return admin.listRounds(input.limit ?? 50, input.offset ?? 0);
            },
            schema: PageInput,
            middleware: mw,
        },
        adminPlayers: {
            method: 'GET' as const,
            path: '/admin/players',
            fn: async (c: Context) => {
                await gate(c);
                return admin.listPlayers();
            },
            middleware: mw,
        },
        adminGrantRole: {
            method: 'POST' as const,
            path: '/admin/roles/grant',
            fn: async (input: Static<typeof GrantInput>, c: Context) => {
                await gate(c);
                return roles.grant(input);
            },
            schema: GrantInput,
            middleware: mw,
        },
        adminRevokeRole: {
            method: 'POST' as const,
            path: '/admin/roles/revoke',
            fn: async (input: Static<typeof GrantInput>, c: Context) => {
                await gate(c);
                await roles.revoke(input);
                return { ok: true as const };
            },
            schema: GrantInput,
            middleware: mw,
        },
    };
}
