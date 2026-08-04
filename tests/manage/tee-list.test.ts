import './harness';
import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import { di } from '@basics/core/client/core';
import { mount, press } from './harness';
import type { Tee } from '../../src/api/tees.gen';
import type { ClubCourse } from '../../src/api/courses.gen';
import type { ClubListItem } from '../../src/api/clubs.gen';

// The tees section on the course page (spec §3.5) — a COMPONENT with club and
// course ids, not a screen. What is asserted here is what it decides: which
// column says what, what a create/edit panel puts on the wire, that an unrated
// gender stays absent rather than becoming four zeros, and what a refused delete
// leaves on screen.

const state: {
    clubs: ClubListItem[];
    courses: ClubCourse[];
    tees: Tee[];
    created: unknown[];
    updated: unknown[];
    removed: string[];
    failWith: unknown;
} = {
    clubs: [],
    courses: [],
    tees: [],
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

/** A latch a test can hold a write open on, so the in-flight state is visible. */
function deferred(): { promise: Promise<void>; release: () => void } {
    let release!: () => void;
    const promise = new Promise<void>((resolve) => {
        release = () => resolve();
    });
    return { promise, release };
}

let gate: { promise: Promise<void>; release: () => void } | null = null;

const apiMock = {
    clubs: {
        list: mock(async () => state.clubs),
    },
    courses: {
        listByClub: mock(async (input: { clubId: string }) =>
            state.courses.filter((course) => course.clubId === input.clubId),
        ),
        validate: mock(async () => ({ ok: true, issues: [] })),
    },
    tees: {
        listByCourse: mock(async (input: { courseId: string }) =>
            state.tees.filter((tee) => tee.courseId === input.courseId),
        ),
        create: mock(async (input: unknown) => {
            raise();
            state.created.push(input);
            const tee = { ...(input as Tee), id: 'new' };
            state.tees = [...state.tees, tee];
            return tee;
        }),
        update: mock(async (input: unknown) => {
            raise();
            state.updated.push(input);
            const { id, ...rest } = input as Tee;
            state.tees = state.tees.map((tee) => (tee.id === id ? { ...tee, ...rest } : tee));
            return state.tees.find((tee) => tee.id === id)!;
        }),
        remove: mock(async (input: { id: string }) => {
            if (gate) await gate.promise;
            raise();
            state.removed.push(input.id);
            state.tees = state.tees.filter((tee) => tee.id !== input.id);
            return { ok: true };
        }),
    },
};

mock.module('../../manage/api', () => ({ api: apiMock, API_BASE: '/api', ApiError }));

const { ClubsService } = await import('../../manage/courses/clubs.service');
const { CoursesService } = await import('../../manage/courses/courses.service');
const { TeesService } = await import('../../manage/courses/tees.service');
const { TeesComponent } = await import('../../manage/courses/tees.component');

function tee(over: Partial<Tee> = {}): Tee {
    return {
        id: 't1',
        courseId: 'k1',
        name: 'Gul',
        colour: 'Gul',
        holeLengths: [],
        ratings: [],
        ...over,
    };
}

const MEN = { gender: 'M' as const, courseRating: 71.4, slope: 132, par: 72, totalLengthM: 5812 };
const WOMEN = { gender: 'F' as const, courseRating: 73.9, slope: 128, par: 73, totalLengthM: 5104 };

let open: { destroy(): void } | null = null;

beforeEach(() => {
    state.clubs = [
        { id: 'c1', name: 'Linköpings GK', location: 'Linköping', logoUrl: null, courseCount: 1 },
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
            teeCount: 2,
        },
    ];
    state.tees = [
        tee({ id: 't1', name: 'Gul', colour: 'Gul', ratings: [MEN, WOMEN] }),
        tee({
            id: 't2',
            name: 'Blå',
            colour: '#2a6fd4',
            ratings: [MEN],
            holeLengths: [
                { holeNumber: 1, lengthM: 342, strokeIndexOverride: null },
                { holeNumber: 2, lengthM: 155, strokeIndexOverride: 17 },
            ],
        }),
    ];
    state.created = [];
    state.updated = [];
    state.removed = [];
    state.failWith = null;
    gate = null;
    apiMock.tees.remove.mockClear();
    apiMock.tees.create.mockClear();
    apiMock.courses.listByClub.mockClear();
    di.reset();
});

