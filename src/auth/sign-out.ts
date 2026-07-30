// The ONE sign-out sequence. Signing out is not just `auth.logout()`: every
// service that cached something identity-shaped has to forget it, or the next
// screen renders the previous user's data (or, on the landing, an empty list
// that never refills). There is exactly one caller — the account menu — and
// exactly one place to add a service to when a new one starts caching.
//
// Deps are passed in (not pulled from the DI container) so the order and the
// completeness of the sequence are testable without a DOM.

export interface Clearable {
    clear(): void;
}

export interface SignOutContext {
    auth: {
        logout(): Promise<void>;
        /** Revokes every session on the account — see `everywhere` below. */
        logoutEverywhere(): Promise<number | null>;
    };
    /** Loaded profile / handicap history. */
    profile: Clearable;
    /** Friend list + search state. */
    friends: Clearable;
    /** Role grants and the admin console's cached reads. */
    admins: Clearable;
    /**
     * The landing's own state. Required: signing out from '/' does NOT remount
     * the landing (the route signal doesn't change), so the logged-in lists
     * have to be reset and the device list re-read right here.
     */
    landing: Clearable;
    navigate: (path: string) => void;
}

/**
 * Log out, drop every cached slice of the signed-in identity, and return to the
 * landing. Await it — the clears must not run before the server has dropped the
 * session, or an in-flight load could repopulate them.
 *
 * `everywhere` swaps the first step for a revoke-all: sessions live a month, so
 * a lost or borrowed phone needs an off switch reachable from any device the
 * user still has. Everything after it is identical — the local teardown is the
 * same teardown whether one session ended or five did.
 */
export async function signOutSequence(
    ctx: SignOutContext,
    opts: { everywhere?: boolean } = {},
): Promise<void> {
    if (opts.everywhere) await ctx.auth.logoutEverywhere();
    else await ctx.auth.logout();
    ctx.profile.clear();
    ctx.friends.clear();
    ctx.admins.clear();
    ctx.landing.clear();
    ctx.navigate('/');
}
