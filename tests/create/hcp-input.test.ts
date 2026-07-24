// The handicap text seam: user notation ("18,4", "+2.4") ↔ stored number.
// A plus handicap is written "+x.x" and stored NEGATIVE (the domain's PH < 0
// branch); a decimal comma must parse identically to a dot.

import { expect, test } from 'bun:test';
import { parseHandicapIndex, formatHandicapIndex } from '../../src/create/hcp-input';

test('parses plain indexes with dot or comma decimals', () => {
    expect(parseHandicapIndex('18.4')).toBe(18.4);
    expect(parseHandicapIndex('18,4')).toBe(18.4);
    expect(parseHandicapIndex(' 18,4 ')).toBe(18.4);
    expect(parseHandicapIndex('0')).toBe(0);
    expect(parseHandicapIndex('54')).toBe(54);
});

test('maps golf plus notation to a negative stored index', () => {
    expect(parseHandicapIndex('+2.4')).toBe(-2.4);
    expect(parseHandicapIndex('+2,4')).toBe(-2.4);
    expect(parseHandicapIndex('+0.5')).toBe(-0.5);
    // Already-stored notation stays negative.
    expect(parseHandicapIndex('-2.4')).toBe(-2.4);
});

test('rejects empty and non-numeric text', () => {
    expect(parseHandicapIndex('')).toBeNull();
    expect(parseHandicapIndex('   ')).toBeNull();
    expect(parseHandicapIndex('abc')).toBeNull();
    expect(parseHandicapIndex('+')).toBeNull();
    expect(parseHandicapIndex(',')).toBeNull();
});

test('formats a stored index back to golf notation', () => {
    expect(formatHandicapIndex(18.4)).toBe('18.4');
    expect(formatHandicapIndex(-2.4)).toBe('+2.4');
    expect(formatHandicapIndex(0)).toBe('0');
});

test('round-trips through format → parse', () => {
    for (const v of [-9.9, -2.4, 0, 0.1, 18.4, 54]) {
        expect(parseHandicapIndex(formatHandicapIndex(v))).toBe(v);
    }
});
