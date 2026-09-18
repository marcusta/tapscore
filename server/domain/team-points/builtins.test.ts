// Phase 6 Slice 1 — the built-in team-points rules fold a slot result into
// rows. Every case here builds a `PairBallResult` by hand: the rules are pure,
// so no round, no DB.

import { beforeEach, describe, expect, test } from 'bun:test';
import type { BallResult, PairBallHoleResult, PairBallResult } from '../strategies/types';
import { registerBuiltInTeamPointsRules, resetBuiltInTeamPointsRules } from './index';
import {
    findTeamPointsRule,
    listTeamPointsRules,
    registerTeamPointsRule,
    teamOfBalls,
    teamPointsCatalog,
    type TeamPointsRule,
    type TeamPointsSlotInput,
} from './rule';

const TEAMS = [
    { teamId: 'red', name: 'Red' },
    { teamId: 'blue', name: 'Blue' },
];

function byShape(appliesTo: 'match' | 'ranked' | 'none'): TeamPointsRule {
    return listTeamPointsRules().find((r) => r.descriptor.appliesTo === appliesTo)!;
}

function hole(n: number, delta: number | null): PairBallHoleResult {
    return {
        holeNumber: n,
        status: delta === null ? null : delta > 0 ? 'won' : delta < 0 ? 'lost' : 'halved',
        fromA: null,
        fromB: null,
        pointsDelta: delta,
    } as PairBallHoleResult;
}

function pair(
    result: PairBallResult['result'],
    deltas: (number | null)[],
    summary: string,
): PairBallResult {
    return {
        sideA: { ballIds: ['anna'] },
        sideB: { ballIds: ['bo'] },
        holes: deltas.map((d, i) => hole(i + 1, d)),
        summary,
        result,
        winner: result === 'won' ? 'anna' : result === 'lost' ? 'bo' : null,
    };
}

function slot(pairs: PairBallResult[], over: Partial<TeamPointsSlotInput> = {}): TeamPointsSlotInput {
    return {
        result: { ballResults: [], pairResults: pairs },
        ballTeams: { anna: 'red', bo: 'blue' },
        virtualSubjects: [],
        ballLabels: { anna: 'Anna', bo: 'Bo' },
        roundComplete: false,
        ...over,
    };
}

beforeEach(() => {
    resetBuiltInTeamPointsRules();
    registerBuiltInTeamPointsRules();
});

describe('registry', () => {
    test('catalog is serializable, ordered by id, and carries config fields', () => {
        const catalog = teamPointsCatalog();
        expect(catalog.map((d) => d.id)).toEqual([...catalog.map((d) => d.id)].sort());
        expect(JSON.parse(JSON.stringify(catalog))).toEqual(catalog);
        expect(byShape('match').descriptor.configFields?.map((f) => f.key)).toEqual(['win', 'half']);
    });

    test('a duplicate id fails loud', () => {
        expect(() => registerTeamPointsRule(byShape('match'))).toThrow(/duplicate/);
    });

    test('an invalid descriptor fails loud', () => {
        const bad = { ...byShape('match'), descriptor: { ...byShape('match').descriptor, id: '' } };
        expect(() => registerTeamPointsRule(bad)).toThrow(/invalid team-points descriptor/);
    });

    test('an unknown id fails loud', () => {
        expect(() => findTeamPointsRule('nope')).toThrow(/no team-points rule/);
    });

    test('registerBuiltIn is idempotent', () => {
        const before = listTeamPointsRules().length;
        registerBuiltInTeamPointsRules();
        expect(listTeamPointsRules()).toHaveLength(before);
    });
});

