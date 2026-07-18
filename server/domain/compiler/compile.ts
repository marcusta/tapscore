// Phase 2.6b/3a — pure RoundCompiler.
//
// `compile(input)` turns a `RoundDefinition` plus external context
// (course holes, tees, player profiles) into a `CompiledRound` value —
// every row exactly as it will land in the new tables. No DB access here;
// persistence is a separate concern (persist.ts).
//
// Pipeline:
//   1. Resolve producers (tee + gender + CH). Per-producer CH uses the
//      producer's gender to pick the tee rating row; unknown gender on a
//      producer with no default → diagnostic.
//   2. Run each ball-creation strategy to produce `CreatedBall[]`.
//   3. Dedupe balls across strategy INSTANCES where the strategy declares
//      `allowsProducerSetDedupe=true` — same producer set on two own-ball
//      strategies still collapses to one ball row (ball id is
//      content-addressed and collides on purpose).
//   4. For each slot: find format, resolve ballSelector → slot's balls,
//      validate ballRequirement, derive PH via format.deriveSlotBalls.
//   5. Emit slot_ball_teams rows for slots declaring teamGrouping.
//
// Diagnostics are accumulated throughout. On first failure set
// `ok: false` and return the full list — caller may render all errors
// at once, never half-persist.

import { hashId, sortProducerSet, type ProducerRef } from '../deterministic-id';
import { courseHandicap } from '../handicap';
import { normalize } from './normalize';
import {
    isPlaceholderProducerDef,
    type BallStrategyDefinition,
    type IdentityProducerDefinition,
    type ProducerDefinition,
    type ResolvedRoundDefinition,
    type RoundDefinition,
    type SlotDefinition,
} from '../round-definition';
import {
    findBallCreationStrategy,
    type BallCreationStrategy,
} from '../strategies/ball-creation-strategy';
import { findFormatPlugin } from '../formats/plugin';
import type { FormatBallRequirement } from '../strategies/format-strategy';
import { readHoleSegments, validateHoleSegments } from './hole-segments';
import type {
    BallCreationProducerInput,
    CreatedBall,
    RoundTeeHoleSnapshot,
    TeeSnapshot,
} from '../strategies/types';
import type {
    CompiledBall,
    CompiledBallPlayer,
    CompiledPlayHole,
    CompiledPlayingGroup,
    CompiledPlayingGroupBall,
    CompiledPlayTeeHole,
    CompiledRound,
    CompiledSlot,
    CompiledSlotBall,
    CompiledSlotBallTeam,
    CompiledStrategy,
    CompileResult,
    CompilerDiagnostic,
    CompilerInput,
    CompilerTeeContext,
    Gender,
} from './types';

interface ResolvedProducer {
    def: ProducerDefinition;
    /** True for a placeholder seat (Phase 5.5): no identity, no tee, no CH. */
    placeholder: boolean;
    /** Null for a placeholder seat. */
    tee: TeeSnapshot | null;
    teeHoles: RoundTeeHoleSnapshot[];
    teeId: string | null;
    /** The seat LABEL for a placeholder; the profile display name otherwise. */
    displayName: string;
    gender: Gender | null;
    category: string | null;
    /** Null for a placeholder seat — captured at claim time, never invented. */
    courseHandicap: number | null;
}

interface StrategyResolved {
    def: BallStrategyDefinition;
    impl: BallCreationStrategy;
    row: CompiledStrategy;
    balls: ResolvedBall[];
}

interface ResolvedBall {
    row: CompiledBall;
    producerDefIds: string[];
    /** `ch` is null for a placeholder member (no chain until claim). */
    perProducerCh: { producerDefId: string; ch: number | null }[];
    /** True iff any covering producer is an unclaimed placeholder seat. */
    pending: boolean;
}

export function compile(input: CompilerInput): CompileResult {
    const diags: CompilerDiagnostic[] = [];

    // Step 0 — normalize the loose authoring input into the fully-explicit
    // ResolvedRoundDefinition exactly once. Everything downstream operates on
    // the resolved def; it is also what gets persisted as definition_json.
    const norm = normalize(input);
    if (!norm.ok) return { ok: false, diagnostics: norm.diagnostics };
    const resolved = norm.resolved;
    const rinput: CompilerInput = { ...input, definition: resolved };

    // Itinerary occurrences + per-tee occurrence snapshots. Independent of
    // balls; structural diagnostics (missing tee hole) accumulate here.
    const { playHoles, playTeeHoles } = buildItinerary(input.roundId, resolved, input.tees, diags);
    if (diags.length > 0) return { ok: false, diagnostics: diags };

    const producers = resolveProducers(rinput, diags);
    if (diags.length > 0) return { ok: false, diagnostics: diags };

    const strategies = resolveStrategies(rinput, producers, diags);
    if (diags.length > 0) return { ok: false, diagnostics: diags };

    // Dedupe balls across strategies where allowed. Ball id is content-
    // addressed so two own-ball strategies sharing a producer produce
    // the same id; we collapse to one row + keep first perProducerCh.
    const ballById = new Map<string, ResolvedBall>();
    for (const s of strategies) {
        for (const b of s.balls) {
            const existing = ballById.get(b.row.id);
            if (!existing) ballById.set(b.row.id, b);
            else if (!s.impl.allowsProducerSetDedupe()) {
                diags.push({
                    code: 'ball_id_collision',
                    message: `two balls produced with id ${b.row.id} but strategy '${s.def.strategyId}' disallows dedupe`,
                });
            }
        }
    }
    if (diags.length > 0) return { ok: false, diagnostics: diags };

    const allBalls = [...ballById.values()];

    const slots: CompiledSlot[] = [];
    const slotBalls: CompiledSlotBall[] = [];
    const slotBallTeams: CompiledSlotBallTeam[] = [];

    const slotCtx: SlotCompileContext = {
        strategyDefIds: new Set(strategies.map((s) => s.def.id)),
        producerDefIds: new Set(resolved.producers.map((p) => p.id)),
        playHoleCount: playHoles.length,
        courseHoleNumbers: new Set(playHoles.map((ph) => ph.courseHoleNumber)),
    };
    for (const slotDef of resolved.slots) {
        compileSlot(slotDef, rinput, strategies, allBalls, slotCtx, slots, slotBalls, slotBallTeams, diags);
    }
    if (diags.length > 0) return { ok: false, diagnostics: diags };

    // Invariant: a persisted ball is scored by ≥1 slot. Ball-creation strategies
    // are global — `own_ball_per_player` mints a ball for EVERY producer, even
    // ones no format scores individually (ADR-0003 narrows per-slot via
    // `ballSelector`, not at creation). Those unscored balls must not survive:
    // otherwise the Score view (which lists every persisted ball, no slot filter)
    // shows a player who appears in no format. `slot_balls` is the authoritative
    // scored set — derived one-for-one from each slot's selected balls — and
    // `slot_ball_teams` balls are a subset of it, so it alone defines the keep set.
    const scoredBallIds = new Set(slotBalls.map((sb) => sb.ballId));
    const balls = allBalls.filter((b) => scoredBallIds.has(b.row.id));

    const ballPlayers = buildBallPlayers(balls, producers, diags);
    if (diags.length > 0) return { ok: false, diagnostics: diags };

    const { playingGroups, playingGroupBalls } = compilePlayingGroups(
        input.roundId,
        resolved,
        balls,
        diags,
    );
    if (diags.length > 0) return { ok: false, diagnostics: diags };

    const compiled: CompiledRound = {
        roundId: input.roundId,
        definitionJson: JSON.stringify(resolved),
        definitionVersion: 1,
        strategies: strategies.map((s) => s.row),
        balls: balls.map((b) => b.row),
        ballPlayers,
        slots,
        slotBalls,
        slotBallTeams,
        playHoles,
        playTeeHoles,
        playingGroups,
        playingGroupBalls,
    };
    return { ok: true, compiled };
}

