import { Computed, Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { ApiError } from '@basics/core/client/api-error';
import { api } from '../api';
import type { FriendlyRound, Round } from '../api/friendly-rounds.gen';
import type { DashboardRoundEntry } from '../api/dashboard.gen';
import { buildMyRounds, type MyRoundEntry } from './my-rounds';
import { newToYou } from './new-rounds';
import { withoutRound } from './round-list';
import { getSeenRoundIds } from './seen-rounds';
import {
    getDeviceRounds,
    removeDeviceRound,
    type DeviceRound,
} from './device-rounds';
import { forgetSeen } from './seen-rounds';

export interface FriendlyRoundListItem {
    friendlyRound: FriendlyRound;
    round: Round;
}

/**
 * The landing model. There is NO global "all rounds" list any more — the
 * landing shows only the viewer's OWN rounds:
 *
 *  - Logged in: `dashboard/my-rounds` (produced + created), merged/deduped by
 *    `buildMyRounds`, then partitioned into Ongoing / Recently-finished.
 *  - Logged out: no identity ⇒ no dashboard, so the device-local recent list
 *    (localStorage) stands in — the same rounds this device created or opened.
 *
 * The partition itself is pure (`partition.ts`); this service just owns the
 * fetch/signal plumbing and exposes the raw lists the component partitions.
 */
export class LandingService {
    /** Raw `dashboard/my-rounds` halves; null until a logged-in load lands. */
    readonly mine = new Signal<{
        produced: DashboardRoundEntry[];
        created: FriendlyRoundListItem[];
    } | null>(null);
    readonly mineLoading = new Signal(false);
    readonly mineError = new Signal<RequestError | null>(null);

    /** The logged-in merged list (produced+created deduped), newest first. */
    readonly myRounds = new Computed<MyRoundEntry[]>(() => {
        const mine = this.mine.get();
        if (!mine) return [];
        return buildMyRounds(mine.produced, mine.created);
    });

    /** The logged-out device-recent list; a signal so a delete re-renders it. */
    readonly deviceRounds = new Signal<DeviceRound[]>([]);

    /**
     * Device-local "seen" round ids (the set of rounds opened on this device),
     * as a signal so re-reading it after a landing (re)mount reflects rounds
     * opened since — a round opened then navigated back-to drops out of the
     * strip. Refreshed by `loadMine`.
     */
    readonly seenIds = new Signal<Set<string>>(getSeenRoundIds());

    /**
     * The logged-in "New — you were added" list: rounds a friend added you to
     * (you produce a ball, you didn't create) that you haven't opened yet.
     * Empty when logged out (no dashboard) — the component hides the strip.
     */
    readonly newRounds = new Computed<MyRoundEntry[]>(() =>
        newToYou(this.myRounds.get(), this.seenIds.get()),
    );

    /** Fetch the logged-in halves. Callers gate this on a live session. Also
     *  re-reads the device-local seen set so a round opened since the last
     *  landing view has dropped out of the "New — you were added" strip. */
    async loadMine(): Promise<void> {
        this.seenIds.set(getSeenRoundIds());
        const data = await request(this.mineLoading, this.mineError, () =>
            api.dashboard.myRounds(),
        );
        if (data) this.mine.set(data);
    }

    /** (Re)read the device-recent list from localStorage into the signal. */
    loadDevice(): void {
        this.deviceRounds.set(getDeviceRounds());
    }

    /**
     * Forget the signed-in lists and fall back to the device-local ones
     * (sign-out). Signing out while already on '/' never remounts the landing —
     * the route doesn't change, so `render()` doesn't run again — which is why
     * this both drops `mine` AND re-reads the device list: without the re-read
     * the anonymous landing would sit on a stale empty list until a reload.
     */
    clear(): void {
        this.mine.set(null);
        this.mineError.set(null);
        this.mineLoading.set(false);
        this.seenIds.set(getSeenRoundIds());
        this.loadDevice();
    }

    /**
     * Delete a round by its share token (same trust boundary as scoring — the
     * token IS the credential), then prune it from the loaded lists in place so
     * the row disappears without a full reload. Also drops it from this
     * device's recent list. Resolves false when the server refused; the lists
     * stay untouched.
     *
     * A 404 is NOT a refusal — it is the same end state the delete was asking
     * for: the server has no such round (deleted elsewhere, or the row is a
     * leftover from a different backend this device once pointed at). Treating
     * it as failure left those rows permanently undeletable, which is exactly
     * the state a delete exists to escape.
     */
    async remove(token: string, roundId: string): Promise<boolean> {
        try {
            await api.friendlyRounds.remove({ token });
        } catch (error) {
            if (!(error instanceof ApiError) || error.status !== 404) return false;
        }
        const mine = this.mine.get();
        if (mine) {
            this.mine.set({
                produced: withoutRound(mine.produced, roundId),
                created: withoutRound(mine.created, roundId),
            });
        }
        this.deviceRounds.set(removeDeviceRound(token));
        // Housekeeping: drop its seen-id so a deleted round doesn't hold a slot
        // in the capped seen set (and can't linger as phantom seen-state).
        forgetSeen(roundId);
        return true;
    }
}
