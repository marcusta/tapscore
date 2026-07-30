import {
    Component,
    Computed,
    type QueryValue,
    Router,
    Signal,
    effect,
    template,
} from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { RoundViewService, type InitialPosition } from './round.service';
import { ScoreEntryComponent } from './score-entry.component';
import { LeaderboardComponent } from './leaderboard.component';
import { ClaimCardComponent } from './claim-card.component';
import { SeatCardComponent } from './seat-card.component';
import { JoinCardComponent } from './join-card.component';
import { HandicapCheckinComponent } from './handicap-checkin.component';
import { ManageOverlayComponent } from './manage-overlay.component';
import { formatLabelFromSlot } from './slot-labels';
import { roundHeaderTitle } from './header-title';
import { shouldPoll, shouldRefreshOnVisibility } from './poll-gate';
import { startLiveResult, type LiveResultFeed } from './live-result';
import type { FormatSlot } from '../api/rounds.gen';

type Tab = 'score' | 'leaderboard';

/** Leaderboard poll cadence (Phase 3.5) — interim substitute for Phase 9 push. */
const LEADERBOARD_POLL_MS = 20_000;

/**
 * `?slot=` is a `slotDefId` (opaque string) as of 2.7b. A pre-2.7b link may
 * still carry the old positional index — recognisable as a value that's
 * entirely digits — which is passed through as a legacy numeric fallback for
 * `RoundViewService` to resolve once. Anything else (absent, non-numeric) is
 * taken as-is: a real slotDefId, or `undefined` when there's no param at all.
 */
function parseSlotParam(raw: string | null): string | number | undefined {
    if (raw === null || raw === '') return undefined;
    return /^\d+$/.test(raw) ? Number(raw) : raw;
}

const tpl = template(`
    <div class="round-view">
        <div bind="main" class="round-view__main">
            <button bind="back" class="round-view__back" type="button">← Home</button>
            <div bind="notfound" class="round-view__notfound">That share link didn't lead to a round.</div>
            <div bind="body" class="round-view__body">
                <header class="round-view__head">
                    <div class="round-view__titles">
                        <h1 bind="title"></h1>
                        <span bind="course" class="round-view__course"></span>
                    </div>
                    <div class="round-view__chrome">
                        <span bind="status" class="round-view__status"></span>
                        <button bind="manageBtn" class="round-view__manage" type="button" aria-label="Manage round">⋯</button>
                    </div>
                </header>
                <div class="round-view__formats" bind="formats"></div>

                <div bind="scorePanel" class="round-view__panel">
                    <div bind="hcpCheckin"></div>
                    <div bind="groupTabs" class="round-view__groups hidden"></div>
                    <div bind="scoring"></div>

                    <div class="round-view__share">
                        <span class="round-view__share-label">Share this round</span>
                        <div class="round-view__share-row">
                            <input bind="shareUrl" class="round-view__share-url" readonly />
                            <button bind="copy" class="round-view__copy" type="button">Copy</button>
                        </div>
                        <p class="round-view__share-hint">Anyone with this link can open and score — no sign-in.</p>
                    </div>

                    <div bind="seats"></div>
                    <div bind="claim"></div>
                    <div bind="join"></div>
                </div>

                <div bind="lbPanel" class="round-view__panel hidden">
                    <div bind="leaderboard"></div>
                </div>
            </div>
        </div>

        <div bind="manageHost"></div>

        <div bind="dock" class="round-view__dock hidden">
            <div bind="holebar" class="round-hole hidden">
                <button bind="holePrev" class="round-hole__nav" type="button" aria-label="Previous hole">‹</button>
                <div class="round-hole__stats">
                    <div class="round-hole__stat"><span class="round-hole__lbl">Par</span><span bind="holePar" class="round-hole__val"></span></div>
                    <div class="round-hole__stat"><span class="round-hole__lbl">Hole</span><span bind="holeNum" class="round-hole__val"></span></div>
                    <div class="round-hole__stat"><span class="round-hole__lbl">SI</span><span bind="holeSi" class="round-hole__val"></span></div>
                </div>
                <button bind="holeNext" class="round-hole__nav" type="button" aria-label="Next hole">›</button>
            </div>
            <div class="round-tabs">
                <button bind="tabScore" class="round-tabs__tab" type="button">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    <span>Score</span>
                </button>
                <button bind="tabBoard" class="round-tabs__tab" type="button">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M6 4h12v5a6 6 0 0 1-12 0Z"/><path d="M9 19h6M10 22h4M12 15v4"/></svg>
                    <span>Leaderboard</span>
                </button>
            </div>
        </div>
    </div>
`);

