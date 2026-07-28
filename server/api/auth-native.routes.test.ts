// Native track N2 — /auth/apple + /auth/revoke (ADR-0005).
//
// These are the gate proofs, taken at APP level through the real middleware
// stack (`createAuth` from @basics/core), not against the service in
// isolation: "cookie and bearer sessions resolve identically" is a claim about
// the middleware, so a service-level assertion would prove the wrong thing.
//
// Every token here is forged locally against a generated keypair — see
// server/testing/apple.ts. Nothing touches the network.

import { test, expect } from 'bun:test';
import type { Hono } from 'hono';
import { mount } from '@basics/core/server/mount';
import { seedPlayer } from '../db/seeds/players';
import { setupRoutes, req, loginAs, extractSessionCookie } from '../testing/routes';
import { createAuthNativeApi } from './auth-native.api';
import { createPlayersApi } from './players.api';
import { AppleJwksCache, createAppleTokenVerifier } from '../services/apple-identity';
import { appleClaims, appleTestKey, TEST_AUDIENCE } from '../testing/apple';

const key = await appleTestKey();

async function setup(options: { maxBuckets?: number } = {}) {
    const ctx = await setupRoutes([seedPlayer]);
    mount(
        ctx.app,
        '/api',
        createAuthNativeApi(
            ctx.playerService,
            ctx.sessions,
            createAppleTokenVerifier({
                audience: TEST_AUDIENCE,
                keys: new AppleJwksCache({ fetchJwks: key.fetchJwks }),
            }),
            options,
        ),
    );
    mount(
        ctx.app,
        '/api',
        createPlayersApi(ctx.playerService, ctx.handicapService, ctx.friendService, ctx.sessions),
    );
    return ctx;
}

/** `Authorization: Bearer <token>` — the native client's whole transport. */
function bearer(app: Hono, method: string, path: string, token: string, body?: unknown) {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    return app.fetch(
        new Request(`http://localhost${path}`, {
            method,
            headers,
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        }),
    );
}

/** Both transports at once — the confused-deputy shape /auth/revoke guards. */
function bearerAndCookie(app: Hono, method: string, path: string, token: string, cookie: string) {
    return app.fetch(
        new Request(`http://localhost${path}`, {
            method,
            headers: { Authorization: `Bearer ${token}`, Cookie: cookie },
        }),
    );
}

async function signIn(
    app: Hono,
    claims: Record<string, unknown> = {},
    extra: { fullName?: string; cookie?: string } = {},
) {
    return req(
        app,
        'POST',
        '/api/auth/apple',
        {
            identityToken: await key.sign(appleClaims(claims)),
            ...(extra.fullName !== undefined ? { fullName: extra.fullName } : {}),
        },
        extra.cookie,
    );
}

async function credentialsFor(ctx: Awaited<ReturnType<typeof setup>>, playerId: string) {
    return ctx.db
        .selectFrom('player_credentials')
        .selectAll()
        .where('player_id', '=', playerId)
        .execute();
}

/** `POST /auth/native/login` — the bearer sibling of the cookie login. */
function nativeLogin(app: Hono, username: string, password: string) {
    return req(app, 'POST', '/api/auth/native/login', { username, password });
}

// --- Native password login (N5) -----------------------------------------
//
// Why this endpoint exists at all is the link-first journey pinned at the
// bottom of this file: without a native password door, an existing web user
// installing the app can only reach /auth/apple session-less, which FORKS a
// second players row for a human who already exists — and ADR-0005 defers
// merging two separate player rows indefinitely.

test('POST /api/auth/native/login returns a bearer token and sets NO cookie', async () => {
    const ctx = await setup();

    const res = await nativeLogin(ctx.app, 'alice', 'password123');
    expect(res.status).toBe(200);

    const { user, token } = await res.json();
    expect(user.username).toBe('alice');
    expect(token).toBeString();
    expect(token.length).toBeGreaterThan(0);

    // NATIVE delivery: the body is the whole transport (contrast the
    // framework's /auth/login, which answers with a Set-Cookie).
    expect(extractSessionCookie(res)).toBeUndefined();

    // The token resolves through the SAME middleware the cookie goes through.
    const me = await bearer(ctx.app, 'GET', '/api/auth/me', token);
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual({ id: user.id, username: 'alice' });

    // ...and on an ordinary requireAuth() route too.
    const profile = await bearer(ctx.app, 'GET', '/api/players/me', token);
    expect(profile.status).toBe(200);
    expect((await profile.json()).id).toBe(user.id);
});

