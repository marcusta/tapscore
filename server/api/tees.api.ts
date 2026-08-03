import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { TeeService } from '../services/tee.service';
import type { CourseManagementAuthz } from './course-management-authz';

// --- Input schemas ---

const IdInput = Type.Object({ id: Type.String() });
const ByCourseInput = Type.Object({ courseId: Type.String() });

const Gender = Type.Union([Type.Literal('M'), Type.Literal('F')]);

const HoleLengthInput = Type.Object({
    holeNumber: Type.Number(),
    lengthM: Type.Number(),
    strokeIndexOverride: Type.Union([Type.Number(), Type.Null()]),
});

const RatingInput = Type.Object({
    gender: Gender,
    courseRating: Type.Number(),
    slope: Type.Number(),
    par: Type.Number(),
    totalLengthM: Type.Number(),
});

const CreateTeeInput = Type.Object({
    courseId: Type.String(),
    name: Type.String(),
    colour: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    holeLengths: Type.Array(HoleLengthInput),
    ratings: Type.Array(RatingInput),
});

const UpdateTeeInput = Type.Object({
    id: Type.String(),
    name: Type.Optional(Type.String()),
    colour: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    holeLengths: Type.Optional(Type.Array(HoleLengthInput)),
    ratings: Type.Optional(Type.Array(RatingInput)),
});

// --- API descriptor ---

export function createTeesApi(svc: TeeService, authz: CourseManagementAuthz) {
    const mw = [requireAuth()];
    const gate = (c: Context) => authz.assertCanManageCourses(requireUser(c).id);
    return {
        listByCourse: { method: 'GET'    as const, path: '/tees/by-course', fn: (input: Static<typeof ByCourseInput>)    => svc.listByCourse(input.courseId), schema: ByCourseInput,  middleware: mw },
        get:          { method: 'GET'    as const, path: '/tees/get',       fn: (input: Static<typeof IdInput>)          => svc.getById(input.id),            schema: IdInput,        middleware: mw },
        create:       { method: 'POST'   as const, path: '/tees',           fn: async (input: Static<typeof CreateTeeInput>, c: Context) => { await gate(c); return svc.create(input); }, schema: CreateTeeInput, middleware: mw },
        update:       { method: 'POST'   as const, path: '/tees/update',    fn: async (input: Static<typeof UpdateTeeInput>, c: Context) => { await gate(c); return svc.update(input.id, { name: input.name, colour: input.colour, holeLengths: input.holeLengths, ratings: input.ratings }); }, schema: UpdateTeeInput, middleware: mw },
        remove:       { method: 'DELETE' as const, path: '/tees/:id',       fn: async (input: Static<typeof IdInput>, c: Context) => { await gate(c); await svc.remove(input.id); }, schema: IdInput, middleware: mw },
    };
}
