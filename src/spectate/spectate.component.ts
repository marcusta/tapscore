import { Component, Router, effect, template, untrack } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn } from '../css';
import { renderCards, renderSlotLeaderboard } from '../round/result-render';
import { LeaderboardComponent } from '../round/leaderboard.component';
import { formatRowDate } from '../landing/rows';
import { SpectateService } from './spectate.service';
import {
    READ_ONLY_NOTE,
    SPECTATE_REFUSAL_COPY,
    spectateSubtitle,
    spectateTitle,
} from './spectate-copy';

// The read-only spectate view (`/spectate?id=…&name=…`) — a friend's round,
// watched. Every entry affordance is ABSENT, not disabled: there is no score
// button to grey out, and the one sentence under the board explains why.
//
// The boards are the same canonical sections every leaderboard renders —
// `result-render` lays out whatever the server built, and this component
// reuses `LeaderboardComponent`'s stylesheet verbatim (appended below) so a
// watched round and an owned round paint identically. Round links arrive here
// by round ID; the payload carries no share token by construction.
//
// v1 is fetch-only — no SSE. The follow-up is noted on `SpectateService`.

const tpl = template(`
    <div class="spectate">
        <button bind="back" class="spectate__back" type="button">Back</button>

        <div bind="anon" class="spectate__anon">
            <p>Watching a round lives behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>

        <div bind="refusal" class="spectate__refusal">
            <p bind="refusalTitle" class="spectate__refusaltitle"></p>
            <p bind="refusalMsg" class="spectate__state"></p>
        </div>

        <p bind="state" class="spectate__state"></p>
        <button bind="retry" class="spectate__retry" type="button">Try again</button>

        <div bind="body" class="spectate__body">
            <header class="spectate__head">
                <div class="spectate__titlerow">
                    <h1 bind="title"></h1>
                    <span bind="status" class="spectate__status"></span>
                </div>
                <p bind="subtitle" class="spectate__subtitle"></p>
                <p bind="date" class="spectate__date"></p>
            </header>

            <div bind="board" class="lb"></div>

            <p class="spectate__note">${READ_ONLY_NOTE}</p>
        </div>
    </div>
`);

export class SpectateComponent extends Component {
    // The lb styles are appended so the board rules exist even when the
    // ordinary leaderboard has never mounted in this session. Style injection
    // is per-component-class, so the worst case is one duplicated (identical)
    // stylesheet when both screens have been visited.
    static styles = `
        .spectate {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .spectate__back {
                ${btn()}
                margin-bottom: ${s('lg')};
                padding: ${s('xs')} ${s('md')};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .spectate__anon {
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
            & .spectate__refusal.hidden { display: none; }
            & .spectate__refusaltitle { margin: 0; font-weight: 700; }
            & .spectate__state {
                margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.9rem;
                &:empty { display: none; }
            }
            & .spectate__retry {
                ${btn()}
                margin-top: ${s('md')};
                padding: ${s('sm')} ${s('lg')};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
            }

            & .spectate__body.hidden { display: none; }

            & .spectate__head { margin-bottom: ${s('sm')}; }
            & .spectate__titlerow {
                display: flex; align-items: baseline; gap: ${s('md')};
                justify-content: space-between;
                & h1 {
                    margin: 0;
                    font-family: ${t('font-display')};
                    font-weight: 600; font-size: 1.35rem; letter-spacing: -0.02em;
                    min-width: 0;
                }
            }
            & .spectate__status {
                font-size: 0.7rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.08em;
                border-radius: ${t('radius-pill')};
                padding: 2px 10px; flex-shrink: 0;
                &.s-active { background: ${t('accent-soft')}; color: ${t('accent')}; }
                &.s-complete, &.s-not_started {
                    background: ${t('surface-sunken')}; color: ${t('text-muted')};
                }
                &:empty { display: none; }
            }
            & .spectate__subtitle {
                margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.9rem;
                &:empty { display: none; }
            }
            & .spectate__date {
                margin: 2px 0 0; color: ${t('text-muted')}; font-size: 0.85rem;
                &:empty { display: none; }
            }

            & .spectate__slot-head {
                margin: ${s('xl')} 0 ${s('sm')};
                font-family: ${t('font-display')};
                font-weight: 600; font-size: 1.1rem;
            }

            & .spectate__note {
                margin: ${s('xl')} 0 0;
                color: ${t('text-muted')}; font-size: 0.85rem;
                text-align: center;
            }
        }
        ${LeaderboardComponent.styles}
    `;

