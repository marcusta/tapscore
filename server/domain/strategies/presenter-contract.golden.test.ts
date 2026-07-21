import { describe, expect, test } from 'bun:test';

import {
    make18Holes,
    makeOwnBall,
    makeProducer,
    makeRoundContext,
    makeScoreEvent,
} from './formats/_testkit';
import { matchPlayPresenter } from './formats/match-play.presenter';
import { MATCH_PLAY_INDIVIDUAL_ID, matchPlayIndividual } from './formats/match-play-individual';
import { STABLEFORD_INDIVIDUAL_ID, stablefordIndividual } from './formats/stableford-individual';
import { stablefordIndividualPresenter } from './formats/stableford-individual.presenter';
import { STROKE_PLAY_INDIVIDUAL_ID, strokePlayIndividual } from './formats/stroke-play-individual';
import { KOPENHAMNARE_INDIVIDUAL_ID, kopenhamnareIndividual } from './formats/kopenhamnare-individual';
import { kopenhamnareIndividualPresenter } from './formats/kopenhamnare-individual.presenter';
import { STABLEFORD_BETTER_BALL_ID, stablefordBetterBall } from './formats/stableford-better-ball';
import { defaultGridPresenter } from './formats/default-grid.presenter';
import { stablefordBetterBallPresenter } from './formats/stableford-better-ball.presenter';
import { UMBRELLA_4_BALL_ID, umbrella4Ball } from './formats/umbrella-4-ball';
import { umbrella4BallPresenter } from './formats/umbrella-4-ball.presenter';
import type { FormatResultInput } from './result-presenter';
import type { MetadataEvent, RoundContext } from './types';

const gridPresenter = defaultGridPresenter();

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

