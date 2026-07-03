// Phase 2.7d — tiny locale resolver for format-label i18n. The server ships
// `FormatDescriptor.labels: { en, sv? }` (see `server/domain/formats/plugin.ts`);
// this module decides WHICH of those the client shows, without threading
// locale through anything beyond that lookup. Deliberately dumb: two
// languages, one signal (`navigator.language`), no framework dependency.

export type Locale = 'en' | 'sv';

/**
 * Resolve the active locale from a BCP-47 language tag (defaults to
 * `navigator.language` at call time). Swedish tags (`sv`, `sv-SE`, …) resolve
 * to `sv`; everything else — including absent/unparseable input — falls back
 * to `en`. Takes an explicit tag so callers (and tests) can override without
 * touching global state.
 */
export function resolveLocale(languageTag?: string): Locale {
    const tag = languageTag ?? (typeof navigator !== 'undefined' ? navigator.language : undefined);
    return typeof tag === 'string' && tag.toLowerCase().startsWith('sv') ? 'sv' : 'en';
}

/** Current locale, read from the browser's `navigator.language`. */
export function currentLocale(): Locale {
    return resolveLocale();
}