test('the cookie login still owns /auth/login — the native route did not shadow it', async () => {
    // The framework's createAuthApi is mounted FIRST, and Hono lets the first
    // registered handler for a path win. Pinning this is why the native route
    // is /auth/native/login: a second POST /auth/login here would have been
    // silently dead code, and every native login would have quietly kept
    // getting a cookie instead of a token.
    const ctx = await setup();

    const cookieRes = await req(ctx.app, 'POST', '/api/auth/login', {
        username: 'alice',
        password: 'password123',
    });
    expect(cookieRes.status).toBe(200);
    expect(extractSessionCookie(cookieRes)).toBeDefined();
    expect((await cookieRes.json()).token).toBeUndefined();
});

test('wrong password and unknown username answer IDENTICALLY — no existence oracle', async () => {
    const ctx = await setup();

    const wrongPassword = await nativeLogin(ctx.app, 'alice', 'not-her-password');
    const unknownUser = await nativeLogin(ctx.app, 'nobody-at-all', 'not-her-password');

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    // Byte-identical bodies. A difference here — a distinct code, a distinct
    // message, even a distinct key order — is a username enumeration oracle.
    const a = await wrongPassword.json();
    const b = await unknownUser.json();
    expect(a).toEqual({ error: 'Invalid credentials' });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
});

test('an apple-only player cannot log in with a password (zero credentials of that kind)', async () => {
    const ctx = await setup();
    const { user } = await (await signIn(ctx.app, { sub: 'apple-only' })).json();

    const res = await nativeLogin(ctx.app, user.username, 'password123');
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Invalid credentials' });
});

test('POST /api/auth/native/login with a missing field is a 400, not a 401', async () => {
    const ctx = await setup();
    expect((await req(ctx.app, 'POST', '/api/auth/native/login', { username: 'alice' })).status).toBe(
        400,
    );
    expect((await req(ctx.app, 'POST', '/api/auth/native/login', {})).status).toBe(400);
});

test('native login is rate limited per USERNAME — the 6th attempt is a 429', async () => {
    const ctx = await setup();

    // Five wrong guesses are honest 401s...
    for (let i = 0; i < 5; i++) {
        expect((await nativeLogin(ctx.app, 'alice', `guess-${i}`)).status).toBe(401);
    }
    // ...the sixth is throttled.
    const limited = await nativeLogin(ctx.app, 'alice', 'guess-5');
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: 'Too many attempts' });

    // Throttling is not a bypass: the CORRECT password is refused too while
    // the window is open.
    expect((await nativeLogin(ctx.app, 'alice', 'password123')).status).toBe(429);

    // A different username is not collateral damage — including one that does
    // not exist, since the bucket is keyed on what was submitted.
    expect((await nativeLogin(ctx.app, 'someone-else', 'whatever')).status).toBe(401);
});

test('the login limiter and the apple limiter are separate keyspaces', async () => {
    const ctx = await setup();

    // Burn alice's login window.
    for (let i = 0; i < 5; i++) await nativeLogin(ctx.app, 'alice', 'wrong');
    expect((await nativeLogin(ctx.app, 'alice', 'wrong')).status).toBe(429);

    // A shared map keyed by a bare string would let a username throttle an
    // Apple sub of the same name (and vice versa). Apple sign-in is untouched.
    expect((await signIn(ctx.app, { sub: 'alice' })).status).toBe(200);
});

// --- Happy path: sign-up through /auth/apple ----------------------------

test('POST /api/auth/apple creates a player, its apple credential, and a working bearer session', async () => {
    const ctx = await setup();
    const res = await signIn(ctx.app, { sub: 'apple-sub-1' }, { fullName: 'Åsa Öberg' });
    expect(res.status).toBe(200);

    const { user, token } = await res.json();
    expect(user.displayName).toBe('Åsa Öberg');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);

    // NATIVE path: no cookie is set — the token is the delivery.
    expect(extractSessionCookie(res)).toBeUndefined();

    // Generated handle: slugified name + a random suffix (see
    // `appleUsernameCandidate`); diacritics folded, never a bare `asa`.
    expect(user.username).toMatch(/^asa-oberg-[0-9a-f]{6}$/);

    // The credential row exists, with NO fabricated password hash.
    const credentials = await credentialsFor(ctx, user.id);
    expect(credentials).toHaveLength(1);
    expect(credentials[0]).toMatchObject({
        provider: 'apple',
        subject: 'apple-sub-1',
        password_hash: null,
    });

    // Bearer parity: the returned token resolves through the SAME middleware
    // the cookie goes through.
    const me = await bearer(ctx.app, 'GET', '/api/auth/me', token);
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual({ id: user.id, username: user.username });

    // ...and it works on an ordinary requireAuth() route too.
    const profile = await bearer(ctx.app, 'GET', '/api/players/me', token);
    expect(profile.status).toBe(200);
    expect((await profile.json()).id).toBe(user.id);
});