afterEach(() => {
    open?.destroy();
    open = null;
});

async function settle(): Promise<void> {
    for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
}

async function section(courseId = 'k1') {
    di.set(ClubsService, new ClubsService());
    const courses = new CoursesService();
    di.set(CoursesService, courses);
    const tees = new TeesService();
    di.set(TeesService, tees);

    // Mounting is what loads: `onMount` asks for both the tees and the club's
    // courses. Asking again here would paper over a first request that failed,
    // because a failed load lets the next call really retry.
    const mounted = mount(new TeesComponent({ clubId: 'c1', courseId }));
    open = mounted;
    await settle();
    return { ...mounted, tees, courses };
}

const el = (host: HTMLElement, selector: string): HTMLElement =>
    host.querySelector(selector) as HTMLElement;

const rows = (host: HTMLElement): HTMLElement[] =>
    [...host.querySelectorAll('tbody [role="row"]')] as HTMLElement[];

const cell = (row: HTMLElement, key: string): HTMLElement =>
    row.querySelector(`[data-key="${key}"] .mtable__cell`) as HTMLElement;

const rowButton = (row: HTMLElement, text: string): HTMLButtonElement =>
    [...row.querySelectorAll('.mtable__actions button')].find(
        (btn) => btn.textContent?.trim() === text,
    ) as HTMLButtonElement;

const byText = (host: HTMLElement, selector: string, text: string): HTMLElement =>
    [...host.querySelectorAll(selector)].find(
        (node) => node.textContent?.trim() === text,
    ) as HTMLElement;

const openDialog = (): HTMLElement => document.querySelector('.ui-confirm.open') as HTMLElement;

