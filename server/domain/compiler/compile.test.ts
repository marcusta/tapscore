import { beforeAll, describe, expect, test } from 'bun:test';

import { registerBuiltInBallCreationStrategies } from '../strategies/ball-creation';
import { registerBuiltInFormatStrategies } from '../strategies/formats';
import { registerBuiltInFormats } from '../formats';
import type { RoundDefinition } from '../round-definition';
import { compile } from './compile';
import type { CompilerInput, CompilerTeeContext } from './types';

beforeAll(() => {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormatStrategies();
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

describe('compile — foursomes alt-shot', () => {
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
                id: 'alt',
                strategyId: 'alt_shot_pair',
                derivationConfig: { type: 'avg' },
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
                id: 'slot-f',
                formatId: 'stroke_play_foursomes',
                allowanceConfig: { type: 'flat', pct: 50 },
                ballSelector: { strategyDefIds: ['alt'] },
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
