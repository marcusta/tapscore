import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { CourseService } from '../services/course.service';
import type { CourseManagementAuthz } from './course-management-authz';

// --- Input schemas ---

const IdInput = Type.Object({ id: Type.String() });
const ByClubInput = Type.Object({ clubId: Type.String() });
const ByCourseInput = Type.Object({ courseId: Type.String() });

const HoleInput = Type.Object({
    holeNumber: Type.Number(),
    par: Type.Number(),
    strokeIndex: Type.Number(),
});

const HoleCount = Type.Union([Type.Literal(9), Type.Literal(18)]);
const Gender = Type.Union([Type.Literal('M'), Type.Literal('F')]);

// WGS84 decimal degrees, or null to clear. Range and both-or-neither are
// enforced in `CourseService` (manage-ui.md §3.3a) — the schema only says
// "a number or explicitly nothing", because a half-set position is a domain
// refusal with a readable message, not a shape error.
const Degrees = Type.Optional(Type.Union([Type.Number(), Type.Null()]));

const CreateCourseInput = Type.Object({
    clubId: Type.String(),
    name: Type.String(),
    holeCount: HoleCount,
    holes: Type.Optional(Type.Array(HoleInput)),
    latitude: Degrees,
    longitude: Degrees,
});

const UpdateCourseInput = Type.Object({
    id: Type.String(),
    name: Type.Optional(Type.String()),
    holeCount: Type.Optional(HoleCount),
    holes: Type.Optional(Type.Array(HoleInput)),
    latitude: Degrees,
    longitude: Degrees,
});

const UpdateHoleInput = Type.Object({
    courseId: Type.String(),
    holeNumber: Type.Number(),
    par: Type.Optional(Type.Number()),
    strokeIndex: Type.Optional(Type.Number()),
});

const TeeRoleInput = Type.Object({
    courseId: Type.String(),
    roleKey: Type.String({ minLength: 1 }),
    gender: Gender,
    teeId: Type.String(),
});

const ClearTeeRoleInput = Type.Object({
    courseId: Type.String(),
    roleKey: Type.String({ minLength: 1 }),
    gender: Gender,
});

// --- API descriptor ---

export function createCoursesApi(svc: CourseService, authz: CourseManagementAuthz) {
    const mw = [requireAuth()];
    const gate = (c: Context) => authz.assertCanManageCourses(requireUser(c).id);
    return {
        list:       { method: 'GET'    as const, path: '/courses',         fn: ()                                         => svc.list(),                                                                                  middleware: mw },
        listByClub: { method: 'GET'    as const, path: '/courses/by-club', fn: (input: Static<typeof ByClubInput>)        => svc.listByClub(input.clubId),                                                                schema: ByClubInput,       middleware: mw },
        get:        { method: 'GET'    as const, path: '/courses/get',     fn: (input: Static<typeof IdInput>)            => svc.getById(input.id),                                                                       schema: IdInput,           middleware: mw },
        teeRoleCatalog: { method: 'GET' as const, path: '/courses/tee-roles/catalog', fn: () => svc.listTeeRoles(), middleware: mw },
        teeRoles: { method: 'GET' as const, path: '/courses/tee-roles', fn: (input: Static<typeof ByCourseInput>) => svc.listTeeRolesForCourse(input.courseId), schema: ByCourseInput, middleware: mw },
        create:     { method: 'POST'   as const, path: '/courses',         fn: async (input: Static<typeof CreateCourseInput>, c: Context) => { await gate(c); return svc.create(input); }, schema: CreateCourseInput, middleware: mw },
        update:     { method: 'POST'   as const, path: '/courses/update',  fn: async (input: Static<typeof UpdateCourseInput>, c: Context) => { await gate(c); return svc.update(input.id, { name: input.name, holeCount: input.holeCount, holes: input.holes, latitude: input.latitude, longitude: input.longitude }); }, schema: UpdateCourseInput, middleware: mw },
        updateHole: { method: 'POST'   as const, path: '/courses/holes/update', fn: async (input: Static<typeof UpdateHoleInput>, c: Context) => { await gate(c); return svc.updateHole(input.courseId, input.holeNumber, { par: input.par, strokeIndex: input.strokeIndex }); }, schema: UpdateHoleInput, middleware: mw },
        setTeeRole: { method: 'POST' as const, path: '/courses/tee-roles', fn: async (input: Static<typeof TeeRoleInput>, c: Context) => { await gate(c); return svc.setTeeRole(input); }, schema: TeeRoleInput, middleware: mw },
        clearTeeRole: { method: 'DELETE' as const, path: '/courses/tee-roles/:courseId/:roleKey/:gender', fn: async (input: Static<typeof ClearTeeRoleInput>, c: Context) => { await gate(c); await svc.clearTeeRole(input.courseId, input.roleKey, input.gender); }, schema: ClearTeeRoleInput, middleware: mw },
        validate:   { method: 'GET'    as const, path: '/courses/validate', fn: (input: Static<typeof IdInput>)         => svc.validate(input.id), schema: IdInput, middleware: mw },
        remove:     { method: 'DELETE' as const, path: '/courses/:id',     fn: async (input: Static<typeof IdInput>, c: Context) => { await gate(c); await svc.remove(input.id); }, schema: IdInput, middleware: mw },
    };
}
