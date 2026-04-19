import { Type, type Static } from '@sinclair/typebox';
import { requireAuth } from '@basics/core/server/auth';
import type { CourseService } from '../services/course.service';

// --- Input schemas ---

const IdInput = Type.Object({ id: Type.String() });
const ByClubInput = Type.Object({ clubId: Type.String() });

const HoleInput = Type.Object({
    holeNumber: Type.Number(),
    par: Type.Number(),
    strokeIndex: Type.Number(),
});

const HoleCount = Type.Union([Type.Literal(9), Type.Literal(18)]);

const CreateCourseInput = Type.Object({
    clubId: Type.String(),
    name: Type.String(),
    holeCount: HoleCount,
    holes: Type.Array(HoleInput),
});

const UpdateCourseInput = Type.Object({
    id: Type.String(),
    name: Type.Optional(Type.String()),
    holeCount: Type.Optional(HoleCount),
    holes: Type.Optional(Type.Array(HoleInput)),
});

// --- API descriptor ---

export function createCoursesApi(svc: CourseService) {
    const mw = [requireAuth()];
    return {
        list:       { method: 'GET'    as const, path: '/courses',         fn: ()                                         => svc.list(),                                                                                  middleware: mw },
        listByClub: { method: 'GET'    as const, path: '/courses/by-club', fn: (input: Static<typeof ByClubInput>)        => svc.listByClub(input.clubId),                                                                schema: ByClubInput,       middleware: mw },
        get:        { method: 'GET'    as const, path: '/courses/get',     fn: (input: Static<typeof IdInput>)            => svc.getById(input.id),                                                                       schema: IdInput,           middleware: mw },
        create:     { method: 'POST'   as const, path: '/courses',         fn: (input: Static<typeof CreateCourseInput>)  => svc.create(input),                                                                           schema: CreateCourseInput, middleware: mw },
        update:     { method: 'POST'   as const, path: '/courses/update',  fn: (input: Static<typeof UpdateCourseInput>)  => svc.update(input.id, { name: input.name, holeCount: input.holeCount, holes: input.holes }),  schema: UpdateCourseInput, middleware: mw },
        remove:     { method: 'DELETE' as const, path: '/courses/:id',     fn: (input: Static<typeof IdInput>)            => svc.remove(input.id),                                                                        schema: IdInput,           middleware: mw },
    };
}
