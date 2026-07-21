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
    isPlaceholderProducerDef,
    type BallStrategyDefinition,
    type FormatAllowanceConfig,
    type IdentityProducerDefinition,
    type PlayHoleInput,
    type PlayingGroupInput,
    type ProducerDefinition,
    type ResolvedRoundDefinition,
    type RoundDefinitionInput,
    type SlotDefinition,
} from '../domain/round-definition';
import { findFormatPlugin } from '../domain/formats/plugin';
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

export type RulingResult =
    | { ok: true; id: string }
    | { ok: false; diagnostics: CompilerDiagnostic[] };

/**
 * A correction's DOMAIN/USER input is wrong — an unknown target ref, a bad
 * value shape, a missing round. The service catches this and returns a
 * structured `{ ok:false, diagnostics }` so a client (e.g. mobile) can show the
 * message beside the offending control. A plain `Error` is reserved for true
 * drift/infrastructure failures (e.g. a definition slot with no persisted row),
 * which surface as a 500.
 */
class CorrectionInputError extends Error {
    constructor(
        readonly code: string,
        message: string,
        readonly path?: string,
    ) {
        super(message);
        this.name = 'CorrectionInputError';
    }
    toDiagnostic(): CompilerDiagnostic {
        return this.path === undefined
            ? { code: this.code, message: this.message }
            : { code: this.code, message: this.message, path: this.path };
    }
}

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

/**
 * A setup correction whose mutated definition the CALLER composed (Phase 3.5
 * self-join): the caller supplies the full new `RoundDefinitionInput` plus the
 * audit payload, and this service runs the SAME compile + one-transaction
 * persist as `applySetupCorrection`. Exists so multi-field compositions (add a
 * producer + extend a playing group) reuse the established recompile machinery
 * instead of growing a parallel path.
 */
export interface ComposedSetupCorrectionInput {
    roundId: string;
    target: SetupCorrectionTarget;
    targetRef: Record<string, string>;
    oldValue: unknown;
    newValue: unknown;
    reason: string;
    recordedBy?: string | null;
    clientEventId: string;
    /** The full mutated definition input to recompile from. */
    definition: RoundDefinitionInput;
    /**
     * Optional writes that must land ATOMICALLY with the correction event,
     * BEFORE the recompiled outputs are diff-persisted (Phase 3.5 leave-round:
     * the caller's own ball's `score_events`/`scorecards` rows are deleted
     * here, so the recompile's diff-delete of that ball passes the
     * `score_events.ball_id ON DELETE RESTRICT` FK). Runs inside the same
     * transaction, after the event row inserted; NOT invoked on an idempotent
     * replay (the dedup short-circuit returns before any write).
     */
    beforePersist?: (
        trx: Kysely<Database>,
        info: { eventId: string },
    ) => Promise<void>;
    /**
     * Optional extra writes that must land ATOMICALLY with the correction
     * event + recompiled outputs (Phase 3.5: the setup-edit / self-join paths
     * append the round's stored `RoundSetupDraft` version, and the edit path
     * syncs round-level metadata columns). Runs inside the same transaction,
     * after the recompile persisted; NOT invoked on an idempotent replay
     * (the dedup short-circuit returns before any write).
     */
    afterPersist?: (
        trx: Kysely<Database>,
        info: { eventId: string; version: number },
    ) => Promise<void>;
}

export class CorrectionService {
    constructor(
        private db: Kysely<Database>,
        private roundService: RoundService,
    ) {}

    // --- setup_correction_event ------------------------------------------------

    async applySetupCorrection(input: SetupCorrectionInput): Promise<CorrectionResult> {
        const existing = await this.dedupSetupCorrection(input.roundId, input.clientEventId);
        if (existing) return existing;

        const latest = await this.roundService.latestDefinition(input.roundId);
        if (!latest) {
            return {
                ok: false,
                diagnostics: [
                    { code: 'unknown_round', message: `round '${input.roundId}' has no compiled definition`, path: 'roundId' },
                ],
            };
        }

        const def = definitionInputFromResolved(latest.definition);
        let oldValue: unknown;
        try {
            oldValue = applySetupMutation(def, input.target, input.targetRef, input.newValue);
        } catch (err) {
            if (err instanceof CorrectionInputError) {
                return { ok: false, diagnostics: [err.toDiagnostic()] };
            }
            throw err;
        }

        return this.applyComposedSetupCorrection({
            roundId: input.roundId,
            target: input.target,
            targetRef: input.targetRef,
            oldValue,
            newValue: input.newValue,
            reason: input.reason,
            recordedBy: input.recordedBy ?? null,
            clientEventId: input.clientEventId,
            definition: def,
        });
    }

