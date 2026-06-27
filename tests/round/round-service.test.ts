import { beforeEach, expect, mock, test } from 'bun:test';

type Deferred<T> = {
    promise: Promise<T>;
    resolve: (value: T) => void;
};

function deferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => {
        resolve = r;
    });
    return { promise, resolve };
}

const byToken = new Map<string, Deferred<unknown>>();
const ballsByToken = new Map<string, unknown[]>();
const scorecardsByToken = new Map<string, unknown[]>();
const resultsByToken = new Map<string, unknown>();

const apiMock = {
    setup: {
        formats: mock(async () => []),
    },
    friendlyRounds: {
        byToken: mock(({ token }: { token: string }) => {
            const d = byToken.get(token);
            if (!d) throw new Error(`missing byToken mock for ${token}`);
            return d.promise;
        }),
        balls: mock(async ({ token }: { token: string }) => ballsByToken.get(token) ?? []),
        scorecard: mock(async ({ token }: { token: string }) => scorecardsByToken.get(token) ?? []),
        result: mock(async ({ token }: { token: string }) => resultsByToken.get(token) ?? null),
    },
};

mock.module('../../src/api', () => ({ api: apiMock }));

const { RoundViewService } = await import('../../src/round/round.service');

function roundPayload(token: string, roundId: string, courseName: string): unknown {
    return {
        friendlyRound: { id: `fr-${roundId}`, roundId, shareToken: token },
        round: {
            id: roundId,
            courseNameSnapshot: courseName,
            date: '2026-06-28',
            status: 'active',
            playHoles: [],
            playingGroups: [],
            formatSlots: [],
        },
    };
}

beforeEach(() => {
    byToken.clear();
    ballsByToken.clear();
    scorecardsByToken.clear();
    resultsByToken.clear();
    apiMock.setup.formats.mockClear();
    apiMock.friendlyRounds.byToken.mockClear();
    apiMock.friendlyRounds.balls.mockClear();
    apiMock.friendlyRounds.scorecard.mockClear();
    apiMock.friendlyRounds.result.mockClear();
});

test('switching share tokens clears the previous round state before the new load resolves', async () => {
    const svc = new RoundViewService();
    byToken.set('first', deferred());
    byToken.set('second', deferred());
    ballsByToken.set('first', [{ id: 'ball-first', players: [] }]);
    scorecardsByToken.set('first', [{ ballId: 'ball-first', holes: [] }]);
    resultsByToken.set('first', { slots: [{ slotDefId: 'first-slot' }], routeSections: [], posting: { eligible: true, reason: null } });

    const firstLoad = svc.loadByToken('first');
    byToken.get('first')!.resolve(roundPayload('first', 'round-first', 'First course'));
    await firstLoad;
    await svc.loadResult();

    expect(svc.round.get()?.id).toBe('round-first');
    expect(svc.balls.get()).toHaveLength(1);
    expect(svc.scorecards.get()).toHaveLength(1);
    expect(svc.result.get()?.slots[0]?.slotDefId).toBe('first-slot');

    const secondLoad = svc.loadByToken('second');

    expect(svc.round.get()).toBeNull();
    expect(svc.friendlyRound.get()).toBeNull();
    expect(svc.balls.get()).toEqual([]);
    expect(svc.scorecards.get()).toEqual([]);
    expect(svc.result.get()).toBeNull();

    byToken.get('second')!.resolve(roundPayload('second', 'round-second', 'Second course'));
    await secondLoad;

    expect(svc.round.get()?.id).toBe('round-second');
});

test('a slow stale token response cannot overwrite the latest loaded round', async () => {
    const svc = new RoundViewService();
    byToken.set('slow', deferred());
    byToken.set('latest', deferred());

    const slowLoad = svc.loadByToken('slow');
    const latestLoad = svc.loadByToken('latest');

    byToken.get('latest')!.resolve(roundPayload('latest', 'round-latest', 'Latest course'));
    await latestLoad;
    expect(svc.round.get()?.id).toBe('round-latest');

    byToken.get('slow')!.resolve(roundPayload('slow', 'round-slow', 'Slow course'));
    await slowLoad;

    expect(svc.round.get()?.id).toBe('round-latest');
});
