import { Computed, Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { FriendlyRound, Round } from '../api/friendly-rounds.gen';
import type { DashboardRoundEntry } from '../api/dashboard.gen';
import { buildMyRounds, type MyRoundEntry } from './my-rounds';

export interface FriendlyRoundListItem {
    friendlyRound: FriendlyRound;
    round: Round;
}

/**
 * The no-login landing list. Every friendly round on the server, newest first
 * — no identity, so this is the shared dogfood directory of rounds anyone can
 * open by tapping through (the share token rides on each row).
 *
 * When a session exists the landing is enriched with "My rounds" —
 * `dashboard/my-rounds` (produced + created), merged/deduped by
 * `buildMyRounds`. Produced entries carry no share token, so tokens for them
 * are joined from the public list above. Logged out, `loadMine` is never
 * called and the landing renders exactly as before.
 */
export class LandingService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly rounds = new Signal<FriendlyRoundListItem[]>([]);

    /** Raw `dashboard/my-rounds` halves; null until a logged-in load lands. */
    readonly mine = new Signal<{
        produced: DashboardRoundEntry[];
        created: FriendlyRoundListItem[];
    } | null>(null);
    readonly mineLoading = new Signal(false);
    /** Non-fatal: a failed My-rounds fetch must not flag the public list. */
    readonly mineError = new Signal<RequestError | null>(null);

    readonly myRounds = new Computed<MyRoundEntry[]>(() => {
        const mine = this.mine.get();
        if (!mine) return [];
        return buildMyRounds(mine.produced, mine.created, this.rounds.get());
    });

    async load(): Promise<void> {
        const data = await request(this.loading, this.error, () =>
            api.friendlyRounds.list(),
        );
        if (data) this.rounds.set(data);
    }

    /** Fetch the logged-in halves. Callers gate this on a live session. */
    async loadMine(): Promise<void> {
        const data = await request(this.mineLoading, this.mineError, () =>
            api.dashboard.myRounds(),
        );
        if (data) this.mine.set(data);
    }
}
