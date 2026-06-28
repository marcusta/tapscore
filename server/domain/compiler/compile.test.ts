import { beforeAll, describe, expect, test } from 'bun:test';

import { registerBuiltInBallCreationStrategies } from '../strategies/ball-creation';
import { registerBuiltInFormats } from '../formats';
import type { RoundDefinition } from '../round-definition';
import { compile } from './compile';
import type { CompilerInput, CompilerTeeContext } from './types';

beforeAll(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
});

function mkTee(): CompilerTeeContext {
    return {
        teeName: 'Yellow',
        holes: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            lengthM: 300,
            strokeIndexOverride: null,
        })),
        ratings: new Map([
            ['M', { courseRating: 71.2, slope: 130, teePar: 72 }],
            ['F', { courseRating: 73.4, slope: 135, teePar: 72 }],
        ]),
    };
}

function mkInput(def: RoundDefinition, playerIds: string[]): CompilerInput {
    const playerProfiles = new Map<string, { displayName: string; gender?: 'M' | 'F' }>();
    for (const id of playerIds) playerProfiles.set(id, { displayName: id, gender: 'M' });
    return {
        roundId: 'r1',
        definition: def,
        courseHoles: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            par: 4,
            baseStrokeIndex: i + 1,
        })),
        tees: new Map([['tee-y', mkTee()]]),
        playerProfiles,
        guestProfiles: new Map(),
    };
}

describe('compile — singles stableford', () => {
    const def: RoundDefinition = {
        courseId: 'c1',
        playedAt: '2026-01-01',
        producers: ['p1', 'p2', 'p3'].map((id) => ({
            id,
            playerRef: { kind: 'player', id },
            handicapIndex: 10,
            gender: 'M',
            teeId: 'tee-y',
        })),
        ballStrategies: [
            {
                id: 'own',
                strategyId: 'own_ball_per_player',
                derivationConfig: { type: 'single' },
            },
        ],
        slots: [
            {
                id: 'slot-1',
                formatId: 'stableford_individual',
                allowanceConfig: { type: 'flat', pct: 95 },
                ballSelector: { strategyDefIds: ['own'] },
            },
        ],
    };

    test('emits one ball per producer, one slot_ball per ball', () => {
        const res = compile(mkInput(def, ['p1', 'p2', 'p3']));
        if (!res.ok) throw new Error(JSON.stringify(res.diagnostics));
        expect(res.compiled.balls).toHaveLength(3);
        expect(res.compiled.ballPlayers).toHaveLength(3);
        expect(res.compiled.slots).toHaveLength(1);
        expect(res.compiled.slotBalls).toHaveLength(3);
        expect(res.compiled.slotBallTeams).toHaveLength(0);
        expect(res.compiled.strategies).toHaveLength(1);
    });

    test('ball ids are deterministic across two compiles', () => {
        const a = compile(mkInput(def, ['p1', 'p2', 'p3']));
        const b = compile(mkInput(def, ['p1', 'p2', 'p3']));
        if (!a.ok || !b.ok) throw new Error('compile failed');
        const aIds = a.compiled.balls.map((x) => x.id).sort();
        const bIds = b.compiled.balls.map((x) => x.id).sort();
        expect(aIds).toEqual(bIds);
    });

    test('PH applies allowance per slot (10 × 95% ≈ 10)', () => {
        const res = compile(mkInput(def, ['p1', 'p2', 'p3']));
        if (!res.ok) throw new Error(JSON.stringify(res.diagnostics));
        for (const sb of res.compiled.slotBalls) {
            expect(sb.playingHandicapSnapshot).toBe(10);
        }
    });

    test('diagnostic: unknown player', () => {
        const res = compile(mkInput(def, ['p1', 'p2']));
        expect(res.ok).toBe(false);
        if (res.ok) return;
        expect(res.diagnostics.some((d) => d.code === 'unknown_player')).toBe(true);
    });
});

describe('compile — team ball (per-producer allowance)', () => {
    const def: RoundDefinition = {
        courseId: 'c1',
        playedAt: '2026-01-01',
        producers: ['p1', 'p2', 'p3', 'p4'].map((id) => ({
            id,
            playerRef: { kind: 'player', id },
            handicapIndex: 10,
            gender: 'M',
            teeId: 'tee-y',
        })),
        ballStrategies: [
            {
                id: 'team',
                strategyId: 'team_ball',
                // 50/50 per-producer == the old foursomes alt-shot avg.
                derivationConfig: {
                    type: 'per_producer_pct',
                    pcts: { p1: 50, p2: 50, p3: 50, p4: 50 },
                },
                composition: {
                    teams: [
                        { label: 'A', producerDefIds: ['p1', 'p2'] },
                        { label: 'B', producerDefIds: ['p3', 'p4'] },
                    ],
                },
            },
        ],
        slots: [
            {
                // stroke_play_individual opts into scoresAnyBall (ADR-0002), so
                // it scores the two team balls directly.
                id: 'slot-f',
                formatId: 'stroke_play_individual',
                allowanceConfig: { type: 'flat', pct: 50 },
                ballSelector: { strategyDefIds: ['team'] },
            },
        ],
    };

    test('2 pair-balls, 4 ball_players (2 per ball), PH = 50% CH', () => {
        const res = compile(mkInput(def, ['p1', 'p2', 'p3', 'p4']));
        if (!res.ok) throw new Error(JSON.stringify(res.diagnostics));
        expect(res.compiled.balls).toHaveLength(2);
        expect(res.compiled.ballPlayers).toHaveLength(4);
        expect(res.compiled.slotBalls).toHaveLength(2);
        const ch = res.compiled.balls[0].courseHandicapSnapshot;
        expect(res.compiled.slotBalls[0].playingHandicapSnapshot).toBe(Math.round(ch * 0.5));
    });
});

