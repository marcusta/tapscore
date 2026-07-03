// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Player {
    id: string;
    username: string;
    displayName: string;
    nickname: null | string;
    avatarUrl: null | string;
    homeClubId: null | string;
    handicapIndex: null | number;
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

export interface PlayersApi {
    me(): Promise<null | Player>;
    register(input: { handicapIndex?: null | number; displayName: string; username: string; password: string }): Promise<Player>;
    updateHandicap(input: { effectiveDate?: string; handicapIndex: number }): Promise<HandicapEntry>;
    myHandicapHistory(): Promise<HandicapEntry[]>;
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
        async myHandicapHistory() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/players/me/handicap-history` });
        },
    };
}
