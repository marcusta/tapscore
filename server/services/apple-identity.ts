/**
 * Native track N2 — Sign in with Apple identity-token verification (ADR-0005).
 *
 * Dependency-free by house rule (`AGENTS.md` pinned deps): no `jose`, no
 * `jsonwebtoken`. Everything here runs on Bun's WebCrypto (`crypto.subtle`)
 * plus `atob`, which is all an RS256 JWT actually needs.
 *
 * Two pieces, deliberately split:
 *
 *   - `AppleJwksCache` owns the network + the cache (~1h TTL, one forced
 *     refetch on a `kid` miss so Apple's key rotation self-heals without a
 *     restart, rate-limited to one forced refetch per minute so an
 *     attacker-chosen `kid` cannot drive the fetcher). It is the injectable
 *     seam: tests hand in a fetcher that returns a locally generated JWK, so
 *     the suite never touches the network.
 *   - `verifyAppleIdentityToken` is a pure-ish function over (token, deps).
 *     The clock is injected the same way, so "expired" is testable without
 *     sleeping.
 *
 * It NEVER throws for a bad token: every rejection is a typed
 * `{ ok: false, code }` value. The API layer turns those into 401s. A thrown
 * error here would surface as a 500, which the N2 gate forbids.
 *
 * NONCE BINDING — closed in N4 (was the N2 deferral). The replay window
 * described here as an accepted cost is gone for nonce-bearing clients:
 * `verifyAppleIdentityToken` now surfaces the token's `nonce` claim and
 * `checkAppleNonceBinding` is the policy over it, applied by `/auth/apple`.
 *
 * The shape is CLIENT-generated, not server-issued — there is still no
 * `/auth/apple/challenge` endpoint and there does not need to be. Apple echoes
 * whatever string the app put in `ASAuthorizationAppleIDRequest.nonce` into the
 * token's `nonce` claim, verbatim. The convention every SIWA client follows
 * (and the one iOS implements here) is:
 *
 *   1. the app generates a random RAW nonce;
 *   2. it puts `sha256_hex(raw)` in the authorization request, so the token
 *      claim is the HASH — a captured token leaks nothing usable;
 *   3. it sends the RAW nonce to us alongside the token.
 *
 * So the server's check is `sha256_hex(request.nonce) === token.nonce`: proof
 * that whoever posted the token also knows the pre-image, i.e. is the client
 * that obtained it. A captured token alone no longer buys a session.
 *
 * Residual, accepted: a token minted with NO nonce at all is still replayable
 * for its (~10 minute) lifetime, with `aud` as its only confinement. That path
 * stays open on purpose — it is the web/legacy flow — but a token that DOES
 * carry a nonce can never be redeemed without the pre-image
 * (`apple_nonce_required`), so the binding defeats REPLAY FROM THE TOKEN
 * ALONE.
 *
 * Precisely that, and no more. On the hop from app to us the token travels
 * WITH its own pre-image, so anyone who can read that request has both halves;
 * and nonces are not single-use here, so a captured pair can be redeemed
 * again. What the binding buys is that a token lifted from anywhere the
 * pre-image is not — Apple's response to the app, a log, a crash report — is
 * inert on its own. TLS, not the nonce, is what protects the request itself.
 */

// --- Public types ---

export interface AppleIdentity {
    /** Apple's stable, app-scoped subject — the credential's `subject`. */
    sub: string;
    email?: string;
    emailVerified?: boolean;
    /**
     * The `nonce` claim exactly as Apple echoed it, or undefined when the
     * token carries none. Surfaced RAW and unjudged: the binding policy lives
     * in `checkAppleNonceBinding`, because whether a missing claim is fatal
     * depends on what the REQUEST carried, which this function never sees.
     */
    nonce?: string;
}

/**
 * Machine-readable rejection reasons. These strings are the wire contract:
 * `/auth/apple` returns them verbatim as the 401 body's `error`, so the native
 * client can distinguish "token expired, silently re-authenticate" from
 * "wrong build, this audience will never work".
 */
