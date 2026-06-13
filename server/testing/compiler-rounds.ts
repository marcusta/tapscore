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
import { registerBuiltInFormatStrategies } from '../domain/strategies/formats';
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
     * (own-ball team formats) and foursomes (alt-shot pair).
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
    | 'stroke_play_foursomes'
    | 'stableford_better_ball'
    | 'match_play_better_ball'
    | 'taliban_better_ball'
    | 'umbrella_4_ball';

const TEAM_FORMATS: RoundFormatId[] = [
    'stroke_play_foursomes',
    'stableford_better_ball',
    'match_play_better_ball',
    'taliban_better_ball',
    'umbrella_4_ball',
];

const PAIR_FORMATS: RoundFormatId[] = ['stroke_play_foursomes'];

export interface CreateCompiledRoundResult {
    round: Round;
    /** producerDefId == `p${1..N}`; ballIds keyed by that. */
    ballByProducerIndex: string[];
    /** Team-label → ballId (first ball seen). Useful for team-format tests. */
    ballByTeamLabel: Map<string, string[]>;
    /** Producer def-ids in declaration order (`p1`, `p2`, …). */
    producerDefIds: string[];
}

export async function createCompiledRound(
    ctx: Ctx & { db: Services['db'] },
    input: CreateCompiledRoundInput,
): Promise<CreateCompiledRoundResult> {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormatStrategies();
    registerBuiltInFormats();

    const usesPair = input.slots.some((s) => PAIR_FORMATS.includes(s.formatId));
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

    // Own-ball strategy — always present for individual + non-foursomes team
    // formats (better-ball / taliban / umbrella-4 all compose own-balls).
    const needsOwnBall = input.slots.some(
        (s) => !PAIR_FORMATS.includes(s.formatId),
    );
    if (needsOwnBall) {
        definition.ballStrategies.push({
            id: 'strat-own',
            strategyId: 'own_ball_per_player',
            derivationConfig: { type: 'single' },
        });
    }
    if (usesPair) {
        // Group pair producers by team. Every foursomes team is exactly 2
        // producers sharing a `team` label.
        const pairsByLabel = new Map<string, string[]>();
        input.players.forEach((p, i) => {
            if (!p.team) return;
            const list = pairsByLabel.get(p.team) ?? [];
            list.push(producerDefIds[i]!);
            pairsByLabel.set(p.team, list);
        });
        definition.ballStrategies.push({
            id: 'strat-pair',
            strategyId: 'alt_shot_pair',
            derivationConfig: { type: 'avg' },
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
        const isPair = PAIR_FORMATS.includes(s.formatId);
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

    return { round, ballByProducerIndex, ballByTeamLabel, producerDefIds };
}
