// The §3 module panels, flattened to a list of BLOCKS the component renders.
//
// Every display decision lives here, not in the component: which figures a
// panel shows, in what order, what a null reads as, and whether a bar may be
// drawn at all. The component's job is one template per block kind.
//
// Nothing here computes a rate — everything arrives as a `Rate` from the model
// and leaves as a formatted string or a null. No judgement is applied to a
// sample any more: a bar ALWAYS draws its share (owner ruling, 2026-08-02), and
// a row that has nothing to say says it with the value-column placeholder.
//
// Rows carry no explainer prose. Every sentence that used to sit under a figure
// now lives in the card's "How this works" sheet (`panel-info-cards.ts`), where
// it is joined to the reader's own denominator instead of standing as static
// text under every row.
//
// Twin of `ios/TapScore/Features/Stats/StatsPanelViews.swift` (which is
// SwiftUI, so its blocks are inline views rather than data — same catalog,
// same order, same wording).

import {
    MIN_ATTRIBUTED_FOR_DELTA,
    PUTT_BUCKETS,
    rate,
    SCORE_TYPES,
    SG_BASELINES_V1,
    type Rate,
    type ResultsSummary,
    type ScoreType,
} from '../round/stat-measures';
import {
    cohortLabel,
    DEFAULT_SG_BASELINE_INFO,
    formatHandicap,
    type SgBaselineInfo,
} from './sg-baseline';
import type { StatMeasures } from '../api/player-stats.gen';
import {
    averageWithSample,
    bucketTitle,
    formatAverage,
    formatCost,
    formatCount,
    NO_VALUE,
    quantity,
    rateWithSample,
    formatRate,
    signedNumber,
    UNIT_GREENS,
    UNIT_HOLES,
    UNIT_LABELLED_PENALTY_HOLES,
    UNIT_ROUNDS,
    vsPar as vsParScore,
} from './stats-format';
import {
    greenCompassGeometry,
    teeFanGeometry,
    type CompassSector,
    type CompassSectorId,
    type FanSegment,
} from './stats-charts';
import type {
    StatsApproachPanel,
    StatsDashboardModel,
    StatsPanelId,
    StatsTeePanel,
} from './stats-dashboard-model';

/** Which theme family a split segment paints in. Resolved by the component. */
export type StatsSegmentTone = 'fairway' | 'inplay' | 'trouble';

export type StatsBlock =
    /** A small uppercase heading inside a panel. */
    | { kind: 'subhead'; id: string; text: string }
    // There was a `note` kind here — a paragraph of explanation sitting between
    // a subhead and its rows. The owner's 2026-08-02 ruling moved every one of
    // those into the card's info sheet, and the kind is GONE rather than merely
    // unused: a variant nothing constructs is an invitation to construct one,
    // and the type checker is a better guard against that than a test asserting
    // an absence.
    /** A proportional bar plus its key. */
    | {
          kind: 'split';
          id: string;
          segments: { id: string; title: string; tone: StatsSegmentTone; share: number | null; value: string | null }[];
      }
    /** Label, mini bar, reading. */
    | { kind: 'bar'; id: string; title: string; share: number | null; value: string | null }
    /**
     * One rung of the putting ladder: a bar against a baseline tick, the make
     * reading, and what the distance cost against the selected cohort.
     */
    | {
          kind: 'rung';
          id: string;
          title: string;
          made: number | null;
          baseline: number;
          value: string | null;
          cost: string;
      }
    /** Right-aligned column headers, over the fixed value columns below them. */
    | { kind: 'columns'; id: string; cells: string[] }
    /** Label / value / explanation. A null value prints "Not recorded". */
    | { kind: 'figure'; id: string; title: string; value: string | null; hint: string | null }
    /**
     * The green-miss compass. `sectors` is pure geometry from `stats-charts`;
     * `labels` is what goes INSIDE the (aria-hidden) picture, and `text` is the
     * same reading as words, which is what a screen reader and a reader who
     * ignores charts actually get.
     */
    | {
          kind: 'compass';
          id: string;
          sectors: readonly CompassSector[];
          labels: Readonly<Record<CompassSectorId, string>>;
          text: string;
          recorded: number;
      }
    /** The tee-shot fan. Same split of picture (`columns`) and words (`text`). */
    | { kind: 'fan'; id: string; columns: readonly FanSegment[]; text: string; recorded: number };

