// The stats dashboard's view model: `(window rows) -> everything the screen
// draws`.
//
// One pure function, `buildDashboardModel`, with no service, no network and no
// DOM in sight. Every number on the screen comes from
// `src/round/stat-measures.ts`; this file decides only WHAT is asked and
// WHETHER a panel appears, never how a rate is computed. A component that does
// arithmetic is a bug — the math module is the single place the display policy
// and the null rules live, and duplicating a division into a view is how the
// two drift.
//
// The module-gating rule from the proposal (§1) is the reason this is a build
// step at all: a module with no data must be ABSENT, not zeroed. `null` panels
// here mean "you never recorded this", which is a different sentence from "you
// recorded it and it was 0%".
//
// Twin of `ios/TapScore/Features/Stats/StatsDashboardModel.swift`, decision for
// decision.

import {
    avgVsParByParGroup,
    birdieConversion,
    bounceBackRate,
    chipInside2mRate,
    costOfMissedGreen,
    doubleBogeyPlusPerRound,
    EXPECTED_PUTTS_V1,
    extraShortGameStrokes,
    fairwayRate,
    firstPuttMix,
    girByPar,
    girFirstPuttMix,
    girRate,
    girRateByTee,
    greenMissDispersion,
    hardChipShare,
    meanOfPresent,
    multiChipFromBunkerRate,
    multiChipRate,
    onePuttRate,
    penaltiesPerRound,
    penaltyHoleShare,
    penaltySourceSplit,
    penaltyTax,
    PUTT_BUCKETS,
    puttDistribution,
    puttsAfterMissedGreen,
    puttsPerGirHole,
    puttsPerHoleByPar,
    rate,
    rateDisplay,
    recoveryRate,
    resultsSummary,
    sandSaveRate,
    scrambleRate,
    STROKES_LOST_COMPONENTS,
    strokesLostV3,
    strokesLostComponent,
    sgPer18,
    strokesVsParByTee,
    sumMeasures,
    teeMissDispersion,
    threePuttRate,
    threePuttsFromOver8mRate,
    troubleRate,
    troubleTaxPerHole,
    vsParByPenalty,
    ZERO_MEASURES,
    type ByDifficulty,
    type ByParGroup,
    type ByTee,
    type GreenMissDispersion,
    type PenaltySourceSplit,
    type PenaltySplit,
    type PuttBucket,
    type PuttCountBucket,
    type Rate,
    type ResultsSummary,
    type StrokesLost,
    type StrokesLostComponent,
    type TeeMissDispersion,
    type VsParSplit,
} from '../round/stat-measures';
import { sortRows } from './stats-window';
// `StatMeasures` is the wire row itself — `stat-measures.ts` consumes it and
// does not re-export it, so it comes from the generated client, as there.
import type { PlayerRoundStats, StatMeasures } from '../api/player-stats.gen';

// --- Identity ----------------------------------------------------------------

/**
 * The dashboard's panels. Not the profile's stats CONFIG toggles: that
 * vocabulary answers "what will we ask you on the course" and includes
 * `penalties` and `recovery`, which surface here as lines inside the tee panel
 * rather than as panels of their own. Scoring has no toggle at all — a
 * scorecard is always there.
 */
export type StatsPanelId = 'tee' | 'approach' | 'putting' | 'shortGame' | 'scoring';

/** Reading order: tee to green, then the scorecard. */
export const STATS_PANEL_IDS: readonly StatsPanelId[] = [
    'tee',
    'approach',
    'putting',
    'shortGame',
    'scoring',
];

export function panelTitle(id: StatsPanelId): string {
    switch (id) {
        case 'tee':
            return 'Off the tee';
        case 'approach':
            return 'Approach';
        case 'putting':
            return 'Putting';
        case 'shortGame':
            return 'Short game';
        case 'scoring':
            return 'Scoring';
    }
}

// --- Practice priorities -----------------------------------------------------

/**
 * One component of the fixed-baseline attribution, averaged over the window.
 *
 * `per18` is null when NO round in the window produced the component — either
 * because nothing attributed, or because every round fell under
 * `MIN_ATTRIBUTED_FOR_DELTA`. That is the "not enough data" row — printed as a
 * sentence, never as a bar at zero, because a zero-length bar in a ranked list
 * reads as "this part of your game is exactly average", which is a claim the
 * data does not make.
 */
