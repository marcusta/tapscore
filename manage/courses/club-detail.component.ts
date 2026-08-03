import { Component, Router, Signal, effect, template } from '@basics/core/client/core';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { BreadcrumbService } from '../shell/breadcrumb.service';
import { RowEditController } from '../ui/row-edit';
import { closeOnEscape, destructiveConfirm } from '../ui/confirm';
import { ClubsService, type ClubRow } from './clubs.service';
import { ClubFieldsComponent } from './club-fields.component';
import { CoursesComponent } from './courses.component';
import {
    DELETE_CONSEQUENCE_UNKNOWN,
    deleteConsequence,
    draftFrom,
    hasErrors,
    validateClub,
    type ClubFieldErrors,
} from './club-form';
import { CLUBS_PATH, CLUB_ROUTE } from './routes';

/*
 * One club: its fields, editable in place, and the courses under it (spec §3.2,
 * §3.3). Deep-linkable at `/courses/clubs/<id>`.
 *
 * ── Why the edit state machine is `RowEditController` and not three signals ──
 *
 * There is no table on this page, and the controller is deliberately not part
 * of one: its own file says the same four states describe an editable row, a
 * hole grid and a panel like this, and that a screen drawing its own DOM should
 * reuse the states without the table. Reusing it buys the two behaviours that
 * are easy to get wrong by hand — a save in flight that cannot be re-fired or
 * abandoned, and a FAILED save that leaves the form open with the draft intact
 * — and it means a reviewer reads one state machine for every editable surface
 * in Manage rather than one per screen.
 *
 * The key is the club id, so the controller's own guards ("is this row open",
 * "is this row saving") work unchanged with a single-row screen.
 *
 * ── Data ──
 *
 * The club comes from `ClubsService`'s list rather than `GET /clubs/get`: the
 * course count is part of what this page states (it is in the delete
 * consequence), and the count only exists as a join over the list. Load is
 * load-once and shared, so arriving here by deep link costs the same one fetch
 * the list would have made.
 */

const tpl = template(`
    <section class="mclub">
        <!-- role=status: a polite live region, so "Loading club…" and its
             disappearance are announced instead of only being visible. -->
        <p bind="loadingNote" class="mclub__note" role="status" aria-live="polite"></p>

        <p bind="loadError" class="mclub__error" role="alert"></p>
        <button bind="retry" class="mclub__secondary" type="button">Try again</button>

        <div bind="missing" class="mclub__missing">
            <h1 class="mclub__title">Club not found</h1>
            <p class="mclub__lead">This club is not in the catalog. It may have been deleted since the link was made.</p>
            <button bind="backMissing" class="mclub__secondary" type="button">Back to clubs</button>
        </div>

        <div bind="body" class="mclub__body">
            <header class="mclub__head">
                <div class="mclub__heading">
                    <h1 bind="title" class="mclub__title"></h1>
                    <p bind="subtitle" class="mclub__lead"></p>
                </div>
                <button bind="remove" class="mclub__danger" type="button">Delete club</button>
            </header>

            <p bind="deleteError" class="mclub__error" role="alert"></p>

            <section class="mclub__panel">
                <div class="mclub__panel-head">
                    <h2 class="mclub__panel-title">Club details</h2>
                    <button bind="edit" class="mclub__secondary" type="button">Edit</button>
                </div>

                <dl bind="facts" class="mclub__facts">
                    <div class="mclub__fact">
                        <dt class="mclub__fact-key">Name</dt>
                        <dd bind="factName" class="mclub__fact-value"></dd>
                    </div>
                    <div class="mclub__fact">
                        <dt class="mclub__fact-key">Location</dt>
                        <dd bind="factLocation" class="mclub__fact-value"></dd>
                    </div>
                    <div class="mclub__fact">
                        <dt class="mclub__fact-key">Logo URL</dt>
                        <dd bind="factLogo" class="mclub__fact-value"></dd>
                    </div>
                </dl>

                <form bind="form" class="mclub__form">
                    <div bind="fieldsHost"></div>
                    <p bind="saveError" class="mclub__error" role="alert"></p>
                    <div class="mclub__panel-actions">
                        <button bind="save" class="mclub__primary" type="submit">Save</button>
                        <button bind="cancel" class="mclub__secondary" type="button">Cancel</button>
                    </div>
                </form>
            </section>

            <!-- The club's courses (spec §3.3 + §3.3a). A component taking the
                 club id as a prop, spawned below; it publishes no breadcrumb of
                 its own, because the trail this page sets is already its. -->
            <div bind="coursesHost" class="mclub__courses"></div>
        </div>

        <div bind="confirmHost"></div>
    </section>
`);

