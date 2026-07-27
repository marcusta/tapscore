import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import {
    AuthenticationError,
    issueSessionToken,
    revokeSessionToken,
    requireAuth,
    requireUser,
    RateLimitError,
    type SessionStore,
} from '@basics/core/server/auth';
import type { PlayerService } from '../services/player.service';
import {
    checkAppleNonceBinding,
    unverifiedSubject,
    type AppleTokenVerifier,
} from '../services/apple-identity';

/**
 * Native track N2 — Sign in with Apple + bearer-session endpoints (ADR-0005).
 *
 * WHY ITS OWN FILE, not an extension of `players.api.ts`: everything here
 * lives under `/auth/*` and pairs with the framework's `createAuthApi`
 * (`/auth/login`, `/auth/logout`, `/auth/me`) — `/auth/revoke` is literally
 * the bearer sibling of the framework's cookie-only logout. `players.api.ts`
 * is the `/players/*` resource descriptor; `POST /players/register` sits there
 * because it creates a *player*. Folding two `/auth/*` routes into a factory
 * named `createPlayersApi` would hide auth surface behind a resource name, and
 * the one thing an auth route must never be is hard to find.
 *
 * NATIVE DELIVERY: `/auth/apple` returns the session token in the BODY and
 * sets no cookie. Same `SessionStore`, same opaque token, different transport
 * — never a second session system (ADR-0005). The framework's `createAuth`
 * middleware already accepts `Authorization: Bearer <token>` alongside the
 * cookie, so everything downstream is transport-blind.
 *
 * THE NAME ARRIVES ONCE: Apple's identity token carries no name. The native
 * SDK hands the app `ASAuthorizationAppleIDCredential.fullName` on the FIRST
 * authorization only, and never again — so the client forwards it as
 * `fullName` here, and `findOrCreateByApple` persists it exactly once. Every
 * later sign-in leaves `display_name` alone.
 *
 * NONCE BINDING (N4, closing the N2 deferral): `nonce` is the RAW value whose
 * SHA-256 the client sent to Apple. The four-quadrant policy lives in
 * `checkAppleNonceBinding` — including the row that does the actual work, a
 * nonce-bearing token posted WITHOUT its pre-image being rejected rather than
 * silently taking the legacy path.
 */

const AppleSignInInput = Type.Object({
    identityToken: Type.String({ minLength: 1 }),
    /**
     * Optional, first authorization only — see the note above. Advisory: it
     * names a NEW player and is ignored for a known Apple `sub`.
     */
    fullName: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    /**
     * The RAW nonce whose SHA-256 the client put in the Apple authorization
     * request (N4). Optional because the web/legacy flow sends no nonce at
     * all — but see `checkAppleNonceBinding`: a token that CARRIES a nonce
     * claim is rejected when this is absent, so omitting it is not a way to
     * downgrade a native token.
     */
    nonce: Type.Optional(Type.String({ minLength: 1 })),
});

// Mirrors `createAuthApi`'s login limiter (60s window, 5 attempts) — the same
// shape and the same numbers, deliberately a SEPARATE map: the framework's is
// private module state and reaching into it would couple us to its internals.
const APPLE_WINDOW = 60_000;
const APPLE_MAX = 5;

/**
 * Hard ceiling on live buckets. The key is the token's CLAIMED `sub` — fully
 * attacker-chosen — so lazy per-window eviction alone bounds nothing: a
 * flood of distinct subs grows the Map without limit inside a single window.
 * At the ceiling, expired buckets go first and only then the oldest live one.
 */
const APPLE_MAX_BUCKETS = 10_000;

export interface AuthNativeOptions {
    /** Bucket ceiling; injectable so a test can pin the eviction behaviour. */
    maxBuckets?: number;
}

function optionalUserId(c: Context): string | null {
    return c.get('user')?.id ?? null;
}

/**
 * Read the bearer token this request presented. Deliberately does NOT fall
 * back to the cookie: `/auth/revoke` revokes the PRESENTED token only, and a
 * cookie session ends through the framework's `/auth/logout`.
 */
function presentedBearerToken(c: Context): string | null {
    const header = c.req.header('Authorization');
    if (!header) return null;
    const match = /^Bearer[ \t]+(\S+)$/i.exec(header.trim());
    return match ? match[1]! : null;
}