export interface StatsPriority {
    component: StrokesLostComponent;
    /**
     * Mean strokes lost per 18 ATTRIBUTED holes. Positive = lost, negative =
     * gained. Renamed from `perRound`: a round is no longer the unit, because
     * rounds differ in how much of them could be attributed.
     */
    per18: number | null;
    /** How many rounds in the window contributed a value. */
    roundsCovered: number;
    /** How many rounds are in the window at all. */
    roundsInWindow: number;
}

// --- Trends ------------------------------------------------------------------

/**
 * What a sparkline is plotting. Fixes the y-axis semantics, which differ: a
 * percentage goes up when you improve, strokes-lost goes DOWN.
 */
export type StatsTrendKind = 'percentage' | 'strokesLost';

export interface StatsTrend {
    id: string;
    title: string;
    kind: StatsTrendKind;
    /**
     * Oldest first — a trend line reads left-to-right in time, the opposite of
     * every list on this screen.
     */
    points: number[];
}

/**
 * The proposal's floor: two dots are not a trend, they are a line segment
 * between two rounds, and drawing it invites reading noise as direction.
 */
export const TREND_MIN_POINTS = 3;

// --- Panels ------------------------------------------------------------------

export interface StatsTeePanel {
    fairway: Rate;
    /**
     * In play but NOT on the fairway — the split bar's middle segment.
     * `inPlayRate` is cumulative (a fairway hit is in play), so it cannot be a
     * segment as-is without double-counting.
     */
    inPlayOnly: Rate;
    trouble: Rate;
    /**
     * Strokes over par per hole conceded from trouble, vs the round's own
     * scoring from the fairway.
     */
    troubleTax: Rate;
    /**
     * The two samples `troubleTax` is a DIFFERENCE of.
     *
     * Carried because `troubleTaxPerHole`'s own denominator is a cross-product
     * guard (trouble holes × fairway holes), not a sample size — printing it
     * would tell a player who has 9 trouble holes and 11 fairway holes that the
     * figure rests on 99 of them. The view prints these two instead, which is
     * what the math module's doc asks for.
     */
    vsParByTee: ByTee<Rate>;
    recovery: Rate;
    /**
     * Tee-shot dispersion and its severity cross. Null-gated by
     * `teeMissRecorded`, which the view reads directly — a player who never
     * answers "which side" has no fan, not an empty one.
     */
    teeMiss: TeeMissDispersion;
    /** Recorded sides, the fan's own denominator gate. */
    teeMissRecorded: number;
    /**
     * The fan's five counts, derived HERE and not in the chart module: the
     * chart does no arithmetic on measures. `leftInPlay` is the side minus its
     * trouble, so the two segments of a column partition that side.
     */
    teeFan: {
        leftInPlay: number;
        leftTrouble: number;
        fairway: number;
        rightInPlay: number;
        rightTrouble: number;
    };
    /** The fan's shared denominator: every recorded tee shot. */
    teeRecorded: number;
    penaltiesPerRound: Rate;
    /**
     * Holes on which a penalty answer was recorded at all.
     *
     * `penaltiesPerRound` divides by the ROUND count, so it prints a confident
     * 0.00 for a player who never answered the question. This is the coverage the
     * view gates that figure on (invariant 1: absent is not zero).
     */
    penaltiesRecordedHoles: number;
    penaltyHoleShare: Rate;
    penaltyTax: Rate;
    /** The two samples `penaltyTax` is a DIFFERENCE of — see `troubleTax`. */
    vsParByPenalty: PenaltySplit;
    /** Where the penalties came from, over the holes that were LABELLED. */
    penaltySource: PenaltySourceSplit;
    penaltySourceRecorded: number;
    penaltiesTee: number;
    penaltiesApproach: number;
    penaltiesShort: number;
}

export interface StatsApproachPanel {
    gir: Rate;
    girByTee: ByTee<Rate>;
    /**
     * Where the first putt was on greens hit — the proximity proxy. Shares of
     * `girFirstPuttRecorded`, so they sum to 1 across buckets.
     */
    girFirstPuttMix: Record<PuttBucket, Rate>;
    birdieConversion: Rate;
    /**
     * How often a missed green left a HARD short-game shot. A property of the
     * approach miss — where it put you — which is why it sits here rather than on
     * the short-game card.
     */
    hardChipShare: Rate;
    girByPar: ByParGroup<Rate>;
    /**
     * Where the recorded misses finished, as four shares of one denominator.
     * The compass's gate is `greenMissRecorded`, carried beside it.
     */
    greenMiss: GreenMissDispersion;
    greenMissRecorded: number;
    /** The four raw counts, for the readable text beside the picture. */
    greenMissCounts: { long: number; short: number; left: number; right: number };
    /** vs-par with the green hit, with it missed, and the difference. */
    costOfMissedGreen: VsParSplit;
}