describe('presenter contract golden output', () => {
    test('keeps Stableford individual output unchanged', () => {
        const courseHoles = make18Holes().slice(0, 2);
        const ctx = makeRoundContext(courseHoles, [makeProducer('P1', { courseHandicap: 0 })]);
        const ball = makeOwnBall('P1', 0, 0);
        const result = stablefordIndividual.score({
            roundContext: ctx,
            slotBalls: [ball],
            events: [makeScoreEvent(ball.ballId, 1, 3), makeScoreEvent(ball.ballId, 2, 4)],
        });

        const view = stablefordIndividualPresenter({
            slotIndex: 0,
            slotDefId: 'slot-stableford',
            formatId: STABLEFORD_INDIVIDUAL_ID,
            formatLabel: 'Stableford',
            scoringMode: 'stableford',
            teamShape: 'individual',
            allowanceLabel: '100%',
            metrics: [{ id: 'points', label: 'Points', direction: 'high' }],
            runningNormalized: false,
            scoreGridComponentId: 'default-score-grid',
            result,
            slotBalls: [ball],
            slotTeamGroupings: [],
            columns: columnsFrom(ctx),
        });

        expect(view).toMatchObject({
            slotIndex: 0,
            slotDefId: 'slot-stableford',
            formatId: STABLEFORD_INDIVIDUAL_ID,
            cards: [
                {
                    kind: 'score_grid',
                    componentId: 'default-score-grid',
                    title: { groups: [[ball.ballId]], joiner: ' & ' },
                    subjectBallIds: [ball.ballId],
                    subtitleFacts: ['slot #0 · Stableford · 100%', 'CH 0', 'PH 0', 'holes played 2'],
                    totals: [],
                },
            ],
            leaderboard: [
                {
                    kind: 'ranked',
                    metricId: 'points',
                    entries: [{ ballIds: [ball.ballId], total: 5, holesPlayed: 2, position: 1 }],
                },
            ],
        });
        expect(view.cards[0]?.holes.map((hole) => hole.playHoleId)).toEqual(['ph-1', 'ph-2']);
        expect(view.cards[0]?.rows.map((row) => row.label)).toEqual([
            'Par',
            'SI',
            'Given',
            'Gross',
            'Net',
            'Points',
        ]);
        expect(view.cards[0]?.rows.find((row) => row.label === 'Gross')?.cells).toEqual([
            {
                playHoleId: 'ph-1',
                holeNumber: 1,
                value: 3,
                display: '3',
                marker: { template: 'ring', tone: 'success', label: 'Birdie (-1)' },
            },
            { playHoleId: 'ph-2', holeNumber: 2, value: 4, display: '4' },
        ]);
        expect(view.cards[0]?.rows.find((row) => row.label === 'Points')?.cells).toEqual([
            {
                playHoleId: 'ph-1',
                holeNumber: 1,
                value: 3,
                display: '3',
                title: '3 pts (netPar 4 − 3 = +1)',
            },
            {
                playHoleId: 'ph-2',
                holeNumber: 2,
                value: 2,
                display: '2',
                title: '2 pts (netPar 4 − 4 = +0)',
            },
        ]);
        expect(view.cards[0]?.footnotes).toEqual([
            'h1: 3 pts (netPar 4 − 3 = +1)',
            'h2: 2 pts (netPar 4 − 4 = +0)',
        ]);
    });

    test('keeps Umbrella team output unchanged', () => {
        const courseHoles = make18Holes().slice(0, 2);
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
        const balls = [bA1, bA2, bB1, bB2];
        const groupings = [
            { teamLabel: 'A', ballIds: [bA1.ballId, bA2.ballId] },
            { teamLabel: 'B', ballIds: [bB1.ballId, bB2.ballId] },
        ];
        const result = umbrella4Ball.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events: [
                makeScoreEvent(bA1.ballId, 1, 3),
                makeScoreEvent(bA2.ballId, 1, 4),
                makeScoreEvent(bB1.ballId, 1, 4),
                makeScoreEvent(bB2.ballId, 1, 5),
                metaEvent(bA1.ballId, 1, 'gir', true),
                metaEvent(bA2.ballId, 1, 'gir', true),
                makeScoreEvent(bA1.ballId, 2, 4),
                makeScoreEvent(bA2.ballId, 2, 4),
                makeScoreEvent(bB1.ballId, 2, 4),
                makeScoreEvent(bB2.ballId, 2, 4),
            ],
        });

        const view = umbrella4BallPresenter({
            slotIndex: 0,
            slotDefId: 'slot-umbrella',
            formatId: UMBRELLA_4_BALL_ID,
            formatLabel: 'Umbrella (4-ball)',
            scoringMode: 'umbrella',
            teamShape: 'four_ball',
            allowanceLabel: '100%',
            metrics: [{ id: 'points', label: 'Points', direction: 'high' }],
            runningNormalized: true,
            scoreGridComponentId: 'category-matrix-grid',
            result,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            columns: columnsFrom(ctx),
        });

        expect(view.cards).toHaveLength(2);
        expect(view.cards.map((card) => card.componentId)).toEqual([
            'category-matrix-grid',
            'category-matrix-grid',
        ]);
        expect(view.cards[0]).toMatchObject({
            title: { groups: [[bA1.ballId, bA2.ballId]], joiner: ' & ' },
            subjectBallIds: [bA1.ballId, bA2.ballId],
            subtitleFacts: ['slot #0 · Umbrella (4-ball) · 100%', 'holes played 2'],
            caption:
                'Running totals are relative to the leader (the trailing team shows 0); per-hole points below are the raw points scored.',
            totals: [{ label: 'points', value: 10 }],
        });
        expect(view.cards[0]?.rows.map((row) => row.label)).toEqual([
            'Low gross',
            'Low total',
            'GIR A',
            'GIR B',
            'Birdie',
            'Team points',
            'Running',
        ]);
        expect(view.cards[0]?.rows.find((row) => row.label === 'Team points')?.cells).toEqual([
            {
                playHoleId: 'ph-1',
                holeNumber: 1,
                value: 10,
                display: '10☂',
                title: 'LG + LT + GIR-A + GIR-B + BIRD = 5 × 1 × 2 = 10 ☂',
            },
            {
                playHoleId: 'ph-2',
                holeNumber: 2,
                value: 4,
                display: '4',
                title: 'LG + LT = 2 × 2 = 4',
            },
        ]);
        expect(view.cards[0]?.rows.find((row) => row.label === 'Running')?.cells).toEqual([
            { playHoleId: 'ph-1', holeNumber: 1, value: 10, display: '10' },
            { playHoleId: 'ph-2', holeNumber: 2, value: 10, display: '10' },
        ]);
        expect(view.cards[1]).toMatchObject({
            title: { groups: [[bB1.ballId, bB2.ballId]], joiner: ' & ' },
            subjectBallIds: [bB1.ballId, bB2.ballId],
            totals: [{ label: 'points', value: 0 }],
        });
        expect(view.leaderboard).toEqual([
            {
                kind: 'ranked',
                metricId: 'points',
                metricLabel: 'Points',
                direction: 'high',
                entries: [
                    { ballIds: [bA1.ballId, bA2.ballId], total: 10, holesPlayed: 2, position: 1 },
                    { ballIds: [bB1.ballId, bB2.ballId], total: 0, holesPlayed: 1, position: 2 },
                ],
            },
        ]);
    });

    test('keeps match-play output unchanged', () => {
        const courseHoles = make18Holes().slice(0, 2);
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
        ]);
        const bA = makeOwnBall('P1', 0, 0);
        const bB = makeOwnBall('P2', 0, 0);
        const result = matchPlayIndividual.score({
            roundContext: ctx,
            slotBalls: [bA, bB],
            events: [
                makeScoreEvent(bA.ballId, 1, 4),
                makeScoreEvent(bB.ballId, 1, 5),
                makeScoreEvent(bA.ballId, 2, 4),
                makeScoreEvent(bB.ballId, 2, 4),
            ],
        });

        const view = matchPlayPresenter()({
            slotIndex: 0,
            slotDefId: 'slot-match',
            formatId: MATCH_PLAY_INDIVIDUAL_ID,
            formatLabel: 'Match play',
            scoringMode: 'match_play',
            teamShape: 'individual',
            allowanceLabel: '100%',
            metrics: [],
            runningNormalized: false,
            scoreGridComponentId: 'compact-match-grid',
            result,
            slotBalls: [bA, bB],
            slotTeamGroupings: [],
            columns: columnsFrom(ctx),
        });

        expect(view.cards).toHaveLength(1);
        expect(view.cards[0]).toMatchObject({
            kind: 'score_grid',
            componentId: 'compact-match-grid',
            title: { groups: [], joiner: '' },
            subjectBallIds: [bA.ballId, bB.ballId],
            subtitleFacts: ['Match play · 100%'],
            totals: [],
        });
        expect(view.cards[0]?.rows.map((row) => row.label)).toEqual(['Par', '', '', 'Standing']);
        expect(view.cards[0]?.rows[1]).toMatchObject({
            subjectBallId: bA.ballId,
            kind: 'net',
            team: 'a',
            cells: [
                {
                    playHoleId: 'ph-1',
                    holeNumber: 1,
                    value: 4,
                    display: '4',
                    marker: { template: 'ring', tone: 'side_a', label: 'Hole won' },
                },
                { playHoleId: 'ph-2', holeNumber: 2, value: 4, display: '4' },
            ],
        });
        expect(view.cards[0]?.rows.find((row) => row.label === 'Standing')?.cells).toEqual([
            { playHoleId: 'ph-1', holeNumber: 1, value: null, display: '1', team: 'a' },
            { playHoleId: 'ph-2', holeNumber: 2, value: null, display: '1', team: 'a' },
        ]);
        expect(view.leaderboard).toEqual([
            {
                kind: 'match_summary',
                title: 'Match results',
                matches: [
                    {
                        sideA: { ballIds: [bA.ballId] },
                        sideB: { ballIds: [bB.ballId] },
                        leader: 'a',
                        magnitude: 1,
                        finished: true,
                        thru: 2,
                    },
                ],
            },
        ]);
    });

    test('stroke play individual: gross/net card, no points/running, ranked gross+net, no componentId', () => {
        const courseHoles = make18Holes().slice(0, 2);
        const ctx = makeRoundContext(courseHoles, [makeProducer('P1', { courseHandicap: 1 })]);
        const ball = makeOwnBall('P1', 1, 1);
        const result = strokePlayIndividual.score({
            roundContext: ctx,
            slotBalls: [ball],
            events: [makeScoreEvent(ball.ballId, 1, 4), makeScoreEvent(ball.ballId, 2, 5)],
        });

        const view = gridPresenter({
            slotIndex: 0,
            slotDefId: 'slot-stroke',
            formatId: STROKE_PLAY_INDIVIDUAL_ID,
            formatLabel: 'Stroke play',
            scoringMode: 'stroke_play',
            teamShape: 'individual',
            allowanceLabel: '100%',
            metrics: [
                { id: 'gross', label: 'Gross', direction: 'low' },
                { id: 'net', label: 'Net', direction: 'low' },
            ],
            runningNormalized: false,
            result,
            slotBalls: [ball],
            slotTeamGroupings: [],
            columns: columnsFrom(ctx),
        });

        // Default-grid formats omit componentId entirely (not 'default-score-grid').
        expect(view.cards).toHaveLength(1);
        expect('componentId' in view.cards[0]!).toBe(false);
        expect(view.cards[0]).toMatchObject({
            kind: 'score_grid',
            title: { groups: [[ball.ballId]], joiner: ' & ' },
            subjectBallIds: [ball.ballId],
            subtitleFacts: ['slot #0 · Stroke play · 100%', 'CH 1', 'PH 1', 'holes played 2'],
        });
        expect('caption' in view.cards[0]!).toBe(false);
        // No points row (stroke play bears no points), no running row (absolute totals).
        expect(view.cards[0]?.rows.map((row) => row.label)).toEqual(['Par', 'SI', 'Given', 'Gross', 'Net']);
        expect(view.leaderboard.map((s) => s.kind === 'ranked' && s.metricId)).toEqual(['gross', 'net']);
    });

    test('köpenhamnare individual: points + running rows, caption, normalized totals + leaderboard', () => {
        const courseHoles = make18Holes().slice(0, 2);
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        const b1 = makeOwnBall('P1', 0, 0);
        const b2 = makeOwnBall('P2', 0, 0);
        const b3 = makeOwnBall('P3', 0, 0);
        // Distinct topology each hole → raw 4/2/0; trailing player already 0 so
        // normalization (− min) is a no-op, but the running/caption machinery runs.
        const result = kopenhamnareIndividual.score({
            roundContext: ctx,
            slotBalls: [b1, b2, b3],
            events: [
                makeScoreEvent(b1.ballId, 1, 3),
                makeScoreEvent(b2.ballId, 1, 4),
                makeScoreEvent(b3.ballId, 1, 5),
                makeScoreEvent(b1.ballId, 2, 3),
                makeScoreEvent(b2.ballId, 2, 4),
                makeScoreEvent(b3.ballId, 2, 5),
            ],
        });

        const view = kopenhamnareIndividualPresenter({
            slotIndex: 0,
            slotDefId: 'slot-kopenhamnare',
            formatId: KOPENHAMNARE_INDIVIDUAL_ID,
            formatLabel: 'Split sixes',
            scoringMode: 'kopenhamnare',
            teamShape: 'individual',
            allowanceLabel: '100%',
            metrics: [{ id: 'points', label: 'Points', direction: 'high' }],
            runningNormalized: true,
            result,
            slotBalls: [b1, b2, b3],
            slotTeamGroupings: [],
            columns: columnsFrom(ctx),
        });

        expect(view.cards).toHaveLength(3);
        const leader = view.cards[0]!;
        expect('componentId' in leader).toBe(false);
        // Split sixes owns its view: the cumulative row is "Total" (not "Running")
        // and there is no card-footer total (it reads off the leaderboard).
        expect(leader.rows.map((row) => row.label)).toEqual([
            'Par',
            'SI',
            'Given',
            'Gross',
            'Net',
            'Points',
            'Total',
        ]);
        expect(leader.caption).toContain('relative to the leader');
        expect(leader.totals).toEqual([]);
        // No "holes played" subtitle fact for Split sixes.
        expect(leader.subtitleFacts.some((f) => f.startsWith('holes played'))).toBe(false);
        const ranked = view.leaderboard.find((s) => s.kind === 'ranked' && s.metricId === 'points');
        expect(ranked && ranked.kind === 'ranked' && ranked.entries.map((e) => e.total)).toEqual([8, 4, 0]);
    });

    test('Split sixes: the Total row is blank on unplayed holes (not carried forward)', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        const b1 = makeOwnBall('P1', 0, 0);
        const b2 = makeOwnBall('P2', 0, 0);
        const b3 = makeOwnBall('P3', 0, 0);
        // Only holes 1–2 played out of 18 — like a mid-round card.
        const result = kopenhamnareIndividual.score({
            roundContext: ctx,
            slotBalls: [b1, b2, b3],
            events: [
                makeScoreEvent(b1.ballId, 1, 3),
                makeScoreEvent(b2.ballId, 1, 4),
                makeScoreEvent(b3.ballId, 1, 5),
                makeScoreEvent(b1.ballId, 2, 3),
                makeScoreEvent(b2.ballId, 2, 4),
                makeScoreEvent(b3.ballId, 2, 5),
            ],
        });

        const view = kopenhamnareIndividualPresenter({
            slotIndex: 0,
            slotDefId: 'slot-kopenhamnare',
            formatId: KOPENHAMNARE_INDIVIDUAL_ID,
            formatLabel: 'Split sixes',
            scoringMode: 'kopenhamnare',
            teamShape: 'individual',
            allowanceLabel: '100%',
            metrics: [{ id: 'points', label: 'Points', direction: 'high' }],
            runningNormalized: true,
            result,
            slotBalls: [b1, b2, b3],
            slotTeamGroupings: [],
            columns: columnsFrom(ctx),
        });

        const total = view.cards[0]!.rows.find((row) => row.label === 'Total')!;
        // Holes 1–2 carry a value; holes 3–18 are blank (no carry-forward).
        expect(total.cells.slice(0, 2).every((c) => c.display !== '')).toBe(true);
        expect(total.cells.slice(2).every((c) => c.display === '' && c.value === null)).toBe(true);
    });

    test('stableford better-ball: team card with per-member rows, Team gross/net/points, running guard, team-resolved ranked', () => {
        const courseHoles = make18Holes().slice(0, 2);
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
        ]);
        const bA = makeOwnBall('P1', 0, 0);
        const bB = makeOwnBall('P2', 0, 0);
        const grouping = { teamLabel: 'T1', ballIds: [bA.ballId, bB.ballId] };
        const result = stablefordBetterBall.score({
            roundContext: ctx,
            slotBalls: [bA, bB],
            slotTeamGroupings: [grouping],
            events: [
                makeScoreEvent(bA.ballId, 1, 4),
                makeScoreEvent(bB.ballId, 1, 3),
                makeScoreEvent(bA.ballId, 2, 4),
                makeScoreEvent(bB.ballId, 2, 4),
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
            result,
            slotBalls: [bA, bB],
            slotTeamGroupings: [grouping],
            columns: columnsFrom(ctx),
        });

        expect(view.cards).toHaveLength(1);
        const card = view.cards[0]!;
        expect('componentId' in card).toBe(false);
        expect('caption' in card).toBe(false);
        expect(card).toMatchObject({
            kind: 'score_grid',
            title: { groups: [[bA.ballId, bB.ballId]], joiner: ' & ' },
            subjectBallIds: [bA.ballId, bB.ballId],
            // Team cards carry no CH/PH facts.
            subtitleFacts: ['slot #0 · Better-ball Stableford · 100%', 'holes played 2'],
        });
        // Par/SI, then each member's Given/Gross/Points, then team rows. No
        // running row (absolute totals → the Phase D guard drops it).
        expect(card.rows.map((row) => row.label)).toEqual([
            'Par',
            'SI',
            'Given',
            'Gross',
            'Points',
            'Given',
            'Gross',
            'Points',
            'Team gross',
            'Team net',
            'Team points',
        ]);
        // Leaderboard resolves team:T1 back to the member ballIds.
        expect(view.leaderboard).toEqual([
            {
                kind: 'ranked',
                metricId: 'points',
                metricLabel: 'Points',
                direction: 'high',
                entries: [{ ballIds: [bA.ballId, bB.ballId], total: 5, holesPlayed: 2, position: 1 }],
            },
        ]);
    });
});
