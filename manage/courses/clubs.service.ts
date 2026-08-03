import { Computed, Signal } from '@basics/core/client/core';
import { api } from '../api';
import { failureMessage } from '../api-failure';
import type { Club } from '../../src/api/clubs.gen';
import { clubPayload, type ClubDraft } from './club-form';

/*
 * The club catalog, as the Courses section reads and writes it (spec §3.2).
 *
 * DI singleton, and deliberately NOT loaded on boot: the list and the detail
 * page both call `load()` from their `onMount`, so an ordinary player who never
 * reaches an unlocked section never triggers a gated fetch. `ManageRolesService`
 * spells out the same split — `/me/roles` is caller-scoped and safe on boot,
 * management payloads are not.
 *
 * ── Why the course COUNT is computed here ──
 *
 * There is no count endpoint, and inventing one server-side for a column would
 * be the wrong shape of change (the API is complete per spec §3). So the two
 * open reads are fetched together and joined in memory. It is one extra request
 * for a catalog measured in tens of rows, and it keeps the count consistent
 * with the list it annotates: both halves come from the same moment.
 *
 * ── Why the search text lives in the service ──
 *
 * The filter is client-side (spec §3.2), so the only question is where the
 * query string sits. Here, because `visible` is then a Computed the table binds
 * to directly — one derivation, no screen-side re-filtering — and because a
 * user who opens a club and comes back finds their filter still applied rather
 * than silently reset by a remount.
 */

/** A club plus the one derived figure the list column needs. */
export type ClubRow = Club & { courseCount: number };

/**
 * What a write reports back. Same shape as `CommitOutcome` in
 * `manage/ui/row-edit.ts` on purpose: the club page hands this straight to
 * `RowEditController.commit`, so a failed save keeps the row open with the
 * server's sentence on it.
 */
export type WriteOutcome = { ok: true } | { ok: false; message: string };

/**
 * The filter, as a pure function so it is testable without a component and
 * obvious at review: every whitespace-separated term must appear somewhere in
 * the club's name or location. Term-wise rather than one substring, because
 * "gk linköping" and "linköping gk" are the same intent typed in two orders.
 */
export function filterClubs(rows: ClubRow[], query: string): ClubRow[] {
    const terms = query.trim().toLowerCase().split(/\s+/).filter((term) => term !== '');
    if (terms.length === 0) return rows;
    return rows.filter((row) => {
        const haystack = `${row.name} ${row.location ?? ''}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
    });
}

export class ClubsService {
    /** Every club, name-ordered by the server, with its course count joined on. */
    readonly clubs = new Signal<ClubRow[]>([]);

    /** True while a fetch is out — including a refetch after a mutation. */
    readonly loading = new Signal(false);

    /**
     * A failed READ. Writes do not land here: their message belongs on the
     * control that was pressed, so `create`/`update`/`remove` return it instead.
     */
    readonly error = new Signal<string | null>(null);

    /** True once a load has finished, success or failure. "Empty" vs "not asked". */
    readonly loaded = new Signal(false);

    /** The search box's text. Client-side filter only — nothing is refetched. */
    readonly query = new Signal('');

    readonly visible = new Computed<ClubRow[]>(() =>
        filterClubs(this.clubs.get(), this.query.get()),
    );

    private inflight: Promise<void> | null = null;

    /**
     * Fetch once per session unless forced. Concurrent callers — the list and
     * the club page both mount `load()` — share the in-flight promise, so each
     * caller's continuation runs after the signals are populated.
     */
    load(force = false): Promise<void> {
        if (!force && this.inflight) return this.inflight;
        this.inflight = (async () => {
            this.loading.set(true);
            this.error.set(null);
            try {
                const [clubs, courses] = await Promise.all([
                    api.clubs.list(),
                    api.courses.list(),
                ]);
                const counts = new Map<string, number>();
                for (const course of courses) {
                    counts.set(course.clubId, (counts.get(course.clubId) ?? 0) + 1);
                }
                this.clubs.set(
                    clubs.map((club) => ({ ...club, courseCount: counts.get(club.id) ?? 0 })),
                );
            } catch (err) {
                this.error.set(
                    failureMessage(err, 'Could not load the clubs. Check your connection and try again.'),
                );
                // Let the next attempt actually retry rather than handing back
                // this settled failure.
                this.inflight = null;
            } finally {
                this.loading.set(false);
                this.loaded.set(true);
            }
        })();
        return this.inflight;
    }

    /** The row for an id, or null while the list is still empty / unknown id. */
    byId(id: string): ClubRow | null {
        return this.clubs.get().find((club) => club.id === id) ?? null;
    }

    async create(draft: ClubDraft): Promise<WriteOutcome> {
        return this.write(
            () => api.clubs.create(clubPayload(draft)),
            'Could not create the club. Check your connection and try again.',
        );
    }

    async update(id: string, draft: ClubDraft): Promise<WriteOutcome> {
        return this.write(
            () => api.clubs.update({ id, ...clubPayload(draft) }),
            'Could not save the club. Check your connection and try again.',
        );
    }

    /**
     * Delete. The server is the authority on whether it may happen — once the
     * reference guards land (spec §3.7) a club with courses comes back 409 with
     * a sentence naming them, and `failureMessage` repeats it verbatim. Nothing
     * here pre-blocks on `courseCount`: a client-side veto would be a second,
     * drifting copy of a rule the server already owns.
     */
    async remove(id: string): Promise<WriteOutcome> {
        return this.write(
            () => api.clubs.remove({ id }),
            'Could not delete the club. Check your connection and try again.',
        );
    }

    /** Every write: run it, refetch on success, word the failure on failure. */
    private async write(call: () => Promise<unknown>, fallback: string): Promise<WriteOutcome> {
        try {
            await call();
        } catch (err) {
            return { ok: false, message: failureMessage(err, fallback) };
        }
        // Forced, so the list reflects the write immediately. Awaited, so a
        // caller that navigates afterwards finds the new data already there.
        await this.load(true);
        return { ok: true };
    }
}
