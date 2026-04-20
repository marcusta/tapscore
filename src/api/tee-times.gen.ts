// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface TeeTime {
    id: string;
    roundId: string;
    startTime: string;
    startHole: 1 | 10;
    capacity: number;
    hittingBay: null | string;
}

export interface TeeTimesApi {
    listByRound(input: { roundId: string }): Promise<TeeTime[]>;
    get(input: { id: string }): Promise<null | TeeTime>;
    create(input: { hittingBay?: null | string; roundId: string; startTime: string; startHole: 1 | 10; capacity: number }): Promise<TeeTime>;
    update(input: { startTime?: string; startHole?: 1 | 10; capacity?: number; hittingBay?: null | string; id: string }): Promise<TeeTime>;
    remove(input: { id: string }): Promise<{ ok: boolean }>;
}

export function createTeeTimesClient(baseUrl: string): TeeTimesApi {
    return {
        async listByRound(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/tee-times/by-round${qs ? '?' + qs : ''}` });
        },
        async get(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/tee-times/get${qs ? '?' + qs : ''}` });
        },
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/tee-times`, body: input });
        },
        async update(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/tee-times/update`, body: input });
        },
        async remove(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/tee-times/${input.id}` });
        },
    };
}