describe('compile — better-ball team grouping', () => {
    const def: RoundDefinition = {
        courseId: 'c1',
        playedAt: '2026-01-01',
        producers: ['p1', 'p2', 'p3', 'p4'].map((id) => ({
            id,
            playerRef: { kind: 'player', id },
            handicapIndex: 10,
            gender: 'M',
            teeId: 'tee-y',
        })),
        ballStrategies: [
            { id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } },
        ],
        slots: [
            {
                id: 'slot-bb',
                formatId: 'stableford_better_ball',
                allowanceConfig: { type: 'flat', pct: 85 },
                ballSelector: { strategyDefIds: ['own'] },
                teamGrouping: {
                    teams: [
                        { label: 'A', producerDefIds: ['p1', 'p2'] },
                        { label: 'B', producerDefIds: ['p3', 'p4'] },
                    ],
                },
            },
        ],
    };

    test('slot_ball_teams has 4 rows — 2 per team', () => {
        const res = compile(mkInput(def, ['p1', 'p2', 'p3', 'p4']));
        if (!res.ok) throw new Error(JSON.stringify(res.diagnostics));
        expect(res.compiled.slotBallTeams).toHaveLength(4);
        const a = res.compiled.slotBallTeams.filter((t) => t.teamLabel === 'A');
        const b = res.compiled.slotBallTeams.filter((t) => t.teamLabel === 'B');
        expect(a).toHaveLength(2);
        expect(b).toHaveLength(2);
    });
});

describe('compile — diagnostics', () => {
    test('ballRequirement violation: match_play_better_ball needs 4 balls', () => {
        const def: RoundDefinition = {
            courseId: 'c1',
            playedAt: '2026-01-01',
            producers: ['p1', 'p2', 'p3'].map((id) => ({
                id,
                playerRef: { kind: 'player', id },
                handicapIndex: 10,
                gender: 'M',
                teeId: 'tee-y',
            })),
            ballStrategies: [
                {
                    id: 'own',
                    strategyId: 'own_ball_per_player',
                    derivationConfig: { type: 'single' },
                },
            ],
            slots: [
                {
                    id: 'slot-bb',
                    formatId: 'match_play_better_ball',
                    allowanceConfig: { type: 'flat', pct: 100 },
                    ballSelector: { strategyDefIds: ['own'] },
                    teamGrouping: {
                        teams: [
                            { label: 'A', producerDefIds: ['p1', 'p2'] },
                            { label: 'B', producerDefIds: ['p3'] },
                        ],
                    },
                },
            ],
        };
        const res = compile(mkInput(def, ['p1', 'p2', 'p3']));
        expect(res.ok).toBe(false);
        if (res.ok) return;
        expect(res.diagnostics.some((d) => d.code === 'slot_ball_count_below_min')).toBe(true);
    });
});

