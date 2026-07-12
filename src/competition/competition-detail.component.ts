import {
    Component,
    Computed,
    Router,
    Signal,
    effect,
    template,
    untrack,
} from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { api } from '../api';
import { CompetitionsService, isAdmin } from './competitions.service';
import { FormatCatalogService } from '../create/format-catalog.service';
import { AggregationCatalogService, type AggregationDescriptor } from './aggregation-catalog.service';
import { FriendsService } from '../friends/friends.service';
import { ProfileService } from '../profile/profile.service';
import {
    canAddRounds,
    canEditSetup,
    lifecycleClass,
    lifecycleLabel,
    nextTransition,
    type Lifecycle,
} from './lifecycle';
import { renderAggregatedBoard, renderResultsBoard, type RoundColumn } from './aggregated-board';
import { esc } from '../round/result-render';
import type { Course } from '../api/courses.gen';
import type { Tee } from '../api/tees.gen';
import type { CutOutcome } from '../api/competitions.gen';

// Phase 4 Slice 5 — the competition detail screen (`/competition?id=…`). One
// screen, several sections: header + lifecycle, admin setup (defaults +
// aggregation + cut rules), roster, rounds (each opens the EXISTING round UI
// via its share token, unchanged), the aggregated board (live) / official
// results (finalized), and the irreversible admin actions (cut, finalize).
// Every server refusal is rendered verbatim; admin controls are gated on the
// admin signal (owner id or a round's admin-only share token).

const STATUS_TEXT: Record<string, string> = {
    not_started: 'Not started',
    active: 'Live',
    complete: 'Finished',
};

/** One aggregation config-editor field (from the server descriptor). */
type AggField = NonNullable<AggregationDescriptor['configFields']>[number];

const tpl = template(`
    <div class="cd">
        <button bind="back" class="cd__back" type="button">← Competitions</button>

        <div bind="loading" class="cd__loading">Loading…</div>
        <div bind="loadErr" class="cd__loaderr"></div>

        <div bind="body" class="cd__body">
            <header class="cd__head">
                <div class="cd__titlerow">
                    <h1 bind="name"></h1>
                    <span bind="chip"></span>
                </div>
                <p bind="ownerLine" class="cd__owner"></p>
            </header>

            <p bind="mutateErr" class="cd__err"></p>

            <div bind="transitionRow" class="cd__transition">
                <button bind="transitionBtn" type="button"></button>
            </div>

            <!-- Setup (admin, draft/setup only) -->
            <section bind="setupSection" class="cd__section cd__setup">
                <div class="cd__section-head">
                    <h2>Setup</h2>
                    <button bind="setupToggle" class="cd__linkbtn" type="button"></button>
                </div>
                <div bind="setupSummary" class="cd__summary"></div>
                <div bind="setupForm" class="cd__form">
                    <label class="cd__field">
                        <span>Name</span>
                        <input bind="nameInput" />
                    </label>

                    <div class="cd__field">
                        <span>Format slots</span>
                        <div bind="slotList" class="cd__slots"></div>
                        <div class="cd__addrow">
                            <select bind="formatPick"></select>
                            <button bind="addSlot" type="button">Add slot</button>
                        </div>
                    </div>

                    <label class="cd__field">
                        <span>Scoring (aggregation)</span>
                        <select bind="aggPick"></select>
                    </label>
                    <p bind="aggDesc" class="cd__aggdesc"></p>
                    <div bind="aggFields" class="cd__aggfields"></div>

                    <label class="cd__field">
                        <span>Course (for default tee + new rounds)</span>
                        <select bind="coursePick"></select>
                    </label>
                    <label class="cd__field">
                        <span>Default tee</span>
                        <select bind="teePick"></select>
                    </label>
                    <label class="cd__field">
                        <span>Start list</span>
                        <select bind="startListPick">
                            <option value="single_group">One group</option>
                            <option value="foursomes">Foursomes</option>
                        </select>
                    </label>

                    <div class="cd__field">
                        <span>Cut (optional)</span>
                        <div class="cd__cutrow">
                            <input bind="cutAfter" inputmode="numeric" placeholder="after round" />
                            <select bind="cutTypePick">
                                <option value="">no cut</option>
                                <option value="top_n">Top N</option>
                                <option value="top_percent">Top %</option>
                                <option value="within_strokes">Within strokes</option>
                            </select>
                            <input bind="cutValue" inputmode="numeric" placeholder="value" />
                        </div>
                    </div>

                    <div class="cd__formactions">
                        <button bind="saveSetup" type="button">Save setup</button>
                        <button bind="cancelSetup" class="cd__linkbtn" type="button">Cancel</button>
                    </div>
                </div>
            </section>

            <!-- Roster -->
            <section class="cd__section">
                <div class="cd__section-head"><h2>Players</h2><span bind="rosterCount" class="cd__count"></span></div>
                <div bind="rosterEmpty" class="cd__empty">No players yet.</div>
                <div bind="roster" class="cd__roster"></div>

                <div bind="rosterAdd" class="cd__rosteradd">
                    <div class="cd__addfriends">
                        <span class="cd__sublabel">Add from friends</span>
                        <div bind="friendPick" class="cd__friendpick"></div>
                    </div>
                    <form bind="guestForm" class="cd__guestform">
                        <span class="cd__sublabel">Add a guest</span>
                        <div class="cd__guestrow">
                            <input bind="guestName" placeholder="Name" />
                            <select bind="guestGender">
                                <option value="M">M</option>
                                <option value="F">F</option>
                            </select>
                            <input bind="guestHcp" inputmode="decimal" placeholder="HCP" />
                            <button bind="addGuest" type="submit">Add</button>
                        </div>
                    </form>
                </div>
            </section>

            <!-- Rounds -->
            <section class="cd__section">
                <div class="cd__section-head"><h2>Rounds</h2></div>
                <div bind="roundsEmpty" class="cd__empty">No rounds yet.</div>
                <div bind="rounds" class="cd__rounds"></div>

                <form bind="addRoundForm" class="cd__addround">
                    <span class="cd__sublabel">Add a round</span>
                    <div class="cd__addroundrow">
                        <select bind="roundCoursePick"></select>
                        <input bind="roundDate" type="date" />
                        <button bind="addRound" type="submit">Add round</button>
                    </div>
                </form>
            </section>

            <!-- Admin actions -->
            <section bind="adminActions" class="cd__section cd__admin">
                <div class="cd__section-head"><h2>Admin</h2></div>
                <div bind="cutOutcome" class="cd__cutoutcome"></div>
                <div class="cd__adminbtns">
                    <button bind="applyCut" class="cd__cutbtn" type="button">Apply cut</button>
                    <button bind="finalize" class="cd__finalbtn" type="button">Finalize</button>
                </div>
                <p class="cd__adminnote">Finalizing freezes the results — it can't be undone.</p>
            </section>

            <!-- Board / results -->
            <section class="cd__section">
                <div class="cd__section-head"><h2 bind="boardTitle">Leaderboard</h2></div>
                <div bind="setSwitch" class="cd__setswitch"></div>
                <div bind="board" class="cd__board"></div>
                <div bind="boardRefusal" class="cd__empty"></div>
            </section>

            <div bind="confirmHost"></div>
            <div bind="finalizeHost"></div>
        </div>
    </div>
`);

