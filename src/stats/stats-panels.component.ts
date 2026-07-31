import { Component, Signal, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, card } from '../css';
import {
    panelTitle,
    STATS_PANEL_IDS,
    type StatsDashboardModel,
    type StatsPanelId,
} from './stats-dashboard-model';
import {
    panelBlocks,
    panelHeadline,
    STATS_COPY,
    type StatsBlock,
    type StatsSegmentTone,
} from './stats-panel-blocks';
import { renderLadderRung, renderMiniBar, renderSplitBar } from './stats-charts';
import { STATS_COLORS } from './stats-palette';

// The five module cards (§3) — tee, approach, putting, short game, scoring.
//
// Extracted from `stats-dashboard.component.ts` so the per-round screen shows
// the SAME cards over the same gating, rather than a second set that drifts.
// This is the web twin of iOS's `StatsPanelsView(model:expanded:)`, which
// `StatsDashboardView` and `RoundStatsView` both embed for exactly that reason.
//
// The component takes a model GETTER, not a model. Its bindings read it, so the
// dashboard's window changes and the round screen's load both flow through
// without the child being rebuilt — and, because a single round put through
// `buildDashboardModel` is just a one-row window, the per-round cards need no
// special case at all. At n-of-18 sample sizes the rates degrade to fractions
// on their own (`stats-format`'s display policy), which is the honest reading.
//
// Nothing here computes a statistic: every number arrives formatted from
// `stats-panel-blocks.ts`, every geometry from `stats-charts.ts`.

const panelTpl = template(`
    <section bind="panel" class="panel">
        <button bind="head" class="panel__head" type="button" aria-expanded="false">
            <span class="panel__text">
                <span bind="title" class="panel__title"></span>
                <span bind="headline" class="panel__headline"></span>
            </span>
            <span bind="chev" class="panel__chev" aria-hidden="true"></span>
        </button>
        <div bind="body" class="panel__body"></div>
    </section>
`);

const subheadTpl = template(`<h3 bind="text" class="block__subhead"></h3>`);
const noteTpl = template(`<p bind="text" class="block__note"></p>`);

const splitTpl = template(`
    <div class="block block--split">
        <span bind="bar" class="block__splitbar"></span>
        <span bind="legend" class="block__legend"></span>
    </div>
`);

const barTpl = template(`
    <div class="block block--bar">
        <span bind="title" class="block__title"></span>
        <span bind="bar" class="block__bar"></span>
        <span bind="value" class="block__value"></span>
    </div>
`);

const rungTpl = template(`
    <div class="block block--bar">
        <span bind="title" class="block__title"></span>
        <span bind="bar" class="block__bar"></span>
        <span bind="value" class="block__value"></span>
    </div>
`);

const figureTpl = template(`
    <div class="block block--figure">
        <div class="block__text">
            <span bind="title" class="block__title"></span>
            <span bind="hint" class="block__hint"></span>
        </div>
        <span bind="value" class="block__value"></span>
    </div>
`);

const tpl = template(`<div bind="panels" class="statspanels"></div>`);

export interface StatsPanelsProps {
    /** Read on every binding — see the note above about the getter. */
    model: () => StatsDashboardModel;
}

