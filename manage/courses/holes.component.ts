import { Component, Computed, effect, Signal, template } from '@basics/core/client/core';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { field, fieldControl, fieldLabel } from '../ui/recipes';
import { ManageTableComponent, actionButton, type ManageColumn } from '../ui/table.component';
import { RowEditController } from '../ui/row-edit';
import { closeOnEscape, destructiveConfirm } from '../ui/confirm';
import { CoursesService } from './courses.service';
import { readinessLabel, readinessTone } from './course-form';
import type { Readiness } from './course-form';
import {
    blankDraft,
    checkStatus,
    extraHoles,
    freeStrokeIndices,
    holeDraft,
    issueLines,
    missingHoleNumbers,
    parFigure,
    parSummary,
    parseFill,
    parseHole,
    parseTrim,
    summaryNote,
    trimConsequence,
    trimLead,
    trimLossLine,
    type HoleDraft,
    type IssueLine,
} from './holes-form';
import type { Course, CourseValidation, Hole } from '../../src/api/courses.gen';

/*
 * The holes of one course (spec §3.4): the par / stroke-index grid, the live
 * par summaries, the course check, and the way out of a course that is missing
 * hole rows. A component with a `courseId` prop, mounted into the course page's
 * `holesHost` — it publishes no breadcrumb, because the page it sits on owns
 * the trail.
 *
 * ── Why the grid is HOLES DOWN and not holes across ──
 *
 * A scorecard prints holes across, so the alternative was real: three rows
 * (Hole / Par / SI) and nineteen columns, scrolling inside `scrollBox()`. It is
 * rejected because of what a ROW means to everything else on this screen:
 *
 *  - `RowEditController` addresses ONE row by key, and the key that matters
 *    here is a hole. Holes-across makes a "row" a metric — every par on the
 *    course at once — which is neither what a person edits nor what the server
 *    takes (`updateHole` is per hole).
 *  - `ManageTableComponent` exists for one property: an open editor survives a
 *    refresh of the list, because rows are keyed and an editing cell reads its
 *    data with `peek()`. Every hole save refetches the course, so that refresh
 *    is not an edge case here, it is the normal path. Holes-across would mean
 *    hand-drawing the grid and re-implementing that property, or losing it.
 *  - Three columns of two-digit numbers fit any phone. The stacking that the
 *    table does by default is what would not fit — eighteen cards each holding
 *    two numbers — so this is the documented `stacked: false` case, and the
 *    table's wide arm is already the scroll box (`overflow-x: auto` on its own
 *    wrapper), which is what keeps the page body from scrolling sideways.
 *
 * Eighteen rows is a tall panel. That is the trade, and it is the cheap half:
 * reading holes in order is how a course is read anyway.
 */

export type HolesProps = {
    courseId: string;
};

/** The `RowEditController` key for the add-missing-holes panel. */
const FILL_KEY = '__fill';

/**
 * Prefix a row's refusal with the hole it is about.
 *
 * The status line lives BELOW the grid rather than in the row's action cell
 * (see `.mholes__row-status`), so the row is no longer what says which hole is
 * being talked about. The sentence itself is left verbatim — a server refusal
 * in particular — and only gains a name in front of it.
 */
function named(row: Hole, message: string): string {
    return `Hole ${row.holeNumber} — ${message}`;
}

