// Format-templates Phase B — the curated game-card set.
//
// `FormatDescriptor.preset` is OPT-IN curation, not a capability gate: a
// format without one is still reachable through the wizard's add-a-format
// path. The whole set is asserted verbatim here so adding a builtin forces a
// deliberate in/out decision instead of silently changing the picker.

import { beforeEach, describe, expect, it } from 'bun:test';

import { clearFormats, formatCatalog } from './plugin';
import { registerBuiltInFormats } from './index';

beforeEach(() => {
    clearFormats();
    registerBuiltInFormats();
});

/** Curated cards, in the order a friendly Swedish group is offered them. */
const PRESET_ORDER = [
    'stableford_individual', // 1 — Poängbogey, the default friendly game
    'taliban_better_ball', // 2 — the group's signature 2v2
    'kopenhamnare_individual', // 3 — Köpenhamnare, the 3-ball game
    'stroke_play_individual', // 4 — Slagspel
    'match_play_individual', // 5 — Matchspel, 1v1
    'stableford_better_ball', // 6 — Bästboll poängbogey
    'umbrella_individual', // 7 — Umbrella
];

/**
 * Deliberately NOT offered as a card:
 *   - `match_play_better_ball` — same 2v2 better-ball shape as Taliban, which
 *     is the game this group actually names; two near-identical cards is worse
 *     curation than one.
 *   - `umbrella_4_ball` — the team variant of a card already offered, and it
 *     needs per-player GIR entry; niche enough to leave to add-a-format.
 */
const DELIBERATELY_EXCLUDED = ['match_play_better_ball', 'umbrella_4_ball'];

describe('curated presets', () => {
    it('every builtin is either curated in or deliberately excluded', () => {
        const all = formatCatalog().map((d) => d.id).sort();
        expect(all).toEqual([...PRESET_ORDER, ...DELIBERATELY_EXCLUDED].sort());
    });

    it('exactly the curated formats declare a preset, ordered by rank', () => {
        const offered = formatCatalog()
            .filter((d) => d.preset)
            .sort((a, b) => (a.preset!.rank ?? Infinity) - (b.preset!.rank ?? Infinity))
            .map((d) => d.id);
        expect(offered).toEqual(PRESET_ORDER);
    });

    it('the excluded formats declare no preset', () => {
        for (const id of DELIBERATELY_EXCLUDED) {
            expect(formatCatalog().find((d) => d.id === id)?.preset).toBeUndefined();
        }
    });

    it('ranks are unique so the card order is deterministic', () => {
        const ranks = formatCatalog()
            .filter((d) => d.preset)
            .map((d) => d.preset!.rank);
        expect(new Set(ranks).size).toBe(ranks.length);
    });

    it('every tagline is a short one-liner in both locales', () => {
        for (const d of formatCatalog()) {
            if (!d.preset) continue;
            const { en, sv } = d.preset.tagline;
            for (const line of [en, sv!]) {
                expect(line).toBeTruthy();
                expect(line.length).toBeLessThanOrEqual(70);
                expect(line).not.toContain('\n');
            }
        }
    });

    it('presets survive the JSON round-trip the descriptor contract requires', () => {
        const withPresets = formatCatalog().filter((d) => d.preset);
        expect(JSON.parse(JSON.stringify(withPresets))).toEqual(withPresets);
    });
});
