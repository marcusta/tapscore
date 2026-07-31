import { expect, test } from 'bun:test';
import {
    applyWindow,
    courseOptions,
    EMPTY_FILTER,
    FALLBACK_PRESET,
    filterAdmits,
    filterIsEmpty,
    loadWindowPreset,
    needsMoreHistory,
    presetRoundLimit,
    saveWindowPreset,
    setRoundIncluded,
    sortRows,
    toggleFilterEntry,
    yearPrefix,
    type StatsRoundFilter,
} from '../../src/stats/stats-window';
import { ZERO_MEASURES } from '../../src/round/stat-measures';
import type { PlayerRoundStats } from '../../src/api/player-stats.gen';
import type { DeviceStorage } from '../../src/device-store';

// Pure window selection over already-fetched rows. No DOM, no network, no
// clock — `now` is injected. Twin of the Swift `StatsWindowTests`.

function row(over: Partial<PlayerRoundStats> & { roundId: string; date: string }): PlayerRoundStats {
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

/** Rows dated 2026-06-01 backwards, one per day, newest first. */
function series(n: number): PlayerRoundStats[] {
    return Array.from({ length: n }, (_, i) =>
        row({ roundId: `r${i}`, date: `2026-06-${String(30 - i).padStart(2, '0')}` }),
    );
}

const NOW = new Date('2026-06-15T12:00:00Z');

function memStorage(seed?: string): DeviceStorage & { value: string | null } {
    return {
        value: seed ?? null,
        getItem(_key: string) {
            return this.value;
        },
        setItem(_key: string, v: string) {
            this.value = v;
        },
    };
}

// --- Sorting -----------------------------------------------------------------

test('sortRows puts newest first and tie-breaks on round id descending', () => {
    const rows = [
        row({ roundId: 'a', date: '2026-05-01' }),
        row({ roundId: 'z', date: '2026-05-01' }),
        row({ roundId: 'm', date: '2026-06-01' }),
    ];
    expect(sortRows(rows).map((r) => r.roundId)).toEqual(['m', 'z', 'a']);
});

test('sortRows does not mutate its input', () => {
    const rows = [row({ roundId: 'a', date: '2026-05-01' }), row({ roundId: 'b', date: '2026-06-01' })];
    sortRows(rows);
    expect(rows.map((r) => r.roundId)).toEqual(['a', 'b']);
});

// --- Presets -----------------------------------------------------------------

test('count presets take the newest N and apply no filter', () => {
    const rows = series(30);
    // A filter that would exclude everything is ignored by a count preset.
    const hostile: StatsRoundFilter = { ...EMPTY_FILTER, courseIds: ['nope'] };
    expect(applyWindow('last5', hostile, rows, NOW)).toHaveLength(5);
    expect(applyWindow('last10', hostile, rows, NOW)).toHaveLength(10);
    expect(applyWindow('last20', hostile, rows, NOW)).toHaveLength(20);
    expect(applyWindow('last5', hostile, rows, NOW)[0]!.date).toBe('2026-06-30');
});

test('a count preset with fewer rows than its limit returns what there is', () => {
    expect(applyWindow('last20', EMPTY_FILTER, series(3), NOW)).toHaveLength(3);
});

test('thisYear keeps only rows whose date carries the current year prefix', () => {
    const rows = [
        row({ roundId: 'a', date: '2026-01-01' }),
        row({ roundId: 'b', date: '2025-12-31' }),
        row({ roundId: 'c', date: '2026-06-30' }),
    ];
    expect(applyWindow('thisYear', EMPTY_FILTER, rows, NOW).map((r) => r.roundId)).toEqual(['c', 'a']);
});

test('all returns every row, sorted', () => {
    expect(applyWindow('all', EMPTY_FILTER, series(30), NOW)).toHaveLength(30);
});

test('custom filters and does NOT truncate', () => {
    const rows = series(30);
    expect(applyWindow('custom', EMPTY_FILTER, rows, NOW)).toHaveLength(30);
});

test('yearPrefix is the Gregorian local year', () => {
    expect(yearPrefix(new Date('2026-06-15T12:00:00Z'))).toBe('2026-');
    expect(presetRoundLimit('thisYear')).toBeNull();
});

// --- Filter ------------------------------------------------------------------

test('the default filter is the identity', () => {
    expect(filterIsEmpty(EMPTY_FILTER)).toBe(true);
    expect(filterAdmits(EMPTY_FILTER, row({ roundId: 'a', date: '2026-01-01' }))).toBe(true);
});

test('date bounds are inclusive and compared as ISO day strings', () => {
    const f: StatsRoundFilter = { ...EMPTY_FILTER, from: '2026-05-01', to: '2026-05-31' };
    expect(filterAdmits(f, row({ roundId: 'a', date: '2026-05-01' }))).toBe(true);
    expect(filterAdmits(f, row({ roundId: 'b', date: '2026-05-31' }))).toBe(true);
    expect(filterAdmits(f, row({ roundId: 'c', date: '2026-04-30' }))).toBe(false);
    expect(filterAdmits(f, row({ roundId: 'd', date: '2026-06-01' }))).toBe(false);
});

test('course, venue and round type are empty-means-everything', () => {
    const r = row({ roundId: 'a', date: '2026-05-01', courseId: 'c9', venueType: 'indoor', roundType: 'front_9' });
    expect(filterAdmits({ ...EMPTY_FILTER, courseIds: ['c9'] }, r)).toBe(true);
    expect(filterAdmits({ ...EMPTY_FILTER, courseIds: ['c1'] }, r)).toBe(false);
    expect(filterAdmits({ ...EMPTY_FILTER, venueTypes: ['indoor'] }, r)).toBe(true);
    expect(filterAdmits({ ...EMPTY_FILTER, venueTypes: ['outdoor'] }, r)).toBe(false);
    expect(filterAdmits({ ...EMPTY_FILTER, roundTypes: ['front_9'] }, r)).toBe(true);
    expect(filterAdmits({ ...EMPTY_FILTER, roundTypes: ['full_18'] }, r)).toBe(false);
});

test('excluded round ids always subtract', () => {
    const f: StatsRoundFilter = { ...EMPTY_FILTER, excludedRoundIds: ['a'] };
    expect(filterIsEmpty(f)).toBe(false);
    expect(filterAdmits(f, row({ roundId: 'a', date: '2026-05-01' }))).toBe(false);
    expect(filterAdmits(f, row({ roundId: 'b', date: '2026-05-01' }))).toBe(true);
});

test('toggleFilterEntry adds then removes', () => {
    const on = toggleFilterEntry(EMPTY_FILTER, 'venueTypes', 'indoor');
    expect(on.venueTypes).toEqual(['indoor']);
    expect(toggleFilterEntry(on, 'venueTypes', 'indoor').venueTypes).toEqual([]);
});

test('setRoundIncluded stores exclusions, so unseen rows stay in', () => {
    const out = setRoundIncluded(EMPTY_FILTER, 'a', false);
    expect(out.excludedRoundIds).toEqual(['a']);
    // A round never touched is admitted without ever being listed.
    expect(filterAdmits(out, row({ roundId: 'b', date: '2026-05-01' }))).toBe(true);
    expect(setRoundIncluded(out, 'a', true).excludedRoundIds).toEqual([]);
    // Idempotent.
    expect(setRoundIncluded(out, 'a', false)).toBe(out);
});

// --- needsMoreHistory --------------------------------------------------------

test('no cursor means never page, whatever the window', () => {
    for (const preset of ['last20', 'thisYear', 'all', 'custom'] as const) {
        expect(
            needsMoreHistory({
                preset,
                filter: { ...EMPTY_FILTER, courseIds: ['c1'] },
                loaded: [],
                hasMore: false,
                now: NOW,
            }),
        ).toBe(false);
    }
});

test('a count preset pages until it holds its limit, then stops', () => {
    const args = { preset: 'last10' as const, filter: EMPTY_FILTER, hasMore: true, now: NOW };
    expect(needsMoreHistory({ ...args, loaded: series(9) })).toBe(true);
    expect(needsMoreHistory({ ...args, loaded: series(10) })).toBe(false);
    expect(needsMoreHistory({ ...args, loaded: series(11) })).toBe(false);
});

test('thisYear pages until a row older than January 1st proves the year complete', () => {
    const args = { preset: 'thisYear' as const, filter: EMPTY_FILTER, hasMore: true, now: NOW };
    expect(needsMoreHistory({ ...args, loaded: [row({ roundId: 'a', date: '2026-01-01' })] })).toBe(true);
    expect(needsMoreHistory({ ...args, loaded: [row({ roundId: 'b', date: '2025-12-31' })] })).toBe(false);
});

test('all pages to the end of history', () => {
    expect(
        needsMoreHistory({
            preset: 'all',
            filter: EMPTY_FILTER,
            loaded: series(500),
            hasMore: true,
            now: NOW,
        }),
    ).toBe(true);
});

test('an EMPTY custom filter does not page', () => {
    // The state `custom` is in the instant it is picked. Paging here would
    // drain a career to render the rows already on screen.
    expect(
        needsMoreHistory({
            preset: 'custom',
            filter: EMPTY_FILTER,
            loaded: series(3),
            hasMore: true,
            now: NOW,
        }),
    ).toBe(false);
});

test('a custom `from` bound stops once an older row is in hand', () => {
    const filter: StatsRoundFilter = { ...EMPTY_FILTER, from: '2026-06-20' };
    const args = { preset: 'custom' as const, filter, hasMore: true, now: NOW };
    expect(needsMoreHistory({ ...args, loaded: series(5) })).toBe(true); // down to 2026-06-26
    expect(needsMoreHistory({ ...args, loaded: series(12) })).toBe(false); // reaches 2026-06-19
});

test('a custom filter without a `from` bound pages to the end', () => {
    expect(
        needsMoreHistory({
            preset: 'custom',
            filter: { ...EMPTY_FILTER, courseIds: ['c1'] },
            loaded: series(200),
            hasMore: true,
            now: NOW,
        }),
    ).toBe(true);
});

// --- Course options ----------------------------------------------------------

test('courseOptions counts rounds, keeps the first non-empty name and sorts by name', () => {
    const rows = [
        row({ roundId: 'a', date: '2026-05-03', courseId: 'c2', courseName: 'Vreta' }),
        row({ roundId: 'b', date: '2026-05-02', courseId: 'c1', courseName: 'Linköping' }),
        row({ roundId: 'c', date: '2026-05-01', courseId: 'c1', courseName: null }),
        row({ roundId: 'd', date: '2026-04-01', courseId: 'c3', courseName: null }),
    ];
    expect(courseOptions(rows)).toEqual([
        { id: 'c1', name: 'Linköping', roundCount: 2 },
        { id: 'c3', name: 'Unnamed course', roundCount: 1 },
        { id: 'c2', name: 'Vreta', roundCount: 1 },
    ]);
});

test('a null name on the FIRST row does not blank a sibling row that has one', () => {
    const rows = [
        row({ roundId: 'a', date: '2026-05-02', courseId: 'c1', courseName: null }),
        row({ roundId: 'b', date: '2026-05-01', courseId: 'c1', courseName: 'Linköping' }),
    ];
    expect(courseOptions(rows)[0]!.name).toBe('Linköping');
});

// --- Persistence -------------------------------------------------------------

test('the preset round-trips through device storage', () => {
    const storage = memStorage();
    saveWindowPreset('last20', storage);
    expect(storage.value).toBe('last20');
    expect(loadWindowPreset(storage)).toBe('last20');
});

test('absent, unrecognised or unavailable storage reads as the fallback', () => {
    expect(loadWindowPreset(memStorage())).toBe(FALLBACK_PRESET);
    expect(loadWindowPreset(memStorage('lastSeventeen'))).toBe(FALLBACK_PRESET);
    expect(loadWindowPreset(null)).toBe(FALLBACK_PRESET);
    expect(FALLBACK_PRESET).toBe('last10');
});
