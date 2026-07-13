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
    create(input: { handicapIndex?: null | number; displayName: string; gender: 'M' | 'F' }): Promise<GuestPlayer>;
}

export function createGuestPlayersClient(baseUrl: string): GuestPlayersApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/guest-players`, body: input });
        },
    };
}
