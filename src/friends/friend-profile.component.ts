import { Component, Computed, Router, effect, template, untrack } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { avatarBadgeBindings, avatarBadgeCss, avatarBadgeMarkup } from '../app/avatar-badge';
import { FriendProfileService } from './friend-profile.service';
import { FriendsActivityService } from './friends-activity.service';
import { presenceFor, presenceLine } from './friends-activity-model';
import {
    UNAVAILABILITY_COPY,
    coursesSummary,
    identityLine,
} from './friend-profile-model';
import { friendRoundRowBindings, friendRoundRowCss, friendRoundRowTpl } from './friend-round-row';

// A friend's profile — reached only from a MUTUAL row on /friends (one-way
// rows stay inert there). The same product as iOS `FriendProfileScreen`: same
// cards, same copy, same rules.
//
// Read-only by construction: the service behind this surface holds a player id
// and calls session-authorized reads, nothing else. A tapped round opens the
// spectate surface by round ID — never by token, which the profile payload
// does not carry in the first place.
//
// The card's counts and the lists below them disagree on purpose (private and
// link rounds count, only `friends`-visible ones list). This screen keeps the
// two apart: the aggregates live on the profile card, and no list header or
// terminal row ever restates a count.
//
// Routes are static in this app, so the subject travels as query parameters
// (`/friend?id=…&name=…`) — `name` is presentation only, so the header has a
// name before the payload lands (and on refusal, where it never will).

const tpl = template(`
    <div class="fprofile">
        <button bind="back" class="fprofile__back" type="button">Back to friends</button>

        <div bind="anon" class="fprofile__anon">
            <p>Friend profiles live behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>

        <div bind="pending" class="fprofile__pending">
            <h1 bind="pendingName" class="fprofile__pendingname"></h1>
            <p bind="state" class="fprofile__state"></p>
            <button bind="retry" class="fprofile__retry" type="button">Try again</button>
        </div>

        <div bind="refusal" class="fprofile__refusal">
            <h1 bind="refusalName" class="fprofile__pendingname"></h1>
            <p bind="refusalTitle" class="fprofile__refusaltitle"></p>
            <p bind="refusalMsg" class="fprofile__state"></p>
        </div>

        <div bind="body" class="fprofile__body">
            <div class="fprofile__card">
                <div class="fprofile__band"></div>
                ${avatarBadgeMarkup('fprofile__avatar')}
                <div class="fprofile__who">
                    <h1 bind="name"></h1>
                    <p bind="username" class="fprofile__username"></p>
                    <p bind="identity" class="fprofile__identity"></p>
                    <button bind="live" class="fprofile__live" type="button"></button>
                </div>
                <div class="fprofile__stats">
                    <span class="fprofile__stat">
                        <span bind="statRounds" class="fprofile__statnum"></span>
                        <span class="fprofile__statlabel">Rounds</span>
                    </span>
                    <span class="fprofile__stat">
                        <span bind="statYear" class="fprofile__statnum"></span>
                        <span class="fprofile__statlabel">This year</span>
                    </span>
                    <span class="fprofile__stat">
                        <span bind="statCourses" class="fprofile__statnum"></span>
                        <span class="fprofile__statlabel">Courses</span>
                    </span>
                </div>
            </div>

            <section class="fprofile__section">
                <h2>Recent rounds</h2>
                <p bind="recentEmpty" class="fprofile__hint">No rounds are shared with you.</p>
                <div bind="recentCard" class="fprofile__listcard">
                    <div bind="recentList"></div>
                    <button bind="seeAll" class="fprofile__more" type="button">
                        <span>See all rounds</span>
                        <span class="fprofile__chev" aria-hidden="true"></span>
                    </button>
                </div>
            </section>

            <section class="fprofile__section">
                <h2>Courses</h2>
                <div class="fprofile__listcard">
                    <button bind="coursesRow" class="fprofile__more" type="button">
                        <span class="fprofile__morecol">
                            <span bind="coursesLine"></span>
                            <span class="fprofile__moresub">See where they play</span>
                        </span>
                        <span class="fprofile__chev" aria-hidden="true"></span>
                    </button>
                </div>
            </section>
        </div>
    </div>
`);

