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

        expect(ballResults).toHaveLength(1);
        expect(ballResults[0].ballId).toBe('team:T1');
        // 17 holes @ 2 pts + 1 hole @ 3 pts = 37
        expect(ballResults[0].totals).toEqual([{ scoringType: 'points', value: 37 }]);

        const h1 = ballResults[0].holes.find((h) => h.holeNumber === 1)!;
        expect(h1.points).toBe(3);
        expect(h1.gross).toBe(3);
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

        const h1 = ballResults[0].holes.find((h) => h.holeNumber === 1)!;
        expect(h1.points).toBe(2);
    });

    test('ballRequirement declares team grouping 2..2', () => {
        const req = stablefordBetterBall.ballRequirement();
        expect(req.requiresSlotTeamGrouping).toBe(true);
        expect(req.slotTeamGrouping?.teamSize).toEqual({ min: 2, max: 2 });
    });
});
