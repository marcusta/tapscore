import './harness';
import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import { di, Router } from '@basics/core/client/core';
import { BASE_PATH } from '@basics/core/client/base';
import { mount, press } from './harness';
import type { Club } from '../../src/api/clubs.gen';

// The Courses section's landing screen, through the shared primitives: rows and
// actions come from `ManageTableComponent`, the delete question from
// `destructiveConfirm`. What is asserted here is what the SCREEN decides —
// which column links where, which action a row gets, what the confirm says,
// where a refused write ends up — not the table's own structure, which
// manage-table.test.ts already covers.

type CourseRow = { id: string; clubId: string };

const state: {
    clubs: Club[];
    courses: CourseRow[];
    created: unknown[];
    removed: string[];
    failWith: unknown;
} = { clubs: [], courses: [], created: [], removed: [], failWith: null };

function raise(): void {
    if (state.failWith === null) return;
    const err = state.failWith;
    state.failWith = null;
    throw err;
}

/**
 * A latch a test can hold a write open on, so the IN-FLIGHT state is a thing the
 * test can look at rather than something that has already come and gone by the
 * first assertion.
 */
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
        create: mock(async (input: { name: string }) => {
            raise();
            state.created.push(input);
            const club: Club = { id: 'new', name: input.name, location: null, logoUrl: null };
            state.clubs = [...state.clubs, club];
            return club;
        }),
        update: mock(async () => state.clubs[0]!),
        remove: mock(async (input: { id: string }) => {
            if (gate) await gate.promise;
            raise();
            state.removed.push(input.id);
            state.clubs = state.clubs.filter((club) => club.id !== input.id);
            return { ok: true };
        }),
    },
    courses: { list: mock(async () => state.courses) },
};

mock.module('../../manage/api', () => ({ api: apiMock, API_BASE: '/api', ApiError }));

const { ClubsService } = await import('../../manage/courses/clubs.service');
const { ClubsComponent } = await import('../../manage/courses/clubs.component');
const { BreadcrumbService } = await import('../../manage/shell/breadcrumb.service');

let open: { destroy(): void } | null = null;

beforeEach(() => {
    state.clubs = [
        { id: 'c1', name: 'Linköpings GK', location: 'Linköping', logoUrl: null },
        { id: 'c2', name: 'Vreta Kloster GK', location: 'Ljungsbro', logoUrl: null },
    ];
    state.courses = [
        { id: 'k1', clubId: 'c1' },
        { id: 'k2', clubId: 'c1' },
        { id: 'k3', clubId: 'c2' },
    ];
    state.created = [];
    state.removed = [];
    state.failWith = null;
    gate = null;
    apiMock.clubs.list.mockClear();
    apiMock.clubs.create.mockClear();
    apiMock.clubs.remove.mockClear();
    di.reset();
});

/**
 * Let a write and the refetch it triggers finish. A write is two chained
 * awaits deep (the request, then `load(true)`), so a single microtask drain
 * lands mid-flight.
 */
async function settle(): Promise<void> {
    for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
    open?.destroy();
    open = null;
});

async function screen() {
    const clubs = new ClubsService();
    di.set(ClubsService, clubs);
    const mounted = mount(new ClubsComponent());
    open = mounted;
    // `onMount` kicks the load; wait for it rather than for a timer.
    await clubs.load();
    await settle();
    return { ...mounted, clubs, crumbs: di.get(BreadcrumbService) };
}

const rows = (host: HTMLElement): HTMLElement[] =>
    [...host.querySelectorAll('tbody [role="row"]')] as HTMLElement[];

// The cell's VALUE, not the whole <td> — a stacked cell also carries a repeat
// of the column header, which is decoration and not the row's data.
const cell = (row: HTMLElement, key: string): HTMLElement =>
    row.querySelector(`[data-key="${key}"] .mtable__cell`) as HTMLElement;

const byText = (host: HTMLElement, selector: string, text: string): HTMLElement =>
    [...host.querySelectorAll(selector)].find((el) => el.textContent?.trim() === text) as HTMLElement;

