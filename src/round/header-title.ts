// The round header's headline — a pure fold, kept out of the component so it
// can be tested without a DOM.

/**
 * The header's headline: the round's own name when it has one, else the round's
 * DATE in the reader's locale.
 *
 * The fallback is computed at render time rather than baked into `rounds.name`
 * at create time — the creator's locale is not the reader's, and a round shared
 * across a group must not show a Swedish date to an American phone. Parsed at
 * UTC noon so no timezone can shift a `yyyy-MM-dd` onto the day before.
 */
export function roundHeaderTitle(
    round: { name?: string | null; date?: string | null } | null,
    locale: string = typeof navigator === 'undefined' ? 'en' : navigator.language,
): string {
    const name = (round?.name ?? '').trim();
    if (name) return name;
    const date = round?.date ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date || 'Round';
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
        new Date(`${date}T12:00:00Z`),
    );
}
