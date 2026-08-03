// Words and numerals for the stats dashboard.
//
// The display policy lives here in ONE place, and since the owner's polish-pass
// ruling (2026-08-02) it has exactly TWO cases:
//
// - `d > 0` → a percentage, always. "58%", and "50%" over two attempts too.
// - `d == 0` → absent (null). The caller either omits the row or prints the
//   value-column placeholder `NO_VALUE`.
//
// The old middle band — the raw fraction "2 of 3" under five attempts, plus the
// words "thin sample" on an average — is RETIRED. It was built to stop a reader
// over-reading a small sample, and it cost more than it bought: a fraction
// cannot be read at a glance, cannot be drawn as a bar, and made a new player's
// whole statistics screen look broken on exactly the data every new player has.
// The sample did not disappear with it — a collapsed card HEADLINE still prints
// it via `rateWithSample`, and every card's info sheet spells it out in words.
//
// `MIN_RATE_DENOMINATOR` / `rateDisplay` survive in `src/round/stat-measures.ts`
// as an ADMISSION floor (trend points, insight deltas). No formatter here may
// call them.
//
// Twin of `ios/TapScore/Features/Stats/StatsFormat.swift`. Note the PLACEMENT:
// iOS keeps this in the view layer (`Features/Stats/`), not beside the maths in
// `Domain/StatMeasuresMath.swift`, because it is presentation policy rather
// than measurement. The web copy mirrors that — it lives here and not in
// `src/round/stat-measures.ts`.
//
// Pure module: no DOM, no theme import, so the geometry and wording are
// testable headless.

import {
    type ByParGroup,
    type ByTee,
    type PenaltySplit,
    type PuttBucket,
    type Rate,
    type StrokesLostComponent,
    type VsParSplit,
} from '../round/stat-measures';
import { formatRowDate } from '../landing/rows';
import type { StatsRoundType, StatsVenueType } from './stats-window';

// --- Rates -------------------------------------------------------------------

/**
 * The value-column placeholder for a rate with no sample at all.
 *
 * A single em dash (U+2014), no spaces. It is a PLACEHOLDER, never a label: a
 * bar row's value cell is 56 px wide and "Not recorded" wrapping to two lines
 * inside it is the drift this pass removed. A figure row, which is a full-width
 * sentence-shaped thing, still says "Not recorded" in words, and no aria/screen
 * reader string ever reads the dash.
 */
export const NO_VALUE = '—';

/**
 * The headline reading for a rate, or null when there is no sample at all.
 *
 * A rate with any denominator reads as a percentage. The old fraction fallback
 * under five attempts is RETIRED (owner ruling, 2026-08-02) — see the note at
 * the top of this file.
 *
 * null is a real answer here and callers must handle it — that is how a module
 * with no data ends up absent rather than zeroed.
 */
export function formatRate(r: Rate): string | null {
    if (r.d <= 0 || r.value === null) return null;
    return `${Math.round(r.value * 100)}%`;
}

/**
 * The sample behind a rate — "14 of 24". Available for ANY sample now that the
 * headline never IS the fraction; the caller decides whether it has room.
 */
export function rateSample(r: Rate): string | null {
    if (r.d <= 0) return null;
    return `${formatCount(r.n)} of ${formatCount(r.d)}`;
}

/** Headline plus sample, for places with one line to spend. */
export function rateWithSample(r: Rate): string | null {
    const head = formatRate(r);
    if (head === null) return null;
    const sample = rateSample(r);
    return sample === null ? head : `${head} (${sample})`;
}

/**
 * A rate rendered as a plain average rather than a percentage — putts per hole,
 * strokes vs par, penalties per round. Same `d > 0` gate, but the value is a
 * quantity, not a share, so it never grows a `%`.
 *
 * This is the BARE value: "1.85" reads the same over one hole and over forty.
 * Use `averageWithSample` on any surface a reader takes a number off;
 * `formatAverage` is for callers that print the sample themselves
 * (`troubleTax`, whose own denominator is not one).
 *
 * `signed` prepends `+` for positive values — what "over par" needs and "putts
 * per hole" does not.
 */
export function formatAverage(r: Rate, decimals = 2, signed = false): string | null {
    if (r.d <= 0 || r.value === null) return null;
    return signed ? signedNumber(r.value, decimals) : formatNumber(r.value, decimals);
}

/**
 * The noun a sample is counted in, in both numbers.
 *
 * Spelled out rather than derived: "greens hit" and "holes from trouble" do not
 * pluralise at the end, and a wrong plural in a figure row is the kind of thing
 * that reads as a bug in the number beside it.
 */
