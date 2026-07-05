import { test, expect } from 'bun:test';
import { scoreFrecency, FRECENCY_HALF_LIFE_DAYS, type SharedRound } from './frecency';

const NOW = '2026-07-05T12:00:00.000Z';

/** N days before NOW, as an ISO date. */
function daysAgo(n: number): string {
    return new Date(Date.parse(NOW) - n * 24 * 60 * 60 * 1000).toISOString();
}

function rounds(...ages: number[]): SharedRound[] {
    return ages.map((a) => ({ playedAt: daysAgo(a) }));
}

test('never played → count 0, null lastPlayedAt, score 0', () => {
    const r = scoreFrecency([], NOW);
    expect(r).toEqual({ sharedRoundCount: 0, lastPlayedAt: null, frecency: 0 });
});

test('a round today contributes ~1.0; the half-life halves it', () => {
    const today = scoreFrecency(rounds(0), NOW);
    expect(today.frecency).toBeCloseTo(1, 5);

    const oneHalfLife = scoreFrecency(rounds(FRECENCY_HALF_LIFE_DAYS), NOW);
    expect(oneHalfLife.frecency).toBeCloseTo(0.5, 5);
});

test('sharedRoundCount and lastPlayedAt reflect the history', () => {
    const r = scoreFrecency(rounds(3, 40, 200), NOW);
    expect(r.sharedRoundCount).toBe(3);
    expect(r.lastPlayedAt).toBe(daysAgo(3)); // most recent
});

test('recent beats stale for equal frequency', () => {
    const recent = scoreFrecency(rounds(2), NOW).frecency;
    const stale = scoreFrecency(rounds(120), NOW).frecency;
    expect(recent).toBeGreaterThan(stale);
});

test('a weekly regular outranks a single recent one-off', () => {
    // Regular: played every ~7 days for the last ~2 months.
    const regular = scoreFrecency(rounds(1, 8, 15, 22, 29, 36, 43, 50), NOW).frecency;
    // One-off: a single round two days ago.
    const oneOff = scoreFrecency(rounds(2), NOW).frecency;
    expect(regular).toBeGreaterThan(oneOff);
});

test('a weekly regular outranks an old-but-frequent partner', () => {
    const regular = scoreFrecency(rounds(1, 8, 15, 22, 29, 36), NOW).frecency;
    // Old-but-frequent: many rounds, but all ~a year ago.
    const oldFrequent = scoreFrecency(
        rounds(350, 357, 364, 371, 378, 385, 392, 399),
        NOW,
    ).frecency;
    expect(regular).toBeGreaterThan(oldFrequent);
});

test('deterministic — same inputs + same now always score identically', () => {
    const input = rounds(1, 30, 90);
    expect(scoreFrecency(input, NOW).frecency).toBe(scoreFrecency(input, NOW).frecency);
});

test('a future-dated round is treated as age 0 (never inflates above 1/round)', () => {
    const future = scoreFrecency([{ playedAt: daysAgo(-5) }], NOW);
    expect(future.frecency).toBeCloseTo(1, 5);
    expect(future.frecency).toBeLessThanOrEqual(1);
});

test('more shared rounds always score higher (frequency is monotone)', () => {
    const one = scoreFrecency(rounds(10), NOW).frecency;
    const two = scoreFrecency(rounds(10, 10), NOW).frecency;
    expect(two).toBeGreaterThan(one);
});