export const STATS_COPY = {
    title: 'Your statistics',
    intro: 'Every window is added up on this device from the rounds you have recorded.',
    signInPrompt: 'Your statistics live behind the optional sign-in.',
    loading: 'Adding up your rounds…',
    noStats:
        'No rounds with statistics yet. Turn statistics on in your profile and they start filling in as you score.',
    windowEmpty:
        'No rounds match this window. Widen the filter, or clear it to go back to your last 10 rounds.',
    extending: 'Loading more history…',
    extendProblemPrefix: 'Showing the rounds loaded so far — fetching older ones failed: ',
    budgetSpent: 'Showing the most recent rounds — this window stops short of your whole history.',
    notEnoughData: 'Not enough data',
    notRecorded: 'Not recorded',
    priorities: 'Practice priorities',
    prioritiesHint: 'Where your shots go, worst first. Positive costs you shots.',
    prioritiesInfo: 'How this works',
    trends: 'Trends',
    trendsHint: 'Oldest round on the left. A round with no reading is skipped, never plotted as zero.',
    roundsHeading: 'Rounds in this window',
    roundsHint: 'Each strip is that round’s five terms, on one shared scale.',
    filter: 'Filter',
    filterClear: 'Clear filter',
    filterDates: 'Dates',
    filterFrom: 'From',
    filterTo: 'To',
    filterVenue: 'Venue',
    filterRoundType: 'Round type',
    filterCourses: 'Courses',
    filterRoundsHint: 'Uncheck a round below to leave it out of a custom window.',
    // Not a filter — it changes what the rounds in the window are COMPARED
    // WITH, which is why it sits below the Clear button rather than above it.
    filterBaseline: 'Compared to',
    filterBaselineHint:
        'Which player the strokes-gained rows measure you against. It does not change which rounds are in the window.',
    troubleTax:
        'Extra strokes per hole when the tee shot finds trouble, against your own fairway holes.',
    recovery: 'Holes where the shot after trouble got you back in play.',
    penalties: 'Penalty strokes per round.',
    // A PLACEHOLDER in a fixed-width value column, never a label: a rate row's
    // value cell has no room for words, and `Not recorded` wrapping to two lines
    // inside a bar row is the drift the polish pass removed. `notRecorded`
    // remains the words a FIGURE row prints, and no aria string ever reads this.
    noValue: NO_VALUE,
    proximityProxy:
        'How far the first putt was on greens you hit — a stand-in for approach proximity, which the app does not measure directly.',
    birdieConversion: 'Greens hit that became a birdie or better.',
    ladderBaseline:
        'The tick is the make rate your reference expects from that distance. For the two longest bands it sits at zero: the reference expects two putts from there, so any make is ahead of it.',
    ladderCost:
        'Cost is how many strokes this distance has cost you across the window, against the reference you picked. Plus means it cost you shots; minus means you gained them.',
    missedGreenTax:
        'The difference between what a hole costs you with the green hit and with it missed.',
    threePutt: 'Holes with three putts or more.',
    longThreePutt: 'Three-putts that started from over 8 m.',
    puttsPerGir: 'Putts taken on holes where you hit the green.',
    conversionInside2m:
        'First putts from inside 2 m that went in — across every hole, not only chipped ones. The app records no chip-and-hole cross-tab.',
    chipIns: 'Short-game shots that went in without a putt.',
    vsParByTee:
        'What each kind of tee shot actually cost you, per hole. The trouble tax below is the difference between the last row and the first.',
    firstPuttSpread:
        'Where the first putt was on every hole you recorded one — not only the greens you hit.',
    puttsAfterMissedGreen: 'Putts taken on holes where you missed the green.',
    hardChipShare:
        'How often a missed green left a hard chip or pitch rather than a standard one.',
    greenMissHead: 'Where you miss the green',
    greenMiss: 'Recorded misses only. Long is past the flag, short is in front of it.',
    teeFanHead: 'Where your tee shots finish',
    teeFan: 'Side is recorded whenever the drive left the fairway. The darker block is trouble.',
    sandSave: 'Missed greens from a bunker where you still got up and down.',
    multiChip:
        'Missed greens that took more than one shot to reach the green. Holes where you did not count are treated as one.',
    multiChipBunker: 'Bunker holes that took more than one shot to get out.',
    extraShortGameStrokes: 'Short-game shots beyond one per missed green, across this window.',
    penaltySourceInfoTitle: 'Where the penalties came from',
    resultsHeading: 'Results',
    scoreTypesHead: 'Holes by score',
    doubleBogeyPlus: 'Holes at double bogey or worse, per round.',
    bounceBack: 'Holes after a bogey or worse that came back at par or better.',
} as const;

/**
 * A bar ALWAYS draws its share. There is no thin gate: `r.value` is null only
 * when the denominator is zero, and then there is no bar to draw and the value
 * cell carries the placeholder.
 */
function bar(id: string, title: string, r: Rate): StatsBlock {
    return { kind: 'bar', id, title, share: r.value, value: formatRate(r) };
}

function figure(id: string, title: string, value: string | null, hint: string | null = null): StatsBlock {
    return { kind: 'figure', id, title, value, hint };
}

/**
 * The ladder's two column headers, in order. Pinned words, and the twin asserts
 * them: `Holed` over the make reading, `Cost` over the strokes-gained cell.
 */
export const LADDER_COLUMNS: readonly [string, string] = ['Holed', 'Cost'];

/**
 * A ladder rung read out in WORDS — never the em dash, which is a placeholder
 * for the eye only.
 *
 * Composed from the rendered strings rather than the raw cost so there is one
 * rounding in the row: what a reader hears is what a reader sees.
 */
export function rungReading(rung: { title: string; value: string | null; cost: string }): string {
    const made = rung.value === null ? STATS_COPY.notRecorded : `${rung.value} holed`;
    if (rung.cost === STATS_COPY.noValue) return `${rung.title}, ${made}, ${STATS_COPY.notRecorded}`;
    const magnitude = rung.cost.replace(/^[+\u2212]/, '');
    if (rung.cost.startsWith('+')) return `${rung.title}, ${made}, ${magnitude} strokes lost`;
    if (rung.cost.startsWith('\u2212')) return `${rung.title}, ${made}, ${magnitude} strokes gained`;
    return `${rung.title}, ${made}, level`;
}

/**
 * The one figure the collapsed card carries. Null when the module's own
 * headline rate has no sample — the card still appears (the module WAS
 * recorded), it just has nothing to say until it is opened.
 */
