import { Component, effect, Signal, untrack, type Readable } from '@basics/core/client/core';
import { EmptyStateComponent, type EmptyStateProps } from '@basics/core/client/ui/empty-state';
import { t } from '../theme';
import { s, btn } from '../css';
import { TABLE_MEDIA_NARROW, mediaSignal } from '../breakpoint';
import type { RowEditController } from './row-edit';

/*
 * The Manage workhorse: one list rendered as REAL COLUMNS above the table
 * breakpoint and as STACKED CARDS below it (spec §2.5). Clubs, courses, tees,
 * and later competitions, all use this; none of them re-decide what a header
 * row looks like.
 *
 * ── Why this is app-local and not a wrapper around the framework table ──
 *
 * `@basics/core/client/ui/table.ts` is a fine READ-ONLY table and screens that
 * only display rows should use it directly — that escape hatch is real, take
 * it. What it cannot do is the reason this file exists:
 *
 *  - its `buildRows()` clears `<tbody>` and rebuilds every row on each emit of
 *    the rows `Readable`. An inline editor is an `<input>` with a caret in it;
 *    a list refresh — a poll, a sibling row's save, a refetch after a create —
 *    destroys that input and the user loses the caret, the selection, and on a
 *    phone the keyboard. That is not a styling difference, it is the feature.
 *  - it has no row-state vocabulary at all: no editing variant, no per-row busy
 *    or error, no place for row actions.
 *  - its styles read framework tokens, so a Manage table built on it could only
 *    reach the `--manage-table-*` vocabulary by overriding framework-internal
 *    BEM classes from outside — which turns every framework upgrade into a
 *    silent visual risk.
 *
 * What IS lifted from it, deliberately and with the same reasoning, is the
 * accessibility work: the explicit `role="table" | "rowgroup" | "row" |
 * "columnheader" | "cell"` re-assertion (implicit table semantics are dropped
 * under `display: block`, which is exactly what stacking does), the
 * `aria-labelledby` caption wiring (a `<caption>` stops naming its table once
 * the role is explicit), the visually-hidden head in stacked mode, and the
 * overflow-x wrapper so the page body never scrolls sideways.
 *
 * ── How a focused editor survives a refresh ──
 *
 * Two mechanisms, and both are load-bearing:
 *
 *  1. Rows are keyed (`$each` + `rowKey`), so a refresh REUSES the `<tr>` for a
 *     key it has already rendered instead of building a new one.
 *  2. Each cell's paint is its own effect, and which signal that effect
 *     subscribes to depends on the row's mode. In view mode it tracks the row's
 *     data, so new data repaints the cell. In EDIT mode it tracks only "which
 *     row is open" — the row data is read with `peek()` — so new data does not
 *     re-enter the effect and the editor the screen put in that cell is never
 *     torn down. The cell goes back to tracking data the moment editing ends,
 *     and repaints with whatever arrived meanwhile.
 *
 * The one case that still moves DOM is a refresh that REORDERS rows; the caveat
 * is written out on the `rows` prop, where a screen author meets it.
 */

export type ManageCellValue = string | number | HTMLElement | null | undefined;

/** `numeric` gets tabular figures so digits line up down the column. */
export type ManageColumnType = 'text' | 'numeric';

export type ManageRowContext = {
    /** The row's `rowKey`. What `RowEditController` is addressed with. */
    key: string;
};

export type ManageColumn<T> = {
    /** Stable identity, also the cell's `data-key`. */
    key: string;
    /** Column heading, and the label repeated beside the cell when stacked. */
    header: string;
    type?: ManageColumnType;
    /**
     * The resting cell. Return an element for rich content, a string or number
     * for text, or nullish/'' for "no value" — which renders the placeholder.
     */
    cell: (row: T, ctx: ManageRowContext) => ManageCellValue;
    /**
     * The cell while this row is being edited. Return the control; the screen
     * owns it and the draft behind it. Called ONCE per entry into edit mode —
     * see the focus note above — so seed it from `row` and never expect it to
     * re-run on new data.
     *
     * A column without an `editCell` keeps showing its resting cell while the
     * row is edited, which is what a read-only column (an id, a computed
     * total) should do.
     */
    editCell?: (row: T, ctx: ManageRowContext) => ManageCellValue;
    /** Repeat the header beside this cell when stacked. Default true; turn it
     *  off for the column that acts as the card's title. */
    stackedLabel?: boolean;
};

