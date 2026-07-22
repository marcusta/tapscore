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
import { MATCH_PLAY_BETTER_BALL_ID, matchPlayBetterBall } from './match-play-better-ball';

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

describe('matchPlayBetterBall (new contract)', () => {
    test('result view emits the compact match grid component id', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        const result = matchPlayBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events: [
                makeScoreEvent(bA1.ballId, 1, 4),
                makeScoreEvent(bA2.ballId, 1, 5),
                makeScoreEvent(bB1.ballId, 1, 5),
                makeScoreEvent(bB2.ballId, 1, 5),
            ],
        });

        const view = presenter({
            slotIndex: 0,
            slotDefId: 'slot-match-bb',
            formatId: MATCH_PLAY_BETTER_BALL_ID,
            formatLabel: 'Better-ball match play',
            scoringMode: 'match_play',
            teamShape: 'better_ball',
            allowanceLabel: '100%',
            metrics: [],
            runningNormalized: false,
            scoreGridComponentId: BUILTIN_FORMAT_PLUGINS.find((p) => p.descriptor.id === MATCH_PLAY_BETTER_BALL_ID)!
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
        // One titleless card, four net rows (2 per side) framed by Par/Standing.
        expect(view.cards).toHaveLength(1);
        expect(view.cards[0]?.title).toEqual({ groups: [], joiner: '' });
        expect(view.cards[0]?.rows.map((row) => row.label)).toEqual(['Par', '', '', '', '', 'Standing']);
        expect(view.cards[0]?.totals).toEqual([]);
        // A single match-summary leaderboard section: A 1-up thru 1, in progress.
        expect(view.leaderboard).toEqual([
            {
                kind: 'match_summary',
                title: 'Match results',
                matches: [
                    {
                        sideA: { ballIds: [bA1.ballId, bA2.ballId] },
                        sideB: { ballIds: [bB1.ballId, bB2.ballId] },
                        leader: 'a',
                        magnitude: 1,
                        finished: false,
                        thru: 1,
                    },
                ],
            },
        ]);
    });

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

    test('teams of 3: best-ball is lowest net across all three side members', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
            makeProducer('P4', { courseHandicap: 0 }),
            makeProducer('P5', { courseHandicap: 0 }),
            makeProducer('P6', { courseHandicap: 0 }),
        ]);
        const a = [makeOwnBall('P1', 0, 0), makeOwnBall('P2', 0, 0), makeOwnBall('P3', 0, 0)];
        const b = [makeOwnBall('P4', 0, 0), makeOwnBall('P5', 0, 0), makeOwnBall('P6', 0, 0)];
        const groupings = [
            { teamLabel: 'A', ballIds: a.map((x) => x.ballId) },
            { teamLabel: 'B', ballIds: b.map((x) => x.ballId) },
        ];

        // Every hole: side A's THIRD member pars (4) while A's other two bogey;
        // all three of B bogey (5). A's best ball (4) beats B's best ball (5).
        const events = courseHoles.flatMap((h) => [
            makeScoreEvent(a[0].ballId, h.holeNumber, 5),
            makeScoreEvent(a[1].ballId, h.holeNumber, 5),
            makeScoreEvent(a[2].ballId, h.holeNumber, 4),
            makeScoreEvent(b[0].ballId, h.holeNumber, 5),
            makeScoreEvent(b[1].ballId, h.holeNumber, 5),
            makeScoreEvent(b[2].ballId, h.holeNumber, 5),
        ]);

        const { ballResults, pairResults } = matchPlayBetterBall.score({
            roundContext: ctx,
            slotBalls: [...a, ...b],
            slotTeamGroupings: groupings,
            events,
        });

        // Six per-ball results (3 per side); the pair carries all three ids per side.
        expect(ballResults).toHaveLength(6);
        expect(pairResults![0].sideA.ballIds).toEqual(a.map((x) => x.ballId));
        expect(pairResults![0].sideB.ballIds).toEqual(b.map((x) => x.ballId));

        // A wins every hole on best-ball → closed out 10 & 8.
        expect(pairResults![0].result).toBe('won');
        expect(pairResults![0].winner).toBe('A');
        expect(pairResults![0].summary).toBe('10 & 8');

        // Hole 1: A's better ball 4, B's better ball 5.
        const h1 = pairResults![0].holes.find((h) => h.holeNumber === 1)!;
        expect(h1.status).toBe('won');
        expect(h1.fromA).toBe(4);
        expect(h1.fromB).toBe(5);

        // A's third member (the par) decided the hole — carried on the pair
        // hole for the presenter's highlight, never as a ball-hole marker.
        expect(h1.decidingBallId).toBe(a[2].ballId);
        const markedH1 = ballResults
            .filter((r) => r.holes.find((h) => h.holeNumber === 1 && h.marker))
            .map((r) => r.ballId);
        expect(markedH1).toEqual([]);
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
