import { expect, test } from 'bun:test';
import {
    averageSample,
    averageWithSample,
    bucketTitle,
    componentTitle,
    formatAverage,
    formatCount,
    formatRate,
    isThin,
    missedGreenTaxSample,
    penaltyTaxSample,
    quantity,
    rateSample,
    rateWithSample,
    roundTypeTitle,
    signedNumber,
    strokesPerRound,
    taxSample,
    THIN_SAMPLE,
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

// The display policy (proposal §1) in one place: d == 0 absent, 0 < d < 5 raw
// fraction, d >= 5 percentage, denominators always shown.

// --- Display policy ----------------------------------------------------------

test('d == 0 is absent, not zero', () => {
    expect(formatRate(rate(0, 0))).toBeNull();
    expect(rateSample(rate(0, 0))).toBeNull();
    expect(formatAverage(rate(0, 0))).toBeNull();
    expect(averageSample(rate(0, 0), UNIT_ROUNDS)).toBeNull();
});

test('0 < d < 5 reads as the raw fraction and never repeats it as a sample', () => {
    const r = rate(2, 3);
    expect(formatRate(r)).toBe('2 of 3');
    expect(rateSample(r)).toBeNull();
    expect(rateWithSample(r)).toBe('2 of 3');
    expect(isThin(r)).toBe(true);
});

test('d >= 5 reads as a percentage with its sample beside it', () => {
    const r = rate(7, 12);
    expect(formatRate(r)).toBe('58%');
    expect(rateWithSample(r)).toBe('58% (7 of 12)');
    expect(isThin(r)).toBe(false);
});

test('an average under the floor says "thin sample" outright', () => {
    expect(averageWithSample(rate(6, 3), { unit: UNIT_GREENS, label: 'putts per green hit' })).toBe(
        `2.00 putts per green hit (over 3 greens — ${THIN_SAMPLE})`,
    );
    expect(averageWithSample(rate(44, 24), { unit: UNIT_GREENS })).toBe('1.83 (over 24 greens)');
});

// --- Numbers -----------------------------------------------------------------

test('signed numbers use a typographic minus and normalise −0.0 away', () => {
    expect(signedNumber(1.84)).toBe('+1.8');
    expect(signedNumber(-1.84)).toBe('−1.8');
    expect(signedNumber(-0.04)).toBe('0.0');
    expect(signedNumber(0)).toBe('0.0');
    expect(strokesPerRound(1.8)).toBe('+1.8/round');
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

test('either side being thin marks the whole reading thin', () => {
    expect(troubleTaxSample(byTee(2, 4))).toBe(
        `over 4 holes from trouble vs 2 from the fairway — ${THIN_SAMPLE}`,
    );
});

test('a missing side has no honest reading at all', () => {
    expect(troubleTaxSample(byTee(11, 0))).toBeNull();
    expect(troubleTaxSample(byTee(0, 9))).toBeNull();
});

// --- Vocabulary --------------------------------------------------------------

test('the residual term is called Long game, not Tee', () => {
    expect(componentTitle('longGame')).toBe('Long game');
    expect(componentTitle('shortGame')).toBe('Short game');
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

test('either side under the floor marks the whole difference thin, in words', () => {
    expect(penaltyTaxSample({ penalty: rate(14, 9), clean: rate(1, 3) })).toBe(
        `over 9 holes with a penalty vs 3 without — ${THIN_SAMPLE}`,
    );
    expect(missedGreenTaxSample({ hit: rate(1, 2), miss: rate(9, 20), delta: rate(0, 40) })).toBe(
        `over 20 holes with the green missed vs 2 greens hit — ${THIN_SAMPLE}`,
    );
    // Singulars are spelled out, both sides.
    expect(penaltyTaxSample({ penalty: rate(2, 1), clean: rate(0, 1) })).toBe(
        `over 1 hole with a penalty vs 1 without — ${THIN_SAMPLE}`,
    );
});

test('an empty side has no sample at all — null, so the row prints no line', () => {
    expect(missedGreenTaxSample({ hit: rate(0, 0), miss: rate(9, 20), delta: rate(0, 0) })).toBeNull();
    expect(penaltyTaxSample({ penalty: rate(14, 9), clean: rate(0, 0) })).toBeNull();
    expect(taxSample(rate(0, 0), UNIT_ROUNDS, rate(1, 9), UNIT_GREENS)).toBeNull();
});
