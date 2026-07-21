import { describe, expect, test } from 'bun:test';

import {
    make18Holes,
    makeOwnBall,
    makeProducer,
    makeRoundContext,
    makeScoreEvent,
} from './_testkit';
import type { MetadataEvent } from '../types';
import { BUILTIN_FORMAT_PLUGINS } from '../../formats/builtins';
import { UMBRELLA_4_BALL_ID, umbrella4Ball } from './umbrella-4-ball';
import { umbrella4BallPresenter } from './umbrella-4-ball.presenter';

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

describe('umbrella4Ball (new contract)', () => {
    test('built-in plugin registers the umbrella 4-ball presenter', () => {
        const plugin = BUILTIN_FORMAT_PLUGINS.find((p) => p.descriptor.id === UMBRELLA_4_BALL_ID)!;
        expect(plugin.renderResult).toBe(umbrella4BallPresenter);
    });

    test('presenter owns the team category matrix cards and ranked points section', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
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
            scoreGridComponentId: BUILTIN_FORMAT_PLUGINS.find((p) => p.descriptor.id === UMBRELLA_4_BALL_ID)!
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

        expect(view.cards).toHaveLength(2);
        expect(view.cards[0]?.componentId).toBe('category-matrix-grid');
        expect(view.cards[0]?.title).toEqual({ groups: [[bA1.ballId, bA2.ballId]], joiner: ' & ' });
        expect(view.cards[0]?.subjectBallIds).toEqual([bA1.ballId, bA2.ballId]);
        expect(view.cards[0]?.subtitleFacts).toEqual(['slot #0 · Umbrella (4-ball) · 100%', 'holes played 1']);
        expect(view.cards[0]?.subtitleFacts.join(' ')).not.toContain('CH ');
        expect(view.cards[0]?.subtitleFacts.join(' ')).not.toContain('PH ');
        expect(view.cards[0]?.rows.map((row) => row.label)).toEqual([
            'Low gross',
            'Low total',
            'GIR A',
            'GIR B',
            'Birdie',
            'Team points',
            'Running',
        ]);
        expect(view.cards[0]?.caption).toBe(
            'Running totals are relative to the leader (the trailing team shows 0); per-hole points below are the raw points scored.',
        );
        expect(view.leaderboard).toEqual([
            {
                kind: 'ranked',
                metricId: 'points',
                metricLabel: 'Points',
                direction: 'high',
                entries: [
                    { ballIds: [bA1.ballId, bA2.ballId], total: 10, holesPlayed: 1, position: 1 },
                    { ballIds: [bB1.ballId, bB2.ballId], total: 0, holesPlayed: 0, position: 2 },
                ],
            },
        ]);
    });

    test('team with no point-bearing holes gets no running row; scored team still does', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2] = balls;
        const scored = umbrella4Ball.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events: [makeScoreEvent(bA1.ballId, 1, 3), makeScoreEvent(bA2.ballId, 1, 4)],
        });
        // Force team B to be a non-point-bearing subject (all holes null) — the
        // umbrella scorer never emits this, but the BallResult contract allows
        // it (a team added but not yet scored), and the presenter must guard it.
        const result = {
            ...scored,
            ballResults: scored.ballResults.map((r) =>
                r.ballId === 'team:B' ? { ...r, holes: r.holes.map((h) => ({ ...h, points: null })) } : r,
            ),
        };
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

        const cardFor = (teamBallIds: string[]) =>
            view.cards.find((c) => c.subjectBallIds[0] === teamBallIds[0])!;
        expect(cardFor(groupings[0].ballIds).rows.some((row) => row.label === 'Running')).toBe(true);
        expect(cardFor(groupings[1].ballIds).rows.some((row) => row.label === 'Running')).toBe(false);
    });

    test('sweep (all 5) doubles hole points', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        // Hole 1: A has LG (birdie 3 by A1), LT (7 < 9), both GIRs, birdie.
        const events = [
            makeScoreEvent(bA1.ballId, 1, 3), // birdie
            makeScoreEvent(bA2.ballId, 1, 4),
            makeScoreEvent(bB1.ballId, 1, 4),
            makeScoreEvent(bB2.ballId, 1, 5),
            metaEvent(bA1.ballId, 1, 'gir', true),
            metaEvent(bA2.ballId, 1, 'gir', true),
        ];
        const { ballResults } = umbrella4Ball.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const teamA = ballResults.find((r) => r.ballId === 'team:A')!;
        const h1 = teamA.holes.find((h) => h.holeNumber === 1)!;
        expect(h1.points).toBe(10); // 5 × 1 × 2
        expect(h1.note).toContain('☂');
    });

    test('tied LG/LT: both teams score the category', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        // Hole 3: A1=4,A2=4 (team 8); B1=4,B2=4 (team 8). minGross=4 shared. LG both=1, LT both=1. No GIR, no birdie.
        const events = [
            makeScoreEvent(bA1.ballId, 3, 4),
            makeScoreEvent(bA2.ballId, 3, 4),
            makeScoreEvent(bB1.ballId, 3, 4),
            makeScoreEvent(bB2.ballId, 3, 4),
        ];
        const { ballResults } = umbrella4Ball.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const teamA = ballResults.find((r) => r.ballId === 'team:A')!;
        const h3 = teamA.holes.find((h) => h.holeNumber === 3)!;
        expect(h3.points).toBe(6); // LG+LT = 2 × 3
        const teamB = ballResults.find((r) => r.ballId === 'team:B')!;
        expect(teamB.holes.find((h) => h.holeNumber === 3)!.points).toBe(6);
    });

    test('normalized total: trailing team → 0, leader carries gap', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        // Hole 1 A wins LG+LT = 2 × 1 = 2. Everything else nothing.
        const events = [
            makeScoreEvent(bA1.ballId, 1, 3),
            makeScoreEvent(bA2.ballId, 1, 4),
            makeScoreEvent(bB1.ballId, 1, 5),
            makeScoreEvent(bB2.ballId, 1, 6),
        ];
        const { ballResults } = umbrella4Ball.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const teamA = ballResults.find((r) => r.ballId === 'team:A')!;
        const teamB = ballResults.find((r) => r.ballId === 'team:B')!;
        // A raw = 2 (LG+LT)+ extras from bird = 3 × 1 = 3. B raw = 0.
        // Normalized: A = 3, B = 0.
        expect(teamA.totals[0].value).toBe(3);
        expect(teamB.totals[0].value).toBe(0);
    });
});
