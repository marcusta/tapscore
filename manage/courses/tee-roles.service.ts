import { Signal } from '@basics/core/client/core';
import { api } from '../api';
import { failureMessage } from '../api-failure';
import type { CourseTeeRole, TeeRole } from '../../src/api/courses.gen';
import type { WriteOutcome } from './clubs.service';
import { mappedTeeId } from './tee-roles';
import type { Gender } from './tee-form';

/*
 * One course's tee-role mappings, plus the global role catalog (spec §3.6).
 *
 * ── Why the catalog lives here and is never a constant ──
 *
 * The rows of the matrix ARE the catalog. `tee_roles` is a table, seeded with
 * club / tournament / beginner today, and the whole point of the server owning
 * it is that a fourth role is a row and not a release. So the catalog is
 * FETCHED — `GET /courses/tee-roles/catalog` — and anything that would let a
 * role key appear in this client's source (a constant, a label map, a switch on
 * 'club') is the bug this service exists to prevent. The one role key spelled
 * anywhere in the client is `'club'`, and only inside the popover's explanation
 * of the resolution FALLBACK, which is a documented behaviour of
 * `resolveDefaultTee` rather than a row of this matrix.
 *
 * ── Why one course at a time ──
 *
 * Same reasoning as `TeesService`: the only surface showing mappings is a course
 * page, and a course page is one course. `load()` for a different course RESETS.
 * The catalog is the exception — it is global reference data, so it survives the
 * course switch and is fetched once per session.
 *
 * ── Why a write refetches instead of patching the array ──
 *
 * The server is the authority on what a mapping IS after a write: `setTeeRole`
 * is an upsert that may replace a row, and migration 059's triggers can remove
 * rows the client never touched (unticking a tee's gender rating deletes every
 * mapping naming that tee for that gender). A local splice would be a second,
 * quieter model of those rules. One small GET per write is the price of not
 * having it.
 */

export class TeeRolesService {
    /** The global role catalog, in the server's `sort_order`. */
    readonly catalog = new Signal<TeeRole[]>([]);

    /** Whose mappings these are. Null before the first load. */
    readonly courseId = new Signal<string | null>(null);

    /** The course's mappings. An absent role/gender pair is deliberate, not missing. */
    readonly mappings = new Signal<CourseTeeRole[]>([]);

    /** True while a read is out, including the refetch after a write. */
    readonly loading = new Signal(false);

    /**
     * A failed READ. Writes never land here — their sentence belongs on the cell
     * that was changed, so the write methods return it instead.
     */
    readonly error = new Signal<string | null>(null);

    /** True once a load has finished, success or failure. "Empty" vs "not asked". */
    readonly loaded = new Signal(false);

    private inflight: Promise<void> | null = null;

    /** The catalog is global; fetch it once and keep it across course switches. */
    private catalogFetched = false;

    /**
     * Fetch the catalog (once) and the course's mappings. Load-once per course
     * unless forced, so the component may call it on mount without coordinating
     * with anyone else.
     */
    load(courseId: string, force = false): Promise<void> {
        if (this.courseId.get() !== courseId) {
            this.courseId.set(courseId);
            this.mappings.set([]);
            this.loaded.set(false);
            this.inflight = null;
        }
        if (!force && this.inflight) return this.inflight;

        this.inflight = (async () => {
            this.loading.set(true);
            this.error.set(null);
            try {
                const [catalog, mappings] = await Promise.all([
                    this.catalogFetched
                        ? Promise.resolve(this.catalog.get())
                        : api.courses.teeRoleCatalog(),
                    api.courses.teeRoles({ courseId }),
                ]);
                // A read that lands after the user has navigated on belongs to a
                // course no longer on screen. The catalog is global, so it is
                // still worth keeping; the mappings are not.
                this.catalog.set(catalog);
                this.catalogFetched = true;
                if (this.courseId.get() !== courseId) return;
                this.mappings.set(mappings);
            } catch (err) {
                this.error.set(
                    failureMessage(
                        err,
                        'Could not load the tee roles. Check your connection and try again.',
                    ),
                );
                // Let the next attempt really retry rather than hand back this
                // settled failure.
                this.inflight = null;
            } finally {
                this.loading.set(false);
                this.loaded.set(true);
            }
        })();
        return this.inflight;
    }

    /** The tee a cell currently names, or `''` for "Not set". Reactive. */
    mappedTeeId(roleKey: string, gender: Gender): string {
        return mappedTeeId(this.mappings.get(), roleKey, gender);
    }

    /**
     * Point a role/gender at a tee.
     *
     * Nothing is pre-validated here beyond what the dropdown already offers: the
     * server refuses a tee that belongs to another course or carries no rating
     * for the gender, with a 409 whose sentence is repeated verbatim.
     */
    async setRole(roleKey: string, gender: Gender, teeId: string): Promise<WriteOutcome> {
        const courseId = this.courseId.get();
        if (courseId === null) return { ok: false, message: 'No course is loaded.' };
        return this.write(
            () => api.courses.setTeeRole({ courseId, roleKey, gender, teeId }),
            'Could not save the tee role. Check your connection and try again.',
        );
    }

    /** Clear a role/gender back to "Not set". */
    async clearRole(roleKey: string, gender: Gender): Promise<WriteOutcome> {
        const courseId = this.courseId.get();
        if (courseId === null) return { ok: false, message: 'No course is loaded.' };
        return this.write(
            () => api.courses.clearTeeRole({ courseId, roleKey, gender }),
            'Could not clear the tee role. Check your connection and try again.',
        );
    }

    private async write(call: () => Promise<unknown>, fallback: string): Promise<WriteOutcome> {
        try {
            await call();
        } catch (err) {
            return { ok: false, message: failureMessage(err, fallback) };
        }
        const courseId = this.courseId.get();
        if (courseId !== null) await this.load(courseId, true);
        return { ok: true };
    }
}