describe('match rule', () => {
    const fold = (s: TeamPointsSlotInput, config: unknown = { win: 1, half: 0.5 }) =>
        byShape('match').teamPoints({ slot: s, teams: TEAMS, config });

    test('side A wins: its team takes the win', () => {
        const [row] = fold(slot([pair('won', [1, 1, 1], '3 & 2')]));
        expect(row).toMatchObject({ label: 'Anna v Bo', status: '3 & 2', live: false });
        expect(row!.points).toEqual([
            { teamId: 'red', points: 1 },
            { teamId: 'blue', points: 0 },
        ]);
        expect(row!.detail).toBe('Red wins: 1');
    });

    test('side B wins (`lost` is A-perspective): side B\'s team takes the win', () => {
        const [row] = fold(slot([pair('lost', [-1, -1], '2 & 1')]));
        expect(row!.points).toEqual([
            { teamId: 'blue', points: 1 },
            { teamId: 'red', points: 0 },
        ]);
        expect(row!.detail).toBe('Blue wins: 1');
    });

    test('a decided match carries both sides, their teams and the winner', () => {
        const [row] = fold(slot([pair('lost', [-1, -1], '2 & 1')]));
        expect(row!.versus).toEqual({
            a: { name: 'Anna', teamId: 'red' },
            b: { name: 'Bo', teamId: 'blue' },
            leader: 'b',
            standing: '2 & 1',
            finished: true,
        });
    });

    test('a live match is not finished; a halved one has no leader', () => {
        const [live] = fold(slot([pair('in_progress', [-1, 0, -1, null], '2 DN thru 3')]));
        expect(live!.versus).toMatchObject({ leader: 'b', finished: false });
        const [halved] = fold(slot([pair('halved', [1, -1], 'AS')]));
        expect(halved!.versus).toMatchObject({ leader: null, standing: 'Halved', finished: true });
    });

    test('a row with a problem carries no sides', () => {
        const [row] = fold(slot([pair('won', [1], '1 UP')], { ballTeams: { anna: 'red' } }));
        expect(row!.problem).toBeDefined();
        expect(row!.versus).toBeUndefined();
    });

    test('halved splits', () => {
        const [row] = fold(slot([pair('halved', [1, -1], 'AS')]));
        expect(row!.status).toBe('Halved');
        expect(row!.points).toEqual([
            { teamId: 'red', points: 0.5 },
            { teamId: 'blue', points: 0.5 },
        ]);
    });

    test('in progress projects the leader, flagged live', () => {
        const [row] = fold(slot([pair('in_progress', [-1, 0, -1, null], '2 DN thru 3')]));
        expect(row!.live).toBe(true);
        expect(row!.detail).toBe('Blue leads: 1');
        expect(row!.points[0]).toEqual({ teamId: 'blue', points: 1 });
    });

    test('in progress and level projects a half each', () => {
        const [row] = fold(slot([pair('in_progress', [1, -1, null], 'AS thru 2')]));
        expect(row!.live).toBe(true);
        expect(row!.detail).toBe('Level: 0.5 each');
    });

    test('not started carries no points', () => {
        const [row] = fold(slot([pair('in_progress', [null, null], '')]));
        expect(row).toMatchObject({ status: 'Not started', live: false, points: [] });
    });

    test('an unfinished match in a completed round is not live', () => {
        const [row] = fold(slot([pair('in_progress', [1, null], '1 UP thru 1')], { roundComplete: true }));
        expect(row!.live).toBe(false);
        expect(row!.detail).toBe('Red wins: 1');
    });

    test('config sets the points', () => {
        const [row] = fold(slot([pair('won', [1], '1 UP')]), { win: 2, half: 1 });
        expect(row!.points[0]).toEqual({ teamId: 'red', points: 2 });
    });

    test('a ball with no team is a visible problem, no points', () => {
        const [row] = fold(slot([pair('won', [1], '1 UP')], { ballTeams: { anna: 'red' } }));
        expect(row!.points).toEqual([]);
        expect(row!.problem).toBe('Bo has no team');
    });

    test('both sides on one team is a problem', () => {
        const [row] = fold(slot([pair('won', [1], '1 UP')], { ballTeams: { anna: 'red', bo: 'red' } }));
        expect(row!.problem).toBe('Both sides play for the same team');
    });

    test('a virtual side ball resolves through its members', () => {
        const p = pair('won', [1], '1 UP');
        p.sideA = { teamLabel: 'A', ballIds: ['v-a'] };
        const [row] = fold(
            slot([p], {
                ballTeams: { a1: 'red', a2: 'red', bo: 'blue' },
                virtualSubjects: [{ ballId: 'v-a', label: 'A', memberBallIds: ['a1', 'a2'] }],
            }),
        );
        expect(row!.label).toBe('A v Bo');
        expect(row!.points[0]).toEqual({ teamId: 'red', points: 1 });
    });

    test('a side split over two teams is a problem', () => {
        expect(
            teamOfBalls(['a1', 'a2'], {
                ballTeams: { a1: 'red', a2: 'blue' },
                virtualSubjects: [],
                ballLabels: {},
            }),
        ).toEqual({ problem: 'One side has players from two teams' });
    });

    test('validateConfig rejects negative and non-numeric points', () => {
        const rule = byShape('match');
        expect(rule.validateConfig({ win: 1, half: 0.5 })).toEqual([]);
        expect(rule.validateConfig({ win: -1 })[0]!.code).toBe('invalid_points');
        expect(rule.validateConfig({ half: 'x' })[0]!.code).toBe('invalid_points');
        expect(rule.validateConfig('x')[0]!.code).toBe('invalid_config');
    });

    test('no slot yields no rows', () => {
        expect(byShape('match').teamPoints({ teams: TEAMS, config: {} })).toEqual([]);
    });
});