export class CompetitionDetailComponent extends Component {
    static styles = `
        .cd {
            padding: ${s('lg')} ${s('lg')} ${s('2xl')};

            & .cd__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 700; color: ${t('accent')};
                cursor: pointer; padding: 0 0 ${s('md')};
            }
            & .cd__loading, & .cd__loaderr {
                color: ${t('text-muted')}; padding: ${s('lg')} 0;
                &.hidden { display: none; }
            }
            & .cd__loaderr { color: ${t('error')}; }
            & .cd__body.hidden { display: none; }

            & .cd__head { margin-bottom: ${s('md')}; }
            & .cd__titlerow { display: flex; align-items: center; gap: ${s('md')}; }
            & .cd__head h1 {
                margin: 0; font-family: ${t('font-display')}; font-weight: 600;
                font-size: 1.7rem; letter-spacing: -0.02em;
            }
            & .cd__owner { margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.85rem; }

            & .comp-chip {
                flex-shrink: 0; font-size: 0.7rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.08em;
                border-radius: ${t('radius-pill')}; padding: 2px 10px;
                background: ${t('surface-sunken')}; color: ${t('text-muted')};
                &.comp-chip--setup { background: ${t('accent-soft')}; color: ${t('accent')}; }
                &.comp-chip--active { background: ${t('primary')}; color: ${t('primary-text')}; }
                &.comp-chip--finalized { background: ${t('accent')}; color: ${t('topbar-bg')}; }
            }

            & .cd__err {
                margin: 0 0 ${s('md')}; font-size: 0.85rem; color: ${t('error')};
                &:empty { display: none; }
            }

            & .cd__transition {
                margin-bottom: ${s('lg')};
                &.hidden { display: none; }
                & button {
                    padding: ${s('md')} ${s('lg')}; font-family: inherit;
                    font-size: 0.95rem; font-weight: 700; ${btn()}
                    background: ${t('primary')}; color: ${t('primary-text')}; border: none;
                    &:disabled { opacity: 0.5; }
                }
            }

            & .cd__section {
                margin-bottom: ${s('xl')};
                &.hidden { display: none; }
            }
            & .cd__section-head {
                display: flex; align-items: baseline; gap: ${s('sm')};
                margin-bottom: ${s('sm')};
                & h2 {
                    margin: 0; font-family: ${t('font-display')};
                    font-weight: 600; font-size: 1.2rem;
                }
                & .cd__count { color: ${t('text-muted')}; font-size: 0.85rem; }
            }
            & .cd__linkbtn {
                margin-left: auto; background: none; border: none; font-family: inherit;
                font-size: 0.85rem; font-weight: 700; color: ${t('accent')}; cursor: pointer;
            }
            & .cd__summary {
                ${card()} padding: ${s('md')} ${s('lg')};
                font-size: 0.85rem; color: ${t('text-muted')}; line-height: 1.5;
                &.hidden { display: none; }
            }
            & .cd__empty { color: ${t('text-muted')}; font-size: 0.9rem; padding: ${s('sm')} 0;
                &.hidden { display: none; } &:empty { display: none; } }

            & .cd__form {
                ${card()} padding: ${s('lg')};
                display: flex; flex-direction: column; gap: ${s('md')};
                &.hidden { display: none; }
                & .cd__field { display: flex; flex-direction: column; gap: ${s('xs')};
                    & > span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
                        letter-spacing: 0.05em; color: ${t('text-muted')}; }
                    & input, & select { padding: ${s('sm')} ${s('md')}; font-size: 0.95rem; ${input()} }
                }
                & .cd__aggdesc { margin: 0; font-size: 0.8rem; color: ${t('text-muted')}; &:empty { display: none; } }
                & .cd__aggfields { display: flex; flex-direction: column; gap: ${s('md')}; &:empty { display: none; } }
                & .cd__cutrow, & .cd__addrow { display: flex; gap: ${s('sm')}; }
                & .cd__cutrow input { width: 33%; }
                & .cd__addrow select { flex: 1; }
                & .cd__slots { display: flex; flex-direction: column; gap: ${s('xs')}; }
                & .cd__formactions { display: flex; align-items: center; gap: ${s('md')}; margin-top: ${s('sm')}; }
                & button[bind="addSlot"], & button[bind="saveSetup"] {
                    padding: ${s('sm')} ${s('md')}; font-family: inherit; font-weight: 700;
                    ${btn()} background: ${t('primary')}; color: ${t('primary-text')}; border: none;
                }
            }
            & .cd__slot {
                display: flex; align-items: center; justify-content: space-between;
                padding: ${s('xs')} ${s('sm')}; background: ${t('surface-sunken')};
                border-radius: ${t('radius-sm')}; font-size: 0.9rem; font-weight: 600;
                & button { background: none; border: none; color: ${t('error')}; cursor: pointer; font-size: 1.1rem; }
            }

            & .cd__roster { display: flex; flex-direction: column; gap: ${s('xs')}; margin-bottom: ${s('md')}; }
            & .cd__rosterrow {
                display: flex; align-items: center; gap: ${s('sm')};
                padding: ${s('sm')} ${s('md')}; ${card()}
                & .cd__rname { font-weight: 700; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                & .cd__rcat, & .cd__rout {
                    font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
                    border-radius: ${t('radius-pill')}; padding: 1px 8px;
                }
                & .cd__rcat { background: ${t('accent-soft')}; color: ${t('accent')}; }
                & .cd__rout { background: ${t('surface-sunken')}; color: ${t('text-muted')}; }
                & .cd__ract { background: none; border: none; cursor: pointer; color: ${t('text-muted')};
                    font-size: 0.75rem; font-weight: 700; }
                & .cd__ract--danger { color: ${t('error')}; }
            }
            & .cd__rosteradd, & .cd__addround { &.hidden { display: none; } }
            & .cd__sublabel { display: block; font-size: 0.75rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.05em; color: ${t('text-muted')};
                margin: ${s('md')} 0 ${s('xs')}; }
            & .cd__friendpick { display: flex; flex-wrap: wrap; gap: ${s('xs')}; }
            & .cd__friendchip {
                padding: ${s('xs')} ${s('md')}; ${btn()} font-family: inherit;
                font-size: 0.85rem; font-weight: 600; cursor: pointer;
                &:disabled { opacity: 0.4; }
            }
            & .cd__guestrow, & .cd__addroundrow { display: flex; gap: ${s('sm')}; }
            & .cd__guestrow input, & .cd__addroundrow input, & .cd__addroundrow select {
                padding: ${s('sm')} ${s('md')}; font-size: 0.9rem; ${input()} min-width: 0; }
            & .cd__guestrow input[bind="guestName"] { flex: 1; }
            & .cd__guestrow input[bind="guestHcp"] { width: 4.5rem; }
            & .cd__guestrow select { width: 3.5rem; }
            & .cd__addroundrow select { flex: 1; }
            & .cd__guestrow button, & .cd__addroundrow button {
                padding: ${s('sm')} ${s('md')}; font-family: inherit; font-weight: 700;
                ${btn()} background: ${t('primary')}; color: ${t('primary-text')}; border: none; }

            & .cd__rounds { display: flex; flex-direction: column; gap: ${s('xs')}; }
            & .cd__roundrow {
                display: flex; align-items: center; gap: ${s('md')};
                padding: ${s('md')} ${s('lg')}; ${card({ hover: true })}
                text-align: left; font-family: inherit; width: 100%; cursor: pointer;
                &:disabled { cursor: default; opacity: 0.75; }
                & .cd__rnum { font-weight: 700; }
                & .cd__rmeta { color: ${t('text-muted')}; font-size: 0.85rem; flex: 1; }
                & .cd__rstatus {
                    font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.06em; border-radius: ${t('radius-pill')}; padding: 2px 10px;
                    background: ${t('surface-sunken')}; color: ${t('text-muted')};
                    &.s-active { background: ${t('accent-soft')}; color: ${t('accent')}; }
                }
            }

            & .cd__admin.hidden { display: none; }
            & .cd__adminbtns { display: flex; gap: ${s('md')}; }
            & .cd__adminbtns button {
                padding: ${s('md')} ${s('lg')}; font-family: inherit; font-weight: 700; ${btn()}
            }
            & .cd__cutbtn { background: ${t('accent-soft')}; color: ${t('accent')}; border-color: ${t('accent')}; }
            & .cd__finalbtn { background: ${t('error')}; color: #fff; border: none; }
            & .cd__adminnote { margin: ${s('sm')} 0 0; font-size: 0.8rem; color: ${t('text-muted')}; }
            & .cd__cutoutcome { &:empty { display: none; } margin-bottom: ${s('md')}; font-size: 0.85rem;
                ${card()} padding: ${s('md')} ${s('lg')}; }
            & .cd__cutoutcome .cd__cutgrp { margin-bottom: ${s('xs')}; }
            & .cd__cutoutcome strong { color: ${t('text')}; }

            & .cd__setswitch { display: flex; gap: ${s('xs')}; margin-bottom: ${s('sm')};
                &:empty { display: none; }
                & button {
                    padding: ${s('xs')} ${s('md')}; ${btn()} font-family: inherit;
                    font-size: 0.85rem; font-weight: 700; cursor: pointer;
                    &.on { background: ${t('primary')}; color: ${t('primary-text')}; border-color: ${t('primary')}; }
                }
            }

            /* --- aggregated / official board --- */
            & .cd__board { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            & .cd__official-banner {
                ${card()} padding: ${s('sm')} ${s('lg')}; margin-bottom: ${s('sm')};
                background: ${t('accent-soft')}; color: ${t('accent')};
                font-weight: 700; font-size: 0.85rem;
                border-color: ${t('accent')};
            }
            & .cb-head { display: flex; align-items: baseline; gap: ${s('sm')}; margin-bottom: ${s('sm')}; }
            & .cb-head__title { margin: 0; font-family: ${t('font-display')}; font-weight: 600; font-size: 1rem; }
            & .cb-head__op, & .cb-head__hint { font-size: 0.75rem; color: ${t('text-muted')}; }
            & .cb-empty { color: ${t('text-muted')}; padding: ${s('md')} 0; }
            & table.cb {
                width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums;
            }
            & .cb.cb--official { box-shadow: inset 0 0 0 2px ${t('accent')}; border-radius: ${t('radius')}; }
            & .cb thead th {
                font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em;
                color: ${t('text-muted')}; font-weight: 700; padding: ${s('xs')} ${s('sm')};
                border-bottom: 1px solid ${t('border')}; text-align: center;
            }
            & .cb th.cb-who, & .cb td.cb-who { text-align: left; }
            & .cb tbody td { padding: ${s('sm')}; border-bottom: 1px solid ${t('border')};
                text-align: center; font-size: 0.9rem; }
            & .cb .cb-pos { width: 2rem; color: ${t('text-muted')}; font-weight: 700; }
            & .cb .cb-who { min-width: 0; }
            & .cb .cb-who__line { display: flex; align-items: baseline; gap: ${s('xs')}; min-width: 0; }
            & .cb .cb-name { font-weight: 700; font-family: ${t('font-display')};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
            & .cb .cb-arith { font-size: 0.72rem; color: ${t('text-muted')}; margin-top: 1px;
                font-variant-numeric: tabular-nums; }
            & .cb .cb-arith s { opacity: 0.7; }
            & .cb .cb-arith__total { font-weight: 700; color: ${t('text')}; }
            & .cb .cb-tag { font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.05em; border-radius: ${t('radius-pill')}; padding: 1px 7px; flex-shrink: 0; }
            & .cb .cb-cat { background: ${t('accent-soft')}; color: ${t('accent')}; }
            & .cb .cb-tag--out { background: ${t('surface-sunken')}; color: ${t('text-muted')}; }
            & .cb .cb-c--dropped { color: ${t('text-muted')}; }
            & .cb .cb-c--dropped s { opacity: 0.8; }
            & .cb .cb-c--missing, & .cb .cb-c--cut { color: ${t('text-muted')}; }
            & .cb .cb-c--divider { border-left: 2px solid ${t('accent')}; }
            & .cb .cb-total { font-weight: 800; font-size: 1rem; }
            & .cb .cb-points { font-weight: 800; color: ${t('accent')}; }
            & .cb tr.cb-row--lead td { background: ${t('accent-soft')}; }
            & .cb tr.cb-row--cut td, & .cb tr.cb-row--withdrawn td {
                color: ${t('text-muted')}; background: ${t('surface-sunken')}; opacity: 0.85; }
        }
    `;

