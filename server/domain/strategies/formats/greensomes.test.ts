import { describe, expect, test } from 'bun:test';

import { make18Holes, makeProducer, makeRoundContext, makeScoreEvent, makeTeamBall } from './_testkit';
import { greensomes } from './greensomes';

describe('greensomes (team-ball net stroke play)', () => {
    test('one net total across the pair ball; flat(100) allowance', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 9 }),
            makeProducer('P2', { courseHandicap: 16 }),
        ]);
        const teamCh = 12; // greensomes 60/40 of (9,16)
        const teamPh = 12; // flat(100)
        const ball = makeTeamBall(
            'ball-pair',
            [
                { producerDefId: 'P1', ch: 9 },
                { producerDefId: 'P2', ch: 16 },
            ],
            teamCh,
            teamPh,
        );
        const events = courseHoles.map((h) => makeScoreEvent(ball.ballId, h.holeNumber, 5));
        const { ballResults } = greensomes.score({ roundContext: ctx, slotBalls: [ball], events });
        expect(ballResults).toHaveLength(1);
        // 18 × 5 = 90 gross; net = 90 − 12 = 78
        expect(ballResults[0].totals.find((t) => t.scoringType === 'gross')?.value).toBe(90);
        expect(ballResults[0].totals.find((t) => t.scoringType === 'net')?.value).toBe(78);
    });

    test('deriveSlotBalls applies the flat allowance', () => {
        const out = greensomes.deriveSlotBalls({
            balls: [{ ballId: 'b', courseHandicapSnapshot: 12 }],
            allowanceConfig: { type: 'flat', pct: 100 },
        });
        expect(out[0].playingHandicapSnapshot).toBe(12);
    });

    test('ballRequirement: 2..2 team', () => {
        expect(greensomes.ballRequirement()).toEqual({
            producerCount: { min: 2, max: 2 },
            ballMode: 'team',
            requiresSlotTeamGrouping: false,
        });
    });
});
