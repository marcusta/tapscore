import './harness';
import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import { di } from '@basics/core/client/core';
import { mount, press } from './harness';
import type { Tee } from '../../src/api/tees.gen';
import type { ClubCourse, CourseTeeRole, TeeRole } from '../../src/api/courses.gen';

// The tee-role matrix on the course page (spec §3.6) — a COMPONENT with club
// and course ids, not a screen.
//
// What is asserted here is what it decides: that its ROWS come from the server's
// catalog (a fourth role appears without a code change), that a cell offers only
// the tees rated for that column's gender, what a pick and a clear put on the
// wire, what a refused write leaves on screen, that the popover states the LIVE
// resolution rather than static copy, and that unticking a tee's rating — which
// the server cascades into the mappings through a trigger — does not leave a
// mapping on screen that the database no longer holds.

const state: {
    catalog: TeeRole[];
    courses: ClubCourse[];
    tees: Tee[];
    mappings: CourseTeeRole[];
    set: unknown[];
    cleared: unknown[];
    failWith: unknown;
} = {
    catalog: [],
    courses: [],
    tees: [],
    mappings: [],
    set: [],
    cleared: [],
    failWith: null,
};

function raise(): void {
    if (state.failWith === null) return;
    const err = state.failWith;
    state.failWith = null;
    throw err;
}

const apiMock = {
    clubs: { list: mock(async () => []) },
    courses: {
        listByClub: mock(async (input: { clubId: string }) =>
            state.courses.filter((course) => course.clubId === input.clubId),
        ),
        teeRoleCatalog: mock(async () => state.catalog),
        teeRoles: mock(async (input: { courseId: string }) =>
            state.mappings.filter((mapping) => mapping.courseId === input.courseId),
        ),
        setTeeRole: mock(
            async (input: { courseId: string; roleKey: string; gender: 'M' | 'F'; teeId: string }) => {
                raise();
                state.set.push(input);
                state.mappings = [
                    ...state.mappings.filter(
                        (mapping) =>
                            !(mapping.roleKey === input.roleKey && mapping.gender === input.gender),
                    ),
                    input,
                ];
                return input;
            },
        ),
        clearTeeRole: mock(
            async (input: { courseId: string; roleKey: string; gender: 'M' | 'F' }) => {
                raise();
                state.cleared.push(input);
                state.mappings = state.mappings.filter(
                    (mapping) =>
                        !(mapping.roleKey === input.roleKey && mapping.gender === input.gender),
                );
                return { ok: true };
            },
        ),
    },
    tees: {
        listByCourse: mock(async (input: { courseId: string }) =>
            state.tees.filter((tee) => tee.courseId === input.courseId),
        ),
    },
};

mock.module('../../manage/api', () => ({ api: apiMock, API_BASE: '/api', ApiError }));

const { CoursesService } = await import('../../manage/courses/courses.service');
const { TeesService } = await import('../../manage/courses/tees.service');
const { TeeRolesService } = await import('../../manage/courses/tee-roles.service');
const { TeeRolesComponent } = await import('../../manage/courses/tee-roles.component');

const MEN = { gender: 'M' as const, courseRating: 71.4, slope: 132, par: 72, totalLengthM: 5812 };
const WOMEN = { gender: 'F' as const, courseRating: 73.9, slope: 128, par: 73, totalLengthM: 5104 };

function tee(over: Partial<Tee> = {}): Tee {
    return {
        id: 't1',
        courseId: 'k1',
        name: 'Gul',
        colour: null,
        holeLengths: [],
        ratings: [MEN, WOMEN],
        ...over,
    };
}

let open: { destroy(): void } | null = null;