/** One rung of the make-% ladder. */
export interface StatsLadderRung {
    bucket: PuttBucket;
    made: Rate;
    /**
     * The make % the EXPECTED_PUTTS table implies for this distance.
     *
     * Presentation-only, and a rough inversion: a bucket that expects `E` putts
     * holes out in one `2 − E` of the time IF every miss leaves a tap-in. It
     * floors at 0 for the long buckets (4–8 m expects 2.10, >8 m 2.40), where
     * the honest reading is "the table expects you to two-putt", not "you should
     * hole none of these". The view says so.
     */
    baseline: number;
}

export interface StatsPuttingPanel {
    ladder: StatsLadderRung[];
    /**
     * Where the first putt was on EVERY hole that recorded one — the raw twin of
     * the approach card's `girFirstPuttMix`, which is the same distribution over
     * greens hit only. Shares of `firstPuttResolvedTotal`, so they sum to 1.
     */
    firstPuttSpread: Record<PuttBucket, Rate>;
    threePutt: Rate;
    threePuttsFromOver8m: Rate;
    puttsPerGirHole: Rate;
    /** Putts per hole on the holes where the green was missed. */
    puttsAfterMissedGreen: Rate;
    /** The four buckets, shares of `puttsRecorded`. */
    puttDistribution: Record<PuttCountBucket, Rate>;
    puttsPerHoleByPar: ByParGroup<Rate>;
}

export interface StatsShortGamePanel {
    scramble: ByDifficulty<Rate>;
    chipInside2m: ByDifficulty<Rate>;
    /**
     * The conversion half of the chip pair: how often a putt from inside 2 m
     * goes in.
     *
     * NOT a scramble × inside-2m × holed cross-tab — no such column exists, and
     * inventing one is off the table. This is the coherent v2 putting rate over
     * the two buckets that make up "inside 2 m", across ALL holes rather than
     * only chipped ones. It answers "when you leave it that close, do you hole
     * it" with the sample the schema actually has.
     */
    conversionInside2m: Rate;
    /**
     * Chips holed outright, split by the lie they came from. A count, not a rate:
     * there is no attempt denominator that would make a "chip-in %" mean
     * anything.
     */
    chipIns: ByDifficulty<number>;
    /** Up-and-downs from sand, the figure golfers know by name. */
    sandSave: Rate;
    /** Its own gate: without a bunker attempt the figure is absent, not zero. */
    scrambleAttemptsBunker: number;
    /**
     * The short-game COUNTER family (proposal §3.4c). All three gate on
     * `shortGameStrokesRecorded`: with nothing counted every hole models as one
     * shot, so the numbers would all read as a perfect window.
     */
    multiChip: Rate;
    multiChipBunker: Rate;
    extraShortGameStrokes: number;
    shortGameStrokesRecorded: number;
}

export interface StatsScoringPanel {
    avgVsParByParGroup: ByParGroup<Rate>;
    doubleBogeyPlusPerRound: Rate;
    bounceBack: Rate;
}

// --- Round rows --------------------------------------------------------------

/** One round in the window's list. */
export interface StatsRoundRow {
    /**
     * The round id — and what the per-round drill-down (§4.2) travels on; that
     * screen needs nothing else from this row.
     */
    id: string;
    date: string;
    courseName: string | null;
    name: string | null;
    holeCount: number;
    /** Null for a stats-only round (answers recorded, no scorecard). */
    strokes: number | null;
    vsPar: number | null;
    waterfall: StrokesLost;
}

// --- The model ---------------------------------------------------------------

export interface StatsDashboardModel {
    /** Rounds in the window, newest first. */
    rounds: StatsRoundRow[];
    /** `sumMeasures` over the window — the denominator of every rate on screen. */
    totals: StatMeasures;
    /** The summed window's own waterfall, for the "over these N rounds" total. */
    waterfall: StrokesLost;
    priorities: StatsPriority[];
    trends: StatsTrend[];
    tee: StatsTeePanel | null;
    approach: StatsApproachPanel | null;
    putting: StatsPuttingPanel | null;
    shortGame: StatsShortGamePanel | null;
    scoring: StatsScoringPanel | null;
    /**
     * The window's scoring headline. Not a panel: it is not gated on a stats
     * module and does not appear in `presentPanels`. Null only for an empty
     * window.
     */
    results: ResultsSummary | null;
}

