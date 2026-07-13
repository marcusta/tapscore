import { expect, test } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { setupRoutes, req } from '../testing/routes';
import { createGuestPlayersApi } from './guest-players.api';

async function setup() {
    const ctx = await setupRoutes();
    mount(ctx.app, '/api', createGuestPlayersApi(ctx.guestPlayerService));
    return ctx;
}

test('global guest reads are not exposed, while no-login guest creation remains available', async () => {
    const ctx = await setup();
    const createdRes = await req(ctx.app, 'POST', '/api/guest-players', {
        displayName: 'Anonymous Marker',
        gender: 'M',
        handicapIndex: 12.4,
    });
    expect(createdRes.status).toBe(200);
    const created = await createdRes.json();
    expect(created.displayName).toBe('Anonymous Marker');

    const list = await req(ctx.app, 'GET', '/api/guest-players');
    expect(list.status).toBe(404);
    const listBody = await list.text();
    expect(listBody).not.toContain(created.id);
    expect(listBody).not.toContain(created.displayName);

    const get = await req(ctx.app, 'GET', `/api/guest-players/get?id=${created.id}`);
    expect(get.status).toBe(404);
    const getBody = await get.text();
    expect(getBody).not.toContain(created.id);
    expect(getBody).not.toContain(created.displayName);
});