beforeEach(() => {
    state.catalog = [
        { roleKey: 'club', displayName: 'Club', sortOrder: 1 },
        { roleKey: 'tournament', displayName: 'Tournament', sortOrder: 2 },
        { roleKey: 'beginner', displayName: 'Beginner', sortOrder: 3 },
    ];
    state.courses = [
        {
            id: 'k1',
            clubId: 'c1',
            name: 'Old course',
            holeCount: 18,
            latitude: null,
            longitude: null,
            holes: [],
            teeCount: 4,
        },
    ];
    // The real Linköpings shape: one tee rated for men only, one for women only.
    state.tees = [
        tee({ id: 'vit', name: 'Vit', ratings: [MEN] }),
        tee({ id: 'gul', name: 'Gul', ratings: [MEN, WOMEN] }),
        tee({ id: 'rod', name: 'Röd', ratings: [WOMEN] }),
        tee({ id: 'orange', name: 'Orange', ratings: [WOMEN] }),
    ];
    state.mappings = [];
    state.set = [];
    state.cleared = [];
    state.failWith = null;
    apiMock.courses.teeRoles.mockClear();
    apiMock.courses.teeRoleCatalog.mockClear();
    apiMock.courses.setTeeRole.mockClear();
    apiMock.courses.clearTeeRole.mockClear();
    di.reset();
});

afterEach(() => {
    open?.destroy();
    open = null;
});

async function settle(): Promise<void> {
    for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
}

async function matrix(courseId = 'k1') {
    di.set(CoursesService, new CoursesService());
    const tees = new TeesService();
    di.set(TeesService, tees);
    const roles = new TeeRolesService();
    di.set(TeeRolesService, roles);

    const mounted = mount(new TeeRolesComponent({ courseId }));
    open = mounted;
    await settle();
    return { ...mounted, tees, roles };
}

const roleRows = (host: HTMLElement): HTMLElement[] =>
    [...host.querySelectorAll('.mrole')] as HTMLElement[];

const roleRow = (host: HTMLElement, displayName: string): HTMLElement =>
    roleRows(host).find(
        (row) => row.querySelector('.mrole__name')?.textContent?.trim() === displayName,
    ) as HTMLElement;

/** One cell of the matrix — Men is the first column, Women the second. */
const cell = (row: HTMLElement, gender: 'M' | 'F'): HTMLElement =>
    row.querySelectorAll('.mrole__cell')[gender === 'M' ? 0 : 1] as HTMLElement;

const shown = (cellEl: HTMLElement): string =>
    (cellEl.querySelector('.ui-select__trigger-label')?.textContent ?? '').trim();

const options = (cellEl: HTMLElement): string[] =>
    [...cellEl.querySelectorAll('.ui-select__option-label')].map(
        (node) => node.textContent?.trim() ?? '',
    );

function pick(cellEl: HTMLElement, label: string): void {
    (cellEl.querySelector('.ui-select__trigger') as HTMLButtonElement).click();
    const option = [...cellEl.querySelectorAll('.ui-select__option')].find(
        (node) => node.querySelector('.ui-select__option-label')?.textContent?.trim() === label,
    ) as HTMLButtonElement;
    option.click();
}

/** The section's own retry — NOT the popover's Close, which shares its class. */
const retry = (host: HTMLElement): HTMLButtonElement =>
    [...host.querySelectorAll('.mroles__secondary')].find(
        (node) => node.textContent?.trim() === 'Try again',
    ) as HTMLButtonElement;

const text = (host: HTMLElement, selector: string): string =>
    (host.querySelector(selector)?.textContent ?? '').trim();

const visible = (host: HTMLElement, selector: string): boolean => {
    const el = host.querySelector(selector) as HTMLElement | null;
    return el !== null && !el.hasAttribute('hidden');
};

// ─── The rows are the catalog ───

test('a row per catalog role, in the server’s order, with the server’s display name', async () => {
    const { host } = await matrix();

    expect(roleRows(host).map((row) => row.querySelector('.mrole__name')?.textContent)).toEqual([
        'Club',
        'Tournament',
        'Beginner',
    ]);
});