test('the list renders a row per club, with the course count joined on', async () => {
    const { host } = await screen();

    expect(rows(host).map((row) => row.getAttribute('data-row-key'))).toEqual(['c1', 'c2']);
    expect(cell(rows(host)[0]!, 'name').textContent).toBe('Linköpings GK');
    expect(cell(rows(host)[0]!, 'location').textContent).toBe('Linköping');
    expect(cell(rows(host)[0]!, 'courses').textContent).toBe('2');
    expect(cell(rows(host)[1]!, 'courses').textContent).toBe('1');
});

test('the name is a real link, so cmd-click and copy-link work', async () => {
    const { host } = await screen();
    const link = cell(rows(host)[0]!, 'name').querySelector('a') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe(`${BASE_PATH}/courses/clubs/c1`);
    expect(link.textContent).toBe('Linköpings GK');
});

test('a plain click on the name navigates in-app; a modified one is left to the browser', async () => {
    const { host } = await screen();
    const router = di.get(Router);
    const link = cell(rows(host)[0]!, 'name').querySelector('a') as HTMLAnchorElement;

    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(router.route.get()).toBe('/courses/clubs/c1');

    const metaClick = new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true });
    cell(rows(host)[1]!, 'name')
        .querySelector('a')!
        .dispatchEvent(metaClick);
    // Not intercepted: the browser gets to open its new tab.
    expect(metaClick.defaultPrevented).toBe(false);
});

test('Delete is the row action, and it is built with the shared primitive', async () => {
    const { host } = await screen();
    const actions = rows(host)[0]!.querySelector('.mtable__actions') as HTMLElement;
    const buttons = [...actions.querySelectorAll('button')] as HTMLButtonElement[];

    // One action only — editing lives on the club page, not in a second editor
    // over the same three fields.
    expect(buttons.map((b) => b.textContent)).toEqual(['Delete']);
    expect(buttons[0]!.className).toContain('mtable__btn');
    // Words, not a symbol.
    expect(buttons[0]!.getAttribute('aria-label')).toBeNull();
});

test('search filters the rows client-side and says how many are showing', async () => {
    const { host } = await screen();
    const search = host.querySelector('#manage-clubs-search') as HTMLInputElement;
    const note = host.querySelector('.mclubs__note') as HTMLElement;

    // Nothing hidden: no count to explain.
    expect(note.hidden).toBe(true);

    search.value = 'vreta';
    search.dispatchEvent(new Event('input', { bubbles: true }));

    expect(rows(host).map((row) => row.getAttribute('data-row-key'))).toEqual(['c2']);
    expect(note.hidden).toBe(false);
    expect(note.textContent).toBe('Showing 1 of 2 clubs.');
    // Filtering never refetches.
    expect(apiMock.clubs.list).toHaveBeenCalledTimes(1);
});

test('the empty state offers the way out of the search that emptied it', async () => {
    const { host } = await screen();
    const search = host.querySelector('#manage-clubs-search') as HTMLInputElement;

    search.value = 'nothing matches this';
    search.dispatchEvent(new Event('input', { bubbles: true }));

    expect(rows(host).length).toBe(0);
    const empty = host.querySelector('[bind="tableHost"], .mtable__empty') ?? host;
    expect(empty.textContent).toContain('No clubs match that search');

    const clear = byText(host, 'button', 'Clear search');
    clear.click();

    expect(search.value).toBe('');
    expect(rows(host).length).toBe(2);
});

test('the create panel stays closed until asked, and Escape backs out of it', async () => {
    const { host } = await screen();
    const panel = host.querySelector('.mclubs__panel') as HTMLElement;

    expect(panel.hidden).toBe(true);

    byText(host, 'button', 'New club').click();
    expect(panel.hidden).toBe(false);

    press(document.body, 'Escape');
    expect(panel.hidden).toBe(true);
});

test('an invalid create shows the field error and sends nothing', async () => {
    const { host } = await screen();
    byText(host, 'button', 'New club').click();

    (host.querySelector('.mclubs__panel') as HTMLFormElement).dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
    );
    await settle();

    const error = host.querySelector('#manage-club-new-name-error') as HTMLElement;
    expect(error.hidden).toBe(false);
    expect(error.textContent).toContain('A club needs a name');
    expect(apiMock.clubs.create).not.toHaveBeenCalled();
    // The panel is still open with what was typed.
    expect((host.querySelector('.mclubs__panel') as HTMLElement).hidden).toBe(false);
});