export interface SampleUnit {
    readonly one: string;
    readonly many: string;
}

/** A regular noun, whose plural is just an `s`. */
export function regularUnit(one: string): SampleUnit {
    return { one, many: `${one}s` };
}

/**
 * The three denominators every average on this screen is over. Kept short on
 * purpose — the sample sits inside the value column beside the number, the same
 * slot `rateWithSample` fills with "(14 of 24)".
 */
export const UNIT_ROUNDS = regularUnit('round');
export const UNIT_HOLES = regularUnit('hole');
export const UNIT_GREENS = regularUnit('green');

/**
 * The sample behind an average — "over 24 greens". No thin mark: there is no
 * thin any more, only a denominator, and the denominator is what this prints.
 *
 * null at `d == 0`, matching `formatAverage` — the caller omits the row.
 */
export function averageSample(r: Rate, unit: SampleUnit): string | null {
    if (r.d <= 0) return null;
    return `over ${quantity(r.d, unit)}`;
}

/**
 * An average with its denominator beside it.
 *
 * `label` is what the number MEASURES, placed between the value and the sample
 * ("1.85 putts per green hit (over 24 greens)").
 *
 * ONE consumer survives the owner's 2026-08-03 ruling: the COLLAPSED PANEL
 * HEADLINE, which is a whole card reduced to a line and has to say how much
 * round is behind it. Figure rows inside an open panel no longer call this —
 * they print the bare value via `formatAverage` and state the denominator in the
 * card's info sheet, where a group of parallel rows can share one sentence. Do
 * not re-introduce a call from `panelBlocks`; kept (rather than inlined into the
 * headline) because the twin has the same pair and the format tests pin it.
 */
export function averageWithSample(
    r: Rate,
    opts: { unit: SampleUnit; decimals?: number; signed?: boolean; label?: string },
): string | null {
    const value = formatAverage(r, opts.decimals ?? 2, opts.signed ?? false);
    if (value === null) return null;
    const head = opts.label ? `${value} ${opts.label}` : value;
    const sample = averageSample(r, opts.unit);
    return sample === null ? head : `${head} (${sample})`;
}

const UNIT_TROUBLE_HOLES: SampleUnit = { one: 'hole from trouble', many: 'holes from trouble' };
const UNIT_FAIRWAY_HOLES: SampleUnit = { one: 'from the fairway', many: 'from the fairway' };

/**
 * The trouble tax's sample is its two SIDES, never its own `d`.
 *
 * `troubleTaxPerHole` puts a difference of two averages over the CROSS-PRODUCT
 * of their hole counts, and says in its own doc comment that the result must
 * not be fed to `rateDisplay` as a sample: nine trouble holes against eleven
 * fairway ones would print "over 99 holes". The honest reading is both
 * denominators, which is what this prints — no thin mark, and no judgement
 * about the size of either side. Its consumer is a card's info sheet.
 */
export function troubleTaxSample(vsParByTee: ByTee<Rate>): string | null {
    const trouble = vsParByTee.trouble.d;
    const fairway = vsParByTee.fairway.d;
    if (trouble <= 0 || fairway <= 0) return null;
    return (
        `over ${quantity(trouble, UNIT_TROUBLE_HOLES)}` +
        ` vs ${quantity(fairway, UNIT_FAIRWAY_HOLES)}`
    );
}

/**
 * The sample behind a DIFFERENCE of two averages: both denominators, never the
 * cross-product guard the figure itself carries.
 */
export function taxSample(
    a: Rate,
    aUnit: SampleUnit,
    b: Rate,
    bUnit: SampleUnit,
): string | null {
    if (a.d <= 0 || b.d <= 0) return null;
    return `over ${quantity(a.d, aUnit)} vs ${quantity(b.d, bUnit)}`;
}

const UNIT_GREENS_MISSED: SampleUnit = {
    one: 'hole with the green missed',
    many: 'holes with the green missed',
};
const UNIT_GREENS_HIT: SampleUnit = { one: 'green hit', many: 'greens hit' };
const UNIT_PENALTY_HOLES: SampleUnit = {
    one: 'hole with a penalty',
    many: 'holes with a penalty',
};
const UNIT_PENALTY_FREE: SampleUnit = { one: 'without', many: 'without' };

/**
 * "1 penalty hole", "5 penalty holes" — the subject of the penalty-source card.
 * Its sample is usually a handful, so the singular is the COMMON case here, not
 * the edge one.
 */