export function panelHeadline(id: StatsPanelId, model: StatsDashboardModel): string | null {
    switch (id) {
        case 'tee': {
            const r = model.tee && rateWithSample(model.tee.fairway);
            return r ? `Fairways ${r}` : null;
        }
        case 'approach': {
            const r = model.approach && rateWithSample(model.approach.gir);
            return r ? `Greens in regulation ${r}` : null;
        }
        case 'putting':
            return model.putting
                ? averageWithSample(model.putting.puttsPerGirHole, {
                      unit: UNIT_GREENS,
                      label: 'putts per green hit',
                  })
                : null;
        case 'shortGame': {
            const r = model.shortGame && rateWithSample(model.shortGame.scramble.overall);
            return r ? `Scrambling ${r}` : null;
        }
        case 'scoring':
            return model.scoring
                ? averageWithSample(model.scoring.doubleBogeyPlusPerRound, {
                      unit: UNIT_ROUNDS,
                      label: 'doubles or worse per round',
                  })
                : null;
    }
}

/**
 * The trouble tax, as a bare figure.
 *
 * It is a DIFFERENCE of two averages, so the honest sample is two denominators
 * and a sentence long ("over 9 holes from trouble vs 11 from the fairway") —
 * which is why it is the info sheet that states it, not this row. `formatAverage`
 * — not `averageWithSample` — is deliberate: the figure's own `d` is a
 * cross-product guard and printing it would claim a sample of 99 holes.
 */
function troubleTaxFigure(panel: StatsTeePanel): StatsBlock {
    return figure('troubleTax', 'Trouble tax', formatAverage(panel.troubleTax, 2, true), null);
}

/** Average strokes vs par per hole, signed — the tee card's three absolutes. */
function vsPar(r: Rate): string | null {
    return averageWithSample(r, { unit: UNIT_HOLES, signed: true });
}

/**
 * The green-miss compass, as a block.
 *
 * The labels painted inside the wheel go through the SAME `formatRate` path as
 * the readable line beside it, so the picture and the prose can never disagree
 * about a number. Both read as a percentage at any denominator now — the
 * fraction fallback that used to make a wedge say "2 of 3" beside a line saying
 * "67%" is retired.
 */
function greenMissCompass(p: StatsApproachPanel): StatsBlock {
    const shares = {
        long: p.greenMiss.long.value ?? 0,
        short: p.greenMiss.short.value ?? 0,
        left: p.greenMiss.left.value ?? 0,
        right: p.greenMiss.right.value ?? 0,
    };
    // The block is gated on `greenMissRecorded > 0`, so every denominator here
    // is non-zero and `formatRate` never returns null — but say so, rather than
    // painting the words "Not recorded" inside a wedge.
    const label = (r: Rate): string => formatRate(r) ?? '';
    const word = (title: string, r: Rate): string =>
        `${title} ${formatRate(r) ?? STATS_COPY.notRecorded}`;
    return {
        kind: 'compass',
        id: 'greenMiss',
        sectors: greenCompassGeometry(shares),
        labels: {
            long: label(p.greenMiss.long),
            short: label(p.greenMiss.short),
            left: label(p.greenMiss.left),
            right: label(p.greenMiss.right),
        },
        text: [
            word('Long', p.greenMiss.long),
            word('Short', p.greenMiss.short),
            word('Left', p.greenMiss.left),
            word('Right', p.greenMiss.right),
        ].join(' · '),
        recorded: p.greenMissRecorded,
    };
}

/**
 * The tee-shot fan, as a block. Counts, not rates: the three columns partition
 * `teeRecorded`, and the readable line is what the picture is a picture OF.
 */
function teeFanBlock(p: StatsTeePanel): StatsBlock {
    const f = p.teeFan;
    return {
        kind: 'fan',
        id: 'teeFan',
        columns: teeFanGeometry(f, p.teeRecorded),
        text: [
            `Left ${formatCount(f.leftInPlay + f.leftTrouble)}`,
            `Fairway ${formatCount(f.fairway)}`,
            `Right ${formatCount(f.rightInPlay + f.rightTrouble)}`,
        ].join(' · '),
        recorded: p.teeRecorded,
    };
}

/** Whether any tee bucket has a scored hole behind it. */
function vsParByTeeRecorded(p: StatsTeePanel): boolean {
    return p.vsParByTee.fairway.d > 0 || p.vsParByTee.inPlay.d > 0 || p.vsParByTee.trouble.d > 0;
}

