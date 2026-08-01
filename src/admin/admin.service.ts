import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type {
    AdminPlayerSummary,
    AdminRoundSummary,
    AdminStats,
    RoleGrant,
} from '../api/admin.gen';

/**
 * The operator view — cross-player reads gated server-side on an unscoped
 * `super_admin` grant (`/api/admin/*`).
 *
 * Two independent halves on purpose:
 *
 *  - `roles` / `isSuperAdmin` — caller-scoped (`/me/roles`), safe to load for
 *    ANY signed-in player. It is what decides whether the admin entry point
 *    renders at all. A non-admin simply gets an empty list; no 403 to handle.
 *  - `stats` / `rounds` / `players` — the admin payload. Only fetched from the
 *    admin page itself, so an ordinary player never triggers a 403.
 *
 * DI singleton: the profile page reads `isSuperAdmin` to decide on the link,
 * the admin page reads the rest, and neither refetches on remount.
 */
export class AdminService {
    // --- Caller-scoped ---

    readonly roles = new Signal<RoleGrant[]>([]);
    private rolesPromise: Promise<void> | null = null;

    // --- Admin-only ---

    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly stats = new Signal<AdminStats | null>(null);
    readonly rounds = new Signal<AdminRoundSummary[]>([]);
    readonly players = new Signal<AdminPlayerSummary[]>([]);

    /** True when the caller holds the global `super_admin` grant. */
    isSuperAdmin(): boolean {
        return this.roles
            .get()
            .some((g) => g.role === 'super_admin' && g.scopeType === null);
    }

    /**
     * Load the caller's own grants. Load-once (unless forced) and quiet: an
     * anonymous caller gets a 401 here, which is not an error worth surfacing
     * — it just means "no roles".
     *
     * Concurrent callers share the in-flight promise, so every caller's
     * `.then` runs after roles are actually populated — a cold /admin load
     * has the shell and the page both calling this before the fetch resolves.
     */
    loadRoles(force = false): Promise<void> {
        if (!force && this.rolesPromise) return this.rolesPromise;
        this.rolesPromise = (async () => {
            try {
                this.roles.set(await api.admin.myRoles());
            } catch {
                this.roles.set([]);
            }
        })();
        return this.rolesPromise;
    }

    /** Forget everything (sign-out). */
    clear(): void {
        this.roles.set([]);
        this.rolesPromise = null;
        this.stats.set(null);
        this.rounds.set([]);
        this.players.set([]);
        this.error.set(null);
    }

    /** The admin page's ONE fetch: counters + round page + player roster. */
    async load(force = false): Promise<void> {
        if (!force && this.stats.get() !== null) return;
        const data = await request(this.loading, this.error, () =>
            Promise.all([
                api.admin.adminStats(),
                api.admin.adminRounds({ limit: 100 }),
                api.admin.adminPlayers(),
            ]),
        );
        if (!data) return;
        const [stats, rounds, players] = data;
        this.stats.set(stats);
        this.rounds.set(rounds);
        this.players.set(players);
    }
}