export function createAuthNativeApi(
    svc: PlayerService,
    sessions: SessionStore,
    verifyAppleToken: AppleTokenVerifier,
    options: AuthNativeOptions = {},
) {
    // Per-subject rate limiting, state scoped to this instance (same as the
    // framework's per-username map).
    //
    // WHAT THIS GUARANTEES, precisely: at most APPLE_MAX verification attempts
    // per 60s for any ONE Apple subject that holds a bucket, and bounded
    // memory (APPLE_MAX_BUCKETS). What it does NOT guarantee: a global request
    // ceiling. An attacker rotating the claimed `sub` gets a fresh bucket
    // every time — and past the ceiling can even evict a legitimate bucket,
    // costing that subject its throttle for the rest of its window. That is
    // the accepted trade: bounded memory beats a perfect counter, because the
    // real brute-force target here (one subject, many tokens) is still capped,
    // and the tokens themselves are unforgeable without Apple's key.
    const maxBuckets = options.maxBuckets ?? APPLE_MAX_BUCKETS;
    const attempts = new Map<string, { count: number; resetAt: number }>();
    let lastEviction = Date.now();

    function checkAppleRate(subject: string): void {
        const now = Date.now();

        // Evict expired entries at most once per window to bound Map size.
        if (now - lastEviction >= APPLE_WINDOW) {
            for (const [key, entry] of attempts) {
                if (now >= entry.resetAt) attempts.delete(key);
            }
            lastEviction = now;
        }

        const entry = attempts.get(subject);
        if (!entry || now >= entry.resetAt) {
            // A NEW bucket is about to be allocated: enforce the ceiling.
            if (!entry && attempts.size >= maxBuckets) {
                for (const [key, e] of attempts) {
                    if (now >= e.resetAt) attempts.delete(key);
                }
                // Still full — every bucket is live. Drop the oldest, which a
                // Map's insertion order gives us for free (`set` on an
                // existing key does not reorder, so this is oldest-created).
                if (attempts.size >= maxBuckets) {
                    const oldest = attempts.keys().next();
                    if (!oldest.done) attempts.delete(oldest.value);
                }
            }
            attempts.set(subject, { count: 1, resetAt: now + APPLE_WINDOW });
            return;
        }
        if (entry.count >= APPLE_MAX) throw new RateLimitError();
        entry.count++;
    }

    return {
        appleSignIn: {
            method: 'POST' as const,
            path: '/auth/apple',
            schema: AppleSignInInput,
            // NO requireAuth: this is both the sign-up and the sign-in door.
            // A session may still ACCOMPANY the request, which turns it into
            // account linking — read opportunistically via `optionalUserId`,
            // exactly like the FriendlyRound routes do.
            //
            // CONSEQUENCE, by design, not an oversight: a request that carries
            // a session AND an Apple id belonging to a different player takes
            // the LINKING branch and 409s (`apple_subject_taken`). There is no
            // account switching here — a signed-in caller can only ever attach
            // an Apple id to themself. A native client that wants to sign in
            // as the other human must sign OUT first (drop its bearer token /
            // cookie) and re-post to this same route with no session.
            fn: async (input: Static<typeof AppleSignInInput>, c: Context) => {
                // Bucket key = the token's CLAIMED subject, decoded without
                // verifying anything. It is a rate-limit bucket, never an
                // identity — an attacker choosing their own bucket only
                // throttles themselves. Unparseable tokens share one bucket;
                // they are rejected anyway.
                checkAppleRate(unverifiedSubject(input.identityToken) ?? 'unparseable');

                const verified = await verifyAppleToken(input.identityToken);
                if (!verified.ok) {
                    // Typed code as the message: `mount()` renders an
                    // AuthenticationError as 401 `{ error: <message> }`, so
                    // the code IS the wire contract. A rejected token must
                    // never become a 500 (N2 gate).
                    throw new AuthenticationError(verified.code);
                }

                // Nonce binding (N4). Runs AFTER the signature holds — the
                // claim is only meaningful once the token is known to be
                // Apple's. Same wire contract as the verify codes: the code IS
                // the 401 body's `error`.
                const nonceFailure = await checkAppleNonceBinding(input.nonce, verified.nonce);
                if (nonceFailure) throw new AuthenticationError(nonceFailure);

                const sessionPlayerId = optionalUserId(c);
                const player = sessionPlayerId
                    ? // Authenticated caller: attach Apple to the player they
                      // ALREADY are. Never create a second human for them.
                      // A `sub` owned by someone else → 409 (ConflictError).
                      await svc.linkAppleCredential(sessionPlayerId, verified.sub)
                    : await svc.findOrCreateByApple(verified.sub, {
                          name: input.fullName ?? null,
                          email: verified.email ?? null,
                      });

                // A bearer token is issued in BOTH branches: the linking call
                // comes from a native client that needs a bearer token even
                // when the link was authorised by a web cookie session. The
                // cookie, if any, is left untouched.
                const token = await issueSessionToken(sessions, player.id);
                return { user: player, token };
            },
        },
        revoke: {
            method: 'POST' as const,
            path: '/auth/revoke',
            middleware: [requireAuth()],
            fn: async (c: Context) => {
                const token = presentedBearerToken(c);
                // Authenticated by cookie but no bearer presented: there is
                // nothing for THIS endpoint to revoke. Cookie sessions end at
                // the framework's `/auth/logout`, which deletes the cookie too.
                if (!token) throw new AuthenticationError('bearer_token_required');

                const user = requireUser(c);

                // OWNERSHIP, not merely "authenticated": the framework's
                // `createAuth` gives the COOKIE precedence when both are
                // present, so `requireUser` may well be the cookie's identity
                // while this header carries somebody else's bearer token.
                // Destroying it on that basis would be a confused deputy —
                // any cookie session could log out any device it could name a
                // token for. So the presented token must resolve to the SAME
                // player before it is touched.
                //
                // A token that is invalid/expired and a token that belongs to
                // someone else answer identically: no oracle that tells an
                // attacker which of the two a guessed token was.
                const tokenOwner = await sessions.validate(token);
                if (tokenOwner !== user.id) {
                    throw new AuthenticationError('bearer_token_required');
                }

                await revokeSessionToken(sessions, token);
                return { ok: true, userId: user.id };
            },
        },
    };
}
