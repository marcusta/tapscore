import { describe, expect, test } from 'bun:test';

import {
    make18Holes,
    makeOwnBall,
    makeProducer,
    makeRoundContext,
    makeScoreEvent,
} from './_testkit';
import type { MetadataEvent } from '../types';
import { umbrellaIndividual } from './umbrella-individual';

function metaEvent(ballId: string, hole: number, type: string, value: unknown): MetadataEvent {
    return {
        kind: 'metadata',
        roundId: 'r',
        ballId,
        playHoleId: `ph-${hole}`,
        type,
        value,
        clientEventId: `m-${ballId}-${hole}-${type}`,
        recordedBy: 'tester',
        recordedAt: new Date(2025, 0, 1, 0, 0, 30 + hole).toISOString(),
    };
}

describe('umbrellaIndividual (new contract)', () => {
    test('sweep on hole 1 doubles: LG+FWY+GIR+BIRD = 4×1×2 = 8', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        const b1 = makeOwnBall('P1', 0, 0);
        const b2 = makeOwnBall('P2', 0, 0);
        const b3 = makeOwnBall('P3', 0, 0);
        const events = [
            makeScoreEvent(b1.ballId, 1, 3), // birdie, LG
            makeScoreEvent(b2.ballId, 1, 4),
            makeScoreEvent(b3.ballId, 1, 4),
            metaEvent(b1.ballId, 1, 'fairway', true),
            metaEvent(b1.ballId, 1, 'gir', true),
        ];
        const { ballResults } = umbrellaIndividual.score({
            roundContext: ctx,
            slotBalls: [b1, b2, b3],
            events,
        });
        const h1 = ballResults[0].holes.find((h) => h.holeNumber === 1)!;
        expect(h1.points).toBe(8);
        expect(h1.note).toContain('☂');
    });

    test('distribution: multiplies by hole number; no-event = 0 points', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        const b1 = makeOwnBall('P1', 0, 0);
        const b2 = makeOwnBall('P2', 0, 0);
        const b3 = makeOwnBall('P3', 0, 0);
        // P1 makes LG on hole 7 only (no metadata, no birdie).
        const events = [
            makeScoreEvent(b1.ballId, 7, 4),
            makeScoreEvent(b2.ballId, 7, 5),
            makeScoreEvent(b3.ballId, 7, 5),
        ];
        const { ballResults } = umbrellaIndividual.score({
            roundContext: ctx,
            slotBalls: [b1, b2, b3],
            events,
        });
        const h7 = ballResults[0].holes.find((h) => h.holeNumber === 7)!;
        expect(h7.points).toBe(7); // 1 category × hole 7
        expect(ballResults[0].totals[0].value).toBe(7);
    });

    test('net birdie rule: uses net not gross when configured', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 18 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        // P1 PH 18 → 1 stroke per hole. Gross 4 on par 4 → net 3 → net birdie.
        const b1 = makeOwnBall('P1', 18, 18);
        const b2 = makeOwnBall('P2', 0, 0);
        const b3 = makeOwnBall('P3', 0, 0);
        const events = [
            makeScoreEvent(b1.ballId, 1, 4),
            makeScoreEvent(b2.ballId, 1, 4),
            makeScoreEvent(b3.ballId, 1, 4),
        ];
        const { ballResults } = umbrellaIndividual.score({
            roundContext: ctx,
            slotBalls: [b1, b2, b3],
            events,
            formatConfig: { birdieRule: 'net' },
        });
        const h1 = ballResults[0].holes.find((h) => h.holeNumber === 1)!;
        // P1: tied low-gross + net birdie = 2 categories × 1 = 2
        expect(h1.categories).toContain('Birdie');
        expect(h1.note).toContain('Birdie');
        expect(h1.points).toBe(2);
    });
});