/** The open panel's contents, in reading order. Empty for an absent panel. */
export function panelBlocks(id: StatsPanelId, model: StatsDashboardModel): StatsBlock[] {
    switch (id) {
        case 'tee': {
            const p = model.tee;
            if (!p) return [];
            return [
                {
                    kind: 'split',
                    id: 'teeSplit',
                    // Raw shares, like every other bar on the screen: a segment
                    // always draws what the rate is. The legend prints the same
                    // percentage beside it, and the card's headline carries the
                    // sample the reader needs to know how big it is.
                    segments: [
                        { id: 'fairway', title: 'Fairway', tone: 'fairway', share: p.fairway.value, value: formatRate(p.fairway) },
                        { id: 'inPlay', title: 'In play', tone: 'inplay', share: p.inPlayOnly.value, value: formatRate(p.inPlayOnly) },
                        { id: 'trouble', title: 'Trouble', tone: 'trouble', share: p.trouble.value, value: formatRate(p.trouble) },
                    ],
                },
                // The fan sits directly under the split it decomposes. Absent,
                // never "Not recorded": a side is only asked for when the drive
                // missed, so a window of nothing but fairways has no picture to
                // draw and no gap to explain.
                ...(p.teeMissRecorded > 0
                    ? [
                          { kind: 'subhead' as const, id: 'teeFanHead', text: STATS_COPY.teeFanHead },
                          teeFanBlock(p),
                      ]
                    : []),
                // The three absolutes the tax is a difference OF, read before it.
                // Omitted as a group when no tee shot has a scored hole behind it;
                // inside the group a single empty row still prints "Not recorded",
                // because the three partition the tee shots and hiding one reads as
                // "you never went there".
                ...(vsParByTeeRecorded(p)
                    ? [
                          {
                              kind: 'subhead' as const,
                              id: 'vsParByTeeHead',
                              text: 'Average vs par, by where the tee shot finished',
                          },
                          figure('vsParFairway', 'From the fairway', vsPar(p.vsParByTee.fairway)),
                          figure('vsParInPlay', 'From in play', vsPar(p.vsParByTee.inPlay)),
                          figure('vsParTrouble', 'From trouble', vsPar(p.vsParByTee.trouble)),
                      ]
                    : []),
                troubleTaxFigure(p),
                bar('recovery', 'Recovery', p.recovery),
                // Absent, not zero: `penaltiesPerRound` divides by the round count,
                // so it would print a confident "0.00 per round" for a player who
                // never answered the question.
                ...(p.penaltiesRecordedHoles > 0
                    ? [
                          figure(
                              'penalties',
                              'Penalties',
                              averageWithSample(p.penaltiesPerRound, { unit: UNIT_ROUNDS }),
                          ),
                          bar('penaltyHoleShare', 'Holes with a penalty', p.penaltyHoleShare),
                          // `formatAverage`, never `averageWithSample`: the
                          // figure's own `d` is the cross-product guard, so the
                          // honest sample is the two sides below it.
                          figure(
                              'penaltyTax',
                              'Penalty tax',
                              formatAverage(p.penaltyTax, 2, true),
                          ),
                      ]
                    : []),
            ];
        }
        case 'approach': {
            const p = model.approach;
            if (!p) return [];
            return [
                // Directly under the card's own GIR headline, and above every
                // breakdown: the compass says WHERE the misses went, which is
                // the question the breakdowns below then slice. Absent when no
                // miss carries a direction — an empty wheel would read as "you
                // miss nowhere".
                ...(p.greenMissRecorded > 0
                    ? [
                          {
                              kind: 'subhead' as const,
                              id: 'greenMissHead',
                              text: STATS_COPY.greenMissHead,
                          },
                          greenMissCompass(p),
                      ]
                    : []),
                { kind: 'subhead', id: 'girByTee', text: 'Greens hit, by where the tee shot finished' },
                bar('girFairway', 'From the fairway', p.girByTee.fairway),
                bar('girInPlay', 'From in play', p.girByTee.inPlay),
                bar('girTrouble', 'From trouble', p.girByTee.trouble),
                // Ungated: a partition of `girRecorded`, which the panel is
                // already gated on. Hiding one of three parallel rows would read
                // as "you never played a par 5".
                { kind: 'subhead', id: 'girByParHead', text: 'Greens hit, by par' },
                bar('girPar3', 'Par 3', p.girByPar.par3),
                bar('girPar4', 'Par 4', p.girByPar.par4),
                bar('girPar5', 'Par 5', p.girByPar.par5),
                // The owner's own wording, abbreviation and all: "GIR" is what
                // the two subheads above this one already teach, and spelling it
                // out here would read as a different measurement.
                { kind: 'subhead', id: 'mixHead', text: 'Proximity with GIR' },
                ...PUTT_BUCKETS.map((b) => bar(`mix-${b}`, bucketTitle(b), p.girFirstPuttMix[b])),
                bar('birdieConversion', 'Birdie conversion', p.birdieConversion),
                // The approach panel is gated on `girRecorded`, which can be
                // non-zero on a window that recorded no short-game attempt at all.
                ...(p.hardChipShare.d > 0
                    ? [bar('hardChipShare', 'Hard misses', p.hardChipShare)]
                    : []),
                // Gated as a GROUP on either side having a scored hole, the same
                // shape `vsParByTeeRecorded` uses on the tee card. Inside it a
                // row with no sample of its own still prints "Not recorded".
                ...(p.costOfMissedGreen.hit.d > 0 || p.costOfMissedGreen.miss.d > 0
                    ? [
                          {
                              kind: 'subhead' as const,
                              id: 'missedGreenHead',
                              text: 'Cost of a missed green',
                          },
                          figure(
                              'vsParGreenHit',
                              'Green hit',
                              averageWithSample(p.costOfMissedGreen.hit, {
                                  unit: UNIT_GREENS,
                                  signed: true,
                              }),
                          ),
                          figure(
                              'vsParGreenMissed',
                              'Green missed',
                              averageWithSample(p.costOfMissedGreen.miss, {
                                  unit: UNIT_HOLES,
                                  signed: true,
                              }),
                          ),
                          figure(
                              'missedGreenTax',
                              'Missed-green tax',
                              formatAverage(p.costOfMissedGreen.delta, 2, true),
                          ),
                      ]
                    : []),
            ];
        }
        case 'putting': {
            const p = model.putting;
            if (!p) return [];
            return [
                // The raw distribution first: it is the context the make-% ladder
                // below is read against.
                ...(p.firstPuttSpread[PUTT_BUCKETS[0]!].d > 0
                    ? [
                          { kind: 'subhead' as const, id: 'firstPuttHead', text: 'First putt, all holes' },
                          ...PUTT_BUCKETS.map((b) => bar(`spread-${b}`, bucketTitle(b), p.firstPuttSpread[b])),
                      ]
                    : []),
                { kind: 'subhead', id: 'ladderHead', text: 'Holed on the first putt' },
                // One header row over the two fixed columns the rungs below fill.
                // Words, never a glyph: `Cost` is the same noun the home card's
                // "Costing you most" uses, and it carries the sign's meaning
                // without a legend — which the sheet spells out anyway.
                { kind: 'columns', id: 'ladderCols', cells: [...LADDER_COLUMNS] },
                ...p.ladder.map(
                    (rung): StatsBlock => ({
                        kind: 'rung',
                        id: `rung-${rung.bucket}`,
                        title: bucketTitle(rung.bucket),
                        made: rung.made.value,
                        baseline: rung.baseline,
                        value: formatRate(rung.made),
                        cost: formatCost(rung.cost),
                    }),
                ),
                // One gate for the group: all four share `puttsRecorded`, so
                // checking `zero.d` IS checking it. The panel can be present on
                // `firstPuttRecorded` alone, with no putt count anywhere.
                ...(p.puttDistribution.zero.d > 0
                    ? [
                          { kind: 'subhead' as const, id: 'puttCountHead', text: 'Holes by putts' },
                          bar('putts-zero', 'No putts', p.puttDistribution.zero),
                          bar('putts-one', 'One putt', p.puttDistribution.one),
                          bar('putts-two', 'Two putts', p.puttDistribution.two),
                          bar('putts-threePlus', 'Three or more', p.puttDistribution.threePlus),
                      ]
                    : []),
                // No standalone "Three-putts" row: the distribution's "Three or
                // more" above is the same numerator over the same denominator,
                // and two rows for one fact is what this pass removed. The lag
                // fact below is distinct and stays.
                bar('longThreePutt', 'Three-putts from over 8 m', p.threePuttsFromOver8m),
                figure(
                    'puttsPerGir',
                    'Putts per green hit',
                    averageWithSample(p.puttsPerGirHole, { unit: UNIT_GREENS }),
                ),
                ...(p.puttsAfterMissedGreen.d > 0
                    ? [
                          figure(
                              'puttsAfterMissedGreen',
                              'Putts after a missed green',
                              averageWithSample(p.puttsAfterMissedGreen, { unit: UNIT_HOLES }),
                          ),
                      ]
                    : []),
                // A partition of `puttsRecorded`, so it takes the SAME gate the
                // "Holes by putts" group above takes — `zero.d` is that
                // denominator. The panel can be present on `firstPuttRecorded`
                // alone, and a subhead over three "Not recorded" rows is dead
                // noise. Inside the group an empty row still prints, because the
                // three partition the holes. Unsigned — putts are a quantity,
                // not a deviation.
                ...(p.puttDistribution.zero.d > 0
                    ? [
                          {
                              kind: 'subhead' as const,
                              id: 'puttsByParHead',
                              text: 'Putts per hole, by par',
                          },
                          figure(
                              'puttsPar3',
                              'Par 3',
                              averageWithSample(p.puttsPerHoleByPar.par3, { unit: UNIT_HOLES }),
                          ),
                          figure(
                              'puttsPar4',
                              'Par 4',
                              averageWithSample(p.puttsPerHoleByPar.par4, { unit: UNIT_HOLES }),
                          ),
                          figure(
                              'puttsPar5',
                              'Par 5',
                              averageWithSample(p.puttsPerHoleByPar.par5, { unit: UNIT_HOLES }),
                          ),
                      ]
                    : []),
            ];
        }
        case 'shortGame': {
            const p = model.shortGame;
            if (!p) return [];
            return [
                { kind: 'subhead', id: 'scrambleHead', text: 'Scrambling' },
                bar('scrambleStandard', 'Standard', p.scramble.standard),
                bar('scrambleHard', 'Hard', p.scramble.hard),
                // The third leg, on the same gate as every other bunker row: a
                // window with no sand in it has no bunker scrambling to report,
                // and an empty row would read as "you never got up and down".
                // `scrambleAttemptsBunker` is the denominator all three bunker
                // rows share — a chip-in has `putts = 0`, which the attempt
                // predicate counts, so no non-zero bunker figure can hide behind
                // this gate.
                ...(p.scrambleAttemptsBunker > 0
                    ? [bar('scrambleBunker', 'Bunker', p.scramble.bunker)]
                    : []),
                // Sand save is the bunker scramble under the name a golfer uses
                // for it. Absent with no bunker attempt: there is no such thing
                // as a 0% sand save over zero bunkers.
                ...(p.scrambleAttemptsBunker > 0
                    ? [
                          bar('sandSave', 'Sand save', p.sandSave),
                      ]
                    : []),
                // The counter block, gated as a GROUP on at least one COUNTED
                // hole: with nothing counted every hole models as one stroke, so
                // all three numbers would be a confident restatement of the
                // model rather than a reading of the player.
                ...(p.shortGameStrokesRecorded > 0
                    ? [
                          bar('multiChipBunker', 'More than one from sand', p.multiChipBunker),
                          figure(
                              'extraShortGameStrokes',
                              'Extra short-game shots',
                              String(p.extraShortGameStrokes),
                          ),
                          bar('multiChip', 'More than one chip', p.multiChip),
                      ]
                    : []),
                { kind: 'subhead', id: 'chipHead', text: 'Chipped to inside 2 m' },
                bar('chipStandard', 'Standard', p.chipInside2m.standard),
                bar('chipHard', 'Hard', p.chipInside2m.hard),
                ...(p.scrambleAttemptsBunker > 0
                    ? [bar('chipBunker', 'Bunker', p.chipInside2m.bunker)]
                    : []),
                bar('conversionInside2m', 'Holed from inside 2 m', p.conversionInside2m),
                // The legs, not the sum: the rows match the groups above them,
                // and the total is the addition of what is visible. Bunker rides
                // the same gate as its two siblings above, so the three sections
                // agree about whether this window has any sand in it.
                { kind: 'subhead', id: 'chipInsHead', text: 'Chip-ins' },
                figure('chipInsStandard', 'Standard', formatCount(p.chipIns.standard)),
                figure('chipInsHard', 'Hard', formatCount(p.chipIns.hard)),
                ...(p.scrambleAttemptsBunker > 0
                    ? [figure('chipInsBunker', 'Bunker', formatCount(p.chipIns.bunker))]
                    : []),
            ];
        }
        case 'scoring': {
            const p = model.scoring;
            if (!p) return [];
            const avg = (r: Rate): string | null =>
                averageWithSample(r, { unit: UNIT_HOLES, signed: true });
            return [
                { kind: 'subhead', id: 'vsParHead', text: 'Average vs par' },
                figure('par3', 'Par 3', avg(p.avgVsParByParGroup.par3)),
                figure('par4', 'Par 4', avg(p.avgVsParByParGroup.par4)),
                figure('par5', 'Par 5', avg(p.avgVsParByParGroup.par5)),
                figure(
                    'doubles',
                    'Doubles or worse',
                    averageWithSample(p.doubleBogeyPlusPerRound, { unit: UNIT_ROUNDS }),
                ),
                bar('bounceBack', 'Bounce-back', p.bounceBack),
            ];
        }
    }
}

