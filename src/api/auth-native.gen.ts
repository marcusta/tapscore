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
    avatarVersion: null | string;
    homeClubId: null | string;
    handicapIndex: null | number;
    gender: null | 'M' | 'F';
    handicapConfirmedAt: null | string;
    deletedAt: null | string;
}

export interface AuthNativeApi {
    nativeLogin(input: { username: string; password: string }): Promise<{ user: AuthUser; token: string }>;
    appleSignIn(input: { identityToken: string; fullName?: null | string; nonce?: string }): Promise<{ user: Player; token: string; created: boolean }>;
    credentials(): Promise<{ providers: ('password' | 'apple')[] }>;
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
        async credentials() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/auth/credentials` });
        },
        async revoke() {
            return apiFetch({ method: 'POST', url: `${baseUrl}/auth/revoke`, body: {} });
        },
    };
}