// --- Itinerary --------------------------------------------------------------

/**
 * Build `round_play_holes` + per-tee occurrence snapshots from the resolved
 * itinerary. The runtime id is content-addressed on the stable def-id, so a
 * reorder (which only changes `ordinal`) keeps every id — events stay valid.
 * Per-occurrence tee length/SI come from the producer tees, with route
 * `teeOverrides` winning over the frozen `round_tee_holes` snapshot.
 */
function buildItinerary(
    roundId: string,
    resolved: ResolvedRoundDefinition,
    tees: Map<string, CompilerTeeContext>,
    diags: CompilerDiagnostic[],
): { playHoles: CompiledPlayHole[]; playTeeHoles: CompiledPlayTeeHole[] } {
    const playHoles: CompiledPlayHole[] = [];
    const playTeeHoles: CompiledPlayTeeHole[] = [];

    resolved.playHoles.forEach((ph, i) => {
        const id = hashId('tapscore:round_play_hole:v1', roundId, ph.id);
        playHoles.push({
            id,
            playHoleDefId: ph.id,
            ordinal: i + 1,
            courseHoleNumber: ph.courseHoleNumber,
            par: ph.par,
            baseStrokeIndex: ph.baseStrokeIndex,
        });

        for (const [teeId, teeCtx] of tees) {
            const override = ph.teeOverrides?.find((o) => o.teeId === teeId);
            const teeHole = teeCtx.holes.find((h) => h.holeNumber === ph.courseHoleNumber);
            const lengthM = override?.lengthM ?? teeHole?.lengthM;
            // Length is per-occurrence display data. A tee with no length row
            // for this hole (minimal fixtures, partially-entered courses)
            // simply contributes no occurrence-tee snapshot — SI still falls
            // back to the occurrence base SI. Not a compile error.
            if (lengthM === undefined) continue;
            playTeeHoles.push({
                roundPlayHoleId: id,
                teeRef: teeId,
                teeNameSnapshot: teeCtx.teeName,
                teeId,
                lengthM,
                strokeIndexOverride:
                    override?.strokeIndexOverride ?? teeHole?.strokeIndexOverride ?? null,
            });
        }
    });

    return { playHoles, playTeeHoles };
}

// --- Playing groups ---------------------------------------------------------

/**
 * Resolve playing-group ball membership. Producers partition into groups
 * (every producer in EXACTLY one group); a ball belongs to the single group
 * its producers share. A team ball whose producers span groups, or any
 * producer left unassigned / double-assigned, is a hard diagnostic.
 */
function compilePlayingGroups(
    roundId: string,
    resolved: ResolvedRoundDefinition,
    allBalls: ResolvedBall[],
    diags: CompilerDiagnostic[],
): { playingGroups: CompiledPlayingGroup[]; playingGroupBalls: CompiledPlayingGroupBall[] } {
    const producerToGroupDef = new Map<string, string>();
    for (const g of resolved.playingGroups) {
        for (const pid of g.producerDefIds) {
            const prior = producerToGroupDef.get(pid);
            if (prior !== undefined) {
                diags.push({
                    code: 'producer_in_multiple_groups',
                    message: `producer '${pid}' is assigned to groups '${prior}' and '${g.id}'`,
                    path: `playingGroups`,
                });
            } else {
                producerToGroupDef.set(pid, g.id);
            }
        }
    }
    for (const p of resolved.producers) {
        if (!producerToGroupDef.has(p.id)) {
            diags.push({
                code: 'producer_not_in_any_group',
                message: `producer '${p.id}' is not assigned to any playing group`,
                path: `playingGroups`,
            });
        }
    }

    const playingGroups: CompiledPlayingGroup[] = resolved.playingGroups.map((g) => ({
        id: hashId('tapscore:playing_group:v1', roundId, g.id),
        groupDefId: g.id,
        startTime: g.startTime,
        startPlayHoleId: hashId('tapscore:round_play_hole:v1', roundId, g.startPlayHoleDefId),
        capacity: g.capacity,
        hittingBay: g.hittingBay ?? null,
    }));
    const groupRuntimeIdByDef = new Map(playingGroups.map((g) => [g.groupDefId, g.id]));

    const playingGroupBalls: CompiledPlayingGroupBall[] = [];
    for (const b of allBalls) {
        const groupDefs = new Set(
            b.producerDefIds.map((pid) => producerToGroupDef.get(pid)),
        );
        if (groupDefs.has(undefined)) {
            // The offending producer is already diagnosed above; skip.
            continue;
        }
        if (groupDefs.size > 1) {
            diags.push({
                code: 'team_ball_crosses_playing_groups',
                message: `ball ${b.row.id} has producers across multiple playing groups (${[...groupDefs].join(', ')})`,
            });
            continue;
        }
        if (groupDefs.size === 0) {
            diags.push({
                code: 'ball_not_assigned_to_group',
                message: `ball ${b.row.id} could not be assigned to a playing group`,
            });
            continue;
        }
        const groupDef = [...groupDefs][0] as string;
        const groupId = groupRuntimeIdByDef.get(groupDef);
        if (groupId === undefined) continue;
        playingGroupBalls.push({ playingGroupId: groupId, ballId: b.row.id });
    }

    return { playingGroups, playingGroupBalls };
}

