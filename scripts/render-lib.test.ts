import { expect, test } from 'bun:test';
import { registerBuiltInFormats } from '../server/domain/formats';
import { formatSlotSummary } from './render-lib';

test('formatSlotSummary labels a slot from the registered descriptor', () => {
    registerBuiltInFormats();
    expect(
        formatSlotSummary({
            scoringMode: 'umbrella',
            teamShape: 'individual',
            allowanceConfig: { type: 'flat', pct: 100 },
        }),
    ).toBe('Umbrella @ 100%');
    expect(
        formatSlotSummary({
            scoringMode: 'match_play',
            teamShape: 'individual',
            allowanceConfig: { type: 'flat', pct: 90 },
        }),
    ).toBe('Match play @ 90%');
});

test('formatSlotSummary renders a non-flat split allowance label', () => {
    registerBuiltInFormats();
    expect(
        formatSlotSummary({
            scoringMode: 'stableford',
            teamShape: 'better_ball',
            allowanceConfig: {
                type: 'split',
                bands: [
                    { upToCh: 9, pct: 100 },
                    { upToCh: null, pct: 75 },
                ],
            },
        }),
    ).toBe('Better-ball Stableford @ split (≤9: 100%, else 75%)');
});

test('formatSlotSummary falls back to a humanised key for an unknown format', () => {
    expect(
        formatSlotSummary({
            scoringMode: 'made_up',
            teamShape: 'solo',
            allowanceConfig: { type: 'flat', pct: 90 },
        }),
    ).toBe('Made Up × Solo @ 90%');
});