    /**
     * Compile a caller-composed definition and persist the correction event +
     * recompiled outputs in ONE transaction — the shared tail of every
     * setup-correction path (`applySetupCorrection` funnels through here; the
     * Phase 3.5 self-join composes its own definition and calls it directly).
     * Also advances the round's result cursor (`rounds.latest_event_id`) so
     * `?cursor=` result polling sees the recompiled result, WITHOUT touching
     * lifecycle status.
     */
    async applyComposedSetupCorrection(
        input: ComposedSetupCorrectionInput,
    ): Promise<CorrectionResult> {
        const existing = await this.dedupSetupCorrection(input.roundId, input.clientEventId);
        if (existing) return existing;

        const compiled = await this.roundService.compileDefinition(input.roundId, input.definition);
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
                    old_value: input.oldValue === undefined ? null : JSON.stringify(input.oldValue),
                    new_value: JSON.stringify(input.newValue),
                    reason: input.reason,
                    recorded_by_player_id: input.recordedBy ?? null,
                    client_event_id: input.clientEventId,
                })
                .execute();
            if (input.beforePersist) {
                await input.beforePersist(trx, { eventId });
            }
            const r = await persistCompiledRound(trx, compiled.compiled, {
                sourceKind: 'setup_correction',
                sourceEventId: eventId,
            });
            await trx
                .updateTable('setup_correction_events')
                .set({ result_version: r.version })
                .where('id', '=', eventId)
                .execute();
            await this.roundService.bumpResultCursor(input.roundId, eventId, trx);
            if (input.afterPersist) {
                await input.afterPersist(trx, { eventId, version: r.version });
            }
            return r.version;
        });

        return { ok: true, eventId, version };
    }

    /** Idempotency probe shared by the two setup-correction entry points. */
    private async dedupSetupCorrection(
        roundId: string,
        clientEventId: string,
    ): Promise<CorrectionResult | null> {
        const existing = await this.db
            .selectFrom('setup_correction_events')
            .where('round_id', '=', roundId)
            .where('client_event_id', '=', clientEventId)
            .select(['id', 'result_version'])
            .executeTakeFirst();
        if (!existing) return null;
        return { ok: true, eventId: existing.id, version: existing.result_version ?? 0 };
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
        if (!latest) {
            return {
                ok: false,
                diagnostics: [
                    { code: 'unknown_round', message: `round '${input.roundId}' has no compiled definition`, path: 'roundId' },
                ],
            };
        }

        const slotIdx = latest.definition.slots.findIndex((s) => s.id === input.slotDefId);
        if (slotIdx === -1) {
            return {
                ok: false,
                diagnostics: [
                    { code: 'unknown_slot', message: `round has no slot with def-id '${input.slotDefId}'`, path: 'slotDefId' },
                ],
            };
        }
        const slot = latest.definition.slots[slotIdx]!;
        const oldConfig = slot.allowanceConfig;

        // --- Fast path: ONLY this slot's allowance changed. -------------------
        // Re-derive just this slot's PHs via its plugin; ball creation, ball CH,
        // and every other slot stay untouched. The new definition version keeps
        // the override in the def chain so a later full recompile preserves it.
        const plugin = findFormatPlugin(slot.formatId);
        const slotRow = await this.db
            .selectFrom('slots')
            .where('round_id', '=', input.roundId)
            .where('slot_def_id', '=', input.slotDefId)
            .select('id')
            .executeTakeFirst();
        if (!slotRow) {
            throw new Error(`round ${input.roundId} has no persisted slot row for '${input.slotDefId}'`);
        }
        const slotBalls = await this.db
            .selectFrom('slot_balls as sb')
            .innerJoin('balls as b', 'b.id', 'sb.ball_id')
            .where('sb.slot_id', '=', slotRow.id)
            .select(['sb.ball_id', 'b.course_handicap_snapshot'])
            .execute();

        // Placeholder balls (Phase 5.5) have a NULL CH — no PH can derive, so
        // they are excluded here and their slot_balls PH row simply stays NULL
        // (the claim recompiles real snapshots in later).
        const derived = plugin.deriveSlotBalls({
            balls: slotBalls
                .filter((r) => r.course_handicap_snapshot !== null)
                .map((r) => ({
                    ballId: r.ball_id,
                    courseHandicapSnapshot: r.course_handicap_snapshot!,
                })),
            allowanceConfig: input.newConfig,
        });

        // New resolved definition: only this slot's allowanceConfig changes.
        const newDef: ResolvedRoundDefinition = {
            ...latest.definition,
            slots: latest.definition.slots.map((s, i) =>
                i === slotIdx ? { ...s, allowanceConfig: input.newConfig } : s,
            ),
        };
        const newDefJson = JSON.stringify(newDef);

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
            const v = await this.roundService.appendDefinitionVersion(
                trx,
                input.roundId,
                newDefJson,
                'allowance_override',
                eventId,
            );
            for (const d of derived) {
                await trx
                    .updateTable('slot_balls')
                    .set({ playing_handicap_snapshot: d.playingHandicapSnapshot })
                    .where('slot_id', '=', slotRow.id)
                    .where('ball_id', '=', d.ballId)
                    .execute();
            }
            await trx
                .updateTable('allowance_override_events')
                .set({ result_version: v })
                .where('id', '=', eventId)
                .execute();
            // Allowance changes reshape PHs → results; move the polling cursor.
            await this.roundService.bumpResultCursor(input.roundId, eventId, trx);
            return v;
        });

        return { ok: true, eventId, version };
    }

    // --- ruling_event ----------------------------------------------------------

    async applyRuling(input: RulingInput): Promise<RulingResult> {
        const existing = await this.db
            .selectFrom('ruling_events')
            .where('round_id', '=', input.roundId)
            .where('client_event_id', '=', input.clientEventId)
            .select('id')
            .executeTakeFirst();
        if (existing) return { ok: true, id: existing.id };

        // Validate the target ref. `target_id` encodes a ball (and, for
        // `ball_hole`, an occurrence). A ref that doesn't belong to this round is
        // USER input error → structured diagnostic, not a silently-inert row.
        const refDiag = await this.validateRulingTarget(input);
        if (refDiag) return { ok: false, diagnostics: [refDiag] };

        const id = crypto.randomUUID();
        await this.db.transaction().execute(async (trx) => {
            await trx
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
            // Rulings are read at score() time → they change results; move the
            // polling cursor in the same transaction as the append.
            await this.roundService.bumpResultCursor(input.roundId, id, trx);
        });
        return { ok: true, id };
    }

    /**
     * Validate a ruling's target ref against the round. Returns a structured
     * diagnostic for a bad ref (unparsable id, or a ball/occurrence that isn't in
     * this round), or `null` when the ref is sound. Mirrors the `target_id`
     * encoding in `strategies/rulings.ts`:
     *   ball_total       → `${ballId}`
     *   ball_hole        → `${ballId}:${playHoleId}`
     *   slot_ball_result → `${slotDefId}:${ballId}`
     */
    private async validateRulingTarget(input: RulingInput): Promise<CompilerDiagnostic | null> {
        let ballId: string;
        let playHoleId: string | null = null;
        if (input.target === 'ball_total') {
            ballId = input.targetId;
        } else if (input.target === 'ball_hole') {
            const idx = input.targetId.indexOf(':');
            if (idx < 0) {
                return { code: 'invalid_target_id', message: `ball_hole target_id must be '<ballId>:<playHoleId>'`, path: 'targetId' };
            }
            ballId = input.targetId.slice(0, idx);
            playHoleId = input.targetId.slice(idx + 1);
        } else {
            // slot_ball_result → `${slotDefId}:${ballId}`
            const idx = input.targetId.indexOf(':');
            if (idx < 0) {
                return { code: 'invalid_target_id', message: `slot_ball_result target_id must be '<slotDefId>:<ballId>'`, path: 'targetId' };
            }
            ballId = input.targetId.slice(idx + 1);
        }

        const ball = await this.db
            .selectFrom('balls')
            .where('id', '=', ballId)
            .where('round_id', '=', input.roundId)
            .select('id')
            .executeTakeFirst();
        if (!ball) {
            return { code: 'unknown_target_ball', message: `ball '${ballId}' is not in round '${input.roundId}'`, path: 'targetId' };
        }
        if (playHoleId !== null) {
            const ph = await this.db
                .selectFrom('round_play_holes')
                .where('id', '=', playHoleId)
                .where('round_id', '=', input.roundId)
                .select('id')
                .executeTakeFirst();
            if (!ph) {
                return { code: 'unknown_target_play_hole', message: `play-hole '${playHoleId}' is not in round '${input.roundId}'`, path: 'targetId' };
            }
        }
        return null;
    }
}

