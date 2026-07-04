// Phase 2.6b-final — round materialisation for the canonical scoring engine.
//
// ONE scoring path: materialise `RoundContext` + ordered `SlotBall[]` + team
// groupings + format config + strategy events from the compiler tables and
// the event log. The caller (`LeaderboardService.resultForRound`) then
// resolves each slot's registered plugin by `format_id`, calls its `score()`,
// and reshapes the `StrategyResult` into serializable result sections.
//
// This generalises the throwaway `materializeSlot` in
// `formats/_canary.testkit.ts` into production. Slice 2c deleted the legacy
// `scoreRound`→`Leaderboard` adapter that previously lived here; nothing in
// this module knows about ranking, metrics, or any presentation shape — it
// only assembles the strategy inputs.
//
// SI source: per-tee hole overrides are not yet wired into the live compiler
// path (`round_tee_holes` is backfill-only), so `teeHoles` is empty and
// `effectiveStrokeIndex` falls back to the course base SI. Slice 3c moves
// scoring onto occurrence-aware SI resolution.

import type {
    FormatAction,
    PerProducerCh,
    PlayHoleSnapshot,
    ProducerSnapshot,
    RoundContext,
    RoundCourseHoleSnapshot,
    RoundTeeHoleSnapshot,
    SlotBall,
    SlotTeamGrouping,
    StrategyEvent,
    TeeSnapshot,
} from './strategies/types';
import type { SlotSideAggregation } from './round-definition';
import { createRoundContext } from './strategies/round-context';
import { replayFormatActionsBySlot } from './strategies/format-actions';
import { aggregateSlotSubjects, type VirtualSideSubject } from './side-aggregation';

// --- Input DTOs (one per compiler table the service reads) -----------------

export interface MaterializeBallPlayer {
    ballId: string;
    producerDefId: string;
    playerId: string | null;
    guestPlayerId: string | null;
    displayName: string;
    handicapIndex: number;
    category: string | null;
    gender: 'M' | 'F' | null;
    teeId: string | null;
    teeName: string;
    courseRating: number;
    slope: number;
    teePar: number;
    /** Per-producer CH (pre-derivation). */
    courseHandicap: number;
}

export interface MaterializeBall {
    id: string;
    label: string | null;
    courseHandicapSnapshot: number;
    /** Audit JSON `[{ producerDefId, ch }]`; null for own-ball. */
    perProducerChJson: string | null;
}

export interface MaterializeSlot {
    slotId: string;
    slotDefId: string;
    /** Legacy presentation key, parsed from `slot_def_id` by the caller. */
    slotIndex: number;
    /** Resolved from the round definition (the format identity). */
    formatId: string;
    formatConfig: unknown;
    /**
     * ADR-0004 — from the round definition. When set, the slot's team
     * groupings are aggregated into virtual scoring subjects here at
     * materialisation; the format sees ordinary balls.
     */
    sideAggregation?: SlotSideAggregation;
}

export interface MaterializeSlotBall {
    slotId: string;
    ballId: string;
    playingHandicapSnapshot: number;
}

export interface MaterializeSlotBallTeam {
    slotId: string;
    teamLabel: string;
    ballId: string;
}

/** One itinerary occurrence (round_play_holes + per-tee snapshots). */
export interface MaterializePlayHole {
    playHoleId: string;
    playHoleDefId: string;
    ordinal: number;
    courseHoleNumber: number;
    par: number;
    baseStrokeIndex: number;
    tees: { teeId: string; lengthM: number; strokeIndexOverride: number | null }[];
}

/** One playing group's start occurrence + its scored balls (rotation source). */
export interface MaterializePlayingGroup {
    startPlayHoleId: string;
    ballIds: string[];
}

