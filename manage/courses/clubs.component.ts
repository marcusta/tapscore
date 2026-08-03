import { Component, Router, Signal, effect, template } from '@basics/core/client/core';
import { BASE_PATH } from '@basics/core/client/base';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { BreadcrumbService } from '../shell/breadcrumb.service';
import { ManageTableComponent, actionButton, type ManageColumn } from '../ui/table.component';
import { closeOnEscape, destructiveConfirm } from '../ui/confirm';
import { field, fieldControl, fieldLabel } from '../ui/recipes';
import { ClubsService, type ClubRow } from './clubs.service';
import { ClubFieldsComponent } from './club-fields.component';
import {
    DELETE_CONSEQUENCE_UNKNOWN,
    deleteConsequence,
    emptyDraft,
    hasErrors,
    validateClub,
    type ClubFieldErrors,
} from './club-form';
import { clubPath } from './routes';

/*
 * The Courses section's landing page: every club, searchable, with the course
 * count that says whether a club is worth opening (spec §3.2).
 *
 * ── Why creating is a disclosure panel and not a dialog ──
 *
 * The repo has exactly one modal, `ConfirmComponent`, and it asks a destructive
 * QUESTION — five call sites in the player app, all deletions. Creating is not
 * a question, it is a form, and putting it in a dialog would (a) invent a
 * second modal idiom for the codebase, (b) hide the list you are adding to, and
 * (c) trap the keyboard for a three-field form that fits above the table. So
 * "New club" reveals a panel in place, the list stays visible behind it, and
 * Escape backs out the same way Cancel does.
 *
 * ── Why the name is a link and Delete is the only row action ──
 *
 * Opening a club is navigation, so it is an `<a href>`: cmd-click, middle-click
 * and "copy link" all have to work, which a button cannot do (same reasoning as
 * `nav.component.ts`). That leaves the action bar for the one thing that is not
 * navigation. Editing lives on the club page, per spec §3.2 — a row editor here
 * would be a second place to change the same three fields.
 */

const tpl = template(`
    <section class="mclubs">
        <header class="mclubs__head">
            <div class="mclubs__heading">
                <h1 class="mclubs__title">Clubs</h1>
                <p class="mclubs__lead">Every club in the catalog. A club holds the courses that rounds are played on.</p>
            </div>
            <button bind="new" class="mclubs__new" type="button">New club</button>
        </header>

        <div class="mclubs__search">
            <label bind="searchLabel" class="mclubs__search-label">Search</label>
            <input bind="search" class="mclubs__search-input" type="search" autocomplete="off" placeholder="Name or location">
            <!-- role=status: filtering changes the list without moving focus,
                 so the count is announced politely rather than only seen. -->
            <p bind="searchNote" class="mclubs__note" role="status" aria-live="polite"></p>
        </div>

        <form bind="createPanel" class="mclubs__panel">
            <h2 class="mclubs__panel-title">New club</h2>
            <div bind="createFields"></div>
            <p bind="createError" class="mclubs__error" role="alert"></p>
            <div class="mclubs__panel-actions">
                <button bind="createSubmit" class="mclubs__submit" type="submit">Create club</button>
                <button bind="createCancel" class="mclubs__secondary" type="button">Cancel</button>
            </div>
        </form>

        <p bind="loadError" class="mclubs__error" role="alert"></p>
        <button bind="retry" class="mclubs__secondary" type="button">Try again</button>
        <p bind="deleteError" class="mclubs__error" role="alert"></p>
        <p bind="loadingNote" class="mclubs__note" role="status" aria-live="polite"></p>

        <div bind="tableHost"></div>
        <div bind="confirmHost"></div>
    </section>
`);

export class ClubsComponent extends Component {
    static styles = `
        .mclubs {
            display: flex;
            flex-direction: column;
            gap: ${t('manage-stack-gap')};

            & .mclubs__head {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${s('md')};
            }

            & .mclubs__heading {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }

            & .mclubs__title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.75rem;
                font-weight: 600;
                letter-spacing: -0.02em;
                color: ${t('text')};
            }

            & .mclubs__lead {
                margin: 0;
                max-width: 60ch;
                color: ${t('text-muted')};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            /* The page's forward action — solid fill is earned here, and only
               here on this screen (docs/design-guidelines.md §2). */
            & .mclubs__new {
                ${btn(undefined, 'primary')}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mclubs__search {
                ${field()}
                max-width: 28rem;
            }

            & .mclubs__search-label {
                ${fieldLabel()}
            }

            & .mclubs__search-input {
                ${fieldControl()}
            }

            & .mclubs__note {
                margin: 0;
                color: ${t('text-muted')};
                font-size: 0.8rem;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mclubs__error {
                margin: 0;
                color: ${t('danger')};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mclubs__panel {
                ${card({})}
                display: flex;
                flex-direction: column;
                gap: ${t('manage-stack-gap')};
                padding: ${t('manage-page-pad')};

                &[hidden] { display: none; }
            }

            & .mclubs__panel-title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.15rem;
                font-weight: 600;
                color: ${t('text')};
            }

            & .mclubs__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${s('sm')};
            }

            & .mclubs__submit {
                ${btn(undefined, 'primary')}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mclubs__secondary {
                ${btn()}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;

                &[hidden] { display: none; }
            }

            & .mclubs__link {
                color: ${t('text')};
                font-weight: 700;
                text-decoration: none;

                &:hover { text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${t('accent-strong')}; outline-offset: 2px; }
            }
        }
    `;

