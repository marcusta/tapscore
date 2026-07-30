import { expect, test } from 'bun:test';
import { defaultRoundName } from '../../src/create/default-round-name';

// The pre-filled round name. Two things can be wrong here — the locale and the
// de-dup suffix — so both are pinned. Mirrors `DefaultRoundNameTests` on iOS.

const day = new Date('2026-07-30T12:00:00Z');

test('prefix and date format follow the reader locale', () => {
    expect(defaultRoundName(day, 'en-GB')).toBe('Game 30 Jul 2026');
    expect(defaultRoundName(day, 'sv-SE')).toBe('Spel 30 juli 2026');
    // An unknown language is not Swedish, so it gets the English prefix.
    expect(defaultRoundName(day, 'de-DE').startsWith('Game ')).toBe(true);
});

test('an already-taken name steps to (2), then (3)', () => {
    const base = 'Game 30 Jul 2026';
    expect(defaultRoundName(day, 'en-GB', [base])).toBe(`${base} (2)`);
    expect(defaultRoundName(day, 'en-GB', [base, `${base} (2)`])).toBe(`${base} (3)`);
    // Case and surrounding whitespace fold — a hand-typed duplicate still counts.
    expect(defaultRoundName(day, 'en-GB', ['  game 30 jul 2026 '])).toBe(`${base} (2)`);
    // Unrelated names, and blanks, are not in the way.
    expect(defaultRoundName(day, 'en-GB', ['Skins night', '', '   '])).toBe(base);
});