test('a valid create sends the trimmed payload, closes the panel and shows the new row', async () => {
    const { host } = await screen();
    byText(host, 'button', 'New club').click();

    const name = host.querySelector('#manage-club-new-name') as HTMLInputElement;
    name.value = '  Bråviken GK  ';
    name.dispatchEvent(new Event('input', { bubbles: true }));

    (host.querySelector('.mclubs__panel') as HTMLFormElement).dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
    );
    await settle();

    expect(state.created).toEqual([{ name: 'Bråviken GK', location: null, logoUrl: null }]);
    expect((host.querySelector('.mclubs__panel') as HTMLElement).hidden).toBe(true);
    expect(rows(host).length).toBe(3);
});

test('a failed create keeps the panel open with the draft and the server sentence', async () => {
    const { host } = await screen();
    byText(host, 'button', 'New club').click();

    const name = host.querySelector('#manage-club-new-name') as HTMLInputElement;
    name.value = 'Linköpings GK';
    name.dispatchEvent(new Event('input', { bubbles: true }));

    state.failWith = new ApiError(409, 'A club named Linköpings GK already exists.');
    (host.querySelector('.mclubs__panel') as HTMLFormElement).dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
    );
    await settle();

    const panel = host.querySelector('.mclubs__panel') as HTMLElement;
    expect(panel.hidden).toBe(false);
    expect(name.value).toBe('Linköpings GK');
    expect((host.querySelector('.mclubs__error') as HTMLElement).textContent).toBe(
        'A club named Linköpings GK already exists.',
    );
});

test('the delete question names the club and states its course count', async () => {
    const { host } = await screen();
    byText(rows(host)[0]!, 'button', 'Delete').click();

    expect((document.querySelector('.ui-confirm__title') as HTMLElement).textContent).toBe(
        'Delete Linköpings GK?',
    );
    const message = (document.querySelector('.ui-confirm__message') as HTMLElement).textContent!;
    expect(message).toContain('Linköpings GK leaves the catalog.');
    expect(message).toContain('It has 2 courses.');
    // The consequence, not "are you sure".
    expect(message).not.toContain('sure');
    // A destructive confirm is worded as a verb on the object.
    expect((document.querySelector('.ui-confirm__btn--danger') as HTMLElement).textContent).toBe(
        'Delete club',
    );
});

test('confirming a delete calls the API and drops the row', async () => {
    const { host } = await screen();
    byText(rows(host)[0]!, 'button', 'Delete').click();
    (document.querySelector('.ui-confirm__btn--danger') as HTMLButtonElement).click();
    await settle();

    expect(state.removed).toEqual(['c1']);
    expect(rows(host).map((row) => row.getAttribute('data-row-key'))).toEqual(['c2']);
});

test('a refused delete surfaces the server sentence verbatim, and the club stays', async () => {
    const { host } = await screen();
    state.failWith = new ApiError(409, '2 courses still belong to this club. Delete them first.');

    byText(rows(host)[0]!, 'button', 'Delete').click();
    (document.querySelector('.ui-confirm__btn--danger') as HTMLButtonElement).click();
    await settle();

    const errors = [...host.querySelectorAll('.mclubs__error')] as HTMLElement[];
    const shown = errors.filter((el) => !el.hidden).map((el) => el.textContent);
    // NAMED. The dialog that said which club this was about closed itself before
    // the answer arrived, and the banner sits above a list of several rows.
    expect(shown).toEqual(['Linköpings GK — 2 courses still belong to this club. Delete them first.']);
    // Nothing was pre-blocked client-side and nothing was optimistically removed.
    expect(rows(host).length).toBe(2);
});