describe('ranked rule', () => {
    const total = (
        ballId: string,
        scoringType: 'points' | 'net',
        value: number | null,
        holesPlayed = 9,
    ): BallResult => ({
        ballId,
        holes: [],
        totals: scoringType === 'net'
            ? [{ scoringType: 'gross', value }, { scoringType: 'net', value }]
            : [{ scoringType, value }],
        holesPlayed,
    });
    const ranked = (balls: BallResult[], over: Partial<TeamPointsSlotInput> = {}): TeamPointsSlotInput => ({
        result: { ballResults: balls },
        ballTeams: { a1: 'red', a2: 'red', b1: 'blue', b2: 'blue' },
        virtualSubjects: [],
        ballLabels: { a1: 'A1', a2: 'A2', b1: 'B1', b2: 'B2' },
        roundComplete: true,
        ...over,
    });
    const fold = (s: TeamPointsSlotInput, config: unknown = { points: 1, count: 1 }) =>
        byShape('ranked').teamPoints({ slot: s, teams: TEAMS, config })[0]!;

    test('lower strokes win; the winner takes the points', () => {
        const row = fold(ranked([total('a1', 'net', 38), total('b1', 'net', 41)]));
        expect(row.points).toEqual([
            { teamId: 'red', points: 1 },
            { teamId: 'blue', points: 0 },
        ]);
        expect(row.status).toBe('Red 38 · Blue 41');
        expect(row.live).toBe(false);
    });

    test('two teams: the row carries both totals and the winner', () => {
        const row = fold(ranked([total('a1', 'net', 41), total('b1', 'net', 38)]));
        expect(row.versus).toEqual({
            a: { name: 'Red', teamId: 'red', figure: '41' },
            b: { name: 'Blue', teamId: 'blue', figure: '38' },
            leader: 'b',
            standing: '',
            finished: true,
        });
    });

    test('a tie has no leader; a live game says how far through', () => {
        const tie = fold(ranked([total('a1', 'net', 40), total('b1', 'net', 40)]));
        expect(tie.versus!.leader).toBeNull();
        const live = fold(
            ranked([total('a1', 'net', 12, 3), total('b1', 'net', 14, 3)], { roundComplete: false }),
        );
        expect(live.versus).toMatchObject({ leader: 'a', standing: 'thru 3', finished: false });
    });

    test('three teams get no two-sided data', () => {
        const row = byShape('ranked').teamPoints({
            slot: ranked([total('a1', 'net', 38), total('b1', 'net', 41), total('c1', 'net', 40)], {
                ballTeams: { a1: 'red', b1: 'blue', c1: 'green' },
            }),
            teams: [...TEAMS, { teamId: 'green', name: 'Green' }],
            config: { points: 1, count: 1 },
        })[0]!;
        expect(row.points).toHaveLength(3);
        expect(row.versus).toBeUndefined();
    });

    test('higher points win', () => {
        const row = fold(ranked([total('a1', 'points', 15), total('b1', 'points', 19)]), { points: 2, count: 1 });
        expect(row.points).toEqual([
            { teamId: 'red', points: 0 },
            { teamId: 'blue', points: 2 },
        ]);
    });

    test('a tie splits the points', () => {
        const row = fold(ranked([total('a1', 'net', 40), total('b1', 'net', 40)]));
        expect(row.points.map((p) => p.points)).toEqual([0.5, 0.5]);
        expect(row.detail).toContain('0.5 each');
    });

    test('counts the best k totals per team', () => {
        const row = fold(
            ranked([total('a1', 'points', 20), total('a2', 'points', 5), total('b1', 'points', 12), total('b2', 'points', 12)]),
            { points: 1, count: 2 },
        );
        expect(row.status).toBe('Red 25 · Blue 24');
        expect(row.points[0]).toEqual({ teamId: 'red', points: 1 });
    });

    test('a virtual side subject resolves to its members\' team', () => {
        const row = fold(
            ranked([total('vA', 'net', 70), total('vB', 'net', 72)], {
                virtualSubjects: [
                    { ballId: 'vA', label: 'A', memberBallIds: ['a1', 'a2'] },
                    { ballId: 'vB', label: 'B', memberBallIds: ['b1', 'b2'] },
                ],
            }),
        );
        expect(row.points[0]).toEqual({ teamId: 'red', points: 1 });
    });

    test('live: projects only when the counted subjects are through the same hole', () => {
        const level = fold(ranked([total('a1', 'points', 6, 3), total('b1', 'points', 4, 3)], { roundComplete: false }));
        expect(level.live).toBe(true);
        expect(level.status).toBe('Red 6 · Blue 4 thru 3');
        const uneven = fold(ranked([total('a1', 'points', 6, 4), total('b1', 'points', 4, 3)], { roundComplete: false }));
        expect(uneven.points).toEqual([]);
        expect(uneven.status).toBe('In play');
    });

    test('fewer than k complete totals: in play while live, a visible problem when final', () => {
        const balls = [total('a1', 'net', null), total('b1', 'net', 40)];
        expect(fold(ranked(balls, { roundComplete: false })).status).toBe('In play');
        const done = fold(ranked(balls));
        expect(done.points).toEqual([]);
        expect(done.problem).toContain('Red');
    });

    test('a ball with no team yields a problem, never points', () => {
        const row = fold(ranked([total('a1', 'net', 38), total('zz', 'net', 41)]));
        expect(row.points).toEqual([]);
        expect(row.problem).toBeDefined();
    });

    test('nothing scored yet reads as not started', () => {
        const row = fold(ranked([total('a1', 'net', null, 0), total('b1', 'net', null, 0)], { roundComplete: false }));
        expect(row.status).toBe('Not started');
    });

    test('validateConfig refuses a fractional count', () => {
        expect(byShape('ranked').validateConfig({ count: 1.5 })).toHaveLength(1);
        expect(byShape('ranked').validateConfig({ points: 2, count: 2 })).toEqual([]);
    });
});

describe('hand-entered rule', () => {
    const rule = () => byShape('none');

    test('one row with the typed points, in series order', () => {
        const [row] = rule().teamPoints({
            teams: TEAMS,
            config: { points: { blue: 1, red: 2 }, note: 'Best 2 of 3, 71 v 74' },
        });
        expect(row!.points).toEqual([
            { teamId: 'red', points: 2 },
            { teamId: 'blue', points: 1 },
        ]);
        expect(row).toMatchObject({ status: 'Entered', live: false, detail: 'Best 2 of 3, 71 v 74' });
    });

    test('a removed team\'s entry is dropped', () => {
        const [row] = rule().teamPoints({ teams: TEAMS, config: { points: { green: 3 } } });
        expect(row).toMatchObject({ status: 'No points yet', points: [] });
    });

    test('validateConfig', () => {
        expect(rule().validateConfig(rule().defaultConfig())).toEqual([]);
        expect(rule().validateConfig({ points: { red: -1 } })[0]!.path).toBe('points.red');
        expect(rule().validateConfig({ note: 3 })[0]!.code).toBe('invalid_note');
    });
});
