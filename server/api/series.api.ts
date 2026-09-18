import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { NotFoundError, requireAuth, requireUser } from '@basics/core/server/auth';
import { teamPointsCatalog } from '../domain/team-points/rule';
import type { RoleService } from '../services/role.service';
import type { SeriesBoard, SeriesService } from '../services/series.service';
import type { SeriesAuthz } from './series-authz';

// --- Input schemas ---

const BySeriesInput = Type.Object({ seriesId: Type.String() });
const ByTokenInput = Type.Object({ token: Type.String({ minLength: 1 }) });

const TeamInput = Type.Object({
    name: Type.String({ minLength: 1 }),
    colour: Type.String({ minLength: 1 }),
});

const CreateInput = Type.Object({
    name: Type.String({ minLength: 1 }),
    teams: Type.Array(TeamInput, { minItems: 2 }),
});

const RenameInput = Type.Object({ seriesId: Type.String(), name: Type.String({ minLength: 1 }) });

const AddTeamInput = Type.Object({
    seriesId: Type.String(),
    name: Type.String({ minLength: 1 }),
    colour: Type.String({ minLength: 1 }),
});

const UpdateTeamInput = Type.Object({
    seriesId: Type.String(),
    teamId: Type.String(),
    name: Type.Optional(Type.String({ minLength: 1 })),
    colour: Type.Optional(Type.String({ minLength: 1 })),
});

const ByTeamInput = Type.Object({ seriesId: Type.String(), teamId: Type.String() });

// Member add: a registered player XOR a guest name, checked in the handler.
const AddMemberInput = Type.Object({
    seriesId: Type.String(),
    teamId: Type.String(),
    playerId: Type.Optional(Type.String()),
    guestName: Type.Optional(Type.String()),
});

const ByMemberInput = Type.Object({ seriesId: Type.String(), memberId: Type.String() });

// `roundShareToken` is the round's write credential: holding it is what
// authorizes publishing that round's result to the series.
const AttachRoundInput = Type.Object({
    seriesId: Type.String(),
    roundShareToken: Type.String({ minLength: 1 }),
    label: Type.String(),
});

const RelabelRoundInput = Type.Object({
    seriesId: Type.String(),
    seriesRoundId: Type.String(),
    label: Type.String({ minLength: 1 }),
});

const BySeriesRoundInput = Type.Object({ seriesId: Type.String(), seriesRoundId: Type.String() });

const SetBallTeamInput = Type.Object({
    seriesId: Type.String(),
    seriesRoundId: Type.String(),
    ballId: Type.String(),
    teamId: Type.Union([Type.String(), Type.Null()]),
});

const UpsertSourceInput = Type.Object({
    seriesId: Type.String(),
    id: Type.Optional(Type.String()),
    seriesRoundId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    slotDefId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    ruleId: Type.String({ minLength: 1 }),
    config: Type.Optional(Type.Unknown()),
    label: Type.String({ minLength: 1 }),
});

const BySourceInput = Type.Object({ seriesId: Type.String(), sourceId: Type.String() });

/** The board plus whether the caller may edit the series. `canEdit` decides
 *  what the client shows; SeriesAuthz stays the gate on every mutation. */
export interface SeriesBoardView extends SeriesBoard {
    canEdit: boolean;
}

// --- API descriptor ---
//
// The board is read by series share token (the link model). Everything else
// needs a session, and every mutation also passes SeriesAuthz. No route
// returns a round share token.

