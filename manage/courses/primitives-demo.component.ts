import { Component, Signal, template } from '@basics/core/client/core';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { t } from '../theme';
import { s, btn } from '../css';
import { ManageTableComponent, actionButton, type ManageColumn } from '../ui/table.component';
import { RowEditController } from '../ui/row-edit';
import { closeOnEscape, destructiveConfirm } from '../ui/confirm';
import { fieldControl } from '../ui/recipes';

// ─── TEMPORARY (T3) ────────────────────────────────────────────────────────
// A fixture, not a feature: local rows in a signal, no API, no persistence. It
// exists so the shared table, the inline-edit row and the destructive confirm
// can be SEEN — at both widths and in both colour schemes — before the screens
// that use them exist.
//
// T4 (clubs) and T5 (courses) delete THIS FILE and the one line in
// `courses.component.ts` that spawns it. That is the whole removal.
// ───────────────────────────────────────────────────────────────────────────

type DemoClub = {
    id: string;
    name: string;
    location: string | null;
    courses: number;
};

const DEMO_CLUBS: DemoClub[] = [
    { id: 'lgk', name: 'Linköpings GK', location: 'Linköping', courses: 2 },
    { id: 'vkg', name: 'Vreta Kloster GK', location: 'Ljungsbro', courses: 1 },
    { id: 'sig', name: 'Sweden Indoor Golf', location: null, courses: 4 },
];

/** How long the delayed refresh waits — long enough to click back into a cell. */
const DELAYED_REFRESH_MS = 3000;

const tpl = template(`
    <div class="mdemo">
        <p class="mdemo__title">Primitives preview — temporary, replaced in M1</p>
        <p class="mdemo__lead">
            Nothing here is saved anywhere. Edit a row, then refresh the list while the editor is
            open: the row is reused rather than rebuilt, so your half-typed value survives.
            <b>Refresh now</b> moves focus to the button itself — that is the click, not the table —
            so to see the caret survive, press <b>Refresh in 3 seconds</b>, click back into a field,
            and wait for it to land. Save a name of <b>fail</b> to see the per-row error.
        </p>
        <div class="mdemo__bar">
            <button bind="refresh" class="mdemo__btn" type="button">Refresh now</button>
            <button bind="refreshLater" class="mdemo__btn" type="button">Refresh in 3 seconds</button>
            <span bind="refreshNote" class="mdemo__note"></span>
        </div>
        <div bind="tableHost"></div>
        <div bind="confirmHost"></div>
    </div>
`);

export class PrimitivesDemoComponent extends Component {
    static styles = `
        .mdemo {
            display: flex;
            flex-direction: column;
            gap: ${t('manage-stack-gap')};
            margin-top: ${t('manage-section-gap')};

            & .mdemo__title {
                margin: 0;
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: ${t('text-muted')};
            }

            & .mdemo__lead {
                margin: 0;
                max-width: 60ch;
                color: ${t('text-muted')};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mdemo__bar {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: ${s('md')};
            }

            & .mdemo__btn {
                ${btn()}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('md')};
                font-size: 0.85rem;
                font-weight: 700;
            }

            & .mdemo__note {
                color: ${t('text-muted')};
                font-size: 0.8rem;
            }

            & .mdemo__input {
                ${fieldControl()}
                font-size: 0.85rem;
            }
        }
    `;

    private rows = new Signal<DemoClub[]>(DEMO_CLUBS);
    private edit = new RowEditController();
    private nameDraft = new Signal('');
    private locationDraft = new Signal('');
    private refreshes = new Signal(0);
    private pending = new Signal(false);
    private deleteOpen = new Signal(false);
    private deleteTarget = new Signal<DemoClub | null>(null);
    private timer: ReturnType<typeof setTimeout> | null = null;

