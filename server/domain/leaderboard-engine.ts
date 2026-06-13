// Phase 2.6b-final / Slice 2a — the canonical scoring engine.
//
// ONE scoring path: materialise `RoundContext` + ordered `SlotBall[]` + team
// groupings + format config + strategy events from the compiler tables and
// the event log, resolve the registered plugin by `format_id`, and call its
// `score()`. This generalises the throwaway `materializeSlot` in
// `formats/_canary.testkit.ts` into production.
//
// The legacy `computeLeaderboard` + `findFormat().compute()` engine no longer
// runs in any production service. The static render pipeline still consumes
// the SAME `Leaderboard` shape (and legacy result types) until Slice 2b, so
// this engine adapts each plugin's `StrategyResult` back to that shape:
//   - `BallResult` gains `slotIndex` (presentation key, parsed from the
//     stable slot_def_id — never from array position);
//   - `PairBallResult { sideA, sideB }` collapses to the legacy
//     `PairResult { balls: [repA, repB] }` using each side's first ball;
//   - ranking direction comes from the plugin descriptor's `metrics`, not a
//     legacy scoring-type → direction lookup table.
//
// SI source: per-tee hole overrides are not yet wired into the live compiler
// path (`round_tee_holes` is backfill-only), so `teeHoles` is empty and
// `effectiveStrokeIndex` falls back to the course base SI — identical to the
// legacy leaderboard, which allocated strokes off the course SI for everyone.

import type {
    BallResult as LegacyBallResult,
    PairResult as LegacyPairResult,
} from './format';
import type { Leaderboard, LeaderboardByType, LeaderboardEntry } from './leaderboard';
import type { FormatPlugin, MetricDirection } from './formats/plugin';
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

// --- Ranking ----------------------------------------------------------------

/** Ranks entries by direction. Null totals sort last; ties share a position. */
function rankEntries(entries: LeaderboardEntry[], direction: MetricDirection): LeaderboardEntry[] {
    const sorted = [...entries].sort((a, b) => {
        if (a.total === null && b.total === null) return 0;
        if (a.total === null) return 1;
        if (b.total === null) return -1;
        return direction === 'low' ? a.total - b.total : b.total - a.total;
    });
    let lastValue: number | null | undefined = undefined;
    let position = 0;
    return sorted.map((entry, i) => {
        if (entry.total !== lastValue) {
            position = i + 1;
            lastValue = entry.total;
        }
        return { ...entry, position };
    });
}

// --- Scoring ----------------------------------------------------------------

/** Map a pair winner (team label or ball id) to the legacy representative ball id. */
function mapWinner(pr: {
    winner: string | null;
    sideA: { teamLabel?: string; ballIds: string[] };
    sideB: { teamLabel?: string; ballIds: string[] };
}): string | null {
    if (pr.winner === null) return null;
    if (pr.winner === pr.sideA.teamLabel) return pr.sideA.ballIds[0] ?? null;
    if (pr.winner === pr.sideB.teamLabel) return pr.sideB.ballIds[0] ?? null;
    // Individual match-play already returns a ball id.
    return pr.winner;
}

// Legacy-compat: team-aggregate formats (better-ball / umbrella-4-ball) emit a
// synthetic `team:<label>` ball id for the team's rolled-up result, and may
// also emit the underlying own-balls. The legacy `Leaderboard` keys every
// result on a real ball id (the team's representative = first own-ball), so we
// remap `team:<label>` → that representative and let the team aggregate (which
// carries the totals) win over any plain per-ball row sharing the same id.
// This glue is deleted with the legacy result types in Slice 2b.
const TEAM_PREFIX = 'team:';

