import { describe, expect, test } from 'bun:test';

import {
    make18Holes,
    makeOwnBall,
    makeProducer,
    makeRoundContext,
    makeScoreEvent,
} from './_testkit';
import { matchPlayIndividual } from './match-play-individual';

describe('matchPlayIndividual (new contract)', () => {
    test('halved match: scratch vs scratch, all pars → AS', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
        ]);
        const bA = makeOwnBall('P1', 0, 0);
        const bB = makeOwnBall('P2', 0, 0);
        const events = courseHoles.flatMap((h) => [
            makeScoreEvent(bA.ballId, h.holeNumber, 4),
            makeScoreEvent(bB.ballId, h.holeNumber, 4),
        ]);
        const { pairResults } = matchPlayIndividual.score({
            roundContext: ctx,
            slotBalls: [bA, bB],
            events,
        });
        expect(pairResults).toHaveLength(1);
        expect(pairResults![0].summary).toBe('AS');
        expect(pairResults![0].result).toBe('halved');
        expect(pairResults![0].winner).toBeNull();
    });

    test('early closeout: A wins holes 1..10 → 10&8 after hole 10', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
        ]);
        const bA = makeOwnBall('P1', 0, 0);
        const bB = makeOwnBall('P2', 0, 0);
        const events = courseHoles.flatMap((h) => [
            makeScoreEvent(bA.ballId, h.holeNumber, 4),
            makeScoreEvent(bB.ballId, h.holeNumber, 5),
        ]);
        const { pairResults } = matchPlayIndividual.score({
            roundContext: ctx,
            slotBalls: [bA, bB],
            events,
        });
        expect(pairResults![0].summary).toBe('10 & 8');
        expect(pairResults![0].result).toBe('won');
        expect(pairResults![0].winner).toBe(bA.ballId);
    });

    test('match-play handicap differential: PH 2 vs PH 14 → 0 vs 12 effective', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 2 }),
            makeProducer('P2', { courseHandicap: 14 }),
        ]);
        // Both make par everywhere. B gets strokes on SI 1..12 (baseline 0, extras 12).
        // With strokes, B wins SI1..12, halves SI13..18. leadA = 0 − 12 = −12. Closeout when |lead|>remaining: after hole 12 lead=−12, remaining=6 → closeout.
        const bA = makeOwnBall('P1', 2, 2);
        const bB = makeOwnBall('P2', 14, 14);
        const events = courseHoles.flatMap((h) => [
            makeScoreEvent(bA.ballId, h.holeNumber, 4),
            makeScoreEvent(bB.ballId, h.holeNumber, 4),
        ]);
        const { pairResults } = matchPlayIndividual.score({
            roundContext: ctx,
            slotBalls: [bA, bB],
            events,
        });
        expect(pairResults![0].result).toBe('lost');
        expect(pairResults![0].winner).toBe(bB.ballId);
        // At hole 7: B up 7, remaining 11. Not closeout. Keep going... B wins holes 1..7 (+1 each), SI 1..7 all give stroke. After hole 7 lead=-7, remaining=11, no closeout. After hole 9 lead=-9, rem=9, dormie for B. Continue: hole 10-12 B still wins. At hole 10 lead=-10, rem=8 → closeout.
        expect(pairResults![0].summary).toBe('10 & 8');
    });

    test('pickup: side produces null net; hole stays undecided (legacy semantics)', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
        ]);
        const bA = makeOwnBall('P1', 0, 0);
        const bB = makeOwnBall('P2', 0, 0);
        const events = [
            makeScoreEvent(bA.ballId, 1, 0),
            makeScoreEvent(bB.ballId, 1, 5),
        ];
        const { pairResults } = matchPlayIndividual.score({
            roundContext: ctx,
            slotBalls: [bA, bB],
            events,
        });
        const h1 = pairResults![0].holes.find((h) => h.holeNumber === 1)!;
        expect(h1.status).toBeNull();
        expect(h1.fromA).toBeNull();
        expect(h1.fromB).toBe(5);
    });

    test('odd singleton: 3 balls → 1 pair + 1 stranded', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        const bA = makeOwnBall('P1', 0, 0);
        const bB = makeOwnBall('P2', 0, 0);
        const bC = makeOwnBall('P3', 0, 0);
        const { ballResults, pairResults } = matchPlayIndividual.score({
            roundContext: ctx,
            slotBalls: [bA, bB, bC],
            events: [],
        });
        expect(pairResults).toHaveLength(1);
        expect(ballResults).toHaveLength(3);
        const stranded = ballResults.find((r) => r.ballId === bC.ballId)!;
        expect(stranded.holes.every((h) => h.note === 'no opponent')).toBe(true);
    });
});