    private svc = this.inject(CompetitionsService);
    private catalog = this.inject(FormatCatalogService);
    private aggCatalog = this.inject(AggregationCatalogService);
    private friends = this.inject(FriendsService);
    private profile = this.inject(ProfileService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    // Local editor drafts (seeded on "Edit" click from the loaded detail — read
    // in an event handler, never a field initializer, so no $swap refetch loop).
    private editingSetup = new Signal(false);
    private nameDraft = new Signal('');
    private slotDraft = new Signal<string[]>([]);
    // Selected aggregation strategy id (a catalog value at runtime — never a
    // hardcoded literal; the ratchet forbids strategy-id literals in the client)
    // + the generic config field values keyed by the descriptor's field keys.
    private aggStrategy = new Signal('');
    private aggConfig = new Signal<Record<string, string>>({});
    private startListDraft = new Signal<'single_group' | 'foursomes'>('single_group');
    private courseDraft = new Signal('');
    private teeDraft = new Signal('');
    private cutAfterDraft = new Signal('');
    private cutTypeDraft = new Signal('');
    private cutValueDraft = new Signal('');
    private formatPickDraft = new Signal('');

    // Roster add drafts
    private guestNameDraft = new Signal('');
    private guestGenderDraft = new Signal<'M' | 'F'>('M');
    private guestHcpDraft = new Signal('');

    // Add-round drafts
    private roundCourseDraft = new Signal('');
    private roundDateDraft = new Signal('');

    // Reference data
    private courses = new Signal<Course[]>([]);
    private tees = new Signal<Tee[]>([]);
    private coursesLoaded = false;

    // Finalized results set switcher + cut outcome summary
    private resultSetIdx = new Signal(0);
    private cutOutcome = new Signal<CutOutcome | null>(null);

    // Confirm dialogs
    private cutConfirmOpen = new Signal(false);
    private finalizeConfirmOpen = new Signal(false);

    private admin = new Computed(() =>
        isAdmin(this.svc.detail.get(), this.profile.player.get()?.id ?? null),
    );
    private lifecycle = new Computed<Lifecycle>(
        () => (this.svc.detail.get()?.lifecycle ?? 'draft') as Lifecycle,
    );

    render(): DocumentFragment {
        // Load once + react to the id query changing (navigating between
        // competitions keeps this component mounted; $swap won't remount it).
        // The load itself is untracked so its internal signal writes don't
        // re-trigger this effect (the $swap/refetch footgun).
        const idSig = this.router.query('id');
        this.track(
            effect(() => {
                const id = idSig.get();
                if (id) untrack(() => void this.svc.loadDetail(id));
            }),
        );
        if (this.auth.currentUser.get()) void this.profile.load();
        void this.catalog.load();
        void this.aggCatalog.load();
        this.loadCourses();

        const id = () => idSig.get() ?? '';
        const detail = () => this.svc.detail.get();

        const frag = this.wire(tpl, {
            back: { onclick: () => this.router.navigate('/competitions') },
            loading: {
                className: () =>
                    this.svc.detailLoading.get() && detail() === null
                        ? 'cd__loading'
                        : 'cd__loading hidden',
            },
            loadErr: {
                textContent: () => this.svc.detailError.get()?.message ?? '',
                className: () => (this.svc.detailError.get() ? 'cd__loaderr' : 'cd__loaderr hidden'),
            },
            body: { className: () => (detail() ? 'cd__body' : 'cd__body hidden') },
            name: () => detail()?.name ?? '',
            chip: {
                textContent: () => lifecycleLabel(this.lifecycle.get()),
                className: () => lifecycleClass(this.lifecycle.get()),
            },
            ownerLine: {
                textContent: () =>
                    this.admin.get() ? 'You administer this competition.' : 'Read-only view.',
            },
            mutateErr: { textContent: () => this.svc.mutateError.get() ?? '' },

            // Lifecycle transition
            transitionRow: {
                className: () =>
                    this.admin.get() && nextTransition(this.lifecycle.get())
                        ? 'cd__transition'
                        : 'cd__transition hidden',
            },
            transitionBtn: {
                textContent: () => nextTransition(this.lifecycle.get())?.label ?? '',
                disabled: () => this.svc.mutating.get(),
                onclick: () => {
                    const next = nextTransition(this.lifecycle.get());
                    if (next) void this.svc.transition(id(), next.to);
                },
            },

            // --- Setup section ---
            setupSection: {
                className: () =>
                    this.admin.get() && canEditSetup(this.lifecycle.get())
                        ? 'cd__section cd__setup'
                        : 'cd__section cd__setup hidden',
            },
            setupToggle: {
                textContent: () => (this.editingSetup.get() ? 'Close' : 'Edit'),
                onclick: () => {
                    if (this.editingSetup.get()) this.editingSetup.set(false);
                    else this.seedEditor();
                },
            },
            setupSummary: {
                className: () => (this.editingSetup.get() ? 'cd__summary hidden' : 'cd__summary'),
                innerHTML: () => this.setupSummaryHtml(),
            },
            setupForm: {
                className: () => (this.editingSetup.get() ? 'cd__form' : 'cd__form hidden'),
            },
            nameInput: {
                value: () => this.nameDraft.get(),
                oninput: (e: Event) => this.nameDraft.set((e.target as HTMLInputElement).value),
            },
            formatPick: {
                value: () => this.formatPickDraft.get(),
                onchange: (e: Event) => this.formatPickDraft.set((e.target as HTMLSelectElement).value),
            },
            addSlot: {
                onclick: () => {
                    const f = this.formatPickDraft.get() || this.catalog.descriptors.get()[0]?.id;
                    if (f) this.slotDraft.set([...this.slotDraft.get(), f]);
                },
            },
            aggPick: {
                value: () => this.aggStrategy.get(),
                onchange: (e: Event) => this.selectStrategy((e.target as HTMLSelectElement).value),
            },
            aggDesc: {
                textContent: () => this.aggCatalog.byId(this.aggStrategy.get())?.description ?? '',
            },
            coursePick: {
                value: () => this.courseDraft.get(),
                onchange: (e: Event) => {
                    const v = (e.target as HTMLSelectElement).value;
                    this.courseDraft.set(v);
                    this.teeDraft.set('');
                    void this.loadTees(v);
                },
            },
            teePick: {
                value: () => this.teeDraft.get(),
                onchange: (e: Event) => this.teeDraft.set((e.target as HTMLSelectElement).value),
            },
            startListPick: {
                value: () => this.startListDraft.get(),
                onchange: (e: Event) =>
                    this.startListDraft.set(
                        (e.target as HTMLSelectElement).value as 'single_group' | 'foursomes',
                    ),
            },
            cutAfter: {
                value: () => this.cutAfterDraft.get(),
                oninput: (e: Event) => this.cutAfterDraft.set((e.target as HTMLInputElement).value),
            },
            cutTypePick: {
                value: () => this.cutTypeDraft.get(),
                onchange: (e: Event) => this.cutTypeDraft.set((e.target as HTMLSelectElement).value),
            },
            cutValue: {
                value: () => this.cutValueDraft.get(),
                oninput: (e: Event) => this.cutValueDraft.set((e.target as HTMLInputElement).value),
            },
            saveSetup: {
                disabled: () => this.svc.mutating.get(),
                textContent: () => (this.svc.mutating.get() ? 'Saving…' : 'Save setup'),
                onclick: () => void this.saveSetup(id()),
            },
            cancelSetup: { onclick: () => this.editingSetup.set(false) },

            // --- Roster ---
            rosterCount: () => {
                const n = this.svc.participants.get().length;
                return n === 0 ? '' : String(n);
            },
            rosterEmpty: {
                className: () =>
                    this.svc.participants.get().length === 0 ? 'cd__empty' : 'cd__empty hidden',
            },
            rosterAdd: {
                className: () =>
                    this.admin.get() && canEditSetup(this.lifecycle.get())
                        ? 'cd__rosteradd'
                        : 'cd__rosteradd hidden',
            },
            guestName: {
                value: () => this.guestNameDraft.get(),
                oninput: (e: Event) => this.guestNameDraft.set((e.target as HTMLInputElement).value),
            },
            guestGender: {
                value: () => this.guestGenderDraft.get(),
                onchange: (e: Event) =>
                    this.guestGenderDraft.set((e.target as HTMLSelectElement).value as 'M' | 'F'),
            },
            guestHcp: {
                value: () => this.guestHcpDraft.get(),
                oninput: (e: Event) => this.guestHcpDraft.set((e.target as HTMLInputElement).value),
            },
            guestForm: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const name = this.guestNameDraft.get().trim();
                    if (name === '') return;
                    const raw = this.guestHcpDraft.get().trim().replace(',', '.');
                    const hcp = raw === '' ? null : Number.parseFloat(raw);
                    const ok = await this.svc.addGuest(
                        id(),
                        {
                            displayName: name,
                            gender: this.guestGenderDraft.get(),
                            handicapIndex: Number.isFinite(hcp as number) ? (hcp as number) : null,
                        },
                        null,
                    );
                    if (ok === null) {
                        this.guestNameDraft.set('');
                        this.guestHcpDraft.set('');
                    }
                },
            },

            // --- Rounds ---
            roundsEmpty: {
                className: () =>
                    (detail()?.rounds.length ?? 0) === 0 ? 'cd__empty' : 'cd__empty hidden',
            },
            addRoundForm: {
                className: () =>
                    this.admin.get() && canAddRounds(this.lifecycle.get())
                        ? 'cd__addround'
                        : 'cd__addround hidden',
            },
            roundCoursePick: {
                value: () => this.roundCourseDraft.get(),
                onchange: (e: Event) =>
                    this.roundCourseDraft.set((e.target as HTMLSelectElement).value),
            },
            roundDate: {
                value: () => this.roundDateDraft.get(),
                oninput: (e: Event) => this.roundDateDraft.set((e.target as HTMLInputElement).value),
            },
            addRound: {
                disabled: () => this.svc.mutating.get(),
            },

            // --- Admin actions ---
            adminActions: {
                className: () =>
                    this.admin.get() && this.lifecycle.get() === 'active'
                        ? 'cd__section cd__admin'
                        : 'cd__section cd__admin hidden',
            },
            cutOutcome: { innerHTML: () => this.cutOutcomeHtml() },
            applyCut: {
                disabled: () => this.svc.mutating.get(),
                onclick: () => this.cutConfirmOpen.set(true),
            },
            finalize: {
                disabled: () => this.svc.mutating.get(),
                onclick: () => this.finalizeConfirmOpen.set(true),
            },

            // --- Board / results ---
            boardTitle: () =>
                this.lifecycle.get() === 'finalized' ? 'Official results' : 'Leaderboard',
            board: { innerHTML: () => this.boardHtml() },
            boardRefusal: {
                textContent: () =>
                    this.lifecycle.get() === 'finalized'
                        ? this.svc.resultsRefusal.get() ?? ''
                        : this.svc.board.get() === null
                          ? this.svc.boardRefusal.get() ?? ''
                          : '',
            },
        });

