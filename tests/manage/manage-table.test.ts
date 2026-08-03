import { club, mount, type Club } from './harness';
import { afterEach, expect, test } from 'bun:test';
import { Signal } from '@basics/core/client/core';
import { ManageTableComponent, type ManageColumn } from '../../manage/ui/table.component';

// Structure, semantics and the wide↔stacked collapse of the shared Manage
// table. The stacked arm is exercised for real: the component takes its "are we
// narrow" answer as a signal (default `matchMedia`), so a test drives the
// collapse without a layout engine.

const columns: ManageColumn<Club>[] = [
    { key: 'name', header: 'Name', cell: (row) => row.name, stackedLabel: false },
    { key: 'location', header: 'Location', cell: (row) => row.location },
    { key: 'courses', header: 'Courses', type: 'numeric', cell: (row) => row.courses },
];

let open: { destroy(): void } | null = null;
afterEach(() => {
    open?.destroy();
    open = null;
});

function table(props: Partial<ConstructorParameters<typeof ManageTableComponent<Club>>[0]> = {}) {
    const rows = new Signal<Club[]>([
        club({ id: 'c1', name: 'Linköpings GK' }),
        club({ id: 'c2', name: 'Vreta Kloster GK', location: null, courses: 1 }),
    ]);
    const mounted = mount(
        new ManageTableComponent<Club>({
            columns,
            rows,
            rowKey: (row) => row.id,
            caption: 'Clubs',
            ...props,
        }),
    );
    open = mounted;
    return { ...mounted, rows };
}

test('the table re-asserts its roles, because stacking drops the implicit ones', () => {
    const { host } = table();

    expect(host.querySelector('table')?.getAttribute('role')).toBe('table');
    expect(host.querySelectorAll('[role="rowgroup"]').length).toBe(2);
    expect(host.querySelectorAll('thead [role="columnheader"]').length).toBe(3);
    expect(host.querySelectorAll('tbody [role="row"]').length).toBe(2);
    expect(host.querySelectorAll('tbody [role="cell"]').length).toBe(6);
});

test('the caption names the table through aria-labelledby, not through <caption>', () => {
    // Setting role="table" replaces the native semantics a <caption> works
    // through, so the name has to be wired by hand or the table goes unlabelled.
    const { host } = table();
    const el = host.querySelector('table')!;
    const caption = host.querySelector('caption')!;

    expect(caption.textContent).toBe('Clubs');
    expect(caption.id).not.toBe('');
    expect(el.getAttribute('aria-labelledby')).toBe(caption.id);
});

test('a hidden caption still names the table', () => {
    const { host } = table({ captionHidden: true });
    const caption = host.querySelector('caption')!;

    expect(caption.className).toContain('mtable__caption--hidden');
    expect(host.querySelector('table')?.getAttribute('aria-labelledby')).toBe(caption.id);
});

test('cells render values, and a missing value renders the placeholder', () => {
    const { host } = table();
    const second = host.querySelector('[data-row-key="c2"]')!;

    expect(second.querySelector('[data-key="name"]')?.textContent).toBe('Vreta Kloster GK');
    expect(second.querySelector('[data-key="location"] .mtable__empty-cell')?.textContent).toBe('—');
    expect(second.querySelector('[data-key="courses"]')?.className).toContain('mtable__td--numeric');
});

test('every cell carries its stacked label, except the one acting as the title', () => {
    const { host } = table();
    const first = host.querySelector('[data-row-key="c1"]')!;

    expect(first.querySelector('[data-key="name"] .mtable__stacked-label')).toBeNull();
    const label = first.querySelector('[data-key="location"] .mtable__stacked-label')!;
    expect(label.textContent).toBe('Location');
    // The header is already announced through role="columnheader"; the repeat
    // is visual only and must not double up in a screen reader.
    expect(label.getAttribute('aria-hidden')).toBe('true');
});

test('the narrow signal flips the layout, and flips it back', () => {
    const narrow = new Signal(false);
    const { host } = table({ narrow });
    const wrap = host.querySelector('.mtable-wrap')!;

    expect(wrap.getAttribute('data-layout')).toBe('columns');

    narrow.set(true);
    expect(wrap.getAttribute('data-layout')).toBe('stacked');
    // The head stays in the DOM at both widths — it is only moved off-screen —
    // so the column headers keep naming the cells.
    expect(host.querySelector('thead')?.getAttribute('role')).toBe('rowgroup');
    expect(host.querySelectorAll('[role="columnheader"]').length).toBe(3);

    narrow.set(false);
    expect(wrap.getAttribute('data-layout')).toBe('columns');
});