export type AppleVerifyFailureCode =
    | 'apple_token_malformed'
    | 'apple_token_unsupported_alg'
    | 'apple_token_unknown_key'
    | 'apple_token_bad_signature'
    | 'apple_token_bad_issuer'
    | 'apple_token_bad_audience'
    | 'apple_token_expired'
    | 'apple_jwks_unavailable';

export type AppleVerifyResult =
    | ({ ok: true } & AppleIdentity)
    | { ok: false; code: AppleVerifyFailureCode; message: string };

/**
 * One published Apple signing key. Spelled out rather than reusing the DOM's
 * `JsonWebKey`, which omits `kid` — the field the whole lookup turns on.
 */
export interface AppleJwk {
    kty: string;
    kid: string;
    alg?: string;
    use?: string;
    /** RSA modulus / exponent, base64url. */
    n?: string;
    e?: string;
}

/** A JWKS key set as Apple publishes it. */
export interface AppleJwks {
    keys: AppleJwk[];
}

export interface AppleKeySource {
    /**
     * Resolve a key by `kid`. Implementations MUST refetch when `force` is
     * true (used once, after a cache miss) and return `null` when the key is
     * genuinely unknown. Throwing is reserved for "could not reach the key
     * source at all".
     */
    getKey(kid: string, force?: boolean): Promise<AppleJwk | null>;
}

export interface VerifyDeps {
    /** Expected `aud` — the iOS bundle id / Services ID. */
    audience: string | string[];
    keys: AppleKeySource;
    /** Injected clock (ms since epoch). Defaults to `Date.now`. */
    now?: () => number;
}

export const APPLE_ISSUER = 'https://appleid.apple.com';
export const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

// --- base64url ---

function base64UrlToBytes(input: string): Uint8Array<ArrayBuffer> | null {
    if (!/^[A-Za-z0-9_-]*$/.test(input)) return null;
    const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4);
    try {
        const binary = atob(padded);
        const bytes = new Uint8Array(new ArrayBuffer(binary.length));
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    } catch {
        return null;
    }
}

function decodeJsonSegment(segment: string): Record<string, unknown> | null {
    const bytes = base64UrlToBytes(segment);
    if (!bytes) return null;
    try {
        const parsed = JSON.parse(new TextDecoder().decode(bytes));
        return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : null;
    } catch {
        return null;
    }
}

/**
 * The token's *claimed* subject, read WITHOUT verifying anything. Only ever a
 * rate-limit bucket key — never an identity. Callers must not let this value
 * reach the database.
 */
export function unverifiedSubject(token: string): string | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = decodeJsonSegment(parts[1]!);
    const sub = payload?.sub;
    return typeof sub === 'string' && sub.length > 0 ? sub : null;
}

// --- Algorithms ---

/**
 * Apple signs identity tokens with RSASSA-PKCS1-v1_5. The JWKS declares the
 * algorithm per key; we honour that declaration and additionally require the
 * token header to agree with it, so a key can never be used under a weaker
 * algorithm than it was published for. `none`, HMAC and EC are simply absent
 * from this table — the classic JWT confusion attacks have no entry point.
 */
const RSA_HASHES: Record<string, string> = {
    RS256: 'SHA-256',
    RS384: 'SHA-384',
    RS512: 'SHA-512',
};

// --- Verification ---

function fail(code: AppleVerifyFailureCode, message: string): AppleVerifyResult {
    return { ok: false, code, message };
}

