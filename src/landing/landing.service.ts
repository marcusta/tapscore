import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { FriendlyRound, Round } from '../api/friendly-rounds.gen';

export interface FriendlyRoundListItem {
    friendlyRound: FriendlyRound;
    round: Round;
}

/**
 * The no-login landing list. Every friendly round on the server, newest first
 * — no identity, so this is the shared dogfood directory of rounds anyone can
 * open by tapping through (the share token rides on each row).
 */
export class LandingService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly rounds = new Signal<FriendlyRoundListItem[]>([]);

    async load(): Promise<void> {
        const data = await request(this.loading, this.error, () =>
            api.friendlyRounds.list(),
        );
        if (data) this.rounds.set(data);
    }
}