        // Add-round submit (form onsubmit through the button binding above is a
        // no-op; wire the form element itself).
        const addRoundFormEl = this.ref(frag, 'addRoundForm') as HTMLFormElement;
        addRoundFormEl.addEventListener('submit', (e) => {
            e.preventDefault();
            void this.doAddRound(id());
        });

        // Format-slot list (editable chips)
        this.$each(
            this.ref(frag, 'slotList'),
            this.slotDraft,
            (formatId, index, track) =>
                this.wireEl(
                    template(`<div class="cd__slot"><span bind="label"></span><button bind="rm" type="button" aria-label="Remove">×</button></div>`),
                    {
                        label: () =>
                            `Slot ${index + 1}: ${this.catalog.labelOf(formatId) ?? formatId}`,
                        rm: {
                            onclick: () =>
                                this.slotDraft.set(this.slotDraft.get().filter((_, i) => i !== index)),
                        },
                    },
                    track,
                ),
            (formatId, index) => `${index}:${formatId}`,
        );

        // Format picker <option>s
        this.$each(
            this.ref(frag, 'formatPick'),
            this.catalog.descriptors,
            (d, _i, track) =>
                this.wireEl(
                    template(`<option bind="o"></option>`),
                    { o: { value: () => d.id, textContent: () => this.catalog.labelOf(d) ?? d.id } },
                    track,
                ),
            (d) => d.id,
        );

