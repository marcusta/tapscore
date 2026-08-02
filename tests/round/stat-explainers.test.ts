import { expect, test } from 'bun:test';
import { STAT_EXPLAINERS, statExplainer, STAT_CAPTURE_COPY } from '../../src/round/stat-explainers';
import { STAT_ORDER, type StatEventKey } from '../../src/round/stat-prompts';

// The capture step's copy table, held to the same standard as the prompt model
// it explains: one paragraph per key, no key without one, no key the prompt
// model does not have. Twin of `ios/TapScoreTests/Domain/StatExplainersTests.swift`,
// which asserts the same keys and the same strings.

test('every prompt key has an explainer, and no key is invented', () => {
    expect(Object.keys(STAT_EXPLAINERS).sort()).toEqual([...STAT_ORDER].sort());
});

test('the explainers are in prompt order', () => {
    expect(Object.keys(STAT_EXPLAINERS)).toEqual([...STAT_ORDER]);
});

test('no explainer is empty, and none shouts at the reader', () => {
    for (const key of STAT_ORDER) {
        const text = statExplainer(key);
        expect(text.length).toBeGreaterThan(20);
        expect(text.trim()).toBe(text);
        // Owner ruling: plain words. No glyph annotations, no jargon.
        expect(text).not.toMatch(/strokes gained/i);
        expect(text).not.toMatch(/[✓✗→⚑]/u);
    }
});

// The house vocabulary for the new prompts, pinned so a reword has to be
// deliberate on both platforms.
test('the new prompts explain their own vocabulary', () => {
    expect(statExplainer('tee_miss_dir')).toContain('side');
    expect(statExplainer('green_miss_dir')).toContain('Long is past the flag');
    expect(statExplainer('short_game_difficulty')).toContain('Bunker is sand');
    expect(statExplainer('short_game_strokes')).toContain('already filled in');
    expect(statExplainer('penalty_source')).toContain('Which shot cost you the stroke');
});

test('the capture chrome copy is complete', () => {
    for (const value of Object.values(STAT_CAPTURE_COPY)) {
        expect(value.length).toBeGreaterThan(0);
    }
    expect(STAT_CAPTURE_COPY.explainerTrigger).toBe('What these mean');
    // The two disagree lines say which way the score reads, never which answer
    // is "right": the stored answer stands until the golfer changes it.
    expect(STAT_CAPTURE_COPY.girDisagreeMiss).toContain('missed');
    expect(STAT_CAPTURE_COPY.girDisagreeHit).toContain('hit');
    for (const line of [STAT_CAPTURE_COPY.girDisagreeMiss, STAT_CAPTURE_COPY.girDisagreeHit]) {
        expect(line).toContain('leave it');
    }
});

// A guard against the table drifting into a `Record<string, string>`: the type
// is keyed by the union, so an unknown key is a compile error and a missing one
// is caught above.
test('the table is keyed by the prompt union', () => {
    const key: StatEventKey = 'gir';
    expect(STAT_EXPLAINERS[key]).toBe(statExplainer('gir'));
});
