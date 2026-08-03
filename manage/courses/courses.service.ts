import { Computed, Signal, di } from '@basics/core/client/core';
import { api } from '../api';
import { failureMessage } from '../api-failure';
import type { Course } from '../../src/api/courses.gen';
import { ClubsService, type WriteOutcome } from './clubs.service';
import { coursePayload, readinessOf, type CourseDraft, type Readiness } from './course-form';

/*
 * One club's courses, as the club page reads and writes them (spec §3.3).
 *
 * ── Why it holds ONE club at a time ──
 *
 * The only surface that lists courses is a club page, and a club page is one
 * club. Keeping a cache per club id would buy a re-visit nothing measurable
 * (the list is a handful of rows) and would cost the thing that matters: an
 * answer for "which courses am I showing" that cannot go stale against the URL.
 * So `load(clubId)` for a different club RESETS — it does not merge — and every
 * signal below is about the club currently in `clubId`.
 *
 * ── Why readiness is a separate signal, merged in a Computed ──
 *
 * `GET /courses/validate` is one call per course (there is no batch endpoint),
 * and the list must not wait for all of them: rows paint immediately as
 * `Checking…` and settle one by one. That means readiness arrives AFTER the
 * course rows, so it cannot be a property of the fetched objects.
 *
 * It is merged into the rows by `rows` rather than read inside a table cell,
 * because `ManageTableComponent` paints cells inside `untrack()` — a signal
 * read in a `cell()` never repaints. Merging makes the ROW the thing that
 * changes, which is what the table's keyed per-row signal already reacts to.
 *
 * ── Why writes invalidate ClubsService ──
 *
 * The clubs list carries a course COUNT per club, served from the same
 * statement as the club row. Creating or deleting a course changes that number,
 * and the clubs list is load-once — so without an explicit `load(true)` here,
 * going back to the list would show the count from before the write until the
 * session ended. An edit cannot change a count and does not invalidate.
 */

/** A course with the one derived figure the list column needs beside it. */
export type CourseRow = Course & { readiness: Readiness };

const CHECKING: Readiness = { status: 'checking' };

export class CoursesService {
    /** Whose courses these are. Null before the first load. */
    readonly clubId = new Signal<string | null>(null);

    /** The club's courses, name-ordered by the server. */
    readonly courses = new Signal<Course[]>([]);

    /** Readiness by course id — filled in as each validate call lands. */
    readonly readiness = new Signal<Record<string, Readiness>>({});

    /** True while a list fetch is out, including a refetch after a write. */
    readonly loading = new Signal(false);

    /**
     * A failed READ. Writes do not land here: their message belongs on the
     * control that was pressed, so the write methods return it instead.
     */
    readonly error = new Signal<string | null>(null);

    /** True once a load has finished, success or failure. "Empty" vs "not asked". */
    readonly loaded = new Signal(false);

    /** The list the table binds to: courses with their readiness merged on. */
    readonly rows = new Computed<CourseRow[]>(() => {
        const readiness = this.readiness.get();
        return this.courses.get().map((course) => ({
            ...course,
            readiness: readiness[course.id] ?? CHECKING,
        }));
    });

    private clubs = di.get(ClubsService);

    private inflight: Promise<void> | null = null;

    /**
     * Fetch the club's courses. Load-once per club unless forced, so a screen
     * and a nested component may both call it on mount.
     *
     * `listByClub` — never `list()` filtered client-side. Filtering the whole
     * catalog in the browser would ship every club's courses to render one
     * club's page, and would grow with the catalog rather than with the page.
     */
    load(clubId: string, force = false): Promise<void> {
        if (this.clubId.get() !== clubId) {
            this.clubId.set(clubId);
            this.courses.set([]);
            this.readiness.set({});
            this.loaded.set(false);
            this.inflight = null;
        }
        if (!force && this.inflight) return this.inflight;

        this.inflight = (async () => {
            this.loading.set(true);
            this.error.set(null);
            try {
                const courses = await api.courses.listByClub({ clubId });
                // A refetch that lands after the user has navigated on belongs
                // to a club that is no longer on screen; drop it rather than
                // paint another club's courses.
                if (this.clubId.get() !== clubId) return;
                this.courses.set(courses);
                this.checkReadiness(courses);
            } catch (err) {
                this.error.set(
                    failureMessage(
                        err,
                        'Could not load the courses. Check your connection and try again.',
                    ),
                );
                // Let the next attempt really retry rather than handing back
                // this settled failure.
                this.inflight = null;
            } finally {
                this.loading.set(false);
                this.loaded.set(true);
            }
        })();
        return this.inflight;
    }

