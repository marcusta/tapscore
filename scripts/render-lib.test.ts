import { expect, test } from 'bun:test';
import type { ScorecardHole } from '../server/services/scorecard.service';
import type { BallProducerInfo } from './render-lib';
import { formatSlotSummary, pairSideScorecardRows } from './render-lib';

function producer(overrides: Partial<BallProducerInfo>): BallProducerInfo {
    return {
        producerDefId: 'prod-1',
        playerId: null,
        guestPlayerId: null,
        displayName: 'test',
        handicapIndexSnapshot: null,
        courseHandicapSnapshot: null,
        teeId: null,
        teeNameSnapshot: null,
        ...overrides,
    };
}

function hole(
    holeNumber: number,
    overrides: Partial<ScorecardHole> = {},
): ScorecardHole {
    return {
        holeNumber,
        strokes: 4,
        recordedBy: null,
        recordedAt: '2026-04-20T12:00:00.000Z',
        sourcePlayerId: null,
        sourceGuestPlayerId: null,
        metadata: null,
        ...overrides,
    };
}

test('pairSideScorecardRows keeps null-source rows for match-play individual', () => {
    const rows = [
        hole(1),
        hole(2),
        hole(3, { sourcePlayerId: 'alice' }),
    ];

    expect(pairSideScorecardRows('match_play_individual', producer({ playerId: 'alice' }), rows)).toEqual([
        rows[0],
        rows[1],
    ]);
});

test('pairSideScorecardRows still slices team scorecards by source for taliban', () => {
    const rows = [
        hole(1, { sourcePlayerId: 'alice' }),
        hole(1, { sourcePlayerId: 'bob', strokes: 5 }),
        hole(2, { sourcePlayerId: 'alice', strokes: 3 }),
    ];

    expect(pairSideScorecardRows('taliban_better_ball', producer({ playerId: 'alice' }), rows)).toEqual([
        rows[0],
        rows[2],
    ]);
});

test('pairSideScorecardRows slices team scorecards by source for match-play better-ball', () => {
    const rows = [
        hole(1, { sourcePlayerId: 'alice' }),
        hole(1, { sourcePlayerId: 'bob', strokes: 5 }),
        hole(2, { sourcePlayerId: 'alice', strokes: 3 }),
    ];

    expect(
        pairSideScorecardRows('match_play_better_ball', producer({ playerId: 'alice' }), rows),
    ).toEqual([rows[0], rows[2]]);
});

test('formatSlotSummary gives umbrella individual a human-readable label', () => {
    expect(
        formatSlotSummary({
            scoringMode: 'umbrella',
            teamShape: 'individual',
            allowancePct: 100,
        }),
    ).toBe('Umbrella (3-Player Individual) @ 100%');
});
