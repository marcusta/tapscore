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
 *
 * PASSWORD LOGIN, and why it lives here (N5): `/auth/native/login` is the
 * bearer sibling of the framework's cookie `/auth/login`, exactly as
 * `/auth/revoke` is the bearer sibling of its cookie `/auth/logout`. It exists
 * for ONE job — link-first identity joining. An existing web user installs the
 * app, signs in with the password they already have, and posts `/auth/apple`
 * WITH that bearer token, which takes the linking branch and attaches Apple to
 * the player row they already are. Without it the only native door is
 * `/auth/apple` with no session, which forks a SECOND `players` row for a human
 * who already exists — and ADR-0005 explicitly defers merging two separate
 * player rows. Prevention is the whole feature.
 *
 * WHY NOT THE PATH `/auth/login`: the framework's `createAuthApi` already owns
 * `POST /auth/login` and it is mounted first (`bootstrapAuth` in
 * `server/main.ts`). Hono runs same-path handlers in registration order and the
 * first one to return a Response wins, so a second `POST /auth/login` here
 * would be silently DEAD code — every request would keep hitting the cookie
 * login. A distinct path is not a naming preference, it is the only way this
 * endpoint is reachable at all. `/auth/native/*` also keeps the two logins
 * legible to a reader: same credentials, same `verify()`, same `SessionStore`,
 * different delivery.
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

const NativeLoginInput = Type.Object({
    username: Type.String({ minLength: 1 }),
    password: Type.String({ minLength: 1 }),
});

// Mirrors `createAuthApi`'s login limiter (60s window, 5 attempts) — the same
// shape and the same numbers, deliberately SEPARATE maps: the framework's is
// private module state and reaching into it would couple us to its internals.
const RATE_WINDOW = 60_000;
const RATE_MAX = 5;

/**
 * Hard ceiling on live buckets. Both keys here are attacker-chosen — the
 * token's CLAIMED `sub`, and a submitted username that need not exist — so
 * lazy per-window eviction alone bounds nothing: a flood of distinct keys
 * grows the Map without limit inside a single window. At the ceiling, expired
 * buckets go first and only then the oldest live one.
 */
const MAX_BUCKETS = 10_000;

export interface AuthNativeOptions {
    /** Bucket ceiling; injectable so a test can pin the eviction behaviour. */
    maxBuckets?: number;
}

/**
 * One fixed-window counter with a bounded bucket map.
 *
 * WHAT THIS GUARANTEES, precisely: at most `RATE_MAX` attempts per 60s for any
 * ONE key that holds a bucket, and bounded memory (`maxBuckets`). What it does
 * NOT guarantee: a global request ceiling. An attacker rotating the key gets a
 * fresh bucket every time — and past the ceiling can even evict a legitimate
 * bucket, costing that key its throttle for the rest of its window. That is
 * the accepted trade: bounded memory beats a perfect counter, because the real
 * brute-force target here (one subject / one username, many attempts) is still
 * capped.
 *
 * Each caller gets its OWN instance — `/auth/apple` counts Apple subjects and
 * `/auth/native/login` counts usernames, and one namespace must never let a
 * noisy Apple `sub` lock a human out of password login.
 */
