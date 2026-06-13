// Phase 2.6b-final / Slice 3c — RoundContext occurrence + group resolution.

import { test, expect } from 'bun:test';
import { createRoundContext, type RoundContextParts } from './round-context';
import type { PlayHoleSnapshot, ProducerSnapshot } from './types';

function occ(ordinal: number, courseHoleNumber: number, baseStrokeIndex: number): PlayHoleSnapshot {
    return {
        playHoleId: `ph-${ordinal}`,
        playHoleDefId: `ph-${ordinal}`,
        ordinal,
        courseHoleNumber,
        par: 4,
        baseStrokeIndex,
        tees: [],
    };
}

const PRODUCER: ProducerSnapshot = {
    producerDefId: 'p1',
    playerRef: { kind: 'player', id: 'player-1' },
    displayName: 'P1',
    handicapIndex: 10,
    tee: { teeId: 'tee-1', teeName: 'White', courseRating: 72, slope: 113, teePar: 72 },
    courseHandicap: 10,
};

function ctx(parts: Partial<RoundContextParts> & { playHoles: PlayHoleSnapshot[] }) {
    return createRoundContext({
        allocationCycleSize: 18,
        producers: new Map([[PRODUCER.producerDefId, PRODUCER]]),
        courseHoles: [],
        teeHoles: new Map(),
        ballGroupStart: new Map(),
        ...parts,
    });
}

test('shotgun start rotates the played order to the group start occurrence', async () => {
    const full = Array.from({ length: 18 }, (_, i) => occ(i + 1, i + 1, i + 1));
    const rc = ctx({
        playHoles: full,
        ballGroupStart: new Map([['ball-A', 'ph-5']]),
    });

    // Group A starts on occurrence 5 (hole 5): played order wraps 5..18,1..4.
    const order = rc.playedOrderForBall('ball-A').map((p) => p.courseHoleNumber);
    expect(order).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 1, 2, 3, 4]);
    expect(rc.playedOrdinalFor('ball-A', 'ph-5')).toBe(1);
    expect(rc.playedOrdinalFor('ball-A', 'ph-4')).toBe(18);

    // A ball with no group membership keeps canonical order.
    expect(rc.playedOrderForBall('ball-Z').map((p) => p.ordinal)).toEqual(
        full.map((p) => p.ordinal),
    );
    expect(rc.playedOrdinalFor('ball-Z', 'ph-5')).toBe(5);
});

test('occurrence labels distinguish repeated visits; unique holes stay bare', () => {
    // Route 1,2,1,2,3 → hole 1 & 2 repeat, hole 3 once.
    const playHoles = [
        occ(1, 1, 1),
        occ(2, 2, 2),
        occ(3, 1, 3),
        occ(4, 2, 4),
        occ(5, 3, 5),
    ];
    const rc = ctx({ playHoles });
    expect(rc.occurrenceLabel('ph-1')).toBe('1 (1st)');
    expect(rc.occurrenceLabel('ph-3')).toBe('1 (2nd)');
    expect(rc.occurrenceLabel('ph-2')).toBe('2 (1st)');
    expect(rc.occurrenceLabel('ph-4')).toBe('2 (2nd)');
    expect(rc.occurrenceLabel('ph-5')).toBe('3');
});

test('effective SI uses the occurrence base SI (and its frozen value per visit)', () => {
    const playHoles = [occ(1, 1, 1), occ(2, 1, 11)]; // same hole, distinct SI per visit
    const rc = ctx({ playHoles });
    expect(rc.effectiveStrokeIndexForPlayHole('p1', 'ph-1')).toBe(1);
    expect(rc.effectiveStrokeIndexForPlayHole('p1', 'ph-2')).toBe(11);
    expect(rc.parForPlayHole('ph-1')).toBe(4);
    expect(rc.canonicalOrdinalForPlayHole('ph-2')).toBe(2);
    expect(rc.courseHoleNumberForPlayHole('ph-2')).toBe(1);
});