// --- Setup-correction mutation -------------------------------------------------
//
// Mutates the loose definition IN PLACE by stable def-id; returns the prior
// value for the event's `old_value` audit. An unknown target ref or a bad value
// shape is USER input error — these throw `CorrectionInputError`, which
// `applySetupCorrection` turns into a structured `{ ok:false, diagnostics }`.

function applySetupMutation(
    def: RoundDefinitionInput,
    target: SetupCorrectionTarget,
    ref: Record<string, string>,
    newValue: unknown,
): unknown {
    switch (target) {
        case 'producer_tee': {
            const p = requireIdentityProducer(findProducer(def, ref.producerDefId), 'producer_tee');
            const old = p.teeId;
            p.teeId = asString(newValue, 'producer_tee newValue');
            return old;
        }
        case 'producer_handicap_index': {
            const p = requireIdentityProducer(
                findProducer(def, ref.producerDefId),
                'producer_handicap_index',
            );
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
        case 'setup_draft':
        case 'producer_identity': {
            // Composed-only targets: whole-document wizard edits come from
            // RoundEditService; seat claim/rebind/release (Phase 5.5) from
            // SeatClaimService. Both compose the full definition themselves
            // and persist via `applyComposedSetupCorrection` — there is no
            // per-field mutation to apply here.
            throw new CorrectionInputError(
                'unsupported_target',
                `target '${target}' is written by its composing service, not the field-level correction API`,
                'target',
            );
        }
        default: {
            const exhaustive: never = target;
            throw new Error(`unknown setup-correction target '${String(exhaustive)}'`);
        }
    }
}

function findProducer(def: RoundDefinitionInput, producerDefId: string | undefined): ProducerDefinition {
    const p = def.producers.find((x) => x.id === producerDefId);
    if (!p) throw new CorrectionInputError('unknown_producer', `no producer with def-id '${producerDefId}'`, 'targetRef.producerDefId');
    return p;
}

/**
 * Tee/handicap corrections only make sense on an identity-bound producer — a
 * placeholder seat (Phase 5.5) has no chain until it is claimed, and the claim
 * op (Slice 3) is the ONLY path that binds one.
 */
function requireIdentityProducer(
    p: ProducerDefinition,
    target: string,
): IdentityProducerDefinition {
    if (isPlaceholderProducerDef(p)) {
        throw new CorrectionInputError(
            'producer_is_placeholder',
            `'${target}' cannot apply to placeholder seat '${p.id}' — claim the seat first`,
            'targetRef.producerDefId',
        );
    }
    return p;
}

function findStrategy(def: RoundDefinitionInput, strategyDefId: string | undefined): BallStrategyDefinition {
    const s = def.ballStrategies.find((x) => x.id === strategyDefId);
    if (!s) throw new CorrectionInputError('unknown_ball_strategy', `no ball strategy with def-id '${strategyDefId}'`, 'targetRef.strategyDefId');
    return s;
}

function findSlot(def: RoundDefinitionInput, slotDefId: string | undefined): SlotDefinition {
    const s = def.slots.find((x) => x.id === slotDefId);
    if (!s) throw new CorrectionInputError('unknown_slot', `no slot with def-id '${slotDefId}'`, 'targetRef.slotDefId');
    return s;
}

function findPlayHole(def: RoundDefinitionInput, playHoleDefId: string | undefined): PlayHoleInput {
    const ph = def.playHoles?.find((x) => x.id === playHoleDefId);
    if (!ph) throw new CorrectionInputError('unknown_play_hole', `no play-hole with def-id '${playHoleDefId}'`, 'targetRef.playHoleDefId');
    return ph;
}

function findPlayingGroup(def: RoundDefinitionInput, groupDefId: string | undefined): PlayingGroupInput {
    const g = def.playingGroups?.find((x) => x.id === groupDefId);
    if (!g) throw new CorrectionInputError('unknown_playing_group', `no playing group with def-id '${groupDefId}'`, 'targetRef.playingGroupDefId');
    return g;
}

function asString(v: unknown, ctx: string): string {
    if (typeof v !== 'string') throw new CorrectionInputError('invalid_value', `${ctx} must be a string`, 'newValue');
    return v;
}

function asNumber(v: unknown, ctx: string): number {
    if (typeof v !== 'number' || Number.isNaN(v)) throw new CorrectionInputError('invalid_value', `${ctx} must be a number`, 'newValue');
    return v;
}