function type(host: HTMLElement, selector: string, value: string): void {
    const input = el(host, selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** A grid cell, addressed the way the screen reader reads it. */
function grid(host: HTMLElement, label: string, hole: number): HTMLInputElement {
    return host.querySelector(`[aria-label="${label}, hole ${hole}"]`) as HTMLInputElement;
}

function typeGrid(host: HTMLElement, label: string, hole: number, value: string): void {
    const input = grid(host, label, hole);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** The rated / not rated track for one gender. */
function ratingTrack(host: HTMLElement, gender: 'M' | 'F'): HTMLButtonElement[] {
    const block = el(host, `[aria-labelledby="manage-tee-${gender}-title"]`);
    return [...block.querySelectorAll('button')] as HTMLButtonElement[];
}

function ratingBlock(host: HTMLElement, gender: 'M' | 'F'): HTMLElement {
    return el(host, `#manage-tee-${gender}-title`).closest('.mtrating') as HTMLElement;
}

function submit(host: HTMLElement): void {
    el(host, '.mtees__panel').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

// ─── Rows ───

test('a row per tee: name, colour, who it is rated for, the totals and how much is measured', async () => {
    const { host } = await section();

    expect(rows(host).map((row) => row.getAttribute('data-row-key'))).toEqual(['t1', 't2']);
    expect(cell(rows(host)[0]!, 'name').textContent).toBe('Gul');
    // Words, never a pair of gender icons.
    expect(cell(rows(host)[0]!, 'rated').textContent).toBe('Men, Women');
    expect(cell(rows(host)[1]!, 'rated').textContent).toBe('Men');
    // The RATED total is the one that plays, and it is named per gender.
    expect(cell(rows(host)[0]!, 'length').textContent).toBe('Men 5812 m, Women 5104 m');
    // `n of N` — "2" alone reads as fine until you know what it is out of.
    expect(cell(rows(host)[1]!, 'holes').textContent).toBe('2 of 18');
});

test('the colour cell says the WORD even when a hex is stored; the swatch only accompanies it', async () => {
    state.tees = [
        tee({ id: 't1', colour: 'Gul' }),
        tee({ id: 't2', colour: '#2a6fd4' }),
        tee({ id: 't3', colour: '#FFD400' }),
        tee({ id: 't4', colour: '#4b2e1f' }),
        tee({ id: 't5', colour: 'Kastanjebrun' }),
        tee({ id: 't6', colour: null }),
    ];
    const { host } = await section();
    const colour = (index: number) => cell(rows(host)[index]!, 'colour');
    const swatch = (index: number) =>
        colour(index).querySelector('.mtees__swatch') as HTMLElement | null;

    expect(colour(0).textContent).toBe('Gul');
    expect(swatch(0)).toBeTruthy();

    // The catalog stores hex on nearly every row. "#2a6fd4" beside a swatch of
    // that blue says the same thing twice and names the colour not at all.
    expect(colour(1).textContent).toBe('Blå');
    // The stored value is not lost — it is one hover away.
    expect(el(colour(1), '.mtees__colour').title).toBe('#2a6fd4');
    expect(swatch(1)).toBeTruthy();

    // Case is not a difference between two colours.
    expect(colour(2).textContent).toBe('Gul');

    // A hex outside the palette has no word to print, so the hex IS the answer
    // — and it keeps its swatch, which the word cannot supply.
    expect(colour(3).textContent).toBe('#4b2e1f');
    expect(el(colour(3), '.mtees__colour').title).toBe('');
    expect(swatch(3)).toBeTruthy();

    // A colour word this does not know still reads — it just gets no swatch,
    // rather than handing stored text to `style.backgroundColor`.
    expect(colour(4).textContent).toBe('Kastanjebrun');
    expect(swatch(4)).toBeNull();

    expect(colour(5).textContent).toBe('Not set');
});

test('a course with no tees says so rather than showing a bare table', async () => {
    state.tees = [];
    const { host } = await section();

    expect(host.textContent).toContain('No tees yet');
    expect(rows(host).length).toBe(0);
});

// ─── The unrated gender ───

test('an unrated gender reads as a stated fact, not four empty boxes', async () => {
    const { host } = await section();
    rowButton(rows(host)[1]!, 'Edit').click();

    // Men: rated, figures shown and seeded.
    expect(ratingTrack(host, 'M').map((b) => b.getAttribute('aria-pressed'))).toEqual([
        'true',
        'false',
    ]);
    expect(el(ratingBlock(host, 'M'), '.mtrating__figures').hidden).toBe(false);
    expect((el(host, '#manage-tee-M-courseRating') as HTMLInputElement).value).toBe('71.4');

    // Women: not rated. The figures are HIDDEN, not disabled — a disabled row of
    // boxes reads as something you failed to fill in.
    expect(ratingTrack(host, 'F').map((b) => b.getAttribute('aria-pressed'))).toEqual([
        'false',
        'true',
    ]);
    const women = ratingBlock(host, 'F');
    expect(el(women, '.mtrating__figures').hidden).toBe(true);
    expect(el(women, '.mtrating__absent').hidden).toBe(false);
    const absent = el(women, '.mtrating__absent').textContent ?? '';
    expect(absent).toContain('No women’s rating');
    // What the save actually does now (ruling R1): it is REFUSED while a tee
    // role still assigns this tee for women. The old copy warned that saving
    // deleted that assignment — true while migration 059's trigger was the
    // user-facing mechanism, and a wrong model of the catalog since.
    expect(absent).toContain('saving is refused until you clear that assignment');
    expect(absent).not.toContain('deleted, not hidden');
    // And nothing was pre-filled behind the hidden state.
    expect((el(host, '#manage-tee-F-slope') as HTMLInputElement).value).toBe('');
});

test('saving a men-only tee untouched leaves the women’s rating absent, not zero-filled', async () => {
    const { host } = await section();
    rowButton(rows(host)[1]!, 'Edit').click();
    submit(host);
    await settle();

    expect(state.updated).toHaveLength(1);
    const sent = state.updated[0] as { ratings: { gender: string }[] };
    expect(sent.ratings).toEqual([MEN]);
    expect(sent.ratings.some((rating) => rating.gender === 'F')).toBe(false);
});

test('rating a gender reveals its figures and puts them on the wire', async () => {
    const { host } = await section();
    rowButton(rows(host)[1]!, 'Edit').click();

    byText(ratingBlock(host, 'F'), 'button', 'Rated').click();
    expect(el(ratingBlock(host, 'F'), '.mtrating__figures').hidden).toBe(false);

    type(host, '#manage-tee-F-courseRating', '73.9');
    type(host, '#manage-tee-F-slope', '128');
    type(host, '#manage-tee-F-par', '73');
    type(host, '#manage-tee-F-totalLengthM', '5104');
    submit(host);
    await settle();

    expect((state.updated[0] as { ratings: unknown[] }).ratings).toEqual([MEN, WOMEN]);
});

test('un-rating a gender retires the stored rating and keeps the typed figures until save', async () => {
    const { host } = await section();
    rowButton(rows(host)[0]!, 'Edit').click();

    byText(ratingBlock(host, 'F'), 'button', 'Not rated').click();
    // Kept, so an accidental double-tap costs nothing; only the SAVE makes the
    // absence real.
    expect((el(host, '#manage-tee-F-slope') as HTMLInputElement).value).toBe('128');

    submit(host);
    await settle();
    expect((state.updated[0] as { ratings: unknown[] }).ratings).toEqual([MEN]);
});

test('half a rating is refused under its own block and never reaches the server', async () => {
    const { host } = await section();
    rowButton(rows(host)[1]!, 'Edit').click();
    byText(ratingBlock(host, 'F'), 'button', 'Rated').click();
    type(host, '#manage-tee-F-courseRating', '73.9');
    submit(host);
    await settle();

    expect(state.updated).toEqual([]);
    const error = el(ratingBlock(host, 'F'), '.mtrating__error');
    expect(error.hidden).toBe(false);
    expect(error.textContent).toContain('Women');
    // The server's line stays empty: the same complaint is not said twice.
    expect(el(host, '[bind="panelError"]').hidden).toBe(true);
});

// ─── The lengths grid ───

test('the grid has a column per COURSE hole, seeded from the tee', async () => {
    const { host } = await section();
    rowButton(rows(host)[1]!, 'Edit').click();

    expect(host.querySelectorAll('[aria-label^="Length (m), hole"]').length).toBe(18);
    expect(grid(host, 'Length (m)', 1).value).toBe('342');
    expect(grid(host, 'SI override', 2).value).toBe('17');
    // The unmeasured holes are shown as the empty cells that say so.
    expect(grid(host, 'Length (m)', 3).value).toBe('');
});

test('editing the grid sends lengths and ratings together, and a blank hole is dropped', async () => {
    const { host } = await section();
    rowButton(rows(host)[1]!, 'Edit').click();

    typeGrid(host, 'Length (m)', 3, '410');
    typeGrid(host, 'SI override', 3, '4');
    // Clearing a hole is how a hole is un-measured.
    typeGrid(host, 'Length (m)', 2, '');
    submit(host);
    await settle();

    expect(state.updated[0]).toEqual({
        id: 't2',
        name: 'Blå',
        colour: '#2a6fd4',
        holeLengths: [
            { holeNumber: 1, lengthM: 342, strokeIndexOverride: null },
            { holeNumber: 3, lengthM: 410, strokeIndexOverride: 4 },
        ],
        ratings: [MEN],
    });
});

test('a typo in a hole is named, marked and never sent', async () => {
    const { host } = await section();
    rowButton(rows(host)[1]!, 'Edit').click();
    typeGrid(host, 'Length (m)', 5, '34o');
    submit(host);
    await settle();

    expect(state.updated).toEqual([]);
    expect(el(host, '.mtlen__error').textContent).toContain('Hole 5');
    expect(grid(host, 'Length (m)', 5).getAttribute('aria-invalid')).toBe('true');
    expect(grid(host, 'Length (m)', 4).getAttribute('aria-invalid')).toBe('false');
    // The caret lands in the cell that was complained about.
    expect(document.activeElement).toBe(grid(host, 'Length (m)', 5));
});

test('the grid states its own totals, and how much of the course they cover', async () => {
    const { host } = await section();
    rowButton(rows(host)[1]!, 'Edit').click();

    expect(el(host, '.mtlen__summary').textContent).toContain('2 of 18 holes measured');
    expect(el(host, '.mtlen__summary').textContent).toContain('Total 497 m');
});

// ─── Create ───

test('creating opens one blank panel and writes under the course', async () => {
    const { host } = await section();
    expect(el(host, '.mtees__panel').hidden).toBe(true);

    byText(host, 'button', 'New tee').click();
    expect(el(host, '.mtees__panel').hidden).toBe(false);
    expect((el(host, '#manage-tee-name') as HTMLInputElement).value).toBe('');
    // A new tee starts unrated for both — the form asks rather than assumes.
    expect(ratingTrack(host, 'M').map((b) => b.getAttribute('aria-pressed'))).toEqual([
        'false',
        'true',
    ]);

    type(host, '#manage-tee-name', 'Röd');
    type(host, '#manage-tee-colour', 'Röd');
    typeGrid(host, 'Length (m)', 1, '280');
    submit(host);
    await settle();

    expect(state.created).toEqual([
        {
            courseId: 'k1',
            name: 'Röd',
            colour: 'Röd',
            holeLengths: [{ holeNumber: 1, lengthM: 280, strokeIndexOverride: null }],
            ratings: [],
        },
    ]);
    expect(el(host, '.mtees__panel').hidden).toBe(true);
});

test('a nameless draft complains under the field and never reaches the server', async () => {
    const { host } = await section();
    byText(host, 'button', 'New tee').click();
    type(host, '#manage-tee-name', '   ');
    submit(host);
    await settle();

    expect(state.created).toEqual([]);
    expect(el(host, '#manage-tee-name-error').hidden).toBe(false);
    expect(document.activeElement).toBe(el(host, '#manage-tee-name'));
});

test('creating a tee re-reads the club’s courses, so the course list’s tee count moves', async () => {
    const { host } = await section();
    apiMock.courses.listByClub.mockClear();

    byText(host, 'button', 'New tee').click();
    type(host, '#manage-tee-name', 'Röd');
    submit(host);
    await settle();

    // The count is served from the course row (`listByClub`); without this the
    // club page would show the pre-write number for the rest of the session.
    expect(apiMock.courses.listByClub).toHaveBeenCalledTimes(1);
});

test('an edit does NOT re-read the courses — it cannot change a count', async () => {
    const { host } = await section();
    apiMock.courses.listByClub.mockClear();

    rowButton(rows(host)[1]!, 'Edit').click();
    submit(host);
    await settle();

    expect(apiMock.courses.listByClub).toHaveBeenCalledTimes(0);
});

// ─── Refusals ───

test('a refused save keeps the panel open with the draft and the SERVER sentence', async () => {
    const { host } = await section();
    rowButton(rows(host)[0]!, 'Edit').click();
    type(host, '#manage-tee-name', 'Gul 2');

    state.failWith = new ApiError(409, 'A tee named Gul 2 already exists on this course.');
    submit(host);
    await settle();

    expect(el(host, '.mtees__panel').hidden).toBe(false);
    expect((el(host, '#manage-tee-name') as HTMLInputElement).value).toBe('Gul 2');
    expect(el(host, '[bind="panelError"]').textContent).toBe(
        'A tee named Gul 2 already exists on this course.',
    );
});

test('a refused rating removal lands beside the rating controls, and the tick stays off', async () => {
    const { host } = await section();
    rowButton(rows(host)[0]!, 'Edit').click();

    // Un-rate women on a tee the course's Club / Women role still points at.
    byText(ratingBlock(host, 'F'), 'button', 'Not rated').click();
    state.failWith = new ApiError(
        409,
        "Cannot remove this tee's rating — Club / Women still assigns this tee on this "
            + 'course. Clear that assignment in Tee roles first, then save.',
        undefined,
        undefined,
        {
            code: 'tee_rating_removal_blocked',
            blockers: [{ kind: 'tee_role_mappings', count: 1, items: ['Club / Women'] }],
        },
    );
    submit(host);
    await settle();

    // Beside the tracks it is about — the sentence names a gender, and the
    // control for that gender is right there.
    const conflict = el(host, '.mteefields__conflict');
    expect(conflict.hidden).toBe(false);
    expect(conflict.textContent).toContain('Club / Women');
    expect(conflict.textContent).toContain('Clear that assignment in Tee roles first');
    // Said once: the panel's general line stays empty.
    expect(el(host, '[bind="panelError"]').hidden).toBe(true);

    // Nothing is optimistically put back. The draft is the user's — women read
    // as not rated, with the reason under it — so the fix is one click on the
    // other screen and one press of Save, not a re-typing of the whole edit.
    expect(ratingTrack(host, 'F').map((b) => b.getAttribute('aria-pressed'))).toEqual([
        'false',
        'true',
    ]);
    expect(el(host, '.mtees__panel').hidden).toBe(false);
    // And the stored rating is untouched: the server refused the whole save.
    expect(state.tees[0]!.ratings).toEqual([MEN, WOMEN]);
});

test('a refusal with no code stays on the panel line, and clears on the next attempt', async () => {
    const { host } = await section();
    rowButton(rows(host)[0]!, 'Edit').click();
    byText(ratingBlock(host, 'F'), 'button', 'Not rated').click();

    // An ordinary 409 is not a rating conflict — it has no business sitting
    // under the tracks.
    state.failWith = new ApiError(409, 'A tee named Gul already exists on this course.');
    submit(host);
    await settle();

    expect(el(host, '.mteefields__conflict').hidden).toBe(true);
    expect(el(host, '[bind="panelError"]').textContent).toContain('already exists');

    // Retrying succeeds and the panel closes — no message survives the save it
    // was about.
    submit(host);
    await settle();
    expect(el(host, '.mtees__panel').hidden).toBe(true);
});

test('Escape backs out of the panel, the same exit Cancel is', async () => {
    const { host } = await section();
    byText(host, 'button', 'New tee').click();
    expect(el(host, '.mtees__panel').hidden).toBe(false);

    press(document.body, 'Escape');
    expect(el(host, '.mtees__panel').hidden).toBe(true);
});

// ─── Delete ───

test('deleting states what it makes true, names the tee, then removes it', async () => {
    const { host } = await section();
    rowButton(rows(host)[0]!, 'Delete').click();

    expect(el(openDialog(), '.ui-confirm__title').textContent).toBe('Delete Gul?');
    const message = el(openDialog(), '.ui-confirm__message').textContent!;
    expect(message).toContain('Gul leaves this course');
    // What does NOT change is the part a course admin cannot see from the row.
    expect(message).toContain('no scorecard changes');

    (openDialog().querySelector('.ui-confirm__btn--danger') as HTMLButtonElement).click();
    await settle();

    expect(state.removed).toEqual(['t1']);
    expect(rows(host).map((row) => row.getAttribute('data-row-key'))).toEqual(['t2']);
});

test('a tee held by a tee-role mapping still OFFERS Delete, and the refusal reads verbatim', async () => {
    const { host } = await section();
    // The client does not pre-check the mapping: that would be a second copy of
    // a rule the server owns, and it would drift the moment a blocker is added.
    expect(rowButton(rows(host)[0]!, 'Delete').disabled).toBe(false);

    state.failWith = new ApiError(
        409,
        'Tee is used by 2 tee role mappings on this course. Remove them first.',
    );
    rowButton(rows(host)[0]!, 'Delete').click();
    (openDialog().querySelector('.ui-confirm__btn--danger') as HTMLButtonElement).click();
    await settle();

    // Named, because the dialog that named it has closed and the row is one of
    // several — but the server's sentence itself is untouched.
    expect(el(host, '[bind="deleteError"]').textContent).toBe(
        'Gul — Tee is used by 2 tee role mappings on this course. Remove them first.',
    );
    expect(rows(host).length).toBe(2);
    // And the row is handed back rather than left inert.
    expect(rowButton(rows(host)[0]!, 'Delete').disabled).toBe(false);
});

test('a delete in flight says so on the row it was fired from, and stills the rest', async () => {
    const { host } = await section();
    gate = deferred();

    rowButton(rows(host)[0]!, 'Delete').click();
    (openDialog().querySelector('.ui-confirm__btn--danger') as HTMLButtonElement).click();
    await settle();

    expect(rowButton(rows(host)[0]!, 'Deleting…').disabled).toBe(true);
    expect(rowButton(rows(host)[1]!, 'Delete').disabled).toBe(true);
    expect((byText(host, 'button', 'New tee') as HTMLButtonElement).disabled).toBe(true);

    gate.release();
    await settle();

    expect(apiMock.tees.remove).toHaveBeenCalledTimes(1);
    expect(state.removed).toEqual(['t1']);
});

test('one intent at a time: an open panel disables the row actions', async () => {
    const { host } = await section();
    byText(host, 'button', 'New tee').click();

    expect(rowButton(rows(host)[0]!, 'Edit').disabled).toBe(true);
    expect(rowButton(rows(host)[0]!, 'Delete').disabled).toBe(true);
});

// ─── Failure to load ───

test('a failed load offers a retry rather than an empty list', async () => {
    apiMock.tees.listByCourse.mockImplementationOnce(async () => {
        throw new Error('offline');
    });
    const { host, tees } = await section();

    expect(el(host, '[bind="loadError"]').textContent).toContain('Could not load the tees');
    expect(el(host, '[bind="retry"]').hidden).toBe(false);

    (el(host, '[bind="retry"]') as HTMLButtonElement).click();
    await settle();

    expect(tees.error.get()).toBeNull();
    expect(rows(host).length).toBe(2);
});