        // Aggregation strategy <option>s — driven by the server catalog (no
        // hardcoded strategy ids; the ratchet forbids them client-side).
        this.$each(
            this.ref(frag, 'aggPick'),
            this.aggCatalog.descriptors,
            (d, _i, track) =>
                this.wireEl(
                    template(`<option bind="o"></option>`),
                    { o: { value: () => d.id, textContent: () => this.aggCatalog.labelOf(d) } },
                    track,
                ),
            (d) => d.id,
        );

        // Generic config fields for the selected strategy — one control per
        // descriptor-declared field (select / integer), bound to `aggConfig`.
        const currentFields = new Computed(
            () => this.aggCatalog.byId(this.aggStrategy.get())?.configFields ?? [],
        );
        this.$each(
            this.ref(frag, 'aggFields'),
            currentFields,
            (field, _i, track) => this.renderConfigField(field, track),
            (field) => field.key,
        );

        // Course pickers (setup default tee course + add-round course)
        const courseOption = (c: Course, track: (d: () => void) => void) =>
            this.wireEl(
                template(`<option bind="o"></option>`),
                { o: { value: () => c.id, textContent: () => c.name } },
                track,
            );
        this.$each(this.ref(frag, 'coursePick'), this.courses, (c, _i, tr) => courseOption(c, tr), (c) => c.id);
        this.$each(
            this.ref(frag, 'roundCoursePick'),
            this.courses,
            (c, _i, tr) => courseOption(c, tr),
            (c) => c.id,
        );
        // Tee options for the chosen setup course
        this.$each(
            this.ref(frag, 'teePick'),
            this.tees,
            (tee, _i, track) =>
                this.wireEl(
                    template(`<option bind="o"></option>`),
                    { o: { value: () => tee.id, textContent: () => tee.name } },
                    track,
                ),
            (tee) => tee.id,
        );

