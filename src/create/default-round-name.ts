// The pre-filled round name — the Swift `DefaultRoundName` in
// `ios/TapScore/Features/Create/CreateStore.swift`, ported verbatim so both
// clients pre-fill the same string for the same day and locale.
//
// A round name is a LABEL for telling rounds apart in the list, never an
// identifier: it is optional, it is not unique, and the `(2)` suffix below is
// a courtesy against two identical rows, not a constraint. Pure module — the
// clock and the locale are injected so tests are not date-dependent.

/** `Spel` for a Swedish reader, `Game` for everyone else. */
export function defaultNamePrefix(locale: string): string {
    return locale.toLowerCase().startsWith('sv') ? 'Spel' : 'Game';
}

/** The date in the reader's own locale, medium style ("30 Jul 2026"). */
export function defaultNameDate(date: Date, locale: string): string {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

/**
 * `"Game 30 Jul 2026"`, stepped past anything in `existing` with a `(2)`,
 * `(3)`, … suffix. Comparison folds case and surrounding whitespace, so a
 * hand-typed "game 30 jul 2026" still counts as taken. Bounded at 99: past
 * that the base name is returned as-is — duplicates are allowed anyway.
 */
export function defaultRoundName(
    date: Date = new Date(),
    locale: string = typeof navigator === 'undefined' ? 'en' : navigator.language,
    existing: readonly string[] = [],
): string {
    const base = `${defaultNamePrefix(locale)} ${defaultNameDate(date, locale)}`;
    const taken = new Set(
        existing.map((n) => n.trim().toLowerCase()).filter((n) => n.length > 0),
    );
    if (!taken.has(base.toLowerCase())) return base;
    for (let n = 2; n <= 99; n++) {
        const candidate = `${base} (${n})`;
        if (!taken.has(candidate.toLowerCase())) return candidate;
    }
    return base;
}