export const UNIT_LABELLED_PENALTY_HOLES: SampleUnit = regularUnit('penalty hole');

/** "over 34 holes with the green missed vs 26 greens hit". */
export function missedGreenTaxSample(cost: VsParSplit): string | null {
    return taxSample(cost.miss, UNIT_GREENS_MISSED, cost.hit, UNIT_GREENS_HIT);
}

/** "over 9 holes with a penalty vs 45 without". */
export function penaltyTaxSample(split: PenaltySplit): string | null {
    return taxSample(split.penalty, UNIT_PENALTY_HOLES, split.clean, UNIT_PENALTY_FREE);
}

// --- Group samples -----------------------------------------------------------
//
// A group of PARALLEL figure rows — the three tee buckets, the three par groups,
// the two sides of a missed green — states its denominators together, in one
// sentence, in the card's info sheet. That is where they went when the owner's
// 2026-08-03 ruling took the "(over 26 greens)" suffix off the rows themselves.
//
// Together rather than one-per-row on purpose: the rows PARTITION a sample, so
// the interesting fact is how the partition split, and three separate sentences
// would bury it. Each unit therefore carries its own noun ("holes in play", not
// bare "in play") — the list drops empty legs, so any leg can end up first.

/**
 * "over 26 holes from the fairway, 8 holes in play and 9 holes from trouble".
 *
 * A leg with no sample is dropped rather than printed as a zero, and null comes
 * back when nothing is left — the same contract as `averageSample`, so a caller
 * omits the sentence instead of writing "over 0 holes".
 */
export function groupSample(parts: readonly { d: number; unit: SampleUnit }[]): string | null {
    const legs = parts.filter((p) => p.d > 0).map((p) => quantity(p.d, p.unit));
    const last = legs.pop();
    if (last === undefined) return null;
    return legs.length === 0 ? `over ${last}` : `over ${legs.join(', ')} and ${last}`;
}

const UNIT_FAIRWAY_ONLY: SampleUnit = {
    one: 'hole from the fairway',
    many: 'holes from the fairway',
};
const UNIT_IN_PLAY_HOLES: SampleUnit = { one: 'hole in play', many: 'holes in play' };
const UNIT_PAR_3 = regularUnit('par 3');
const UNIT_PAR_4 = regularUnit('par 4');
const UNIT_PAR_5 = regularUnit('par 5');

/** The three tee buckets' scored holes, in the order the rows read. */
export function vsParByTeeSample(byTee: ByTee<Rate>): string | null {
    return groupSample([
        { d: byTee.fairway.d, unit: UNIT_FAIRWAY_ONLY },
        { d: byTee.inPlay.d, unit: UNIT_IN_PLAY_HOLES },
        { d: byTee.trouble.d, unit: UNIT_TROUBLE_HOLES },
    ]);
}

/** "over 12 par 3s, 30 par 4s and 12 par 5s" — shared by putting and scoring. */
export function byParSample(byPar: ByParGroup<Rate>): string | null {
    return groupSample([
        { d: byPar.par3.d, unit: UNIT_PAR_3 },
        { d: byPar.par4.d, unit: UNIT_PAR_4 },
        { d: byPar.par5.d, unit: UNIT_PAR_5 },
    ]);
}

/** "over 26 greens hit and 34 holes with the green missed". */
export function missedGreenSample(cost: VsParSplit): string | null {
    return groupSample([
        { d: cost.hit.d, unit: UNIT_GREENS_HIT },
        { d: cost.miss.d, unit: UNIT_GREENS_MISSED },
    ]);
}

// `isThin` and `THIN_SAMPLE` used to live here. Both are gone with the middle
// band of the display policy (owner ruling, 2026-08-02): a bar always draws its
// share, and a sample is stated as a denominator rather than judged.

// --- Numbers -----------------------------------------------------------------

/**
 * A count. Whole where it is whole, which is nearly always: these are summed
 * integer columns that only pick up a fraction when a caller averages them.
 */
export function formatCount(value: number): string {
    return value === Math.round(value) ? String(Math.round(value)) : formatNumber(value, 1);
}

/** A count with its noun: "1 round", "12 rounds". */
export function quantity(value: number, unit: SampleUnit): string {
    return `${formatCount(value)} ${value === 1 ? unit.one : unit.many}`;
}

export function formatNumber(value: number, decimals = 1): string {
    return value.toFixed(decimals);
}

