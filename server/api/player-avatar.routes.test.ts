import { test, expect } from 'bun:test';
import type { Hono } from 'hono';
import { mount } from '@basics/core/server/mount';
import { seedPlayer } from '../db/seeds/players';
import { setupRoutes, req, loginAs, type RouteTestContext } from '../testing/routes';
import { registerPlayerAvatarRoutes } from './player-avatar';
import { createPlayersApi } from './players.api';
import { MAX_AVATAR_BYTES } from '../services/player-avatar.service';

async function setup(): Promise<RouteTestContext> {
    const ctx = await setupRoutes([seedPlayer]);
    registerPlayerAvatarRoutes(ctx.app, ctx.playerAvatarService);
    mount(
        ctx.app,
        '/api',
        createPlayersApi(ctx.playerService, ctx.handicapService, ctx.friendService, ctx.sessions),
    );
    return ctx;
}

// --- Fixtures ---
//
// Real magic bytes, because sniffing them is the point of the upload gate. The
// payloads are not decodable images and do not need to be: the server never
// decodes one, and a test that leaned on a real JPEG would be testing Bun.

function jpeg(tail = 'a'): Uint8Array<ArrayBuffer> {
    return new Uint8Array([0xff, 0xd8, 0xff, ...new TextEncoder().encode(tail)]);
}

function png(): Uint8Array<ArrayBuffer> {
    return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02]);
}

function webp(): Uint8Array<ArrayBuffer> {
    const bytes = new Uint8Array(16);
    bytes.set(new TextEncoder().encode('RIFF'), 0);
    bytes.set(new TextEncoder().encode('WEBP'), 8);
    return bytes;
}

/** Raw-body request — `req()` is JSON-only, and these routes move images. */
async function upload(
    app: Hono,
    bytes: Uint8Array<ArrayBuffer>,
    cookie?: string,
    headers: Record<string, string> = {},
): Promise<Response> {
    return app.fetch(
        new Request('http://localhost/api/players/me/avatar', {
            method: 'PUT',
            headers: { 'Content-Type': 'image/jpeg', ...(cookie ? { Cookie: cookie } : {}), ...headers },
            body: bytes,
        }),
    );
}

async function fetchAvatar(
    app: Hono,
    playerId: string,
    cookie?: string,
    init: { query?: string; ifNoneMatch?: string } = {},
): Promise<Response> {
    const headers: Record<string, string> = {};
    if (cookie) headers['Cookie'] = cookie;
    if (init.ifNoneMatch) headers['If-None-Match'] = init.ifNoneMatch;
    return app.fetch(
        new Request(`http://localhost/api/players/${playerId}/avatar${init.query ?? ''}`, {
            headers,
        }),
    );
}

// --- Upload ---

test('PUT /api/players/me/avatar without a session is 401', async () => {
    const { app } = await setup();
    expect((await upload(app, jpeg())).status).toBe(401);
});

test('PUT stores the image and answers with its version', async () => {
    const { app } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123');

    const res = await upload(app, jpeg(), cookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contentType).toBe('image/jpeg');
    expect(body.avatarVersion).toMatch(/^[0-9a-f]{16}$/);

    // The same version reaches the client through the ordinary profile read,
    // so a client that never sees the upload response still renders the photo.
    const me = await (await req(app, 'GET', '/api/players/me', undefined, cookie)).json();
    expect(me.avatarVersion).toBe(body.avatarVersion);
});

test('the version is the CONTENT, so re-uploading the same image is a no-op', async () => {
    const { app } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123');

    const first = await (await upload(app, jpeg(), cookie)).json();
    const again = await (await upload(app, jpeg(), cookie)).json();
    expect(again.avatarVersion).toBe(first.avatarVersion);

    // …and a DIFFERENT image is a different version, which is what busts every
    // cache holding the old URL.
    const changed = await (await upload(app, jpeg('b'), cookie)).json();
    expect(changed.avatarVersion).not.toBe(first.avatarVersion);
});

test('PUT replaces rather than accumulates — one photo per player', async () => {
    const ctx = await setup();
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    await upload(ctx.app, jpeg(), cookie);
    await upload(ctx.app, png(), cookie);

    const rows = await ctx.db.selectFrom('player_avatars').select(['version']).execute();
    expect(rows).toHaveLength(1);
});

test('PNG and WEBP are accepted too, typed from their magic bytes', async () => {
    const { app } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123');

    expect((await (await upload(app, png(), cookie)).json()).contentType).toBe('image/png');
    expect((await (await upload(app, webp(), cookie)).json()).contentType).toBe('image/webp');
});

test('the Content-Type header is ignored — the BYTES decide', async () => {
    const { app } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123');

    // Claiming JPEG over PNG bytes stores (and later serves) image/png. The
    // header is caller-supplied and ends up in a response header; trusting it
    // would let a caller choose what the browser does with the response.
    const res = await upload(app, png(), cookie, { 'Content-Type': 'image/jpeg' });
    expect((await res.json()).contentType).toBe('image/png');

    // And a truthful header over bytes that are not an image at all is still a
    // refusal.
    const lie = await upload(app, new TextEncoder().encode('<svg/>'), cookie);
    expect(lie.status).toBe(400);
    expect((await lie.json()).error).toBe('unsupported_type');
});

test('an empty body is refused, not stored as a zero-byte photo', async () => {
    const { app } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123');

    const res = await upload(app, new Uint8Array(0), cookie);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('empty');
});

test('an oversized body is 413, by declared length and by real length', async () => {
    const { app } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123');

    // A lying Content-Length must not get past the cap: the service weighs the
    // bytes it actually received.
    const big = new Uint8Array(MAX_AVATAR_BYTES + 1);
    big.set(jpeg(), 0);
    const lied = await upload(app, big, cookie, { 'Content-Length': '10' });
    expect(lied.status).toBe(413);

    const honest = await upload(app, big, cookie);
    expect(honest.status).toBe(413);
});

