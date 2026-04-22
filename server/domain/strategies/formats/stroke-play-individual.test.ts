import { describe, expect, test } from 'bun:test';

import {
    make18Holes,
    makeOwnBall,
    makeProducer,
    makeRoundContext,
    makeScoreEvent,
} from './_testkit';
import { strokePlayIndividual } from './stroke-play-individual';

describe('strokePlayIndividual (new contract)', () => {
    test('scratch player: gross = sum, net = sum, no incomplete', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [makeProducer('P1', { courseHandicap: 0 })]);
        const ball = makeOwnBall('P1', 0, 0);
        const events = courseHoles.map((h) => makeScoreEvent(ball.ballId, h.holeNumber, 4));
        const { ballResults } = strokePlayIndividual.score({
            roundContext: ctx,
            slotBalls: [ball],
            events,
        });
        expect(ballResults).toHaveLength(1);
        const r = ballResults[0];
        expect(r.totals).toEqual([
            { scoringType: 'gross', value: 72 },
            { scoringType: 'net', value: 72 },
        ]);
        expect(r.holesPlayed).toBe(18);
    });

    test('pickup on one hole voids totals but per-hole gross is net-double', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [makeProducer('P1', { courseHandicap: 0 })]);
        const ball = makeOwnBall('P1', 0, 0);
        const events = [
            ...courseHoles.slice(0, 17).map((h) => makeScoreEvent(ball.ballId, h.holeNumber, 4)),
            makeScoreEvent(ball.ballId, 18, 0),
        ];
        const { ballResults } = strokePlayIndividual.score({
            roundContext: ctx,
            slotBalls: [ball],
            events,
        });
        expect(ballResults[0].totals).toEqual([
            { scoringType: 'gross', value: null },
            { scoringType: 'net', value: null },
        ]);
        const pickupHole = ballResults[0].holes.find((h) => h.holeNumber === 18)!;
        // par 4 + 2 + 0 strokes given = 6
        expect(pickupHole.gross).toBe(6);
    });

    test('applies flat allowance in deriveSlotBalls', () => {
        const out = strokePlayIndividual.deriveSlotBalls({
            balls: [{ ballId: 'b', courseHandicapSnapshot: 20 }],
            allowanceConfig: { type: 'flat', pct: 95 },
        });
        expect(out).toEqual([{ ballId: 'b', playingHandicapSnapshot: 19 }]);
    });
});
