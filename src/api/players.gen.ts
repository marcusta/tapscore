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
}

export interface PlayersApi {
    me(): Promise<null | Player>;
}

export function createPlayersClient(baseUrl: string): PlayersApi {
    return {
        async me() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/players/me` });
        },
    };
}
