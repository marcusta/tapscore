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
    rungReading,
    STATS_COPY,
    type StatsBlock,
    type StatsSegmentTone,
} from './stats-panel-blocks';
import { panelInfoCards, type StatsInfoCard } from './panel-info-cards';
import {
    renderGreenCompass,
    renderLadderRung,
    renderMiniBar,
    renderSplitBar,
    renderTeeFan,
    RATE_BAR_TRACK_PX,
    RATE_COST_PX,
    RATE_VALUE_PX,
} from './stats-charts';
import {
    sgInfoCardTpl,
    SG_INFO_SHEET_MARKUP,
    SG_INFO_STYLES,
    SG_INFO_TRIGGER_MARKUP,
} from './sg-info-sheet';
import type { SgBaselineInfo } from './sg-baseline';
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

// The explainer trigger belongs to the card's HEADER, beside the title it
// explains — not buried under the rows, where it read as a footnote to the last
// block rather than a way in to the whole card.
//
// That forces the shape below. The header cannot BE a button any more: a
// trigger nested inside the expand button is invalid markup and, on iOS Safari,
// un-tappable. So the header is a plain flex row holding two SIBLING buttons —
// the expand control (which keeps `aria-expanded` and the chevron) and the
// right-aligned ghost trigger.
const panelTpl = template(`
    <section bind="panel" class="panel">
        <div class="panel__headrow">
            <button bind="head" class="panel__head" type="button" aria-expanded="false">
                <span class="panel__text">
                    <span bind="title" class="panel__title"></span>
                    <span bind="headline" class="panel__headline"></span>
                </span>
                <span bind="chev" class="panel__chev" aria-hidden="true"></span>
            </button>
            <span bind="infoRow" class="panel__inforow">
                ${SG_INFO_TRIGGER_MARKUP}
            </span>
        </div>
        <div bind="body" class="panel__body">
            <div bind="blocks" class="panel__blocks"></div>
        </div>
    </section>
`);

const subheadTpl = template(`<h3 bind="text" class="block__subhead"></h3>`);

// Right-aligned headers over the two fixed value columns. The leading title and
// bar cells are empty spacers of exactly the row geometry below, which is the
// only thing that keeps a header over its column.
const columnsTpl = template(`
    <div class="block block--columns" aria-hidden="true">
        <span class="block__title"></span>
        <span class="block__bar"></span>
        <span bind="c0" class="block__colhead"></span>
        <span bind="c1" class="block__colhead"></span>
    </div>
`);

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

