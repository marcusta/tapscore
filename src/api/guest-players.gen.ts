// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface GuestPlayer {
    id: string;
    displayName: string;
    gender: 'M' | 'F';
    handicapIndex: null | number;
    claimedByPlayerId: null | string;
    claimedAt: null | string;
}

export interface GuestPlayersApi {
    list(): Promise<GuestPlayer[]>;
    get(input: { id: string }): Promise<null | GuestPlayer>;
    create(input: { handicapIndex?: null | number; displayName: string; gender: 'M' | 'F' }): Promise<GuestPlayer>;
}

export function createGuestPlayersClient(baseUrl: string): GuestPlayersApi {
    return {
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/guest-players` });
        },
        async get(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/guest-players/get${qs ? '?' + qs : ''}` });
        },
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/guest-players`, body: input });
        },
    };
}
