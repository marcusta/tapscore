import { expect, test } from 'bun:test';
import { registerBuiltInFormats } from '../server/domain/formats';
import { formatSlotSummary } from './render-lib';

test('formatSlotSummary labels a slot from the registered descriptor', () => {
    registerBuiltInFormats();
    expect(
        formatSlotSummary({
            scoringMode: 'umbrella',
            teamShape: 'individual',
            allowancePct: 100,
        }),
    ).toBe('Umbrella @ 100%');
    expect(
        formatSlotSummary({
            scoringMode: 'stroke_play',
            teamShape: 'foursomes',
            allowancePct: 50,
        }),
    ).toBe('Foursomes @ 50%');
});

test('formatSlotSummary falls back to a humanised key for an unknown format', () => {
    expect(
        formatSlotSummary({ scoringMode: 'made_up', teamShape: 'solo', allowancePct: 90 }),
    ).toBe('Made Up × Solo @ 90%');
});
