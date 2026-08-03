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

/*
 * ── Why a course is NOT `/courses/clubs/<club>/courses/<course>` ──
 *
 * That reads better, and `$swap` cannot route it. Prefix matching is LITERAL
 * (`route.startsWith(key + '/')`, longest key wins) and there is no pattern
 * syntax in the table, so the only key a nested course URL could match is
 * `/courses/clubs` — the club page, which would render for every course link.
 * A longer literal key is impossible because the club id is data.
 *
 * So the course page gets its own static prefix, and both ids stay in the path:
 * `/courses/course/<club>/<course>`. The club id is not decoration — the page
 * needs it to load the club's courses (the API has a by-id course read, but
 * this section's service deliberately reads by club — one list serves the
 * page and the trail alike) and to render the Clubs → {Club} → {Course} trail with the
 * middle crumb linking somewhere real, even if the course itself is gone.
 *
 * T6–T8 add their tabs UNDER this prefix (`…/<course>/holes`), which prefix
 * matching resolves to this same key — the course page reads the trailing
 * segment itself rather than registering a route per tab.
 */

/** The prefix `$swap` matches a course page on. Registered; never navigated to. */
export const COURSE_PATH_PREFIX = '/courses/course';

/** The pattern `Router.params()` reads the two ids out of. */
export const COURSE_ROUTE = `${COURSE_PATH_PREFIX}/:clubId/:courseId`;

export function coursePath(clubId: string, courseId: string): string {
    return `${COURSE_PATH_PREFIX}/${clubId}/${courseId}`;
}
