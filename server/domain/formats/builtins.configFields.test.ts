// Format-templates Phase A — the descriptor's config-knob contract.
//
// `FormatDescriptor.configFields` is PRESENTATION + defaults only; the
// strategy's `validateConfig()` remains the single validation authority. The
// two therefore have to be pinned together, or a renamed enum value in a
// strategy would silently leave the picker offering a value the compiler
// rejects. That pin is the point of this file.

import { beforeEach, describe, expect, it } from 'bun:test';

import { BUILTIN_FORMAT_PLUGINS } from './builtins';
import { clearFormats, formatCatalog, type FormatDescriptor } from './plugin';
import { registerBuiltInFormats } from './index';

beforeEach(() => {
    clearFormats();
    registerBuiltInFormats();
});

/** Formats that declare knobs today — asserted so a dropped declaration fails. */
const FORMATS_WITH_CONFIG_FIELDS = [
    'kopenhamnare_individual',
    'taliban_better_ball',
    'umbrella_4_ball',
    'umbrella_individual',
];

function descriptorOf(id: string): FormatDescriptor {
    const d = formatCatalog().find((x) => x.id === id);
    if (!d) throw new Error(`no descriptor for '${id}'`);
    return d;
}

describe('builtin descriptors stay serializable', () => {
    it('every builtin descriptor JSON round-trips identically (no functions leak in)', () => {
        for (const plugin of BUILTIN_FORMAT_PLUGINS) {
            const d = plugin.descriptor;
            expect(JSON.parse(JSON.stringify(d))).toEqual(d);
        }
    });

    it('every builtin keeps label === labels.en, including the new label-bearing structures', () => {
        for (const d of formatCatalog()) {
            expect(d.label).toBe(d.labels.en);
            for (const f of d.configFields ?? []) {
                expect(f.labels.en.length).toBeGreaterThan(0);
                for (const o of f.options) {
                    expect(o.labels.en.length).toBeGreaterThan(0);
                    if (o.hint) expect((o.hint.sv ?? '').length).toBeGreaterThan(0);
                }
            }
            if (d.preset) expect(d.preset.tagline.en.length).toBeGreaterThan(0);
        }
    });
});

describe('configFields ↔ validateConfig (anti-drift pin)', () => {
    it('exactly these builtins declare config fields', () => {
        const declaring = formatCatalog()
            .filter((d) => (d.configFields ?? []).length > 0)
            .map((d) => d.id);
        expect(declaring).toEqual(FORMATS_WITH_CONFIG_FIELDS);
    });

    it('every declared option value is accepted by the owning strategy', () => {
        for (const plugin of BUILTIN_FORMAT_PLUGINS) {
            for (const field of plugin.descriptor.configFields ?? []) {
                for (const option of field.options) {
                    const diagnostics = plugin.validateConfig({ [field.key]: option.value });
                    expect({
                        format: plugin.descriptor.id,
                        key: field.key,
                        value: option.value,
                        diagnostics,
                    }).toEqual({
                        format: plugin.descriptor.id,
                        key: field.key,
                        value: option.value,
                        diagnostics: [],
                    });
                }
            }
        }
    });

    it('every declared default is one of that field’s options and is accepted', () => {
        for (const plugin of BUILTIN_FORMAT_PLUGINS) {
            for (const field of plugin.descriptor.configFields ?? []) {
                expect(field.options.map((o) => o.value)).toContain(field.default);
                expect(plugin.validateConfig({ [field.key]: field.default })).toEqual([]);
            }
        }
    });

    it('a value the schema does NOT offer is rejected by the strategy', () => {
        // The other direction of the pin: the option list is not merely a
        // subset the strategy tolerates — it is the accepted set. A strategy
        // that quietly grew a third mode fails here until the schema follows.
        for (const plugin of BUILTIN_FORMAT_PLUGINS) {
            for (const field of plugin.descriptor.configFields ?? []) {
                const diagnostics = plugin.validateConfig({ [field.key]: '__not_an_option__' });
                expect(diagnostics.length).toBeGreaterThan(0);
                expect(diagnostics[0]!.path).toBe(field.key);
            }
        }
    });

    it('taliban declares the gross/net bonus rule the strategy reads', () => {
        const [field, ...rest] = descriptorOf('taliban_better_ball').configFields ?? [];
        expect(rest).toEqual([]);
        expect(field!.kind).toBe('select');
        expect(field!.key).toBe('bonusRule');
        expect(field!.options.map((o) => o.value)).toEqual(['gross', 'net']);
        expect(field!.default).toBe('gross');
        expect(field!.labels.sv).toBeTruthy();
    });

    it('köpenhamnare surfaces the handicapMode knob no UI could previously reach', () => {
        const [field, ...rest] = descriptorOf('kopenhamnare_individual').configFields ?? [];
        expect(rest).toEqual([]);
        expect(field!.key).toBe('handicapMode');
        expect(field!.options.map((o) => o.value)).toEqual(['standard', 'delta_from_min']);
        // Match-style by owner decision (2026-08-01): new rounds seed the low
        // ball playing off scratch. The strategy's absent-config fallback
        // stays 'standard' — a legacy freeze so old rounds never rescore.
        expect(field!.default).toBe('delta_from_min');
        // Options are described by what they DO, never by the raw enum name.
        for (const o of field!.options) {
            expect(o.labels.en).not.toBe(o.value);
            expect(o.labels.sv).toBeTruthy();
        }
    });
});

