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
import { UMBRELLA_INDIVIDUAL_ID, umbrellaIndividual } from './umbrella-individual';
import { umbrellaIndividualPresenter } from './umbrella-individual.presenter';

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

describe('umbrellaIndividual (new contract)', () => {
    test('built-in plugin registers the umbrella individual presenter', () => {
        const plugin = BUILTIN_FORMAT_PLUGINS.find((p) => p.descriptor.id === UMBRELLA_INDIVIDUAL_ID)!;
        expect(plugin.renderResult).toBe(umbrellaIndividualPresenter);
    });

    test('presenter owns the category matrix cards and ranked points section', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        const b1 = makeOwnBall('P1', 0, 0);
        const b2 = makeOwnBall('P2', 0, 0);
        const b3 = makeOwnBall('P3', 0, 0);
        const result = umbrellaIndividual.score({
            roundContext: ctx,
            slotBalls: [b1, b2, b3],
            events: [
                makeScoreEvent(b1.ballId, 1, 3),
                makeScoreEvent(b2.ballId, 1, 4),
                makeScoreEvent(b3.ballId, 1, 4),
                metaEvent(b1.ballId, 1, 'fairway', true),
                metaEvent(b1.ballId, 1, 'gir', true),
            ],
        });
        const view = umbrellaIndividualPresenter({
            slotIndex: 0,
            slotDefId: 'slot-umbrella-individual',
            formatId: UMBRELLA_INDIVIDUAL_ID,
            formatLabel: 'Umbrella',
            scoringMode: 'umbrella',
            teamShape: 'individual',
            allowanceLabel: '100%',
            metrics: [{ id: 'points', label: 'Points', direction: 'high' }],
            runningNormalized: true,
            scoreGridComponentId: BUILTIN_FORMAT_PLUGINS.find((p) => p.descriptor.id === UMBRELLA_INDIVIDUAL_ID)!
                .descriptor.resultDisplay?.scoreGridComponentId,
            result,
            slotBalls: [b1, b2, b3],
            slotTeamGroupings: [],
            columns: ctx.playHoles.map((p) => ({
                playHoleId: p.playHoleId,
                courseHoleNumber: p.courseHoleNumber,
                canonicalOrdinal: p.ordinal,
                occurrenceLabel: ctx.occurrenceLabel(p.playHoleId),
                par: p.par,
                baseStrokeIndex: p.baseStrokeIndex,
            })),
        });

        expect(view.cards).toHaveLength(3);
        expect(view.cards[0]?.componentId).toBe('category-matrix-grid');
        expect(view.cards[0]?.rows.map((row) => row.label)).toEqual([
            'Low gross',
            'Fairway',
            'GIR',
            'Birdie',
            'Points',
            'Running',
        ]);
        expect(view.cards[0]?.caption).toBe(
            'Running totals are relative to the leader (the trailing team shows 0); per-hole points below are the raw points scored.',
        );
        expect(view.cards[0]?.totals).toEqual([{ label: 'points', value: 8 }]);
        expect(view.leaderboard).toEqual([
            {
                kind: 'ranked',
                metricId: 'points',
                metricLabel: 'Points',
                direction: 'high',
                entries: [
                    { ballIds: [b1.ballId], total: 8, holesPlayed: 1, position: 1 },
                    { ballIds: [b2.ballId], total: 0, holesPlayed: 1, position: 2 },
                    { ballIds: [b3.ballId], total: 0, holesPlayed: 1, position: 2 },
                ],
            },
        ]);
    });

    test('sweep on hole 1 doubles: LG+FWY+GIR+BIRD = 4×1×2 = 8', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        const b1 = makeOwnBall('P1', 0, 0);
        const b2 = makeOwnBall('P2', 0, 0);
        const b3 = makeOwnBall('P3', 0, 0);
        const events = [
            makeScoreEvent(b1.ballId, 1, 3), // birdie, LG
            makeScoreEvent(b2.ballId, 1, 4),
            makeScoreEvent(b3.ballId, 1, 4),
            metaEvent(b1.ballId, 1, 'fairway', true),
            metaEvent(b1.ballId, 1, 'gir', true),
        ];
        const { ballResults } = umbrellaIndividual.score({
            roundContext: ctx,
            slotBalls: [b1, b2, b3],
            events,
        });
        const h1 = ballResults[0].holes.find((h) => h.holeNumber === 1)!;
        expect(h1.points).toBe(8);
        expect(h1.note).toContain('☂');
    });

    test('distribution: multiplies by hole number; no-event = 0 points', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        const b1 = makeOwnBall('P1', 0, 0);
        const b2 = makeOwnBall('P2', 0, 0);
        const b3 = makeOwnBall('P3', 0, 0);
        // P1 makes LG on hole 7 only (no metadata, no birdie).
        const events = [
            makeScoreEvent(b1.ballId, 7, 4),
            makeScoreEvent(b2.ballId, 7, 5),
            makeScoreEvent(b3.ballId, 7, 5),
        ];
        const { ballResults } = umbrellaIndividual.score({
            roundContext: ctx,
            slotBalls: [b1, b2, b3],
            events,
        });
        const h7 = ballResults[0].holes.find((h) => h.holeNumber === 7)!;
        expect(h7.points).toBe(7); // 1 category × hole 7
        expect(ballResults[0].totals[0].value).toBe(7);
    });

    test('subject with no point-bearing holes gets no running row; scored subject still does', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        const b1 = makeOwnBall('P1', 0, 0);
        const b2 = makeOwnBall('P2', 0, 0);
        const b3 = makeOwnBall('P3', 0, 0);
        const scored = umbrellaIndividual.score({
            roundContext: ctx,
            slotBalls: [b1, b2, b3],
            events: [makeScoreEvent(b1.ballId, 1, 3), makeScoreEvent(b2.ballId, 1, 4)],
        });
        // Force b3 to be a non-point-bearing subject (all holes null) — the
        // umbrella scorer never emits this, but the BallResult contract allows
        // it (a ball added but not yet scored), and the presenter must guard it.
        const result = {
            ...scored,
            ballResults: scored.ballResults.map((r) =>
                r.ballId === b3.ballId ? { ...r, holes: r.holes.map((h) => ({ ...h, points: null })) } : r,
            ),
        };
        const view = umbrellaIndividualPresenter({
            slotIndex: 0,
            slotDefId: 'slot-umbrella-individual',
            formatId: UMBRELLA_INDIVIDUAL_ID,
            formatLabel: 'Umbrella',
            scoringMode: 'umbrella',
            teamShape: 'individual',
            allowanceLabel: '100%',
            metrics: [{ id: 'points', label: 'Points', direction: 'high' }],
            runningNormalized: true,
            result,
            slotBalls: [b1, b2, b3],
            slotTeamGroupings: [],
            columns: ctx.playHoles.map((p) => ({
                playHoleId: p.playHoleId,
                courseHoleNumber: p.courseHoleNumber,
                canonicalOrdinal: p.ordinal,
                occurrenceLabel: ctx.occurrenceLabel(p.playHoleId),
                par: p.par,
                baseStrokeIndex: p.baseStrokeIndex,
            })),
        });

        const cardFor = (ballId: string) => view.cards.find((c) => c.subjectBallIds[0] === ballId)!;
        expect(cardFor(b1.ballId).rows.some((row) => row.label === 'Running')).toBe(true);
        expect(cardFor(b3.ballId).rows.some((row) => row.label === 'Running')).toBe(false);
    });

    test('net birdie rule: uses net not gross when configured', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 18 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        // P1 PH 18 → 1 stroke per hole. Gross 4 on par 4 → net 3 → net birdie.
        const b1 = makeOwnBall('P1', 18, 18);
        const b2 = makeOwnBall('P2', 0, 0);
        const b3 = makeOwnBall('P3', 0, 0);
        const events = [
            makeScoreEvent(b1.ballId, 1, 4),
            makeScoreEvent(b2.ballId, 1, 4),
            makeScoreEvent(b3.ballId, 1, 4),
        ];
        const { ballResults } = umbrellaIndividual.score({
            roundContext: ctx,
            slotBalls: [b1, b2, b3],
            events,
            formatConfig: { birdieRule: 'net' },
        });
        const h1 = ballResults[0].holes.find((h) => h.holeNumber === 1)!;
        // P1: tied low-gross + net birdie = 2 categories × 1 = 2
        expect(h1.categories).toContain('Birdie');
        expect(h1.note).toContain('Birdie');
        expect(h1.points).toBe(2);
    });
});
