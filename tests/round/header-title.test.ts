import { expect, test } from 'bun:test';
import { roundHeaderTitle } from '../../src/round/header-title';

// The header's headline. The name wins when there is one; otherwise the round's
// date, rendered in the READER's locale (a shared round must not show a Swedish
// date to an American phone).

test('the round name is the headline when it has one', () => {
    expect(roundHeaderTitle({ name: 'Friday four-ball', date: '2026-07-30' }, 'en-GB')).toBe(
        'Friday four-ball',
    );
    // A blank name is no name.
    expect(roundHeaderTitle({ name: '   ', date: '2026-07-30' }, 'en-GB')).toBe('30 Jul 2026');
});

test('an unnamed round falls back to its date in the reader locale', () => {
    expect(roundHeaderTitle({ name: null, date: '2026-07-30' }, 'en-GB')).toBe('30 Jul 2026');
    expect(roundHeaderTitle({ name: null, date: '2026-07-30' }, 'sv-SE')).toBe('30 juli 2026');
    // No round at all, and a date that isn't yyyy-MM-dd, still owe a label.
    expect(roundHeaderTitle(null, 'en-GB')).toBe('Round');
    expect(roundHeaderTitle({ name: null, date: '' }, 'en-GB')).toBe('Round');
});
