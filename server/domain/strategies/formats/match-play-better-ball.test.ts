import { describe, expect, test } from 'bun:test';

import {
    make18Holes,
    makeOwnBall,
    makeProducer,
    makeRoundContext,
    makeScoreEvent,
} from './_testkit';
import { matchPlayBetterBall } from './match-play-better-ball';

describe('matchPlayBetterBall (new contract)', () => {
    test('team-vs-team: A wins with lower better-ball', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
            makeProducer('P4', { courseHandicap: 0 }),
        ]);
        const bA1 = makeOwnBall('P1', 0, 0);
        const bA2 = makeOwnBall('P2', 0, 0);
        const bB1 = makeOwnBall('P3', 0, 0);
        const bB2 = makeOwnBall('P4', 0, 0);
        // A better-ball wins every hole: A has one par, B both bogey.
        const events = courseHoles.flatMap((h) => [
            makeScoreEvent(bA1.ballId, h.holeNumber, 4),
            makeScoreEvent(bA2.ballId, h.holeNumber, 5),
            makeScoreEvent(bB1.ballId, h.holeNumber, 5),
            makeScoreEvent(bB2.ballId, h.holeNumber, 5),
        ]);
        const { pairResults } = matchPlayBetterBall.score({
            roundContext: ctx,
            slotBalls: [bA1, bA2, bB1, bB2],
            slotTeamGroupings: [
                { teamLabel: 'A', ballIds: [bA1.ballId, bA2.ballId] },
                { teamLabel: 'B', ballIds: [bB1.ballId, bB2.ballId] },
            ],
            events,
        });
        expect(pairResults![0].result).toBe('won');
        expect(pairResults![0].winner).toBe('A');
        expect(pairResults![0].summary).toBe('10 & 8');
    });

    test('tied nets → halved hole', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
            makeProducer('P4', { courseHandicap: 0 }),
        ]);
        const bA1 = makeOwnBall('P1', 0, 0);
        const bA2 = makeOwnBall('P2', 0, 0);
        const bB1 = makeOwnBall('P3', 0, 0);
        const bB2 = makeOwnBall('P4', 0, 0);
        const events = [
            makeScoreEvent(bA1.ballId, 1, 4),
            makeScoreEvent(bA2.ballId, 1, 5),
            makeScoreEvent(bB1.ballId, 1, 4),
            makeScoreEvent(bB2.ballId, 1, 6),
        ];
        const { pairResults } = matchPlayBetterBall.score({
            roundContext: ctx,
            slotBalls: [bA1, bA2, bB1, bB2],
            slotTeamGroupings: [
                { teamLabel: 'A', ballIds: [bA1.ballId, bA2.ballId] },
                { teamLabel: 'B', ballIds: [bB1.ballId, bB2.ballId] },
            ],
            events,
        });
        const h1 = pairResults![0].holes.find((h) => h.holeNumber === 1)!;
        expect(h1.status).toBe('halved');
    });

    test('no-ball forfeit: B both pick up, A has ball → A wins hole', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
            makeProducer('P4', { courseHandicap: 0 }),
        ]);
        const bA1 = makeOwnBall('P1', 0, 0);
        const bA2 = makeOwnBall('P2', 0, 0);
        const bB1 = makeOwnBall('P3', 0, 0);
        const bB2 = makeOwnBall('P4', 0, 0);
        const events = [
            makeScoreEvent(bA1.ballId, 1, 4),
            makeScoreEvent(bA2.ballId, 1, 5),
            makeScoreEvent(bB1.ballId, 1, 0),
            makeScoreEvent(bB2.ballId, 1, 0),
        ];
        const { pairResults } = matchPlayBetterBall.score({
            roundContext: ctx,
            slotBalls: [bA1, bA2, bB1, bB2],
            slotTeamGroupings: [
                { teamLabel: 'A', ballIds: [bA1.ballId, bA2.ballId] },
                { teamLabel: 'B', ballIds: [bB1.ballId, bB2.ballId] },
            ],
            events,
        });
        const h1 = pairResults![0].holes.find((h) => h.holeNumber === 1)!;
        expect(h1.status).toBe('won');
        expect(h1.note).toContain('no ball');
    });
});