    private svc = this.inject(SpectateService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    render(): DocumentFragment {
        const idQ = this.router.query('id');
        const nameQ = this.router.query('name');
        const loggedIn = () => this.auth.currentUser.get() !== null;

        // Same effect/untrack seam as the other id-addressed screens.
        this.track(
            effect(() => {
                const id = idQ.get();
                untrack(() => {
                    if (!id || !loggedIn()) return;
                    this.svc.setRound(id);
                    void this.svc.load();
                });
            }),
        );

        const view = () => this.svc.view.get();
        const refusal = () => this.svc.unavailable.get();
        const friendName = () => (nameQ.get() ?? '').trim() || null;

        const frag = this.wire(tpl, {
            // Back falls back to home: on a fresh-tab deep link there is no
            // history to pop, and a dead Back button reads as broken.
            back: {
                onclick: () => {
                    if (window.history.length > 1) window.history.back();
                    else this.router.navigate('/');
                },
            },
            anon: { className: () => (loggedIn() ? 'spectate__anon hidden' : 'spectate__anon') },
            toLogin: {
                onclick: () =>
                    this.router.navigate('/login', {
                        query: {
                            next: `/spectate?id=${idQ.get() ?? ''}&name=${encodeURIComponent(friendName() ?? '')}`,
                        },
                    }),
            },
            refusal: {
                className: () =>
                    loggedIn() && refusal() !== null ? 'spectate__refusal' : 'spectate__refusal hidden',
            },
            refusalTitle: {
                textContent: () => {
                    const r = refusal();
                    return r ? SPECTATE_REFUSAL_COPY[r].title : '';
                },
            },
            refusalMsg: {
                textContent: () => {
                    const r = refusal();
                    return r ? SPECTATE_REFUSAL_COPY[r].message : '';
                },
            },
            state: {
                textContent: () => {
                    if (refusal() !== null || !loggedIn()) return '';
                    if (this.svc.loading.get() && view() === null) return 'Loading…';
                    if (view() === null) return this.svc.error.get() ?? '';
                    return '';
                },
            },
            retry: {
                className: () =>
                    loggedIn() &&
                    refusal() === null &&
                    this.svc.error.get() !== null &&
                    view() === null &&
                    !this.svc.loading.get()
                        ? 'spectate__retry'
                        : 'spectate__retry hidden',
                onclick: () => void this.svc.load(true),
            },
            body: {
                className: () =>
                    loggedIn() && refusal() === null && view() !== null
                        ? 'spectate__body'
                        : 'spectate__body hidden',
            },
            title: {
                textContent: () => {
                    const v = view();
                    if (!v) return '';
                    return spectateTitle(friendName(), v.round.name, v.round.courseNameSnapshot);
                },
            },
            // LIVE vs finished: an active round wears the pill; the non-active
            // states are worded in the subtitle by `spectateSubtitle`.
            status: {
                textContent: () => {
                    const v = view();
                    if (!v) return '';
                    return v.status === 'active' ? 'Live' : '';
                },
                className: () => `spectate__status s-${view()?.status ?? ''}`,
            },
            subtitle: {
                textContent: () => {
                    const v = view();
                    if (!v) return '';
                    return (
                        spectateSubtitle(
                            v.round.name,
                            v.round.courseNameSnapshot,
                            v.status,
                            v.round.playHoles.length || null,
                        ) ?? ''
                    );
                },
            },
            date: { textContent: () => formatRowDate(view()?.round.date ?? null) },
            board: { innerHTML: () => this.renderBoards() },
        });

        return frag;
    }

    /** Every slot's canonical sections, formatLabel-headed. The client never
     *  interprets a scoring-mode string — `result-render` lays out whatever
     *  sections the server built. */
    private renderBoards(): string {
        const v = this.svc.view.get();
        if (!v) return '';
        const nameOf = (id: string) => this.svc.nameOf(id);
        const groupOf = (id: string) => this.svc.groupLabelOf(id);
        const slots = v.result.slots;
        if (slots.length === 0) return '<div class="lb-empty">No formats in this round.</div>';
        return slots
            .map((slot) => {
                const heading =
                    slots.length > 1
                        ? `<h2 class="spectate__slot-head">${escapeHtml(slot.formatLabel)}</h2>`
                        : '';
                const board = renderSlotLeaderboard(slot, nameOf, groupOf);
                const cards = renderCards(slot.cards, v.result.routeSections, nameOf);
                const cardsBlock = cards ? `<h3 class="lb-cards__head">Scorecard</h3>${cards}` : '';
                return heading + board + cardsBlock;
            })
            .join('');
    }
}

function escapeHtml(text: string): string {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}