// --- Serve ---

test('GET returns the stored bytes with the stored content type', async () => {
    const ctx = await setup();
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    const alice = (await (await req(ctx.app, 'GET', '/api/players/me', undefined, cookie)).json()).id;

    const { avatarVersion } = await (await upload(ctx.app, png(), cookie)).json();

    const res = await fetchAvatar(ctx.app, alice, cookie);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect(res.headers.get('ETag')).toBe(`"${avatarVersion}"`);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(png());
});

test('GET /api/players/me/avatar resolves to the caller', async () => {
    const { app } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123');
    await upload(app, jpeg(), cookie);

    const res = await fetchAvatar(app, 'me', cookie);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
});

test('GET without a session is 401 — a face is not an open read', async () => {
    const { app } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123');
    await upload(app, jpeg(), cookie);

    expect((await fetchAvatar(app, 'me')).status).toBe(401);
});

test('no photo is 404, not a placeholder image', async () => {
    const { app } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123');

    const res = await fetchAvatar(app, 'me', cookie);
    expect(res.status).toBe(404);
});

test('a matching ?v= is immutable; a missing or stale one revalidates', async () => {
    const { app } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123');
    const { avatarVersion } = await (await upload(app, jpeg(), cookie)).json();

    const matched = await fetchAvatar(app, 'me', cookie, { query: `?v=${avatarVersion}` });
    expect(matched.headers.get('Cache-Control')).toContain('immutable');

    const bare = await fetchAvatar(app, 'me', cookie);
    expect(bare.headers.get('Cache-Control')).toBe('private, no-cache');

    const stale = await fetchAvatar(app, 'me', cookie, { query: '?v=0000000000000000' });
    expect(stale.headers.get('Cache-Control')).toBe('private, no-cache');
});

test('If-None-Match on the current version is a bodyless 304', async () => {
    const { app } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123');
    const { avatarVersion } = await (await upload(app, jpeg(), cookie)).json();

    const res = await fetchAvatar(app, 'me', cookie, { ifNoneMatch: `"${avatarVersion}"` });
    expect(res.status).toBe(304);
    expect(await res.arrayBuffer()).toHaveLength(0);

    // A stale ETag gets the new image, not a 304.
    const outdated = await fetchAvatar(app, 'me', cookie, { ifNoneMatch: '"0000000000000000"' });
    expect(outdated.status).toBe(200);
});

// --- Remove ---

test('DELETE removes the photo and is idempotent', async () => {
    const { app } = await setup();
    const cookie = await loginAs(app, 'alice', 'password123');
    await upload(app, jpeg(), cookie);

    const first = await req(app, 'DELETE', '/api/players/me/avatar', undefined, cookie);
    expect(first.status).toBe(200);
    expect((await first.json()).avatarVersion).toBeNull();

    // Gone from the profile read as well as from the serve route.
    const me = await (await req(app, 'GET', '/api/players/me', undefined, cookie)).json();
    expect(me.avatarVersion).toBeNull();
    expect((await fetchAvatar(app, 'me', cookie)).status).toBe(404);

    // Removing an absent photo is not an error — the end state is what the
    // caller asked for either way.
    expect((await req(app, 'DELETE', '/api/players/me/avatar', undefined, cookie)).status).toBe(200);
});

test('DELETE without a session is 401', async () => {
    const { app } = await setup();
    expect((await req(app, 'DELETE', '/api/players/me/avatar')).status).toBe(401);
});

// --- The version reaches the surfaces that draw a face ---

test('a search result carries the subject’s avatarVersion', async () => {
    const ctx = await setup();

    // Bob uploads, Alice searches. The point of the field is that Alice learns
    // Bob has a photo from the SEARCH response — one request for the whole
    // result set — rather than by firing an image request per row to find out.
    await ctx.playerService.register({
        username: 'bob',
        password: 'password123',
        displayName: 'Bob Bengtsson',
    });
    const bobCookie = await loginAs(ctx.app, 'bob', 'password123');
    const { avatarVersion } = await (await upload(ctx.app, jpeg(), bobCookie)).json();

    const aliceCookie = await loginAs(ctx.app, 'alice', 'password123');
    const results = await (
        await req(ctx.app, 'GET', '/api/players/search?q=bob', undefined, aliceCookie)
    ).json();

    expect(results).toHaveLength(1);
    expect(results[0].avatarVersion).toBe(avatarVersion);

    // And removing the photo takes the field back to null, so a client that
    // cached the row stops pointing at an image that is no longer served.
    await req(ctx.app, 'DELETE', '/api/players/me/avatar', undefined, bobCookie);
    const after = await (
        await req(ctx.app, 'GET', '/api/players/search?q=bob', undefined, aliceCookie)
    ).json();
    expect(after[0].avatarVersion).toBeNull();
});

test('GDPR erasure deletes the photo — cascade never fires on a scrubbed row', async () => {
    const ctx = await setup();
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    const alice = (await (await req(ctx.app, 'GET', '/api/players/me', undefined, cookie)).json()).id;
    await upload(ctx.app, jpeg(), cookie);

    // `hardDelete` keeps the `players` row (scrubbed), so ON DELETE CASCADE is
    // no help here — the face has to be deleted by name.
    await ctx.playerService.hardDelete(alice);

    const rows = await ctx.db
        .selectFrom('player_avatars')
        .select(['player_id'])
        .where('player_id', '=', alice)
        .execute();
    expect(rows).toEqual([]);
});
