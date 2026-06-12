import { Component, Computed, Router, Signal, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { FORMATS } from '../formats';
import { NewRoundService, type RosterEntry } from './new-round.service';

const tpl = template(`
    <div class="newround">
        <header class="newround__head">
            <button bind="back" type="button" class="newround__back">‹</button>
            <h1>New round</h1>
        </header>

        <section class="newround__section">
            <h2>Course</h2>
            <select bind="course" class="newround__select"></select>
        </section>

        <section class="newround__section">
            <h2>Players</h2>
            <p class="newround__hint">Tap to add. Set each player's tee.</p>
            <div bind="roster" class="newround__roster"></div>
        </section>

        <section class="newround__section" bind="teamsSection">
            <h2>Teams</h2>
            <p class="newround__hint">Needed for the team play forms you picked.</p>
            <div bind="teams" class="newround__teams"></div>
        </section>

        <section class="newround__section">
            <h2>Play forms</h2>
            <p class="newround__hint">Pick one or more — all scored from the same strokes.</p>
            <div bind="formats" class="newround__formats"></div>
        </section>

        <div class="error" bind="error"></div>
        <button bind="create" type="button" class="newround__create">Tee off</button>
    </div>
`);

const rosterRowTpl = template(`
    <div bind="row" class="roster-row">
        <button bind="pick" type="button" class="roster-row__pick">
            <span bind="check" class="roster-row__check"></span>
            <span class="roster-row__who">
                <span bind="name" class="roster-row__name"></span>
                <span bind="meta" class="roster-row__meta"></span>
            </span>
        </button>
        <select bind="tee" class="roster-row__tee"></select>
    </div>
`);

const teamRowTpl = template(`
    <div class="team-row">
        <span bind="name" class="team-row__name"></span>
        <div class="team-row__seg">
            <button bind="a" type="button">A</button>
            <button bind="b" type="button">B</button>
        </div>
    </div>
`);

const formatRowTpl = template(`
    <button bind="row" type="button" class="format-row">
        <span bind="check" class="format-row__check"></span>
        <span class="format-row__text">
            <span bind="label" class="format-row__label"></span>
            <span bind="blurb" class="format-row__blurb"></span>
        </span>
        <span bind="team" class="format-row__team"></span>
    </button>
`);

export class NewRoundComponent extends Component {
    static styles = `
        .newround {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .newround__head {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                margin-bottom: ${s('xl')};

                & h1 {
                    margin: 0;
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 1.8rem;
                    letter-spacing: -0.02em;
                }
            }

            & .newround__back {
                width: 40px;
                height: 40px;
                font-size: 1.6rem;
                line-height: 1;
                ${btn()}
            }

            & .newround__section {
                margin-bottom: ${s('xl')};

                & h2 {
                    margin: 0 0 ${s('xs')};
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 1.2rem;
                }
            }

            & .newround__hint {
                margin: 0 0 ${s('md')};
                color: ${t('text-muted')};
                font-size: 0.82rem;
            }

            & .newround__select {
                width: 100%;
                padding: ${s('md')};
                font-size: 1rem;
                font-family: inherit;
                border: 1px solid ${t('border')};
                border-radius: ${t('radius')};
                background: ${t('input-bg')};
                color: ${t('text')};
            }

            & .newround__roster, & .newround__teams, & .newround__formats {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
            }

            & .roster-row {
                display: flex;
                align-items: stretch;
                gap: ${s('sm')};

                & .roster-row__pick {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: ${s('md')};
                    padding: ${s('md')};
                    text-align: left;
                    font-family: inherit;
                    cursor: pointer;
                    ${card()}
                }

                &.on .roster-row__pick { border-color: ${t('primary')}; }

                & .roster-row__check {
                    display: grid;
                    place-items: center;
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    border: 2px solid ${t('border')};
                    color: transparent;
                    font-weight: 800;
                    flex-shrink: 0;
                }
                &.on .roster-row__check {
                    background: ${t('primary')};
                    border-color: ${t('primary')};
                    color: ${t('primary-text')};
                }

                & .roster-row__who { display: flex; flex-direction: column; }
                & .roster-row__name { font-weight: 600; font-size: 1rem; color: ${t('text')}; }
                & .roster-row__meta { color: ${t('text-muted')}; font-size: 0.78rem; }

                & .roster-row__tee {
                    display: none;
                    width: 92px;
                    font-family: inherit;
                    font-size: 0.9rem;
                    border: 1px solid ${t('border')};
                    border-radius: ${t('radius')};
                    background: ${t('input-bg')};
                    color: ${t('text')};
                }
                &.on .roster-row__tee { display: block; }
            }

            & .team-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('md')};
                padding: ${s('sm')} ${s('md')};
                ${card()}

                & .team-row__name { font-weight: 600; }

                & .team-row__seg {
                    display: flex;
                    border: 1px solid ${t('border')};
                    border-radius: ${t('radius')};
                    overflow: hidden;

                    & button {
                        width: 56px;
                        padding: ${s('sm')} 0;
                        border: none;
                        background: ${t('btn-bg')};
                        color: ${t('text-muted')};
                        font-family: inherit;
                        font-weight: 700;
                        cursor: pointer;

                        &.on { background: ${t('primary')}; color: ${t('primary-text')}; }
                    }
                }
            }

            & .format-row {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                padding: ${s('md')};
                text-align: left;
                font-family: inherit;
                cursor: pointer;
                ${card()}

                &.on { border-color: ${t('primary')}; }

                & .format-row__check {
                    display: grid;
                    place-items: center;
                    width: 26px;
                    height: 26px;
                    border-radius: ${t('radius-sm')};
                    border: 2px solid ${t('border')};
                    color: transparent;
                    font-weight: 800;
                    flex-shrink: 0;
                }
                &.on .format-row__check {
                    background: ${t('primary')};
                    border-color: ${t('primary')};
                    color: ${t('primary-text')};
                }

                & .format-row__text { display: flex; flex-direction: column; flex: 1; }
                & .format-row__label { font-weight: 600; color: ${t('text')}; }
                & .format-row__blurb { color: ${t('text-muted')}; font-size: 0.78rem; }

                & .format-row__team {
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: ${t('accent')};
                    background: ${t('accent-soft')};
                    border-radius: ${t('radius-pill')};
                    padding: 2px 8px;
                }
            }

            & .error {
                display: none;
                margin-bottom: ${s('md')};
                color: ${t('error')};
                font-size: 0.875rem;
            }
            & .error.show { display: block; }

            & .newround__create {
                width: 100%;
                padding: ${s('lg')};
                font-size: 1.15rem;
                font-weight: 700;
                font-family: inherit;
                ${btn()}
                background: ${t('primary')};
                color: ${t('primary-text')};
                border: none;
                box-shadow: ${t('shadow-elevated')};
                &:hover { background: ${t('primary')}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }
    `;

    private svc = this.inject(NewRoundService);
    private router = this.inject(Router);
    private attempted = new Signal(false);

    private validationMsg = new Computed(() => {
        // Subscribe to everything validation reads.
        this.svc.courseId.get();
        this.svc.selected.get();
        this.svc.teeByKey.get();
        this.svc.formatIds.get();
        return this.svc.validation();
    });

    render(): DocumentFragment {
        void this.svc.load();

        const frag = this.wire(tpl, {
            back: { onclick: () => this.router.navigate('/rounds') },
            course: {
                innerHTML: () => this.svc.courses.get()
                    .map((c) => `<option value="${c.id}">${c.name}</option>`)
                    .join(''),
                value: () => this.svc.courseId.get() ?? '',
                onchange: (e: Event) =>
                    void this.svc.pickCourse((e.target as HTMLSelectElement).value),
            },
            teamsSection: {
                style: () => (this.svc.needsTeams.get() ? '' : 'display:none'),
            },
            error: {
                className: () =>
                    this.attempted.get() && (this.validationMsg.get() || this.svc.error.get())
                        ? 'error show'
                        : 'error',
                textContent: () =>
                    this.validationMsg.get() ?? this.svc.error.get()?.message ?? '',
            },
            create: {
                disabled: () => this.svc.loading.get(),
                textContent: () => (this.svc.loading.get() ? 'Compiling…' : 'Tee off'),
                onclick: async () => {
                    this.attempted.set(true);
                    if (this.validationMsg.get()) return;
                    const round = await this.svc.create();
                    if (round) {
                        this.router.navigate('/score', { query: { roundId: round.id } });
                    }
                },
            },
        });

        this.$each(this.ref(frag, 'roster'), this.svc.roster, (e, _i, track) =>
            this.rosterRow(e, track), (e) => e.key);

        this.$each(this.ref(frag, 'teams'), this.svc.selectedEntries, (e, _i, track) =>
            this.wireEl(teamRowTpl, {
                name: () => e.name,
                a: {
                    className: () => (this.svc.teamByKey.get().get(e.key) === 'A' ? 'on' : ''),
                    onclick: () => this.svc.setTeam(e.key, 'A'),
                },
                b: {
                    className: () => (this.svc.teamByKey.get().get(e.key) === 'B' ? 'on' : ''),
                    onclick: () => this.svc.setTeam(e.key, 'B'),
                },
            }, track), (e) => e.key);

        this.$each(this.ref(frag, 'formats'), new Computed(() => FORMATS), (f, _i, track) =>
            this.wireEl(formatRowTpl, {
                row: {
                    className: () => (this.svc.formatIds.get().has(f.id) ? 'format-row on' : 'format-row'),
                    onclick: () => this.svc.toggleFormat(f.id),
                },
                check: () => '✓',
                label: () => f.label,
                blurb: () => f.blurb,
                team: {
                    textContent: () => (f.needsTeams ? 'Teams' : ''),
                    style: () => (f.needsTeams ? '' : 'display:none'),
                },
            }, track), (f) => f.id);

        return frag;
    }

    private rosterRow(e: RosterEntry, track: (fn: () => void) => void): HTMLElement {
        return this.wireEl(rosterRowTpl, {
            row: {
                className: () => (this.svc.selected.get().has(e.key) ? 'roster-row on' : 'roster-row'),
            },
            pick: { onclick: () => this.svc.toggle(e.key) },
            check: () => '✓',
            name: () => e.name,
            meta: () => `HCP ${e.handicapIndex.toFixed(1)}${e.kind === 'player' ? ' · you' : ''}`,
            tee: {
                innerHTML: () => this.svc.tees.get()
                    .map((tee) => `<option value="${tee.id}">${tee.name}</option>`)
                    .join(''),
                value: () => this.svc.teeByKey.get().get(e.key) ?? '',
                onchange: (ev: Event) =>
                    this.svc.setTee(e.key, (ev.target as HTMLSelectElement).value),
            },
        }, track);
    }
}