const tpl = template(`
    <section class="mholes">
        <header class="mholes__heading">
            <h2 class="mholes__title">Holes</h2>
            <p class="mholes__lead">Par and stroke index, one hole per row. Stroke index 1 is the hardest hole — it is where the first handicap stroke falls.</p>
        </header>

        <dl class="mholes__summary">
            <div bind="frontItem" class="mholes__fact">
                <dt class="mholes__fact-key">Front nine</dt>
                <dd bind="frontPar" class="mholes__fact-value"></dd>
            </div>
            <div bind="backItem" class="mholes__fact">
                <dt class="mholes__fact-key">Back nine</dt>
                <dd bind="backPar" class="mholes__fact-value"></dd>
            </div>
            <div class="mholes__fact">
                <dt class="mholes__fact-key">Total par</dt>
                <dd bind="totalPar" class="mholes__fact-value"></dd>
            </div>
        </dl>
        <p bind="summaryNote" class="mholes__note"></p>

        <div bind="tableHost"></div>
        <div bind="rowStatus" class="mholes__row-status"></div>

        <section class="mholes__panel">
            <div class="mholes__panel-head">
                <h3 class="mholes__panel-title">Course check</h3>
                <span bind="checkBadge" class="mholes__badge"></span>
            </div>
            <p bind="checkStatus" class="mholes__note" role="status" aria-live="polite"></p>
            <ul bind="issues" class="mholes__issues"></ul>
        </section>

        <section bind="fill" class="mholes__panel">
            <h3 class="mholes__panel-title">Holes with no values yet</h3>
            <p bind="fillLead" class="mholes__lead"></p>
            <button bind="fillOpen" class="mholes__secondary" type="button">Add these holes</button>

            <form bind="fillForm" class="mholes__fill">
                <p bind="fillFree" class="mholes__note"></p>
                <div bind="fillRows" class="mholes__fill-rows"></div>
                <p bind="fillError" class="mholes__error" role="alert"></p>
                <div class="mholes__panel-actions">
                    <button bind="fillSave" class="mholes__primary" type="submit"></button>
                    <button bind="fillCancel" class="mholes__secondary" type="button">Cancel</button>
                </div>
            </form>
        </section>

        <section bind="trim" class="mholes__panel">
            <h3 class="mholes__panel-title">Hole rows beyond the course’s count</h3>
            <p bind="trimLead" class="mholes__lead"></p>
            <ul bind="trimLoss" class="mholes__loss"></ul>
            <p bind="trimBlocked" class="mholes__note"></p>
            <button bind="trimOpen" class="mholes__danger" type="button"></button>
            <p bind="trimError" class="mholes__error" role="alert"></p>
        </section>

        <div bind="confirmHost"></div>
    </section>
`);

