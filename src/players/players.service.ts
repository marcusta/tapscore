import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { GuestPlayer } from '../api/guest-players.gen';

export class PlayersService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly guests = new Signal<GuestPlayer[]>([]);

    async load(): Promise<void> {
        const data = await request(this.loading, this.error, () => api.guestPlayers.list());
        if (data) this.guests.set(data);
    }

    async create(input: {
        displayName: string;
        gender: 'M' | 'F';
        handicapIndex: number | null;
    }): Promise<GuestPlayer | null> {
        const created = await request(this.loading, this.error, () =>
            api.guestPlayers.create(input));
        if (created) this.guests.update((list) => [...list, created]);
        return created ?? null;
    }
}