test('a nameless first authorization gets a placeholder display name and a golfer handle', async () => {
    const ctx = await setup();
    const res = await signIn(ctx.app, { sub: 'apple-sub-nameless' });
    expect(res.status).toBe(200);

    const { user } = await res.json();
    expect(user.displayName).toBe('New golfer');
    expect(user.username).toMatch(/^golfer-[0-9a-f]{6}$/);
});

test('the email is never mined for a display name (private relay would poison it)', async () => {
    const ctx = await setup();
    const res = await signIn(ctx.app, {
        sub: 'apple-sub-relay',
        email: 'a1b2c3d4e5@privaterelay.appleid.com',
    });
    expect((await res.json()).user.displayName).toBe('New golfer');
});

// --- First-authorization name capture (the ADR's pinned obligation) -----

test('Apple name capture is first-write-wins: replays never clobber display_name', async () => {
    const ctx = await setup();

    const first = await signIn(ctx.app, { sub: 'apple-sub-2' }, { fullName: 'Bo Bengtsson' });
    const created = (await first.json()).user;
    expect(created.displayName).toBe('Bo Bengtsson');

    // Replay WITHOUT the name — Apple sends it only on first authorization.
    const replay = await signIn(ctx.app, { sub: 'apple-sub-2' });
    expect(replay.status).toBe(200);
    const same = (await replay.json()).user;
    expect(same.id).toBe(created.id);
    expect(same.displayName).toBe('Bo Bengtsson');

    // Replay WITH a different name — by now the stored name may be one the
    // player edited themself, so it still must not be overwritten.
    const renamed = await signIn(ctx.app, { sub: 'apple-sub-2' }, { fullName: 'Someone Else' });
    expect((await renamed.json()).user.displayName).toBe('Bo Bengtsson');

    // Still ONE player and ONE credential — a replay is a sign-IN, not a sign-up.
    const players = await ctx.playerService.list();
    expect(players.filter((p) => p.id === created.id)).toHaveLength(1);
    expect(players).toHaveLength(2); // alice + this one
    expect(await credentialsFor(ctx, created.id)).toHaveLength(1);
});

// --- Rejections: 401 with a typed code, never a 500, never a player -----

const rejections: Array<[string, () => Promise<string>, string]> = [
    [
        'wrong audience',
        () => key.sign(appleClaims({ aud: 'se.someone.else' })),
        'apple_token_bad_audience',
    ],
    [
        'expired',
        () => key.sign(appleClaims({ exp: Math.floor(Date.now() / 1000) - 60 })),
        'apple_token_expired',
    ],
    [
        'wrong issuer',
        () => key.sign(appleClaims({ iss: 'https://evil.example' })),
        'apple_token_bad_issuer',
    ],
    ['garbage', async () => 'not-a-jwt-at-all', 'apple_token_malformed'],
];

for (const [label, makeToken, code] of rejections) {
    test(`POST /api/auth/apple rejects a ${label} token with 401 ${code} and creates nothing`, async () => {
        const ctx = await setup();
        const before = (await ctx.playerService.list()).length;

        const res = await req(ctx.app, 'POST', '/api/auth/apple', {
            identityToken: await makeToken(),
        });
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({ error: code });
        expect((await ctx.playerService.list()).length).toBe(before);
    });
}

test('POST /api/auth/apple rejects a token signed by an impostor key', async () => {
    const ctx = await setup();
    const impostor = await appleTestKey({ kid: key.kid }); // same kid, other key
    const res = await req(ctx.app, 'POST', '/api/auth/apple', {
        identityToken: await impostor.sign(appleClaims({ sub: 'apple-sub-forged' })),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'apple_token_bad_signature' });
    expect(await ctx.playerService.list()).toHaveLength(1); // alice only
});

test('POST /api/auth/apple without an identityToken is a 400, not a 401', async () => {
    const ctx = await setup();
    const res = await req(ctx.app, 'POST', '/api/auth/apple', {});
    expect(res.status).toBe(400);
});

