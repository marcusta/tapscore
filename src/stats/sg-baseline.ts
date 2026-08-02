// Which handicap cohort the strokes-gained-lite attribution is measured
// against (`docs/proposals/strokes-gained-lite.md`, "Handicap cohorts").
//
// The tables themselves live in `src/round/stat-measures.ts`, which has no
// runtime imports because it is ported line for line to Swift. THIS file is the
// app-side half: the stored choice, the words a player reads, and the one
// function that turns a choice plus a handicap into a cohort. Keep the pure
// math there and the product decisions here.
//
// Twin of `ios/TapScore/Features/Stats/SgBaseline.swift`.

import { defaultStorage, deviceStore, type DeviceStorage } from '../device-store';
import {
    cohortForHandicap,
    expectedOnParSeventyTwo,
    SG_BASELINES_V1,
    SG_COHORTS,
    type SgCohort,
} from '../round/stat-measures';

/**
 * What the player picked in Filters: a fixed tier, or `auto` — "match my
 * handicap", which re-resolves as their index moves.
 */
export type SgBaselineChoice = 'auto' | SgCohort;

/**
 * Picker order: the auto mode first, then the four tiers easiest to hardest.
 *
 * `auto` leads because it is the answer for almost everybody — the tier list
 * below it is for the player who wants to see their game against a standard
 * that is not their own.
 */
export const SG_BASELINE_CHOICES: readonly SgBaselineChoice[] = ['auto', ...SG_COHORTS];

/**
 * The default: follow the handicap. A player who never opens Filters is
 * measured against the tier that fits them, and a player with no handicap on
 * file is measured against `hcp12` — exactly what every reading in the app
 * meant before cohorts existed.
 */
export const FALLBACK_SG_CHOICE: SgBaselineChoice = 'auto';

/**
 * A cohort's name, in the words both clients use. No "scr"/"hcp5" shorthand
 * reaches a screen, and no symbol stands in for a word.
 */
export function cohortLabel(cohort: SgCohort): string {
    switch (cohort) {
        case 'scratch':
            return 'Scratch';
        case 'hcp5':
            return '5 handicap';
        case 'hcp12':
            return '12 handicap';
        case 'hcp20':
            return '20+ handicap';
    }
}

/** The picker row's label — the tiers by name, plus the auto mode. */
export function choiceLabel(choice: SgBaselineChoice): string {
    return choice === 'auto' ? 'Match my handicap' : cohortLabel(choice);
}

/**
 * The muted line under the picker: what the choice MEANS for this reader.
 *
 * A tier answers in the only unit a golfer can check themselves against — a
 * score on a par 72, DERIVED from that tier's own table, so it cannot drift out
 * of step with the numbers it describes. The auto row instead says which tier
 * the reader's own index lands on, so choosing between the rows never requires
 * knowing where the boundaries are.
 */
export function choiceHint(choice: SgBaselineChoice, handicapIndex: number | null): string {
    if (choice !== 'auto') {
        return `About ${expectedOnParSeventyTwo(SG_BASELINES_V1[choice].tables)} shots on a par 72.`;
    }
    if (handicapIndex === null) {
        return `No handicap on your profile yet, so this uses the ${cohortLabel('hcp12')} reference.`;
    }
    return `Your ${formatHandicap(handicapIndex)} handicap puts you on the ${cohortLabel(
        cohortForHandicap(handicapIndex),
    )} reference.`;
}

/**
 * A handicap index as it is written everywhere else in the app: one decimal,
 * and a plus handicap reads `+2.0`, not `-2.0`.
 */
export function formatHandicap(index: number): string {
    return index < 0 ? `+${(-index).toFixed(1)}` : index.toFixed(1);
}

/**
 * The tier a choice resolves to.
 *
 * `auto` defers to the handicap, and a missing handicap — no index on the
 * profile, or a profile that has not loaded yet — resolves to `hcp12` through
 * `cohortForHandicap`. A screen drawn before the profile arrives therefore
 * shows today's baseline and then settles, rather than showing nothing.
 */
export function resolveCohort(choice: SgBaselineChoice, handicapIndex: number | null): SgCohort {
    return choice === 'auto' ? cohortForHandicap(handicapIndex) : choice;
}

/**
 * Everything the info sheet needs to say WHICH tier is in force and WHY: the
 * resolved cohort, the setting that produced it, and the handicap the auto mode
 * matched. Carried as one value so a caller cannot pass a cohort from one
 * reading and a handicap from another.
 */
export interface SgBaselineInfo {
    readonly cohort: SgCohort;
    readonly choice: SgBaselineChoice;
    readonly handicapIndex: number | null;
}

/**
 * What a caller with no resolved choice to hand gets: the shipping tier, chosen
 * the way an unresolved `auto` chooses it. Never a claim about the reader —
 * `sgBaselineInfo` is what a screen with a service behind it passes.
 */
export const DEFAULT_SG_BASELINE_INFO: SgBaselineInfo = Object.freeze({
    cohort: cohortForHandicap(null),
    choice: FALLBACK_SG_CHOICE,
    handicapIndex: null,
});

/** Resolve a choice + handicap into the sheet's whole story about the tier. */
export function sgBaselineInfo(
    choice: SgBaselineChoice,
    handicapIndex: number | null,
): SgBaselineInfo {
    return { cohort: resolveCohort(choice, handicapIndex), choice, handicapIndex };
}

function isChoice(raw: string): raw is SgBaselineChoice {
    return (SG_BASELINE_CHOICES as readonly string[]).includes(raw);
}

// Stored as the bare choice string under the SAME key iOS uses, the way
// `tapscore.stats.window.v1` is. An unknown value — a tier renamed, a key
// written by a newer build — decodes to `auto`, which is the setting that
// cannot be wrong for the reader.
const store = deviceStore<SgBaselineChoice>('tapscore.stats.sgBaseline.v1', {
    decode: (raw) => (isChoice(raw) ? raw : FALLBACK_SG_CHOICE),
    encode: (choice) => choice,
    empty: FALLBACK_SG_CHOICE,
});

/** Read the saved baseline choice; `auto` when absent or unreadable. */
export function loadSgChoice(storage: DeviceStorage | null = defaultStorage()): SgBaselineChoice {
    return store.read(storage);
}

/** Persist the baseline choice. A storage failure is swallowed (best-effort). */
export function saveSgChoice(
    choice: SgBaselineChoice,
    storage: DeviceStorage | null = defaultStorage(),
): void {
    store.write(choice, storage);
}
