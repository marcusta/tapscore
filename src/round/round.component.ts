import { Component, Computed, Router, Signal, effect, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { RoundViewService } from './round.service';
import { formatLabelFromSlot } from '../rounds/slot-labels';
import type { RoundBall } from '../api/friendly-rounds.gen';

const tpl = template(`
    <div class="round-view">
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

            <section bind="scoring" class="round-view__scoring">
                <div bind="groupTabs" class="score-groups"></div>
                <div class="score-nav">
                    <button bind="prev" class="score-nav__step" type="button">‹</button>
                    <div class="score-nav__hole">
                        <span bind="holeLabel" class="score-nav__label"></span>
                        <span bind="holeMeta" class="score-nav__meta"></span>
                    </div>
                    <button bind="next" class="score-nav__step" type="button">›</button>
                </div>
                <div bind="holePos" class="score-nav__pos"></div>
                <div bind="ballRows" class="score-rows"></div>
            </section>

            <div class="round-view__share">
                <span class="round-view__share-label">Share this round</span>
                <div class="round-view__share-row">
                    <input bind="shareUrl" class="round-view__share-url" readonly />
                    <button bind="copy" class="round-view__copy" type="button">Copy</button>
                </div>
                <p class="round-view__share-hint">Anyone with this link can open and score — no sign-in.</p>
            </div>
        </div>
    </div>
`);

const ballRowTpl = template(`
    <div class="score-row">
        <div class="score-row__who">
            <span bind="names" class="score-row__names"></span>
            <span bind="hcp" class="score-row__hcp"></span>
        </div>
        <div class="score-row__entry">
            <button bind="retry" class="score-row__retry" type="button">Retry</button>
            <span bind="status" class="score-row__status"></span>
            <input bind="strokes" class="score-row__input" type="number" inputmode="numeric" min="0" max="20" />
        </div>
    </div>
`);

const groupTabTpl = template(`<button bind="tab" class="score-groups__tab" type="button"></button>`);

const ORD_WORDS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

export class RoundComponent extends Component {
    static styles = `
        .round-view {
            padding: ${s('lg')} ${s('lg')} ${s('2xl')};

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

            /* --- Score entry --- */
            & .round-view__scoring {
                margin-top: ${s('xl')};

                &.hidden { display: none; }
            }

            & .score-groups {
                display: flex;
                gap: ${s('sm')};
                margin-bottom: ${s('md')};

                &.hidden { display: none; }

                & .score-groups__tab {
                    ${btn(t('radius-pill'))}
                    padding: ${s('xs')} ${s('md')};
                    font-size: 0.8rem;
                    font-weight: 600;

                    &.active {
                        background: ${t('primary')};
                        color: ${t('primary-text')};
                        border-color: ${t('primary')};
                    }
                }
            }

            & .score-nav {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('md')};
                ${card()}
                background: ${t('surface-sunken')};
                padding: ${s('md')} ${s('lg')};

                & .score-nav__step {
                    ${btn(t('radius-pill'))}
                    width: 44px;
                    height: 44px;
                    font-size: 1.4rem;
                    line-height: 1;
                    flex-shrink: 0;

                    &:disabled { opacity: 0.35; cursor: default; }
                }

                & .score-nav__hole {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                }
                & .score-nav__label {
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 1.3rem;
                    color: ${t('text')};
                }
                & .score-nav__meta {
                    font-size: 0.8rem;
                    color: ${t('text-muted')};
                }
            }

            & .score-nav__pos {
                text-align: center;
                font-size: 0.75rem;
                letter-spacing: 0.06em;
                color: ${t('text-muted')};
                margin-top: ${s('xs')};
            }

            & .score-rows {
                margin-top: ${s('md')};
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
            }

            & .score-row {
                ${card()}
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('md')};
                padding: ${s('sm')} ${s('md')};

                & .score-row__who {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }
                & .score-row__names {
                    font-weight: 600;
                    color: ${t('text')};
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                & .score-row__hcp {
                    font-size: 0.75rem;
                    color: ${t('text-muted')};
                }

                & .score-row__entry {
                    display: flex;
                    align-items: center;
                    gap: ${s('sm')};
                    flex-shrink: 0;
                }
                & .score-row__input {
                    ${input()}
                    width: 56px;
                    height: 44px;
                    text-align: center;
                    font-size: 1.2rem;
                    font-weight: 600;
                    font-variant-numeric: tabular-nums;
                }
                & .score-row__status {
                    width: 1.2em;
                    text-align: center;
                    font-weight: 700;
                    &.saving { color: ${t('text-muted')}; }
                    &.saved { color: ${t('primary')}; }
                    &.error { color: ${t('error')}; }
                }
                & .score-row__retry {
                    ${btn()}
                    padding: ${s('xs')} ${s('sm')};
                    font-size: 0.75rem;
                    color: ${t('error')};
                    border-color: ${t('error')};

                    &.hidden { display: none; }
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
    `;

    private svc = this.inject(RoundViewService);
    private router = this.inject(Router);
    private tokenQ = this.router.query('token');

    private groupIdx = new Signal(0);
    private holeIdx = new Signal(0);

    private hasRound = new Computed(() => this.svc.round.get() !== null);
    private hasScoring = new Computed(() => this.svc.balls.get().length > 0);

    private shareUrl = new Computed(() => {
        const token = this.tokenQ.get();
        return token ? `${location.origin}/round?token=${token}` : '';
    });

    // --- Itinerary navigation (tracked reads of round + nav signals) ---
    private groups = () => this.svc.round.get()?.playingGroups ?? [];
    private group = () => {
        const gs = this.groups();
        return gs[this.groupIdx.get()] ?? gs[0] ?? null;
    };
    private playedOrder = () => this.group()?.playedOrder ?? [];
    private currentHole = () => {
        const po = this.playedOrder();
        return po[this.holeIdx.get()] ?? po[0] ?? null;
    };
    private playHoleById = (id: string) =>
        this.svc.round.get()?.playHoles.find((p) => p.id === id) ?? null;

    /** "7" or "7 (1st)" when a physical hole is visited more than once. */
    private occLabel = (playHoleId: string): string => {
        const r = this.svc.round.get();
        const ph = r?.playHoles.find((p) => p.id === playHoleId);
        if (!r || !ph) return '';
        const same = r.playHoles
            .filter((p) => p.courseHoleNumber === ph.courseHoleNumber)
            .sort((a, b) => a.ordinal - b.ordinal);
        if (same.length === 1) return `${ph.courseHoleNumber}`;
        const idx = same.findIndex((p) => p.id === playHoleId);
        return `${ph.courseHoleNumber} (${ORD_WORDS[idx] ?? `${idx + 1}th`})`;
    };

    private rowData = new Computed<{ ball: RoundBall; playHoleId: string }[]>(() => {
        const g = this.group();
        const ph = this.currentHole();
        if (!g || !ph) return [];
        const byId = new Map(this.svc.balls.get().map((b) => [b.id, b]));
        return g.ballIds
            .map((id) => byId.get(id))
            .filter((b): b is RoundBall => !!b)
            .map((ball) => ({ ball, playHoleId: ph.playHoleId }));
    });

    private step(delta: number): void {
        const n = this.playedOrder().length;
        if (n === 0) return;
        const next = Math.min(Math.max(this.holeIdx.get() + delta, 0), n - 1);
        this.holeIdx.set(next);
    }

    render(): DocumentFragment {
        this.track(
            effect(() => {
                const token = this.tokenQ.get();
                if (token) void this.svc.loadByToken(token);
            }),
        );
        // Reset to the first hole whenever the playing group changes.
        this.track(
            effect(() => {
                this.groupIdx.get();
                this.holeIdx.set(0);
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
            scoring: {
                className: () =>
                    this.hasScoring.get() ? 'round-view__scoring' : 'round-view__scoring hidden',
            },
            prev: {
                onclick: () => this.step(-1),
                disabled: () => this.holeIdx.get() <= 0,
            },
            next: {
                onclick: () => this.step(1),
                disabled: () => this.holeIdx.get() >= this.playedOrder().length - 1,
            },
            holeLabel: () => {
                const ph = this.currentHole();
                return ph ? `Hole ${this.occLabel(ph.playHoleId)}` : '';
            },
            holeMeta: () => {
                const ph = this.currentHole();
                const def = ph ? this.playHoleById(ph.playHoleId) : null;
                return def ? `Par ${def.par} · SI ${def.baseStrokeIndex}` : '';
            },
            holePos: () => {
                const n = this.playedOrder().length;
                return n ? `${this.holeIdx.get() + 1} / ${n}` : '';
            },
            shareUrl: { value: () => this.shareUrl.get() },
            copy: {
                onclick: () => void navigator.clipboard?.writeText(this.shareUrl.get()),
            },
        });

        // Group tabs — only shown when the round has more than one playing group.
        const tabsHost = this.ref(frag, 'groupTabs');
        this.track(
            effect(() => {
                tabsHost.className =
                    this.groups().length > 1 ? 'score-groups' : 'score-groups hidden';
            }),
        );
        this.$each(
            tabsHost,
            new Computed(() => (this.groups().length > 1 ? this.groups() : [])),
            (_g, i, track) => this.groupTab(i, track),
            (_g, i) => i,
        );

        // Per-hole entry rows. Keyed by ball + occurrence so navigating to a new
        // hole creates fresh (uncontrolled) inputs seeded with that hole's score.
        this.$each(
            this.ref(frag, 'ballRows'),
            this.rowData,
            (d, _i, track) => this.ballRow(d.ball, d.playHoleId, track),
            (d) => `${d.ball.id}|${d.playHoleId}`,
        );

        return frag;
    }

    private groupTab(index: number, track: (d: () => void) => void): HTMLElement {
        return this.wireEl(
            groupTabTpl,
            {
                tab: {
                    textContent: () => `Group ${index + 1}`,
                    className: () =>
                        this.groupIdx.get() === index
                            ? 'score-groups__tab active'
                            : 'score-groups__tab',
                    onclick: () => this.groupIdx.set(index),
                },
            },
            track,
        );
    }

    private ballRow(
        ball: RoundBall,
        playHoleId: string,
        track: (d: () => void) => void,
    ): HTMLElement {
        const names = ball.players.map((p) => p.displayName).join(' & ') || ball.label || 'Ball';
        const hcp =
            ball.players.length > 1
                ? `Team · CH ${ball.courseHandicap}`
                : `CH ${ball.players[0]?.courseHandicap ?? ball.courseHandicap}`;
        const statusSym: Record<string, string> = { saving: '…', saved: '✓', error: '!' };

        return this.wireEl(
            ballRowTpl,
            {
                names: { textContent: names },
                hcp: { textContent: hcp },
                // Uncontrolled: seeded once with the current score; commit on blur/change.
                strokes: {
                    value: this.svc.strokesFor(ball.id, playHoleId) ?? '',
                    onchange: (e: Event) => {
                        const raw = (e.target as HTMLInputElement).value.trim();
                        // Empty clears (no-result); 0 is a legitimate pickup. Reject only
                        // non-numeric or negative input.
                        const n = raw === '' ? null : Number.parseInt(raw, 10);
                        if (raw !== '' && (Number.isNaN(n) || n! < 0)) return;
                        void this.svc.setScore(ball.id, playHoleId, n);
                    },
                },
                status: {
                    textContent: () => statusSym[this.svc.statusFor(ball.id, playHoleId) ?? ''] ?? '',
                    className: () =>
                        `score-row__status ${this.svc.statusFor(ball.id, playHoleId) ?? ''}`,
                },
                retry: {
                    onclick: () => void this.svc.retry(ball.id, playHoleId),
                    className: () =>
                        this.svc.statusFor(ball.id, playHoleId) === 'error'
                            ? 'score-row__retry'
                            : 'score-row__retry hidden',
                },
            },
            track,
        );
    }
}