export class ClubDetailComponent extends Component {
    static styles = `
        .mclub {
            display: flex;
            flex-direction: column;
            gap: ${t('manage-stack-gap')};

            & .mclub__head {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${s('md')};
            }

            & .mclub__heading {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }

            & .mclub__title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.75rem;
                font-weight: 600;
                letter-spacing: -0.02em;
                color: ${t('text')};
            }

            & .mclub__lead {
                margin: 0;
                max-width: 60ch;
                color: ${t('text-muted')};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mclub__note {
                margin: 0;
                color: ${t('text-muted')};
                font-size: 0.8rem;

                &[hidden] { display: none; }
            }

            & .mclub__error {
                margin: 0;
                color: ${t('danger')};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mclub__missing,
            & .mclub__body {
                display: flex;
                flex-direction: column;
                gap: ${t('manage-stack-gap')};

                &[hidden] { display: none; }
            }

            & .mclub__panel {
                ${card({})}
                display: flex;
                flex-direction: column;
                gap: ${t('manage-stack-gap')};
                padding: ${t('manage-page-pad')};
            }

            & .mclub__panel-head {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: ${s('sm')};
            }

            & .mclub__panel-title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.15rem;
                font-weight: 600;
                color: ${t('text')};
            }

            & .mclub__facts {
                display: flex;
                flex-direction: column;
                gap: ${t('manage-stack-gap')};
                margin: 0;

                &[hidden] { display: none; }
            }

            & .mclub__fact {
                display: flex;
                flex-direction: column;
                gap: 2px;
                min-width: 0;
            }

            & .mclub__fact-key {
                font-family: ${t('font-ui')};
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: ${t('text-muted')};
            }

            & .mclub__fact-value {
                margin: 0;
                color: ${t('text')};
                font-size: 0.95rem;
                line-height: 1.5;
                overflow-wrap: anywhere;
            }

            & .mclub__form {
                display: flex;
                flex-direction: column;
                gap: ${t('manage-stack-gap')};

                &[hidden] { display: none; }
            }

            & .mclub__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${s('sm')};
            }

            & .mclub__primary {
                ${btn(undefined, 'primary')}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mclub__secondary {
                ${btn()}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;
                align-self: flex-start;

                &[hidden] { display: none; }
            }

            /*
             * Destructive, and it says so in the button as well as in the
             * dialog it opens — terracotta is the danger family, never the
             * brass accent (AGENTS.md, "Theme and CSS").
             *
             * The outline-at-rest treatment is the THEME's, not this file's:
             * manage/theme.ts sets the --btn-danger-* family, so the recipe
             * tier below already renders it and no screen hand-rolls a skin
             * over btn(). Sizing only here, and after the recipe (ADR-005).
             */
            & .mclub__danger {
                ${btn(undefined, 'danger')}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mclub__courses:empty { display: none; }
        }
    `;

    private router = this.inject(Router);
    private crumbs = this.inject(BreadcrumbService);
    private clubs = this.inject(ClubsService);

    private params = this.router.params<{ id: string }>(CLUB_ROUTE);

    private editor = new RowEditController();
    private errors = new Signal<ClubFieldErrors>({});

    private deleteOpen = new Signal(false);
    private deleteFailure = new Signal<string | null>(null);
    /**
     * A delete is in flight. `ConfirmComponent` closes itself the moment the
     * user confirms, so without this the request runs against a page that looks
     * idle — on a slow link nothing at all happens for seconds, which reads as
     * "the click missed" and invites a second delete.
     */
    private deleting = new Signal(false);

    private fields: ClubFieldsComponent | null = null;

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            loadingNote: {
                textContent: 'Loading club…',
                hidden: () => this.clubs.loaded.get(),
            },
            loadError: {
                textContent: () => this.clubs.error.get() ?? '',
                hidden: () => this.clubs.error.get() === null,
            },
            retry: {
                hidden: () => this.clubs.error.get() === null,
                onclick: () => void this.clubs.load(true),
            },

            missing: {
                // Only once a load has actually finished and said so — before
                // that, "not found" would be a lie about a pending request.
                hidden: () =>
                    !this.clubs.loaded.get() ||
                    this.clubs.error.get() !== null ||
                    this.club() !== null,
            },
            backMissing: { onclick: () => this.router.navigate(CLUBS_PATH) },

            body: { hidden: () => this.club() === null },
            title: () => this.club()?.name ?? '',
            subtitle: () => this.courseSummary(),

            remove: {
                // Worded, never a spinner glyph (docs/design-guidelines.md §4).
                textContent: () => (this.deleting.get() ? 'Deleting…' : 'Delete club'),
                disabled: () => this.editing() || this.deleting.get(),
                onclick: () => {
                    this.deleteFailure.set(null);
                    this.deleteOpen.set(true);
                },
            },
            deleteError: {
                textContent: () => this.deleteFailure.get() ?? '',
                hidden: () => this.deleteFailure.get() === null,
            },

            edit: {
                hidden: () => this.editing(),
                disabled: () => this.deleting.get(),
                onclick: () => this.beginEdit(),
            },

            facts: { hidden: () => this.editing() },
            factName: () => this.club()?.name ?? '',
            factLocation: () => this.club()?.location ?? 'Not recorded',
            factLogo: () => this.club()?.logoUrl ?? 'Not recorded',

