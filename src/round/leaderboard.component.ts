import { Component, Computed, Signal, effect, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, card } from '../css';
import { RoundViewService } from './round.service';
import { renderSlotCards, renderSlotLeaderboard } from './result-render';
import type { SlotResultView } from '../api/friendly-rounds.gen';

const tpl = template(`
    <div bind="root" class="lb">
        <div bind="selector" class="lb__selector"></div>
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`);

const pillTpl = template(`<button bind="pill" class="lb__pill" type="button"></button>`);

/**
 * The no-login leaderboard for `/round?token=` (2.6e M5). A quick per-format
 * selector flips between the round's scored slots; each slot renders generic
 * canonical sections — ranked metrics, match summaries, and the format-aware
 * "full scorecard" cards (deferred here from M4). The client never interprets a
 * scoring-mode string; `result-render` lays out whatever sections the server
 * built, resolving ball ids → live names from `RoundViewService`.
 */
export class LeaderboardComponent extends Component {
    static styles = `
        .lb {
            padding: ${s('lg')} ${s('lg')} ${s('2xl')};

            & .lb__selector {
                display: flex;
                gap: ${s('sm')};
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding-bottom: ${s('xs')};
                margin-bottom: ${s('lg')};
                scrollbar-width: none;
                &::-webkit-scrollbar { display: none; }
                &.hidden { display: none; }
            }
            & .lb__pill {
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

            & .lb__status {
                color: ${t('text-muted')};
                padding: ${s('xl')} 0;
                text-align: center;
                &.hidden { display: none; }
            }

            & .lb-empty {
                color: ${t('text-muted')};
                padding: ${s('xl')} 0;
                text-align: center;
            }
            & .lb-diag {
                ${card()}
                padding: ${s('md')} ${s('lg')};
                color: ${t('error')};
                font-size: 0.85rem;
                margin-bottom: ${s('md')};
                & code { font-family: ui-monospace, monospace; }
            }

            /* Ranked metric + match-summary sections. */
            & .lb-section { margin-bottom: ${s('xl')}; }
            & .lb-section__title {
                margin: 0 0 ${s('sm')};
                font-family: ${t('font-display')};
                font-weight: 600;
                font-size: 1rem;
                color: ${t('text')};
            }
            & .lb-rank {
                width: 100%;
                border-collapse: collapse;
                font-variant-numeric: tabular-nums;
            }
            & .lb-rank thead th {
                text-align: left;
                font-size: 0.7rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: ${t('text-muted')};
                font-weight: 700;
                padding: ${s('xs')} ${s('sm')};
                border-bottom: 1px solid ${t('border')};
            }
            & .lb-rank tbody td {
                padding: ${s('sm')};
                border-bottom: 1px solid ${t('border')};
                font-size: 0.95rem;
            }
            & .lb-rank__pos { width: 2rem; font-weight: 700; color: ${t('text-muted')}; }
            & .lb-rank__who { font-weight: 600; font-family: ${t('font-display')}; }
            & .lb-rank__total { text-align: right; font-weight: 700; }
            & .lb-rank__thru { text-align: right; width: 3rem; color: ${t('text-muted')}; }
            & .lb-rank__lead td { background: ${t('accent-soft')}; }
            & .lb-rank__lead .lb-rank__pos { color: ${t('accent')}; }

            & .lb-match { list-style: none; margin: 0; padding: 0; }
            & .lb-match__line {
                padding: ${s('sm')} ${s('md')};
                border-bottom: 1px solid ${t('border')};
                font-size: 0.95rem;
            }
            & .lb-match__line--won { font-weight: 700; color: ${t('primary')}; }
            & .lb-match__line--lost { color: ${t('text-muted')}; }
            & .lb-match__line--halved { color: ${t('text')}; }

            /* Format-aware scorecard cards. */
            & .lb-cards__head {
                margin: ${s('xl')} 0 ${s('md')};
                font-family: ${t('font-display')};
                font-weight: 600;
                font-size: 1.1rem;
                color: ${t('text')};
            }
            & .lb-card {
                ${card()}
                padding: ${s('md')};
                margin-bottom: ${s('lg')};
            }
            & .lb-card__head { margin-bottom: ${s('sm')}; }
            & .lb-card__head h4 {
                margin: 0;
                font-family: ${t('font-display')};
                font-weight: 600;
                font-size: 1rem;
                color: ${t('text')};
            }
            & .lb-card__sub { font-size: 0.75rem; color: ${t('text-muted')}; margin-top: 2px; }
            & .lb-card__scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            /* Stacked 9-hole blocks (front 9 / back 9) get a little breathing room. */
            & .lb-card__scroll + .lb-card__scroll { margin-top: ${s('sm')}; }
            & .lb-grid {
                border-collapse: collapse;
                font-variant-numeric: tabular-nums;
                font-size: 0.8rem;
                white-space: nowrap;
            }
            & .lb-grid th, & .lb-grid td {
                padding: 3px 6px;
                text-align: center;
                border-bottom: 1px solid ${t('border')};
            }
            & .lb-grid thead th {
                font-size: 0.7rem;
                color: ${t('text-muted')};
                font-weight: 700;
            }
            & .lb-grid .lb-rowlabel {
                text-align: left;
                position: sticky;
                left: 0;
                background: ${t('surface')};
                font-weight: 600;
                color: ${t('text')};
            }
            & .lb-grid .lb-sum { font-weight: 700; background: ${t('surface-sunken')}; }
            & .lb-grid .lb-r-dim td, & .lb-grid .lb-r-dim th { color: ${t('text-muted')}; }
            & .lb-grid .lb-c-si { color: ${t('text-muted')}; font-size: 0.7rem; }
            & .lb-grid .lb-r-cat th { font-weight: 400; color: ${t('text-muted')}; }
            & .lb-grid .lb-c-cat { text-align: center; color: ${t('accent')}; }
            & .lb-card__caption { margin: ${s('sm')} 0 0; font-size: 0.72rem; font-style: italic; color: ${t('text-muted')}; }
            & .lb-card__notes { margin: ${s('sm')} 0 0; font-size: 0.72rem; color: ${t('text-muted')}; }
            & .lb-card__notes-label {
                display: block; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.04em; font-size: 0.68rem; margin-bottom: 2px;
            }
            & .lb-card__note { display: block; }
            & .lb-card__totals {
                list-style: none; margin: ${s('sm')} 0 0; padding: 0;
                display: flex; flex-wrap: wrap; gap: ${s('md')};
                font-size: 0.85rem; color: ${t('text')};
            }
        }
    `;