function createFixedWindowLimiter(maxBuckets: number): (key: string) => void {
    const attempts = new Map<string, { count: number; resetAt: number }>();
    let lastEviction = Date.now();

    return function check(key: string): void {
        const now = Date.now();

        // Evict expired entries at most once per window to bound Map size.
        if (now - lastEviction >= RATE_WINDOW) {
            for (const [k, entry] of attempts) {
                if (now >= entry.resetAt) attempts.delete(k);
            }
            lastEviction = now;
        }

        const entry = attempts.get(key);
        if (!entry || now >= entry.resetAt) {
            // A NEW bucket is about to be allocated: enforce the ceiling.
            if (!entry && attempts.size >= maxBuckets) {
                for (const [k, e] of attempts) {
                    if (now >= e.resetAt) attempts.delete(k);
                }
                // Still full — every bucket is live. Drop the oldest, which a
                // Map's insertion order gives us for free (`set` on an
                // existing key does not reorder, so this is oldest-created).
                if (attempts.size >= maxBuckets) {
                    const oldest = attempts.keys().next();
                    if (!oldest.done) attempts.delete(oldest.value);
                }
            }
            attempts.set(key, { count: 1, resetAt: now + RATE_WINDOW });
            return;
        }
        if (entry.count >= RATE_MAX) throw new RateLimitError();
        entry.count++;
    };
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
    // Per-subject and per-username rate limiting, state scoped to this
    // instance (same as the framework's per-username map). Two independent
    // limiters, never one shared keyspace — see `createFixedWindowLimiter`.
    const maxBuckets = options.maxBuckets ?? MAX_BUCKETS;
    const checkAppleRate = createFixedWindowLimiter(maxBuckets);
    const checkLoginRate = createFixedWindowLimiter(maxBuckets);

    return {
        /**
         * Password login for native clients: identical credentials, identical
         * `verify()`, identical `SessionStore` as the framework's cookie
         * login — the token is returned in the BODY and NO cookie is set.
         *
         * Exists so an existing web user can LINK rather than fork; see the
         * file header for why and for why the path is not `/auth/login`.
         */
        nativeLogin: {
            method: 'POST' as const,
            path: '/auth/native/login',
            schema: NativeLoginInput,
            fn: async (input: Static<typeof NativeLoginInput>) => {
                // Keyed on the SUBMITTED username, before it is known to
                // exist — mirroring the framework. Counting only real users
                // would leave unknown-username guessing unthrottled, and
                // whether a bucket exists is not observable anyway.
                checkLoginRate(input.username);

                const user = await svc.verify(input.username, input.password);
                // No oracle: an unknown username and a wrong password are the
                // SAME `null` from `verify`, so they are the same 401 with the
                // framework's default 'Invalid credentials' message. Never
                // branch these apart, and never add a "no such user" code.
                if (!user) throw new AuthenticationError();

                const token = await issueSessionToken(sessions, user.id);
                return { user, token };
            },
        },
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
                const outcome = sessionPlayerId
                    ? // Authenticated caller: attach Apple to the player they
                      // ALREADY are. Never create a second human for them.
                      // A `sub` owned by someone else → 409 (ConflictError).
                      //
                      // `created: false` is not a guess here — linking is an
                      // insert of a CREDENTIAL onto an existing identity row,
                      // so by construction no player was minted. This is the
                      // link-first branch the native password login exists to
                      // reach (ADR-0005, "Linking in practice").
                      {
                          player: await svc.linkAppleCredential(sessionPlayerId, verified.sub),
                          created: false,
                      }
                    : await svc.findOrCreateByApple(verified.sub, {
                          name: input.fullName ?? null,
                          email: verified.email ?? null,
                      });

                // A bearer token is issued in BOTH branches: the linking call
                // comes from a native client that needs a bearer token even
                // when the link was authorised by a web cookie session. The
                // cookie, if any, is left untouched.
                const token = await issueSessionToken(sessions, outcome.player.id);
                // `created` tells the client whether to onboard or go straight
                // to the rounds list — a returning player and a just-minted
                // one are otherwise indistinguishable from the body.
                return { user: outcome.player, token, created: outcome.created };
            },
        },
        /**
         * Which sign-in methods the CALLER's own player row holds.
         *
         * WHY IT EXISTS: linking (`/auth/apple` with a session) is an insert
         * with no read side, so a native client had no way to know Apple was
         * already attached and kept offering "Connect Sign in with Apple" to
         * an account that already had it. This is the read side.
         *
         * THE CONSTRAINT, and it is the whole design of the response: provider
         * NAMES ONLY. Never `subject`, never `password_hash`, never a
         * credential id or a created_at. `subject` is the Apple `sub` for the
         * apple provider and the username for password — the Apple `sub` is
         * app-scoped and stable, i.e. exactly the value that links this human
         * to an identity outside tapscore. An attacker who has stolen a
         * session already has this player's whole account through every other
         * route; what they must NOT gain here is a value that follows the
         * human off this server. So the body is a closed vocabulary of two
         * literals (`CredentialProvider`) and carries no per-row data at all —
         * `{ providers: ['password', 'apple'] }` is the entire wire contract,
         * and the shape is pinned by test so a future field cannot be added
         * here by accident.
         *
         * CALLER-SCOPED, like `GET /api/me/roles`: the player id comes from
         * the session, never from input. There is deliberately no
         * `/auth/credentials/:playerId` — "which providers does that human
         * have" is not a question this app answers, for anyone. Cross-player
         * reads live behind `super_admin` in `admin.api.ts`, and this is not
         * one of them.
         */
        credentials: {
            method: 'GET' as const,
            path: '/auth/credentials',
            middleware: [requireAuth()],
            fn: async (c: Context) => ({
                providers: await svc.credentialProviders(requireUser(c).id),
            }),
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