// --- Results -----------------------------------------------------------------
//
// ONE card, and the NUMBER is the hero. No explanation sentences: the label says
// what the figure is, and at most one small muted qualifier line says what its
// denominator was — but only when that denominator DIVERGES from the round count
// in the section subtitle. A qualifier that repeats what the subtitle already
// said is noise, and a sentence explaining the maths is the thing this redesign
// removed.
//
// "Thin sample" as words never appears here. The qualifier line IS the thinness
// signal, so `averageSample` / `averageWithSample` / `rateWithSample` are
// deliberately not called from this section.

/** One figure in the Results card. Exactly one tile in a list is the hero. */
export interface ResultsTile {
    /** `'avgVsPar'` or `` `best-${holeCount}` `` — the view's key. */
    id: string;
    label: string;
    value: string;
    /** The one small muted line. Null unless the denominator diverges. */
    qualifier: string | null;
    /** True for exactly one tile: the view spans and enlarges it. */
    hero: boolean;
}

/** One bucket of the score-type histogram — label, bar, count. */
export interface ResultsHistogramRow {
    id: ScoreType;
    title: string;
    /** Bar length in [0,1]; null draws NO bar (no scored hole at all). */
    share: number | null;
    value: string;
}

/**
 * "5 rounds — 4 × 18 holes, 1 × 9 holes" — the section subtitle, which carries
 * the round count so no "Rounds" figure has to exist inside the card.
 *
 * The count is EVERY row in the window, so it agrees with the round list below
 * it: a score-only or stats-only round is still a round the player played.
 */
