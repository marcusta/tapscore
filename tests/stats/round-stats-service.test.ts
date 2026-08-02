import { beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import { di } from '@basics/core/client/core';
import { ZERO_MEASURES } from '../../src/round/stat-measures';
import type {
    PlayerRoundHoleStats,
    PlayerRoundStats,
    PlayerStatsSummary,
} from '../../src/api/player-stats.gen';

// The per-round read. Mirrors the round-service harness: mock `../../src/api`,
// then import the service.
//
// What has teeth here is the FAILURE half. This service feeds two surfaces —
// the `/round-stats` screen and the story card that sits above a leaderboard
// the logged-out on-course flow also renders — so "the read went wrong" must
// resolve to a phase the card can be silent about, never to a throw. The other
// half is the history walk: how few pages it can get away with, and when it
// stops.

function round(
    over: Partial<PlayerRoundStats> & { roundId: string; date: string },
): PlayerRoundStats {
    return {
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

/**
 * `n` rounds older than 2026-07-20, newest first.
 *
 * The id carries the date, so two calls that overlap in time produce the SAME
 * rows — which is what a seed and a fetched page do, and what the walk's
 * deduplication has to survive.
 */
function older(n: number, from = 19): PlayerRoundStats[] {
    return Array.from({ length: n }, (_, i) => {
        const day = String(from - i).padStart(2, '0');
        return round({ roundId: `old-2026-07-${day}`, date: `2026-07-${day}` });
    });
}

const holeRows: PlayerRoundHoleStats[] = [
    {
        playHoleId: 'h1',
        ordinal: 1,
        courseHoleNumber: 1,
        par: 4,
        lengthM: null,
        score: 5,
        stats: {
            roundId: 'r1',
            playHoleId: 'h1',
            playerId: 'p1',
            teeResult: 'fairway',
            gir: false,
            firstPutt: null,
            putts: 2,
            shortGameDifficulty: null,
            penalties: 0,
            recoveryOk: null,
            teeMissDir: null,
            greenMissDir: null,
            shortGameStrokes: null,
            penaltySource: null,
        },
    },
];

const state: {
    holes: PlayerRoundHoleStats[];
    holesError: unknown;
    pages: PlayerStatsSummary[];
    statsError: unknown;
    calls: { myRoundStats: number; myStats: { limit?: number; cursor?: string }[] };
} = {
    holes: holeRows,
    holesError: null,
    pages: [],
    statsError: null,
    calls: { myRoundStats: 0, myStats: [] },
};

/** An HTTP failure of the shape the service classifies on. */
function apiError(status: number, message: string): Error {
    return new ApiError(status, message);
}

function page(rounds: PlayerRoundStats[], nextCursor: string | null = null): PlayerStatsSummary {
    return { playerId: 'p1', roundsWithStats: rounds.length, totals: null, rounds, nextCursor };
}

const apiMock = {
    playerStats: {
        myRoundStats: mock(async () => {
            state.calls.myRoundStats++;
            if (state.holesError !== null) throw state.holesError;
            return state.holes;
        }),
        myStats: mock(async (input: { limit?: number; cursor?: string }) => {
            state.calls.myStats.push(input);
            if (state.statsError !== null) throw state.statsError;
            const next = state.pages.shift();
            return next ?? page([]);
        }),
    },
};

mock.module('../../src/api', () => ({ api: apiMock }));

const { RoundStatsService } = await import('../../src/stats/round-stats.service');
const { StatsDashboardService } = await import('../../src/stats/stats-dashboard.service');

function service(): InstanceType<typeof RoundStatsService> {
    return di.get(RoundStatsService);
}

/** Pre-fill what a walk from `/stats` would already have in hand. */
function seedDashboard(rounds: PlayerRoundStats[]): void {
    di.get(StatsDashboardService).loadedRounds.set(rounds);
}

beforeEach(() => {
    di.reset();
    state.holes = holeRows;
    state.holesError = null;
    state.pages = [];
    state.statsError = null;
    state.calls = { myRoundStats: 0, myStats: [] };
});

const target = round({ roundId: 'r1', date: '2026-07-20' });

// --- The happy path ----------------------------------------------------------

test('a loaded round holds its holes, its summary row, and its history separately', async () => {
    seedDashboard([target, ...older(10)]);
    const svc = service();
    await svc.load('r1');

    expect(svc.phase.get()).toBe('ready');
    expect(svc.roundId.get()).toBe('r1');
    expect(svc.holes.get()).toHaveLength(1);
    expect(svc.round.get()!.roundId).toBe('r1');
    // WINDOW CONTRACT: history is PRIOR rounds. The round under evaluation is
    // never in its own baseline, or every round measures partly against itself.
    expect(svc.history.get().some((r) => r.roundId === 'r1')).toBe(false);
    expect(svc.history.get()).toHaveLength(10);
    expect(svc.model.get()!.windowCount).toBe(10);
});

test('a seed that already satisfies the window costs no request at all', async () => {
    seedDashboard([target, ...older(10)]);
    await service().load('r1');
    // The common path into this screen is a tap on a dashboard row. Paging that
    // same career again would be a page of network to learn what the previous
    // screen already knows.
    expect(state.calls.myStats).toHaveLength(0);
    expect(state.calls.myRoundStats).toBe(1);
});

test('a short seed is topped up rather than thrown away', async () => {
    seedDashboard([target, ...older(3)]);
    // The page overlaps the seed by those same three rounds, as a real first
    // page would: the walk restarts from the top of the feed, not from where the
    // dashboard happened to stop.
    state.pages = [page([target, ...older(10)], null)];
    const svc = service();
    await svc.load('r1');

    expect(state.calls.myStats).toHaveLength(1);
    expect(state.calls.myStats[0]!.cursor).toBeUndefined();
    expect(svc.phase.get()).toBe('ready');
    const ids = svc.history.get().map((r) => r.roundId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(10);
});

test('the walk stops the moment the window is full, not when the feed ends', async () => {
    state.pages = [
        page([target, ...older(10)], 'cursor-1'),
        page(older(50, 90), 'cursor-2'),
    ];
    await service().load('r1');
    expect(state.calls.myStats).toHaveLength(1);
});

test('the walk follows the cursor, and stops on a null one even when short', async () => {
    state.pages = [page([target, ...older(2)], 'cursor-1'), page(older(3, 16), null)];
    const svc = service();
    await svc.load('r1');

    expect(state.calls.myStats.map((c) => c.cursor)).toEqual([undefined, 'cursor-1']);
    // Fewer than a full window behind it, and that is the honest answer: the
    // model reports the window it actually has.
    expect(svc.phase.get()).toBe('ready');
    expect(svc.model.get()!.windowCount).toBe(5);
});

test('the page budget is finite — a career cannot walk forever', async () => {
    // Never satisfied: every page is rounds NEWER than the target, so the target
    // never gains predecessors.
    state.pages = Array.from({ length: 20 }, () =>
        page([target, round({ roundId: 'n', date: '2026-08-01' })], 'more'),
    );
    await service().load('r1');
    expect(state.calls.myStats).toHaveLength(RoundStatsService.MAX_PAGES);
});

// --- Failure resolves to a phase, never to a throw ---------------------------

test('404 is hidden, not crashed — and carries no failure message', async () => {
    state.holesError = apiError(404, 'Not found');
    const svc = service();
    await svc.load('r1');

    expect(svc.phase.get()).toBe('notFound');
    expect(svc.failure.get()).toBeNull();
    expect(svc.roundId.get()).toBeNull();
    expect(svc.model.get()).toBeNull();
});

test('401 and 403 are "not yours to read", distinct from "not there"', async () => {
    for (const status of [401, 403]) {
        di.reset();
        state.holesError = apiError(status, 'Nope');
        const svc = service();
        await svc.load('r1');
        expect(svc.phase.get()).toBe('notAuthorized');
        expect(svc.failure.get()).toBeNull();
    }
});

test('anything else is a failure with its message kept verbatim', async () => {
    state.holesError = new Error('Network request failed');
    const svc = service();
    await svc.load('r1');

    expect(svc.phase.get()).toBe('failed');
    expect(svc.failure.get()).toBe('Network request failed');
});

test('a 500 is a failure, not a 404 — the status is read, not assumed', async () => {
    state.holesError = apiError(500, 'Boom');
    const svc = service();
    await svc.load('r1');
    expect(svc.phase.get()).toBe('failed');
});

test('a failed history walk fails the load rather than showing a baseline-free round', async () => {
    state.statsError = apiError(500, 'Boom');
    const svc = service();
    await svc.load('r1');
    expect(svc.phase.get()).toBe('failed');
    expect(svc.round.get()).toBeNull();
});

test('holes without a summary row are notFound — the same answer as no round', async () => {
    // The server does not distinguish "no such round" from "nothing of yours in
    // it", and neither does this: the difference only interests someone probing
    // for round ids.
    seedDashboard(older(10));
    state.pages = [page(older(10), null)];
    const svc = service();
    await svc.load('r1');

    expect(svc.phase.get()).toBe('notFound');
    expect(svc.round.get()).toBeNull();
});

// --- Sharing one instance between the screen and the story card --------------

test('a second load of the round in hand is free', async () => {
    seedDashboard([target, ...older(10)]);
    const svc = service();
    await svc.load('r1');
    await svc.load('r1');
    // The story card and the screen both call `load`. A remount must not refetch.
    expect(state.calls.myRoundStats).toBe(1);
});

test('force reloads the same round', async () => {
    seedDashboard([target, ...older(10)]);
    const svc = service();
    await svc.load('r1');
    await svc.load('r1', true);
    expect(state.calls.myRoundStats).toBe(2);
});

test('a different round replaces the one in hand', async () => {
    const other = round({ roundId: 'r2', date: '2026-07-21' });
    seedDashboard([other, target, ...older(10)]);
    const svc = service();
    await svc.load('r1');
    await svc.load('r2');

    expect(svc.roundId.get()).toBe('r2');
    expect(svc.round.get()!.roundId).toBe('r2');
    expect(state.calls.myRoundStats).toBe(2);
});

test('a load in flight advertises NO round while the previous one is blanked', async () => {
    const other = round({ roundId: 'r2', date: '2026-07-21' });
    seedDashboard([other, target, ...older(10)]);
    const svc = service();
    await svc.load('r1');

    const pending = svc.load('r2');
    // `roundId` is the key `load` short-circuits on. Left at 'r1' here — with
    // r1's holes, summary and history already cleared — a concurrent
    // `load('r1')` would be told that round is in hand and return to an empty
    // screen.
    expect(svc.roundId.get()).toBeNull();
    expect(svc.round.get()).toBeNull();
    expect(svc.holes.get()).toEqual([]);
    expect(svc.model.get()).toBeNull();

    await pending;
    expect(svc.roundId.get()).toBe('r2');
    expect(svc.round.get()!.roundId).toBe('r2');
});

test('clear forgets the round — a sign-out leaves nothing readable', async () => {
    seedDashboard([target, ...older(10)]);
    const svc = service();
    await svc.load('r1');
    svc.clear();

    expect(svc.phase.get()).toBe('idle');
    expect(svc.roundId.get()).toBeNull();
    expect(svc.round.get()).toBeNull();
    expect(svc.holes.get()).toEqual([]);
    expect(svc.model.get()).toBeNull();
    // And a load after a clear works, rather than being swallowed as in-flight.
    await svc.load('r1');
    expect(svc.phase.get()).toBe('ready');
});