function resolveProducers(
    input: CompilerInput,
    diags: CompilerDiagnostic[],
): Map<string, ResolvedProducer> {
    const out = new Map<string, ResolvedProducer>();
    const seenIds = new Set<string>();
    for (let i = 0; i < input.definition.producers.length; i++) {
        const def = input.definition.producers[i];
        if (seenIds.has(def.id)) {
            diags.push({
                code: 'duplicate_producer_def_id',
                message: `producer def id '${def.id}' appears twice`,
                path: `producers[${i}]`,
            });
            continue;
        }
        seenIds.add(def.id);

        // Placeholder seat (Phase 5.5): no profile, no tee, no handicap chain.
        // The seat LABEL stands in for the display name; every snapshot that
        // would come from identity/tee stays null until the claim recompiles.
        if (isPlaceholderProducerDef(def)) {
            out.set(def.id, {
                def,
                placeholder: true,
                tee: null,
                teeHoles: [],
                teeId: null,
                displayName: def.placeholder.label,
                gender: null,
                category: def.category ?? null,
                courseHandicap: null,
            });
            continue;
        }

        const teeCtx = input.tees.get(def.teeId);
        if (!teeCtx) {
            diags.push({
                code: 'unknown_tee',
                message: `producer '${def.id}' references unknown teeId '${def.teeId}'`,
                path: `producers[${i}].teeId`,
            });
            continue;
        }

        const profile = resolveProfile(def, input);
        if (!profile) {
            diags.push({
                code: 'unknown_player',
                message: `producer '${def.id}' references unknown ${def.playerRef.kind} '${def.playerRef.id}'`,
                path: `producers[${i}].playerRef`,
            });
            continue;
        }

        const gender: Gender | null = def.gender ?? profile.gender ?? null;
        if (!gender) {
            diags.push({
                code: 'missing_gender',
                message: `producer '${def.id}' has no gender and profile has no default`,
                path: `producers[${i}].gender`,
            });
            continue;
        }

        const rating = teeCtx.ratings.get(gender);
        if (!rating) {
            diags.push({
                code: 'tee_missing_gender_rating',
                message: `tee '${def.teeId}' has no '${gender}' rating row`,
                path: `producers[${i}].teeId`,
            });
            continue;
        }

        const ch = courseHandicap({
            handicapIndex: def.handicapIndex,
            slope: rating.slope,
            courseRating: rating.courseRating,
            par: rating.teePar,
        });

        out.set(def.id, {
            def,
            placeholder: false,
            tee: {
                teeId: def.teeId,
                teeName: teeCtx.teeName,
                courseRating: rating.courseRating,
                slope: rating.slope,
                teePar: rating.teePar,
            },
            teeHoles: teeCtx.holes,
            teeId: def.teeId,
            displayName: profile.displayName,
            gender,
            category: def.category ?? profile.category ?? null,
            courseHandicap: ch,
        });
    }
    return out;
}

function resolveProfile(
    def: IdentityProducerDefinition,
    input: CompilerInput,
): { displayName: string; gender?: Gender; category?: string } | null {
    if (def.playerRef.kind === 'player') {
        return input.playerProfiles.get(def.playerRef.id) ?? null;
    }
    return input.guestProfiles.get(def.playerRef.id) ?? null;
}

function resolveStrategies(
    input: CompilerInput,
    producers: Map<string, ResolvedProducer>,
    diags: CompilerDiagnostic[],
): StrategyResolved[] {
    const out: StrategyResolved[] = [];
    const seenDefIds = new Set<string>();

    for (let i = 0; i < input.definition.ballStrategies.length; i++) {
        const def = input.definition.ballStrategies[i];
        if (seenDefIds.has(def.id)) {
            diags.push({
                code: 'duplicate_strategy_def_id',
                message: `ball strategy def id '${def.id}' appears twice`,
                path: `ballStrategies[${i}]`,
            });
            continue;
        }
        seenDefIds.add(def.id);

        let impl: BallCreationStrategy;
        try {
            impl = findBallCreationStrategy(def.strategyId);
        } catch {
            diags.push({
                code: 'unknown_ball_creation_strategy',
                message: `no ball-creation strategy registered for id '${def.strategyId}'`,
                path: `ballStrategies[${i}].strategyId`,
            });
            continue;
        }

        const req = impl.compositionRequirement();
        if (req.requiresTeams && !def.composition) {
            diags.push({
                code: 'missing_composition',
                message: `strategy '${def.strategyId}' requires composition.teams`,
                path: `ballStrategies[${i}].composition`,
            });
            continue;
        }

        const producerInputs: BallCreationProducerInput[] = [];
        const producerIds = collectStrategyProducers(def, producers);
        for (const pid of producerIds) {
            const rp = producers.get(pid);
            if (!rp) {
                diags.push({
                    code: 'unknown_producer_in_strategy',
                    message: `strategy '${def.id}' references unknown producer '${pid}'`,
                    path: `ballStrategies[${i}]`,
                });
                continue;
            }
            producerInputs.push(toBallCreationInput(rp));
        }
        if (diags.some((d) => d.path?.startsWith(`ballStrategies[${i}]`))) continue;

        let created;
        try {
            created = impl.create({
                producers: producerInputs,
                composition: def.composition,
                courseHoles: input.courseHoles,
                derivationConfig: def.derivationConfig,
            });
        } catch (e) {
            diags.push({
                code: 'ball_creation_failed',
                message: `strategy '${def.id}' create() threw: ${(e as Error).message}`,
                path: `ballStrategies[${i}]`,
            });
            continue;
        }

        const strategyRowId = hashId(
            'tapscore:round_ball_strategy:v1',
            input.roundId,
            def.id,
        );
        const row: CompiledStrategy = {
            id: strategyRowId,
            strategyId: def.strategyId,
            strategyDefId: def.id,
            derivationConfigJson: JSON.stringify(def.derivationConfig),
            compositionJson: def.composition ? JSON.stringify(def.composition) : null,
        };

        const balls = created.balls.map((cb) => createdBallToResolved(cb, row, input.roundId, def.id, producers));
        out.push({ def, impl, row, balls });
    }
    return out;
}