        // Roster rows
        this.$each(
            this.ref(frag, 'roster'),
            this.svc.participants,
            (p, _i, track) =>
                this.wireEl(
                    template(`
                        <div class="cd__rosterrow">
                            <span bind="rname" class="cd__rname"></span>
                            <span bind="rcat" class="cd__rcat"></span>
                            <span bind="rout" class="cd__rout"></span>
                            <button bind="withdraw" class="cd__ract" type="button">Withdraw</button>
                            <button bind="remove" class="cd__ract cd__ract--danger" type="button">Remove</button>
                        </div>
                    `),
                    {
                        rname: () => p.displayNameSnapshot,
                        rcat: {
                            textContent: () => p.category ?? '',
                            className: () => (p.category ? 'cd__rcat' : 'cd__rcat hidden'),
                        },
                        rout: {
                            textContent: () =>
                                p.withdrawnAt
                                    ? 'Withdrawn'
                                    : p.cutAfterRound !== null
                                      ? `Cut R${p.cutAfterRound}`
                                      : '',
                            className: () =>
                                p.withdrawnAt || p.cutAfterRound !== null
                                    ? 'cd__rout'
                                    : 'cd__rout hidden',
                        },
                        withdraw: {
                            className: () =>
                                this.admin.get() && !p.withdrawnAt ? 'cd__ract' : 'cd__ract hidden',
                            onclick: () => void this.svc.withdrawParticipant(id(), p.id),
                        },
                        remove: {
                            className: () =>
                                this.admin.get() && canEditSetup(this.lifecycle.get())
                                    ? 'cd__ract cd__ract--danger'
                                    : 'cd__ract cd__ract--danger hidden',
                            onclick: () => void this.svc.removeParticipant(id(), p.id),
                        },
                    },
                    track,
                ),
            (p) => p.id,
        );

        // Friends picker chips
        this.$each(
            this.ref(frag, 'friendPick'),
            this.friends.friends,
            (f, _i, track) =>
                this.wireEl(
                    template(`<button bind="chip" class="cd__friendchip" type="button"></button>`),
                    {
                        chip: {
                            textContent: () => f.displayName,
                            disabled: () =>
                                this.svc.mutating.get() ||
                                this.svc.participants.get().some((p) => p.playerId === f.id),
                            onclick: () => void this.svc.addPlayer(id(), f.id, null),
                        },
                    },
                    track,
                ),
            (f) => f.id,
        );
        if (this.auth.currentUser.get()) void this.friends.load();

