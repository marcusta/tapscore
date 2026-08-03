import './harness';
import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import { di } from '@basics/core/client/core';
import { mount, press } from './harness';
import type { Course, CourseValidation, Hole } from '../../src/api/courses.gen';
import type { ClubListItem } from '../../src/api/clubs.gen';

// The holes editor (spec §3.4). What it owes: a grid of HOLES DOWN whose open
// row survives the refresh every save causes, par and stroke index edited in
// place with the server's refusal repeated on the row, live par figures that
// never quietly cover half a course, one presentation of `/courses/validate`,
// and a way out of a course with missing hole rows that invents nothing.

const state: {
    courses: Course[];
    validations: Record<string, CourseValidation | Error>;
    holeWrites: unknown[];
    bulkWrites: { id: string; holes?: Hole[] }[];
    failWith: unknown;
} = { courses: [], validations: {}, holeWrites: [], bulkWrites: [], failWith: null };

function raise(): void {
    if (state.failWith === null) return;
    const err = state.failWith;
    state.failWith = null;
    throw err;
}

const apiMock = {
    clubs: {
        list: mock(async (): Promise<ClubListItem[]> => []),
        create: mock(async () => ({}) as ClubListItem),
        update: mock(async () => ({}) as ClubListItem),
        remove: mock(async () => ({ ok: true })),
    },
    courses: {
        listByClub: mock(async (input: { clubId: string }) =>
            state.courses.filter((course) => course.clubId === input.clubId),
        ),
        validate: mock(async (input: { id: string }) => {
            const answer = state.validations[input.id] ?? { ok: true, issues: [] };
            if (answer instanceof Error) throw answer;
            return answer;
        }),
        create: mock(async () => state.courses[0]!),
        update: mock(async (input: { id: string; holes?: Hole[] }) => {
            raise();
            state.bulkWrites.push(input);
            const next = { ...state.courses.find((c) => c.id === input.id)!, holes: input.holes ?? [] };
            state.courses = state.courses.map((c) => (c.id === next.id ? next : c));
            return next;
        }),
        updateHole: mock(
            async (input: { courseId: string; holeNumber: number; par?: number; strokeIndex?: number }) => {
                raise();
                state.holeWrites.push(input);
                const course = state.courses.find((c) => c.id === input.courseId)!;
                const next: Course = {
                    ...course,
                    // New objects, as a real refetch produces: the row the user
                    // is editing must survive them.
                    holes: course.holes.map((hole) =>
                        hole.holeNumber === input.holeNumber
                            ? {
                                  ...hole,
                                  par: input.par ?? hole.par,
                                  strokeIndex: input.strokeIndex ?? hole.strokeIndex,
                              }
                            : { ...hole },
                    ),
                };
                state.courses = state.courses.map((c) => (c.id === next.id ? next : c));
                return next;
            },
        ),
        remove: mock(async () => ({ ok: true })),
        list: mock(async () => state.courses),
    },
};

mock.module('../../manage/api', () => ({ api: apiMock, API_BASE: '/api', ApiError }));

const { ClubsService } = await import('../../manage/courses/clubs.service');
const { CoursesService } = await import('../../manage/courses/courses.service');
const { HolesComponent } = await import('../../manage/courses/holes.component');

function hole(holeNumber: number, par = 4, strokeIndex = holeNumber): Hole {
    return { holeNumber, par, strokeIndex };
}

function course(over: Partial<Course> = {}): Course {
    return {
        id: 'k1',
        clubId: 'c1',
        name: 'Old course',
        holeCount: 18,
        latitude: null,
        longitude: null,
        holes: Array.from({ length: 18 }, (_, i) => hole(i + 1, i < 9 ? 4 : 5)),
        ...over,
    };
}

let open: { destroy(): void } | null = null;

