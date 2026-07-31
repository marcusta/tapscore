import { beforeEach, expect, mock, test } from 'bun:test';
import { di } from '@basics/core/client/core';
import { ZERO_MEASURES } from '../../src/round/stat-measures';
import type { PlayerRoundStats, PlayerStatsSummary } from '../../src/api/player-stats.gen';

// The dashboard's transparent paging. Mirrors the per-round harness: mock
// `../../src/api`, then import the service.
//
// What has teeth here is the EXTEND banner. A failed older page is a fact about
// that attempt, and the screen keeps the rows it already has — so the banner
// must be as transient as the failure was. Left standing, one flaky page tells
// the reader forever that the window is short, through every later window
// switch that in fact completed.

function round(over: Partial<PlayerRoundStats> & { roundId: string }): PlayerRoundStats {
    return {
        date: '2026-07-01',
        courseId: 'c1',
        courseName: 'Linköping',
        roundType: 'full_18',
        venueType: 'outdoor',
        name: null,
        holeCount: 18,
        measures: ZERO_MEASURES,
        ...over,
    };
}

function rounds(n: number, prefix: string): PlayerRoundStats[] {
    return Array.from({ length: n }, (_, i) => round({ roundId: `${prefix}-${i}` }));
}

function page(rows: PlayerRoundStats[], nextCursor: string | null): PlayerStatsSummary {
    return { playerId: 'p1', roundsWithStats: 40, totals: null, rounds: rows, nextCursor };
}

const state: {
    /** One entry per call, in order: a page to return, or an error to throw. */
    responses: (PlayerStatsSummary | Error)[];
    calls: { limit?: number; cursor?: string }[];
} = { responses: [], calls: [] };

const apiMock = {
    playerStats: {
        myStats: mock(async (input: { limit?: number; cursor?: string }) => {
            state.calls.push(input);
            const next = state.responses.shift();
            if (next instanceof Error) throw next;
            return next ?? page([], null);
        }),
    },
};

mock.module('../../src/api', () => ({ api: apiMock }));

const { StatsDashboardService } = await import('../../src/stats/stats-dashboard.service');

function service(): InstanceType<typeof StatsDashboardService> {
    const svc = di.get(StatsDashboardService);
    // Pinned rather than inherited from device storage, so the paging condition
    // under test is the same on every machine.
    svc.preset.set('last10');
    return svc;
}

/**
 * Wait out an extend the service started without handing back a promise —
 * `select()` fires one and returns. Bounded, so a hang fails the test rather
 * than the run.
 */
async function settled(svc: InstanceType<typeof StatsDashboardService>): Promise<void> {
    for (let i = 0; i < 100 && svc.extending.get(); i++) await Promise.resolve();
    expect(svc.extending.get()).toBe(false);
}

beforeEach(() => {
    di.reset();
    state.responses = [];
    state.calls = [];
});

test('a failed older page leaves the rows on screen and says the window may be short', async () => {
    state.responses = [page(rounds(5, 'a'), 'cursor-1'), new Error('Network request failed')];
    const svc = service();
    await svc.load();

    expect(svc.loadedRounds.get()).toHaveLength(5);
    expect(svc.error.get()).toBeNull();
    expect(svc.extendError.get()).not.toBeNull();
});

test('the extend banner is dropped the moment a new extend starts, not kept forever', async () => {
    state.responses = [page(rounds(5, 'a'), 'cursor-1'), new Error('Network request failed')];
    const svc = service();
    await svc.load();
    expect(svc.extendError.get()).not.toBeNull();

    // The same cursor, retried, and this time it lands. Before the fix
    // `extendError` was only cleared by the load-once `load()`, so this banner
    // survived every later success for the lifetime of the tab.
    state.responses = [page(rounds(10, 'b'), null)];
    await svc.extendIfNeeded();

    expect(svc.extendError.get()).toBeNull();
    expect(svc.loadedRounds.get()).toHaveLength(15);
});

test('a window switch that pages successfully clears a banner from an earlier failure', async () => {
    state.responses = [page(rounds(5, 'a'), 'cursor-1'), new Error('Network request failed')];
    const svc = service();
    await svc.load();
    expect(svc.extendError.get()).not.toBeNull();

    state.responses = [page(rounds(30, 'b'), null)];
    svc.select('all');
    await settled(svc);

    expect(svc.extendError.get()).toBeNull();
    expect(svc.loadedRounds.get()).toHaveLength(35);
});