export type ManageTableEdit<T> = {
    controller: RowEditController;
    /**
     * The user asked to save — Save button, or Enter anywhere in the row. The
     * screen validates its draft and calls `controller.commit(...)`; the table
     * presents whatever comes back.
     */
    oncommit: (row: T) => void;
    /** The user backed out — Cancel button, or Escape. Drop the draft here. */
    oncancel?: (row: T) => void;
    saveLabel?: string;
    cancelLabel?: string;
    /** Shown on the row while a save is in flight. */
    savingLabel?: string;
    /**
     * Where the row's status line goes — `Saving…`, and the sentence a refused
     * save leaves behind. Default: the row's own action cell, beside the
     * buttons it belongs to, which is right in both arms of a table that
     * STACKS.
     *
     * Hand in an element to host them somewhere else. The case this exists for
     * is `stacked: false`: that table keeps its grid at every width and scrolls
     * it sideways inside this component's own box, so at 375px the action
     * column — and the refusal in it — starts PAST the box's right edge, and a
     * save refused by Enter leaves `scrollLeft` at 0. The reason for the
     * refusal is then a column of letter fragments, which is the one piece of
     * copy on the screen that must never be unreadable.
     *
     * The table still builds and styles the element (the BEM names stay in
     * here); the screen only decides where it lands, and should put it
     * full-width beneath the grid where no horizontal scrolling can reach it.
     * One `<p>` per row is created either way — the same count as today, in a
     * different parent — and each is removed with its row.
     *
     * Two things move to the screen along with it: the message should NAME its
     * row, since it no longer sits inside one, and the container should be
     * placed where a message appearing does not shift the grid under a finger.
     */
    statusHost?: HTMLElement;
    /** Move focus to the row's first control on entering edit. Default true. */
    autoFocus?: boolean;
};

export type ManageTableProps<T> = {
    columns: ManageColumn<T>[];
    /**
     * The list. Re-emitting it under an open editor is safe and expected — same
     * keys, same order, brand new objects is the poll/refetch case this table
     * exists for.
     *
     * The one case that still moves DOM is a refresh that REORDERS rows: `$each`
     * moves the `<tr>` to its new index, and moving a node blurs whatever is
     * focused inside it. Do not re-sort while a row is being edited — sort on
     * load, or hold the new order until the editor closes.
     */
    rows: T[] | Readable<T[]>;
    /**
     * Row identity. Required — it is what makes an open editor survive: a key
     * that has already been rendered REUSES its `<tr>` instead of getting a new
     * one built. It must be stable for the life of the row, so a server id —
     * never an array index, never a field the user is editing.
     */
    rowKey: (row: T) => string;
    /** Accessible name for the table. Required; hide it with `captionHidden`
     *  when the surrounding screen already carries the heading. */
    caption: string;
    captionHidden?: boolean;
    /** Placeholder for an empty cell. Defaults to an em dash. */
    emptyCell?: string;
    /**
     * What to show instead of the table when there are no rows. The framework's
     * empty state: a heading, at most two sentences, at most one action.
     * Omitting it renders the header alone, which reads as a loading table —
     * so supply it.
     */
    empty?: EmptyStateProps;
    /**
     * Per-row controls in the trailing column. Build them with `actionButton()`
     * and return one, or an array of them; the table puts them in its own action
     * bar, which is what keeps them side by side in the wide arm and full-width
     * across the card in the stacked one.
     *
     * Do not hand-roll `<button class="mtable__btn">` and do not wrap the
     * buttons in your own `.mtable__actions` div: those class names are internal
     * to this file, and a wrapper div is a flex item of the action bar, so the
     * buttons inside it never see the stacked full-width rule.
     */
    actions?: (row: T, ctx: ManageRowContext) => ManageCellValue | HTMLElement[];
    /**
     * Heading for the trailing column. Screen-reader only — it names the column
     * for assistive technology and is visually hidden, so word it as a name
     * ("Club actions") and not as a visible column title.
     */
    actionsHeader?: string;
    /** Opt in to inline editing. */
    edit?: ManageTableEdit<T>;
    /**
     * Stack into cards below the breakpoint. Default true. `false` keeps the
     * grid at every width and scrolls it inside its own box instead — the right
     * answer for a hole grid, where a stacked "Hole 1 … Hole 18" card list is
     * eighteen cards of two numbers.
     */
    stacked?: boolean;
    /**
     * "Are we narrow", injectable. Defaults to `matchMedia(TABLE_MEDIA_NARROW)`.
     * A test hands in a plain `Signal`; a screen embedding a table in an
     * already-narrow panel can hand in its own.
     */
    narrow?: Readable<boolean>;
};

