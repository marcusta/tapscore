import { expect, test, describe } from 'bun:test';
import {
    MARKER_TOKENS,
    markerClass,
    markerFormCss,
    markerTeamFillCss,
    type MarkerTemplate,
} from '../../src/round/marker-tokens';

// The marker token table is the single home for marker id → meaning + class +
// visual (N3). These tests pin the two things other code depends on: the class
// names `result-render.ts` emits, and the exact CSS the leaderboard component
// hosts — a restyle is a deliberate edit to the table, never a silent drift.

describe('marker token table', () => {
    test('covers every closed marker form, with meaning and visual notes', () => {
        // Exhaustiveness is compile-time (Record<MarkerTemplate, …>); this pins
        // the roster so a template REMOVED server-side is caught too.
        expect(Object.keys(MARKER_TOKENS).sort()).toEqual(
            [
                'badge',
                'box_badge',
                'diamond',
                'dot',
                'double_ring',
                'double_square',
                'ring',
                'square',
            ].sort(),
        );
        for (const [id, tok] of Object.entries(MARKER_TOKENS)) {
            expect(tok.meaning.length, `${id} needs a meaning`).toBeGreaterThan(0);
            expect(tok.visual.length, `${id} needs a visual note`).toBeGreaterThan(0);
        }
    });

    test('no golf idiom leaks into the abstract form meanings', () => {
        // Golf meaning rides in each marker's `label`, sent by the presenter.
        // The `visual` note may name the idiom it renders — that is the whole
        // point of the note — but `meaning` describes the form only.
        const golf = /birdie|bogey|eagle|albatross|par\b/i;
        for (const [id, tok] of Object.entries(MARKER_TOKENS)) {
            expect(golf.test(tok.meaning), `${id} meaning must stay presentation-only`).toBe(false);
        }
    });

    test('class names are derived from the template id', () => {
        for (const id of Object.keys(MARKER_TOKENS) as MarkerTemplate[]) {
            expect(markerClass(id)).toBe(`lb-mark--${id}`);
        }
    });
});

describe('emitted CSS', () => {
    // Byte-for-byte the rules the component shipped before the table existed.
    const FORM = `/* Outline forms keep currentColor + tone tints. */
            & .lb-mark--badge {
                width: auto; min-width: 1.8em;
                padding-left: 0.45em; padding-right: 0.45em;
                border: 2px solid currentColor;
            }
            & .lb-mark--badge.lb-mark-tone--success { color: #267348; }
            & .lb-mark--badge.lb-mark-tone--warning { color: #946200; }
            & .lb-mark--badge.lb-mark-tone--danger { color: #9b332a; }
            /* Filled forms — declared after the tone rules so white text wins. */
            & .lb-mark--ring { background: #d63b2f; color: #fff; }
            & .lb-mark--double_ring { background: #e0862c; color: #fff; }
            & .lb-mark--diamond { background: #e0b41f; color: #fff; }
            & .lb-mark--square,
            & .lb-mark--double_square,
            & .lb-mark--box_badge { border-radius: 3px; }
            & .lb-mark--square { background: #5b9bd5; color: #fff; }
            & .lb-mark--double_square,
            & .lb-mark--box_badge { background: #1f4e79; color: #fff; }`;

    const TEAM_FILL = `& .lb-mark--double_ring.lb-mark-fill--a,
            & .lb-mark--double_ring.lb-mark-fill--b { border-width: 3px; border-style: double; }`;

    test('per-form rules match the shipped stylesheet exactly', () => {
        expect(markerFormCss()).toBe(FORM);
    });

    test('team-fill overrides match the shipped stylesheet exactly', () => {
        expect(markerTeamFillCss()).toBe(TEAM_FILL);
    });

    test('a form with no visual of its own emits no rule', () => {
        // `dot` renders as the bare base shape today; it must not gain an empty
        // rule just for being in the table.
        expect(markerFormCss()).not.toContain('lb-mark--dot');
        expect(MARKER_TOKENS.dot.fill).toBeUndefined();
    });
});
