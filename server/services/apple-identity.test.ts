// Native track N2 — Apple identity-token verification (ADR-0005).
//
// Runs entirely offline: a locally generated RSA keypair stands in for Apple's,
// its public half is served as the JWKS, and every rejection case is a forged
// token that differs from a valid one in exactly one way.

import { test, expect } from 'bun:test';
import {
    AppleJwksCache,
    createAppleTokenVerifier,
    DEV_APPLE_AUDIENCE,
    resolveAppleAudience,
    unverifiedSubject,
    verifyAppleIdentityToken,
    type AppleJwks,
} from './apple-identity';
import { appleClaims, appleTestKey, TEST_AUDIENCE } from '../testing/apple';

const key = await appleTestKey();

function verifierDeps(overrides: { now?: () => number } = {}) {
    return {
        audience: TEST_AUDIENCE,
        keys: new AppleJwksCache({ fetchJwks: key.fetchJwks }),
        ...overrides,
    };
}

// --- Happy path ---------------------------------------------------------

test('a well-formed, correctly signed token verifies', async () => {
    const token = await key.sign(appleClaims({ email: 'a@example.com', email_verified: 'true' }));
    const result = await verifyAppleIdentityToken(token, verifierDeps());

    expect(result).toEqual({
        ok: true,
        sub: '001234.abcdef.0001',
        email: 'a@example.com',
        emailVerified: true,
    });
});

test('email and email_verified are optional; a boolean email_verified also works', async () => {
    const bare = await verifyAppleIdentityToken(await key.sign(appleClaims()), verifierDeps());
    expect(bare).toEqual({ ok: true, sub: '001234.abcdef.0001' });

    const boolish = await verifyAppleIdentityToken(
        await key.sign(appleClaims({ email_verified: false })),
        verifierDeps(),
    );
    expect(boolish).toMatchObject({ ok: true, emailVerified: false });
});

test('an audience list accepts any of its entries', async () => {
    const token = await key.sign(appleClaims());
    const result = await verifyAppleIdentityToken(token, {
        ...verifierDeps(),
        audience: ['se.other.app', TEST_AUDIENCE],
    });
    expect(result).toMatchObject({ ok: true });
});

// --- Rejections (never a throw) -----------------------------------------

test('garbage input is malformed, not an exception', async () => {
    for (const junk of ['', 'not-a-jwt', 'a.b', 'a.b.c.d', '!!!.@@@.###']) {
        const result = await verifyAppleIdentityToken(junk, verifierDeps());
        expect(result).toMatchObject({ ok: false, code: 'apple_token_malformed' });
    }
});

test('a token signed by a DIFFERENT key fails on the signature, not the claims', async () => {
    // Same kid, other private key — the attacker's best shot.
    const impostor = await appleTestKey({ kid: key.kid });
    const token = await impostor.sign(appleClaims());

    const result = await verifyAppleIdentityToken(token, verifierDeps());
    expect(result).toMatchObject({ ok: false, code: 'apple_token_bad_signature' });
});

test('a tampered payload fails the signature', async () => {
    const token = await key.sign(appleClaims());
    const [h, , s] = token.split('.') as [string, string, string];
    const forged = btoa(JSON.stringify(appleClaims({ sub: 'someone.else' })))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const result = await verifyAppleIdentityToken(`${h}.${forged}.${s}`, verifierDeps());
    expect(result).toMatchObject({ ok: false, code: 'apple_token_bad_signature' });
});

test('alg=none and HMAC are refused outright', async () => {
    for (const alg of ['none', 'HS256', 'ES256']) {
        const token = await key.sign(appleClaims(), { alg });
        const result = await verifyAppleIdentityToken(token, verifierDeps());
        expect(result).toMatchObject({ ok: false, code: 'apple_token_unsupported_alg' });
    }
});

test('the published key alg wins over the header alg', async () => {
    // Key published for RS256, token claims RS512 — refused before any crypto.
    const token = await key.sign(appleClaims(), { alg: 'RS512' });
    const result = await verifyAppleIdentityToken(token, verifierDeps());
    expect(result).toMatchObject({ ok: false, code: 'apple_token_unsupported_alg' });
});

test('a key published WITHOUT alg still verifies under the header alg', async () => {
    const unlabelled = await appleTestKey({ publishAlg: false });
    const token = await unlabelled.sign(appleClaims());
    const result = await verifyAppleIdentityToken(token, {
        audience: TEST_AUDIENCE,
        keys: new AppleJwksCache({ fetchJwks: unlabelled.fetchJwks }),
    });
    expect(result).toMatchObject({ ok: true });
});

test('an unknown kid is reported as such', async () => {
    const other = await appleTestKey({ kid: 'rotated-away' });
    const token = await other.sign(appleClaims());
    const result = await verifyAppleIdentityToken(token, verifierDeps());
    expect(result).toMatchObject({ ok: false, code: 'apple_token_unknown_key' });
});

