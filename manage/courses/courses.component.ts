import { Component, Router, Signal, effect, template } from '@basics/core/client/core';
import { BASE_PATH } from '@basics/core/client/base';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { ManageTableComponent, actionButton, type ManageColumn } from '../ui/table.component';
import { RowEditController } from '../ui/row-edit';
import { closeOnEscape, destructiveConfirm } from '../ui/confirm';
import { CoursesService, type CourseRow } from './courses.service';
import { CourseFieldsComponent } from './course-fields.component';
import {
    DELETE_CONSEQUENCE_UNKNOWN,
    deleteConsequence,
    draftFrom,
    emptyDraft,
    formatCoordinates,
    hasErrors,
    readinessLabel,
    readinessTone,
    validateCourse,
    type CourseFieldErrors,
} from './course-form';
import { coursePath } from './routes';

/*
 * The courses under one club (spec §3.3 + §3.3a). Not a page: a component with
 * a `clubId` prop, mounted into the club page's `coursesHost`.
 *
 * ── Why it is mounted rather than routed ──
 *
 * A course only exists under a club, and the club page is where a course admin
 * already is when they want one. A separate `/courses/courses` screen would
 * repeat the club's identity in its own heading, its own breadcrumb and its own
 * fetch. So this component publishes NO breadcrumb at all — the club page owns
 * the trail (Clubs → {Club}) and this list appends to nothing.
 *
 * ── Why create and edit are panels, not inline table editing ──
 *
 * The table can edit inline (`ManageTableProps.edit`) and the holes grid in T6
 * will use it, because par and stroke index are one number in one cell. A
 * course is not: it is a name, a two-way track and a pasted coordinate pair
 * with its own format hint and its own error line. Squeezing that into row
 * cells would make every column as wide as its editor and would leave the hint
 * nowhere to go. So both writes use the same disclosure panel the clubs list
 * creates in, driven by `RowEditController` so an in-flight save cannot be
 * re-fired and a REFUSED save keeps the panel open with the draft intact.
 *
 * ── Why Delete is offered on a course that can never be deleted ──
 *
 * A course with rounds played on it is permanently undeletable (spec §3.8) and
 * the client cannot know that without a query per row. Hiding the control on a
 * guess would be worse than the refusal: the server's 409 names the blocker in
 * a sentence, and that sentence is repeated verbatim, never re-worded and never
 * branched on by blocker kind.
 */

export type CoursesProps = {
    clubId: string;
};

/** The sentinel `RowEditController` key for the create panel. */
const CREATE_KEY = '__new';

const tpl = template(`
    <section class="mcourses">
        <header class="mcourses__head">
            <div class="mcourses__heading">
                <h2 class="mcourses__title">Courses</h2>
                <p class="mcourses__lead">The courses rounds are played on at this club.</p>
            </div>
            <button bind="new" class="mcourses__new" type="button">New course</button>
        </header>

        <form bind="panel" class="mcourses__panel">
            <h3 bind="panelTitle" class="mcourses__panel-title"></h3>
            <div bind="fieldsHost"></div>
            <p bind="panelError" class="mcourses__error" role="alert"></p>
            <div class="mcourses__panel-actions">
                <button bind="submit" class="mcourses__submit" type="submit"></button>
                <button bind="cancel" class="mcourses__secondary" type="button">Cancel</button>
            </div>
        </form>

        <p bind="loadError" class="mcourses__error" role="alert"></p>
        <button bind="retry" class="mcourses__secondary" type="button">Try again</button>
        <p bind="deleteError" class="mcourses__error" role="alert"></p>
        <p bind="loadingNote" class="mcourses__note" role="status" aria-live="polite"></p>

        <div bind="tableHost"></div>
        <div bind="confirmHost"></div>
    </section>
`);

