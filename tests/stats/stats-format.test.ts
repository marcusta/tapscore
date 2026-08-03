import { expect, test } from 'bun:test';
import {
    averageSample,
    averageWithSample,
    bucketTitle,
    byParSample,
    componentTitle,
    groupSample,
    missedGreenSample,
    strokesPer18,
    vsParByTeeSample,
    formatAverage,
    formatCount,
    formatCost,
    formatRate,
    missedGreenTaxSample,
    penaltyTaxSample,
    quantity,
    rateSample,
    rateWithSample,
    roundTypeTitle,
    signedNumber,
    taxSample,
    troubleTaxSample,
    UNIT_GREENS,
    UNIT_ROUNDS,
    venueTitle,
    vsPar,
} from '../../src/stats/stats-format';
import {
    rate,
    type ByTee,
    type PenaltySplit,
    type Rate,
    type VsParSplit,
} from '../../src/round/stat-measures';

// The display policy in one place, and it now has exactly TWO cases: d == 0 is
// absent, and every other d is a percentage. The middle band — the raw fraction
// and the "thin sample" suffix — was retired by the owner on 2026-08-02.

// --- Display policy ----------------------------------------------------------

test('d == 0 is absent, not zero', () => {
    expect(formatRate(rate(0, 0))).toBeNull();
    expect(rateSample(rate(0, 0))).toBeNull();
    expect(formatAverage(rate(0, 0))).toBeNull();
    expect(averageSample(rate(0, 0), UNIT_ROUNDS)).toBeNull();
});

test('a SMALL denominator is still a percentage — there is no fraction band left', () => {
    const r = rate(2, 3);
    expect(formatRate(r)).toBe('67%');
    // The sample survives as a SAMPLE, which is what a headline parenthetical
    // and an info sheet are made of. It is simply never the value any more.
    expect(rateSample(r)).toBe('2 of 3');
    expect(rateWithSample(r)).toBe('67% (2 of 3)');
});

test('a big denominator reads the same way, sample beside it', () => {
    const r = rate(7, 12);
    expect(formatRate(r)).toBe('58%');
    expect(rateWithSample(r)).toBe('58% (7 of 12)');
});

test('an average over a small sample says the sample, and nothing about its size', () => {
    expect(averageWithSample(rate(6, 3), { unit: UNIT_GREENS, label: 'putts per green hit' })).toBe(
        '2.00 putts per green hit (over 3 greens)',
    );
    expect(averageWithSample(rate(44, 24), { unit: UNIT_GREENS })).toBe('1.83 (over 24 greens)');
});

test('a strokes-gained cost is signed to one decimal, and an absent one is the placeholder', () => {
    // POSITIVE IS LOST, everywhere in this app.
    expect(formatCost(1.24)).toBe('+1.2');
    expect(formatCost(-1.24)).toBe('\u22121.2');
    expect(formatCost(0)).toBe('0.0');
    // −0.0 must not read as a gain.
    expect(formatCost(-0.02)).toBe('0.0');
    expect(formatCost(null)).toBe('\u2014');
});

// --- Numbers -----------------------------------------------------------------

test('signed numbers use a typographic minus and normalise −0.0 away', () => {
    expect(signedNumber(1.84)).toBe('+1.8');
    expect(signedNumber(-1.84)).toBe('−1.8');
    expect(signedNumber(-0.04)).toBe('0.0');
    expect(signedNumber(0)).toBe('0.0');
});

test('vsPar says E at level and drops decimals when whole', () => {
    expect(vsPar(0)).toBe('E');
    expect(vsPar(3)).toBe('+3');
    expect(vsPar(-2.5)).toBe('−2.5');
});

test('counts stay whole and quantities pluralise from the unit', () => {
    expect(formatCount(12)).toBe('12');
    expect(formatCount(12.5)).toBe('12.5');
    expect(quantity(1, UNIT_ROUNDS)).toBe('1 round');
    expect(quantity(12, UNIT_ROUNDS)).toBe('12 rounds');
});

// --- Trouble tax -------------------------------------------------------------

function byTee(fairwayD: number, troubleD: number): ByTee<Rate> {
    return { fairway: rate(0, fairwayD), inPlay: rate(0, 0), trouble: rate(0, troubleD) };
}

test('the trouble tax prints BOTH real denominators, never the cross product', () => {
    expect(troubleTaxSample(byTee(11, 9))).toBe('over 9 holes from trouble vs 11 from the fairway');
});

test('a small side is reported as itself — the reader can see 2 is small', () => {
    expect(troubleTaxSample(byTee(2, 4))).toBe('over 4 holes from trouble vs 2 from the fairway');
});

test('a missing side has no honest reading at all', () => {
    expect(troubleTaxSample(byTee(11, 0))).toBeNull();
    expect(troubleTaxSample(byTee(0, 9))).toBeNull();
});

// --- Vocabulary --------------------------------------------------------------

test('every one of the five components has a plain title', () => {
    // No residual any more: the tee shot and the approach are measured, so they
    // are named for themselves rather than lumped into a "long game".
    expect(componentTitle('tee')).toBe('Tee');
    expect(componentTitle('approach')).toBe('Approach');
    expect(componentTitle('shortGame')).toBe('Short game');
    expect(componentTitle('putting')).toBe('Putting');
    expect(componentTitle('penalties')).toBe('Penalties');
});

