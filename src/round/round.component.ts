import { Component, Computed, Router, Signal, effect, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { RoundViewService } from './round.service';
import { ScoreEntryComponent } from './score-entry.component';
import { LeaderboardComponent } from './leaderboard.component';
import { formatLabelFromSlot } from '../rounds/slot-labels';

type Tab = 'score' | 'leaderboard';

const tpl = template(`
    <div class="round-view">
        <div bind="main" class="round-view__main">
            <button bind="back" class="round-view__back" type="button">← Rounds</button>
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
                    <div bind="scoring"></div>

                    <div class="round-view__share">
                        <span class="round-view__share-label">Share this round</span>
                        <div class="round-view__share-row">
                            <input bind="shareUrl" class="round-view__share-url" readonly />
                            <button bind="copy" class="round-view__copy" type="button">Copy</button>
                        </div>
                        <p class="round-view__share-hint">Anyone with this link can open and score — no sign-in.</p>
                    </div>
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
                flex-wrap: wrap;
                gap: ${s('sm')};

                & .fmt {
                    ${card()}
                    padding: ${s('xs')} ${s('md')};
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: ${t('text')};
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
    private tab = new Signal<Tab>('score');

    private hasRound = new Computed(() => this.svc.round.get() !== null);
    private hasScoring = new Computed(() => this.svc.balls.get().length > 0);

    private shareUrl = new Computed(() => {
        const token = this.tokenQ.get();
        return token ? `${location.origin}/round?token=${token}` : '';
    });

    render(): DocumentFragment {
        this.track(
            effect(() => {
                const token = this.tokenQ.get();
                if (token) void this.svc.loadByToken(token);
            }),
        );

        const statusText: Record<string, string> = {
            not_started: 'Not started',
            active: 'Live',
            complete: 'Done',
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
            formats: {
                innerHTML: () =>
                    (this.svc.round.get()?.formatSlots ?? [])
                        .map((slot) => `<span class="fmt">${formatLabelFromSlot(slot)}</span>`)
                        .join(''),
            },
            scorePanel: {
                className: () =>
                    this.tab.get() === 'score' ? 'round-view__panel' : 'round-view__panel hidden',
            },
            lbPanel: {
                className: () =>
                    this.tab.get() === 'leaderboard' ? 'round-view__panel' : 'round-view__panel hidden',
            },
            shareUrl: { value: () => this.shareUrl.get() },
            copy: {
                onclick: () => void navigator.clipboard?.writeText(this.shareUrl.get()),
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

        // The trust-based score-entry experience (carousel + keypad) and the
        // section-driven leaderboard. Both share the RoundViewService singleton;
        // tab visibility is toggled via the panel classes above (kept mounted so
        // carousel/keypad state survives a tab switch).
        this.spawn(ScoreEntryComponent, this.ref(frag, 'scoring'));
        this.spawn(LeaderboardComponent, this.ref(frag, 'leaderboard'));

        return frag;
    }
}
