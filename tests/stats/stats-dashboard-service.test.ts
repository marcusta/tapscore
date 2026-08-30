import { beforeEach, expect, mock, test } from 'bun:test';
import { di } from '@basics/core/client/core';
import { SG_BASELINES_V1, ZERO_MEASURES } from '../../src/round/stat-measures';
import type {
    FirstPuttCurvePoint,
    PlayerRoundStats,
    PlayerStatsSummary,
} from '../../src/api/player-stats.gen';
import type { Player } from '../../src/api/players.gen';

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
        girArrivalMetres: [],
        ...over,
    };
}

function rounds(n: number, prefix: string): PlayerRoundStats[] {
    return Array.from({ length: n }, (_, i) => round({ roundId: `${prefix}-${i}` }));
}

function page(rows: PlayerRoundStats[], nextCursor: string | null): PlayerStatsSummary {
    return {
        playerId: 'p1',
        roundsWithStats: 40,
        totals: null,
        girArrivalMetresTotals: null,
        rounds: rows,
        nextCursor,
    };
}

const state: {
    /** One entry per call, in order: a page to return, or an error to throw. */
    responses: (PlayerStatsSummary | Error)[];
    calls: { limit?: number; cursor?: string }[];
    /** The career make curve, or an error — it is fetched on its own route. */
    curve: FirstPuttCurvePoint[] | Error;
} = { responses: [], calls: [], curve: [] };

const apiMock = {
    playerStats: {
        myStats: mock(async (input: { limit?: number; cursor?: string }) => {
            state.calls.push(input);
            const next = state.responses.shift();
            if (next instanceof Error) throw next;
            return next ?? page([], null);
        }),
        myFirstPuttCurve: mock(async () => {
            if (state.curve instanceof Error) throw state.curve;
            return state.curve;
        }),
    },
};

mock.module('../../src/api', () => ({ api: apiMock }));

const { StatsDashboardService } = await import('../../src/stats/stats-dashboard.service');
const { ProfileService } = await import('../../src/profile/profile.service');

/** A profile row with only the field the cohort resolution reads. */
function player(handicapIndex: number | null): Player {
    return {
        id: 'p1',
        username: 'me',
        displayName: 'Me',
        nickname: null,
        avatarUrl: null,
        avatarVersion: null,
        homeClubId: null,
        preferredTeeRoleKey: null,
        handicapIndex,
        gender: null,
        handicapConfirmedAt: null,
        deletedAt: null,
    };
}

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
    state.curve = [];
});

test('a first page with truncated measures is refused, not rendered as NaN', async () => {
    // The stale-view payload: a row whose measures object is missing columns
    // this build computes rates from.
    const { attStrokes: _, ...rest } = ZERO_MEASURES;
    const bad = round({ roundId: 'bad-1' });
    bad.measures = rest as typeof ZERO_MEASURES;
    state.responses = [page([bad], null)];
    const svc = service();
    await svc.load();

    expect(svc.error.get()).not.toBeNull();
    expect(svc.error.get()!.code).toBe('server');
    expect(svc.error.get()!.message).toContain('attStrokes');
    expect(svc.loadedRounds.get()).toHaveLength(0);
    // `loaded` stays false: a fixed server gets a clean retry on the next visit.
    expect(svc.loaded.get()).toBe(false);
});

