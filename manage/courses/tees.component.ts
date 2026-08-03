import { Component, Computed, Signal, effect, template } from '@basics/core/client/core';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { ManageTableComponent, actionButton, type ManageColumn } from '../ui/table.component';
import { RowEditController } from '../ui/row-edit';
import { closeOnEscape, destructiveConfirm } from '../ui/confirm';
import { CoursesService } from './courses.service';
import { TeesService } from './tees.service';
import { TeeFieldsComponent } from './tee-fields.component';
import type { Tee } from '../../src/api/tees.gen';
import {
    DELETE_CONSEQUENCE_UNKNOWN,
    colourWord,
    deleteConsequence,
    draftFrom,
    emptyDraft,
    hasErrors,
    measuredHoles,
    ratedGendersLabel,
    swatchColour,
    totalLengthsLabel,
    validateTee,
    type TeeFieldErrors,
} from './tee-form';

/*
 * The tees of one course (spec §3.5). Not a page: a component with `clubId` and
 * `courseId` props, mounted into the course page's `teesHost`.
 *
 * ── Why create and edit are one panel, not inline table editing ──
 *
 * Same reasoning as the courses list, one size up. A tee is a name, a colour, an
 * eighteen-column lengths grid and two ratings blocks of four figures each —
 * there is no arrangement of table cells that holds that. The holes editor (T6)
 * edits inline because a hole IS two numbers; a tee is a small form, so it gets
 * the disclosure panel, driven by `RowEditController` so an in-flight save
 * cannot be re-fired and a REFUSED save keeps the panel open with the draft
 * intact.
 *
 * ── Why Delete is offered on a tee that may be undeletable ──
 *
 * A tee named by one of the course's tee-role mappings (§3.6) is refused by the
 * server with a 409 naming the mapping. The client does not pre-check it and
 * does not hide the control: that would be a second copy of a rule the server
 * owns, and it would drift the moment a new blocker appears. The refusal is
 * shown verbatim, never re-worded and never branched on by blocker kind.
 *
 * ── Where the hole count comes from ──
 *
 * The COURSE's, read from `CoursesService` — the same list the course page has
 * already loaded. The grid must show a row per hole the course has, including
 * the ones this tee has no length for: those empty cells are the statement that
 * the tee is incompletely measured, which is exactly what a tee editor is for.
 */

export type TeesProps = {
    clubId: string;
    courseId: string;
};

/**
 * A tee with the one figure from OUTSIDE the tee that its row needs: how many
 * holes the course has, so "9 measured" can say what it is out of.
 *
 * It is merged into the row rather than read inside the cell because
 * `ManageTableComponent` paints cells inside `untrack()` — a signal read in a
 * `cell()` never repaints, so a hole count that lands after the tees (which is
 * the ordinary case: two independent requests) would stay at zero forever.
 * Merging makes the ROW the thing that changes, which is what the table's keyed
 * per-row signal already reacts to.
 */
type TeeRow = Tee & { courseHoleCount: number };

/** The sentinel `RowEditController` key for the create panel. */
const CREATE_KEY = '__new';

const tpl = template(`
    <section class="mtees">
        <header class="mtees__head">
            <div class="mtees__heading">
                <h2 class="mtees__title">Tees</h2>
                <p class="mtees__lead">The tees this course is played from, with their hole lengths and ratings.</p>
            </div>
            <button bind="new" class="mtees__new" type="button">New tee</button>
        </header>

        <form bind="panel" class="mtees__panel">
            <h3 bind="panelTitle" class="mtees__panel-title"></h3>
            <div bind="fieldsHost"></div>
            <p bind="panelError" class="mtees__error" role="alert"></p>
            <div class="mtees__panel-actions">
                <button bind="submit" class="mtees__submit" type="submit"></button>
                <button bind="cancel" class="mtees__secondary" type="button">Cancel</button>
            </div>
        </form>

        <p bind="loadError" class="mtees__error" role="alert"></p>
        <button bind="retry" class="mtees__secondary" type="button">Try again</button>
        <p bind="deleteError" class="mtees__error" role="alert"></p>
        <p bind="loadingNote" class="mtees__note" role="status" aria-live="polite"></p>

        <div bind="tableHost"></div>
        <div bind="confirmHost"></div>
    </section>
`);

