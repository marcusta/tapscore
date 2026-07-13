import {
    Component,
    Router,
    effect,
    template,
    untrack,
} from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { CompetitionsService } from './competitions.service';
import {
    lifecycleClass,
    lifecycleLabel,
    nextTransition,
} from './lifecycle';
import { CompetitionDetailService } from './competition-detail.service';
import { CompetitionSetupComponent } from './competition-setup.component';
import { CompetitionRosterComponent } from './competition-roster.component';
import { CompetitionRoundsComponent } from './competition-rounds.component';
import { CompetitionResultsComponent } from './competition-results.component';

// Phase 4 Slice 5 — the competition detail screen (`/competition?id=…`). One
// screen, several sections: header + lifecycle, admin setup (defaults +
// aggregation + cut rules), roster, rounds (each opens the EXISTING round UI
// via its share token, unchanged), the aggregated board (live) / official
// results (finalized), and the irreversible admin actions (cut, finalize).
// Every server refusal is rendered verbatim; admin controls are gated on the
// admin signal (owner id or a round's admin-only share token).

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

            <div bind="setup"></div>
            <div bind="roster"></div>
            <div bind="rounds"></div>
            <div bind="results"></div>
        </div>
    </div>
`);

export class CompetitionDetailComponent extends Component {
    static styles = `
        .cd {
            padding: ${s('lg')} ${s('lg')} ${s('2xl')};
            & .hidden { display: none !important; }
            & .cd__muted-em { font-style: italic; }
            & .cb-struck { text-decoration: line-through; opacity: 0.8; }

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

    private competitions = this.inject(CompetitionsService);
    private state = this.inject(CompetitionDetailService);
    private router = this.inject(Router);

    render(): DocumentFragment {
        const detail = () => this.competitions.detail.get();
        this.track(
            effect(() => {
                const id = this.state.id.get();
                if (id) {
                    untrack(() => {
                        this.state.enter();
                        void this.competitions.loadDetail(id);
                    });
                }
            }),
        );
        this.state.initialize();

        const frag = this.wire(tpl, {
            back: { onclick: () => this.router.navigate('/competitions') },
            loading: {
                className: () =>
                    this.competitions.detailLoading.get() && detail() === null
                        ? 'cd__loading'
                        : 'cd__loading hidden',
            },
            loadErr: {
                textContent: () => this.competitions.detailError.get()?.message ?? '',
                className: () =>
                    this.competitions.detailError.get()
                        ? 'cd__loaderr'
                        : 'cd__loaderr hidden',
            },
            body: { className: () => (detail() ? 'cd__body' : 'cd__body hidden') },
            name: () => detail()?.name ?? '',
            chip: {
                textContent: () => lifecycleLabel(this.state.lifecycle.get()),
                className: () => lifecycleClass(this.state.lifecycle.get()),
            },
            ownerLine: {
                textContent: () =>
                    this.state.admin.get()
                        ? 'You administer this competition.'
                        : 'Read-only view.',
            },
            mutateErr: {
                textContent: () => this.competitions.mutateError.get() ?? '',
            },
            transitionRow: {
                className: () =>
                    this.state.admin.get() && nextTransition(this.state.lifecycle.get())
                        ? 'cd__transition'
                        : 'cd__transition hidden',
            },
            transitionBtn: {
                textContent: () =>
                    nextTransition(this.state.lifecycle.get())?.label ?? '',
                disabled: () => this.competitions.mutating.get(),
                onclick: () => {
                    const next = nextTransition(this.state.lifecycle.get());
                    const id = this.state.id.get();
                    if (next && id) void this.competitions.transition(id, next.to);
                },
            },
        });

        this.spawn(CompetitionSetupComponent, this.ref(frag, 'setup'));
        this.spawn(CompetitionRosterComponent, this.ref(frag, 'roster'));
        this.spawn(CompetitionRoundsComponent, this.ref(frag, 'rounds'));
        this.spawn(CompetitionResultsComponent, this.ref(frag, 'results'));
        return frag;
    }
}
