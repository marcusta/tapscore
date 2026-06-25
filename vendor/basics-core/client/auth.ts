import { Signal } from './core';
import { apiFetch } from './fetch';
import { request, type RequestError } from './request';

export interface AuthUser {
    id: string;
    username: string;
}

interface AuthClient {
    me(): Promise<AuthUser>;
    login(input: { username: string; password: string }): Promise<AuthUser>;
    logout(): Promise<{ ok: boolean }>;
}

function createAuthClient(baseUrl: string): AuthClient {
    return {
        me: () => apiFetch({ method: 'GET', url: `${baseUrl}/auth/me` }),
        login: (input) => apiFetch({ method: 'POST', url: `${baseUrl}/auth/login`, body: input }),
        logout: () => apiFetch({ method: 'POST', url: `${baseUrl}/auth/logout`, body: {} }),
    };
}

export class AuthService {
    private api = createAuthClient('/api');
    readonly currentUser = new Signal<AuthUser | null>(null);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async load(): Promise<void> {
        const user = await request(this.loading, this.error, () => this.api.me());
        if (user) this.currentUser.set(user);
        // 401 on initial load is expected (not logged in) — clear the error
        if (this.error.get()?.code === 'auth') this.error.set(null);
    }

    async login(username: string, password: string): Promise<boolean> {
        const user = await request(this.loading, this.error, () =>
            this.api.login({ username, password }));
        if (user) { this.currentUser.set(user); return true; }
        return false;
    }

    async logout(): Promise<void> {
        await request(this.loading, this.error, () => this.api.logout());
        // Clear user unless a network/timeout error means the server session may persist
        const err = this.error.get();
        if (!err || err.code === 'auth') this.currentUser.set(null);
    }
}
