// The stats dashboard's WINDOW: which of the fetched per-round rows the panels
// add up.
//
// The proposal's whole architecture rests on this being client-side
// (`docs/proposals/player-stats-presentation.md` §0): the server returns one
// count row per round and never a rate, so every window — last 5, this year, a
// hand-picked set of six rounds at one course — is a SELECTION over rows this
// client already holds, followed by `sumMeasures` and the rate math in
// `src/round/stat-measures.ts`. There is no per-filter endpoint and there must
// never be one.
//
// Twin of `ios/TapScore/Features/Stats/StatsWindow.swift`; the decisions below
// are the same decisions, and a change to one belongs in both.
//
// Everything in this file is pure: no service, no network, no DOM. It takes
// rows and a `now` and returns rows.

import { defaultStorage, deviceStore, type DeviceStorage } from '../device-store';
import type { PlayerRoundStats } from '../api/player-stats.gen';

export type StatsWindowPreset = 'last5' | 'last10' | 'last20' | 'thisYear' | 'all' | 'custom';

/** Picker order: recent form, then everything, then the hand-built window. */
export const STATS_WINDOW_PRESETS: readonly StatsWindowPreset[] = [
    'last5',
    'last10',
    'last20',
    'thisYear',
    'all',
    'custom',
];

/** The picker's row label. */
export function presetTitle(preset: StatsWindowPreset): string {
    switch (preset) {
        case 'last5':
            return 'Last 5 rounds';
        case 'last10':
            return 'Last 10 rounds';
        case 'last20':
            return 'Last 20 rounds';
        case 'thisYear':
            return 'This year';
        case 'all':
            return 'All rounds';
        case 'custom':
            return 'Custom';
    }
}

/**
 * A one-line explanation for the picker row, in the tone of the profile's
 * hints — what the window MEANS, not what it filters on.
 */
export function presetSubtitle(preset: StatsWindowPreset): string {
    switch (preset) {
        case 'last5':
            return 'Your five most recent rounds with stats';
        case 'last10':
            return 'Enough rounds for percentages to settle';
        case 'last20':
            return "A season's worth of form";
        case 'thisYear':
            return 'Every round dated this calendar year';
        case 'all':
            return 'Everything you have ever recorded';
        case 'custom':
            return 'Pick dates, courses and rounds by hand';
    }
}

/**
 * How many of the NEWEST rounds this preset takes, or null when the window is
 * not count-based.
 */
export function presetRoundLimit(preset: StatsWindowPreset): number | null {
    switch (preset) {
        case 'last5':
            return 5;
        case 'last10':
            return 10;
        case 'last20':
            return 20;
        default:
            return null;
    }
}

export type StatsVenueType = PlayerRoundStats['venueType'];
export type StatsRoundType = PlayerRoundStats['roundType'];

/**
 * The custom window's criteria. Every collection is **empty-means-everything**,
 * which is what makes the default filter the identity: opening the filter panel
 * and closing it again must not silently narrow the window.
 *
 * Dates are the wire's `yyyy-MM-dd`, compared as strings. That ordering is
 * exactly the calendar's for a zero-padded ISO day, and it sidesteps the
 * timezone question a `Date` round-trip would introduce for a value that is a
 * calendar DAY, not an instant. `<input type="date">` hands back exactly that
 * shape, so the web filter never builds a `Date` at all (iOS needs a
 * local-day conversion only because `DatePicker` deals in instants).
 *
 * Readonly arrays rather than `Set`s: these hold a handful of ids at most, the
 * membership tests are not hot, and an array compares and serialises the same
 * way in every test.
 */
export interface StatsRoundFilter {
    /** Inclusive lower bound, `yyyy-MM-dd`. */
    readonly from: string | null;
    /** Inclusive upper bound, `yyyy-MM-dd`. */
    readonly to: string | null;
    /** Empty = every course. */
    readonly courseIds: readonly string[];
    /** Empty = indoor and outdoor. */
    readonly venueTypes: readonly StatsVenueType[];
    /** Empty = every round type. */
    readonly roundTypes: readonly StatsRoundType[];
    /**
     * Rounds the player struck out by hand. This is the ONE field that is not
     * "empty means everything" in the same sense — it always subtracts.
     */
    readonly excludedRoundIds: readonly string[];
}

/** The identity filter: admits every row. */
export const EMPTY_FILTER: StatsRoundFilter = {
    from: null,
    to: null,
    courseIds: [],
    venueTypes: [],
    roundTypes: [],
    excludedRoundIds: [],
};

/** True when the filter constrains nothing. */
export function filterIsEmpty(f: StatsRoundFilter): boolean {
    return (
        f.from === null &&
        f.to === null &&
        f.courseIds.length === 0 &&
        f.venueTypes.length === 0 &&
        f.roundTypes.length === 0 &&
        f.excludedRoundIds.length === 0
    );
}

