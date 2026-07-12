import { beforeEach, expect, mock, test } from 'bun:test';
import type {
    Competition,
    CompetitionDetail,
    CompetitionParticipant,
} from '../../src/api/competitions.gen';

// Mirrors the round-service test harness: mock `../../src/api`, then import the
// service. Exercises load-once, detail parsing (+ board/results), verbatim
// refusal surfacing, and the pure admin predicate.

function comp(over: Partial<Competition> = {}): Competition {
    return {
        id: over.id ?? 'c1',
        name: over.name ?? 'Club Champs',
        lifecycle: over.lifecycle ?? 'draft',
        defaultConfig: over.defaultConfig ?? null,
        aggregation: over.aggregation ?? null,
        pointTemplateId: null,
        cutRules: over.cutRules ?? null,
        isResultsFinal: over.isResultsFinal ?? false,
        resultsFinalizedAt: null,
        ownerPlayerId: over.ownerPlayerId ?? 'owner-1',
        createdAt: '2026-07-12',
    };
}

function detail(over: Partial<CompetitionDetail> = {}): CompetitionDetail {
    return { ...comp(over), rounds: over.rounds ?? [] } as CompetitionDetail;
}

const state: {
    list: Competition[];
    detail: CompetitionDetail;
    participants: CompetitionParticipant[];
    leaderboard: unknown;
    results: unknown;
    transitionResult: unknown;
    counts: Record<string, number>;
} = {
    list: [],
    detail: detail(),
    participants: [],
    leaderboard: { ok: true, value: { view: { entries: [] }, defaulted: false } },
    results: { ok: false, refusal: { code: 'not_finalized', message: 'Not finalized yet.' } },
    transitionResult: { ok: true, value: comp() },
    counts: {},
};

function bump(k: string): void {
    state.counts[k] = (state.counts[k] ?? 0) + 1;
}

const apiMock = {
    competitions: {
        list: mock(async () => {
            bump('list');
            return state.list;
        }),
        get: mock(async () => {
            bump('get');
            return state.detail;
        }),
        participants: mock(async () => {
            bump('participants');
            return state.participants;
        }),
        leaderboard: mock(async () => state.leaderboard),
        results: mock(async () => state.results),
        create: mock(async ({ name }: { name: string }) => comp({ id: 'new', name })),
        transition: mock(async () => state.transitionResult),
        update: mock(async () => ({ ok: true, value: comp() })),
        addParticipant: mock(async () => ({ ok: true, value: {} })),
        removeParticipant: mock(async () => ({ ok: true, value: { removed: true } })),
        withdrawParticipant: mock(async () => ({ ok: true, value: {} })),
        createRound: mock(async () => ({ ok: true, shareToken: 'tok-9', competitionRound: {}, round: {}, draft: {} })),
        applyCut: mock(async () => ({ ok: true, value: { advanced: [], cut: [] } })),
        finalize: mock(async () => ({ ok: true, value: {} })),
    },
    guestPlayers: {
        create: mock(async () => ({ id: 'guest-1' })),
    },
};

mock.module('../../src/api', () => ({ api: apiMock }));

const { CompetitionsService, isAdmin } = await import('../../src/competition/competitions.service');

beforeEach(() => {
    state.list = [];
    state.detail = detail();
    state.participants = [];
    state.leaderboard = { ok: true, value: { view: { entries: [] }, defaulted: false } };
    state.results = { ok: false, refusal: { code: 'not_finalized', message: 'Not finalized yet.' } };
    state.transitionResult = { ok: true, value: comp() };
    state.counts = {};
});

test('isAdmin: owner id, admin-only shareToken presence, otherwise false', () => {
    const asOwner = detail({ ownerPlayerId: 'me' });
    expect(isAdmin(asOwner, 'me')).toBe(true);
    expect(isAdmin(asOwner, 'someone-else')).toBe(false);

    const withToken = detail({
        ownerPlayerId: 'x',
        rounds: [{ shareToken: 'tok' } as never],
    });
    expect(isAdmin(withToken, 'not-owner')).toBe(true);

    const noToken = detail({ ownerPlayerId: 'x', rounds: [{} as never] });
    expect(isAdmin(noToken, 'not-owner')).toBe(false);
    expect(isAdmin(null, 'me')).toBe(false);
});

