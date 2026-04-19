import { Type, type Static } from '@sinclair/typebox';
import { requireAuth } from '@basics/core/server/auth';
import type { ClubService } from '../services/club.service';

// --- Input schemas ---

const IdInput = Type.Object({ id: Type.String() });

const CreateClubInput = Type.Object({
    name: Type.String(),
    location: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    logoUrl: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const UpdateClubInput = Type.Object({
    id: Type.String(),
    name: Type.Optional(Type.String()),
    location: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    logoUrl: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

// --- API descriptor ---

export function createClubsApi(svc: ClubService) {
    const mw = [requireAuth()];
    return {
        list:   { method: 'GET'    as const, path: '/clubs',        fn: ()                                        => svc.list(),                                                               middleware: mw },
        get:    { method: 'GET'    as const, path: '/clubs/get',    fn: (input: Static<typeof IdInput>)           => svc.getById(input.id),                                                    schema: IdInput,         middleware: mw },
        create: { method: 'POST'   as const, path: '/clubs',        fn: (input: Static<typeof CreateClubInput>)   => svc.create(input),                                                        schema: CreateClubInput, middleware: mw },
        update: { method: 'POST'   as const, path: '/clubs/update', fn: (input: Static<typeof UpdateClubInput>)   => svc.update(input.id, { name: input.name, location: input.location, logoUrl: input.logoUrl }), schema: UpdateClubInput, middleware: mw },
        remove: { method: 'DELETE' as const, path: '/clubs/:id',    fn: (input: Static<typeof IdInput>)           => svc.remove(input.id),                                                     schema: IdInput,         middleware: mw },
    };
}