// --- `created`: sign-UP vs sign-IN, told apart on the wire ---------------
//
// The player body is the same shape either way, so the client cannot infer
// which happened — and it must, to decide between onboarding and the rounds
// list. Pinned in all three branches.

test('created is true for a virgin sub and false for a known one', async () => {
    const ctx = await setup();

    const first = await signIn(ctx.app, { sub: 'created-flag' }, { fullName: 'Ines I.' });
    const firstBody = await first.json();
    expect(firstBody.created).toBe(true);

    const second = await signIn(ctx.app, { sub: 'created-flag' });
    const secondBody = await second.json();
    expect(secondBody.created).toBe(false);
    // Same human — `created` describes the CALL, not the player.
    expect(secondBody.user.id).toBe(firstBody.user.id);
});

test('created is false on the LINKING branch — linking never mints a player', async () => {
    const ctx = await setup();
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    const link = await signIn(ctx.app, { sub: 'alice-apple' }, { cookie });
    expect(link.status).toBe(200);
    expect((await link.json()).created).toBe(false);
    expect(await ctx.playerService.list()).toHaveLength(1);
});

// --- One human, two credentials -----------------------------------------

test('cookie login and /auth/apple resolve to the SAME players.id once both credentials exist', async () => {
    const ctx = await setup();

    // Alice links Apple from her authenticated web session.
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    const link = await signIn(ctx.app, { sub: 'alice-apple' }, { cookie });
    expect(link.status).toBe(200);
    const linked = await link.json();

    const viaCookie = await req(ctx.app, 'GET', '/api/auth/me', undefined, cookie);
    const cookieId = (await viaCookie.json()).id;
    expect(linked.user.id).toBe(cookieId);

    // A LATER, session-less Apple sign-in lands on the same player — the
    // credential row, not a second human.
    const native = await signIn(ctx.app, { sub: 'alice-apple' });
    const nativeBody = await native.json();
    expect(nativeBody.user.id).toBe(cookieId);
    expect(nativeBody.user.username).toBe('alice');

    // Same identity through both transports, via the same middleware.
    const viaBearer = await bearer(ctx.app, 'GET', '/api/auth/me', nativeBody.token);
    expect(await viaBearer.json()).toEqual(await (await req(ctx.app, 'GET', '/api/auth/me', undefined, cookie)).json());

    // Two credentials, one player. Linking did not create a player.
    const credentials = await credentialsFor(ctx, cookieId);
    expect(credentials.map((c) => c.provider).sort()).toEqual(['apple', 'password']);
    expect(await ctx.playerService.list()).toHaveLength(1);
});

test('linking is idempotent — re-linking the same sub changes nothing', async () => {
    const ctx = await setup();
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    await signIn(ctx.app, { sub: 'alice-apple' }, { cookie });
    const again = await signIn(ctx.app, { sub: 'alice-apple' }, { cookie });
    expect(again.status).toBe(200);

    const id = (await again.json()).user.id;
    expect(await credentialsFor(ctx, id)).toHaveLength(2);
});

test('linking a sub owned by ANOTHER player is a 409 and changes nothing', async () => {
    const ctx = await setup();

    // A native-only human owns the sub first.
    const owner = (await (await signIn(ctx.app, { sub: 'contested-sub' })).json()).user;

    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    const alice = await (await req(ctx.app, 'GET', '/api/auth/me', undefined, cookie)).json();

    const res = await signIn(ctx.app, { sub: 'contested-sub' }, { cookie });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('apple_subject_taken');

    // Nothing moved: the sub still belongs to the original player and alice
    // gained no credential.
    const ownerCredentials = await credentialsFor(ctx, owner.id);
    expect(ownerCredentials).toHaveLength(1);
    expect(ownerCredentials[0]!.subject).toBe('contested-sub');
    expect(await credentialsFor(ctx, alice.id)).toHaveLength(1);
    expect(await ctx.playerService.list()).toHaveLength(2);
});

// --- /auth/revoke: the native logout ------------------------------------

test('POST /api/auth/revoke ends the PRESENTED bearer session', async () => {
    const ctx = await setup();
    const { token } = await (await signIn(ctx.app, { sub: 'revoke-me' })).json();

    expect((await bearer(ctx.app, 'GET', '/api/auth/me', token)).status).toBe(200);

    const revoke = await bearer(ctx.app, 'POST', '/api/auth/revoke', token);
    expect(revoke.status).toBe(200);
    expect((await revoke.json()).ok).toBe(true);

    expect((await bearer(ctx.app, 'GET', '/api/auth/me', token)).status).toBe(401);
});