    private columns: ManageColumn<DemoClub>[] = [
        {
            key: 'name',
            header: 'Name',
            stackedLabel: false,
            cell: (row) => row.name,
            editCell: (row) => this.textInput('Club name', this.nameDraft, row.name),
        },
        {
            key: 'location',
            header: 'Location',
            cell: (row) => row.location,
            editCell: (row) => this.textInput('Location', this.locationDraft, row.location ?? ''),
        },
        {
            key: 'courses',
            header: 'Courses',
            type: 'numeric',
            cell: (row) => row.courses,
        },
    ];

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            refresh: { onclick: () => this.simulateRefresh() },
            refreshLater: { onclick: () => this.scheduleRefresh() },
            refreshNote: () => {
                if (this.pending.get()) return 'Refreshing in a moment — click into a field.';
                const n = this.refreshes.get();
                return n === 0 ? 'The list has not refreshed yet.' : `Refreshed ${n} time(s).`;
            },
        });

        this.spawn(ManageTableComponent<DemoClub>, this.ref(frag, 'tableHost'), {
            columns: this.columns,
            rows: this.rows,
            rowKey: (row) => row.id,
            caption: 'Clubs (demo data)',
            empty: {
                heading: 'No clubs left',
                body: 'Everything in this preview is local — reload the page to get the fixture back.',
            },
            actions: (row) => this.rowActions(row),
            edit: {
                controller: this.edit,
                oncommit: (row) => this.save(row),
                oncancel: () => this.clearDrafts(),
            },
        });

        this.spawn(
            ConfirmComponent,
            this.ref(frag, 'confirmHost'),
            destructiveConfirm({
                open: this.deleteOpen,
                title: 'Delete this club?',
                consequence: () => {
                    const target = this.deleteTarget.get();
                    const name = target ? target.name : 'This club';
                    const courses = target ? target.courses : 0;
                    return `${name} and its ${courses} course(s) disappear from the catalog. Nothing in this preview is really saved.`;
                },
                confirmLabel: 'Delete club',
                onconfirm: () => this.remove(),
            }),
        );
        this.track(closeOnEscape(this.deleteOpen));
        this.track(() => this.clearTimer());

        return frag;
    }

    private textInput(label: string, draft: Signal<string>, seed: string): HTMLElement {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'mdemo__input';
        input.setAttribute('aria-label', label);
        input.value = seed;
        draft.set(seed);
        input.addEventListener('input', () => draft.set(input.value));
        return input;
    }

    private rowActions(row: DemoClub): HTMLElement[] {
        return [
            actionButton('Edit', { onclick: () => this.edit.begin(row.id) }),
            actionButton('Delete', {
                onclick: () => {
                    this.deleteTarget.set(row);
                    this.deleteOpen.set(true);
                },
            }),
        ];
    }

    private save(row: DemoClub): void {
        const name = this.nameDraft.get().trim();
        if (!name) {
            this.edit.fail('A club needs a name. Enter one before saving.');
            return;
        }
        const location = this.locationDraft.get().trim();
        void this.edit.commit(async () => {
            // A visible in-flight moment, so the busy state is not a blink.
            await new Promise((resolve) => setTimeout(resolve, 700));
            if (name.toLowerCase() === 'fail') {
                // Deliberately long: a real server message is a sentence, and
                // the row error must wrap inside the actions cell rather than
                // widen the column (see `.mtable__status` in the wide arm).
                return {
                    ok: false,
                    message:
                        'The server rejected that name: a club called “fail” already exists in this region, and club names have to be unique.',
                };
            }
            this.rows.update((list) =>
                list.map((r) => (r.id === row.id ? { ...r, name, location: location || null } : r)),
            );
            this.clearDrafts();
            return { ok: true };
        });
    }

    private remove(): void {
        const target = this.deleteTarget.get();
        if (!target) return;
        this.rows.update((list) => list.filter((r) => r.id !== target.id));
        this.deleteTarget.set(null);
    }

    /**
     * Stands in for a poll or a refetch: same rows, same order, brand new
     * objects. An open editor must not notice.
     */
    private simulateRefresh(): void {
        this.rows.update((list) => list.map((r) => ({ ...r, courses: r.courses + 1 })));
        this.refreshes.update((n) => n + 1);
    }

    /**
     * The same refresh, but arriving on its own — which is the case the caret
     * claim is actually about. A click hands focus to the button; a poll does
     * not, and the caret has to still be in the cell when the rows change under
     * it.
     */
    private scheduleRefresh(): void {
        this.clearTimer();
        this.pending.set(true);
        this.timer = setTimeout(() => {
            this.timer = null;
            this.pending.set(false);
            this.simulateRefresh();
        }, DELAYED_REFRESH_MS);
    }

    private clearTimer(): void {
        if (this.timer === null) return;
        clearTimeout(this.timer);
        this.timer = null;
    }

    private clearDrafts(): void {
        this.nameDraft.set('');
        this.locationDraft.set('');
    }
}