const ACTIONS_KEY = '__actions';

export type ManageActionOptions = {
    /** `primary` is the affirmative one — Save, Create. At most one per row. */
    variant?: 'default' | 'primary';
    onclick?: (event: MouseEvent) => void;
};

/**
 * A row action button — the sanctioned way to fill the `actions` prop, and the
 * table's own Save/Cancel are built with it too.
 *
 * It exists so the BEM class names stay INSIDE this file. They are not
 * decoration: `.mtable__btn` is what the wide arm keeps on one line and what the
 * stacked arm stretches across the card. A screen that stamps the string itself
 * owns a contract it cannot see, and the next change to either arm misses it
 * silently.
 */
export function actionButton(label: string, options: ManageActionOptions = {}): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className =
        options.variant === 'primary' ? 'mtable__btn mtable__btn--primary' : 'mtable__btn';
    button.textContent = label;
    if (options.onclick) button.addEventListener('click', options.onclick);
    return button;
}

function isReadable<T>(v: unknown): v is Readable<T> {
    return typeof v === 'object' && v !== null && typeof (v as { get?: unknown }).get === 'function';
}

/** Replace a host's content with a cell value. */
function paint(host: HTMLElement, value: ManageCellValue, emptyCell: string): void {
    host.textContent = '';
    if (value instanceof HTMLElement) {
        host.appendChild(value);
        return;
    }
    if (value === null || value === undefined || value === '') {
        const dash = document.createElement('span');
        dash.className = 'mtable__empty-cell';
        dash.textContent = emptyCell;
        host.appendChild(dash);
        return;
    }
    host.appendChild(document.createTextNode(String(value)));
}

