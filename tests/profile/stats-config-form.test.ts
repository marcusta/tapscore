import { describe, expect, test } from 'bun:test';
import {
    STATS_ALL_OFF,
    STATS_MODULES,
    statsAnnotation,
    statsFormFromConfig,
    statsIsLocked,
    statsIsOn,
    statsModuleTitle,
    statsSetting,
    statsSettingEnabled,
    type StatsConfigForm,
} from '../../src/profile/stats-config-form';

// ===========================================================================
// PROFILE STATISTICS SECTION — EXECUTABLE SPECIFICATION
// ---------------------------------------------------------------------------
// The section's decisions, without a component or a server. Written case-for-
// case against `ios/TapScoreTests/Profile/StatsConfigFormTests.swift` so the
// two clients cannot drift.
//
// The two rules worth pinning are the ones the server enforces with a 409:
// short game cannot outlive putting, recovery cannot outlive tee. The client
// mirrors them so a legal tap never becomes a failed request — and the mirror
// is ONE-directional, which is the other half of the contract.
//
// Vocabulary:
//   master      = the `enabled` switch; off locks every row without clearing it
//   locked      = the row cannot be tapped (master off, or prerequisite off)
//   annotation  = the worded unmet dependency, e.g. "Needs Putting"
// ===========================================================================

function form(over: Partial<StatsConfigForm> = {}): StatsConfigForm {
    return {
        enabled: true,
        tee: false,
        approach: false,
        putting: false,
        shortGame: false,
        penalties: false,
        recovery: false,
        ...over,
    };
}

describe('shape', () => {
    test('the wire snapshot carries every switch', () => {
        const input = statsFormFromConfig(
            form({ enabled: true, tee: true, putting: true, shortGame: true }),
        );

        expect(input).toEqual({
            enabled: true,
            tee: true,
            approach: false,
            putting: true,
            shortGame: true,
            penalties: false,
            recovery: false,
        });
    });

    test('a server config becomes the form it describes', () => {
        // The extra `playerId`/`updatedAt` the endpoint answers with are dropped:
        // the section owns seven booleans and nothing else.
        const config = {
            playerId: 'p-1',
            enabled: true,
            tee: true,
            approach: false,
            putting: true,
            shortGame: true,
            penalties: false,
            recovery: true,
            updatedAt: '2026-07-29T09:00:00.000Z',
        };

        expect(statsFormFromConfig(config)).toEqual(
            form({ enabled: true, tee: true, putting: true, shortGame: true, recovery: true }),
        );
    });

    test('the module rows are in capture order', () => {
        expect(STATS_MODULES.map(statsModuleTitle)).toEqual([
            'Tee shots',
            'Greens in regulation',
            'Putting',
            'Short game',
            'Penalties',
            'Recovery',
        ]);
    });
});

describe('dependencies', () => {
    test('a dependent is locked and annotated while its prerequisite is off', () => {
        const f = form({ enabled: true });

        expect(statsIsLocked(f, 'shortGame')).toBe(true);
        expect(statsAnnotation(f, 'shortGame')).toBe('Needs Putting');
        expect(statsIsLocked(f, 'recovery')).toBe(true);
        expect(statsAnnotation(f, 'recovery')).toBe('Needs Tee shots');
        // The four with no prerequisite are actionable and say nothing.
        for (const module of ['tee', 'approach', 'putting', 'penalties'] as const) {
            expect(statsIsLocked(f, module)).toBe(false);
            expect(statsAnnotation(f, module)).toBeNull();
        }
    });

    test('a met prerequisite unlocks its dependent and drops the annotation', () => {
        const f = form({ enabled: true, tee: true, putting: true });

        expect(statsIsLocked(f, 'shortGame')).toBe(false);
        expect(statsAnnotation(f, 'shortGame')).toBeNull();
        expect(statsIsLocked(f, 'recovery')).toBe(false);
        expect(statsAnnotation(f, 'recovery')).toBeNull();
    });

    /**
     * THE RULE THIS MODULE EXISTS FOR: the pair the server 409s on is never
     * built. Turning the prerequisite off takes the dependent with it.
     */
    test('turning a prerequisite off takes its dependent down', () => {
        const start = form({
            enabled: true,
            tee: true,
            putting: true,
            shortGame: true,
            recovery: true,
        });

        const withoutPutting = statsSetting(start, 'putting', false);
        expect(withoutPutting.shortGame).toBe(false);
        expect(withoutPutting.recovery).toBe(true); // the other pair is untouched

        const withoutTee = statsSetting(start, 'tee', false);
        expect(withoutTee.recovery).toBe(false);
        expect(withoutTee.shortGame).toBe(true); // the other pair is untouched
    });

    /**
     * And the mirror is ONE-directional. Enabling putting must not enable short
     * game: nobody asked for it, and the server's own rule is "refuse, never
     * repair" for exactly this reason.
     */
    test('turning a prerequisite on leaves its dependent alone', () => {
        const next = statsSetting(form({ enabled: true }), 'putting', true);

        expect(next.putting).toBe(true);
        expect(next.shortGame).toBe(false);
        expect(statsIsLocked(next, 'shortGame')).toBe(false); // but it is now actionable
    });

    test('a dependent can be turned on once its prerequisite is', () => {
        const next = statsSetting(form({ enabled: true, putting: true }), 'shortGame', true);

        expect(next.shortGame).toBe(true);
        expect(next.putting).toBe(true);
    });
});

describe('master switch', () => {
    /**
     * Spec §3: `enabled: false` preserves the module selection. The rows go
     * dead, the values stay — turning stats back on is not starting over.
     */
    test('the master switch locks every row without clearing it', () => {
        const on = form({
            enabled: true,
            tee: true,
            putting: true,
            shortGame: true,
            recovery: true,
        });

        const off = statsSettingEnabled(on, false);

        expect(off.enabled).toBe(false);
        expect(off.tee).toBe(true);
        expect(off.shortGame).toBe(true);
        expect(off.recovery).toBe(true);
        expect(STATS_MODULES.every((m) => statsIsLocked(off, m))).toBe(true);
        expect(statsSettingEnabled(off, true)).toEqual(on); // and back again, unchanged
    });

    /**
     * A locked row still reports its stored value. `statsIsOn` is what the
     * server holds; `statsIsLocked` is only about the tap.
     */
    test('a locked row still shows its stored value', () => {
        const off = form({ enabled: false, tee: true, putting: true, shortGame: true });

        expect(statsIsOn(off, 'shortGame')).toBe(true);
        expect(statsIsLocked(off, 'shortGame')).toBe(true);
        // While the master is off, an unmet-dependency annotation would be a
        // second explanation for a state the master switch already explains.
        expect(statsAnnotation(STATS_ALL_OFF, 'shortGame')).toBeNull();
    });

    test('the default is everything off', () => {
        expect(STATS_ALL_OFF).toEqual(form({ enabled: false }));
        expect(STATS_MODULES.every((m) => !statsIsOn(STATS_ALL_OFF, m))).toBe(true);
    });
});
