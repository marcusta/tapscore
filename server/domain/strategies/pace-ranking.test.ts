// Live-board pace ranking (ranked-leaderboard bug fix).
//
// A ranked leaderboard must not sort by ABSOLUTE metric total mid-round when
// entries have played different numbers of holes (multi-group rounds). Golf
// convention: a live stableford board ranks by points relative to the
// 2-points-per-hole pace (36 = playing to handicap), exactly as stroke play
// ranks by to-par rather than absolute strokes. This proves `rankedSections` +
// `rankEntries` order by the metric's declared `pace`, and that a metric with
// no pace declaration is untouched.

import { test, expect, describe } from 'bun:test';

import type { FormatMetric } from '../formats/plugin';
import type { BallResult } from './types';
import type { ResultColumn } from './result-presenter-helpers';
import { rankedSections } from './result-presenter-helpers';

const STABLEFORD_POINTS: FormatMetric[] = [
    { id: 'points', label: 'Points', direction: 'high', pace: { perHole: 2 } },
];
const GROSS_TO_PAR: FormatMetric[] = [{ id: 'gross', label: 'Gross', direction: 'low', pace: 'par' }];
const POINTS_NO_PACE: FormatMetric[] = [{ id: 'points', label: 'Points', direction: 'high' }];

/** A point-bearing ball result with an explicit thru (holesPlayed). */
function pointsResult(ballId: string, points: number, thru: number): BallResult {
    return {
        ballId,
        holes: [],
        totals: [{ scoringType: 'points', value: points }],
        holesPlayed: thru,
    };
}

function section(metrics: FormatMetric[], results: BallResult[], columns?: ResultColumn[]) {
    const [sec] = rankedSections(metrics, results, columns ? { columns } : {});
    return sec!;
}

describe('pace ranking — stableford (perHole: 2)', () => {
    test("the reported case: 8 pts thru 2 ranks ABOVE 9 pts thru 7", () => {
        // team A: 8 pts thru 2  → pace target 4 → paceDelta +4 (excellent)
        // team B: 9 pts thru 7  → pace target 14 → paceDelta -5 (behind pace)
        const sec = section(STABLEFORD_POINTS, [
            pointsResult('B', 9, 7),
            pointsResult('A', 8, 2),
        ]);
        expect(sec.entries.map((e) => e.ballIds[0])).toEqual(['A', 'B']);
        expect(sec.entries[0]).toMatchObject({ ballIds: ['A'], total: 8, holesPlayed: 2, paceDelta: 4, position: 1 });
        expect(sec.entries[1]).toMatchObject({ ballIds: ['B'], total: 9, holesPlayed: 7, paceDelta: -5, position: 2 });
    });

    test('equal thru → order is IDENTICAL to absolute-total order (uniform shift)', () => {
        const results = [
            pointsResult('lo', 28, 18),
            pointsResult('hi', 47, 18),
            pointsResult('mid', 30, 18),
        ];
        const paced = section(STABLEFORD_POINTS, results);
        const absolute = section(POINTS_NO_PACE, results);
        // Same ordering + same positions; pace only appends a delta.
        expect(paced.entries.map((e) => e.ballIds[0])).toEqual(absolute.entries.map((e) => e.ballIds[0]));
        expect(paced.entries.map((e) => e.position)).toEqual(absolute.entries.map((e) => e.position));
        expect(paced.entries.map((e) => e.ballIds[0])).toEqual(['hi', 'mid', 'lo']);
    });

    test('pace tie broken by absolute total; ties share a position', () => {
        // both -6 off pace: 30/18 vs 12/9. Tiebreak = higher absolute total first.
        const sec = section(STABLEFORD_POINTS, [
            pointsResult('short', 12, 9),
            pointsResult('full', 30, 18),
        ]);
        expect(sec.entries[0]!.ballIds[0]).toBe('full'); // higher total wins the tiebreak
        expect(sec.entries[0]!.paceDelta).toBe(-6);
        expect(sec.entries[1]!.paceDelta).toBe(-6);
        // equal pace key → shared position
        expect(sec.entries.map((e) => e.position)).toEqual([1, 1]);
    });

    test('a null total sorts last and carries no paceDelta', () => {
        const withNull: BallResult = {
            ballId: 'none',
            holes: [],
            totals: [{ scoringType: 'points', value: null }],
            holesPlayed: 3,
        };
        const sec = section(STABLEFORD_POINTS, [withNull, pointsResult('A', 4, 4)]);
        expect(sec.entries[0]!.ballIds[0]).toBe('A');
        expect(sec.entries[1]!.ballIds[0]).toBe('none');
        expect(sec.entries[1]!.paceDelta).toBeUndefined();
    });
});