export async function verifyAppleIdentityToken(
    token: string,
    deps: VerifyDeps,
): Promise<AppleVerifyResult> {
    const now = deps.now ?? (() => Date.now());

    if (typeof token !== 'string' || token.length === 0) {
        return fail('apple_token_malformed', 'empty token');
    }
    const parts = token.split('.');
    if (parts.length !== 3) return fail('apple_token_malformed', 'not a three-part JWT');
    const [headerSegment, payloadSegment, signatureSegment] = parts as [string, string, string];

    const header = decodeJsonSegment(headerSegment);
    if (!header) return fail('apple_token_malformed', 'undecodable header');

    const alg = header.alg;
    const kid = header.kid;
    if (typeof alg !== 'string' || !(alg in RSA_HASHES)) {
        return fail('apple_token_unsupported_alg', `unsupported alg ${String(alg)}`);
    }
    if (typeof kid !== 'string' || kid.length === 0) {
        return fail('apple_token_malformed', 'missing kid');
    }

    let jwk: AppleJwk | null;
    try {
        jwk = await deps.keys.getKey(kid);
        // Apple rotates keys; a miss means "maybe rotated", so refetch ONCE.
        if (!jwk) jwk = await deps.keys.getKey(kid, true);
    } catch (err) {
        return fail(
            'apple_jwks_unavailable',
            err instanceof Error ? err.message : 'could not reach the Apple key set',
        );
    }
    if (!jwk) return fail('apple_token_unknown_key', `no Apple key for kid ${kid}`);

    if (jwk.kty !== 'RSA') {
        return fail('apple_token_unsupported_alg', `key ${kid} is not RSA`);
    }
    // The JWKS is authoritative: when the published key names an algorithm,
    // the token header must match it exactly.
    if (typeof jwk.alg === 'string' && jwk.alg !== alg) {
        return fail(
            'apple_token_unsupported_alg',
            `key ${kid} is published for ${jwk.alg}, token claims ${alg}`,
        );
    }

    const signature = base64UrlToBytes(signatureSegment);
    if (!signature) return fail('apple_token_malformed', 'undecodable signature');

    const algorithm = { name: 'RSASSA-PKCS1-v1_5', hash: RSA_HASHES[alg]! } as const;
    let key: CryptoKey;
    try {
        key = await crypto.subtle.importKey(
            'jwk',
            // `key_ops`/`ext` from a published JWKS can conflict with the
            // usage we ask for; re-state the fields WebCrypto needs.
            { kty: 'RSA', n: jwk.n, e: jwk.e, alg, ext: true },
            algorithm,
            false,
            ['verify'],
        );
    } catch (err) {
        return fail(
            'apple_token_malformed',
            `unusable key ${kid}: ${err instanceof Error ? err.message : String(err)}`,
        );
    }

    const signed = new TextEncoder().encode(`${headerSegment}.${payloadSegment}`);
    const valid = await crypto.subtle.verify(algorithm, key, signature, signed);
    if (!valid) return fail('apple_token_bad_signature', 'signature does not verify');

    // Claims are only read AFTER the signature holds — never before.
    const payload = decodeJsonSegment(payloadSegment);
    if (!payload) return fail('apple_token_malformed', 'undecodable payload');

    if (payload.iss !== APPLE_ISSUER) {
        return fail('apple_token_bad_issuer', `unexpected iss ${String(payload.iss)}`);
    }

    const expected = Array.isArray(deps.audience) ? deps.audience : [deps.audience];
    const aud = payload.aud;
    const audiences = Array.isArray(aud) ? aud : [aud];
    if (!audiences.some((a) => typeof a === 'string' && expected.includes(a))) {
        return fail('apple_token_bad_audience', `unexpected aud ${JSON.stringify(aud)}`);
    }

    // No clock skew allowance: Apple's tokens live ~10 minutes and the client
    // is asking for a session right now. A server whose clock is minutes off
    // should be fixed, not papered over.
    const exp = payload.exp;
    if (typeof exp !== 'number' || !Number.isFinite(exp)) {
        return fail('apple_token_malformed', 'missing exp');
    }
    if (exp * 1000 <= now()) return fail('apple_token_expired', 'token expired');

    const sub = payload.sub;
    if (typeof sub !== 'string' || sub.length === 0) {
        return fail('apple_token_malformed', 'missing sub');
    }

    const email = typeof payload.email === 'string' ? payload.email : undefined;
    // Apple sends `email_verified` as a boolean OR the string "true".
    const rawVerified = payload.email_verified;
    const emailVerified =
        typeof rawVerified === 'boolean'
            ? rawVerified
            : rawVerified === 'true'
              ? true
              : rawVerified === 'false'
                ? false
                : undefined;

    const nonce = typeof payload.nonce === 'string' && payload.nonce.length > 0 ? payload.nonce : undefined;

    return {
        ok: true,
        sub,
        ...(email ? { email } : {}),
        ...(emailVerified !== undefined ? { emailVerified } : {}),
        ...(nonce !== undefined ? { nonce } : {}),
    };
}

