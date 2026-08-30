import { beforeEach, expect, mock, test } from 'bun:test';
import { di } from '@basics/core/client/core';
import { ApiError } from '@basics/core/client/api-error';
import { ZERO_MEASURES } from '../../src/round/stat-measures';
import type { PlayerRoundStats, PlayerStatsSummary, StatMeasures } from '../../src/api/player-stats.gen';

// The landing card's store: ONE page, deduped, and silent when it fails.
//
// What has teeth here is the failure vocabulary. A failed REFRESH must leave
// the card that was accurate thirty seconds ago on screen, a failed FIRST load
// must be retryable by the next natural trigger (a return to the landing), and
// a 401 must clear — a dead bearer is not something a retry fixes.

function measures(over: Partial<StatMeasures> = {}): StatMeasures {
    return { ...ZERO_MEASURES, ...over };
}

function round(id: string, date = '2026-07-20'): PlayerRoundStats {
    return {
        roundId: id,
        date,
        courseId: 'c1',
        courseName: 'Linköpings GK',
        roundType: 'full_18',
        venueType: 'outdoor',
        name: null,
        holeCount: 18,
        measures: measures({
            holesScored: 18,
            strokesTotal: 90,
            parTotal: 72,
            teeRecorded: 14,
            fairwayHits: 7,
            girRecorded: 18,
            girHits: 9,
        }),
        girArrivalMetres: [],
    };
}

function page(rows: PlayerRoundStats[], nextCursor: string | null = null): PlayerStatsSummary {
    return {
        playerId: 'p1',
        roundsWithStats: rows.length,
        totals: null,
        girArrivalMetresTotals: null,
        rounds: rows,
        nextCursor,
    };
}

const state: {
    responses: (PlayerStatsSummary | Error)[];
    calls: { limit?: number; cursor?: string }[];
} = { responses: [], calls: [] };

const apiMock = {
    playerStats: {
        myStats: mock(async (input: { limit?: number; cursor?: string }) => {
            state.calls.push(input);
            const next = state.responses.shift();
            if (next instanceof Error) throw next;
            return next ?? page([]);
        }),
    },
};

mock.module('../../src/api', () => ({ api: apiMock }));

const { HomeStatsService } = await import('../../src/landing/home-stats.service');

function service(): InstanceType<typeof HomeStatsService> {
    const svc = di.get(HomeStatsService);
    // Pinned rather than inherited from device storage, so the window under
    // test is the same on every machine.
    svc.preset.set('last10');
    return svc;
}

beforeEach(() => {
    di.reset();
    state.responses = [];
    state.calls = [];
});

test('one page, one request — the card never walks a cursor', async () => {
    state.responses = [page([round('r1')], 'cursor-1')];
    const svc = service();

    await svc.load();

    expect(state.calls).toEqual([{ limit: 20 }]);
    expect(svc.card.get()).not.toBeNull();
});

test('the load is deduped — a remount does not refetch', async () => {
    state.responses = [page([round('r1')])];
    const svc = service();

    await svc.load();
    await svc.load();

    expect(state.calls.length).toBe(1);
});

test('a failed refresh keeps the stale card', async () => {
    state.responses = [page([round('r1')]), new Error('offline')];
    const svc = service();

    await svc.load();
    const before = svc.card.get();
    expect(before).not.toBeNull();

    await svc.load(true);

    expect(svc.card.get()).toEqual(before);
});

test('a failed first load leaves nothing on screen but can retry', async () => {
    state.responses = [new Error('offline'), page([round('r1')])];
    const svc = service();

    await svc.load();
    expect(svc.card.get()).toBeNull();

    // The next natural trigger — a return to the landing — retries without a
    // force, because a first load that failed was never a load.
    await svc.load();
    expect(state.calls.length).toBe(2);
    expect(svc.card.get()).not.toBeNull();
});

test('a 401 clears and stays cleared — a dead bearer is not a retry', async () => {
    state.responses = [page([round('r1')]), new ApiError(401, 'unauthorized')];
    const svc = service();

    await svc.load();
    expect(svc.card.get()).not.toBeNull();

    await svc.load(true);

    expect(svc.card.get()).toBeNull();

    // The "stays" half: a later non-forced trigger (a return to the landing)
    // must not re-ask a dead bearer — `loaded` survives the 401.
    const asked = state.calls.length;
    await svc.load();
    expect(state.calls.length).toBe(asked);
    expect(svc.card.get()).toBeNull();
});

test('clear forgets the page — sign-out must not leave the last account numbers', async () => {
    state.responses = [page([round('r1')]), page([round('r2')])];
    const svc = service();

    await svc.load();
    svc.clear();

    expect(svc.card.get()).toBeNull();
    // …and the next login loads afresh rather than being deduped away.
    await svc.load();
    expect(state.calls.length).toBe(2);
});

test('the window is re-read, not cached — a switch on /stats shows on the landing', async () => {
    state.responses = [page([round('r1', '2024-05-02')])];
    const svc = service();
    await svc.load();

    // `last10` covers the 2024 round…
    expect(svc.card.get()?.windowLabel).toBe('Last 10 rounds');

    // …and the same rows under a window the dashboard just persisted answer
    // for that window instead, with no refetch.
    svc.preset.set('thisYear');
    expect(svc.card.get()).toBeNull();
    expect(state.calls.length).toBe(1);
});
