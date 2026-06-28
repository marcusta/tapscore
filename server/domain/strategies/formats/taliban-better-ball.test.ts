import { describe, expect, test } from 'bun:test';

import {
    make18Holes,
    makeOwnBall,
    makeProducer,
    makeRoundContext,
    makeScoreEvent,
} from './_testkit';
import { BUILTIN_FORMAT_PLUGINS } from '../../formats/builtins';
import { matchPlayPresenter } from './match-play.presenter';
import { TALIBAN_BETTER_BALL_ID, talibanBetterBall } from './taliban-better-ball';

const presenter = matchPlayPresenter();

function setup() {
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
    return {
        courseHoles,
        ctx,
        balls: [bA1, bA2, bB1, bB2],
        groupings: [
            { teamLabel: 'A', ballIds: [bA1.ballId, bA2.ballId] },
            { teamLabel: 'B', ballIds: [bB1.ballId, bB2.ballId] },
        ],
    };
}

describe('talibanBetterBall (new contract)', () => {
    test('result view emits the compact match grid component id', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        const result = talibanBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events: [
                makeScoreEvent(bA1.ballId, 1, 4),
                makeScoreEvent(bA2.ballId, 1, 4),
                makeScoreEvent(bB1.ballId, 1, 5),
                makeScoreEvent(bB2.ballId, 1, 5),
            ],
        });

        const view = presenter({
            slotIndex: 0,
            slotDefId: 'slot-taliban',
            formatId: TALIBAN_BETTER_BALL_ID,
            formatLabel: 'Taliban',
            scoringMode: 'taliban',
            teamShape: 'better_ball',
            allowanceLabel: '90%',
            metrics: [],
            runningNormalized: false,
            scoreGridComponentId: BUILTIN_FORMAT_PLUGINS.find((p) => p.descriptor.id === TALIBAN_BETTER_BALL_ID)!
                .descriptor.resultDisplay?.scoreGridComponentId,
            result,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            columns: ctx.playHoles.map((p) => ({
                playHoleId: p.playHoleId,
                courseHoleNumber: p.courseHoleNumber,
                canonicalOrdinal: p.ordinal,
                occurrenceLabel: ctx.occurrenceLabel(p.playHoleId),
                par: p.par,
                baseStrokeIndex: p.baseStrokeIndex,
            })),
        });

        expect(view.cards[0]?.componentId).toBe('compact-match-grid');
        // Better-ball pairing: ONE titleless card whose subjects are all four
        // balls, with one net row per member per side (2 + 2) framed by Par/Standing.
        expect(view.cards).toHaveLength(1);
        expect(view.cards[0]?.title).toEqual({ groups: [], joiner: '' });
        expect(view.cards[0]?.subjectBallIds).toEqual([bA1.ballId, bA2.ballId, bB1.ballId, bB2.ballId]);
        expect(view.cards[0]?.subtitleFacts).toEqual(['Taliban · 90%']);
        expect(view.cards[0]?.totals).toEqual([]);
        expect(view.cards[0]?.rows.map((row) => row.label)).toEqual(['Par', '', '', '', '', 'Standing']);
        // A single match-summary leaderboard section, sides resolved to members.
        expect(view.leaderboard).toHaveLength(1);
        const summary = view.leaderboard[0];
        expect(summary?.kind).toBe('match_summary');
        if (summary?.kind === 'match_summary') {
            expect(summary.matches).toHaveLength(1);
            expect(summary.matches[0]).toMatchObject({
                sideA: { ballIds: [bA1.ballId, bA2.ballId] },
                sideB: { ballIds: [bB1.ballId, bB2.ballId] },
                leader: 'a',
                finished: false,
                thru: 1,
            });
        }
    });

    test('worse-ball tiebreaker: tied better-balls → worse-ball decides', () => {
        const { ctx, balls, groupings, courseHoles } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        // Hole 1: A = {4,5} better 4 worse 5; B = {4,6} better 4 worse 6 → A wins worse-ball.
        const events = [
            makeScoreEvent(bA1.ballId, 1, 4),
            makeScoreEvent(bA2.ballId, 1, 5),
            makeScoreEvent(bB1.ballId, 1, 4),
            makeScoreEvent(bB2.ballId, 1, 6),
            ...courseHoles.slice(1).flatMap((h) => [
                makeScoreEvent(bA1.ballId, h.holeNumber, 4),
                makeScoreEvent(bA2.ballId, h.holeNumber, 4),
                makeScoreEvent(bB1.ballId, h.holeNumber, 4),
                makeScoreEvent(bB2.ballId, h.holeNumber, 4),
            ]),
        ];
        const { pairResults } = talibanBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const h1 = pairResults![0].holes.find((h) => h.holeNumber === 1)!;
        expect(h1.status).toBe('won');
        expect(h1.note).toContain('worse-ball');
        expect(h1.pointsDelta).toBe(1);
    });

    test('down-team eagle: team B down 1 makes eagle → +5', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        // Hole 1: A wins normally (4 vs 5) → A +1, B down 1.
        // Hole 2: B scores eagle 2 (par 4) → B wins with gross eagle while down → +5.
        const events = [
            makeScoreEvent(bA1.ballId, 1, 4),
            makeScoreEvent(bA2.ballId, 1, 4),
            makeScoreEvent(bB1.ballId, 1, 5),
            makeScoreEvent(bB2.ballId, 1, 5),
            makeScoreEvent(bA1.ballId, 2, 4),
            makeScoreEvent(bA2.ballId, 2, 4),
            makeScoreEvent(bB1.ballId, 2, 2),
            makeScoreEvent(bB2.ballId, 2, 4),
        ];
        const { pairResults } = talibanBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const h2 = pairResults![0].holes.find((h) => h.holeNumber === 2)!;
        expect(h2.status).toBe('lost');
        expect(h2.pointsDelta).toBe(-5);
        expect(h2.note).toContain('down-team eagle');
    });

    test('birdie while level → +1 (the comeback bonus applies only when behind)', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        // Hole 1: all square entering. A makes birdie 3 and wins → +1 (level, no bonus).
        const events = [
            makeScoreEvent(bA1.ballId, 1, 3),
            makeScoreEvent(bA2.ballId, 1, 4),
            makeScoreEvent(bB1.ballId, 1, 4),
            makeScoreEvent(bB2.ballId, 1, 5),
        ];
        const { pairResults } = talibanBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const h1 = pairResults![0].holes.find((h) => h.holeNumber === 1)!;
        expect(h1.status).toBe('won');
        expect(h1.pointsDelta).toBe(1);
    });

    test('down-team birdie → +2', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        // Hole 1: A wins normally (4 vs 5) → A +1, B down 1.
        // Hole 2: B (down 1) makes birdie 3 and wins → +2.
        const events = [
            makeScoreEvent(bA1.ballId, 1, 4),
            makeScoreEvent(bA2.ballId, 1, 4),
            makeScoreEvent(bB1.ballId, 1, 5),
            makeScoreEvent(bB2.ballId, 1, 5),
            makeScoreEvent(bA1.ballId, 2, 4),
            makeScoreEvent(bA2.ballId, 2, 4),
            makeScoreEvent(bB1.ballId, 2, 3),
            makeScoreEvent(bB2.ballId, 2, 4),
        ];
        const { pairResults } = talibanBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const h2 = pairResults![0].holes.find((h) => h.holeNumber === 2)!;
        expect(h2.status).toBe('lost'); // B won the hole → A's perspective is "lost"
        expect(h2.pointsDelta).toBe(-2);
        expect(h2.note).toContain('down-team birdie');
    });

    test('ballRequirement: 4 balls, 2 teams of 2', () => {
        const req = talibanBetterBall.ballRequirement();
        expect(req.slotBallCount).toEqual({ min: 4, max: 4 });
        expect(req.slotTeamGrouping).toEqual({
            teamCount: { min: 2, max: 2 },
            teamSize: { min: 2, max: 2 },
        });
    });
});
