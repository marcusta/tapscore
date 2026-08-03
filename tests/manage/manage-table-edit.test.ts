import { club, flush, mount, press, type Club } from './harness';
import { afterEach, expect, test } from 'bun:test';
import { Signal } from '@basics/core/client/core';
import { RowEditController } from '../../manage/ui/row-edit';
import { ManageTableComponent, type ManageColumn } from '../../manage/ui/table.component';

// The reason `ManageTableComponent` exists rather than a wrapper around the
// framework table: a row being edited must survive a refresh of the underlying
// list with its focus, its caret and the user's half-typed value intact.
//
// The fixture below is the shape every M1 screen will have — the screen owns
// the draft signal and the editors, the table owns the row's mode.

const draft = new Signal('');

const columns: ManageColumn<Club>[] = [
    {
        key: 'name',
        header: 'Name',
        cell: (row) => row.name,
        editCell: (row) => {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'name-input';
            // Seeded from the row ONCE, on entering edit. From then on the
            // draft is the user's.
            input.value = draft.peek() || row.name;
            input.addEventListener('input', () => draft.set(input.value));
            return input;
        },
    },
    { key: 'courses', header: 'Courses', type: 'numeric', cell: (row) => row.courses },
];

type Harness = {
    host: HTMLElement;
    rows: Signal<Club[]>;
    edit: RowEditController;
    commits: Club[];
    cancels: Club[];
    destroy(): void;
};

let open: Harness | null = null;
afterEach(() => {
    open?.destroy();
    open = null;
    draft.set('');
});

function table(over: { narrow?: Signal<boolean> } = {}): Harness {
    const rows = new Signal<Club[]>([
        club({ id: 'c1', name: 'Linköpings GK', courses: 2 }),
        club({ id: 'c2', name: 'Vreta Kloster GK', courses: 1 }),
    ]);
    const edit = new RowEditController();
    const commits: Club[] = [];
    const cancels: Club[] = [];

    const mounted = mount(
        new ManageTableComponent<Club>({
            columns,
            rows,
            rowKey: (row) => row.id,
            caption: 'Clubs',
            captionHidden: true,
            narrow: over.narrow ?? new Signal(false),
            edit: {
                controller: edit,
                oncommit: (row) => commits.push(row),
                oncancel: (row) => cancels.push(row),
            },
        }),
    );

    const harness: Harness = { host: mounted.host, rows, edit, commits, cancels, destroy: mounted.destroy };
    open = harness;
    return harness;
}

const rowEl = (h: Harness, key: string): HTMLElement =>
    h.host.querySelector(`[data-row-key="${key}"]`)!;
const nameInput = (h: Harness, key: string): HTMLInputElement | null =>
    rowEl(h, key).querySelector('input.name-input');

test('entering edit swaps the cell for the control and offers worded Save/Cancel', () => {
    const h = table();
    expect(nameInput(h, 'c1')).toBeNull();

    h.edit.begin('c1');

    expect(nameInput(h, 'c1')?.value).toBe('Linköpings GK');
    expect(rowEl(h, 'c1').className).toContain('mtable__tr--editing');
    const buttons = [...rowEl(h, 'c1').querySelectorAll('button')].map((b) => b.textContent);
    expect(buttons).toEqual(['Save', 'Cancel']);
    // A column without an editCell keeps showing its resting value.
    expect(rowEl(h, 'c1').querySelector('[data-key="courses"] .mtable__cell')?.textContent).toBe('2');
    // And only the open row is editable.
    expect(nameInput(h, 'c2')).toBeNull();
});

