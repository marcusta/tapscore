import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { FriendlyRound, Round } from '../api/friendly-rounds.gen';

/**
 * Loads a single FriendlyRound by its share token — the no-login entry point a
 * share link lands on. The token is the only credential.
 */
export class RoundViewService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly friendlyRound = new Signal<FriendlyRound | null>(null);
    readonly round = new Signal<Round | null>(null);

    async loadByToken(token: string): Promise<void> {
        const data = await request(this.loading, this.error, () =>
            api.friendlyRounds.byToken({ token }),
        );
        if (data) {
            this.friendlyRound.set(data.friendlyRound);
            this.round.set(data.round);
        }
    }
}