/**
 * The producer ref that keys a ball's content-addressed id. A placeholder seat
 * keys on its stable producer def-id under the 'placeholder' kind — see the
 * `ProducerRef` note in deterministic-id.ts for the claim-time id-change rule.
 */
function producerRefOf(rp: ResolvedProducer): ProducerRef {
    if (rp.placeholder) return { kind: 'placeholder', id: rp.def.id };
    const identity = rp.def as IdentityProducerDefinition;
    return { kind: identity.playerRef.kind, id: identity.playerRef.id };
}

/**
 * Ball-creation input for one resolved producer. A placeholder seat feeds the
 * strategy a POISONED input — NaN handicap values and a hollow tee — so the
 * strategy's grouping logic (own balls, team balls, hybrid passes) runs
 * unchanged while any CH arithmetic that touches the seat degrades to NaN.
 * `sanitizePlaceholderBalls` then replaces every NaN-tainted derived CH with
 * an honest NULL before anything persists; the strategies never learn about
 * placeholders and no invented handicap survives.
 */
function toBallCreationInput(rp: ResolvedProducer): BallCreationProducerInput {
    if (rp.placeholder) {
        return {
            playerRef: { kind: 'placeholder', id: rp.def.id },
            producerDefId: rp.def.id,
            handicapIndex: Number.NaN,
            gender: undefined,
            tee: { teeId: '', teeName: '', courseRating: Number.NaN, slope: Number.NaN, teePar: Number.NaN },
            teeHoles: [],
            courseHandicap: Number.NaN,
        };
    }
    const identity = rp.def as IdentityProducerDefinition;
    return {
        playerRef: identity.playerRef,
        producerDefId: rp.def.id,
        handicapIndex: identity.handicapIndex,
        gender: rp.gender ?? undefined,
        tee: rp.tee!,
        teeHoles: rp.teeHoles,
        courseHandicap: rp.courseHandicap!,
    };
}

/** Producers a strategy references — composition.teams if present, else all. */
function collectStrategyProducers(
    def: BallStrategyDefinition,
    producers: Map<string, ResolvedProducer>,
): string[] {
    if (def.composition) {
        return def.composition.teams.flatMap((t) => t.producerDefIds);
    }
    return [...producers.keys()];
}

function createdBallToResolved(
    cb: CreatedBall,
    strategyRow: CompiledStrategy,
    roundId: string,
    strategyDefId: string,
    producers: Map<string, ResolvedProducer>,
): ResolvedBall {
    const resolvedMembers = cb.producerDefIds.map((pid) => {
        const rp = producers.get(pid);
        if (!rp) throw new Error(`compile: producer '${pid}' missing after validation`);
        return rp;
    });
    const refs: ProducerRef[] = resolvedMembers.map(producerRefOf);
    const sortedKeys = sortProducerSet(refs);
    const ballId = hashId('tapscore:ball:v1', roundId, strategyDefId, ...sortedKeys);
    // Populate `balls.label` (§17 option 3a): fall back to a display-name
    // join when the strategy didn't already set one (own-ball doesn't; pair
    // strategies like alt-shot do). Single producer → their display name;
    // multi-producer → "Name1 & Name2 & ...". A placeholder seat's
    // displayName IS its label, so seats surface it here automatically.
    let derivedLabel: string | null = cb.label ?? null;
    if (derivedLabel === null) {
        const names = cb.producerDefIds
            .map((pid) => producers.get(pid)?.displayName)
            .filter((n): n is string => typeof n === 'string');
        derivedLabel = names.length > 0 ? names.join(' & ') : null;
    }
    // Placeholder sanitation (Phase 5.5): a ball covering an unclaimed seat has
    // no derivable handicap chain. The strategy ran with a NaN-poisoned CH for
    // the seat; replace the tainted derived CH with an honest NULL and rebuild
    // the per-producer audit from the resolved producers (identity members keep
    // their real CH, seats carry null). No NaN and no invented number persists.
    const pending = resolvedMembers.some((rp) => rp.placeholder);
    const perProducerCh: { producerDefId: string; ch: number | null }[] = pending
        ? resolvedMembers.map((rp) => ({ producerDefId: rp.def.id, ch: rp.courseHandicap }))
        : cb.perProducerCh;
    return {
        row: {
            id: ballId,
            roundBallStrategyId: strategyRow.id,
            label: derivedLabel,
            courseHandicapSnapshot: pending ? null : cb.courseHandicapSnapshot,
            perProducerChJson: JSON.stringify(perProducerCh),
        },
        producerDefIds: [...cb.producerDefIds],
        perProducerCh,
        pending,
    };
}

function buildBallPlayers(
    balls: ResolvedBall[],
    producers: Map<string, ResolvedProducer>,
    _diags: CompilerDiagnostic[],
): CompiledBallPlayer[] {
    const out: CompiledBallPlayer[] = [];
    for (const b of balls) {
        for (const ppc of b.perProducerCh) {
            const rp = producers.get(ppc.producerDefId);
            if (!rp) throw new Error(`compile: producer '${ppc.producerDefId}' missing for ball ${b.row.id}`);
            if (rp.placeholder) {
                // Unclaimed seat: BOTH identity FKs null (the pending signal),
                // the seat label as the display-name snapshot, and a NULL
                // handicap/tee chain — captured at claim time, never invented.
                out.push({
                    ballId: b.row.id,
                    producerDefId: ppc.producerDefId,
                    playerId: null,
                    guestPlayerId: null,
                    displayNameSnapshot: rp.displayName,
                    handicapIndexSnapshot: null,
                    categorySnapshot: rp.category,
                    genderSnapshot: null,
                    teeId: null,
                    teeNameSnapshot: null,
                    courseRatingSnapshot: null,
                    slopeSnapshot: null,
                    teeParSnapshot: null,
                    courseHandicapSnapshot: null,
                });
                continue;
            }
            const identity = rp.def as IdentityProducerDefinition;
            out.push({
                ballId: b.row.id,
                producerDefId: ppc.producerDefId,
                playerId: identity.playerRef.kind === 'player' ? identity.playerRef.id : null,
                guestPlayerId: identity.playerRef.kind === 'guest' ? identity.playerRef.id : null,
                displayNameSnapshot: rp.displayName,
                handicapIndexSnapshot: identity.handicapIndex,
                categorySnapshot: rp.category,
                genderSnapshot: rp.gender,
                teeId: rp.teeId,
                teeNameSnapshot: rp.tee!.teeName,
                courseRatingSnapshot: rp.tee!.courseRating,
                slopeSnapshot: rp.tee!.slope,
                teeParSnapshot: rp.tee!.teePar,
                courseHandicapSnapshot: ppc.ch,
            });
        }
    }
    return out;
}