    /** The row for an id, or null while the list is empty / the id unknown. */
    byId(id: string): Course | null {
        return this.courses.get().find((course) => course.id === id) ?? null;
    }

    async create(clubId: string, draft: CourseDraft): Promise<WriteOutcome> {
        const { name, holeCount, latitude, longitude } = coursePayload(draft);
        return this.write(
            () => api.courses.create({ clubId, name, holeCount, latitude, longitude }),
            'Could not create the course. Check your connection and try again.',
            true,
        );
    }

    /**
     * Save a course. `holeCount` goes straight through: adding or removing
     * holes is the SERVICE's semantics (`course.service.ts`), and fabricating
     * hole rows here would be a second, drifting implementation of it.
     */
    async update(id: string, draft: CourseDraft): Promise<WriteOutcome> {
        const { name, holeCount, latitude, longitude } = coursePayload(draft);
        return this.write(
            () => api.courses.update({ id, name, holeCount, latitude, longitude }),
            'Could not save the course. Check your connection and try again.',
            false,
        );
    }

    /**
     * Delete. The server is the authority on whether it may happen: a course
     * with rounds played on it is refused permanently (spec §3.8), and so is
     * one still wired into a route template or a tee-role mapping. Nothing here
     * pre-blocks or hides the control — the client cannot know cheaply, and a
     * client-side veto would be a second copy of a rule the server owns. The
     * refusal is repeated verbatim.
     */
    async remove(id: string): Promise<WriteOutcome> {
        return this.write(
            () => api.courses.remove({ id }),
            'Could not delete the course. Check your connection and try again.',
            true,
        );
    }

    /**
     * Every write: run it, refetch on success, word the failure on failure.
     *
     * `invalidateClubs` is the count on the clubs list — see the note at the
     * top. It is awaited with the course refetch rather than after it: the two
     * are independent reads and a user going straight back to the list should
     * not wait for them in series.
     */
    private async write(
        call: () => Promise<unknown>,
        fallback: string,
        invalidateClubs: boolean,
    ): Promise<WriteOutcome> {
        try {
            await call();
        } catch (err) {
            return { ok: false, message: failureMessage(err, fallback) };
        }
        const clubId = this.clubId.get();
        await Promise.all([
            clubId === null ? Promise.resolve() : this.load(clubId, true),
            invalidateClubs ? this.clubs.load(true) : Promise.resolve(),
        ]);
        return { ok: true };
    }

    /**
     * Ask the server how ready each course is, all at once, and publish each
     * answer as it arrives — the rows are already on screen saying `Checking…`,
     * so waiting for the slowest call before showing any badge would hold the
     * whole column hostage to one course.
     *
     * A failed check is `Not checked`, never `Ready`: "ready" is a claim about
     * the course, and a dead request is not evidence for it. It does not raise
     * the page's error banner either — the list itself loaded fine.
     */
    private checkReadiness(courses: Course[]): void {
        this.readiness.set(Object.fromEntries(courses.map((course) => [course.id, CHECKING])));
        for (const course of courses) {
            void (async () => {
                let readiness: Readiness;
                try {
                    readiness = readinessOf(await api.courses.validate({ id: course.id }));
                } catch {
                    readiness = { status: 'unknown' };
                }
                // The list may have moved on — a different club, or a refetch
                // that dropped this course — while the call was out.
                if (!this.courses.peek().some((row) => row.id === course.id)) return;
                this.readiness.update((current) => ({ ...current, [course.id]: readiness }));
            })();
        }
    }
}