export const EMPTY_DASHBOARD_MODEL: StatsDashboardModel = {
    rounds: [],
    totals: ZERO_MEASURES,
    waterfall: strokesLostV3(ZERO_MEASURES),
    priorities: [],
    trends: [],
    tee: null,
    approach: null,
    putting: null,
    shortGame: null,
    scoring: null,
    results: null,
};

/** The panels that have data, in reading order. */
export function presentPanels(model: StatsDashboardModel): StatsPanelId[] {
    return STATS_PANEL_IDS.filter((id) => model[id] !== null);
}

/**
 * Reduce a window of rounds to a screen.
 *
 * `rows` may arrive in any order; they are sorted newest-first here so a caller
 * cannot get the round list backwards.
 */
export function buildDashboardModel(rows: readonly PlayerRoundStats[]): StatsDashboardModel {
    const ordered = sortRows(rows);
    if (ordered.length === 0) return EMPTY_DASHBOARD_MODEL;

    const totals = sumMeasures(ordered.map((r) => r.measures));
    const perRound = ordered.map((r) => strokesLostV3(r.measures));
    const roundCount = ordered.length;

    return {
        rounds: ordered.map((row, i) => {
            const waterfall = perRound[i]!;
            return {
                id: row.roundId,
                date: row.date,
                courseName: row.courseName,
                name: row.name,
                holeCount: row.holeCount,
                strokes: row.measures.holesScored === 0 ? null : row.measures.strokesTotal,
                // vs PAR, straight off the scorecard columns — NOT
                // `waterfall.total`, which is now vs the reference baseline over
                // the attributed cohort. Vs-par stays the language of the round
                // list and the Results card (proposal §1).
                vsPar:
                    row.measures.holesScored === 0
                        ? null
                        : row.measures.strokesTotal - row.measures.parTotal,
                waterfall,
            };
        }),
        totals,
        waterfall: strokesLostV3(totals),
        priorities: buildPriorities(perRound),
        trends: buildTrends(ordered),
        tee: teePanel(totals, roundCount),
        approach: approachPanel(totals),
        putting: puttingPanel(totals),
        shortGame: shortGamePanel(totals),
        scoring: scoringPanel(totals, roundCount),
        // From the ROWS, not the totals: the best round and the window's mix of
        // round lengths are per-round facts a sum destroys — two nines add up to
        // eighteen holes and are still not a round.
        results: resultsSummary(ordered),
    };
}

// --- Priorities --------------------------------------------------------------

/**
 * Worst first: the component costing the most strokes per 18 attributed holes
 * leads.
 *
 * Averaged over the ROUNDS rather than taken from the summed window so the list
 * says "putting costs you 1.8 shots per 18", which is a practice instruction,
 * rather than "putting has cost you 21.6 shots", which is a number you have to
 * divide before it means anything. The mean is over the rounds that HAVE the
 * component (`meanOfPresent`), not over the window — dividing by rounds that
 * attributed nothing would dilute the estimate toward zero and flatten the
 * ranking.
 *
 * Each round is normalized FIRST (`sgPer18`), so the mean is a mean of
 * comparable numbers rather than a mean over rounds of different lengths, and a
 * round under `MIN_ATTRIBUTED_FOR_DELTA` contributes to no row at all.
 */
export function buildPriorities(perRound: readonly StrokesLost[]): StatsPriority[] {
    const rows = STROKES_LOST_COMPONENTS.map((component): StatsPriority => {
        const values = perRound.map((w) => sgPer18(w, component));
        return {
            component,
            per18: meanOfPresent(values),
            roundsCovered: values.filter((v) => v !== null).length,
            roundsInWindow: perRound.length,
        };
    });
    // Present components rank by cost, descending. Absent ones sink to the
    // bottom in their canonical order — they are not "best", they are unknown,
    // and sorting them among the numbers would imply otherwise.
    const canonical = (c: StrokesLostComponent): number => STROKES_LOST_COMPONENTS.indexOf(c);
    return rows.sort((l, r) => {
        if (l.per18 !== null && r.per18 !== null) {
            return l.per18 === r.per18
                ? canonical(l.component) - canonical(r.component)
                : r.per18 - l.per18;
        }
        if (l.per18 !== null) return -1;
        if (r.per18 !== null) return 1;
        return canonical(l.component) - canonical(r.component);
    });
}

