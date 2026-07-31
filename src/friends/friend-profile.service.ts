import { Signal } from '@basics/core/client/core';
import { api } from '../api';
import type { FriendProfileCourseEntry, FriendProfileView } from '../api/friend-profile.gen';
import { failureMessage } from '../request-failure';
import {
    EMPTY_ROUND_LIST,
    canLoadMore,
    stitchPage,
    unavailability,
    type FriendProfileUnavailability,
    type RoundListState,
} from './friend-profile-model';

/**
 * State for one friend's profile — the card (`/friends/:id/profile`), the
 * paged round list (`/friends/:id/rounds`) and the courses list
 * (`/friends/:id/courses`). One service rather than three because the three
 * screens share the subject and the refusal state: a 403 on any read means
 * access to the PERSON is gone, and all three surfaces show the same calm
 * full-page state.
 *
 * Read-only by construction, like the server slice it talks to: it holds a
 * player id and calls session-authorized reads; there is no code path from
 * here to any write.
 *
 * The payload's aggregates and its lists disagree ON PURPOSE —
 * `roundsTotal`/`coursesTotal` count private and link rounds, the lists show
 * only `visibility = 'friends'` (see `FriendProfileService`'s server class
 * doc). This service carries both verbatim and the components keep them
 * apart: counts belong to the profile card, lists are just lists, and no list
 * header or terminal row ever restates a count.
 *
 * These loads bypass the framework's `request()` wrapper deliberately: 403
 * and 404 are STATES here, not errors, and the wrapper would flatten both
 * into 'server'. The 401 side effect the wrapper would have provided comes
 * from `failureMessage`.
 */
export class FriendProfileService {
    /** The subject. Everything below is about exactly this player. */
    readonly playerId = new Signal<string | null>(null);

    /** Set when the server refused a read — the friendship was withdrawn
     *  mid-session, or the player is gone. A distinct state, not an error,
     *  because no retry fixes it. Page-wide: shared by all three surfaces. */
    readonly unavailable = new Signal<FriendProfileUnavailability | null>(null);

    // --- Profile card ---
    readonly profile = new Signal<FriendProfileView | null>(null);
    readonly profileLoading = new Signal(false);
    readonly profileError = new Signal<string | null>(null);
    private profileLoaded = false;

    // --- Paged round list (see-all) ---
    readonly rounds = new Signal<RoundListState>(EMPTY_ROUND_LIST);
    readonly roundsLoaded = new Signal(false);
    readonly roundsLoading = new Signal(false);
    readonly loadingMore = new Signal(false);
    readonly roundsError = new Signal<string | null>(null);
    /** Bumped by every first-page load, so a page fetch in flight across a
     *  refresh (or a subject switch) can tell its list is gone: stitching a
     *  stale page would resurrect old rows AND rewind the cursor. */
    private roundsGeneration = 0;

    // --- Courses ---
    readonly courses = new Signal<FriendProfileCourseEntry[]>([]);
    readonly coursesHasMore = new Signal(false);
    readonly coursesLoaded = new Signal(false);
    readonly coursesLoading = new Signal(false);
    readonly coursesError = new Signal<string | null>(null);

    /** Point the service at a player. A different id drops everything — the
     *  three screens navigate between each other with the id in the URL, and
     *  stale state about the previous friend must never flash. */
    setPlayer(playerId: string): void {
        if (this.playerId.get() === playerId) return;
        this.playerId.set(playerId);
        this.resetData();
    }

    async loadProfile(force = false): Promise<void> {
        const playerId = this.playerId.get();
        if (!playerId) return;
        if (!force && (this.profileLoaded || this.profileLoading.get())) return;
        this.profileLoading.set(true);
        this.profileError.set(null);
        try {
            const view = await api.friendProfile.profile({ playerId });
            if (this.playerId.get() !== playerId) return;
            this.profile.set(view);
            this.profileLoaded = true;
            this.unavailable.set(null);
        } catch (err) {
            if (this.playerId.get() !== playerId) return;
            this.refuseOr(err, () =>
                this.profileError.set(failureMessage(err, "Couldn't load this profile.")),
            );
        } finally {
            if (this.playerId.get() === playerId) this.profileLoading.set(false);
        }
    }

