import './harness';
import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import { di, Router } from '@basics/core/client/core';
import { mount } from './harness';
import type { Club } from '../../src/api/clubs.gen';

// The club page: the one place a club's three fields are edited (spec §3.2),
// deep-linkable, and the trail it publishes for the shell's breadcrumb.

type CourseRow = { id: string; clubId: string };

const state: {
    clubs: Club[];
    courses: CourseRow[];
    updated: unknown[];
    removed: string[];
    failWith: unknown;
} = { clubs: [], courses: [], updated: [], removed: [], failWith: null };

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
        create: mock(async () => state.clubs[0]!),
        update: mock(async (input: { id: string; name: string }) => {
            raise();
            state.updated.push(input);
            state.clubs = state.clubs.map((club) =>
                club.id === input.id ? { ...club, name: input.name } : club,
            );
            return state.clubs.find((club) => club.id === input.id)!;
        }),
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
const { ClubDetailComponent } = await import('../../manage/courses/club-detail.component');
const { BreadcrumbService } = await import('../../manage/shell/breadcrumb.service');

let open: { destroy(): void } | null = null;

beforeEach(() => {
    state.clubs = [{ id: 'c1', name: 'Linköpings GK', location: 'Linköping', logoUrl: null }];
    state.courses = [
        { id: 'k1', clubId: 'c1' },
        { id: 'k2', clubId: 'c1' },
    ];
    state.updated = [];
    state.removed = [];
    state.failWith = null;
    gate = null;
    apiMock.clubs.remove.mockClear();
    di.reset();
});

afterEach(() => {
    open?.destroy();
    open = null;
});

async function settle(): Promise<void> {
    for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
}

async function page(route = '/courses/clubs/c1') {
    const router = di.get(Router);
    router.navigate(route);
    const clubs = new ClubsService();
    di.set(ClubsService, clubs);
    const mounted = mount(new ClubDetailComponent());
    open = mounted;
    await clubs.load();
    await settle();
    return { ...mounted, clubs, router, crumbs: di.get(BreadcrumbService) };
}

const el = (host: HTMLElement, selector: string): HTMLElement =>
    host.querySelector(selector) as HTMLElement;

const byText = (host: HTMLElement, selector: string, text: string): HTMLElement =>
    [...host.querySelectorAll(selector)].find(
        (node) => node.textContent?.trim() === text,
    ) as HTMLElement;

test('a deep link renders the club, its facts and what it holds', async () => {
    const { host, crumbs } = await page();

    expect(el(host, '[bind="title"]').textContent).toBe('Linköpings GK');
    expect(el(host, '[bind="subtitle"]').textContent).toBe('2 courses.');
    expect(el(host, '[bind="factLocation"]').textContent).toBe('Linköping');
    // A field that was never filled in says so, rather than showing a blank.
    expect(el(host, '[bind="factLogo"]').textContent).toBe('Not recorded');
    expect(el(host, '.mclub__missing').hidden).toBe(true);

    // The trail is data the page learned, not a mapping from the URL.
    expect(crumbs.crumbs.get()).toEqual([
        { label: 'Clubs', path: '/courses' },
        { label: 'Linköpings GK' },
    ]);
});

test('an unknown id says so only after the load has answered', async () => {
    const clubs = new ClubsService();
    di.set(ClubsService, clubs);
    di.get(Router).navigate('/courses/clubs/nope');
    const mounted = mount(new ClubDetailComponent());
    open = mounted;

    // Mid-flight: "not found" would be a lie about a pending request.
    expect(el(mounted.host, '.mclub__missing').hidden).toBe(true);

    await clubs.load();
    await settle();

    expect(el(mounted.host, '.mclub__missing').hidden).toBe(false);
    expect(el(mounted.host, '.mclub__body').hidden).toBe(true);
});

test('editing swaps the facts for the form, seeded with the club', async () => {
    const { host } = await page();

    expect(el(host, '.mclub__form').hidden).toBe(true);
    byText(host, 'button', 'Edit').click();

    expect(el(host, '.mclub__facts').hidden).toBe(true);
    expect(el(host, '.mclub__form').hidden).toBe(false);
    expect((el(host, '#manage-club-edit-name') as HTMLInputElement).value).toBe('Linköpings GK');
    expect((el(host, '#manage-club-edit-location') as HTMLInputElement).value).toBe('Linköping');
    // Delete is not offered while a draft is open — one intent at a time.
    expect((byText(host, 'button', 'Delete club') as HTMLButtonElement).disabled).toBe(true);
});