test('a FOURTH role appears with no code change — the rows are data, not a constant', async () => {
    state.catalog = [
        ...state.catalog,
        { roleKey: 'junior', displayName: 'Junior', sortOrder: 4 },
    ];
    const { host } = await matrix();

    expect(roleRows(host).map((row) => row.querySelector('.mrole__name')?.textContent)).toEqual([
        'Club',
        'Tournament',
        'Beginner',
        'Junior',
    ]);
    // And it is a working row, not a label: it carries both editors.
    expect(roleRow(host, 'Junior').querySelectorAll('.ui-select').length).toBe(2);
});

// ─── What a cell offers ───

test('each column offers only the tees rated for its gender, and the two differ', async () => {
    const { host } = await matrix();
    const club = roleRow(host, 'Club');

    expect(options(cell(club, 'M'))).toEqual(['Not set', 'Vit', 'Gul']);
    expect(options(cell(club, 'F'))).toEqual(['Not set', 'Gul', 'Röd', 'Orange']);
});

test('an existing mapping is what the cell shows', async () => {
    state.mappings = [{ courseId: 'k1', roleKey: 'club', gender: 'M', teeId: 'vit' }];
    const { host } = await matrix();

    expect(shown(cell(roleRow(host, 'Club'), 'M'))).toBe('Vit');
    expect(shown(cell(roleRow(host, 'Club'), 'F'))).toBe('Not set');
});

// ─── Set and clear ───

test('picking a tee writes that role, gender and tee — and the cell keeps it', async () => {
    const { host } = await matrix();

    pick(cell(roleRow(host, 'Club'), 'M'), 'Gul');
    await settle();

    expect(state.set).toEqual([
        { courseId: 'k1', roleKey: 'club', gender: 'M', teeId: 'gul' },
    ]);
    expect(shown(cell(roleRow(host, 'Club'), 'M'))).toBe('Gul');
    // The other cells are untouched: one cell is one write.
    expect(state.cleared).toEqual([]);
    expect(shown(cell(roleRow(host, 'Tournament'), 'M'))).toBe('Not set');
});

test('"Not set" clears the mapping with a DELETE rather than writing an empty tee', async () => {
    state.mappings = [{ courseId: 'k1', roleKey: 'beginner', gender: 'F', teeId: 'rod' }];
    const { host } = await matrix();

    pick(cell(roleRow(host, 'Beginner'), 'F'), 'Not set');
    await settle();

    expect(state.cleared).toEqual([{ courseId: 'k1', roleKey: 'beginner', gender: 'F' }]);
    expect(state.set).toEqual([]);
    expect(shown(cell(roleRow(host, 'Beginner'), 'F'))).toBe('Not set');
});

test('the server stays the authority: a mapping the server rejects is not applied locally', async () => {
    // The mirror of the server rule is a courtesy, not a gate — the write path
    // does not pre-check anything, so a refusal is the only thing that decides.
    state.failWith = new ApiError(409, 'tee has no rating for the mapped gender');
    const { host } = await matrix();

    pick(cell(roleRow(host, 'Club'), 'M'), 'Vit');
    await settle();

    expect(state.mappings).toEqual([]);
});

// ─── A refused write ───

test('a refused write words the refusal for this surface and puts the cell back', async () => {
    state.mappings = [{ courseId: 'k1', roleKey: 'club', gender: 'M', teeId: 'gul' }];
    state.failWith = new ApiError(409, 'tee must belong to the mapped course');
    const { host } = await matrix();

    pick(cell(roleRow(host, 'Club'), 'M'), 'Vit');
    await settle();

    const cellEl = cell(roleRow(host, 'Club'), 'M');
    expect(cellEl.querySelector('.mrole__cell-error')?.textContent).toBe(
        'That tee is no longer one of this course’s tees. Reload the page to see the tees as they stand.',
    );
    // Reverted to what the server still holds…
    expect(shown(cellEl)).toBe('Gul');
    // …and the revert is not itself an edit: exactly one write went out.
    expect(apiMock.courses.setTeeRole).toHaveBeenCalledTimes(1);
    expect(apiMock.courses.clearTeeRole).toHaveBeenCalledTimes(0);
});