test('a wrong issuer is rejected even with a valid signature', async () => {
    const token = await key.sign(appleClaims({ iss: 'https://evil.example' }));
    const result = await verifyAppleIdentityToken(token, verifierDeps());
    expect(result).toMatchObject({ ok: false, code: 'apple_token_bad_issuer' });
});

test('a wrong audience is rejected', async () => {
    const token = await key.sign(appleClaims({ aud: 'se.someone.else' }));
    const result = await verifyAppleIdentityToken(token, verifierDeps());
    expect(result).toMatchObject({ ok: false, code: 'apple_token_bad_audience' });
});

test('expiry is measured against the INJECTED clock', async () => {
    const claims = appleClaims();
    const token = await key.sign(claims);
    const exp = (claims.exp as number) * 1000;

    expect(await verifyAppleIdentityToken(token, verifierDeps({ now: () => exp - 1 }))).toMatchObject(
        { ok: true },
    );
    expect(await verifyAppleIdentityToken(token, verifierDeps({ now: () => exp }))).toMatchObject({
        ok: false,
        code: 'apple_token_expired',
    });
});

test('a missing exp or sub is malformed', async () => {
    const noExp = appleClaims();
    delete noExp.exp;
    expect(await verifyAppleIdentityToken(await key.sign(noExp), verifierDeps())).toMatchObject({
        ok: false,
        code: 'apple_token_malformed',
    });

    const noSub = appleClaims();
    delete noSub.sub;
    expect(await verifyAppleIdentityToken(await key.sign(noSub), verifierDeps())).toMatchObject({
        ok: false,
        code: 'apple_token_malformed',
    });
});

test('an unreachable JWKS is a typed failure, not a thrown error', async () => {
    const token = await key.sign(appleClaims());
    const result = await verifyAppleIdentityToken(token, {
        audience: TEST_AUDIENCE,
        keys: new AppleJwksCache({
            fetchJwks: async () => {
                throw new Error('network down');
            },
        }),
    });
    expect(result).toMatchObject({ ok: false, code: 'apple_jwks_unavailable' });
});

// --- JWKS cache ---------------------------------------------------------

test('the key set is fetched once and reused within the TTL', async () => {
    let fetches = 0;
    const cache = new AppleJwksCache({
        fetchJwks: async () => {
            fetches++;
            return key.jwks;
        },
    });

    await cache.getKey(key.kid);
    await cache.getKey(key.kid);
    await cache.getKey(key.kid);
    expect(fetches).toBe(1);
});

test('the cache expires on its TTL, measured by the injected clock', async () => {
    let fetches = 0;
    let clock = 1_000_000;
    const cache = new AppleJwksCache({
        ttlMs: 60_000,
        now: () => clock,
        fetchJwks: async () => {
            fetches++;
            return key.jwks;
        },
    });

    await cache.getKey(key.kid);
    clock += 59_000;
    await cache.getKey(key.kid);
    expect(fetches).toBe(1);

    clock += 2_000;
    await cache.getKey(key.kid);
    expect(fetches).toBe(2);
});

test('a kid miss triggers exactly one refetch, and picks up a rotated key', async () => {
    let fetches = 0;
    let served: AppleJwks = { keys: [] };
    const cache = new AppleJwksCache({
        fetchJwks: async () => {
            fetches++;
            return served;
        },
    });

    // Cold: empty key set cached.
    expect(await cache.getKey(key.kid)).toBeNull();
    expect(fetches).toBe(1);

    // Apple rotates; the verifier's forced second lookup finds it.
    served = key.jwks;
    const token = await key.sign(appleClaims());
    const result = await verifyAppleIdentityToken(token, { audience: TEST_AUDIENCE, keys: cache });
    expect(result).toMatchObject({ ok: true });
    // The cached (empty) set is still within its TTL, so the first lookup
    // costs nothing; only the forced retry fetches. One extra request per
    // rotation, not a fetch storm.
    expect(fetches).toBe(2);
});

test('a burst of attacker-chosen kids costs exactly ONE forced refetch', async () => {
    let fetches = 0;
    let clock = 1_000_000;
    const cache = new AppleJwksCache({
        now: () => clock,
        forcedRefetchCooldownMs: 60_000,
        fetchJwks: async () => {
            fetches++;
            return key.jwks;
        },
    });

    // 50 tokens, 50 bogus kids, each doing what the verifier does: look up,
    // miss, force a retry. The kid is free for an attacker to vary, so an
    // unconditional refetch here would be an outbound amplifier aimed at
    // Apple. One cold fetch + one forced retry, and nothing more.
    for (let i = 0; i < 50; i++) {
        const kid = `bogus-${i}`;
        expect(await cache.getKey(kid)).toBeNull();
        expect(await cache.getKey(kid, true)).toBeNull();
    }
    expect(fetches).toBe(2);
});