export class FriendProfileComponent extends Component {
    static styles = `
        .fprofile {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .fprofile__back {
                ${btn()}
                margin-bottom: ${s('lg')};
                padding: ${s('xs')} ${s('md')};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .fprofile__anon {
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

            & .fprofile__pending.hidden, & .fprofile__refusal.hidden { display: none; }
            & .fprofile__pendingname {
                margin: 0 0 ${s('sm')};
                font-family: ${t('font-display')};
                font-weight: 600; font-size: 1.7rem; letter-spacing: -0.02em;
            }
            & .fprofile__refusaltitle { margin: 0; font-weight: 700; }
            & .fprofile__state {
                margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.9rem;
                &:empty { display: none; }
            }
            & .fprofile__retry {
                ${btn()}
                margin-top: ${s('md')};
                padding: ${s('sm')} ${s('lg')};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
            }

            & .fprofile__body.hidden { display: none; }

            /* The header is the screen's one moment of ceremony: a soft accent
               band behind a large centered avatar — the portrait straddles the
               band the way a clubhouse portrait hangs over the wainscot. */
            & .fprofile__card {
                ${card()}
                overflow: hidden;
                text-align: center;
                margin-bottom: ${s('xl')};

                & .fprofile__band {
                    height: 72px;
                    background: ${t('accent-soft')};
                }
                & .fprofile__avatar {
                    ${avatarBadgeCss(96, '2rem')}
                    margin: -48px auto 0;
                    background: ${t('primary')}; color: ${t('primary-text')};
                    border: 3px solid ${t('surface')};
                }
                & .fprofile__who {
                    padding: ${s('sm')} ${s('lg')} 0;
                    & h1 {
                        margin: ${s('xs')} 0 0;
                        font-family: ${t('font-display')};
                        font-weight: 600; font-size: 1.5rem; letter-spacing: -0.02em;
                    }
                }
                & .fprofile__username {
                    margin: 1px 0 0; color: ${t('text-muted')}; font-size: 0.8rem;
                }
                & .fprofile__identity {
                    margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.9rem;
                    &:empty { display: none; }
                }
                & .fprofile__live {
                    ${btn()}
                    margin-top: ${s('xs')};
                    padding: 2px ${s('sm')};
                    background: none; border: none;
                    font-family: inherit; font-size: 0.85rem; font-weight: 700;
                    color: ${t('accent')};
                    &.hidden { display: none; }
                }
                & .fprofile__stats {
                    display: flex;
                    padding: ${s('lg')} 0;
                }
                & .fprofile__stat {
                    flex: 1;
                    display: flex; flex-direction: column; gap: 1px;
                }
                /* The aggregates — the one place the full counts belong. They
                   include rounds the lists below will not show, by design. */
                & .fprofile__statnum {
                    font-family: ${t('font-display')};
                    font-weight: 600; font-size: 1.5rem;
                    color: ${t('primary')};
                }
                & .fprofile__statlabel { font-size: 0.75rem; color: ${t('text-muted')}; }
            }

            & .fprofile__section {
                margin-bottom: ${s('xl')};
                & h2 {
                    margin: 0 0 ${s('sm')};
                    font-family: ${t('font-display')};
                    font-weight: 600; font-size: 1.2rem;
                }
            }
            /* The aggregates above may say plenty — the list can still be
               empty, because only rounds shared with friends appear here. */
            & .fprofile__hint {
                margin: 0; color: ${t('text-muted')}; font-size: 0.85rem;
                &.hidden { display: none; }
            }

            & .fprofile__listcard {
                ${card()}
                overflow: hidden;
                &.hidden { display: none; }
            }
            ${friendRoundRowCss()}
            & .fprofile__more {
                display: flex; align-items: center; gap: ${s('md')};
                width: 100%; min-height: 44px;
                padding: ${s('md')} ${s('lg')};
                background: none; border: none;
                font-family: inherit; font-size: 0.9rem; font-weight: 600;
                color: ${t('text')}; text-align: left; cursor: pointer;
                &:hover { background: ${t('hover-bg')}; }
                & > span:first-child { flex: 1; min-width: 0; }
            }
            & .fprofile__morecol {
                display: flex; flex-direction: column; gap: 1px;
            }
            & .fprofile__moresub {
                font-weight: 400; font-size: 0.8rem; color: ${t('text-muted')};
            }
            & .fprofile__chev {
                flex-shrink: 0;
                width: 0.45em; height: 0.45em;
                border-right: 2px solid ${t('accent')};
                border-bottom: 2px solid ${t('accent')};
                transform: rotate(-45deg);
            }
        }
    `;