// --- Trends ------------------------------------------------------------------

/**
 * A rate → its plotted value, null unless it clears the percentage floor.
 *
 * Percentage points follow the display policy's denominator floor: a rate the
 * panels would refuse to print as a percentage (fewer than five recorded, e.g.
 * a one-hole partial round) is not plotted and cannot become the tile's
 * headline — a 1-of-1 round would otherwise front the fairway tile as "100%"
 * with the authority of a full round.
 */
function solid(r: Rate): number | null {
    return rateDisplay(r) === 'percentage' ? r.value : null;
}

/**
 * The four module headlines, oldest to newest, dropping rounds that have no
 * value for the measure.
 *
 * A gap is a SKIP, not a zero and not an interpolation: the line connects the
 * rounds where you recorded the thing. A series shorter than
 * `TREND_MIN_POINTS` is omitted entirely rather than drawn short.
 */
export function buildTrends(rows: readonly PlayerRoundStats[]): StatsTrend[] {
    // Oldest first — time runs left to right.
    const chrono = [...rows].reverse();

    const series = (
        id: string,
        title: string,
        kind: StatsTrendKind,
        value: (m: StatMeasures) => number | null,
    ): StatsTrend | null => {
        const points: number[] = [];
        for (const row of chrono) {
            const v = value(row.measures);
            if (v !== null) points.push(v);
        }
        return points.length >= TREND_MIN_POINTS ? { id, title, kind, points } : null;
    };

    return [
        series('fairway', 'Fairways', 'percentage', (m) => solid(fairwayRate(m))),
        series('gir', 'Greens', 'percentage', (m) => solid(girRate(m))),
        // A trend point is a cross-round comparison, so it normalizes and
        // inherits the >= 9-attributed floor. A round under it plots nothing,
        // which the sparkline already skips.
        series('putting', 'Putting', 'strokesLost', (m) => sgPer18(strokesLostV3(m), 'putting')),
        series('scramble', 'Scrambling', 'percentage', (m) => solid(scrambleRate(m).overall)),
    ].filter((t): t is StatsTrend => t !== null);
}

// --- Panel gating ------------------------------------------------------------
//
// Each `…Panel` returns null when the module was never recorded in this window.
// The gate is always the module's own RECORDED counter, never a derived
// numerator: a player who took ten tee shots and hit no fairways has
// `teeRecorded === 10, fairwayHits === 0` and deserves a panel that says 0%.

/**
 * `roundCount` is the window's row count — the honest denominator for a "per
 * round" figure. Derived from the row count, not from `holesScored / 18`: a
 * nine-hole round is one round the player played, and rounding holes into
 * notional eighteens would report a season of nines as half as many rounds as
 * it was.
 */
export function teePanel(m: StatMeasures, roundCount: number): StatsTeePanel | null {
    if (m.teeRecorded <= 0) return null;
    return {
        fairway: fairwayRate(m),
        inPlayOnly: rate(m.inPlayHits - m.fairwayHits, m.teeRecorded),
        trouble: troubleRate(m),
        troubleTax: troubleTaxPerHole(m),
        vsParByTee: strokesVsParByTee(m),
        recovery: recoveryRate(m),
        teeMiss: teeMissDispersion(m),
        teeMissRecorded: m.teeMissRecorded,
        teeFan: {
            leftInPlay: Math.max(0, m.teeMissLeft - m.teeTroubleLeft),
            leftTrouble: m.teeTroubleLeft,
            fairway: m.fairwayHits,
            rightInPlay: Math.max(0, m.teeMissRight - m.teeTroubleRight),
            rightTrouble: m.teeTroubleRight,
        },
        teeRecorded: m.teeRecorded,
        penaltiesPerRound: penaltiesPerRound(m, roundCount),
        penaltiesRecordedHoles: m.penaltiesRecorded,
        penaltyHoleShare: penaltyHoleShare(m),
        penaltyTax: penaltyTax(m),
        vsParByPenalty: vsParByPenalty(m),
        penaltySource: penaltySourceSplit(m),
        penaltySourceRecorded: m.penaltySourceRecorded,
        penaltiesTee: m.penaltiesTee,
        penaltiesApproach: m.penaltiesApproach,
        penaltiesShort: m.penaltiesShort,
    };
}

