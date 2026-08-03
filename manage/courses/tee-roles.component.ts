import { Component, Computed, Signal, effect, template } from '@basics/core/client/core';
import { SelectComponent } from '@basics/core/client/ui/select';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { TABLE_MEDIA_NARROW, TABLE_MEDIA_WIDE } from '../breakpoint';
import { INFO_DOT_CSS, infoDotMarkup } from '../ui/info-dot';
import { closeOnEscape } from '../ui/confirm';
import { TeesService } from './tees.service';
import { TeeRolesService } from './tee-roles.service';
import { GENDERS, genderLabel, type Gender } from './tee-form';
import type { Tee } from '../../src/api/tees.gen';
import type { TeeRole } from '../../src/api/courses.gen';
import {
    NOT_SET,
    NOT_SET_LABEL,
    refusalCopy,
    resolveRole,
    resolutionSentence,
    teeOptions,
} from './tee-roles';

/*
 * The tee-role matrix (spec §3.6). Not a page: a component with a `courseId`
 * prop, mounted into the course page's `teeRolesHost`.
 *
 * ── The rows are DATA ──
 *
 * `tee_roles` is a server table. Every row of this matrix comes from
 * `GET /courses/tee-roles/catalog`, in the server's order, with the server's
 * display name — so adding a fourth role is an INSERT and not a release. There
 * is no role list, no label map and no `switch` on a role key anywhere in this
 * file. (`tee-roles.ts` names `'club'` once, inside the popover's explanation of
 * the resolution fallback; that is a documented behaviour of
 * `resolveDefaultTee`, not a row of this table.)
 *
 * ── Why a dropdown per cell, and not chips ──
 *
 * `docs/design-guidelines.md` §2: chips up to three or four options, a collapsed
 * dropdown beyond that. A course carries five or six tees and a real club
 * carries more, so chips would wrap into a block of colour words the width of
 * the page — twelve of them, since every cell would carry its own set. The
 * dropdown is also what says "this is one choice out of a list", which is
 * exactly what a mapping is.
 *
 * ── Why a hand-built grid rather than `ManageTableComponent` ──
 *
 * The table paints a cell by clearing its host and re-filling it whenever the
 * row's data changes (`paint()` in `ui/table.component.ts`). Every cell here is
 * PERMANENTLY an editor, not an occasionally-revealed one, so each repaint would
 * tear down a mounted `SelectComponent` mid-interaction and orphan its effects.
 * A keyed `$each` over the catalog reuses the row element instead, and the
 * selects mounted into it survive every mapping refetch.
 *
 * ── The coupling nobody expects ──
 *
 * Unticking a tee's rating for a gender DELETES every mapping naming that tee
 * for that gender, server-side, through a trigger (migration 059). No response
 * mentions it: the tee editor above returns a saved tee, and this matrix would
 * happily keep showing a mapping the database no longer holds. So the matrix
 * watches the tee list and refetches its mappings whenever a tee's ratings
 * change — see `watchTeeRatings` below.
 */

export type TeeRolesProps = {
    courseId: string;
};

/**
 * One cell's live state. `value` is what the dropdown shows; `synced` is what
 * the server is believed to hold.
 *
 * `synced` is a plain field and NOT a signal on purpose. It is the guard that
 * tells an echo apart from an edit: `SelectComponent` owns a signal rather than
 * firing an onchange, so every re-read of the server's answer arrives as a
 * `value.set()` that looks exactly like a user's pick. Comparing against a
 * tracked signal would make the write effect re-run when the guard moved, which
 * is the loop the guard exists to break.
 */
type Cell = {
    value: Signal<string>;
    /** A worded in-flight label, `''` when idle. Never a spinner alone. */
    busy: Signal<string>;
    /** The server's refusal — this surface's wording for the two it can cause. */
    error: Signal<string | null>;
};