/** Per-round context the slot validators close over (built once in compile). */
interface SlotCompileContext {
    /** Every resolved ball-strategy def-id — selector references are checked against this. */
    strategyDefIds: Set<string>;
    /** Every producer def-id — selector references are checked against this. */
    producerDefIds: Set<string>;
    /** Itinerary occurrence count — the ordinal ceiling for hole-segment schedules. */
    playHoleCount: number;
    /** Distinct course-hole numbers in the itinerary — ceiling for physical-coordinate schedules. */
    courseHoleNumbers: Set<number>;
}

/** Resolved balls grouped per team label, reused for slot_ball_teams emission. */
interface TeamBallResolution {
    teamLabel: string;
    balls: ResolvedBall[];
}

function compileSlot(
    slotDef: SlotDefinition,
    input: CompilerInput,
    strategies: StrategyResolved[],
    allBalls: ResolvedBall[],
    ctx: SlotCompileContext,
    slots: CompiledSlot[],
    slotBalls: CompiledSlotBall[],
    slotBallTeams: CompiledSlotBallTeam[],
    diags: CompilerDiagnostic[],
): void {
    const slotPath = `slots[${slotDef.id}]`;
    const hasSlotDiag = () => diags.some((d) => d.path?.startsWith(slotPath));

    let plugin;
    try {
        plugin = findFormatPlugin(slotDef.formatId);
    } catch {
        diags.push({
            code: 'unknown_format',
            message: `no format plugin registered for id '${slotDef.formatId}'`,
            path: `${slotPath}.formatId`,
        });
        return;
    }
    const format = {
        id: plugin.descriptor.id,
        ballRequirement: () => plugin.descriptor.requirements.balls,
        deriveSlotBalls: plugin.deriveSlotBalls.bind(plugin),
    };

    const req = format.ballRequirement();

    // --- Format-config schema (plugin-owned) ------------------------------
    // The plugin is the authority on its own config; surface its structured
    // diagnostics at compile time so invalid config stops here, not in score().
    for (const cd of plugin.validateConfig(slotDef.formatConfig)) {
        diags.push({
            code: cd.code,
            message: `slot '${slotDef.id}': ${cd.message}`,
            path: `${slotPath}.${cd.path ?? 'formatConfig'}`,
        });
    }

    // --- Topology ----------------------------------------------------------
    // Only `static` team topology compiles today. A format declaring
    // scheduled/dynamic teams is a valid forward declaration, but the compiler
    // cannot materialise it yet (2.6d), so reject rather than mis-compile.
    const topology = req.topology ?? 'static';
    if (topology !== 'static') {
        diags.push({
            code: 'unsupported_topology',
            message: `slot '${slotDef.id}' format '${format.id}' declares '${topology}' team topology; only 'static' compiles today (scheduled/dynamic land in 2.6d)`,
            path: slotPath,
        });
    }

    // --- Allowance config (flat pct range / split band table) --------------
    // Structured diagnostics so a malformed allowance stops here, before
    // deriveSlotBalls runs against it. Mirrors the team-grouping validators.
    validateAllowanceConfig(slotDef, diags);

    const selected = selectBallsForSlot(slotDef, strategies, allBalls, req, ctx, diags);

    // A `scoresAnyBall` scoring format (stroke/match/stableford — ADR-0002) may
    // score balls of any composition (its own own-balls OR a referenced
    // team-composition's balls), so the own/team producer-count + ball-mode
    // contract does not apply to it. Every other check (slot ball count, team
    // grouping, …) still runs.
    const anyBall = plugin.descriptor.scoresAnyBall === true;

    // --- Side aggregation (ADR-0004) — structural preconditions -------------
    // Aggregation is slot DATA, validated generically off the descriptor:
    //   - a side format consumes the grouping itself; aggregating it away is
    //     contradictory;
    //   - a format consuming per-ball metadata (umbrella's GIR) has no defined
    //     metadata aggregation — refuse rather than mis-score;
    //   - aggregation without a grouping has nothing to aggregate.
    const aggregation = slotDef.sideAggregation;
    if (aggregation) {
        if (req.requiresSlotTeamGrouping) {
            diags.push({
                code: 'side_aggregation_on_side_format',
                message: `slot '${slotDef.id}' format '${format.id}' consumes its team grouping directly (a side format); sideAggregation does not apply`,
                path: `${slotPath}.sideAggregation`,
                formatId: format.id,
            });
        }
        if ((plugin.descriptor.requirements.scoreEntry?.metadata?.length ?? 0) > 0) {
            diags.push({
                code: 'side_aggregation_metadata_format',
                message: `slot '${slotDef.id}' format '${format.id}' consumes per-ball metadata, which has no defined side aggregation — score sides with a metadata-free format`,
                path: `${slotPath}.sideAggregation`,
                formatId: format.id,
            });
        }
        if (!slotDef.teamGrouping) {
            diags.push({
                code: 'side_aggregation_requires_team_grouping',
                message: `slot '${slotDef.id}' declares sideAggregation but no teamGrouping — there are no sides to aggregate`,
                path: `${slotPath}.sideAggregation`,
            });
        }
    }

    // --- Per-ball producer count ------------------------------------------
    if (req.producerCount && !anyBall) {
        for (const b of selected) {
            const pc = b.producerDefIds.length;
            if (pc < req.producerCount.min || pc > req.producerCount.max) {
                diags.push({
                    code: 'producer_count_violation',
                    message: `slot '${slotDef.id}' ball ${b.row.id} has ${pc} producers; format '${format.id}' requires ${req.producerCount.min}..${req.producerCount.max}`,
                    path: slotPath,
                });
            }
        }
    }

    // --- Ball mode (own vs team) ------------------------------------------
    // producerCount bounds the per-ball count; ballMode is the format's
    // explicit own/team contract, validated independently so a selector that
    // drags in the wrong ball shape is rejected rather than silently scored.
    if (!anyBall && (req.ballMode === 'own' || req.ballMode === 'team')) {
        for (const b of selected) {
            const isTeamBall = b.producerDefIds.length > 1;
            if (req.ballMode === 'own' && isTeamBall) {
                diags.push({
                    code: 'ball_mode_violation',
                    message: `slot '${slotDef.id}' format '${format.id}' is own-ball but ball ${b.row.id} has ${b.producerDefIds.length} producers`,
                    path: slotPath,
                });
            } else if (req.ballMode === 'team' && !isTeamBall) {
                diags.push({
                    code: 'ball_mode_violation',
                    message: `slot '${slotDef.id}' format '${format.id}' is a team format but ball ${b.row.id} is a single-producer ball`,
                    path: slotPath,
                });
            }
        }
    }

    // --- Team grouping (presence + cardinality + disjointness + coverage) --
    // Resolved BEFORE the slot ball count so an aggregated slot (ADR-0004)
    // can count SUBJECTS (one per side + each ungrouped ball) rather than
    // raw balls.
    if (req.requiresSlotTeamGrouping && !slotDef.teamGrouping) {
        diags.push({
            code: 'missing_team_grouping',
            message: `slot '${slotDef.id}' uses format '${format.id}' which requires teamGrouping`,
            path: `${slotPath}.teamGrouping`,
            formatId: format.id,
        });
    }
    const teamResolutions = slotDef.teamGrouping
        ? validateTeamGrouping(slotDef, req, selected, diags, {
              // Aggregation leaves ungrouped balls as individual subjects; a
              // side format still requires every ball inside a side.
              requireCoverage: !aggregation,
          })
        : [];

    // --- Slot ball count ---------------------------------------------------
    // For an aggregated slot the format's ball-count contract applies to the
    // SUBJECTS it will score: one virtual ball per side + each uncovered ball.
    if (req.slotBallCount) {
        let n = selected.length;
        if (aggregation && slotDef.teamGrouping) {
            const covered = new Set(teamResolutions.flatMap((tr) => tr.balls.map((b) => b.row.id)));
            const uncovered = selected.filter((b) => !covered.has(b.row.id)).length;
            n = teamResolutions.length + uncovered;
        }
        if (req.slotBallCount.min !== undefined && n < req.slotBallCount.min) {
            diags.push({
                code: 'slot_ball_count_below_min',
                message: `slot '${slotDef.id}' has ${n} balls; format '${format.id}' requires min ${req.slotBallCount.min}`,
                path: slotPath,
                formatId: format.id,
                actual: n,
                allowedMin: req.slotBallCount.min,
            });
        }
        if (req.slotBallCount.max !== undefined && n > req.slotBallCount.max) {
            diags.push({
                code: 'slot_ball_count_above_max',
                message: `slot '${slotDef.id}' has ${n} balls; format '${format.id}' allows max ${req.slotBallCount.max}`,
                path: slotPath,
                formatId: format.id,
                actual: n,
                allowedMax: req.slotBallCount.max,
            });
        }
        if (req.slotBallCount.multipleOf !== undefined && n % req.slotBallCount.multipleOf !== 0) {
            diags.push({
                code: 'slot_ball_count_not_multiple',
                message: `slot '${slotDef.id}' has ${n} balls; format '${format.id}' requires multiple of ${req.slotBallCount.multipleOf}`,
                path: slotPath,
                formatId: format.id,
                actual: n,
            });
        }
    }

    // --- Hole-segment schedule (optional, plugin-owned coordinate) ---------
    const rawSegments = readHoleSegments(slotDef.formatConfig);
    if (rawSegments !== undefined) {
        diags.push(
            ...validateHoleSegments({
                rawSegments,
                holeCoordinate: plugin.descriptor.requirements.holeCoordinate,
                playHoleCount: ctx.playHoleCount,
                courseHoleNumbers: ctx.courseHoleNumbers,
                selectedBallIds: new Set(selected.map((b) => b.row.id)),
                allowOverlap: plugin.descriptor.requirements.allowSegmentOverlap ?? false,
                pathPrefix: `${slotPath}.formatConfig`,
            }),
        );
    }

    if (hasSlotDiag()) return;

    // --- deriveSlotBalls one-for-one with the selected balls ---------------
    // Placeholder balls (Phase 5.5) carry no CH, so no PH can derive: they
    // skip the format's allowance derivation and land with a NULL PH (the
    // claim recompiles real snapshots in). The format never sees them, so
    // formats needing handicaps still compile with seats present.
    const derivable = selected.filter((b) => !b.pending);
    const derived = format.deriveSlotBalls({
        balls: derivable.map((b) => ({
            ballId: b.row.id,
            courseHandicapSnapshot: b.row.courseHandicapSnapshot!,
        })),
        allowanceConfig: slotDef.allowanceConfig,
    });
    const selectedIds = new Set(derivable.map((b) => b.row.id));
    const seenDerived = new Set<string>();
    for (const d of derived) {
        if (!selectedIds.has(d.ballId)) {
            diags.push({
                code: 'derived_ball_unknown',
                message: `slot '${slotDef.id}' deriveSlotBalls returned unknown ball id '${d.ballId}'`,
                path: slotPath,
            });
        } else if (seenDerived.has(d.ballId)) {
            diags.push({
                code: 'derived_ball_duplicate',
                message: `slot '${slotDef.id}' deriveSlotBalls returned ball id '${d.ballId}' twice`,
                path: slotPath,
            });
        } else {
            seenDerived.add(d.ballId);
        }
    }
    for (const b of derivable) {
        if (!seenDerived.has(b.row.id)) {
            diags.push({
                code: 'derived_ball_missing',
                message: `slot '${slotDef.id}' deriveSlotBalls omitted selected ball id '${b.row.id}'`,
                path: slotPath,
            });
        }
    }
    if (hasSlotDiag()) return;

    // --- Emit rows ---------------------------------------------------------
    const slotRowId = hashId('tapscore:slot:v1', input.roundId, slotDef.id);
    const ballMode = req.ballMode === 'team' ? 'team' : 'own';
    slots.push({
        id: slotRowId,
        slotDefId: slotDef.id,
        formatId: slotDef.formatId,
        formatConfigJson:
            slotDef.formatConfig === undefined ? null : JSON.stringify(slotDef.formatConfig),
        // Registry-derived metadata — the descriptor is the source of truth,
        // not a formatId→(mode,shape) decomposition table.
        scoringMode: plugin.descriptor.scoringMode,
        teamShape: plugin.descriptor.teamShape,
        allowanceConfigJson: JSON.stringify(slotDef.allowanceConfig),
        ballMode,
    });
    // Emit in SELECTED order (the ball-order contract — match-play pairs in
    // order), merging the derived PHs back in; pending balls carry a NULL PH.
    const phByBall = new Map(derived.map((d) => [d.ballId, d.playingHandicapSnapshot] as const));
    for (const b of selected) {
        slotBalls.push({
            slotId: slotRowId,
            ballId: b.row.id,
            playingHandicapSnapshot: b.pending ? null : phByBall.get(b.row.id)!,
        });
    }
    for (const tr of teamResolutions) {
        for (const b of tr.balls) {
            slotBallTeams.push({ slotId: slotRowId, teamLabel: tr.teamLabel, ballId: b.row.id });
        }
    }
}

