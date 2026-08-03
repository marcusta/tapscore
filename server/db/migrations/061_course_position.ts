import type { Kysely } from 'kysely';

// Where a course physically is — WGS84 decimal degrees (manage-ui.md §3.3a).
//
// Two nullable REAL columns, added to `courses` rather than `clubs`: two
// courses at one club can sit a drive apart, and a round is played on a
// course, not at a club. A club-level position is derivable from its courses
// later if a consumer ever wants one; the reverse is not.
//
// Nullable and NOT backfilled, deliberately. A course without a position is a
// complete course — `validateCourse` must never raise an issue for a missing
// one. The columns exist so a future proximity feature (the player app
// offering nearby courses when starting a round) has something to read; that
// consumer is out of scope here, and shipping the capture first is what makes
// it possible at all.
//
// A pair, always: the service enforces both-set-or-both-null, because half a
// coordinate locates nothing. SQLite cannot express that as a column CHECK
// worth having (a two-column CHECK survives ALTER TABLE ADD COLUMN only as a
// table rebuild), so the invariant lives in `CourseService.resolvePosition`,
// which is the single write path.
//
// REAL, not TEXT: these are numbers that get compared and, eventually,
// distance-sorted. Degrees at six decimals are ~0.1 m — far inside float64.

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema.alterTable('courses').addColumn('latitude', 'real').execute();
    await db.schema.alterTable('courses').addColumn('longitude', 'real').execute();
}