beforeEach(() => {
    state.courses = [course()];
    state.validations = {};
    state.holeWrites = [];
    state.bulkWrites = [];
    state.failWith = null;
    apiMock.courses.validate.mockClear();
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

async function editor(courseId = 'k1') {
    di.set(ClubsService, new ClubsService());
    const courses = new CoursesService();
    di.set(CoursesService, courses);
    await courses.load('c1');
    const mounted = mount(new HolesComponent({ courseId }));
    open = mounted;
    await settle();
    return { ...mounted, courses };
}

const el = (host: HTMLElement, selector: string): HTMLElement =>
    host.querySelector(selector) as HTMLElement;
const rowEl = (host: HTMLElement, holeNumber: number): HTMLElement =>
    host.querySelector(`[data-row-key="${holeNumber}"]`)!;
const cellText = (host: HTMLElement, holeNumber: number, key: string): string =>
    rowEl(host, holeNumber).querySelector(`[data-key="${key}"] .mtable__cell`)!.textContent ?? '';
const inputs = (row: HTMLElement): HTMLInputElement[] =>
    [...row.querySelectorAll('input.mholes__input')] as HTMLInputElement[];
/**
 * The visible row status — `Saving…`, or the reason a save was refused.
 *
 * Deliberately NOT inside the row: this grid keeps its columns at 375px and
 * scrolls them sideways inside the table's box, so a message in the action cell
 * starts past that box's right edge and reads as letter fragments. It is hosted
 * full-width under the grid instead (`edit.statusHost`). Every row parks a
 * hidden one there, so "the visible one" is what a user can actually read.
 */
const rowStatus = (host: HTMLElement): HTMLElement | null =>
    ([...host.querySelectorAll('.mholes__row-status .mtable__status')].find(
        (p) => !(p as HTMLElement).hidden,
    ) as HTMLElement | undefined) ?? null;
const button = (scope: HTMLElement, label: string): HTMLButtonElement =>
    [...scope.querySelectorAll('button')].find((b) => b.textContent === label) as HTMLButtonElement;

function type(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

// ─── The grid ───

test('the grid is one row per HOLE, in order, with par and stroke index beside it', async () => {
    const { host } = await editor();

    const rows = [...host.querySelectorAll('[data-row-key]')];
    expect(rows).toHaveLength(18);
    expect(rows.map((r) => r.getAttribute('data-row-key')).slice(0, 3)).toEqual(['1', '2', '3']);
    expect(cellText(host, 10, 'hole')).toBe('10');
    expect(cellText(host, 10, 'par')).toBe('5');
    expect(cellText(host, 10, 'strokeIndex')).toBe('10');

    // Columns at every width — eighteen rows of two numbers must not become
    // eighteen stacked cards.
    expect(el(host, '[data-layout]').getAttribute('data-layout')).toBe('columns');
});

test('a course with no rows says so rather than showing an empty grid', async () => {
    state.courses = [course({ holes: [] })];
    const { host } = await editor();

    expect(host.textContent).toContain('No holes yet');
});

// ─── Inline editing ───

test('Edit swaps the two numbers for numeric fields seeded from the row', async () => {
    const { host } = await editor();
    button(rowEl(host, 3), 'Edit').click();

    const fields = inputs(rowEl(host, 3));
    expect(fields.map((i) => i.value)).toEqual(['4', '3']);
    // A numeric KEYPAD without the number input's spinners and wheel edits.
    expect(fields.map((i) => i.inputMode)).toEqual(['numeric', 'numeric']);
    expect(fields[0]!.getAttribute('aria-label')).toBe('Par, hole 3');
    // One row at a time: every other row goes inert while this one is open.
    expect(button(rowEl(host, 4), 'Edit').disabled).toBe(true);
});

test('a save writes the one hole, closes the row, and the figures follow', async () => {
    const { host } = await editor();
    expect(el(host, '[bind="totalPar"]').textContent).toBe('81');

    button(rowEl(host, 3), 'Edit').click();
    const [par, si] = inputs(rowEl(host, 3));
    type(par!, '5');
    type(si!, '1');
    button(rowEl(host, 3), 'Save').click();
    await settle();

    expect(state.holeWrites).toEqual([{ courseId: 'k1', holeNumber: 3, par: 5, strokeIndex: 1 }]);
    expect(inputs(rowEl(host, 3))).toHaveLength(0);
    expect(cellText(host, 3, 'par')).toBe('5');
    expect(cellText(host, 3, 'strokeIndex')).toBe('1');
    // Live, off the same data the grid draws.
    expect(el(host, '[bind="frontPar"]').textContent).toBe('37');
    expect(el(host, '[bind="totalPar"]').textContent).toBe('82');
});

test('Escape cancels: the row closes, nothing is written, the draft is dropped', async () => {
    const { host } = await editor();
    button(rowEl(host, 3), 'Edit').click();
    type(inputs(rowEl(host, 3))[0]!, '9');

    press(inputs(rowEl(host, 3))[0]!, 'Escape');
    await settle();

    expect(state.holeWrites).toEqual([]);
    expect(cellText(host, 3, 'par')).toBe('4');

    // And re-opening starts from the ROW again, not from the abandoned draft.
    button(rowEl(host, 3), 'Edit').click();
    expect(inputs(rowEl(host, 3))[0]!.value).toBe('4');
});

test('Enter saves from the field, so the grid is keyboard-workable', async () => {
    const { host } = await editor();
    button(rowEl(host, 3), 'Edit').click();
    type(inputs(rowEl(host, 3))[0]!, '3');
    press(inputs(rowEl(host, 3))[0]!, 'Enter');
    await settle();

    expect(state.holeWrites).toEqual([{ courseId: 'k1', holeNumber: 3, par: 3, strokeIndex: 3 }]);
});

test('a REFUSED save keeps the row open with what was typed and the reason on it', async () => {
    const { host } = await editor();
    state.failWith = new ApiError(409, 'Stroke index 4 is already used by hole 4');

    button(rowEl(host, 3), 'Edit').click();
    type(inputs(rowEl(host, 3))[1]!, '4');
    button(rowEl(host, 3), 'Save').click();
    await settle();

    // Under the grid, not in the row's action cell — and therefore naming the
    // hole itself, since the row is no longer what says which one it is. The
    // server's sentence is otherwise verbatim.
    expect(rowStatus(host)!.textContent).toBe(
        'Hole 3 — Stroke index 4 is already used by hole 4',
    );
    expect(rowEl(host, 3).querySelector('.mtable__status')).toBeNull();
    // The one thing a user must never lose to a failed request.
    expect(inputs(rowEl(host, 3))[1]!.value).toBe('4');
    expect(cellText(host, 3, 'hole')).toBe('3');
});

test('a typo is refused CLIENT-side, in the same place and shape a server refusal lands', async () => {
    const { host } = await editor();
    button(rowEl(host, 3), 'Edit').click();
    type(inputs(rowEl(host, 3))[0]!, 'four');
    button(rowEl(host, 3), 'Save').click();
    await settle();

    // No request: the server would answer this one with a 500 whose reason the
    // framework strips, which would read as breakage rather than as a typo.
    expect(state.holeWrites).toEqual([]);
    expect(rowStatus(host)!.textContent).toContain('Par is a whole number');
    expect(rowStatus(host)!.textContent).toStartWith('Hole 3 — ');
    expect(inputs(rowEl(host, 3))[0]!.value).toBe('four');
});

test('a stroke index outside the course’s range is refused with the range spelled out', async () => {
    state.courses = [course({ holeCount: 9, holes: Array.from({ length: 9 }, (_, i) => hole(i + 1)) })];
    const { host } = await editor();

    button(rowEl(host, 3), 'Edit').click();
    type(inputs(rowEl(host, 3))[1]!, '12');
    button(rowEl(host, 3), 'Save').click();
    await settle();

    expect(rowStatus(host)!.textContent).toContain('1 to 9');
    expect(state.holeWrites).toEqual([]);
});

test('the refusal is NOT inside the sideways-scrolling grid — at 375px that is unreadable', async () => {
    // F1. This grid is the `stacked: false` exception, so at 375px it keeps its
    // columns and scrolls them inside the table's own box. The action column
    // starts past that box's right edge and Enter-to-save does not scroll, so a
    // refusal rendered there arrives as a stack of letter fragments. The whole
    // fix is WHERE the element lives; jsdom cannot measure the clipping, but it
    // can hold the structural fact that prevents it.
    const { host } = await editor();

    button(rowEl(host, 3), 'Edit').click();
    type(inputs(rowEl(host, 3))[0]!, '0');
    press(inputs(rowEl(host, 3))[0]!, 'Enter');
    await settle();

    const status = rowStatus(host)!;
    expect(status.textContent).toContain('Par is a whole number');
    // Outside the table's scroll box entirely.
    expect(status.closest('.mtable-wrap')).toBeNull();
    expect(status.parentElement!.className).toBe('mholes__row-status');
    // One hidden line per row is parked there; exactly one is ever readable.
    const parked = host.querySelectorAll('.mholes__row-status .mtable__status');
    expect(parked).toHaveLength(18);
    expect([...parked].filter((p) => !(p as HTMLElement).hidden)).toHaveLength(1);

    // And it clears with the row, rather than outliving the editor it explains.
    press(inputs(rowEl(host, 3))[0]!, 'Escape');
    await settle();
    expect(rowStatus(host)).toBeNull();
});

test('THE PROPERTY: the refresh a save causes does not close or re-seed the other row’s editor', async () => {
    const { host } = await editor();
    button(rowEl(host, 3), 'Edit').click();
    const field = inputs(rowEl(host, 3))[0]!;
    field.focus();
    type(field, '6');

    // The write's answer replaces every hole object in the course.
    await di.get(CoursesService).saveHole('k1', 12, { par: 3, strokeIndex: 12 });
    await settle();

    expect(inputs(rowEl(host, 3))[0]).toBe(field);
    expect(field.value).toBe('6');
    expect(document.activeElement).toBe(field);
    expect(cellText(host, 12, 'par')).toBe('3');
});

// ─── Summaries ───

test('a nine-hole course shows a total and no back nine', async () => {
    state.courses = [course({ holeCount: 9, holes: Array.from({ length: 9 }, (_, i) => hole(i + 1)) })];
    const { host } = await editor();

    expect(el(host, '[bind="frontItem"]').hidden).toBe(true);
    expect(el(host, '[bind="backItem"]').hidden).toBe(true);
    expect(el(host, '[bind="totalPar"]').textContent).toBe('36');
    expect(el(host, '[bind="summaryNote"]').hidden).toBe(true);
});

test('a total computed over half a course is QUALIFIED rather than stated flat', async () => {
    state.courses = [course({ holes: Array.from({ length: 9 }, (_, i) => hole(i + 1)) })];
    const { host } = await editor();

    expect(el(host, '[bind="totalPar"]').textContent).toBe('36');
    const note = el(host, '[bind="summaryNote"]');
    expect(note.hidden).toBe(false);
    expect(note.textContent).toContain('9 of the course’s 18 holes');
});

test('a back nine with no rows shows a dash — the nine is still there, the figure is not', async () => {
    state.courses = [course({ holes: Array.from({ length: 9 }, (_, i) => hole(i + 1)) })];
    const { host } = await editor();

    // Shown, because an eighteen-hole course HAS a back nine.
    expect(el(host, '[bind="backItem"]').hidden).toBe(false);
    // A dash, because nobody has typed it. "0" would be nine holes of par 0.
    expect(el(host, '[bind="backPar"]').textContent).toBe('—');
    expect(el(host, '[bind="frontPar"]').textContent).toBe('36');
    // The dash is not the explanation; the note still carries that.
    expect(el(host, '[bind="summaryNote"]').hidden).toBe(false);
});

// ─── The course check ───

test('the check is stated in words with the badge the club page shows for the same course', async () => {
    const { host, courses } = await editor();

    expect(el(host, '[bind="checkBadge"]').textContent).toBe('Ready');
    expect(el(host, '[bind="checkStatus"]').textContent).toContain('Nothing to fix');
    expect(host.querySelectorAll('[bind="issues"] li')).toHaveLength(0);
    // One answer, two readings.
    expect(courses.readiness.get().k1).toEqual({ status: 'ready' });
});

test('each issue carries a WORDED severity, what the rule is for, and the server’s own sentence', async () => {
    state.validations.k1 = {
        ok: false,
        issues: [
            { severity: 'error', code: 'duplicate_stroke_index', message: 'Stroke index 5 used by holes 4, 12' },
            { severity: 'warning', code: 'unusual_par', message: 'Hole 7 has par 7' },
        ],
    };
    const { host } = await editor();

    expect(el(host, '[bind="checkBadge"]').textContent).toBe('1 issue');
    expect(el(host, '[bind="checkStatus"]').textContent).toBe('1 problem to fix, and 1 warning.');

    const items = [...host.querySelectorAll('[bind="issues"] li')];
    expect(items).toHaveLength(2);
    expect(items[0]!.querySelector('.mholes__issue-severity')!.textContent).toBe('Problem');
    expect(items[0]!.querySelector('.mholes__issue-text')!.textContent).toContain('stroke-index order');
    expect(items[0]!.querySelector('.mholes__issue-detail')!.textContent).toBe(
        'Stroke index 5 used by holes 4, 12',
    );
    expect(items[1]!.querySelector('.mholes__issue-severity')!.textContent).toBe('Warning');
});

test('a check that could not run says so — it never reads as an all-clear', async () => {
    state.validations.k1 = new Error('offline');
    const { host } = await editor();

    expect(el(host, '[bind="checkBadge"]').textContent).toBe('Not checked');
    expect(el(host, '[bind="checkStatus"]').textContent).toContain('did not run');
    expect(host.querySelectorAll('[bind="issues"] li')).toHaveLength(0);
});

test('the panel is re-run and REDRAWN after a hole save, not left saying what it said before', async () => {
    state.validations.k1 = {
        ok: false,
        issues: [{ severity: 'error', code: 'duplicate_stroke_index', message: 'Stroke index 3 used by holes 3, 4' }],
    };
    const { host } = await editor();
    expect(el(host, '[bind="checkBadge"]').textContent).toBe('1 issue');

    state.validations.k1 = { ok: true, issues: [] };
    button(rowEl(host, 3), 'Edit').click();
    type(inputs(rowEl(host, 3))[1]!, '18');
    button(rowEl(host, 3), 'Save').click();
    await settle();

    expect(apiMock.courses.validate).toHaveBeenCalledTimes(2);
    expect(el(host, '[bind="checkBadge"]').textContent).toBe('Ready');
    expect(host.querySelectorAll('[bind="issues"] li')).toHaveLength(0);
});

// ─── Missing hole rows ───

test('missing rows are named, and nothing is filled in on the user’s behalf', async () => {
    state.courses = [course({ holes: Array.from({ length: 16 }, (_, i) => hole(i + 1, 4)) })];
    const { host } = await editor();

    expect(el(host, '[bind="fill"]').hidden).toBe(false);
    const lead = el(host, '[bind="fillLead"]').textContent ?? '';
    expect(lead).toContain('Holes 17 and 18');
    expect(lead).toContain('nothing is guessed for you');

    el(host, '[bind="fillOpen"]').click();

    const rows = [...host.querySelectorAll('[bind="fillRows"] .mholes__fill-row')];
    expect(rows).toHaveLength(2);
    // Empty, deliberately: an invented par 4 is indistinguishable from a real
    // one once a round snapshots the course.
    expect([...host.querySelectorAll('[bind="fillRows"] input')].map((i) => (i as HTMLInputElement).value)).toEqual(
        ['', '', '', ''],
    );
    expect(rows[0]!.textContent).toContain('Hole 17');
    expect(el(host, '[bind="fillFree"]').textContent).toContain('17 and 18');
});

test('a complete fill sends the WHOLE hole set and the panel goes away', async () => {
    state.courses = [course({ holes: Array.from({ length: 16 }, (_, i) => hole(i + 1, 4)) })];
    const { host } = await editor();

    el(host, '[bind="fillOpen"]').click();
    const fields = [...host.querySelectorAll('[bind="fillRows"] input')] as HTMLInputElement[];
    type(fields[0]!, '4');
    type(fields[1]!, '17');
    type(fields[2]!, '5');
    type(fields[3]!, '18');
    button(el(host, '[bind="fillForm"]'), 'Add holes').click();
    await settle();

    expect(state.bulkWrites).toHaveLength(1);
    expect(state.bulkWrites[0]!.holes).toHaveLength(18);
    expect(state.bulkWrites[0]!.holes!.at(-1)).toEqual({ holeNumber: 18, par: 5, strokeIndex: 18 });
    expect(el(host, '[bind="fill"]').hidden).toBe(true);
    expect(el(host, '[bind="totalPar"]').textContent).toBe('73');
    expect(host.querySelectorAll('[data-row-key]')).toHaveLength(18);
});

test('a half-finished fill is refused before it is sent, and keeps what was typed', async () => {
    state.courses = [course({ holes: Array.from({ length: 16 }, (_, i) => hole(i + 1, 4)) })];
    const { host } = await editor();

    el(host, '[bind="fillOpen"]').click();
    const fields = [...host.querySelectorAll('[bind="fillRows"] input')] as HTMLInputElement[];
    type(fields[0]!, '4');
    type(fields[1]!, '17');
    button(el(host, '[bind="fillForm"]'), 'Add holes').click();
    await settle();

    // The bulk endpoint refuses a partial set with a plain `Error`, which
    // reaches the client as a 500 with the reason stripped — so it is said here.
    expect(state.bulkWrites).toEqual([]);
    const error = el(host, '[bind="fillError"]');
    expect(error.hidden).toBe(false);
    expect(error.textContent).toContain('Hole 18');
    expect(fields[1]!.value).toBe('17');
});

test('a stroke index already used by an existing hole is named on both holes', async () => {
    state.courses = [course({ holes: Array.from({ length: 17 }, (_, i) => hole(i + 1, 4)) })];
    const { host } = await editor();

    el(host, '[bind="fillOpen"]').click();
    const fields = [...host.querySelectorAll('[bind="fillRows"] input')] as HTMLInputElement[];
    type(fields[0]!, '4');
    type(fields[1]!, '5');
    button(el(host, '[bind="fillForm"]'), 'Add holes').click();
    await settle();

    expect(state.bulkWrites).toEqual([]);
    expect(el(host, '[bind="fillError"]').textContent).toContain('Holes 5 and 18');
});

test('Cancel closes the fill panel and throws the drafts away', async () => {
    state.courses = [course({ holes: Array.from({ length: 17 }, (_, i) => hole(i + 1, 4)) })];
    const { host } = await editor();

    el(host, '[bind="fillOpen"]').click();
    type([...host.querySelectorAll('[bind="fillRows"] input')][0] as HTMLInputElement, '4');
    button(el(host, '[bind="fillForm"]'), 'Cancel').click();

    expect(el(host, '[bind="fillForm"]').hidden).toBe(true);
    expect(el(host, '[bind="fillOpen"]').hidden).toBe(false);

    el(host, '[bind="fillOpen"]').click();
    expect(([...host.querySelectorAll('[bind="fillRows"] input')][0] as HTMLInputElement).value).toBe('');
});

test('a complete course offers no fill panel at all', async () => {
    const { host } = await editor();
    expect(el(host, '[bind="fill"]').hidden).toBe(true);
});

test('both editors may be open — the fill panel does not lock the grid behind it', async () => {
    state.courses = [course({ holes: Array.from({ length: 17 }, (_, i) => hole(i + 1, 4)) })];
    const { host } = await editor();

    // One GRID row at a time still holds: a second half-open row is a state
    // with nothing sensible to say about itself.
    button(rowEl(host, 3), 'Edit').click();
    expect(button(rowEl(host, 4), 'Edit').disabled).toBe(true);
    // But the fill panel is a second controller, and may open over it.
    expect((el(host, '[bind="fillOpen"]') as HTMLButtonElement).disabled).toBe(false);

    press(inputs(rowEl(host, 3))[0]!, 'Escape');
    el(host, '[bind="fillOpen"]').click();
    // The reverse, which is the one the clash message's advice depends on.
    expect(button(rowEl(host, 3), 'Edit').disabled).toBe(false);
});

test('the clash message’s escape route works: fix it in the grid, come back, nothing retyped', async () => {
    // Holes 1..17, but hole 12 duplicates hole 4's stroke index — the state the
    // grid permits on purpose (swapping two indices passes through it) and the
    // course check reports. Hole 18 has no row at all.
    state.courses = [
        course({
            holes: Array.from({ length: 17 }, (_, i) =>
                hole(i + 1, 4, i + 1 === 12 ? 4 : i + 1),
            ),
        }),
    ];
    const { host } = await editor();

    el(host, '[bind="fillOpen"]').click();
    const fields = () => [...host.querySelectorAll('[bind="fillRows"] input')] as HTMLInputElement[];
    type(fields()[0]!, '4');
    type(fields()[1]!, '18');
    button(el(host, '[bind="fillForm"]'), 'Add holes').click();
    await settle();

    // Refused, and the refusal sends the user to the grid.
    expect(state.bulkWrites).toEqual([]);
    const error = el(host, '[bind="fillError"]');
    expect(error.textContent).toContain('Holes 4 and 12');
    expect(error.textContent).toContain('Change one of them in the grid above first');

    // Follow the advice. This is the whole fix: the button used to be disabled
    // by the open panel, and Cancel — the only way to re-enable it — threw the
    // drafts away, so the advice could not be taken without retyping.
    expect(button(rowEl(host, 12), 'Edit').disabled).toBe(false);
    button(rowEl(host, 12), 'Edit').click();
    type(inputs(rowEl(host, 12))[1]!, '12');
    button(rowEl(host, 12), 'Save').click();
    await settle();

    expect(state.holeWrites).toEqual([{ courseId: 'k1', holeNumber: 12, par: 4, strokeIndex: 12 }]);

    // Back to the panel, with what was typed still in it.
    expect(el(host, '[bind="fillForm"]').hidden).toBe(false);
    expect(fields()[0]!.value).toBe('4');
    expect(fields()[1]!.value).toBe('18');

    button(el(host, '[bind="fillForm"]'), 'Add holes').click();
    await settle();

    expect(state.bulkWrites).toHaveLength(1);
    expect(state.bulkWrites[0]!.holes).toHaveLength(18);
    expect(el(host, '[bind="fill"]').hidden).toBe(true);
});
