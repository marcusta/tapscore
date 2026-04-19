import { Type, type Static } from '@sinclair/typebox';
import { requireAuth } from '@basics/core/server/auth';
import type { TeeService } from '../services/tee.service';

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

export function createTeesApi(svc: TeeService) {
    const mw = [requireAuth()];
    return {
        listByCourse: { method: 'GET'    as const, path: '/tees/by-course', fn: (input: Static<typeof ByCourseInput>)    => svc.listByCourse(input.courseId), schema: ByCourseInput,  middleware: mw },
        get:          { method: 'GET'    as const, path: '/tees/get',       fn: (input: Static<typeof IdInput>)          => svc.getById(input.id),            schema: IdInput,        middleware: mw },
        create:       { method: 'POST'   as const, path: '/tees',           fn: (input: Static<typeof CreateTeeInput>)   => svc.create(input),                schema: CreateTeeInput, middleware: mw },
        update:       { method: 'POST'   as const, path: '/tees/update',    fn: (input: Static<typeof UpdateTeeInput>)   => svc.update(input.id, { name: input.name, colour: input.colour, holeLengths: input.holeLengths, ratings: input.ratings }), schema: UpdateTeeInput, middleware: mw },
        remove:       { method: 'DELETE' as const, path: '/tees/:id',       fn: (input: Static<typeof IdInput>)          => svc.remove(input.id),             schema: IdInput,        middleware: mw },
    };
}
