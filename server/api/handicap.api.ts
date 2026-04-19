import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { HandicapService } from '../services/handicap.service';

// --- Input schemas ---

const PlayerIdInput = Type.Object({ playerId: Type.String() });

const RecordHandicapInput = Type.Object({
    playerId: Type.String(),
    handicapIndex: Type.Number(),
    source: Type.Union([
        Type.Literal('manual'),
        Type.Literal('calculated'),
        Type.Literal('import'),
    ]),
    effectiveDate: Type.String(),
});

// --- API descriptor ---

export function createHandicapApi(svc: HandicapService) {
    const mw = [requireAuth()];
    return {
        latest:  { method: 'GET'  as const, path: '/handicap/latest',  fn: (input: Static<typeof PlayerIdInput>)      => svc.latestFor(input.playerId),  schema: PlayerIdInput,       middleware: mw },
        history: { method: 'GET'  as const, path: '/handicap/history', fn: (input: Static<typeof PlayerIdInput>)      => svc.historyFor(input.playerId), schema: PlayerIdInput,       middleware: mw },
        record:  { method: 'POST' as const, path: '/handicap/record',  fn: (input: Static<typeof RecordHandicapInput>, c: Context) =>
            svc.record({ ...input, enteredByPlayerId: requireUser(c).id }),
            schema: RecordHandicapInput, middleware: mw },
    };
}