test('a delete in flight says so on the row, and no row can start a second one', async () => {
    const { host } = await screen();
    gate = deferred();

    byText(rows(host)[0]!, 'button', 'Delete').click();
    (document.querySelector('.ui-confirm__btn--danger') as HTMLButtonElement).click();
    await settle();

    // The dialog is gone by now, so the row it was opened from has to carry the
    // news — worded, not a glyph.
    const acting = rows(host)[0]!.querySelector('button') as HTMLButtonElement;
    expect(acting.textContent).toBe('Deleting…');
    expect(acting.disabled).toBe(true);
    // Siblings go inert too: two deletes against one list is not a state this
    // screen has anything sensible to say about.
    expect((rows(host)[1]!.querySelector('button') as HTMLButtonElement).disabled).toBe(true);

    gate.release();
    await settle();

    // Exactly one DELETE, and the row is gone.
    expect(apiMock.clubs.remove).toHaveBeenCalledTimes(1);
    expect(rows(host).map((row) => row.getAttribute('data-row-key'))).toEqual(['c2']);
    // The busy state is not sticky — the surviving row is actionable again.
    const survivor = rows(host)[0]!.querySelector('button') as HTMLButtonElement;
    expect(survivor.textContent).toBe('Delete');
    expect(survivor.disabled).toBe(false);
});

test('a delete that fails hands the row back rather than leaving it inert', async () => {
    const { host } = await screen();
    state.failWith = new ApiError(409, '2 courses still belong to this club. Delete them first.');

    byText(rows(host)[0]!, 'button', 'Delete').click();
    (document.querySelector('.ui-confirm__btn--danger') as HTMLButtonElement).click();
    await settle();

    for (const row of rows(host)) {
        const button = row.querySelector('button') as HTMLButtonElement;
        expect(button.textContent).toBe('Delete');
        expect(button.disabled).toBe(false);
    }
});

test('an invalid create puts the caret in the field that was complained about', async () => {
    const { host } = await screen();
    byText(host, 'button', 'New club').click();

    // Focus starts on the name field; move it away so the assertion is about
    // the submit and not about opening the panel.
    (host.querySelector('#manage-club-new-logo') as HTMLInputElement).focus();

    (host.querySelector('.mclubs__panel') as HTMLFormElement).dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
    );
    await settle();

    expect(document.activeElement).toBe(host.querySelector('#manage-club-new-name'));
});

test('a field describes itself with its hint always and its error only while shown', async () => {
    const { host } = await screen();
    byText(host, 'button', 'New club').click();

    const name = host.querySelector('#manage-club-new-name') as HTMLInputElement;
    const logo = host.querySelector('#manage-club-new-logo') as HTMLInputElement;
    const location = host.querySelector('#manage-club-new-location') as HTMLInputElement;

    // A permanent hint is a permanent description.
    expect(location.getAttribute('aria-describedby')).toBe('manage-club-new-location-hint');
    expect(host.querySelector('#manage-club-new-location-hint')).not.toBeNull();
    expect(logo.getAttribute('aria-describedby')).toBe('manage-club-new-logo-hint');
    // Nothing wrong yet, so the field claims no error description at all —
    // not an empty one pointing at a hidden, empty paragraph.
    expect(name.getAttribute('aria-describedby')).toBeNull();

    logo.value = 'clubname.se';
    logo.dispatchEvent(new Event('input', { bubbles: true }));
    (host.querySelector('.mclubs__panel') as HTMLFormElement).dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
    );
    await settle();

    expect(name.getAttribute('aria-describedby')).toBe('manage-club-new-name-error');
    // Hint first, then what is wrong with what was typed — reading order.
    expect(logo.getAttribute('aria-describedby')).toBe(
        'manage-club-new-logo-hint manage-club-new-logo-error',
    );
});

test('the counts that change without moving focus are polite live regions', async () => {
    const { host } = await screen();
    const notes = [...host.querySelectorAll('.mclubs__note')] as HTMLElement[];

    expect(notes.length).toBe(2);
    for (const note of notes) {
        expect(note.getAttribute('role')).toBe('status');
        expect(note.getAttribute('aria-live')).toBe('polite');
    }
});

test('the screen publishes its breadcrumb on mount', async () => {
    const { crumbs } = await screen();
    expect(crumbs.crumbs.get()).toEqual([{ label: 'Clubs' }]);
});
