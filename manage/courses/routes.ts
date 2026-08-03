// The Courses section's URLs, in one place.
//
// Two consumers have to agree on these strings and neither can see the other:
// `manage/shell/sections.ts` registers them in the router table, and the
// screens build links out of them. A typo in either is a not-found page, so the
// literals live here and both sides import them.
//
// `$swap` resolves a route by exact match first and then by longest PREFIX
// (`matchPrefix` in the framework core), which is what makes `/courses/clubs`
// the registered key and `/courses/clubs/<id>` a live deep link without any
// pattern syntax in the table.

/** The section landing — the clubs list. */
export const CLUBS_PATH = '/courses';

/** The prefix `$swap` matches a club page on. Registered; never navigated to. */
export const CLUB_PATH_PREFIX = '/courses/clubs';

/** The pattern `Router.params()` reads the id out of. */
export const CLUB_ROUTE = `${CLUB_PATH_PREFIX}/:id`;

export function clubPath(id: string): string {
    return `${CLUB_PATH_PREFIX}/${id}`;
}
