import { describe, expect, test } from 'bun:test';

import {
    make18Holes,
    makeOwnBall,
    makeProducer,
    makeRoundContext,
    makeScoreEvent,
} from './_testkit';
import { stablefordBetterBall } from './stableford-better-ball';

describe('stablefordBetterBall (new contract)', () => {
    test('best-ball selection: team points = max of two per-ball points per hole', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
        ]);
        const ballA = makeOwnBall('P1', 0, 0);
        const ballB = makeOwnBall('P2', 0, 0);

        // P1 makes par (2 pts) every hole; P2 makes birdie (3 pts) on hole 1, par elsewhere.
        const events = [
            ...courseHoles.map((h) => makeScoreEvent(ballA.ballId, h.holeNumber, 4)),
            makeScoreEvent(ballB.ballId, 1, 3),
            ...courseHoles.slice(1).map((h) => makeScoreEvent(ballB.ballId, h.holeNumber, 4)),
        ];

        const { ballResults } = stablefordBetterBall.score({
            roundContext: ctx,
            slotBalls: [ballA, ballB],
            slotTeamGroupings: [{ teamLabel: 'T1', ballIds: [ballA.ballId, ballB.ballId] }],
            events,
        });

        // New contract: each producer's own-ball result is emitted (no totals,
        // so it stays out of the leaderboard) followed by the team aggregate.
        expect(ballResults).toHaveLength(3);
        const teamResult = ballResults.find((r) => r.ballId === 'team:T1')!;
        const p1Result = ballResults.find((r) => r.ballId === ballA.ballId)!;
        const p2Result = ballResults.find((r) => r.ballId === ballB.ballId)!;
        expect(p1Result.totals).toEqual([]);
        expect(p2Result.totals).toEqual([]);

        // 17 holes @ 2 pts + 1 hole @ 3 pts = 37
        expect(teamResult.totals).toEqual([{ scoringType: 'points', value: 37 }]);

        const teamH1 = teamResult.holes.find((h) => h.holeNumber === 1)!;
        expect(teamH1.points).toBe(3); // best of the two balls
        expect(teamH1.gross).toBe(3);
        // Both producers are represented per hole: P1 par (2), P2 birdie (3).
        expect(p1Result.holes.find((h) => h.holeNumber === 1)!.points).toBe(2);
        expect(p2Result.holes.find((h) => h.holeNumber === 1)!.points).toBe(3);
    });

    test('pickup on one ball: team takes other ball\'s points', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
        ]);
        const ballA = makeOwnBall('P1', 0, 0);
        const ballB = makeOwnBall('P2', 0, 0);

        const events = [
            makeScoreEvent(ballA.ballId, 1, 0), // pickup → 0 pts
            makeScoreEvent(ballB.ballId, 1, 4), // par → 2 pts
        ];

        const { ballResults } = stablefordBetterBall.score({
            roundContext: ctx,
            slotBalls: [ballA, ballB],
            slotTeamGroupings: [{ teamLabel: 'T1', ballIds: [ballA.ballId, ballB.ballId] }],
            events,
        });

        const teamResult = ballResults.find((r) => r.ballId === 'team:T1')!;
        expect(teamResult.holes.find((h) => h.holeNumber === 1)!.points).toBe(2);
        // The pickup ball scores 0; the team takes the other ball's 2.
        const p1Result = ballResults.find((r) => r.ballId === ballA.ballId)!;
        const p2Result = ballResults.find((r) => r.ballId === ballB.ballId)!;
        expect(p1Result.holes.find((h) => h.holeNumber === 1)!.points).toBe(0);
        expect(p2Result.holes.find((h) => h.holeNumber === 1)!.points).toBe(2);
    });

    test('ballRequirement declares team grouping 2..10 (best-ball generalises)', () => {
        const req = stablefordBetterBall.ballRequirement();
        expect(req.requiresSlotTeamGrouping).toBe(true);
        expect(req.slotTeamGrouping?.teamSize).toEqual({ min: 2, max: 10 });
    });

    test('teams of 3: best-of-3 stableford per hole across all three balls', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        const ballA = makeOwnBall('P1', 0, 0);
        const ballB = makeOwnBall('P2', 0, 0);
        const ballC = makeOwnBall('P3', 0, 0);

        // Hole 1: P1 bogey (5 → 1pt), P2 par (4 → 2pt), P3 birdie (3 → 3pt).
        //   → team best = 3 (P3). Holes 2..18: all three par (2pt) → team 2.
        const events = [
            makeScoreEvent(ballA.ballId, 1, 5),
            makeScoreEvent(ballB.ballId, 1, 4),
            makeScoreEvent(ballC.ballId, 1, 3),
            ...courseHoles.slice(1).flatMap((h) => [
                makeScoreEvent(ballA.ballId, h.holeNumber, 4),
                makeScoreEvent(ballB.ballId, h.holeNumber, 4),
                makeScoreEvent(ballC.ballId, h.holeNumber, 4),
            ]),
        ];

        const { ballResults } = stablefordBetterBall.score({
            roundContext: ctx,
            slotBalls: [ballA, ballB, ballC],
            slotTeamGroupings: [
                { teamLabel: 'T1', ballIds: [ballA.ballId, ballB.ballId, ballC.ballId] },
            ],
            events,
        });

        // 3 own-ball results (no totals) + 1 team aggregate.
        expect(ballResults).toHaveLength(4);
        const teamResult = ballResults.find((r) => r.ballId === 'team:T1')!;
        expect(ballResults.filter((r) => r.ballId.startsWith('team:'))).toHaveLength(1);
        for (const bid of [ballA.ballId, ballB.ballId, ballC.ballId]) {
            expect(ballResults.find((r) => r.ballId === bid)!.totals).toEqual([]);
        }

        const teamH1 = teamResult.holes.find((h) => h.holeNumber === 1)!;
        expect(teamH1.points).toBe(3); // best-of-3: P3's birdie
        expect(teamH1.gross).toBe(3); // min gross across the three balls

        // Every producer's own per-hole line is present on hole 1.
        expect(ballResults.find((r) => r.ballId === ballA.ballId)!.holes.find((h) => h.holeNumber === 1)!.points).toBe(1);
        expect(ballResults.find((r) => r.ballId === ballB.ballId)!.holes.find((h) => h.holeNumber === 1)!.points).toBe(2);
        expect(ballResults.find((r) => r.ballId === ballC.ballId)!.holes.find((h) => h.holeNumber === 1)!.points).toBe(3);

        // Team total: hole 1 @ 3 pts + 17 holes @ 2 pts = 37.
        expect(teamResult.totals).toEqual([{ scoringType: 'points', value: 37 }]);
    });
});
