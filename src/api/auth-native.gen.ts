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
    gender: null | 'M' | 'F';
    deletedAt: null | string;
}

export interface AuthNativeApi {
    appleSignIn(input: { fullName?: null | string; identityToken: string }): Promise<{ user: Player; token: string }>;
    revoke(): Promise<{ ok: boolean; userId: string }>;
}

export function createAuthNativeClient(baseUrl: string): AuthNativeApi {
    return {
        async appleSignIn(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/auth/apple`, body: input });
        },
        async revoke() {
            return apiFetch({ method: 'POST', url: `${baseUrl}/auth/revoke`, body: {} });
        },
    };
}