    private router = this.inject(Router);
    private crumbs = this.inject(BreadcrumbService);
    private clubs = this.inject(ClubsService);

    private createOpen = new Signal(false);
    private createBusy = new Signal(false);
    private createErrors = new Signal<ClubFieldErrors>({});
    private createFailure = new Signal<string | null>(null);

    private deleteOpen = new Signal(false);
    private deleteTarget = new Signal<ClubRow | null>(null);
    private deleteFailure = new Signal<string | null>(null);
    /**
     * The club whose delete is in flight, or null. `ConfirmComponent` closes on
     * confirm, so without this the DELETE runs against a list that looks idle:
     * on a slow link the row just sits there and the user presses Delete again.
     */
    private deletingId = new Signal<string | null>(null);

    private fields: ClubFieldsComponent | null = null;
    private searchInput: HTMLInputElement | null = null;

    /**
     * One live disposer per row key for the effect that keeps that row's Delete
     * button in step with `deletingId`.
     *
     * The table builds a row's actions inside `untrack()` — deliberately, so a
     * screen's signal reads cannot re-run the list — which means a signal read
     * in `rowActions` would never repaint. An effect created there does track
     * (`untrack` suspends the CURRENT computation only), but `rowActions` is
     * called again every time the row's data emits, so each call has to retire
     * the effect the previous one left behind or they accumulate for the life
     * of the screen.
     */
    private actionEffects = new Map<string, () => void>();

    private columns: ManageColumn<ClubRow>[] = [
        {
            key: 'name',
            header: 'Name',
            stackedLabel: false,
            cell: (row) => this.nameLink(row),
        },
        { key: 'location', header: 'Location', cell: (row) => row.location },
        { key: 'courses', header: 'Courses', type: 'numeric', cell: (row) => row.courseCount },
    ];

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            new: { onclick: () => this.openCreate() },

            searchLabel: { htmlFor: 'manage-clubs-search' },
            search: {
                id: 'manage-clubs-search',
                // Plain, not debounced: the filter is a pure array pass over a
                // list measured in tens of rows, so a delay would only make
                // typing feel laggy.
                oninput: (e: Event) => this.clubs.query.set((e.target as HTMLInputElement).value),
            },
            searchNote: {
                textContent: () => this.searchNote(),
                hidden: () => this.searchNote() === '',
            },

            createPanel: {
                hidden: () => !this.createOpen.get(),
                onsubmit: (e: Event) => {
                    e.preventDefault();
                    void this.create();
                },
            },
            createError: {
                textContent: () => this.createFailure.get() ?? '',
                hidden: () => this.createFailure.get() === null,
            },
            createSubmit: {
                textContent: () => (this.createBusy.get() ? 'Creating…' : 'Create club'),
                disabled: () => this.createBusy.get(),
            },
            createCancel: {
                disabled: () => this.createBusy.get(),
                onclick: () => this.closeCreate(),
            },