/**
 * Validate a slot's static team grouping against the format's
 * `slotTeamGrouping` requirement and the exhaustive/exclusive invariant:
 *   - team COUNT within the declared `teamCount` window;
 *   - each team's resolved ball count within the declared `teamSize` window;
 *   - teams are DISJOINT (no producer and no ball claimed by two teams);
 *   - teams COVER every selected ball (none left unassigned).
 * Returns the per-team ball resolution so the caller emits `slot_ball_teams`
 * without recomputing it. Diagnostics accumulate; rows are only emitted when
 * the slot is clean.
 */
/**
 * Validate a slot's `FormatAllowanceConfig`. `flat` only bounds its pct;
 * `split` must be an ascending, fully-covering CH-band table. Three failure
 * classes surface as structured diagnostics (mirroring the team-grouping
 * validators): percentages out of range, bad band bounds (ordering / a
 * non-final open band), and a table that fails to cover every CH (no final
 * catch-all). Runs before `deriveSlotBalls`, which the slot-level diagnostic
 * guard then skips.
 */
function validateAllowanceConfig(slotDef: SlotDefinition, diags: CompilerDiagnostic[]): void {
    const cfg = slotDef.allowanceConfig;
    const acPath = `slots[${slotDef.id}].allowanceConfig`;

    const checkPct = (pct: number, where: string): void => {
        if (!Number.isFinite(pct) || pct < 0 || pct > 200) {
            diags.push({
                code: 'allowance_pct_out_of_range',
                message: `slot '${slotDef.id}' ${where} allowance pct ${pct} is outside 0..200`,
                path: acPath,
            });
        }
    };

    if (cfg.type === 'flat') {
        checkPct(cfg.pct, 'flat');
        return;
    }

    // split
    const bands = cfg.bands;
    if (bands.length === 0) {
        diags.push({
            code: 'allowance_split_empty',
            message: `slot '${slotDef.id}' split allowance has no bands`,
            path: acPath,
        });
        return;
    }

    let prevBound: number | null = null;
    bands.forEach((b, i) => {
        checkPct(b.pct, `split band #${i}`);
        const isLast = i === bands.length - 1;
        if (b.upToCh === null) {
            if (!isLast) {
                diags.push({
                    code: 'allowance_band_bounds_invalid',
                    message: `slot '${slotDef.id}' split band #${i} is open-ended (upToCh: null) but is not the final band`,
                    path: acPath,
                });
            }
            return;
        }
        if (!Number.isFinite(b.upToCh)) {
            diags.push({
                code: 'allowance_band_bounds_invalid',
                message: `slot '${slotDef.id}' split band #${i} has a non-finite upToCh bound`,
                path: acPath,
            });
            return;
        }
        if (prevBound !== null && b.upToCh <= prevBound) {
            diags.push({
                code: 'allowance_band_bounds_invalid',
                message: `slot '${slotDef.id}' split bands must ascend by upToCh; band #${i} bound ${b.upToCh} is not greater than the previous bound ${prevBound}`,
                path: acPath,
            });
        }
        prevBound = b.upToCh;
    });

    // Coverage — the final band must be the open catch-all, else some CH is
    // unreachable and `deriveSplit` would throw at runtime.
    const last = bands[bands.length - 1]!;
    if (last.upToCh !== null) {
        diags.push({
            code: 'allowance_band_no_catch_all',
            message: `slot '${slotDef.id}' split allowance does not cover all course handicaps — the final band must be open-ended (upToCh: null)`,
            path: acPath,
        });
    }
}