            form: {
                hidden: () => !this.editing(),
                onsubmit: (e: Event) => {
                    e.preventDefault();
                    this.save();
                },
            },
            saveError: {
                textContent: () => this.editor.errorFor(this.clubId()) ?? '',
                hidden: () => this.editor.errorFor(this.clubId()) === null,
            },
            save: {
                textContent: () => (this.saving() ? 'Saving…' : 'Save'),
                disabled: () => this.saving(),
            },
            cancel: {
                disabled: () => this.saving(),
                onclick: () => this.cancelEdit(),
            },
        });

        this.fields = this.spawn(ClubFieldsComponent, this.ref(frag, 'fieldsHost'), {
            idPrefix: 'manage-club-edit',
            errors: this.errors,
            busy: { get: () => this.saving() },
        });

        // The club's courses. Spawned with the id read from the URL rather than
        // with a signal: `$swap` tears this page down and rebuilds it on every
        // route change, so the id is fixed for the life of the component. A
        // bare `/courses/clubs` carries none and gets no list — `onMount` sends
        // it back to the club list instead.
        const clubId = this.clubId();
        if (clubId !== '') {
            this.spawn(CoursesComponent, this.ref(frag, 'coursesHost'), { clubId });
        }

        this.spawn(
            ConfirmComponent,
            this.ref(frag, 'confirmHost'),
            destructiveConfirm({
                open: this.deleteOpen,
                title: () => {
                    const club = this.club();
                    return club ? `Delete ${club.name}?` : 'Delete this club?';
                },
                consequence: () => this.deleteConsequence(),
                confirmLabel: 'Delete club',
                onconfirm: () => void this.remove(),
            }),
        );
        this.track(closeOnEscape(this.deleteOpen));

        return frag;
    }

    override onMount(): void {
        // A deep link lands here with nothing loaded; `load()` is load-once and
        // shared, so arriving from the list costs no second request.
        void this.clubs.load();

        // The trail is DATA, so it is published as it is learned rather than
        // once — the club's name is not derivable from the URL.
        this.track(
            effect(() => {
                const club = this.club();
                this.crumbs.set([
                    { label: 'Clubs', path: CLUBS_PATH },
                    { label: club?.name ?? 'Club' },
                ]);
            }),
        );

        // A bare `/courses/clubs` carries no id and can only have been typed or
        // truncated; send it to the list rather than paint "not found".
        if (this.clubId() === '') this.router.navigate(CLUBS_PATH, true);
    }

    private clubId(): string {
        return this.params.get().id;
    }

    private club(): ClubRow | null {
        const id = this.clubId();
        return id === '' ? null : this.clubs.byId(id);
    }

    private editing(): boolean {
        return this.editor.isEditing(this.clubId());
    }

    private saving(): boolean {
        return this.editor.isSaving(this.clubId());
    }

    /** The line under the club's name — what it holds, in words. */
    private courseSummary(): string {
        const club = this.club();
        if (!club) return '';
        if (club.courseCount === 0) return 'No courses yet.';
        return club.courseCount === 1 ? '1 course.' : `${club.courseCount} courses.`;
    }

    private beginEdit(): void {
        const club = this.club();
        if (!club) return;
        this.errors.set({});
        this.editor.begin(club.id);
        this.fields?.seed(draftFrom(club));
        this.fields?.focusFirst();
    }

    private cancelEdit(): void {
        this.editor.cancel();
        this.errors.set({});
    }

    private save(): void {
        const club = this.club();
        if (!club || !this.fields || this.saving()) return;

        const draft = this.fields.draft.get();
        const errors = validateClub(draft);
        this.errors.set(errors);
        // Field-level complaints belong under their fields; the controller's
        // error line is reserved for what the SERVER said, so a rejected draft
        // does not produce the same sentence twice.
        if (hasErrors(errors)) {
            // …and the caret goes to the first field that was complained about,
            // rather than staying on the Save button with the message somewhere
            // above it.
            this.fields.focusInvalid(errors);
            return;
        }

        void this.editor.commit(() => this.clubs.update(club.id, draft));
    }

    private deleteConsequence(): string {
        const club = this.club();
        return club ? deleteConsequence(club.name, club.courseCount) : DELETE_CONSEQUENCE_UNKNOWN;
    }

    private async remove(): Promise<void> {
        const club = this.club();
        // Re-entry guard as well as a null guard: the dialog is gone by now, but
        // Enter on a still-focused Delete button is not.
        if (!club || this.deleting.get()) return;
        this.deleteFailure.set(null);
        this.deleting.set(true);
        try {
            const outcome = await this.clubs.remove(club.id);
            if (!outcome.ok) {
                // The dialog has closed itself; the refusal lands on the page
                // the user is still looking at.
                this.deleteFailure.set(outcome.message);
                return;
            }
            this.router.navigate(CLUBS_PATH, true);
        } finally {
            this.deleting.set(false);
        }
    }
}
