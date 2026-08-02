// Words and numerals for the stats dashboard.
//
// The display policy from the proposal (§1) lives here in ONE place:
//
// - `d >= 5` → a percentage. Enough sample to say "58%" out loud.
// - `0 < d < 5` → the raw fraction, "2 of 3". A percentage over three attempts
//   is a number pretending to be a measurement; the fraction says the same
//   thing and cannot be over-read.
// - `d == 0` → absent. Not "0%", not "—" in a slot that looks like a value:
//   the caller is expected to omit the row.
//
// Denominators are always printed beside the value, which is the whole reason
// the app can afford to show a rate over five attempts at all. Averages are
// held to the same bargain by `averageWithSample` — see the note there.
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
    MIN_RATE_DENOMINATOR,
    rateDisplay,
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
 * The headline reading for a rate, or null when there is no sample.
 *
 * null is a real answer here and callers must handle it — that is how a module
 * with no data ends up absent rather than zeroed.
 */
export function formatRate(r: Rate): string | null {
    switch (rateDisplay(r)) {
        case 'absent':
            return null;
        case 'fraction':
            return `${formatCount(r.n)} of ${formatCount(r.d)}`;
        case 'percentage':
            return r.value === null ? null : `${Math.round(r.value * 100)}%`;
    }
}

/**
 * The sample behind a rate, for the line under the headline. null when the
 * headline already IS the fraction — printing "2 of 3" twice is noise.
 */
export function rateSample(r: Rate): string | null {
    if (rateDisplay(r) !== 'percentage') return null;
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
 * strokes vs par, penalties per round. Same denominator floor, but the value is
 * a quantity, not a share, so it never grows a `%`.
 *
 * This is the BARE value, and on its own it escapes the display policy: a
 * percentage always arrives with its sample (either printed beside it or
 * spelled out as the fraction it degraded into), while "1.85" reads the same
 * over one hole and over forty. Use `averageWithSample` on any surface a reader
 * takes a number off; `formatAverage` is for callers that print the sample
 * themselves (`troubleTax`, whose own denominator is not one).
 *
 * `signed` prepends `+` for positive values — what "over par" needs and "putts
 * per hole" does not.
 */
export function formatAverage(r: Rate, decimals = 2, signed = false): string | null {
    if (rateDisplay(r) === 'absent') return null;
    if (r.value === null) return null;
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
 * What a thin sample is called, in words. The app's standing rule: an
 * annotation is a word, never a glyph.
 */
export const THIN_SAMPLE = 'thin sample';

/**
 * The sample behind an average — "over 24 greens", and the same with the thin
 * note under the policy's floor.
 *
 * The floor is exactly `rateWithSample`'s; only the MARK differs, because an
 * average has no fraction to degrade into. A rate under five attempts says it
 * by reading "2 of 3"; an average has to say it outright.
 *
 * null at `d == 0`, matching `formatAverage` — the caller omits the row.
 */
export function averageSample(r: Rate, unit: SampleUnit): string | null {
    switch (rateDisplay(r)) {
        case 'absent':
            return null;
        case 'fraction':
            return `over ${quantity(r.d, unit)} — ${THIN_SAMPLE}`;
        case 'percentage':
            return `over ${quantity(r.d, unit)}`;
    }
}

/**
 * An average with its denominator beside it — the form every figure row on this
 * screen uses.
 *
 * `label` is what the number MEASURES, placed between the value and the sample
 * ("1.85 putts per green hit (over 24 greens)"). Panel headlines carry it; a
 * figure row already has the label in its title.
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
 * fairway ones would print "over 99 holes", and four against two would clear
 * the floor of five while resting on four holes. The honest reading is both
 * denominators, and either of them being thin is what makes the difference
 * unreliable.
 */
export function troubleTaxSample(vsParByTee: ByTee<Rate>): string | null {
    const trouble = vsParByTee.trouble.d;
    const fairway = vsParByTee.fairway.d;
    if (trouble <= 0 || fairway <= 0) return null;
    const reading =
        `over ${quantity(trouble, UNIT_TROUBLE_HOLES)}` +
        ` vs ${quantity(fairway, UNIT_FAIRWAY_HOLES)}`;
    const thin = trouble < MIN_RATE_DENOMINATOR || fairway < MIN_RATE_DENOMINATOR;
    return thin ? `${reading} — ${THIN_SAMPLE}` : reading;
}

/**
 * The sample behind a DIFFERENCE of two averages: both denominators, never the
 * cross-product guard the figure itself carries. Thin if either side is under
 * the display policy's floor — the difference is only as reliable as its
 * smaller side.
 */
export function taxSample(
    a: Rate,
    aUnit: SampleUnit,
    b: Rate,
    bUnit: SampleUnit,
): string | null {
    if (a.d <= 0 || b.d <= 0) return null;
    const reading = `over ${quantity(a.d, aUnit)} vs ${quantity(b.d, bUnit)}`;
    const thin = a.d < MIN_RATE_DENOMINATOR || b.d < MIN_RATE_DENOMINATOR;
    return thin ? `${reading} — ${THIN_SAMPLE}` : reading;
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

/** "over 34 holes with the green missed vs 26 greens hit". */
export function missedGreenTaxSample(cost: VsParSplit): string | null {
    return taxSample(cost.miss, UNIT_GREENS_MISSED, cost.hit, UNIT_GREENS_HIT);
}

/** "over 9 holes with a penalty vs 45 without". */
export function penaltyTaxSample(split: PenaltySplit): string | null {
    return taxSample(split.penalty, UNIT_PENALTY_HOLES, split.clean, UNIT_PENALTY_FREE);
}

/**
 * True when a rate is thin enough that the reading is a fraction — the cue for
 * a view to skip a bar it would otherwise draw at a misleading length.
 */
export function isThin(r: Rate): boolean {
    return rateDisplay(r) === 'fraction';
}

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