function validateTeamGrouping(
    slotDef: SlotDefinition,
    req: FormatBallRequirement,
    selected: ResolvedBall[],
    diags: CompilerDiagnostic[],
    opts: { requireCoverage?: boolean } = {},
): TeamBallResolution[] {
    const requireCoverage = opts.requireCoverage ?? true;
    const teams = slotDef.teamGrouping!.teams;
    const tgPath = `slots[${slotDef.id}].teamGrouping`;
    const tg = req.slotTeamGrouping;

    if (tg?.teamCount) {
        if (tg.teamCount.min !== undefined && teams.length < tg.teamCount.min) {
            diags.push({
                code: 'team_count_below_min',
                message: `slot '${slotDef.id}' has ${teams.length} teams; format '${slotDef.formatId}' requires min ${tg.teamCount.min}`,
                path: tgPath,
                formatId: slotDef.formatId,
                actual: teams.length,
                allowedMin: tg.teamCount.min,
            });
        }
        if (tg.teamCount.max !== undefined && teams.length > tg.teamCount.max) {
            diags.push({
                code: 'team_count_above_max',
                message: `slot '${slotDef.id}' has ${teams.length} teams; format '${slotDef.formatId}' allows max ${tg.teamCount.max}`,
                path: tgPath,
                formatId: slotDef.formatId,
                actual: teams.length,
                allowedMax: tg.teamCount.max,
            });
        }
    }

    // Producer-level disjointness — a producer named in two teams is malformed.
    const producerToTeam = new Map<string, string>();
    for (const team of teams) {
        for (const pid of team.producerDefIds) {
            const prior = producerToTeam.get(pid);
            if (prior !== undefined && prior !== team.label) {
                diags.push({
                    code: 'overlapping_teams',
                    message: `slot '${slotDef.id}' producer '${pid}' is in both team '${prior}' and team '${team.label}'`,
                    path: tgPath,
                });
            } else {
                producerToTeam.set(pid, team.label);
            }
        }
    }

    // Resolve balls per team + size bounds.
    const ballToTeams = new Map<string, string[]>();
    const resolutions: TeamBallResolution[] = [];
    for (const team of teams) {
        const teamProducerSet = new Set(team.producerDefIds);
        const teamBalls = selected.filter((b) =>
            b.producerDefIds.every((pid) => teamProducerSet.has(pid)),
        );
        if (teamBalls.length === 0) {
            diags.push({
                code: 'empty_team_grouping',
                message: `slot '${slotDef.id}' team '${team.label}' resolves to 0 balls`,
                path: tgPath,
                formatId: slotDef.formatId,
                teamLabel: team.label,
                actual: 0,
            });
        }
        if (tg?.teamSize) {
            if (tg.teamSize.min !== undefined && teamBalls.length < tg.teamSize.min) {
                diags.push({
                    code: 'team_size_below_min',
                    message: `slot '${slotDef.id}' team '${team.label}' has ${teamBalls.length} balls; format '${slotDef.formatId}' requires min ${tg.teamSize.min}`,
                    path: tgPath,
                    formatId: slotDef.formatId,
                    teamLabel: team.label,
                    actual: teamBalls.length,
                    allowedMin: tg.teamSize.min,
                });
            }
            if (tg.teamSize.max !== undefined && teamBalls.length > tg.teamSize.max) {
                diags.push({
                    code: 'team_size_above_max',
                    message: `slot '${slotDef.id}' team '${team.label}' has ${teamBalls.length} balls; format '${slotDef.formatId}' allows max ${tg.teamSize.max}`,
                    path: tgPath,
                    formatId: slotDef.formatId,
                    teamLabel: team.label,
                    actual: teamBalls.length,
                    allowedMax: tg.teamSize.max,
                });
            }
        }
        for (const b of teamBalls) {
            ballToTeams.set(b.row.id, [...(ballToTeams.get(b.row.id) ?? []), team.label]);
        }
        resolutions.push({ teamLabel: team.label, balls: teamBalls });
    }

    // Ball-level disjointness — a ball claimed by two teams.
    for (const [ballId, labels] of ballToTeams) {
        if (labels.length > 1) {
            diags.push({
                code: 'overlapping_teams',
                message: `slot '${slotDef.id}' ball ${ballId} is claimed by teams ${labels.join(', ')}`,
                path: tgPath,
            });
        }
    }

    // Coverage — every selected ball belongs to exactly one team. Relaxed for
    // aggregated slots (ADR-0004): an uncovered ball is an INDIVIDUAL subject
    // ranked alongside the sides, not a grouping mistake.
    if (requireCoverage) {
        for (const b of selected) {
            if (!ballToTeams.has(b.row.id)) {
                diags.push({
                    code: 'ball_not_in_any_team',
                    message: `slot '${slotDef.id}' ball ${b.row.id} is not assigned to any team`,
                    path: tgPath,
                });
            }
        }
    }

    return resolutions;
}

