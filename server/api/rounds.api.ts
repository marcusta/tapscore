import { Type, type Static } from '@sinclair/typebox';
import { requireAuth } from '@basics/core/server/auth';
import type { RoundService } from '../services/round.service';
import { RoundDefinition } from '../domain/round-definition';
import { RoundSetupDraft } from '../domain/round-setup/draft';

// --- Input schemas ---

const IdInput = Type.Object({ id: Type.String() });
const ByRoundInput = Type.Object({ roundId: Type.String() });

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
/**
 * Phase 2.6b/3b.3.3 — `create` accepts a `RoundDefinition` directly. The
 * service drives compile + persist in one transaction. (The old
 * `{courseId, date, formatSlots, …}` legacy-bridge shape was deleted in
 * Phase 2.7a along with the `round_format_slots` table.)
 */
const CreateRoundInput = Type.Object({
    definition: RoundDefinition,
});

/**
 * Slice 5 — the mobile-facing create path. The wizard submits a
 * format-agnostic `RoundSetupDraft`; the server builds the `RoundDefinition`
 * (ball strategies, selectors, dedupe, template freeze) and compiles it. The
 * response is `{ ok: true, round } | { ok: false, diagnostics }` so the wizard
 * attaches structured diagnostics to the offending control. Direct
 * `RoundDefinition` creation (`POST /rounds`) stays the internal/admin path.
 */
const CreateFromDraftInput = Type.Object({
    draft: RoundSetupDraft,
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
});

// --- API descriptor ---

export function createRoundsApi(svc: RoundService) {
    const mw = [requireAuth()];
    return {
        list:   { method: 'GET'    as const, path: '/rounds',        fn: ()                                        => svc.list(),                                                                                                                                                                                                                  middleware: mw },
        balls:  { method: 'GET'    as const, path: '/rounds/balls',  fn: (input: Static<typeof ByRoundInput>)      => svc.ballsForRound(input.roundId),                                                                                                                                                                                            schema: ByRoundInput,     middleware: mw },
        get:    { method: 'GET'    as const, path: '/rounds/get',    fn: (input: Static<typeof IdInput>)           => svc.getById(input.id),                                                                                                                                                                                                       schema: IdInput,          middleware: mw },
        create: { method: 'POST'   as const, path: '/rounds',        fn: (input: Static<typeof CreateRoundInput>)  => svc.create({ definition: input.definition }),                                                                                                                                                                                schema: CreateRoundInput, middleware: mw },
        createFromDraft: { method: 'POST' as const, path: '/rounds/from-draft', fn: (input: Static<typeof CreateFromDraftInput>) => svc.createFromDraft(input.draft), schema: CreateFromDraftInput, middleware: mw },
        update: { method: 'POST'   as const, path: '/rounds/update', fn: (input: Static<typeof UpdateRoundInput>)  => svc.update(input.id, { date: input.date, roundType: input.roundType, venueType: input.venueType, startListMode: input.startListMode, windowStart: input.windowStart, windowEnd: input.windowEnd, selfOrganize: input.selfOrganize, status: input.status }), schema: UpdateRoundInput, middleware: mw },
        remove: { method: 'DELETE' as const, path: '/rounds/:id',    fn: (input: Static<typeof IdInput>)           => svc.remove(input.id),                                                                                                                                                                                                        schema: IdInput,          middleware: mw },
    };
}
