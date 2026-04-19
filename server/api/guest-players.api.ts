import { Type, type Static } from '@sinclair/typebox';
import type { GuestPlayerService } from '../services/guest-player.service';

// --- Input schemas ---

const IdInput = Type.Object({ id: Type.String() });

const CreateGuestPlayerInput = Type.Object({
    displayName: Type.String(),
    gender: Type.Union([Type.Literal('M'), Type.Literal('F')]),
    handicapIndex: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
});

// --- API descriptor ---
// No requireAuth(): guest creation/lookup is part of the FriendlyRound share-token flow (Phase 3).

export function createGuestPlayersApi(svc: GuestPlayerService) {
    return {
        list:   { method: 'GET'  as const, path: '/guest-players',     fn: ()                                              => svc.list() },
        get:    { method: 'GET'  as const, path: '/guest-players/get', fn: (input: Static<typeof IdInput>)                 => svc.findById(input.id),  schema: IdInput },
        create: { method: 'POST' as const, path: '/guest-players',     fn: (input: Static<typeof CreateGuestPlayerInput>)  => svc.create(input),       schema: CreateGuestPlayerInput },
    };
}