export class HolesComponent extends Component<HolesProps> {
    static styles = `
        .mholes {
            display: flex;
            flex-direction: column;
            gap: ${t('manage-stack-gap')};

            & .mholes__heading {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }

            & .mholes__title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.35rem;
                font-weight: 600;
                color: ${t('text')};
            }

            & .mholes__lead {
                margin: 0;
                max-width: 60ch;
                color: ${t('text-muted')};
                font-size: 0.9rem;
                line-height: 1.5;
            }

            & .mholes__note {
                margin: 0;
                max-width: 70ch;
                color: ${t('text-muted')};
                font-size: 0.85rem;
                line-height: 1.45;

                &[hidden] { display: none; }
            }

            & .mholes__error {
                margin: 0;
                max-width: 70ch;
                color: ${t('danger')};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.45;

                &[hidden] { display: none; }
            }

            /* Where the grid's row status lines land — see statusHost in
               manage/ui/table.component.ts.

               This grid is the stacked:false exception: it keeps real
               columns at 375px and scrolls them sideways inside the table's own
               box. Left in the action cell, a refused save renders in a column
               that starts past that box's right edge, and Enter-to-save does
               not scroll — so the one sentence saying WHY the save was refused
               arrives as a stack of letter fragments. Out here it is full
               width at every size, and no horizontal scroll can reach it.

               It sits BELOW the grid, so a message appearing pushes the panels
               down rather than moving the row under the finger that just
               pressed Save. Every row parks its (hidden) status line here; at
               most one is ever visible, because one editor is open at a time.

               Sticky, because eighteen rows are taller than a phone: a message
               anchored under the last row is one a user editing hole 3 would
               have to go looking for. Stuck to the bottom edge it is on screen
               for the whole length of the grid, and it settles into its own
               place in the flow once the end of the grid is reached. */
            & .mholes__row-status {
                display: flex;
                flex-direction: column;
                max-width: 70ch;
                position: sticky;
                bottom: 0;
                z-index: 1;

                /* Only a VISIBLE message earns the bar. An empty container has
                   to stay invisible, or it would draw a rule across the page
                   at all times. */
                &:has(> .mtable__status:not([hidden])) {
                    background: ${t('surface')};
                    border-top: 1px solid ${t('manage-table-border')};
                    padding: ${s('sm')} 0;
                }

                & .mtable__status { text-align: left; margin: 0; }
            }

            /* The par figures. A definition list rather than three bare
               numbers: each figure says what it is beside the number, which is
               the difference between "36" and "Front nine 36". */
            & .mholes__summary {
                display: flex;
                flex-wrap: wrap;
                gap: ${s('lg')};
                margin: 0;
            }

            & .mholes__fact {
                display: flex;
                flex-direction: column;
                gap: 2px;

                &[hidden] { display: none; }
            }

            & .mholes__fact-key {
                font-family: ${t('font-ui')};
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: ${t('text-muted')};
            }

            & .mholes__fact-value {
                margin: 0;
                font-size: 1.15rem;
                font-weight: 700;
                font-variant-numeric: tabular-nums;
                color: ${t('text')};
            }

            /* The per-cell editors. Sized to two digits so the grid stays
               narrow, with the Manage touch floor kept — density here comes
               from spacing, never from smaller hit areas (spec §2.5). */
            & .mholes__input {
                ${fieldControl()}
                width: 5rem;
                text-align: right;
                font-variant-numeric: tabular-nums;
            }

            & .mholes__panel {
                ${card({})}
                display: flex;
                flex-direction: column;
                gap: ${t('manage-stack-gap')};
                padding: ${t('manage-page-pad')};
                align-items: flex-start;

                &[hidden] { display: none; }
            }

            & .mholes__panel-head {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: ${s('sm')};
            }

            & .mholes__panel-title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.1rem;
                font-weight: 600;
                color: ${t('text')};
            }

            & .mholes__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${s('sm')};
            }

            /* Same worded pill as the club page's readiness column, so the two
               readings of one answer look like one answer. */
            & .mholes__badge {
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

            & .mholes__badge--ready {
                border-color: ${t('accent-strong')};
                color: ${t('accent-strong')};
            }

            & .mholes__badge--warn {
                border-color: ${t('accent')};
                color: ${t('accent')};
            }

            & .mholes__badge--error {
                border-color: ${t('danger')};
                color: ${t('danger')};
            }

            & .mholes__issues {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                margin: 0;
                padding: 0;
                list-style: none;

                &:empty { display: none; }
            }

            & .mholes__issue {
                display: flex;
                flex-direction: column;
                gap: 2px;
                max-width: 70ch;
                padding-left: ${s('md')};
                border-left: 3px solid ${t('border')};
            }

            & .mholes__issue--error { border-left-color: ${t('danger')}; }
            & .mholes__issue--warning { border-left-color: ${t('accent')}; }

            & .mholes__issue-severity {
                font-family: ${t('font-ui')};
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: ${t('text-muted')};
            }

            & .mholes__issue--error .mholes__issue-severity { color: ${t('danger')}; }

            & .mholes__issue-text {
                margin: 0;
                color: ${t('text')};
                font-size: 0.9rem;
                line-height: 1.45;
            }

            & .mholes__issue-detail {
                margin: 0;
                color: ${t('text-muted')};
                font-size: 0.85rem;
                line-height: 1.45;
            }

            & .mholes__fill {
                display: flex;
                flex-direction: column;
                gap: ${t('manage-stack-gap')};
                width: 100%;

                &[hidden] { display: none; }
            }

            & .mholes__fill-rows {
                display: flex;
                flex-direction: column;
                gap: ${t('manage-stack-gap')};
            }

            & .mholes__fill-row {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-end;
                gap: ${s('md')};
            }

            & .mholes__fill-hole {
                min-width: 5rem;
                font-family: ${t('font-ui')};
                font-size: 0.95rem;
                font-weight: 700;
                color: ${t('text')};
                /* Aligns with the controls beside it rather than with their
                   labels. */
                padding-bottom: 0.6rem;
            }

            & .mholes__field {
                ${field()}
            }

            & .mholes__field-label {
                ${fieldLabel()}
            }

            & .mholes__primary {
                ${btn(undefined, 'primary')}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mholes__secondary {
                ${btn()}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;
                align-self: flex-start;

                &[hidden] { display: none; }
            }

            /* Terracotta, the danger family — the same treatment the club
               page's Delete carries, from the theme's --btn-danger-* tokens
               rather than a skin hand-rolled here. Sizing after the recipe
               (ADR-005). */
            & .mholes__danger {
                ${btn(undefined, 'danger')}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;
                align-self: flex-start;
                white-space: nowrap;
            }

            /* What a trim deletes, listed row by row. Not a table: it is three
               facts about each row read once before a decision, and the widest
               of them is "stroke index 18". */
            & .mholes__loss {
                display: flex;
                flex-direction: column;
                gap: 2px;
                margin: 0;
                padding-left: ${s('md')};
                border-left: 3px solid ${t('danger')};
                list-style: none;

                &:empty { display: none; }
            }

            & .mholes__loss-item {
                margin: 0;
                color: ${t('text')};
                font-size: 0.9rem;
                font-variant-numeric: tabular-nums;
                line-height: 1.45;
            }
        }
    `;

