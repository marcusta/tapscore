// The account surface's pure model — what the top-right control is, and which
// rows the popover shows. Kept out of the component so the composition per
// auth/role state is testable without a DOM (same split as `rows`/`partition`).

export type AccountMenuRowKind = 'identity' | 'profile' | 'admin' | 'signout' | 'signout-all';

export interface AccountMenuIdentity {
    kind: 'identity';
    displayName: string;
    username: string;
}

export interface AccountMenuAction {
    kind: 'profile' | 'admin' | 'signout' | 'signout-all';
    label: string;
}

export type AccountMenuRow = AccountMenuIdentity | AccountMenuAction;

export interface AccountMenuState {
    signedIn: boolean;
    /** From the loaded profile; null until it lands (or if it never does). */
    displayName?: string | null;
    /** The session username — available from `AuthService` before the profile. */
    username?: string | null;
    /**
     * True ONLY for an unscoped `super_admin` grant. A failed roles fetch must
     * pass `false` here: hiding the row is the fail-closed direction, and the
     * server gates `/api/admin/*` regardless.
     */
    isSuperAdmin: boolean;
}

/**
 * Rows for the open popover, in display order. Signed out there is no popover
 * at all — the control is a plain "Sign in" button — so the list is empty.
 */
export function accountMenuRows(state: AccountMenuState): AccountMenuRow[] {
    if (!state.signedIn) return [];
    const rows: AccountMenuRow[] = [
        {
            kind: 'identity',
            displayName: (state.displayName ?? '').trim() || (state.username ?? '').trim() || 'Signed in',
            username: (state.username ?? '').trim(),
        },
        { kind: 'profile', label: 'Profile' },
    ];
    if (state.isSuperAdmin) rows.push({ kind: 'admin', label: 'Admin' });
    rows.push({ kind: 'signout', label: 'Sign out' });
    // Last, and never adjacent to Profile/Admin: a mis-tap here signs the
    // account out of the phone in someone's bag as well as this browser.
    rows.push({ kind: 'signout-all', label: 'Sign out everywhere' });
    return rows;
}

/** Which rows are present, as kinds — the shape the component binds on. */
export function accountMenuKinds(state: AccountMenuState): AccountMenuRowKind[] {
    return accountMenuRows(state).map((r) => r.kind);
}

/** The single control in the top-right slot. */
export function accountControl(state: AccountMenuState): 'signin' | 'avatar' {
    return state.signedIn ? 'avatar' : 'signin';
}

/**
 * Avatar initials. The implementation moved to `src/avatar.ts` when photos
 * arrived — the account control and a friend row must letter a name the same
 * way, or the same person reads as two people across two screens. Re-exported
 * under the old name so this module's callers and tests stay put.
 */
export { avatarInitials as accountInitials } from '../avatar';