    private svc = this.inject(FriendProfileService);
    private activity = this.inject(FriendsActivityService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    render(): DocumentFragment {
        const idQ = this.router.query('id');
        const nameQ = this.router.query('name');
        const loggedIn = () => this.auth.currentUser.get() !== null;

        // The id is read in an EFFECT, never in a field initializer or the
        // render body: the loads read and write service signals, and a
        // synchronous read here would subscribe the route swap to them
        // ($swap remounts on every change → refetch loop). `untrack` is the
        // seam, same as /round-stats.
        this.track(
            effect(() => {
                const id = idQ.get();
                untrack(() => {
                    if (!id || !loggedIn()) return;
                    this.svc.setPlayer(id);
                    void this.svc.loadProfile();
                    // Presence is the feed's call — best-effort decoration.
                    void this.activity.load();
                });
            }),
        );

        const profile = () => this.svc.profile.get();
        // The name from the tapped row, shown while the payload has not landed
        // (and on refusal, where it never will).
        const fallbackName = () => (nameQ.get() ?? '').trim() || 'Friend';
        const presence = new Computed(() => {
            const id = idQ.get();
            return id ? presenceFor(this.activity.feed.get(), id) : null;
        });
        const refusal = () => this.svc.unavailable.get();
        const showBody = () => loggedIn() && refusal() === null && profile() !== null;
        const showPending = () => loggedIn() && refusal() === null && profile() === null;

        const openRound = (roundId: string) =>
            this.router.navigate('/spectate', {
                query: { id: roundId, name: profile()?.player.displayName ?? fallbackName() },
            });

        const frag = this.wire(tpl, {
            back: { onclick: () => this.router.navigate('/friends') },
            anon: { className: () => (loggedIn() ? 'fprofile__anon hidden' : 'fprofile__anon') },
            toLogin: { onclick: () => this.router.navigate('/login', { query: { next: '/friends' } }) },

            pending: {
                className: () => (showPending() ? 'fprofile__pending' : 'fprofile__pending hidden'),
            },
            pendingName: { textContent: () => fallbackName() },
            state: {
                textContent: () => {
                    if (this.svc.profileLoading.get()) return 'Loading…';
                    return this.svc.profileError.get() ?? '';
                },
            },
            retry: {
                className: () =>
                    this.svc.profileError.get() !== null && !this.svc.profileLoading.get()
                        ? 'fprofile__retry'
                        : 'fprofile__retry hidden',
                onclick: () => void this.svc.loadProfile(true),
            },

            // The name still heads the refusal: the viewer opened this screen
            // for a specific person, and an anonymous "Profile not available"
            // would not say whose. 403/404 are calm full-page states — no
            // toast, no retry loop; back is the way out.
            refusal: {
                className: () =>
                    loggedIn() && refusal() !== null ? 'fprofile__refusal' : 'fprofile__refusal hidden',
            },
            refusalName: { textContent: () => fallbackName() },
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

            body: { className: () => (showBody() ? 'fprofile__body' : 'fprofile__body hidden') },
            ...avatarBadgeBindings(() => {
                const p = profile();
                return p
                    ? p.player
                    : { id: idQ.get() ?? '', avatarVersion: null, displayName: fallbackName(), username: null };
            }),
            name: { textContent: () => profile()?.player.displayName ?? '' },
            username: {
                textContent: () => {
                    const u = profile()?.player.username;
                    return u ? `@${u}` : '';
                },
            },
            // Absent halves are omitted, never dashed; both absent drops the
            // line (the :empty rule hides the element).
            identity: {
                textContent: () => {
                    const p = profile();
                    return p ? identityLine(p.player.handicapIndex, p.player.homeClubName) ?? '' : '';
                },
            },
            live: {
                className: () => (presence.get() ? 'fprofile__live' : 'fprofile__live hidden'),
                textContent: () => {
                    const pr = presence.get();
                    return pr ? presenceLine(pr) : '';
                },
                onclick: () => {
                    const pr = presence.get();
                    if (pr) openRound(pr.roundId);
                },
            },
            statRounds: () => String(profile()?.roundsTotal ?? ''),
            statYear: () => String(profile()?.roundsThisYear ?? ''),
            statCourses: () => String(profile()?.coursesTotal ?? ''),

            recentEmpty: {
                className: () =>
                    (profile()?.recentRounds.length ?? 0) === 0
                        ? 'fprofile__hint'
                        : 'fprofile__hint hidden',
            },
            recentCard: {
                className: () =>
                    (profile()?.recentRounds.length ?? 0) > 0
                        ? 'fprofile__listcard'
                        : 'fprofile__listcard hidden',
            },
            seeAll: {
                onclick: () =>
                    this.router.navigate('/friend-rounds', {
                        query: { id: idQ.get() ?? '', name: profile()?.player.displayName ?? fallbackName() },
                    }),
            },
            coursesLine: {
                textContent: () => coursesSummary(profile()?.coursesTotal ?? 0),
            },
            coursesRow: {
                onclick: () =>
                    this.router.navigate('/friend-courses', {
                        query: { id: idQ.get() ?? '', name: profile()?.player.displayName ?? fallbackName() },
                    }),
            },
        });

        this.$each(
            this.ref(frag, 'recentList'),
            () => profile()?.recentRounds ?? [],
            (entry, _i, track) =>
                this.wireEl(friendRoundRowTpl, friendRoundRowBindings(entry, openRound), track),
            (entry) => entry.roundId,
        );

        return frag;
    }
}
