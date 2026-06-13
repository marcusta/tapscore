import { Component, Router, effect, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { ResultsService } from './results.service';

// Slice 2c placeholder. The leaderboard API now returns canonical
// `RoundResult` sections (ranked metrics, scorecards, match summaries). The
// section-driven mobile results view is built in 2.6e (M4); until then this
// component loads the payload and lists the round's scored slots so the route
// still works. The authoritative result surface is the static fixtures.

const tpl = template(`
    <div class="results">
        <header class="results__head">
            <button bind="back" type="button" class="results__chip">‹ Scores</button>
            <span bind="course" class="results__course"></span>
        </header>

        <div bind="notice" class="results__notice"></div>

        <div bind="slots" class="results__slots"></div>
    </div>
`);

const slotTpl = template(`<div bind="row" class="results-slot"></div>`);

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

            & .results__notice {
                color: ${t('text-muted')};
                font-size: 0.9rem;
                margin-bottom: ${s('lg')};
            }

            & .results__slots {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
            }

            & .results-slot {
                padding: ${s('md')} ${s('lg')};
                font-weight: 600;
                ${card()}
            }
        }
    `;

    private svc = this.inject(ResultsService);
    private router = this.inject(Router);
    private roundIdQ = this.router.query('roundId');

    render(): DocumentFragment {
        this.track(effect(() => {
            const id = this.roundIdQ.get();
            if (id) void this.svc.load(id);
        }));

        const slots = () => this.svc.result.get()?.slots ?? [];

        const frag = this.wire(tpl, {
            back: {
                onclick: () => this.router.navigate('/score', {
                    query: { roundId: this.roundIdQ.get() },
                }),
            },
            course: () => this.svc.round.get()?.courseNameSnapshot ?? 'Results',
            notice: () =>
                slots().length === 0
                    ? 'No scores yet — go play some golf.'
                    : 'Detailed results render in the static fixtures; the mobile view returns in a later step.',
        });

        this.$each(this.ref(frag, 'slots'), () => slots(), (slot, _i, track) =>
            this.wireEl(slotTpl, {
                row: () => `slot #${slot.slotIndex} · ${slot.formatLabel} · ${slot.allowanceLabel}`,
            }, track), (slot) => slot.slotDefId);

        return frag;
    }
}