    private svc = this.inject(RoundViewService);
    private selected = new Signal(0);

    private slots = (): SlotResultView[] => this.svc.result.get()?.slots ?? [];
    private currentSlot = (): SlotResultView | null => {
        const slots = this.slots();
        return slots[this.selected.get()] ?? slots[0] ?? null;
    };

    render(): DocumentFragment {
        // Keep the selection in range as slots load / change.
        this.track(
            effect(() => {
                const n = this.slots().length;
                if (n > 0 && this.selected.get() >= n) this.selected.set(0);
            }),
        );

        const frag = this.wire(tpl, {
            status: {
                className: () => {
                    const loading = this.svc.resultLoading.get();
                    const empty = this.svc.result.get() === null;
                    return loading || empty ? 'lb__status' : 'lb__status hidden';
                },
                textContent: () =>
                    this.svc.resultLoading.get() ? 'Loading results…' : 'No results yet.',
            },
            body: { innerHTML: () => this.renderBody() },
        });

        // Per-format selector pills (only when >1 slot).
        const selectorHost = this.ref(frag, 'selector');
        this.track(
            effect(() => {
                selectorHost.className = this.slots().length > 1 ? 'lb__selector' : 'lb__selector hidden';
            }),
        );
        this.$each(
            selectorHost,
            new Computed(() => (this.slots().length > 1 ? this.slots() : [])),
            (slot, i, track) => this.slotPill(slot, i, track),
            (slot) => slot.slotDefId,
        );

        return frag;
    }

    private slotPill(slot: SlotResultView, index: number, track: (d: () => void) => void): HTMLElement {
        return this.wireEl(
            pillTpl,
            {
                pill: {
                    textContent: slot.formatLabel,
                    className: () => (this.selected.get() === index ? 'lb__pill active' : 'lb__pill'),
                    onclick: () => this.selected.set(index),
                },
            },
            track,
        );
    }

    private renderBody(): string {
        const result = this.svc.result.get();
        if (!result) return '';
        const slot = this.currentSlot();
        if (!slot) return '<div class="lb-empty">No formats in this round.</div>';
        const nameOf = (id: string) => this.svc.nameOf(id);
        const leaderboard = renderSlotLeaderboard(slot, nameOf);
        const cards = renderSlotCards(slot, result.routeSections, nameOf);
        const cardsBlock = cards ? `<h3 class="lb-cards__head">Scorecard</h3>${cards}` : '';
        return leaderboard + cardsBlock;
    }
}