describe('option labels stay labels (docs/design-guidelines.md §3)', () => {
    // The rejected shape was a two-option control whose buttons each carried a
    // full sentence. A label names the option in a word or two; anything
    // needing a clause belongs in `hint`, which the clients draw under the
    // control for the selected option only. Both bounds are asserted because
    // fixing one by breaking the other is the obvious wrong move.
    it('no option label is longer than two words in either locale', () => {
        const offenders: string[] = [];
        for (const d of formatCatalog()) {
            for (const f of d.configFields ?? []) {
                for (const o of f.options) {
                    for (const [locale, text] of Object.entries(o.labels)) {
                        if (text.trim().split(/\s+/).length > 2) {
                            offenders.push(`${d.id}.${f.key}.${o.value} [${locale}] ⟶ "${text}"`);
                        }
                    }
                }
            }
        }
        expect(offenders).toEqual([]);
    });

    it('every hint is a sentence that does not merely restate its label', () => {
        for (const d of formatCatalog()) {
            for (const f of d.configFields ?? []) {
                for (const o of f.options) {
                    if (!o.hint) continue;
                    for (const locale of ['en', 'sv'] as const) {
                        const hint = o.hint[locale] ?? '';
                        expect(hint.length).toBeGreaterThan((o.labels[locale] ?? '').length);
                        expect(hint.endsWith('.')).toBe(true);
                    }
                }
            }
        }
    });

    it('the match-style handicap knob is declared once and shared', () => {
        // Three formats ask this identical question; three hand-written copies
        // would drift. `matchStyleHandicapField()` is the one declaration.
        const fields = ['kopenhamnare_individual', 'umbrella_individual', 'umbrella_4_ball'].map(
            (id) => descriptorOf(id).configFields!.find((f) => f.key === 'handicapMode'),
        );
        expect(fields.every((f) => f !== undefined)).toBe(true);
        for (const f of fields) expect(f).toEqual(fields[0]!);
        expect(fields[0]!.options.every((o) => o.hint !== undefined)).toBe(true);
    });
});

describe('defaults.formatConfig is derived from configFields', () => {
    it('matches the declared field defaults for every builtin that has knobs', () => {
        for (const d of formatCatalog()) {
            const fields = d.configFields ?? [];
            if (fields.length === 0) {
                expect(d.defaults.formatConfig).toBeUndefined();
                continue;
            }
            expect(d.defaults.formatConfig).toEqual(
                Object.fromEntries(fields.map((f) => [f.key, f.default])),
            );
        }
    });

    it('seeds the declared field defaults (köpenhamnare and umbrella deliberately differ from their legacy absent-config fallbacks)', () => {
        expect(descriptorOf('taliban_better_ball').defaults.formatConfig).toEqual({ bonusRule: 'gross' });
        expect(descriptorOf('kopenhamnare_individual').defaults.formatConfig).toEqual({
            handicapMode: 'delta_from_min',
        });
        // Owner decision (2026-08-01): umbrella is match-like — new rounds
        // seed match-style handicaps and NET low-score comparisons; the
        // birdie point stays gross. Absent-config reads remain
        // standard/gross/gross so old rounds never rescore.
        const umbrellaDefaults = {
            handicapMode: 'delta_from_min',
            lowScoreRule: 'net',
            birdieRule: 'gross',
        };
        expect(descriptorOf('umbrella_individual').defaults.formatConfig).toEqual(umbrellaDefaults);
        expect(descriptorOf('umbrella_4_ball').defaults.formatConfig).toEqual(umbrellaDefaults);
    });

    it('the seeded config validates clean against its own strategy', () => {
        for (const plugin of BUILTIN_FORMAT_PLUGINS) {
            const seeded = plugin.descriptor.defaults.formatConfig;
            if (!seeded) continue;
            expect(plugin.validateConfig(seeded)).toEqual([]);
        }
    });
});
