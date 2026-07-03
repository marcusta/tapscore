// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface PlayerProfile {
    id: string;
    username: string;
    displayName: string;
    gender: null | 'M' | 'F';
    handicapIndex: null | number;
}

export interface Friendship {
    playerId: string;
    friendPlayerId: string;
    createdAt: string;
}

export interface FriendsApi {
    list(): Promise<PlayerProfile[]>;
    add(input: { friendId: string }): Promise<Friendship>;
    remove(input: { friendId: string }): Promise<{ ok: boolean }>;
}

export function createFriendsClient(baseUrl: string): FriendsApi {
    return {
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/friends` });
        },
        async add(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/friends`, body: input });
        },
        async remove(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/friends/${input.friendId}` });
        },
    };
}