const tpl = template(`
    <section class="mroles">
        <header class="mroles__head">
            <div class="mroles__heading">
                <div class="mroles__title-line">
                    <h2 class="mroles__title">Tee roles</h2>
                    ${infoDotMarkup('infoDot', 'How tee roles are used')}
                </div>
                <p class="mroles__lead">Which tee a round starts from when it asks for a role. Only tees rated for that gender can be chosen.</p>
            </div>
        </header>

        <div bind="info" class="mroles__info">
            <p class="mroles__info-lead">Round setup asks this course for a role and a gender, follows it to a tee, and copies that tee’s rating onto the round. The copy is taken when the round starts, so changing a row here changes new rounds only — scorecards already played keep the tee they were played from.</p>
            <p class="mroles__info-head">As this course stands today</p>
            <ul bind="resolutions" class="mroles__resolutions"></ul>
            <button bind="infoClose" class="mroles__secondary" type="button">Close</button>
        </div>

        <p bind="loadError" class="mroles__error" role="alert"></p>
        <button bind="retry" class="mroles__secondary" type="button">Try again</button>
        <p bind="loadingNote" class="mroles__note" role="status" aria-live="polite"></p>
        <p bind="noTees" class="mroles__note"></p>

        <div bind="grid" class="mroles__grid">
            <div class="mroles__grid-head">
                <span>Role</span>
                <span>Men</span>
                <span>Women</span>
            </div>
            <div bind="rows" class="mroles__rows"></div>
        </div>
    </section>
`);

const roleTpl = template(`
    <div class="mrole">
        <div bind="name" class="mrole__name"></div>
        <div class="mrole__cell">
            <span class="mrole__cell-label">Men</span>
            <div bind="men" class="mrole__control"></div>
            <p bind="menBusy" class="mrole__busy" role="status" aria-live="polite"></p>
            <p bind="menError" class="mrole__cell-error" role="alert"></p>
        </div>
        <div class="mrole__cell">
            <span class="mrole__cell-label">Women</span>
            <div bind="women" class="mrole__control"></div>
            <p bind="womenBusy" class="mrole__busy" role="status" aria-live="polite"></p>
            <p bind="womenError" class="mrole__cell-error" role="alert"></p>
        </div>
    </div>
`);

const resolutionTpl = template(`<li bind="line" class="mroles__resolution"></li>`);

