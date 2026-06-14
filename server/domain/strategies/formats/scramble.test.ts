import { describe, expect, test } from 'bun:test';

import { make18Holes, makeProducer, makeRoundContext, makeScoreEvent, makeTeamBall } from './_testkit';
import { scramble } from './scramble';

describe('scramble (team-ball net stroke play)', () => {
    test('4-player team ball: one net total; flat(100)', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 5 }),
            makeProducer('P2', { courseHandicap: 10 }),
            makeProducer('P3', { courseHandicap: 15 }),
            makeProducer('P4', { courseHandicap: 20 }),
        ]);
        const teamCh = 8; // by_rank [25,20,15,10] of (5,10,15,20)
        const teamPh = 8;
        const ball = makeTeamBall(
            'ball-team',
            [
                { producerDefId: 'P1', ch: 5 },
                { producerDefId: 'P2', ch: 10 },
                { producerDefId: 'P3', ch: 15 },
                { producerDefId: 'P4', ch: 20 },
            ],
            teamCh,
            teamPh,
        );
        const events = courseHoles.map((h) => makeScoreEvent(ball.ballId, h.holeNumber, 4));
        const { ballResults } = scramble.score({ roundContext: ctx, slotBalls: [ball], events });
        expect(ballResults).toHaveLength(1);
        // 18 × 4 = 72 gross; net = 72 − 8 = 64
        expect(ballResults[0].totals.find((t) => t.scoringType === 'gross')?.value).toBe(72);
        expect(ballResults[0].totals.find((t) => t.scoringType === 'net')?.value).toBe(64);
    });

    test('2-player team ball also scores', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 10 }),
            makeProducer('P2', { courseHandicap: 20 }),
        ]);
        const ball = makeTeamBall(
            'ball-2',
            [
                { producerDefId: 'P1', ch: 10 },
                { producerDefId: 'P2', ch: 20 },
            ],
            7,
            7,
        );
        const events = courseHoles.map((h) => makeScoreEvent(ball.ballId, h.holeNumber, 4));
        const { ballResults } = scramble.score({ roundContext: ctx, slotBalls: [ball], events });
        expect(ballResults[0].totals.find((t) => t.scoringType === 'net')?.value).toBe(72 - 7);
    });

    test('ballRequirement: 2..4 team', () => {
        expect(scramble.ballRequirement()).toEqual({
            producerCount: { min: 2, max: 4 },
            ballMode: 'team',
            requiresSlotTeamGrouping: false,
        });
    });
});