test('THE PROPERTY: a list refresh under an open editor keeps the element, the focus and the draft', () => {
    const h = table();
    h.edit.begin('c1');

    const input = nameInput(h, 'c1')!;
    input.focus();
    input.value = 'Linköpings Golfkl';
    draft.set(input.value);
    expect(document.activeElement).toBe(input);

    // A poll, a sibling row's save, a refetch after a create: same keys, same
    // order, brand new objects. The framework table rebuilds every row here.
    h.rows.set([
        club({ id: 'c1', name: 'Linköpings GK', courses: 3 }),
        club({ id: 'c2', name: 'Vreta Kloster GK', courses: 1 }),
    ]);

    expect(nameInput(h, 'c1')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('Linköpings Golfkl');
    // …while the rest of the row DID take the new data.
    expect(rowEl(h, 'c1').querySelector('[data-key="courses"] .mtable__cell')?.textContent).toBe('3');
    // …and so did the untouched row.
    expect(rowEl(h, 'c2').querySelector('[data-key="courses"] .mtable__cell')?.textContent).toBe('1');
});

test('the same holds when the row is a stacked card', () => {
    const h = table({ narrow: new Signal(true) });
    h.edit.begin('c1');

    const input = nameInput(h, 'c1')!;
    input.focus();
    h.rows.set([club({ id: 'c1', name: 'Renamed elsewhere', courses: 9 }), club({ id: 'c2' })]);

    expect(nameInput(h, 'c1')).toBe(input);
    expect(document.activeElement).toBe(input);
});

test('leaving edit shows whatever arrived while the editor was open', () => {
    const h = table();
    h.edit.begin('c1');
    h.rows.set([club({ id: 'c1', name: 'Renamed elsewhere', courses: 2 }), club({ id: 'c2' })]);

    // Frozen while editing…
    expect(nameInput(h, 'c1')?.value).toBe('Linköpings GK');

    h.edit.cancel();

    // …and caught up the moment it closes.
    expect(rowEl(h, 'c1').querySelector('[data-key="name"] .mtable__cell')?.textContent).toBe(
        'Renamed elsewhere',
    );
});

test('Enter commits and Escape cancels, from anywhere in the row', () => {
    const h = table();
    h.edit.begin('c1');
    const input = nameInput(h, 'c1')!;

    press(input, 'Enter');
    expect(h.commits.map((c) => c.id)).toEqual(['c1']);
    // Committing is the screen's business — the table only reports the ask.
    expect(h.edit.isEditing('c1')).toBe(true);

    press(input, 'Escape');
    expect(h.edit.key.get()).toBeNull();
    expect(h.cancels.map((c) => c.id)).toEqual(['c1']);
    expect(nameInput(h, 'c1')).toBeNull();
});

test('Escape stops at the row, so backing out of a cell never closes the shell drawer', () => {
    const h = table();
    h.edit.begin('c1');

    let reachedDocument = false;
    const listener = (): void => {
        reachedDocument = true;
    };
    document.addEventListener('keydown', listener);
    press(nameInput(h, 'c1')!, 'Escape');
    document.removeEventListener('keydown', listener);

    expect(reachedDocument).toBe(false);
});

test('the Save and Cancel buttons do what the keys do', () => {
    const h = table();
    h.edit.begin('c1');
    const buttons = [...rowEl(h, 'c1').querySelectorAll('button')];

    buttons[0]!.click();
    expect(h.commits.map((c) => c.id)).toEqual(['c1']);

    buttons[1]!.click();
    expect(h.edit.key.get()).toBeNull();
    expect(h.cancels.map((c) => c.id)).toEqual(['c1']);
});

test('a save in flight locks the row and says so in words', async () => {
    const h = table();
    h.edit.begin('c1');
    const input = nameInput(h, 'c1')!;

    let release: (() => void) | null = null;
    const inFlight = h.edit.commit(
        () => new Promise<{ ok: true }>((resolve) => { release = () => resolve({ ok: true }); }),
    );

    const row = rowEl(h, 'c1');
    expect(row.getAttribute('aria-busy')).toBe('true');
    expect(row.querySelector('.mtable__status')?.textContent).toBe('Saving…');
    const [save, cancel] = [...row.querySelectorAll('button')];
    expect(save!.disabled).toBe(true);
    expect(cancel!.disabled).toBe(true);
    // The editor itself is untouched — no rebuild, no lost caret.
    expect(nameInput(h, 'c1')).toBe(input);

    // Enter mid-flight must not fire a second commit.
    press(input, 'Enter');
    expect(h.commits.length).toBe(0);

    release!();
    await inFlight;

    expect(row.hasAttribute('aria-busy')).toBe(false);
    expect(nameInput(h, 'c1')).toBeNull();
});

test('a rejected save shows the message ON the row and leaves the draft alone', async () => {
    const h = table();
    h.edit.begin('c1');
    const input = nameInput(h, 'c1')!;
    input.value = 'Duplicate name';
    draft.set(input.value);

    await h.edit.commit(async () => ({
        ok: false,
        message: 'A club with that name already exists. Pick another name.',
    }));

    const status = rowEl(h, 'c1').querySelector('.mtable__status')!;
    expect(status.textContent).toBe('A club with that name already exists. Pick another name.');
    expect(status.className).toContain('mtable__status--error');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(nameInput(h, 'c1')).toBe(input);
    expect(input.value).toBe('Duplicate name');
    // The neighbouring row shows nothing.
    expect(rowEl(h, 'c2').querySelector('.mtable__status')?.hasAttribute('hidden')).toBe(true);

    // Retrying clears it.
    await h.edit.commit(async () => ({ ok: true }));
    expect(rowEl(h, 'c1').querySelector('.mtable__status')?.hasAttribute('hidden')).toBe(true);
});

test("entering edit hands focus to the row's first control", async () => {
    const h = table();
    h.edit.begin('c1');
    await flush();

    expect(document.activeElement).toBe(nameInput(h, 'c1')!);
});
