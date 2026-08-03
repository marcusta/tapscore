// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Player {
    id: string;
    username: string;
    displayName: string;
    nickname: null | string;
    avatarUrl: null | string;
    avatarVersion: null | string;
    homeClubId: null | string;
    handicapIndex: null | number;
    gender: null | 'M' | 'F';
    handicapConfirmedAt: null | string;
    deletedAt: null | string;
}

export interface HandicapEntry {
    id: string;
    playerId: string;
    handicapIndex: number;
    source: 'manual' | 'calculated' | 'import';
    effectiveDate: string;
    enteredByPlayerId: null | string;
    createdAt: string;
}

export interface PlayerSearchResult {
    id: string;
    username: string;
    displayName: string;
    gender: null | 'M' | 'F';
    handicapIndex: null | number;
    homeClubName: null | string;
    avatarVersion: null | string;
    isFriend: boolean;
}

export interface PlayersApi {
    me(): Promise<null | Player>;
    register(input: { username: string; password: string; displayName: string; handicapIndex?: null | number; gender?: null | 'M' | 'F'; homeClubId?: null | string }): Promise<Player>;
    updateHandicap(input: { handicapIndex: number; effectiveDate?: string }): Promise<HandicapEntry>;
    confirmHandicap(): Promise<Player>;
    myHandicapHistory(): Promise<HandicapEntry[]>;
    updateProfile(input: { displayName?: string; gender?: null | 'M' | 'F'; homeClubId?: null | string }): Promise<Player>;
    search(input: { q?: string }): Promise<PlayerSearchResult[]>;
}

export function createPlayersClient(baseUrl: string): PlayersApi {
    return {
        async me() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/players/me` });
        },
        async register(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/players/register`, body: input });
        },
        async updateHandicap(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/players/me/handicap`, body: input });
        },
        async confirmHandicap() {
            return apiFetch({ method: 'POST', url: `${baseUrl}/players/me/handicap/confirm`, body: {} });
        },
        async myHandicapHistory() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/players/me/handicap-history` });
        },
        async updateProfile(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/players/me/profile`, body: input });
        },
        async search(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/players/search${qs ? '?' + qs : ''}` });
        },
    };
}