export class CoursesComponent extends Component<CoursesProps> {
    static styles = `
        .mcourses {
            display: flex;
            flex-direction: column;
            gap: ${t('manage-stack-gap')};

            & .mcourses__head {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${s('md')};
            }

            & .mcourses__heading {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }

            & .mcourses__title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.35rem;
                font-weight: 600;
                color: ${t('text')};
            }

            & .mcourses__lead {
                margin: 0;
                max-width: 60ch;
                color: ${t('text-muted')};
                font-size: 0.9rem;
                line-height: 1.5;
            }

            & .mcourses__new {
                ${btn(undefined, 'primary')}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mcourses__note {
                margin: 0;
                color: ${t('text-muted')};
                font-size: 0.8rem;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mcourses__error {
                margin: 0;
                color: ${t('danger')};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mcourses__panel {
                ${card({})}
                display: flex;
                flex-direction: column;
                gap: ${t('manage-stack-gap')};
                padding: ${t('manage-page-pad')};

                &[hidden] { display: none; }
            }

            & .mcourses__panel-title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.1rem;
                font-weight: 600;
                color: ${t('text')};
            }

            & .mcourses__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${s('sm')};
            }

            & .mcourses__submit {
                ${btn(undefined, 'primary')}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mcourses__secondary {
                ${btn()}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;

                &[hidden] { display: none; }
            }

            & .mcourses__link {
                color: ${t('text')};
                font-weight: 700;
                text-decoration: none;

                &:hover { text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${t('accent-strong')}; outline-offset: 2px; }
            }

            /* The readiness badge. A worded pill, never a coloured dot — colour
               is the SECOND signal here and the text carries the state on its
               own (docs/design-guidelines.md §4). */
            & .mcourses__badge {
                display: inline-block;
                padding: 2px ${s('sm')};
                border: 1px solid ${t('border')};
                border-radius: ${t('radius-pill')};
                background: ${t('surface-sunken')};
                color: ${t('text-muted')};
                font-size: 0.78rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mcourses__badge--ready {
                border-color: ${t('accent-strong')};
                color: ${t('accent-strong')};
            }

            /* Brass: a warning is DECORATIVE emphasis, not a refusal. */
            & .mcourses__badge--warn {
                border-color: ${t('accent')};
                color: ${t('accent')};
            }

            & .mcourses__badge--error {
                border-color: ${t('danger')};
                color: ${t('danger')};
            }

            & .mcourses__muted { color: ${t('text-muted')}; }
        }
    `;

    private router = this.inject(Router);
    private courses = this.inject(CoursesService);

    private editor = new RowEditController();
    private errors = new Signal<CourseFieldErrors>({});

    private deleteOpen = new Signal(false);
    private deleteTarget = new Signal<CourseRow | null>(null);
    private deleteFailure = new Signal<string | null>(null);
    /**
     * The course whose delete is in flight, or null. `ConfirmComponent` closes
     * on confirm, so without this the DELETE runs against a list that looks
     * idle and the user presses Delete again.
     */
    private deletingId = new Signal<string | null>(null);

    private fields: CourseFieldsComponent | null = null;

    /**
     * One live disposer per row key for the effect that keeps that row's
     * buttons in step with `deletingId` and the open editor.
     *
     * The table builds a row's actions inside `untrack()` — deliberately, so a
     * screen's signal reads cannot re-run the list — so a signal read in
     * `rowActions` would never repaint. An effect created there does track, but
     * `rowActions` runs again on every emit of the row's data, so each call has
     * to retire the effect the previous one left behind.
     */
    private actionEffects = new Map<string, () => void>();