export class TeesComponent extends Component<TeesProps> {
    static styles = `
        .mtees {
            display: flex;
            flex-direction: column;
            gap: ${t('manage-stack-gap')};
            min-width: 0;

            & .mtees__head {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${s('md')};
            }

            & .mtees__heading {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }

            & .mtees__title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.35rem;
                font-weight: 600;
                color: ${t('text')};
            }

            & .mtees__lead {
                margin: 0;
                max-width: 60ch;
                color: ${t('text-muted')};
                font-size: 0.9rem;
                line-height: 1.5;
            }

            & .mtees__new {
                ${btn(undefined, 'primary')}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mtees__note {
                margin: 0;
                color: ${t('text-muted')};
                font-size: 0.8rem;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mtees__error {
                margin: 0;
                color: ${t('danger')};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mtees__panel {
                ${card({})}
                display: flex;
                flex-direction: column;
                gap: ${t('manage-stack-gap')};
                padding: ${t('manage-page-pad')};
                /* The lengths grid inside scrolls itself; without this the panel
                   takes its width from the grid's content and the PAGE scrolls
                   sideways instead. */
                min-width: 0;

                &[hidden] { display: none; }
            }

            & .mtees__panel-title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.1rem;
                font-weight: 600;
                color: ${t('text')};
            }

            & .mtees__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${s('sm')};
            }

            & .mtees__submit {
                ${btn(undefined, 'primary')}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mtees__secondary {
                ${btn()}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;

                &[hidden] { display: none; }
            }

            /* The colour cell: the WORD, with a swatch in front of it when the
               stored value is one we can paint. The swatch never appears alone —
               a colour named only by a colour is unreadable to anyone who cannot
               tell those two greens apart (docs/design-guidelines.md §4). */
            & .mtees__colour {
                display: inline-flex;
                align-items: center;
                gap: ${s('xs')};
            }

            & .mtees__swatch {
                flex: none;
                width: 0.85rem;
                height: 0.85rem;
                border-radius: ${t('radius-pill')};
                border: 1px solid ${t('border-strong')};
            }

            & .mtees__muted { color: ${t('text-muted')}; }
        }
    `;

    private tees = this.inject(TeesService);
    private courses = this.inject(CoursesService);

    private editor = new RowEditController();
    private errors = new Signal<TeeFieldErrors>({});

    private deleteOpen = new Signal(false);
    private deleteTarget = new Signal<Tee | null>(null);
    private deleteFailure = new Signal<string | null>(null);
    /**
     * The tee whose delete is in flight, or null. `ConfirmComponent` closes on
     * confirm, so without this the DELETE runs against a list that looks idle
     * and the user presses Delete again.
     */
    private deletingId = new Signal<string | null>(null);

    private fields: TeeFieldsComponent | null = null;

    /**
     * One live disposer per row key — see the same field in
     * `courses.component.ts`: the table builds row actions inside `untrack()`,
     * so an effect made there has to retire the one the previous build left.
     */
    private actionEffects = new Map<string, () => void>();

    /** The list the table binds to: the course's tees with its hole count on. */
    private rows = new Computed<TeeRow[]>(() => {
        const courseHoleCount = this.holeCount();
        return this.tees.tees.get().map((tee) => ({ ...tee, courseHoleCount }));
    });

    private columns: ManageColumn<TeeRow>[] = [
        { key: 'name', header: 'Name', stackedLabel: false, cell: (row) => row.name },
        { key: 'colour', header: 'Colour', cell: (row) => this.colourCell(row) },
        // "Rated for", not "Ratings": the question this column answers is which
        // genders may play off this tee, and the answer is words.
        { key: 'rated', header: 'Rated for', cell: (row) => ratedGendersLabel(row) },
        {
            key: 'length',
            header: 'Total length',
            cell: (row) => {
                const text = totalLengthsLabel(row);
                if (text !== '') return text;
                return this.muted('Not measured');
            },
        },
        {
            key: 'holes',
            header: 'Holes measured',
            type: 'numeric',
            // `n of N` rather than a bare count: on an eighteen-hole course, "9"
            // alone reads as fine until you know what it is out of.
            cell: (row) => `${measuredHoles(row)} of ${row.courseHoleCount}`,
        },
    ];

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            new: {
                disabled: () => this.editing() || this.deletingId.get() !== null,
                onclick: () => this.openCreate(),
            },

            panel: {
                hidden: () => !this.editing(),
                onsubmit: (e: Event) => {
                    e.preventDefault();
                    void this.submit();
                },
            },
            panelTitle: { textContent: () => this.panelTitle() },
            panelError: {
                textContent: () => this.panelError() ?? '',
                hidden: () => this.panelError() === null,
            },
            submit: {
                textContent: () => this.submitLabel(),
                disabled: () => this.saving(),
            },
            cancel: {
                disabled: () => this.saving(),
                onclick: () => this.closePanel(),
            },

