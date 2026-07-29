// Phase 2.6b/3d.4 — test helper that replaces `seedBallsFromParticipants`.
//
// `createCompiledRound(ctx, opts)` runs the real RoundCompiler path —
// `roundService.create({ definition })` — after building a minimal
// `RoundDefinition` from a terse producer + slot DSL. Service-level tests
// use this to bootstrap real compiler-output rows (balls, ball_players,
// slots, slot_balls, slot_ball_teams) without hand-assembling the shape.
//
// The helper is intentionally thin. Every field the compiler reads has a
// direct pass-through; defaults cover what leaderboard / scorecard /
// score-event tests care about (single 18-hole course, par 72, slope 113,
// CR 72 → CH = index). Tests that need a different course setup fall
// back to assembling the RoundDefinition by hand.
//
// Registration of format + ball-creation strategies is idempotent; we
// register on every call so test files don't need a beforeAll hook.

import type { RoundDefinition } from '../domain/round-definition';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { Round } from '../services/round.service';
import type { createServices } from '../services/index';

type Services = ReturnType<typeof createServices>;

/**
 * Minimal test context — `createTestDb()` returns one of these (or a
 * superset). Only the round service is actually called.
 */
interface Ctx {
    roundService: Services['roundService'];
}

export interface PlayerSlotPlayer {
    kind: 'player' | 'guest';
    id: string;
    handicapIndex: number;
    gender?: 'M' | 'F';
    /**
     * Team grouping label. When set, all producers sharing the same label
     * end up in the same team. Used by better-ball / taliban / umbrella-4
     * (own-ball team formats) and `pairBalls` slots (alt-shot pairs).
     */
    team?: string;
}

export interface CreateCompiledRoundInput {
    courseId: string;
    teeId: string;
    /** Format + slot configuration. Most tests just need one slot. */
    slots: Array<{
        formatId: RoundFormatId;
        allowancePct?: number;
        formatConfig?: unknown;
        /**
         * Score this slot on alt-shot PAIR balls instead of own balls: one
         * `team_ball` per `players[].team` label pair, CH = 50/50 of the two
         * members' course handicaps (the post-ADR-0003 expression of the old
         * foursomes alt-shot average). The slot format must be a
         * `scoresAnyBall` format (e.g. `stroke_play_individual`).
         */
        pairBalls?: boolean;
        /**
         * Restrict this slot to a subset of producers by 1-based index into
         * `players[]`. Omit on single-slot rounds. When set on multi-slot
         * rounds, only those producers' balls land in this slot.
         */
        playerIndices?: number[];
    }>;
    players: PlayerSlotPlayer[];
    date?: string;
    roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes';
    /**
     * Explicit route itinerary + provenance/policy/groups (Slice 3b). Omit for
     * a conventional round (the compiler derives the default itinerary + a
     * single playing group). Supply for repeated-hole / multi-group / custom-SI
     * scenarios — non-standard routes must also pass `routeHandicapPolicy`.
     */
    playHoles?: RoundDefinition['playHoles'];
    routeSi?: RoundDefinition['routeSi'];
    routeHandicapPolicy?: RoundDefinition['routeHandicapPolicy'];
    playingGroups?: RoundDefinition['playingGroups'];
}

/**
 * Subset of formatIds supported by the scenario builder's strategy picker.
 * Kept strict so callers get autocomplete + a compile-time check.
 */
export type RoundFormatId =
    | 'stroke_play_individual'
    | 'stableford_individual'
    | 'match_play_individual'
    | 'kopenhamnare_individual'
    | 'umbrella_individual'
    | 'stableford_better_ball'
    | 'match_play_better_ball'
    | 'taliban_better_ball'
    | 'umbrella_4_ball';

// Own-ball team formats: composed own balls + slot-level team grouping.
// Alt-shot pairs are NOT a format (ADR-0003 removed `stroke_play_foursomes`
// and `alt_shot_pair`) — a pair is a `team_ball` composition, requested per
// slot via `pairBalls: true`.
const TEAM_FORMATS: RoundFormatId[] = [
    'stableford_better_ball',
    'match_play_better_ball',
    'taliban_better_ball',
    'umbrella_4_ball',
];

export interface CreateCompiledRoundResult {
    round: Round;
    /** producerDefId == `p${1..N}`; ballIds keyed by that. */
    ballByProducerIndex: string[];
    /** Team-label → ballId (first ball seen). Useful for team-format tests. */
    ballByTeamLabel: Map<string, string[]>;
    /** Producer def-ids in declaration order (`p1`, `p2`, …). */
    producerDefIds: string[];
    /**
     * courseHoleNumber → play_hole_id (FIRST occurrence). Score events now key
     * on the occurrence id; tests resolve it from the played hole number.
     * For repeated-hole routes use `round.playHoles` directly (a course hole
     * maps to multiple occurrences).
     */
    playHoleByCourseHole: Map<number, string>;
}

