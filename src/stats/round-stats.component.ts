import { Component, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { MARKER_TOKENS } from '../round/marker-tokens';
import {
    STROKES_LOST_COMPONENTS,
    deltaComponent,
    sgPer18,
    strokesLostComponent,
} from '../round/stat-measures';
import { RoundStatsService } from './round-stats.service';
import { EMPTY_DASHBOARD_MODEL, waterfallMagnitude } from './stats-dashboard-model';
import { renderSignedBar, toneColor, toneForStrokesLost } from './stats-charts';
import { STATS_COLORS } from './stats-palette';
import { StatsPanelsComponent } from './stats-panels.component';
import { componentTitle, signedNumber } from './stats-format';
import { sgInfoCards, sgPenaltySource, SG_INFO_COPY, STATS_COPY, type SgInfoCard } from './stats-panel-blocks';
import {
    sgInfoCardTpl,
    SG_INFO_SHEET_MARKUP,
    SG_INFO_STYLES,
    SG_INFO_TRIGGER_MARKUP,
} from './sg-info-sheet';
import {
    cellHasPenalty,
    roundStatsTitle,
    type RoundStatsHoleCell,
    type TeeResult,
} from './round-stats-model';
import {
    baselineDeltaSentence,
    cellLabel,
    cellScoreText,
    holeDetailRows,
    holeLines,
    holeTitle,
    ROUND_STATS_COPY,
    roundStatsSubtitle,
    totalScoreLine,
} from './round-stats-copy';

// One round, hole by hole (proposal §4.2) — the web twin of iOS's
// `RoundStatsView`. Reached from the dashboard's round list, and from the
// round-end story card.
//
// Routes are static in this app, so the round travels as a query parameter
// (`/round-stats?id=…`) rather than a path segment — the same idiom as every
// other parameterised screen here.
//
// Two things this screen is careful about:
//
// - **Glyphs are never the only carrier.** Every mark on the strip has a legend
//   line and a full sentence in the expanded hole, and the whole cell is one
//   sentence for a screen reader. A colour-blind reader loses nothing.
// - **Unrecorded is not zero.** A hole with no answers expands to "Nothing was
//   recorded on this hole." rather than a grid of dashes that reads as "no".
//
// Nothing here computes a statistic: the model comes from
// `round-stats-model.ts`, the words from `round-stats-copy.ts`, the geometry
// from `stats-charts.ts`.

const tpl = template(`
    <div class="roundstats">
        <button bind="back" class="roundstats__back" type="button">Back to statistics</button>
        <p bind="finishKicker" class="roundstats__kicker hidden">Round finished</p>

        <p bind="state" class="roundstats__state"></p>

        <div bind="body" class="roundstats__body hidden">
            <header class="roundstats__head">
                <h1 bind="title"></h1>
                <p bind="subtitle"></p>
                <p bind="score" class="roundstats__score"></p>
            </header>

            <section bind="stripSec" class="roundstats__section">
                <h2></h2>
                <div bind="strip" class="roundstats__strip"></div>
                <div bind="detail" class="holedetail">
                    <p bind="detailTitle" class="holedetail__title"></p>
                    <div bind="detailLines" class="holedetail__lines"></div>
                    <p bind="detailEmpty" class="holedetail__empty"></p>
                </div>
            </section>

            <section class="roundstats__section">
                <div class="stats__sechead">
                    <h2 bind="wfHeading"></h2>
                    ${SG_INFO_TRIGGER_MARKUP}
                </div>
                <p bind="wfHint" class="roundstats__hint"></p>
                <div bind="deltas" class="roundstats__deltas"></div>
            </section>

            <div bind="panels" class="roundstats__panels"></div>

            <section class="roundstats__section">
                <h2 bind="legendHeading"></h2>
                <ul bind="legend" class="roundstats__legend"></ul>
            </section>
        </div>

        <button bind="finishClose" class="roundstats__closebtn hidden" type="button">Close</button>
${SG_INFO_SHEET_MARKUP}
    </div>
`);

const cellTpl = template(`
    <button bind="cell" class="cell" type="button" aria-pressed="false">
        <span bind="hole" class="cell__hole"></span>
        <span bind="score" class="cell__score"></span>
        <span class="cell__glyphs">
            <span bind="tee" class="cell__tee"></span>
            <span bind="gir" class="cell__gir"></span>
            <span bind="putts" class="cell__putts"></span>
            <span bind="pen" class="cell__pen">⚑</span>
        </span>
    </button>
`);

const lineTpl = template(`
    <div class="holedetail__line">
        <span bind="label" class="holedetail__label"></span>
        <span bind="value" class="holedetail__value"></span>
    </div>
`);

const deltaTpl = template(`
    <div class="delta">
        <div class="delta__text">
            <span bind="title" class="delta__title"></span>
            <span bind="sentence" class="delta__sentence"></span>
        </div>
        <span bind="value" class="delta__value"></span>
        <span bind="bar" class="delta__bar"></span>
    </div>
`);

const legendTpl = template(`<li bind="text" class="roundstats__legenditem"></li>`);

/**
 * The marker fills, straight out of the client's own marker table — the same
 * red birdie and blue bogey the leaderboard and the scorecard paint. A hole
 * with no marker (level par, picked up, unscored) keeps the card surface.
 *
 * Emitted as CSS from `MARKER_TOKENS` for the same reason the leaderboard's
 * rules are: a template restyled there restyles here, and neither file holds a
 * hand-written hex.
 */
function markerFillCss(): string {
    const lines: string[] = [];
    for (const [id, tok] of Object.entries(MARKER_TOKENS)) {
        if (tok.fill === undefined) continue;
        lines.push(
            `& .cell--${id} { background: ${tok.fill}; color: #fff; border-color: transparent;` +
                (tok.boxy ? ' border-radius: 3px;' : '') +
                ' }',
        );
    }
    return lines.join('\n            ');
}

export class RoundStatsComponent extends Component {
    static styles = `
        .roundstats {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .roundstats__back {
                ${btn()}
                margin-bottom: ${s('lg')};
                padding: ${s('xs')} ${s('md')};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
                &.hidden { display: none; }
            }

            /* Finish-flow mode (\`?finish=1\`): the screen is the last stage of
               the round's closing ceremony, so the dashboard back link stands
               down and a kicker + bottom Close home take its place. */
            & .roundstats__kicker {
                margin: 0 0 ${s('lg')};
                font-size: 0.78rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.08em;
                color: ${t('accent')};
                &.hidden { display: none; }
            }
            & .roundstats__closebtn {
                ${btn()}
                width: 100%;
                min-height: 52px;
                margin-top: ${s('xl')};
                font-family: inherit; font-size: 1rem; font-weight: 700;
                background: ${t('primary')};
                color: ${t('primary-text')};
                border: none;
                &.hidden { display: none; }
            }

            & .roundstats__state {
                margin: 0; color: ${t('text-muted')}; font-size: 0.9rem;
                &:empty { display: none; }
            }

            & .roundstats__body.hidden { display: none; }

            & .roundstats__head {
                margin-bottom: ${s('xl')};
                & h1 {
                    margin: 0;
                    font-family: ${t('font-display')};
                    font-weight: 600; font-size: 2rem; letter-spacing: -0.02em;
                }
                & p { margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.9rem; }
                & .roundstats__score {
                    color: ${t('text')};
                    font-size: 1.1rem; font-weight: 700;
                    font-variant-numeric: tabular-nums;
                    &:empty { display: none; }
                }
            }

            & .roundstats__section {
                margin-bottom: ${s('xl')};
                &.hidden { display: none; }
                & h2 {
                    margin: 0 0 ${s('md')};
                    font-family: ${t('font-display')};
                    font-weight: 600; font-size: 1.2rem;
                }
                /* Outranks the same reset in SG_INFO_STYLES, which this nested
                   rule would otherwise beat and leave the flex row unbalanced. */
                & .stats__sechead h2 { margin-bottom: 0; }
            }
            & .roundstats__subhead {
                margin: ${s('lg')} 0 ${s('sm')};
                font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em;
                text-transform: uppercase; color: ${t('text-muted')};
                &:empty { display: none; }
            }
            & .roundstats__hint {
                margin: ${s('xs')} 0 0; font-size: 0.82rem; color: ${t('text-muted')};
            }

            /* A wrapping grid rather than a scroller: eighteen cells fit three
               rows of six on the narrowest phone, and a horizontal scroller
               hides half the round behind a gesture. */
            & .roundstats__strip {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: ${s('xs')};
            }
            & .cell {
                ${btn()}
                display: flex; flex-direction: column; align-items: center; gap: 1px;
                padding: ${s('xs')} 2px;
                font-family: inherit;
                background: ${t('surface-sunken')};
                border: 1px solid ${t('border')};
                border-radius: ${t('radius-sm')};

                &[aria-pressed='true'] { outline: 2px solid ${t('primary')}; outline-offset: 1px; }

                & .cell__hole { font-size: 0.62rem; opacity: 0.75; }
                & .cell__score {
                    font-size: 1rem; font-weight: 700;
                    font-variant-numeric: tabular-nums;
                }
                & .cell__glyphs {
                    display: flex; align-items: center; gap: 3px;
                    min-height: 9px;
                    font-size: 0.6rem; line-height: 1;
                }
                /* Tee dot and GIR ring are 7px marks; the putt count is a
                   digit; the penalty is a flag character. Each is hidden by an
                   empty/absent modifier rather than rendered as a placeholder. */
                & .cell__tee {
                    width: 7px; height: 7px; border-radius: 50%;
                    &.cell__tee--absent { display: none; }
                }
                & .cell__gir {
                    width: 7px; height: 7px; border-radius: 50%;
                    border: 1.5px solid currentColor;
                    &.cell__gir--hit { background: currentColor; }
                    &.cell__gir--absent { display: none; }
                }
                & .cell__putts {
                    font-variant-numeric: tabular-nums;
                    &:empty { display: none; }
                }
                & .cell__pen.cell__pen--absent { display: none; }
            }
            ${markerFillCss()}

            & .holedetail {
                ${card()}
                margin-top: ${s('md')};
                padding: ${s('md')} ${s('lg')};
                &.hidden { display: none; }

                & .holedetail__title { margin: 0 0 ${s('xs')}; font-weight: 700; font-size: 0.95rem; }
                & .holedetail__lines { display: flex; flex-direction: column; gap: 2px; }
                & .holedetail__line { display: flex; justify-content: space-between; gap: ${s('md')}; }
                & .holedetail__label { color: ${t('text-muted')}; font-size: 0.85rem; }
                & .holedetail__value {
                    font-size: 0.85rem; font-weight: 600;
                    font-variant-numeric: tabular-nums;
                }
                & .holedetail__empty {
                    margin: 0; color: ${t('text-muted')}; font-size: 0.85rem;
                    &:empty { display: none; }
                }
            }

            & .roundstats__deltas { display: flex; flex-direction: column; gap: ${s('sm')}; }
            & .delta {
                ${card()}
                display: flex; align-items: center; gap: ${s('md')};
                padding: ${s('md')} ${s('lg')};

                & .delta__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
                & .delta__title { font-weight: 600; font-size: 0.98rem; }
                & .delta__sentence {
                    color: ${t('text-muted')}; font-size: 0.8rem;
                    &:empty { display: none; }
                }
                & .delta__value {
                    font-weight: 700; font-variant-numeric: tabular-nums;
                    flex-shrink: 0;
                }
                & .delta__bar { width: 84px; flex-shrink: 0; & svg { width: 100%; display: block; } }
            }

            & .roundstats__panels { margin-bottom: ${s('xl')}; }

            & .roundstats__legend {
                margin: 0; padding: 0; list-style: none;
                display: flex; flex-direction: column; gap: ${s('xs')};
                color: ${t('text-muted')}; font-size: 0.82rem;
            }
        }

${SG_INFO_STYLES}
    `;

    private svc = this.inject(RoundStatsService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private colors = STATS_COLORS;

    /** The hole whose stat line is expanded, or null. */
    private openHole = new Signal<string | null>(null);
    /** The "How this works" sheet — the per-round variant of the copy. */
    private infoOpen = new Signal(false);

    render(): DocumentFragment {
        const idQ = this.router.query('id');
        const model = () => this.svc.model.get();
        const ready = () => this.svc.phase.get() === 'ready' && model() !== null;

        // The id is read in an EFFECT, never in a field initializer: `load()`
        // reads signals synchronously (the dashboard's already-fetched rows),
        // and a synchronous read from inside this effect would subscribe it to
        // the service's own writes and refetch forever. `untrack` around the
        // call is the seam.
        this.track(
            effect(() => {
                const id = idQ.get();
                untrack(() => {
                    this.openHole.set(null);
                    if (id) void this.svc.load(id);
                });
            }),
        );

        // Finish-flow mode (`?finish=1`): reached from the round's finish
        // ceremony rather than the dashboard. Same screen, different exits —
        // the back link hides and a bottom "Close" goes home instead.
        const finishQ = this.router.query('finish');
        const finishMode = () => finishQ.get() === '1';

        const frag = this.wire(tpl, {
            back: {
                className: () => (finishMode() ? 'roundstats__back hidden' : 'roundstats__back'),
                onclick: () => this.router.navigate('/stats'),
            },
            finishKicker: {
                className: () =>
                    finishMode() ? 'roundstats__kicker' : 'roundstats__kicker hidden',
            },
            finishClose: {
                className: () =>
                    finishMode() ? 'roundstats__closebtn' : 'roundstats__closebtn hidden',
                onclick: () => this.router.navigate('/'),
            },
            state: () => this.stateLine(),
            body: { className: () => (ready() ? 'roundstats__body' : 'roundstats__body hidden') },
            title: () => (model() === null ? '' : roundStatsTitle(model()!)),
            subtitle: () => this.subtitle(),
            score: () => {
                const m = model();
                return m === null ? '' : (totalScoreLine(m.strokes, m.vsPar) ?? '');
            },
            stripSec: {
                className: () =>
                    (model()?.cells.length ?? 0) > 0
                        ? 'roundstats__section'
                        : 'roundstats__section hidden',
            },
            wfHeading: () => ROUND_STATS_COPY.waterfallHeading,
            wfHint: () => ROUND_STATS_COPY.waterfallHint,
            infoTrigger: {
                textContent: () => STATS_COPY.prioritiesInfo,
                onclick: () => this.infoOpen.set(true),
            },
            infoSheet: {
                className: () => (this.infoOpen.get() ? 'stats-info' : 'stats-info hidden'),
                onclick: (e: Event) => {
                    if (e.target === e.currentTarget) this.infoOpen.set(false);
                },
            },
            infoTitle: () => SG_INFO_COPY.title,
            infoDone: { onclick: () => this.infoOpen.set(false) },
            legendHeading: () => ROUND_STATS_COPY.legendHeading,
            detail: {
                className: () => (this.selected() === null ? 'holedetail hidden' : 'holedetail'),
            },
            detailTitle: () => {
                const cell = this.selected();
                return cell === null ? '' : holeTitle(cell);
            },
            detailEmpty: () => {
                const cell = this.selected();
                if (cell === null) return '';
                return holeLines(cell).length === 0 ? ROUND_STATS_COPY.nothingRecordedOnHole : '';
            },
        });

        this.setHeading(frag, 'stripSec', ROUND_STATS_COPY.holeStripHeading);

        // --- The strip -------------------------------------------------------
        this.$each(
            this.ref(frag, 'strip'),
            () => model()?.cells ?? [],
            (cell: RoundStatsHoleCell, _i, track) =>
                this.wireEl(
                    cellTpl,
                    {
                        cell: {
                            className: () => {
                                const live = this.cellNow(cell.id) ?? cell;
                                return live.marker === null ? 'cell' : `cell cell--${live.marker}`;
                            },
                            'aria-pressed': () => String(this.openHole.get() === cell.id),
                            'aria-label': () => cellLabel(this.cellNow(cell.id) ?? cell),
                            title: () => cellLabel(this.cellNow(cell.id) ?? cell),
                            onclick: () =>
                                this.openHole.set(
                                    this.openHole.get() === cell.id ? null : cell.id,
                                ),
                        },
                        hole: () => String((this.cellNow(cell.id) ?? cell).holeNumber),
                        score: () => cellScoreText(this.cellNow(cell.id) ?? cell),
                        tee: {
                            className: () => {
                                const live = this.cellNow(cell.id) ?? cell;
                                return live.tee === null ? 'cell__tee cell__tee--absent' : 'cell__tee';
                            },
                            style: () => {
                                const live = this.cellNow(cell.id) ?? cell;
                                return live.tee === null
                                    ? ''
                                    : `background:${this.teeColor(live.tee)}`;
                            },
                        },
                        gir: {
                            className: () => {
                                const live = this.cellNow(cell.id) ?? cell;
                                if (live.gir === null) return 'cell__gir cell__gir--absent';
                                return live.gir ? 'cell__gir cell__gir--hit' : 'cell__gir';
                            },
                        },
                        putts: () => {
                            const live = this.cellNow(cell.id) ?? cell;
                            return live.putts === null ? '' : String(live.putts);
                        },
                        pen: {
                            className: () =>
                                cellHasPenalty(this.cellNow(cell.id) ?? cell)
                                    ? 'cell__pen'
                                    : 'cell__pen cell__pen--absent',
                        },
                    },
                    track,
                ),
            (cell) => cell.id,
        );

        // --- The expanded hole ----------------------------------------------
        //
        // Keyed on hole AND label, never on the label alone: "Score" / "Putts"
        // repeat on every hole, so a label-keyed row would SURVIVE a hole switch
        // and keep the bindings that closed over the old hole's line — the
        // previous hole's numbers under the new hole's title. `holeDetailRows`
        // owns that key.
        this.$each(
            this.ref(frag, 'detailLines'),
            () => holeDetailRows(this.selected()),
            (row, _i, track) =>
                this.wireEl(lineTpl, { label: () => row.label, value: () => row.value }, track),
            (row) => row.key,
        );

        // --- Where the round went -------------------------------------------
        //
        // One row per component this round has a value for: the fixed-baseline
        // number and its bar, with the personal-baseline sentence underneath
        // when a window exists (iOS's RoundWaterfallSection, row for row). A
        // component with no reading is omitted rather than shown at zero:
        // "level" and "we have no idea" are different statements.
        this.$each(
            this.ref(frag, 'deltas'),
            () => {
                const m = model();
                if (m === null) return [];
                return STROKES_LOST_COMPONENTS.filter(
                    (c) => strokesLostComponent(m.waterfall, c) !== null,
                );
            },
            (component, _i, track) =>
                this.wireEl(
                    deltaTpl,
                    {
                        title: () => componentTitle(component),
                        sentence: () => {
                            const m = model();
                            if (m === null || m.deltas === null) return '';
                            const d = deltaComponent(m.deltas, component);
                            return d === null ? '' : baselineDeltaSentence(d, m.windowCount);
                        },
                        value: {
                            textContent: () => {
                                const v = this.componentValue(component);
                                return v === null ? '' : signedNumber(v);
                            },
                            style: () => {
                                const v = this.componentValue(component);
                                return v === null
                                    ? ''
                                    : `color:${toneColor(toneForStrokesLost(v), this.colors)}`;
                            },
                        },
                        bar: {
                            innerHTML: () => {
                                const m = model();
                                const v = this.componentValue(component);
                                if (m === null || v === null) return '';
                                return renderSignedBar(
                                    v,
                                    waterfallMagnitude([m.waterfall]),
                                    this.colors,
                                );
                            },
                        },
                    },
                    track,
                ),
            (component) => component,
        );

        // --- The "How this works" sheet ---------------------------------------
        //
        // The per-round variant: `windowRounds: 0` makes card 1 say "this
        // round's" and card 5 drop the window wording.
        this.$each(
            this.ref(frag, 'infoCards'),
            () => {
                const m = model();
                if (m === null) return [];
                return sgInfoCards({
                    attributed: m.waterfall.coverage.attributed,
                    holesScored: m.waterfall.coverage.holesScored,
                    windowRounds: 0,
                    rowsPer18: STROKES_LOST_COMPONENTS.map((c) => sgPer18(m.waterfall, c)),
                    penaltySource: sgPenaltySource(m.panels.totals),
                });
            },
            (c: SgInfoCard, _i, track) =>
                this.wireEl(sgInfoCardTpl, { ctitle: () => c.title, ctext: () => c.body }, track),
            (c) => c.id,
        );

        // --- Module cards ----------------------------------------------------
        //
        // The dashboard's own panels over a one-round window. Their sample
        // gating does the rest: at n-of-18 the rates print as fractions.
        this.spawn(StatsPanelsComponent, this.ref(frag, 'panels'), {
            model: () => model()?.panels ?? EMPTY_DASHBOARD_MODEL,
        });

        // --- Legend ----------------------------------------------------------
        this.$each(
            this.ref(frag, 'legend'),
            () => [
                ROUND_STATS_COPY.legendTee,
                ROUND_STATS_COPY.legendGir,
                ROUND_STATS_COPY.legendPutts,
                ROUND_STATS_COPY.legendPenalty,
                ROUND_STATS_COPY.legendAbsence,
            ],
            (text, _i, track) => this.wireEl(legendTpl, { text: () => text }, track),
            (text) => text,
        );

        return frag;
    }

    // --- Live lookups --------------------------------------------------------
    //
    // `$each` builds a cell once and keeps it while its key survives, so a
    // renderer's closed-over cell goes stale the moment the round reloads. Every
    // reactive binding re-reads its cell from the model by key.

    private cellNow(id: string): RoundStatsHoleCell | undefined {
        return this.svc.model.get()?.cells.find((c) => c.id === id);
    }

    private selected(): RoundStatsHoleCell | null {
        const id = this.openHole.get();
        return id === null ? null : (this.cellNow(id) ?? null);
    }

    /** Fairway green, brass in play, terracotta trouble — the chart palette. */
    private teeColor(tee: TeeResult): string {
        switch (tee) {
            case 'fairway':
                return this.colors.gain;
            case 'in_play':
                return this.colors.neutral;
            case 'trouble':
                return this.colors.loss;
        }
    }

    /** This round's fixed-baseline reading for one waterfall component. */
    private componentValue(component: (typeof STROKES_LOST_COMPONENTS)[number]): number | null {
        const m = this.svc.model.get();
        return m === null ? null : strokesLostComponent(m.waterfall, component);
    }

    // --- Copy ----------------------------------------------------------------

    private subtitle(): string {
        const m = this.svc.model.get();
        return m === null ? '' : roundStatsSubtitle({ ...m, title: roundStatsTitle(m) });
    }

    /**
     * The one line above the body. Signed-out first: the read is session-scoped,
     * so there is nothing to fetch and the prompt is the honest answer.
     */
    private stateLine(): string {
        if (this.auth.currentUser.get() === null) return ROUND_STATS_COPY.notSignedIn;
        switch (this.svc.phase.get()) {
            case 'loading':
            case 'idle':
                return ROUND_STATS_COPY.loading;
            case 'notFound':
                return ROUND_STATS_COPY.noStatsInRound;
            case 'notAuthorized':
                return ROUND_STATS_COPY.notSignedIn;
            case 'failed':
                return `${ROUND_STATS_COPY.failedPrefix}${this.svc.failure.get() ?? ''}`;
            case 'ready':
                return this.svc.model.get()?.cells.length === 0
                    ? ROUND_STATS_COPY.noHoleStrip
                    : '';
        }
    }

    private setHeading(frag: DocumentFragment, section: string, text: string): void {
        const heading = this.ref(frag, section).querySelector('h2');
        if (heading) heading.textContent = text;
    }
}
