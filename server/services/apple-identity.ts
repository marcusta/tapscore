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
 * Out of scope on purpose: `nonce` binding. The native client will pass a
 * nonce to `ASAuthorizationAppleIDRequest` and Apple echoes it in the token;
 * checking it requires server-issued nonce state that does not exist yet
 * (there is no /auth/apple/challenge endpoint). Add it with the iOS client
 * (N4), not before — a half-checked nonce is worse than an unchecked one.
 * The accepted cost, stated plainly so N4 inherits the obligation: until that
 * nonce binding exists, a CAPTURED identity token is replayable by anyone for
 * its (~10 minute) lifetime, and `aud` is the only thing confining it to this
 * app — there is nothing tying a token to the client that obtained it.
 */

// --- Public types ---

export interface AppleIdentity {
    /** Apple's stable, app-scoped subject — the credential's `subject`. */
    sub: string;
    email?: string;
    emailVerified?: boolean;
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

    return { ok: true, sub, ...(email ? { email } : {}), ...(emailVerified !== undefined ? { emailVerified } : {}) };
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
