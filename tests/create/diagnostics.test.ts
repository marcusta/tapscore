import { expect, test, describe } from 'bun:test';
import type { CompilerDiagnostic } from '../../src/api/friendly-rounds.gen';
import {
    slotIndexFromPath,
    formatIndexFromPath,
    formatCardIndexOf,
    diagnosticsForFormatCard,
    generalDiagnostics,
    humanizeDiagnostic,
} from '../../src/create/diagnostics';

// Pure presenter for create-flow diagnostics (Phase 3). Covers (a) the
// slot-N ⇔ formats[N] re-bucketing, (b) humanization per code, (c) the raw
// fallback for unknown codes / missing structured fields.

// A label resolver standing in for the catalog's locale-aware labelOf.
const LABELS: Record<string, string> = {
    stableford_better_ball: 'Better-ball Stableford',
    match_play_better_ball: 'Better-ball match play',
    taliban_better_ball: 'Taliban',
};
const label = (id: string): string | null => LABELS[id] ?? null;

describe('path bucketing', () => {
    test('slotIndexFromPath extracts N from slots[slot-N]…', () => {
        expect(slotIndexFromPath('slots[slot-0].teamGrouping')).toBe(0);
        expect(slotIndexFromPath('slots[slot-3]')).toBe(3);
        expect(slotIndexFromPath('slots[slot-12].allowanceConfig')).toBe(12);
        expect(slotIndexFromPath('formats[1].teams')).toBeNull();
        expect(slotIndexFromPath('producers[2]')).toBeNull();
        expect(slotIndexFromPath(undefined)).toBeNull();
    });

    test('formatIndexFromPath extracts N from formats[N]…', () => {
        expect(formatIndexFromPath('formats[0].formatId')).toBe(0);
        expect(formatIndexFromPath('formats[2].teams')).toBe(2);
        expect(formatIndexFromPath('slots[slot-1]')).toBeNull();
        expect(formatIndexFromPath(undefined)).toBeNull();
    });

    test('formatCardIndexOf folds slot-scoped paths onto the format card', () => {
        expect(formatCardIndexOf({ code: 'x', message: '', path: 'slots[slot-1].teamGrouping' })).toBe(1);
        expect(formatCardIndexOf({ code: 'x', message: '', path: 'formats[1].teams' })).toBe(1);
        expect(formatCardIndexOf({ code: 'x', message: '', path: 'producers[0]' })).toBeNull();
        expect(formatCardIndexOf({ code: 'x', message: '', path: undefined })).toBeNull();
    });

    test('diagnosticsForFormatCard collects both formats[i] and slots[slot-i]', () => {
        const all: CompilerDiagnostic[] = [
            { code: 'a', message: '', path: 'formats[0].formatId' },
            { code: 'b', message: '', path: 'slots[slot-0].teamGrouping' },
            { code: 'c', message: '', path: 'slots[slot-1].teamGrouping' },
            { code: 'd', message: '', path: 'producers[0]' },
        ];
        expect(diagnosticsForFormatCard(all, 0).map((d) => d.code)).toEqual(['a', 'b']);
        expect(diagnosticsForFormatCard(all, 1).map((d) => d.code)).toEqual(['c']);
    });

    test('generalDiagnostics excludes producer, group, and any format-attributable path', () => {
        const all: CompilerDiagnostic[] = [
            { code: 'card', message: '', path: 'formats[0].formatId' },
            { code: 'slot', message: '', path: 'slots[slot-2].teamGrouping' },
            { code: 'player', message: '', path: 'producers[0]' },
            { code: 'group', message: '', path: 'playingGroups[1].members' },
            { code: 'gen', message: 'no formats', path: 'formats' }, // bare 'formats' (no index) → general
            { code: 'genNoPath', message: 'boom' },
        ];
        expect(generalDiagnostics(all).map((d) => d.code).sort()).toEqual(['gen', 'genNoPath']);
    });
});