        // Rounds list
        this.$each(
            this.ref(frag, 'rounds'),
            new Computed(() => detail()?.rounds ?? []),
            (r, _i, track) =>
                this.wireEl(
                    template(`
                        <button bind="row" class="cd__roundrow" type="button">
                            <span bind="num" class="cd__rnum"></span>
                            <span bind="meta" class="cd__rmeta"></span>
                            <span bind="status" class="cd__rstatus"></span>
                        </button>
                    `),
                    {
                        row: {
                            disabled: () => !r.shareToken,
                            onclick: () => {
                                if (r.shareToken)
                                    this.router.navigate('/round', { query: { token: r.shareToken } });
                            },
                        },
                        num: () => `Round ${r.roundNumber}`,
                        meta: () => {
                            const bits = [r.courseNameSnapshot, r.date].filter(Boolean);
                            return bits.join(' · ') || (r.shareToken ? 'Open' : 'View-only');
                        },
                        status: {
                            textContent: () => STATUS_TEXT[r.status] ?? r.status,
                            className: () => `cd__rstatus s-${r.status}`,
                        },
                    },
                    track,
                ),
            (r) => r.id,
        );

        // Finalized results set switcher (gross / net …)
        this.$each(
            this.ref(frag, 'setSwitch'),
            new Computed(() =>
                this.lifecycle.get() === 'finalized'
                    ? this.svc.results.get()?.resultSets ?? []
                    : [],
            ),
            (set, index, track) =>
                this.wireEl(
                    template(`<button bind="b" type="button"></button>`),
                    {
                        b: {
                            textContent: () => set.scoringType.toUpperCase(),
                            className: () => (this.resultSetIdx.get() === index ? 'on' : ''),
                            onclick: () => this.resultSetIdx.set(index),
                        },
                    },
                    track,
                ),
            (set) => set.scoringType,
        );

        // Confirm dialogs — cut + finalize (irreversible wording)
        this.spawn(ConfirmComponent, this.ref(frag, 'confirmHost'), {
            open: this.cutConfirmOpen,
            title: 'Apply cut?',
            message:
                'This evaluates the configured cut against the current aggregate and marks who advances. Cut players are left out of later rounds.',
            confirmLabel: 'Apply cut',
            cancelLabel: 'Cancel',
            onconfirm: async () => {
                const res = await this.svc.applyCut(id());
                if (res.ok) this.cutOutcome.set(res.outcome);
            },
        });
        this.spawn(ConfirmComponent, this.ref(frag, 'finalizeHost'), {
            open: this.finalizeConfirmOpen,
            title: 'Finalize competition?',
            message:
                'Finalizing freezes the official results and locks the competition. This cannot be undone.',
            confirmLabel: 'Finalize',
            cancelLabel: 'Cancel',
            danger: true,
            onconfirm: () => void this.svc.finalize(id()),
        });

