import { Computed, Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { FriendlyRound, Round } from '../api/friendly-rounds.gen';
import type { DashboardRoundEntry } from '../api/dashboard.gen';
import { buildMyRounds, type MyRoundEntry } from './my-rounds';
import { withoutRound } from './round-list';
import {
    getDeviceRounds,
    removeDeviceRound,
    type DeviceRound,
} from './device-rounds';

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

    /** Fetch the logged-in halves. Callers gate this on a live session. */
    async loadMine(): Promise<void> {
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
     * Delete a round by its share token (same trust boundary as scoring — the
     * token IS the credential), then prune it from the loaded lists in place so
     * the row disappears without a full reload. Also drops it from this
     * device's recent list. Resolves false when the server refused; the lists
     * stay untouched.
     */
    async remove(token: string, roundId: string): Promise<boolean> {
        try {
            await api.friendlyRounds.remove({ token });
        } catch {
            return false;
        }
        const mine = this.mine.get();
        if (mine) {
            this.mine.set({
                produced: withoutRound(mine.produced, roundId),
                created: withoutRound(mine.created, roundId),
            });
        }
        this.deviceRounds.set(removeDeviceRound(token));
        return true;
    }
}