export class TeeRolesComponent extends Component<TeeRolesProps> {
    static styles = `
        .mroles {
            display: flex;
            flex-direction: column;
            gap: ${t('manage-stack-gap')};
            min-width: 0;

            & .mroles__heading {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }

            & .mroles__title-line {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
            }

            & .mroles__title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.35rem;
                font-weight: 600;
                color: ${t('text')};
            }

            & .mroles__lead {
                margin: 0;
                max-width: 60ch;
                color: ${t('text-muted')};
                font-size: 0.9rem;
                line-height: 1.5;
            }

            & .mroles__note {
                margin: 0;
                color: ${t('text-muted')};
                font-size: 0.85rem;
                line-height: 1.5;
                max-width: 60ch;

                &[hidden] { display: none; }
            }

            & .mroles__error {
                margin: 0;
                color: ${t('danger')};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mroles__secondary {
                ${btn()}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;
                align-self: flex-start;

                &[hidden] { display: none; }
            }

            /* The popover. An inline panel rather than a floating layer: this
               is a desk surface with room, the content is several sentences of
               live data, and a layer would have to solve clipping inside the
               course page's scroll container for no gain.

               It grows with roles × genders — six lines and ~530px today, ten
               at five roles — so it is capped and scrolls inside itself. The cap
               is what keeps the ⓘ that opened it, and the row the reader was
               looking at, on screen when the list gets long. */
            & .mroles__info {
                ${card()}
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                padding: ${s('lg')};
                max-width: 70ch;
                max-height: min(60vh, 30rem);
                overflow-y: auto;
                overscroll-behavior: contain;

                &[hidden] { display: none; }
            }

            & .mroles__info-lead {
                margin: 0;
                color: ${t('text-muted')};
                font-size: 0.9rem;
                line-height: 1.55;
            }

            & .mroles__info-head {
                margin: ${s('xs')} 0 0;
                color: ${t('text')};
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 0.06em;
                text-transform: uppercase;
            }

            & .mroles__resolutions {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                margin: 0;
                padding: 0;
                list-style: none;
            }

            & .mroles__resolution {
                color: ${t('text')};
                font-size: 0.9rem;
                line-height: 1.5;
            }

            & .mroles__grid {
                display: flex;
                flex-direction: column;
                min-width: 0;

                &[hidden] { display: none; }
            }

            & .mroles__rows {
                display: flex;
                flex-direction: column;
            }

            & .mroles__grid-head {
                display: none;
            }

            & .mrole {
                display: grid;
                grid-template-columns: 1fr;
                gap: ${s('sm')};
                padding: ${s('md')} 0;
                border-top: 1px solid ${t('border')};
                min-width: 0;
            }

            & .mrole__name {
                color: ${t('text')};
                font-size: 0.95rem;
                font-weight: 700;
            }

            & .mrole__cell {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }

            & .mrole__cell-label {
                color: ${t('text-muted')};
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 0.06em;
                text-transform: uppercase;
            }

            /* The framework select is inline-block by default and would shrink
               to its own minimum inside the grid column. */
            & .mrole__control .ui-select {
                display: block;
                width: 100%;
                min-width: 0;
            }

            & .mrole__control .ui-select__trigger {
                min-height: ${t('manage-touch-target')};
                min-width: 0;
            }

            & .mrole__busy {
                margin: 0;
                color: ${t('text-muted')};
                font-size: 0.8rem;

                &[hidden] { display: none; }
            }

            & .mrole__cell-error {
                margin: 0;
                color: ${t('danger')};
                font-size: 0.8rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            /* Wide: real columns, with the gender said once in the header
               instead of twelve times in the cells. */
            @media ${TABLE_MEDIA_WIDE} {
                & .mroles__grid-head {
                    display: grid;
                    grid-template-columns: minmax(120px, 0.8fr) minmax(0, 1fr) minmax(0, 1fr);
                    gap: ${s('md')};
                    padding: ${s('sm')} 0;
                    color: ${t('manage-table-header-fg')};
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                }

                & .mrole {
                    grid-template-columns: minmax(120px, 0.8fr) minmax(0, 1fr) minmax(0, 1fr);
                    gap: ${s('md')};
                    align-items: start;
                }

                & .mrole__name {
                    padding-top: ${s('sm')};
                }

                & .mrole__cell-label {
                    display: none;
                }
            }

            /* Narrow: the row becomes a stack, so each control says which
               gender it is for. */
            @media ${TABLE_MEDIA_NARROW} {
                & .mrole {
                    gap: ${s('md')};
                }
            }
        }
        ${INFO_DOT_CSS}
    `;

    private tees = this.inject(TeesService);
    private roles = this.inject(TeeRolesService);

    private infoOpen = new Signal(false);

    /**
     * The popover's rows: every role × gender, men first.
     *
     * Only the PAIRS live here, never the sentence. `$each` is keyed and reuses
     * a row whose key is unchanged, so a precomputed sentence would be captured
     * once and then frozen — the popover would state the resolution as it stood
     * when it was first built and never move again. The sentence is a binding
     * on the row instead, which re-reads the mappings and tees as they change.
     */
    private roleGenders = new Computed(() =>
        this.roles.catalog.get().flatMap((role) =>
            GENDERS.map((gender) => ({ key: `${role.roleKey}:${gender}`, role, gender })),
        ),
    );

    /** The section element, kept for the popover's outside-click test. */
    private section: HTMLElement | null = null;

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            infoDot: {
                onclick: () => this.infoOpen.set(!this.infoOpen.get()),
                'aria-expanded': () => (this.infoOpen.get() ? 'true' : 'false'),
            },
            info: { hidden: () => !this.infoOpen.get() },
            infoClose: { onclick: () => this.infoOpen.set(false) },