describe('compile — itinerary + playing groups (Slice 3b)', () => {
    const singles: RoundDefinition = {
        courseId: 'c1',
        playedAt: '2026-01-01',
        producers: ['p1', 'p2', 'p3'].map((id) => ({
            id,
            playerRef: { kind: 'player', id },
            handicapIndex: 10,
            gender: 'M',
            teeId: 'tee-y',
        })),
        ballStrategies: [
            { id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } },
        ],
        slots: [
            {
                id: 'slot-1',
                formatId: 'stableford_individual',
                allowanceConfig: { type: 'flat', pct: 95 },
                ballSelector: { strategyDefIds: ['own'] },
            },
        ],
    };

    test('conventional round emits 18 occurrences + per-tee snapshots', () => {
        const res = compile(mkInput(singles, ['p1', 'p2', 'p3']));
        if (!res.ok) throw new Error(JSON.stringify(res.diagnostics));
        expect(res.compiled.playHoles).toHaveLength(18);
        expect(res.compiled.playHoles[0].ordinal).toBe(1);
        // One tee × 18 occurrences = 18 occurrence-tee rows.
        expect(res.compiled.playTeeHoles).toHaveLength(18);
        // Runtime id is content-addressed on the stable def-id.
        const distinctIds = new Set(res.compiled.playHoles.map((p) => p.id));
        expect(distinctIds.size).toBe(18);
    });

    test('default single group contains every ball', () => {
        const res = compile(mkInput(singles, ['p1', 'p2', 'p3']));
        if (!res.ok) throw new Error(JSON.stringify(res.diagnostics));
        expect(res.compiled.playingGroups).toHaveLength(1);
        expect(res.compiled.playingGroupBalls).toHaveLength(3);
        const groupIds = new Set(res.compiled.playingGroupBalls.map((m) => m.playingGroupId));
        expect(groupIds.size).toBe(1);
    });

    test('producer left out of every group → producer_not_in_any_group', () => {
        const res = compile(
            mkInput(
                {
                    ...singles,
                    playingGroups: [
                        { startTime: '08:00', startOrdinal: 1, capacity: 4, producerDefIds: ['p1', 'p2'] },
                    ],
                },
                ['p1', 'p2', 'p3'],
            ),
        );
        expect(res.ok).toBe(false);
        if (res.ok) return;
        expect(res.diagnostics.some((d) => d.code === 'producer_not_in_any_group')).toBe(true);
    });

    test('team ball whose producers span groups → team_ball_crosses_playing_groups', () => {
        const teamRound: RoundDefinition = {
            courseId: 'c1',
            playedAt: '2026-01-01',
            producers: ['p1', 'p2', 'p3', 'p4'].map((id) => ({
                id,
                playerRef: { kind: 'player', id },
                handicapIndex: 10,
                gender: 'M',
                teeId: 'tee-y',
            })),
            ballStrategies: [
                {
                    id: 'pairs',
                    strategyId: 'team_ball',
                    derivationConfig: {
                        type: 'per_producer_pct',
                        pcts: { p1: 50, p2: 50, p3: 50, p4: 50 },
                    },
                    composition: {
                        teams: [
                            { label: 'AB', producerDefIds: ['p1', 'p2'] },
                            { label: 'CD', producerDefIds: ['p3', 'p4'] },
                        ],
                    },
                },
            ],
            slots: [
                {
                    id: 'slot-1',
                    formatId: 'stroke_play_individual',
                    allowanceConfig: { type: 'flat', pct: 50 },
                    ballSelector: { strategyDefIds: ['pairs'] },
                },
            ],
            // Groups split each pair across two groups — every producer is
            // assigned exactly once, but the AB / CD team balls cross groups.
            playingGroups: [
                { startTime: '08:00', startOrdinal: 1, capacity: 2, producerDefIds: ['p1', 'p3'] },
                { startTime: '08:10', startOrdinal: 1, capacity: 2, producerDefIds: ['p2', 'p4'] },
            ],
        };
        const res = compile(mkInput(teamRound, ['p1', 'p2', 'p3', 'p4']));
        expect(res.ok).toBe(false);
        if (res.ok) return;
        expect(
            res.diagnostics.some((d) => d.code === 'team_ball_crosses_playing_groups'),
        ).toBe(true);
    });
});

describe('compile — prunes balls no slot scores', () => {
    // The `own_ball_per_player` strategy is GLOBAL: it mints a ball for every
    // producer regardless of which formats reference them (ADR-0003 narrows per
    // slot via `ballSelector.producerDefIds`, not at creation). A ball no slot
    // scores must not be persisted — otherwise the Score view (which lists every
    // persisted ball, with no slot filter) shows a player in no format.
    const def: RoundDefinition = {
        courseId: 'c1',
        playedAt: '2026-01-01',
        producers: ['p1', 'p2', 'p3'].map((id) => ({
            id,
            playerRef: { kind: 'player', id },
            handicapIndex: 10,
            gender: 'M',
            teeId: 'tee-y',
        })),
        ballStrategies: [
            { id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } },
        ],
        // Only p1 is scored; p2 and p3 are unticked everywhere.
        slots: [
            {
                id: 'slot-1',
                formatId: 'stableford_individual',
                allowanceConfig: { type: 'flat', pct: 100 },
                ballSelector: { strategyDefIds: ['own'], producerDefIds: ['p1'] },
            },
        ],
    };

    test('persists only the balls a slot scores, not one per producer', () => {
        const res = compile(mkInput(def, ['p1', 'p2', 'p3']));
        if (!res.ok) throw new Error(JSON.stringify(res.diagnostics));
        // Own-ball mints 3 candidate balls; only p1's survives.
        expect(res.compiled.balls).toHaveLength(1);
        expect(res.compiled.slotBalls).toHaveLength(1);
        // ball_players + playing-group membership track the pruned set.
        expect(res.compiled.ballPlayers.map((bp) => bp.producerDefId)).toEqual(['p1']);
        expect(res.compiled.playingGroupBalls).toHaveLength(1);
        // The strategy row itself is unaffected — it is metadata, not a ball.
        expect(res.compiled.strategies).toHaveLength(1);
    });

    test('a producer in no slot leaves no persisted ball at all', () => {
        const res = compile(mkInput(def, ['p1', 'p2', 'p3']));
        if (!res.ok) throw new Error(JSON.stringify(res.diagnostics));
        const scoredProducers = new Set(res.compiled.ballPlayers.map((bp) => bp.producerDefId));
        expect(scoredProducers.has('p2')).toBe(false);
        expect(scoredProducers.has('p3')).toBe(false);
    });
});
