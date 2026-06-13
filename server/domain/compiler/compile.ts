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
import type {
    BallStrategyDefinition,
    ProducerDefinition,
    ResolvedRoundDefinition,
    RoundDefinition,
    SlotDefinition,
} from '../round-definition';
import {
    findBallCreationStrategy,
    type BallCreationStrategy,
} from '../strategies/ball-creation-strategy';
import { findFormatPlugin } from '../formats/plugin';
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
    tee: TeeSnapshot;
    teeHoles: RoundTeeHoleSnapshot[];
    teeId: string;
    displayName: string;
    gender: Gender | null;
    category: string | null;
    courseHandicap: number;
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
    perProducerCh: { producerDefId: string; ch: number }[];
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
    const ballPlayers = buildBallPlayers(allBalls, producers, diags);
    if (diags.length > 0) return { ok: false, diagnostics: diags };

    const slots: CompiledSlot[] = [];
    const slotBalls: CompiledSlotBall[] = [];
    const slotBallTeams: CompiledSlotBallTeam[] = [];

    for (const slotDef of resolved.slots) {
        compileSlot(slotDef, rinput, strategies, allBalls, slots, slotBalls, slotBallTeams, diags);
    }
    if (diags.length > 0) return { ok: false, diagnostics: diags };

    const { playingGroups, playingGroupBalls } = compilePlayingGroups(
        input.roundId,
        resolved,
        allBalls,
        diags,
    );
    if (diags.length > 0) return { ok: false, diagnostics: diags };

    const compiled: CompiledRound = {
        roundId: input.roundId,
        definitionJson: JSON.stringify(resolved),
        definitionVersion: 1,
        strategies: strategies.map((s) => s.row),
        balls: allBalls.map((b) => b.row),
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
    def: ProducerDefinition,
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
            producerInputs.push({
                playerRef: rp.def.playerRef,
                producerDefId: rp.def.id,
                handicapIndex: rp.def.handicapIndex,
                gender: rp.gender ?? undefined,
                tee: rp.tee,
                teeHoles: rp.teeHoles,
                courseHandicap: rp.courseHandicap,
            });
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
    const refs: ProducerRef[] = cb.producerDefIds.map((pid) => {
        const rp = producers.get(pid);
        if (!rp) throw new Error(`compile: producer '${pid}' missing after validation`);
        return { kind: rp.def.playerRef.kind, id: rp.def.playerRef.id };
    });
    const sortedKeys = sortProducerSet(refs);
    const ballId = hashId('tapscore:ball:v1', roundId, strategyDefId, ...sortedKeys);
    // Populate `balls.label` (§17 option 3a): fall back to a display-name
    // join when the strategy didn't already set one (own-ball doesn't; pair
    // strategies like alt-shot do). Single producer → their display name;
    // multi-producer → "Name1 & Name2 & ...".
    let derivedLabel: string | null = cb.label ?? null;
    if (derivedLabel === null) {
        const names = cb.producerDefIds
            .map((pid) => producers.get(pid)?.displayName)
            .filter((n): n is string => typeof n === 'string');
        derivedLabel = names.length > 0 ? names.join(' & ') : null;
    }
    return {
        row: {
            id: ballId,
            roundBallStrategyId: strategyRow.id,
            label: derivedLabel,
            courseHandicapSnapshot: cb.courseHandicapSnapshot,
            perProducerChJson: JSON.stringify(cb.perProducerCh),
        },
        producerDefIds: [...cb.producerDefIds],
        perProducerCh: cb.perProducerCh,
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
            out.push({
                ballId: b.row.id,
                producerDefId: ppc.producerDefId,
                playerId: rp.def.playerRef.kind === 'player' ? rp.def.playerRef.id : null,
                guestPlayerId: rp.def.playerRef.kind === 'guest' ? rp.def.playerRef.id : null,
                displayNameSnapshot: rp.displayName,
                handicapIndexSnapshot: rp.def.handicapIndex,
                categorySnapshot: rp.category,
                genderSnapshot: rp.gender,
                teeId: rp.teeId,
                teeNameSnapshot: rp.tee.teeName,
                courseRatingSnapshot: rp.tee.courseRating,
                slopeSnapshot: rp.tee.slope,
                teeParSnapshot: rp.tee.teePar,
                courseHandicapSnapshot: ppc.ch,
            });
        }
    }
    return out;
}

