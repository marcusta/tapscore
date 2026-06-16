import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { FormatActionService } from '../services/format-action.service';

// Phase 2.6d-final E4 — the ONE generic format-action append endpoint. The
// envelope dispatches by `actionType`; the slot's registered plugin is the sole
// authority on which types are legal and whether a payload validates (no
// built-in format switch here). `clientEventId` idempotency lives in the service.

const AppendInput = Type.Object({
    roundId: Type.String(),
    slotDefId: Type.String(),
    playHoleId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    sequence: Type.Optional(Type.Number()),
    actionType: Type.String(),
    schemaVersion: Type.Optional(Type.Number()),
    subjectBallId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    subjectProducerDefId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    payload: Type.Unknown(),
    supersedesActionId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    clientEventId: Type.String(),
});

export function createFormatActionsApi(svc: FormatActionService) {
    const mw = [requireAuth()];
    return {
        append: {
            method: 'POST' as const,
            path: '/format-actions',
            fn: (input: Static<typeof AppendInput>, c: Context) =>
                svc.append({ ...input, recordedBy: requireUser(c).id }),
            schema: AppendInput,
            middleware: mw,
        },
    };
}
