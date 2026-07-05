import { Component, Router, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { FriendsService } from './friends.service';
import { isSearchable } from './friends-state';
import { friendSubtitle, sortFriends } from './friend-sort';
import type { FriendProfile } from '../api/friends.gen';

// Phase 3 friends — the one-directional contact list behind the auth side
// door (mirrors /profile's sign-in prompt when logged out). Search registered
// players by name/username, add them with one tap, and keep the list below;
// friends feed the create flow's "From friends" roster picker.

const tpl = template(`
    <div class="friends">
        <div bind="anon" class="friends__anon">
            <p>Your friends list lives behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>
        <div bind="body" class="friends__body">
            <header class="friends__head">
                <h1>Friends</h1>
                <p>Players you often tee up with — one tap adds them to a round.</p>
            </header>

            <section class="friends__section">
                <input bind="search" class="friends__search" type="search"
                    placeholder="Search players by name or @username"
                    autocomplete="off" autocapitalize="none" />
                <p bind="searchHint" class="friends__hint"></p>
                <p bind="searchErr" class="friends__err"></p>
                <div bind="results" class="friends__list"></div>
                <div bind="resultsEmpty" class="friends__empty">No players match that search.</div>
            </section>

            <section class="friends__section">
                <div class="friends__sechead">
                    <h2>My friends</h2>
                    <div bind="sortToggle" class="friends__sort" role="group" aria-label="Sort friends">
                        <button bind="sortFrecency" type="button" class="friends__sortbtn">Suggested</button>
                        <button bind="sortAlpha" type="button" class="friends__sortbtn">A–Z</button>
                    </div>
                </div>
                <div bind="friendsEmpty" class="friends__empty">No friends yet — search above to add the people you play with.</div>
                <div bind="friends" class="friends__list"></div>
            </section>
        </div>
    </div>
`);

const resultTpl = template(`
    <div class="friend-row">
        <span bind="initials" class="friend-row__badge"></span>
        <span class="friend-row__who">
            <span bind="name" class="friend-row__name"></span>
            <span bind="username" class="friend-row__username"></span>
        </span>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="add" class="friend-row__add" type="button">Add</button>
        <span bind="added" class="friend-row__added">✓ Friend</span>
    </div>
`);

const friendTpl = template(`
    <div class="friend-row">
        <span bind="initials" class="friend-row__badge"></span>
        <span class="friend-row__who">
            <span bind="name" class="friend-row__name"></span>
            <span bind="subtitle" class="friend-row__subtitle"></span>
        </span>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="remove" class="friend-row__remove" type="button" aria-label="Remove friend">✕</button>
    </div>
`);

function initialsOf(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join('');
}

export class FriendsComponent extends Component {
    static styles = `
        .friends {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .friends__anon {
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

            & .friends__body.hidden { display: none; }

            & .friends__head {
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

            & .friends__section {
                margin-bottom: ${s('xl')};
                & h2 {
                    margin: 0 0 ${s('sm')};
                    font-family: ${t('font-display')};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .friends__sechead {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${s('md')};
                & h2 { margin: 0; }
            }

            & .friends__sort {
                display: inline-flex; flex-shrink: 0;
                border: 1px solid ${t('border')}; border-radius: ${t('radius-pill')};
                overflow: hidden;
                &.hidden { display: none; }

                & .friends__sortbtn {
                    ${btn()}
                    font-family: inherit; font-size: 0.78rem; font-weight: 700;
                    padding: ${s('xs')} ${s('md')};
                    background: transparent; color: ${t('text-muted')};
                    border: none; border-radius: 0;

                    &[aria-pressed='true'] {
                        background: ${t('primary')}; color: ${t('primary-text')};
                    }
                }
            }

            & .friends__search {
                width: 100%;
                padding: ${s('md')} ${s('lg')};
                font-size: 1rem;
                ${input()}
            }

            & .friends__hint {
                margin: ${s('sm')} 0 0; font-size: 0.82rem; color: ${t('text-muted')};
                &:empty { display: none; }
            }
            & .friends__err {
                margin: ${s('sm')} 0 0; font-size: 0.85rem; color: ${t('error')};
                &:empty { display: none; }
            }

            & .friends__empty {
                color: ${t('text-muted')}; font-size: 0.9rem; padding: ${s('md')} 0;
                &.hidden { display: none; }
            }

            & .friends__list {
                display: flex; flex-direction: column; gap: ${s('sm')};
                margin-top: ${s('md')};
                &:empty { display: none; }
            }

            & .friend-row {
                display: flex; align-items: center; gap: ${s('md')};
                padding: ${s('md')} ${s('lg')};
                ${card()}

                & .friend-row__badge {
                    display: grid; place-items: center;
                    width: 40px; height: 40px; border-radius: 50%;
                    background: ${t('primary')}; color: ${t('primary-text')};
                    font-weight: 700; font-size: 0.85rem; flex-shrink: 0;
                }
                & .friend-row__who {
                    flex: 1; min-width: 0;
                    display: flex; flex-direction: column; gap: 1px;
                }
                & .friend-row__name {
                    font-weight: 600; font-size: 1rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .friend-row__username,
                & .friend-row__subtitle {
                    color: ${t('text-muted')}; font-size: 0.8rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .friend-row__subtitle:empty { display: none; }
                & .friend-row__hcp {
                    font-weight: 700; flex-shrink: 0;
                    color: ${t('accent')}; background: ${t('accent-soft')};
                    border-radius: ${t('radius-pill')};
                    padding: 2px 10px; font-size: 0.85rem;
                    font-variant-numeric: tabular-nums;
                }
                & .friend-row__add {
                    flex-shrink: 0; padding: ${s('sm')} ${s('lg')};
                    font-family: inherit; font-size: 0.9rem; font-weight: 700;
                    ${btn()}
                    background: ${t('primary')}; color: ${t('primary-text')}; border: none;
                    &.hidden { display: none; }
                    &:disabled { opacity: 0.5; cursor: default; }
                }
                & .friend-row__added {
                    flex-shrink: 0; font-size: 0.8rem; font-weight: 700;
                    color: ${t('accent')};
                    &.hidden { display: none; }
                }
                & .friend-row__remove {
                    width: 34px; height: 34px; flex-shrink: 0; ${btn()}
                    font-size: 0.9rem; color: ${t('text-muted')};
                }
            }
        }
    `;

    private svc = this.inject(FriendsService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    render(): DocumentFragment {
        const loggedIn = () => this.auth.currentUser.get() !== null;
        if (loggedIn()) void this.svc.load();

        const frag = this.wire(tpl, {
            anon: { className: () => (loggedIn() ? 'friends__anon hidden' : 'friends__anon') },
            toLogin: { onclick: () => this.router.navigate('/login', { query: { next: '/friends' } }) },
            body: { className: () => (loggedIn() ? 'friends__body' : 'friends__body hidden') },
            search: {
                value: () => this.svc.query.get(),
                oninput: (e: Event) => this.svc.setQuery((e.target as HTMLInputElement).value),
            },
            searchHint: {
                textContent: () => {
                    const q = this.svc.query.get().trim();
                    if (q.length > 0 && !isSearchable(q)) return 'Type at least 2 characters.';
                    if (this.svc.searching.get()) return 'Searching…';
                    return '';
                },
            },
            searchErr: { textContent: () => this.svc.searchError.get()?.message ?? '' },
            resultsEmpty: {
                className: () => {
                    const q = this.svc.query.get().trim();
                    const show =
                        isSearchable(q) &&
                        !this.svc.searching.get() &&
                        this.svc.searchError.get() === null &&
                        this.svc.resultsFor.get() === q &&
                        this.svc.results.get().length === 0;
                    return show ? 'friends__empty' : 'friends__empty hidden';
                },
            },
            friendsEmpty: {
                className: () =>
                    this.svc.loaded.get() && this.svc.friends.get().length === 0
                        ? 'friends__empty'
                        : 'friends__empty hidden',
            },
            // Sort toggle — only meaningful once there are friends to reorder.
            sortToggle: {
                className: () =>
                    this.svc.friends.get().length > 0
                        ? 'friends__sort'
                        : 'friends__sort hidden',
            },
            sortFrecency: {
                'aria-pressed': () => String(this.svc.sortMode.get() === 'frecency'),
                onclick: () => this.svc.setSortMode('frecency'),
            },
            sortAlpha: {
                'aria-pressed': () => String(this.svc.sortMode.get() === 'alpha'),
                onclick: () => this.svc.setSortMode('alpha'),
            },
        });

        // Search results — Add flips to a "✓ Friend" tick once added (isFriend
        // is updated locally by the service, so no re-search is needed).
        this.$each(
            this.ref(frag, 'results'),
            this.svc.results,
            (r, _i, track) =>
                this.wireEl(
                    resultTpl,
                    {
                        initials: () => initialsOf(r.displayName),
                        name: () => r.displayName,
                        username: () => `@${r.username}`,
                        hcp: () => (r.handicapIndex === null ? '–' : r.handicapIndex.toFixed(1)),
                        add: {
                            // Read the LIVE result row (the closed-over `r` goes
                            // stale after the local isFriend flip).
                            className: () => (this.isFriendNow(r.id) ? 'friend-row__add hidden' : 'friend-row__add'),
                            disabled: () => this.svc.mutating.get(),
                            onclick: () => {
                                const live = this.svc.results.get().find((x) => x.id === r.id);
                                if (live && !live.isFriend) void this.svc.add(live);
                            },
                        },
                        added: {
                            className: () => (this.isFriendNow(r.id) ? 'friend-row__added' : 'friend-row__added hidden'),
                        },
                    },
                    track,
                ),
            (r) => r.id,
        );

        // My friends — reordered live by the Suggested⇄A–Z toggle; the subtitle
        // ("played 6×, last week") self-explains the Suggested order. `now` is
        // captured once per render for a stable relative time.
        const now = new Date().toISOString();
        this.$each(
            this.ref(frag, 'friends'),
            () => sortFriends(this.svc.friends.get(), this.svc.sortMode.get()),
            (f: FriendProfile, _i, track) =>
                this.wireEl(
                    friendTpl,
                    {
                        initials: () => initialsOf(f.displayName),
                        name: () => f.displayName,
                        subtitle: () => {
                            const live = this.svc.friends.get().find((x) => x.id === f.id) ?? f;
                            return friendSubtitle(live, now);
                        },
                        hcp: () => (f.handicapIndex === null ? '–' : f.handicapIndex.toFixed(1)),
                        remove: {
                            disabled: () => this.svc.mutating.get(),
                            onclick: () => void this.svc.remove(f.id),
                        },
                    },
                    track,
                ),
            (f) => f.id,
        );

        return frag;
    }

    /** isFriend for a result id, tracking the live results signal. */
    private isFriendNow(id: string): boolean {
        return this.svc.results.get().find((x) => x.id === id)?.isFriend === true;
    }
}
