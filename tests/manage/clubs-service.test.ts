import './harness';
import { beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import type { Club } from '../../src/api/clubs.gen';

// `ClubsService` — the Courses section's read/write port (spec §3.2). Same
// harness as the other service tests in this repo: mock the app's api module,
// then import the subject.
//
// Three things are worth testing here and are tested nowhere else: the course
// count is a CLIENT-side join over two open reads (no count endpoint exists),
// every write refetches so the list cannot drift from the server, and a
// refused write hands back the SERVER's sentence rather than a house message —
// which is the whole point of the delete-reference guards.

type CourseRow = { id: string; clubId: string };

const state: {
    clubs: Club[];
    courses: CourseRow[];
    clubListCalls: number;
    courseListCalls: number;
    created: unknown[];
    updated: unknown[];
    removed: string[];
    failWith: unknown;
} = {
    clubs: [],
    courses: [],
    clubListCalls: 0,
    courseListCalls: 0,
    created: [],
    updated: [],
    removed: [],
    failWith: null,
};

function raise(): void {
    if (state.failWith === null) return;
    const err = state.failWith;
    state.failWith = null;
    throw err;
}

const apiMock = {
    clubs: {
        list: mock(async () => {
            state.clubListCalls += 1;
            raise();
            return state.clubs;
        }),
        create: mock(async (input: { name: string }) => {
            raise();
            state.created.push(input);
            const club: Club = { id: 'new', name: input.name, location: null, logoUrl: null };
            state.clubs = [...state.clubs, club];
            return club;
        }),
        update: mock(async (input: { id: string; name?: string }) => {
            raise();
            state.updated.push(input);
            state.clubs = state.clubs.map((club) =>
                club.id === input.id ? { ...club, name: input.name ?? club.name } : club,
            );
            return state.clubs.find((club) => club.id === input.id)!;
        }),
        remove: mock(async (input: { id: string }) => {
            raise();
            state.removed.push(input.id);
            state.clubs = state.clubs.filter((club) => club.id !== input.id);
            return { ok: true };
        }),
    },
    courses: {
        list: mock(async () => {
            state.courseListCalls += 1;
            return state.courses;
        }),
    },
};

mock.module('../../manage/api', () => ({ api: apiMock, API_BASE: '/api', ApiError }));

const { ClubsService, filterClubs } = await import('../../manage/courses/clubs.service');
type ClubRow = import('../../manage/courses/clubs.service').ClubRow;

function club(over: Partial<Club> = {}): Club {
    return { id: 'c1', name: 'Linköpings GK', location: 'Linköping', logoUrl: null, ...over };
}

function row(over: Partial<ClubRow> = {}): ClubRow {
    return { ...club(), courseCount: 0, ...over };
}

beforeEach(() => {
    state.clubs = [
        club({ id: 'c1', name: 'Linköpings GK', location: 'Linköping' }),
        club({ id: 'c2', name: 'Vreta Kloster GK', location: 'Ljungsbro' }),
        club({ id: 'c3', name: 'Sweden Indoor Golf', location: null }),
    ];
    state.courses = [
        { id: 'k1', clubId: 'c1' },
        { id: 'k2', clubId: 'c1' },
        { id: 'k3', clubId: 'c2' },
    ];
    state.clubListCalls = 0;
    state.courseListCalls = 0;
    state.created = [];
    state.updated = [];
    state.removed = [];
    state.failWith = null;
});

test('the course count is joined client-side, because no count endpoint exists', async () => {
    const svc = new ClubsService();
    await svc.load();

    expect(state.clubListCalls).toBe(1);
    expect(state.courseListCalls).toBe(1);
    expect(svc.clubs.get().map((c) => [c.id, c.courseCount])).toEqual([
        ['c1', 2],
        ['c2', 1],
        // A club with no courses counts zero rather than going missing.
        ['c3', 0],
    ]);
});

test('one load per session unless forced — the list and the club page share it', async () => {
    const svc = new ClubsService();
    await Promise.all([svc.load(), svc.load()]);
    await svc.load();

    expect(state.clubListCalls).toBe(1);

    await svc.load(true);
    expect(state.clubListCalls).toBe(2);
});

test('a failed load words the failure and stays retryable', async () => {
    state.failWith = new Error('offline');
    const svc = new ClubsService();
    await svc.load();

    expect(svc.error.get()).toContain('Could not load the clubs');
    expect(svc.loaded.get()).toBe(true);

    // Not a settled failure handed back forever: the next attempt really tries.
    await svc.load();
    expect(state.clubListCalls).toBe(2);
    expect(svc.error.get()).toBeNull();
    expect(svc.clubs.get().length).toBe(3);
});

test('the search filter matches name and location, term by term and in any order', () => {
    const rows = [
        row({ id: 'c1', name: 'Linköpings GK', location: 'Linköping' }),
        row({ id: 'c2', name: 'Vreta Kloster GK', location: 'Ljungsbro' }),
        row({ id: 'c3', name: 'Sweden Indoor Golf', location: null }),
    ];

    expect(filterClubs(rows, '').length).toBe(3);
    expect(filterClubs(rows, '   ').length).toBe(3);
    expect(filterClubs(rows, 'vreta').map((r) => r.id)).toEqual(['c2']);
    // Case-insensitive, and a location-only match counts.
    expect(filterClubs(rows, 'LJUNGSBRO').map((r) => r.id)).toEqual(['c2']);
    // Terms may arrive in either order and may straddle name and location.
    expect(filterClubs(rows, 'gk linköping').map((r) => r.id)).toEqual(['c1']);
    expect(filterClubs(rows, 'linköping gk').map((r) => r.id)).toEqual(['c1']);
    // A club without a location is not excluded by a name-only match.
    expect(filterClubs(rows, 'indoor').map((r) => r.id)).toEqual(['c3']);
    expect(filterClubs(rows, 'nope').length).toBe(0);
});

test('the query signal drives the visible list', async () => {
    const svc = new ClubsService();
    await svc.load();

    expect(svc.visible.get().length).toBe(3);
    svc.query.set('vreta');
    expect(svc.visible.get().map((c) => c.id)).toEqual(['c2']);
    // Filtering is client-side: nothing is refetched.
    expect(state.clubListCalls).toBe(1);
});

test('a create sends a trimmed payload, empty optionals as null, and refetches', async () => {
    const svc = new ClubsService();
    await svc.load();

    const outcome = await svc.create({ name: '  Bråviken GK  ', location: '', logoUrl: '' });

    expect(outcome).toEqual({ ok: true });
    expect(state.created).toEqual([{ name: 'Bråviken GK', location: null, logoUrl: null }]);
    expect(state.clubListCalls).toBe(2);
    expect(svc.clubs.get().length).toBe(4);
});

test('an update refetches too, so the list cannot drift from the server', async () => {
    const svc = new ClubsService();
    await svc.load();

    const outcome = await svc.update('c1', {
        name: 'Linköpings Golfklubb',
        location: 'Linköping',
        logoUrl: '',
    });

    expect(outcome).toEqual({ ok: true });
    expect(state.updated).toEqual([
        { id: 'c1', name: 'Linköpings Golfklubb', location: 'Linköping', logoUrl: null },
    ]);
    expect(state.clubListCalls).toBe(2);
    expect(svc.byId('c1')?.name).toBe('Linköpings Golfklubb');
});

test('a refused delete hands back the SERVER sentence and does not refetch', async () => {
    const svc = new ClubsService();
    await svc.load();

    // What the reference guard (spec §3.7) will say. The client must repeat it,
    // not translate it into a house message — the specifics are the point.
    state.failWith = new ApiError(409, '2 courses still belong to this club. Delete them first.');
    const outcome = await svc.remove('c1');

    expect(outcome).toEqual({
        ok: false,
        message: '2 courses still belong to this club. Delete them first.',
    });
    expect(state.removed).toEqual([]);
    expect(state.clubListCalls).toBe(1);
    // Nothing pre-blocked it client-side: the request really went out.
    expect(svc.byId('c1')?.courseCount).toBe(2);
});

test('a delete that lands removes the club and refetches', async () => {
    const svc = new ClubsService();
    await svc.load();

    expect(await svc.remove('c3')).toEqual({ ok: true });
    expect(state.removed).toEqual(['c3']);
    expect(state.clubListCalls).toBe(2);
    expect(svc.byId('c3')).toBeNull();
});

test('a transport failure on a write falls back to app copy, not a blank message', async () => {
    const svc = new ClubsService();
    await svc.load();

    state.failWith = new Error('network down');
    const outcome = await svc.create({ name: 'Nowhere GK', location: '', logoUrl: '' });

    expect(outcome.ok).toBe(false);
    expect(outcome.ok === false && outcome.message).toContain('Could not create the club');
});

test('a validation 400 arrives with its field details attached', async () => {
    const svc = new ClubsService();
    await svc.load();

    state.failWith = new ApiError(400, 'Validation failed', [
        { path: '/name', message: 'Expected string' },
    ]);
    const outcome = await svc.create({ name: 'x', location: '', logoUrl: '' });

    expect(outcome.ok === false && outcome.message).toBe(
        'Validation failed: name — Expected string',
    );
});
