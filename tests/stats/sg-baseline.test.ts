import { expect, test } from 'bun:test';
import {
    choiceHint,
    choiceLabel,
    cohortLabel,
    DEFAULT_SG_BASELINE_INFO,
    FALLBACK_SG_CHOICE,
    formatHandicap,
    loadSgChoice,
    resolveCohort,
    saveSgChoice,
    SG_BASELINE_CHOICES,
    sgBaselineInfo,
} from '../../src/stats/sg-baseline';
import {
    expectedOnParSeventyTwo,
    SG_BASELINES_V1,
    SG_COHORTS,
    type SgCohort,
} from '../../src/round/stat-measures';
import type { DeviceStorage } from '../../src/device-store';

// The app-side half of the handicap cohorts: the stored choice, the words a
// player reads, and the resolution from a choice plus a handicap to a tier. The
// tables themselves are covered in `tests/round/stat-measures.test.ts`.
//
// Twin of the cohort cases in `ios/TapScoreTests/Stats/StatsWindowTests.swift`.

/**
 * One key's worth of storage — the same fake `stats-window.test.ts` uses, plus
 * the key it was asked for, because the key is a CONTRACT with the iOS twin and
 * a typo in it would otherwise pass green on both sides separately.
 */
function memStorage(seed?: string): DeviceStorage & { value: string | null; keys: string[] } {
    return {
        value: seed ?? null,
        keys: [],
        getItem(key: string) {
            this.keys.push(key);
            return this.value;
        },
        setItem(key: string, v: string) {
            this.keys.push(key);
            this.value = v;
        },
    };
}

// --- The picker's vocabulary -------------------------------------------------

test('the picker offers the auto mode first, then the four tiers', () => {
    expect(SG_BASELINE_CHOICES).toEqual(['auto', 'scratch', 'hcp5', 'hcp12', 'hcp20']);
    expect(FALLBACK_SG_CHOICE).toBe('auto');
    expect(SG_BASELINE_CHOICES.map(choiceLabel)).toEqual([
        'Match my handicap',
        'Scratch',
        '5 handicap',
        '12 handicap',
        '20+ handicap',
    ]);
    // Words, never shorthand: no raw cohort key reaches a screen.
    for (const cohort of SG_COHORTS) expect(cohortLabel(cohort)).not.toContain('hcp');
});

test('a plus handicap reads as a plus, everywhere', () => {
    expect(formatHandicap(12)).toBe('12.0');
    expect(formatHandicap(2.45)).toBe('2.5');
    expect(formatHandicap(-1.4)).toBe('+1.4');
    expect(formatHandicap(0)).toBe('0.0');
});

// The hint under the picker says what the setting DOES for this reader — the
// tier their own index lands on — so choosing does not require knowing the
// boundaries.
test('the picker hint quotes the reader’s own handicap under the auto mode', () => {
    expect(choiceHint('auto', 6)).toBe('Your 6.0 handicap puts you on the 5 handicap reference.');
    expect(choiceHint('auto', -1.4)).toBe('Your +1.4 handicap puts you on the Scratch reference.');
    expect(choiceHint('auto', null)).toBe(
        'No handicap on your profile yet, so this uses the 12 handicap reference.',
    );
});

// A tier answers in the only unit a golfer can check themselves against, and
// the number is DERIVED from that tier's own table — nobody types it, so it
// cannot drift when a table is recalibrated. It also never quotes a handicap
// the fixed choice ignores.
test('a fixed tier says what it scores on a par 72, derived from its own table', () => {
    const shots = (choice: SgCohort) => {
        const hint = choiceHint(choice, 6);
        expect(hint).toMatch(/^About \d+ shots on a par 72\.$/);
        expect(hint).not.toContain('6.0');
        return Number(hint.match(/\d+/)![0]);
    };
    // Same order as the tiers, and the arithmetic is the conventional par-72
    // layout: 4 par-3s, 10 par-4s, 4 par-5s.
    expect(SG_COHORTS.map(shots)).toEqual(
        SG_COHORTS.map((c) => expectedOnParSeventyTwo(SG_BASELINES_V1[c].tables)),
    );
    expect(shots('scratch')).toBeLessThan(shots('hcp5'));
    expect(shots('hcp5')).toBeLessThan(shots('hcp12'));
    expect(shots('hcp12')).toBeLessThan(shots('hcp20'));
});

// --- Resolution --------------------------------------------------------------

test('auto follows the handicap; a fixed choice ignores it', () => {
    expect(resolveCohort('auto', 6)).toBe('hcp5');
    expect(resolveCohort('auto', 30)).toBe('hcp20');
    expect(resolveCohort('auto', -2)).toBe('scratch');
    for (const cohort of SG_COHORTS) {
        expect(resolveCohort(cohort, 30)).toBe(cohort);
        expect(resolveCohort(cohort, null)).toBe(cohort);
    }
});

// A screen drawn before the profile lands must show TODAY'S baseline and then
// settle, not nothing and not a guess.
test('an unloaded profile resolves as the shipping tier', () => {
    expect(resolveCohort('auto', null)).toBe('hcp12');
    expect(DEFAULT_SG_BASELINE_INFO).toEqual({
        cohort: 'hcp12',
        choice: 'auto',
        handicapIndex: null,
    });
});

test('sgBaselineInfo carries the choice and the handicap it resolved with', () => {
    expect(sgBaselineInfo('auto', 6)).toEqual({
        cohort: 'hcp5',
        choice: 'auto',
        handicapIndex: 6,
    });
    // The handicap rides along even when it was not used — the sheet needs to
    // know it was IGNORED, which is a different sentence from "absent".
    expect(sgBaselineInfo('scratch', 6)).toEqual({
        cohort: 'scratch',
        choice: 'scratch',
        handicapIndex: 6,
    });
});

// --- Persistence -------------------------------------------------------------

test('the choice round-trips as a bare string under the key iOS also writes', () => {
    for (const choice of SG_BASELINE_CHOICES) {
        const storage = memStorage();
        saveSgChoice(choice, storage);
        expect(storage.value).toBe(choice);
        expect(loadSgChoice(storage)).toBe(choice);
        // Pinned as a literal on both clients: the two suites can only agree
        // about the key by both naming it.
        expect(new Set(storage.keys)).toEqual(new Set(['tapscore.stats.sgBaseline.v1']));
    }
});

test('an absent, empty or unknown value reads as auto', () => {
    expect(loadSgChoice(memStorage())).toBe('auto');
    expect(loadSgChoice(memStorage(''))).toBe('auto');
    // A tier renamed, or a key written by a newer build: `auto` is the setting
    // that cannot be wrong for the reader.
    expect(loadSgChoice(memStorage('hcp7'))).toBe('auto');
    expect(loadSgChoice(memStorage('{"choice":"scratch"}'))).toBe('auto');
});

test('no storage at all is not an error', () => {
    expect(loadSgChoice(null)).toBe('auto');
    expect(() => saveSgChoice('hcp20', null)).not.toThrow();
});