test('revoking one bearer session leaves the same player’s other sessions alone', async () => {
    const ctx = await setup();
    const first = await (await signIn(ctx.app, { sub: 'two-devices' })).json();
    const second = await (await signIn(ctx.app, { sub: 'two-devices' })).json();
    expect(second.user.id).toBe(first.user.id);
    expect(second.token).not.toBe(first.token);

    await bearer(ctx.app, 'POST', '/api/auth/revoke', first.token);

    expect((await bearer(ctx.app, 'GET', '/api/auth/me', first.token)).status).toBe(401);
    expect((await bearer(ctx.app, 'GET', '/api/auth/me', second.token)).status).toBe(200);
});

test('a cookie session is untouched by /auth/revoke and cannot use it', async () => {
    const ctx = await setup();
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    // Authenticated, but nothing bearer-shaped was presented.
    const res = await req(ctx.app, 'POST', '/api/auth/revoke', undefined, cookie);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('bearer_token_required');

    // The cookie session still works — the framework's /auth/logout owns it.
    expect((await req(ctx.app, 'GET', '/api/auth/me', undefined, cookie)).status).toBe(200);
});

test('POST /api/auth/revoke without any session is a 401', async () => {
    const ctx = await setup();
    expect((await req(ctx.app, 'POST', '/api/auth/revoke')).status).toBe(401);
    expect((await bearer(ctx.app, 'POST', '/api/auth/revoke', 'not-a-real-token')).status).toBe(401);
});

test('a cookie session cannot revoke ANOTHER player’s bearer token', async () => {
    const ctx = await setup();

    // The victim: a native-only human with a working bearer session.
    const victim = await (await signIn(ctx.app, { sub: 'victim' })).json();
    expect((await bearer(ctx.app, 'GET', '/api/auth/me', victim.token)).status).toBe(200);

    // The attacker: authenticated by COOKIE (which wins in `createAuth`), but
    // presenting the victim's token in the header. Without an ownership check
    // the handler would happily destroy it.
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    const res = await bearerAndCookie(ctx.app, 'POST', '/api/auth/revoke', victim.token, cookie);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('bearer_token_required');

    // The victim's session is untouched...
    expect((await bearer(ctx.app, 'GET', '/api/auth/me', victim.token)).status).toBe(200);
    // ...and so is the attacker's own cookie session.
    expect((await req(ctx.app, 'GET', '/api/auth/me', undefined, cookie)).status).toBe(200);
});

test('a garbage bearer token alongside a cookie answers exactly like a stolen one', async () => {
    const ctx = await setup();
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    // Same status, same code as the stolen-token case above: nothing here
    // tells an attacker whether a guessed token exists.
    const res = await bearerAndCookie(ctx.app, 'POST', '/api/auth/revoke', 'not-a-real-token', cookie);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('bearer_token_required');
});

test('the ownership check still lets a caller revoke its OWN token, cookie or not', async () => {
    const ctx = await setup();
    const cookie = await loginAs(ctx.app, 'alice', 'password123');

    // Alice links Apple from her web session and gets a bearer token for the
    // same player — cookie and token now name the SAME id, so revoking is hers
    // to do even with the cookie present.
    const linked = await (await signIn(ctx.app, { sub: 'alice-apple' }, { cookie })).json();

    const res = await bearerAndCookie(ctx.app, 'POST', '/api/auth/revoke', linked.token, cookie);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, userId: linked.user.id });

    expect((await bearer(ctx.app, 'GET', '/api/auth/me', linked.token)).status).toBe(401);
    // Revoking the bearer token did not end the cookie session.
    expect((await req(ctx.app, 'GET', '/api/auth/me', undefined, cookie)).status).toBe(200);
});

// --- Rate limiting -------------------------------------------------------

test('/auth/apple is rate limited per apple subject, and other subjects are unaffected', async () => {
    const ctx = await setup();

    // The limiter keys on the CLAIMED sub, so it bites even for tokens that
    // would fail verification — that is the brute-force case it exists for.
    for (let i = 0; i < 5; i++) {
        const res = await signIn(ctx.app, { sub: 'noisy', aud: 'wrong' });
        expect(res.status).toBe(401);
    }
    const limited = await signIn(ctx.app, { sub: 'noisy', aud: 'wrong' });
    expect(limited.status).toBe(429);

    // A different human is not collateral damage.
    expect((await signIn(ctx.app, { sub: 'quiet' })).status).toBe(200);
});