export function approachPanel(m: StatMeasures): StatsApproachPanel | null {
    if (m.girRecorded <= 0) return null;
    const mix = {} as Record<PuttBucket, Rate>;
    for (const bucket of PUTT_BUCKETS) mix[bucket] = girFirstPuttMix(m, bucket);
    return {
        gir: girRate(m),
        girByTee: girRateByTee(m),
        girFirstPuttMix: mix,
        birdieConversion: birdieConversion(m),
        hardChipShare: hardChipShare(m),
        girByPar: girByPar(m),
        greenMiss: greenMissDispersion(m),
        greenMissRecorded: m.greenMissRecorded,
        greenMissCounts: {
            long: m.greenMissLong,
            short: m.greenMissShort,
            left: m.greenMissLeft,
            right: m.greenMissRight,
        },
        costOfMissedGreen: costOfMissedGreen(m),
    };
}

export function puttingPanel(m: StatMeasures): StatsPuttingPanel | null {
    if (m.puttsRecorded <= 0 && m.firstPuttRecorded <= 0) return null;
    const spread = {} as Record<PuttBucket, Rate>;
    for (const bucket of PUTT_BUCKETS) spread[bucket] = firstPuttMix(m, bucket);
    return {
        ladder: PUTT_BUCKETS.map((bucket) => ({
            bucket,
            made: onePuttRate(m, bucket),
            baseline: Math.max(0, 2 - EXPECTED_PUTTS_V1[bucket]),
        })),
        firstPuttSpread: spread,
        threePutt: threePuttRate(m),
        threePuttsFromOver8m: threePuttsFromOver8mRate(m),
        puttsPerGirHole: puttsPerGirHole(m),
        puttsAfterMissedGreen: puttsAfterMissedGreen(m),
        puttDistribution: puttDistribution(m),
        puttsPerHoleByPar: puttsPerHoleByPar(m),
    };
}

export function shortGamePanel(m: StatMeasures): StatsShortGamePanel | null {
    const attempts =
        m.scrambleAttemptsStandard + m.scrambleAttemptsHard + m.scrambleAttemptsBunker;
    if (attempts <= 0) return null;
    // The two buckets that together mean "inside 2 m", v2-resolved on both
    // sides so numerator and denominator cover the same holes.
    const made = m.onePuttInside1m + m.onePutt1To2m;
    const faced = m.firstPuttInside1mResolved + m.firstPutt1To2mResolved;
    return {
        scramble: scrambleRate(m),
        chipInside2m: chipInside2mRate(m),
        conversionInside2m: rate(made, faced),
        chipIns: {
            standard: m.scrambleHoledStandard,
            hard: m.scrambleHoledHard,
            bunker: m.scrambleHoledBunker,
            overall: m.scrambleHoledStandard + m.scrambleHoledHard + m.scrambleHoledBunker,
        },
        sandSave: sandSaveRate(m),
        scrambleAttemptsBunker: m.scrambleAttemptsBunker,
        multiChip: multiChipRate(m),
        multiChipBunker: multiChipFromBunkerRate(m),
        extraShortGameStrokes: extraShortGameStrokes(m),
        shortGameStrokesRecorded: m.shortGameStrokesRecorded,
    };
}

export function scoringPanel(m: StatMeasures, roundCount: number): StatsScoringPanel | null {
    if (m.holesScored <= 0) return null;
    return {
        avgVsParByParGroup: avgVsParByParGroup(m),
        doubleBogeyPlusPerRound: doubleBogeyPlusPerRound(m, roundCount),
        bounceBack: bounceBackRate(m),
    };
}

/**
 * The largest single-term magnitude across a list of waterfalls — the shared
 * scale the round list's mini-strips are drawn against. Zero when nothing is
 * measurable, which the chart reads as "draw no bars".
 */
export function waterfallMagnitude(waterfalls: readonly StrokesLost[]): number {
    let max = 0;
    for (const w of waterfalls) {
        for (const component of STROKES_LOST_COMPONENTS) {
            const value = strokesLostComponent(w, component);
            if (value !== null) max = Math.max(max, Math.abs(value));
        }
    }
    return max;
}

/** The same, for the practice-priorities list's shared scale. */
export function priorityMagnitude(priorities: readonly StatsPriority[]): number {
    let max = 0;
    for (const p of priorities) if (p.per18 !== null) max = Math.max(max, Math.abs(p.per18));
    return max;
}