function adaptSlotBallResults(
    raw: { ballId: string; holes: LegacyBallResult['holes']; totals: LegacyBallResult['totals']; holesPlayed: number }[],
    slotIndex: number,
    groupings: SlotTeamGrouping[],
): LegacyBallResult[] {
    const repByLabel = new Map<string, string>();
    for (const g of groupings) {
        if (g.ballIds.length > 0) repByLabel.set(g.teamLabel, g.ballIds[0]!);
    }
    const merged = new Map<string, { res: LegacyBallResult; fromTeam: boolean }>();
    for (const r of raw) {
        let id = r.ballId;
        let fromTeam = false;
        if (id.startsWith(TEAM_PREFIX)) {
            const rep = repByLabel.get(id.slice(TEAM_PREFIX.length));
            if (rep) {
                id = rep;
                fromTeam = true;
            }
        }
        const existing = merged.get(id);
        if (!existing || (fromTeam && !existing.fromTeam)) {
            merged.set(id, { res: { ...r, ballId: id, slotIndex }, fromTeam });
        }
    }
    return [...merged.values()].map((v) => v.res);
}

/**
 * Score every slot through its registered plugin and assemble the leaderboard.
 * `resolvePlugin` looks a format up in the canonical registry by id.
 */
export function scoreRound(
    materialized: MaterializedRound,
    resolvePlugin: (formatId: string) => FormatPlugin,
): Leaderboard {
    const ballResults: LegacyBallResult[] = [];
    const pairResults: LegacyPairResult[] = [];
    // (slotIndex → scoringType → entries) preserves slot + emission order.
    const bySlotType = new Map<number, Map<string, LeaderboardEntry[]>>();
    // (slotIndex → scoringType → direction) from descriptor metrics.
    const metricDirsBySlot = new Map<number, Map<string, MetricDirection>>();

    for (const slot of materialized.slots) {
        const plugin = resolvePlugin(slot.formatId);
        const metricDirs = new Map(
            plugin.descriptor.metrics.map((m) => [m.id, m.direction] as const),
        );
        metricDirsBySlot.set(slot.slotIndex, metricDirs);

        const result = plugin.score({
            roundContext: materialized.roundContext,
            slotBalls: slot.slotBalls,
            slotTeamGroupings: slot.slotTeamGroupings,
            events: materialized.events,
            formatConfig: slot.formatConfig,
        });

        const slotBallResults = adaptSlotBallResults(
            result.ballResults,
            slot.slotIndex,
            slot.slotTeamGroupings,
        );
        ballResults.push(...slotBallResults);
        for (const pr of result.pairResults ?? []) {
            pairResults.push({
                slotIndex: slot.slotIndex,
                balls: [pr.sideA.ballIds[0]!, pr.sideB.ballIds[0]!],
                holes: pr.holes,
                summary: pr.summary,
                result: pr.result,
                winner: mapWinner(pr),
            });
        }

        let typeBuckets = bySlotType.get(slot.slotIndex);
        if (!typeBuckets) {
            typeBuckets = new Map();
            bySlotType.set(slot.slotIndex, typeBuckets);
        }
        for (const r of slotBallResults) {
            for (const total of r.totals) {
                if (!metricDirs.has(total.scoringType)) {
                    throw new Error(
                        `format '${slot.formatId}' emitted scoringType '${total.scoringType}' with no declared metric`,
                    );
                }
                const bucket = typeBuckets.get(total.scoringType) ?? [];
                bucket.push({
                    ballId: r.ballId,
                    position: 0,
                    total: total.value,
                    holesPlayed: r.holesPlayed,
                });
                typeBuckets.set(total.scoringType, bucket);
            }
        }
    }

    const byScoringType: LeaderboardByType[] = [];
    const slotIndices = [...bySlotType.keys()].sort((a, b) => a - b);
    for (const slotIndex of slotIndices) {
        const typeBuckets = bySlotType.get(slotIndex)!;
        const metricDirs = metricDirsBySlot.get(slotIndex)!;
        for (const [scoringType, entries] of typeBuckets) {
            byScoringType.push({
                slotIndex,
                scoringType,
                entries: rankEntries(entries, metricDirs.get(scoringType)!),
            });
        }
    }

    return { byScoringType, ballResults, pairResults };
}