test('the limiter’s bucket map is hard-capped — the oldest bucket is dropped, memory is not', async () => {
    // Ceiling of 2 so the eviction is reachable in a handful of requests; in
    // production it is 10_000. The `sub` is attacker-chosen, so without this
    // cap a flood of distinct subs would grow the map without limit.
    const ctx = await setup({ maxBuckets: 2 });
    const spend = (sub: string) => signIn(ctx.app, { sub, aud: 'wrong' });

    // 'noisy' burns its whole window and is now throttled.
    for (let i = 0; i < 5; i++) expect((await spend('noisy')).status).toBe(401);
    expect((await spend('noisy')).status).toBe(429);

    // Two more subjects arrive. The second one finds the map full of LIVE
    // buckets, so the oldest — 'noisy' — is dropped.
    expect((await spend('flood-1')).status).toBe(401);
    expect((await spend('flood-2')).status).toBe(401);

    // The accepted cost of the ceiling, pinned so it is a decision and not a
    // surprise: 'noisy' lost its throttle along with its bucket.
    expect((await spend('noisy')).status).toBe(401);
});

// --- Nonce binding (N4) -------------------------------------------------
//
// Closes the replay window N2 accepted. All four quadrants of
// (request `nonce`, token `nonce` claim) are exercised through the route, with
// forged tokens, because the interesting failure mode is a WIRING one: a
// binding checked in the service but never called by the route would still
// pass every unit test in apple-identity.test.ts.

const NONCE_RAW = 'tapscore-nonce-vector-1';
const NONCE_SHA256_HEX = '18b0d0b1e8c4a4871b83352808fa1781c9f1f8c19038640719b2832996f65d1c';

async function signInWithNonce(
    app: Hono,
    options: { claimNonce?: string; requestNonce?: string; sub?: string },
) {
    return req(app, 'POST', '/api/auth/apple', {
        identityToken: await key.sign(
            appleClaims({
                sub: options.sub ?? 'apple-nonce-sub',
                ...(options.claimNonce !== undefined ? { nonce: options.claimNonce } : {}),
            }),
        ),
        ...(options.requestNonce !== undefined ? { nonce: options.requestNonce } : {}),
    });
}

test('nonce quadrant: request nonce + matching token claim signs in', async () => {
    const ctx = await setup();
    const res = await signInWithNonce(ctx.app, {
        requestNonce: NONCE_RAW,
        claimNonce: NONCE_SHA256_HEX,
        sub: 'nonce-ok',
    });

    expect(res.status).toBe(200);
    expect((await res.json()).token).toBeString();
});

test('nonce quadrant: request nonce, token claim MISSING → 401 apple_nonce_missing', async () => {
    const ctx = await setup();
    const res = await signInWithNonce(ctx.app, { requestNonce: NONCE_RAW, sub: 'nonce-missing' });

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('apple_nonce_missing');
});

test('nonce quadrant: request nonce ≠ token claim → 401 apple_nonce_mismatch', async () => {
    const ctx = await setup();

    // Someone else's hash.
    const wrong = await signInWithNonce(ctx.app, {
        requestNonce: NONCE_RAW,
        claimNonce: '0'.repeat(64),
        sub: 'nonce-mismatch',
    });
    expect(wrong.status).toBe(401);
    expect((await wrong.json()).error).toBe('apple_nonce_mismatch');

    // The client bug that would otherwise pass unnoticed: sending the RAW
    // nonce to Apple instead of its SHA-256.
    const unhashed = await signInWithNonce(ctx.app, {
        requestNonce: NONCE_RAW,
        claimNonce: NONCE_RAW,
        sub: 'nonce-mismatch',
    });
    expect(unhashed.status).toBe(401);
    expect((await unhashed.json()).error).toBe('apple_nonce_mismatch');
});

test('nonce quadrant: NO request nonce but a token claim → 401 apple_nonce_required', async () => {
    // THE replay case. A token captured from the native client carries a nonce
    // claim; redeeming it without the pre-image must fail rather than fall
    // back to the legacy path.
    const ctx = await setup();
    const res = await signInWithNonce(ctx.app, {
        claimNonce: NONCE_SHA256_HEX,
        sub: 'nonce-required',
    });

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('apple_nonce_required');
});

test('nonce quadrant: neither side carries a nonce — the web/legacy path is unchanged', async () => {
    const ctx = await setup();
    const res = await signInWithNonce(ctx.app, { sub: 'nonce-none' });

    expect(res.status).toBe(200);
    expect((await res.json()).token).toBeString();
});