export function resultsSubtitle(results: ResultsSummary | null): string {
    if (!results || results.rounds === 0) return '';
    const head = quantity(results.rounds, UNIT_ROUNDS);
    const first = results.lengths[0];
    // One length: the mix would read "5 rounds — 5 × 18 holes", which says the
    // five twice. Just name the length.
    if (results.lengths.length === 1 && first) {
        return `${head} — ${quantity(first.holeCount, UNIT_HOLES)}`;
    }
    const mix = results.lengths
        .map((l) => `${formatCount(l.rounds)} × ${quantity(l.holeCount, UNIT_HOLES)}`)
        .join(', ');
    return `${head} — ${mix}`;
}

/** `'Best 18'` / `'Best 9'`, and a spelled-out fallback for anything else. */
function bestLabel(holeCount: number): string {
    if (holeCount === 18) return 'Best 18';
    if (holeCount === 9) return 'Best 9';
    return `Best ${formatCount(holeCount)} holes`;
}

/** How many holes an eighteen-hole normalisation is expressed over. */
const NORMALISED_HOLES = 18;

/**
 * The hero's one muted line.
 *
 * Two independent reasons to print it, and either alone is enough:
 *
 * - the denominator DIVERGES from the round count the subtitle already gave, so
 *   "over 51 holes" says which holes the average is actually over;
 * - the window holds a length class that is not eighteen, so the figure is a
 *   NORMALISATION rather than a plain per-round reading, and the label —
 *   "Average vs par", no longer "per 18" — no longer says so on its own.
 *
 * An all-18 window says nothing about scaling: there is none to see, and a
 * standing "scaled to 18" on the common case is the noise this card removed.
 */
function heroQualifier(results: ResultsSummary): string | null {
    const scaled = results.lengths.some((cls) => cls.holeCount !== NORMALISED_HOLES);
    const diverges = results.holesScored !== results.holesExpected;
    if (!scaled && !diverges) return null;
    const over = `over ${quantity(results.holesScored, UNIT_HOLES)}`;
    return scaled ? `${over}, scaled to 18` : over;
}

/**
 * The card's figures: the hero average first, then one best-round tile per
 * length class that has a complete round in it, longest first.
 *
 * Empty when the window has no score at all — the view then hides the card.
 */
