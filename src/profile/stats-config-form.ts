// The profile's Statistics section, as pure values (proposal
// `docs/proposals/player-stats.md` §3).
//
// Everything the section does that could be WRONG lives here rather than in
// the component, because the two rules worth testing — the dependency cascade
// and "master off preserves the module selection" — are decisions about a
// value, not about pixels. The component only draws and forwards taps.
//
// The invariant this module exists to hold: **it never builds a combination
// the server refuses.** `PlayerStatsService.putConfig` 409s on
// `shortGame && !putting` and on `recovery && !tee`, so turning a prerequisite
// OFF turns its dependent off in the SAME snapshot. The alternative — send it
// and let the 409 revert the switch — would make a legal tap look like a
// failure.
//
// Sibling of `../round/stat-prompts.ts` and `../round/advance-policy.ts`: data
// in, a decision out, no DOM and no signals, so
// `ios/TapScore/Features/Profile/StatsConfigForm.swift` is a line-for-line
// port and `tests/profile/stats-config-form.test.ts` is the spec both are
// written against.

import type { StatModules } from '../round/stat-prompts';

/**
 * One module row in the section. The order of this list IS the order of the
 * rows, and it is the capture order of `STAT_ORDER` with `approach` lifted
 * next to `tee` — the list then reads shot by shot (tee → green → putts → the
 * two conditional ones), which is how a player thinks about what to track.
 */
export type StatsModule = keyof StatModules;

export const STATS_MODULES: readonly StatsModule[] = [
    'tee',
    'approach',
    'putting',
    'shortGame',
    'penalties',
    'recovery',
];

/**
 * The whole section's state: the master switch plus the six module booleans.
 *
 * `enabled: false` is a real, stored state — the server keeps every module
 * boolean — so turning stats back on restores the selection rather than
 * starting from nothing.
 */
export interface StatsConfigForm extends StatModules {
    enabled: boolean;
}

/**
 * A player who has never configured anything. The server answers this same
 * shape for an absent row, so it is also what the section draws before the
 * first PUT.
 */
export const STATS_ALL_OFF: StatsConfigForm = {
    enabled: false,
    tee: false,
    approach: false,
    putting: false,
    shortGame: false,
    penalties: false,
    recovery: false,
};

/**
 * The row label. Plain golf words, no wire spelling — `approach` is the column
 * name, "Greens in regulation" is the thing being counted.
 */
export function statsModuleTitle(module: StatsModule): string {
    switch (module) {
        case 'tee':
            return 'Tee shots';
        case 'approach':
            return 'Greens in regulation';
        case 'putting':
            return 'Putting';
        case 'shortGame':
            return 'Short game';
        case 'penalties':
            return 'Penalties';
        case 'recovery':
            return 'Recovery';
    }
}

/**
 * One clause about what the module asks for, in the tone of the profile's other
 * hints: what it costs you on the hole, not what it derives later.
 */
export function statsModuleHint(module: StatsModule): string {
    switch (module) {
        case 'tee':
            return 'Fairway, in play or trouble — asked on par 4s and 5s.';
        case 'approach':
            return 'Did the ball hit the green in regulation.';
        case 'putting':
            return 'How long the first putt was, and how many you took.';
        case 'shortGame':
            return 'Standard or hard, asked only when you missed the green.';
        case 'penalties':
            return 'How many penalty strokes the hole cost you.';
        case 'recovery':
            return 'Whether the recovery shot got you back in play.';
    }
}

/**
 * The master switch's hint. It says the two things a player cannot infer from a
 * switch: that answering happens DURING a round, and that turning it off keeps
 * the module picks (spec §3 — the master exists so "off" is not "start over").
 */
export const STATS_MASTER_TITLE = 'Track statistics';
export const STATS_MASTER_HINT =
    'Adds a few taps per hole while you score — turn it off any time, your picks are kept.';

/**
 * The module this one cannot be read without — spec §1.3 and §1.5, the same
 * two rules `putConfig` refuses on.
 *
 * Short game needs putting because the short-game OUTCOME is the following
 * first-putt bucket; recovery needs tee because its trigger is a trouble tee
 * shot. Neither is a UI preference: a PUT that violates one is a 409.
 */
export function statsModuleRequires(module: StatsModule): StatsModule | null {
    switch (module) {
        case 'shortGame':
            return 'putting';
        case 'recovery':
            return 'tee';
        default:
            return null;
    }
}

export function statsIsOn(form: StatsConfigForm, module: StatsModule): boolean {
    return form[module];
}

/**
 * A row the player cannot act on: either the master switch is off, or the
 * module's prerequisite is.
 *
 * Note what this does NOT do: it never reads `false` for a locked module. A
 * locked row keeps showing its stored value, because the value is still what
 * the server holds — only the tap is unavailable.
 */
export function statsIsLocked(form: StatsConfigForm, module: StatsModule): boolean {
    if (!form.enabled) return true;
    const required = statsModuleRequires(module);
    if (required === null) return false;
    return !statsIsOn(form, required);
}

/**
 * The annotation the row shows, or null when the row is actionable. Only an
 * unmet dependency is worth wording — "the master switch is off" is already
 * said by the master switch. Words, never an emoji: the annotation has to say
 * WHICH module is missing, and a warning triangle cannot.
 */
export function statsAnnotation(form: StatsConfigForm, module: StatsModule): string | null {
    if (!form.enabled) return null;
    const required = statsModuleRequires(module);
    if (required === null || statsIsOn(form, required)) return null;
    return `Needs ${statsModuleTitle(required)}`;
}

/**
 * The result of one toggle tap, dependencies repaired.
 *
 * Repaired in ONE direction only: turning a prerequisite off drags its
 * dependent down with it (the server would refuse the pair), but turning a
 * prerequisite ON never turns a dependent on — nobody asked for that module,
 * and silently enabling prompts is exactly what the server's "refuse, never
 * repair" rule protects against.
 */
export function statsSetting(
    form: StatsConfigForm,
    module: StatsModule,
    on: boolean,
): StatsConfigForm {
    return repairDependencies({ ...form, [module]: on });
}

/**
 * The master switch. Module booleans are untouched on purpose — that is the
 * whole reason the master exists (spec §3: "Master toggle satisfies 'completely
 * turn off' without losing the module selection").
 */
export function statsSettingEnabled(form: StatsConfigForm, on: boolean): StatsConfigForm {
    return { ...form, enabled: on };
}

function repairDependencies(form: StatsConfigForm): StatsConfigForm {
    const next = { ...form };
    if (!next.putting) next.shortGame = false;
    if (!next.tee) next.recovery = false;
    return next;
}

/**
 * A server config (`PlayerStatsConfig`, which also carries `playerId` and
 * `updatedAt`) narrowed to the switches the section owns — and, in the other
 * direction, exactly what goes on the wire: the endpoint is whole-config, there
 * is no per-module PATCH, so every tap sends the complete snapshot and the
 * snapshot IS the form. One function, so a new module cannot be added to half of
 * it, and the field list is `STATS_MODULES` rather than a second hand-written
 * copy of it.
 */
export function statsFormFromConfig(config: StatsConfigForm): StatsConfigForm {
    const out = { ...STATS_ALL_OFF, enabled: config.enabled };
    for (const module of STATS_MODULES) out[module] = config[module];
    return out;
}
