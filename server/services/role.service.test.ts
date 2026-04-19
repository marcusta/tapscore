import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

async function setup() {
    const ctx = await createTestDb();
    const player = await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice',
    });
    return { ...ctx, playerId: player.id };
}

test('grant inserts a role grant', async () => {
    const { roleService, playerId } = await setup();
    const g = await roleService.grant({ playerId, role: 'super_admin' });
    expect(g.id).toBeString();
    expect(g.role).toBe('super_admin');
    expect(g.scopeType).toBeNull();
    expect(g.scopeId).toBeNull();
});

test('grant rejects unknown role via CHECK', async () => {
    const { roleService, playerId } = await setup();
    await expect(
        roleService.grant({
            playerId,
            // biome-ignore format
            role: 'evil_admin' as 'super_admin',
        }),
    ).rejects.toThrow();
});

test('grant is idempotent on identical scope', async () => {
    const { roleService, playerId } = await setup();
    const a = await roleService.grant({
        playerId,
        role: 'tour_admin',
        scopeType: 'tour',
        scopeId: 'tour-1',
    });
    const b = await roleService.grant({
        playerId,
        role: 'tour_admin',
        scopeType: 'tour',
        scopeId: 'tour-1',
    });
    expect(b.id).toBe(a.id);
});

test('hasRole returns true when grant exists', async () => {
    const { roleService, playerId } = await setup();
    await roleService.grant({
        playerId,
        role: 'competition_admin',
        scopeType: 'competition',
        scopeId: 'comp-7',
    });
    expect(
        await roleService.hasRole(playerId, 'competition_admin', 'competition', 'comp-7'),
    ).toBe(true);
});

test('hasRole returns false on different scope', async () => {
    const { roleService, playerId } = await setup();
    await roleService.grant({
        playerId,
        role: 'competition_admin',
        scopeType: 'competition',
        scopeId: 'comp-7',
    });
    expect(
        await roleService.hasRole(playerId, 'competition_admin', 'competition', 'comp-8'),
    ).toBe(false);
});

test('hasRole with no scope does not match scoped grant', async () => {
    const { roleService, playerId } = await setup();
    await roleService.grant({
        playerId,
        role: 'tour_admin',
        scopeType: 'tour',
        scopeId: 'tour-1',
    });
    expect(await roleService.hasRole(playerId, 'tour_admin')).toBe(false);
});

test('revoke removes the grant', async () => {
    const { roleService, playerId } = await setup();
    await roleService.grant({ playerId, role: 'super_admin' });
    await roleService.revoke({ playerId, role: 'super_admin' });
    expect(await roleService.hasRole(playerId, 'super_admin')).toBe(false);
});

test('listForPlayer returns all grants', async () => {
    const { roleService, playerId } = await setup();
    await roleService.grant({ playerId, role: 'super_admin' });
    await roleService.grant({
        playerId,
        role: 'tour_admin',
        scopeType: 'tour',
        scopeId: 'tour-1',
    });
    const grants = await roleService.listForPlayer(playerId);
    expect(grants).toHaveLength(2);
    expect(grants.map((g) => g.role).sort()).toEqual(['super_admin', 'tour_admin']);
});

test('deleting player cascades to grants', async () => {
    const { roleService, playerId, db } = await setup();
    await roleService.grant({ playerId, role: 'super_admin' });
    await db.deleteFrom('players').where('id', '=', playerId).execute();
    const remaining = await db
        .selectFrom('role_grants')
        .selectAll()
        .where('player_id', '=', playerId)
        .execute();
    expect(remaining).toHaveLength(0);
});