const pillTpl = template(`<button bind="pill" class="round-view__fmt" type="button"></button>`);

const groupPillTpl = template(`<button bind="pill" class="round-view__grp" type="button"></button>`);

export class RoundComponent extends Component {
    static styles = `
        .round-view {
            height: 100%;
            display: flex;
            flex-direction: column;

            & .round-view__main {
                flex: 1;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                padding: ${s('lg')} ${s('lg')} ${s('2xl')};
            }

            & .round-view__back {
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 600;
                color: ${t('text-muted')};
                cursor: pointer;
                padding: ${s('xs')} 0;
                margin-bottom: ${s('md')};
            }

            & .round-view__notfound {
                color: ${t('text-muted')};
                padding: ${s('xl')} 0;

                &.hidden { display: none; }
            }

            & .round-view__body.hidden { display: none; }
            & .round-view__panel.hidden { display: none; }

            /* ONE band, not three. The title, the status and the manage
               affordance used to stack over a separate meta row, which spent a
               third of a phone screen on chrome before the first score. They
               are one row now, and the title itself is small (Golf GameBook's
               header, the owner's reference): the round's NAME with the course
               under it, rather than a 1.8rem course name and nothing else. */
            & .round-view__head {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: ${s('md')};

                & .round-view__titles {
                    min-width: 0;
                }

                & h1 {
                    margin: 0;
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 1.2rem;
                    letter-spacing: -0.02em;
                    color: ${t('text')};
                }

                /* The COURSE, and nothing else. The date is in the round list
                   (and, for a round that kept its default name, in the title
                   itself); the hole count is in the dock at the bottom of this
                   very screen. */
                & .round-view__course {
                    display: block;
                    color: ${t('text-muted')};
                    font-size: 0.8rem;
                }
            }

            /* Header chrome: the status badge and the "⋯" manage affordance,
               which is the single entry point to every round-level management
               action (edit / leave / finish / delete). It lives HERE, not in
               the score panel, so it is reachable from both tabs. */
            & .round-view__chrome {
                display: flex;
                align-items: center;
                gap: ${s('xs')};
                flex-shrink: 0;
            }

            & .round-view__manage {
                &.hidden { display: none; }
                width: 44px;
                height: 44px;
                flex-shrink: 0;
                background: none;
                border: none;
                border-radius: ${t('radius-pill')};
                font-family: inherit;
                font-size: 1.5rem;
                line-height: 1;
                color: ${t('text-muted')};
                cursor: pointer;

                &:hover, &:active { background: ${t('surface-sunken')}; color: ${t('text')}; }
                &:focus-visible { outline: 2px solid ${t('accent')}; outline-offset: 2px; }
            }

            & .round-view__status {
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                border-radius: ${t('radius-pill')};
                padding: 2px 10px;
                flex-shrink: 0;
                background: ${t('accent-soft')};
                color: ${t('accent')};
            }

            & .round-view__formats {
                margin-top: ${s('lg')};
                display: flex;
                gap: ${s('sm')};
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding-bottom: ${s('xs')};
                scrollbar-width: none;
                &::-webkit-scrollbar { display: none; }

                & .round-view__fmt {
                    flex: 0 0 auto;
                    border: 1px solid ${t('border')};
                    border-radius: ${t('radius-pill')};
                    background: ${t('btn-bg')};
                    color: ${t('text')};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    padding: ${s('sm')} ${s('lg')};
                    cursor: pointer;
                    white-space: nowrap;
                    &.active { background: ${t('primary')}; color: ${t('primary-text')}; border-color: ${t('primary')}; }
                }
            }

            /* Playing-group selector (Phase 3.5) — shown only when the round
               has 2+ groups; scopes the score carousel to one group's balls
               and its rotated itinerary. */
            & .round-view__groups {
                margin-top: ${s('md')};
                display: flex;
                gap: ${s('sm')};
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding-bottom: ${s('xs')};
                scrollbar-width: none;
                &::-webkit-scrollbar { display: none; }
                &.hidden { display: none; }

                & .round-view__grp {
                    flex: 0 0 auto;
                    border: 1px solid ${t('border')};
                    border-radius: ${t('radius-pill')};
                    background: ${t('btn-bg')};
                    color: ${t('text')};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    padding: ${s('sm')} ${s('lg')};
                    cursor: pointer;
                    white-space: nowrap;
                    font-variant-numeric: tabular-nums;
                    &.active { background: ${t('accent')}; color: ${t('primary-text')}; border-color: ${t('accent')}; }
                }
            }

            & .round-view__share {
                margin-top: ${s('2xl')};
                padding: ${s('lg')};
                ${card()}
                background: ${t('surface-sunken')};

                & .round-view__share-label {
                    font-weight: 700;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: ${t('text-muted')};
                }
                & .round-view__share-row {
                    display: flex;
                    gap: ${s('sm')};
                    margin-top: ${s('sm')};
                }
                & .round-view__share-url {
                    ${input()}
                    flex: 1;
                    font-size: 0.8rem;
                    color: ${t('text-muted')};
                }
                & .round-view__copy {
                    ${btn()}
                    padding: 0 ${s('lg')};
                    font-weight: 700;
                    background: ${t('primary')};
                    color: ${t('primary-text')};
                    border: none;
                }
                & .round-view__share-hint {
                    margin: ${s('sm')} 0 0;
                    font-size: 0.8rem;
                    color: ${t('text-muted')};
                }
            }
        }

        /* --- Pinned bottom dock: orange hole bar + Score/Leaderboard tabs --- */
        .round-view__dock {
            flex: 0 0 auto;
            box-shadow: ${t('shadow-elevated')};
            &.hidden { display: none; }
        }

        .round-hole {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${s('md')};
            background: ${t('hole-bar')};
            color: ${t('hole-bar-text')};
            padding: ${s('sm')} ${s('lg')};

            &.hidden { display: none; }

            & .round-hole__nav {
                flex: 0 0 auto;
                width: 40px;
                height: 40px;
                border: none;
                border-radius: ${t('radius-pill')};
                background: rgba(0, 0, 0, 0.1);
                color: inherit;
                font-size: 1.5rem;
                line-height: 1;
                cursor: pointer;
                &:active { background: rgba(0, 0, 0, 0.2); }
                &:disabled { opacity: 0.35; cursor: default; }
            }

            & .round-hole__stats { display: flex; gap: ${s('2xl')}; }
            & .round-hole__stat { display: flex; flex-direction: column; align-items: center; }
            & .round-hole__lbl {
                font-size: 0.62rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                opacity: 0.8;
            }
            & .round-hole__val {
                font-family: ${t('font-display')};
                font-weight: 700;
                font-size: 1.4rem;
                font-variant-numeric: tabular-nums;
            }
        }

        .round-tabs {
            display: flex;
            background: ${t('topbar-bg')};
            padding-bottom: env(safe-area-inset-bottom);

            & .round-tabs__tab {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 3px;
                padding: ${s('sm')} 0 ${s('md')};
                background: none;
                border: none;
                cursor: pointer;
                font-family: inherit;
                font-size: 0.7rem;
                font-weight: 700;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                color: rgba(247, 244, 234, 0.55);

                & svg { width: 24px; height: 24px; }
                &.active { color: ${t('accent')}; }
            }
        }
    `;