            loadError: {
                textContent: () => this.tees.error.get() ?? '',
                hidden: () => this.tees.error.get() === null,
            },
            retry: {
                hidden: () => this.tees.error.get() === null,
                onclick: () => void this.tees.load(this.props.courseId, true),
            },
            deleteError: {
                textContent: () => this.deleteFailure.get() ?? '',
                hidden: () => this.deleteFailure.get() === null,
            },
            loadingNote: {
                textContent: 'Loading tees…',
                // Only before the first answer: a refetch after a write must not
                // blank the list out under the user.
                hidden: () => this.tees.loaded.get(),
            },
        });

        this.fields = this.spawn(TeeFieldsComponent, this.ref(frag, 'fieldsHost'), {
            idPrefix: 'manage-tee',
            errors: this.errors,
            busy: { get: () => this.saving() },
            holeCount: { get: () => this.holeCount() },
        });

        this.spawn(ManageTableComponent<TeeRow>, this.ref(frag, 'tableHost'), {
            columns: this.columns,
            rows: this.rows,
            rowKey: (row) => row.id,
            caption: 'Tees',
            captionHidden: true,
            actions: (row) => this.rowActions(row),
            actionsHeader: 'Tee actions',
            empty: {
                heading: 'No tees yet',
                body: 'Add the tees this course is played from, then give each one its hole lengths and ratings.',
                action: { label: 'New tee', onclick: () => this.openCreate() },
            },
        });

        this.spawn(
            ConfirmComponent,
            this.ref(frag, 'confirmHost'),
            destructiveConfirm({
                open: this.deleteOpen,
                title: () => {
                    const target = this.deleteTarget.get();
                    return target ? `Delete ${target.name}?` : 'Delete this tee?';
                },
                consequence: () => {
                    const target = this.deleteTarget.get();
                    return target ? deleteConsequence(target.name) : DELETE_CONSEQUENCE_UNKNOWN;
                },
                confirmLabel: 'Delete tee',
                onconfirm: () => void this.remove(),
                oncancel: () => this.deleteTarget.set(null),
            }),
        );
        this.track(closeOnEscape(this.deleteOpen, () => this.deleteTarget.set(null)));

        this.track(() => {
            for (const dispose of this.actionEffects.values()) dispose();
            this.actionEffects.clear();
        });

        return frag;
    }

    override onMount(): void {
        void this.tees.load(this.props.courseId);
        // Load-once and shared with the course page, so this costs nothing when
        // that page has already asked; on a cold deep link it is what supplies
        // the hole count the grid is built from.
        void this.courses.load(this.props.clubId);

        // Escape backs out of the panel, the same exit Cancel is. Not
        // `closeOnEscape` — that helper is the CONFIRM dialog's, and a second
        // document-level listener would close the panel underneath a delete
        // dialog that was meant to swallow the key.
        const onKey = (e: KeyboardEvent): void => {
            if (e.key !== 'Escape') return;
            if (this.deleteOpen.get() || !this.editing() || this.saving()) return;
            this.closePanel();
        };
        document.addEventListener('keydown', onKey);
        this.track(() => document.removeEventListener('keydown', onKey));
    }

    /** The COURSE's hole count — how many rows the lengths grid has. */
    private holeCount(): number {
        return this.courses.byId(this.props.courseId)?.holeCount ?? 0;
    }

    // ─── Panel state ───

    private editing(): boolean {
        return this.editor.key.get() !== null;
    }

    private creating(): boolean {
        return this.editor.key.get() === CREATE_KEY;
    }

    private saving(): boolean {
        const key = this.editor.key.get();
        return key !== null && this.editor.isSaving(key);
    }

    private panelTitle(): string {
        if (this.creating()) return 'New tee';
        const tee = this.openTee();
        return tee ? `Edit ${tee.name}` : 'Edit tee';
    }

    private submitLabel(): string {
        if (this.creating()) return this.saving() ? 'Creating…' : 'Create tee';
        return this.saving() ? 'Saving…' : 'Save tee';
    }

    private panelError(): string | null {
        const key = this.editor.key.get();
        return key === null ? null : this.editor.errorFor(key);
    }

    private openTee(): Tee | null {
        const key = this.editor.key.get();
        if (key === null || key === CREATE_KEY) return null;
        return this.tees.tees.get().find((tee) => tee.id === key) ?? null;
    }

    private openCreate(): void {
        if (this.saving()) return;
        this.errors.set({});
        this.editor.begin(CREATE_KEY);
        this.fields?.seed(emptyDraft(this.holeCount()));
        this.fields?.focusFirst();
    }

    private openEdit(tee: Tee): void {
        if (this.saving()) return;
        this.errors.set({});
        this.editor.begin(tee.id);
        this.fields?.seed(draftFrom(tee, this.holeCount()));
        this.fields?.focusFirst();
    }

    private closePanel(): void {
        this.editor.cancel();
        this.errors.set({});
    }

    private async submit(): Promise<void> {
        if (!this.fields || this.saving()) return;
        const key = this.editor.key.get();
        if (key === null) return;

        const draft = this.fields.current();
        const errors = validateTee(draft, this.holeCount());
        this.errors.set(errors);
        // Field-level complaints belong under their fields; the controller's
        // error line is reserved for what the SERVER said, so a rejected draft
        // does not produce the same sentence twice.
        if (hasErrors(errors)) {
            this.fields.focusInvalid(errors);
            return;
        }

        await this.editor.commit(() =>
            key === CREATE_KEY
                ? this.tees.create(this.props.courseId, this.props.clubId, draft)
                : this.tees.update(key, draft),
        );
    }

    // ─── Rows ───

    private colourCell(row: TeeRow): HTMLElement {
        if (row.colour === null || row.colour.trim() === '') return this.muted('Not set');

        const wrap = document.createElement('span');
        wrap.className = 'mtees__colour';

        const painted = swatchColour(row.colour);
        if (painted !== null) {
            const swatch = document.createElement('span');
            swatch.className = 'mtees__swatch';
            swatch.setAttribute('aria-hidden', 'true');
            swatch.style.backgroundColor = painted;
            wrap.appendChild(swatch);
        }

        // The WORD, not the stored text: nearly every row in this catalog holds
        // a hex, and "#ffd400" beside a tee named "Gul" is the swatch's
        // information repeated and the word's omitted. The stored value is not
        // lost — it is the cell's title, one hover or one long-press away — and
        // a value with no known word prints exactly as stored.
        const word = document.createElement('span');
        word.textContent = colourWord(row.colour);
        if (word.textContent !== row.colour.trim()) wrap.title = row.colour.trim();
        wrap.appendChild(word);
        return wrap;
    }

    private muted(text: string): HTMLElement {
        const span = document.createElement('span');
        span.className = 'mtees__muted';
        span.textContent = text;
        return span;
    }

    private rowActions(row: TeeRow): HTMLElement[] {
        const edit = actionButton('Edit', { onclick: () => this.openEdit(row) });
        const remove = actionButton('Delete', {
            onclick: () => {
                this.deleteFailure.set(null);
                this.deleteTarget.set(row);
                this.deleteOpen.set(true);
            },
        });

        // Retire the previous build's effect for this key before registering
        // this one — see `actionEffects`.
        this.actionEffects.get(row.id)?.();
        this.actionEffects.set(
            row.id,
            effect(() => {
                const deleting = this.deletingId.get();
                const busy = deleting !== null || this.editing();
                // Worded, never a spinner glyph (docs/design-guidelines.md §4).
                remove.textContent = deleting === row.id ? 'Deleting…' : 'Delete';
                // Every row goes inert, not just the one acted on: two deletes
                // in flight, or an edit panel open on another row, are not
                // states this screen has anything sensible to say about.
                remove.disabled = busy;
                edit.disabled = busy;
            }),
        );

        return [edit, remove];
    }

    private async remove(): Promise<void> {
        const target = this.deleteTarget.get();
        // Re-entry guard as well as a null guard — the dialog is gone by now,
        // but Enter on a still-focused row button is not.
        if (!target || this.deletingId.get() !== null) return;
        this.deleteFailure.set(null);
        this.deletingId.set(target.id);
        try {
            const outcome = await this.tees.remove(target.id, this.props.clubId);
            // A refusal has to land somewhere the user is looking, and the
            // dialog has closed itself by now — so it lands above the list,
            // carrying the TEE'S NAME, because the dialog that named it is gone
            // and the row is one of several. The server's sentence goes through
            // untouched.
            if (!outcome.ok) this.deleteFailure.set(`${target.name} — ${outcome.message}`);
        } finally {
            this.deletingId.set(null);
            this.deleteTarget.set(null);
        }
    }
}
