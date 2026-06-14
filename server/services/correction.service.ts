import type { Kysely } from 'kysely';

import type {
    Database,
    RulingKind,
    RulingTarget,
    SetupCorrectionTarget,
} from '../db/schema';
import type { CompilerDiagnostic } from '../domain/compiler/types';
import { persistCompiledRound } from '../domain/compiler/persist';
import {
    definitionInputFromResolved,
    type BallStrategyDefinition,
    type FormatAllowanceConfig,
    type PlayHoleInput,
    type PlayingGroupInput,
    type ProducerDefinition,
    type RoundDefinitionInput,
    type SlotDefinition,
} from '../domain/round-definition';
import type { RoundService } from './round.service';

/**
 * Phase 2.6d — typed corrections (REWRITE_DOMAIN_SPEC.md §17).
 *
 * Three distinct, append-only correction kinds. Each is its own service method
 * — there is NO generic override bus:
 *
 *   - `applySetupCorrection`  pre-finalization fix on a RoundDefinition INPUT.
 *     Mutates the latest definition by stable def-id, re-runs the compiler into
 *     a NEW `round_definitions` version, and lets the diff-upsert recompute all
 *     downstream outputs. Derived rows (balls, slot_balls, CH, …) are never
 *     touched directly.
 *   - `applyAllowanceOverride`  slot-level allowance change. Folds into the
 *     definition chain (new version, `source_kind='allowance_override'`); the
 *     recompile only re-derives the affected slot's PHs. Survives later setup
 *     corrections because it lives in the chain, not a separate overlay.
 *   - `applyRuling`  post-play competitive ruling. Append-only; NO recompile —
 *     read by the scoring layer at `score()` time.
 *
 * Atomicity: the triggering event row and the recompiled outputs are written in
 * ONE transaction. A failed compile returns structured diagnostics and persists
 * nothing — the event row is never orphaned.
 */

export type CorrectionResult =
    | { ok: true; eventId: string; version: number }
    | { ok: false; diagnostics: CompilerDiagnostic[] };

export interface SetupCorrectionInput {
    roundId: string;
    target: SetupCorrectionTarget;
    /**
     * Stable def-id ref(s). Shape by target:
     *   producer_tee | producer_handicap_index | producer_category → { producerDefId }
     *   ball_composition | ball_strategy_config → { strategyDefId }
     *   slot_declaration → { slotDefId }
     */
    targetRef: Record<string, string>;
    /**
     * The new input value. Shape by target:
     *   producer_tee → teeId (string)
     *   producer_handicap_index → handicap index (number)
     *   producer_category → category (string | null)
     *   ball_composition → composition `{ teams: [...] }`
     *   ball_strategy_config → `{ strategyId?, derivationConfig? }`
     *   slot_declaration → partial `SlotDefinition` (formatId / allowanceConfig / teamGrouping / ballSelector / formatConfig)
     */
    newValue: unknown;
    reason: string;
    recordedBy?: string | null;
    clientEventId: string;
}

export interface AllowanceOverrideInput {
    roundId: string;
    slotDefId: string;
    newConfig: FormatAllowanceConfig;
    reason: string;
    recordedBy?: string | null;
    clientEventId: string;
}

export interface RulingInput {
    roundId: string;
    target: RulingTarget;
    targetId: string;
    rulingKind: RulingKind;
    value: unknown;
    reason: string;
    recordedBy?: string | null;
    clientEventId: string;
}

export class CorrectionService {
    constructor(
        private db: Kysely<Database>,
        private roundService: RoundService,
    ) {}

    // --- setup_correction_event ------------------------------------------------

    async applySetupCorrection(input: SetupCorrectionInput): Promise<CorrectionResult> {
        const existing = await this.db
            .selectFrom('setup_correction_events')
            .where('round_id', '=', input.roundId)
            .where('client_event_id', '=', input.clientEventId)
            .select(['id', 'result_version'])
            .executeTakeFirst();
        if (existing) {
            return { ok: true, eventId: existing.id, version: existing.result_version ?? 0 };
        }

        const latest = await this.roundService.latestDefinition(input.roundId);
        if (!latest) throw new Error(`round ${input.roundId} has no compiled definition to correct`);

        const def = definitionInputFromResolved(latest.definition);
        const oldValue = applySetupMutation(def, input.target, input.targetRef, input.newValue);

        const compiled = await this.roundService.compileDefinition(input.roundId, def);
        if (!compiled.ok) return { ok: false, diagnostics: compiled.diagnostics };

        const eventId = crypto.randomUUID();
        const version = await this.db.transaction().execute(async (trx) => {
            await trx
                .insertInto('setup_correction_events')
                .values({
                    id: eventId,
                    round_id: input.roundId,
                    target: input.target,
                    target_ref: JSON.stringify(input.targetRef),
                    old_value: oldValue === undefined ? null : JSON.stringify(oldValue),
                    new_value: JSON.stringify(input.newValue),
                    reason: input.reason,
                    recorded_by_player_id: input.recordedBy ?? null,
                    client_event_id: input.clientEventId,
                })
                .execute();
            const r = await persistCompiledRound(trx, compiled.compiled, {
                sourceKind: 'setup_correction',
                sourceEventId: eventId,
            });
            await trx
                .updateTable('setup_correction_events')
                .set({ result_version: r.version })
                .where('id', '=', eventId)
                .execute();
            return r.version;
        });

        return { ok: true, eventId, version };
    }

