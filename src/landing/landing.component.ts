import { Component, Router, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { LandingService } from './landing.service';
import { formatLabelFromSlot } from '../rounds/slot-labels';

const tpl = template(`
    <div class="landing">
        <header class="landing__head">
            <div class="landing__flag">⛳</div>
            <h1>tapscore</h1>
            <p>Scores, settled on the green. No sign-in needed.</p>
        </header>
        <button bind="createBtn" class="landing__create" type="button">
            <span class="landing__create-plus">+</span> Create round
        </button>
        <div class="landing__section">
            <span class="landing__section-title">Rounds</span>
            <span bind="count" class="landing__count"></span>
        </div>
        <div bind="empty" class="landing__empty">No rounds yet — create one to tee off.</div>
        <div bind="list" class="landing__list"></div>
        <button bind="signin" class="landing__signin" type="button">Sign in</button>
    </div>
`);

const rowTpl = template(`
    <button bind="row" type="button" class="round-row">
        <div class="round-row__top">
            <span bind="course" class="round-row__course"></span>
            <span bind="status" class="round-row__status"></span>
        </div>
        <div class="round-row__bottom">
            <span bind="date"></span>
            <span bind="formats" class="round-row__formats"></span>
        </div>
    </button>
`);

const statusText: Record<string, string> = {
    not_started: 'Not started',
    active: 'Live',
    complete: 'Done',
};

export class LandingComponent extends Component {
    static styles = `
        .landing {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .landing__head {
                text-align: center;
                margin-bottom: ${s('xl')};

                & .landing__flag { font-size: 2.2rem; line-height: 1; }
                & h1 {
                    margin: ${s('xs')} 0 0;
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 2.2rem;
                    letter-spacing: -0.02em;
                    color: ${t('text')};
                }
                & p {
                    margin: ${s('xs')} 0 0;
                    color: ${t('text-muted')};
                    font-size: 0.9rem;
                }
            }

            & .landing__create {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: ${s('sm')};
                padding: ${s('lg')};
                margin-bottom: ${s('xl')};
                font-size: 1.1rem;
                font-weight: 700;
                font-family: inherit;
                ${btn()}
                background: ${t('primary')};
                color: ${t('primary-text')};
                border: none;
                box-shadow: ${t('shadow-elevated')};
                &:hover { background: ${t('primary')}; }

                & .landing__create-plus { font-size: 1.4rem; line-height: 1; }
            }

            & .landing__section {
                display: flex;
                align-items: baseline;
                gap: ${s('sm')};
                margin-bottom: ${s('sm')};

                & .landing__section-title {
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 1.1rem;
                    color: ${t('text')};
                }
                & .landing__count {
                    color: ${t('text-muted')};
                    font-size: 0.85rem;
                }
            }

            & .landing__empty {
                color: ${t('text-muted')};
                font-size: 0.9rem;
                padding: ${s('lg')} 0;

                &.hidden { display: none; }
            }

            & .landing__list {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
            }

            & .round-row {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                padding: ${s('md')} ${s('lg')};
                text-align: left;
                font-family: inherit;
                cursor: pointer;
                ${card({ hover: true })}

                & .round-row__top {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    gap: ${s('md')};
                }
                & .round-row__course {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: ${t('text')};
                }
                & .round-row__status {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    border-radius: ${t('radius-pill')};
                    padding: 2px 10px;
                    flex-shrink: 0;

                    &.s-active { background: ${t('accent-soft')}; color: ${t('accent')}; }
                    &.s-complete { background: ${t('surface-sunken')}; color: ${t('text-muted')}; }
                    &.s-not_started { background: ${t('surface-sunken')}; color: ${t('text-muted')}; }
                }
                & .round-row__bottom {
                    display: flex;
                    justify-content: space-between;
                    gap: ${s('md')};
                    color: ${t('text-muted')};
                    font-size: 0.85rem;
                }
                & .round-row__formats {
                    text-align: right;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            & .landing__signin {
                display: block;
                margin: ${s('2xl')} auto 0;
                padding: ${s('sm')} ${s('lg')};
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 600;
                color: ${t('text-muted')};
                text-decoration: underline;
                cursor: pointer;
            }
        }
    `;

    private svc = this.inject(LandingService);
    private router = this.inject(Router);

    render(): DocumentFragment {
        void this.svc.load();

        const frag = this.wire(tpl, {
            createBtn: { onclick: () => this.router.navigate('/create') },
            signin: { onclick: () => this.router.navigate('/login') },
            count: () => {
                const n = this.svc.rounds.get().length;
                return n === 0 ? '' : `${n} on the card`;
            },
            empty: {
                className: () =>
                    this.svc.rounds.get().length === 0
                        ? 'landing__empty'
                        : 'landing__empty hidden',
            },
        });

        this.$each(
            this.ref(frag, 'list'),
            this.svc.rounds,
            (item, _i, track) =>
                this.wireEl(
                    rowTpl,
                    {
                        row: {
                            onclick: () =>
                                this.router.navigate('/round', {
                                    query: { token: item.friendlyRound.shareToken },
                                }),
                        },
                        course: () => item.round.courseNameSnapshot ?? 'Round',
                        status: {
                            textContent: () =>
                                statusText[item.round.status] ?? item.round.status,
                            className: () => `round-row__status s-${item.round.status}`,
                        },
                        date: () => item.round.date,
                        formats: () =>
                            item.round.formatSlots.map(formatLabelFromSlot).join(' · '),
                    },
                    track,
                ),
            (item) => item.friendlyRound.id,
        );

        return frag;
    }
}