test('stacked:false never stacks — a hole grid scrolls instead of becoming 18 cards', () => {
    const narrow = new Signal(true);
    const { host } = table({ narrow, stacked: false });

    expect(host.querySelector('.mtable-wrap')?.getAttribute('data-layout')).toBe('columns');
});

test('an empty list shows the empty state instead of a header that looks like loading', () => {
    const narrow = new Signal(false);
    const { host, rows } = table({
        narrow,
        empty: { heading: 'No clubs yet', body: 'Create the first club to add courses to it.' },
    });

    rows.set([]);
    expect(host.querySelector('table')?.hasAttribute('hidden')).toBe(true);
    const empty = host.querySelector('.mtable__empty')!;
    expect(empty.hasAttribute('hidden')).toBe(false);
    expect(empty.textContent).toContain('No clubs yet');

    rows.set([club({ id: 'c9', name: 'Landeryd' })]);
    expect(host.querySelector('table')?.hasAttribute('hidden')).toBe(false);
    expect(empty.hasAttribute('hidden')).toBe(true);
});

test('a refresh repaints rows in place — same <tr>, new values', () => {
    const { host, rows } = table();
    const before = host.querySelector('[data-row-key="c1"]')!;

    rows.set([
        club({ id: 'c1', name: 'Linköpings Golfklubb', location: 'Vreta' }),
        club({ id: 'c2', name: 'Vreta Kloster GK', location: null, courses: 1 }),
    ]);

    const after = host.querySelector('[data-row-key="c1"]')!;
    expect(after).toBe(before);
    expect(after.querySelector('[data-key="name"] .mtable__cell')?.textContent).toBe(
        'Linköpings Golfklubb',
    );
    expect(after.querySelector('[data-key="location"] .mtable__cell')?.textContent).toBe('Vreta');
});

test('rows that leave the list leave the DOM', () => {
    const { host, rows } = table();
    rows.set([club({ id: 'c2', name: 'Vreta Kloster GK' })]);

    expect(host.querySelector('[data-row-key="c1"]')).toBeNull();
    expect(host.querySelectorAll('tbody [role="row"]').length).toBe(1);
});

test('the trailing actions column only exists when a screen asks for it', () => {
    const plain = table();
    expect(plain.host.querySelector('[data-key="__actions"]')).toBeNull();
    plain.destroy();
    open = null;

    const withActions = table({
        actions: (row) => {
            const button = document.createElement('button');
            button.textContent = `Edit ${row.name}`;
            return button;
        },
        actionsHeader: 'Row actions',
    });
    expect(withActions.host.querySelector('th[data-key="__actions"]')?.textContent).toBe(
        'Row actions',
    );
    expect(
        withActions.host.querySelector('[data-row-key="c1"] [data-key="__actions"] button')
            ?.textContent,
    ).toBe('Edit Linköpings GK');
});

test('the actions heading is a columnheader for AT and invisible to the eye', () => {
    // `actionsHeader` is documented screen-reader-only, so it must not print
    // "Row actions" in the overline strip above a pair of buttons — but it must
    // still name the column an assistive technology arrows into.
    const { host } = table({
        actions: () => document.createElement('button'),
        actionsHeader: 'Row actions',
    });

    const th = host.querySelector('th[data-key="__actions"]') as HTMLElement;
    expect(th.getAttribute('role')).toBe('columnheader');
    expect(th.getAttribute('scope')).toBe('col');
    // The name is still readable — it is the TEXT that is hidden, in a span, so
    // the cell keeps its fill and its bottom rule and the header strip stays
    // unbroken across the table.
    expect(th.textContent).toBe('Row actions');
    const label = th.querySelector('.mtable__th-label--hidden');
    expect(label?.textContent).toBe('Row actions');
    expect(ManageTableComponent.styles).toContain('.mtable__th-label--hidden');

    // A data column's heading is the visible thing it has always been.
    const nameTh = host.querySelector('th[data-key="name"]') as HTMLElement;
    expect(nameTh.querySelector('.mtable__th-label--hidden')).toBeNull();
    expect(nameTh.textContent).toBe('Name');
});

test('the styles are token-only — no literal colour anywhere in the sheet', () => {
    // The manage-table-* vocabulary is the single styling source (AGENTS.md:
    // tokens only, no hex).
    const styles = ManageTableComponent.styles;
    expect(styles).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(styles).not.toMatch(/\brgba?\(/);
    expect(styles).toContain('var(--manage-table-header-bg)');
    expect(styles).toContain('var(--manage-table-card-gap)');
    expect(styles).toContain('var(--manage-touch-target)');
});