export class ManageTableComponent<T> extends Component<ManageTableProps<T>> {
    static styles = `
        /* Worded, muted or danger — never a spinner glyph and never an emoji
           (docs/design-guidelines.md §4).

           Top-level rather than nested under \`.mtable-wrap\`, because
           \`edit.statusHost\` lets a screen host this element outside the table's
           box. The table still owns the look wherever it lands. */
        .mtable__status {
            margin: ${s('xs')} 0 0;
            font-size: 0.8rem;
            line-height: 1.4;
            color: ${t('text-muted')};

            &[hidden] { display: none; }
            &.mtable__status--error { color: ${t('danger')}; font-weight: 600; }
        }

        .mtable-wrap {
            width: 100%;
            min-width: 0;

            & .mtable {
                width: 100%;
                border-collapse: collapse;
                /* Never the display serif in cells. */
                font-family: ${t('font-ui')};
                font-size: 0.875rem;
                line-height: 1.5;
                color: ${t('text')};

                /* The stacked arm sets display:block, which would otherwise
                   beat the UA's [hidden] rule and leave an empty grid showing
                   underneath the empty state. */
                &[hidden] { display: none; }
            }

            & .mtable__caption {
                /* Deliberately NOT display:block. A block child of a table gets
                   wrapped in an anonymous row group, and a table-header-group
                   always paints above every row group — so a block caption
                   lands UNDER the header row however early it sits in the DOM.
                   table-caption + caption-side keeps it on top. */
                caption-side: top;
                text-align: left;
                font-family: ${t('font-display')};
                font-size: 1.05rem;
                font-weight: 600;
                color: ${t('text')};
                padding: ${t('manage-table-cell-pad-y')} ${t('manage-table-cell-pad-x')} 0;
            }

            & .mtable__caption--hidden {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip-path: inset(50%);
                white-space: nowrap;
            }

            & .mtable__th {
                background: ${t('manage-table-header-bg')};
                color: ${t('manage-table-header-fg')};
                border-bottom: 1px solid ${t('manage-table-header-border')};
                padding: ${t('manage-table-header-pad-y')} ${t('manage-table-header-pad-x')};
                text-align: left;
                /* Overline treatment, same as the framework table's — a Manage
                   header and a framework header should not be two designs. */
                font-family: ${t('font-ui')};
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                white-space: nowrap;
            }

            /* Same treatment as .mtable__caption--hidden: off-screen for the
               eye, present for the accessibility tree. */
            & .mtable__th-label--hidden {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip-path: inset(50%);
                white-space: nowrap;
            }

            & .mtable__td {
                padding: ${t('manage-table-cell-pad-y')} ${t('manage-table-cell-pad-x')};
                border-bottom: 1px solid ${t('manage-table-row-border')};
                vertical-align: middle;
                text-align: left;
                transition: background ${t('dur-fast')} ${t('ease-standard')};
            }

            & .mtable__td--numeric {
                font-variant-numeric: tabular-nums;
                white-space: nowrap;
            }

            & .mtable__cell { min-width: 0; }
            & .mtable__empty-cell { color: ${t('text-muted')}; }

            & .mtable__stacked-label { display: none; }

            & .mtable__actions {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: ${s('sm')};
            }

            & .mtable__btn {
                ${btn()}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('md')};
                font-size: 0.85rem;
                font-weight: 700;
            }

            & .mtable__btn--primary {
                ${btn(undefined, 'primary')}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('md')};
                font-size: 0.85rem;
                font-weight: 700;
            }

            & .mtable__empty {
                &[hidden] { display: none; }
            }

            /* ─── Wide: a real grid inside its own scroll box ─── */

            &[data-layout='columns'] {
                background: ${t('manage-table-bg')};
                border: 1px solid ${t('manage-table-border')};
                border-radius: ${t('manage-table-radius')};
                /* The wrapper is the scroll container, so a table too wide for
                   the content column scrolls HERE and the page body never
                   scrolls sideways. It also clips the header fill to the
                   radius, which a border-collapsed table cannot do itself. */
                overflow-x: auto;

                & .mtable__tr:last-child .mtable__td { border-bottom: none; }

                & .mtable__tr:not(.mtable__tr--editing):hover > .mtable__td {
                    background: ${t('manage-table-row-hover-bg')};
                }

                & .mtable__tr--editing > .mtable__td {
                    background: ${t('manage-table-row-editing-bg')};
                }

                & .mtable__td--actions {
                    width: 1%;
                    white-space: nowrap;

                    /* width:1% resolves to min-content, and a wrapping flex row
                       reads that as "one button per line". Side by side is the
                       point of a row's action bar; the stacked arm, which has
                       the full card width, keeps the wrap. */
                    & .mtable__actions { flex-wrap: nowrap; justify-content: flex-end; }

                    /* The cell's nowrap is meant for the BUTTON row. A server
                       message is a sentence: it must wrap, and it must be
                       allowed to be narrower than itself — otherwise one long
                       error sets this column's width, squeezes the data columns
                       and puts the whole table into horizontal scroll. */
                    & .mtable__status {
                        white-space: normal;
                        max-width: 32ch;
                        margin-left: auto;
                        text-align: right;
                    }
                }
            }

            /* ─── Narrow: one card per row ─── */

            &[data-layout='stacked'] {
                & .mtable,
                & .mtable__body,
                & .mtable__tr,
                & .mtable__td {
                    display: block;
                    width: 100%;
                }

                /* No thead to lose to here — the head is off-screen — so the
                   caption can be an ordinary block at the top of the stack. */
                & .mtable__caption:not(.mtable__caption--hidden) {
                    display: block;
                    padding: 0 0 ${s('sm')};
                }

                /* The head stays in the DOM — role="rowgroup" and the column
                   headers with it — but off-screen: every cell now carries its
                   own visible label, and a card of bare headings on top of the
                   list means nothing. */
                & .mtable__head {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip-path: inset(50%);
                    white-space: nowrap;
                }

                & .mtable__body {
                    display: flex;
                    flex-direction: column;
                    gap: ${t('manage-table-card-gap')};
                }

                & .mtable__tr {
                    background: ${t('manage-table-bg')};
                    border: 1px solid ${t('manage-table-border')};
                    border-radius: ${t('manage-table-radius')};
                    padding: ${t('manage-table-cell-pad-y')} ${t('manage-table-cell-pad-x')};
                }

                & .mtable__tr--editing {
                    background: ${t('manage-table-row-editing-bg')};
                }

                & .mtable__td {
                    padding: ${s('xs')} 0;
                    border-bottom: none;
                    white-space: normal;
                }

                & .mtable__stacked-label {
                    display: block;
                    font-family: ${t('font-ui')};
                    font-size: 0.6875rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.14em;
                    color: ${t('manage-table-header-fg')};
                    margin-bottom: 2px;
                }

                & .mtable__td--actions {
                    padding-top: ${t('manage-table-cell-pad-y')};

                    /* Direct children of the action bar, which is why the
                       actions prop takes buttons (or an array of them) and not
                       a wrapper element: a wrapper would be the flex item, and
                       the buttons inside it would keep their content width. */
                    & > .mtable__actions > .mtable__btn { flex: 1 1 auto; }
                }

                & .mtable__empty {
                    background: ${t('manage-table-bg')};
                    border: 1px solid ${t('manage-table-border')};
                    border-radius: ${t('manage-table-radius')};
                }
            }
        }
    `;