    private courses = this.inject(CoursesService);

    /** The grid's inline editor. One hole at a time. */
    private editor = new RowEditController();

    /**
     * What the open row's two inputs hold. A plain object rather than a signal:
     * only one row is open at a time, the table seeds each editor exactly once,
     * and nothing on screen needs to REACT to a keystroke — the value is read
     * when Save is pressed.
     */
    private draft: HoleDraft = blankDraft();

    /** The second editor: the add-missing-holes panel (see `parseFill`). */
    private fillEditor = new RowEditController();
    private fillDrafts = new Map<number, HoleDraft>();
    private fillHost: HTMLElement | null = null;

    /** The trim panel's confirm dialog. Owned here; closed by the dialog. */
    private trimOpen = new Signal(false);

    /** True while the trim's bulk write is out. */
    private trimming = new Signal(false);

    /** A refused trim, worded by the server. Cleared when a new one starts. */
    private trimError = new Signal<string | null>(null);

    /** One live disposer per row key — see `CoursesComponent.actionEffects`:
     *  the table builds row actions inside `untrack()`, so a button that has to
     *  react to a signal needs its own effect, retired on the next build. */
    private actionEffects = new Map<string, () => void>();

    private columns: ManageColumn<Hole>[] = [
        {
            key: 'hole',
            header: 'Hole',
            type: 'numeric',
            stackedLabel: false,
            cell: (row) => row.holeNumber,
        },
        {
            key: 'par',
            header: 'Par',
            type: 'numeric',
            cell: (row) => row.par,
            editCell: (row) =>
                this.numberInput({
                    label: `Par, hole ${row.holeNumber}`,
                    value: this.draft.par,
                    oninput: (value) => {
                        this.draft.par = value;
                    },
                }),
        },
        {
            key: 'strokeIndex',
            header: 'Stroke index',
            type: 'numeric',
            cell: (row) => row.strokeIndex,
            editCell: (row) =>
                this.numberInput({
                    label: `Stroke index, hole ${row.holeNumber}`,
                    value: this.draft.strokeIndex,
                    oninput: (value) => {
                        this.draft.strokeIndex = value;
                    },
                }),
        },
    ];

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            // Shown whenever the course HAS two nines, whether or not either of
            // them has been filled in — an eighteen-hole course with no back
            // rows still has a back nine, and hiding it would quietly answer a
            // question nobody asked. The figure itself carries the absence.
            frontItem: { hidden: () => !this.summary().split },
            frontPar: { textContent: () => parFigure(this.summary().front) },
            backItem: { hidden: () => !this.summary().split },
            backPar: { textContent: () => parFigure(this.summary().back) },
            totalPar: { textContent: () => String(this.summary().total) },
            summaryNote: {
                textContent: () => summaryNote(this.summary()) ?? '',
                hidden: () => summaryNote(this.summary()) === null,
            },

            // The same worded badge the club page's list shows for this course,
            // from the same two functions — so the two readings of one answer
            // cannot drift into two answers.
            checkBadge: {
                textContent: () => readinessLabel(this.readiness()),
                className: () => `mholes__badge mholes__badge--${readinessTone(this.readiness())}`,
            },
            checkStatus: {
                textContent: () => checkStatus(this.readiness(), this.validation(), this.holeCount()),
            },