/** Does this row survive every criterion? */
export function filterAdmits(f: StatsRoundFilter, row: PlayerRoundStats): boolean {
    if (f.from !== null && row.date < f.from) return false;
    if (f.to !== null && row.date > f.to) return false;
    if (f.courseIds.length > 0 && !f.courseIds.includes(row.courseId)) return false;
    if (f.venueTypes.length > 0 && !f.venueTypes.includes(row.venueType)) return false;
    if (f.roundTypes.length > 0 && !f.roundTypes.includes(row.roundType)) return false;
    if (f.excludedRoundIds.includes(row.roundId)) return false;
    return true;
}

/** Add or remove one entry of a filter's list field, returning a new filter. */
export function toggleFilterEntry<K extends 'courseIds' | 'venueTypes' | 'roundTypes'>(
    f: StatsRoundFilter,
    key: K,
    value: StatsRoundFilter[K][number],
): StatsRoundFilter {
    const current = f[key] as readonly string[];
    const next = current.includes(value as string)
        ? current.filter((v) => v !== value)
        : [...current, value as string];
    return { ...f, [key]: next };
}

/**
 * Include or exclude one round by hand. Note the stored shape is EXCLUSIONS,
 * never inclusions: a round the player has not touched is in the window, and a
 * later page arriving must not need every new row ticked to count.
 */
export function setRoundIncluded(
    f: StatsRoundFilter,
    roundId: string,
    included: boolean,
): StatsRoundFilter {
    const has = f.excludedRoundIds.includes(roundId);
    if (included === !has) return f;
    return {
        ...f,
        excludedRoundIds: included
            ? f.excludedRoundIds.filter((id) => id !== roundId)
            : [...f.excludedRoundIds, roundId],
    };
}

/**
 * Newest first, deterministically.
 *
 * The server already answers newest-first (keyset on `date`), but pages arrive
 * over time and a test builds rows in whatever order it likes, so the window
 * sorts rather than trusting arrival order. `roundId` tie-breaks, because two
 * rounds on one day are common (a morning and an afternoon nine) and "the last
 * 5" must not depend on which page they came in on.
 */
export function sortRows(rows: readonly PlayerRoundStats[]): PlayerRoundStats[] {
    return [...rows].sort((a, b) =>
        a.date === b.date ? (a.roundId > b.roundId ? -1 : a.roundId < b.roundId ? 1 : 0) : a.date > b.date ? -1 : 1,
    );
}

/**
 * `"2026-"` — the string every round dated this calendar year starts with.
 *
 * The year is GREGORIAN and read with `getFullYear()`, which is proleptic
 * Gregorian in the host's local zone by definition. The trap iOS has to dodge
 * (a device set to the Buddhist calendar answering 2569, matching no row the
 * server ever wrote) reaches the web only through `Intl`/`toLocaleDateString`
 * with a non-Gregorian calendar — so this must never use either. Only the
 * ZONE is the device's to decide, because that is what says which day "today"
 * is, and `getFullYear()` already reads it.
 */
export function yearPrefix(now: Date): string {
    return `${now.getFullYear()}-`;
}

/**
 * The rows a window covers, newest first.
 *
 * Note the ORDER of operations for `custom`: the filter is applied and the
 * result is NOT truncated. A count-based preset truncates and applies no
 * filter. The two never compose — a "last 10 at Linköping" window is
 * expressible in the filter panel (a date range plus a course plus the
 * checklist) and deliberately not as a preset wearing a filter, which would
 * leave the picker saying "Last 10" over a window of three.
 */
export function applyWindow(
    preset: StatsWindowPreset,
    filter: StatsRoundFilter,
    rows: readonly PlayerRoundStats[],
    now: Date,
): PlayerRoundStats[] {
    const ordered = sortRows(rows);
    switch (preset) {
        case 'last5':
        case 'last10':
        case 'last20': {
            const limit = presetRoundLimit(preset);
            return limit === null ? ordered : ordered.slice(0, limit);
        }
        case 'thisYear': {
            const prefix = yearPrefix(now);
            return ordered.filter((r) => r.date.startsWith(prefix));
        }
        case 'all':
            return ordered;
        case 'custom':
            return ordered.filter((r) => filterAdmits(filter, r));
    }
}

/**
 * Should the service ask the server for another page before it can honestly
 * draw this window?
 *
 * The question is never "do I have enough rows" but "could an older row still
 * belong in the window" — which is why a satisfied count-based window stops
 * paging while `all` never does. A window that keeps paging when the answer
 * cannot change is a browser downloading a career to render five rounds; a
 * window that stops too early is a percentage computed over half its sample,
 * which is worse.
 *
 * `hasMore` = the server handed back a `nextCursor`.
 */
