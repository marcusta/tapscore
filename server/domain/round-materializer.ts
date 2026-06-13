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
    PerProducerCh,
    ProducerSnapshot,
    RoundContext,
    RoundCourseHoleSnapshot,
    RoundTeeHoleSnapshot,
    SlotBall,
    SlotTeamGrouping,
    StrategyEvent,
    TeeSnapshot,
} from './strategies/types';

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

export interface RoundLeaderboardInput {
    /** Full-course holes (par + base SI) — same source the legacy engine used. */
    courseHoles: RoundCourseHoleSnapshot[];
    ballPlayers: MaterializeBallPlayer[];
    balls: MaterializeBall[];
    /** Compiled slots; iteration order is by `slotIndex` regardless of input order. */
    slots: MaterializeSlot[];
    /** `slot_balls` in compiler insertion order (the ball-order contract). */
    slotBalls: MaterializeSlotBall[];
    /** `slot_ball_teams` in compiler insertion order. */
    slotBallTeams: MaterializeSlotBallTeam[];
    events: StrategyEvent[];
}

// --- Materialised per-slot scoring inputs ----------------------------------

export interface MaterializedSlot {
    slotDefId: string;
    slotIndex: number;
    formatId: string;
    formatConfig: unknown;
    slotBalls: SlotBall[];
    slotTeamGroupings: SlotTeamGrouping[];
}

export interface MaterializedRound {
    roundContext: RoundContext;
    slots: MaterializedSlot[];
    events: StrategyEvent[];
}

// --- Materialisation --------------------------------------------------------

function buildRoundContext(input: RoundLeaderboardInput): RoundContext {
    // teeHoles is intentionally empty for 2a — see file header. Built once so
    // `effectiveStrokeIndex` can resolve per-tee overrides when later slices
    // wire `round_tee_holes` into the live path.
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

    const parByHole = new Map(input.courseHoles.map((h) => [h.holeNumber, h.par]));
    const baseSiByHole = new Map(input.courseHoles.map((h) => [h.holeNumber, h.baseStrokeIndex]));

    return {
        courseHoles: input.courseHoles,
        teeHoles,
        producers,
        effectiveStrokeIndex(producerDefId, holeNumber) {
            const p = producers.get(producerDefId);
            if (!p) throw new Error(`unknown producerDefId ${producerDefId}`);
            const list = teeHoles.get(p.tee.teeId);
            const override = list?.find((h) => h.holeNumber === holeNumber)?.strokeIndexOverride ?? null;
            if (override !== null) return override;
            const base = baseSiByHole.get(holeNumber);
            if (base === undefined) throw new Error(`no courseHole for hole ${holeNumber}`);
            return base;
        },
        parFor(holeNumber) {
            const par = parByHole.get(holeNumber);
            if (par === undefined) throw new Error(`no courseHole for hole ${holeNumber}`);
            return par;
        },
    };
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

    const ballById = new Map(input.balls.map((b) => [b.id, b] as const));
    // ball_players insertion order == per-producer CH order — the fallback
    // when a ball carries no audit JSON.
    const ppcByBall = new Map<string, PerProducerCh[]>();
    for (const bp of input.ballPlayers) {
        const list = ppcByBall.get(bp.ballId) ?? [];
        list.push({ producerDefId: bp.producerDefId, ch: bp.courseHandicap });
        ppcByBall.set(bp.ballId, list);
    }

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

            return {
                slotDefId: slot.slotDefId,
                slotIndex: slot.slotIndex,
                formatId: slot.formatId,
                formatConfig: slot.formatConfig,
                slotBalls,
                slotTeamGroupings,
            };
        });

    return { roundContext, slots, events: input.events };
}