describe('no-pace metrics are untouched', () => {
    test('a metric without a pace declaration ranks by absolute total, no paceDelta', () => {
        const sec = section(POINTS_NO_PACE, [
            pointsResult('B', 9, 7),
            pointsResult('A', 8, 2),
        ]);
        // absolute: 9 > 8 → B first (the OLD, buggy-for-live order — proves it's unchanged)
        expect(sec.entries.map((e) => e.ballIds[0])).toEqual(['B', 'A']);
        expect(sec.entries.every((e) => e.paceDelta === undefined)).toBe(true);
    });
});

describe('team-entry thru correctness', () => {
    test('paceDelta uses the TEAM result holesPlayed (best-ball thru), not a member count', () => {
        // A better-ball team's aggregate BallResult carries its own holesPlayed
        // (the count of holes the team has a best-ball on). Pace must key off
        // THAT, not the number of member balls.
        const teamThru2: BallResult = {
            ballId: 'team:Eagles',
            holes: [],
            totals: [{ scoringType: 'points', value: 8 }],
            holesPlayed: 2,
        };
        const teamThru7: BallResult = {
            ballId: 'team:Hawks',
            holes: [],
            totals: [{ scoringType: 'points', value: 9 }],
            holesPlayed: 7,
        };
        const ballIdsFor = (id: string) => (id === 'team:Eagles' ? ['a1', 'a2'] : ['b1', 'b2']);
        const [sec] = rankedSections(STABLEFORD_POINTS, [teamThru7, teamThru2], { ballIdsFor });
        // Eagles (8 thru 2, +4) beat Hawks (9 thru 7, -5); ballIds resolve to members.
        expect(sec!.entries[0]).toMatchObject({ ballIds: ['a1', 'a2'], paceDelta: 4, position: 1 });
        expect(sec!.entries[1]).toMatchObject({ ballIds: ['b1', 'b2'], paceDelta: -5, position: 2 });
    });
});

describe('stroke play to-par (pace: par)', () => {
    // Two par-4 columns; par-so-far is summed over each entry's scored holes.
    const columns: ResultColumn[] = [
        { playHoleId: 'h1', courseHoleNumber: 1, canonicalOrdinal: 1, occurrenceLabel: '1', par: 4, baseStrokeIndex: 1 },
        { playHoleId: 'h2', courseHoleNumber: 2, canonicalOrdinal: 2, occurrenceLabel: '2', par: 4, baseStrokeIndex: 2 },
    ];
    /** Stroke result: `scored` play-holes carry a non-null gross; total is the running sum. */
    function grossResult(ballId: string, total: number, scored: string[]): BallResult {
        return {
            ballId,
            holes: columns.map((c) => ({
                playHoleId: c.playHoleId,
                holeNumber: c.courseHoleNumber,
                gross: scored.includes(c.playHoleId) ? 4 : null,
                net: null,
                points: null,
            })),
            totals: [{ scoringType: 'gross', value: total }],
            holesPlayed: scored.length,
        };
    }

    test('to-par: fewer strokes thru 1 (−1) ranks above more strokes thru 2 (+1)', () => {
        // A: 3 strokes over 1 par-4 hole  → par-so-far 4 → paceDelta -1 (under par)
        // B: 9 strokes over 2 par-4 holes → par-so-far 8 → paceDelta +1 (over par)
        const sec = section(
            GROSS_TO_PAR,
            [grossResult('B', 9, ['h1', 'h2']), grossResult('A', 3, ['h1'])],
            columns,
        );
        expect(sec.entries[0]).toMatchObject({ ballIds: ['A'], total: 3, holesPlayed: 1, paceDelta: -1, position: 1 });
        expect(sec.entries[1]).toMatchObject({ ballIds: ['B'], total: 9, holesPlayed: 2, paceDelta: 1, position: 2 });
    });
});