export function needsMoreHistory(args: {
    preset: StatsWindowPreset;
    filter: StatsRoundFilter;
    loaded: readonly PlayerRoundStats[];
    hasMore: boolean;
    now: Date;
}): boolean {
    const { preset, filter, loaded, hasMore, now } = args;
    if (!hasMore) return false;
    switch (preset) {
        case 'last5':
        case 'last10':
        case 'last20': {
            const limit = presetRoundLimit(preset);
            return limit === null ? false : loaded.length < limit;
        }
        case 'thisYear': {
            // Satisfied once a row OLDER than January 1st has arrived: the feed
            // is newest-first, so that row proves this year is complete.
            const firstOfYear = `${yearPrefix(now)}01-01`;
            return !loaded.some((r) => r.date < firstOfYear);
        }
        case 'all':
            return true;
        case 'custom': {
            // The contract, in order:
            //
            // - An EMPTY filter constrains nothing, so there is nothing to page
            //   FOR. That is exactly what `custom` looks like the moment it is
            //   picked, before the panel has even opened: falling through to the
            //   unlimited case there drains a whole career to render the same
            //   rows already on screen. It behaves like the loaded fallback
            //   until a criterion exists.
            // - A `from` bound is the one criterion a newest-first feed can
            //   PROVE complete: once a row older than it is in hand, no
            //   unfetched row can be inside the range.
            // - Every other criterion (course, venue, the checklist) is
            //   satisfiable only by the whole history, so it pages to the end.
            if (filterIsEmpty(filter)) return false;
            if (filter.from === null) return true;
            const from = filter.from;
            return !loaded.some((r) => r.date < from);
        }
    }
}

/** One course the fetched rows mention, for the filter panel's course list. */
export interface StatsCourseOption {
    id: string;
    name: string;
    /**
     * How many fetched rounds were played there — nothing orders by it, but a
     * course with one round reads differently from one with forty and the row
     * says so.
     */
    roundCount: number;
}

const UNNAMED_COURSE = 'Unnamed course';

/**
 * The distinct courses in the fetched rows, name-ordered — the filter panel's
 * course list.
 *
 * Built from the ROWS rather than from `GET /courses`: a course the player has
 * never played is not a filter, it is a dead row, and the whole point of this
 * screen is that it needs no read the dashboard has not already done.
 */
export function courseOptions(rows: readonly PlayerRoundStats[]): StatsCourseOption[] {
    const counts = new Map<string, number>();
    const names = new Map<string, string>();
    for (const row of rows) {
        counts.set(row.courseId, (counts.get(row.courseId) ?? 0) + 1);
        // The first non-empty name wins; a row whose course was deleted carries
        // a null name and must not blank a name a sibling row has.
        if (!names.has(row.courseId) && row.courseName) names.set(row.courseId, row.courseName);
    }
    return [...counts.keys()]
        .map((id) => ({
            id,
            name: names.get(id) ?? UNNAMED_COURSE,
            roundCount: counts.get(id) ?? 0,
        }))
        .sort((a, b) => {
            const byName = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
            return byName !== 0 ? byName : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
        });
}

/**
 * Ten rounds: enough denominator for most rates to clear the display policy's
 * floor of 5, few enough to still be "your current game".
 */
export const FALLBACK_PRESET: StatsWindowPreset = 'last10';

function isPreset(raw: string): raw is StatsWindowPreset {
    return (STATS_WINDOW_PRESETS as readonly string[]).includes(raw);
}

// Stored as the bare preset string under the SAME key iOS uses. Nothing is
// shared between the two stores, but keeping the key identical means one
// vocabulary to reason about when a preset is added or renamed.
//
// The custom FILTER is deliberately not persisted — it is a within-session
// refinement, and a restored `custom` opens on the empty filter, which admits
// everything and is honest about it rather than silently re-applying criteria
// from a week ago.
const store = deviceStore<StatsWindowPreset>('tapscore.stats.window.v1', {
    decode: (raw) => (isPreset(raw) ? raw : FALLBACK_PRESET),
    encode: (preset) => preset,
    empty: FALLBACK_PRESET,
});

/** Read the saved window preset; `last10` when absent or unreadable. */
export function loadWindowPreset(
    storage: DeviceStorage | null = defaultStorage(),
): StatsWindowPreset {
    return store.read(storage);
}

/** Persist the window preset. A storage failure is swallowed (best-effort). */
export function saveWindowPreset(
    preset: StatsWindowPreset,
    storage: DeviceStorage | null = defaultStorage(),
): void {
    store.write(preset, storage);
}