export class StatsPanelsComponent extends Component<StatsPanelsProps> {
    static styles = `
        .statspanels {
            display: flex; flex-direction: column; gap: ${s('sm')};

            & .panel {
                ${card()}
                overflow: hidden;
                &.hidden { display: none; }

                & .panel__head {
                    ${btn()}
                    display: flex; align-items: center; gap: ${s('md')};
                    width: 100%;
                    padding: ${s('md')} ${s('lg')};
                    font-family: inherit; text-align: left;
                    background: transparent; border: none; border-radius: 0;
                }
                & .panel__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
                & .panel__title { font-weight: 600; font-size: 1rem; }
                & .panel__headline {
                    color: ${t('text-muted')}; font-size: 0.82rem;
                    &:empty { display: none; }
                }
                & .panel__chev {
                    flex-shrink: 0; width: 0; height: 0;
                    border-left: 5px solid transparent;
                    border-right: 5px solid transparent;
                    border-top: 6px solid ${t('text-muted')};
                    transition: transform 0.15s ease;
                }
                & .panel__head[aria-expanded='false'] .panel__chev { transform: rotate(-90deg); }

                & .panel__body {
                    display: flex; flex-direction: column; gap: ${s('sm')};
                    padding: 0 ${s('lg')} ${s('lg')};
                    &.hidden { display: none; }
                }
            }

            & .block__subhead {
                margin: ${s('sm')} 0 0;
                font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em;
                text-transform: uppercase; color: ${t('text-muted')};
            }
            & .block__note { margin: 0; font-size: 0.78rem; color: ${t('text-muted')}; }
            & .block { display: flex; align-items: center; gap: ${s('md')}; }
            & .block--split { flex-direction: column; align-items: stretch; gap: ${s('xs')}; }
            & .block__splitbar { display: block; & svg { width: 100%; display: block; } }
            & .block__legend {
                display: flex; flex-wrap: wrap; gap: ${s('md')};
                font-size: 0.8rem;
                & .legend__key {
                    display: inline-flex; align-items: center; gap: 6px;
                }
                & .legend__swatch {
                    width: 10px; height: 10px; flex-shrink: 0;
                    border-radius: 2px;
                }
                & .legend__value {
                    color: ${t('text-muted')};
                    font-variant-numeric: tabular-nums;
                }
            }
            & .block__title { flex: 1; min-width: 0; font-size: 0.9rem; }
            & .block__bar { width: 90px; flex-shrink: 0; & svg { width: 100%; display: block; } }
            & .block__value {
                flex-shrink: 0; text-align: right;
                font-size: 0.9rem; font-weight: 700;
                font-variant-numeric: tabular-nums;
                &.block__value--absent { font-weight: 400; color: ${t('text-muted')}; }
            }
            & .block--figure {
                align-items: flex-start;
                & .block__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
                & .block__hint {
                    font-size: 0.76rem; color: ${t('text-muted')};
                    &:empty { display: none; }
                }
            }
        }
    `;

    /** Which module cards are open. Collapsed by default — five open panels is a wall. */
    private expanded = new Signal<StatsPanelId[]>([]);
    private colors = STATS_COLORS;

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        const model = () => this.props.model();

        // Every panel is built ONCE, over the constant id list, and hides itself
        // when the window has no data for it. Iterating the PRESENT panels would
        // rebuild a card (and its nested block list) on every window change.
        this.$each(
            this.ref(frag, 'panels'),
            () => [...STATS_PANEL_IDS],
            (id: StatsPanelId, _i, track) => {
                const open = () => this.expanded.get().includes(id);
                const el = this.wireEl(
                    panelTpl,
                    {
                        panel: { className: () => (model()[id] ? 'panel' : 'panel hidden') },
                        head: {
                            'aria-expanded': () => String(open()),
                            onclick: () => this.togglePanel(id),
                        },
                        title: () => panelTitle(id),
                        headline: () => panelHeadline(id, model()) ?? '',
                        body: { className: () => (open() ? 'panel__body' : 'panel__body hidden') },
                    },
                    track,
                );
                this.$each(
                    this.ref(el, 'body'),
                    () => panelBlocks(id, model()),
                    (block, _j, blockTrack) => this.renderBlock(id, block, blockTrack),
                    (block) => block.id,
                );
                return el;
            },
            (id) => id,
        );

