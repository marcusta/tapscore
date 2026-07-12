import { Component, Computed, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { CompetitionsService } from './competitions.service';
import { lifecycleClass, lifecycleLabel, type Lifecycle } from './lifecycle';

// Phase 4 Slice 5 — the competitions list + create screen (`/competitions`).
// Competitions are a logged-in surface (the list 401s without a session), so
// the tab mirrors the friends/profile "sign in first" side-door pattern. The
// list read carries name + lifecycle only (no round count — that lives on the
// detail read, which loads the rounds); the row shows name + lifecycle chip.

const tpl = template(`
    <div class="comps">
        <header class="comps__head">
            <h1>Competitions</h1>
            <p>Multi-round events with an aggregated board.</p>
        </header>

        <div bind="anon" class="comps__anon">
            <p>Competitions live behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>

        <div bind="body" class="comps__body">
            <form bind="createForm" class="comps__create">
                <input bind="nameInput" placeholder="New competition name" />
                <button bind="createBtn" type="submit">Create</button>
            </form>
            <p bind="createErr" class="comps__err"></p>

            <div bind="loading" class="comps__loading">Loading…</div>
            <div bind="empty" class="comps__empty">No competitions yet — name one above to get started.</div>
            <div bind="list" class="comps__list"></div>
        </div>
    </div>
`);

const rowTpl = template(`
    <button bind="row" type="button" class="comp-row">
        <span bind="name" class="comp-row__name"></span>
        <span bind="chip"></span>
    </button>
`);

export class CompetitionsComponent extends Component {
    static styles = `
        .comps {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .comps__head {
                margin-bottom: ${s('xl')};
                & h1 {
                    margin: 0;
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.9rem; }
            }

            & .comps__anon {
                text-align: center;
                padding: ${s('2xl')} 0;
                color: ${t('text-muted')};
                &.hidden { display: none; }
                & button {
                    margin-top: ${s('md')};
                    padding: ${s('md')} ${s('xl')};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    ${btn()}
                    background: ${t('primary')}; color: ${t('primary-text')}; border: none;
                }
            }
            & .comps__body.hidden { display: none; }

            & .comps__create {
                display: flex;
                gap: ${s('sm')};
                margin-bottom: ${s('md')};
                & input { flex: 1; padding: ${s('md')}; font-size: 1rem; ${input()} }
                & button {
                    padding: ${s('md')} ${s('lg')};
                    font-family: inherit; font-size: 0.95rem; font-weight: 700;
                    ${btn()}
                    background: ${t('primary')}; color: ${t('primary-text')}; border: none;
                    &:disabled { opacity: 0.5; cursor: default; }
                }
            }
            & .comps__err {
                margin: 0 0 ${s('md')}; font-size: 0.85rem; color: ${t('error')};
                &:empty { display: none; }
            }

            & .comps__loading, & .comps__empty {
                color: ${t('text-muted')}; font-size: 0.9rem; padding: ${s('lg')} 0;
                &.hidden { display: none; }
            }

            & .comps__list { display: flex; flex-direction: column; gap: ${s('sm')}; }

            & .comp-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('md')};
                padding: ${s('md')} ${s('lg')};
                text-align: left;
                font-family: inherit;
                width: 100%;
                ${card({ hover: true })}
                cursor: pointer;

                & .comp-row__name {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: ${t('text')};
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            & .comp-chip {
                flex-shrink: 0;
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                border-radius: ${t('radius-pill')};
                padding: 2px 10px;
                background: ${t('surface-sunken')};
                color: ${t('text-muted')};

                &.comp-chip--setup { background: ${t('accent-soft')}; color: ${t('accent')}; }
                &.comp-chip--active { background: ${t('primary')}; color: ${t('primary-text')}; }
                &.comp-chip--finalized { background: ${t('accent')}; color: ${t('topbar-bg')}; }
            }
        }
    `;

    private svc = this.inject(CompetitionsService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    private loggedIn = new Computed(() => this.auth.currentUser.get() !== null);
    private nameDraft = new Signal('');

    render(): DocumentFragment {
        if (this.loggedIn.get()) void this.svc.loadList();

        const frag = this.wire(tpl, {
            anon: { className: () => (this.loggedIn.get() ? 'comps__anon hidden' : 'comps__anon') },
            toLogin: {
                onclick: () => this.router.navigate('/login', { query: { next: '/competitions' } }),
            },
            body: { className: () => (this.loggedIn.get() ? 'comps__body' : 'comps__body hidden') },
            nameInput: {
                value: () => this.nameDraft.get(),
                oninput: (e: Event) => this.nameDraft.set((e.target as HTMLInputElement).value),
            },
            createBtn: {
                disabled: () => this.svc.mutating.get() || this.nameDraft.get().trim() === '',
                textContent: () => (this.svc.mutating.get() ? 'Creating…' : 'Create'),
            },
            createForm: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const name = this.nameDraft.get().trim();
                    if (name === '') return;
                    const comp = await this.svc.create(name);
                    if (comp) {
                        this.nameDraft.set('');
                        this.router.navigate('/competition', { query: { id: comp.id } });
                    }
                },
            },
            createErr: { textContent: () => this.svc.mutateError.get() ?? '' },
            loading: {
                className: () =>
                    this.svc.listLoading.get() && !this.svc.listLoaded.get()
                        ? 'comps__loading'
                        : 'comps__loading hidden',
            },
            empty: {
                className: () =>
                    this.svc.listLoaded.get() && this.svc.list.get().length === 0
                        ? 'comps__empty'
                        : 'comps__empty hidden',
            },
        });

        this.$each(
            this.ref(frag, 'list'),
            this.svc.list,
            (comp, _i, track) =>
                this.wireEl(
                    rowTpl,
                    {
                        row: {
                            onclick: () =>
                                this.router.navigate('/competition', { query: { id: comp.id } }),
                        },
                        name: () => comp.name,
                        chip: {
                            textContent: () => lifecycleLabel(comp.lifecycle as Lifecycle),
                            className: () => lifecycleClass(comp.lifecycle as Lifecycle),
                        },
                    },
                    track,
                ),
            (comp) => comp.id,
        );

        return frag;
    }
}
