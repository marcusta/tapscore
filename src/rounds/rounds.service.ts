import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { Round } from '../api/rounds.gen';

export class RoundsService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly rounds = new Signal<Round[]>([]);

    async load(): Promise<void> {
        const data = await request(this.loading, this.error, () => api.rounds.list());
        if (data) this.rounds.set(data);
    }
}
