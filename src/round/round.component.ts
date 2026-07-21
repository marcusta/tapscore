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
import { EditCardComponent } from './edit-card.component';
import { LeaveCardComponent } from './leave-card.component';
import { formatLabelFromSlot } from './slot-labels';
import { shouldPoll } from './poll-gate';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
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
                    <h1 bind="course"></h1>
                    <span bind="status" class="round-view__status"></span>
                </header>
                <div class="round-view__meta">
                    <span bind="date"></span>
                    <span bind="route"></span>
                </div>
                <div class="round-view__formats" bind="formats"></div>

                <div bind="scorePanel" class="round-view__panel">
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
                    <div bind="edit"></div>
                    <div bind="claim"></div>
                    <div bind="join"></div>

                    <div bind="leave"></div>
                    <button bind="finishBtn" class="round-view__finish" type="button"></button>
                    <button bind="deleteBtn" class="round-view__delete" type="button">Delete round</button>
                    <div bind="confirmHost"></div>
                    <div bind="finishConfirmHost"></div>
                </div>

                <div bind="lbPanel" class="round-view__panel hidden">
                    <div bind="leaderboard"></div>
                </div>
            </div>
        </div>

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

            & .round-view__head {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                gap: ${s('md')};

                & h1 {
                    margin: 0;
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 1.8rem;
                    letter-spacing: -0.02em;
                    color: ${t('text')};
                }
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

            & .round-view__meta {
                display: flex;
                gap: ${s('md')};
                margin-top: ${s('xs')};
                color: ${t('text-muted')};
                font-size: 0.9rem;
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
                    flex: 1;
                    ${input()}
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

            /* Finish / reopen: a secondary action above the danger zone. A
               bordered ghost button in the neutral text tone — clearly an
               action, but never competing with the primary Score/Board flow. */
            & .round-view__finish {
                width: 100%;
                margin-top: ${s('2xl')};
                padding: ${s('md')};
                background: none;
                border: 1px solid ${t('border')};
                border-radius: ${t('radius')};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${t('text')};
                cursor: pointer;

                &:hover, &:active { border-color: ${t('text-muted')}; }
                &:focus-visible { outline: 2px solid ${t('accent')}; outline-offset: 2px; }
                &:disabled { opacity: 0.5; cursor: default; }
            }

            /* Danger zone: last thing on the score panel, visually quiet —
               a bordered ghost button in the error tone, never a filled CTA. */
            & .round-view__delete {
                width: 100%;
                /* Sits right under Finish, so a tighter gap than the 2xl that
                   used to separate it from the share card. */
                margin-top: ${s('md')};
                padding: ${s('md')};
                background: none;
                border: 1px solid ${t('border')};
                border-radius: ${t('radius')};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${t('error')};
                cursor: pointer;

                &:hover, &:active { border-color: ${t('error')}; }
                &:focus-visible { outline: 2px solid ${t('error')}; outline-offset: 2px; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }

        /* App-level accessibility override for the framework confirm dialog. */
        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
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
    /** Delete-round confirmation dialog visibility. */
    private deleteOpen = new Signal(false);
    /** Finish/reopen confirmation dialog visibility. */
    private finishOpen = new Signal(false);
    /** True when the loaded round is finished (drives Finish ⇄ Reopen). */
    private isComplete = new Computed(() => this.svc.round.get()?.status === 'complete');

    private shareUrl = new Computed(() => {
        const token = this.tokenQ.get();
        return token ? `${location.origin}/round?token=${token}` : '';
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
        const onVisibility = () => this.pageVisible.set(!document.hidden);
        document.addEventListener('visibilitychange', onVisibility);
        this.track(() => document.removeEventListener('visibilitychange', onVisibility));

        // One interval, started/stopped by the gate rather than left running
        // and no-op'd — an inactive round view should hold no timer at all.
        // The effect re-evaluates on every tab switch, visibility change, and
        // round-status change (not_started → active on the first score), so
        // opening the leaderboard starts the timer and navigating away (this
        // effect's disposer, and the whole component's teardown via `track`)
        // stops it — never a orphaned timer surviving a route change.
        let pollTimer: ReturnType<typeof setInterval> | null = null;
        this.track(
            effect(() => {
                const gate = shouldPoll({
                    tab: this.tab.get(),
                    pageVisible: this.pageVisible.get(),
                    status: this.svc.round.get()?.status ?? null,
                });
                if (gate && pollTimer === null) {
                    pollTimer = setInterval(() => void this.svc.pollResult(), LEADERBOARD_POLL_MS);
                } else if (!gate && pollTimer !== null) {
                    clearInterval(pollTimer);
                    pollTimer = null;
                }
            }),
        );
        this.track(() => {
            if (pollTimer !== null) clearInterval(pollTimer);
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
                const query: Record<string, QueryValue> = { token: this.tokenQ.get() };
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
            course: () => this.svc.round.get()?.courseNameSnapshot ?? 'Round',
            status: () => {
                const st = this.svc.round.get()?.status ?? 'not_started';
                return statusText[st] ?? st;
            },
            date: () => this.svc.round.get()?.date ?? '',
            route: () => {
                const r = this.svc.round.get();
                return r ? `${r.playHoles.length} holes` : '';
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
            finishBtn: {
                textContent: () => (this.isComplete.get() ? 'Reopen round' : 'Finish round'),
                onclick: () => this.finishOpen.set(true),
                disabled: () => this.svc.finishing.get(),
            },
            deleteBtn: {
                onclick: () => this.deleteOpen.set(true),
                disabled: () => this.svc.deleting.get(),
            },

            // Bottom dock — only meaningful once a round has loaded.
            dock: {
                className: () =>
                    this.hasRound.get() ? 'round-view__dock' : 'round-view__dock hidden',
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
        this.spawn(ScoreEntryComponent, this.ref(frag, 'scoring'));
        this.spawn(LeaderboardComponent, this.ref(frag, 'leaderboard'));
        // Phase 5.5: the "Who's playing?" seat card — self-hiding unless the
        // round has unclaimed placeholder seats (or a claimed seat this viewer
        // may release). Affordances render strictly from the server's policy
        // decision (`startList.viewer.claimSeat` / `.claimSeatAsGuest`).
        this.spawn(SeatCardComponent, this.ref(frag, 'seats'));
        // Phase 3.5: the edit-round affordance — self-hiding unless the server's
        // setup() says this round is editable (not-started/active, from a draft).
        this.spawn(EditCardComponent, this.ref(frag, 'edit'));
        // Phase 3: the guest-claim affordance — self-hiding (logged-out /
        // no unclaimed guests / viewer already plays here ⇒ renders nothing).
        this.spawn(ClaimCardComponent, this.ref(frag, 'claim'));
        // Phase 3.5: the self-join affordance — self-hiding (logged-out /
        // round already started / viewer already a producer ⇒ renders
        // nothing). Distinct action from claim above: claim flips an existing
        // guest row, join mints a brand new producer — both can show together.
        this.spawn(JoinCardComponent, this.ref(frag, 'join'));
        // Phase 3.5: the leave-round affordance — the FIRST identity-gated,
        // self-scoped mutation. Self-hiding (logged-out / viewer not a
        // producer ⇒ renders nothing). Distinct from "Delete round" below:
        // leave removes ONLY the caller's producer + ball + scores; delete
        // destroys the whole round for everyone.
        this.spawn(LeaveCardComponent, this.ref(frag, 'leave'));

        // Delete-round confirmation. Same trust boundary as scoring — the
        // token is the credential, so no identity gate. On success the round
        // is gone for everyone; navigate home.
        this.spawn(ConfirmComponent, this.ref(frag, 'confirmHost'), {
            open: this.deleteOpen,
            title: 'Delete round?',
            message:
                "This permanently removes the round and all its scores for everyone. This can't be undone.",
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            danger: true,
            onconfirm: () => {
                void this.svc.deleteRound().then((ok) => {
                    if (ok) this.router.navigate('/');
                });
            },
        });

        // Finish / reopen confirmation. Finish is PURELY ORGANIZATIONAL — the
        // round stays editable + scorable; it just moves to "Recently finished".
        // On a complete round the same control offers Reopen instead.
        // One dialog serves both actions. `title`/`confirmLabel` are static
        // (the framework reads them once), so they stay neutral; the reactive
        // `message` carries the finish-vs-reopen wording, and the button that
        // opened it already reads "Finish round" / "Reopen round".
        this.spawn(ConfirmComponent, this.ref(frag, 'finishConfirmHost'), {
            open: this.finishOpen,
            title: 'Finish or reopen round',
            message: () =>
                this.isComplete.get()
                    ? "Reopen this round? It'll move back to your ongoing rounds."
                    : "Finish this round? It'll move to your finished rounds. You can still edit or reopen it any time.",
            cancelLabel: 'Cancel',
            onconfirm: () => {
                // Snapshot which action before the round's status flips.
                if (this.isComplete.get()) void this.svc.reopenRound();
                else void this.svc.finishRound();
            },
        });

        // Escape cancels either confirm dialog (backdrop click already cancels
        // via the framework overlay).
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.deleteOpen.get()) this.deleteOpen.set(false);
            if (e.key === 'Escape' && this.finishOpen.get()) this.finishOpen.set(false);
        };
        window.addEventListener('keydown', onKeydown);
        this.track(() => window.removeEventListener('keydown', onKeydown));

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
