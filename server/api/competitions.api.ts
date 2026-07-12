import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { NotFoundError, requireAuth, requireUser } from '@basics/core/server/auth';
import type {
    Competition,
    CompetitionService,
    PlayerRef,
} from '../services/competition.service';
import type {
    CompetitionRoundService,
    CompetitionRoundSummary,
} from '../services/competition-round.service';
import type { RoleService } from '../services/role.service';
import type { CompetitionAuthz } from './competition-authz';

// --- Input schemas ---

const ByIdInput = Type.Object({ id: Type.String() });
const ByCompetitionInput = Type.Object({ competitionId: Type.String() });
const ByParticipantInput = Type.Object({ participantId: Type.String() });

const CreateInput = Type.Object({ name: Type.String({ minLength: 1 }) });

// Partial config edit — an omitted field is left unchanged; `null` clears it.
// `Type.Optional` distinguishes "not provided" from an explicit null in the JSON.
const UpdateInput = Type.Object({
    id: Type.String(),
    name: Type.Optional(Type.String({ minLength: 1 })),
    defaultConfig: Type.Optional(Type.Union([Type.Unknown(), Type.Null()])),
    aggregation: Type.Optional(
        Type.Union([
            Type.Object({ strategyId: Type.String(), config: Type.Unknown() }),
            Type.Null(),
        ]),
    ),
    cutRules: Type.Optional(Type.Union([Type.Unknown(), Type.Null()])),
});

// Materialise round N (Slice 2). `id` rides the path (`/competitions/:id/rounds`);
// mount merges params into the body input. Course + date are PER ROUND — the
// defaults carry slots/tees/start-list, not where or when.
const CreateRoundInput = Type.Object({
    id: Type.String(),
    courseId: Type.String({ minLength: 1 }),
    playedAt: Type.String({ minLength: 1 }),
    roundType: Type.Optional(
        Type.Union([
            Type.Literal('full_18'),
            Type.Literal('front_9'),
            Type.Literal('back_9'),
            Type.Literal('custom_holes'),
        ]),
    ),
    venueType: Type.Optional(
        Type.Union([Type.Literal('outdoor'), Type.Literal('indoor')]),
    ),
});

const LIFECYCLE = Type.Union([
    Type.Literal('draft'),
    Type.Literal('setup'),
    Type.Literal('active'),
    Type.Literal('finalized'),
]);
const TransitionInput = Type.Object({ id: Type.String(), to: LIFECYCLE });

