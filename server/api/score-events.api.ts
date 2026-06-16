import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { ScoreEventService } from '../services/score-event.service';

// --- Input schemas ---

const ByRoundInput = Type.Object({ roundId: Type.String() });

export const EventType = Type.Union([
    Type.Literal('score_entered'),
    Type.Literal('score_cleared'),
    Type.Literal('score_confirmed'),
    Type.Literal('manual_override'),
]);

const AppendInput = Type.Object({
    roundId: Type.String(),
    ballId: Type.String(),
    playHoleId: Type.String(),
    strokes: Type.Union([Type.Number(), Type.Null()]),
    eventType: EventType,
    clientEventId: Type.String(),
    sourcePlayerId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    sourceGuestPlayerId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    // Per-event JSON metadata (migration 014). Umbrella uses `{gir: boolean}`.
    // Keeps the wire permissive — format strategies read what they need.
    metadata: Type.Optional(
        Type.Union([Type.Record(Type.String(), Type.Unknown()), Type.Null()]),
    ),
});

// --- API descriptor ---

export function createScoreEventsApi(svc: ScoreEventService) {
    const mw = [requireAuth()];
    return {
        listByRound: { method: 'GET'  as const, path: '/score-events/by-round', fn: (input: Static<typeof ByRoundInput>)           => svc.listByRound(input.roundId),                                                                             schema: ByRoundInput, middleware: mw },
        append:      { method: 'POST' as const, path: '/score-events',          fn: (input: Static<typeof AppendInput>, c: Context) => svc.append({ ...input, recordedByPlayerId: requireUser(c).id }), schema: AppendInput,  middleware: mw },
    };
}