    /** The first page. `force` restarts from the top — a refresh must not
     *  append page one onto an old list. */
    async loadRounds(force = false): Promise<void> {
        const playerId = this.playerId.get();
        if (!playerId) return;
        if (!force && (this.roundsLoaded.get() || this.roundsLoading.get())) return;
        this.roundsGeneration += 1;
        // Guard the landing response by GENERATION, not by subject: a subject
        // check alone lets a page-1 response from a PREVIOUS visit to the same
        // friend land after "Show more" already stitched page 2, wiping the
        // stitch and rewinding the cursor. Same guard `loadMoreRounds` uses.
        const startedFor = this.roundsGeneration;
        this.roundsLoading.set(true);
        this.roundsError.set(null);
        try {
            const page = await api.friendProfile.rounds({ playerId });
            if (startedFor !== this.roundsGeneration) return;
            this.rounds.set(stitchPage(EMPTY_ROUND_LIST, page));
            this.roundsLoaded.set(true);
            this.unavailable.set(null);
        } catch (err) {
            if (startedFor !== this.roundsGeneration) return;
            this.refuseOr(err, () =>
                this.roundsError.set(failureMessage(err, "Couldn't load these rounds.")),
            );
        } finally {
            if (startedFor === this.roundsGeneration) this.roundsLoading.set(false);
        }
    }

    /**
     * The next page. The cursor rides back verbatim (it is opaque — the server
     * resolves it against its own rows) and `hasMore` is the only stop
     * condition. A failed page keeps what is on screen; a refusal removes it,
     * the same as the first page — access is gone for the whole list, not for
     * the rows not yet fetched.
     */
    async loadMoreRounds(): Promise<void> {
        const playerId = this.playerId.get();
        const state = this.rounds.get();
        if (!playerId || !this.roundsLoaded.get()) return;
        if (!canLoadMore(state) || this.loadingMore.get() || this.roundsLoading.get()) return;
        const startedFor = this.roundsGeneration;
        this.loadingMore.set(true);
        // A retried page that succeeds must also clear the failure it is
        // retrying, or the error line lingers under a complete list.
        this.roundsError.set(null);
        try {
            const page = await api.friendProfile.rounds({
                playerId,
                cursor: state.nextCursor ?? undefined,
            });
            if (startedFor !== this.roundsGeneration) return;
            this.rounds.set(stitchPage(this.rounds.get(), page));
        } catch (err) {
            if (startedFor !== this.roundsGeneration) return;
            this.refuseOr(err, () =>
                this.roundsError.set(failureMessage(err, "Couldn't load more rounds.")),
            );
        } finally {
            if (startedFor === this.roundsGeneration) this.loadingMore.set(false);
        }
    }

    /** One read, no cursor: the server caps the list and reports truncation
     *  with `hasMore` (a browsing aid, not an archive). */
    async loadCourses(force = false): Promise<void> {
        const playerId = this.playerId.get();
        if (!playerId) return;
        if (!force && (this.coursesLoaded.get() || this.coursesLoading.get())) return;
        this.coursesLoading.set(true);
        this.coursesError.set(null);
        try {
            const page = await api.friendProfile.courses({ playerId });
            if (this.playerId.get() !== playerId) return;
            this.courses.set(page.courses);
            this.coursesHasMore.set(page.hasMore);
            this.coursesLoaded.set(true);
            this.unavailable.set(null);
        } catch (err) {
            if (this.playerId.get() !== playerId) return;
            this.refuseOr(err, () =>
                this.coursesError.set(failureMessage(err, "Couldn't load these courses.")),
            );
        } finally {
            if (this.playerId.get() === playerId) this.coursesLoading.set(false);
        }
    }

    /** Forget everything (sign-out) — the next login starts clean. */
    clear(): void {
        this.playerId.set(null);
        this.resetData();
    }

    /** A refusal drops what was on screen — keeping a profile the server just
     *  refused would show data the viewer may no longer see. Anything else is
     *  an ordinary, retryable failure and goes to the caller's error signal. */
    private refuseOr(err: unknown, otherwise: () => void): void {
        const refusal = unavailability(err);
        if (refusal) {
            this.unavailable.set(refusal);
            this.resetData(true);
            return;
        }
        otherwise();
    }

    private resetData(keepRefusal = false): void {
        if (!keepRefusal) this.unavailable.set(null);
        this.profile.set(null);
        this.profileLoaded = false;
        this.profileLoading.set(false);
        this.profileError.set(null);
        this.rounds.set(EMPTY_ROUND_LIST);
        this.roundsGeneration += 1;
        this.roundsLoaded.set(false);
        this.roundsLoading.set(false);
        this.loadingMore.set(false);
        this.roundsError.set(null);
        this.courses.set([]);
        this.coursesHasMore.set(false);
        this.coursesLoaded.set(false);
        this.coursesLoading.set(false);
        this.coursesError.set(null);
    }
}
