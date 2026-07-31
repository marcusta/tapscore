// The §3 module panels, flattened to a list of BLOCKS the component renders.
//
// Every display decision lives here, not in the component: which figures a
// panel shows, in what order, what a null reads as, and whether a bar may be
// drawn at all. The component's job is one template per block kind.
//
// Nothing here computes a rate — everything arrives as a `Rate` from the model
// and leaves as a formatted string or a null. `isThin` is the one judgement
// applied: a sample the display policy will only express as a fraction gets NO
// bar, because a bar would give three attempts the same visual weight as
// thirty.
//
// Twin of `ios/TapScore/Features/Stats/StatsPanelViews.swift` (which is
// SwiftUI, so its blocks are inline views rather than data — same catalog,
// same order, same wording).

import { PUTT_BUCKETS, type Rate } from '../round/stat-measures';
import {
    averageWithSample,
    bucketTitle,
    formatAverage,
    formatCount,
    isThin,
    rateWithSample,
    formatRate,
    troubleTaxSample,
    UNIT_GREENS,
    UNIT_HOLES,
    UNIT_ROUNDS,
} from './stats-format';
import type { StatsDashboardModel, StatsPanelId, StatsTeePanel } from './stats-dashboard-model';

/** Which theme family a split segment paints in. Resolved by the component. */
export type StatsSegmentTone = 'fairway' | 'inplay' | 'trouble';

export type StatsBlock =
    /** A small uppercase heading inside a panel. */
    | { kind: 'subhead'; id: string; text: string }
    /** A paragraph of explanation, for a figure the number alone would mislead on. */
    | { kind: 'note'; id: string; text: string }
    /** A proportional bar plus its key. */
    | {
          kind: 'split';
          id: string;
          segments: { id: string; title: string; tone: StatsSegmentTone; share: number | null; value: string | null }[];
      }
    /** Label, mini bar, reading. */
    | { kind: 'bar'; id: string; title: string; share: number | null; value: string | null }
    /** One rung of the putting ladder: a bar against a baseline tick. */
    | { kind: 'rung'; id: string; title: string; made: number | null; baseline: number; value: string | null }
    /** Label / value / explanation. A null value prints "Not recorded". */
    | { kind: 'figure'; id: string; title: string; value: string | null; hint: string | null };

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
    prioritiesHint:
        'Strokes lost per round against a fixed baseline, worst first. Positive costs you shots.',
    trends: 'Trends',
    trendsHint: 'Oldest round on the left. A round with no reading is skipped, never plotted as zero.',
    roundsHeading: 'Rounds in this window',
    roundsHint: 'Each strip is that round’s four waterfall terms, on one shared scale.',
    filter: 'Filter',
    filterClear: 'Clear filter',
    filterDates: 'Dates',
    filterFrom: 'From',
    filterTo: 'To',
    filterVenue: 'Venue',
    filterRoundType: 'Round type',
    filterCourses: 'Courses',
    filterRoundsHint: 'Uncheck a round below to leave it out of a custom window.',
    troubleTax:
        'Extra strokes per hole when the tee shot finds trouble, against your own fairway holes.',
    recovery: 'Holes where the shot after trouble got you back in play.',
    penalties: 'Penalty strokes per round.',
    proximityProxy:
        'How far the first putt was on greens you hit — a stand-in for approach proximity, which the app does not measure directly.',
    birdieConversion: 'Greens hit that became a birdie or better.',
    ladderBaseline:
        'The tick is the make rate the expected-putts table implies. For 4–8 m and over 8 m it sits at zero: the table expects two putts from there, so any make is ahead of it.',
    threePutt: 'Holes with three putts or more.',
    longThreePutt: 'Three-putts that started from over 8 m.',
    puttsPerGir: 'Putts taken on holes where you hit the green.',
    conversionInside2m:
        'First putts from inside 2 m that went in — across every hole, not only chipped ones. The app records no chip-and-hole cross-tab.',
    chipIns: 'Short-game shots that went in without a putt.',
    doubleBogeyPlus: 'Holes at double bogey or worse, per round.',
    bounceBack: 'Holes after a bogey or worse that came back at par or better.',
} as const;

/** A bar is drawn only for a sample the policy will express as a percentage. */
function barShare(r: Rate): number | null {
    return isThin(r) ? null : r.value;
}

function bar(id: string, title: string, r: Rate): StatsBlock {
    return { kind: 'bar', id, title, share: barShare(r), value: formatRate(r) };
}