test('a genuine rotation is picked up once the forced-refetch cooldown passes', async () => {
    let fetches = 0;
    let clock = 1_000_000;
    let served: AppleJwks = { keys: [] };
    const cache = new AppleJwksCache({
        now: () => clock,
        ttlMs: 60 * 60 * 1000,
        forcedRefetchCooldownMs: 60_000,
        fetchJwks: async () => {
            fetches++;
            return served;
        },
    });

    // Cold fetch (empty set) plus one forced retry, which spends the cooldown.
    expect(await cache.getKey(key.kid)).toBeNull();
    expect(await cache.getKey(key.kid, true)).toBeNull();
    expect(fetches).toBe(2);

    // Apple rotates DURING the cooldown: still no fetch, still a miss — the
    // caller sees apple_token_unknown_key, which is a truthful answer.
    served = key.jwks;
    clock += 59_000;
    expect(await cache.getKey(key.kid, true)).toBeNull();
    expect(fetches).toBe(2);

    // A minute after the last forced refetch, the rotation self-heals — no
    // restart, and the cached set is still far inside its 1h TTL.
    clock += 1_500;
    const found = await cache.getKey(key.kid, true);
    expect(found?.kid).toBe(key.kid);
    expect(fetches).toBe(3);

    // ...and a real token now verifies through the very same cache.
    const token = await key.sign(appleClaims());
    expect(
        await verifyAppleIdentityToken(token, { audience: TEST_AUDIENCE, keys: cache }),
    ).toMatchObject({ ok: true });
});

test('TTL expiry still refetches during the forced-refetch cooldown', async () => {
    // The cooldown throttles the attacker-driven path only; the self-paced
    // TTL one must not inherit it.
    let fetches = 0;
    let clock = 1_000_000;
    const cache = new AppleJwksCache({
        now: () => clock,
        ttlMs: 1_000,
        forcedRefetchCooldownMs: 60_000,
        fetchJwks: async () => {
            fetches++;
            return key.jwks;
        },
    });

    await cache.getKey(key.kid, true);
    expect(fetches).toBe(1);
    clock += 2_000;
    await cache.getKey(key.kid);
    expect(fetches).toBe(2);
});

test('concurrent misses share a single in-flight fetch', async () => {
    let fetches = 0;
    const cache = new AppleJwksCache({
        fetchJwks: async () => {
            fetches++;
            await Promise.resolve();
            return key.jwks;
        },
    });

    await Promise.all([cache.getKey(key.kid), cache.getKey(key.kid), cache.getKey(key.kid)]);
    expect(fetches).toBe(1);
});

// --- Helpers ------------------------------------------------------------

test('unverifiedSubject reads the claimed sub without validating anything', async () => {
    const impostor = await appleTestKey({ kid: 'nope' });
    const token = await impostor.sign(appleClaims({ sub: 'claimed.sub', exp: 1 }));

    // Expired, unknown key, still yields the bucket key — that is the point.
    expect(unverifiedSubject(token)).toBe('claimed.sub');
    expect(unverifiedSubject('garbage')).toBeNull();
});

test('createAppleTokenVerifier closes over the deps', async () => {
    const verify = createAppleTokenVerifier(verifierDeps());
    expect(await verify(await key.sign(appleClaims()))).toMatchObject({ ok: true });
    expect(await verify('garbage')).toMatchObject({ ok: false });
});

// --- Audience resolution (the composition root's one decision) -----------

test('resolveAppleAudience prefers APPLE_AUDIENCE, trimmed', () => {
    expect(resolveAppleAudience({ APPLE_AUDIENCE: 'se.tapscore.app' })).toBe('se.tapscore.app');
    expect(
        resolveAppleAudience({ APPLE_AUDIENCE: '  se.tapscore.app  ', NODE_ENV: 'production' }),
    ).toBe('se.tapscore.app');
});

test('resolveAppleAudience falls back to the dev placeholder OFF production', () => {
    expect(resolveAppleAudience({})).toBe(DEV_APPLE_AUDIENCE);
    expect(resolveAppleAudience({ NODE_ENV: 'development' })).toBe(DEV_APPLE_AUDIENCE);
    expect(resolveAppleAudience({ NODE_ENV: 'test', APPLE_AUDIENCE: '' })).toBe(DEV_APPLE_AUDIENCE);
});

test('resolveAppleAudience THROWS in production rather than failing open', () => {
    // `aud` is the only thing confining an Apple token to this app, so a
    // production boot with no audience configured must not quietly accept
    // tokens minted for the dev placeholder.
    for (const env of [{}, { APPLE_AUDIENCE: '' }, { APPLE_AUDIENCE: '   ' }]) {
        expect(() => resolveAppleAudience({ ...env, NODE_ENV: 'production' })).toThrow(
            /APPLE_AUDIENCE/,
        );
    }
});
