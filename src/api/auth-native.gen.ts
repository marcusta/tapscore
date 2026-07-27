// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface AuthUser {
    id: string;
    username: string;
}

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
    nativeLogin(input: { username: string; password: string }): Promise<{ user: AuthUser; token: string }>;
    appleSignIn(input: { fullName?: null | string; nonce?: string; identityToken: string }): Promise<{ user: Player; token: string; created: boolean }>;
    revoke(): Promise<{ ok: boolean; userId: string }>;
}

export function createAuthNativeClient(baseUrl: string): AuthNativeApi {
    return {
        async nativeLogin(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/auth/native/login`, body: input });
        },
        async appleSignIn(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/auth/apple`, body: input });
        },
        async revoke() {
            return apiFetch({ method: 'POST', url: `${baseUrl}/auth/revoke`, body: {} });
        },
    };
}