// --- Nonce binding ---

/**
 * Lowercase hex SHA-256 of a UTF-8 string. The exact spelling matters: it is
 * the wire format both clients must agree on (iOS pins the same vector in
 * `TapScoreTests/AuthFlowTests.swift`), so hex — not base64 — and lowercase.
 */
export async function sha256Hex(input: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

export type AppleNonceFailureCode =
    | 'apple_nonce_missing'
    | 'apple_nonce_mismatch'
    | 'apple_nonce_required';

/**
 * The four-quadrant policy over (request nonce, token nonce claim):
 *
 *   | request | token  | result                                          |
 *   |---------|--------|-------------------------------------------------|
 *   | absent  | absent | allowed — the web/legacy flow, unchanged        |
 *   | absent  | present| `apple_nonce_required`                          |
 *   | present | absent | `apple_nonce_missing`                           |
 *   | present | present| `sha256_hex(request) === token` or `_mismatch`  |
 *
 * The (absent, present) row is the non-obvious one, and it is the row that
 * makes this worth anything: without it, a token captured from a native client
 * could simply be redeemed by REPLAYING IT WITHOUT the nonce field, and the
 * server would happily fall back to the legacy path. A nonce-bearing token is
 * therefore only ever redeemable by someone holding the pre-image.
 *
 * Comparison is constant-time-ish by construction (both sides are fixed-length
 * hex of a hash), but there is nothing secret to leak by timing here anyway:
 * the token's claim is public to whoever holds the token.
 */
export async function checkAppleNonceBinding(
    requestNonce: string | null | undefined,
    tokenNonce: string | undefined,
): Promise<AppleNonceFailureCode | null> {
    const raw = typeof requestNonce === 'string' && requestNonce.length > 0 ? requestNonce : null;
    const claim = typeof tokenNonce === 'string' && tokenNonce.length > 0 ? tokenNonce : null;

    if (raw === null) return claim === null ? null : 'apple_nonce_required';
    if (claim === null) return 'apple_nonce_missing';
    return (await sha256Hex(raw)) === claim.toLowerCase() ? null : 'apple_nonce_mismatch';
}

// --- JWKS cache ---

export interface AppleJwksCacheOptions {
    /** Injected for offline tests; defaults to a real fetch of Apple's JWKS. */
    fetchJwks?: () => Promise<AppleJwks>;
    /** Cache lifetime in ms. Default 1h. */
    ttlMs?: number;
    /**
     * Minimum interval between FORCED refetches (the `kid`-miss retry).
     * Default 60s — see `AppleJwksCache`. Injectable so tests need no sleeps.
     */
    forcedRefetchCooldownMs?: number;
    now?: () => number;
}

/** Default floor between two forced (`kid`-miss) refetches. */
export const DEFAULT_FORCED_REFETCH_COOLDOWN_MS = 60_000;

async function fetchAppleJwks(): Promise<AppleJwks> {
    const res = await fetch(APPLE_JWKS_URL);
    if (!res.ok) throw new Error(`Apple JWKS responded ${res.status}`);
    const body = (await res.json()) as AppleJwks;
    if (!body || !Array.isArray(body.keys)) throw new Error('Apple JWKS has no keys array');
    return body;
}

/**
 * In-process JWKS cache. Shape: one snapshot of the whole key set plus the
 * timestamp it was fetched at — NOT a per-kid map. Apple publishes a handful
 * of keys and always serves them together, so a set-level snapshot keeps
 * "these keys were consistent with each other at time T" true, and makes
 * expiry a single comparison.
 *
 * Concurrent misses share one in-flight fetch (`pending`) so a burst of
 * sign-ins after a key rotation produces one request, not N.
 *
 * FORCED refetches are floored to one per `forcedRefetchCooldownMs` (60s).
 * The `kid` in a token header is attacker-chosen and free to vary, so an
 * unconditional refetch-on-miss makes `/auth/apple` an outbound request
 * amplifier pointed at Apple. Within the cooldown a miss simply resolves
 * against the cached set — the caller sees `apple_token_unknown_key`, which is
 * the truthful answer for a bogus kid — and a genuine rotation still
 * self-heals within a minute of the first sign-in that needs the new key.
 */
export class AppleJwksCache implements AppleKeySource {
    private readonly fetchJwks: () => Promise<AppleJwks>;
    private readonly ttlMs: number;
    private readonly forcedRefetchCooldownMs: number;
    private readonly now: () => number;

    private keys: AppleJwk[] | null = null;
    private fetchedAt = 0;
    /** -Infinity, not 0: the first forced refetch is always allowed, whatever
     *  clock the caller injected. */
    private lastForcedRefetchAt = Number.NEGATIVE_INFINITY;
    private pending: Promise<AppleJwk[]> | null = null;

    constructor(options: AppleJwksCacheOptions = {}) {
        this.fetchJwks = options.fetchJwks ?? fetchAppleJwks;
        this.ttlMs = options.ttlMs ?? 60 * 60 * 1000;
        this.forcedRefetchCooldownMs =
            options.forcedRefetchCooldownMs ?? DEFAULT_FORCED_REFETCH_COOLDOWN_MS;
        this.now = options.now ?? (() => Date.now());
    }

    async getKey(kid: string, force = false): Promise<AppleJwk | null> {
        const fresh = this.keys !== null && this.now() - this.fetchedAt < this.ttlMs;
        if (!fresh) {
            // TTL expiry — self-paced, never attacker-paced.
            await this.refresh();
        } else if (force && this.now() - this.lastForcedRefetchAt >= this.forcedRefetchCooldownMs) {
            // Stamped BEFORE the fetch, and regardless of its outcome: a
            // failing key source must not become an unthrottled retry loop.
            this.lastForcedRefetchAt = this.now();
            await this.refresh();
        }
        return this.keys?.find((k) => k.kid === kid) ?? null;
    }

    private async refresh(): Promise<void> {
        if (!this.pending) {
            this.pending = this.fetchJwks()
                .then((jwks) => {
                    if (!jwks || !Array.isArray(jwks.keys)) {
                        throw new Error('Apple JWKS has no keys array');
                    }
                    this.keys = jwks.keys;
                    this.fetchedAt = this.now();
                    return jwks.keys;
                })
                .finally(() => {
                    this.pending = null;
                });
        }
        await this.pending;
    }
}

/**
 * The narrow seam the API layer depends on: "hand me a token, tell me who it
 * is". Keeps `auth-native.api.ts` free of JWKS/clock plumbing.
 */
export type AppleTokenVerifier = (token: string) => Promise<AppleVerifyResult>;

export function createAppleTokenVerifier(deps: VerifyDeps): AppleTokenVerifier {
    return (token) => verifyAppleIdentityToken(token, deps);
}

/** The placeholder audience a dev box runs with — it matches no real build. */
export const DEV_APPLE_AUDIENCE = 'se.tapscore.dev';

/**
 * Resolve the expected `aud` (the iOS bundle id Apple stamps into the token)
 * from the environment. Lives here rather than in the composition root so it
 * can be unit-tested; `@basics/core/server/config` is a fixed framework-owned
 * object and app keys do not belong in it.
 *
 * `aud` is the ONLY thing confining an Apple identity token to this app (see
 * the nonce note at the top of this file), so it must never silently fall back
 * in production: an unset `APPLE_AUDIENCE` there is a boot failure, loud and
 * immediate, not a server that accepts tokens minted for `se.tapscore.dev`.
 * Off production the dev placeholder stands in so `bun run dev:server` needs
 * no environment at all.
 */
export function resolveAppleAudience(
    env: { APPLE_AUDIENCE?: string | undefined; NODE_ENV?: string | undefined } = process.env,
): string {
    const configured = env.APPLE_AUDIENCE?.trim();
    if (configured) return configured;
    if (env.NODE_ENV === 'production') {
        throw new Error(
            'APPLE_AUDIENCE is not set. It is the iOS bundle id Apple stamps into the identity ' +
                "token's `aud`, and the only thing confining a Sign in with Apple token to this " +
                'app. Set it in the systemd unit (production refuses to start without it).',
        );
    }
    return DEV_APPLE_AUDIENCE;
}
