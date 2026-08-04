import { Signal, di } from '@basics/core/client/core';
import { api } from '../api';
import { failureMessage } from '../api-failure';
import { deleteBlockedDetail } from '../delete-blockers';
import type { Tee } from '../../src/api/tees.gen';
import type { WriteOutcome } from './clubs.service';
import { CoursesService } from './courses.service';
import { teePayload, type TeeDraft } from './tee-form';

/*
 * One course's tees, as the course page reads and writes them (spec §3.5).
 *
 * ── Why it holds ONE course at a time ──
 *
 * Same reasoning as `CoursesService` holding one club: the only surface that
 * lists tees is a course page, and a course page is one course. A cache keyed by
 * course id would buy a re-visit nothing (five rows) and would cost the one
 * thing that matters — an answer to "whose tees am I showing" that cannot go
 * stale against the URL. So `load(courseId)` for a different course RESETS
 * rather than merges.
 *
 * ── Why writes invalidate CoursesService ──
 *
 * The club page's course list carries a tee COUNT per course, served from the
 * same statement as the course row (`listByClub`, this task's server slice).
 * Creating or deleting a tee changes that number, and the courses list is
 * load-once — so without an explicit `load(clubId, true)` here, navigating back
 * to the club would show the count from before the write for the rest of the
 * session. An EDIT cannot change a count and deliberately does not invalidate.
 *
 * That is also why `create` and `remove` take the club id. The service could dig
 * it out of `CoursesService.clubId`, but that signal belongs to whichever club
 * page was open last, and a deep link straight to a course page means it may be
 * null or wrong. The caller knows; it passes it.
 */

export class TeesService {
    /** Whose tees these are. Null before the first load. */
    readonly courseId = new Signal<string | null>(null);

    /** The course's tees, name-ordered by the server. */
    readonly tees = new Signal<Tee[]>([]);

    /** True while a list fetch is out, including a refetch after a write. */
    readonly loading = new Signal(false);

    /**
     * A failed READ. Writes do not land here: their message belongs on the
     * control that was pressed, so the write methods return it instead.
     */
    readonly error = new Signal<string | null>(null);

    /** True once a load has finished, success or failure. "Empty" vs "not asked". */
    readonly loaded = new Signal(false);

    private courses = di.get(CoursesService);

    private inflight: Promise<void> | null = null;

    /**
     * Fetch the course's tees. Load-once per course unless forced, so a screen
     * and a nested component may both call it on mount.
     */
    load(courseId: string, force = false): Promise<void> {
        if (this.courseId.get() !== courseId) {
            this.courseId.set(courseId);
            this.tees.set([]);
            this.loaded.set(false);
            this.inflight = null;
        }
        if (!force && this.inflight) return this.inflight;

        this.inflight = (async () => {
            this.loading.set(true);
            this.error.set(null);
            try {
                const tees = await api.tees.listByCourse({ courseId });
                // A refetch that lands after the user has navigated on belongs
                // to a course no longer on screen; drop it rather than paint
                // another course's tees.
                if (this.courseId.get() !== courseId) return;
                this.tees.set(tees);
            } catch (err) {
                this.error.set(
                    failureMessage(
                        err,
                        'Could not load the tees. Check your connection and try again.',
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

    /** The tee for an id, or null while the list is empty / the id unknown. */
    byId(id: string): Tee | null {
        return this.tees.get().find((tee) => tee.id === id) ?? null;
    }

    async create(courseId: string, clubId: string, draft: TeeDraft): Promise<WriteOutcome> {
        const { name, colour, holeLengths, ratings } = teePayload(draft);
        return this.write(
            () => api.tees.create({ courseId, name, colour, holeLengths, ratings }),
            'Could not create the tee. Check your connection and try again.',
            clubId,
        );
    }

    /**
     * Save a tee. Name, colour, lengths and ratings go in ONE call because
     * `UpdateTeeInput` takes them together and the server applies them in one
     * transaction — splitting them into a field save and a grid save would put
     * a tee with new lengths and old ratings on the wire as a reachable state.
     *
     * The arrays are always sent WHOLE, never patched: on the server the lengths
     * are replaced outright and any gender missing from `ratings` is deleted,
     * which is how the unrated state is expressed (`tee-form.ts`).
     *
     * That deletion is REFUSED (409, `tee_rating_removal_blocked`) while a
     * course tee role still assigns this tee for the gender being retired —
     * ruling R1 §3.5. Nothing is pre-checked here: the mapping lives on a
     * different screen and the server owns the rule.
     */
    async update(id: string, draft: TeeDraft): Promise<WriteOutcome> {
        const { name, colour, holeLengths, ratings } = teePayload(draft);
        return this.write(
            () => api.tees.update({ id, name, colour, holeLengths, ratings }),
            'Could not save the tee. Check your connection and try again.',
            // An edit cannot change how many tees the course has.
            null,
        );
    }

    /**
     * Delete. The server is the authority on whether it may happen: a tee named
     * by a course tee-role mapping is refused with a 409 naming the mapping
     * (`TeeService.remove`). Nothing here pre-blocks or hides the control — the
     * client would need a second copy of a rule the server owns, and the
     * refusal is repeated verbatim instead.
     */
    async remove(id: string, clubId: string): Promise<WriteOutcome> {
        return this.write(
            () => api.tees.remove({ id }),
            'Could not delete the tee. Check your connection and try again.',
            clubId,
        );
    }

    /**
     * Every write: run it, refetch on success, word the failure on failure.
     *
     * `invalidateCoursesForClub` is the tee count on the club page — see the
     * note at the top. It is awaited alongside the tee refetch rather than
     * after it: the two are independent reads and a user going straight back to
     * the club should not wait for them in series.
     */
    private async write(
        call: () => Promise<unknown>,
        fallback: string,
        invalidateCoursesForClub: string | null,
    ): Promise<WriteOutcome> {
        try {
            await call();
        } catch (err) {
            // The code rides along so the screen can PLACE the refusal (a
            // rating conflict belongs beside the rating controls). The sentence
            // is still the whole message — see `WriteOutcome`.
            return {
                ok: false,
                message: failureMessage(err, fallback),
                code: deleteBlockedDetail(err)?.code,
            };
        }
        const courseId = this.courseId.get();
        await Promise.all([
            courseId === null ? Promise.resolve() : this.load(courseId, true),
            invalidateCoursesForClub === null
                ? Promise.resolve()
                : this.courses.load(invalidateCoursesForClub, true),
        ]);
        return { ok: true };
    }
}
