import { apiFetch } from './fetch';

/**
 * Tiny typed REST wrapper over `apiFetch` for apps that don't use the
 * generated API client flow. You get the same timeout / retry (GET) /
 * dedup (GET) / trace-id behavior as the generated clients.
 *
 * Usage:
 *   const api = createRestClient('/api');
 *   const user = await api.get<User>(`/users/${id}`);
 *   await api.post<User, CreateUserInput>('/users', input);
 *
 * Types are asserted at the call site — this is intentional. Apps that want
 * schema-validated responses should use the codegen flow instead.
 */
export interface RestClient {
    get<T>(path: string, opts?: { timeout?: number }): Promise<T>;
    post<T, B = unknown>(path: string, body?: B, opts?: { timeout?: number }): Promise<T>;
    put<T, B = unknown>(path: string, body?: B, opts?: { timeout?: number }): Promise<T>;
    patch<T, B = unknown>(path: string, body?: B, opts?: { timeout?: number }): Promise<T>;
    delete<T = void>(path: string, opts?: { timeout?: number }): Promise<T>;
}

export function createRestClient(baseUrl = ''): RestClient {
    const url = (path: string) => baseUrl + path;
    return {
        get: (path, opts) => apiFetch({ method: 'GET', url: url(path), timeout: opts?.timeout }),
        post: (path, body, opts) => apiFetch({ method: 'POST', url: url(path), body, timeout: opts?.timeout }),
        put: (path, body, opts) => apiFetch({ method: 'PUT', url: url(path), body, timeout: opts?.timeout }),
        patch: (path, body, opts) => apiFetch({ method: 'PATCH', url: url(path), body, timeout: opts?.timeout }),
        delete: (path, opts) => apiFetch({ method: 'DELETE', url: url(path), timeout: opts?.timeout }),
    };
}
