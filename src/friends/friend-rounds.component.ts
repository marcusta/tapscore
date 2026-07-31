import { Component, Router, effect, template, untrack } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { FriendProfileService } from './friend-profile.service';
import { UNAVAILABILITY_COPY, canLoadMore } from './friend-profile-model';
import { friendRoundRowBindings, friendRoundRowCss, friendRoundRowTpl } from './friend-round-row';

// A friend's full round list (`/friend-rounds?id=…&name=…`) — newest first,
// keyset-paged. The cursor is opaque and rides back verbatim; `hasMore` is the
// only stop condition. There is deliberately no count in the header and no
// terminal "that's all N" row: the profile card's `roundsTotal` counts private
// and link rounds this list will never show, so any sentence equating the two
// would be a lie.
//
// Paging is a "Show more" BUTTON, not infinite scroll — a deliberate call:
// the scroll container belongs to the app shell (`.app-shell__content`), the
// framework's `$each` has no row-appearance hook, and an IntersectionObserver
// sentinel would be the first of its kind in this codebase. The button is
// deterministic, testable through the same service guards, and honest about
// when a network read happens.

const tpl = template(`
    <div class="frounds">
        <button bind="back" class="frounds__back" type="button">Back to profile</button>

        <header class="frounds__head">
            <h1>Rounds</h1>
            <p bind="subtitle"></p>
        </header>

        <div bind="anon" class="frounds__anon">
            <p>This list lives behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>

        <div bind="refusal" class="frounds__refusal">
            <p bind="refusalTitle" class="frounds__refusaltitle"></p>
            <p bind="refusalMsg" class="frounds__state"></p>
        </div>

        <p bind="state" class="frounds__state"></p>
        <button bind="retry" class="frounds__retry" type="button">Try again</button>
        <p bind="empty" class="frounds__state">No rounds are shared with you.</p>

        <div bind="listCard" class="frounds__listcard">
            <div bind="list"></div>
        </div>
        <button bind="more" class="frounds__more" type="button"></button>
        <p bind="moreError" class="frounds__state"></p>
    </div>
`);

export class FriendRoundsComponent extends Component {
    static styles = `
        .frounds {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .frounds__back {
                ${btn()}
                margin-bottom: ${s('lg')};
                padding: ${s('xs')} ${s('md')};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .frounds__head {
                margin-bottom: ${s('xl')};
                & h1 {
                    margin: 0;
                    font-family: ${t('font-display')};
                    font-weight: 600; font-size: 1.7rem; letter-spacing: -0.02em;
                }
                & p { margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.9rem; }
            }

            & .frounds__anon {
                text-align: center;
                padding: ${s('2xl')} 0;
                color: ${t('text-muted')};
                &.hidden { display: none; }
                & button {
                    ${btn()}
                    margin-top: ${s('md')};
                    padding: ${s('md')} ${s('xl')};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${t('primary')}; color: ${t('primary-text')}; border: none;
                }
            }
            & .frounds__refusal.hidden { display: none; }
            & .frounds__refusaltitle { margin: 0; font-weight: 700; }
            & .frounds__state {
                margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.9rem;
                &:empty { display: none; }
                &.hidden { display: none; }
            }
            & .frounds__retry {
                ${btn()}
                margin-top: ${s('md')};
                padding: ${s('sm')} ${s('lg')};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
            }

            & .frounds__listcard {
                ${card()}
                overflow: hidden;
                &.hidden { display: none; }
                & .fr-row:last-child { border-bottom: none; }
            }
            ${friendRoundRowCss()}

            & .frounds__more {
                ${btn()}
                display: block;
                margin: ${s('md')} auto 0;
                padding: ${s('sm')} ${s('xl')};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
                &:disabled { opacity: 0.6; cursor: default; }
            }
        }
    `;

