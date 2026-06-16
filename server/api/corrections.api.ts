import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { CorrectionService } from '../services/correction.service';
import { FormatAllowanceConfig } from '../domain/round-definition';

// Phase 2.6d-final E4 — generic HTTP surface for the three TYPED correction
// events. The envelope dispatches by generic event kind (setup / allowance /
// ruling); it contains NO built-in format switch. `clientEventId` idempotency is
// enforced inside the service, so a retried request returns the original result.

const SetupCorrectionTarget = Type.Union([
    Type.Literal('producer_tee'),
    Type.Literal('producer_handicap_index'),
    Type.Literal('producer_category'),
    Type.Literal('ball_composition'),
    Type.Literal('slot_declaration'),
    Type.Literal('ball_strategy_config'),
    Type.Literal('play_hole'),
    Type.Literal('playing_group'),
]);

const SetupCorrectionInput = Type.Object({
    roundId: Type.String(),
    target: SetupCorrectionTarget,
    targetRef: Type.Record(Type.String(), Type.String()),
    newValue: Type.Unknown(),
    reason: Type.String(),
    clientEventId: Type.String(),
});

const AllowanceOverrideInput = Type.Object({
    roundId: Type.String(),
    slotDefId: Type.String(),
    newConfig: FormatAllowanceConfig,
    reason: Type.String(),
    clientEventId: Type.String(),
});

const RulingInput = Type.Object({
    roundId: Type.String(),
    target: Type.Union([
        Type.Literal('ball_hole'),
        Type.Literal('ball_total'),
        Type.Literal('slot_ball_result'),
    ]),
    targetId: Type.String(),
    rulingKind: Type.Union([
        Type.Literal('dq'),
        Type.Literal('penalty_strokes'),
        Type.Literal('hole_adjudication'),
        Type.Literal('wd'),
    ]),
    value: Type.Unknown(),
    reason: Type.String(),
    clientEventId: Type.String(),
});

export function createCorrectionsApi(svc: CorrectionService) {
    const mw = [requireAuth()];
    return {
        setupCorrection: {
            method: 'POST' as const,
            path: '/corrections/setup',
            fn: (input: Static<typeof SetupCorrectionInput>, c: Context) =>
                svc.applySetupCorrection({ ...input, recordedBy: requireUser(c).id }),
            schema: SetupCorrectionInput,
            middleware: mw,
        },
        allowanceOverride: {
            method: 'POST' as const,
            path: '/corrections/allowance',
            fn: (input: Static<typeof AllowanceOverrideInput>, c: Context) =>
                svc.applyAllowanceOverride({ ...input, recordedBy: requireUser(c).id }),
            schema: AllowanceOverrideInput,
            middleware: mw,
        },
        ruling: {
            method: 'POST' as const,
            path: '/corrections/ruling',
            fn: (input: Static<typeof RulingInput>, c: Context) =>
                svc.applyRuling({ ...input, recordedBy: requireUser(c).id }),
            schema: RulingInput,
            middleware: mw,
        },
    };
}