// `role="img"` + a composed label: the row's three cells are a picture, a
// percentage and a signed number, and read out one by one they are gibberish
// ("plus one point two"). `rungReading` says it in words instead.
const rungTpl = template(`
    <div bind="row" class="block block--bar" role="img">
        <span bind="title" class="block__title"></span>
        <span bind="bar" class="block__bar"></span>
        <span bind="value" class="block__value"></span>
        <span bind="cost" class="block__cost"></span>
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

// The two dispersion pictures. Both keep the reading in WORDS beside the
// drawing: the SVG is `aria-hidden`, so the text line is not a caption, it is
// the block's content for anyone the picture does not reach.
const compassTpl = template(`
    <div class="block block--compass">
        <span bind="chart" class="block__compass"></span>
        <span bind="text" class="block__chart-text"></span>
    </div>
`);

const fanTpl = template(`
    <div class="block block--fan">
        <span bind="chart" class="block__fan"></span>
        <span bind="text" class="block__chart-text"></span>
    </div>
`);

const tpl = template(`
    <div class="statspanels">
        <div bind="panels" class="statspanels__list"></div>
${SG_INFO_SHEET_MARKUP}
    </div>
`);

export interface StatsPanelsProps {
    /** Read on every binding — see the note above about the getter. */
    model: () => StatsDashboardModel;
    /**
     * Which reference the putting ladder is measured against. A getter for the
     * same reason `model` is: the dashboard's cohort selector moves under the
     * open sheet, and the sentence naming the tier has to move with it.
     */
    baseline: () => SgBaselineInfo;
}

export class StatsPanelsComponent extends Component<StatsPanelsProps> {
    static styles = `
${SG_INFO_STYLES}
        .statspanels {
            & .statspanels__list { display: flex; flex-direction: column; gap: ${s('sm')}; }

            & .panel {
                ${card()}
                overflow: hidden;
                &.hidden { display: none; }

                & .panel__headrow { display: flex; align-items: center; }
                & .panel__head {
                    ${btn()}
                    flex: 1; min-width: 0;
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
                & .panel__blocks { display: flex; flex-direction: column; gap: ${s('sm')}; }
                & .panel__inforow {
                    flex: none; display: flex; align-items: center;
                    padding-right: ${s('lg')};
                    &.hidden { display: none; }
                }
            }

            & .block__subhead {
                margin: ${s('sm')} 0 0;
                font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em;
                text-transform: uppercase; color: ${t('text-muted')};
            }
            & .block { display: flex; align-items: center; gap: ${s('sm')}; }
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
            /* ONE geometry for every rate row on every card (owner ruling,
               2026-08-02). The track and the value column are pinned constants
               shared with the dashboard's score-type rows, so the bars line up
               down the whole screen instead of drifting a card at a time. */
            /* Two lines, then clamp — NOT one line with an ellipsis. At 375 px
               the flex column is around 110 px wide and the longest row titles
               ("Three-putts from over 8 m", "More than one from sand") are
               simply longer than that. Truncating them mid-word loses the fact
               the row is about; wrapping costs a few pixels of height and
               matches how the iOS twin lays the same titles out. */
            & .block__title {
                flex: 1; min-width: 0; font-size: 0.9rem;
                overflow: hidden;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
                line-clamp: 2;
                overflow-wrap: anywhere;
            }
            & .block__bar {
                width: ${RATE_BAR_TRACK_PX}px; flex: none;
                & svg { width: 100%; display: block; }
            }
            & .block__value {
                width: ${RATE_VALUE_PX}px; flex: none; text-align: right;
                font-size: 0.9rem; font-weight: 700;
                font-variant-numeric: tabular-nums;
                &.block__value--absent { font-weight: 400; color: ${t('text-muted')}; }
            }
            /* Quieter than the value beside it, deliberately: Holed is the
               row's headline reading and Cost is the gloss on it. Same size
               as the other secondary numbers on the screen. */
            & .block__cost {
                width: ${RATE_COST_PX}px; flex: none; text-align: right;
                font-size: 0.78rem; font-variant-numeric: tabular-nums;
                color: ${t('text-muted')};
            }
            & .block--columns {
                & .block__colhead {
                    flex: none; text-align: right;
                    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em;
                    text-transform: uppercase; color: ${t('text-muted')};
                }
                & .block__colhead:nth-child(3) { width: ${RATE_VALUE_PX}px; }
                & .block__colhead:nth-child(4) { width: ${RATE_COST_PX}px; }
            }
            & .block--compass, & .block--fan {
                flex-direction: column; align-items: stretch; gap: ${s('xs')};
            }
            & .block__compass {
                display: block; align-self: center;
                & svg { display: block; }
            }
            & .block__fan { display: block; & svg { width: 100%; display: block; } }
            & .block__chart-text {
                font-size: 0.8rem; color: ${t('text-muted')};
                font-variant-numeric: tabular-nums;
            }
            & .block--figure {
                align-items: flex-start;
                /* A figure has no bar, so its value is free to be as wide as the
                   number needs — the pinned column is for rows that carry a
                   track beside it. */
                & .block__value { width: auto; flex: 0 1 auto; }
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
    /** Whose "How this works" sheet is up, or null. One sheet, five triggers. */
    private openInfo = new Signal<StatsPanelId | null>(null);
    private colors = STATS_COLORS;

    render(): DocumentFragment {
        const model = () => this.props.model();
        const frag = this.wire(tpl, {
            infoSheet: {
                className: () =>
                    this.openInfo.get() !== null ? 'stats-info' : 'stats-info hidden',
                onclick: (e: Event) => {
                    // Backdrop press closes; a press inside the panel does not.
                    if (e.target === e.currentTarget) this.openInfo.set(null);
                },
            },
            infoTitle: () => {
                const id = this.openInfo.get();
                return id === null ? '' : panelTitle(id);
            },
            infoDone: { onclick: () => this.openInfo.set(null) },
        });

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
                        infoRow: {
                            // Two conditions, both about not offering a way in
                            // to nothing. No cards, no trigger — a sheet with
                            // an empty body must not be reachable. And closed
                            // card, no trigger: a reader who has not seen the
                            // rows has nothing for the sheet to explain, and
                            // five collapsed cards each advertising an
                            // explainer is a wall of links.
                            className: () =>
                                open() && this.infoCards(id).length > 0
                                    ? 'panel__inforow'
                                    : 'panel__inforow hidden',
                        },
                        infoTrigger: {
                            textContent: () => STATS_COPY.prioritiesInfo,
                            // Five identical "How this works" buttons on one
                            // screen are indistinguishable read out one at a
                            // time; the label says which card each opens.
                            'aria-label': () =>
                                `${STATS_COPY.prioritiesInfo}: ${panelTitle(id)}`,
                            onclick: () => this.openInfo.set(id),
                        },
                    },
                    track,
                );
                this.$each(
                    this.ref(el, 'blocks'),
                    () => panelBlocks(id, model()),
                    (block, _j, blockTrack) => this.renderBlock(id, block, blockTrack),
                    (block) => block.id,
                );
                return el;
            },
            (id) => id,
        );

        // The sheet's cards, rebuilt from the live model on every read: they
        // quote the reader's own denominators, which move with the window.
        this.$each(
            this.ref(frag, 'infoCards'),
            () => this.infoCards(this.openInfo.get()),
            (c: StatsInfoCard, _i, track) =>
                this.wireEl(
                    sgInfoCardTpl,
                    {
                        ctitle: () => (this.infoCardNow(c.id) ?? c).title,
                        ctext: () => (this.infoCardNow(c.id) ?? c).body,
                    },
                    track,
                ),
            (c) => c.id,
        );

        return frag;
    }

    private infoCards(id: StatsPanelId | null): StatsInfoCard[] {
        return panelInfoCards(id, this.props.model(), this.props.baseline());
    }

    /** The live card with this id in the OPEN panel's sheet — same staleness rule as `blockNow`. */
    private infoCardNow(id: string): StatsInfoCard | undefined {
        return this.infoCards(this.openInfo.get()).find((c) => c.id === id);
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
            case 'columns':
                return this.wireEl(
                    columnsTpl,
                    {
                        c0: () => block.cells[0] ?? '',
                        c1: () => block.cells[1] ?? '',
                    },
                    track,
                );
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
                            // A legend value is a RATE cell sitting under a
                            // fixed-width bar, so an absent one is the em-dash
                            // placeholder, not the two words: "Not recorded"
                            // wraps the legend onto a second line beside a
                            // segment that has nothing to show. The words are
                            // the FIGURE row's vocabulary.
                            innerHTML: () => {
                                const b = live();
                                if (b.kind !== 'split') return '';
                                return b.segments
                                    .map(
                                        (seg) =>
                                            `<span class="legend__key">` +
                                            `<span class="legend__swatch" style="background:${this.segmentColor(seg.tone)}"></span>` +
                                            `<span>${seg.title}</span>` +
                                            `<span class="legend__value">${seg.value ?? STATS_COPY.noValue}</span>` +
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
                        value: this.valueBinding(
                            panel,
                            block.id,
                            () => block.value,
                            STATS_COPY.noValue,
                        ),
                    },
                    track,
                );
            case 'rung': {
                const live = () => {
                    const b = this.blockNow(panel, block.id);
                    return b && b.kind === 'rung' ? b : block;
                };
                return this.wireEl(
                    rungTpl,
                    {
                        row: {
                            'aria-label': () => {
                                const b = live();
                                return rungReading({
                                    title: b.title,
                                    value: b.value,
                                    cost: b.cost,
                                });
                            },
                        },
                        title: () => block.title,
                        bar: {
                            innerHTML: () => {
                                const b = live();
                                return renderLadderRung(b.made, b.baseline, this.colors);
                            },
                        },
                        value: this.valueBinding(
                            panel,
                            block.id,
                            () => block.value,
                            STATS_COPY.noValue,
                        ),
                        cost: () => live().cost,
                    },
                    track,
                );
            }
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
            case 'compass':
                return this.wireEl(
                    compassTpl,
                    {
                        chart: {
                            innerHTML: () => {
                                const b = this.blockNow(panel, block.id) ?? block;
                                if (b.kind !== 'compass') return '';
                                return renderGreenCompass(b.sectors, b.labels, this.colors);
                            },
                        },
                        text: () => {
                            const b = this.blockNow(panel, block.id) ?? block;
                            return b.kind === 'compass' ? b.text : block.text;
                        },
                    },
                    track,
                );
            case 'fan':
                return this.wireEl(
                    fanTpl,
                    {
                        chart: {
                            innerHTML: () => {
                                const b = this.blockNow(panel, block.id) ?? block;
                                if (b.kind !== 'fan') return '';
                                return renderTeeFan(b.columns, this.toneColors(), this.colors);
                            },
                        },
                        text: () => {
                            const b = this.blockNow(panel, block.id) ?? block;
                            return b.kind === 'fan' ? b.text : block.text;
                        },
                    },
                    track,
                );
        }
    }

    /** The three tone colours as one record, for the fan's stacked segments. */
    private toneColors(): Record<StatsSegmentTone, string> {
        return {
            fairway: this.segmentColor('fairway'),
            inplay: this.segmentColor('inplay'),
            trouble: this.segmentColor('trouble'),
        };
    }

    /**
     * A value cell. A null reads in muted, unweighted text: it is a statement
     * about the data, and dressing it in the same bold tabular numerals as a
     * measurement would make it look like one.
     *
     * `absent` differs by row kind, and that is deliberate. A FIGURE has the
     * width to say `Not recorded` in words. A BAR or a RUNG does not — its value
     * cell is pinned at `RATE_VALUE_PX`, and two wrapped lines inside a bar row
     * is exactly the drift this pass removed — so it carries the em-dash
     * placeholder instead. Neither reaches a screen reader as a dash: the rung's
     * label is composed by `rungReading`.
     */
    private valueBinding(
        panel: StatsPanelId,
        id: string,
        fallback: () => string | null,
        absent: string = STATS_COPY.notRecorded,
    ): Record<string, () => unknown> {
        const value = (): string | null => {
            const live = this.blockNow(panel, id);
            if (live && 'value' in live) return live.value;
            return fallback();
        };
        return {
            textContent: () => value() ?? absent,
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