test('loadList is load-once per session', async () => {
    state.list = [comp({ id: 'c1' }), comp({ id: 'c2' })];
    const svc = new CompetitionsService();
    await svc.loadList();
    await svc.loadList();
    expect(state.counts.list).toBe(1);
    expect(svc.list.get().map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(svc.listLoaded.get()).toBe(true);
});

test('loadDetail parses detail + roster + live board', async () => {
    state.detail = detail({ id: 'c1', name: 'Spring Cup', lifecycle: 'active' });
    state.participants = [{ id: 'p1', displayNameSnapshot: 'Ann' } as CompetitionParticipant];
    const svc = new CompetitionsService();
    await svc.loadDetail('c1');
    expect(svc.detail.get()?.name).toBe('Spring Cup');
    expect(svc.participants.get()).toHaveLength(1);
    expect(svc.board.get()).not.toBeNull();
});

test('loadDetail is load-once for the same id, reloads on id change', async () => {
    state.detail = detail({ id: 'c1' });
    const svc = new CompetitionsService();
    await svc.loadDetail('c1');
    await svc.loadDetail('c1');
    expect(state.counts.get).toBe(1);
    state.detail = detail({ id: 'c2' });
    await svc.loadDetail('c2');
    expect(state.counts.get).toBe(2);
});

test('finalized detail additionally loads the frozen results', async () => {
    state.detail = detail({ id: 'c1', lifecycle: 'finalized' });
    state.results = {
        ok: true,
        value: { competitionId: 'c1', finalizedAt: '2026-07-12', resultSets: [] },
    };
    const svc = new CompetitionsService();
    await svc.loadDetail('c1');
    expect(svc.results.get()).not.toBeNull();
    expect(svc.resultsRefusal.get()).toBeNull();
});

test('transition surfaces a humanized refusal verbatim', async () => {
    state.transitionResult = {
        ok: false,
        refusal: { code: 'illegal_transition', message: 'A draft can only open into setup.' },
    };
    const svc = new CompetitionsService();
    const msg = await svc.transition('c1', 'active');
    expect(msg).toBe('A draft can only open into setup.');
    expect(svc.mutateError.get()).toBe('A draft can only open into setup.');
});

test('create prepends the new competition to the list', async () => {
    const svc = new CompetitionsService();
    svc.list.set([comp({ id: 'old' })]);
    const created = await svc.create('New One');
    expect(created?.id).toBe('new');
    expect(svc.list.get().map((c) => c.id)).toEqual(['new', 'old']);
});

test('createRound returns the new share token on success', async () => {
    state.detail = detail({ id: 'c1', lifecycle: 'setup' });
    const svc = new CompetitionsService();
    const res = await svc.createRound({ id: 'c1', courseId: 'course-1', playedAt: '2026-07-18' });
    expect(res).toEqual({ ok: true, shareToken: 'tok-9' });
});

test('createRound surfaces compiler diagnostics as a joined message', async () => {
    apiMock.competitions.createRound.mockResolvedValueOnce({
        ok: false,
        diagnostics: [{ message: 'slot 1 needs teams' }, { message: 'no roster' }],
    } as never);
    const svc = new CompetitionsService();
    const res = await svc.createRound({ id: 'c1', courseId: 'course-1', playedAt: '2026-07-18' });
    expect(res).toEqual({ ok: false, message: 'slot 1 needs teams · no roster' });
    expect(svc.mutateError.get()).toBe('slot 1 needs teams · no roster');
});

test('addGuest creates the guest then adds them, refreshing the roster', async () => {
    state.detail = detail({ id: 'c1', lifecycle: 'setup' });
    const svc = new CompetitionsService();
    const msg = await svc.addGuest(
        'c1',
        { displayName: 'Guest', gender: 'M', handicapIndex: 12 },
        null,
    );
    expect(msg).toBeNull();
    expect(apiMock.guestPlayers.create).toHaveBeenCalled();
    expect(apiMock.competitions.addParticipant).toHaveBeenCalled();
});
