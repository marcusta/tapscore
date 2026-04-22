import { describe, expect, test } from 'bun:test';

import {
    make18Holes,
    makeProducer,
    makeRoundContext,
    makeScoreEvent,
    makeTeamBall,
} from './_testkit';
import { strokePlayFoursomes } from './stroke-play-foursomes';

describe('strokePlayFoursomes (new contract)', () => {
    test('team-ball: one net total across both producers; flat(50) allowance', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 10 }),
            makeProducer('P2', { courseHandicap: 20 }),
        ]);
        const teamCh = 15;
        const teamPh = 8; // flat(50) of 15 rounds to 8
        const ball = makeTeamBall(
            'ball-pair',
            [
                { producerDefId: 'P1', ch: 10 },
                { producerDefId: 'P2', ch: 20 },
            ],
            teamCh,
            teamPh,
        );
        const events = courseHoles.map((h) => makeScoreEvent(ball.ballId, h.holeNumber, 4));
        const { ballResults } = strokePlayFoursomes.score({
            roundContext: ctx,
            slotBalls: [ball],
            events,
        });
        expect(ballResults).toHaveLength(1);
        expect(ballResults[0].totals.find((t) => t.scoringType === 'gross')?.value).toBe(72);
        expect(ballResults[0].totals.find((t) => t.scoringType === 'net')?.value).toBe(72 - teamPh);
    });

    test('deriveSlotBalls applies flat(50)', () => {
        const out = strokePlayFoursomes.deriveSlotBalls({
            balls: [{ ballId: 'b', courseHandicapSnapshot: 18 }],
            allowanceConfig: { type: 'flat', pct: 50 },
        });
        expect(out[0].playingHandicapSnapshot).toBe(9);
    });

    test('ballRequirement: 2..2 team', () => {
        expect(strokePlayFoursomes.ballRequirement()).toEqual({
            producerCount: { min: 2, max: 2 },
            ballMode: 'team',
            requiresSlotTeamGrouping: false,
        });
    });
});