function compileSlot(
    slotDef: SlotDefinition,
    input: CompilerInput,
    strategies: StrategyResolved[],
    allBalls: ResolvedBall[],
    slots: CompiledSlot[],
    slotBalls: CompiledSlotBall[],
    slotBallTeams: CompiledSlotBallTeam[],
    diags: CompilerDiagnostic[],
): void {
    let plugin;
    try {
        plugin = findFormatPlugin(slotDef.formatId);
    } catch {
        diags.push({
            code: 'unknown_format',
            message: `no format plugin registered for id '${slotDef.formatId}'`,
            path: `slots[${slotDef.id}].formatId`,
        });
        return;
    }
    const format = {
        id: plugin.descriptor.id,
        ballRequirement: () => plugin.descriptor.requirements.balls,
        deriveSlotBalls: plugin.deriveSlotBalls.bind(plugin),
    };

    const req = format.ballRequirement();
    const selected = selectBallsForSlot(slotDef, strategies, allBalls);

    if (req.producerCount) {
        for (const b of selected) {
            const pc = b.producerDefIds.length;
            if (pc < req.producerCount.min || pc > req.producerCount.max) {
                diags.push({
                    code: 'producer_count_violation',
                    message: `slot '${slotDef.id}' ball ${b.row.id} has ${pc} producers; format '${format.id}' requires ${req.producerCount.min}..${req.producerCount.max}`,
                    path: `slots[${slotDef.id}]`,
                });
            }
        }
    }
    if (req.slotBallCount) {
        const n = selected.length;
        if (req.slotBallCount.min !== undefined && n < req.slotBallCount.min) {
            diags.push({
                code: 'slot_ball_count_below_min',
                message: `slot '${slotDef.id}' has ${n} balls; format '${format.id}' requires min ${req.slotBallCount.min}`,
                path: `slots[${slotDef.id}]`,
            });
        }
        if (req.slotBallCount.max !== undefined && n > req.slotBallCount.max) {
            diags.push({
                code: 'slot_ball_count_above_max',
                message: `slot '${slotDef.id}' has ${n} balls; format '${format.id}' allows max ${req.slotBallCount.max}`,
                path: `slots[${slotDef.id}]`,
            });
        }
        if (req.slotBallCount.multipleOf !== undefined && n % req.slotBallCount.multipleOf !== 0) {
            diags.push({
                code: 'slot_ball_count_not_multiple',
                message: `slot '${slotDef.id}' has ${n} balls; format '${format.id}' requires multiple of ${req.slotBallCount.multipleOf}`,
                path: `slots[${slotDef.id}]`,
            });
        }
    }
    if (req.requiresSlotTeamGrouping && !slotDef.teamGrouping) {
        diags.push({
            code: 'missing_team_grouping',
            message: `slot '${slotDef.id}' uses format '${format.id}' which requires teamGrouping`,
            path: `slots[${slotDef.id}].teamGrouping`,
        });
    }
    if (diags.some((d) => d.path?.startsWith(`slots[${slotDef.id}]`))) return;

    const derived = format.deriveSlotBalls({
        balls: selected.map((b) => ({
            ballId: b.row.id,
            courseHandicapSnapshot: b.row.courseHandicapSnapshot,
        })),
        allowanceConfig: slotDef.allowanceConfig,
    });

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
    for (const d of derived) {
        slotBalls.push({
            slotId: slotRowId,
            ballId: d.ballId,
            playingHandicapSnapshot: d.playingHandicapSnapshot,
        });
    }

    if (slotDef.teamGrouping) {
        for (const team of slotDef.teamGrouping.teams) {
            const teamProducerSet = new Set(team.producerDefIds);
            const teamBalls = selected.filter((b) =>
                b.producerDefIds.every((pid) => teamProducerSet.has(pid)),
            );
            if (teamBalls.length === 0) {
                diags.push({
                    code: 'empty_team_grouping',
                    message: `slot '${slotDef.id}' team '${team.label}' resolves to 0 balls`,
                    path: `slots[${slotDef.id}].teamGrouping`,
                });
                continue;
            }
            for (const b of teamBalls) {
                slotBallTeams.push({
                    slotId: slotRowId,
                    teamLabel: team.label,
                    ballId: b.row.id,
                });
            }
        }
    }
}

function selectBallsForSlot(
    slotDef: SlotDefinition,
    strategies: StrategyResolved[],
    allBalls: ResolvedBall[],
): ResolvedBall[] {
    const sel = slotDef.ballSelector;
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
        candidates = allBalls;
    }
    if (sel?.producerDefIds && sel.producerDefIds.length > 0) {
        const allow = new Set(sel.producerDefIds);
        candidates = candidates.filter((b) => b.producerDefIds.every((pid) => allow.has(pid)));
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