export interface RoundLeaderboardInput {
    /** Full-course holes (par + base SI) — physical-course reference data. */
    courseHoles: RoundCourseHoleSnapshot[];
    /** Explicit play-hole itinerary in canonical ordinal order — the scoring subject. */
    playHoles: MaterializePlayHole[];
    /** Frozen route allocation cycle size (routeSi.allocationCycleSize). */
    allocationCycleSize: number;
    /** Playing groups — supply the per-ball played-order rotation. */
    playingGroups: MaterializePlayingGroup[];
    ballPlayers: MaterializeBallPlayer[];
    balls: MaterializeBall[];
    /** Compiled slots; iteration order is by `slotIndex` regardless of input order. */
    slots: MaterializeSlot[];
    /** `slot_balls` in compiler insertion order (the ball-order contract). */
    slotBalls: MaterializeSlotBall[];
    /** `slot_ball_teams` in compiler insertion order. */
    slotBallTeams: MaterializeSlotBallTeam[];
    events: StrategyEvent[];
    /**
     * Append-only format actions for the whole round (any slot). Bucketed per
     * slot and supersession-resolved here. Omit / empty for rounds with no
     * stateful formats.
     */
    formatActions?: FormatAction[];
}

// --- Materialised per-slot scoring inputs ----------------------------------

export interface MaterializedSlot {
    slotDefId: string;
    slotIndex: number;
    formatId: string;
    formatConfig: unknown;
    slotBalls: SlotBall[];
    slotTeamGroupings: SlotTeamGrouping[];
    /** Replayed, supersession-resolved actions for this slot (§17). */
    formatActions: FormatAction[];
    /**
     * ADR-0004 — present iff the slot aggregates sides into virtual subjects.
     * `slotBalls` then already holds the virtual balls (+ passthrough
     * individuals) and `slotTeamGroupings` is empty (the grouping was
     * consumed by the aggregation); this carries the provenance a renderer
     * needs (team label + member ball ids per virtual subject).
     */
    virtualSubjects?: VirtualSideSubject[];
}

export interface MaterializedRound {
    roundContext: RoundContext;
    slots: MaterializedSlot[];
    events: StrategyEvent[];
}

// --- Materialisation --------------------------------------------------------

function buildRoundContext(input: RoundLeaderboardInput): RoundContext {
    // teeHoles stays empty in the live path (round_tee_holes is backfill-only);
    // occurrence SI comes from the play-hole snapshots, not per-tee overrides.
    const teeHoles = new Map<string, RoundTeeHoleSnapshot[]>();

    const producers = new Map<string, ProducerSnapshot>();
    for (const bp of input.ballPlayers) {
        if (producers.has(bp.producerDefId)) continue;
        const tee: TeeSnapshot = {
            teeId: bp.teeId ?? '',
            teeName: bp.teeName,
            courseRating: bp.courseRating,
            slope: bp.slope,
            teePar: bp.teePar,
        };
        producers.set(bp.producerDefId, {
            producerDefId: bp.producerDefId,
            playerRef: bp.playerId
                ? { kind: 'player', id: bp.playerId }
                : { kind: 'guest', id: bp.guestPlayerId! },
            displayName: bp.displayName,
            handicapIndex: bp.handicapIndex,
            category: bp.category ?? undefined,
            gender: bp.gender ?? undefined,
            tee,
            courseHandicap: bp.courseHandicap,
        });
    }

    const playHoles: PlayHoleSnapshot[] = input.playHoles.map((p) => ({
        playHoleId: p.playHoleId,
        playHoleDefId: p.playHoleDefId,
        ordinal: p.ordinal,
        courseHoleNumber: p.courseHoleNumber,
        par: p.par,
        baseStrokeIndex: p.baseStrokeIndex,
        tees: p.tees,
    }));

    const ballGroupStart = new Map<string, string>();
    for (const g of input.playingGroups) {
        for (const ballId of g.ballIds) ballGroupStart.set(ballId, g.startPlayHoleId);
    }

    return createRoundContext({
        playHoles,
        allocationCycleSize: input.allocationCycleSize,
        producers,
        courseHoles: input.courseHoles,
        teeHoles,
        ballGroupStart,
    });
}