// Roster add: player XOR guest, enforced by the service (and the DB check).
const AddParticipantInput = Type.Object({
    competitionId: Type.String(),
    playerId: Type.Optional(Type.String()),
    guestPlayerId: Type.Optional(Type.String()),
    category: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

// --- API descriptor ---
//
// READ paths (`get`, `participants`) stay open per app convention. Every
// MUTATION requires a session (`requireAuth()`) AND owner-or-admin authorization
// (`authz.assertAdmin`, throwing 403/404) — the first real role_grants gate.
// `create` requires a session but NO admin check: the creator becomes the owner.
// `list` is caller-scoped, so it also requires a session.

async function getOr404(svc: CompetitionService, id: string): Promise<Competition> {
    const found = await svc.get(id);
    if (!found) throw new NotFoundError('competition not found');
    return found;
}

/** Session identity when one accompanied the request; null otherwise. Same
 *  opportunistic-read convention as the friendly-rounds front door. */
function optionalUserId(c: Context): string | null {
    return c.get('user')?.id ?? null;
}

/** One round in the detail read. `shareToken` — the round's token front door —
 *  is included ONLY for admin readers (the read itself stays open). */
export interface CompetitionRoundListItem {
    id: string;
    competitionId: string;
    roundId: string;
    roundNumber: number;
    cutEligible: boolean;
    postCut: boolean;
    createdAt: string;
    status: CompetitionRoundSummary['status'];
    completedAt: string | null;
    date: string;
    courseNameSnapshot: string | null;
    shareToken?: string;
}

/** The detail read: competition + its rounds — the client page's ONE fetch. */
export interface CompetitionDetail extends Competition {
    rounds: CompetitionRoundListItem[];
}

function toPlayerRef(input: Static<typeof AddParticipantInput>): PlayerRef | null {
    const hasPlayer = input.playerId !== undefined;
    const hasGuest = input.guestPlayerId !== undefined;
    // XOR at the edge — a clean 400-shaped refusal beats a DB check violation.
    if (hasPlayer === hasGuest) return null;
    return hasPlayer
        ? { kind: 'player', id: input.playerId! }
        : { kind: 'guest', id: input.guestPlayerId! };
}

export function createCompetitionsApi(
    svc: CompetitionService,
    rounds: CompetitionRoundService,
    roles: RoleService,
    authz: CompetitionAuthz,
) {
    /** Non-throwing admin check for the open detail read (assertAdmin is the
     *  mutation gate and throws; a read must not 403 — it just omits tokens). */
    async function isAdmin(competition: Competition, c: Context): Promise<boolean> {
        const playerId = optionalUserId(c);
        if (playerId === null) return false;
        if (competition.ownerPlayerId === playerId) return true;
        return roles.hasRole(playerId, 'competition_admin', 'competition', competition.id);
    }

    return {
        // --- Reads (open) ---
        get: {
            method: 'GET' as const,
            path: '/competitions/get',
            fn: async (
                input: Static<typeof ByIdInput>,
                c: Context,
            ): Promise<CompetitionDetail> => {
                const competition = await getOr404(svc, input.id);
                const admin = await isAdmin(competition, c);
                const roundRows = await rounds.listForCompetition(input.id);
                return {
                    ...competition,
                    rounds: roundRows.map(({ shareToken, ...rest }) => ({
                        ...rest,
                        ...(admin && shareToken !== null ? { shareToken } : {}),
                    })),
                };
            },
            schema: ByIdInput,
        },
        participants: {
            method: 'GET' as const,
            path: '/competitions/participants',
            fn: (input: Static<typeof ByCompetitionInput>) =>
                svc.listParticipants(input.competitionId),
            schema: ByCompetitionInput,
        },

        // --- Caller-scoped list (auth) ---
        list: {
            method: 'GET' as const,
            path: '/competitions',
            fn: async (c: Context) => {
                const playerId = requireUser(c).id;
                // "by owner OR admin": owned ∪ competition_admin-granted.
                const grants = await roles.listForPlayer(playerId);
                const adminIds = grants
                    .filter(
                        (g) =>
                            g.role === 'competition_admin' &&
                            g.scopeType === 'competition' &&
                            g.scopeId !== null,
                    )
                    .map((g) => g.scopeId as string);
                return svc.listForPlayer(playerId, adminIds);
            },
            middleware: [requireAuth()],
        },

        // --- Mutations (auth + owner/admin) ---
        create: {
            method: 'POST' as const,
            path: '/competitions',
            fn: (input: Static<typeof CreateInput>, c: Context) =>
                svc.create({ name: input.name, ownerPlayerId: requireUser(c).id }),
            schema: CreateInput,
            middleware: [requireAuth()],
        },
        update: {
            method: 'POST' as const,
            path: '/competitions/update',
            fn: async (input: Static<typeof UpdateInput>, c: Context) => {
                await authz.assertAdmin(input.id, requireUser(c).id);
                return svc.update(input);
            },
            schema: UpdateInput,
            middleware: [requireAuth()],
        },
        transition: {
            method: 'POST' as const,
            path: '/competitions/transition',
            fn: async (input: Static<typeof TransitionInput>, c: Context) => {
                await authz.assertAdmin(input.id, requireUser(c).id);
                return svc.transition(input.id, input.to);
            },
            schema: TransitionInput,
            middleware: [requireAuth()],
        },
        // Materialise round N from the competition defaults (Slice 2): copies
        // slots/category-tees/start-list into a fresh RoundSetupDraft, mints
        // the round through the existing create machinery, and wraps it 1:1 in
        // `competition_rounds`. Allowed in setup + active (see service doc).
        createRound: {
            method: 'POST' as const,
            path: '/competitions/:id/rounds',
            fn: async (input: Static<typeof CreateRoundInput>, c: Context) => {
                const playerId = requireUser(c).id;
                await authz.assertAdmin(input.id, playerId);
                return rounds.materialise({
                    competitionId: input.id,
                    courseId: input.courseId,
                    playedAt: input.playedAt,
                    ...(input.roundType ? { roundType: input.roundType } : {}),
                    ...(input.venueType ? { venueType: input.venueType } : {}),
                    createdByPlayerId: playerId,
                });
            },
            schema: CreateRoundInput,
            middleware: [requireAuth()],
        },
        addParticipant: {
            method: 'POST' as const,
            path: '/competitions/participants/add',
            fn: async (input: Static<typeof AddParticipantInput>, c: Context) => {
                await authz.assertAdmin(input.competitionId, requireUser(c).id);
                const playerRef = toPlayerRef(input);
                if (!playerRef) {
                    return {
                        ok: false as const,
                        refusal: {
                            code: 'invalid_player_ref',
                            message:
                                'Add exactly one of a player or a guest — not both, not neither.',
                        },
                    };
                }
                return svc.addParticipant({
                    competitionId: input.competitionId,
                    playerRef,
                    category: input.category ?? null,
                });
            },
            schema: AddParticipantInput,
            middleware: [requireAuth()],
        },
        removeParticipant: {
            method: 'POST' as const,
            path: '/competitions/participants/remove',
            fn: async (input: Static<typeof ByParticipantInput>, c: Context) => {
                const participant = await svc.findParticipant(input.participantId);
                if (!participant) throw new NotFoundError('participant not found');
                await authz.assertAdmin(participant.competitionId, requireUser(c).id);
                return svc.removeParticipant(input.participantId);
            },
            schema: ByParticipantInput,
            middleware: [requireAuth()],
        },
        withdrawParticipant: {
            method: 'POST' as const,
            path: '/competitions/participants/withdraw',
            fn: async (input: Static<typeof ByParticipantInput>, c: Context) => {
                const participant = await svc.findParticipant(input.participantId);
                if (!participant) throw new NotFoundError('participant not found');
                await authz.assertAdmin(participant.competitionId, requireUser(c).id);
                return svc.withdrawParticipant(
                    input.participantId,
                    new Date().toISOString(),
                );
            },
            schema: ByParticipantInput,
            middleware: [requireAuth()],
        },
    };
}