    // --- allowance_override_event ---------------------------------------------

    async applyAllowanceOverride(input: AllowanceOverrideInput): Promise<CorrectionResult> {
        const existing = await this.db
            .selectFrom('allowance_override_events')
            .where('round_id', '=', input.roundId)
            .where('client_event_id', '=', input.clientEventId)
            .select(['id', 'result_version'])
            .executeTakeFirst();
        if (existing) {
            return { ok: true, eventId: existing.id, version: existing.result_version ?? 0 };
        }

        const latest = await this.roundService.latestDefinition(input.roundId);
        if (!latest) throw new Error(`round ${input.roundId} has no compiled definition to override`);

        const def = definitionInputFromResolved(latest.definition);
        const slot = def.slots.find((s) => s.id === input.slotDefId);
        if (!slot) {
            throw new Error(`round ${input.roundId} has no slot with def-id '${input.slotDefId}'`);
        }
        const oldConfig = slot.allowanceConfig;
        slot.allowanceConfig = input.newConfig;

        const compiled = await this.roundService.compileDefinition(input.roundId, def);
        if (!compiled.ok) return { ok: false, diagnostics: compiled.diagnostics };

        const eventId = crypto.randomUUID();
        const version = await this.db.transaction().execute(async (trx) => {
            await trx
                .insertInto('allowance_override_events')
                .values({
                    id: eventId,
                    round_id: input.roundId,
                    slot_def_id: input.slotDefId,
                    old_config: JSON.stringify(oldConfig),
                    new_config: JSON.stringify(input.newConfig),
                    reason: input.reason,
                    recorded_by_player_id: input.recordedBy ?? null,
                    client_event_id: input.clientEventId,
                })
                .execute();
            const r = await persistCompiledRound(trx, compiled.compiled, {
                sourceKind: 'allowance_override',
                sourceEventId: eventId,
            });
            await trx
                .updateTable('allowance_override_events')
                .set({ result_version: r.version })
                .where('id', '=', eventId)
                .execute();
            return r.version;
        });

        return { ok: true, eventId, version };
    }

    // --- ruling_event ----------------------------------------------------------

    async applyRuling(input: RulingInput): Promise<{ id: string }> {
        const existing = await this.db
            .selectFrom('ruling_events')
            .where('round_id', '=', input.roundId)
            .where('client_event_id', '=', input.clientEventId)
            .select('id')
            .executeTakeFirst();
        if (existing) return { id: existing.id };

        const id = crypto.randomUUID();
        await this.db
            .insertInto('ruling_events')
            .values({
                id,
                round_id: input.roundId,
                target: input.target,
                target_id: input.targetId,
                ruling_kind: input.rulingKind,
                value: JSON.stringify(input.value),
                reason: input.reason,
                recorded_by_player_id: input.recordedBy ?? null,
                client_event_id: input.clientEventId,
            })
            .execute();
        return { id };
    }
}

// --- Setup-correction mutation -------------------------------------------------
//
// Mutates the loose definition IN PLACE by stable def-id; returns the prior
// value for the event's `old_value` audit. Targeting an unknown def-id is an
// integrity error (the ref is wrong), not a per-field diagnostic — throw.

