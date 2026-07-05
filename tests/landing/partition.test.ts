import { expect, test } from 'bun:test';
import {
    partitionRounds,
    RECENT_FINISHED_DAYS,
    type PartitionableRound,
} from '../../src/landing/partition';

// Pure landing partition: Ongoing (not_started/active) vs Recently-finished
// (complete within a trailing window), with an INJECTED `now` so the window is
// deterministic. Sort: ongoing by lastActivityAt desc, finished by
// completedAt desc; empty sections; the old-finished round drops from both.

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-07-05T12:00:00.000Z');

function r(over: Partial<PartitionableRound> & { status: PartitionableRound['status'] }): PartitionableRound {
    return { completedAt: null, lastActivityAt: null, ...over };
}

test('splits ongoing (not_started/active) from finished (complete)', () => {
    const items = [
        r({ status: 'not_started' }),
        r({ status: 'active' }),
        r({ status: 'complete', completedAt: new Date(NOW - DAY).toISOString() }),
    ];
    const { ongoing, finished } = partitionRounds(items, NOW, (x) => x);
    expect(ongoing.map((x) => x.status)).toEqual(['not_started', 'active']);
    expect(finished).toHaveLength(1);
});

test('a complete round finished outside the 14-day window is in NEITHER section', () => {
    const old = r({
        status: 'complete',
        completedAt: new Date(NOW - (RECENT_FINISHED_DAYS + 1) * DAY).toISOString(),
    });
    const { ongoing, finished } = partitionRounds([old], NOW, (x) => x);
    expect(ongoing).toHaveLength(0);
    expect(finished).toHaveLength(0);
});

test('a complete round exactly at the window edge still counts as recently finished', () => {
    const edge = r({
        status: 'complete',
        completedAt: new Date(NOW - RECENT_FINISHED_DAYS * DAY).toISOString(),
    });
    const { finished } = partitionRounds([edge], NOW, (x) => x);
    expect(finished).toHaveLength(1);
});

test('a complete round with a MISSING completedAt is treated as finished (fallback)', () => {
    const noStamp = r({ status: 'complete', completedAt: null });
    const { ongoing, finished } = partitionRounds([noStamp], NOW, (x) => x);
    expect(ongoing).toHaveLength(0);
    expect(finished).toHaveLength(1);
});

test('ongoing sorts by lastActivityAt desc; finished by completedAt desc', () => {
    const items = [
        r({ status: 'active', lastActivityAt: '2026-07-01' }),
        r({ status: 'active', lastActivityAt: '2026-07-04' }),
        r({ status: 'complete', completedAt: new Date(NOW - 5 * DAY).toISOString() }),
        r({ status: 'complete', completedAt: new Date(NOW - 1 * DAY).toISOString() }),
    ];
    const { ongoing, finished } = partitionRounds(items, NOW, (x) => x);
    expect(ongoing.map((x) => x.lastActivityAt)).toEqual(['2026-07-04', '2026-07-01']);
    // Most recently finished first.
    expect(Date.parse(finished[0]!.completedAt!)).toBeGreaterThan(
        Date.parse(finished[1]!.completedAt!),
    );
});

test('empty input yields two empty sections', () => {
    const { ongoing, finished } = partitionRounds([], NOW, (x) => x);
    expect(ongoing).toEqual([]);
    expect(finished).toEqual([]);
});

test('a custom window narrows what counts as recently finished', () => {
    const item = r({ status: 'complete', completedAt: new Date(NOW - 3 * DAY).toISOString() });
    expect(partitionRounds([item], NOW, (x) => x, 2).finished).toHaveLength(0);
    expect(partitionRounds([item], NOW, (x) => x, 7).finished).toHaveLength(1);
});