test('a bad nonce never creates a player — the binding runs before findOrCreate', async () => {
    const ctx = await setup();
    const before = await ctx.db.selectFrom('players').select('id').execute();

    expect((await signInWithNonce(ctx.app, { requestNonce: NONCE_RAW, sub: 'ghost' })).status).toBe(
        401,
    );

    const after = await ctx.db.selectFrom('players').select('id').execute();
    expect(after.length).toBe(before.length);
});

// --- The link-first journey (N5) ----------------------------------------
//
// ONE test on purpose. The value of native password login is not in any single
// endpoint — each of these steps already passes in isolation — it is in the
// SEQUENCE arriving at one `players.id` instead of two. Split into four tests,
// the only thing that actually matters (no fork) would be asserted by none of
// them.

test('link-first journey: a web account survives the iOS install as ONE player row', async () => {
    const ctx = await setup();

    // 1. The human already exists, created months ago on the web with a
    //    password (this is the /players/register front door, cookie and all).
    const registered = await req(ctx.app, 'POST', '/api/players/register', {
        username: 'ingrid',
        password: 'correct horse battery',
        displayName: 'Ingrid I.',
    });
    expect(registered.status).toBe(200);
    const webPlayer = await registered.json();

    // 2. She installs the app and signs in with the password she already has.
    //    Native login, so a BEARER token — there is no cookie jar here.
    const login = await nativeLogin(ctx.app, 'ingrid', 'correct horse battery');
    expect(login.status).toBe(200);
    const { user: loggedIn, token } = await login.json();
    expect(loggedIn.id).toBe(webPlayer.id);
    expect(extractSessionCookie(login)).toBeUndefined();

    // 3. She then taps Sign in with Apple — WITH that bearer token. This is the
    //    whole point: an authenticated /auth/apple is a LINK, not a sign-up.
    const linked = await bearer(ctx.app, 'POST', '/api/auth/apple', token, {
        identityToken: await key.sign(appleClaims({ sub: 'ingrid-apple-sub' })),
        // Apple offers a name on first authorization; it must not rename her.
        fullName: 'Apple Suggested Name',
    });
    expect(linked.status).toBe(200);
    const linkedBody = await linked.json();

    // Same human, no second row, no rename.
    expect(linkedBody.user.id).toBe(webPlayer.id);
    expect(linkedBody.user.username).toBe('ingrid');
    expect(linkedBody.user.displayName).toBe('Ingrid I.');
    // Nothing was created — this is the flag that tells the client to skip
    // onboarding for a human who already has an account.
    expect(linkedBody.created).toBe(false);

    // The Apple credential is now hers, hash-less, alongside her password one.
    const credentials = await credentialsFor(ctx, webPlayer.id);
    expect(credentials.map((cr) => cr.provider).sort()).toEqual(['apple', 'password']);
    expect(credentials.find((cr) => cr.provider === 'apple')).toMatchObject({
        subject: 'ingrid-apple-sub',
        password_hash: null,
    });

    // 4. The payoff. Later — app reinstalled, token gone — she taps Sign in
    //    with Apple with NO session at all. Before the link this forked a
    //    second human; now it resolves to the credential row.
    const bare = await signIn(ctx.app, { sub: 'ingrid-apple-sub' });
    expect(bare.status).toBe(200);
    const bareBody = await bare.json();
    expect(bareBody.user.id).toBe(webPlayer.id);
    expect(bareBody.created).toBe(false);

    // Her fresh bearer token is her, through the same middleware.
    const me = await bearer(ctx.app, 'GET', '/api/auth/me', bareBody.token);
    expect(await me.json()).toEqual({ id: webPlayer.id, username: 'ingrid' });

    // And the password door still opens onto the same row: two credentials,
    // one human, forever (ADR-0005 — merging two player rows stays deferred
    // precisely because this path makes it unnecessary).
    const again = await nativeLogin(ctx.app, 'ingrid', 'correct horse battery');
    expect((await again.json()).user.id).toBe(webPlayer.id);

    // alice (seed) + ingrid. No fork anywhere in the journey.
    expect(await ctx.playerService.list()).toHaveLength(2);
    expect(await credentialsFor(ctx, webPlayer.id)).toHaveLength(2);
});

// --- GET /auth/credentials ----------------------------------------------
//
// The read side of linking. `/auth/apple` is an insert with no way to ask what
// is already attached, so the iOS app kept offering "Connect Sign in with
// Apple" to an account that already had it. These tests pin two things: the
// answer is right, and the answer is the ONLY thing in the body.

