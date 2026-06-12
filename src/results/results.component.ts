import { Component, Computed, Router, effect, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { ResultsService } from './results.service';
import { formatLabelFromSlot } from '../rounds/slot-labels';
import type { LeaderboardByType } from '../api/leaderboards.gen';

const tpl = template(`
    <div class="results">
        <header class="results__head">
            <button bind="back" type="button" class="results__chip">‹ Scores</button>
            <span bind="course" class="results__course"></span>
        </header>

        <div bind="tabs" class="results__tabs"></div>

        <div bind="empty" class="results__empty">No scores yet — go play some golf.</div>

        <div bind="entries" class="results__entries"></div>

        <div bind="pairs" class="results__pairs"></div>
    </div>
`);

const tabTpl = template(`<button bind="tab" type="button" class="results-tab"></button>`);

const entryTpl = template(`
    <div bind="row" class="entry-row">
        <span bind="pos" class="entry-row__pos"></span>
        <span bind="name" class="entry-row__name"></span>
        <span bind="thru" class="entry-row__thru"></span>
        <span bind="total" class="entry-row__total"></span>
    </div>
`);

const pairTpl = template(`
    <div class="pair-row">
        <span bind="names" class="pair-row__names"></span>
        <span bind="summary" class="pair-row__summary"></span>
    </div>
`);

export class ResultsComponent extends Component {
    static styles = `
        .results {
            padding: ${s('lg')} ${s('lg')} ${s('2xl')};

            & .results__head {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                margin-bottom: ${s('lg')};
            }

            & .results__chip {
                padding: ${s('sm')} ${s('md')};
                font-size: 0.85rem;
                font-weight: 600;
                font-family: inherit;
                flex-shrink: 0;
                ${btn(t('radius-pill'))}
            }

            & .results__course {
                font-family: ${t('font-display')};
                font-weight: 600;
                font-size: 1.1rem;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            & .results__tabs {
                display: flex;
                gap: ${s('sm')};
                overflow-x: auto;
                margin-bottom: ${s('lg')};
                padding-bottom: 2px;

                & .results-tab {
                    flex-shrink: 0;
                    padding: ${s('sm')} ${s('lg')};
                    font-size: 0.85rem;
                    font-weight: 600;
                    font-family: inherit;
                    white-space: nowrap;
                    ${btn(t('radius-pill'))}

                    &.on {
                        background: ${t('active-bg')};
                        color: ${t('active-text')};
                        border-color: ${t('active-bg')};
                        &:hover { background: ${t('active-bg')}; }
                    }
                }
            }

            & .results__empty {
                display: none;
                color: ${t('text-muted')};
                text-align: center;
                padding: ${s('2xl')} 0;
                &.show { display: block; }
            }

            & .results__entries {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                margin-bottom: ${s('xl')};
            }

            & .entry-row {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                padding: ${s('md')} ${s('lg')};
                ${card()}

                &.first { border-color: ${t('accent')}; }

                & .entry-row__pos {
                    display: grid;
                    place-items: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: ${t('surface-sunken')};
                    font-weight: 800;
                    font-size: 0.9rem;
                    flex-shrink: 0;
                }
                &.first .entry-row__pos {
                    background: ${t('accent')};
                    color: ${t('primary-text')};
                }

                & .entry-row__name {
                    flex: 1;
                    font-weight: 600;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                & .entry-row__thru {
                    color: ${t('text-muted')};
                    font-size: 0.78rem;
                    flex-shrink: 0;
                }

                & .entry-row__total {
                    font-family: ${t('font-display')};
                    font-size: 1.5rem;
                    font-weight: 600;
                    min-width: 48px;
                    text-align: right;
                }
            }

            & .results__pairs {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
            }

            & .pair-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('md')};
                padding: ${s('md')} ${s('lg')};
                ${card()}

                & .pair-row__names { font-weight: 600; font-size: 0.95rem; }

                & .pair-row__summary {
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    color: ${t('accent')};
                    flex-shrink: 0;
                }
            }
        }
    `;

    private svc = this.inject(ResultsService);
    private router = this.inject(Router);
    private roundIdQ = this.router.query('roundId');
    private tabQ = this.router.query('tab');

    private activeBucket = new Computed<LeaderboardByType | null>(() => {
        const buckets = this.svc.buckets.get();
        if (buckets.length === 0) return null;
        const key = this.tabQ.get();
        return buckets.find((b) => `${b.slotIndex}:${b.scoringType}` === key) ?? buckets[0]!;
    });

    private activeEntries = new Computed(() => this.activeBucket.get()?.entries ?? []);

    private activePairs = new Computed(() => {
        const bucket = this.activeBucket.get();
        const lb = this.svc.leaderboard.get();
        if (!bucket || !lb) return [];
        return lb.pairResults.filter((p) => p.slotIndex === bucket.slotIndex);
    });

    private bucketLabel(b: LeaderboardByType): string {
        const slot = this.svc.round.get()?.formatSlots
            .find((fs) => fs.slotIndex === b.slotIndex);
        const fmt = slot ? formatLabelFromSlot(slot) : `Slot ${b.slotIndex}`;
        const multi = this.svc.buckets.get()
            .filter((x) => x.slotIndex === b.slotIndex).length > 1;
        return multi ? `${fmt} · ${b.scoringType}` : fmt;
    }

    render(): DocumentFragment {
        this.track(effect(() => {
            const id = this.roundIdQ.get();
            if (id) void this.svc.load(id);
        }));

        const frag = this.wire(tpl, {
            back: {
                onclick: () => this.router.navigate('/score', {
                    query: { roundId: this.roundIdQ.get() },
                }),
            },
            course: () => this.svc.round.get()?.courseNameSnapshot ?? 'Results',
            empty: {
                className: () =>
                    !this.svc.loading.get() && this.activeEntries.get().length === 0 &&
                    this.activePairs.get().length === 0
                        ? 'results__empty show'
                        : 'results__empty',
            },
        });

        this.$each(this.ref(frag, 'tabs'), this.svc.buckets, (b, _i, track) =>
            this.wireEl(tabTpl, {
                tab: {
                    textContent: () => this.bucketLabel(b),
                    className: () => {
                        const on = this.activeBucket.get() === b;
                        return on ? 'results-tab on' : 'results-tab';
                    },
                    onclick: () => this.router.navigate('/results', {
                        query: {
                            roundId: this.roundIdQ.get(),
                            tab: `${b.slotIndex}:${b.scoringType}`,
                        },
                    }),
                },
            }, track), (b) => `${b.slotIndex}:${b.scoringType}`);

        this.$each(this.ref(frag, 'entries'), this.activeEntries, (e, _i, track) =>
            this.wireEl(entryTpl, {
                row: { className: () => (e.position === 1 ? 'entry-row first' : 'entry-row') },
                pos: () => String(e.position),
                name: () => this.svc.labelByBall.get().get(e.ballId) ?? e.ballId.slice(0, 6),
                thru: () => (e.holesPlayed > 0 ? `thru ${e.holesPlayed}` : ''),
                total: () => (e.total === null ? '–' : String(e.total)),
            }, track), (e) => e.ballId);

        this.$each(this.ref(frag, 'pairs'), this.activePairs, (p, _i, track) =>
            this.wireEl(pairTpl, {
                names: () => {
                    const labels = this.svc.labelByBall.get();
                    const a = labels.get(p.balls[0]) ?? '?';
                    const b = labels.get(p.balls[1]) ?? '?';
                    return `${a}  vs  ${b}`;
                },
                summary: () => p.summary,
            }, track), (p) => `${p.slotIndex}:${p.balls[0]}:${p.balls[1]}`);

        return frag;
    }
}