            loadError: {
                textContent: () => this.roles.error.get() ?? '',
                hidden: () => this.roles.error.get() === null,
            },
            retry: {
                hidden: () => this.roles.error.get() === null,
                onclick: () => void this.roles.load(this.props.courseId, true),
            },
            loadingNote: {
                textContent: 'Loading tee roles…',
                hidden: () => this.roles.loaded.get(),
            },
            noTees: {
                textContent:
                    'No tee on this course carries a rating yet, so there is nothing to point a role at. Add a tee with a rating above and it will appear in these lists.',
                hidden: () => !this.settled() || this.hasRatedTee(),
            },
            grid: {
                hidden: () => !this.roles.loaded.get() || this.roles.catalog.get().length === 0,
            },
        });

        this.$each(
            this.ref(frag, 'resolutions'),
            this.roleGenders,
            (item, _index, track) =>
                this.wireEl(
                    resolutionTpl,
                    { line: () => this.sentenceFor(item.role, item.gender) },
                    track,
                ),
            (item) => item.key,
        );

        // Keyed by role key, so a mapping refetch re-emits the same rows and the
        // mounted selects are reused rather than rebuilt.
        this.$each(
            this.ref(frag, 'rows'),
            this.roles.catalog,
            (role, _index, track) => this.roleRow(role, track),
            (role) => role.roleKey,
        );

        this.section = frag.firstElementChild as HTMLElement;
        return frag;
    }

    override onMount(): void {
        const { courseId } = this.props;
        // Both are load-once and shared with the tees editor beside this one, so
        // whichever mounts first pays and the other rides along.
        void this.tees.load(courseId);
        void this.roles.load(courseId);

        this.track(closeOnEscape(this.infoOpen));

        // A click anywhere outside the panel closes it, the way every other
        // "aside" on either client behaves. `pointerdown` rather than `click` so
        // a press that starts outside cannot land on a control underneath.
        const onOutside = (event: Event) => {
            if (!this.infoOpen.get()) return;
            const target = event.target;
            if (target instanceof Node && this.section?.contains(target)) return;
            this.infoOpen.set(false);
        };
        document.addEventListener('pointerdown', onOutside, true);
        this.track(() => document.removeEventListener('pointerdown', onOutside, true));

        this.watchTeeRatings(courseId);
    }

    /**
     * The coupling warning, made harmless.
     *
     * Migration 059 hangs an `AFTER DELETE ON tee_ratings` trigger that clears
     * every `course_tee_roles` row naming that tee and gender. So saving a tee
     * with a gender unticked silently empties cells here, and nothing in that
     * response says so. This watches the tee list — the same service the tee
     * editor writes through, which refetches after every write — and re-reads
     * the mappings whenever a tee's ratings (or the set of tees) change.
     *
     * The signature is compared rather than the array identity, and the FIRST
     * settled list is recorded without a fetch: mount already loads the mappings
     * once, and a refetch there would double every cold page load.
     *
     * Deliberately NOT done by having `TeesService` invalidate this service: a
     * tee write would then fire a tee-roles request from a component that may
     * not be mounted, and the dependency would point from the older, more
     * general service at the newer one.
     */
    private watchTeeRatings(courseId: string): void {
        let signature: string | null = null;
        this.track(
            effect(() => {
                if (!this.tees.loaded.get()) return;
                const next = ratingSignature(this.tees.tees.get());
                if (signature === null || next === signature) {
                    signature = next;
                    return;
                }
                signature = next;
                void this.roles.load(courseId, true);
            }),
        );
    }

    private roleRow(role: TeeRole, track: (dispose: () => void) => void): HTMLElement {
        const men = this.cell(role.roleKey, 'M', track);
        const women = this.cell(role.roleKey, 'F', track);

        const el = this.wireEl(
            roleTpl,
            {
                name: () => role.displayName,
                menBusy: {
                    textContent: () => men.busy.get(),
                    hidden: () => men.busy.get() === '',
                },
                menError: {
                    textContent: () => men.error.get() ?? '',
                    hidden: () => men.error.get() === null,
                },
                womenBusy: {
                    textContent: () => women.busy.get(),
                    hidden: () => women.busy.get() === '',
                },
                womenError: {
                    textContent: () => women.error.get() ?? '',
                    hidden: () => women.error.get() === null,
                },
            },
            track,
        );

        this.mountSelect(this.ref(el, 'men'), men, role, 'M', track);
        this.mountSelect(this.ref(el, 'women'), women, role, 'F', track);
        return el;
    }

    private mountSelect(
        host: HTMLElement,
        cell: Cell,
        role: TeeRole,
        gender: Gender,
        track: (dispose: () => void) => void,
    ): void {
        const child = new SelectComponent({
            value: cell.value,
            options: { get: () => teeOptions(this.tees.tees.get(), gender) },
            // Only reachable if a mapping outlives the tee it names; the empty
            // choice is a real option, so the ordinary empty cell reads "Not set".
            placeholder: NOT_SET_LABEL,
            disabled: { get: () => cell.busy.get() !== '' },
        });
        child.mount(host);
        track(() => child.destroy());

        // Which cell this is, for a reader who meets the trigger on its own:
        // above the table breakpoint the visible per-cell label is dropped in
        // favour of one column header, and twelve triggers all reading "Not set"
        // would say nothing.
        host.querySelector('.ui-select__trigger')
            ?.setAttribute('aria-label', `${role.displayName}, ${genderLabel(gender)}`);
    }

    /**
     * One cell, wired both ways.
     *
     * Read: the server's mapping flows into the dropdown whenever the mappings
     * signal moves — the first load, a refetch after a write, or the trigger
     * cascade above.
     *
     * Write: a change the USER made is committed. The `synced` guard is what
     * tells the two apart, and it is what makes a refused write settle: the
     * revert moves `synced` and `value` to the same figure — the server's
     * current one — so the write effect sees no edit and the cell stops rather
     * than retrying forever.
     */
    private cell(roleKey: string, gender: Gender, track: (dispose: () => void) => void): Cell {
        const value = new Signal(this.roles.mappedTeeId(roleKey, gender));
        const busy = new Signal('');
        const error = new Signal<string | null>(null);
        let synced = value.get();

        track(
            effect(() => {
                const stored = this.roles.mappedTeeId(roleKey, gender);
                synced = stored;
                value.set(stored);
                // A refusal describes the mappings as they were when it was
                // refused. Any new list — a neighbouring write's refetch, or the
                // rating-cascade refetch, which is also what a change to this
                // cell's OPTIONS goes through — has answered the question the
                // sentence was about, so it stops being true and goes.
                error.set(null);
            }),
        );

        const commit = async (teeId: string): Promise<void> => {
            busy.set(teeId === NOT_SET ? 'Clearing…' : 'Saving…');
            error.set(null);
            const outcome =
                teeId === NOT_SET
                    ? await this.roles.clearRole(roleKey, gender)
                    : await this.roles.setRole(roleKey, gender, teeId);
            busy.set('');
            if (outcome.ok) return;

            // Refused. Fall back to what the server holds NOW, re-read rather
            // than snapshotted before the await: a refetch may have landed while
            // this write was in flight (a neighbouring cell's write, or the
            // rating cascade), and reverting to the pre-await value would put a
            // stale mapping back on screen — and, because `synced` would then
            // hold it too, the echo guard would suppress every correcting write
            // until the next load.
            const stored = this.roles.mappedTeeId(roleKey, gender);
            error.set(refusalCopy(outcome.message, gender));
            synced = stored;
            value.set(stored);
        };

        track(
            effect(() => {
                const next = value.get();
                if (next === synced) return;
                // Out of the effect flush: committing here would run a write
                // (and, on failure, a `value.set`) inside the notification that
                // is still delivering this change.
                queueMicrotask(() => {
                    if (value.get() === next && next !== synced) void commit(next);
                });
            }),
        );

        return { value, busy, error };
    }

    /** What a round would do with this role today, said as a sentence. */
    private sentenceFor(role: TeeRole, gender: Gender): string {
        return resolutionSentence(
            role,
            gender,
            resolveRole(this.tees.tees.get(), this.roles.mappings.get(), role.roleKey, gender),
        );
    }

    private settled(): boolean {
        return this.roles.loaded.get() && this.tees.loaded.get();
    }

    private hasRatedTee(): boolean {
        return this.tees.tees.get().some((tee) => tee.ratings.length > 0);
    }
}

/**
 * What about the tee list can invalidate a mapping: which tees exist, and which
 * genders each is rated for. A rename or a length edit cannot orphan a mapping,
 * and re-reading on one would spend a request on every keystroke-sized save.
 */
function ratingSignature(tees: Tee[]): string {
    return tees
        .map(
            (tee) =>
                `${tee.id}:${tee.ratings
                    .map((rating) => rating.gender)
                    .sort()
                    .join('')}`,
        )
        .join('|');
}
