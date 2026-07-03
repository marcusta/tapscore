import { Component, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { ProfileService } from './profile.service';

// Phase 3 profile — the logged-in side door's home: display name, the
// manually maintained handicap index (edit → `players/me/handicap`), and the
// append-only history chain (index · source · effective date).

const tpl = template(`
    <div class="profile">
        <div bind="anon" class="profile__anon">
            <p>Your profile lives behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>
        <div bind="body" class="profile__body">
            <header class="profile__head">
                <h1 bind="name"></h1>
                <p bind="username"></p>
            </header>

            <section class="profile__card">
                <span class="profile__label">Handicap index</span>
                <div class="profile__hcp-row">
                    <span bind="hcp" class="profile__hcp"></span>
                    <form bind="form" class="profile__edit">
                        <input bind="index" inputmode="decimal" placeholder="e.g. 18.4" />
                        <button type="submit" bind="save">Save</button>
                    </form>
                </div>
                <p class="profile__hint">Maintained by you — each save is recorded below with its effective date.</p>
                <p bind="saveErr" class="profile__err"></p>
            </section>

            <section class="profile__section">
                <h2>Handicap history</h2>
                <div bind="historyEmpty" class="profile__empty">No entries yet — save an index to start the chain.</div>
                <div bind="history" class="profile__history"></div>
            </section>

            <button bind="signout" class="profile__signout" type="button">Sign out</button>
        </div>
    </div>
`);

const entryTpl = template(`
    <div class="hcp-entry">
        <span bind="index" class="hcp-entry__index"></span>
        <span bind="source" class="hcp-entry__source"></span>
        <span bind="date" class="hcp-entry__date"></span>
    </div>
`);

export class ProfileComponent extends Component {
    static styles = `
        .profile {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .profile__anon {
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

            & .profile__body.hidden { display: none; }

            & .profile__head {
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

            & .profile__card {
                padding: ${s('lg')};
                margin-bottom: ${s('xl')};
                ${card()}

                & .profile__label {
                    font-weight: 700; font-size: 0.8rem;
                    text-transform: uppercase; letter-spacing: 0.06em;
                    color: ${t('text-muted')};
                }
                & .profile__hcp-row {
                    display: flex; align-items: center; gap: ${s('md')};
                    margin-top: ${s('sm')};
                }
                & .profile__hcp {
                    font-family: ${t('font-display')};
                    font-weight: 700; font-size: 2rem;
                    font-variant-numeric: tabular-nums;
                    color: ${t('text')};
                }
                & .profile__edit {
                    display: flex; gap: ${s('sm')}; flex: 1; justify-content: flex-end;
                    & input { width: 90px; padding: ${s('md')}; font-size: 1rem; text-align: center; ${input()} }
                    & button {
                        padding: ${s('md')} ${s('lg')}; font-family: inherit;
                        font-size: 0.95rem; font-weight: 700; ${btn()}
                        background: ${t('primary')}; color: ${t('primary-text')}; border: none;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
                & .profile__hint { margin: ${s('sm')} 0 0; font-size: 0.8rem; color: ${t('text-muted')}; }
                & .profile__err {
                    margin: ${s('sm')} 0 0; font-size: 0.85rem; color: ${t('error')};
                    &:empty { display: none; }
                }
            }

            & .profile__section {
                & h2 {
                    margin: 0 0 ${s('sm')};
                    font-family: ${t('font-display')};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .profile__empty {
                color: ${t('text-muted')}; font-size: 0.9rem; padding: ${s('md')} 0;
                &.hidden { display: none; }
            }

            & .profile__history { display: flex; flex-direction: column; gap: ${s('sm')}; }

            & .hcp-entry {
                display: flex; align-items: baseline; gap: ${s('md')};
                padding: ${s('md')} ${s('lg')};
                ${card()}

                & .hcp-entry__index {
                    font-weight: 700; font-size: 1.05rem;
                    font-variant-numeric: tabular-nums;
                    width: 52px;
                }
                & .hcp-entry__source {
                    font-size: 0.7rem; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.08em;
                    border-radius: ${t('radius-pill')};
                    padding: 2px 10px;
                    background: ${t('accent-soft')}; color: ${t('accent')};
                }
                & .hcp-entry__date {
                    margin-left: auto;
                    color: ${t('text-muted')}; font-size: 0.85rem;
                    font-variant-numeric: tabular-nums;
                }
            }

            & .profile__signout {
                display: block;
                margin: ${s('2xl')} auto 0;
                padding: ${s('sm')} ${s('lg')};
                background: none; border: none; font-family: inherit;
                font-size: 0.85rem; font-weight: 600;
                color: ${t('text-muted')};
                text-decoration: underline; cursor: pointer;
            }
        }
    `;

    private svc = this.inject(ProfileService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private indexDraft = new Signal('');
    private localErr = new Signal('');

    render(): DocumentFragment {
        if (this.auth.currentUser.get()) void this.svc.load();

        const loggedIn = () => this.auth.currentUser.get() !== null;

        const frag = this.wire(tpl, {
            anon: { className: () => (loggedIn() ? 'profile__anon hidden' : 'profile__anon') },
            toLogin: { onclick: () => this.router.navigate('/login', { query: { next: '/profile' } }) },
            body: { className: () => (loggedIn() ? 'profile__body' : 'profile__body hidden') },
            name: () => this.svc.player.get()?.displayName ?? '…',
            username: () => {
                const p = this.svc.player.get();
                return p ? `@${p.username}` : '';
            },
            hcp: () => {
                const idx = this.svc.player.get()?.handicapIndex;
                return idx == null ? '–' : idx.toFixed(1);
            },
            index: {
                value: () => this.indexDraft.get(),
                oninput: (e: Event) => this.indexDraft.set((e.target as HTMLInputElement).value),
            },
            save: {
                disabled: () =>
                    this.svc.saving.get() || this.indexDraft.get().trim() === '',
                textContent: () => (this.svc.saving.get() ? 'Saving…' : 'Save'),
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    this.localErr.set('');
                    const raw = this.indexDraft.get().trim().replace(',', '.');
                    const idx = Number.parseFloat(raw);
                    if (!Number.isFinite(idx) || idx < -10 || idx > 54) {
                        this.localErr.set('Enter an index between -10 and 54.');
                        return;
                    }
                    if (await this.svc.saveIndex(idx)) this.indexDraft.set('');
                },
            },
            saveErr: {
                textContent: () =>
                    this.localErr.get() || this.svc.saveError.get()?.message || '',
            },
            historyEmpty: {
                className: () =>
                    this.svc.history.get().length === 0
                        ? 'profile__empty'
                        : 'profile__empty hidden',
            },
            signout: {
                onclick: async () => {
                    await this.auth.logout();
                    this.svc.clear();
                    this.router.navigate('/');
                },
            },
        });

        this.$each(
            this.ref(frag, 'history'),
            this.svc.history,
            (h, _i, track) =>
                this.wireEl(entryTpl, {
                    index: () => h.handicapIndex.toFixed(1),
                    source: () => h.source,
                    date: () => h.effectiveDate,
                }, track),
            (h) => h.id,
        );

        return frag;
    }
}
