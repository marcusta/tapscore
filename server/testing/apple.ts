/**
 * Test-only Apple identity-token forging (native track N2).
 *
 * The whole point of injecting the JWKS fetcher and the clock into
 * `apple-identity.ts` is that the suite can be its own Apple: generate an RSA
 * keypair locally, publish the public half as a JWKS, and sign tokens with the
 * private half. No network, no fixtures that expire, and "expired" / "wrong
 * audience" / "bad signature" are all one-line variations.
 *
 * Generating a 2048-bit key costs ~10ms, so callers make ONE `appleTestKey()`
 * per test file and forge many tokens from it.
 */

import { APPLE_ISSUER, type AppleJwk, type AppleJwks } from '../services/apple-identity';

function toBase64Url(bytes: Uint8Array): string {
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeSegment(value: unknown): string {
    return toBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

export interface AppleTestKey {
    kid: string;
    jwks: AppleJwks;
    /** Serves `jwks`; pass as `fetchJwks` to `AppleJwksCache`. */
    fetchJwks: () => Promise<AppleJwks>;
    /** Sign a token. Claims override the defaults; `header` overrides alg/kid. */
    sign(
        claims: Record<string, unknown>,
        header?: Record<string, unknown>,
    ): Promise<string>;
}

export interface AppleTestKeyOptions {
    kid?: string;
    /** JWA name; must be RS256/RS384/RS512 for a signable key. */
    alg?: 'RS256' | 'RS384' | 'RS512';
    /** Omit `alg` from the published JWK (Apple always sends it; a key that
     *  does not lets us prove we still verify). */
    publishAlg?: boolean;
}

const HASHES: Record<string, string> = { RS256: 'SHA-256', RS384: 'SHA-384', RS512: 'SHA-512' };

export async function appleTestKey(options: AppleTestKeyOptions = {}): Promise<AppleTestKey> {
    const kid = options.kid ?? 'test-key-1';
    const alg = options.alg ?? 'RS256';
    const hash = HASHES[alg]!;

    const pair = (await crypto.subtle.generateKey(
        {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash,
        },
        true,
        ['sign', 'verify'],
    )) as CryptoKeyPair;

    const exported = await crypto.subtle.exportKey('jwk', pair.publicKey);
    const jwk: AppleJwk = {
        kty: 'RSA',
        kid,
        use: 'sig',
        n: exported.n,
        e: exported.e,
        ...(options.publishAlg === false ? {} : { alg }),
    };
    const jwks: AppleJwks = { keys: [jwk] };

    return {
        kid,
        jwks,
        fetchJwks: async () => jwks,
        async sign(claims, headerOverrides) {
            const header = { alg, kid, typ: 'JWT', ...headerOverrides };
            const body = `${encodeSegment(header)}.${encodeSegment(claims)}`;
            const signature = await crypto.subtle.sign(
                { name: 'RSASSA-PKCS1-v1_5' },
                pair.privateKey,
                new TextEncoder().encode(body),
            );
            return `${body}.${toBase64Url(new Uint8Array(signature))}`;
        },
    };
}

export const TEST_AUDIENCE = 'se.tapscore.test';

/** Default, currently-valid claim set — spread over it to break one thing. */
export function appleClaims(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    const nowSeconds = Math.floor(Date.now() / 1000);
    return {
        iss: APPLE_ISSUER,
        aud: TEST_AUDIENCE,
        sub: '001234.abcdef.0001',
        iat: nowSeconds,
        exp: nowSeconds + 600,
        ...overrides,
    };
}
