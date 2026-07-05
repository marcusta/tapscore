import { expect, test } from 'bun:test';
import { sortHistory } from '../../src/history/sort';
import type { LandingRow } from '../../src/landing/rows';

// History = all rounds newest-first (no partition, no window). Recency key is
// completedAt when finished, else lastActivityAt; missing keys sort last.

function row(over: Partial<LandingRow> & { key: string }): LandingRow {
    return {
        token: over.key,
        roundId: null,
        courseName: over.key,
        status: 'not_started',
        completedAt: null,
        lastActivityAt: null,
        roleLabel: null,
        date: null,
        formats: null,
        ...over,
    };
}

test('orders newest-first by completedAt or lastActivityAt', () => {
    const rows = [
        row({ key: 'old', lastActivityAt: '2026-06-01' }),
        row({ key: 'fin', status: 'complete', completedAt: '2026-07-05T10:00:00Z' }),
        row({ key: 'mid', lastActivityAt: '2026-07-02' }),
    ];
    expect(sortHistory(rows).map((r) => r.key)).toEqual(['fin', 'mid', 'old']);
});

test('rows with no timestamp sort last, tie-broken by key (stable)', () => {
    const rows = [
        row({ key: 'z-nostamp' }),
        row({ key: 'a-nostamp' }),
        row({ key: 'dated', lastActivityAt: '2026-07-01' }),
    ];
    expect(sortHistory(rows).map((r) => r.key)).toEqual(['dated', 'a-nostamp', 'z-nostamp']);
});

test('does not mutate the input', () => {
    const rows = [row({ key: 'a', lastActivityAt: '2026-07-01' }), row({ key: 'b', lastActivityAt: '2026-07-02' })];
    const snapshot = rows.map((r) => r.key);
    sortHistory(rows);
    expect(rows.map((r) => r.key)).toEqual(snapshot);
});