    /** Unique per document — the caption id is referenced by aria-labelledby. */
    private static seq = 0;
    private uid = `mtable-${ManageTableComponent.seq++}`;

    /**
     * One signal per row key, holding the latest data for that row. This is the
     * seam the whole focus-survival property hangs on: it lets a cell CHOOSE
     * whether to subscribe to its row's data (view) or not (edit), which a
     * plain `T` handed to a renderer could never express.
     */
    private readonly rowData = new Map<string, Signal<T>>();

    render(): HTMLElement {
        const wrap = document.createElement('div');
        wrap.className = 'mtable-wrap';

        const table = document.createElement('table');
        table.className = 'mtable';
        // Explicit roles: the stacked arm makes these elements display:block,
        // which drops their implicit table semantics in several engines.
        table.setAttribute('role', 'table');

        const caption = document.createElement('caption');
        caption.className = this.props.captionHidden
            ? 'mtable__caption mtable__caption--hidden'
            : 'mtable__caption';
        caption.id = `${this.uid}-caption`;
        caption.textContent = this.props.caption;
        table.appendChild(caption);
        // A <caption> names its table through native table semantics only, and
        // role="table" replaces those. The roles restore the structure but not
        // the name, so the name is wired by hand.
        table.setAttribute('aria-labelledby', caption.id);

        table.appendChild(this.head());

        const body = document.createElement('tbody');
        body.className = 'mtable__body';
        body.setAttribute('role', 'rowgroup');
        table.appendChild(body);

        wrap.appendChild(table);

        this.$each(
            body,
            () => this.readRows(),
            (row, _index, track) => this.renderRow(row, track),
            (row) => this.props.rowKey(row),
        );

        if (this.props.empty) {
            const host = document.createElement('div');
            host.className = 'mtable__empty';
            this.spawn(EmptyStateComponent, host, this.props.empty);
            wrap.appendChild(host);
            this.track(effect(() => {
                const empty = this.rowsValue().length === 0;
                host.hidden = !empty;
                table.hidden = empty;
            }));
        }

        this.layout(wrap);
        return wrap;
    }

