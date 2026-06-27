// Phase 0 — unit tests for the presentation-only result vocabulary.
//
// These prove the smart constructors emit exactly the closed-vocabulary shapes
// (no extra fields, optionals omitted when unset), that the custom-marker escape
// is explicit/greppable, and that the exhaustiveness guard covers every known
// marker template. They are pure-data tests — no rendering, no DB.

import { describe, expect, test } from 'bun:test';
import {
    assertNever,
    cell,
    marker,
    markerEmphasis,
    MARKER_TEMPLATES,
    type CellMarker,
    type MarkerTemplate,
} from './result-vocabulary';

describe('marker constructors', () => {
    test('each known form emits its template with no stray fields', () => {
        expect(marker.ring()).toEqual({ template: 'ring' });
        expect(marker.doubleRing()).toEqual({ template: 'double_ring' });
        expect(marker.diamond()).toEqual({ template: 'diamond' });
        expect(marker.dot()).toEqual({ template: 'dot' });
        expect(marker.badge()).toEqual({ template: 'badge' });
    });

    test('optional tone/label/value are included only when provided', () => {
        expect(marker.diamond({ tone: 'side_a', label: 'Down-team eagle, +5' })).toEqual({
            template: 'diamond',
            tone: 'side_a',
            label: 'Down-team eagle, +5',
        });
        expect(marker.badge({ value: 'AS' })).toEqual({ template: 'badge', value: 'AS' });
        // No keys leak in for unset optionals.
        expect(Object.keys(marker.ring())).toEqual(['template']);
    });

    test('custom escape is explicit and carries a greppable customId', () => {
        const m = marker.custom('wolf-lone-win', { tone: 'success', label: 'Lone wolf wins' });
        expect(m).toEqual({
            template: 'custom',
            customId: 'wolf-lone-win',
            tone: 'success',
            label: 'Lone wolf wins',
        });
        // The escape is discriminable by `template === 'custom'`.
        expect(m.template).toBe('custom');
        if (m.template === 'custom') expect(m.customId).toBe('wolf-lone-win');
    });
});

describe('cell constructors', () => {
    test('cell.score emits a clean cell, optionals omitted when unset', () => {
        expect(cell.score({ playHoleId: 'ph-4', value: 3, display: '3' })).toEqual({
            playHoleId: 'ph-4',
            value: 3,
            display: '3',
        });
    });

    test('cell.score carries tone/title/marker when provided', () => {
        const c = cell.score({
            playHoleId: 'ph-4',
            value: 3,
            display: '3',
            tone: 'side_a',
            title: 'net 3',
            marker: marker.diamond({ tone: 'side_a', label: 'Down-team eagle, +5' }),
        });
        expect(c).toEqual({
            playHoleId: 'ph-4',
            value: 3,
            display: '3',
            tone: 'side_a',
            title: 'net 3',
            marker: { template: 'diamond', tone: 'side_a', label: 'Down-team eagle, +5' },
        });
    });

    test('null value (pickup / no score) is preserved', () => {
        expect(cell.score({ playHoleId: 'ph-1', value: null, display: '–' }).value).toBeNull();
    });
});

describe('closed vocabulary', () => {
    test('markerEmphasis classifies every known template (exhaustive switch holds)', () => {
        const got = Object.fromEntries(MARKER_TEMPLATES.map((t) => [t, markerEmphasis(t)]));
        expect(got).toEqual({
            ring: 'normal',
            double_ring: 'strong',
            diamond: 'strong',
            badge: 'normal',
            dot: 'light',
        });
    });

    test('MARKER_TEMPLATES lists exactly the constructible non-custom forms', () => {
        const built = [
            marker.ring(),
            marker.doubleRing(),
            marker.diamond(),
            marker.dot(),
            marker.badge(),
        ].map((m) => m.template);
        expect(new Set(built)).toEqual(new Set(MARKER_TEMPLATES));
    });

    test('assertNever throws if a switch is ever reached for an unknown member', () => {
        // Simulate an unhandled value slipping past the type system at runtime.
        const rogue = 'spiral' as unknown as never;
        expect(() => assertNever(rogue)).toThrow(/Unhandled vocabulary member/);
    });
});

// Type-level guard: a custom marker is assignable to CellMarker and is NOT one
// of the closed templates (compile-time check; no runtime assertion needed).
const _customIsMarker: CellMarker = marker.custom('x');
const _knownTemplates: MarkerTemplate[] = ['ring', 'double_ring', 'diamond', 'dot', 'badge'];
void _customIsMarker;
void _knownTemplates;