test('the unrated-tee refusal is said in this column’s gender, not the schema’s', async () => {
    state.failWith = new ApiError(409, 'tee has no rating for the mapped gender');
    const { host } = await matrix();

    pick(cell(roleRow(host, 'Club'), 'F'), 'Gul');
    await settle();

    expect(
        cell(roleRow(host, 'Club'), 'F').querySelector('.mrole__cell-error')?.textContent,
    ).toBe(
        'That tee has no rating for women any more, so it cannot be chosen here. Rate it above, or pick another tee.',
    );
});

test('a refusal this surface does not model is repeated verbatim', async () => {
    state.failWith = new ApiError(409, 'the course is locked while a competition is being scored');
    const { host } = await matrix();

    pick(cell(roleRow(host, 'Club'), 'M'), 'Vit');
    await settle();

    expect(
        cell(roleRow(host, 'Club'), 'M').querySelector('.mrole__cell-error')?.textContent,
    ).toBe('the course is locked while a competition is being scored');
});

test('a refusal is worded on the cell that was changed, not on the section', async () => {
    state.failWith = new ApiError(409, 'tee must belong to the mapped course');
    const { host } = await matrix();

    pick(cell(roleRow(host, 'Tournament'), 'F'), 'Röd');
    await settle();

    expect(
        cell(roleRow(host, 'Tournament'), 'F').querySelector('.mrole__cell-error')?.textContent,
    ).toContain('That tee is no longer one of this course’s tees.');
    expect(cell(roleRow(host, 'Club'), 'F').querySelector('.mrole__cell-error')?.textContent).toBe(
        '',
    );
    // A write failure never becomes the section's load error.
    expect(visible(host, '.mroles__error')).toBe(false);
});

test('a refusal goes as soon as a fresh list has answered the question it was about', async () => {
    state.failWith = new ApiError(409, 'tee must belong to the mapped course');
    const { host, roles } = await matrix();

    pick(cell(roleRow(host, 'Club'), 'M'), 'Vit');
    await settle();
    expect(cell(roleRow(host, 'Club'), 'M').querySelector('.mrole__cell-error')?.textContent).not
        .toBe('');

    // Any new mappings list — a neighbouring write's refetch, the rating
    // cascade, a retry — describes the world the sentence was complaining about.
    await roles.load('k1', true);
    await settle();

    expect(cell(roleRow(host, 'Club'), 'M').querySelector('.mrole__cell-error')?.textContent).toBe(
        '',
    );
});

test('a refusal that lands AFTER a refetch keeps the server’s current value, not the pre-write one', async () => {
    // The interleaving: the owner picks, a mappings refetch lands while that
    // write is in flight, and only then does the write come back refused. A
    // revert to the value snapshotted before the write would put a stale mapping
    // back on screen — and, worse, would leave the echo guard holding it, so no
    // correcting write could ever go out.
    state.tees = [...state.tees, tee({ id: 'svart', name: 'Svart', ratings: [MEN] })];
    state.mappings = [{ courseId: 'k1', roleKey: 'club', gender: 'M', teeId: 'gul' }];
    const { host, roles } = await matrix();

    let release: () => void = () => {};
    const inFlight = new Promise<void>((resolve) => {
        release = resolve;
    });
    apiMock.courses.setTeeRole.mockImplementationOnce(async () => {
        await inFlight;
        throw new ApiError(409, 'tee must belong to the mapped course');
    });

    pick(cell(roleRow(host, 'Club'), 'M'), 'Vit');
    await settle();

    // Meanwhile the server's answer moved on.
    state.mappings = [{ courseId: 'k1', roleKey: 'club', gender: 'M', teeId: 'svart' }];
    await roles.load('k1', true);
    await settle();

    release();
    await settle();

    const cellEl = cell(roleRow(host, 'Club'), 'M');
    expect(shown(cellEl)).toBe('Svart');
    expect(cellEl.querySelector('.mrole__cell-error')?.textContent).toContain(
        'That tee is no longer one of this course’s tees.',
    );

    // And the cell is not jammed: the next pick still reaches the server.
    pick(cell(roleRow(host, 'Club'), 'M'), 'Gul');
    await settle();
    expect(state.set).toEqual([{ courseId: 'k1', roleKey: 'club', gender: 'M', teeId: 'gul' }]);
    expect(shown(cell(roleRow(host, 'Club'), 'M'))).toBe('Gul');
});

