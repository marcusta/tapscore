import { Component, Router, Signal, effect, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { StatsDashboardService } from './stats-dashboard.service';
import { STROKES_LOST_COMPONENTS, sgPer18 } from '../round/stat-measures';
import {
    choiceHint,
    choiceLabel,
    SG_BASELINE_CHOICES,
    type SgBaselineChoice,
} from './sg-baseline';
import {
    sgInfoCardTpl,
    SG_INFO_SHEET_MARKUP,
    SG_INFO_STYLES,
    SG_INFO_TRIGGER_MARKUP,
} from './sg-info-sheet';
import {
    priorityMagnitude,
    waterfallMagnitude,
    type StatsPriority,
    type StatsRoundRow,
    type StatsTrend,
} from './stats-dashboard-model';
import {
    priorityCoverage,
    resultsHistogram,
    resultsSubtitle,
    resultsTiles,
    roundLabel,
    sgInfoCards,
    sgPenaltySource,
    SG_INFO_COPY,
    STATS_COPY,
    type ResultsHistogramRow,
    type ResultsTile,
    type SgInfoCard,
} from './stats-panel-blocks';
import {
    renderMiniBar,
    renderSignedBar,
    renderSparkline,
    renderWaterfallStrip,
    RATE_BAR_TRACK_PX,
    RATE_VALUE_PX,
} from './stats-charts';
import { STATS_COLORS } from './stats-palette';
import { StatsPanelsComponent } from './stats-panels.component';
import {
    componentTitle,
    formatDay,
    formatNumber,
    quantity,
    roundTypeTitle,
    signedNumber,
    strokesPer18,
    UNIT_ROUNDS,
    venueTitle,
    vsPar,
} from './stats-format';
import {
    presetSubtitle,
    presetTitle,
    setRoundIncluded,
    toggleFilterEntry,
    type StatsRoundType,
    type StatsVenueType,
    type StatsWindowPreset,
} from './stats-window';

// The stats dashboard (proposal §4.3/§4.4) — the web twin of the iOS
// `StatsDashboardView`.
//
// The screen is one question ("over WHICH rounds?") followed by the answer. The
// window picker is a dropdown rather than chips because six options is over the
// app's chips ceiling of three or four, and the six do not compress: "Last 5",
// "Last 10" and "Last 20" are three readings of the same axis and abbreviating
// them to "5 / 10 / 20" would leave the row meaningless without its heading.
//
// Nothing here computes a statistic. Every number arrives formatted from
// `stats-panel-blocks.ts` / `stats-format.ts`, every geometry from
// `stats-charts.ts`, and every aggregate from `stats-dashboard-model.ts`. The
// component's whole job is DOM, colour tokens and which sections are open.

const tpl = template(`
    <div class="stats">
        <div bind="anon" class="stats__anon">
            <p>Your statistics live behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>

        <div bind="body" class="stats__body">
            <header class="stats__head">
                <h1>Your statistics</h1>
                <p bind="intro"></p>
            </header>

            <section class="stats__window">
                <div bind="picker" class="stats__picker"></div>
                <div class="stats__windowbar">
                    <span bind="sample" class="stats__sample"></span>
                    <button bind="filterToggle" class="stats__filterbtn" type="button"
                        aria-expanded="false">Filter</button>
                </div>
                <p bind="status" class="stats__status"></p>
                <p bind="err" class="stats__err"></p>
            </section>

            <section bind="filterPanel" class="stats__filter">
                <div class="stats__filterrow">
                    <span class="stats__filterlabel">Dates</span>
                    <div class="stats__dates">
                        <label class="stats__date">
                            <span>From</span>
                            <input bind="from" type="date" />
                        </label>
                        <label class="stats__date">
                            <span>To</span>
                            <input bind="to" type="date" />
                        </label>
                    </div>
                </div>
                <div class="stats__filterrow">
                    <span class="stats__filterlabel">Venue</span>
                    <div bind="venues" class="stats__chips"></div>
                </div>
                <div class="stats__filterrow">
                    <span class="stats__filterlabel">Round type</span>
                    <div bind="roundTypes" class="stats__chips"></div>
                </div>
                <div class="stats__filterrow">
                    <span class="stats__filterlabel">Courses</span>
                    <div bind="courses" class="stats__courses"></div>
                </div>
                <button bind="clearFilter" class="stats__clear" type="button"></button>

                <div class="stats__filterrow stats__filterrow--baseline">
                    <span class="stats__filterlabel" bind="sgLabel"></span>
                    <p bind="sgWhat" class="stats__filterhint"></p>
                    <div bind="sgPicker" class="stats__picker"></div>
                    <p bind="sgHint" class="stats__filterhint"></p>
                </div>
            </section>

            <div bind="empty" class="stats__empty"></div>

            <section bind="resultsSec" class="stats__section">
                <h2></h2>
                <p bind="resultsSub" class="stats__hint"></p>
                <div bind="resultsCard" class="results">
                    <div bind="resultTiles" class="results__tiles"></div>
                    <p bind="histHead" class="results__subhead"></p>
                    <div bind="resultHist" class="results__hist"></div>
                </div>
            </section>

            <section bind="prioritiesSec" class="stats__section">
                <div class="stats__sechead">
                    <h2></h2>
                    ${SG_INFO_TRIGGER_MARKUP}
                </div>
                <p bind="prioritiesHint" class="stats__hint"></p>
                <div bind="priorities" class="priorities"></div>
            </section>

            <section bind="trendsSec" class="stats__section">
                <h2></h2>
                <p bind="trendsHint" class="stats__hint"></p>
                <div bind="trends" class="stats__trends"></div>
            </section>

            <div bind="panels" class="stats__panels"></div>

            <section bind="roundsSec" class="stats__section">
                <h2></h2>
                <p bind="roundsHint" class="stats__hint"></p>
                <p bind="pickHint" class="stats__hint"></p>
                <div bind="rounds" class="stats__rounds"></div>
            </section>
        </div>
${SG_INFO_SHEET_MARKUP}
    </div>
`);

const chipTpl = template(`
    <button bind="chip" class="stats__chip" type="button" aria-pressed="false"></button>
`);

const courseTpl = template(`
    <label class="stats__course">
        <input bind="chk" type="checkbox" />
        <span bind="name" class="stats__coursename"></span>
        <span bind="count" class="stats__coursecount"></span>
    </label>
`);

const resultTileTpl = template(`
    <div bind="tile" class="rtile">
        <span bind="value" class="rtile__value"></span>
        <span bind="label" class="rtile__label"></span>
        <span bind="qualifier" class="rtile__qualifier"></span>
    </div>
`);

const scoreTypeTpl = template(`
    <div class="stype">
        <span bind="title" class="stype__title"></span>
        <span bind="bar" class="stype__bar"></span>
        <span bind="value" class="stype__value"></span>
    </div>
`);

const priorityTpl = template(`
    <div class="priority">
        <span bind="title" class="priority__title"></span>
        <span bind="chart" class="priority__chart"></span>
        <div class="priority__figures">
            <span bind="value" class="priority__value"></span>
            <span bind="sample" class="priority__sample"></span>
        </div>
    </div>
`);

const trendTpl = template(`
    <div class="trend">
        <span bind="title" class="trend__title"></span>
        <span bind="spark" class="trend__spark"></span>
        <span bind="headline" class="trend__headline"></span>
        <span bind="sample" class="trend__sample"></span>
    </div>
`);

// The row is NOT one big button: in the custom window it carries an
// include/exclude checkbox, and interactive content nested inside a button is
// invalid and unreachable by keyboard. The drill-down is its own button
// spanning the identity and the numbers, with the checkbox beside it.
const roundTpl = template(`
    <div class="statsround">
        <label bind="pickWrap" class="statsround__pick">
            <input bind="pick" type="checkbox" />
        </label>
        <button bind="open" class="statsround__open" type="button">
            <span class="statsround__who">
                <span bind="label" class="statsround__label"></span>
                <span bind="subtitle" class="statsround__subtitle"></span>
            </span>
            <span bind="strip" class="statsround__strip"></span>
            <span bind="vspar" class="statsround__vspar"></span>
        </button>
    </div>
`);

export class StatsDashboardComponent extends Component {
    static styles = `
        .stats {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .stats__anon {
                text-align: center;
                padding: ${s('2xl')} 0;
                color: ${t('text-muted')};
                &.hidden { display: none; }

                & button {
                    ${btn()}
                    margin-top: ${s('md')};
                    padding: ${s('md')} ${s('xl')};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${t('primary')}; color: ${t('primary-text')}; border: none;
                }
            }

            & .stats__body.hidden { display: none; }

            & .stats__head {
                margin-bottom: ${s('lg')};
                & h1 {
                    margin: 0;
                    font-family: ${t('font-display')};
                    font-weight: 600; font-size: 2rem; letter-spacing: -0.02em;
                }
                & p { margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.9rem; }
            }

            & .stats__window { margin-bottom: ${s('lg')}; }
            & .stats__picker { & .ui-select { display: block; width: 100%; } }

            & .stats__windowbar {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${s('md')}; margin-top: ${s('sm')};
            }
            & .stats__sample {
                color: ${t('text-muted')}; font-size: 0.85rem;
                font-variant-numeric: tabular-nums;
            }
            & .stats__filterbtn {
                ${btn()}
                flex-shrink: 0;
                padding: ${s('xs')} ${s('md')};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
                &[aria-expanded='true'] {
                    background: ${t('primary')}; color: ${t('primary-text')};
                    border-color: ${t('primary')};
                }
            }

            & .stats__status {
                margin: ${s('sm')} 0 0; font-size: 0.82rem; color: ${t('text-muted')};
                &:empty { display: none; }
            }
            & .stats__err {
                margin: ${s('sm')} 0 0; font-size: 0.85rem; color: ${t('error')};
                &:empty { display: none; }
            }

            /* The custom window's criteria. Hidden by default: it is a
               refinement of the picker above it, not a second picker. */
            & .stats__filter {
                ${card()}
                display: flex; flex-direction: column; gap: ${s('md')};
                padding: ${s('lg')};
                margin-bottom: ${s('lg')};
                &.hidden { display: none; }
            }
            & .stats__filterrow { display: flex; flex-direction: column; gap: ${s('xs')}; }
            & .stats__filterlabel {
                font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em;
                text-transform: uppercase; color: ${t('text-muted')};
            }
            /* The baseline sits BELOW the Clear button, behind a hairline: it is
               not filter criteria, and clearing the filter must not look like it
               resets the cohort too. */
            & .stats__filterrow--baseline {
                border-top: 1px solid ${t('border')};
                padding-top: ${s('md')};
            }
            & .stats__filterhint {
                margin: 0;
                font-size: 0.78rem; line-height: 1.35; color: ${t('text-muted')};
            }
            & .stats__dates { display: flex; gap: ${s('md')}; }
            & .stats__date {
                flex: 1; display: flex; flex-direction: column; gap: 2px;
                font-size: 0.8rem; color: ${t('text-muted')};
                & input {
                    ${input()}
                    width: 100%;
                    font-family: inherit; font-size: 0.9rem;
                }
            }
            & .stats__chips { display: flex; flex-wrap: wrap; gap: ${s('xs')}; }
            & .stats__chip {
                ${btn()}
                padding: ${s('xs')} ${s('md')};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
                border-radius: ${t('radius-pill')};
                &[aria-pressed='true'] {
                    background: ${t('primary')}; color: ${t('primary-text')};
                    border-color: ${t('primary')};
                }
            }
            & .stats__courses {
                display: flex; flex-direction: column; gap: ${s('xs')};
                max-height: 220px; overflow-y: auto;
            }
            & .stats__course {
                display: flex; align-items: baseline; gap: ${s('sm')};
                font-size: 0.9rem; cursor: pointer;
                & .stats__coursename { flex: 1; }
                & .stats__coursecount {
                    color: ${t('text-muted')}; font-size: 0.8rem;
                    font-variant-numeric: tabular-nums;
                }
            }
            & .stats__clear {
                ${btn()}
                align-self: flex-start;
                padding: ${s('xs')} ${s('md')};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .stats__empty {
                color: ${t('text-muted')}; font-size: 0.9rem; padding: ${s('lg')} 0;
                &:empty { display: none; }
            }

            & .stats__section {
                margin-bottom: ${s('xl')};
                &.hidden { display: none; }
                & h2 {
                    margin: 0 0 ${s('xs')};
                    font-family: ${t('font-display')};
                    font-weight: 600; font-size: 1.2rem;
                }
                /* Outranks the same reset in SG_INFO_STYLES, which this nested
                   rule would otherwise beat and leave the flex row unbalanced. */
                & .stats__sechead h2 { margin-bottom: 0; }
            }
            & .stats__hint {
                margin: 0 0 ${s('md')}; font-size: 0.82rem; color: ${t('text-muted')};
                &:empty { display: none; }
            }

            /* ONE card for the whole section: these figures are one answer to
               one question, and a card each would make the reader choose which
               of four equal boxes to read first. */
            & .results {
                ${card()}
                display: flex; flex-direction: column; gap: ${s('md')};
                padding: ${s('lg')};
                &.hidden { display: none; }
            }
            & .results__tiles {
                display: grid; grid-template-columns: repeat(2, 1fr); gap: ${s('md')};
            }
            & .rtile {
                display: flex; flex-direction: column; gap: 2px; min-width: 0;
                & .rtile__value {
                    font-weight: 700; font-size: 1.3rem;
                    font-variant-numeric: tabular-nums;
                }
                /* Both stacked lines are short by construction — a two-word
                   label and a strokes annotation — so they stay on one line
                   each. Letting them wrap gave the half-width tiles ragged
                   two-line breaks that read as a layout fault. */
                & .rtile__label {
                    font-size: 0.82rem; color: ${t('text-muted')}; white-space: nowrap;
                }
                & .rtile__qualifier {
                    font-size: 0.72rem; color: ${t('text-muted')}; white-space: nowrap;
                    &:empty { display: none; }
                }
            }
            /* The hero owns the row: the number IS the answer, and two equal
               tiles beside it would make the reader choose which to read. */
            & .rtile--hero {
                grid-column: 1 / -1;
                & .rtile__value { font-size: 2.1rem; line-height: 1.1; }
                /* Full width, and its qualifier is the only long one on the
                   card ("over 51 holes, scaled to 18") — it may wrap. */
                & .rtile__qualifier { white-space: normal; }
            }
            & .results__subhead {
                margin: 0; font-size: 0.72rem; font-weight: 700;
                letter-spacing: 0.06em; text-transform: uppercase;
                color: ${t('text-muted')};
                &:empty { display: none; }
            }
            & .results__hist { display: flex; flex-direction: column; gap: ${s('xs')}; }
            & .stype {
                /* Gap sm, matching the module-card rate row: with the track and
                   the value column both pinned, the gap no longer has to carry
                   the separation, and md here made these rows sit visibly
                   looser than the identical rows one card down. */
                display: flex; align-items: center; gap: ${s('sm')};
                & .stype__title { flex: 1; min-width: 0; font-size: 0.85rem; }
                /* The SAME track and value column as every module-card rate row
                   — these two used to be 84 and 56 by hand, and the 4px drift
                   was visible wherever the two sections met. */
                & .stype__bar {
                    width: ${RATE_BAR_TRACK_PX}px; flex: none;
                    & svg { width: 100%; display: block; }
                }
                & .stype__value {
                    width: ${RATE_VALUE_PX}px; flex: none; text-align: right;
                    font-size: 0.85rem; font-variant-numeric: tabular-nums;
                }
            }

            /* ONE card, exactly like Results above: the five terms are one
               answer to one question ("what is costing me shots?"), and five
               separate cards made the reader pick which of five equal boxes to
               read first — when the ORDER already answered that. */
            & .priorities {
                ${card()}
                display: flex; flex-direction: column; gap: ${s('md')};
                padding: ${s('lg')};
            }

            & .priority {
                display: flex; align-items: center; gap: ${s('md')};

                & .priority__title { flex: 1; min-width: 0; font-weight: 600; font-size: 0.98rem; }
                & .priority__chart { width: 84px; flex-shrink: 0; & svg { width: 100%; display: block; } }
                & .priority__figures {
                    width: 92px; flex-shrink: 0;
                    display: flex; flex-direction: column; align-items: flex-end;
                }
                & .priority__value {
                    font-weight: 700; font-size: 0.95rem;
                    font-variant-numeric: tabular-nums;
                }
                & .priority__sample {
                    color: ${t('text-muted')}; font-size: 0.72rem; text-align: right;
                }
            }

            /* Tiles rather than rows: a sparkline needs width more than the
               label does, and four of them fit two-up on a phone. */
            & .stats__trends {
                display: grid; grid-template-columns: repeat(2, 1fr); gap: ${s('sm')};
            }
            & .trend {
                ${card()}
                display: flex; flex-direction: column; gap: 2px;
                padding: ${s('md')};
                & .trend__title { font-size: 0.82rem; color: ${t('text-muted')}; }
                & .trend__spark { display: block; & svg { width: 100%; display: block; } }
                & .trend__headline {
                    font-weight: 700; font-size: 1.05rem;
                    font-variant-numeric: tabular-nums;
                }
                & .trend__sample { font-size: 0.72rem; color: ${t('text-muted')}; }
            }

            /* The five module cards live in StatsPanelsComponent — the per-round
               screen embeds the same component, so their CSS travels with it. */
            & .stats__panels { margin-bottom: ${s('xl')}; }

            & .stats__rounds { display: flex; flex-direction: column; gap: ${s('xs')}; }
            & .statsround {
                ${card()}
                display: flex; align-items: center; gap: ${s('md')};
                padding: ${s('sm')} ${s('lg')};

                & .statsround__pick {
                    flex-shrink: 0;
                    &.hidden { display: none; }
                }
                & .statsround__open {
                    ${btn()}
                    flex: 1; min-width: 0;
                    display: flex; align-items: center; gap: ${s('md')};
                    padding: 0;
                    font-family: inherit; text-align: left;
                    background: transparent; border: none; border-radius: 0;
                }
                & .statsround__who { flex: 1; min-width: 0; display: flex; flex-direction: column; }
                & .statsround__label {
                    font-weight: 600; font-size: 0.95rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .statsround__subtitle {
                    color: ${t('text-muted')}; font-size: 0.76rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .statsround__strip { width: 76px; flex-shrink: 0; & svg { width: 100%; display: block; } }
                & .statsround__vspar {
                    width: 44px; flex-shrink: 0; text-align: right;
                    font-weight: 700; font-size: 0.9rem;
                    font-variant-numeric: tabular-nums;
                }
            }
        }

${SG_INFO_STYLES}
    `;

    private svc = this.inject(StatsDashboardService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    /** Whether the custom-window criteria panel is showing. */
    private filterOpen = new Signal(false);
    /**
     * The "How this works" sheet. Gated on a signal like the handicap
     * derivation dialog, so the sheet's copy re-reads the live model every time
     * it opens — every sentence in it quotes the reader's own coverage.
     */
    private prioritiesInfoOpen = new Signal(false);

    private colors = STATS_COLORS;

    render(): DocumentFragment {
        const loggedIn = () => this.auth.currentUser.get() !== null;
        if (loggedIn()) {
            void this.svc.load();
            // The handicap only decides which tier `auto` resolves to, so it is
            // not awaited and its failure costs the screen nothing.
            void this.svc.loadHandicap();
        }

        const model = () => this.svc.model.get();
        const custom = () => this.svc.preset.get() === 'custom';

        const frag = this.wire(tpl, {
            anon: { className: () => (loggedIn() ? 'stats__anon hidden' : 'stats__anon') },
            toLogin: {
                onclick: () => this.router.navigate('/login', { query: { next: '/stats' } }),
            },
            body: { className: () => (loggedIn() ? 'stats__body' : 'stats__body hidden') },
            intro: () => STATS_COPY.intro,
            sample: () => this.sampleMarker(),
            filterToggle: {
                'aria-expanded': () => String(this.filterOpen.get()),
                onclick: () => this.filterOpen.set(!this.filterOpen.get()),
            },
            status: () => this.statusLine(),
            err: () => this.svc.error.get()?.message ?? '',
            filterPanel: {
                className: () => (this.filterOpen.get() ? 'stats__filter' : 'stats__filter hidden'),
            },
            from: {
                value: () => this.svc.filter.get().from ?? '',
                oninput: (e: Event) => this.setBound('from', (e.target as HTMLInputElement).value),
            },
            to: {
                value: () => this.svc.filter.get().to ?? '',
                oninput: (e: Event) => this.setBound('to', (e.target as HTMLInputElement).value),
            },
            clearFilter: {
                textContent: () => STATS_COPY.filterClear,
                onclick: () => this.svc.clearFilter(),
            },
            sgLabel: () => STATS_COPY.filterBaseline,
            sgWhat: () => STATS_COPY.filterBaselineHint,
            // The chosen row's own consequence, in the reader's numbers: which
            // tier is actually in force and why it is that one.
            sgHint: () => choiceHint(this.svc.sgChoice.get(), this.svc.handicapIndex.get()),
            empty: () => this.emptyLine(),
            resultsSec: {
                className: () =>
                    model().results !== null ? 'stats__section' : 'stats__section hidden',
            },
            resultsSub: () => resultsSubtitle(model().results),
            // A window whose rounds carry no score at all: the section still
            // exists (there ARE rounds), but the card would be empty.
            resultsCard: {
                className: () =>
                    resultsTiles(model().results).length === 0 &&
                    resultsHistogram(model().results).length === 0
                        ? 'results hidden'
                        : 'results',
            },
            histHead: () =>
                resultsHistogram(model().results).length === 0 ? '' : STATS_COPY.scoreTypesHead,
            prioritiesSec: {
                className: () =>
                    model().priorities.length > 0 ? 'stats__section' : 'stats__section hidden',
            },
            prioritiesHint: () => STATS_COPY.prioritiesHint,
            infoTrigger: {
                textContent: () => STATS_COPY.prioritiesInfo,
                onclick: () => this.prioritiesInfoOpen.set(true),
            },
            infoSheet: {
                className: () =>
                    this.prioritiesInfoOpen.get() ? 'stats-info' : 'stats-info hidden',
                onclick: (e: Event) => {
                    // Backdrop press closes; a press inside the panel does not.
                    if (e.target === e.currentTarget) this.prioritiesInfoOpen.set(false);
                },
            },
            infoTitle: () => SG_INFO_COPY.title,
            infoDone: { onclick: () => this.prioritiesInfoOpen.set(false) },
            trendsSec: {
                className: () =>
                    model().trends.length > 0 ? 'stats__section' : 'stats__section hidden',
            },
            trendsHint: () => STATS_COPY.trendsHint,
            roundsSec: {
                className: () =>
                    model().rounds.length > 0 ? 'stats__section' : 'stats__section hidden',
            },
            roundsHint: () => STATS_COPY.roundsHint,
            // Only says so where it is true: the per-round tick boxes appear in
            // `custom` and nowhere else.
            pickHint: () => (custom() ? STATS_COPY.filterRoundsHint : ''),
        });

        // Section headings are static text the template cannot hold (each
        // section's <h2> is bindless), so they are written once here.
        this.setHeading(frag, 'resultsSec', STATS_COPY.resultsHeading);
        this.setHeading(frag, 'prioritiesSec', STATS_COPY.priorities);
        this.setHeading(frag, 'trendsSec', STATS_COPY.trends);
        this.setHeading(frag, 'roundsSec', STATS_COPY.roundsHeading);

        this.mountPicker(frag);
        this.mountBaselinePicker(frag);
        this.mountFilterLists(frag);

        // --- Results ---------------------------------------------------------
        //
        // Both lists re-read from the live model inside every value binding:
        // `$each` keeps a row while its key survives, so the closed-over tile is
        // the one built for the window the row FIRST appeared in.
        this.$each(
            this.ref(frag, 'resultTiles'),
            () => resultsTiles(model().results),
            (tile: ResultsTile, _i, track) =>
                this.wireEl(
                    resultTileTpl,
                    {
                        tile: {
                            className: () =>
                                (this.tileNow(tile.id) ?? tile).hero ? 'rtile rtile--hero' : 'rtile',
                        },
                        value: {
                            textContent: () => (this.tileNow(tile.id) ?? tile).value,
                        },
                        label: {
                            textContent: () => (this.tileNow(tile.id) ?? tile).label,
                        },
                        qualifier: {
                            textContent: () => (this.tileNow(tile.id) ?? tile).qualifier ?? '',
                        },
                    },
                    track,
                ),
            (tile) => tile.id,
        );

        this.$each(
            this.ref(frag, 'resultHist'),
            () => resultsHistogram(model().results),
            (row: ResultsHistogramRow, _i, track) =>
                this.wireEl(
                    scoreTypeTpl,
                    {
                        title: () => row.title,
                        bar: {
                            // Neutral (brass) for every bucket: these are shares
                            // of a whole, not judgements, and the label already
                            // says which end is good.
                            innerHTML: () =>
                                renderMiniBar((this.histNow(row.id) ?? row).share, this.colors),
                        },
                        value: {
                            textContent: () => (this.histNow(row.id) ?? row).value,
                        },
                    },
                    track,
                ),
            (row) => row.id,
        );

        // --- Practice priorities ---------------------------------------------
        this.$each(
            this.ref(frag, 'priorities'),
            () => model().priorities,
            (p: StatsPriority, _i, track) =>
                this.wireEl(
                    priorityTpl,
                    {
                        title: () => componentTitle(p.component),
                        chart: {
                            innerHTML: () => {
                                const live = this.priorityNow(p.component);
                                return live?.per18 === null || live === undefined
                                    ? ''
                                    : renderSignedBar(
                                          live.per18,
                                          priorityMagnitude(model().priorities),
                                          this.colors,
                                      );
                            },
                        },
                        value: {
                            textContent: () => {
                                const live = this.priorityNow(p.component);
                                return live && live.per18 !== null
                                    ? strokesPer18(live.per18)
                                    : STATS_COPY.notEnoughData;
                            },
                        },
                        sample: {
                            textContent: () => {
                                const live = this.priorityNow(p.component);
                                if (!live) return '';
                                return live.per18 === null
                                    ? priorityCoverage(live.roundsInWindow)
                                    : `over ${quantity(live.roundsCovered, UNIT_ROUNDS)}`;
                            },
                        },
                    },
                    track,
                ),
            (p) => p.component,
        );

        // --- The "How this works" sheet ---------------------------------------
        //
        // Rebuilt from the live model on every read: the cards quote the
        // reader's own attribution coverage, which changes with the window.
        this.$each(
            this.ref(frag, 'infoCards'),
            () =>
                sgInfoCards({
                    attributed: model().waterfall.coverage.attributed,
                    holesScored: model().waterfall.coverage.holesScored,
                    windowRounds: model().rounds.length,
                    // The rows the card above is showing, so card 5 totals what
                    // the reader can actually see and add up.
                    rowsPer18: model().priorities.map((p) => p.per18),
                    penaltySource: sgPenaltySource(model().totals),
                    baseline: this.svc.sgInfo.get(),
                }),
            (c: SgInfoCard, _i, track) =>
                this.wireEl(
                    sgInfoCardTpl,
                    {
                        ctitle: () => (this.sgCardNow(c.id) ?? c).title,
                        ctext: () => (this.sgCardNow(c.id) ?? c).body,
                    },
                    track,
                ),
            (c) => c.id,
        );

        // --- Trends ----------------------------------------------------------
        this.$each(
            this.ref(frag, 'trends'),
            () => model().trends,
            (trend: StatsTrend, _i, track) =>
                this.wireEl(
                    trendTpl,
                    {
                        title: () => trend.title,
                        spark: {
                            innerHTML: () => {
                                const live = this.trendNow(trend.id) ?? trend;
                                return renderSparkline(live.points, live.kind, this.colors);
                            },
                        },
                        headline: {
                            textContent: () => {
                                const live = this.trendNow(trend.id) ?? trend;
                                return trendHeadline(live);
                            },
                        },
                        sample: {
                            textContent: () => {
                                const live = this.trendNow(trend.id) ?? trend;
                                return quantity(live.points.length, UNIT_ROUNDS);
                            },
                        },
                    },
                    track,
                ),
            (trend) => trend.id,
        );

        // --- Module cards ----------------------------------------------------
        //
        // Shared with the per-round screen, which embeds the same component over
        // a one-round model.
        this.spawn(StatsPanelsComponent, this.ref(frag, 'panels'), {
            model,
            baseline: () => this.svc.sgInfo.get(),
        });

        // --- Round list ------------------------------------------------------
        this.$each(
            this.ref(frag, 'rounds'),
            () => model().rounds,
            (row: StatsRoundRow, _i, track) =>
                this.wireEl(
                    roundTpl,
                    {
                        // The per-round drill-down (§4.2, the hole-by-hole
                        // screen) travels on `row.id` alone. The screen does its
                        // own loading and its own eligibility check, so the row
                        // hands over nothing but the id.
                        open: {
                            onclick: () =>
                                this.router.navigate('/round-stats', { query: { id: row.id } }),
                            'aria-label': () => `${roundLabel(row)} — hole by hole`,
                        },
                        label: () => roundLabel(row),
                        subtitle: () => roundSubtitle(row),
                        pickWrap: {
                            className: () =>
                                custom() ? 'statsround__pick' : 'statsround__pick hidden',
                        },
                        pick: {
                            checked: () => !this.svc.filter.get().excludedRoundIds.includes(row.id),
                            onchange: (e: Event) =>
                                this.svc.applyFilter(
                                    setRoundIncluded(
                                        this.svc.filter.get(),
                                        row.id,
                                        (e.target as HTMLInputElement).checked,
                                    ),
                                ),
                        },
                        strip: {
                            innerHTML: () => {
                                const live = this.roundNow(row.id) ?? row;
                                return renderWaterfallStrip(
                                    live.waterfall,
                                    waterfallMagnitude(model().rounds.map((r) => r.waterfall)),
                                    this.colors,
                                );
                            },
                        },
                        vspar: {
                            // Live, like the strip beside it: `$each` keeps a
                            // row while its id survives, so the closed-over
                            // `row` is the one built for the window this row
                            // FIRST appeared in.
                            textContent: () => {
                                const live = this.roundNow(row.id) ?? row;
                                return live.vsPar === null ? '' : vsPar(live.vsPar);
                            },
                        },
                    },
                    track,
                ),
            (row) => row.id,
        );

        return frag;
    }

    // --- Window picker -------------------------------------------------------

    /**
     * The six windows as a dropdown, with the group headings the proposal's
     * picker has ("Recent form" / "Everything" / "Custom"). `SelectOption`'s
     * `disabled: true` IS the group header — the framework skips them for
     * keyboard navigation and never matches them against the value.
     *
     * Two-way, like the profile's club picker: service→signal keeps the trigger
     * honest when the service switches window itself (applying a filter forces
     * `custom`), signal→service fires only on a real change and is deferred to a
     * microtask so the service's own signal writes are not tracked by this
     * effect.
     */
    private mountPicker(frag: DocumentFragment): void {
        const value = new Signal<string>(this.svc.preset.get());
        this.track(effect(() => value.set(this.svc.preset.get())));
        this.track(
            effect(() => {
                const v = value.get() as StatsWindowPreset;
                queueMicrotask(() => {
                    if (v === this.svc.preset.get()) return;
                    this.svc.select(v);
                });
            }),
        );

        const option = (preset: StatsWindowPreset): SelectOption => ({
            value: preset,
            label: `${presetTitle(preset)} — ${presetSubtitle(preset)}`,
        });
        const select = new SelectComponent({
            value,
            options: [
                { value: '__recent', label: 'Recent form', disabled: true },
                option('last5'),
                option('last10'),
                option('last20'),
                { value: '__all', label: 'Everything', disabled: true },
                option('thisYear'),
                option('all'),
                { value: '__custom', label: 'Built by hand', disabled: true },
                option('custom'),
            ],
            placeholder: presetTitle('last10'),
        });
        select.mount(this.ref(frag, 'picker'));
        this.track(() => select.destroy());
    }

    // --- Baseline picker -----------------------------------------------------

    /**
     * Five options — "Match my handicap" plus the four tiers — so a DROPDOWN,
     * not chips: the design guidelines cap chips at three or four, and this list
     * is one past that even before the auto row.
     *
     * Two-way on the same terms as `mountPicker`, and for the same reason: the
     * service owns the choice, and a signal→service write is deferred so this
     * effect never tracks the service's own writes.
     */
    private mountBaselinePicker(frag: DocumentFragment): void {
        const value = new Signal<string>(this.svc.sgChoice.get());
        this.track(effect(() => value.set(this.svc.sgChoice.get())));
        this.track(
            effect(() => {
                const v = value.get() as SgBaselineChoice;
                queueMicrotask(() => {
                    if (v === this.svc.sgChoice.get()) return;
                    this.svc.selectSgBaseline(v);
                });
            }),
        );

        const select = new SelectComponent({
            value,
            options: SG_BASELINE_CHOICES.map(
                (choice): SelectOption => ({ value: choice, label: choiceLabel(choice) }),
            ),
            placeholder: choiceLabel('auto'),
        });
        select.mount(this.ref(frag, 'sgPicker'));
        this.track(() => select.destroy());
    }

    // --- Filter panel --------------------------------------------------------

    private mountFilterLists(frag: DocumentFragment): void {
        const venues: StatsVenueType[] = ['outdoor', 'indoor'];
        this.$each(
            this.ref(frag, 'venues'),
            () => venues,
            (venue, _i, track) =>
                this.wireEl(
                    chipTpl,
                    {
                        chip: {
                            textContent: () => venueTitle(venue),
                            'aria-pressed': () =>
                                String(this.svc.filter.get().venueTypes.includes(venue)),
                            onclick: () =>
                                this.svc.applyFilter(
                                    toggleFilterEntry(this.svc.filter.get(), 'venueTypes', venue),
                                ),
                        },
                    },
                    track,
                ),
            (venue) => venue,
        );

        const roundTypes: StatsRoundType[] = ['full_18', 'front_9', 'back_9', 'custom_holes'];
        this.$each(
            this.ref(frag, 'roundTypes'),
            () => roundTypes,
            (type, _i, track) =>
                this.wireEl(
                    chipTpl,
                    {
                        chip: {
                            textContent: () => roundTypeTitle(type),
                            'aria-pressed': () =>
                                String(this.svc.filter.get().roundTypes.includes(type)),
                            onclick: () =>
                                this.svc.applyFilter(
                                    toggleFilterEntry(this.svc.filter.get(), 'roundTypes', type),
                                ),
                        },
                    },
                    track,
                ),
            (type) => type,
        );

        // Courses are a LIST, not chips: a player with fifteen courses would get
        // fifteen chips, which is four times the app's ceiling.
        this.$each(
            this.ref(frag, 'courses'),
            () => this.svc.courses.get(),
            (course, _i, track) =>
                this.wireEl(
                    courseTpl,
                    {
                        name: () => course.name,
                        count: () => quantity(course.roundCount, UNIT_ROUNDS),
                        chk: {
                            checked: () => this.svc.filter.get().courseIds.includes(course.id),
                            onchange: () =>
                                this.svc.applyFilter(
                                    toggleFilterEntry(this.svc.filter.get(), 'courseIds', course.id),
                                ),
                        },
                    },
                    track,
                ),
            (course) => course.id,
        );
    }

    /** A date bound edit — an empty field clears the bound rather than setting `''`. */
    private setBound(key: 'from' | 'to', raw: string): void {
        this.svc.applyFilter({ ...this.svc.filter.get(), [key]: raw === '' ? null : raw });
    }

    // --- Live lookups --------------------------------------------------------
    //
    // `$each` builds a row once and keeps it while its key survives, so a
    // renderer's closed-over item goes stale the moment the window changes. Every
    // reactive binding re-reads its row from the model by key — the same reason
    // the friends list re-finds its row inside each binding.

    private priorityNow(component: StatsPriority['component']): StatsPriority | undefined {
        return this.svc.model.get().priorities.find((p) => p.component === component);
    }

    private trendNow(id: string): StatsTrend | undefined {
        return this.svc.model.get().trends.find((tr) => tr.id === id);
    }

    private roundNow(id: string): StatsRoundRow | undefined {
        return this.svc.model.get().rounds.find((r) => r.id === id);
    }

    private tileNow(id: string): ResultsTile | undefined {
        return resultsTiles(this.svc.model.get().results).find((tile) => tile.id === id);
    }

    private histNow(id: ResultsHistogramRow['id']): ResultsHistogramRow | undefined {
        return resultsHistogram(this.svc.model.get().results).find((row) => row.id === id);
    }

    /** Live card lookup, same idiom as `tileNow`: cards 1–4 exist from the
     * empty model on, so a captured `c` would freeze their mount-time text
     * (card 5 alone is created after data lands, which made the staleness
     * asymmetric and easy to miss). */
    private sgCardNow(id: string): SgInfoCard | undefined {
        const m = this.svc.model.get();
        return sgInfoCards({
            attributed: m.waterfall.coverage.attributed,
            holesScored: m.waterfall.coverage.holesScored,
            windowRounds: m.rounds.length,
            rowsPer18: m.priorities.map((p) => p.per18),
            penaltySource: sgPenaltySource(m.totals),
            baseline: this.svc.sgInfo.get(),
        }).find((c) => c.id === id);
    }

    // --- Copy ----------------------------------------------------------------

    private setHeading(frag: DocumentFragment, section: string, text: string): void {
        const heading = this.ref(frag, section).querySelector('h2');
        if (heading) heading.textContent = text;
    }

    /**
     * "10 rounds" — or "10 of 87 rounds" when the window is a slice of a larger
     * history. The denominator is the server's own count of rounds with stats,
     * falling back to what has actually been fetched.
     *
     * When some rounds in the window carry no stat answers, this line also
     * says so — "6 rounds · stat capture on 2" — and it is the ONLY place
     * that says so (owner ruling, 2026-08-13): one coverage line up top, no
     * per-section framing, no per-row hole counts.
     */
    private sampleMarker(): string {
        const inWindow = this.svc.windowRounds.get().length;
        const total = this.svc.roundsWithStats.get() ?? this.svc.loadedCount();
        const head =
            total <= inWindow
                ? quantity(inWindow, UNIT_ROUNDS)
                : `${formatNumber(inWindow, 0)} of ${quantity(total, UNIT_ROUNDS)}`;
        const captured = this.svc.model.get().statCaptureRounds;
        if (inWindow === 0 || captured >= inWindow) return head;
        return `${head} · stat capture on ${formatNumber(captured, 0)}`;
    }

    /**
     * The one status line, in priority order: a failed background page first
     * (the numbers on screen may be short), then paging, then the budget note,
     * then the first load.
     */
    private statusLine(): string {
        const extendErr = this.svc.extendError.get();
        if (extendErr) return `${STATS_COPY.extendProblemPrefix}${extendErr.message}`;
        if (this.svc.extending.get()) return STATS_COPY.extending;
        if (this.svc.budgetSpent()) return STATS_COPY.budgetSpent;
        if (this.svc.loading.get()) return STATS_COPY.loading;
        return '';
    }

    /** Which empty state applies — "you have none" and "your filter has none" differ. */
    private emptyLine(): string {
        if (!this.svc.loaded.get() || this.svc.error.get()) return '';
        if (this.svc.overFiltered.get()) return STATS_COPY.windowEmpty;
        return this.svc.loadedCount() === 0 ? STATS_COPY.noStats : '';
    }
}

/** The newest point, read the way its axis is read. */
function trendHeadline(trend: StatsTrend): string {
    const last = trend.points[trend.points.length - 1];
    if (last === undefined) return '';
    return trend.kind === 'percentage' ? `${Math.round(last * 100)}%` : signedNumber(last);
}

/** "30 July 2026 · Linköping · 18 holes" — the round's identity in one line. */
function roundSubtitle(row: StatsRoundRow): string {
    const parts = [formatDay(row.date)];
    if (row.courseName) parts.push(row.courseName);
    parts.push(`${formatNumber(row.holeCount, 0)} holes`);
    return parts.join(' · ');
}