    private svc = this.inject(RoundViewService);
    private router = this.inject(Router);
    private tokenQ = this.router.query('token');
    // Tab + slot + hole live in the URL so a reload (or a shared link) lands on
    // the same view. `tab` seeds from `?tab=board`; slot/hole are restored into
    // the service via loadByToken's `initial` (see render). The single write
    // effect below mirrors all three back to the query string on every change.
    private initPos = this.readUrlPosition();
    private tab = new Signal<Tab>(this.initPos.tab);
    // Mirrors `document.hidden` (inverted) so the leaderboard-poll gate can
    // read it like any other reactive signal. Updated by a `visibilitychange`
    // listener wired in `render()` and torn down with the component.
    private pageVisible = new Signal(!document.hidden);

    private hasRound = new Computed(() => this.svc.round.get() !== null);
    private hasScoring = new Computed(() => this.svc.balls.get().length > 0);
    /** "Manage round" sheet visibility — owned here, opened by the header "⋯". */
    private manageOpen = new Signal(false);

    private shareUrl = new Computed(() => {
        const token = this.tokenQ.get();
        // Include the deploy base path (Vite BASE_URL) so the shared link works
        // under the production sub-path ('/tapscore/round'), not just at the root.
        const base = (import.meta.env?.BASE_URL ?? '/').replace(/\/+$/, '');
        return token ? `${location.origin}${base}/round?token=${token}` : '';
    });