    private svc = this.inject(FriendProfileService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    render(): DocumentFragment {
        const idQ = this.router.query('id');
        const nameQ = this.router.query('name');
        const loggedIn = () => this.auth.currentUser.get() !== null;

        // Same effect/untrack seam as the profile page — see the note there.
        this.track(
            effect(() => {
                const id = idQ.get();
                untrack(() => {
                    if (!id || !loggedIn()) return;
                    this.svc.setPlayer(id);
                    void this.svc.loadRounds();
                });
            }),
        );

        const state = () => this.svc.rounds.get();
        const refusal = () => this.svc.unavailable.get();
        const friendName = () => (nameQ.get() ?? '').trim();
        const openRound = (roundId: string) =>
            this.router.navigate('/spectate', { query: { id: roundId, name: friendName() } });
        const backToProfile = () =>
            this.router.navigate('/friend', { query: { id: idQ.get() ?? '', name: friendName() } });

        const frag = this.wire(tpl, {
            back: { onclick: backToProfile },
            subtitle: {
                textContent: () => {
                    const name = friendName();
                    return name
                        ? `Rounds ${name} has shared with friends.`
                        : 'Rounds shared with friends.';
                },
            },
            refusal: {
                className: () => (refusal() !== null ? 'frounds__refusal' : 'frounds__refusal hidden'),
            },
            refusalTitle: {
                textContent: () => {
                    const r = refusal();
                    return r ? UNAVAILABILITY_COPY[r].title : '';
                },
            },
            refusalMsg: {
                textContent: () => {
                    const r = refusal();
                    return r ? UNAVAILABILITY_COPY[r].message : '';
                },
            },
            anon: { className: () => (loggedIn() ? 'frounds__anon hidden' : 'frounds__anon') },
            toLogin: {
                // Round-trip back to THIS list — `navigate` parses the inline
                // query, so the id and name survive the sign-in.
                onclick: () =>
                    this.router.navigate('/login', {
                        query: {
                            next: `/friend-rounds?id=${idQ.get() ?? ''}&name=${encodeURIComponent(nameQ.get() ?? '')}`,
                        },
                    }),
            },
            state: {
                textContent: () => {
                    if (refusal() !== null || !loggedIn()) return '';
                    if (this.svc.roundsLoading.get()) return 'Loading…';
                    if (state().rounds.length === 0) return this.svc.roundsError.get() ?? '';
                    return '';
                },
            },
            retry: {
                className: () =>
                    refusal() === null &&
                    this.svc.roundsError.get() !== null &&
                    state().rounds.length === 0 &&
                    !this.svc.roundsLoading.get()
                        ? 'frounds__retry'
                        : 'frounds__retry hidden',
                onclick: () => void this.svc.loadRounds(true),
            },
            empty: {
                className: () =>
                    refusal() === null &&
                    this.svc.roundsLoaded.get() &&
                    state().rounds.length === 0 &&
                    this.svc.roundsError.get() === null
                        ? 'frounds__state'
                        : 'frounds__state hidden',
            },
            listCard: {
                className: () =>
                    refusal() === null && state().rounds.length > 0
                        ? 'frounds__listcard'
                        : 'frounds__listcard hidden',
            },
            more: {
                className: () =>
                    refusal() === null && canLoadMore(state()) && state().rounds.length > 0
                        ? 'frounds__more'
                        : 'frounds__more hidden',
                disabled: () => this.svc.loadingMore.get(),
                textContent: () =>
                    this.svc.loadingMore.get() ? 'Loading…' : 'Show more rounds',
                onclick: () => void this.svc.loadMoreRounds(),
            },
            // A failed PAGE keeps what is on screen and reports under the list.
            moreError: {
                textContent: () =>
                    state().rounds.length > 0 ? this.svc.roundsError.get() ?? '' : '',
            },
        });

        this.$each(
            this.ref(frag, 'list'),
            () => (refusal() === null ? state().rounds : []),
            (entry, _i, track) =>
                this.wireEl(friendRoundRowTpl, friendRoundRowBindings(entry, openRound), track),
            (entry) => entry.roundId,
        );

        return frag;
    }
}