function producersForBall(ball: MaterializeBall, fallback: PerProducerCh[]): PerProducerCh[] {
    if (ball.perProducerChJson) {
        const parsed = JSON.parse(ball.perProducerChJson) as PerProducerCh[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    if (fallback.length === 0) {
        throw new Error(`ball ${ball.id} has no per-producer CH (neither audit JSON nor ball_players)`);
    }
    return fallback;
}

export function materializeRound(input: RoundLeaderboardInput): MaterializedRound {
    const roundContext = buildRoundContext(input);

    // Format actions: resolve supersession once, bucket by stable slot def-id.
    const actionsBySlot = replayFormatActionsBySlot(input.formatActions ?? []);

    const ballById = new Map(input.balls.map((b) => [b.id, b] as const));
    // ball_players insertion order == per-producer CH order — the fallback
    // when a ball carries no audit JSON.
    const ppcByBall = new Map<string, PerProducerCh[]>();
    for (const bp of input.ballPlayers) {
        const list = ppcByBall.get(bp.ballId) ?? [];
        list.push({ producerDefId: bp.producerDefId, ch: bp.courseHandicap });
        ppcByBall.set(bp.ballId, list);
    }

    // ADR-0004 — synthesized side streams join the strategy event stream.
    // Virtual ball ids are content-addressed per (slot, team label), so one
    // slot's synthetic events are invisible to every other slot's balls.
    const syntheticEvents: StrategyEvent[] = [];

    const slots: MaterializedSlot[] = [...input.slots]
        .sort((a, b) => a.slotIndex - b.slotIndex)
        .map((slot) => {
            const slotBalls: SlotBall[] = input.slotBalls
                .filter((sb) => sb.slotId === slot.slotId)
                .map((sb) => {
                    const ball = ballById.get(sb.ballId);
                    if (!ball) throw new Error(`slot_ball references unknown ballId ${sb.ballId}`);
                    return {
                        ballId: ball.id,
                        label: ball.label ?? undefined,
                        courseHandicapSnapshot: ball.courseHandicapSnapshot,
                        playingHandicapSnapshot: sb.playingHandicapSnapshot,
                        producers: producersForBall(ball, ppcByBall.get(ball.id) ?? []),
                    };
                });

            // Group team rows by label, preserving insertion order.
            const byLabel = new Map<string, string[]>();
            for (const t of input.slotBallTeams) {
                if (t.slotId !== slot.slotId) continue;
                const list = byLabel.get(t.teamLabel) ?? [];
                list.push(t.ballId);
                byLabel.set(t.teamLabel, list);
            }
            const slotTeamGroupings: SlotTeamGrouping[] = [...byLabel.entries()].map(
                ([teamLabel, ballIds]) => ({ teamLabel, ballIds }),
            );

            // ADR-0004 — aggregate side groupings into virtual subjects. The
            // format then scores ordinary balls: the grouping is consumed
            // here, never passed on.
            if (slot.sideAggregation && slotTeamGroupings.length > 0) {
                const aggregated = aggregateSlotSubjects({
                    aggregation: slot.sideAggregation,
                    slotDefId: slot.slotDefId,
                    slotBalls,
                    slotTeamGroupings,
                    roundContext,
                    events: input.events,
                });
                syntheticEvents.push(...aggregated.syntheticEvents);
                return {
                    slotDefId: slot.slotDefId,
                    slotIndex: slot.slotIndex,
                    formatId: slot.formatId,
                    formatConfig: slot.formatConfig,
                    slotBalls: aggregated.slotBalls,
                    slotTeamGroupings: [],
                    formatActions: actionsBySlot.get(slot.slotDefId) ?? [],
                    virtualSubjects: aggregated.virtualSubjects,
                };
            }

            return {
                slotDefId: slot.slotDefId,
                slotIndex: slot.slotIndex,
                formatId: slot.formatId,
                formatConfig: slot.formatConfig,
                slotBalls,
                slotTeamGroupings,
                formatActions: actionsBySlot.get(slot.slotDefId) ?? [],
            };
        });

    return { roundContext, slots, events: [...input.events, ...syntheticEvents] };
}
