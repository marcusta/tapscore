import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { ClubService } from '../services/club.service';
import type { CourseManagementAuthz } from './course-management-authz';

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

export function createClubsApi(svc: ClubService, authz: CourseManagementAuthz) {
    const mw = [requireAuth()];
    const gate = (c: Context) => authz.assertCanManageCourses(requireUser(c).id);
    return {
        list:   { method: 'GET'    as const, path: '/clubs',        fn: ()                                        => svc.list(),                                                               middleware: mw },
        get:    { method: 'GET'    as const, path: '/clubs/get',    fn: (input: Static<typeof IdInput>)           => svc.getById(input.id),                                                    schema: IdInput,         middleware: mw },
        create: { method: 'POST'   as const, path: '/clubs',        fn: async (input: Static<typeof CreateClubInput>, c: Context) => { await gate(c); return svc.create(input); }, schema: CreateClubInput, middleware: mw },
        update: { method: 'POST'   as const, path: '/clubs/update', fn: async (input: Static<typeof UpdateClubInput>, c: Context) => { await gate(c); return svc.update(input.id, { name: input.name, location: input.location, logoUrl: input.logoUrl }); }, schema: UpdateClubInput, middleware: mw },
        remove: { method: 'DELETE' as const, path: '/clubs/:id',    fn: async (input: Static<typeof IdInput>, c: Context) => { await gate(c); await svc.remove(input.id); }, schema: IdInput, middleware: mw },
    };
}