// ─── The popover ───

test('the popover is closed until asked for, and states the LIVE resolution', async () => {
    state.mappings = [{ courseId: 'k1', roleKey: 'club', gender: 'M', teeId: 'gul' }];
    const { host } = await matrix();

    expect(visible(host, '.mroles__info')).toBe(false);
    (host.querySelector('.minfo-dot') as HTMLButtonElement).click();
    expect(visible(host, '.mroles__info')).toBe(true);

    const lines = [...host.querySelectorAll('.mroles__resolution')].map((node) =>
        node.textContent?.trim(),
    );
    // The mapped cell, said as a round.
    expect(lines).toContain('A Club / Men round plays from Gul today.');
    // An EMPTY cell still resolves — through the Club row — and the popover is
    // where that is admitted.
    expect(lines).toContain(
        'A Tournament / Men round plays from Gul today, taken from the Club row because this row is empty.',
    );
    // A cell with no mapping anywhere above it falls to the name convention.
    expect(lines).toContain(
        'A Club / Women round plays from Röd today, picked by tee name because no row above applies.',
    );
});

test('the popover follows the matrix: changing a cell changes what it says', async () => {
    const { host } = await matrix();
    (host.querySelector('.minfo-dot') as HTMLButtonElement).click();

    const lines = () =>
        [...host.querySelectorAll('.mroles__resolution')].map((node) => node.textContent?.trim());
    expect(lines()).toContain(
        'A Club / Men round plays from Gul today, picked by tee name because no row above applies.',
    );

    pick(cell(roleRow(host, 'Club'), 'M'), 'Vit');
    await settle();

    expect(lines()).toContain('A Club / Men round plays from Vit today.');
});

test('the popover closes on its own control', async () => {
    const { host } = await matrix();
    const dot = host.querySelector('.minfo-dot') as HTMLButtonElement;

    dot.click();
    expect(dot.getAttribute('aria-expanded')).toBe('true');
    (host.querySelector('.mroles__info .mroles__secondary') as HTMLButtonElement).click();

    expect(visible(host, '.mroles__info')).toBe(false);
    expect(dot.getAttribute('aria-expanded')).toBe('false');
});

test('Escape closes the popover, and says so on the trigger', async () => {
    const { host } = await matrix();
    const dot = host.querySelector('.minfo-dot') as HTMLButtonElement;
    dot.click();
    expect(visible(host, '.mroles__info')).toBe(true);

    press(document.body, 'Escape');

    expect(visible(host, '.mroles__info')).toBe(false);
    expect(dot.getAttribute('aria-expanded')).toBe('false');
});

test('a press outside the section closes the popover; one inside it does not', async () => {
    const { host } = await matrix();
    const dot = host.querySelector('.minfo-dot') as HTMLButtonElement;
    dot.click();

    // Inside: reading the panel, or reaching for a dropdown beside it, must not
    // dismiss what is being read.
    (host.querySelector('.mroles__info-lead') as HTMLElement).dispatchEvent(
        new Event('pointerdown', { bubbles: true }),
    );
    expect(visible(host, '.mroles__info')).toBe(true);
    expect(dot.getAttribute('aria-expanded')).toBe('true');

    const elsewhere = document.createElement('button');
    document.body.appendChild(elsewhere);
    elsewhere.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    elsewhere.remove();

    expect(visible(host, '.mroles__info')).toBe(false);
    expect(dot.getAttribute('aria-expanded')).toBe('false');
});