/** True when a ball's producer count fits the format's mode + count window. */
function ballMatchesRequirement(b: ResolvedBall, req: FormatBallRequirement): boolean {
    const pc = b.producerDefIds.length;
    if (req.producerCount && (pc < req.producerCount.min || pc > req.producerCount.max)) return false;
    if (req.ballMode === 'own' && pc !== 1) return false;
    if (req.ballMode === 'team' && pc < 2) return false;
    return true;
}

function selectBallsForSlot(
    slotDef: SlotDefinition,
    strategies: StrategyResolved[],
    allBalls: ResolvedBall[],
    req: FormatBallRequirement,
    ctx: SlotCompileContext,
    diags: CompilerDiagnostic[],
): ResolvedBall[] {
    const sel = slotDef.ballSelector;
    const selPath = `slots[${slotDef.id}].ballSelector`;

    // Selector references must resolve — an unknown id is a hard error, not a
    // silent empty selection that later trips an opaque ball-count diagnostic.
    for (const sid of sel?.strategyDefIds ?? []) {
        if (!ctx.strategyDefIds.has(sid)) {
            diags.push({
                code: 'unknown_selector_strategy',
                message: `slot '${slotDef.id}' ballSelector references unknown strategy def-id '${sid}'`,
                path: selPath,
            });
        }
    }
    for (const pid of sel?.producerDefIds ?? []) {
        if (!ctx.producerDefIds.has(pid)) {
            diags.push({
                code: 'unknown_selector_producer',
                message: `slot '${slotDef.id}' ballSelector references unknown producer def-id '${pid}'`,
                path: selPath,
            });
        }
    }

    let candidates: ResolvedBall[];
    if (sel?.strategyDefIds && sel.strategyDefIds.length > 0) {
        const allowed = new Set(sel.strategyDefIds);
        const ballsByStrategy = new Map<string, ResolvedBall[]>();
        for (const s of strategies) {
            if (!allowed.has(s.def.id)) continue;
            ballsByStrategy.set(s.def.id, s.balls);
        }
        // Preserve the caller's strategyDefIds order so the downstream
        // ball-order contract (match-play pairs in-order) is honoured.
        candidates = sel.strategyDefIds.flatMap((sid) => ballsByStrategy.get(sid) ?? []);
    } else {
        // Requirement-based auto-selection: never blindly take EVERY ball in a
        // mixed own-ball/team-ball round. Match the format's declared ball mode
        // and producer-count window so an own-ball slot ignores alt-shot team
        // balls and vice versa.
        candidates = allBalls.filter((b) => ballMatchesRequirement(b, req));
    }
    if (sel?.producerDefIds && sel.producerDefIds.length > 0) {
        const allow = new Set(sel.producerDefIds);
        // ADR-0003: the producer filter picks WHICH INDIVIDUALS (own balls) are
        // in the slot; team balls (>1 producer) are selected wholesale by their
        // strategy and pass through. This lets a slot mix a team with an
        // individual (e.g. köpenhamnare = 2 teams + 1 player) without the team's
        // members leaking in as own balls.
        candidates = candidates.filter(
            (b) => b.producerDefIds.length > 1 || b.producerDefIds.every((pid) => allow.has(pid)),
        );
    }
    // Dedup by ball id while preserving first-seen order.
    const seen = new Set<string>();
    const out: ResolvedBall[] = [];
    for (const b of candidates) {
        if (seen.has(b.row.id)) continue;
        seen.add(b.row.id);
        out.push(b);
    }
    return out;
}