export function resultsTiles(results: ResultsSummary | null): ResultsTile[] {
    if (!results) return [];
    const tiles: ResultsTile[] = [];

    if (results.avgVsParPer18.value !== null) {
        tiles.push({
            id: 'avgVsPar',
            label: 'Average vs par',
            // `signedNumber`, never `vsPar()`: this is an AVERAGE, and it has to
            // read like every other signed average on the screen rather than in
            // the scorecard's "E" voice.
            value: signedNumber(results.avgVsParPer18.value, 1),
            qualifier: heroQualifier(results),
            hero: true,
        });
    }

    for (const cls of results.lengths) {
        const best = cls.best;
        if (!best) continue;
        tiles.push({
            id: `best-${cls.holeCount}`,
            label: bestLabel(cls.holeCount),
            // `vsPar()` here, not `signedNumber`: this is one real round's score,
            // so it takes the scorecard voice and reads "E" at level par.
            value: vsParScore(best.vsPar),
            // ONE short line, and only the absolute total: how many complete
            // rounds the class held is a fact about the SAMPLE, and the tile is
            // reporting a single round.
            qualifier: `${formatCount(best.strokes)} strokes`,
            hero: false,
        });
    }

    return tiles;
}

function scoreTypeTitle(type: ScoreType): string {
    switch (type) {
        case 'eagleOrBetter':
            return 'Eagle or better';
        case 'birdie':
            return 'Birdie';
        case 'par':
            return 'Par';
        case 'bogey':
            return 'Bogey';
        case 'doubleBogeyPlus':
            return 'Doubles or worse';
    }
}

/**
 * The five score-type rows, ALWAYS all five when there is anything to show. A
 * zero bucket is information ("no eagles"), and dropping it would make the block
 * change height as the window changes.
 */
export function resultsHistogram(results: ResultsSummary | null): ResultsHistogramRow[] {
    if (!results || results.holesScored === 0) return [];
    const holes = results.holesScored;
    return SCORE_TYPES.map((type) => {
        const count = results.scoreTypeCounts[type];
        return {
            id: type,
            title: scoreTypeTitle(type),
            // The raw share, like every other bar on the screen.
            share: rate(count, holes).value,
            // The SHARE alone: five rows of "33 (65%)" made the reader add up
            // counts they were never asked to compare. The block is gated on
            // `holesScored > 0`, so the placeholder is unreachable here — it is
            // named rather than a count, because a bare count in a column of
            // percentages reads as one.
            value: formatRate(rate(count, holes)) ?? STATS_COPY.noValue,
        };
    });
}

/** Why a priority row has no number, in the reader's terms. */
export function priorityCoverage(roundsInWindow: number): string {
    return roundsInWindow === 1
        ? 'This round has no data for it.'
        : `None of these ${roundsInWindow} rounds has data for it.`;
}

/**
 * The round's own name when it has one, else the course — the same
 * name-over-course fallback the round list and round header apply.
 */
export function roundLabel(row: { name: string | null; courseName: string | null }): string {
    const named = (row.name ?? '').trim();
    if (named) return named;
    const course = (row.courseName ?? '').trim();
    return course || 'Round';
}


// --- The strokes-lost info sheet ---------------------------------------------

/**
 * One card of the "How this works" sheet. Same anatomy on both clients: a short
 * title, one paragraph.
 */
export interface SgInfoCard {
    id: string;
    title: string;
    body: string;
}

/**
 * What the sheet needs to speak about the reader's OWN data.
 *
 * `windowRounds` is 0 for the per-round variant, which says "this round"
 * instead of counting rounds.
 *
 * `rowsPer18` is the five row figures EXACTLY AS THE CARD ABOVE PRINTS THEM, in
 * whatever order it prints them. Card 5 sums them rather than quoting
 * `sgTotalPer18` of the window, because the two are not the same number: the
 * rows are means over rounds of each round's per-18, and the window total is a
 * ratio of sums. Summing what is on screen is what makes "the five rows add up
 * to …" a true sentence rather than an approximately true one. (For one round
 * the two agree by construction, so the per-round variant is unchanged.) A null
 * row means the window never cleared the attribution floor and the card is
 * dropped rather than printing a total nothing supports.
 */
export interface SgInfoInput {
    attributed: number;
    holesScored: number;
    /** 0 = the per-round variant. */
    windowRounds: number;
    rowsPer18: readonly (number | null)[];
    /**
     * Where the window's penalty strokes came from, when the player labelled
     * any. Optional because the sheet predates the question and a caller with
     * no measures to hand may omit it; `recorded === 0` and omission read the
     * same, and both drop the card.
     */
    penaltySource?: { recorded: number; tee: number; approach: number; short: number };
    /**
     * Which handicap cohort the rows above were priced against, and how that
     * tier was chosen. Optional for the same reason `penaltySource` is — the
     * sheet predates cohorts — and an omission reads as the shipping tier under
     * `auto`, which is exactly what a caller with no choice resolved is showing.
     */
    baseline?: SgBaselineInfo;
}

/**
 * The info sheet's copy, as FUNCTIONS: every sentence interpolates the reader's
 * actual coverage, so there is no static string to keep in sync with the data
 * (owner ruling 2026-08-02). The one permitted mention of "a strokes gained-style
 * method" is in `fiveRows`; it appears nowhere else in the client.
 *
 * Twin of `StatsCopy`'s sg-info block on iOS, branch for branch.
 */
