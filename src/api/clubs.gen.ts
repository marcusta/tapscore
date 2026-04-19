// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Club {
    id: string;
    name: string;
    location: null | string;
    logoUrl: null | string;
}

export interface ClubsApi {
    list(): Promise<Club[]>;
    get(input: { id: string }): Promise<null | Club>;
    create(input: { location?: null | string; logoUrl?: null | string; name: string }): Promise<Club>;
    update(input: { name?: string; location?: null | string; logoUrl?: null | string; id: string }): Promise<Club>;
    remove(input: { id: string }): Promise<{ ok: boolean }>;
}

export function createClubsClient(baseUrl: string): ClubsApi {
    return {
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/clubs` });
        },
        async get(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/clubs/get${qs ? '?' + qs : ''}` });
        },
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/clubs`, body: input });
        },
        async update(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/clubs/update`, body: input });
        },
        async remove(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/clubs/${input.id}` });
        },
    };
}