        return frag;
    }

    /** Load the course list once (used by the setup + add-round pickers). */
    private loadCourses(): void {
        if (this.coursesLoaded) return;
        this.coursesLoaded = true;
        void api.courses
            .list()
            .then((cs) => this.courses.set(cs))
            .catch(() => {
                this.coursesLoaded = false;
            });
    }

    private async loadTees(courseId: string): Promise<void> {
        if (!courseId) {
            this.tees.set([]);
            return;
        }
        try {
            this.tees.set(await api.tees.listByCourse({ courseId }));
        } catch {
            this.tees.set([]);
        }
    }

    /** Seed the editor drafts from the loaded detail, then open the form. Reads
     *  detail via `.get()` inside this (click-handler) call — never a field
     *  initializer, so it can't spin a $swap refetch loop. */
    /** Select an aggregation strategy, resetting its config fields to defaults. */
    private selectStrategy(id: string): void {
        this.applyStrategyConfig(id, {});
    }

    /** Set `aggStrategy` + seed `aggConfig` from a strategy's descriptor field
     *  defaults, overridden by any values in `config`. Zero strategy-id
     *  branching — everything comes from the catalog descriptor. */
    private applyStrategyConfig(id: string, config: Record<string, unknown>): void {
        this.aggStrategy.set(id);
        const fields = this.aggCatalog.byId(id)?.configFields ?? [];
        const values: Record<string, string> = {};
        for (const f of fields) {
            const raw = config[f.key];
            values[f.key] = raw !== undefined && raw !== null ? String(raw) : String(f.default);
        }
        this.aggConfig.set(values);
    }

    private setConfigValue(key: string, value: string): void {
        this.aggConfig.set({ ...this.aggConfig.get(), [key]: value });
    }

    /** Build the aggregation `config` object from the selected strategy's
     *  declared fields (select → string, integer → number). */
    private buildConfig(strategyId: string): Record<string, unknown> {
        const fields = this.aggCatalog.byId(strategyId)?.configFields ?? [];
        const values = this.aggConfig.get();
        const config: Record<string, unknown> = {};
        for (const f of fields) {
            const raw = values[f.key] ?? String(f.default);
            config[f.key] =
                f.kind === 'integer' ? Number.parseInt(raw, 10) || Number(f.default) : raw;
        }
        return config;
    }

    /** One config-editor control, built from a descriptor field. Plain DOM so
     *  the control's value tracks `aggConfig` and disposes with its $each item
     *  (no strategy-id branching, no option-order binding races). */
    private renderConfigField(field: AggField, track: (d: () => void) => void): HTMLElement {
        const label = document.createElement('label');
        label.className = 'cd__field';
        const span = document.createElement('span');
        span.textContent = field.label;
        label.appendChild(span);
        if (field.kind === 'select') {
            const sel = document.createElement('select');
            for (const o of field.options) {
                const opt = document.createElement('option');
                opt.value = o.value;
                opt.textContent = o.label;
                sel.appendChild(opt);
            }
            track(effect(() => {
                sel.value = this.aggConfig.get()[field.key] ?? String(field.default);
            }));
            sel.addEventListener('change', () => this.setConfigValue(field.key, sel.value));
            label.appendChild(sel);
        } else {
            const inp = document.createElement('input');
            inp.setAttribute('inputmode', 'numeric');
            track(effect(() => {
                const v = this.aggConfig.get()[field.key] ?? String(field.default);
                if (inp.value !== v) inp.value = v;
            }));
            inp.addEventListener('input', () => this.setConfigValue(field.key, inp.value));
            label.appendChild(inp);
        }
        return label;
    }

    private seedEditor(): void {
        const d = this.svc.detail.get();
        if (!d) return;
        this.nameDraft.set(d.name);
        const cfg = d.defaultConfig;
        this.slotDraft.set((cfg?.slots ?? []).map((s) => s.formatId));
        this.startListDraft.set(cfg?.startList ?? 'single_group');
        const teeId = cfg?.fallbackTee?.teeId ?? '';
        this.teeDraft.set(teeId);
        const agg = d.aggregation;
        const stratId = agg?.strategyId ?? this.aggCatalog.descriptors.get()[0]?.id ?? '';
        this.applyStrategyConfig(stratId, (agg?.config ?? {}) as Record<string, unknown>);
        const cut = d.cutRules as
            | { afterRound?: number; cutType?: string; cutValue?: number }
            | null
            | undefined;
        if (cut && cut.afterRound !== undefined) {
            this.cutAfterDraft.set(String(cut.afterRound));
            this.cutTypeDraft.set(cut.cutType ?? '');
            this.cutValueDraft.set(cut.cutValue !== undefined ? String(cut.cutValue) : '');
        } else {
            this.cutAfterDraft.set('');
            this.cutTypeDraft.set('');
            this.cutValueDraft.set('');
        }
        // Default the format picker + open.
        this.formatPickDraft.set(this.catalog.descriptors.get()[0]?.id ?? '');
        this.editingSetup.set(true);
    }

    /** Build the update payload from the editor drafts and save it. */
    private async saveSetup(id: string): Promise<void> {
        const slots = this.slotDraft.get().map((formatId) => ({ formatId }));
        const teeId = this.teeDraft.get();
        const defaultConfig =
            slots.length > 0
                ? {
                      slots,
                      startList: this.startListDraft.get(),
                      ...(teeId ? { fallbackTee: { teeId } } : {}),
                  }
                : undefined;

        const strategyId = this.aggStrategy.get();
        const aggregation = strategyId ? { strategyId, config: this.buildConfig(strategyId) } : undefined;

        const afterRound = Number.parseInt(this.cutAfterDraft.get(), 10);
        const cutValue = Number.parseInt(this.cutValueDraft.get(), 10);
        const cutType = this.cutTypeDraft.get();
        const cutRules =
            cutType && Number.isFinite(afterRound) && Number.isFinite(cutValue)
                ? { afterRound, cutType, cutValue }
                : undefined;

        const refusal = await this.svc.updateConfig({
            id,
            name: this.nameDraft.get().trim() || undefined,
            ...(defaultConfig ? { defaultConfig } : {}),
            ...(aggregation ? { aggregation } : {}),
            ...(cutRules ? { cutRules } : {}),
        });
        if (refusal === null) this.editingSetup.set(false);
    }

    private async doAddRound(id: string): Promise<void> {
        const courseId = this.roundCourseDraft.get() || this.courseDraft.get();
        const playedAt = this.roundDateDraft.get();
        if (!courseId || !playedAt) {
            this.svc.mutateError.set('Pick a course and a date for the round.');
            return;
        }
        const res = await this.svc.createRound({ id, courseId, playedAt });
        if (res.ok) {
            this.router.navigate('/round', { query: { token: res.shareToken } });
        }
    }

    /** A subtle read-only summary of the current defaults + aggregation. */
    private setupSummaryHtml(): string {
        const d = this.svc.detail.get();
        if (!d) return '';
        const agg = d.aggregation;
        const slots = d.defaultConfig?.slots ?? [];
        const slotLabels =
            slots.length > 0
                ? slots.map((s) => this.catalog.labelOf(s.formatId) ?? s.formatId).join(', ')
                : '<em>none set</em>';
        const aggLabel = agg
            ? esc(this.aggCatalog.labelOf(agg.strategyId))
            : '<em>default (chosen automatically)</em>';
        return `<div>Formats: ${esc(slotLabels)}</div><div>Scoring: ${aggLabel}</div>`;
    }

    private cutOutcomeHtml(): string {
        const o = this.cutOutcome.get();
        if (!o) return '';
        const names = (list: { displayName: string }[]) =>
            list.length === 0 ? '—' : list.map((e) => esc(e.displayName)).join(', ');
        return `<div class="cd__cutgrp"><strong>Advanced (${o.advanced.length}):</strong> ${names(o.advanced)}</div>
<div class="cd__cutgrp"><strong>Cut (${o.cut.length}):</strong> ${names(o.cut)}</div>`;
    }

    private boardHtml(): string {
        // Finalized → the frozen official set (immutable snapshot, distinct look).
        if (this.lifecycle.get() === 'finalized') {
            const results = this.svc.results.get();
            if (!results) return '';
            const idx = Math.min(this.resultSetIdx.get(), results.resultSets.length - 1);
            const set = results.resultSets[idx];
            if (!set) return '';
            const roundsMeta: RoundColumn[] = (this.svc.board.get()?.view.rounds ?? []).map((r) => ({
                roundNumber: r.roundNumber,
                postCut: r.postCut,
            }));
            const banner = `<div class="cd__official-banner">Official results · finalized ${esc(
                results.finalizedAt.slice(0, 10),
            )}</div>`;
            return (
                banner +
                `<div class="cb cb--official">${renderResultsBoard(set.entries, roundsMeta)}</div>`
            );
        }
        // Live aggregated board.
        const board = this.svc.board.get();
        if (!board) return '';
        return renderAggregatedBoard(board.view, { defaulted: board.defaulted });
    }
}