        return frag;
    }

    // --- Blocks --------------------------------------------------------------

    private renderBlock(
        panel: StatsPanelId,
        block: StatsBlock,
        track: (d: () => void) => void,
    ): HTMLElement {
        switch (block.kind) {
            case 'subhead':
                return this.wireEl(subheadTpl, { text: () => block.text }, track);
            case 'note':
                return this.wireEl(noteTpl, { text: () => block.text }, track);
            case 'split': {
                const live = () => this.blockNow(panel, block.id) ?? block;
                return this.wireEl(
                    splitTpl,
                    {
                        bar: {
                            innerHTML: () => {
                                const b = live();
                                if (b.kind !== 'split') return '';
                                return renderSplitBar(
                                    b.segments.map((seg) => ({
                                        id: seg.id,
                                        share: seg.share ?? 0,
                                        color: this.segmentColor(seg.tone),
                                    })),
                                    this.colors,
                                );
                            },
                        },
                        legend: {
                            innerHTML: () => {
                                const b = live();
                                if (b.kind !== 'split') return '';
                                return b.segments
                                    .map(
                                        (seg) =>
                                            `<span class="legend__key">` +
                                            `<span class="legend__swatch" style="background:${this.segmentColor(seg.tone)}"></span>` +
                                            `<span>${seg.title}</span>` +
                                            `<span class="legend__value">${seg.value ?? STATS_COPY.notRecorded}</span>` +
                                            `</span>`,
                                    )
                                    .join('');
                            },
                        },
                    },
                    track,
                );
            }
            case 'bar':
                return this.wireEl(
                    barTpl,
                    {
                        title: () => block.title,
                        bar: {
                            innerHTML: () => {
                                const b = this.blockNow(panel, block.id) ?? block;
                                if (b.kind !== 'bar' || b.share === null) return '';
                                return renderMiniBar(b.share, this.colors);
                            },
                        },
                        value: this.valueBinding(panel, block.id, () => block.value),
                    },
                    track,
                );
            case 'rung':
                return this.wireEl(
                    rungTpl,
                    {
                        title: () => block.title,
                        bar: {
                            innerHTML: () => {
                                const b = this.blockNow(panel, block.id) ?? block;
                                if (b.kind !== 'rung') return '';
                                return renderLadderRung(b.made, b.baseline, this.colors);
                            },
                        },
                        value: this.valueBinding(panel, block.id, () => block.value),
                    },
                    track,
                );
            case 'figure':
                return this.wireEl(
                    figureTpl,
                    {
                        title: () => block.title,
                        // Live, like the value beside it. The trouble tax's
                        // hint carries its own sample ("Measured over 9 holes
                        // from trouble vs 11 from the fairway"), so a hint
                        // closed over the block built for the FIRST window
                        // freezes that sentence while the number above it moves.
                        hint: () => {
                            const b = this.blockNow(panel, block.id) ?? block;
                            return (b.kind === 'figure' ? b.hint : block.hint) ?? '';
                        },
                        value: this.valueBinding(panel, block.id, () => block.value),
                    },
                    track,
                );
        }
    }

    /**
     * A value cell. A null reads "Not recorded" in muted, unweighted text: it is
     * a statement about the data, and dressing it in the same bold tabular
     * numerals as a measurement would make it look like one.
     */
    private valueBinding(
        panel: StatsPanelId,
        id: string,
        fallback: () => string | null,
    ): Record<string, () => unknown> {
        const value = (): string | null => {
            const live = this.blockNow(panel, id);
            if (live && 'value' in live) return live.value;
            return fallback();
        };
        return {
            textContent: () => value() ?? STATS_COPY.notRecorded,
            className: () =>
                value() === null ? 'block__value block__value--absent' : 'block__value',
        };
    }

    /** Brass for the neutral middle, action green for the good end, terracotta for trouble. */
    private segmentColor(tone: StatsSegmentTone): string {
        switch (tone) {
            case 'fairway':
                return this.colors.gain;
            case 'inplay':
                return this.colors.neutral;
            case 'trouble':
                return this.colors.loss;
        }
    }

    private togglePanel(id: StatsPanelId): void {
        const open = this.expanded.get();
        this.expanded.set(open.includes(id) ? open.filter((x) => x !== id) : [...open, id]);
    }

    /**
     * The live block with this id inside its own panel — ids are unique per
     * panel. `$each` builds a row once and keeps it while its key survives, so
     * a renderer's closed-over block goes stale the moment the model changes;
     * every reactive binding re-reads its block by key.
     */
    private blockNow(panel: StatsPanelId, id: string): StatsBlock | undefined {
        return panelBlocks(panel, this.props.model()).find((b) => b.id === id);
    }
}