test('the trigger’s accessible name is escaped, so a label cannot break out of the attribute', async () => {
    const { infoDotMarkup } = await import('../../manage/ui/info-dot');

    const markup = infoDotMarkup('dot', 'Why "club" & <b>this</b>?');

    expect(markup).toContain('aria-label="Why &quot;club&quot; &amp; &lt;b&gt;this&lt;/b&gt;?"');
    // Parsed, the name is the label again — escaping is not a rewording.
    const holder = document.createElement('div');
    holder.innerHTML = markup;
    expect(holder.querySelector('button')?.getAttribute('aria-label')).toBe(
        'Why "club" & <b>this</b>?',
    );
    expect(holder.querySelectorAll('b').length).toBe(0);
});

// ─── The coupling ───

test('unticking a tee’s rating re-reads the mappings, so a cascaded delete cannot linger', async () => {
    state.mappings = [{ courseId: 'k1', roleKey: 'club', gender: 'F', teeId: 'gul' }];
    const { host, tees } = await matrix();
    expect(shown(cell(roleRow(host, 'Club'), 'F'))).toBe('Gul');

    const before = apiMock.courses.teeRoles.mock.calls.length;

    // What the tee editor beside this one does when Women is unticked — and
    // what migration 059's trigger does behind it, without saying so in any
    // response.
    state.tees = state.tees.map((t) => (t.id === 'gul' ? { ...t, ratings: [MEN] } : t));
    state.mappings = [];
    await tees.load('k1', true);
    await settle();

    expect(apiMock.courses.teeRoles.mock.calls.length).toBeGreaterThan(before);
    expect(shown(cell(roleRow(host, 'Club'), 'F'))).toBe('Not set');
    // And the tee is gone from the women's list, because it is no longer rated.
    expect(options(cell(roleRow(host, 'Club'), 'F'))).toEqual(['Not set', 'Röd', 'Orange']);
});

test('a tee list that settles unchanged does not spend a second mappings read', async () => {
    const { tees } = await matrix();
    const before = apiMock.courses.teeRoles.mock.calls.length;
    expect(before).toBe(1);

    // A tee EDIT that touches neither the tees nor their ratings — a rename, a
    // length — refetches the list but cannot orphan a mapping.
    state.tees = state.tees.map((t) => (t.id === 'gul' ? { ...t, name: 'Gul (nya)' } : t));
    await tees.load('k1', true);
    await settle();

    expect(apiMock.courses.teeRoles.mock.calls.length).toBe(before);
});

// ─── Nothing to point at ───

test('a course with no rated tee says so instead of showing twelve empty dropdowns', async () => {
    state.tees = [tee({ id: 'vit', name: 'Vit', ratings: [] })];
    const { host } = await matrix();

    expect(text(host, '.mroles__note:not([hidden])')).toContain(
        'No tee on this course carries a rating yet',
    );
});

// ─── A failed read ───

test('a failed read is worded once for the section, with a way to retry', async () => {
    apiMock.courses.teeRoles.mockImplementationOnce(async () => {
        throw new ApiError(500, 'Internal Server Error');
    });
    const { host } = await matrix();

    expect(text(host, '.mroles__error')).toBe(
        'Could not load the tee roles. Check your connection and try again.',
    );
    expect(visible(host, '.mroles__grid')).toBe(false);

    retry(host).click();
    await settle();

    expect(visible(host, '.mroles__error')).toBe(false);
    expect(roleRows(host).length).toBe(3);
});
