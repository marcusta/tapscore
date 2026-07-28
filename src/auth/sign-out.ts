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
    auth: { logout(): Promise<void> };
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
 */
export async function signOutSequence(ctx: SignOutContext): Promise<void> {
    await ctx.auth.logout();
    ctx.profile.clear();
    ctx.friends.clear();
    ctx.admins.clear();
    ctx.landing.clear();
    ctx.navigate('/');
}
