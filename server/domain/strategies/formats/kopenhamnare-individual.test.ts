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
        // Raw 72/36/0; last is already 0, so normalisation is a no-op here.
        expect(ballResults[0].totals[0].value).toBe(72); // 4×18
        expect(ballResults[1].totals[0].value).toBe(36); // 2×18
        expect(ballResults[2].totals[0].value).toBe(0);
        // Per-hole points stay the raw distribution.
        expect(ballResults[0].holes[0].points).toBe(4);
        expect(ballResults[2].holes[0].points).toBe(0);
    });

    test('standings normalise to last place (raw gap above the lowest total)', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        const b1 = makeOwnBall('P1', 0, 0);
        const b2 = makeOwnBall('P2', 0, 0);
        const b3 = makeOwnBall('P3', 0, 0);
        // Holes 1-6: P1 best, P2 mid, P3 worst → 4/2/0.
        // Holes 7-18: P3 best, P2 mid, P1 worst → 0/2/4.
        // Raw totals: P1 = 6×4 = 24, P2 = 18×2 = 36, P3 = 12×4 = 48.
        // Normalised (− min 24): 0 / 12 / 24.
        const events = courseHoles.flatMap((h) =>
            h.holeNumber <= 6
                ? [
                      makeScoreEvent(b1.ballId, h.holeNumber, 3),
                      makeScoreEvent(b2.ballId, h.holeNumber, 4),
                      makeScoreEvent(b3.ballId, h.holeNumber, 5),
                  ]
                : [
                      makeScoreEvent(b1.ballId, h.holeNumber, 5),
                      makeScoreEvent(b2.ballId, h.holeNumber, 4),
                      makeScoreEvent(b3.ballId, h.holeNumber, 3),
                  ],
        );
        const { ballResults } = kopenhamnareIndividual.score({
            roundContext: ctx,
            slotBalls: [b1, b2, b3],
            events,
        });
        expect(ballResults.map((r) => r.totals[0].value)).toEqual([0, 12, 24]);
        // Every hole still distributed exactly 6 raw points across the three.
        for (let h = 0; h < 18; h++) {
            const sum = ballResults.reduce((acc, r) => acc + (r.holes[h].points ?? 0), 0);
            expect(sum).toBe(6);
        }
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
        // Raw 36/36/36 → normalised to last place → 0/0/0 (everyone tied).
        expect(ballResults[0].totals[0].value).toBe(0);
        expect(ballResults[1].totals[0].value).toBe(0);
        expect(ballResults[2].totals[0].value).toBe(0);
        // Per-hole still sums to 6 (2/2/2 raw).
        expect(ballResults.reduce((a, r) => a + (r.holes[0].points ?? 0), 0)).toBe(6);
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