    render(): DocumentFragment {
        this.track(
            effect(() => {
                const token = this.tokenQ.get();
                if (!token) return;
                // Pass the URL-restored position; loadByToken applies it only when
                // the token actually changed (a fresh open/reload).
                void this.svc.loadByToken(token, this.initPos).then(() => {
                    // Reloading straight into the leaderboard tab restores tab=board
                    // but never goes through the tab/pill click that fetches the
                    // result — so fetch it here, else the board reads "No results yet".
                    if (this.tab.get() === 'leaderboard') void this.svc.loadResult();
                });
            }),
        );

        // Coming back into coverage while this round is on screen: replay any
        // queued (never-acked) score writes without waiting for a reload or a
        // manual retry. Torn down with the component like every other listener.
        const onOnline = () => void this.svc.flushPending();
        window.addEventListener('online', onOnline);
        this.track(() => window.removeEventListener('online', onOnline));

        // Leaderboard poll (Phase 3.5, interim substitute for Phase 9 push).
        // `pageVisible` mirrors `document.hidden` so the gate reads it like
        // any other signal; the listener is torn down the same way `online`
        // is above.
        // The live-feed state the gate effect below owns. Declared HERE, ahead
        // of the visibility listener, because that listener has to ask one
        // question of it — "is a stream about to come up?" — to avoid
        // double-fetching (see `onVisibility`). Everything that mutates them
        // still lives in the effect.
        let feed: LiveResultFeed | null = null;
        let feedToken: string | null = null;
        let pollTimer: ReturnType<typeof setInterval> | null = null;
        let degraded = false;

        // Foreground refresh (mirrors the iOS scene contract): coming back to a
        // visible page refetches round + result + scorecard ONCE, whatever tab
        // is up. The gate below restarts the stream on the same flip, but that
        // only re-primes the leaderboard — a pocketed phone returning to the
        // score tab would otherwise show a stale grid until someone scored.
        // Guarded on an actual hidden→visible transition so a `visibilitychange`
        // that reports "still visible" can't double-fetch.
        //
        // …and when the stream IS coming back on this same flip, its connect
        // frame already refetches result + scorecard, so this asks only for the
        // round — one fetch of each per foreground, not two. When no stream
        // will arrive (degraded, or a gate that stays shut), the full refresh
        // is the only thing that freshens anything, so it runs unchanged.
        const feedWillReconnect = (visible: boolean): boolean =>
            !degraded &&
            shouldPoll({ pageVisible: visible, status: this.svc.round.get()?.status ?? null });
        const onVisibility = () => {
            const visible = !document.hidden;
            const refresh = shouldRefreshOnVisibility(this.pageVisible.get(), visible);
            const willReconnect = feedWillReconnect(visible);
            this.pageVisible.set(visible);
            if (refresh && this.tokenQ.get()) {
                void this.svc.refreshAll({ feedWillReconnect: willReconnect });
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        this.track(() => document.removeEventListener('visibilitychange', onVisibility));

        // One live feed, started/stopped by the shared gate (Slice 9a), which as
        // of 2026-07-28 no longer looks at the tab: the stream runs for as long
        // as this round view is on a visible page and the round is unfinished,
        // because the SCORE tab shows the whole group's scores and needs the
        // same freshness the leaderboard does. The effect re-evaluates on every
        // visibility change and round-status change (not_started → active on the
        // first score, or → complete from another device via the stream), and
        // navigating away (this effect's disposer, and the whole component's
        // teardown via `track`) disconnects — never an orphaned stream or timer
        // surviving a route change.
        //
        // `degraded` survives re-runs while the gate stays true, so a repeatedly
        // failing stream isn't retried on every unrelated signal change; closing
        // the gate (backgrounding, or leaving the leaderboard) clears it, so
        // coming back tries the stream fresh.
        //
        // The whole thing is keyed on the token in `feedToken`, because a
        // ?token=-only URL change does NOT remount this component (routes key on
        // the pathname; the load effect re-loads in place). Without the key,
        // round A's stream would stay open and pipe A's status and refetches
        // into round B's service.
        const stopPollTimer = () => {
            if (pollTimer === null) return;
            clearInterval(pollTimer);
            pollTimer = null;
        };
        const startPollTimer = () => {
            if (pollTimer !== null) return;
            pollTimer = setInterval(() => {
                // Both surfaces, same as a live event: the gate is no longer
                // leaderboard-only, so the degraded path has to keep the score
                // grid fresh too.
                //
                // COST, stated plainly: this doubles the fallback's traffic to
                // 2 requests / 20 s per visible round view (~6/min), and it only
                // ever runs when the stream has already given up. The cursored
                // result answers `{ unchanged: true }` on a quiet round and the
                // scorecard is one small array, so the widening is bytes, not
                // work — and the alternative is the bug this whole slice exists
                // for: a score grid that stays stale exactly when reception is
                // bad enough to have killed the stream.
                void this.svc.pollResult();
                void this.svc.refreshScorecard();
            }, LEADERBOARD_POLL_MS);
        };
        this.track(
            effect(() => {
                // Read the token FIRST, before any early return, so it is
                // always a tracked dependency of this effect — reading it after
                // the "already streaming" guard would leave the leaked state
                // (feed open on the old round) untracked and permanent.
                const token = this.tokenQ.get() || null;
                const gate = shouldPoll({
                    pageVisible: this.pageVisible.get(),
                    status: this.svc.round.get()?.status ?? null,
                });
                // A token change is a different round: drop the old stream and
                // the old fallback timer, and clear the degrade latch so the
                // new round gets a fresh SSE attempt rather than inheriting the
                // previous round's failure.
                if (feedToken !== token) {
                    feed?.stop();
                    feed = null;
                    feedToken = null;
                    stopPollTimer();
                    degraded = false;
                }
                if (!gate) {
                    feed?.stop();
                    feed = null;
                    feedToken = null;
                    stopPollTimer();
                    degraded = false;
                    return;
                }
                if (degraded) {
                    // Fallback path: the Phase 3.5 interval, now widened to
                    // result + scorecard (see `startPollTimer` for the cost).
                    // It deliberately cannot notice a remote status change, so a
                    // round finished on another device will not close the gate
                    // while we are degraded — the poll runs until the view is
                    // left or backgrounded. That is inherited Phase 3.5
                    // behaviour: the result envelope carries no status, and
                    // changing that contract is out of Slice 9a's scope (the
                    // stream is what makes the gate self-closing again).
                    //
                    // FOLLOW-UP, when a server slice is open: put `status` on the
                    // result envelope. It is one field on a response the poll
                    // already makes, it costs no extra request, and it would let
                    // the degraded path close its own gate on a remote finish
                    // exactly as the stream does — retiring the caveat above
                    // rather than documenting it a third time.
                    startPollTimer();
                    return;
                }
                if (feed !== null) return;
                if (!token) return;
                feedToken = token;
                try {
                    const started = startLiveResult({
                        token,
                        since: this.svc.persistedCursor(token),
                        onEvent: (ev) => this.svc.onLiveResultEvent(ev),
                        onDegrade: () => {
                            // The feed has already closed itself; fall back to
                            // the Phase 3.5 interval for as long as the gate
                            // holds.
                            feed = null;
                            degraded = true;
                            startPollTimer();
                        },
                    });
                    // `onDegrade` can fire synchronously from inside
                    // `startLiveResult` (a factory that throws on the very first
                    // connect). It nulls `feed`, so only adopt the handle if the
                    // stream is actually live — otherwise this assignment would
                    // resurrect a stopped feed and block the fallback path.
                    if (!degraded) feed = started;
                } catch {
                    // A hardened WebView can throw from the EventSource
                    // constructor itself; without this catch the effect would
                    // be wedged with feedToken set and neither stream nor
                    // fallback running. feedToken stays set so a token change
                    // is still detected while degraded.
                    feed = null;
                    degraded = true;
                    startPollTimer();
                }
            }),
        );
        this.track(() => {
            feed?.stop();
            feed = null;
            feedToken = null;
            stopPollTimer();
        });

        // Mirror tab + selected slot + current hole back into the query string
        // (replace, so it doesn't pollute history). Gated on a loaded round so the
        // pre-load defaults (score / slot 0 / hole 0) can't clobber the URL we
        // just read on mount. Reading all three signals makes this reactive to a
        // tab switch, a pill tap, an arrow/swipe — each rewrites the URL in place.
        this.track(
            effect(() => {
                const tab = this.tab.get();
                const slotDefId = this.svc.selectedSlotDefId();
                const holeIdx = this.svc.holeIdx.get();
                // Only ever rewrite OUR OWN URL. `navigate(route.get())` below
                // tracks the route, so leaving /round fires this once more —
                // without the guard it stamps `?token=` over the next screen's
                // query (e.g. clobbering /login?next=/friends).
                if (this.router.route.get() !== '/round') return;
                if (!this.hasRound.get()) return;
                // Never write a /round URL without the token. A torn-down view's
                // copy of this effect can still be queued in the scheduler when we
                // navigate back in; it runs with a stale (undefined) `tokenQ` and
                // would otherwise replace '/round?token=X' with a bare '/round',
                // emptying the share field.
                const token = this.tokenQ.get();
                if (!token) return;
                const query: Record<string, QueryValue> = { token };
                if (tab === 'leaderboard') query.tab = 'board';
                const firstSlotId = this.svc.round.get()?.formatSlots[0]?.slotDefId ?? null;
                if (slotDefId && slotDefId !== firstSlotId) query.slot = slotDefId;
                if (holeIdx > 0) query.hole = holeIdx + 1;
                this.router.navigate(this.router.route.get(), { replace: true, query });
            }),
        );

        const statusText: Record<string, string> = {
            not_started: 'Not started',
            active: 'Live',
            complete: 'Finished',
        };

        const frag = this.wire(tpl, {
            back: { onclick: () => this.router.navigate('/') },
            notfound: {
                className: () =>
                    !this.hasRound.get() && !this.svc.loading.get()
                        ? 'round-view__notfound'
                        : 'round-view__notfound hidden',
            },
            body: {
                className: () =>
                    this.hasRound.get() ? 'round-view__body' : 'round-view__body hidden',
            },
            title: () => roundHeaderTitle(this.svc.round.get()),
            course: () => this.svc.round.get()?.courseNameSnapshot ?? '',
            status: () => {
                const st = this.svc.round.get()?.status ?? 'not_started';
                return statusText[st] ?? st;
            },
            scorePanel: {
                className: () =>
                    this.tab.get() === 'score' ? 'round-view__panel' : 'round-view__panel hidden',
            },
            groupTabs: {
                className: () =>
                    this.svc.groups().length > 1 ? 'round-view__groups' : 'round-view__groups hidden',
            },
            lbPanel: {
                className: () =>
                    this.tab.get() === 'leaderboard' ? 'round-view__panel' : 'round-view__panel hidden',
            },
            shareUrl: { value: () => this.shareUrl.get() },
            copy: {
                onclick: () => void navigator.clipboard?.writeText(this.shareUrl.get()),
            },
            // Header chrome only exists for a loaded round — the manage sheet
            // has nothing to act on before that.
            manageBtn: {
                className: () =>
                    this.hasRound.get() ? 'round-view__manage' : 'round-view__manage hidden',
                onclick: () => this.manageOpen.set(true),
            },

            // Bottom dock — only meaningful once a round has loaded. Hidden
            // while the fullscreen keypad is up: the dock would overlap the
            // keypad's bottom rows, and the keypad header has its own hole nav.
            dock: {
                className: () =>
                    this.hasRound.get() && !this.svc.keypadOpen.get()
                        ? 'round-view__dock'
                        : 'round-view__dock hidden',
            },
            holebar: {
                className: () =>
                    this.tab.get() === 'score' && this.hasScoring.get()
                        ? 'round-hole'
                        : 'round-hole hidden',
            },
            holePar: () => String(this.svc.parFor(this.svc.currentPlayedHole()?.playHoleId ?? null)),
            holeNum: () => {
                const occ = this.svc.currentPlayedHole();
                return occ ? this.svc.occLabel(occ.playHoleId) : '';
            },
            holeSi: () => {
                const si = this.svc.currentPlayHole()?.baseStrokeIndex;
                return si != null ? String(si) : '–';
            },
            holePrev: {
                onclick: () => this.svc.prevHole(),
                disabled: () => !this.svc.canPrevHole(),
            },
            holeNext: {
                onclick: () => this.svc.nextHole(),
                disabled: () => !this.svc.canNextHole(),
            },
            tabScore: {
                className: () =>
                    this.tab.get() === 'score' ? 'round-tabs__tab active' : 'round-tabs__tab',
                onclick: () => this.tab.set('score'),
            },
            tabBoard: {
                className: () =>
                    this.tab.get() === 'leaderboard' ? 'round-tabs__tab active' : 'round-tabs__tab',
                onclick: () => {
                    this.tab.set('leaderboard');
                    // Re-fetch so the board reflects the latest entered scores.
                    void this.svc.loadResult();
                },
            },
        });

        // Playing-group pills (Phase 3.5): visible only when the round has 2+
        // groups. Tapping one points the shared groupIdx at that group — the
        // score carousel + orange hole bar re-scope to its balls and its
        // rotated played order (the hole index carries over; group itineraries
        // are equal length, just rotated).
        this.$each(
            this.ref(frag, 'groupTabs'),
            new Computed(() => this.svc.groups()),
            (g, i, track) => this.groupPill(i, track),
            (g) => g.id,
        );

        // One shared format-pill row (both tabs). A pill is pure navigation: tap
        // it to view that format's leaderboard — from the Score tab it also flips
        // to the leaderboard. The active highlight only shows while the leaderboard
        // is on screen, so in Score mode the pills read as buttons, not a selection.
        this.$each(
            this.ref(frag, 'formats'),
            new Computed(() => this.svc.round.get()?.formatSlots ?? []),
            (slot, i, track) => this.slotPill(slot, i, track),
            (slot) => slot.slotDefId,
        );

        // The trust-based score-entry experience (carousel + keypad) and the
        // section-driven leaderboard. Both share the RoundViewService singleton;
        // tab visibility is toggled via the panel classes above (kept mounted so
        // carousel/keypad state survives a tab switch).
        // "Is this still your handicap?" — self-hiding, and only on the first
        // open of this round on this device by someone who plays in it.
        this.spawn(HandicapCheckinComponent, this.ref(frag, 'hcpCheckin'));
        this.spawn(ScoreEntryComponent, this.ref(frag, 'scoring'));
        this.spawn(LeaderboardComponent, this.ref(frag, 'leaderboard'));
        // Phase 5.5: the "Who's playing?" seat card — self-hiding unless the
        // round has unclaimed placeholder seats (or a claimed seat this viewer
        // may release). Affordances render strictly from the server's policy
        // decision (`startList.viewer.claimSeat` / `.claimSeatAsGuest`).
        this.spawn(SeatCardComponent, this.ref(frag, 'seats'));
        // Phase 3: the guest-claim affordance — self-hiding (logged-out /
        // no unclaimed guests / viewer already plays here ⇒ renders nothing).
        this.spawn(ClaimCardComponent, this.ref(frag, 'claim'));
        // Phase 3.5: the self-join affordance — self-hiding (logged-out /
        // round already started / viewer already a producer ⇒ renders
        // nothing). Distinct action from claim above: claim flips an existing
        // guest row, join mints a brand new producer — both can show together.
        this.spawn(JoinCardComponent, this.ref(frag, 'join'));

        // "Manage round" (2026-07-29): edit / leave / finish-reopen / delete,
        // with their confirmations and the inline failure line. It owns all of
        // them, so this view keeps only the header button that opens it. Hosted
        // outside the tab panels — it is header chrome, reachable from Score and
        // Leaderboard alike.
        this.spawn(ManageOverlayComponent, this.ref(frag, 'manageHost'), {
            open: this.manageOpen,
        });

        return frag;
    }

    /**
     * Parse view state out of the query string at mount: `?tab=board` → the
     * leaderboard tab, `?slot=` → that format pill, `?hole=H` (1-based) → the
     * 0-based carousel index. Captured once so the write effect can't strip it
     * before loadByToken restores slot/hole. Out-of-range values are tolerated —
     * the carousel/slot reads clamp on access.
     *
     * `slot` is a `slotDefId` (opaque string) today. Older shared links may
     * still carry the pre-2.7b positional index — a value that parses fully as
     * a positive integer is treated as that legacy index one time; the write
     * effect immediately rewrites the URL to the id form once resolved.
     */
    private readUrlPosition(): { tab: Tab } & InitialPosition {
        // location.search, not router.search.get(): a one-time mount read needs no
        // reactive subscription. Reading the browser global also keeps this off the
        // framework signal entirely — no skew if a bundler serves a stale core.
        const params = new URLSearchParams(location.search);
        const slotParam = params.get('slot');
        const hole = Number(params.get('hole'));
        return {
            tab: params.get('tab') === 'board' ? 'leaderboard' : 'score',
            selectedSlot: parseSlotParam(slotParam),
            holeIdx: Number.isFinite(hole) && hole > 0 ? hole - 1 : 0,
        };
    }

    /** One group pill: "Group N · 09:00 · H10" (time/hole shown when set). */
    private groupPill(index: number, track: (d: () => void) => void): HTMLElement {
        return this.wireEl(
            groupPillTpl,
            {
                pill: {
                    textContent: () => {
                        const g = this.svc.groups()[index];
                        if (!g) return `Group ${index + 1}`;
                        const parts = [`Group ${index + 1}`];
                        // startTime defaults to the round DATE when the draft
                        // set none — only a real clock time is worth a pill slot.
                        if (g.startTime.includes(':')) parts.push(g.startTime);
                        const hole = this.svc.playHoleById(g.startPlayHoleId)?.courseHoleNumber;
                        if (hole !== undefined && g.startOrdinal !== 1) parts.push(`H${hole}`);
                        return parts.join(' · ');
                    },
                    className: () =>
                        this.svc.groupIdx.get() === index
                            ? 'round-view__grp active'
                            : 'round-view__grp',
                    onclick: () => this.svc.groupIdx.set(index),
                },
            },
            track,
        );
    }

    private slotPill(slot: FormatSlot, index: number, track: (d: () => void) => void): HTMLElement {
        return this.wireEl(
            pillTpl,
            {
                pill: {
                    textContent: () => formatLabelFromSlot(slot),
                    className: () =>
                        this.tab.get() === 'leaderboard' &&
                        this.svc.selectedSlotDefId() === slot.slotDefId
                            ? 'round-view__fmt active'
                            : 'round-view__fmt',
                    onclick: () => {
                        this.svc.selectSlot(slot.slotDefId);
                        if (this.tab.get() !== 'leaderboard') {
                            this.tab.set('leaderboard');
                            // Re-fetch so the board reflects the latest entered scores.
                            void this.svc.loadResult();
                        }
                    },
                },
            },
            track,
        );
    }
}
