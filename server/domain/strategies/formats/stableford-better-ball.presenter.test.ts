import { describe, expect, test } from 'bun:test';

import {
    make18Holes,
    makeOwnBall,
    makeProducer,
    makeRoundContext,
    makeScoreEvent,
} from './_testkit';
import { STABLEFORD_BETTER_BALL_ID, stablefordBetterBall } from './stableford-better-ball';
import { stablefordBetterBallPresenter } from './stableford-better-ball.presenter';
import type { FormatResultInput } from '../result-presenter';
import type { RoundContext } from '../types';

function columnsFrom(ctx: RoundContext): FormatResultInput['columns'] {
    return ctx.playHoles.map((p) => ({
        playHoleId: p.playHoleId,
        courseHoleNumber: p.courseHoleNumber,
        canonicalOrdinal: p.ordinal,
        occurrenceLabel: ctx.occurrenceLabel(p.playHoleId),
        par: p.par,
        baseStrokeIndex: p.baseStrokeIndex,
    }));
}

describe('stablefordBetterBallPresenter — team of 3', () => {
    test('renders one team card with all three member rows + team points', () => {
        const courseHoles = make18Holes().slice(0, 2);
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        const bA = makeOwnBall('P1', 0, 0);
        const bB = makeOwnBall('P2', 0, 0);
        const bC = makeOwnBall('P3', 0, 0);
        const balls = [bA, bB, bC];
        const groupings = [{ teamLabel: 'T1', ballIds: [bA.ballId, bB.ballId, bC.ballId] }];

        // Hole 1: bogey / par / birdie → best-of-3 = 3. Hole 2: all par → 2.
        const result = stablefordBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events: [
                makeScoreEvent(bA.ballId, 1, 5),
                makeScoreEvent(bB.ballId, 1, 4),
                makeScoreEvent(bC.ballId, 1, 3),
                makeScoreEvent(bA.ballId, 2, 4),
                makeScoreEvent(bB.ballId, 2, 4),
                makeScoreEvent(bC.ballId, 2, 4),
            ],
        });

        const view = stablefordBetterBallPresenter({
            slotIndex: 0,
            slotDefId: 'slot-bb',
            formatId: STABLEFORD_BETTER_BALL_ID,
            formatLabel: 'Better-ball Stableford',
            scoringMode: 'stableford',
            teamShape: 'better_ball',
            allowanceLabel: '100%',
            metrics: [{ id: 'points', label: 'Points', direction: 'high' }],
            runningNormalized: false,
            scoreGridComponentId: undefined,
            result,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            columns: columnsFrom(ctx),
        });

        // One card for the single team; its subjects are all three member balls.
        expect(view.cards).toHaveLength(1);
        expect(view.cards[0]?.subjectBallIds).toEqual([bA.ballId, bB.ballId, bC.ballId]);
        expect(view.cards[0]?.title).toEqual({
            groups: [[bA.ballId, bB.ballId, bC.ballId]],
            joiner: ' & ',
        });

        // Each of the three members contributes its own Points row so the reader
        // sees which ball fed the best-ball pick; the emphasised Team points row
        // closes the card.
        const labels = view.cards[0]?.rows.map((r) => r.label) ?? [];
        expect(labels.filter((l) => l === 'Points')).toHaveLength(3);
        expect(labels).toContain('Team points');

        // Best-of-3: hole 1 team points = 3 (P3's birdie), hole 2 = 2.
        const teamPts = view.cards[0]?.rows.find((r) => r.label === 'Team points')?.cells;
        expect(teamPts?.map((c) => c.value)).toEqual([3, 2]);

        // Leaderboard resolves team:LABEL back to all three member ball ids.
        expect(view.leaderboard).toEqual([
            {
                kind: 'ranked',
                metricId: 'points',
                metricLabel: 'Points',
                direction: 'high',
                entries: [
                    {
                        ballIds: [bA.ballId, bB.ballId, bC.ballId],
                        total: 5,
                        holesPlayed: 2,
                        position: 1,
                    },
                ],
            },
        ]);
    });
});
