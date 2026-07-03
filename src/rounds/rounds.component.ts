import { Component, Router, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { RoundsService } from './rounds.service';
import { formatLabelFromSlot } from './slot-labels';

const tpl = template(`
    <div class="rounds">
        <header class="rounds__head">
            <h1>Rounds</h1>
            <p bind="subtitle"></p>
        </header>
        <button bind="newBtn" class="rounds__new" type="button">
            <span class="rounds__new-plus">+</span> New round
        </button>
        <div bind="list" class="rounds__list"></div>
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

export class RoundsComponent extends Component {
    static styles = `
        .rounds {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .rounds__head {
                margin-bottom: ${s('xl')};

                & h1 {
                    margin: 0;
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p {
                    margin: ${s('xs')} 0 0;
                    color: ${t('text-muted')};
                    font-size: 0.9rem;
                }
            }

            & .rounds__new {
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

                & .rounds__new-plus { font-size: 1.4rem; line-height: 1; }
            }

            & .rounds__list {
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
        }
    `;

    private svc = this.inject(RoundsService);
    private router = this.inject(Router);

    render(): DocumentFragment {
        void this.svc.load();

        const frag = this.wire(tpl, {
            subtitle: () => {
                const n = this.svc.rounds.get().length;
                return n === 0 ? 'No rounds yet — tee one up.' : `${n} round${n === 1 ? '' : 's'} on the card.`;
            },
            // The auth-gated wizard is retired (2.6e M3); creating a round goes
            // through the no-login players-first flow at /create.
            newBtn: { onclick: () => this.router.navigate('/create') },
        });

        const statusText: Record<string, string> = {
            not_started: 'Not started',
            active: 'Live',
            complete: 'Done',
        };

        // Admin/internal rounds (created via the direct RoundDefinition path,
        // not the no-login FriendlyRound flow) have no share token, so this
        // list is read-only — there's no live score/results view to drill
        // into (the legacy `/score` + `/results` auth routes were dead stubs
        // and are deleted in 2.6e M6). Scoring/results happen at `/round?token=`.
        this.$each(this.ref(frag, 'list'), this.svc.rounds, (r, _i, track) => this.wireEl(rowTpl, {
            row: { disabled: true },
            course: () => r.courseNameSnapshot ?? 'Round',
            status: {
                textContent: () => statusText[r.status] ?? r.status,
                className: () => `round-row__status s-${r.status}`,
            },
            date: () => r.date,
            formats: () => r.formatSlots.map(formatLabelFromSlot).join(' · '),
        }, track), (r) => r.id);

        return frag;
    }
}