function figure(id: string, title: string, value: string | null, hint: string | null = null): StatsBlock {
    return { kind: 'figure', id, title, value, hint };
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
 * The trouble tax's sample cannot go in the value column.
 *
 * It is a DIFFERENCE of two averages, so the honest sample is two denominators
 * and a sentence long ("over 9 holes from trouble vs 11 from the fairway"). It
 * joins the explanation line rather than the number, and `formatAverage` — not
 * `averageWithSample` — is deliberate: the figure's own `d` is a cross-product
 * guard and printing it would claim a sample of 99 holes.
 */
function troubleTaxFigure(panel: StatsTeePanel): StatsBlock {
    const sample = troubleTaxSample(panel.vsParByTee);
    const hint = sample ? `${STATS_COPY.troubleTax} Measured ${sample}.` : STATS_COPY.troubleTax;
    return figure('troubleTax', 'Trouble tax', formatAverage(panel.troubleTax, 2, true), hint);
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
                    // Through `barShare`, exactly like every other bar on the
                    // screen: one recorded tee shot is a rate of 1.0, and a raw
                    // share would paint the track solid green off a single
                    // answer. Thin → no segment; the legend still prints
                    // "1 of 1", which is the honest reading of that sample.
                    segments: [
                        { id: 'fairway', title: 'Fairway', tone: 'fairway', share: barShare(p.fairway), value: formatRate(p.fairway) },
                        { id: 'inPlay', title: 'In play', tone: 'inplay', share: barShare(p.inPlayOnly), value: formatRate(p.inPlayOnly) },
                        { id: 'trouble', title: 'Trouble', tone: 'trouble', share: barShare(p.trouble), value: formatRate(p.trouble) },
                    ],
                },
                troubleTaxFigure(p),
                figure('recovery', 'Recovery', rateWithSample(p.recovery), STATS_COPY.recovery),
                figure(
                    'penalties',
                    'Penalties',
                    averageWithSample(p.penaltiesPerRound, { unit: UNIT_ROUNDS }),
                    STATS_COPY.penalties,
                ),
            ];
        }
        case 'approach': {
            const p = model.approach;
            if (!p) return [];
            return [
                { kind: 'subhead', id: 'girByTee', text: 'Greens hit, by where the tee shot finished' },
                bar('girFairway', 'From the fairway', p.girByTee.fairway),
                bar('girInPlay', 'From in play', p.girByTee.inPlay),
                bar('girTrouble', 'From trouble', p.girByTee.trouble),
                { kind: 'subhead', id: 'mixHead', text: 'First putt on greens hit' },
                { kind: 'note', id: 'mixNote', text: STATS_COPY.proximityProxy },
                ...PUTT_BUCKETS.map((b) => bar(`mix-${b}`, bucketTitle(b), p.girFirstPuttMix[b])),
                figure(
                    'birdieConversion',
                    'Birdie conversion',
                    rateWithSample(p.birdieConversion),
                    STATS_COPY.birdieConversion,
                ),
            ];
        }
        case 'putting': {
            const p = model.putting;
            if (!p) return [];
            return [
                { kind: 'subhead', id: 'ladderHead', text: 'Holed on the first putt' },
                { kind: 'note', id: 'ladderNote', text: STATS_COPY.ladderBaseline },
                ...p.ladder.map(
                    (rung): StatsBlock => ({
                        kind: 'rung',
                        id: `rung-${rung.bucket}`,
                        title: bucketTitle(rung.bucket),
                        made: barShare(rung.made),
                        baseline: rung.baseline,
                        value: formatRate(rung.made),
                    }),
                ),
                figure('threePutt', 'Three-putts', rateWithSample(p.threePutt), STATS_COPY.threePutt),
                figure(
                    'longThreePutt',
                    'Three-putts from over 8 m',
                    rateWithSample(p.threePuttsFromOver8m),
                    STATS_COPY.longThreePutt,
                ),
                figure(
                    'puttsPerGir',
                    'Putts per green hit',
                    averageWithSample(p.puttsPerGirHole, { unit: UNIT_GREENS }),
                    STATS_COPY.puttsPerGir,
                ),
            ];
        }
        case 'shortGame': {
            const p = model.shortGame;
            if (!p) return [];
            return [
                { kind: 'subhead', id: 'scrambleHead', text: 'Scrambling' },
                bar('scrambleStandard', 'Standard', p.scramble.standard),
                bar('scrambleHard', 'Hard', p.scramble.hard),
                { kind: 'subhead', id: 'chipHead', text: 'Chipped to inside 2 m' },
                bar('chipStandard', 'Standard', p.chipInside2m.standard),
                bar('chipHard', 'Hard', p.chipInside2m.hard),
                figure(
                    'conversionInside2m',
                    'Holed from inside 2 m',
                    rateWithSample(p.conversionInside2m),
                    STATS_COPY.conversionInside2m,
                ),
                figure('chipIns', 'Chip-ins', formatCount(p.chipIns), STATS_COPY.chipIns),
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
                    STATS_COPY.doubleBogeyPlus,
                ),
                figure('bounceBack', 'Bounce-back', rateWithSample(p.bounceBack), STATS_COPY.bounceBack),
            ];
        }
    }
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
