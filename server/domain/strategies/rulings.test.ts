import { describe, expect, test } from 'bun:test';

import { applyRulingsToSlot, rulingEventsOf } from './rulings';
import type { BallResult, RulingEvent, StrategyEvent, StrategyResult } from './types';

function ruling(partial: Partial<RulingEvent>): RulingEvent {
    return {
        kind: 'ruling',
        roundId: 'r1',
        target: 'ball_total',
        targetId: 'ball-1',
        rulingKind: 'penalty_strokes',
        value: { strokes: 2 },
        reason: 'test',
        recordedBy: 'admin',
        recordedAt: '2026-06-10T10:00:00Z',
        ...partial,
    };
}

function result(balls: BallResult[]): StrategyResult {
    return { ballResults: balls };
}

const ball1: BallResult = {
    ballId: 'ball-1',
    holes: [
        { holeNumber: 1, playHoleId: 'ph-1', gross: 5, net: 4, points: null },
        { holeNumber: 2, playHoleId: 'ph-2', gross: 4, net: 4, points: null },
    ],
    totals: [
        { scoringType: 'gross', value: 9 },
        { scoringType: 'net', value: 8 },
        { scoringType: 'points', value: 3 },
    ],
    holesPlayed: 2,
};

describe('applyRulingsToSlot', () => {
    test('penalty_strokes ball_total adds to stroke totals only, leaves holes raw', () => {
        const { result: out, applied } = applyRulingsToSlot(
            result([ball1]),
            [ruling({ value: { strokes: 2 } })],
            'slot-0',
        );
        const b = out.ballResults[0];
        expect(b.totals.find((t) => t.scoringType === 'gross')!.value).toBe(11);
        expect(b.totals.find((t) => t.scoringType === 'net')!.value).toBe(10);
        // Points are NOT adjusted by raw stroke penalties.
        expect(b.totals.find((t) => t.scoringType === 'points')!.value).toBe(3);
        // Per-hole grid stays raw.
        expect(b.holes[0].gross).toBe(5);
        expect(applied).toHaveLength(1);
        expect(applied[0].strokes).toBe(2);
    });

    test('penalty_strokes ball_hole bumps that hole AND the totals', () => {
        const { result: out } = applyRulingsToSlot(
            result([ball1]),
            [ruling({ target: 'ball_hole', targetId: 'ball-1:ph-1', value: { strokes: 1 } })],
            'slot-0',
        );
        const b = out.ballResults[0];
        expect(b.holes[0].gross).toBe(6);
        expect(b.holes[1].gross).toBe(4);
        expect(b.totals.find((t) => t.scoringType === 'gross')!.value).toBe(10);
    });

    test('dq nulls every total', () => {
        const { result: out } = applyRulingsToSlot(
            result([ball1]),
            [ruling({ rulingKind: 'dq', value: { disqualified: true } })],
            'slot-0',
        );
        expect(out.ballResults[0].totals.every((t) => t.value === null)).toBe(true);
    });

    test('slot_ball_result targets only the matching slot', () => {
        const events = [ruling({ target: 'slot_ball_result', targetId: 'slot-9:ball-1', value: { strokes: 5 } })];
        const other = applyRulingsToSlot(result([ball1]), events, 'slot-0');
        expect(other.applied).toHaveLength(0);
        const match = applyRulingsToSlot(result([ball1]), events, 'slot-9');
        expect(match.applied).toHaveLength(1);
        expect(match.result.ballResults[0].totals.find((t) => t.scoringType === 'gross')!.value).toBe(14);
    });

    test('rulingEventsOf filters the event union', () => {
        const events: StrategyEvent[] = [
            { kind: 'score', roundId: 'r1', ballId: 'ball-1', playHoleId: 'ph-1', strokes: 5, clientEventId: 'c1', recordedBy: 'a', recordedAt: 't' },
            ruling({}),
        ];
        expect(rulingEventsOf(events)).toHaveLength(1);
    });
});