test('a saved edit writes the club and returns to the facts', async () => {
    const { host } = await page();
    byText(host, 'button', 'Edit').click();

    const name = el(host, '#manage-club-edit-name') as HTMLInputElement;
    name.value = 'Linköpings Golfklubb';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    el(host, '.mclub__form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await settle();

    expect(state.updated).toEqual([
        { id: 'c1', name: 'Linköpings Golfklubb', location: 'Linköping', logoUrl: null },
    ]);
    expect(el(host, '.mclub__form').hidden).toBe(true);
    expect(el(host, '[bind="title"]').textContent).toBe('Linköpings Golfklubb');
});

test('an invalid draft complains under the field and never reaches the server', async () => {
    const { host } = await page();
    byText(host, 'button', 'Edit').click();

    const name = el(host, '#manage-club-edit-name') as HTMLInputElement;
    name.value = '   ';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    el(host, '.mclub__form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await settle();

    expect(state.updated).toEqual([]);
    expect(el(host, '#manage-club-edit-name-error').hidden).toBe(false);
    // The server's error line stays empty: the same complaint is not said twice.
    expect(el(host, '[bind="saveError"]').hidden).toBe(true);
    expect(el(host, '.mclub__form').hidden).toBe(false);
});

test('a refused save keeps the form open with the draft and the server sentence', async () => {
    const { host } = await page();
    byText(host, 'button', 'Edit').click();

    const name = el(host, '#manage-club-edit-name') as HTMLInputElement;
    name.value = 'Vreta Kloster GK';
    name.dispatchEvent(new Event('input', { bubbles: true }));

    state.failWith = new ApiError(409, 'A club named Vreta Kloster GK already exists.');
    el(host, '.mclub__form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await settle();

    expect(el(host, '.mclub__form').hidden).toBe(false);
    expect((el(host, '#manage-club-edit-name') as HTMLInputElement).value).toBe('Vreta Kloster GK');
    expect(el(host, '[bind="saveError"]').textContent).toBe(
        'A club named Vreta Kloster GK already exists.',
    );
});

test('deleting confirms with the count, then leaves for the list', async () => {
    const { host, router } = await page();
    byText(host, 'button', 'Delete club').click();

    const message = el(document.body, '.ui-confirm__message').textContent!;
    expect(message).toContain('Linköpings GK leaves the catalog.');
    expect(message).toContain('It has 2 courses.');

    (document.querySelector('.ui-confirm__btn--danger') as HTMLButtonElement).click();
    await settle();

    expect(state.removed).toEqual(['c1']);
    expect(router.route.get()).toBe('/courses');
});

test('a refused delete keeps the page and shows what the server said', async () => {
    const { host, router } = await page();
    state.failWith = new ApiError(409, '2 courses still belong to this club. Delete them first.');

    byText(host, 'button', 'Delete club').click();
    (document.querySelector('.ui-confirm__btn--danger') as HTMLButtonElement).click();
    await settle();

    expect(el(host, '[bind="deleteError"]').textContent).toBe(
        '2 courses still belong to this club. Delete them first.',
    );
    expect(router.route.get()).toBe('/courses/clubs/c1');
    expect(el(host, '.mclub__body').hidden).toBe(false);
});

test('a delete in flight says so on the button it was fired from', async () => {
    const { host, router } = await page();
    gate = deferred();

    byText(host, 'button', 'Delete club').click();
    (document.querySelector('.ui-confirm__btn--danger') as HTMLButtonElement).click();
    await settle();

    // The dialog closes on confirm, so without this the page looks idle while
    // the request is out — which reads as "the click missed".
    const remove = el(host, '[bind="remove"]') as HTMLButtonElement;
    expect(remove.textContent).toBe('Deleting…');
    expect(remove.disabled).toBe(true);
    // One intent at a time: no editing a club that is on its way out.
    expect((byText(host, 'button', 'Edit') as HTMLButtonElement).disabled).toBe(true);
    expect(state.removed).toEqual([]);

    gate.release();
    await settle();

    expect(apiMock.clubs.remove).toHaveBeenCalledTimes(1);
    expect(state.removed).toEqual(['c1']);
    expect(router.route.get()).toBe('/courses');
});

test('a refused delete hands the button back rather than leaving it inert', async () => {
    const { host } = await page();
    state.failWith = new ApiError(409, '2 courses still belong to this club. Delete them first.');

    byText(host, 'button', 'Delete club').click();
    (document.querySelector('.ui-confirm__btn--danger') as HTMLButtonElement).click();
    await settle();

    const remove = el(host, '[bind="remove"]') as HTMLButtonElement;
    expect(remove.textContent).toBe('Delete club');
    expect(remove.disabled).toBe(false);
});

test('an invalid draft puts the caret in the field that was complained about', async () => {
    const { host } = await page();
    byText(host, 'button', 'Edit').click();

    const name = el(host, '#manage-club-edit-name') as HTMLInputElement;
    name.value = '   ';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    // Move focus away, so the assertion is about the refused submit and not
    // about entering edit mode.
    (el(host, '#manage-club-edit-logo') as HTMLInputElement).focus();

    el(host, '.mclub__form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await settle();

    expect(document.activeElement).toBe(name);
});

test('the destructive button takes its outline skin from the theme, not from this file', async () => {
    const styles = ClubDetailComponent.styles;
    // The recipe's danger tier, reached with btn(undefined, 'danger') …
    expect(styles).toContain('var(--btn-danger-bg,');
    // … and no hand-rolled skin over a plain btn(). Whether a destructive
    // button is filled or outlined is a theme decision, not a screen's.
    expect(styles).not.toContain('background: transparent');
    expect(styles).not.toContain('border-color: var(--danger)');

    const { resolvedLight, resolvedDark } = await import('../../manage/theme');
    for (const tokens of [resolvedLight, resolvedDark]) {
        // Outline at rest …
        expect(tokens['btn-danger-bg']).toBe('transparent');
        expect(tokens['btn-danger-fg']).toBe('var(--danger)');
        expect(tokens['btn-danger-border']).toBe('var(--danger)');
        // … filling on hover. Same values the hand-rolled skin used, so the
        // button looks exactly as it did.
        expect(tokens['btn-danger-bg-hover']).toBe('var(--danger)');
        expect(tokens['btn-danger-fg-hover']).toBe('var(--on-danger)');
        expect(tokens['btn-danger-border-hover']).toBe('var(--danger)');
    }
});

test('the loading note is a polite live region', async () => {
    const { host } = await page();
    const note = el(host, '[bind="loadingNote"]');
    expect(note.getAttribute('role')).toBe('status');
    expect(note.getAttribute('aria-live')).toBe('polite');
});

test('a bare /courses/clubs has no club to show and goes back to the list', async () => {
    const { router } = await page('/courses/clubs');
    expect(router.route.get()).toBe('/courses');
});
