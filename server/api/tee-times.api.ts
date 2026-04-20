import { Type, type Static } from '@sinclair/typebox';
import { requireAuth } from '@basics/core/server/auth';
import type { TeeTimeService } from '../services/tee-time.service';

// --- Input schemas ---

const IdInput = Type.Object({ id: Type.String() });
const ByRoundInput = Type.Object({ roundId: Type.String() });

const StartHole = Type.Union([Type.Literal(1), Type.Literal(10)]);

const CreateTeeTimeInput = Type.Object({
    roundId: Type.String(),
    startTime: Type.String(),
    startHole: StartHole,
    capacity: Type.Number(),
    hittingBay: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const UpdateTeeTimeInput = Type.Object({
    id: Type.String(),
    startTime: Type.Optional(Type.String()),
    startHole: Type.Optional(StartHole),
    capacity: Type.Optional(Type.Number()),
    hittingBay: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

// --- API descriptor ---

export function createTeeTimesApi(svc: TeeTimeService) {
    const mw = [requireAuth()];
    return {
        listByRound: { method: 'GET'    as const, path: '/tee-times/by-round', fn: (input: Static<typeof ByRoundInput>)        => svc.listByRound(input.roundId),                                                                                                       schema: ByRoundInput,         middleware: mw },
        get:         { method: 'GET'    as const, path: '/tee-times/get',     fn: (input: Static<typeof IdInput>)              => svc.getById(input.id),                                                                                                                schema: IdInput,              middleware: mw },
        create:      { method: 'POST'   as const, path: '/tee-times',         fn: (input: Static<typeof CreateTeeTimeInput>)   => svc.create(input),                                                                                                                    schema: CreateTeeTimeInput,   middleware: mw },
        update:      { method: 'POST'   as const, path: '/tee-times/update',  fn: (input: Static<typeof UpdateTeeTimeInput>)   => svc.update(input.id, { startTime: input.startTime, startHole: input.startHole, capacity: input.capacity, hittingBay: input.hittingBay }), schema: UpdateTeeTimeInput,   middleware: mw },
        remove:      { method: 'DELETE' as const, path: '/tee-times/:id',     fn: (input: Static<typeof IdInput>)              => svc.remove(input.id),                                                                                                                 schema: IdInput,              middleware: mw },
    };
}