    private columns: ManageColumn<CourseRow>[] = [
        { key: 'name', header: 'Name', stackedLabel: false, cell: (row) => this.nameLink(row) },
        { key: 'holes', header: 'Holes', type: 'numeric', cell: (row) => row.holeCount },
        // Carried on the course row itself (`listByClub`), not fetched per row:
        // a count is the one thing about a course's tees this list has to say,
        // and it is one join on a statement that already runs.
        { key: 'tees', header: 'Tees', type: 'numeric', cell: (row) => row.teeCount },
        {
            key: 'position',
            header: 'Position',
            // The coordinates themselves rather than the word "Set": it is the
            // same worded answer (a pair reads as set, "Not set" as not) and it
            // is the only place the stored value can be checked without opening
            // the editor — which is the question a position column is asked.
            cell: (row) => {
                const text = formatCoordinates(row.latitude, row.longitude);
                if (text !== '') return text;
                const span = document.createElement('span');
                span.className = 'mcourses__muted';
                span.textContent = 'Not set';
                return span;
            },
        },
        { key: 'readiness', header: 'Readiness', cell: (row) => this.badge(row) },
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
                textContent: () => this.courses.error.get() ?? '',
                hidden: () => this.courses.error.get() === null,
            },
            retry: {
                hidden: () => this.courses.error.get() === null,
                onclick: () => void this.courses.load(this.props.clubId, true),
            },
            deleteError: {
                textContent: () => this.deleteFailure.get() ?? '',
                hidden: () => this.deleteFailure.get() === null,
            },
            loadingNote: {
                textContent: 'Loading courses…',
                // Only before the first answer: a refetch after a write must
                // not blank the list out under the user.
                hidden: () => this.courses.loaded.get(),
            },
        });

        this.fields = this.spawn(CourseFieldsComponent, this.ref(frag, 'fieldsHost'), {
            idPrefix: 'manage-course',
            errors: this.errors,
            busy: { get: () => this.saving() },
            existing: { get: () => this.editing() && !this.creating() },
        });

        this.spawn(ManageTableComponent<CourseRow>, this.ref(frag, 'tableHost'), {
            columns: this.columns,
            rows: this.courses.rows,
            rowKey: (row) => row.id,
            caption: 'Courses',
            captionHidden: true,
            actions: (row) => this.rowActions(row),
            actionsHeader: 'Course actions',
            empty: {
                heading: 'No courses yet',
                body: 'Add the club’s first course, then set its holes and tees.',
                action: { label: 'New course', onclick: () => this.openCreate() },
            },
        });

        this.spawn(
            ConfirmComponent,
            this.ref(frag, 'confirmHost'),
            destructiveConfirm({
                open: this.deleteOpen,
                title: () => {
                    const target = this.deleteTarget.get();
                    return target ? `Delete ${target.name}?` : 'Delete this course?';
                },
                consequence: () => {
                    const target = this.deleteTarget.get();
                    return target ? deleteConsequence(target.name) : DELETE_CONSEQUENCE_UNKNOWN;
                },
                confirmLabel: 'Delete course',
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
        if (this.creating()) return 'New course';
        const course = this.openCourse();
        return course ? `Edit ${course.name}` : 'Edit course';
    }

    private submitLabel(): string {
        if (this.creating()) return this.saving() ? 'Creating…' : 'Create course';
        return this.saving() ? 'Saving…' : 'Save course';
    }

    private panelError(): string | null {
        const key = this.editor.key.get();
        return key === null ? null : this.editor.errorFor(key);
    }

    private openCourse(): CourseRow | null {
        const key = this.editor.key.get();
        if (key === null || key === CREATE_KEY) return null;
        return this.courses.rows.get().find((row) => row.id === key) ?? null;
    }

    private openCreate(): void {
        if (this.saving()) return;
        this.errors.set({});
        this.editor.begin(CREATE_KEY);
        this.fields?.seed(emptyDraft());
        this.fields?.focusFirst();
    }

    private openEdit(row: CourseRow): void {
        if (this.saving()) return;
        this.errors.set({});
        this.editor.begin(row.id);
        this.fields?.seed(draftFrom(row));
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

        const draft = this.fields.draft.get();
        const errors = validateCourse(draft);
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
                ? this.courses.create(this.props.clubId, draft)
                : this.courses.update(key, draft),
        );
    }

    // ─── Rows ───

    private nameLink(row: CourseRow): HTMLElement {
        const path = coursePath(this.props.clubId, row.id);
        const link = document.createElement('a');
        link.className = 'mcourses__link';
        link.href = BASE_PATH + path;
        link.textContent = row.name;
        link.addEventListener('click', (e) => {
            // Leave the modified clicks to the browser — that is what they mean.
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            this.router.navigate(path);
        });
        return link;
    }

    private badge(row: CourseRow): HTMLElement {
        const span = document.createElement('span');
        span.className = `mcourses__badge mcourses__badge--${readinessTone(row.readiness)}`;
        span.textContent = readinessLabel(row.readiness);
        return span;
    }

    private rowActions(row: CourseRow): HTMLElement[] {
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
            const outcome = await this.courses.remove(target.id);
            // A refusal has to land somewhere the user is looking, and the
            // dialog has closed itself by now — so it lands above the list,
            // carrying the COURSE'S NAME, because the dialog that named it is
            // gone and the row is one of several.
            if (!outcome.ok) this.deleteFailure.set(`${target.name} — ${outcome.message}`);
        } finally {
            this.deletingId.set(null);
            this.deleteTarget.set(null);
        }
    }
}