test('a priority figure is stated per 18 attributed holes, with a typographic minus', () => {
    expect(strokesPer18(1.25)).toBe('+1.3 per 18');
    expect(strokesPer18(-1.25)).toBe('\u22121.2 per 18');
    // −0.0 normalises: a rounding artefact must not read as a loss.
    expect(strokesPer18(-0.04)).toBe('0.0 per 18');
});

test('bucket, venue and round type titles', () => {
    expect(bucketTitle('inside_1m')).toBe('Inside 1 m');
    expect(bucketTitle('over_8m')).toBe('Over 8 m');
    expect(venueTitle('indoor')).toBe('Indoor');
    expect(roundTypeTitle('front_9')).toBe('Front 9');
});

// --- Tax samples (wave 3) -----------------------------------------------------
//
// A DIFFERENCE of two averages has two denominators, never the cross-product
// guard the figure itself carries. Strings are the wave-3 spec §D.4 oracle and
// the Swift twin asserts them character for character.

const COST_W: VsParSplit = {
    hit: rate(2, 26),
    miss: rate(31, 34),
    delta: rate(738, 884),
};

const PENALTY_W: PenaltySplit = { penalty: rate(14, 9), clean: rate(4, 45) };

test('taxSample prints both denominators and nothing about the guard', () => {
    expect(missedGreenTaxSample(COST_W)).toBe(
        'over 34 holes with the green missed vs 26 greens hit',
    );
    expect(penaltyTaxSample(PENALTY_W)).toBe('over 9 holes with a penalty vs 45 without');
    // Never the figure's own d: 34 × 26 = 884 is a guard, not 884 holes.
    expect(missedGreenTaxSample(COST_W)).not.toContain('884');
});

test('a small side carries no caveat, only its own number', () => {
    expect(penaltyTaxSample({ penalty: rate(14, 9), clean: rate(1, 3) })).toBe(
        'over 9 holes with a penalty vs 3 without',
    );
    expect(missedGreenTaxSample({ hit: rate(1, 2), miss: rate(9, 20), delta: rate(0, 40) })).toBe(
        'over 20 holes with the green missed vs 2 greens hit',
    );
    // Singulars are spelled out, both sides.
    expect(penaltyTaxSample({ penalty: rate(2, 1), clean: rate(0, 1) })).toBe(
        'over 1 hole with a penalty vs 1 without',
    );
});

test('an empty side has no sample at all — null, so the row prints no line', () => {
    expect(missedGreenTaxSample({ hit: rate(0, 0), miss: rate(9, 20), delta: rate(0, 0) })).toBeNull();
    expect(penaltyTaxSample({ penalty: rate(14, 9), clean: rate(0, 0) })).toBeNull();
    expect(taxSample(rate(0, 0), UNIT_ROUNDS, rate(1, 9), UNIT_GREENS)).toBeNull();
});

// --- Group samples (2026-08-03) ----------------------------------------------
//
// The figure rows print bare values now, so a GROUP of parallel rows states its
// denominators together, in one sentence, in the card's info sheet. Together
// rather than one-per-row because the rows partition one sample: how the
// partition split is the fact, and three sentences would bury it.

test('a group sample lists every leg, with the last joined by "and"', () => {
    expect(
        vsParByTeeSample({ fairway: rate(0, 26), inPlay: rate(0, 8), trouble: rate(0, 9) }),
    ).toBe('over 26 holes from the fairway, 8 holes in play and 9 holes from trouble');
    // A single leg takes no comma and no "and".
    expect(groupSample([{ d: 3, unit: UNIT_ROUNDS }])).toBe('over 3 rounds');
});

test('by-par reads in the golfer’s own nouns, pluralised', () => {
    expect(byParSample({ par3: rate(0, 12), par4: rate(0, 30), par5: rate(0, 12) })).toBe(
        'over 12 par 3s, 30 par 4s and 12 par 5s',
    );
    expect(byParSample({ par3: rate(0, 1), par4: rate(0, 1), par5: rate(0, 1) })).toBe(
        'over 1 par 3, 1 par 4 and 1 par 5',
    );
});

test('an empty leg is dropped, never printed as "over 0"', () => {
    // Every leg carries its own noun precisely because any leg can end up first.
    expect(
        vsParByTeeSample({ fairway: rate(0, 0), inPlay: rate(0, 0), trouble: rate(0, 9) }),
    ).toBe('over 9 holes from trouble');
    expect(byParSample({ par3: rate(0, 0), par4: rate(0, 30), par5: rate(0, 12) })).toBe(
        'over 30 par 4s and 12 par 5s',
    );
    expect(groupSample([{ d: 0, unit: UNIT_ROUNDS }])).toBeNull();
    expect(groupSample([])).toBeNull();
});

test('the missed-green pair reads as a partition, not as a comparison', () => {
    // The same two denominators `missedGreenTaxSample` says "vs" about — the
    // group card states them as the two halves of the window they are.
    expect(missedGreenSample(COST_W)).toBe(
        'over 26 greens hit and 34 holes with the green missed',
    );
});