    /** Wide or stacked, as a DOM attribute so CSS and tests read one answer. */
    private layout(wrap: HTMLElement): void {
        let narrow = this.props.narrow;
        if (!narrow) {
            const media = mediaSignal(TABLE_MEDIA_NARROW);
            this.track(media.dispose);
            narrow = media.value;
        }
        const stacks = this.props.stacked !== false;
        this.track(effect(() => {
            wrap.setAttribute('data-layout', stacks && narrow.get() ? 'stacked' : 'columns');
        }));
    }

    private head(): HTMLElement {
        const head = document.createElement('thead');
        head.className = 'mtable__head';
        head.setAttribute('role', 'rowgroup');

        const row = document.createElement('tr');
        row.className = 'mtable__tr';
        row.setAttribute('role', 'row');

        for (const col of this.props.columns) {
            row.appendChild(this.th(col.key, col.header));
        }
        if (this.hasActionsColumn()) {
            row.appendChild(this.th(ACTIONS_KEY, this.props.actionsHeader ?? 'Actions', true));
        }

        head.appendChild(row);
        return head;
    }

    /**
     * `hiddenLabel` hides the TEXT, not the cell. The actions column's heading
     * is documented screen-reader-only and has to stay a `columnheader` — it is
     * what names the cell an assistive technology lands on when it arrows into
     * the row's buttons — but printing "Club actions" in the overline strip
     * above a pair of buttons is a label for something that already says what it
     * is, and it sets a minimum width on a column meant to hug its content.
     *
     * The standard visually-hidden span, so the `<th>` keeps its fill and its
     * bottom rule and the header strip stays unbroken across the table.
     */
    private th(key: string, header: string, hiddenLabel = false): HTMLElement {
        const th = document.createElement('th');
        th.className = 'mtable__th';
        th.setAttribute('role', 'columnheader');
        th.setAttribute('scope', 'col');
        th.setAttribute('data-key', key);
        if (hiddenLabel) {
            const label = document.createElement('span');
            label.className = 'mtable__th-label--hidden';
            label.textContent = header;
            th.appendChild(label);
        } else {
            th.textContent = header;
        }
        return th;
    }

    private hasActionsColumn(): boolean {
        return this.props.actions !== undefined || this.props.edit !== undefined;
    }

    private rowsValue(): T[] {
        return isReadable<T[]>(this.props.rows) ? this.props.rows.get() : this.props.rows;
    }

    /**
     * The list `$each` iterates, with the per-row signals brought up to date on
     * the way past. Reading the rows is TRACKED (it is what drives the list);
     * the fan-out into row signals is not, so a row's own repaint never
     * re-enters the list effect.
     */
    private readRows(): T[] {
        const list = this.rowsValue();
        untrack(() => {
            const live = new Set<string>();
            for (const row of list) {
                const key = this.props.rowKey(row);
                live.add(key);
                const existing = this.rowData.get(key);
                if (existing) existing.set(row);
                else this.rowData.set(key, new Signal(row));
            }
            for (const key of [...this.rowData.keys()]) {
                if (!live.has(key)) this.rowData.delete(key);
            }
        });
        return list;
    }

    private signalFor(row: T): Signal<T> {
        const key = this.props.rowKey(row);
        let sig = this.rowData.get(key);
        if (!sig) {
            sig = new Signal(row);
            this.rowData.set(key, sig);
        }
        return sig;
    }