describe('humanizeDiagnostic', () => {
    test('team_size_above_max → the reported scenario, human-readable', () => {
        const d: CompilerDiagnostic = {
            code: 'team_size_above_max',
            message: `slot 'slot-0' team 'Team A' has 3 balls; format 'stableford_better_ball' allows max 2`,
            path: 'slots[slot-0].teamGrouping',
            formatId: 'stableford_better_ball',
            teamLabel: 'Team A',
            actual: 3,
            allowedMax: 2,
        };
        expect(humanizeDiagnostic(d, label)).toBe(
            'Team A has 3 players — Better-ball Stableford allows at most 2 per team.',
        );
    });

    test('team_size_below_min uses the min bound', () => {
        const d: CompilerDiagnostic = {
            code: 'team_size_below_min',
            message: 'raw',
            formatId: 'stableford_better_ball',
            teamLabel: 'Team B',
            actual: 1,
            allowedMin: 2,
        };
        expect(humanizeDiagnostic(d, label)).toBe(
            'Team B has 1 player — Better-ball Stableford needs at least 2 per team.',
        );
    });

    test('team_count_above_max', () => {
        const d: CompilerDiagnostic = {
            code: 'team_count_above_max',
            message: 'raw',
            formatId: 'taliban_better_ball',
            actual: 3,
            allowedMax: 2,
        };
        expect(humanizeDiagnostic(d, label)).toBe('3 teams — Taliban allows at most 2.');
    });

    test('empty_team_grouping', () => {
        const d: CompilerDiagnostic = {
            code: 'empty_team_grouping',
            message: 'raw',
            formatId: 'stableford_better_ball',
            teamLabel: 'Team C',
            actual: 0,
        };
        expect(humanizeDiagnostic(d, label)).toBe(
            'Team C has no players — add at least one, or remove the team.',
        );
    });

    test('slot_ball_count_above_max / below_min', () => {
        const over: CompilerDiagnostic = {
            code: 'slot_ball_count_above_max',
            message: 'raw',
            formatId: 'match_play_better_ball',
            actual: 22,
            allowedMax: 20,
        };
        expect(humanizeDiagnostic(over, label)).toBe(
            '22 players in Better-ball match play — it scores at most 20.',
        );
        const under: CompilerDiagnostic = {
            code: 'slot_ball_count_below_min',
            message: 'raw',
            formatId: 'match_play_better_ball',
            actual: 3,
            allowedMin: 4,
        };
        expect(humanizeDiagnostic(under, label)).toBe(
            '3 players in Better-ball match play — it needs at least 4.',
        );
    });

    test('missing_team_grouping', () => {
        const d: CompilerDiagnostic = {
            code: 'missing_team_grouping',
            message: 'raw',
            formatId: 'stableford_better_ball',
            path: 'slots[slot-0].teamGrouping',
        };
        expect(humanizeDiagnostic(d, label)).toBe(
            'Better-ball Stableford needs its players grouped into teams — tick the teams it scores.',
        );
    });

    test('unknown code falls back to the raw message', () => {
        const d: CompilerDiagnostic = {
            code: 'some_future_code',
            message: 'a message the client has never seen',
            path: 'slots[slot-0]',
        };
        expect(humanizeDiagnostic(d, label)).toBe('a message the client has never seen');
    });

    test('known code missing its structured fields falls back to the raw message', () => {
        const d: CompilerDiagnostic = {
            code: 'team_size_above_max',
            message: "slot 'slot-0' team 'Team A' has 3 balls; format 'x' allows max 2",
            // no formatId / teamLabel / actual / allowedMax
        };
        expect(humanizeDiagnostic(d, label)).toBe(d.message);
    });

    test('unknown formatId falls back to the id itself, not a crash', () => {
        const d: CompilerDiagnostic = {
            code: 'team_size_above_max',
            message: 'raw',
            formatId: 'not_in_catalog',
            teamLabel: 'Team A',
            actual: 3,
            allowedMax: 2,
        };
        expect(humanizeDiagnostic(d, label)).toBe(
            'Team A has 3 players — not_in_catalog allows at most 2 per team.',
        );
    });
});