test('an older page with truncated measures keeps the whole rows and flags the extend', async () => {
    const { girHits: _, ...rest } = ZERO_MEASURES;
    const bad = round({ roundId: 'bad-1' });
    bad.measures = rest as typeof ZERO_MEASURES;
    state.responses = [page(rounds(5, 'a'), 'cursor-1'), page([bad], null)];
    const svc = service();
    await svc.load();

    expect(svc.error.get()).toBeNull();
    expect(svc.extendError.get()).not.toBeNull();
    expect(svc.extendError.get()!.message).toContain('girHits');
    expect(svc.loadedRounds.get()).toHaveLength(5);
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

// --- The baseline cohort -----------------------------------------------------
//
// One resolved cohort per client, and it lives here because this is where the
// two stats surfaces already meet: `RoundStatsService` injects this service, so
// the round screen reads the same bundle the dashboard does.

test('the cohort follows the handicap under auto, and the choice otherwise', () => {
    const svc = service();
    const profile = di.get(ProfileService);

    // No profile loaded yet: today's tier, not a guess and not a blank screen.
    expect(svc.sgChoice.get()).toBe('auto');
    expect(svc.handicapIndex.get()).toBeNull();
    expect(svc.sgCohort.get()).toBe('hcp12');
    expect(svc.sgBundle.get()).toBe(SG_BASELINES_V1.hcp12);

    profile.player.set(player(6));
    expect(svc.sgCohort.get()).toBe('hcp5');
    expect(svc.sgInfo.get()).toEqual({ cohort: 'hcp5', choice: 'auto', handicapIndex: 6 });

    // A hand-picked tier ignores the handicap.
    svc.selectSgBaseline('scratch');
    expect(svc.sgCohort.get()).toBe('scratch');
    expect(svc.sgBundle.get()).toBe(SG_BASELINES_V1.scratch);

    // A player with no index on file falls back the same way an absent profile
    // does — through `cohortForHandicap(null)`, never through a made-up number.
    svc.selectSgBaseline('auto');
    profile.player.set(player(null));
    expect(svc.sgCohort.get()).toBe('hcp12');
});

test('switching cohort re-prices the model without refetching a single page', async () => {
    // Nine par-3 greens, two putts each — enough measures for a priced round.
    const measures = {
        ...ZERO_MEASURES,
        holesScored: 9,
        attHolesPar3Gir: 9,
        attStrokes: 27,
        attPutts: 18,
        attGirFirstPutt2To4m: 9,
    };
    state.responses = [page([round({ roundId: 'r1', measures })], null)];
    const svc = service();
    await svc.load();
    const pages = state.calls.length;

    const before = svc.model.get().waterfall.total!;
    svc.selectSgBaseline('scratch');
    const after = svc.model.get().waterfall.total!;

    // The rows are the same rows; only what they are measured against moved.
    expect(after).toBeGreaterThan(before);
    expect(state.calls.length).toBe(pages);
    expect(svc.loadedRounds.get()).toHaveLength(1);

    // The choice is device-persisted, so leave the default behind for whatever
    // constructs the service next.
    svc.selectSgBaseline('auto');
});

// --- The career make curve ---------------------------------------------------
//
// A second route, fetched once beside the first page. It is WINDOW-BLIND on
// purpose: a few rounds hold too few putts from any one metre to read.

test('the curve is fetched once and survives every window switch unrefetched', async () => {
    state.curve = [{ firstPuttM: 3, attempts: 6, onePutts: 2, puttsTotal: 10 }];
    // A putt recorded somewhere, or there is no putting card to hang the
    // curve on.
    const putted = round({
        roundId: 'p-1',
        measures: { ...ZERO_MEASURES, firstPuttRecorded: 9, puttsRecorded: 9 },
    });
    state.responses = [page([putted, ...rounds(4, 'a')], null)];
    const svc = service();
    await svc.load();

    const curveBlocks = () =>
        svc.model.get().putting?.curve.map((p) => `${p.meters}:${p.onePutts}/${p.attempts}`) ?? [];
    expect(curveBlocks()).toEqual(['3:2/6']);

    // The window moved; the curve did not, and no second request was made.
    const before = apiMock.playerStats.myFirstPuttCurve.mock.calls.length;
    svc.select('all');
    await settled(svc);
    expect(curveBlocks()).toEqual(['3:2/6']);
    expect(apiMock.playerStats.myFirstPuttCurve.mock.calls.length).toBe(before);
});

test('a failed curve costs the dashboard its curve section and nothing else', async () => {
    // One section of one card. It must not take the rows down with it, and it
    // must not raise the banner that means "your window may be short".
    state.curve = new Error('Network request failed');
    state.responses = [page(rounds(5, 'a'), null)];
    const svc = service();
    await svc.load();

    expect(svc.error.get()).toBeNull();
    expect(svc.extendError.get()).toBeNull();
    expect(svc.loadedRounds.get()).toHaveLength(5);
    expect(svc.curveRows.get()).toEqual([]);
});
