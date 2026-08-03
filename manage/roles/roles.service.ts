import { Signal } from '@basics/core/client/core';
import { ApiError } from '@basics/core/client/api-error';
import { notifySessionExpired } from '@basics/core/client/session';
import { api } from '../api';
import type { RoleGrant } from '../../src/api/admin.gen';

/**
 * The caller's own role grants — the ONE thing Manage fetches before it knows
 * who it is talking to.
 *
 * This is deliberately the caller-scoped HALF of `src/admin/admin.service.ts`
 * and nothing else. That service keeps two independent halves for a reason
 * worth restating, because Manage will grow the second half section by
 * section:
 *
 *  - `GET /me/roles` is session-scoped. Any signed-in player may ask it, and a
 *    player with no grants gets an empty list rather than a 403. That is what
 *    makes it safe to call on boot, before any gate has been decided.
 *  - MANAGEMENT payloads (clubs, courses, tees — T4 onward) are gated. They
 *    are only ever fetched from inside a screen the gate has already unlocked,
 *    so an ordinary player never triggers a 403 by merely opening the app.
 *
 * Presentation gates on this; the SERVER gates the writes
 * (`CourseManagementAuthz`). If a grant is revoked mid-session the client's
 * copy is stale and the next write 403s — that is the design, not a hole.
 *
 * DI singleton, so the shell, the gate and every section read one copy.
 */
export class ManageRolesService {
    readonly roles = new Signal<RoleGrant[]>([]);

    /**
     * True once a load has FINISHED — success or failure. The gate needs to
     * distinguish "no grants" from "not asked yet", and an empty `roles` array
     * is both.
     */
    readonly loaded = new Signal(false);

    /**
     * A load that failed for a reason that is not "you are signed out".
     *
     * `AdminService.loadRoles` swallows every failure into an empty list,
     * which is right there: the admin entry point simply does not render, and
     * the page behind it is one screen among many. Here the same silence would
     * be a lie — a dropped connection would paint the full-screen
     * permission-denied state, telling an admin they lack a role they hold.
     * So a transport failure is its own state with a Try again, and only a 401
     * (genuinely signed out) resolves to an empty list.
     */
    readonly error = new Signal<string | null>(null);

    private inflight: Promise<void> | null = null;

    /** The unscoped `super_admin` grant. */
    isSuperAdmin(): boolean {
        return this.has('super_admin');
    }

    /** The grant that may author clubs, courses, tees and tee-role mappings. */
    canManageCourses(): boolean {
        return this.isSuperAdmin() || this.has('course_admin');
    }

    /** Unscoped grant test — Manage has no scoped grants yet (spec §3.8). */
    private has(role: RoleGrant['role']): boolean {
        return this.roles.get().some((g) => g.role === role && g.scopeType === null);
    }

    /**
     * Load the caller's grants. Load-once unless forced; concurrent callers
     * share the in-flight promise, so every caller's continuation runs after
     * the signals are actually populated.
     */
    load(force = false): Promise<void> {
        if (!force && this.inflight) return this.inflight;
        this.inflight = (async () => {
            this.error.set(null);
            try {
                this.roles.set(await api.admin.myRoles());
            } catch (err) {
                this.roles.set([]);
                // A 401 means the session died between the boot probe and this
                // call. Nobody else will notice: the generated clients use
                // `apiFetch` directly, not the framework's `request()` wrapper,
                // so expiry has to be published HERE — AuthService's listener
                // then clears `currentUser` and the shell's gate lands on
                // the sign-in form, not on a false permission-denied screen.
                // Same pattern as `src/request-failure.ts`.
                if (err instanceof ApiError && err.status === 401) {
                    notifySessionExpired();
                } else {
                    this.error.set('Cannot reach the server.');
                    // Let the next attempt actually retry rather than handing
                    // back this settled failure.
                    this.inflight = null;
                }
            } finally {
                this.loaded.set(true);
            }
        })();
        return this.inflight;
    }

    /** Forget everything (sign-out). */
    clear(): void {
        this.roles.set([]);
        this.loaded.set(false);
        this.error.set(null);
        this.inflight = null;
    }
}