export const SG_INFO_COPY = {
    title: 'How practice priorities work',

    holesCounted(input: SgInfoInput): string {
        const { attributed, holesScored, windowRounds } = input;
        const whose = windowRounds === 0 ? 'this round\u2019s ' : 'your ';
        if (attributed === 0) {
            return `None of ${windowRounds === 0 ? 'this round\u2019s' : 'your'} ${holesScored} holes has the full set of answers yet, so there is nothing to show. A hole counts once it has a tee answer, a green answer and a putt answer.`;
        }
        if (attributed === holesScored) {
            return `All ${holesScored} of ${windowRounds === 0 ? 'this round\u2019s' : 'your'} holes could be fully attributed.`;
        }
        return `${attributed} of ${whose}${holesScored} holes could be fully attributed \u2014 the others are missing a tee, green or putt answer, so they are left out of every row rather than guessed at.`;
    },

    fiveRows(): string {
        return 'Each row is what that part of your game cost you against the Tapscore reference baseline v1 \u2014 a strokes gained-style method, worked out from the answers you tap rather than from shot distances. The five rows add up to your score against the baseline exactly; there is no leftover row.';
    },

    /**
     * Names the tier IN FORCE and how it was picked, because "the baseline" is
     * no longer one table: two readers of the same round can be measured
     * against different populations, and a sentence that did not say which
     * would be the one place in the sheet not quoting the reader's own setting.
     */
    baseline(input?: SgInfoInput, calibratedAtOverride?: string | null): string {
        const info = input?.baseline ?? DEFAULT_SG_BASELINE_INFO;
        // The tier's own `calibratedAt`, unless a caller states one. The
        // override exists so the calibrated wording stays PROVABLE while every
        // shipped tier is still provisional — the alternative is a branch no
        // test can reach until the day it goes live.
        const calibratedAt =
            calibratedAtOverride === undefined
                ? SG_BASELINES_V1[info.cohort].tables.calibratedAt
                : calibratedAtOverride;
        // Where the reader changes it. The one platform-specific fragment in
        // these strings: the twin sheet on iOS points at the dashboard's own
        // control, which is not in a Filters panel.
        const pointer = `under “${STATS_COPY.filterBaseline}” in Filters`;
        const tier = cohortLabel(info.cohort);
        const opening =
            info.choice !== 'auto'
                ? `Measured against the ${tier} reference — you picked this ${pointer}.`
                : info.handicapIndex === null
                  ? `Measured against the ${tier} reference — no handicap on your profile yet. Change it ${pointer}.`
                  : `Measured against the ${tier} reference — matched to your ${formatHandicap(
                        info.handicapIndex,
                    )} handicap. Change it ${pointer}.`;
        const what = 'Each tier is one set of expected scores per hole and per lie.';
        return calibratedAt === null
            ? `${opening} ${what} The tiers are still provisional, so treat the order of the rows as the reading and the sizes as rough.`
            : `${opening} ${what} This tier was frozen on ${calibratedAt}. Everyone on this reference is measured against the same table, so your rows can be compared with each other and with your own earlier rounds.`;
    },

    per18(): string {
        return `Rows are scaled to 18 attributed holes, so a nine and an eighteen sit on the same scale. A round with fewer than ${MIN_ATTRIBUTED_FOR_DELTA} attributed holes is left out of the comparison entirely.`;
    },

    total(input: SgInfoInput): string | null {
        const total = sgInfoRowSum(input.rowsPer18);
        if (total === null) return null;
        const signed = signedNumber(total);
        if (input.windowRounds === 0) {
            return `The five rows add up to ${signed} strokes against the baseline.`;
        }
        if (input.windowRounds === 1) {
            return `Over this round the five rows add up to ${signed} strokes against the baseline.`;
        }
        return `Over these ${input.windowRounds} rounds the five rows add up to ${signed} strokes against the baseline.`;
    },

    /**
     * ABSOLUTE COUNTS, not shares. The labelled sample is usually a handful of
     * holes, and three percentages off three holes would read as a dispersion
     * finding — so the card says the three numbers, which are true at any size,
     * and lets the reader see how small they are.
     */
    penaltySource(input: SgInfoInput): string | null {
        const p = input.penaltySource;
        if (p === undefined || p.recorded <= 0) return null;
        return `Of ${quantity(p.recorded, UNIT_LABELLED_PENALTY_HOLES)} you labelled, ${formatCount(p.tee)} came off the tee, ${formatCount(p.approach)} on the approach and ${formatCount(p.short)} around the green.`;
    },
};

/**
 * The figure card 5 quotes: the sum of the rows on screen. Null when any row is
 * absent — the five are all-present or all-absent by construction, so a null
 * here means there is nothing to total, never a partial sum.
 */
export function sgInfoRowSum(rows: readonly (number | null)[]): number | null {
    if (rows.length === 0) return null;
    let sum = 0;
    for (const v of rows) {
        if (v === null) return null;
        sum += v;
    }
    return sum;
}

/**
 * The penalty-source field of `SgInfoInput`, lifted off the window's summed
 * measures. One place, so the four sheets that exist cannot disagree about
 * which counter is which.
 */
export function sgPenaltySource(m: StatMeasures): SgInfoInput['penaltySource'] {
    return {
        recorded: m.penaltySourceRecorded,
        tee: m.penaltiesTee,
        approach: m.penaltiesApproach,
        short: m.penaltiesShort,
    };
}

/** The sheet's cards, in reading order. The total card is dropped when null. */
export function sgInfoCards(input: SgInfoInput): SgInfoCard[] {
    const cards: SgInfoCard[] = [
        { id: 'holes', title: 'Holes counted', body: SG_INFO_COPY.holesCounted(input) },
        { id: 'rows', title: 'The five rows', body: SG_INFO_COPY.fiveRows() },
        { id: 'baseline', title: 'The baseline', body: SG_INFO_COPY.baseline(input) },
        { id: 'per18', title: 'Per 18 holes', body: SG_INFO_COPY.per18() },
    ];
    const total = SG_INFO_COPY.total(input);
    if (total !== null) cards.push({ id: 'total', title: 'The total', body: total });
    const penalties = SG_INFO_COPY.penaltySource(input);
    if (penalties !== null) {
        cards.push({
            id: 'penaltySource',
            title: STATS_COPY.penaltySourceInfoTitle,
            body: penalties,
        });
    }
    return cards;
}
