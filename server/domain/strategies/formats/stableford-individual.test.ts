import { describe, expect, test } from 'bun:test';

import {
    make18Holes,
    makeOwnBall,
    makeProducer,
    makeRoundContext,
    makeScoreEvent,
} from './_testkit';
import { stablefordIndividual } from './stableford-individual';

describe('stablefordIndividual (new contract)', () => {
    test('scratch: 36 points on every par-4 scored net-par', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [makeProducer('P1', { courseHandicap: 0 })]);
        const ball = makeOwnBall('P1', 0, 0);
        const events = courseHoles.map((h) => makeScoreEvent(ball.ballId, h.holeNumber, 4));
        const { ballResults } = stablefordIndividual.score({
            roundContext: ctx,
            slotBalls: [ball],
            events,
        });
        expect(ballResults[0].totals).toEqual([{ scoringType: 'points', value: 36 }]);
    });

    test('pickup → 0 pts this hole but total stays valid', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [makeProducer('P1', { courseHandicap: 0 })]);
        const ball = makeOwnBall('P1', 0, 0);
        const events = [
            makeScoreEvent(ball.ballId, 1, 0),
            makeScoreEvent(ball.ballId, 2, 4),
        ];
        const { ballResults } = stablefordIndividual.score({
            roundContext: ctx,
            slotBalls: [ball],
            events,
        });
        const h1 = ballResults[0].holes.find((h) => h.holeNumber === 1)!;
        const h2 = ballResults[0].holes.find((h) => h.holeNumber === 2)!;
        expect(h1.points).toBe(0);
        expect(h2.points).toBe(2);
        expect(ballResults[0].totals[0].value).toBe(2);
    });
});
