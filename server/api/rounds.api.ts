import { Type, type Static } from '@sinclair/typebox';
import { requireAuth } from '@basics/core/server/auth';
import type { RoundService } from '../services/round.service';
import { RoundDefinition } from '../domain/round-definition';

// --- Input schemas ---

const IdInput = Type.Object({ id: Type.String() });

const RoundType = Type.Union([
    Type.Literal('full_18'),
    Type.Literal('front_9'),
    Type.Literal('back_9'),
    Type.Literal('custom_holes'),
]);
const VenueType = Type.Union([Type.Literal('outdoor'), Type.Literal('indoor')]);
const StartListMode = Type.Union([
    Type.Literal('structured'),
    Type.Literal('fixed_slots'),
    Type.Literal('open_window'),
]);
const RoundStatus = Type.Union([
    Type.Literal('not_started'),
    Type.Literal('active'),
    Type.Literal('complete'),
]);
const ScoringMode = Type.Union([
    Type.Literal('stroke_play'),
    Type.Literal('stableford'),
    Type.Literal('match_play'),
    Type.Literal('kopenhamnare'),
    Type.Literal('skins'),
    Type.Literal('custom'),
]);
const TeamShape = Type.Union([
    Type.Literal('individual'),
    Type.Literal('better_ball'),
    Type.Literal('scramble'),
    Type.Literal('foursomes'),
    Type.Literal('greensome'),
    Type.Literal('custom'),
]);

// `scopeConfig` at the wire carries `{ scope?, config? }` (both optional),
// or null. Using `Type.Unknown()` here keeps the wire permissive — format
// strategies type their own `config` shape at the call site, and the
// service normalises legacy blobs on read (see `FormatSlotConfig`).
const ScopeConfigInput = Type.Union([
    Type.Null(),
    Type.Object({
        scope: Type.Optional(
            Type.Object({ participantIds: Type.Array(Type.String()) }),
        ),
        config: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    }),
]);

const FormatSlotInput = Type.Object({
    slotIndex: Type.Number(),
    scoringMode: ScoringMode,
    teamShape: TeamShape,
    allowancePct: Type.Number(),
    scopeConfig: ScopeConfigInput,
});

/**
 * Phase 2.6b/3b.3.3 — `create` accepts a `RoundDefinition` directly. The
 * service drives compile + persist in one transaction. The old
 * `{courseId, date, formatSlots, …}` shape moved to `roundService.createLegacy`
 * for remaining legacy fixture paths; it is intentionally NOT wired into
 * the HTTP API.
 */
const CreateRoundInput = Type.Object({
    definition: RoundDefinition,
});

const UpdateRoundInput = Type.Object({
    id: Type.String(),
    date: Type.Optional(Type.String()),
    roundType: Type.Optional(RoundType),
    venueType: Type.Optional(VenueType),
    startListMode: Type.Optional(StartListMode),
    windowStart: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    windowEnd: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    selfOrganize: Type.Optional(Type.Boolean()),
    status: Type.Optional(RoundStatus),
    formatSlots: Type.Optional(Type.Array(FormatSlotInput)),
});

// --- API descriptor ---

export function createRoundsApi(svc: RoundService) {
    const mw = [requireAuth()];
    return {
        list:   { method: 'GET'    as const, path: '/rounds',        fn: ()                                        => svc.list(),                                                                                                                                                                                                                  middleware: mw },
        get:    { method: 'GET'    as const, path: '/rounds/get',    fn: (input: Static<typeof IdInput>)           => svc.getById(input.id),                                                                                                                                                                                                       schema: IdInput,          middleware: mw },
        create: { method: 'POST'   as const, path: '/rounds',        fn: (input: Static<typeof CreateRoundInput>)  => svc.create({ definition: input.definition }),                                                                                                                                                                                schema: CreateRoundInput, middleware: mw },
        update: { method: 'POST'   as const, path: '/rounds/update', fn: (input: Static<typeof UpdateRoundInput>)  => svc.update(input.id, { date: input.date, roundType: input.roundType, venueType: input.venueType, startListMode: input.startListMode, windowStart: input.windowStart, windowEnd: input.windowEnd, selfOrganize: input.selfOrganize, status: input.status, formatSlots: input.formatSlots }), schema: UpdateRoundInput, middleware: mw },
        remove: { method: 'DELETE' as const, path: '/rounds/:id',    fn: (input: Static<typeof IdInput>)           => svc.remove(input.id),                                                                                                                                                                                                        schema: IdInput,          middleware: mw },
    };
}