export async function createCompiledRound(
    ctx: Ctx & { db: Services['db'] },
    input: CreateCompiledRoundInput,
): Promise<CreateCompiledRoundResult> {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();

    const usesPair = input.slots.some((s) => s.pairBalls === true);
    const usesTeam = input.slots.some((s) => TEAM_FORMATS.includes(s.formatId));

    const producerDefIds = input.players.map((_, i) => `p${i + 1}`);

    const definition: RoundDefinition = {
        courseId: input.courseId,
        playedAt: input.date ?? '2026-05-01',
        roundType: input.roundType ?? 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        producers: input.players.map((p, i) => ({
            id: producerDefIds[i]!,
            playerRef: { kind: p.kind, id: p.id },
            handicapIndex: p.handicapIndex,
            gender: p.gender ?? 'M',
            teeId: input.teeId,
        })),
        ballStrategies: [],
        slots: [],
    };

    // Own-ball strategy — always present for individual + own-ball team
    // formats (better-ball / taliban / umbrella-4 all compose own-balls).
    const needsOwnBall = input.slots.some((s) => s.pairBalls !== true);
    if (needsOwnBall) {
        definition.ballStrategies.push({
            id: 'strat-own',
            strategyId: 'own_ball_per_player',
            derivationConfig: { type: 'single' },
        });
    }
    if (usesPair) {
        // Group pair producers by team. Every pair is exactly 2 producers
        // sharing a `team` label; 50/50 per-producer allowance reproduces the
        // old foursomes alt-shot CH average.
        const pairsByLabel = new Map<string, string[]>();
        const pcts: Record<string, number> = {};
        input.players.forEach((p, i) => {
            if (!p.team) return;
            const list = pairsByLabel.get(p.team) ?? [];
            list.push(producerDefIds[i]!);
            pairsByLabel.set(p.team, list);
            pcts[producerDefIds[i]!] = 50;
        });
        for (const [label, ids] of pairsByLabel) {
            if (ids.length !== 2) {
                throw new Error(
                    `createCompiledRound: pairBalls team '${label}' needs exactly 2 producers (got ${ids.length})`,
                );
            }
        }
        definition.ballStrategies.push({
            id: 'strat-pair',
            strategyId: 'team_ball',
            derivationConfig: { type: 'per_producer_pct', pcts },
            composition: {
                teams: [...pairsByLabel.entries()].map(([label, ids]) => ({
                    label,
                    producerDefIds: ids,
                })),
            },
        });
    }

    // Slots.
    definition.slots = input.slots.map((s, i) => {
        const isPair = s.pairBalls === true;
        const isTeamOwnBall = TEAM_FORMATS.includes(s.formatId) && !isPair;
        const ballSelector: { strategyDefIds: string[]; producerDefIds?: string[] } = {
            strategyDefIds: [isPair ? 'strat-pair' : 'strat-own'],
        };
        if (s.playerIndices && s.playerIndices.length > 0) {
            ballSelector.producerDefIds = s.playerIndices.map(
                (idx) => producerDefIds[idx - 1]!,
            );
        }
        const slot: RoundDefinition['slots'][number] = {
            id: `slot-${i}`,
            formatId: s.formatId,
            allowanceConfig: { type: 'flat', pct: s.allowancePct ?? 100 },
            ballSelector,
        };
        if (s.formatConfig !== undefined) slot.formatConfig = s.formatConfig;
        if (isTeamOwnBall) {
            // Team grouping for own-ball team formats (better-ball /
            // taliban / umbrella-4). Group producers by `player.team`.
            const byTeam = new Map<string, string[]>();
            input.players.forEach((p, idx) => {
                if (!p.team) return;
                const list = byTeam.get(p.team) ?? [];
                list.push(producerDefIds[idx]!);
                byTeam.set(p.team, list);
            });
            if (byTeam.size < 2) {
                throw new Error(
                    `createCompiledRound: format ${s.formatId} requires >=2 teams; got ${byTeam.size}`,
                );
            }
            slot.teamGrouping = {
                teams: [...byTeam.entries()].map(([label, ids]) => ({
                    label,
                    producerDefIds: ids,
                })),
            };
        }
        return slot;
    });

    void usesTeam;

    // Explicit route / groups pass-through (Slice 3b).
    if (input.playHoles !== undefined) definition.playHoles = input.playHoles;
    if (input.routeSi !== undefined) definition.routeSi = input.routeSi;
    if (input.routeHandicapPolicy !== undefined)
        definition.routeHandicapPolicy = input.routeHandicapPolicy;
    if (input.playingGroups !== undefined) definition.playingGroups = input.playingGroups;

    const round = await ctx.roundService.create({ definition });

    // Derive helper maps by querying ball_players.
    const bpRows = await ctx.db
        .selectFrom('ball_players as bp')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .where('b.round_id', '=', round.id)
        .select(['bp.producer_def_id', 'bp.ball_id', 'b.label'])
        .execute();
    const ballByProducerIndex = producerDefIds.map((pid) => {
        const hit = bpRows.find((r) => r.producer_def_id === pid);
        if (!hit) throw new Error(`createCompiledRound: no ball for producer ${pid}`);
        return hit.ball_id;
    });
    const ballByTeamLabel = new Map<string, string[]>();
    for (const r of bpRows) {
        if (!r.label) continue;
        const list = ballByTeamLabel.get(r.label) ?? [];
        if (!list.includes(r.ball_id)) list.push(r.ball_id);
        ballByTeamLabel.set(r.label, list);
    }

    const playHoleByCourseHole = new Map<number, string>();
    for (const p of round.playHoles) {
        if (!playHoleByCourseHole.has(p.courseHoleNumber)) {
            playHoleByCourseHole.set(p.courseHoleNumber, p.id);
        }
    }

    return { round, ballByProducerIndex, ballByTeamLabel, producerDefIds, playHoleByCourseHole };
}
