import { Component, Computed, Router, effect, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { ScoreService } from './score.service';
import type { RoundBall } from '../api/rounds.gen';

const tpl = template(`
    <div class="score">
        <header class="score__head">
            <button bind="back" type="button" class="score__chip">‹ Rounds</button>
            <span bind="course" class="score__course"></span>
            <button bind="results" type="button" class="score__chip score__chip--gold">Results</button>
        </header>

        <div class="score__hole">
            <button bind="prev" type="button" class="score__holenav">‹</button>
            <div class="score__holecard">
                <span class="score__holeword">Hole</span>
                <span bind="holeNo" class="score__holeno"></span>
                <span bind="holemeta" class="score__holemeta"></span>
            </div>
            <button bind="next" type="button" class="score__holenav">›</button>
        </div>

        <div bind="dots" class="score__dots"></div>

        <div bind="balls" class="score__balls"></div>
    </div>
`);

const dotTpl = template(`<button bind="dot" type="button" class="score-dot"></button>`);

const ballTpl = template(`
    <div class="ball-row">
        <div class="ball-row__who">
            <span bind="label" class="ball-row__label"></span>
            <span bind="meta" class="ball-row__meta"></span>
        </div>
        <div class="ball-row__stepper">
            <button bind="minus" type="button">−</button>
            <span bind="value" class="ball-row__value"></span>
            <button bind="plus" type="button">+</button>
        </div>
    </div>
`);

export class ScoreComponent extends Component {
    static styles = `
        .score {
            padding: ${s('lg')} ${s('lg')} ${s('2xl')};

            & .score__head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('sm')};
                margin-bottom: ${s('lg')};
            }

            & .score__chip {
                padding: ${s('sm')} ${s('md')};
                font-size: 0.85rem;
                font-weight: 600;
                font-family: inherit;
                ${btn(t('radius-pill'))}
            }

            & .score__chip--gold {
                background: ${t('accent-soft')};
                color: ${t('accent')};
                border-color: ${t('accent')};
                &:hover { background: ${t('accent-soft')}; }
            }

            & .score__course {
                font-family: ${t('font-display')};
                font-weight: 600;
                font-size: 0.95rem;
                text-align: center;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            & .score__hole {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                margin-bottom: ${s('md')};
            }

            & .score__holenav {
                width: 56px;
                align-self: stretch;
                font-size: 2rem;
                font-family: inherit;
                ${btn()}
                &:disabled { opacity: 0.3; cursor: default; }
            }

            & .score__holecard {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: ${s('md')} 0 ${s('lg')};
                background: ${t('topbar-bg')};
                color: ${t('primary-text')};
                border-radius: ${t('radius')};
                box-shadow: ${t('shadow-elevated')};

                & .score__holeword {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.25em;
                    opacity: 0.6;
                }

                & .score__holeno {
                    font-family: ${t('font-display')};
                    font-size: 3.2rem;
                    font-weight: 600;
                    line-height: 1.05;
                }

                & .score__holemeta {
                    font-size: 0.8rem;
                    opacity: 0.75;
                    letter-spacing: 0.04em;
                }
            }

            & .score__dots {
                display: flex;
                justify-content: center;
                gap: 5px;
                flex-wrap: wrap;
                margin-bottom: ${s('xl')};

                & .score-dot {
                    width: 12px;
                    height: 12px;
                    padding: 0;
                    border-radius: 50%;
                    border: 1px solid ${t('border')};
                    background: ${t('surface')};
                    cursor: pointer;

                    &.done { background: ${t('primary')}; border-color: ${t('primary')}; }
                    &.now {
                        outline: 2px solid ${t('accent')};
                        outline-offset: 1px;
                    }
                }
            }

            & .score__balls {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
            }

            & .ball-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('md')};
                padding: ${s('md')} ${s('md')} ${s('md')} ${s('lg')};
                ${card()}

                & .ball-row__who {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                & .ball-row__label {
                    font-weight: 600;
                    font-size: 1.05rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                & .ball-row__meta { color: ${t('text-muted')}; font-size: 0.75rem; }

                & .ball-row__stepper {
                    display: flex;
                    align-items: center;
                    gap: ${s('xs')};
                    flex-shrink: 0;

                    & button {
                        width: 52px;
                        height: 52px;
                        font-size: 1.6rem;
                        font-family: inherit;
                        ${btn()}
                    }

                    & .ball-row__value {
                        width: 52px;
                        text-align: center;
                        font-family: ${t('font-display')};
                        font-size: 1.9rem;
                        font-weight: 600;

                        &.unset { color: ${t('text-muted')}; font-size: 1.4rem; }
                        &.under { color: ${t('under-par')}; }
                        &.over { color: ${t('over-par')}; }
                    }
                }
            }
        }
    `;

    private svc = this.inject(ScoreService);
    private router = this.inject(Router);
    private holeQ = this.router.query('hole');
    private roundIdQ = this.router.query('roundId');

    private hole = new Computed(() => {
        const n = Number(this.holeQ.get() ?? '1');
        return Number.isFinite(n) && n >= 1 ? n : 1;
    });

    private currentHole = new Computed(() =>
        this.svc.holes.get().find((h) => h.holeNumber === this.hole.get()) ?? null);

    private goHole(n: number): void {
        this.router.navigate('/score', {
            query: { roundId: this.roundIdQ.get(), hole: String(n) },
        });
    }

    render(): DocumentFragment {
        this.track(effect(() => {
            const id = this.roundIdQ.get();
            if (id) void this.svc.load(id);
        }));

        const frag = this.wire(tpl, {
            back: { onclick: () => this.router.navigate('/rounds') },
            results: {
                onclick: () => this.router.navigate('/results', {
                    query: { roundId: this.roundIdQ.get() },
                }),
            },
            course: () => this.svc.round.get()?.courseNameSnapshot ?? '',
            holeNo: () => String(this.hole.get()),
            holemeta: () => {
                const h = this.currentHole.get();
                return h ? `Par ${h.par} · Index ${h.strokeIndex}` : '';
            },
            prev: {
                disabled: () => this.hole.get() <= 1,
                onclick: () => this.goHole(this.hole.get() - 1),
            },
            next: {
                disabled: () => this.hole.get() >= (this.svc.holes.get().length || 18),
                onclick: () => this.goHole(this.hole.get() + 1),
            },
        });

        this.$each(this.ref(frag, 'dots'), this.svc.holes, (h, _i, track) =>
            this.wireEl(dotTpl, {
                dot: {
                    className: () => {
                        const allIn = this.svc.balls.get().length > 0 && this.svc.balls.get()
                            .every((b) => this.svc.strokesFor(b.id, h.holeNumber) !== null);
                        const now = this.hole.get() === h.holeNumber;
                        return `score-dot${allIn ? ' done' : ''}${now ? ' now' : ''}`;
                    },
                    onclick: () => this.goHole(h.holeNumber),
                },
            }, track), (h) => String(h.holeNumber));

        this.$each(this.ref(frag, 'balls'), this.svc.balls, (b, _i, track) =>
            this.ballRow(b, track), (b) => b.id);

        return frag;
    }

    private ballRow(b: RoundBall, track: (fn: () => void) => void): HTMLElement {
        const current = () => this.svc.strokesFor(b.id, this.hole.get());
        const par = () => this.currentHole.get()?.par ?? 4;

        return this.wireEl(ballTpl, {
            label: () => b.label ?? b.players.map((p) => p.displayName).join(' / '),
            meta: () => b.players
                .map((p) => `${p.teeName} · CH ${p.courseHandicap}`)
                .join('  ·  '),
            minus: {
                onclick: () => {
                    const v = current();
                    if (v === null) void this.svc.setStrokes(b, this.hole.get(), par());
                    else if (v <= 1) void this.svc.setStrokes(b, this.hole.get(), null);
                    else void this.svc.setStrokes(b, this.hole.get(), v - 1);
                },
            },
            plus: {
                onclick: () => {
                    const v = current();
                    void this.svc.setStrokes(b, this.hole.get(), v === null ? par() : v + 1);
                },
            },
            value: {
                textContent: () => {
                    const v = current();
                    return v === null ? '–' : String(v);
                },
                className: () => {
                    const v = current();
                    if (v === null) return 'ball-row__value unset';
                    if (v < par()) return 'ball-row__value under';
                    if (v > par()) return 'ball-row__value over';
                    return 'ball-row__value';
                },
            },
        }, track);
    }
}