    private renderRow(row: T, track: (dispose: () => void) => void): HTMLElement {
        const key = this.props.rowKey(row);
        const ctx: ManageRowContext = { key };
        const data = this.signalFor(row);
        const edit = this.props.edit;
        const emptyCell = this.props.emptyCell ?? '—';
        /** True when THIS row is the open editor. The only signal an edit-mode
         *  cell is allowed to track. */
        const editingHere = (): boolean => (edit ? edit.controller.key.get() === key : false);

        const tr = document.createElement('tr');
        tr.className = 'mtable__tr';
        tr.setAttribute('role', 'row');
        tr.setAttribute('data-row-key', key);

        for (const col of this.props.columns) {
            const td = document.createElement('td');
            td.className = `mtable__td mtable__td--${col.type ?? 'text'}`;
            td.setAttribute('role', 'cell');
            td.setAttribute('data-key', col.key);

            if (col.stackedLabel !== false) {
                const label = document.createElement('span');
                label.className = 'mtable__stacked-label';
                // The column header is already announced through
                // role="columnheader"; this is the visual repeat only.
                label.setAttribute('aria-hidden', 'true');
                label.textContent = col.header;
                td.appendChild(label);
            }

            const host = document.createElement('div');
            host.className = 'mtable__cell';
            td.appendChild(host);

            track(effect(() => {
                if (editingHere() && col.editCell) {
                    // `peek()` — not `get()`. Subscribing to the row's data here
                    // is exactly the bug this component exists to avoid: a
                    // refresh would re-run this effect, rebuild the control, and
                    // take the caret with it.
                    const current = data.peek();
                    paint(host, untrack(() => col.editCell!(current, ctx)), emptyCell);
                } else {
                    const current = data.get();
                    paint(host, untrack(() => col.cell(current, ctx)), emptyCell);
                }
            }));

            tr.appendChild(td);
        }

        if (this.hasActionsColumn()) {
            tr.appendChild(this.actionsCell(ctx, data, editingHere, track));
        }

        if (edit) {
            track(effect(() => {
                tr.classList.toggle('mtable__tr--editing', editingHere());
            }));
            track(effect(() => {
                if (edit.controller.isSaving(key)) tr.setAttribute('aria-busy', 'true');
                else tr.removeAttribute('aria-busy');
            }));
            this.editKeys(tr, key, data, track);
            if (edit.autoFocus !== false) this.autoFocus(tr, editingHere, track);
        }

        return tr;
    }

