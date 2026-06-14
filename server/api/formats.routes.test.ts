import { test, expect, beforeEach } from 'bun:test';
import { mount } from '@basics/core/server/mount';
import { seedPlayer } from '../db/seeds/players';
import { setupRoutes, req, loginAs } from '../testing/routes';
import { createFormatsApi } from './formats.api';
import { registerBuiltInFormats } from '../domain/formats';

async function setup() {
    const ctx = await setupRoutes([seedPlayer]);
    mount(ctx.app, '/api', createFormatsApi());
    return ctx;
}

beforeEach(() => {
    registerBuiltInFormats();
});

test('GET /api/formats without session returns 401', async () => {
    const { app } = await setup();
    const res = await req(app, 'GET', '/api/formats');
    expect(res.status).toBe(401);
});

test('GET /api/formats returns the registered serializable descriptors', async () => {
    const { app } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123');
    const res = await req(app, 'GET', '/api/formats', undefined, cookie);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<Record<string, unknown>>;

    // Deterministically ordered by descriptor id; covers every built-in.
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(12);
    const ids = data.map((d) => d.id);
    expect(ids).toEqual([...ids].sort());
    expect(ids).toContain('stableford_individual');
    expect(ids).toContain('stroke_play_foursomes');
    expect(ids).toContain('greensomes');
    expect(ids).toContain('scramble');

    const stableford = data.find((d) => d.id === 'stableford_individual')!;
    expect(stableford).toMatchObject({
        label: 'Stableford',
        scoringMode: 'stableford',
        teamShape: 'individual',
        metrics: [{ id: 'points', label: 'Points', direction: 'high' }],
        clientAdapterId: null,
    });
    expect((stableford.requirements as Record<string, unknown>).balls).toBeDefined();
    expect((stableford.defaults as Record<string, unknown>).allowanceConfig).toEqual({
        type: 'flat',
        pct: 100,
    });

    // Descriptor must round-trip as pure JSON (no functions leaked).
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
});