/**
 * A signed quantity with a TYPOGRAPHIC minus (U+2212), not a hyphen.
 *
 * The whole screen is signed numbers in a tabular font; a hyphen-minus is
 * narrower than a plus and makes a column of gains and losses jitter. `-0.0` is
 * normalised away — a rounded-to-nothing value that prints "−0.0" reads as a
 * small loss when it is neither.
 */
export function signedNumber(value: number, decimals = 1): string {
    const scale = 10 ** decimals;
    const rounded = Math.round(value * scale) / scale;
    if (rounded === 0) return formatNumber(0, decimals);
    const magnitude = formatNumber(Math.abs(rounded), decimals);
    return rounded > 0 ? `+${magnitude}` : `−${magnitude}`;
}

/**
 * A per-bucket strokes-gained figure for the putting ladder. One decimal,
 * always signed, POSITIVE = LOST (the waterfall's sign, and
 * `STATS_COPY.prioritiesHint`'s: "Positive costs you shots").
 *
 * The em dash is the empty-column placeholder, never a label — a bucket with no
 * resolved hole has nothing to compare, which is not the same as being level.
 * An exactly level bucket reads `0.0`, never `E`: `E` is the scorecard's word
 * for even par, not a strokes-gained zero.
 */
export function formatCost(value: number | null): string {
    if (value === null) return NO_VALUE;
    return signedNumber(value, 1);
}

/**
 * Strokes lost or gained, per 18 attributed holes. Positive = lost.
 *
 * Worded rather than coloured alone: the sign is doing semantic work (`+1.8`
 * costs you strokes) that is the opposite of the usual reading of a plus, so
 * the label beside it always says which way is good.
 *
 * "per 18" rather than "/round": the figure is scaled to eighteen ATTRIBUTED
 * holes, so a nine and an eighteen sit on one scale, and a round is no longer
 * the unit. Spelled out with a space because "/18" beside a signed decimal
 * reads as a fraction.
 */
export function strokesPer18(value: number): string {
    return `${signedNumber(value)} per 18`;
}

/** A score relative to par, in the app's usual scorecard voice. */
export function vsPar(value: number): string {
    if (value === 0) return 'E';
    return signedNumber(value, value === Math.round(value) ? 0 : 1);
}

// --- Vocabulary --------------------------------------------------------------

export function componentTitle(component: StrokesLostComponent): string {
    switch (component) {
        case 'tee':
            return 'Tee';
        case 'approach':
            return 'Approach';
        case 'shortGame':
            return 'Short game';
        case 'putting':
            return 'Putting';
        case 'penalties':
            return 'Penalties';
    }
}

// A priority row carries NO explainer sentence. The component names are the
// five terms of the waterfall the section intro already describes, and five
// sentences repeating "strokes vs an average" under five names was the noise
// the one-card redesign removed (owner ruling, 2026-08-02). What the terms mean
// lives behind the "How this works" link, interpolated with the reader's own
// numbers.

export function bucketTitle(bucket: PuttBucket): string {
    switch (bucket) {
        case 'inside_1m':
            return 'Inside 1 m';
        case '1_to_2m':
            return '1–2 m';
        case '2_to_4m':
            return '2–4 m';
        case '4_to_8m':
            return '4–8 m';
        case 'over_8m':
            return 'Over 8 m';
    }
}

export function venueTitle(venue: StatsVenueType): string {
    return venue === 'indoor' ? 'Indoor' : 'Outdoor';
}

export function roundTypeTitle(type: StatsRoundType): string {
    switch (type) {
        case 'full_18':
            return '18 holes';
        case 'front_9':
            return 'Front 9';
        case 'back_9':
            return 'Back 9';
        case 'custom_holes':
            return 'Custom holes';
    }
}

// --- Dates -------------------------------------------------------------------

/**
 * `2026-07-30` → the reader's own medium date.
 *
 * Delegates to the landing list's `formatRowDate`, which already parses and
 * renders in UTC: a round's date is a plain calendar DAY with no time zone in
 * it, and parsing it locally would shift a Swedish evening round onto the
 * previous day for any reader west of Greenwich. One implementation, so the
 * dashboard's round list and the history list can never disagree about what
 * day a round was.
 *
 * The web has no twin of iOS's `isoDay(localDayOf:)` / `localDate(fromISODay:)`
 * pair, and needs none: `<input type="date">` reads and writes `yyyy-MM-dd`
 * directly, so the filter's bounds never become instants. That whole class of
 * off-by-one-day bug does not exist here.
 */
export function formatDay(isoDay: string): string {
    return formatRowDate(isoDay);
}