            loadError: {
                textContent: () => this.clubs.error.get() ?? '',
                hidden: () => this.clubs.error.get() === null,
            },
            retry: {
                hidden: () => this.clubs.error.get() === null,
                onclick: () => void this.clubs.load(true),
            },
            deleteError: {
                textContent: () => this.deleteFailure.get() ?? '',
                hidden: () => this.deleteFailure.get() === null,
            },
            loadingNote: {
                textContent: 'Loading clubs…',
                // Only before the first answer: a refetch after a write must
                // not blank the list out under the user.
                hidden: () => this.clubs.loaded.get(),
            },
        });

        this.searchInput = this.ref(frag, 'search') as HTMLInputElement;

        this.fields = this.spawn(ClubFieldsComponent, this.ref(frag, 'createFields'), {
            idPrefix: 'manage-club-new',
            errors: this.createErrors,
            busy: this.createBusy,
        });

        this.spawn(ManageTableComponent<ClubRow>, this.ref(frag, 'tableHost'), {
            columns: this.columns,
            rows: this.clubs.visible,
            rowKey: (row) => row.id,
            caption: 'Clubs',
            captionHidden: true,
            actions: (row) => this.rowActions(row),
            actionsHeader: 'Club actions',
            empty: {
                heading: () => (this.filtering() ? 'No clubs match that search' : 'No clubs yet'),
                body: () =>
                    this.filtering()
                        ? 'Try a shorter search, or clear it to see every club.'
                        : 'A club is the top of the catalog: create one, then add its courses.',
                action: {
                    // One action, two meanings — but the label always says which
                    // one it is, and the condition is the same one the heading
                    // above reads.
                    label: () => (this.filtering() ? 'Clear search' : 'New club'),
                    onclick: () => (this.filtering() ? this.clearSearch() : this.openCreate()),
                },
            },
        });

        this.spawn(
            ConfirmComponent,
            this.ref(frag, 'confirmHost'),
            destructiveConfirm({
                open: this.deleteOpen,
                title: () => {
                    const target = this.deleteTarget.get();
                    return target ? `Delete ${target.name}?` : 'Delete this club?';
                },
                consequence: () => this.deleteConsequence(),
                confirmLabel: 'Delete club',
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
        this.crumbs.set([{ label: 'Clubs' }]);
        // The first gated fetch of the session happens HERE — inside a section
        // the shell has already unlocked — and never at boot.
        void this.clubs.load();

        // Escape backs out of the create panel, the same exit the Cancel button
        // is. Not `closeOnEscape` — that helper is the CONFIRM dialog's, and a
        // second document-level listener would close the panel underneath a
        // delete dialog that was meant to swallow the key.
        const onKey = (e: KeyboardEvent): void => {
            if (e.key !== 'Escape') return;
            if (this.deleteOpen.get() || !this.createOpen.get()) return;
            this.closeCreate();
        };
        document.addEventListener('keydown', onKey);
        this.track(() => document.removeEventListener('keydown', onKey));
    }

    private nameLink(row: ClubRow): HTMLElement {
        const link = document.createElement('a');
        link.className = 'mclubs__link';
        link.href = BASE_PATH + clubPath(row.id);
        link.textContent = row.name;
        link.addEventListener('click', (e) => {
            // Leave the modified clicks to the browser — that is what they mean.
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            this.router.navigate(clubPath(row.id));
        });
        return link;
    }

    private rowActions(row: ClubRow): HTMLElement[] {
        const button = actionButton('Delete', {
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
                // Worded, never a spinner glyph (docs/design-guidelines.md §4).
                button.textContent = deleting === row.id ? 'Deleting…' : 'Delete';
                // Every row goes inert, not just the one being deleted: two
                // deletes in flight against one list is not a state this screen
                // has anything sensible to say about.
                button.disabled = deleting !== null;
            }),
        );

        return [button];
    }

    private filtering(): boolean {
        return this.clubs.query.get().trim() !== '';
    }

    private clearSearch(): void {
        this.clubs.query.set('');
        // The input's value is not bound to the signal (a bound input rewrites
        // itself mid-word), so clearing the filter clears the box by hand.
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchInput.focus();
        }
    }

    /** "3 of 12 clubs" — only while a filter is actually hiding something. */
    private searchNote(): string {
        if (!this.filtering()) return '';
        const shown = this.clubs.visible.get().length;
        const total = this.clubs.clubs.get().length;
        return `Showing ${shown} of ${total} clubs.`;
    }

    private openCreate(): void {
        this.resetCreate();
        this.createOpen.set(true);
        this.fields?.focusFirst();
    }

    private closeCreate(): void {
        this.createOpen.set(false);
        this.resetCreate();
    }

    private resetCreate(): void {
        this.createErrors.set({});
        this.createFailure.set(null);
        this.fields?.seed(emptyDraft());
    }

    private async create(): Promise<void> {
        if (this.createBusy.get() || !this.fields) return;

        const draft = this.fields.draft.get();
        const errors = validateClub(draft);
        this.createErrors.set(errors);
        if (hasErrors(errors)) {
            this.createFailure.set(null);
            // The caret goes to the first field that was complained about; the
            // Submit button is the wrong place to leave it once the form has
            // grown a message somewhere above.
            this.fields.focusInvalid(errors);
            return;
        }

        this.createBusy.set(true);
        this.createFailure.set(null);
        const outcome = await this.clubs.create(draft);
        this.createBusy.set(false);

        if (!outcome.ok) {
            // The panel stays open with the draft intact: what the user typed
            // must never be the price of a failed request.
            this.createFailure.set(outcome.message);
            return;
        }
        this.closeCreate();
    }

    private deleteConsequence(): string {
        const target = this.deleteTarget.get();
        return target
            ? deleteConsequence(target.name, target.courseCount)
            : DELETE_CONSEQUENCE_UNKNOWN;
    }

    private async remove(): Promise<void> {
        const target = this.deleteTarget.get();
        // Re-entry guard as well as a null guard — the dialog is gone by now,
        // but Enter on a still-focused row button is not.
        if (!target || this.deletingId.get() !== null) return;
        this.deleteFailure.set(null);
        this.deletingId.set(target.id);
        try {
            const outcome = await this.clubs.remove(target.id);
            // A refusal has to land somewhere the user is looking, and the
            // dialog has already closed itself by now — so it lands above the
            // list. It carries the CLUB'S NAME, because by the time it is read
            // the row it belongs to is one of several and the dialog that named
            // the club is gone.
            if (!outcome.ok) this.deleteFailure.set(`${target.name} — ${outcome.message}`);
        } finally {
            this.deletingId.set(null);
            this.deleteTarget.set(null);
        }
    }
}
