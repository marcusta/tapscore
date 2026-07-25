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
const FORMATS_WITH_CONFIG_FIELDS = ['kopenhamnare_individual', 'taliban_better_ball'];

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
                for (const o of f.options) expect(o.labels.en.length).toBeGreaterThan(0);
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
        expect(field!.default).toBe('standard');
        // Options are described by what they DO, never by the raw enum name.
        for (const o of field!.options) {
            expect(o.labels.en).not.toBe(o.value);
            expect(o.labels.sv).toBeTruthy();
        }
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

    it('seeds the concrete values the strategies default to internally', () => {
        expect(descriptorOf('taliban_better_ball').defaults.formatConfig).toEqual({ bonusRule: 'gross' });
        expect(descriptorOf('kopenhamnare_individual').defaults.formatConfig).toEqual({
            handicapMode: 'standard',
        });
    });

    it('the seeded config validates clean against its own strategy', () => {
        for (const plugin of BUILTIN_FORMAT_PLUGINS) {
            const seeded = plugin.descriptor.defaults.formatConfig;
            if (!seeded) continue;
            expect(plugin.validateConfig(seeded)).toEqual([]);
        }
    });
});
