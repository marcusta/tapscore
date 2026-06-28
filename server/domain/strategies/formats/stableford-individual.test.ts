import { describe, expect, test } from 'bun:test';

import {
    make18Holes,
    makeOwnBall,
    makeProducer,
    makeRoundContext,
    makeScoreEvent,
} from './_testkit';
import { BUILTIN_FORMAT_PLUGINS } from '../../formats/builtins';
import { buildSlotResult } from '../result-builder';
import { STABLEFORD_INDIVIDUAL_ID, stablefordIndividual } from './stableford-individual';

describe('stablefordIndividual (new contract)', () => {
    test('result view emits the default score grid component id', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [makeProducer('P1', { courseHandicap: 0 })]);
        const ball = makeOwnBall('P1', 0, 0);
        const result = stablefordIndividual.score({
            roundContext: ctx,
            slotBalls: [ball],
            events: [makeScoreEvent(ball.ballId, 1, 3)],
        });

        const view = buildSlotResult({
            slotIndex: 0,
            slotDefId: 'slot-stableford',
            formatId: STABLEFORD_INDIVIDUAL_ID,
            formatLabel: 'Stableford',
            scoringMode: 'stableford',
            teamShape: 'individual',
            allowanceLabel: '100%',
            metrics: [{ id: 'points', label: 'Points', direction: 'high' }],
            runningNormalized: false,
            scoreGridComponentId: BUILTIN_FORMAT_PLUGINS.find((p) => p.descriptor.id === STABLEFORD_INDIVIDUAL_ID)!
                .descriptor.resultDisplay?.scoreGridComponentId,
            result,
            slotBalls: [ball],
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

        expect(view.cards).toHaveLength(1);
        expect(view.cards[0]?.componentId).toBe('default-score-grid');
        expect(view.cards[0]?.rows.map((row) => row.label)).toEqual([
            'Par',
            'SI',
            'Given',
            'Gross',
            'Net',
            'Points',
        ]);
        expect(view.cards[0]?.rows.find((row) => row.label === 'Gross')?.cells[0]?.marker).toEqual({
            template: 'ring',
            tone: 'success',
            label: 'Birdie (-1)',
        });
        expect(view.cards[0]?.totals).toEqual([{ label: 'points', value: 3 }]);
    });

    test('scratch: 36 points on every par-4 scored net-par', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [makeProducer('P1', { courseHandicap: 0 })]);
        const ball = makeOwnBall('P1', 0, 0);
        const events = courseHoles.map((h) => makeScoreEvent(ball.ballId, h.holeNumber, 4));
        const { ballResults } = stablefordIndividual.score({
            roundContext: ctx,
            slotBalls: [ball],
            events,
        });
        expect(ballResults[0].totals).toEqual([{ scoringType: 'points', value: 36 }]);
    });

    test('pickup → 0 pts this hole but total stays valid', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [makeProducer('P1', { courseHandicap: 0 })]);
        const ball = makeOwnBall('P1', 0, 0);
        const events = [
            makeScoreEvent(ball.ballId, 1, 0),
            makeScoreEvent(ball.ballId, 2, 4),
        ];
        const { ballResults } = stablefordIndividual.score({
            roundContext: ctx,
            slotBalls: [ball],
            events,
        });
        const h1 = ballResults[0].holes.find((h) => h.holeNumber === 1)!;
        const h2 = ballResults[0].holes.find((h) => h.holeNumber === 2)!;
        expect(h1.points).toBe(0);
        expect(h2.points).toBe(2);
        expect(ballResults[0].totals[0].value).toBe(2);
    });
});