test('GET /api/auth/credentials — a password-only caller sees exactly ["password"]', async () => {
    const ctx = await setup();
    const { token } = await (await nativeLogin(ctx.app, 'alice', 'password123')).json();

    const res = await bearer(ctx.app, 'GET', '/api/auth/credentials', token);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ providers: ['password'] });
});

test('GET /api/auth/credentials — an apple-only caller sees exactly ["apple"]', async () => {
    const ctx = await setup();
    const { token } = await (await signIn(ctx.app, { sub: 'creds-apple-only' })).json();

    const res = await bearer(ctx.app, 'GET', '/api/auth/credentials', token);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ providers: ['apple'] });
});

test('GET /api/auth/credentials — a linked caller sees both, in canonical order', async () => {
    const ctx = await setup();

    // alice already has a password; link Apple onto her, the N5 way.
    const { token } = await (await nativeLogin(ctx.app, 'alice', 'password123')).json();
    const linked = await bearer(ctx.app, 'POST', '/api/auth/apple', token, {
        identityToken: await key.sign(appleClaims({ sub: 'creds-linked-sub' })),
    });
    expect(linked.status).toBe(200);

    const res = await bearer(ctx.app, 'GET', '/api/auth/credentials', token);
    expect(res.status).toBe(200);
    // Canonical order, not insertion order — the same set reached the other
    // way round must serialise identically (see `PROVIDER_ORDER`).
    expect(await res.json()).toEqual({ providers: ['password', 'apple'] });
});

test('GET /api/auth/credentials answers for the CALLER, and is 401 anonymously', async () => {
    const ctx = await setup();

    // No session at all: requireAuth() rejects before any query runs.
    const anon = await req(ctx.app, 'GET', '/api/auth/credentials');
    expect(anon.status).toBe(401);

    // A cookie session is the same identity through the same middleware.
    const cookie = await loginAs(ctx.app, 'alice', 'password123');
    const viaCookie = await req(ctx.app, 'GET', '/api/auth/credentials', undefined, cookie);
    expect(await viaCookie.json()).toEqual({ providers: ['password'] });

    // And a DIFFERENT player's session answers about that player, never the
    // first one — the id comes from the session, never from input.
    const { token } = await (await signIn(ctx.app, { sub: 'creds-other-human' })).json();
    const viaBearer = await bearer(ctx.app, 'GET', '/api/auth/credentials', token);
    expect(await viaBearer.json()).toEqual({ providers: ['apple'] });
});

test('GET /api/auth/credentials leaks NOTHING linkable — no subject, no hash, no ids', async () => {
    const ctx = await setup();

    // A caller with BOTH credentials: the most it could possibly say.
    const { token } = await (await nativeLogin(ctx.app, 'alice', 'password123')).json();
    await bearer(ctx.app, 'POST', '/api/auth/apple', token, {
        identityToken: await key.sign(appleClaims({ sub: 'creds-secret-sub' })),
    });

    const res = await bearer(ctx.app, 'GET', '/api/auth/credentials', token);
    // The WIRE BYTES, read once and asserted on directly. Both halves below
    // come from this one string: re-serialising a parsed object would assert on
    // whatever `JSON.stringify` chose to emit, not on what the route sent.
    const raw = await res.text();
    const body = JSON.parse(raw);

    // The EXACT shape. `toEqual` on the whole body is the assertion that
    // matters: an extra field cannot slip in later without failing here.
    expect(body).toEqual({ providers: ['password', 'apple'] });
    expect(Object.keys(body)).toEqual(['providers']);

    // Said again over the response bytes, because that is what an attacker
    // holding a stolen session actually reads. The Apple `sub` is app-scoped
    // and stable — it is the one value here that would follow this human off
    // tapscore — and neither it, the username-as-subject, nor any hash or row
    // id may appear anywhere in the response.
    expect(raw).toBe('{"providers":["password","apple"]}');
    // (No bare 'id' in this list — "provIDers" contains it. The exact-bytes
    // assertion above is what actually forbids an id field.)
    for (const secret of ['creds-secret-sub', 'alice', 'subject', 'hash', 'password_hash']) {
        expect(raw).not.toContain(secret);
    }

    // Sanity: those secrets really are in the database, so the absence above
    // is the route withholding them and not an empty account.
    const rows = await credentialsFor(ctx, (await (await bearer(ctx.app, 'GET', '/api/auth/me', token)).json()).id);
    expect(rows.map((cr) => cr.subject).sort()).toEqual(['alice', 'creds-secret-sub']);
});
