import { beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import type { SetupCourse } from '../../src/api/setup.gen';

// Location-aware course preselect (create flow): `load()` seeds the FIRST
// course until a position fix lands, then the nearest one — and only while the
// selection is still the automatic seed. A course the golfer picked, and an
// edit session, are never moved. The api module and `navigator.geolocation`
// are both mocked; nothing touches the network or a real GPS.

const apiMock = {
    setup: {
        courses: mock(async (): Promise<SetupCourse[]> => []),
        teesByCourse: mock(async () => []),
        formats: mock(async () => []),
    },
};

mock.module('../../src/api', () => ({ api: apiMock, ApiError }));

const { SetupService } = await import('../../src/create/setup.service');

// --- Fixtures -----------------------------------------------------------

function course(id: string, clubName: string, latitude: number | null, longitude: number | null): SetupCourse {
    return {
        id,
        clubId: `club-${clubName}`,
        clubName,
        name: `${clubName} banan`,
        holeCount: 18,
        latitude,
        longitude,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    };
}

// Server order: club-then-name, the far club first.
const goteborg = course('c-far', 'Fjärran GK', 57.7089, 11.9746);
const stockholm = course('c-near', 'Nära GK', 59.3293, 18.0686);
const catalog = [goteborg, stockholm];

const inStockholm = { latitude: 59.33, longitude: 18.07 };

/** Install a geolocation stub; `fix: null` reports failure (denied/timeout). */
function stubGeolocation(fix: { latitude: number; longitude: number } | null): void {
    (navigator as { geolocation?: unknown }).geolocation = {
        getCurrentPosition: (
            ok: (pos: { coords: { latitude: number; longitude: number } }) => void,
            fail: (err: unknown) => void,
        ) => {
            if (fix === null) fail(new Error('denied'));
            else ok({ coords: fix });
        },
    };
}

/** Let the un-awaited locate → applyPosition chain settle. */
const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
    apiMock.setup.courses.mockImplementation(async () => catalog);
    delete (navigator as { geolocation?: unknown }).geolocation;
});

// --- Preselect -----------------------------------------------------------

test('no geolocation: load() seeds the first catalog course', async () => {
    const svc = new SetupService();
    svc.reset();
    svc.roundName.set('Namngiven'); // skip seedDefaultName (locale-dependent)
    await svc.load();
    await settle();
    expect(svc.courseId.get()).toBe('c-far');
    expect(svc.position.get()).toBeNull();
});

test('denied fix: the first-course seed stands', async () => {
    stubGeolocation(null);
    const svc = new SetupService();
    svc.reset();
    svc.roundName.set('Namngiven'); // skip seedDefaultName (locale-dependent)
    await svc.load();
    await settle();
    expect(svc.courseId.get()).toBe('c-far');
    expect(svc.position.get()).toBeNull();
});

test('a fix moves the automatic seed to the nearest course', async () => {
    stubGeolocation(inStockholm);
    const svc = new SetupService();
    svc.reset();
    svc.roundName.set('Namngiven'); // skip seedDefaultName (locale-dependent)
    await svc.load();
    await settle();
    expect(svc.courseId.get()).toBe('c-near');
    expect(svc.position.get()).not.toBeNull();
});

test('a fix never moves a course the golfer picked', async () => {
    stubGeolocation(inStockholm);
    const svc = new SetupService();
    svc.reset();
    svc.roundName.set('Namngiven'); // skip seedDefaultName (locale-dependent)
    // The golfer picks before the fix lands: load() is deliberately not
    // awaited past the pick, mirroring a fast tap on a slow GPS.
    const loading = svc.load();
    await svc.selectCourse('c-far');
    await loading;
    await settle();
    expect(svc.courseId.get()).toBe('c-far');
});

test('orderedCourses: server order without a fix, nearest club first with one', async () => {
    stubGeolocation(inStockholm);
    const svc = new SetupService();
    svc.reset();
    svc.roundName.set('Namngiven'); // skip seedDefaultName (locale-dependent)
    svc.courses.set(catalog);
    expect(svc.orderedCourses().map((c) => c.id)).toEqual(['c-far', 'c-near']);
    await svc.load();
    await settle();
    expect(svc.orderedCourses().map((c) => c.id)).toEqual(['c-near', 'c-far']);
});