export function createSeriesApi(svc: SeriesService, roles: RoleService, authz: SeriesAuthz) {
    return {
        // --- Reads ---
        board: {
            method: 'GET' as const,
            path: '/series/board',
            fn: async (input: Static<typeof ByTokenInput>, c: Context): Promise<SeriesBoardView> => {
                const found = await svc.getByShareToken(input.token);
                if (!found) throw new NotFoundError('series not found');
                const board = (await svc.board(found.id))!;
                return { ...board, canEdit: await authz.isAdmin(found.id, c.get('user')?.id ?? null) };
            },
            schema: ByTokenInput,
        },
        // The serializable rule catalog: labels + config fields as data, so the
        // client renders a source editor without knowing any rule id.
        rules: {
            method: 'GET' as const,
            path: '/series/rules',
            fn: () => teamPointsCatalog(),
        },
        list: {
            method: 'GET' as const,
            path: '/series',
            fn: async (c: Context) => {
                const playerId = requireUser(c).id;
                const grants = await roles.listForPlayer(playerId);
                const adminIds = grants
                    .filter((g) => g.role === 'series_admin' && g.scopeType === 'series' && g.scopeId !== null)
                    .map((g) => g.scopeId as string);
                return svc.listForPlayer(playerId, adminIds);
            },
            middleware: [requireAuth()],
        },
        get: {
            method: 'GET' as const,
            path: '/series/get',
            fn: async (input: Static<typeof BySeriesInput>, c: Context) => {
                await authz.assertAdmin(input.seriesId, requireUser(c).id);
                return (await svc.detail(input.seriesId))!;
            },
            schema: BySeriesInput,
            middleware: [requireAuth()],
        },

        // --- Mutations (auth + owner/admin) ---
        create: {
            method: 'POST' as const,
            path: '/series',
            fn: (input: Static<typeof CreateInput>, c: Context) =>
                svc.create({ name: input.name, teams: input.teams, ownerPlayerId: requireUser(c).id }),
            schema: CreateInput,
            middleware: [requireAuth()],
        },
        rename: {
            method: 'POST' as const,
            path: '/series/rename',
            fn: async (input: Static<typeof RenameInput>, c: Context) => {
                await authz.assertAdmin(input.seriesId, requireUser(c).id);
                return svc.rename(input.seriesId, input.name);
            },
            schema: RenameInput,
            middleware: [requireAuth()],
        },
        remove: {
            method: 'POST' as const,
            path: '/series/delete',
            fn: async (input: Static<typeof BySeriesInput>, c: Context) => {
                await authz.assertAdmin(input.seriesId, requireUser(c).id);
                return svc.delete(input.seriesId);
            },
            schema: BySeriesInput,
            middleware: [requireAuth()],
        },
        addTeam: {
            method: 'POST' as const,
            path: '/series/teams/add',
            fn: async (input: Static<typeof AddTeamInput>, c: Context) => {
                await authz.assertAdmin(input.seriesId, requireUser(c).id);
                return svc.addTeam(input.seriesId, { name: input.name, colour: input.colour });
            },
            schema: AddTeamInput,
            middleware: [requireAuth()],
        },
        updateTeam: {
            method: 'POST' as const,
            path: '/series/teams/update',
            fn: async (input: Static<typeof UpdateTeamInput>, c: Context) => {
                await authz.assertAdmin(input.seriesId, requireUser(c).id);
                return svc.updateTeam(input.seriesId, input.teamId, {
                    ...(input.name !== undefined ? { name: input.name } : {}),
                    ...(input.colour !== undefined ? { colour: input.colour } : {}),
                });
            },
            schema: UpdateTeamInput,
            middleware: [requireAuth()],
        },
        removeTeam: {
            method: 'POST' as const,
            path: '/series/teams/remove',
            fn: async (input: Static<typeof ByTeamInput>, c: Context) => {
                await authz.assertAdmin(input.seriesId, requireUser(c).id);
                return svc.removeTeam(input.seriesId, input.teamId);
            },
            schema: ByTeamInput,
            middleware: [requireAuth()],
        },
        addMember: {
            method: 'POST' as const,
            path: '/series/members/add',
            fn: async (input: Static<typeof AddMemberInput>, c: Context) => {
                await authz.assertAdmin(input.seriesId, requireUser(c).id);
                const hasPlayer = input.playerId !== undefined;
                const hasGuest = input.guestName !== undefined;
                if (hasPlayer === hasGuest) {
                    return {
                        ok: false as const,
                        refusal: {
                            code: 'invalid_player_ref' as const,
                            message: 'Add exactly one of a player or a guest name.',
                        },
                    };
                }
                return svc.addMember(
                    input.seriesId,
                    input.teamId,
                    hasPlayer
                        ? { kind: 'player', playerId: input.playerId! }
                        : { kind: 'guest', displayName: input.guestName! },
                );
            },
            schema: AddMemberInput,
            middleware: [requireAuth()],
        },
        removeMember: {
            method: 'POST' as const,
            path: '/series/members/remove',
            fn: async (input: Static<typeof ByMemberInput>, c: Context) => {
                await authz.assertAdmin(input.seriesId, requireUser(c).id);
                return svc.removeMember(input.seriesId, input.memberId);
            },
            schema: ByMemberInput,
            middleware: [requireAuth()],
        },
        attachRound: {
            method: 'POST' as const,
            path: '/series/rounds/attach',
            fn: async (input: Static<typeof AttachRoundInput>, c: Context) => {
                await authz.assertAdmin(input.seriesId, requireUser(c).id);
                return svc.attachRound(input);
            },
            schema: AttachRoundInput,
            middleware: [requireAuth()],
        },
        relabelRound: {
            method: 'POST' as const,
            path: '/series/rounds/relabel',
            fn: async (input: Static<typeof RelabelRoundInput>, c: Context) => {
                await authz.assertAdmin(input.seriesId, requireUser(c).id);
                return svc.relabelRound(input.seriesId, input.seriesRoundId, input.label);
            },
            schema: RelabelRoundInput,
            middleware: [requireAuth()],
        },
        detachRound: {
            method: 'POST' as const,
            path: '/series/rounds/detach',
            fn: async (input: Static<typeof BySeriesRoundInput>, c: Context) => {
                await authz.assertAdmin(input.seriesId, requireUser(c).id);
                return svc.detachRound(input.seriesId, input.seriesRoundId);
            },
            schema: BySeriesRoundInput,
            middleware: [requireAuth()],
        },
        setBallTeam: {
            method: 'POST' as const,
            path: '/series/rounds/ball-team',
            fn: async (input: Static<typeof SetBallTeamInput>, c: Context) => {
                await authz.assertAdmin(input.seriesId, requireUser(c).id);
                return svc.setBallTeam(input);
            },
            schema: SetBallTeamInput,
            middleware: [requireAuth()],
        },
        upsertSource: {
            method: 'POST' as const,
            path: '/series/sources/upsert',
            fn: async (input: Static<typeof UpsertSourceInput>, c: Context) => {
                await authz.assertAdmin(input.seriesId, requireUser(c).id);
                return svc.upsertSource(input);
            },
            schema: UpsertSourceInput,
            middleware: [requireAuth()],
        },
        deleteSource: {
            method: 'POST' as const,
            path: '/series/sources/delete',
            fn: async (input: Static<typeof BySourceInput>, c: Context) => {
                await authz.assertAdmin(input.seriesId, requireUser(c).id);
                return svc.deleteSource(input.seriesId, input.sourceId);
            },
            schema: BySourceInput,
            middleware: [requireAuth()],
        },
    };
}
