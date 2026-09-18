import { Component, Computed, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { SeriesService } from './series.service';
import { mergeSeriesLists } from './series-list';

// Team events list + create (`/series`). Creating one needs a session (the
// owner is a player). Opening one does not: the board is an open read by share
// token, so events seen on this device list for a logged-out visitor too.

const tpl = template(`
    <div class="sl">
        <header class="sl__head">
            <h1>Team events</h1>
            <p>Two or more teams, points across several rounds.</p>
        </header>

        <div bind="anon" class="sl__anon">
            <p>Sign in to start a team event. A board link opens without an account.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>

        <form bind="createForm" class="sl__create">
            <input bind="nameInput" placeholder="Event name, for example Red v Blue 2026" />
            <button bind="createBtn" type="submit">Create</button>
        </form>
        <p bind="createErr" class="sl__err"></p>

        <div bind="empty" class="sl__empty">No team events yet.</div>
        <div bind="list" class="sl__list"></div>
    </div>
`);

const rowTpl = template(`
    <button bind="row" type="button" class="sl-row">
        <span bind="name" class="sl-row__name"></span>
        <span class="sl-row__go">Open</span>
    </button>
`);

export class SeriesListComponent extends Component {
    static styles = `
        .sl {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};
            max-width: 720px; margin: 0 auto;

            & .hidden { display: none !important; }
            & .sl__head {
                margin-bottom: ${s('xl')};
                & h1 {
                    margin: 0; font-family: ${t('font-display')}; font-weight: 600;
                    font-size: 2rem; letter-spacing: -0.02em;
                }
                & p { margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.9rem; }
            }
            & .sl__anon {
                color: ${t('text-muted')}; margin-bottom: ${s('lg')};
                & button {
                    ${btn()}
                    margin-top: ${s('sm')}; padding: ${s('md')} ${s('xl')};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${t('primary')}; color: ${t('primary-text')}; border: none;
                }
            }
            & .sl__create {
                display: flex; gap: ${s('sm')}; margin-bottom: ${s('md')};
                & input { ${input()} flex: 1; min-width: 0; padding: ${s('md')}; font-size: 1rem; }
                & button {
                    ${btn()}
                    padding: ${s('md')} ${s('lg')};
                    font-family: inherit; font-size: 0.95rem; font-weight: 700;
                    background: ${t('primary')}; color: ${t('primary-text')}; border: none;
                    &:disabled { opacity: 0.5; cursor: default; }
                }
            }
            & .sl__err { margin: 0 0 ${s('md')}; font-size: 0.85rem; color: ${t('error')}; &:empty { display: none; } }
            & .sl__empty { color: ${t('text-muted')}; font-size: 0.9rem; padding: ${s('lg')} 0; }
            & .sl__list { display: flex; flex-direction: column; gap: ${s('sm')}; }
            & .sl-row {
                display: flex; align-items: center; justify-content: space-between; gap: ${s('md')};
                padding: ${s('md')} ${s('lg')}; text-align: left; font-family: inherit; width: 100%;
                ${card({ hover: true })}
                cursor: pointer;
                & .sl-row__name {
                    font-weight: 700; font-size: 1.05rem; color: ${t('text')};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .sl-row__go { font-size: 0.8rem; color: ${t('text-muted')}; flex-shrink: 0; }
            }
        }
    `;

    private svc = this.inject(SeriesService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    private loggedIn = new Computed(() => this.auth.currentUser.get() !== null);
    private nameDraft = new Signal('');
    private rows = new Computed(() => mergeSeriesLists(this.svc.list.get(), this.svc.deviceList.get()));

    render(): DocumentFragment {
        if (this.loggedIn.get()) void this.svc.loadList();

        const open = (token: string) => this.router.navigate('/series-board', { query: { token } });

        const frag = this.wire(tpl, {
            anon: { className: () => (this.loggedIn.get() ? 'sl__anon hidden' : 'sl__anon') },
            toLogin: { onclick: () => this.router.navigate('/login', { query: { next: '/series' } }) },
            createForm: {
                className: () => (this.loggedIn.get() ? 'sl__create' : 'sl__create hidden'),
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const name = this.nameDraft.get().trim();
                    if (name === '') return;
                    const created = await this.svc.create(name);
                    if (created) {
                        this.nameDraft.set('');
                        open(created.shareToken);
                    }
                },
            },
            nameInput: {
                value: () => this.nameDraft.get(),
                oninput: (e: Event) => this.nameDraft.set((e.target as HTMLInputElement).value),
            },
            createBtn: {
                disabled: () => this.svc.mutating.get() || this.nameDraft.get().trim() === '',
                textContent: () => (this.svc.mutating.get() ? 'Creating…' : 'Create'),
            },
            createErr: { textContent: () => this.svc.mutateError.get() ?? '' },
            empty: {
                className: () =>
                    this.rows.get().length === 0 && !this.svc.listLoading.get()
                        ? 'sl__empty'
                        : 'sl__empty hidden',
            },
        });

        this.$each(
            this.ref(frag, 'list'),
            this.rows,
            (row, _i, track) =>
                this.wireEl(
                    rowTpl,
                    {
                        row: { onclick: () => open(row.token) },
                        name: () => row.name,
                    },
                    track,
                ),
            (row) => `${row.token}:${row.name}`,
        );

        return frag;
    }
}
