import { beforeEach, expect, mock, test } from 'bun:test';
import type { RoleGrant } from '../../src/api/admin.gen';

// The caller-scoped half of AdminService — the one the account menu reads to
// decide whether the Admin row renders. Same harness as the other service
// tests: mock `../../src/api`, then import.

function grant(over: Partial<RoleGrant> = {}): RoleGrant {
    return {
        id: 'g1',
        playerId: 'p1',
        role: 'super_admin',
        scopeType: null,
        scopeId: null,
        grantedAt: '2026-07-26',
        ...over,
    };
}

const state: { roles: RoleGrant[]; fail: boolean; calls: number } = {
    roles: [],
    fail: false,
    calls: 0,
};

const apiMock = {
    admin: {
        myRoles: mock(async () => {
            state.calls += 1;
            if (state.fail) throw new Error('boom');
            return state.roles;
        }),
    },
};

mock.module('../../src/api', () => ({ api: apiMock }));

const { AdminService } = await import('../../src/admin/admin.service');

beforeEach(() => {
    state.roles = [];
    state.fail = false;
    state.calls = 0;
});

test('roles are fetched once per session, however many surfaces ask', async () => {
    state.roles = [grant()];
    const svc = new AdminService();
    // Landing menu mount, remount, profile screen — one request.
    await svc.loadRoles();
    await svc.loadRoles();
    await svc.loadRoles();
    expect(state.calls).toBe(1);
    expect(svc.isSuperAdmin()).toBe(true);
});

test('a second caller during the in-flight fetch awaits the same result', async () => {
    // Cold /admin load: the shell calls loadRoles() first, the admin page
    // calls it again before the fetch resolves. The page's `.then` must see
    // the populated roles, not the initial [].
    state.roles = [grant()];
    const svc = new AdminService();
    const first = svc.loadRoles();
    const second = svc.loadRoles().then(() => svc.isSuperAdmin());
    await first;
    expect(await second).toBe(true);
    expect(state.calls).toBe(1);
});

test('only an UNSCOPED super_admin grant counts', async () => {
    state.roles = [grant({ scopeType: 'competition', scopeId: 'c1' })];
    const svc = new AdminService();
    await svc.loadRoles();
    expect(svc.isSuperAdmin()).toBe(false);

    const other = new AdminService();
    state.roles = [grant({ role: 'competition_admin' })];
    await other.loadRoles();
    expect(other.isSuperAdmin()).toBe(false);
});

test('a failed roles fetch fails closed (no grants, no Admin row)', async () => {
    state.fail = true;
    const svc = new AdminService();
    await svc.loadRoles();
    expect(svc.roles.get()).toEqual([]);
    expect(svc.isSuperAdmin()).toBe(false);
});

test('clear() forgets the grants and re-arms the fetch (sign-out)', async () => {
    state.roles = [grant()];
    const svc = new AdminService();
    await svc.loadRoles();
    svc.clear();
    expect(svc.isSuperAdmin()).toBe(false);
    await svc.loadRoles();
    expect(state.calls).toBe(2);
});