    private actionsCell(
        ctx: ManageRowContext,
        data: Signal<T>,
        editingHere: () => boolean,
        track: (dispose: () => void) => void,
    ): HTMLElement {
        const edit = this.props.edit;
        const td = document.createElement('td');
        td.className = 'mtable__td mtable__td--actions';
        td.setAttribute('role', 'cell');
        td.setAttribute('data-key', ACTIONS_KEY);

        const bar = document.createElement('div');
        bar.className = 'mtable__actions';
        td.appendChild(bar);

        // Save and Cancel are built ONCE and re-appended, so the effect that
        // disables Save mid-save never has to rebuild the button it disables.
        let saveBtn: HTMLButtonElement | null = null;
        let cancelBtn: HTMLButtonElement | null = null;
        if (edit) {
            saveBtn = actionButton(edit.saveLabel ?? 'Save', {
                variant: 'primary',
                onclick: () => edit.oncommit(data.peek()),
            });
            cancelBtn = actionButton(edit.cancelLabel ?? 'Cancel', {
                onclick: () => {
                    edit.controller.cancel();
                    edit.oncancel?.(data.peek());
                },
            });

            track(effect(() => {
                const saving = edit.controller.isSaving(ctx.key);
                saveBtn!.disabled = saving;
                cancelBtn!.disabled = saving;
            }));

            const status = document.createElement('p');
            status.className = 'mtable__status';
            // Polite, not assertive: a failed save is news, not an emergency,
            // and the row it belongs to is already under the user's cursor.
            status.setAttribute('role', 'status');
            status.setAttribute('aria-live', 'polite');
            (edit.statusHost ?? td).appendChild(status);
            // The cell is discarded with its row; an external host is not, so
            // the element has to be taken back explicitly or a row that leaves
            // the table would leave its status line behind.
            track(() => status.remove());

            track(effect(() => {
                const message = edit.controller.errorFor(ctx.key);
                const saving = edit.controller.isSaving(ctx.key);
                status.textContent = message ?? (saving ? edit.savingLabel ?? 'Saving…' : '');
                status.className = message ? 'mtable__status mtable__status--error' : 'mtable__status';
                status.hidden = !message && !saving;
                // A hosted status line can sit far from the row it speaks for —
                // the holes grid puts it below all eighteen rows so it stays
                // readable at 375px. A refusal that lands below the fold reads
                // as "Save did nothing", so bring it into view. `nearest` is a
                // no-op when it is already on screen, and only a REFUSAL earns
                // the scroll; the "Saving…" hint is not worth moving the page.
                if (message && typeof status.scrollIntoView === 'function') {
                    status.scrollIntoView({ block: 'nearest' });
                }
            }));
        }

        track(effect(() => {
            if (editingHere() && edit) {
                bar.textContent = '';
                bar.append(saveBtn!, cancelBtn!);
                return;
            }
            const current = data.get();
            const rendered = untrack(() => this.props.actions?.(current, ctx));
            bar.textContent = '';
            if (Array.isArray(rendered)) bar.append(...rendered);
            else if (rendered instanceof HTMLElement) bar.appendChild(rendered);
            else if (rendered !== null && rendered !== undefined && rendered !== '') {
                bar.appendChild(document.createTextNode(String(rendered)));
            }
        }));

        return td;
    }

    /**
     * Enter commits, Escape cancels — the two keys every inline editor in every
     * catalog tool has bound since spreadsheets, and the reason the pattern is
     * here rather than in each screen.
     */
    private editKeys(
        tr: HTMLElement,
        key: string,
        data: Signal<T>,
        track: (dispose: () => void) => void,
    ): void {
        const edit = this.props.edit!;
        const onKey = (e: KeyboardEvent): void => {
            if (edit.controller.key.peek() !== key) return;

            if (e.key === 'Enter') {
                // A textarea's Enter is a newline and stays one.
                if ((e.target as HTMLElement | null)?.tagName === 'TEXTAREA') return;
                e.preventDefault();
                if (edit.controller.phase.peek() === 'saving') return;
                edit.oncommit(data.peek());
                return;
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                // Stop here: the shell closes its drawer on a document-level
                // Escape, and backing out of a cell must not also back out of
                // the navigation.
                e.stopPropagation();
                edit.controller.cancel();
                edit.oncancel?.(data.peek());
            }
        };
        tr.addEventListener('keydown', onKey);
        track(() => tr.removeEventListener('keydown', onKey));
    }

    /**
     * Entering edit puts the caret in the row's first control, text selected so
     * the next keystroke replaces the value — which is the whole speed argument
     * for a par/stroke-index grid.
     *
     * In a microtask rather than inline: this effect and the effects that PAINT
     * the controls subscribe to the same signal, and rather than depend on the
     * order they were registered in, the focus simply happens after the current
     * notification has drained and the cells exist for certain.
     */
    private autoFocus(
        tr: HTMLElement,
        editingHere: () => boolean,
        track: (dispose: () => void) => void,
    ): void {
        let was = false;
        let live = true;
        track(() => { live = false; });
        track(effect(() => {
            const editing = editingHere();
            if (editing && !was) {
                queueMicrotask(() => {
                    if (!live || !editingHere()) return;
                    const first = tr.querySelector<HTMLElement>(
                        'input:not([type="hidden"]), select, textarea',
                    );
                    if (!first) return;
                    first.focus();
                    if (first instanceof HTMLInputElement && typeof first.select === 'function') {
                        first.select();
                    }
                });
            }
            was = editing;
        }));
    }
}
