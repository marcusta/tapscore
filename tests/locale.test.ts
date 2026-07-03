import { expect, test } from 'bun:test';
import { resolveLocale } from '../src/locale';

// Phase 2.7d — locale resolver backing format-label i18n. `resolveLocale`
// takes an explicit BCP-47 tag so these tests never touch global `navigator`
// state; `currentLocale()` (untested here) just forwards `navigator.language`.

test('resolveLocale: Swedish tag resolves to sv', () => {
    expect(resolveLocale('sv')).toBe('sv');
});

test('resolveLocale: regional Swedish tag (sv-SE) resolves to sv', () => {
    expect(resolveLocale('sv-SE')).toBe('sv');
});

test('resolveLocale: case-insensitive match', () => {
    expect(resolveLocale('SV-se')).toBe('sv');
});

test('resolveLocale: English tag resolves to en', () => {
    expect(resolveLocale('en-US')).toBe('en');
});

test('resolveLocale: any non-Swedish tag falls back to en', () => {
    expect(resolveLocale('de-DE')).toBe('en');
    expect(resolveLocale('fr')).toBe('en');
});

test('resolveLocale: absent tag falls back to en (no navigator in bun test)', () => {
    expect(resolveLocale(undefined)).toBe('en');
});