function applySetupMutation(
    def: RoundDefinitionInput,
    target: SetupCorrectionTarget,
    ref: Record<string, string>,
    newValue: unknown,
): unknown {
    switch (target) {
        case 'producer_tee': {
            const p = findProducer(def, ref.producerDefId);
            const old = p.teeId;
            p.teeId = asString(newValue, 'producer_tee newValue');
            return old;
        }
        case 'producer_handicap_index': {
            const p = findProducer(def, ref.producerDefId);
            const old = p.handicapIndex;
            p.handicapIndex = asNumber(newValue, 'producer_handicap_index newValue');
            return old;
        }
        case 'producer_category': {
            const p = findProducer(def, ref.producerDefId);
            const old = p.category ?? null;
            p.category = newValue === null ? undefined : asString(newValue, 'producer_category newValue');
            return old;
        }
        case 'ball_composition': {
            const s = findStrategy(def, ref.strategyDefId);
            const old = s.composition ?? null;
            s.composition = newValue as BallStrategyDefinition['composition'];
            return old;
        }
        case 'ball_strategy_config': {
            const s = findStrategy(def, ref.strategyDefId);
            const old = { strategyId: s.strategyId, derivationConfig: s.derivationConfig };
            const nv = newValue as { strategyId?: string; derivationConfig?: BallStrategyDefinition['derivationConfig'] };
            if (nv.strategyId !== undefined) s.strategyId = nv.strategyId;
            if (nv.derivationConfig !== undefined) s.derivationConfig = nv.derivationConfig;
            return old;
        }
        case 'slot_declaration': {
            const s = findSlot(def, ref.slotDefId);
            const old: Partial<SlotDefinition> = {
                formatId: s.formatId,
                allowanceConfig: s.allowanceConfig,
                ...(s.teamGrouping ? { teamGrouping: s.teamGrouping } : {}),
                ...(s.ballSelector ? { ballSelector: s.ballSelector } : {}),
                ...(s.formatConfig !== undefined ? { formatConfig: s.formatConfig } : {}),
            };
            Object.assign(s, newValue as Partial<SlotDefinition>);
            return old;
        }
        case 'play_hole': {
            const ph = findPlayHole(def, ref.playHoleDefId);
            const old = {
                ...(ph.parOverride !== undefined ? { parOverride: ph.parOverride } : {}),
                ...(ph.baseStrokeIndexOverride !== undefined
                    ? { baseStrokeIndexOverride: ph.baseStrokeIndexOverride }
                    : {}),
                ...(ph.teeOverrides ? { teeOverrides: ph.teeOverrides } : {}),
            };
            const nv = newValue as {
                parOverride?: number;
                baseStrokeIndexOverride?: number;
                teeOverrides?: PlayHoleInput['teeOverrides'];
            };
            if (nv.parOverride !== undefined) ph.parOverride = nv.parOverride;
            if (nv.baseStrokeIndexOverride !== undefined) ph.baseStrokeIndexOverride = nv.baseStrokeIndexOverride;
            if (nv.teeOverrides !== undefined) ph.teeOverrides = nv.teeOverrides;
            return old;
        }
        case 'playing_group': {
            const g = findPlayingGroup(def, ref.playingGroupDefId);
            const old = {
                ...(g.startPlayHoleDefId !== undefined ? { startPlayHoleDefId: g.startPlayHoleDefId } : {}),
                ...(g.startOrdinal !== undefined ? { startOrdinal: g.startOrdinal } : {}),
                startTime: g.startTime,
                producerDefIds: [...g.producerDefIds],
            };
            const nv = newValue as {
                startPlayHoleDefId?: string;
                startOrdinal?: number;
                startTime?: string;
                producerDefIds?: string[];
            };
            if (nv.startPlayHoleDefId !== undefined) {
                g.startPlayHoleDefId = nv.startPlayHoleDefId;
                delete g.startOrdinal;
            }
            if (nv.startOrdinal !== undefined) {
                g.startOrdinal = nv.startOrdinal;
                delete g.startPlayHoleDefId;
            }
            if (nv.startTime !== undefined) g.startTime = nv.startTime;
            if (nv.producerDefIds !== undefined) g.producerDefIds = nv.producerDefIds;
            return old;
        }
        default: {
            const exhaustive: never = target;
            throw new Error(`unknown setup-correction target '${String(exhaustive)}'`);
        }
    }
}

function findProducer(def: RoundDefinitionInput, producerDefId: string | undefined): ProducerDefinition {
    const p = def.producers.find((x) => x.id === producerDefId);
    if (!p) throw new Error(`setup correction: no producer with def-id '${producerDefId}'`);
    return p;
}

function findStrategy(def: RoundDefinitionInput, strategyDefId: string | undefined): BallStrategyDefinition {
    const s = def.ballStrategies.find((x) => x.id === strategyDefId);
    if (!s) throw new Error(`setup correction: no ball strategy with def-id '${strategyDefId}'`);
    return s;
}

function findSlot(def: RoundDefinitionInput, slotDefId: string | undefined): SlotDefinition {
    const s = def.slots.find((x) => x.id === slotDefId);
    if (!s) throw new Error(`setup correction: no slot with def-id '${slotDefId}'`);
    return s;
}

function findPlayHole(def: RoundDefinitionInput, playHoleDefId: string | undefined): PlayHoleInput {
    const ph = def.playHoles?.find((x) => x.id === playHoleDefId);
    if (!ph) throw new Error(`setup correction: no play-hole with def-id '${playHoleDefId}'`);
    return ph;
}

function findPlayingGroup(def: RoundDefinitionInput, groupDefId: string | undefined): PlayingGroupInput {
    const g = def.playingGroups?.find((x) => x.id === groupDefId);
    if (!g) throw new Error(`setup correction: no playing group with def-id '${groupDefId}'`);
    return g;
}

function asString(v: unknown, ctx: string): string {
    if (typeof v !== 'string') throw new Error(`${ctx} must be a string`);
    return v;
}

function asNumber(v: unknown, ctx: string): number {
    if (typeof v !== 'number' || Number.isNaN(v)) throw new Error(`${ctx} must be a number`);
    return v;
}
