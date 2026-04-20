import { Type, type Static } from '@sinclair/typebox';
import { requireAuth } from '@basics/core/server/auth';
import type { ParticipantService } from '../services/participant.service';

// --- Input schemas ---

const IdInput = Type.Object({ id: Type.String() });
const ByRoundInput = Type.Object({ roundId: Type.String() });

const Gender = Type.Union([Type.Literal('M'), Type.Literal('F')]);

const SnapshotInput = Type.Object({
    teeId: Type.String(),
    gender: Gender,
    fromPlayerId: Type.Optional(Type.String()),
    handicapIndex: Type.Optional(Type.Number()),
    allowancePct: Type.Optional(Type.Number()),
});

const PlayerLinkInput = Type.Object({
    playerId: Type.Optional(Type.String()),
    guestPlayerId: Type.Optional(Type.String()),
});

const CreateParticipantInput = Type.Object({
    roundId: Type.String(),
    teamLabel: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    categorySnapshot: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    snapshot: Type.Optional(SnapshotInput),
    players: Type.Optional(Type.Array(PlayerLinkInput)),
});

const AddPlayerInput = Type.Object({
    participantId: Type.String(),
    playerId: Type.String(),
});

const AddGuestInput = Type.Object({
    participantId: Type.String(),
    guestPlayerId: Type.String(),
});

const ListForInput = Type.Object({ participantId: Type.String() });

// --- API descriptor ---

export function createParticipantsApi(svc: ParticipantService) {
    const mw = [requireAuth()];
    return {
        listByRound: { method: 'GET'    as const, path: '/participants/by-round', fn: (input: Static<typeof ByRoundInput>)          => svc.listByRound(input.roundId),                               schema: ByRoundInput,          middleware: mw },
        get:         { method: 'GET'    as const, path: '/participants/get',      fn: (input: Static<typeof IdInput>)               => svc.getById(input.id),                                        schema: IdInput,               middleware: mw },
        create:      { method: 'POST'   as const, path: '/participants',          fn: (input: Static<typeof CreateParticipantInput>) => svc.create(input),                                           schema: CreateParticipantInput, middleware: mw },
        addPlayer:   { method: 'POST'   as const, path: '/participants/add-player', fn: (input: Static<typeof AddPlayerInput>)       => svc.addPlayer(input.participantId, input.playerId),           schema: AddPlayerInput,        middleware: mw },
        addGuest:    { method: 'POST'   as const, path: '/participants/add-guest',  fn: (input: Static<typeof AddGuestInput>)        => svc.addGuest(input.participantId, input.guestPlayerId),       schema: AddGuestInput,         middleware: mw },
        listFor:     { method: 'GET'    as const, path: '/participants/players',  fn: (input: Static<typeof ListForInput>)          => svc.listFor(input.participantId),                             schema: ListForInput,          middleware: mw },
        remove:      { method: 'DELETE' as const, path: '/participants/:id',      fn: (input: Static<typeof IdInput>)               => svc.remove(input.id),                                         schema: IdInput,               middleware: mw },
    };
}
