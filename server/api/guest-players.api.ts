import { Type, type Static } from '@sinclair/typebox';
import type { GuestPlayerService } from '../services/guest-player.service';

// --- Input schemas ---

const CreateGuestPlayerInput = Type.Object({
    displayName: Type.String(),
    gender: Type.Union([Type.Literal('M'), Type.Literal('F')]),
    handicapIndex: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
});

// --- API descriptor ---
// No requireAuth(): guest creation is part of no-login FriendlyRound setup.
// Guest identities are readable only through a round's share-token-scoped
// surfaces; this descriptor deliberately exposes no global list/get capability.

export function createGuestPlayersApi(svc: GuestPlayerService) {
    return {
        create: { method: 'POST' as const, path: '/guest-players',     fn: (input: Static<typeof CreateGuestPlayerInput>)  => svc.create(input),       schema: CreateGuestPlayerInput },
    };
}
