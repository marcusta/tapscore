import { describe, expect, test } from 'bun:test';

import {
    make18Holes,
    makeOwnBall,
    makeProducer,
    makeRoundContext,
    makeScoreEvent,
} from './_testkit';
import { kopenhamnareIndividual } from './kopenhamnare-individual';

describe('kopenhamnareIndividual (new contract)', () => {
    test('all distinct topology: 4/2/0 per hole', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        const b1 = makeOwnBall('P1', 0, 0);
        const b2 = makeOwnBall('P2', 0, 0);
        const b3 = makeOwnBall('P3', 0, 0);
        const events = courseHoles.flatMap((h) => [
            makeScoreEvent(b1.ballId, h.holeNumber, 3),
            makeScoreEvent(b2.ballId, h.holeNumber, 4),
            makeScoreEvent(b3.ballId, h.holeNumber, 5),
        ]);
        const { ballResults } = kopenhamnareIndividual.score({
            roundContext: ctx,
            slotBalls: [b1, b2, b3],
            events,
        });
        expect(ballResults[0].totals[0].value).toBe(72); // 4×18
        expect(ballResults[1].totals[0].value).toBe(36); // 2×18
        expect(ballResults[2].totals[0].value).toBe(0);
    });

    test('delta_from_min mode: low PH plays 0; hole sums = 6', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        const b1 = makeOwnBall('P1', 0, 0);
        const b2 = makeOwnBall('P2', 18, 18);
        const b3 = makeOwnBall('P3', 36, 36);
        const events = courseHoles.flatMap((h) => [
            makeScoreEvent(b1.ballId, h.holeNumber, 4),
            makeScoreEvent(b2.ballId, h.holeNumber, 5),
            makeScoreEvent(b3.ballId, h.holeNumber, 6),
        ]);
        const { ballResults } = kopenhamnareIndividual.score({
            roundContext: ctx,
            slotBalls: [b1, b2, b3],
            events,
            formatConfig: { handicapMode: 'delta_from_min' },
        });
        // Under delta_from_min: effPH = [0, 18, 36]. Each hole net: 4, 5-1=4, 6-2=4 → all equal → 2/2/2.
        expect(ballResults[0].totals[0].value).toBe(36);
        expect(ballResults[1].totals[0].value).toBe(36);
        expect(ballResults[2].totals[0].value).toBe(36);
    });

    test('rejects non-3 ball counts', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
        ]);
        expect(() =>
            kopenhamnareIndividual.score({
                roundContext: ctx,
                slotBalls: [makeOwnBall('P1', 0, 0), makeOwnBall('P2', 0, 0)],
                events: [],
            }),
        ).toThrow(/exactly 3 balls/);
    });
});