            fill: { hidden: () => this.missing().length === 0 },
            fillLead: { textContent: () => this.fillLead() },
            fillOpen: {
                hidden: () => this.filling(),
                disabled: () => this.busy(),
                onclick: () => this.openFill(),
            },
            fillForm: {
                hidden: () => !this.filling(),
                onsubmit: (e: Event) => {
                    e.preventDefault();
                    void this.saveFill();
                },
            },
            fillFree: { textContent: () => this.freeNote() },
            fillError: {
                textContent: () => this.fillEditor.errorFor(FILL_KEY) ?? '',
                hidden: () => this.fillEditor.errorFor(FILL_KEY) === null,
            },
            fillSave: {
                textContent: () => (this.fillSaving() ? 'Adding…' : 'Add holes'),
                disabled: () => this.busy(),
            },
            fillCancel: {
                disabled: () => this.fillSaving(),
                onclick: () => this.closeFill(),
            },

            trim: { hidden: () => this.extras().length === 0 },
            trimLead: { textContent: () => trimLead(this.extras(), this.holeCount()) },
            // Why the blocker is stated even though the button is disabled: a
            // control that cannot be pressed and does not say why is the same
            // dead end this panel exists to remove.
            trimBlocked: {
                textContent: () => this.trimBlocker() ?? '',
                hidden: () => this.trimBlocker() === null,
            },
            trimOpen: {
                textContent: () => this.trimLabel(),
                disabled: () => this.busy() || this.trimBlocker() !== null,
                onclick: () => this.trimOpen.set(true),
            },
            trimError: {
                textContent: () => this.trimError.get() ?? '',
                hidden: () => this.trimError.get() === null,
            },
        });

        // Built here rather than as a field: a `Computed` created at field-init
        // time is harmless, but the rule that keeps this file out of the $swap
        // footgun is "no signal reads before render", and one place to look is
        // better than two.
        const rows = new Computed<Hole[]>(() =>
            [...(this.course()?.holes ?? [])].sort((a, b) => a.holeNumber - b.holeNumber),
        );

        this.spawn(ManageTableComponent<Hole>, this.ref(frag, 'tableHost'), {
            columns: this.columns,
            rows,
            rowKey: (row) => String(row.holeNumber),
            caption: 'Holes',
            captionHidden: true,
            // The documented exception (see the note at the top): eighteen rows
            // of two numbers must not become eighteen cards.
            stacked: false,
            actions: (row) => this.rowActions(row),
            actionsHeader: 'Hole actions',
            empty: {
                heading: 'No holes yet',
                body: 'This course has no hole rows. Add them below, one par and one stroke index per hole.',
            },
            edit: {
                controller: this.editor,
                oncommit: (row) => void this.saveRow(row),
                saveLabel: 'Save',
                savingLabel: 'Saving…',
                // Out of the scrolling grid and under it, where the sentence is
                // readable at 375px — see `.mholes__row-status` above.
                statusHost: this.ref(frag, 'rowStatus'),
            },
        });

        this.fillHost = this.ref(frag, 'fillRows');

        this.$each(
            this.ref(frag, 'issues'),
            () => this.issues(),
            (line) => this.issueItem(line),
            (line) => line.key,
        );

        this.$each(
            this.ref(frag, 'trimLoss'),
            () => this.extras(),
            (hole) => this.lossItem(hole),
            // Keyed on the VALUES, not on the hole number: a row whose par was
            // corrected while the panel was open must re-render, or the list
            // would keep promising to delete the old numbers.
            (hole) => `${hole.holeNumber}:${hole.par}:${hole.strokeIndex}`,
        );

        this.spawn(
            ConfirmComponent,
            this.ref(frag, 'confirmHost'),
            destructiveConfirm({
                open: this.trimOpen,
                title: () => {
                    const extras = this.extras();
                    return extras.length === 1
                        ? `Remove hole ${extras[0].holeNumber}?`
                        : `Remove ${extras.length} hole rows?`;
                },
                consequence: () =>
                    trimConsequence(
                        this.extras(),
                        this.course()?.name ?? 'this course',
                        this.holeCount(),
                    ),
                confirmLabel: () => (this.extras().length === 1 ? 'Remove hole row' : 'Remove hole rows'),
                onconfirm: () => void this.trim(),
            }),
        );
        this.track(closeOnEscape(this.trimOpen));

        this.track(() => {
            for (const dispose of this.actionEffects.values()) dispose();
            this.actionEffects.clear();
        });

        return frag;
    }

    // ─── Reads ───

    private course(): Course | null {
        return this.courses.byId(this.props.courseId);
    }

    private holeCount(): number {
        return this.course()?.holeCount ?? 0;
    }

    private summary() {
        return parSummary(this.course()?.holes ?? [], this.holeCount());
    }

    private readiness(): Readiness {
        return this.courses.readiness.get()[this.props.courseId] ?? { status: 'checking' };
    }

    private validation(): CourseValidation | null {
        return this.courses.validations.get()[this.props.courseId] ?? null;
    }

    private issues(): IssueLine[] {
        const validation = this.validation();
        return validation ? issueLines(validation, this.holeCount()) : [];
    }

    private missing(): number[] {
        return missingHoleNumbers(this.course()?.holes ?? [], this.holeCount());
    }

    private extras(): Hole[] {
        return extraHoles(this.course()?.holes ?? [], this.holeCount());
    }

    // ─── The grid ───

    private rowActions(row: Hole): HTMLElement {
        const key = String(row.holeNumber);
        const edit = actionButton('Edit', {
            onclick: () => {
                // Seeded BEFORE the row opens: the table paints an edit cell
                // exactly once, on the transition, and it reads this draft.
                this.draft = holeDraft(row);
                this.editor.begin(key);
            },
        });

        this.actionEffects.get(key)?.();
        this.actionEffects.set(
            key,
            effect(() => {
                // One GRID row at a time, the same rule the courses list
                // follows: a second half-open row is a state with nothing
                // sensible to say about itself.
                //
                // The fill panel is deliberately NOT counted here. It used to
                // be, and that made its own advice impossible to follow: the
                // clash message says "change one of them in the grid above
                // first", while every Edit button was disabled behind the open
                // panel and Cancel — the only way back to the grid — threw the
                // typed drafts away. Two editors on one screen is what two
                // controllers are for (`manage/ui/row-edit.ts`); what stays
                // exclusive is the SAVE, below.
                edit.disabled = this.editor.key.get() !== null || this.busy();
            }),
        );

        return edit;
    }

    private async saveRow(row: Hole): Promise<void> {
        const course = this.course();
        if (!course) return;

        // The bulk write below replaces the WHOLE hole set from the course as
        // it stood when it was sent, so a row save landing inside that window
        // would be overwritten by it. Both editors may be open; only one save
        // runs at a time, and the row keeps its draft while it waits.
        if (this.fillSaving()) {
            this.editor.fail(
                'The missing holes are still being added. Wait for that to finish, then save this hole again.',
            );
            return;
        }
        if (this.trimming.peek()) {
            this.editor.fail(
                'The extra hole rows are still being removed. Wait for that to finish, then save this hole again.',
            );
            return;
        }

        const parsed = parseHole(this.draft, course.holeCount);
        if (!parsed.ok) {
            // Same state a refused save leaves: row open, draft intact, message
            // beneath the grid — so a typo and a server refusal read
            // identically.
            this.editor.fail(named(row, parsed.message));
            return;
        }

        await this.editor.commit(async () => {
            const outcome = await this.courses.saveHole(course.id, row.holeNumber, {
                par: parsed.par,
                strokeIndex: parsed.strokeIndex,
            });
            return outcome.ok ? outcome : { ok: false, message: named(row, outcome.message) };
        });
    }

    // ─── The course check ───

    private issueItem(line: IssueLine): HTMLElement {
        const item = document.createElement('li');
        item.className = `mholes__issue mholes__issue--${line.severity}`;

        const severity = document.createElement('span');
        severity.className = 'mholes__issue-severity';
        severity.textContent = line.severityLabel;

        const explanation = document.createElement('p');
        explanation.className = 'mholes__issue-text';
        explanation.textContent = line.explanation;

        // The server's own sentence, verbatim: it names the holes, and naming
        // them is the fact. Re-wording it here is how a client ends up
        // contradicting the rule it is reporting (`manage/api-failure.ts`).
        const detail = document.createElement('p');
        detail.className = 'mholes__issue-detail';
        detail.textContent = line.detail;

        item.append(severity, explanation, detail);
        return item;
    }

    // ─── Missing holes ───

    private filling(): boolean {
        return this.fillEditor.key.get() === FILL_KEY;
    }

    private fillSaving(): boolean {
        return this.fillEditor.isSaving(FILL_KEY);
    }

    /**
     * A write is in flight, from either editor.
     *
     * The screen's one exclusion rule. The grid, the fill panel and the trim
     * panel may all be OPEN — that is what makes their advice followable, since
     * every one of them says "fix it in the grid above" — but they write to the
     * same hole set, and the bulk update sends the set whole, so their saves
     * must not overlap.
     */
    private busy(): boolean {
        return this.editor.phase.get() === 'saving' || this.fillSaving() || this.trimming.get();
    }

    private fillLead(): string {
        const missing = this.missing();
        if (missing.length === 0) return '';
        return `${missing.length === 1 ? 'Hole' : 'Holes'} ${holeList(missing)} ${missing.length === 1 ? 'has' : 'have'} no row on this course, so the course is incomplete until ${missing.length === 1 ? 'it is' : 'they are'} filled in. Enter the real par and stroke index for each — nothing is guessed for you, because an invented par ends up on somebody’s scorecard.`;
    }

    private freeNote(): string {
        const free = freeStrokeIndices(this.course()?.holes ?? [], this.holeCount());
        if (free.length === 0) return '';
        return `Stroke ${free.length === 1 ? 'index' : 'indices'} still free: ${holeList(free)}. Each of them has to end up on exactly one hole.`;
    }

    /**
     * Open the panel and BUILD its inputs once, imperatively.
     *
     * Deliberately not rendered from a signal: the course refetches after every
     * hole save, and an input rebuilt by an effect loses the caret and, on a
     * phone, the keyboard. One build is enough because the set of MISSING holes
     * cannot change under it — the grid edits par and stroke index on rows that
     * already exist, and the only thing that adds a row is this panel — and the
     * set is re-derived from live data at save time regardless.
     *
     * That is also why a grid edit made while the panel is open leaves these
     * inputs alone: nothing here is bound to the course.
     */
    private openFill(): void {
        const course = this.course();
        const host = this.fillHost;
        if (!course || !host || this.busy()) return;

        this.fillDrafts.clear();
        host.textContent = '';
        for (const holeNumber of missingHoleNumbers(course.holes, course.holeCount)) {
            const draft = blankDraft();
            this.fillDrafts.set(holeNumber, draft);
            host.appendChild(this.fillRow(holeNumber, draft));
        }

        this.fillEditor.begin(FILL_KEY);
        host.querySelector('input')?.focus();
    }

    private fillRow(holeNumber: number, draft: HoleDraft): HTMLElement {
        const row = document.createElement('div');
        row.className = 'mholes__fill-row';

        const name = document.createElement('span');
        name.className = 'mholes__fill-hole';
        name.textContent = `Hole ${holeNumber}`;
        row.appendChild(name);

        row.appendChild(
            this.fillField(`manage-hole-${holeNumber}-par`, 'Par', draft.par, (value) => {
                draft.par = value;
            }),
        );
        row.appendChild(
            this.fillField(`manage-hole-${holeNumber}-si`, 'Stroke index', draft.strokeIndex, (value) => {
                draft.strokeIndex = value;
            }),
        );

        return row;
    }

    private fillField(
        id: string,
        labelText: string,
        value: string,
        oninput: (value: string) => void,
    ): HTMLElement {
        const wrap = document.createElement('div');
        wrap.className = 'mholes__field';

        const label = document.createElement('label');
        label.className = 'mholes__field-label';
        label.htmlFor = id;
        label.textContent = labelText;

        const input = this.numberInput({ label: labelText, value, oninput });
        input.id = id;
        // The visible label names it; the aria-label the helper adds would
        // otherwise win over that label and say the same thing twice.
        input.removeAttribute('aria-label');

        wrap.append(label, input);
        return wrap;
    }

    private closeFill(): void {
        this.fillEditor.cancel();
        if (this.fillEditor.key.get() !== null) return;
        this.fillDrafts.clear();
        if (this.fillHost) this.fillHost.textContent = '';
    }

    private async saveFill(): Promise<void> {
        const course = this.course();
        if (!course || this.fillSaving()) return;

        // The other half of the one exclusion rule (see `busy`): a row save is
        // out, so the hole set this would send is already stale.
        if (this.editor.phase.peek() === 'saving') {
            this.fillEditor.fail(
                'A hole is still saving. Wait for it to finish, then add these holes again.',
            );
            return;
        }

        // Parsed against the course as it stands NOW, not as it stood when the
        // panel opened — a hole saved in between is part of the set being sent.
        const parsed = parseFill(course.holes, this.fillDrafts, course.holeCount);
        if (!parsed.ok) {
            this.fillEditor.fail(parsed.message);
            return;
        }

        const saved = await this.fillEditor.commit(() =>
            this.courses.saveHoles(
                course.id,
                parsed.holes,
                'Could not add the holes. Check your connection and try again.',
            ),
        );
        if (saved) {
            this.fillDrafts.clear();
            if (this.fillHost) this.fillHost.textContent = '';
        }
    }

    // ─── Hole rows beyond the count ───

    private lossItem(hole: Hole): HTMLElement {
        const item = document.createElement('li');
        item.className = 'mholes__loss-item';
        item.textContent = trimLossLine(hole);
        return item;
    }

    private trimLabel(): string {
        const extras = this.extras();
        if (this.trimming.get()) return 'Removing…';
        return extras.length === 1
            ? `Remove hole ${extras[0].holeNumber}`
            : `Remove these ${extras.length} hole rows`;
    }

    /**
     * Why the trim cannot run yet, or null when it can.
     *
     * `parseTrim` refuses whenever the KEPT holes' stroke indices are not a
     * permutation of 1..holeCount, which is the normal state of a former
     * eighteen — so this sentence, not the button, is what the panel usually
     * shows first, and it names the grid rows to fix.
     */
    private trimBlocker(): string | null {
        const course = this.course();
        if (!course) return null;
        const parsed = parseTrim(course.holes, course.holeCount);
        return parsed.ok ? null : parsed.message;
    }

    /**
     * Delete the rows beyond the count, by sending the set WITHOUT them.
     *
     * The bulk update replaces the whole hole set (`CourseService.update`), so
     * absence is the delete — there is no per-row endpoint and this needs none.
     * Re-parsed here rather than trusting what the button was enabled on: the
     * course refetches after every hole save, and the confirm dialog can be
     * open across one.
     */
    private async trim(): Promise<void> {
        const course = this.course();
        if (!course || this.busy() || this.trimming.get()) return;

        const parsed = parseTrim(course.holes, course.holeCount);
        if (!parsed.ok) {
            this.trimError.set(parsed.message);
            return;
        }

        this.trimError.set(null);
        this.trimming.set(true);
        try {
            const outcome = await this.courses.saveHoles(
                course.id,
                parsed.holes,
                'Could not remove the hole rows. Check your connection and try again.',
            );
            if (!outcome.ok) this.trimError.set(outcome.message);
        } finally {
            this.trimming.set(false);
        }
    }

    // ─── Controls ───

    /**
     * A digits-only field. `type="text"` with `inputmode="numeric"` rather than
     * `type="number"`: the number input brings spinners, scroll-wheel edits
     * over a value the user is only passing through, and locale-dependent
     * parsing — while what is wanted from it, a numeric keypad on a phone, is
     * exactly what `inputmode` gives.
     */
    private numberInput(opts: {
        label: string;
        value: string;
        oninput: (value: string) => void;
    }): HTMLInputElement {
        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'numeric';
        input.autocomplete = 'off';
        input.className = 'mholes__input';
        input.value = opts.value;
        input.setAttribute('aria-label', opts.label);
        input.addEventListener('input', () => opts.oninput(input.value));
        return input;
    }
}

/** "10, 11 and 12" — worded, so a list of hole numbers reads as a sentence. */
function holeList(numbers: number[]): string {
    if (numbers.length <= 2) return numbers.join(' and ');
    return `${numbers.slice(0, -1).join(', ')} and ${numbers[numbers.length - 1]}`;
}
